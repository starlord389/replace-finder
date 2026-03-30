import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import StepLocation from "@/components/request/StepLocation";
import StepClassification from "@/components/request/StepClassification";
import StepPhysical from "@/components/request/StepPhysical";
import StepFinancials from "@/components/request/StepFinancials";
import StepDebtEquity from "@/components/request/StepDebtEquity";
import StepCriteria from "@/components/request/StepCriteria";
import StepPhotos, { type UploadedImage } from "@/components/request/StepPhotos";
import StepReview from "@/components/request/StepReview";
import { type RequestFormData, INITIAL_FORM } from "@/lib/requestFormTypes";
import type { Enums } from "@/integrations/supabase/types";

const STEPS = [
  { label: "Location", number: 1 },
  { label: "Classification", number: 2 },
  { label: "Physical", number: 3 },
  { label: "Financials", number: 4 },
  { label: "Debt & Equity", number: 5 },
  { label: "Criteria", number: 6 },
  { label: "Photos", number: 7 },
  { label: "Review", number: 8 },
];

// Validation per step — returns list of missing field labels
function validateStep(step: number, form: RequestFormData): string[] {
  const missing: string[] = [];
  const req = (v: string | undefined, label: string) => { if (!v) missing.push(label); };
  const isUnitBased = ["multifamily", "self_storage", "hospitality"].includes(form.relinquished_asset_type);

  switch (step) {
    case 1:
      req(form.property_name, "Property Name");
      req(form.relinquished_address, "Street Address");
      req(form.relinquished_city, "City");
      req(form.relinquished_state, "State");
      req(form.relinquished_zip, "ZIP Code");
      break;
    case 2:
      req(form.relinquished_asset_type, "Asset Type");
      req(form.target_strategy, "Investment Strategy");
      break;
    case 3:
      if (isUnitBased) req(form.units, "Total Units");
      else req(form.building_square_footage, "Building Square Footage");
      req(form.year_built, "Year Built");
      break;
    case 4:
      req(form.relinquished_estimated_value, "Estimated Value");
      req(form.current_noi, "Current NOI");
      req(form.current_occupancy_rate, "Occupancy Rate");
      break;
    case 5:
      req(form.exchange_proceeds, "Exchange Proceeds");
      req(form.estimated_equity, "Estimated Equity");
      break;
    case 6:
      if (form.target_asset_types.length === 0) missing.push("Target Asset Types");
      if (form.target_states.length === 0) missing.push("Target States");
      req(form.target_price_min, "Target Price Min");
      req(form.target_price_max, "Target Price Max");
      req(form.urgency, "Urgency");
      break;
  }
  return missing;
}

function getAllMissingRequired(form: RequestFormData): string[] {
  return [1, 2, 3, 4, 5, 6].flatMap((s) => validateStep(s, form));
}

