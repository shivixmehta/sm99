import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const locationId = req.query.locationId ? Number(req.query.locationId) : undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [staffTotal, attendanceToday, stocks, otCasesToday, activeIvfPackages, recentTransactions] =
    await Promise.all([
      prisma.staff.count({ where: { locationId, active: true } }),
      prisma.attendance.findMany({
        where: { date: today, staff: locationId ? { locationId } : undefined },
      }),
      prisma.inventoryStock.findMany({
        where: { locationId },
        include: { item: true },
      }),
      prisma.oTCase.count({
        where: { locationId, date: { gte: today } },
      }),
      prisma.iVFPackage.count({ where: { locationId, status: "ACTIVE" } }),
      prisma.stockTransaction.findMany({
        where: { locationId },
        include: { item: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  const present = attendanceToday.filter((a) => a.status === "PRESENT" || a.status === "HALF_DAY").length;
  const absent = attendanceToday.filter((a) => a.status === "ABSENT").length;
  const onLeave = attendanceToday.filter((a) => a.status === "LEAVE").length;
  const lowStockItems = stocks.filter((s) => s.item.active && s.quantity <= s.item.reorderLevel);

  res.json({
    staffTotal,
    attendanceToday: { present, absent, onLeave, unmarked: staffTotal - attendanceToday.length },
    lowStockCount: lowStockItems.length,
    lowStockItems: lowStockItems.slice(0, 10),
    otCasesToday,
    activeIvfPackages,
    recentTransactions,
  });
});

export default router;
