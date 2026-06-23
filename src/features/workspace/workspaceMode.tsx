import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

// Demo vs Live workspace. A single account can hold an isolated Demo sandbox
// (mock data for demos + testing) alongside its real Live data. The active mode
// is stored per-browser; every agent query filters by it and stamps new rows
// with it (via the `is_demo` column). Only admins can switch to Demo — regular
// agents always operate in Live.
export type WorkspaceMode = "live" | "demo";

const STORAGE_KEY = "ceu:workspace-mode";

interface WorkspaceModeContextValue {
  mode: WorkspaceMode;
  isDemo: boolean;
  setMode: (mode: WorkspaceMode) => void;
}

const WorkspaceModeContext = createContext<WorkspaceModeContextValue>({
  mode: "live",
  isDemo: false,
  setMode: () => {},
});

function readInitialMode(): WorkspaceMode {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "demo" ? "demo" : "live";
  } catch {
    return "live";
  }
}

export function WorkspaceModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<WorkspaceMode>(readInitialMode);

  const setMode = useCallback((next: WorkspaceMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore storage failures */
    }
  }, []);

  return (
    <WorkspaceModeContext.Provider value={{ mode, isDemo: mode === "demo", setMode }}>
      {children}
    </WorkspaceModeContext.Provider>
  );
}

export const useWorkspaceMode = () => useContext(WorkspaceModeContext);
