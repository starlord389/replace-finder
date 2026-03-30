import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ASSET_TYPE_LABELS, ASSET_SUBTYPE_MAP, STRATEGY_TYPE_LABELS, PROPERTY_CLASS_OPTIONS } from "@/lib/constants";
import type { RequestFormData } from "@/lib/requestFormTypes";
import type { Enums } from "@/integrations/supabase/types";

interface Props {
  form: RequestFormData;
  update: (partial: Partial<RequestFormData>) => void;
}

export default function StepClassification({ form, update }: Props) {
  const subtypes = form.relinquished_asset_type
    ? ASSET_SUBTYPE_MAP[form.relinquished_asset_type] ?? []
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Property Classification</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Categorize the property type and investment strategy.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Asset Type <span className="text-destructive">*</span></Label>
          <Select
            value={form.relinquished_asset_type || undefined}
            onValueChange={(v) => update({ relinquished_asset_type: v as Enums<"asset_type">, asset_subtype: "" })}
          >
            <SelectTrigger><SelectValue placeholder="Select asset type" /></SelectTrigger>
            <SelectContent>
              {Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Asset Subtype</Label>
          <Select
            value={form.asset_subtype || undefined}
            onValueChange={(v) => update({ asset_subtype: v })}
            disabled={subtypes.length === 0}
          >
            <SelectTrigger><SelectValue placeholder={subtypes.length ? "Select subtype" : "Select asset type first"} /></SelectTrigger>
            <SelectContent>
              {subtypes.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Investment Strategy <span className="text-destructive">*</span></Label>
          <Select
            value={form.target_strategy || undefined}
            onValueChange={(v) => update({ target_strategy: v as Enums<"strategy_type"> })}
          >
            <SelectTrigger><SelectValue placeholder="Select strategy" /></SelectTrigger>
            <SelectContent>
              {Object.entries(STRATEGY_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Property Class</Label>
          <Select
            value={form.property_class || undefined}
            onValueChange={(v) => update({ property_class: v })}
          >
            <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>
              {PROPERTY_CLASS_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
