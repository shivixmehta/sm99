import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import type { InventoryItem, ItemCategory } from "../lib/types";
import { Section } from "../components/Card";

const CATEGORIES: { value: ItemCategory | ""; label: string }[] = [
  { value: "", label: "All Categories" },
  { value: "GENERAL", label: "General" },
  { value: "OT_DISPOSABLE", label: "OT Disposable" },
  { value: "IVF_INJECTION", label: "IVF Injection" },
  { value: "MEDICINE", label: "Medicine" },
  { value: "EQUIPMENT", label: "Equipment" },
];

export default function Inventory() {
  const { activeLocationId } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [category, setCategory] = useState<ItemCategory | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [showNewItem, setShowNewItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: "GENERAL" as ItemCategory, unit: "", sku: "", reorderLevel: "0" });

  const [movement, setMovement] = useState<{ itemId: number | null; type: "IN" | "OUT"; quantity: string; reason: string }>({
    itemId: null,
    type: "IN",
    quantity: "",
    reason: "",
  });

  const load = useCallback(() => {
    if (!activeLocationId) return;
    setLoading(true);
    const qs = new URLSearchParams({ locationId: String(activeLocationId) });
    if (category) qs.set("category", category);
    api
      .get<InventoryItem[]>(`/inventory/items?${qs.toString()}`)
      .then(setItems)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load inventory"))
      .finally(() => setLoading(false));
  }, [activeLocationId, category]);

  useEffect(() => {
    load();
  }, [load]);

  async function createItem(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post("/inventory/items", {
        name: newItem.name,
        category: newItem.category,
        unit: newItem.unit,
        sku: newItem.sku || undefined,
        reorderLevel: Number(newItem.reorderLevel) || 0,
      });
      setNewItem({ name: "", category: "GENERAL", unit: "", sku: "", reorderLevel: "0" });
      setShowNewItem(false);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to create item");
    }
  }

  async function submitMovement(e: React.FormEvent) {
    e.preventDefault();
    if (!movement.itemId || !activeLocationId) return;
    setError(null);
    setMessage(null);
    try {
      await api.post(`/inventory/stock-${movement.type === "IN" ? "in" : "out"}`, {
        itemId: movement.itemId,
        locationId: activeLocationId,
        quantity: Number(movement.quantity),
        reason: movement.reason || undefined,
      });
      setMessage("Stock updated.");
      setMovement({ itemId: null, type: "IN", quantity: "", reason: "" });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to update stock");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Inventory</h1>
        <div className="flex items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ItemCategory | "")}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowNewItem((v) => !v)}
            className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
          >
            {showNewItem ? "Cancel" : "New Item"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald-600">{message}</p>}

      {showNewItem && (
        <Section title="New Inventory Item">
          <form onSubmit={createItem} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            <input
              required
              placeholder="Name"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
            />
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value as ItemCategory })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {CATEGORIES.filter((c) => c.value).map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              required
              placeholder="Unit (pcs, vial…)"
              value={newItem.unit}
              onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Reorder level"
              type="number"
              min="0"
              value={newItem.reorderLevel}
              onChange={(e) => setNewItem({ ...newItem, reorderLevel: e.target.value })}
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

      <Section title="Record Stock Movement">
        <form onSubmit={submitMovement} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <select
            required
            value={movement.itemId ?? ""}
            onChange={(e) => setMovement({ ...movement, itemId: Number(e.target.value) })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          >
            <option value="" disabled>
              Select item
            </option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <select
            value={movement.type}
            onChange={(e) => setMovement({ ...movement, type: e.target.value as "IN" | "OUT" })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="IN">Stock In</option>
            <option value="OUT">Stock Out</option>
          </select>
          <input
            required
            type="number"
            min="1"
            placeholder="Quantity"
            value={movement.quantity}
            onChange={(e) => setMovement({ ...movement, quantity: e.target.value })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Reason / reference"
            value={movement.reason}
            onChange={(e) => setMovement({ ...movement, reason: e.target.value })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="col-span-full rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 sm:col-span-1"
          >
            Submit
          </button>
        </form>
      </Section>

      <Section title="Items">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">No items found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-3">Item</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">Unit</th>
                  <th className="py-2 pr-3">Stock at location</th>
                  <th className="py-2 pr-3">Reorder level</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const qty = item.stocks[0]?.quantity ?? 0;
                  const low = qty <= item.reorderLevel;
                  return (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="py-2 pr-3 font-medium">{item.name}</td>
                      <td className="py-2 pr-3">{item.category.replace("_", " ")}</td>
                      <td className="py-2 pr-3">{item.unit}</td>
                      <td className={`py-2 pr-3 font-medium ${low ? "text-red-600" : "text-slate-800"}`}>{qty}</td>
                      <td className="py-2 pr-3 text-slate-500">{item.reorderLevel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
