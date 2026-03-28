import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RequestFormData } from "@/pages/client/NewRequest";

interface Props {
  form: RequestFormData;
  update: (partial: Partial<RequestFormData>) => void;
}

export default function StepTiming({ form, update }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Timing & Deadlines</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Help us understand your exchange timeline.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeline">Sale Timeline</Label>
        <select
          id="timeline"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={form.sale_timeline}
          onChange={(e) => update({ sale_timeline: e.target.value })}
        >
          <option value="">Select timeline</option>
          <option value="already_sold">Already sold / in escrow</option>
          <option value="0_30_days">Selling within 30 days</option>
          <option value="30_90_days">Selling in 30–90 days</option>
          <option value="90_plus_days">Selling in 90+ days</option>
          <option value="exploring">Just exploring options</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="idDeadline">45-Day ID Deadline</Label>
          <Input
            id="idDeadline"
            type="date"
            value={form.identification_deadline}
            onChange={(e) => update({ identification_deadline: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">Leave blank if you haven't sold yet.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="closeDeadline">180-Day Close Deadline</Label>
          <Input
            id="closeDeadline"
            type="date"
            value={form.close_deadline}
            onChange={(e) => update({ close_deadline: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="urgency">Urgency</Label>
        <select
          id="urgency"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={form.urgency}
          onChange={(e) => update({ urgency: e.target.value })}
        >
          <option value="">Select urgency</option>
          <option value="critical">Critical — deadlines approaching</option>
          <option value="active">Active — ready to move</option>
          <option value="planning">Planning — exploring options</option>
        </select>
      </div>
    </div>
  );
}
