import { ASSET_TYPE_LABELS, STRATEGY_TYPE_LABELS } from "@/lib/constants";
import type { RequestFormData } from "@/pages/client/NewRequest";

interface Props {
  form: RequestFormData;
}

function Field({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}

function currency(v: string) {
  if (!v) return "";
  return "$" + Number(v).toLocaleString();
}

export default function StepReview({ form }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Review Your Request</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please review the details below before submitting.
        </p>
      </div>

      {/* Relinquished */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Relinquished Property</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Address" value={[form.relinquished_address, form.relinquished_city, form.relinquished_state, form.relinquished_zip].filter(Boolean).join(", ")} />
          <Field label="Property Type" value={form.relinquished_asset_type ? ASSET_TYPE_LABELS[form.relinquished_asset_type as keyof typeof ASSET_TYPE_LABELS] : ""} />
          <Field label="Estimated Value" value={currency(form.relinquished_estimated_value)} />
          <Field label="Description" value={form.relinquished_description} />
        </div>
      </div>

      {/* Economics */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Exchange Economics</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Estimated Equity" value={currency(form.estimated_equity)} />
          <Field label="Estimated Debt" value={currency(form.estimated_debt)} />
          <Field label="Exchange Proceeds" value={currency(form.exchange_proceeds)} />
          <Field label="Estimated Basis" value={currency(form.estimated_basis)} />
        </div>
      </div>

      {/* Goals */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Replacement Goals</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Price Range" value={
            form.target_price_min || form.target_price_max
              ? `${currency(form.target_price_min)} – ${currency(form.target_price_max)}`
              : ""
          } />
          <Field label="Asset Types" value={form.target_asset_types.map((t) => ASSET_TYPE_LABELS[t]).join(", ")} />
          <Field label="Strategies" value={form.target_strategies.map((s) => STRATEGY_TYPE_LABELS[s]).join(", ")} />
          <Field label="Cap Rate Range" value={
            form.target_cap_rate_min || form.target_cap_rate_max
              ? `${form.target_cap_rate_min || "—"}% – ${form.target_cap_rate_max || "—"}%`
              : ""
          } />
          <Field label="Additional Notes" value={form.additional_notes} />
        </div>
      </div>

      {/* Geography */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Geography</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Target States" value={form.target_states.join(", ")} />
          <Field label="Target Metros" value={form.target_metros} />
        </div>
      </div>

      {/* Timing */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Timing</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Sale Timeline" value={form.sale_timeline} />
          <Field label="45-Day ID Deadline" value={form.identification_deadline} />
          <Field label="180-Day Close Deadline" value={form.close_deadline} />
          <Field label="Urgency" value={form.urgency} />
        </div>
      </div>
    </div>
  );
}
