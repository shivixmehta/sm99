import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const locationId = req.query.locationId ? Number(req.query.locationId) : undefined;
  const staff = await prisma.staff.findMany({
    where: {
      locationId,
      active: req.query.includeInactive === "true" ? undefined : true,
    },
    include: { location: true },
    orderBy: { name: "asc" },
  });
  res.json(staff);
});

const staffSchema = z.object({
  employeeCode: z.string().min(1),
  name: z.string().min(1),
  designation: z.string().min(1),
  department: z.string().optional(),
  phone: z.string().optional(),
  locationId: z.number().int(),
});

router.post("/", requireAuth, requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const parsed = staffSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const staff = await prisma.staff.create({ data: parsed.data });
    res.status(201).json(staff);
  } catch (e) {
    res.status(409).json({ error: "Employee code must be unique" });
  }
});

router.put("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = staffSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const staff = await prisma.staff.update({ where: { id }, data: parsed.data });
  res.json(staff);
});

router.delete("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), async (req, res) => {
  const id = Number(req.params.id);
  await prisma.staff.update({ where: { id }, data: { active: false } });
  res.status(204).send();
});

export default router;
