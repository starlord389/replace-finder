import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DEFAULT_SELLER_COST_ESTIMATE_RATE,
  WizardState,
  formatCurrency,
  getEstimatedExchangeEconomics,
  parseCurrency,
} from "@/lib/exchangeWizardTypes";
import { ASSET_TYPE_LABELS } from "@/lib/constants";

interface Props {
  data: WizardState;
  clientName: string;
  onBack: () => void;
  onSubmit: (activate: boolean) => void;
  saving: boolean;
}

function Field({ label, value, recommended }: { label: string; value?: string | null; recommended?: boolean }) {
  if (!value && !recommended) return null;
  return (
    <div className="flex items-start justify-between gap-2 py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      {value ? <span className="text-sm font-medium text-foreground text-right">{value}</span>
        : <Badge variant="outline" className="border-amber-300 text-amber-700 text-xs">Recommended</Badge>}
    </div>
  );
}

export default function StepReview({ data, clientName, onBack, onSubmit, saving }: Props) {
  const { property: p, financials: f, criteria: c } = data;
  const { estimatedEquity, exchangeProceeds } = getEstimatedExchangeEconomics(f);
  const sellerCostRatePercent = Math.round(DEFAULT_SELLER_COST_ESTIMATE_RATE * 100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Review & Activate</h2>
        <p className="text-sm text-muted-foreground">Review all details before saving. Activating puts the property into the network for matching.</p>
      </div>

      {/* Client */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Client</CardTitle></CardHeader>
        <CardContent><p className="font-medium text-foreground">{clientName}</p></CardContent>
      </Card>

      {/* Property */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Pledged Property</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {p.property_name && <p className="font-medium">{p.property_name}</p>}
          <p className="text-sm text-muted-foreground">{p.address}</p>
          <p className="text-sm text-muted-foreground">{[p.city, p.state, p.zip].filter(Boolean).join(", ")}</p>
          <div className="mt-3 grid grid-cols-2 gap-x-8">
            <Field label="Asset Type" value={p.asset_type ? ASSET_TYPE_LABELS[p.asset_type as keyof typeof ASSET_TYPE_LABELS] : undefined} />
            <Field label="Year Built" value={p.year_built} />
            <Field label="Units" value={p.units} />
            <Field label="Building SF" value={p.building_square_footage ? Number(p.building_square_footage).toLocaleString() : undefined} />
          </div>
          <Field label="Description" value={p.description} />
          {data.images.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-muted-foreground">{data.images.length} photo{data.images.length > 1 ? "s" : ""} attached</p>
              <div className="flex flex-wrap gap-2">
                {data.images.slice(0, 6).map((img) => (
                  <img
                    key={img.storage_path}
                    src={img.url}
                    alt={img.file_name}
                    className="h-16 w-20 rounded-md border object-cover"
                  />
                ))}
                {data.images.length > 6 && (
                  <div className="flex h-16 w-20 items-center justify-center rounded-md border bg-muted text-xs font-medium text-muted-foreground">
                    +{data.images.length - 6}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financials */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Financials</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-8">
          <Field label="Asking Price" value={formatCurrency(parseCurrency(f.asking_price))} />
          <Field label="NOI" value={formatCurrency(parseCurrency(f.noi))} />
          <Field label="Cap Rate" value={f.cap_rate ? `${f.cap_rate}%` : undefined} />
          <Field label="Occupancy" value={f.occupancy_rate ? `${f.occupancy_rate}%` : undefined} />
          <Field label="Loan Balance" value={formatCurrency(parseCurrency(f.loan_balance))} />
        </CardContent>
      </Card>

      {/* Exchange Economics */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Exchange Economics</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-x-8">
            <Field label="Estimated Exchange Proceeds" value={formatCurrency(exchangeProceeds)} />
            <Field label="Estimated Equity" value={formatCurrency(estimatedEquity)} />
          </div>
          <p className="text-xs text-muted-foreground">
            Exchange proceeds are estimated using a {sellerCostRatePercent}% seller cost allowance for closing costs and commissions.
          </p>
        </CardContent>
      </Card>

      {/* Criteria */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Replacement Criteria</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm text-muted-foreground">Asset Types: </span>
            {c.target_asset_types.map(t => <Badge key={t} variant="secondary" className="mr-1">{ASSET_TYPE_LABELS[t]}</Badge>)}
          </div>
          <div>
            <span className="text-sm text-muted-foreground">States: </span>
            {c.target_states.map(s => <Badge key={s} variant="outline" className="mr-1 text-xs">{s}</Badge>)}
          </div>
          <Field label="Price Range" value={`${formatCurrency(parseCurrency(c.target_price_min))} – ${formatCurrency(parseCurrency(c.target_price_max))}`} />
          {c.target_metros.length > 0 && <Field label="Target Metros" value={c.target_metros.join(", ")} />}
          {c.target_year_built_min && <Field label="Min Year Built" value={c.target_year_built_min} />}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-between">
        <Button variant="outline" onClick={onBack} disabled={saving}>Back</Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onSubmit(false)} disabled={saving}>{saving ? "Saving…" : "Save as Draft"}</Button>
          <Button size="lg" onClick={() => onSubmit(true)} disabled={saving} className="font-semibold">{saving ? "Activating…" : "Activate Exchange"}</Button>
        </div>
      </div>
    </div>
  );
}
