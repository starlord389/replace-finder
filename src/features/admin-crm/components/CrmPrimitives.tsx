import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function CrmPageHeader({ eyebrow, title, description, actions }: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-700">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.025em] text-slate-950 sm:text-[28px]">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function MetricTile({ label, value, detail, icon: Icon, tone = "slate" }: {
  label: string;
  value: number | string;
  detail?: string;
  icon: LucideIcon;
  tone?: "slate" | "green" | "amber" | "blue";
}) {
  const toneClass = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
  }[tone];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-slate-950">{value}</p></div>
        <div className={`rounded-lg p-2 ${toneClass}`}><Icon className="h-4 w-4" /></div>
      </div>
      {detail && <p className="mt-2 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const label = role === "investor" ? "Property owner" : role.charAt(0).toUpperCase() + role.slice(1);
  const style = role === "agent"
    ? "border-blue-200 bg-blue-50 text-blue-700"
    : role === "investor"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : role === "admin"
        ? "border-violet-200 bg-violet-50 text-violet-700"
        : "border-slate-200 bg-slate-50 text-slate-600";
  return <Badge variant="outline" className={`font-medium ${style}`}>{label}</Badge>;
}

export function AccountStatusBadge({ status }: { status: string }) {
  const style = status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "suspended" ? "border-red-200 bg-red-50 text-red-700"
      : "border-slate-300 bg-slate-100 text-slate-600";
  return <Badge variant="outline" className={`capitalize ${style}`}>{status}</Badge>;
}

export function CrmLoading({ rows = 5 }: { rows?: number }) {
  return <div className="space-y-3">{Array.from({ length: rows }).map((_, index) => <Skeleton key={index} className="h-16 w-full rounded-xl" />)}</div>;
}

export function CrmError({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center"><p className="font-semibold text-red-950">{title}</p><p className="mx-auto mt-2 max-w-xl text-sm text-red-800">{message}</p><Button variant="outline" className="mt-4 bg-white" onClick={onRetry}>Try again</Button></div>;
}
