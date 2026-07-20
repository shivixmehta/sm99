export type Role = "ADMIN" | "MANAGER" | "STAFF";

export interface Location {
  id: number;
  name: string;
  code: string;
  address?: string | null;
}

export interface AuthedUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  locationId: number | null;
}

export interface Staff {
  id: number;
  employeeCode: string;
  name: string;
  designation: string;
  department?: string | null;
  phone?: string | null;
  locationId: number;
  active: boolean;
  location?: Location;
}

export type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE" | "HOLIDAY";

export interface AttendanceEntry {
  id: number;
  staffId: number;
  date: string;
  status: AttendanceStatus;
  checkIn?: string | null;
  checkOut?: string | null;
  remarks?: string | null;
}

export interface AttendanceRow {
  staffId: number;
  employeeCode: string;
  name: string;
  designation: string;
  locationId: number;
  attendance: AttendanceEntry | null;
}

export type ItemCategory = "GENERAL" | "OT_DISPOSABLE" | "IVF_INJECTION" | "MEDICINE" | "EQUIPMENT";

export interface InventoryStock {
  id: number;
  itemId: number;
  locationId: number;
  quantity: number;
}

export interface InventoryItem {
  id: number;
  name: string;
  category: ItemCategory;
  unit: string;
  sku?: string | null;
  reorderLevel: number;
  costPrice?: number | null;
  active: boolean;
  stocks: InventoryStock[];
}

export interface StockTransaction {
  id: number;
  itemId: number;
  locationId: number;
  type: string;
  quantity: number;
  reason?: string | null;
  reference?: string | null;
  performedBy?: string | null;
  createdAt: string;
  item?: InventoryItem;
}

export interface OTDisposableUsage {
  id: number;
  caseId: number;
  itemId: number;
  quantity: number;
  createdAt: string;
  item?: InventoryItem;
}

export interface OTCase {
  id: number;
  caseNumber: string;
  patientName: string;
  surgeryName: string;
  surgeon?: string | null;
  locationId: number;
  date: string;
  notes?: string | null;
  disposables: OTDisposableUsage[];
}

export interface IVFInjectionUsage {
  id: number;
  packageId: number;
  itemId: number;
  quantity: number;
  date: string;
  administeredBy?: string | null;
  includedInPackage: boolean;
  notes?: string | null;
  item?: InventoryItem;
}

export interface IVFPackage {
  id: number;
  packageCode: string;
  patientName: string;
  partnerName?: string | null;
  packageType: string;
  locationId: number;
  startDate: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  notes?: string | null;
  injections: IVFInjectionUsage[];
}

export interface DashboardData {
  staffTotal: number;
  attendanceToday: { present: number; absent: number; onLeave: number; unmarked: number };
  lowStockCount: number;
  lowStockItems: (InventoryStock & { item: InventoryItem })[];
  otCasesToday: number;
  activeIvfPackages: number;
  recentTransactions: StockTransaction[];
}
