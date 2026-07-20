import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "./api";
import type { AuthedUser, Location } from "./types";

interface AuthContextValue {
  user: AuthedUser | null;
  loading: boolean;
  locations: Location[];
  activeLocationId: number | null;
  setActiveLocationId: (id: number) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ACTIVE_LOCATION_KEY = "hospital_inventory_active_location";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLocationId, setActiveLocationIdState] = useState<number | null>(() => {
    const stored = localStorage.getItem(ACTIVE_LOCATION_KEY);
    return stored ? Number(stored) : null;
  });

  const setActiveLocationId = useCallback((id: number) => {
    setActiveLocationIdState(id);
    localStorage.setItem(ACTIVE_LOCATION_KEY, String(id));
  }, []);

  const bootstrap = useCallback(async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    try {
      const [me, locs] = await Promise.all([
        api.get<AuthedUser>("/auth/me"),
        api.get<Location[]>("/locations"),
      ]);
      setUser(me);
      setLocations(locs);
      const preferred = me.locationId ?? locs[0]?.id ?? null;
      setActiveLocationIdState((current) => {
        if (current && locs.some((l) => l.id === current)) return current;
        if (preferred) localStorage.setItem(ACTIVE_LOCATION_KEY, String(preferred));
        return preferred;
      });
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: AuthedUser }>("/auth/login", { email, password });
    setToken(res.token);
    setUser(res.user);
    const locs = await api.get<Location[]>("/locations");
    setLocations(locs);
    const preferred = res.user.locationId ?? locs[0]?.id ?? null;
    if (preferred) setActiveLocationId(preferred);
  }, [setActiveLocationId]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, locations, activeLocationId, setActiveLocationId, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
