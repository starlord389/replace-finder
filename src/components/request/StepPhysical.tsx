import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PARKING_TYPE_OPTIONS, CONSTRUCTION_TYPE_OPTIONS, ROOF_TYPE_OPTIONS,
  HVAC_TYPE_OPTIONS, PROPERTY_CONDITION_OPTIONS, AMENITY_OPTIONS,
} from "@/lib/constants";
import type { RequestFormData } from "@/lib/requestFormTypes";

interface Props {
  form: RequestFormData;
  update: (partial: Partial<RequestFormData>) => void;
}

function DropdownField({ label, value, options, onChange, required }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label} {required && <span className="text-destructive">*</span>}</Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function StepPhysical({ form, update }: Props) {
  const isUnitBased = ["multifamily", "self_storage", "hospitality"].includes(form.relinquished_asset_type);

  const toggleAmenity = (amenity: string) => {
    const current = form.amenities;
    update({
      amenities: current.includes(amenity)
        ? current.filter((a) => a !== amenity)
        : [...current, amenity],
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Physical Description</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe the physical characteristics of the property.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {isUnitBased && (
          <div className="space-y-2">
            <Label htmlFor="units">Total Units <span className="text-destructive">*</span></Label>
            <Input id="units" type="number" placeholder="48" value={form.units} onChange={(e) => update({ units: e.target.value })} />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="bsf">Building Square Footage {!isUnitBased && <span className="text-destructive">*</span>}</Label>
          <Input id="bsf" type="number" placeholder="25,000" value={form.building_square_footage} onChange={(e) => update({ building_square_footage: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year_built">Year Built <span className="text-destructive">*</span></Label>
          <Input id="year_built" type="number" placeholder="2005" value={form.year_built} onChange={(e) => update({ year_built: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="land">Land Area (Acres)</Label>
          <Input id="land" type="number" step="0.01" placeholder="2.5" value={form.land_area_acres} onChange={(e) => update({ land_area_acres: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="num_buildings">Number of Buildings</Label>
          <Input id="num_buildings" type="number" placeholder="3" value={form.num_buildings} onChange={(e) => update({ num_buildings: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stories">Number of Stories</Label>
          <Input id="stories" type="number" placeholder="3" value={form.num_stories} onChange={(e) => update({ num_stories: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parking">Parking Spaces</Label>
          <Input id="parking" type="number" placeholder="60" value={form.parking_spaces} onChange={(e) => update({ parking_spaces: e.target.value })} />
        </div>
        <DropdownField label="Parking Type" value={form.parking_type} options={PARKING_TYPE_OPTIONS} onChange={(v) => update({ parking_type: v })} />
        <div className="space-y-2">
          <Label htmlFor="zoning">Zoning</Label>
          <Input id="zoning" placeholder="R-3" value={form.zoning} onChange={(e) => update({ zoning: e.target.value })} />
        </div>
        <DropdownField label="Construction Type" value={form.construction_type} options={CONSTRUCTION_TYPE_OPTIONS} onChange={(v) => update({ construction_type: v })} />
        <DropdownField label="Roof Type" value={form.roof_type} options={ROOF_TYPE_OPTIONS} onChange={(v) => update({ roof_type: v })} />
        <DropdownField label="HVAC Type" value={form.hvac_type} options={HVAC_TYPE_OPTIONS} onChange={(v) => update({ hvac_type: v })} />
        <DropdownField label="Property Condition" value={form.property_condition} options={PROPERTY_CONDITION_OPTIONS} onChange={(v) => update({ property_condition: v })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="renovations">Recent Renovations / Capital Improvements</Label>
        <Textarea id="renovations" placeholder="Describe any recent work, amounts spent, year completed…" value={form.recent_renovations} onChange={(e) => update({ recent_renovations: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label>Amenities</Label>
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAmenity(a)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                form.amenities.includes(a)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Property Description</Label>
        <Textarea id="description" placeholder="Additional details about the property…" value={form.relinquished_description} onChange={(e) => update({ relinquished_description: e.target.value })} />
      </div>
    </div>
  );
}
