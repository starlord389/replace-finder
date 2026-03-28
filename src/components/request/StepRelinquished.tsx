import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ASSET_TYPE_LABELS } from "@/lib/constants";
import type { RequestFormData } from "@/pages/client/NewRequest";
import type { Enums } from "@/integrations/supabase/types";
import { US_STATES } from "@/lib/constants";

interface Props {
  form: RequestFormData;
  update: (partial: Partial<RequestFormData>) => void;
}

export default function StepRelinquished({ form, update }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Relinquished Property</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tell us about the property you may sell.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Street Address</Label>
          <Input id="address" placeholder="123 Main St" value={form.relinquished_address} onChange={(e) => update({ relinquished_address: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" placeholder="Dallas" value={form.relinquished_city} onChange={(e) => update({ relinquished_city: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <select
              id="state"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.relinquished_state}
              onChange={(e) => update({ relinquished_state: e.target.value })}
            >
              <option value="">Select</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP</Label>
            <Input id="zip" placeholder="75201" value={form.relinquished_zip} onChange={(e) => update({ relinquished_zip: e.target.value })} maxLength={10} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="assetType">Property Type</Label>
          <select
            id="assetType"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={form.relinquished_asset_type}
            onChange={(e) => update({ relinquished_asset_type: e.target.value as Enums<"asset_type"> })}
          >
            <option value="">Select type</option>
            {Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="value">Estimated Value ($)</Label>
          <Input id="value" type="number" placeholder="2,500,000" value={form.relinquished_estimated_value} onChange={(e) => update({ relinquished_estimated_value: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc">Description (optional)</Label>
        <Textarea id="desc" placeholder="Any details about the property…" value={form.relinquished_description} onChange={(e) => update({ relinquished_description: e.target.value })} rows={3} />
      </div>
    </div>
  );
}
