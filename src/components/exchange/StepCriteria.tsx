import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, X } from "lucide-react";
import { CriteriaData } from "@/lib/exchangeWizardTypes";
import { ASSET_TYPE_LABELS, US_STATES } from "@/lib/constants";
import { Enums } from "@/integrations/supabase/types";
import { useState, KeyboardEvent } from "react";

interface Props {
  data: CriteriaData;
  onChange: (data: CriteriaData) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepCriteria({ data, onChange, onNext, onBack }: Props) {
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [metroInput, setMetroInput] = useState("");

  const set = (field: keyof CriteriaData, value: any) => {
    onChange({ ...data, [field]: value });
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Replacement Preferences (Optional)</h2>
        <p className="text-sm text-muted-foreground">
          You can skip this entire section. Most exchanges don't need it.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
        <p className="text-sm font-medium text-foreground">Why we ask for so little</p>
        <p className="text-sm text-muted-foreground">
          Our matching engine already uses your client's equity to do the heavy lifting. Once we know their exchange proceeds, we only surface properties that:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>Fit within their budget at 75% LTV commercial financing (no cash out of pocket)</li>
          <li>Perform better than what they own today — higher cap rate, higher occupancy, newer construction</li>
          <li>Are currently active in the network and ready to transact</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Only fill out the fields below if your client has a specific preference — like a particular asset type, state, or price ceiling. Otherwise, leave everything blank and we'll bring you the best options.
        </p>
      </div>

      {/* Target Asset Types */}
      <section className="space-y-3">
        <Label>Target Asset Types</Label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ASSET_TYPE_LABELS).map(([k, l]) => (
            <Badge key={k} variant={data.target_asset_types.includes(k as Enums<"asset_type">) ? "default" : "outline"}
              className="cursor-pointer" onClick={() => toggleChip("target_asset_types", k as Enums<"asset_type">)}>{l}</Badge>
          ))}
        </div>
      </section>

      {/* Target States */}
      <section className="space-y-3">
        <Label>Target States</Label>
        <div className="flex flex-wrap gap-1.5">
          {US_STATES.map(s => (
            <Badge key={s} variant={data.target_states.includes(s) ? "default" : "outline"}
              className="cursor-pointer text-xs px-2 py-0.5" onClick={() => toggleChip("target_states", s)}>{s}</Badge>
          ))}
        </div>
      </section>

      {/* Price Range */}
      <section className="space-y-3">
        <Label>Target Price Range</Label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input className="pl-7" placeholder="Min" value={data.target_price_min}
              onChange={e => set("target_price_min", e.target.value.replace(/[^0-9]/g, ""))} />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input className="pl-7" placeholder="Max" value={data.target_price_max}
              onChange={e => set("target_price_max", e.target.value.replace(/[^0-9]/g, ""))} />
          </div>
        </div>
      </section>

      <Collapsible open={optionalOpen} onOpenChange={setOptionalOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className={`h-4 w-4 transition-transform ${optionalOpen ? "rotate-180" : ""}`} /> More Matching Filters
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

          {/* Min Year Built */}
          <div>
            <Label>Min Year Built</Label>
            <Input className="mt-1" type="number" value={data.target_year_built_min} onChange={e => set("target_year_built_min", e.target.value)} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}
