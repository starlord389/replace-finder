import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import AppErrorBoundary from "@/components/system/AppErrorBoundary";
import { WorkspaceModeProvider } from "@/features/workspace/workspaceMode";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <WorkspaceModeProvider>
      <App />
    </WorkspaceModeProvider>
  </AppErrorBoundary>
);
