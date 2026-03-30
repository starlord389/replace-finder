import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import StepRelinquished from "@/components/request/StepRelinquished";
import StepEconomics from "@/components/request/StepEconomics";
import StepGoals from "@/components/request/StepGoals";
import StepGeography from "@/components/request/StepGeography";
import StepTiming from "@/components/request/StepTiming";
import StepReview from "@/components/request/StepReview";
import type { Enums } from "@/integrations/supabase/types";

export interface RequestFormData {
  // Relinquished
  relinquished_address: string;
  relinquished_city: string;
  relinquished_state: string;
  relinquished_zip: string;
  relinquished_asset_type: Enums<"asset_type"> | "";
  relinquished_estimated_value: string;
  relinquished_description: string;
  // Economics
  estimated_equity: string;
  estimated_debt: string;
  exchange_proceeds: string;
  estimated_basis: string;
  // Goals
  target_price_min: string;
  target_price_max: string;
  target_asset_types: Enums<"asset_type">[];
  target_strategies: Enums<"strategy_type">[];
  target_cap_rate_min: string;
  target_cap_rate_max: string;
  additional_notes: string;
  // Geography
  target_states: string[];
  target_metros: string;
  // Timing
  sale_timeline: string;
  identification_deadline: string;
  close_deadline: string;
  urgency: string;
}

const INITIAL: RequestFormData = {
  relinquished_address: "",
  relinquished_city: "",
  relinquished_state: "",
  relinquished_zip: "",
  relinquished_asset_type: "",
  relinquished_estimated_value: "",
  relinquished_description: "",
  estimated_equity: "",
  estimated_debt: "",
  exchange_proceeds: "",
  estimated_basis: "",
  target_price_min: "",
  target_price_max: "",
  target_asset_types: [],
  target_strategies: [],
  target_cap_rate_min: "",
  target_cap_rate_max: "",
  additional_notes: "",
  target_states: [],
  target_metros: "",
  sale_timeline: "",
  identification_deadline: "",
  close_deadline: "",
  urgency: "",
};

const STEPS = [
  { label: "Property", number: 1 },
  { label: "Economics", number: 2 },
  { label: "Goals", number: 3 },
  { label: "Geography", number: 4 },
  { label: "Timing", number: 5 },
  { label: "Review", number: 6 },
];

