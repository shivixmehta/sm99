import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const locationId = req.query.locationId ? Number(req.query.locationId) : undefined;
  const status = req.query.status as string | undefined;
  const packages = await prisma.iVFPackage.findMany({
    where: { locationId, status },
    include: { injections: { include: { item: true } }, location: true },
    orderBy: { startDate: "desc" },
  });
  res.json(packages);
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const pkg = await prisma.iVFPackage.findUnique({
    where: { id },
    include: { injections: { include: { item: true } }, location: true },
  });
  if (!pkg) return res.status(404).json({ error: "IVF package not found" });
  res.json(pkg);
});

const packageSchema = z.object({
  packageCode: z.string().min(1),
  patientName: z.string().min(1),
  partnerName: z.string().optional(),
  packageType: z.string().min(1),
  locationId: z.number().int(),
  startDate: z.string().optional(),
  notes: z.string().optional(),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = packageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { startDate, ...rest } = parsed.data;
  try {
    const pkg = await prisma.iVFPackage.create({
      data: { ...rest, startDate: startDate ? new Date(startDate) : undefined },
    });
    res.status(201).json(pkg);
  } catch {
    res.status(409).json({ error: "Package code must be unique" });
  }
});

router.put("/:id/status", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const status = z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).safeParse(req.body.status);
  if (!status.success) return res.status(400).json({ error: "Invalid status" });
  const pkg = await prisma.iVFPackage.update({ where: { id }, data: { status: status.data } });
  res.json(pkg);
});

const injectionSchema = z.object({
  itemId: z.number().int(),
  quantity: z.number().int().positive(),
  date: z.string().optional(),
  administeredBy: z.string().optional(),
  includedInPackage: z.boolean().default(true),
  notes: z.string().optional(),
});

// Log an IVF injection administered against a package; deducts stock at the package's
// location. includedInPackage defaults to true since these injections are bundled into
// the IVF package price rather than billed separately.
router.post("/:id/injections", requireAuth, async (req, res) => {
  const packageId = Number(req.params.id);
  const parsed = injectionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { itemId, quantity, date, administeredBy, includedInPackage, notes } = parsed.data;

  const pkg = await prisma.iVFPackage.findUnique({ where: { id: packageId } });
  if (!pkg) return res.status(404).json({ error: "IVF package not found" });

  const stock = await prisma.inventoryStock.findUnique({
    where: { itemId_locationId: { itemId, locationId: pkg.locationId } },
  });
  if (!stock || stock.quantity < quantity) {
    return res.status(400).json({ error: "Insufficient injection stock at this location" });
  }

  const [usage] = await prisma.$transaction([
    prisma.iVFInjectionUsage.create({
      data: {
        packageId,
        itemId,
        quantity,
        date: date ? new Date(date) : undefined,
        administeredBy,
        includedInPackage,
        notes,
      },
    }),
    prisma.inventoryStock.update({
      where: { itemId_locationId: { itemId, locationId: pkg.locationId } },
      data: { quantity: { decrement: quantity } },
    }),
    prisma.stockTransaction.create({
      data: {
        itemId,
        locationId: pkg.locationId,
        type: "STOCK_OUT",
        quantity,
        reason: "IVF injection administered",
        reference: `IVF Package ${pkg.packageCode}`,
      },
    }),
  ]);

  res.status(201).json(usage);
});

export default router;
