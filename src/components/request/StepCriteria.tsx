import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ASSET_TYPE_LABELS, STRATEGY_TYPE_LABELS, US_STATES, PROPERTY_CLASS_OPTIONS, URGENCY_OPTIONS } from "@/lib/constants";
import type { RequestFormData } from "@/lib/requestFormTypes";
import type { Enums } from "@/integrations/supabase/types";
import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";

interface Props {
  form: RequestFormData;
  update: (partial: Partial<RequestFormData>) => void;
}

export default function StepCriteria({ form, update }: Props) {
  const [metroInput, setMetroInput] = useState("");

  const metros = form.target_metros
    ? form.target_metros.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const addMetro = () => {
    const trimmed = metroInput.trim();
    if (!trimmed) return;
    const updated = [...metros, trimmed].join(", ");
    update({ target_metros: updated });
    setMetroInput("");
  };

  const removeMetro = (idx: number) => {
    const updated = metros.filter((_, i) => i !== idx).join(", ");
    update({ target_metros: updated });
  };

  const handleMetroKey = (e: KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addMetro(); }
  };

  const toggleArrayItem = <T extends string>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Replacement Property Criteria</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us what you're looking for in a replacement property.
        </p>
      </div>

      {/* Target Asset Types */}
      <div className="space-y-2">
        <Label>Target Asset Types <span className="text-destructive">*</span></Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.target_asset_types.includes(k as Enums<"asset_type">)}
                onCheckedChange={() => update({ target_asset_types: toggleArrayItem(form.target_asset_types, k as Enums<"asset_type">) })}
              />
              {v}
            </label>
          ))}
        </div>
      </div>

      {/* Target States */}
      <div className="space-y-2">
        <Label>Target States <span className="text-destructive">*</span></Label>
        <div className="flex flex-wrap gap-1.5">
          {US_STATES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => update({ target_states: toggleArrayItem(form.target_states, s) })}
              className={`rounded border px-2 py-0.5 text-xs font-medium transition-colors ${
                form.target_states.includes(s)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price_min">Target Price Min ($) <span className="text-destructive">*</span></Label>
          <Input id="price_min" type="number" placeholder="1,000,000" value={form.target_price_min} onChange={(e) => update({ target_price_min: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price_max">Target Price Max ($) <span className="text-destructive">*</span></Label>
          <Input id="price_max" type="number" placeholder="5,000,000" value={form.target_price_max} onChange={(e) => update({ target_price_max: e.target.value })} />
        </div>
      </div>

      {/* Urgency */}
      <div className="space-y-2">
        <Label>Exchange Urgency <span className="text-destructive">*</span></Label>
        <Select value={form.urgency || undefined} onValueChange={(v) => update({ urgency: v })}>
          <SelectTrigger><SelectValue placeholder="Select urgency" /></SelectTrigger>
          <SelectContent>
            {URGENCY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Metros */}
      <div className="space-y-2">
        <Label>Target Metros / Cities</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Type a city and press Enter"
            value={metroInput}
            onChange={(e) => setMetroInput(e.target.value)}
            onKeyDown={handleMetroKey}
          />
        </div>
        {metros.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {metros.map((m, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {m}
                <button type="button" onClick={() => removeMetro(i)}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Target Strategies */}
      <div className="space-y-2">
        <Label>Target Strategies</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(STRATEGY_TYPE_LABELS).map(([k, v]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.target_strategies.includes(k as Enums<"strategy_type">)}
                onCheckedChange={() => update({ target_strategies: toggleArrayItem(form.target_strategies, k as Enums<"strategy_type">) })}
              />
              {v}
            </label>
          ))}
        </div>
      </div>

      {/* Optional numeric targets */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cap_min">Target Cap Rate Min (%)</Label>
          <Input id="cap_min" type="number" step="0.1" placeholder="5.0" value={form.target_cap_rate_min} onChange={(e) => update({ target_cap_rate_min: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cap_max">Target Cap Rate Max (%)</Label>
          <Input id="cap_max" type="number" step="0.1" placeholder="8.0" value={form.target_cap_rate_max} onChange={(e) => update({ target_cap_rate_max: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="occ_min">Target Occupancy Min (%)</Label>
          <Input id="occ_min" type="number" step="1" placeholder="90" value={form.target_occupancy_min} onChange={(e) => update({ target_occupancy_min: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="yb_min">Target Year Built Min</Label>
          <Input id="yb_min" type="number" placeholder="2000" value={form.target_year_built_min} onChange={(e) => update({ target_year_built_min: e.target.value })} />
        </div>
      </div>

      {/* Target Property Classes */}
      <div className="space-y-2">
        <Label>Target Property Classes</Label>
        <div className="flex gap-3">
          {PROPERTY_CLASS_OPTIONS.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.target_property_classes.includes(c)}
                onCheckedChange={() => update({ target_property_classes: toggleArrayItem(form.target_property_classes, c) })}
              />
              {c}
            </label>
          ))}
        </div>
      </div>

      {/* Deadlines */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="id_deadline">Identification Deadline</Label>
          <Input id="id_deadline" type="date" value={form.identification_deadline} onChange={(e) => update({ identification_deadline: e.target.value })} />
          <p className="text-xs text-muted-foreground">45-day ID period end date.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="close_dl">Close Deadline</Label>
          <Input id="close_dl" type="date" value={form.close_deadline} onChange={(e) => update({ close_deadline: e.target.value })} />
          <p className="text-xs text-muted-foreground">180-day exchange period end date.</p>
        </div>
      </div>

      {/* DST/TIC */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
        <div className="flex items-center gap-3">
          <Switch id="dsts" checked={form.open_to_dsts} onCheckedChange={(v) => update({ open_to_dsts: v })} />
          <Label htmlFor="dsts">Open to DSTs?</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch id="tics" checked={form.open_to_tics} onCheckedChange={(v) => update({ open_to_tics: v })} />
          <Label htmlFor="tics">Open to TICs?</Label>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes / Requirements</Label>
        <Textarea id="notes" placeholder="Deal-breakers, preferences, special requirements…" value={form.additional_notes} onChange={(e) => update({ additional_notes: e.target.value })} />
      </div>
    </div>
  );
}
