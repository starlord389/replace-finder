import { Building2, MapPin, ShieldCheck } from "lucide-react";
import { TrustProfileCard, type TrustProfileData } from "@/components/profile/TrustProfileCard";
import { Badge } from "@/components/ui/badge";

export interface SharedExchangeContext {
  id: string;
  label: string;
  status: string | null;
  assetType: string | null;
  city: string | null;
  state: string | null;
}

export function ClientRequestProfile({
  profile,
  requestedExchange,
  otherSharedExchanges,
}: {
  profile: TrustProfileData | null | undefined;
  requestedExchange: SharedExchangeContext | null;
  otherSharedExchanges: SharedExchangeContext[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,.85fr)]">
      <TrustProfileCard profile={profile} roleLabel="Property owner" showContact />
      <section className="rounded-xl border bg-card p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Exchange they want you to manage</p>
        {requestedExchange ? (
          <div className="mt-3">
            <p className="font-semibold text-foreground">{requestedExchange.label}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {requestedExchange.status ? <Badge variant="secondary">{requestedExchange.status.replace(/_/g, " ")}</Badge> : null}
              {requestedExchange.assetType ? <Badge variant="outline"><Building2 className="mr-1 h-3 w-3" />{requestedExchange.assetType}</Badge> : null}
              {requestedExchange.city || requestedExchange.state ? <Badge variant="outline"><MapPin className="mr-1 h-3 w-3" />{[requestedExchange.city, requestedExchange.state].filter(Boolean).join(", ")}</Badge> : null}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Exchange details are not available yet.</p>
        )}

        {otherSharedExchanges.length ? (
          <div className="mt-5 border-t pt-4">
            <p className="text-xs font-semibold text-foreground">Other exchanges already shared with you</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {otherSharedExchanges.map((exchange) => <Badge key={exchange.id} variant="outline">{exchange.label}</Badge>)}
            </div>
          </div>
        ) : null}

        <p className="mt-5 flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          Privacy protected: you only see this requested exchange and exchanges the owner has already assigned to you.
        </p>
      </section>
    </div>
  );
}
