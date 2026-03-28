import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ASSET_TYPE_LABELS, STRATEGY_TYPE_LABELS } from "@/lib/constants";
import type { RequestFormData } from "@/pages/client/NewRequest";
import type { Enums } from "@/integrations/supabase/types";

interface Props {
  form: RequestFormData;
  update: (partial: Partial<RequestFormData>) => void;
}

export default function StepGoals({ form, update }: Props) {
  const toggleAsset = (t: Enums<"asset_type">) => {
    const current = form.target_asset_types;
    update({
      target_asset_types: current.includes(t) ? current.filter((x) => x !== t) : [...current, t],
    });
  };

  const toggleStrategy = (s: Enums<"strategy_type">) => {
    const current = form.target_strategies;
    update({
      target_strategies: current.includes(s) ? current.filter((x) => x !== s) : [...current, s],
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Replacement Property Goals</h2>
        <p className="mt-1 text-sm text-muted-foreground">What are you looking for in a replacement property?</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Target Price Min ($)</Label>
          <Input type="number" placeholder="1,500,000" value={form.target_price_min} onChange={(e) => update({ target_price_min: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Target Price Max ($)</Label>
          <Input type="number" placeholder="5,000,000" value={form.target_price_max} onChange={(e) => update({ target_price_max: e.target.value })} />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Target Asset Types</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => (
            <label key={k} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors">
              <Checkbox
                checked={form.target_asset_types.includes(k as Enums<"asset_type">)}
                onCheckedChange={() => toggleAsset(k as Enums<"asset_type">)}
              />
              {v}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Target Strategies</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(STRATEGY_TYPE_LABELS).map(([k, v]) => (
            <label key={k} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors">
              <Checkbox
                checked={form.target_strategies.includes(k as Enums<"strategy_type">)}
                onCheckedChange={() => toggleStrategy(k as Enums<"strategy_type">)}
              />
              {v}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Target Cap Rate Min (%)</Label>
          <Input type="number" step="0.1" placeholder="5.0" value={form.target_cap_rate_min} onChange={(e) => update({ target_cap_rate_min: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Target Cap Rate Max (%)</Label>
          <Input type="number" step="0.1" placeholder="8.0" value={form.target_cap_rate_max} onChange={(e) => update({ target_cap_rate_max: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Additional Notes (optional)</Label>
        <Textarea placeholder="Anything else about what you're looking for…" value={form.additional_notes} onChange={(e) => update({ additional_notes: e.target.value })} rows={3} />
      </div>
    </div>
  );
}
