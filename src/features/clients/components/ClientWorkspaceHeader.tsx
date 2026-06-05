import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Building2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getClientAccent } from "@/features/matches/lib/clientAccent";

interface Props {
  clientId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  counts: { listings: number; matches: number; deals: number };
}

export function ClientWorkspaceHeader({
  clientId,
  name,
  email,
  phone,
  company,
  status,
  counts,
}: Props) {
  const accent = getClientAccent(clientId);

  return (
    <div
      className={cn(
        "rounded-xl border border-l-[4px] bg-card p-5",
        accent.borderLeft,
      )}
    >
      <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2 h-7 px-2 text-xs">
        <Link to="/agent/clients">
          <ArrowLeft className="mr-1 h-3 w-3" /> All clients
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("h-2.5 w-2.5 rounded-full", accent.dot)} />
            <h1 className="truncate text-2xl font-bold text-foreground">{name}</h1>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                accent.soft,
                accent.fg,
              )}
            >
              {status}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3 w-3" /> {email}
              </span>
            )}
            {phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" /> {phone}
              </span>
            )}
            {company && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3 w-3" /> {company}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <Stat label="Listing" value={counts.listings} />
            <span className="text-border">·</span>
            <Stat label="Match" value={counts.matches} />
            <span className="text-border">·</span>
            <Stat label="Active deal" value={counts.deals} />
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to={`/agent/clients/${clientId}/edit`}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit client
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to={`/agent/exchanges/new?client=${clientId}`}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New exchange
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="text-muted-foreground">
      <span className="font-semibold text-foreground">{value}</span>{" "}
      {label}
      {value === 1 ? "" : "s"}
    </span>
  );
}