export default function NewRequest() {
  const { id: editId } = useParams<{ id: string }>();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RequestFormData>(INITIAL_FORM);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editId);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Unsaved changes warning
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Load existing request when editing
  useEffect(() => {
    if (!editId || !user) return;
    (async () => {
      const [reqRes, prefRes, imgRes] = await Promise.all([
        supabase.from("exchange_requests").select("*").eq("id", editId).eq("user_id", user.id).single(),
        supabase.from("exchange_request_preferences").select("*").eq("request_id", editId).maybeSingle(),
        supabase.from("request_images").select("*").eq("request_id", editId).eq("user_id", user.id).order("sort_order"),
      ]);

      if (!reqRes.data) {
        toast({ title: "Not found", description: "Exchange request not found.", variant: "destructive" });
        navigate("/dashboard/exchanges");
        return;
      }

      const r = reqRes.data as any;
      const p = prefRes.data as any;

      setExistingStatus(r.status);
      setForm({
        property_name: r.property_name ?? "",
        relinquished_address: r.relinquished_address ?? "",
        unit_suite: r.unit_suite ?? "",
        relinquished_city: r.relinquished_city ?? "",
        relinquished_state: r.relinquished_state ?? "",
        relinquished_zip: r.relinquished_zip ?? "",
        county: r.county ?? "",
        relinquished_asset_type: r.relinquished_asset_type ?? "",
        asset_subtype: r.asset_subtype ?? "",
        target_strategy: r.sale_timeline ?? "", // mapped from sale_timeline historically
        property_class: r.property_class ?? "",
        units: r.relinquished_estimated_value ? "" : "", // units not stored previously
        building_square_footage: r.building_square_footage?.toString() ?? "",
        year_built: "", // not stored on exchange_requests previously
        land_area_acres: r.land_area_acres?.toString() ?? "",
        num_buildings: r.num_buildings?.toString() ?? "",
        num_stories: r.num_stories?.toString() ?? "",
        parking_spaces: r.parking_spaces?.toString() ?? "",
        parking_type: r.parking_type ?? "",
        zoning: r.zoning ?? "",
        construction_type: r.construction_type ?? "",
        roof_type: r.roof_type ?? "",
        hvac_type: r.hvac_type ?? "",
        property_condition: r.property_condition ?? "",
        recent_renovations: r.recent_renovations ?? "",
        amenities: (r.amenities as string[]) ?? [],
        relinquished_description: r.relinquished_description ?? "",
        relinquished_estimated_value: r.relinquished_estimated_value?.toString() ?? "",
        current_noi: r.current_noi?.toString() ?? "",
        current_occupancy_rate: r.current_occupancy_rate?.toString() ?? "",
        gross_scheduled_income: r.gross_scheduled_income?.toString() ?? "",
        effective_gross_income: r.effective_gross_income?.toString() ?? "",
        real_estate_taxes: r.real_estate_taxes?.toString() ?? "",
        insurance: r.insurance?.toString() ?? "",
        utilities: r.utilities?.toString() ?? "",
        management_fee: r.management_fee?.toString() ?? "",
        maintenance_repairs: r.maintenance_repairs?.toString() ?? "",
        capex_reserves: r.capex_reserves?.toString() ?? "",
        other_expenses: r.other_expenses?.toString() ?? "",
        current_cap_rate: r.current_cap_rate?.toString() ?? "",
        average_rent_per_unit: r.average_rent_per_unit?.toString() ?? "",
        exchange_proceeds: r.exchange_proceeds?.toString() ?? "",
        estimated_equity: r.estimated_equity?.toString() ?? "",
        estimated_debt: r.estimated_debt?.toString() ?? "",
        estimated_basis: r.estimated_basis?.toString() ?? "",
        current_loan_balance: r.current_loan_balance?.toString() ?? "",
        current_interest_rate: r.current_interest_rate?.toString() ?? "",
        loan_type: r.loan_type ?? "",
        loan_maturity_date: r.loan_maturity_date ?? "",
        annual_debt_service: r.annual_debt_service?.toString() ?? "",
        has_prepayment_penalty: r.has_prepayment_penalty ?? false,
        prepayment_penalty_details: r.prepayment_penalty_details ?? "",
        target_asset_types: (p?.target_asset_types as Enums<"asset_type">[]) ?? [],
        target_states: (p?.target_states as string[]) ?? [],
        target_price_min: p?.target_price_min?.toString() ?? "",
        target_price_max: p?.target_price_max?.toString() ?? "",
        target_metros: p?.target_metros?.join(", ") ?? "",
        target_strategies: (p?.target_strategies as Enums<"strategy_type">[]) ?? [],
        target_cap_rate_min: p?.target_cap_rate_min?.toString() ?? "",
        target_cap_rate_max: p?.target_cap_rate_max?.toString() ?? "",
        target_occupancy_min: p?.target_occupancy_min?.toString() ?? "",
        target_year_built_min: p?.target_year_built_min?.toString() ?? "",
        target_property_classes: (p?.target_property_classes as string[]) ?? [],
        identification_deadline: r.identification_deadline ?? "",
        close_deadline: r.close_deadline ?? "",
        open_to_dsts: p?.open_to_dsts ?? false,
        open_to_tics: p?.open_to_tics ?? false,
        urgency: r.urgency ?? "",
        additional_notes: p?.additional_notes ?? "",
      });

      // Load images
      if (imgRes.data) {
        setImages(imgRes.data.map((img: any) => ({
          id: img.id,
          storage_path: img.storage_path,
          file_name: img.file_name ?? "",
          sort_order: img.sort_order ?? 0,
          url: supabase.storage.from("request-images").getPublicUrl(img.storage_path).data.publicUrl,
        })));
      }

      setLoading(false);
    })();
  }, [editId, user]);

  const update = useCallback((partial: Partial<RequestFormData>) => {
    setForm((prev) => ({ ...prev, ...partial }));
    setDirty(true);
    setStepErrors([]);
  }, []);

  const toNum = (v: string) => (v ? Number(v) : null);
  const toInt = (v: string) => (v ? parseInt(v, 10) : null);

  const buildRequestPayload = () => ({
    property_name: form.property_name || null,
    relinquished_address: form.relinquished_address || null,
    unit_suite: form.unit_suite || null,
    relinquished_city: form.relinquished_city || null,
    relinquished_state: form.relinquished_state || null,
    relinquished_zip: form.relinquished_zip || null,
    county: form.county || null,
    relinquished_asset_type: form.relinquished_asset_type || null,
    asset_subtype: form.asset_subtype || null,
    property_class: form.property_class || null,
    building_square_footage: toNum(form.building_square_footage),
    land_area_acres: toNum(form.land_area_acres),
    num_buildings: toInt(form.num_buildings),
    num_stories: toInt(form.num_stories),
    parking_spaces: toInt(form.parking_spaces),
    parking_type: form.parking_type || null,
    zoning: form.zoning || null,
    construction_type: form.construction_type || null,
    roof_type: form.roof_type || null,
    hvac_type: form.hvac_type || null,
    property_condition: form.property_condition || null,
    recent_renovations: form.recent_renovations || null,
    amenities: form.amenities.length ? form.amenities : null,
    relinquished_description: form.relinquished_description || null,
    relinquished_estimated_value: toNum(form.relinquished_estimated_value),
    current_noi: toNum(form.current_noi),
    current_occupancy_rate: toNum(form.current_occupancy_rate),
    gross_scheduled_income: toNum(form.gross_scheduled_income),
    effective_gross_income: toNum(form.effective_gross_income),
    real_estate_taxes: toNum(form.real_estate_taxes),
    insurance: toNum(form.insurance),
    utilities: toNum(form.utilities),
    management_fee: toNum(form.management_fee),
    maintenance_repairs: toNum(form.maintenance_repairs),
    capex_reserves: toNum(form.capex_reserves),
    other_expenses: toNum(form.other_expenses),
    current_cap_rate: toNum(form.current_cap_rate),
    average_rent_per_unit: toNum(form.average_rent_per_unit),
    exchange_proceeds: toNum(form.exchange_proceeds),
    estimated_equity: toNum(form.estimated_equity),
    estimated_debt: toNum(form.estimated_debt),
    estimated_basis: toNum(form.estimated_basis),
    current_loan_balance: toNum(form.current_loan_balance),
    current_interest_rate: toNum(form.current_interest_rate),
    loan_type: form.loan_type || null,
    loan_maturity_date: form.loan_maturity_date || null,
    annual_debt_service: toNum(form.annual_debt_service),
    has_prepayment_penalty: form.has_prepayment_penalty,
    prepayment_penalty_details: form.prepayment_penalty_details || null,
    sale_timeline: form.target_strategy || null,
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
    target_occupancy_min: toNum(form.target_occupancy_min),
    target_year_built_min: toInt(form.target_year_built_min),
    target_property_classes: form.target_property_classes.length ? form.target_property_classes : null,
    open_to_dsts: form.open_to_dsts,
    open_to_tics: form.open_to_tics,
    additional_notes: form.additional_notes || null,
  });

  const saveImages = async (requestId: string) => {
    if (!user) return;
    // Delete existing then insert all (simple approach)
    await supabase.from("request_images").delete().eq("request_id", requestId).eq("user_id", user.id);
    if (images.length > 0) {
      await supabase.from("request_images").insert(
        images.map((img, idx) => ({
          request_id: requestId,
          user_id: user.id,
          storage_path: img.storage_path,
          file_name: img.file_name,
          sort_order: idx,
        }))
      );
    }
  };

  const saveOrSubmit = async (status: "draft" | "submitted") => {
    if (!user) return;
    const isDraft = status === "draft";
    isDraft ? setSaving(true) : setSubmitting(true);

    let requestId = editId;

    if (editId) {
      const { error } = await supabase
        .from("exchange_requests")
        .update({ ...buildRequestPayload(), status } as any)
        .eq("id", editId)
        .eq("user_id", user.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        isDraft ? setSaving(false) : setSubmitting(false);
        return;
      }

      const prefsPayload = buildPrefsPayload(editId);
      const { data: existingPref } = await supabase
        .from("exchange_request_preferences")
        .select("id")
        .eq("request_id", editId)
        .maybeSingle();

      if (existingPref) {
        await supabase.from("exchange_request_preferences").update(prefsPayload as any).eq("request_id", editId);
      } else {
        await supabase.from("exchange_request_preferences").insert(prefsPayload as any);
      }
    } else {
      const { data: req, error: reqErr } = await supabase
        .from("exchange_requests")
        .insert({ ...buildRequestPayload(), user_id: user.id, status } as any)
        .select("id")
        .single();

      if (reqErr || !req) {
        toast({ title: "Error", description: reqErr?.message ?? "Failed to create request", variant: "destructive" });
        isDraft ? setSaving(false) : setSubmitting(false);
        return;
      }

      requestId = req.id;
      await supabase.from("exchange_request_preferences").insert(buildPrefsPayload(req.id) as any);
    }

    // Save images
    if (requestId) await saveImages(requestId);

    setDirty(false);
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

  const tryNext = () => {
    const errors = validateStep(step, form);
    if (errors.length > 0) {
      setStepErrors(errors);
      toast({ title: "Required fields missing", description: errors.join(", "), variant: "destructive" });
      return;
    }
    setStepErrors([]);
    setStep((s) => s + 1);
  };

  const isEditing = !!editId;
  const pageTitle = isEditing ? "Edit Exchange Request" : "New Exchange Request";
  const pageDesc = isEditing
    ? "Update your exchange details and re-submit when ready."
    : "Tell us about your exchange so we can find replacement properties.";

  const missingRequired = getAllMissingRequired(form);

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
      <div className="mt-8 flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s) => (
          <div key={s.number} className="flex shrink-0 items-center gap-1">
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
            {s.number < STEPS.length && <div className="mx-1 h-px w-4 bg-border sm:w-6" />}
          </div>
        ))}
      </div>

      {/* Step errors */}
      {stepErrors.length > 0 && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Please fill in: {stepErrors.join(", ")}
        </div>
      )}

      {/* Step content */}
      <div className="mt-6 rounded-xl border bg-card p-6 sm:p-8">
        {step === 1 && <StepLocation form={form} update={update} />}
        {step === 2 && <StepClassification form={form} update={update} />}
        {step === 3 && <StepPhysical form={form} update={update} />}
        {step === 4 && <StepFinancials form={form} update={update} />}
        {step === 5 && <StepDebtEquity form={form} update={update} />}
        {step === 6 && <StepCriteria form={form} update={update} />}
        {step === 7 && <StepPhotos requestId={editId} images={images} setImages={(imgs) => { setImages(imgs); setDirty(true); }} />}
        {step === 8 && <StepReview form={form} images={images} missingRequired={missingRequired} />}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => { setStepErrors([]); setStep((s) => s - 1); }} disabled={step === 1} className="gap-2">
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
          {step < 8 ? (
            <Button onClick={tryNext} className="gap-2">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => saveOrSubmit("submitted")}
              disabled={submitting || saving || missingRequired.length > 0}
              className="gap-2"
            >
              {submitting ? "Submitting…" : isEditing && existingStatus === "active" ? "Re-submit" : "Submit Request"}{" "}
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
