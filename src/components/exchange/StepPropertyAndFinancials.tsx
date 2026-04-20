import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  FinancialsData,
  PropertyData,
  UploadedPropertyImage,
  parseCurrency,
} from "@/lib/exchangeWizardTypes";
import {
  ASSET_TYPE_LABELS,
  US_STATES,
} from "@/lib/constants";
import { Enums } from "@/integrations/supabase/types";
import { useState } from "react";
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

function CurrencyField({ label, value, onChange, required, error, help }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; error?: boolean; help?: string;
}) {
  return (
    <div>
      <Label>{label}{required && " *"}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
        <Input className={cn("pl-7", error && "border-destructive")} value={value} onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0" />
      </div>
      {help && <p className="mt-1 text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

function PercentField({ label, value, onChange, required, error }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; error?: boolean;
}) {
  return (
    <div>
      <Label>{label}{required && " *"}</Label>
      <div className="relative">
        <Input className={cn("pr-7", error && "border-destructive")} value={value} onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
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
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const selectValue = (v: string) => v || undefined;

  const setProperty = (field: keyof PropertyData, value: any) => {
    onChangeProperty({ ...property, [field]: value });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }));
  };

  const setFinancials = (field: keyof FinancialsData, value: any) => {
    const updated = { ...financials, [field]: value };

    if ((field === "noi" || field === "asking_price") && updated.asking_price && updated.noi) {
      const price = parseCurrency(updated.asking_price);
      const noi = parseCurrency(updated.noi);
      if (price && noi && price > 0) updated.cap_rate = ((noi / price) * 100).toFixed(2);
    }

    onChangeFinancials(updated);
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }));
  };

  const validate = () => {
    const required: Record<string, boolean> = {
      address: !property.address.trim(),
      city: !property.city.trim(),
      state: !property.state,
      zip: !property.zip.trim(),
      asset_type: !property.asset_type,
      asking_price: !financials.asking_price,
      noi: !financials.noi,
      occupancy_rate: !financials.occupancy_rate,
      loan_balance: financials.loan_balance === "",
    };
    setErrors(required);
    return !Object.values(required).some(Boolean);
  };

  const handleNext = () => { if (validate()) onNext(); };

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
            <Label>Property Name</Label>
            <Input
              placeholder="e.g., Riverside Apartments"
              value={property.property_name}
              onChange={e => setProperty("property_name", e.target.value)}
            />
          </div>
          <div>
            <Label>Street Address *</Label>
            <Input value={property.address} onChange={e => setProperty("address", e.target.value)} className={errors.address ? "border-destructive" : ""} />
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
          <div>
            <Label>ZIP Code *</Label>
            <Input value={property.zip} onChange={e => setProperty("zip", e.target.value)} className={errors.zip ? "border-destructive" : ""} />
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

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Property Snapshot</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Year Built</Label>
            <Input type="number" value={property.year_built} onChange={e => setProperty("year_built", e.target.value)} />
          </div>
          <div>
            <Label>Total Units</Label>
            <Input type="number" value={property.units} onChange={e => setProperty("units", e.target.value)} />
          </div>
          <div>
            <Label>Building SF</Label>
            <Input type="number" value={property.building_square_footage} onChange={e => setProperty("building_square_footage", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <Label>Description</Label>
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
        <div className="grid gap-4 sm:grid-cols-3">
          <CurrencyField label="Asking Price / Estimated Value" value={financials.asking_price} onChange={v => setFinancials("asking_price", v)} required error={errors.asking_price} />
          <CurrencyField label="Net Operating Income (NOI)" value={financials.noi} onChange={v => setFinancials("noi", v)} required error={errors.noi} />
          <PercentField label="Occupancy Rate" value={financials.occupancy_rate} onChange={v => setFinancials("occupancy_rate", v)} required error={errors.occupancy_rate} />
          <PercentField label="Cap Rate" value={financials.cap_rate} onChange={v => setFinancials("cap_rate", v)} />
          <CurrencyField label="Current Loan Balance" value={financials.loan_balance} onChange={v => setFinancials("loan_balance", v)}
            required error={errors.loan_balance}
            help="Required to estimate equity and exchange proceeds behind the scenes. Enter 0 if the property is free and clear." />
        </div>
      </section>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </div>
  );
}
