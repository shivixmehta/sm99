import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/staff", label: "Staff & Attendance" },
  { to: "/inventory", label: "Inventory" },
  { to: "/ot-disposables", label: "OT Disposables" },
  { to: "/ivf-injections", label: "IVF Injections" },
];

export default function Layout() {
  const { user, loading, locations, activeLocationId, setActiveLocationId, logout } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
          <div className="text-lg font-semibold text-teal-700">Hospital Inventory</div>
          <nav className="flex flex-1 flex-wrap gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    isActive ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <select
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            value={activeLocationId ?? ""}
            onChange={(e) => setActiveLocationId(Number(e.target.value))}
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>{user.name}</span>
            <button
              onClick={logout}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
