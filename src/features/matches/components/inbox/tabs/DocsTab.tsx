import { FileText, Download, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { cn } from "@/lib/utils";

interface Doc {
  title: string;
  desc: string;
  format: "PDF" | "DOCX" | "XLSX";
  gated: boolean;
  tint: string;
  iconTint: string;
}

const DOCS: Doc[] = [
  { title: "Offering Memorandum (PDF)", desc: "Complete investment summary with photos and financials", format: "PDF", gated: true, tint: "bg-rose-50", iconTint: "text-rose-600" },
  { title: "Offering Memorandum (Word)", desc: "Editable version for due diligence notes", format: "DOCX", gated: true, tint: "bg-sky-50", iconTint: "text-sky-600" },
  { title: "Trailing 12 Months (T-12)", desc: "Detailed operating statement by month", format: "XLSX", gated: true, tint: "bg-emerald-50", iconTint: "text-emerald-600" },
  { title: "Current Rent Roll", desc: "Unit-by-unit rent, lease term, and tenant status", format: "XLSX", gated: false, tint: "bg-emerald-50", iconTint: "text-emerald-600" },
];

export function DocsTab({ rel }: { rel: Relationship }) {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Property Documents</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Download offering materials and financial documents for {rel.propertyName}.
        </p>
      </div>

      <div className="space-y-3">
        {DOCS.map((d) => (
          <div
            key={d.title}
            className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/30"
          >
            <div className="flex min-w-0 items-center gap-4">
              <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", d.tint)}>
                <FileText className={cn("h-5 w-5", d.iconTint)} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{d.title}</p>
                  <span className="inline-flex items-center rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {d.format}
                  </span>
                  {d.gated && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                      <Lock className="h-2.5 w-2.5" /> Gated
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{d.desc}</p>
              </div>
            </div>
            <Button
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => toast({ title: d.gated ? "Request sent" : "Download started", description: d.gated ? "Listing agent will share access." : d.title })}
            >
              <Download className="h-3.5 w-3.5" />
              {d.gated ? "Request" : "Download"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
