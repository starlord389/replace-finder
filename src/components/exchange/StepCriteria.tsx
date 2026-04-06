import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, X } from "lucide-react";
import { CriteriaData } from "@/lib/exchangeWizardTypes";
import { ASSET_TYPE_LABELS, STRATEGY_TYPE_LABELS, US_STATES, PROPERTY_CLASS_OPTIONS, URGENCY_OPTIONS } from "@/lib/constants";
import { Enums } from "@/integrations/supabase/types";
import { useState, KeyboardEvent } from "react";

interface Props {
  data: CriteriaData;
  loanBalance: string;
  onChange: (data: CriteriaData) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepCriteria({ data, loanBalance, onChange, onNext, onBack }: Props) {
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [metroInput, setMetroInput] = useState("");

  const set = (field: keyof CriteriaData, value: any) => {
    onChange({ ...data, [field]: value });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }));
  };

  const toggleChip = <T extends string>(field: keyof CriteriaData, value: T) => {
    const arr = data[field] as T[];
    set(field, arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value]);
  };

  const addMetro = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && metroInput.trim()) {
      e.preventDefault();
      if (!data.target_metros.includes(metroInput.trim())) {
        set("target_metros", [...data.target_metros, metroInput.trim()]);
      }
      setMetroInput("");
    }
  };

  const validate = () => {
    const required: Record<string, boolean> = {
      target_asset_types: data.target_asset_types.length === 0,
      target_states: data.target_states.length === 0,
      target_price_min: !data.target_price_min,
      target_price_max: !data.target_price_max,
      urgency: !data.urgency,
    };
    setErrors(required);
    return !Object.values(required).some(Boolean);
  };

  const handleNext = () => { if (validate()) onNext(); };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Replacement Criteria</h2>
        <p className="text-sm text-muted-foreground">What is the client looking for in a replacement property?</p>
      </div>

      {/* Target Asset Types */}
      <section className="space-y-3">
        <Label className={errors.target_asset_types ? "text-destructive" : ""}>Target Asset Types *</Label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ASSET_TYPE_LABELS).map(([k, l]) => (
            <Badge key={k} variant={data.target_asset_types.includes(k as Enums<"asset_type">) ? "default" : "outline"}
              className="cursor-pointer" onClick={() => toggleChip("target_asset_types", k as Enums<"asset_type">)}>{l}</Badge>
          ))}
        </div>
      </section>

      {/* Target States */}
      <section className="space-y-3">
        <Label className={errors.target_states ? "text-destructive" : ""}>Target States *</Label>
        <div className="flex flex-wrap gap-1.5">
          {US_STATES.map(s => (
            <Badge key={s} variant={data.target_states.includes(s) ? "default" : "outline"}
              className="cursor-pointer text-xs px-2 py-0.5" onClick={() => toggleChip("target_states", s)}>{s}</Badge>
          ))}
        </div>
      </section>

      {/* Price Range */}
      <section className="space-y-3">
        <Label>Target Price Range *</Label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input className={`pl-7 ${errors.target_price_min ? "border-destructive" : ""}`} placeholder="Min" value={data.target_price_min}
              onChange={e => set("target_price_min", e.target.value.replace(/[^0-9]/g, ""))} />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input className={`pl-7 ${errors.target_price_max ? "border-destructive" : ""}`} placeholder="Max" value={data.target_price_max}
              onChange={e => set("target_price_max", e.target.value.replace(/[^0-9]/g, ""))} />
          </div>
        </div>
      </section>

      {/* Urgency */}
      <section className="space-y-3">
        <Label className={errors.urgency ? "text-destructive" : ""}>Urgency *</Label>
        <Select value={data.urgency} onValueChange={v => set("urgency", v)}>
          <SelectTrigger className={errors.urgency ? "border-destructive" : ""}><SelectValue placeholder="Select urgency" /></SelectTrigger>
          <SelectContent>{URGENCY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </section>

      {/* Optional Criteria */}
      <Collapsible open={optionalOpen} onOpenChange={setOptionalOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className={`h-4 w-4 transition-transform ${optionalOpen ? "rotate-180" : ""}`} /> Additional Criteria
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-6">
          {/* Metros */}
          <div>
            <Label>Target Metros / Cities</Label>
            <Input placeholder="Type a city and press Enter" value={metroInput} onChange={e => setMetroInput(e.target.value)} onKeyDown={addMetro} />
            {data.target_metros.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.target_metros.map(m => (
                  <Badge key={m} variant="secondary" className="gap-1">{m}<X className="h-3 w-3 cursor-pointer" onClick={() => set("target_metros", data.target_metros.filter(x => x !== m))} /></Badge>
                ))}
              </div>
            )}
          </div>

          {/* Strategies */}
          <div>
            <Label>Target Strategies</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(STRATEGY_TYPE_LABELS).map(([k, l]) => (
                <Badge key={k} variant={data.target_strategies.includes(k as Enums<"strategy_type">) ? "default" : "outline"}
                  className="cursor-pointer" onClick={() => toggleChip("target_strategies", k as Enums<"strategy_type">)}>{l}</Badge>
              ))}
            </div>
          </div>

          {/* Property Classes */}
          <div>
            <Label>Target Property Classes</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PROPERTY_CLASS_OPTIONS.map(c => (
                <Badge key={c} variant={data.target_property_classes.includes(c) ? "default" : "outline"}
                  className="cursor-pointer" onClick={() => toggleChip("target_property_classes", c)}>{c}</Badge>
              ))}
            </div>
          </div>

          {/* Ranges */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Cap Rate Range (%)</Label>
              <div className="flex gap-2 mt-1">
                <Input placeholder="Min" value={data.target_cap_rate_min} onChange={e => set("target_cap_rate_min", e.target.value.replace(/[^0-9.]/g, ""))} />
                <Input placeholder="Max" value={data.target_cap_rate_max} onChange={e => set("target_cap_rate_max", e.target.value.replace(/[^0-9.]/g, ""))} />
              </div>
            </div>
            <div><Label>Min Occupancy (%)</Label><Input className="mt-1" value={data.target_occupancy_min} onChange={e => set("target_occupancy_min", e.target.value.replace(/[^0-9.]/g, ""))} /></div>
            <div><Label>Min Year Built</Label><Input className="mt-1" type="number" value={data.target_year_built_min} onChange={e => set("target_year_built_min", e.target.value)} /></div>
            <div>
              <Label>Units Range</Label>
              <div className="flex gap-2 mt-1">
                <Input placeholder="Min" value={data.target_units_min} onChange={e => set("target_units_min", e.target.value.replace(/[^0-9]/g, ""))} />
                <Input placeholder="Max" value={data.target_units_max} onChange={e => set("target_units_max", e.target.value.replace(/[^0-9]/g, ""))} />
              </div>
            </div>
            <div>
              <Label>Square Footage Range</Label>
              <div className="flex gap-2 mt-1">
                <Input placeholder="Min" value={data.target_sf_min} onChange={e => set("target_sf_min", e.target.value.replace(/[^0-9]/g, ""))} />
                <Input placeholder="Max" value={data.target_sf_max} onChange={e => set("target_sf_max", e.target.value.replace(/[^0-9]/g, ""))} />
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><Label>Open to DSTs</Label><p className="text-xs text-muted-foreground">Delaware Statutory Trusts — fractional ownership. Good backup identification.</p></div>
              <Switch checked={data.open_to_dsts} onCheckedChange={v => set("open_to_dsts", v)} />
            </div>
            <div className="flex items-center justify-between">
              <div><Label>Open to TICs</Label><p className="text-xs text-muted-foreground">Tenant-in-Common interests</p></div>
              <Switch checked={data.open_to_tics} onCheckedChange={v => set("open_to_tics", v)} />
            </div>
            <div className="flex items-center justify-between">
              <div><Label>Must Replace Debt</Label><p className="text-xs text-muted-foreground">Replacement must have equal or greater debt to avoid mortgage boot.</p></div>
              <Switch checked={data.must_replace_debt} onCheckedChange={v => set("must_replace_debt", v)} />
            </div>
            {data.must_replace_debt && (
              <div className="relative max-w-xs">
                <Label>Minimum Debt to Replace</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input className="pl-7" value={data.min_debt_replacement || loanBalance}
                    onChange={e => set("min_debt_replacement", e.target.value.replace(/[^0-9]/g, ""))} />
                </div>
              </div>
            )}
          </div>

          <div><Label>Additional Notes</Label><Textarea value={data.additional_notes} onChange={e => set("additional_notes", e.target.value)} placeholder="Any additional criteria or preferences" /></div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </div>
  );
}
