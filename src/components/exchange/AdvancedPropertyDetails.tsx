import { useEffect, useState } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  FinancialsData,
  PropertyData,
  UploadedPropertyImage,
  formatThousands,
  hasAdvancedPropertyDetails,
  stripThousands,
} from "@/lib/exchangeWizardTypes";
import type { Enums } from "@/integrations/supabase/types";
import PropertyPhotoUploader from "./PropertyPhotoUploader";

interface Props {
  property: PropertyData;
  financials: FinancialsData;
  images: UploadedPropertyImage[];
  errors: Record<string, string | undefined>;
  onChangeProperty: (field: keyof PropertyData, value: PropertyData[keyof PropertyData]) => void;
  onChangeMortgage: (value: string) => void;
  onChangeImages: (images: UploadedPropertyImage[]) => void;
}

const STRATEGY_LABELS: Record<Enums<"strategy_type">, string> = {
  core: "Core",
  core_plus: "Core Plus",
  value_add: "Value-Add",
  opportunistic: "Opportunistic",
  development: "Development",
  nnn: "Triple Net (NNN)",
  other: "Other",
};

const ADVANCED_ERROR_FIELDS = new Set([
  "zip",
  "year_built",
  "units",
  "building_square_footage",
  "land_area_acres",
  "num_buildings",
  "num_stories",
  "parking_spaces",
  "monthly_mortgage_payment",
]);

function OptionalTextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  maxLength = 150,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label} <span className="font-normal text-muted-foreground">(optional)</span></Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={error ? "border-destructive" : ""}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function OptionalNumberField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  decimals = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  decimals?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label} <span className="font-normal text-muted-foreground">(optional)</span></Label>
      <Input
        id={id}
        inputMode={decimals ? "decimal" : "numeric"}
        value={formatThousands(value)}
        onChange={(event) => {
          const stripped = stripThousands(event.target.value);
          onChange(decimals ? stripped : stripped.replace(/\./g, ""));
        }}
        placeholder={placeholder}
        className={error ? "border-destructive" : ""}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function AdvancedPropertyDetails({
  property,
  financials,
  images,
  errors,
  onChangeProperty,
  onChangeMortgage,
  onChangeImages,
}: Props) {
  const [open, setOpen] = useState(() => hasAdvancedPropertyDetails(property, financials, images.length));
  const [amenityDraft, setAmenityDraft] = useState("");
  const hasDetails = hasAdvancedPropertyDetails(property, financials, images.length);

  useEffect(() => {
    if (Object.keys(errors).some((field) => errors[field] && ADVANCED_ERROR_FIELDS.has(field))) {
      setOpen(true);
    }
  }, [errors]);

  const set = <K extends keyof PropertyData>(field: K, value: PropertyData[K]) => {
    onChangeProperty(field, value);
  };

  const addAmenity = () => {
    const amenity = amenityDraft.trim();
    if (!amenity) return;
    const exists = property.amenities.some((item) => item.toLowerCase() === amenity.toLowerCase());
    if (!exists) set("amenities", [...property.amenities, amenity]);
    setAmenityDraft("");
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-xl border bg-card">
      <CollapsibleTrigger asChild>
        <button type="button" className="flex w-full items-center justify-between gap-4 p-4 text-left sm:p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-foreground">Advanced property information</p>
              <Badge variant="outline">Optional</Badge>
              {hasDetails && <Badge variant="secondary"><Check className="mr-1 h-3 w-3" /> Added</Badge>}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Add richer property, building, financing, and marketing details. You can leave every field blank.
            </p>
          </div>
          <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="space-y-8 border-t p-4 sm:p-5">
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Property identity & exact location</h3>
              <p className="mt-1 text-xs text-muted-foreground">Useful for organizing and presenting the listing; the street address can remain private.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <OptionalTextField id="property-name" label="Property name" value={property.property_name} onChange={(value) => set("property_name", value)} placeholder="e.g., Lakeside Apartments" />
              <OptionalTextField id="property-subtype" label="Property subtype" value={property.asset_subtype} onChange={(value) => set("asset_subtype", value)} placeholder="e.g., Garden-style apartments" />
              <div className="sm:col-span-2">
                <OptionalTextField id="property-address" label="Street address" value={property.address} onChange={(value) => set("address", value)} placeholder="e.g., 123 Main St" maxLength={250} />
                <div className="mt-2 flex items-start gap-3 rounded-md border bg-muted/30 p-3">
                  <Switch id="address-public" checked={property.address_is_public} onCheckedChange={(value) => set("address_is_public", value)} className="mt-0.5" />
                  <div>
                    <Label htmlFor="address-public" className="cursor-pointer text-sm font-medium">Show the exact address to matched users</Label>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {property.address_is_public
                        ? "Matched users will see the full street address."
                        : "Matched users see only city and state; you and admins still see the stored address."}
                    </p>
                  </div>
                </div>
              </div>
              <OptionalTextField id="property-unit-suite" label="Unit or suite" value={property.unit_suite} onChange={(value) => set("unit_suite", value)} placeholder="e.g., Suite 400" />
              <OptionalTextField id="property-zip" label="ZIP code" value={property.zip} onChange={(value) => set("zip", value)} placeholder="e.g., 33602" error={errors.zip} maxLength={10} />
              <OptionalTextField id="property-county" label="County" value={property.county} onChange={(value) => set("county", value)} placeholder="e.g., Hillsborough" />
              <div className="space-y-1.5">
                <Label htmlFor="property-strategy">Investment profile <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Select value={property.strategy_type || "none"} onValueChange={(value) => set("strategy_type", value === "none" ? "" : value as Enums<"strategy_type">)}>
                  <SelectTrigger id="property-strategy"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {Object.entries(STRATEGY_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Physical profile</h3>
              <p className="mt-1 text-xs text-muted-foreground">Structured facts that help matched users evaluate the property quickly.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <OptionalTextField id="property-class" label="Property class" value={property.property_class} onChange={(value) => set("property_class", value)} placeholder="e.g., Class B" />
              <OptionalTextField id="property-condition" label="Condition" value={property.property_condition} onChange={(value) => set("property_condition", value)} placeholder="e.g., Good" />
              <OptionalNumberField id="property-year-built" label="Year built" value={property.year_built} onChange={(value) => set("year_built", value)} placeholder="e.g., 2008" error={errors.year_built} />
              <OptionalNumberField id="property-units" label="Units" value={property.units} onChange={(value) => set("units", value)} placeholder="e.g., 48" error={errors.units} />
              <OptionalNumberField id="property-square-feet" label="Building square feet" value={property.building_square_footage} onChange={(value) => set("building_square_footage", value)} placeholder="e.g., 72000" error={errors.building_square_footage} />
              <OptionalNumberField id="property-land-acres" label="Land area (acres)" value={property.land_area_acres} onChange={(value) => set("land_area_acres", value)} placeholder="e.g., 4.5" error={errors.land_area_acres} decimals />
              <OptionalNumberField id="property-buildings" label="Number of buildings" value={property.num_buildings} onChange={(value) => set("num_buildings", value)} placeholder="e.g., 3" error={errors.num_buildings} />
              <OptionalNumberField id="property-stories" label="Number of stories" value={property.num_stories} onChange={(value) => set("num_stories", value)} placeholder="e.g., 4" error={errors.num_stories} />
              <OptionalTextField id="property-zoning" label="Zoning" value={property.zoning} onChange={(value) => set("zoning", value)} placeholder="e.g., Commercial mixed-use" />
            </div>
          </section>

          <section className="space-y-4 border-t pt-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Building & site details</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <OptionalTextField id="property-construction" label="Construction type" value={property.construction_type} onChange={(value) => set("construction_type", value)} placeholder="e.g., Masonry" />
              <OptionalTextField id="property-roof" label="Roof type" value={property.roof_type} onChange={(value) => set("roof_type", value)} placeholder="e.g., TPO" />
              <OptionalTextField id="property-hvac" label="HVAC type" value={property.hvac_type} onChange={(value) => set("hvac_type", value)} placeholder="e.g., Central" />
              <OptionalNumberField id="property-parking-spaces" label="Parking spaces" value={property.parking_spaces} onChange={(value) => set("parking_spaces", value)} placeholder="e.g., 120" error={errors.parking_spaces} />
              <OptionalTextField id="property-parking-type" label="Parking type" value={property.parking_type} onChange={(value) => set("parking_type", value)} placeholder="e.g., Surface lot" />
            </div>
          </section>

          <section className="space-y-4 border-t pt-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Existing financing</h3>
              <p className="mt-1 text-xs text-muted-foreground">This improves the current return-on-equity estimate when known.</p>
            </div>
            <div className="max-w-md space-y-1.5">
              <Label htmlFor="monthly-mortgage">Monthly mortgage payment <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  id="monthly-mortgage"
                  className={cn("pl-7", errors.monthly_mortgage_payment && "border-destructive")}
                  inputMode="decimal"
                  value={formatThousands(financials.monthly_mortgage_payment)}
                  onChange={(event) => onChangeMortgage(stripThousands(event.target.value))}
                  placeholder="0"
                />
              </div>
              {errors.monthly_mortgage_payment
                ? <p className="text-xs text-destructive">{errors.monthly_mortgage_payment}</p>
                : <p className="text-xs text-muted-foreground">Principal and interest only. Leave blank if unknown or enter 0 if there is no mortgage.</p>}
            </div>
          </section>

          <section className="space-y-4 border-t pt-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Marketing details</h3>
              <p className="mt-1 text-xs text-muted-foreground">Help matched participants understand the property beyond the numbers.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="property-amenity-draft">Amenities <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <div className="flex gap-2">
                <Input
                  id="property-amenity-draft"
                  value={amenityDraft}
                  onChange={(event) => setAmenityDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addAmenity();
                    }
                  }}
                  placeholder="e.g., Loading docks or fitness center"
                  maxLength={100}
                />
                <Button type="button" variant="outline" onClick={addAmenity} disabled={!amenityDraft.trim()}><Plus className="mr-1 h-4 w-4" /> Add</Button>
              </div>
              {property.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {property.amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="gap-1 pr-1">
                      {amenity}
                      <button type="button" className="rounded-full p-0.5 hover:bg-foreground/10" onClick={() => set("amenities", property.amenities.filter((item) => item !== amenity))} aria-label={`Remove ${amenity}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="property-description">Description <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Textarea id="property-description" value={property.description} onChange={(event) => set("description", event.target.value)} maxLength={4000} placeholder="Summarize tenancy, location strengths, improvements, and anything a matched participant should know." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="property-renovations">Recent renovations <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Textarea id="property-renovations" value={property.recent_renovations} onChange={(event) => set("recent_renovations", event.target.value)} maxLength={2000} placeholder="Describe recent capital improvements and the approximate completion year." />
            </div>
          </section>

          <section className="space-y-3 border-t pt-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Property photos <span className="normal-case tracking-normal">(optional)</span></h3>
              <p className="mt-1 text-xs text-muted-foreground">The first photo becomes the cover. A clean placeholder is used if you skip photos.</p>
            </div>
            <PropertyPhotoUploader images={images} onChange={onChangeImages} />
          </section>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
