import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { PropertyData } from "@/lib/exchangeWizardTypes";
import {
  ASSET_TYPE_LABELS, ASSET_SUBTYPE_MAP, STRATEGY_TYPE_LABELS, US_STATES,
  PROPERTY_CLASS_OPTIONS, PARKING_TYPE_OPTIONS, CONSTRUCTION_TYPE_OPTIONS,
  ROOF_TYPE_OPTIONS, HVAC_TYPE_OPTIONS, PROPERTY_CONDITION_OPTIONS, AMENITY_OPTIONS,
} from "@/lib/constants";
import { Enums } from "@/integrations/supabase/types";
import { useState } from "react";

interface Props {
  data: PropertyData;
  onChange: (data: PropertyData) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepPropertyDetails({ data, onChange, onNext, onBack }: Props) {
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [additionalOpen, setAdditionalOpen] = useState(false);

  const set = (field: keyof PropertyData, value: any) => {
    onChange({ ...data, [field]: value });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }));
  };

  const toggleAmenity = (a: string) => {
    set("amenities", data.amenities.includes(a) ? data.amenities.filter(x => x !== a) : [...data.amenities, a]);
  };

  const validate = () => {
    const required: Record<string, boolean> = {
      address: !data.address.trim(), city: !data.city.trim(), state: !data.state, zip: !data.zip.trim(),
      asset_type: !data.asset_type, strategy_type: !data.strategy_type, year_built: !data.year_built,
    };
    setErrors(required);
    return !Object.values(required).some(Boolean);
  };

  const handleNext = () => { if (validate()) onNext(); };

  const subtypes = data.asset_type ? (ASSET_SUBTYPE_MAP[data.asset_type] || []) : [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Property Details</h2>
        <p className="text-sm text-muted-foreground">Enter the relinquished property details. This property will be visible to other agents.</p>
      </div>

      {/* Location */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Location</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Property Name</Label><Input placeholder="e.g., Riverside Apartments" value={data.property_name} onChange={e => set("property_name", e.target.value)} /></div>
          <div><Label>Street Address *</Label><Input value={data.address} onChange={e => set("address", e.target.value)} className={errors.address ? "border-destructive" : ""} /></div>
          <div><Label>Unit/Suite</Label><Input value={data.unit_suite} onChange={e => set("unit_suite", e.target.value)} /></div>
          <div><Label>City *</Label><Input value={data.city} onChange={e => set("city", e.target.value)} className={errors.city ? "border-destructive" : ""} /></div>
          <div>
            <Label>State *</Label>
            <Select value={data.state} onValueChange={v => set("state", v)}>
              <SelectTrigger className={errors.state ? "border-destructive" : ""}><SelectValue placeholder="Select state" /></SelectTrigger>
              <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>ZIP Code *</Label><Input value={data.zip} onChange={e => set("zip", e.target.value)} className={errors.zip ? "border-destructive" : ""} /></div>
          <div><Label>County</Label><Input value={data.county} onChange={e => set("county", e.target.value)} /></div>
        </div>
      </section>

      {/* Classification */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Classification</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Asset Type *</Label>
            <Select value={data.asset_type} onValueChange={v => { set("asset_type", v as Enums<"asset_type">); set("asset_subtype", ""); }}>
              <SelectTrigger className={errors.asset_type ? "border-destructive" : ""}><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>{Object.entries(ASSET_TYPE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {subtypes.length > 0 && subtypes[0] !== "Other" && (
            <div>
              <Label>Asset Subtype</Label>
              <Select value={data.asset_subtype} onValueChange={v => set("asset_subtype", v)}>
                <SelectTrigger><SelectValue placeholder="Select subtype" /></SelectTrigger>
                <SelectContent>{subtypes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Investment Strategy *</Label>
            <Select value={data.strategy_type} onValueChange={v => set("strategy_type", v as Enums<"strategy_type">)}>
              <SelectTrigger className={errors.strategy_type ? "border-destructive" : ""}><SelectValue placeholder="Select strategy" /></SelectTrigger>
              <SelectContent>{Object.entries(STRATEGY_TYPE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Property Class</Label>
            <Select value={data.property_class} onValueChange={v => set("property_class", v)}>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>{PROPERTY_CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Physical Description */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Physical Description</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><Label>Year Built *</Label><Input type="number" value={data.year_built} onChange={e => set("year_built", e.target.value)} className={errors.year_built ? "border-destructive" : ""} /></div>
          <div><Label>Total Units</Label><Input type="number" value={data.units} onChange={e => set("units", e.target.value)} /></div>
          <div><Label>Building SF</Label><Input type="number" value={data.building_square_footage} onChange={e => set("building_square_footage", e.target.value)} /></div>
          <div><Label>Land Area (Acres)</Label><Input type="number" step="0.01" value={data.land_area_acres} onChange={e => set("land_area_acres", e.target.value)} /></div>
          <div><Label>Number of Buildings</Label><Input type="number" value={data.num_buildings} onChange={e => set("num_buildings", e.target.value)} /></div>
          <div><Label>Number of Stories</Label><Input type="number" value={data.num_stories} onChange={e => set("num_stories", e.target.value)} /></div>
        </div>
      </section>

      {/* Additional Details */}
      <Collapsible open={additionalOpen} onOpenChange={setAdditionalOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className={`h-4 w-4 transition-transform ${additionalOpen ? "rotate-180" : ""}`} />
            Additional Details
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label>Parking Spaces</Label><Input type="number" value={data.parking_spaces} onChange={e => set("parking_spaces", e.target.value)} /></div>
            <div>
              <Label>Parking Type</Label>
              <Select value={data.parking_type} onValueChange={v => set("parking_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{PARKING_TYPE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Construction Type</Label>
              <Select value={data.construction_type} onValueChange={v => set("construction_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{CONSTRUCTION_TYPE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Roof Type</Label>
              <Select value={data.roof_type} onValueChange={v => set("roof_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{ROOF_TYPE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>HVAC Type</Label>
              <Select value={data.hvac_type} onValueChange={v => set("hvac_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{HVAC_TYPE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Property Condition</Label>
              <Select value={data.property_condition} onValueChange={v => set("property_condition", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{PROPERTY_CONDITION_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Zoning</Label><Input value={data.zoning} onChange={e => set("zoning", e.target.value)} /></div>
          <div>
            <Label>Amenities</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map(a => (
                <Badge key={a} variant={data.amenities.includes(a) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleAmenity(a)}>{a}</Badge>
              ))}
            </div>
          </div>
          <div><Label>Recent Renovations</Label><Textarea value={data.recent_renovations} onChange={e => set("recent_renovations", e.target.value)} placeholder="Describe any recent upgrades" /></div>
          <div><Label>Description</Label><Textarea value={data.description} onChange={e => set("description", e.target.value)} placeholder="General property description" /></div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </div>
  );
}
