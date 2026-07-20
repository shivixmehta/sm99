import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import type { DashboardData } from "../lib/types";
import { Card, Section } from "../components/Card";

export default function Dashboard() {
  const { activeLocationId, locations } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const locationName = locations.find((l) => l.id === activeLocationId)?.name ?? "";

  useEffect(() => {
    if (!activeLocationId) return;
    setLoading(true);
    api
      .get<DashboardData>(`/dashboard?locationId=${activeLocationId}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [activeLocationId]);

  if (loading || !data) {
    return <p className="text-sm text-slate-500">Loading dashboard…</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">{locationName} Overview</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card title="Active Staff" value={data.staffTotal} />
        <Card title="Present Today" value={data.attendanceToday.present} accent="text-emerald-600" />
        <Card title="Absent Today" value={data.attendanceToday.absent} accent="text-red-600" />
        <Card title="On Leave" value={data.attendanceToday.onLeave} accent="text-amber-600" />
        <Card title="Low Stock Items" value={data.lowStockCount} accent="text-red-600" />
        <Card title="Active IVF Packages" value={data.activeIvfPackages} accent="text-teal-600" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Low Stock Alerts">
          {data.lowStockItems.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing below reorder level.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.lowStockItems.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{s.item.name}</span>
                  <span className="font-medium text-red-600">
                    {s.quantity} {s.item.unit} (reorder at {s.item.reorderLevel})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Recent Stock Activity">
          {data.recentTransactions.length === 0 ? (
            <p className="text-sm text-slate-500">No recent transactions.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentTransactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {t.item?.name} <span className="text-slate-400">· {t.reference || t.reason || t.type}</span>
                  </span>
                  <span className={t.type === "STOCK_IN" ? "text-emerald-600" : "text-slate-700"}>
                    {t.type === "STOCK_IN" ? "+" : "-"}
                    {Math.abs(t.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Today's OT Cases">
        <p className="text-sm text-slate-600">{data.otCasesToday} case(s) logged today at this location.</p>
      </Section>
    </div>
  );
}