export default function NewRequest() {
  const { id: editId } = useParams<{ id: string }>();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RequestFormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editId);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load existing request when editing
  useEffect(() => {
    if (!editId || !user) return;
    (async () => {
      const [reqRes, prefRes] = await Promise.all([
        supabase.from("exchange_requests").select("*").eq("id", editId).eq("user_id", user.id).single(),
        supabase.from("exchange_request_preferences").select("*").eq("request_id", editId).maybeSingle(),
      ]);

      if (!reqRes.data) {
        toast({ title: "Not found", description: "Exchange request not found.", variant: "destructive" });
        navigate("/dashboard/exchanges");
        return;
      }

      const r = reqRes.data;
      const p = prefRes.data;

      setExistingStatus(r.status);
      setForm({
        relinquished_address: r.relinquished_address ?? "",
        relinquished_city: r.relinquished_city ?? "",
        relinquished_state: r.relinquished_state ?? "",
        relinquished_zip: r.relinquished_zip ?? "",
        relinquished_asset_type: r.relinquished_asset_type ?? "",
        relinquished_estimated_value: r.relinquished_estimated_value?.toString() ?? "",
        relinquished_description: r.relinquished_description ?? "",
        estimated_equity: r.estimated_equity?.toString() ?? "",
        estimated_debt: r.estimated_debt?.toString() ?? "",
        exchange_proceeds: r.exchange_proceeds?.toString() ?? "",
        estimated_basis: r.estimated_basis?.toString() ?? "",
        target_price_min: p?.target_price_min?.toString() ?? "",
        target_price_max: p?.target_price_max?.toString() ?? "",
        target_asset_types: (p?.target_asset_types as Enums<"asset_type">[]) ?? [],
        target_strategies: (p?.target_strategies as Enums<"strategy_type">[]) ?? [],
        target_cap_rate_min: p?.target_cap_rate_min?.toString() ?? "",
        target_cap_rate_max: p?.target_cap_rate_max?.toString() ?? "",
        additional_notes: p?.additional_notes ?? "",
        target_states: (p?.target_states as string[]) ?? [],
        target_metros: p?.target_metros?.join(", ") ?? "",
        sale_timeline: r.sale_timeline ?? "",
        identification_deadline: r.identification_deadline ?? "",
        close_deadline: r.close_deadline ?? "",
        urgency: r.urgency ?? "",
      });
      setLoading(false);
    })();
  }, [editId, user]);

  const update = (partial: Partial<RequestFormData>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const toNum = (v: string) => (v ? Number(v) : null);

  const buildRequestPayload = () => ({
    relinquished_address: form.relinquished_address || null,
    relinquished_city: form.relinquished_city || null,
    relinquished_state: form.relinquished_state || null,
    relinquished_zip: form.relinquished_zip || null,
    relinquished_asset_type: form.relinquished_asset_type || null,
    relinquished_estimated_value: toNum(form.relinquished_estimated_value),
    relinquished_description: form.relinquished_description || null,
    estimated_equity: toNum(form.estimated_equity),
    estimated_debt: toNum(form.estimated_debt),
    exchange_proceeds: toNum(form.exchange_proceeds),
    estimated_basis: toNum(form.estimated_basis),
    sale_timeline: form.sale_timeline || null,
    identification_deadline: form.identification_deadline || null,
    close_deadline: form.close_deadline || null,
    urgency: form.urgency || null,
  });

  const buildPrefsPayload = (requestId: string) => ({
    request_id: requestId,
    target_price_min: toNum(form.target_price_min),
    target_price_max: toNum(form.target_price_max),
    target_asset_types: form.target_asset_types.length ? form.target_asset_types : null,
    target_strategies: form.target_strategies.length ? form.target_strategies : null,
    target_states: form.target_states.length ? form.target_states : null,
    target_metros: form.target_metros ? form.target_metros.split(",").map((s: string) => s.trim()).filter(Boolean) : null,
    target_cap_rate_min: toNum(form.target_cap_rate_min),
    target_cap_rate_max: toNum(form.target_cap_rate_max),
    additional_notes: form.additional_notes || null,
  });

  const saveOrSubmit = async (status: "draft" | "submitted") => {
    if (!user) return;
    const isDraft = status === "draft";
    isDraft ? setSaving(true) : setSubmitting(true);

    let requestId = editId;

    if (editId) {
      // Update existing request
      const { error } = await supabase
        .from("exchange_requests")
        .update({ ...buildRequestPayload(), status })
        .eq("id", editId)
        .eq("user_id", user.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        isDraft ? setSaving(false) : setSubmitting(false);
        return;
      }

      // Upsert preferences
      const prefsPayload = buildPrefsPayload(editId);
      const { data: existingPref } = await supabase
        .from("exchange_request_preferences")
        .select("id")
        .eq("request_id", editId)
        .maybeSingle();

      if (existingPref) {
        await supabase.from("exchange_request_preferences").update(prefsPayload).eq("request_id", editId);
      } else {
        await supabase.from("exchange_request_preferences").insert(prefsPayload);
      }
    } else {
      // Create new request
      const { data: req, error: reqErr } = await supabase
        .from("exchange_requests")
        .insert({ ...buildRequestPayload(), user_id: user.id, status })
        .select("id")
        .single();

      if (reqErr || !req) {
        toast({ title: "Error", description: reqErr?.message ?? "Failed to create request", variant: "destructive" });
        isDraft ? setSaving(false) : setSubmitting(false);
        return;
      }

      requestId = req.id;
      await supabase.from("exchange_request_preferences").insert(buildPrefsPayload(req.id));
    }

    isDraft ? setSaving(false) : setSubmitting(false);

    if (isDraft) {
      toast({ title: "Draft saved", description: "Your exchange request has been saved as a draft." });
      navigate("/dashboard/exchanges");
    } else {
      toast({
        title: editId && existingStatus === "active" ? "Request re-submitted" : "Request submitted",
        description: editId && existingStatus === "active"
          ? "Your request has been re-submitted for review."
          : "We'll review your exchange request and begin matching.",
      });
      navigate("/dashboard/exchanges");
    }
  };

  const isEditing = !!editId;
  const pageTitle = isEditing ? "Edit Exchange Request" : "New Exchange Request";
  const pageDesc = isEditing
    ? "Update your exchange details and re-submit when ready."
    : "Tell us about your exchange so we can find replacement properties.";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{pageDesc}</p>

      {/* Step indicator */}
      <div className="mt-8 flex items-center gap-1">
        {STEPS.map((s) => (
          <div key={s.number} className="flex items-center gap-1">
            <button
              onClick={() => s.number < step && setStep(s.number)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                s.number === step
                  ? "bg-primary text-primary-foreground"
                  : s.number < step
                  ? "bg-primary/10 text-primary cursor-pointer"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s.number < step ? <Check className="h-3.5 w-3.5" /> : s.number}
            </button>
            <span className={`hidden text-xs sm:inline ${s.number === step ? "font-medium text-foreground" : "text-muted-foreground"}`}>
              {s.label}
            </span>
            {s.number < STEPS.length && <div className="mx-1 h-px w-4 bg-border sm:w-8" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="mt-8 rounded-xl border bg-card p-6 sm:p-8">
        {step === 1 && <StepRelinquished form={form} update={update} />}
        {step === 2 && <StepEconomics form={form} update={update} />}
        {step === 3 && <StepGoals form={form} update={update} />}
        {step === 4 && <StepGeography form={form} update={update} />}
        {step === 5 && <StepTiming form={form} update={update} />}
        {step === 6 && <StepReview form={form} />}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 1} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => saveOrSubmit("draft")}
            disabled={saving || submitting}
            className="gap-2"
          >
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Draft"}
          </Button>
          {step < 6 ? (
            <Button onClick={() => setStep((s) => s + 1)} className="gap-2">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => saveOrSubmit("submitted")} disabled={submitting || saving} className="gap-2">
              {submitting ? "Submitting…" : isEditing && existingStatus === "active" ? "Re-submit" : "Submit Request"}{" "}
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
