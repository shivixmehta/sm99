import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const locationId = req.query.locationId ? Number(req.query.locationId) : undefined;
  const cases = await prisma.oTCase.findMany({
    where: { locationId },
    include: { disposables: { include: { item: true } }, location: true },
    orderBy: { date: "desc" },
  });
  res.json(cases);
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const otCase = await prisma.oTCase.findUnique({
    where: { id },
    include: { disposables: { include: { item: true } }, location: true },
  });
  if (!otCase) return res.status(404).json({ error: "OT case not found" });
  res.json(otCase);
});

const caseSchema = z.object({
  caseNumber: z.string().min(1),
  patientName: z.string().min(1),
  surgeryName: z.string().min(1),
  surgeon: z.string().optional(),
  locationId: z.number().int(),
  date: z.string().optional(),
  notes: z.string().optional(),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = caseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { date, ...rest } = parsed.data;
  try {
    const otCase = await prisma.oTCase.create({
      data: { ...rest, date: date ? new Date(date) : undefined },
    });
    res.status(201).json(otCase);
  } catch {
    res.status(409).json({ error: "Case number must be unique" });
  }
});

const usageSchema = z.object({
  itemId: z.number().int(),
  quantity: z.number().int().positive(),
});

// Record disposable usage against an OT case; deducts stock at the case's location.
router.post("/:id/disposables", requireAuth, async (req, res) => {
  const caseId = Number(req.params.id);
  const parsed = usageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { itemId, quantity } = parsed.data;

  const otCase = await prisma.oTCase.findUnique({ where: { id: caseId } });
  if (!otCase) return res.status(404).json({ error: "OT case not found" });

  const stock = await prisma.inventoryStock.findUnique({
    where: { itemId_locationId: { itemId, locationId: otCase.locationId } },
  });
  if (!stock || stock.quantity < quantity) {
    return res.status(400).json({ error: "Insufficient disposable stock at this location" });
  }

  const [usage] = await prisma.$transaction([
    prisma.oTDisposableUsage.create({ data: { caseId, itemId, quantity } }),
    prisma.inventoryStock.update({
      where: { itemId_locationId: { itemId, locationId: otCase.locationId } },
      data: { quantity: { decrement: quantity } },
    }),
    prisma.stockTransaction.create({
      data: {
        itemId,
        locationId: otCase.locationId,
        type: "STOCK_OUT",
        quantity,
        reason: "OT disposable usage",
        reference: `OT Case ${otCase.caseNumber}`,
      },
    }),
  ]);

  res.status(201).json(usage);
});

export default router;
