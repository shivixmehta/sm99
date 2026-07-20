import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

function startOfDay(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

// GET /api/attendance?date=YYYY-MM-DD&locationId=1
router.get("/", requireAuth, async (req, res) => {
  const date = req.query.date ? startOfDay(String(req.query.date)) : startOfDay(new Date().toISOString());
  const locationId = req.query.locationId ? Number(req.query.locationId) : undefined;

  const staff = await prisma.staff.findMany({
    where: { locationId, active: true },
    orderBy: { name: "asc" },
    include: {
      attendances: {
        where: { date },
      },
    },
  });

  const result = staff.map((s) => ({
    staffId: s.id,
    employeeCode: s.employeeCode,
    name: s.name,
    designation: s.designation,
    locationId: s.locationId,
    attendance: s.attendances[0] || null,
  }));

  res.json({ date: date.toISOString(), staff: result });
});

const markSchema = z.object({
  staffId: z.number().int(),
  date: z.string(),
  status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE", "HOLIDAY"]),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  remarks: z.string().optional(),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = markSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { staffId, date, status, checkIn, checkOut, remarks } = parsed.data;
  const day = startOfDay(date);

  const attendance = await prisma.attendance.upsert({
    where: { staffId_date: { staffId, date: day } },
    update: { status, checkIn, checkOut, remarks, markedAt: new Date() },
    create: { staffId, date: day, status, checkIn, checkOut, remarks },
  });

  res.json(attendance);
});

// bulk mark: [{staffId, status, ...}], shared date
const bulkSchema = z.object({
  date: z.string(),
  entries: z.array(
    z.object({
      staffId: z.number().int(),
      status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE", "HOLIDAY"]),
      checkIn: z.string().optional(),
      checkOut: z.string().optional(),
      remarks: z.string().optional(),
    })
  ),
});

router.post("/bulk", requireAuth, async (req, res) => {
  const parsed = bulkSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const day = startOfDay(parsed.data.date);
  const results = await Promise.all(
    parsed.data.entries.map((e) =>
      prisma.attendance.upsert({
        where: { staffId_date: { staffId: e.staffId, date: day } },
        update: { status: e.status, checkIn: e.checkIn, checkOut: e.checkOut, remarks: e.remarks, markedAt: new Date() },
        create: { staffId: e.staffId, date: day, status: e.status, checkIn: e.checkIn, checkOut: e.checkOut, remarks: e.remarks },
      })
    )
  );
  res.json(results);
});

// GET /api/attendance/report?staffId=1&from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/report", requireAuth, async (req, res) => {
  const staffId = req.query.staffId ? Number(req.query.staffId) : undefined;
  const locationId = req.query.locationId ? Number(req.query.locationId) : undefined;
  const from = req.query.from ? startOfDay(String(req.query.from)) : undefined;
  const to = req.query.to ? startOfDay(String(req.query.to)) : undefined;

  const attendances = await prisma.attendance.findMany({
    where: {
      staffId,
      date: from || to ? { gte: from, lte: to } : undefined,
      staff: locationId ? { locationId } : undefined,
    },
    include: { staff: true },
    orderBy: { date: "desc" },
  });

  res.json(attendances);
});

export default router;
