import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RequestFormData } from "@/pages/client/NewRequest";

interface Props {
  form: RequestFormData;
  update: (partial: Partial<RequestFormData>) => void;
}

export default function StepEconomics({ form, update }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Exchange Economics</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Help us understand the financial profile of your exchange.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="equity">Estimated Equity ($)</Label>
          <Input id="equity" type="number" placeholder="1,200,000" value={form.estimated_equity} onChange={(e) => update({ estimated_equity: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="debt">Estimated Debt ($)</Label>
          <Input id="debt" type="number" placeholder="1,300,000" value={form.estimated_debt} onChange={(e) => update({ estimated_debt: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="proceeds">Exchange Proceeds ($)</Label>
          <Input id="proceeds" type="number" placeholder="1,200,000" value={form.exchange_proceeds} onChange={(e) => update({ exchange_proceeds: e.target.value })} />
          <p className="text-xs text-muted-foreground">Net proceeds you expect to exchange.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="basis">Estimated Basis ($)</Label>
          <Input id="basis" type="number" placeholder="800,000" value={form.estimated_basis} onChange={(e) => update({ estimated_basis: e.target.value })} />
          <p className="text-xs text-muted-foreground">Your adjusted cost basis in the property.</p>
        </div>
      </div>
    </div>
  );
}
