import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import type { AttendanceRow, AttendanceStatus } from "../lib/types";
import { Section } from "../components/Card";

const STATUS_OPTIONS: AttendanceStatus[] = ["PRESENT", "ABSENT", "HALF_DAY", "LEAVE", "HOLIDAY"];

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-100 text-emerald-700",
  ABSENT: "bg-red-100 text-red-700",
  HALF_DAY: "bg-amber-100 text-amber-700",
  LEAVE: "bg-blue-100 text-blue-700",
  HOLIDAY: "bg-slate-200 text-slate-700",
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function Staff() {
  const { activeLocationId } = useAuth();
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [date, setDate] = useState(today());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddStaff, setShowAddStaff] = useState(false);
  const [form, setForm] = useState({ employeeCode: "", name: "", designation: "", department: "" });

  const load = useCallback(() => {
    if (!activeLocationId) return;
    setLoading(true);
    api
      .get<{ date: string; staff: AttendanceRow[] }>(`/attendance?date=${date}&locationId=${activeLocationId}`)
      .then((res) => setRows(res.staff))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load attendance"))
      .finally(() => setLoading(false));
  }, [activeLocationId, date]);

  useEffect(() => {
    load();
  }, [load]);

  async function markStatus(staffId: number, status: AttendanceStatus) {
    setError(null);
    try {
      await api.post("/attendance", { staffId, date, status });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to mark attendance");
    }
  }

  async function addStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!activeLocationId) return;
    try {
      await api.post("/staff", { ...form, locationId: activeLocationId });
      setForm({ employeeCode: "", name: "", designation: "", department: "" });
      setShowAddStaff(false);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to add staff");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Staff & Attendance</h1>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
          <button
            onClick={() => setShowAddStaff((v) => !v)}
            className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
          >
            {showAddStaff ? "Cancel" : "Add Staff"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {showAddStaff && (
        <Section title="New Staff Member">
          <form onSubmit={addStaff} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <input
              required
              placeholder="Employee code"
              value={form.employeeCode}
              onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Designation"
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Department (optional)"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="col-span-full rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 sm:col-span-1"
            >
              Save
            </button>
          </form>
        </Section>
      )}

      <Section title={`Attendance — ${date}`}>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">No staff at this location yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-3">Employee</th>
                  <th className="py-2 pr-3">Designation</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Mark</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.staffId} className="border-b border-slate-100">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-slate-500">{row.employeeCode}</div>
                    </td>
                    <td className="py-2 pr-3">{row.designation}</td>
                    <td className="py-2 pr-3">
                      {row.attendance ? (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[row.attendance.status]}`}>
                          {row.attendance.status.replace("_", " ")}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Not marked</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex flex-wrap gap-1">
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => markStatus(row.staffId, s)}
                            className={`rounded-md border px-2 py-1 text-xs ${
                              row.attendance?.status === s
                                ? "border-teal-600 bg-teal-50 text-teal-700"
                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {s.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
