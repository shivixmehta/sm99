import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import type { InventoryItem, OTCase } from "../lib/types";
import { Section } from "../components/Card";

export default function OTDisposables() {
  const { activeLocationId } = useAuth();
  const [cases, setCases] = useState<OTCase[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNewCase, setShowNewCase] = useState(false);

  const [newCase, setNewCase] = useState({ caseNumber: "", patientName: "", surgeryName: "", surgeon: "" });
  const [usage, setUsage] = useState({ itemId: "", quantity: "" });

  const loadCases = useCallback(() => {
    if (!activeLocationId) return;
    api
      .get<OTCase[]>(`/ot-cases?locationId=${activeLocationId}`)
      .then(setCases)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load OT cases"));
  }, [activeLocationId]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  useEffect(() => {
    if (!activeLocationId) return;
    api
      .get<InventoryItem[]>(`/inventory/items?category=OT_DISPOSABLE&locationId=${activeLocationId}`)
      .then(setItems)
      .catch(() => undefined);
  }, [activeLocationId]);

  const selectedCase = cases.find((c) => c.id === selectedCaseId) || null;

  async function createCase(e: React.FormEvent) {
    e.preventDefault();
    if (!activeLocationId) return;
    setError(null);
    try {
      const created = await api.post<OTCase>("/ot-cases", { ...newCase, locationId: activeLocationId });
      setNewCase({ caseNumber: "", patientName: "", surgeryName: "", surgeon: "" });
      setShowNewCase(false);
      loadCases();
      setSelectedCaseId(created.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to create OT case");
    }
  }

  async function logUsage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCaseId || !usage.itemId) return;
    setError(null);
    try {
      await api.post(`/ot-cases/${selectedCaseId}/disposables`, {
        itemId: Number(usage.itemId),
        quantity: Number(usage.quantity),
      });
      setUsage({ itemId: "", quantity: "" });
      loadCases();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to log disposable usage");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">OT Disposables</h1>
        <button
          onClick={() => setShowNewCase((v) => !v)}
          className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
        >
          {showNewCase ? "Cancel" : "New OT Case"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {showNewCase && (
        <Section title="New OT Case">
          <form onSubmit={createCase} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            <input
              required
              placeholder="Case number"
              value={newCase.caseNumber}
              onChange={(e) => setNewCase({ ...newCase, caseNumber: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Patient name"
              value={newCase.patientName}
              onChange={(e) => setNewCase({ ...newCase, patientName: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Surgery"
              value={newCase.surgeryName}
              onChange={(e) => setNewCase({ ...newCase, surgeryName: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Surgeon (optional)"
              value={newCase.surgeon}
              onChange={(e) => setNewCase({ ...newCase, surgeon: e.target.value })}
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
        <Section title="OT Cases">
          {cases.length === 0 ? (
            <p className="text-sm text-slate-500">No OT cases yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {cases.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`w-full rounded-md px-2 py-2 text-left text-sm hover:bg-slate-50 ${
                      selectedCaseId === c.id ? "bg-teal-50" : ""
                    }`}
                  >
                    <div className="font-medium">{c.caseNumber} — {c.patientName}</div>
                    <div className="text-xs text-slate-500">{c.surgeryName} · {new Date(c.date).toLocaleDateString()}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <div className="lg:col-span-2 space-y-4">
          {!selectedCase ? (
            <Section title="Case Detail">
              <p className="text-sm text-slate-500">Select a case to log disposable usage.</p>
            </Section>
          ) : (
            <>
              <Section title={`${selectedCase.caseNumber} — ${selectedCase.patientName}`}>
                <p className="text-sm text-slate-600">
                  {selectedCase.surgeryName}
                  {selectedCase.surgeon ? ` · Surgeon: ${selectedCase.surgeon}` : ""}
                </p>
                <form onSubmit={logUsage} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <select
                    required
                    value={usage.itemId}
                    onChange={(e) => setUsage({ ...usage, itemId: e.target.value })}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
                  >
                    <option value="" disabled>
                      Select disposable
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
                    placeholder="Quantity used"
                    value={usage.quantity}
                    onChange={(e) => setUsage({ ...usage, quantity: e.target.value })}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
                  >
                    Log Usage
                  </button>
                </form>
              </Section>

              <Section title="Disposables Used">
                {selectedCase.disposables.length === 0 ? (
                  <p className="text-sm text-slate-500">No disposables logged for this case yet.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {selectedCase.disposables.map((d) => (
                      <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                        <span>{d.item?.name}</span>
                        <span className="font-medium">{d.quantity} {d.item?.unit}</span>
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
