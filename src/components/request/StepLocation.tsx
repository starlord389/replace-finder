import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { US_STATES } from "@/lib/constants";
import type { RequestFormData } from "@/lib/requestFormTypes";

interface Props {
  form: RequestFormData;
  update: (partial: Partial<RequestFormData>) => void;
}

export default function StepLocation({ form, update }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Property Location & Identification</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us about the property you're selling (relinquishing) in the exchange.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="property_name">Property Name / Title <span className="text-destructive">*</span></Label>
          <Input id="property_name" placeholder='e.g. "Riverside Apartments"' value={form.property_name} onChange={(e) => update({ property_name: e.target.value })} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Street Address <span className="text-destructive">*</span></Label>
          <Input id="address" placeholder="123 Main St" value={form.relinquished_address} onChange={(e) => update({ relinquished_address: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit_suite">Unit / Suite Number</Label>
          <Input id="unit_suite" placeholder="Suite 200" value={form.unit_suite} onChange={(e) => update({ unit_suite: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
          <Input id="city" placeholder="Austin" value={form.relinquished_city} onChange={(e) => update({ relinquished_city: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
          <Select value={form.relinquished_state} onValueChange={(v) => update({ relinquished_state: v })}>
            <SelectTrigger id="state"><SelectValue placeholder="Select state" /></SelectTrigger>
            <SelectContent>
              {US_STATES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip">ZIP Code <span className="text-destructive">*</span></Label>
          <Input id="zip" placeholder="78701" value={form.relinquished_zip} onChange={(e) => update({ relinquished_zip: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="county">County</Label>
          <Input id="county" placeholder="Travis" value={form.county} onChange={(e) => update({ county: e.target.value })} />
        </div>
      </div>
    </div>
  );
}
