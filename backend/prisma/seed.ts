import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const sirsa = await prisma.location.upsert({
    where: { code: "SRS" },
    update: {},
    create: { name: "Sirsa", code: "SRS", address: "Sirsa, Haryana" },
  });
  const hanumangarh = await prisma.location.upsert({
    where: { code: "HMG" },
    update: {},
    create: { name: "Hanumangarh", code: "HMG", address: "Hanumangarh, Rajasthan" },
  });

  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "actualshivi@gmail.com" },
    update: {},
    create: {
      name: "Admin",
      email: "actualshivi@gmail.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      locationId: null,
    },
  });

  const staffData = [
    { employeeCode: "SRS-001", name: "Anita Sharma", designation: "Staff Nurse", department: "OT", locationId: sirsa.id },
    { employeeCode: "SRS-002", name: "Ravi Kumar", designation: "Lab Technician", department: "IVF Lab", locationId: sirsa.id },
    { employeeCode: "SRS-003", name: "Pooja Devi", designation: "Receptionist", department: "Front Desk", locationId: sirsa.id },
    { employeeCode: "HMG-001", name: "Suresh Godara", designation: "Staff Nurse", department: "OT", locationId: hanumangarh.id },
    { employeeCode: "HMG-002", name: "Neha Bishnoi", designation: "Embryologist", department: "IVF Lab", locationId: hanumangarh.id },
    { employeeCode: "HMG-003", name: "Manoj Saini", designation: "Pharmacist", department: "Pharmacy", locationId: hanumangarh.id },
  ];
  for (const s of staffData) {
    await prisma.staff.upsert({
      where: { employeeCode: s.employeeCode },
      update: {},
      create: s,
    });
  }

  const items = [
    { name: "Surgical Gloves (pair)", category: "OT_DISPOSABLE" as const, unit: "pair", sku: "OTD-001", reorderLevel: 100, costPrice: 12 },
    { name: "Disposable Syringe 10ml", category: "OT_DISPOSABLE" as const, unit: "pcs", sku: "OTD-002", reorderLevel: 200, costPrice: 5 },
    { name: "Surgical Gown", category: "OT_DISPOSABLE" as const, unit: "pcs", sku: "OTD-003", reorderLevel: 50, costPrice: 45 },
    { name: "Suction Catheter", category: "OT_DISPOSABLE" as const, unit: "pcs", sku: "OTD-004", reorderLevel: 40, costPrice: 20 },
    { name: "Surgical Blade No.11", category: "OT_DISPOSABLE" as const, unit: "pcs", sku: "OTD-005", reorderLevel: 60, costPrice: 8 },

    { name: "Gonal-F 300IU", category: "IVF_INJECTION" as const, unit: "vial", sku: "IVF-001", reorderLevel: 20, costPrice: 2200 },
    { name: "Menopur 75IU", category: "IVF_INJECTION" as const, unit: "vial", sku: "IVF-002", reorderLevel: 20, costPrice: 950 },
    { name: "HCG 5000IU (Ovitrelle)", category: "IVF_INJECTION" as const, unit: "vial", sku: "IVF-003", reorderLevel: 15, costPrice: 1400 },
    { name: "Cetrotide 0.25mg", category: "IVF_INJECTION" as const, unit: "vial", sku: "IVF-004", reorderLevel: 15, costPrice: 1100 },
    { name: "Progesterone Injection", category: "IVF_INJECTION" as const, unit: "ampoule", sku: "IVF-005", reorderLevel: 30, costPrice: 60 },

    { name: "IV Cannula 18G", category: "GENERAL" as const, unit: "pcs", sku: "GEN-001", reorderLevel: 100, costPrice: 15 },
    { name: "Cotton Roll", category: "GENERAL" as const, unit: "roll", sku: "GEN-002", reorderLevel: 50, costPrice: 30 },
    { name: "N95 Mask", category: "GENERAL" as const, unit: "pcs", sku: "GEN-003", reorderLevel: 150, costPrice: 18 },
  ];

  for (const it of items) {
    const item = await prisma.inventoryItem.upsert({
      where: { sku: it.sku },
      update: {},
      create: it,
    });
    for (const loc of [sirsa, hanumangarh]) {
      await prisma.inventoryStock.upsert({
        where: { itemId_locationId: { itemId: item.id, locationId: loc.id } },
        update: {},
        create: { itemId: item.id, locationId: loc.id, quantity: it.reorderLevel * 3 },
      });
    }
  }

  console.log("Seed complete.");
  console.log("Admin login -> email: actualshivi@gmail.com | password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
