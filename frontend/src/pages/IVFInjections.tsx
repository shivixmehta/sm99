import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import type { InventoryItem, IVFPackage } from "../lib/types";
import { Section } from "../components/Card";

export default function IVFInjections() {
  const { activeLocationId } = useAuth();
  const [packages, setPackages] = useState<IVFPackage[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNewPackage, setShowNewPackage] = useState(false);

  const [newPackage, setNewPackage] = useState({ packageCode: "", patientName: "", partnerName: "", packageType: "IVF Standard" });
  const [injection, setInjection] = useState({ itemId: "", quantity: "", administeredBy: "" });

  const loadPackages = useCallback(() => {
    if (!activeLocationId) return;
    api
      .get<IVFPackage[]>(`/ivf-packages?locationId=${activeLocationId}`)
      .then(setPackages)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load IVF packages"));
  }, [activeLocationId]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  useEffect(() => {
    if (!activeLocationId) return;
    api
      .get<InventoryItem[]>(`/inventory/items?category=IVF_INJECTION&locationId=${activeLocationId}`)
      .then(setItems)
      .catch(() => undefined);
  }, [activeLocationId]);

  const selectedPackage = packages.find((p) => p.id === selectedId) || null;

  async function createPackage(e: React.FormEvent) {
    e.preventDefault();
    if (!activeLocationId) return;
    setError(null);
    try {
      const created = await api.post<IVFPackage>("/ivf-packages", {
        ...newPackage,
        partnerName: newPackage.partnerName || undefined,
        locationId: activeLocationId,
      });
      setNewPackage({ packageCode: "", patientName: "", partnerName: "", packageType: "IVF Standard" });
      setShowNewPackage(false);
      loadPackages();
      setSelectedId(created.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to create IVF package");
    }
  }

  async function logInjection(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !injection.itemId) return;
    setError(null);
    try {
      await api.post(`/ivf-packages/${selectedId}/injections`, {
        itemId: Number(injection.itemId),
        quantity: Number(injection.quantity),
        administeredBy: injection.administeredBy || undefined,
        includedInPackage: true,
      });
      setInjection({ itemId: "", quantity: "", administeredBy: "" });
      loadPackages();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to log injection");
    }
  }

  async function setStatus(status: "ACTIVE" | "COMPLETED" | "CANCELLED") {
    if (!selectedId) return;
    try {
      await api.put(`/ivf-packages/${selectedId}/status`, { status });
      loadPackages();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to update status");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">IVF Injections</h1>
        <button
          onClick={() => setShowNewPackage((v) => !v)}
          className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
        >
          {showNewPackage ? "Cancel" : "New IVF Package"}
        </button>
      </div>

      <p className="text-sm text-slate-500">
        Injections logged here are deducted from stock and marked as included in the patient's IVF package — no separate billing.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {showNewPackage && (
        <Section title="New IVF Package">
          <form onSubmit={createPackage} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            <input
              required
              placeholder="Package code"
              value={newPackage.packageCode}
              onChange={(e) => setNewPackage({ ...newPackage, packageCode: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Patient name"
              value={newPackage.patientName}
              onChange={(e) => setNewPackage({ ...newPackage, patientName: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Partner name (optional)"
              value={newPackage.partnerName}
              onChange={(e) => setNewPackage({ ...newPackage, partnerName: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Package type"
              value={newPackage.packageType}
              onChange={(e) => setNewPackage({ ...newPackage, packageType: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              Save
            </button>
          </form>
        </Section>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section title="IVF Packages">
          {packages.length === 0 ? (
            <p className="text-sm text-slate-500">No IVF packages yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {packages.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full rounded-md px-2 py-2 text-left text-sm hover:bg-slate-50 ${
                      selectedId === p.id ? "bg-teal-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{p.packageCode}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          p.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700"
                            : p.status === "COMPLETED"
                            ? "bg-slate-200 text-slate-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">{p.patientName} · {p.packageType}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <div className="lg:col-span-2 space-y-4">
          {!selectedPackage ? (
            <Section title="Package Detail">
              <p className="text-sm text-slate-500">Select a package to log injections.</p>
            </Section>
          ) : (
            <>
              <Section
                title={`${selectedPackage.packageCode} — ${selectedPackage.patientName}`}
                action={
                  <div className="flex gap-1">
                    {(["ACTIVE", "COMPLETED", "CANCELLED"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`rounded-md border px-2 py-1 text-xs ${
                          selectedPackage.status === s
                            ? "border-teal-600 bg-teal-50 text-teal-700"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                }
              >
                <p className="text-sm text-slate-600">
                  {selectedPackage.packageType}
                  {selectedPackage.partnerName ? ` · Partner: ${selectedPackage.partnerName}` : ""}
                </p>
                <form onSubmit={logInjection} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-5">
                  <select
                    required
                    value={injection.itemId}
                    onChange={(e) => setInjection({ ...injection, itemId: e.target.value })}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
                  >
                    <option value="" disabled>
                      Select injection
                    </option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.stocks[0]?.quantity ?? 0} {i.unit} in stock)
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="Quantity"
                    value={injection.quantity}
                    onChange={(e) => setInjection({ ...injection, quantity: e.target.value })}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Administered by"
                    value={injection.administeredBy}
                    onChange={(e) => setInjection({ ...injection, administeredBy: e.target.value })}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
                  >
                    Log Injection
                  </button>
                </form>
              </Section>

              <Section title="Injections Administered (included in package)">
                {selectedPackage.injections.length === 0 ? (
                  <p className="text-sm text-slate-500">No injections logged for this package yet.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {selectedPackage.injections.map((inj) => (
                      <li key={inj.id} className="flex items-center justify-between py-2 text-sm">
                        <span>
                          {inj.item?.name}
                          {inj.administeredBy ? <span className="text-slate-400"> · {inj.administeredBy}</span> : null}
                        </span>
                        <span className="font-medium">{inj.quantity} {inj.item?.unit}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
