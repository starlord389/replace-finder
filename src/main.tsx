import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import AppErrorBoundary from "@/components/system/AppErrorBoundary";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);

// Remove preloader after React mounts
requestAnimationFrame(() => {
  const el = document.getElementById("preloader");
  if (el) {
    el.classList.add("fade-out");
    el.addEventListener("transitionend", () => el.remove());
  }
});
