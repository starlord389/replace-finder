import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  FinancialsData,
  PropertyData,
  UploadedPropertyImage,
  formatCurrency,
  formatThousands,
  getDerivedFinancials,
  parseCurrency,
  stripThousands,
} from "@/lib/exchangeWizardTypes";
import {
  ASSET_TYPE_LABELS,
  US_STATES,
} from "@/lib/constants";
import { Enums } from "@/integrations/supabase/types";
import { useState } from "react";
import { toast } from "sonner";
import PropertyPhotoUploader from "./PropertyPhotoUploader";

interface Props {
  property: PropertyData;
  financials: FinancialsData;
  images: UploadedPropertyImage[];
  onChangeProperty: (data: PropertyData) => void;
  onChangeFinancials: (data: FinancialsData) => void;
  onChangeImages: (images: UploadedPropertyImage[]) => void;
  onNext: () => void;
  onBack: () => void;
}

function CurrencyField({ label, value, onChange, required, error, errorMessage, help }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; error?: boolean; errorMessage?: string; help?: string;
}) {
  return (
    <div>
      <Label>{label}{required && " *"}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
        <Input
          className={cn("pl-7", error && "border-destructive")}
          inputMode="decimal"
          value={formatThousands(value)}
          onChange={e => onChange(stripThousands(e.target.value))}
          placeholder="0"
        />
      </div>
      {errorMessage && <p className="mt-1 text-xs text-destructive">{errorMessage}</p>}
      {!errorMessage && help && <p className="mt-1 text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

// NOI and cap rate are no longer entered — we derive them from the gross rent
// roll, operating expenses, and asking price (occupancy assumed 100%) and show
// the result read-only so the agent can sanity-check it.
function DerivedFinancials({ financials }: { financials: FinancialsData }) {
  const { noi, capRate } = getDerivedFinancials(financials);
  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Calculated</p>
      <p className="mt-1 text-xs text-muted-foreground">
        We annualize your monthly figures (×12) and assume 100% occupancy. The mortgage is excluded — NOI is before debt service.
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Net Operating Income (annual)</p>
          <p className="text-lg font-semibold text-foreground">{noi != null ? formatCurrency(noi) : "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Cap Rate</p>
          <p className="text-lg font-semibold text-foreground">{capRate != null ? `${capRate.toFixed(2)}%` : "—"}</p>
        </div>
      </div>
    </div>
  );
}

export default function StepPropertyAndFinancials({
  property,
  financials,
  images,
  onChangeProperty,
  onChangeFinancials,
  onChangeImages,
  onNext,
  onBack,
}: Props) {
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const selectValue = (v: string) => v || undefined;

  const setProperty = (field: keyof PropertyData, value: any) => {
    onChangeProperty({ ...property, [field]: value });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const setFinancials = (field: keyof FinancialsData, value: any) => {
    onChangeFinancials({ ...financials, [field]: value });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next: Record<string, string | undefined> = {};

    if (!property.city.trim()) next.city = "Required";
    if (!property.state) next.state = "Required";
    if (!property.asset_type) next.asset_type = "Required";

    const askingPrice = parseCurrency(financials.asking_price);
    if (!financials.asking_price) next.asking_price = "Required";
    else if (askingPrice === null) next.asking_price = "Must be a valid number";
    else if (askingPrice <= 0) next.asking_price = "Must be greater than 0";

    const grossRentRoll = parseCurrency(financials.gross_rent_roll);
    if (!financials.gross_rent_roll) next.gross_rent_roll = "Required";
    else if (grossRentRoll === null) next.gross_rent_roll = "Must be a valid number";
    else if (grossRentRoll < 0) next.gross_rent_roll = "Must be 0 or greater";

    const totalOpex = parseCurrency(financials.total_operating_expenses);
    if (financials.total_operating_expenses === "") next.total_operating_expenses = "Required (enter 0 if none)";
    else if (totalOpex === null) next.total_operating_expenses = "Must be a valid number";
    else if (totalOpex < 0) next.total_operating_expenses = "Must be 0 or greater";

    const loanBalance = parseCurrency(financials.loan_balance);
    if (financials.loan_balance === "") next.loan_balance = "Required (enter 0 if free and clear)";
    else if (loanBalance === null) next.loan_balance = "Must be a valid number";
    else if (loanBalance < 0) next.loan_balance = "Must be 0 or greater";

    // Mortgage payment is optional, but if provided it must be a valid, non-negative number.
    if (financials.monthly_mortgage_payment !== "") {
      const mortgage = parseCurrency(financials.monthly_mortgage_payment);
      if (mortgage === null) next.monthly_mortgage_payment = "Must be a valid number";
      else if (mortgage < 0) next.monthly_mortgage_payment = "Must be 0 or greater";
    }

    setErrors(next);
    return Object.values(next).every(v => !v);
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    } else {
      toast.error("Please fix the highlighted fields before continuing");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Property & Financials</h2>
        <p className="text-sm text-muted-foreground">
          Tell us about the property your client is relinquishing. We'll use these numbers to estimate their equity and find properties they can exchange into.
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Location</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Property Address</Label>
            <Input
              placeholder="e.g., 123 Main St"
              value={property.address}
              onChange={e => setProperty("address", e.target.value)}
            />
            <div className="mt-2 flex items-start gap-3 rounded-md border bg-muted/30 p-3">
              <Switch
                id="address-public"
                checked={property.address_is_public}
                onCheckedChange={v => setProperty("address_is_public", v)}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <Label htmlFor="address-public" className="cursor-pointer text-sm font-medium text-foreground">
                  Show the exact address to other agents
                </Label>
                <p className="text-xs text-muted-foreground">
                  {property.address_is_public
                    ? "Other agents will see the full street address."
                    : "Other agents see only the city and state. You and admins always see the full address."}
                </p>
              </div>
            </div>
          </div>
          <div>
            <Label>City *</Label>
            <Input value={property.city} onChange={e => setProperty("city", e.target.value)} className={errors.city ? "border-destructive" : ""} />
          </div>
          <div>
            <Label>State *</Label>
            <Select value={selectValue(property.state)} onValueChange={v => setProperty("state", v)}>
              <SelectTrigger className={errors.state ? "border-destructive" : ""}><SelectValue placeholder="Select state" /></SelectTrigger>
              <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Classification</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Asset Type *</Label>
            <Select
              value={selectValue(property.asset_type)}
              onValueChange={(v) => setProperty("asset_type", v as Enums<"asset_type">)}
            >
              <SelectTrigger className={errors.asset_type ? "border-destructive" : ""}><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>{Object.entries(ASSET_TYPE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <p className="mt-1 text-xs text-muted-foreground">
            A short narrative helps matched agents understand the property. Skip it if you'd rather add it later.
          </p>
        </div>
        <Textarea
          value={property.description}
          onChange={e => setProperty("description", e.target.value)}
          placeholder="Summarize the property, tenancy, recent improvements, and anything a buyer should know."
        />
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Property Photos</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Add photos so matched agents can see the property at a glance. First photo is used as the cover.
          </p>
        </div>
        <PropertyPhotoUploader images={images} onChange={onChangeImages} />
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Financials</h3>
        <p className="text-xs text-muted-foreground">
          Enter the recurring figures as <strong>monthly</strong> amounts. We total them up for the year automatically.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <CurrencyField label="Asking Price / Estimated Value" value={financials.asking_price} onChange={v => setFinancials("asking_price", v)}
            required error={!!errors.asking_price} errorMessage={errors.asking_price}
            help="What the property would list or sell for today." />
          <CurrencyField label="Monthly Gross Rent" value={financials.gross_rent_roll} onChange={v => setFinancials("gross_rent_roll", v)}
            required error={!!errors.gross_rent_roll} errorMessage={errors.gross_rent_roll}
            help="Total rent collected per month at full (100%) occupancy." />
          <CurrencyField label="Monthly Operating Expenses" value={financials.total_operating_expenses} onChange={v => setFinancials("total_operating_expenses", v)}
            required error={!!errors.total_operating_expenses} errorMessage={errors.total_operating_expenses}
            help="What it costs to OPERATE the property each month — property taxes, insurance, management, repairs, maintenance, utilities, HOA. Do NOT include the mortgage." />
          <CurrencyField label="Monthly Mortgage Payment" value={financials.monthly_mortgage_payment} onChange={v => setFinancials("monthly_mortgage_payment", v)}
            error={!!errors.monthly_mortgage_payment} errorMessage={errors.monthly_mortgage_payment}
            help="The current owner's monthly loan payment (principal + interest). This depends on the owner's financing, so we keep it separate from operating costs. Enter 0 if there's no mortgage." />
          <CurrencyField label="Current Loan Balance" value={financials.loan_balance} onChange={v => setFinancials("loan_balance", v)}
            required error={!!errors.loan_balance} errorMessage={errors.loan_balance}
            help="Remaining balance owed on the loan. Used to estimate equity and exchange proceeds. Enter 0 if free and clear." />
        </div>
        <DerivedFinancials financials={financials} />
      </section>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </div>
  );
}
