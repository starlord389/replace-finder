import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { US_STATES } from "@/lib/constants";
import type { RequestFormData } from "@/pages/client/NewRequest";

interface Props {
  form: RequestFormData;
  update: (partial: Partial<RequestFormData>) => void;
}

export default function StepGeography({ form, update }: Props) {
  const toggleState = (st: string) => {
    const current = form.target_states;
    update({
      target_states: current.includes(st) ? current.filter((x) => x !== st) : [...current, st],
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Geography Preferences</h2>
        <p className="mt-1 text-sm text-muted-foreground">Where would you like to own replacement property?</p>
      </div>

      <div className="space-y-3">
        <Label>Target States</Label>
        <p className="text-xs text-muted-foreground">Select all states you'd consider.</p>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8">
          {US_STATES.map((st) => (
            <label
              key={st}
              className={`flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                form.target_states.includes(st) ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <Checkbox
                checked={form.target_states.includes(st)}
                onCheckedChange={() => toggleState(st)}
                className="hidden"
              />
              {st}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="metros">Target Metros (optional)</Label>
        <Input
          id="metros"
          placeholder="Dallas, Phoenix, Nashville"
          value={form.target_metros as string}
          onChange={(e) => update({ target_metros: e.target.value as any })}
        />
        <p className="text-xs text-muted-foreground">Comma-separated metro areas or cities.</p>
      </div>
    </div>
  );
}
