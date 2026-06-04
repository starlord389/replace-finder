import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAppSettings, useUpdateAppSettings } from "@/features/admin/hooks/useAppSettings";

const schema = z.object({
  mortgage_interest_rate: z
    .number({ invalid_type_error: "Enter a number" })
    .min(0, "Must be 0 or greater")
    .max(25, "Must be 25 or less"),
  mortgage_amortization_years: z
    .number({ invalid_type_error: "Enter a number" })
    .int("Must be a whole number")
    .min(1, "Must be at least 1")
    .max(40, "Must be 40 or less"),
});

export default function AdminSettings() {
  const { data, isLoading } = useAppSettings();
  const update = useUpdateAppSettings();

  const [rate, setRate] = useState("");
  const [years, setYears] = useState("");
  const [errors, setErrors] = useState<{ rate?: string; years?: string }>({});

  useEffect(() => {
    if (data) {
      setRate(String(data.mortgage_interest_rate));
      setYears(String(data.mortgage_amortization_years));
    }
  }, [data]);

  const dirty =
    data &&
    (rate !== String(data.mortgage_interest_rate) ||
      years !== String(data.mortgage_amortization_years));

  const handleSave = async () => {
    if (!data) return;
    const parsed = schema.safeParse({
      mortgage_interest_rate: Number(rate),
      mortgage_amortization_years: Number(years),
    });
    if (!parsed.success) {
      const fieldErrors: { rate?: string; years?: string } = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "mortgage_interest_rate") fieldErrors.rate = issue.message;
        if (issue.path[0] === "mortgage_amortization_years") fieldErrors.years = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    try {
      await update.mutateAsync({
        id: data.id,
        mortgage_interest_rate: parsed.data.mortgage_interest_rate,
        mortgage_amortization_years: parsed.data.mortgage_amortization_years,
      });
      toast.success("Settings updated");
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to save settings");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">Global configuration used across the platform.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Mortgage Assumptions</CardTitle>
          <CardDescription>
            Used by the matching engine to estimate financing costs on candidate properties.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading || !data ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rate">Interest Rate (%)</Label>
                  <div className="relative">
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      min={0}
                      max={25}
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      className={errors.rate ? "border-destructive pr-7" : "pr-7"}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                  {errors.rate && <p className="text-xs text-destructive">{errors.rate}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="years">Amortization (Years)</Label>
                  <Input
                    id="years"
                    type="number"
                    step="1"
                    min={1}
                    max={40}
                    value={years}
                    onChange={(e) => setYears(e.target.value)}
                    className={errors.years ? "border-destructive" : ""}
                  />
                  {errors.years && <p className="text-xs text-destructive">{errors.years}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <p className="text-xs text-muted-foreground">
                  Last updated {new Date(data.updated_at).toLocaleString()}
                </p>
                <Button onClick={handleSave} disabled={!dirty || update.isPending}>
                  {update.isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
