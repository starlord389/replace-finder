import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Lock } from "lucide-react";
import {
  FinancialsData,
  PropertyData,
  UploadedPropertyImage,
  formatCurrency,
  getDerivedFinancials,
  parseCurrency,
} from "@/lib/exchangeWizardTypes";
import { ASSET_TYPE_LABELS } from "@/lib/constants";
import { propertyImage } from "@/features/matches/components/inbox/propertyImage";

interface Props {
  property: PropertyData;
  financials: FinancialsData;
  images: UploadedPropertyImage[];
}

export default function ReviewMatchPreview({ property, financials, images }: Props) {
  const cover = images[0]?.url ?? propertyImage(null, property.city + property.state);
  const cityState = [property.city, property.state].filter(Boolean).join(", ") || "Location TBD";
  const primaryLine = property.address_is_public && property.address
    ? property.address
    : cityState;
  const secondaryLine = property.address_is_public && property.address ? cityState : null;
  const name = property.address || cityState || "Untitled property";
  const assetLabel = property.asset_type
    ? ASSET_TYPE_LABELS[property.asset_type as keyof typeof ASSET_TYPE_LABELS]
    : null;
  const askingPrice = parseCurrency(financials.asking_price);
  const { noi, capRate } = getDerivedFinancials(financials);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
          Preview — how others will see this match
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 1) Match inbox card mini */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">In their match inbox</p>
          <div className="max-w-sm rounded-2xl border border-border bg-card p-3">
            <div className="flex min-w-0 gap-3">
              <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-black/[0.04]">
                <img src={cover} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-[13.5px] font-semibold leading-snug text-foreground">
                    {name}
                  </p>
                  <span
                    className="flex h-6 min-w-[24px] shrink-0 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-bold text-muted-foreground"
                    title="Score depends on the buyer"
                  >
                    —
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {cityState}
                  {assetLabel && <span> · {assetLabel}</span>}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5 text-[13px]">
                  <span className="font-semibold text-foreground">
                    {askingPrice != null ? formatCurrency(askingPrice) : "—"}
                  </span>
                  {capRate != null && (
                    <>
                      <span className="text-border">·</span>
                      <span className="text-muted-foreground">{capRate.toFixed(2)}% cap</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/60 pt-2">
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10.5px] font-semibold text-blue-700">
                New
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground">
                Review match →
              </span>
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Score depends on the buyer's criteria — it isn't a fixed number.
          </p>
        </div>

        {/* 2) Detail hero row mini */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">When they open the match</p>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative h-32 w-full bg-muted sm:h-40">
              <img src={cover} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-foreground">{primaryLine}</p>
                  {secondaryLine && (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {secondaryLine}
                    </p>
                  )}
                  {!secondaryLine && (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {cityState}
                    </p>
                  )}
                </div>
                {assetLabel && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {assetLabel}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 pt-1">
                <span className="text-lg font-bold text-foreground">
                  {askingPrice != null ? formatCurrency(askingPrice) : "—"}
                </span>
                {capRate != null && (
                  <span className="text-xs text-muted-foreground">
                    {capRate.toFixed(2)}% cap
                  </span>
                )}
                {noi != null && (
                  <span className="text-xs text-muted-foreground">
                    NOI {formatCurrency(noi)}
                  </span>
                )}
              </div>
              {property.description && (
                <p className="line-clamp-2 pt-1 text-xs text-muted-foreground">
                  {property.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Detailed financials (gross rent, expenses, loan balance) stay hidden until you accept a connection with a matched buyer.
            {!property.address_is_public && " The exact street address is also hidden — matched agents see only city and state."}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
