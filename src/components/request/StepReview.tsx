import { ASSET_TYPE_LABELS, STRATEGY_TYPE_LABELS, URGENCY_OPTIONS } from "@/lib/constants";
import type { RequestFormData } from "@/lib/requestFormTypes";
import type { UploadedImage } from "./StepPhotos";
import { AlertCircle } from "lucide-react";

interface Props {
  form: RequestFormData;
  images: UploadedImage[];
  missingRequired: string[];
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

function pct(v: string) {
  if (!v) return "";
  return v + "%";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

export default function StepReview({ form, images, missingRequired }: Props) {
  const urgencyLabel = URGENCY_OPTIONS.find((o) => o.value === form.urgency)?.label || form.urgency;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Review Your Request</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please review the details below before submitting.
        </p>
      </div>

      {missingRequired.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Missing required fields</p>
            <p className="mt-1 text-xs text-destructive/80">{missingRequired.join(", ")}</p>
          </div>
        </div>
      )}

      <Section title="Property Location">
        <Field label="Property Name" value={form.property_name} />
        <Field label="Address" value={[form.relinquished_address, form.unit_suite].filter(Boolean).join(", ")} />
        <Field label="City, State, ZIP" value={[form.relinquished_city, form.relinquished_state, form.relinquished_zip].filter(Boolean).join(", ")} />
        <Field label="County" value={form.county} />
      </Section>

      <Section title="Classification">
        <Field label="Asset Type" value={form.relinquished_asset_type ? ASSET_TYPE_LABELS[form.relinquished_asset_type as keyof typeof ASSET_TYPE_LABELS] : ""} />
        <Field label="Subtype" value={form.asset_subtype} />
        <Field label="Strategy" value={form.target_strategy ? STRATEGY_TYPE_LABELS[form.target_strategy as keyof typeof STRATEGY_TYPE_LABELS] : ""} />
        <Field label="Property Class" value={form.property_class} />
      </Section>

      <Section title="Physical Description">
        <Field label="Units" value={form.units} />
        <Field label="Building SF" value={form.building_square_footage ? Number(form.building_square_footage).toLocaleString() + " SF" : ""} />
        <Field label="Year Built" value={form.year_built} />
        <Field label="Land Area" value={form.land_area_acres ? form.land_area_acres + " acres" : ""} />
        <Field label="Buildings" value={form.num_buildings} />
        <Field label="Stories" value={form.num_stories} />
        <Field label="Parking" value={[form.parking_spaces ? form.parking_spaces + " spaces" : "", form.parking_type].filter(Boolean).join(" · ")} />
        <Field label="Construction" value={form.construction_type} />
        <Field label="Condition" value={form.property_condition} />
        {form.amenities.length > 0 && <Field label="Amenities" value={form.amenities.join(", ")} />}
      </Section>

      <Section title="Financial Performance">
        <Field label="Estimated Value" value={currency(form.relinquished_estimated_value)} />
        <Field label="Annual NOI" value={currency(form.current_noi)} />
        <Field label="Occupancy" value={pct(form.current_occupancy_rate)} />
        <Field label="Cap Rate" value={pct(form.current_cap_rate)} />
        <Field label="Gross Income" value={currency(form.gross_scheduled_income)} />
        <Field label="Taxes" value={currency(form.real_estate_taxes)} />
        <Field label="Insurance" value={currency(form.insurance)} />
        <Field label="Management" value={currency(form.management_fee)} />
      </Section>

      <Section title="Debt & Equity">
        <Field label="Exchange Proceeds" value={currency(form.exchange_proceeds)} />
        <Field label="Equity" value={currency(form.estimated_equity)} />
        <Field label="Debt" value={currency(form.estimated_debt)} />
        <Field label="Basis" value={currency(form.estimated_basis)} />
        <Field label="Loan Balance" value={currency(form.current_loan_balance)} />
        <Field label="Interest Rate" value={pct(form.current_interest_rate)} />
        <Field label="Loan Type" value={form.loan_type} />
        <Field label="Debt Service" value={currency(form.annual_debt_service)} />
      </Section>

      <Section title="Replacement Criteria">
        <Field label="Target Asset Types" value={form.target_asset_types.map((t) => ASSET_TYPE_LABELS[t]).join(", ")} />
        <Field label="Target States" value={form.target_states.join(", ")} />
        <Field label="Price Range" value={
          form.target_price_min || form.target_price_max
            ? `${currency(form.target_price_min)} – ${currency(form.target_price_max)}`
            : ""
        } />
        <Field label="Urgency" value={urgencyLabel} />
        <Field label="Metros" value={form.target_metros} />
        <Field label="Strategies" value={form.target_strategies.map((s) => STRATEGY_TYPE_LABELS[s]).join(", ")} />
        <Field label="Cap Rate Range" value={
          form.target_cap_rate_min || form.target_cap_rate_max
            ? `${form.target_cap_rate_min || "—"}% – ${form.target_cap_rate_max || "—"}%`
            : ""
        } />
        <Field label="ID Deadline" value={form.identification_deadline} />
        <Field label="Close Deadline" value={form.close_deadline} />
        {form.open_to_dsts && <Field label="Open to DSTs" value="Yes" />}
        {form.open_to_tics && <Field label="Open to TICs" value="Yes" />}
        <Field label="Notes" value={form.additional_notes} />
      </Section>

      {images.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Photos ({images.length})</h3>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {images.map((img) => (
              <div key={img.storage_path} className="aspect-square overflow-hidden rounded-lg border">
                <img src={img.url} alt={img.file_name} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
