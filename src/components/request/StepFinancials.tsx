import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RequestFormData } from "@/lib/requestFormTypes";

interface Props {
  form: RequestFormData;
  update: (partial: Partial<RequestFormData>) => void;
}

function CurrencyField({ id, label, value, onChange, required, hint }: {
  id: string; label: string; value: string; onChange: (v: string) => void; required?: boolean; hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label} {required && <span className="text-destructive">*</span>}</Label>
      <Input id={id} type="number" placeholder="0" value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function StepFinancials({ form, update }: Props) {
  // Auto-calculate cap rate if value and NOI are both present
  const autoCapRate = form.relinquished_estimated_value && form.current_noi
    ? ((Number(form.current_noi) / Number(form.relinquished_estimated_value)) * 100).toFixed(2)
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Current Financial Performance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Provide the property's financial details. Required fields are marked with an asterisk.
        </p>
      </div>

      {/* Required */}
      <div className="grid gap-4 sm:grid-cols-2">
        <CurrencyField id="est_value" label="Estimated Property Value / Asking Price ($)" value={form.relinquished_estimated_value} onChange={(v) => update({ relinquished_estimated_value: v })} required />
        <CurrencyField id="noi" label="Current Annual NOI ($)" value={form.current_noi} onChange={(v) => update({ current_noi: v })} required />
        <div className="space-y-2">
          <Label htmlFor="occ">Current Occupancy Rate (%) <span className="text-destructive">*</span></Label>
          <Input id="occ" type="number" step="0.1" min="0" max="100" placeholder="95" value={form.current_occupancy_rate} onChange={(e) => update({ current_occupancy_rate: e.target.value })} />
        </div>
      </div>

      {/* Optional — encouraged */}
      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
        <p className="text-sm font-medium text-primary">💡 The more financial detail you provide, the better we can match you.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CurrencyField id="gsi" label="Gross Scheduled Income ($)" value={form.gross_scheduled_income} onChange={(v) => update({ gross_scheduled_income: v })} />
        <CurrencyField id="egi" label="Effective Gross Income ($)" value={form.effective_gross_income} onChange={(v) => update({ effective_gross_income: v })} />
        <CurrencyField id="taxes" label="Real Estate Taxes ($)" value={form.real_estate_taxes} onChange={(v) => update({ real_estate_taxes: v })} />
        <CurrencyField id="insurance" label="Insurance ($)" value={form.insurance} onChange={(v) => update({ insurance: v })} />
        <CurrencyField id="utils" label="Utilities ($)" value={form.utilities} onChange={(v) => update({ utilities: v })} />
        <CurrencyField id="mgmt" label="Management Fee ($)" value={form.management_fee} onChange={(v) => update({ management_fee: v })} />
        <CurrencyField id="maint" label="Maintenance / Repairs ($)" value={form.maintenance_repairs} onChange={(v) => update({ maintenance_repairs: v })} />
        <CurrencyField id="capex" label="CapEx Reserves ($)" value={form.capex_reserves} onChange={(v) => update({ capex_reserves: v })} />
        <CurrencyField id="other_exp" label="Other Expenses ($)" value={form.other_expenses} onChange={(v) => update({ other_expenses: v })} />
        <div className="space-y-2">
          <Label htmlFor="cap_rate">Cap Rate (%)</Label>
          <Input id="cap_rate" type="number" step="0.01" placeholder={autoCapRate || "6.0"} value={form.current_cap_rate} onChange={(e) => update({ current_cap_rate: e.target.value })} />
          {autoCapRate && !form.current_cap_rate && (
            <p className="text-xs text-muted-foreground">Auto-calculated: {autoCapRate}%</p>
          )}
        </div>
        <CurrencyField id="avg_rent" label="Average Rent Per Unit ($)" value={form.average_rent_per_unit} onChange={(v) => update({ average_rent_per_unit: v })} hint="Auto-calculated if revenue and units are available." />
      </div>
    </div>
  );
}
