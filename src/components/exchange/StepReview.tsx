import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_SELLER_COST_ESTIMATE_RATE,
  WizardState,
  formatCurrency,
  getDerivedFinancials,
  getEstimatedExchangeEconomics,
  hasExchangeCriteria,
  parseCurrency,
} from "@/lib/exchangeWizardTypes";
import { ASSET_TYPE_LABELS } from "@/lib/constants";
import ReviewMatchPreview from "./ReviewMatchPreview";

type ReviewMode = "create" | "edit-draft" | "edit-active";

interface Props {
  data: WizardState;
  clientName: string;
  onBack: () => void;
  onSubmit: (activate: boolean) => void;
  saving: boolean;
  mode?: ReviewMode;
  onCancel?: () => void;
  onOwnerAuthorizationChange?: (value: boolean) => void;
  ownerType?: "agent" | "investor";
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

export default function StepReview({ data, clientName, onBack, onSubmit, saving, mode = "create", onCancel, onOwnerAuthorizationChange, ownerType = "agent" }: Props) {
  const { property: p, financials: f, criteria: c } = data;
  const { estimatedEquity, exchangeProceeds } = getEstimatedExchangeEconomics(f);
  const derived = getDerivedFinancials(f);
  const sellerCostRatePercent = Math.round(DEFAULT_SELLER_COST_ESTIMATE_RATE * 100);
  const ownerAuthConfirmed = p.owner_authorization_confirmed;
  const hasCriteria = hasExchangeCriteria(c);

  // Recurring financials are stored/entered monthly — show them with a "/ mo" suffix.
  const perMonth = (v: string) => {
    const n = parseCurrency(v);
    return n != null ? `${formatCurrency(n)} / mo` : undefined;
  };

  // Button labels per mode
  const labels = mode === "edit-draft"
    ? { primary: saving ? "Publishing…" : "Save & Publish", secondary: saving ? "Saving…" : "Save Changes (Draft)", primaryActivate: true }
    : mode === "edit-active"
    ? { primary: saving ? "Saving…" : "Save Changes", secondary: saving ? "Saving…" : "Save & Move to Draft", primaryActivate: true }
    : { primary: saving ? "Activating…" : "Activate Exchange", secondary: saving ? "Saving…" : "Save as Draft", primaryActivate: true };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{mode === "create" ? "Review & Activate" : "Review & Save"}</h2>
        <p className="text-sm text-muted-foreground">Review all details before saving.{mode === "create" && " Activating puts the property into the network for matching."}</p>
      </div>


      {/* Client */}
      {ownerType === "agent" && <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Client</CardTitle></CardHeader>
        <CardContent><p className="font-medium text-foreground">{clientName}</p></CardContent>
      </Card>}

      {/* Property */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Pledged Property</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {(p.property_name || p.address) && <p className="font-medium">{p.property_name || p.address}</p>}
          {p.property_name && p.address && <p className="text-sm text-muted-foreground">{p.address}</p>}
          <p className="text-sm text-muted-foreground">{[p.city, p.state, p.zip].filter(Boolean).join(", ")}</p>
          <p className="text-xs text-muted-foreground">
            {p.address_is_public
              ? "Exact address is visible to matched participants."
              : "Exact address is hidden — matched participants see only the city and state."}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-x-8">
            <Field label="Asset Type" value={p.asset_type ? ASSET_TYPE_LABELS[p.asset_type as keyof typeof ASSET_TYPE_LABELS] : undefined} />
            <Field label="Subtype" value={p.asset_subtype} />
            <Field label="Property Class" value={p.property_class} />
            <Field label="Condition" value={p.property_condition} />
            <Field label="Year Built" value={p.year_built} />
            <Field label="Units" value={p.units} />
            <Field label="Building Size" value={p.building_square_footage ? `${Number(p.building_square_footage).toLocaleString()} sq ft` : undefined} />
            <Field label="Land Area" value={p.land_area_acres ? `${p.land_area_acres} acres` : undefined} />
            <Field label="Buildings / Stories" value={p.num_buildings || p.num_stories ? `${p.num_buildings || "—"} / ${p.num_stories || "—"}` : undefined} />
            <Field label="Parking" value={p.parking_spaces || p.parking_type ? [p.parking_spaces ? `${p.parking_spaces} spaces` : "", p.parking_type].filter(Boolean).join(", ") : undefined} />
            <Field label="Zoning" value={p.zoning} />
            <Field label="County" value={p.county} />
          </div>
          {p.amenities.length > 0 && <Field label="Amenities" value={p.amenities.join(", ")} />}
          <Field label="Description" value={p.description} />
          <Field label="Recent Renovations" value={p.recent_renovations} />
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
          <Field label="Monthly Gross Rent" value={perMonth(f.gross_rent_roll)} />
          <Field label="Monthly Operating Expenses" value={perMonth(f.total_operating_expenses)} />
          <Field label="Monthly Mortgage Payment" value={perMonth(f.monthly_mortgage_payment)} />
          <Field label="Loan Balance" value={formatCurrency(parseCurrency(f.loan_balance))} />
          <Field label="NOI (annual, calculated)" value={derived.noi != null ? formatCurrency(derived.noi) : undefined} />
          <Field label="Cap Rate (calculated)" value={derived.capRate != null ? `${derived.capRate.toFixed(2)}%` : undefined} />
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

      {/* Optional replacement preferences */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
            Replacement Preferences
            <Badge variant="outline" className="normal-case tracking-normal">Optional</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasCriteria ? (
            <div className="rounded-md border border-dashed bg-muted/30 p-3">
              <p className="text-sm font-medium text-foreground">Default automatic matching</p>
              <p className="mt-1 text-xs text-muted-foreground">No optional preferences were added. The existing financing and return-on-equity algorithm will run unchanged.</p>
            </div>
          ) : (
            <div className="grid gap-x-8 sm:grid-cols-2">
              <Field label="Additional Cash Available" value={formatCurrency(parseCurrency(c.additional_cash_available))} />
              <Field label="Property Types" value={c.target_asset_types.map(type => ASSET_TYPE_LABELS[type]).join(", ")} />
              <Field label="Preferred States" value={c.target_states.join(", ")} />
              <Field label="Cities / Metros" value={c.target_metros.join(", ")} />
              <Field
                label="Replacement Price"
                value={c.target_price_min || c.target_price_max
                  ? `${formatCurrency(parseCurrency(c.target_price_min)) || "No minimum"} – ${formatCurrency(parseCurrency(c.target_price_max)) || "No maximum"}`
                  : undefined}
              />
              <Field label="Maximum LTV" value={c.max_ltv ? `${c.max_ltv}%` : undefined} />
              <Field label="Minimum Projected ROE" value={c.min_projected_roe ? `${c.min_projected_roe}%` : undefined} />
              <Field label="Minimum Monthly Cash Flow" value={formatCurrency(parseCurrency(c.preferred_monthly_cash_flow))} />
              <Field label="Location Matching" value={c.require_location_match ? "Required" : undefined} />
              <Field label="Property-Type Matching" value={c.require_asset_type_match ? "Required" : undefined} />
            </div>
          )}
        </CardContent>
      </Card>

      <ReviewMatchPreview property={p} financials={f} images={data.images} />

      {/* Compliance attestation — required before a property can go into the network */}
      <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="owner-auth"
            checked={ownerAuthConfirmed}
            onCheckedChange={(v) => onOwnerAuthorizationChange?.(v === true)}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <Label htmlFor="owner-auth" className="cursor-pointer text-sm font-medium text-foreground">
              {ownerType === "investor" ? "I own or am authorized to list this property" : "I have authorization to market this property"}
            </Label>
            <p className="text-xs text-muted-foreground">
              {ownerType === "investor"
                ? "I confirm that I own this property or have written authority to list it, and that the information above is accurate to the best of my knowledge."
                : "I confirm I have a current listing/representation agreement or written authorization from the property owner to market and share this property on 1031 Exchange Up, and that the information above is accurate to the best of my knowledge."}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} disabled={saving}>Back</Button>
          {onCancel && <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>}
        </div>
        <div className="flex flex-col items-stretch gap-1 sm:items-end">
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onSubmit(false)} disabled={saving}>{labels.secondary}</Button>
            <Button
              size="lg"
              onClick={() => onSubmit(true)}
              disabled={saving || !ownerAuthConfirmed}
              className="font-semibold"
              title={!ownerAuthConfirmed ? "Confirm owner authorization to continue" : undefined}
            >
              {labels.primary}
            </Button>
          </div>
          {!ownerAuthConfirmed && (
            <p className="text-xs text-muted-foreground">Check the authorization box above to continue.</p>
          )}
        </div>
      </div>
    </div>
  );
}
