/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export type AdminCrmScope = "live" | "demo";

type ScopeContextValue = {
  scope: AdminCrmScope;
  setScope: (scope: AdminCrmScope) => void;
  isDemo: boolean;
};

const STORAGE_KEY = "exchangeup.admin-crm.scope";
const AdminCrmScopeContext = createContext<ScopeContextValue | null>(null);

function scopeFromSearch(search: string): AdminCrmScope | null {
  const value = new URLSearchParams(search).get("scope");
  return value === "demo" || value === "live" ? value : null;
}

function storedScope(): AdminCrmScope {
  if (typeof window === "undefined") return "live";
  return window.sessionStorage.getItem(STORAGE_KEY) === "demo" ? "demo" : "live";
}

export function AdminCrmScopeProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [scope, setScopeState] = useState<AdminCrmScope>(() => scopeFromSearch(location.search) ?? storedScope());

  useEffect(() => {
    window.sessionStorage.setItem(STORAGE_KEY, scope);
    const params = new URLSearchParams(location.search);
    const current = params.get("scope");
    if ((current === "live" || current === "demo") && current !== scope) {
      setScopeState(current);
      return;
    }
    if (scope === "demo" && current !== "demo") {
      params.set("scope", "demo");
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    } else if (scope === "live" && current) {
      params.delete("scope");
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    }
  }, [location.pathname, location.search, navigate, scope]);

  const changeScope = useCallback((next: AdminCrmScope) => {
    window.sessionStorage.setItem(STORAGE_KEY, next);
    setScopeState(next);
    const params = new URLSearchParams(location.search);
    if (next === "demo") params.set("scope", "demo");
    else params.delete("scope");
    params.delete("record");
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  }, [location.pathname, location.search, navigate]);

  const value = useMemo<ScopeContextValue>(() => ({
    scope,
    isDemo: scope === "demo",
    setScope: changeScope,
  }), [changeScope, scope]);

  return <AdminCrmScopeContext.Provider value={value}>{children}</AdminCrmScopeContext.Provider>;
}

export function useAdminCrmScope() {
  const value = useContext(AdminCrmScopeContext);
  if (!value) throw new Error("useAdminCrmScope must be used inside AdminCrmScopeProvider");
  return value;
}
