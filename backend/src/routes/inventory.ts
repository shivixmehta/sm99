import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

// GET /api/inventory/items?category=OT_DISPOSABLE&locationId=1
router.get("/items", requireAuth, async (req, res) => {
  const category = req.query.category as string | undefined;
  const locationId = req.query.locationId ? Number(req.query.locationId) : undefined;

  const items = await prisma.inventoryItem.findMany({
    where: {
      active: true,
      category: category as any,
    },
    include: {
      stocks: locationId ? { where: { locationId } } : true,
    },
    orderBy: { name: "asc" },
  });

  res.json(items);
});

const itemSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["GENERAL", "OT_DISPOSABLE", "IVF_INJECTION", "MEDICINE", "EQUIPMENT"]),
  unit: z.string().min(1),
  sku: z.string().optional(),
  reorderLevel: z.number().int().default(0),
  costPrice: z.number().optional(),
});

router.post("/items", requireAuth, requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const item = await prisma.inventoryItem.create({ data: parsed.data });

  const locations = await prisma.location.findMany();
  await prisma.inventoryStock.createMany({
    data: locations.map((l) => ({ itemId: item.id, locationId: l.id, quantity: 0 })),
  });

  res.status(201).json(item);
});

router.put("/items/:id", requireAuth, requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = itemSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const item = await prisma.inventoryItem.update({ where: { id }, data: parsed.data });
  res.json(item);
});

router.delete("/items/:id", requireAuth, requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const id = Number(req.params.id);
  await prisma.inventoryItem.update({ where: { id }, data: { active: false } });
  res.status(204).send();
});

// GET /api/inventory/low-stock?locationId=1
router.get("/low-stock", requireAuth, async (req, res) => {
  const locationId = req.query.locationId ? Number(req.query.locationId) : undefined;
  const stocks = await prisma.inventoryStock.findMany({
    where: { locationId },
    include: { item: true, location: true },
  });
  const low = stocks.filter((s) => s.item.active && s.quantity <= s.item.reorderLevel);
  res.json(low);
});

const txSchema = z.object({
  itemId: z.number().int(),
  locationId: z.number().int(),
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
  reference: z.string().optional(),
  performedBy: z.string().optional(),
});

router.post("/stock-in", requireAuth, async (req, res) => {
  const parsed = txSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { itemId, locationId, quantity, reason, reference, performedBy } = parsed.data;

  const [, txn] = await prisma.$transaction([
    prisma.inventoryStock.upsert({
      where: { itemId_locationId: { itemId, locationId } },
      update: { quantity: { increment: quantity } },
      create: { itemId, locationId, quantity },
    }),
    prisma.stockTransaction.create({
      data: { itemId, locationId, type: "STOCK_IN", quantity, reason, reference, performedBy },
    }),
  ]);

  res.status(201).json(txn);
});

router.post("/stock-out", requireAuth, async (req, res) => {
  const parsed = txSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { itemId, locationId, quantity, reason, reference, performedBy } = parsed.data;

  const existing = await prisma.inventoryStock.findUnique({
    where: { itemId_locationId: { itemId, locationId } },
  });
  if (!existing || existing.quantity < quantity) {
    return res.status(400).json({ error: "Insufficient stock at this location" });
  }

  const [, txn] = await prisma.$transaction([
    prisma.inventoryStock.update({
      where: { itemId_locationId: { itemId, locationId } },
      data: { quantity: { decrement: quantity } },
    }),
    prisma.stockTransaction.create({
      data: { itemId, locationId, type: "STOCK_OUT", quantity, reason, reference, performedBy },
    }),
  ]);

  res.status(201).json(txn);
});

const adjustSchema = z.object({
  itemId: z.number().int(),
  locationId: z.number().int(),
  newQuantity: z.number().int().min(0),
  reason: z.string().optional(),
  performedBy: z.string().optional(),
});

router.post("/adjust", requireAuth, requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const parsed = adjustSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { itemId, locationId, newQuantity, reason, performedBy } = parsed.data;

  const existing = await prisma.inventoryStock.findUnique({
    where: { itemId_locationId: { itemId, locationId } },
  });
  const delta = newQuantity - (existing?.quantity ?? 0);

  const [, txn] = await prisma.$transaction([
    prisma.inventoryStock.upsert({
      where: { itemId_locationId: { itemId, locationId } },
      update: { quantity: newQuantity },
      create: { itemId, locationId, quantity: newQuantity },
    }),
    prisma.stockTransaction.create({
      data: { itemId, locationId, type: "ADJUSTMENT", quantity: delta, reason, performedBy },
    }),
  ]);

  res.status(201).json(txn);
});

router.get("/transactions", requireAuth, async (req, res) => {
  const locationId = req.query.locationId ? Number(req.query.locationId) : undefined;
  const itemId = req.query.itemId ? Number(req.query.itemId) : undefined;
  const transactions = await prisma.stockTransaction.findMany({
    where: { locationId, itemId },
    include: { item: true, location: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(transactions);
});

export default router;
