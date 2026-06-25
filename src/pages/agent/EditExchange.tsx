import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { WizardState, initialWizardState, parseCurrency, annualToMonthlyString } from "@/lib/exchangeWizardTypes";
import StepSelectClient from "@/components/exchange/StepSelectClient";
import StepPropertyAndFinancials from "@/components/exchange/StepPropertyAndFinancials";
import StepReview from "@/components/exchange/StepReview";
import { useUpdateExchange } from "@/features/exchanges/hooks/useUpdateExchange";

// Criteria step removed — see NewExchange.tsx. Existing criteria records are
// still loaded and re-saved untouched so we never wipe legacy preferences.
const STEPS = ["Client", "Property & Financials", "Review"];
const MOBILE_STEP_LABELS = ["Client", "Property", "Review"];

export default function EditExchange() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const updateExchange = useUpdateExchange();

  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardState>(initialWizardState);
  const [clientName, setClientName] = useState("");
  const [exchangeStatus, setExchangeStatus] = useState<string>("draft");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);

      const { data: ex, error: exErr } = await supabase
        .from("exchanges")
        .select("*")
        .eq("id", id)
        .eq("agent_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (exErr || !ex) {
        toast.error("Listing not found");
        navigate("/agent/listings");
        return;
      }

      setExchangeStatus(ex.status);

      const [clientRes, propRes, finRes, critRes, imgRes] = await Promise.all([
        supabase.from("agent_clients").select("client_name").eq("id", ex.client_id).maybeSingle(),
        ex.relinquished_property_id
          ? supabase.from("pledged_properties").select("*").eq("id", ex.relinquished_property_id).maybeSingle()
          : Promise.resolve({ data: null } as const),
        ex.relinquished_property_id
          ? supabase.from("property_financials").select("*").eq("property_id", ex.relinquished_property_id).maybeSingle()
          : Promise.resolve({ data: null } as const),
        ex.criteria_id
          ? supabase.from("replacement_criteria").select("*").eq("id", ex.criteria_id).maybeSingle()
          : Promise.resolve({ data: null } as const),
        ex.relinquished_property_id
          ? supabase.from("property_images").select("*").eq("property_id", ex.relinquished_property_id).order("sort_order")
          : Promise.resolve({ data: [] } as const),
      ]);

      if (cancelled) return;

      const p = (propRes as any).data;
      const f = (finRes as any).data;
      const cr = (critRes as any).data;
      const imgs = ((imgRes as any).data ?? []) as Array<{ storage_path: string; file_name: string | null; sort_order: number }>;

      setClientName((clientRes as any).data?.client_name ?? "");

      const hydrated: WizardState = {
        selectedClientId: ex.client_id,
        property: {
          property_name: p?.property_name ?? "",
          address: p?.address ?? "",
          address_is_public: p?.address_is_public ?? false,
          city: p?.city ?? "",
          state: p?.state ?? "",
          asset_type: p?.asset_type ?? "",
          year_built: p?.year_built?.toString() ?? "",
          units: p?.units?.toString() ?? "",
          building_square_footage: p?.building_square_footage?.toString() ?? "",
          description: p?.description ?? "",
          owner_authorization_confirmed: p?.owner_authorization_confirmed ?? false,
        },
        financials: {
          asking_price: f?.asking_price?.toString() ?? "",
          // Stored annual → shown monthly (÷12); mortgage lives in annual_debt_service.
          gross_rent_roll: annualToMonthlyString(f?.gross_rent_roll),
          total_operating_expenses: annualToMonthlyString(f?.total_operating_expenses),
          monthly_mortgage_payment: annualToMonthlyString(f?.annual_debt_service),
          loan_balance: f?.loan_balance?.toString() ?? "",
        },
        criteria: {
          target_asset_types: cr?.target_asset_types ?? [],
          target_states: cr?.target_states ?? [],
          target_price_min: cr?.target_price_min?.toString() ?? "",
          target_price_max: cr?.target_price_max?.toString() ?? "",
          target_metros: cr?.target_metros ?? [],
          target_year_built_min: cr?.target_year_built_min?.toString() ?? "",
        },
        images: imgs.map((im, i) => {
          const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(im.storage_path);
          return {
            storage_path: im.storage_path,
            file_name: im.file_name ?? "",
            sort_order: im.sort_order ?? i,
            url: urlData.publicUrl,
          };
        }),
      };

      setData(hydrated);
      setLoading(false);
    })();

    return () => { cancelled = true; };
    // Depend on the stable user id, not the whole user object (which gets a new
    // reference on every auth/token-refresh and would silently re-hydrate the
    // form, discarding unsaved edits).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id, navigate]);

  function validatePublish(d: WizardState): { valid: boolean; firstInvalidStep: number; message: string } {
    if (!d.selectedClientId) return { valid: false, firstInvalidStep: 1, message: "Select a client before publishing." };

    const p = d.property;
    if (!p.city.trim() || !p.state || !p.asset_type) {
      return { valid: false, firstInvalidStep: 2, message: "Fill in all required property fields before publishing." };
    }

    const f = d.financials;
    const askingPrice = parseCurrency(f.asking_price);
    if (!f.asking_price || askingPrice === null || askingPrice <= 0) {
      return { valid: false, firstInvalidStep: 2, message: "Asking price is required before publishing." };
    }
    const grossRentRoll = parseCurrency(f.gross_rent_roll);
    if (!f.gross_rent_roll || grossRentRoll === null || grossRentRoll < 0) {
      return { valid: false, firstInvalidStep: 2, message: "Gross rent roll is required before publishing." };
    }
    const totalOpex = parseCurrency(f.total_operating_expenses);
    if (f.total_operating_expenses === "" || totalOpex === null || totalOpex < 0) {
      return { valid: false, firstInvalidStep: 2, message: "Total operating expenses are required before publishing (enter 0 if none)." };
    }
    const loanBalance = parseCurrency(f.loan_balance);
    if (f.loan_balance === "" || loanBalance === null || loanBalance < 0) {
      return { valid: false, firstInvalidStep: 2, message: "Loan balance is required before publishing (enter 0 if free and clear)." };
    }

    if (!d.property.owner_authorization_confirmed) {
      return { valid: false, firstInvalidStep: 3, message: "Confirm you have authorization to market this property before publishing." };
    }

    return { valid: true, firstInvalidStep: 1, message: "" };
  }

  const handleSubmit = async (primaryAction: boolean) => {
    if (!id) return;

    // Determine intent based on current status & button pressed
    // Draft: secondary=save_draft, primary(true)=publish
    // Active: secondary=move_to_draft, primary(true)=save_active
    let intent: "save_draft" | "publish" | "save_active" | "move_to_draft";
    if (exchangeStatus === "draft") {
      intent = primaryAction ? "publish" : "save_draft";
    } else {
      intent = primaryAction ? "save_active" : "move_to_draft";
    }

    if (intent === "publish" || intent === "save_active") {
      const check = validatePublish(data);
      if (!check.valid) {
        toast.error(check.message);
        setStep(check.firstInvalidStep);
        return;
      }
    }

    setSaving(true);
    try {
      await updateExchange.mutateAsync({ exchangeId: id, intent, data });
      const messages: Record<typeof intent, string> = {
        save_draft: "Changes saved as draft.",
        publish: "Exchange published — matching queued.",
        save_active: "Changes saved.",
        move_to_draft: "Exchange moved to draft.",
      };
      toast.success(messages[intent]);
      navigate("/agent/listings");
    } catch (err: any) {
      console.error("Update error:", err);
      toast.error("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  const reviewMode = exchangeStatus === "draft" ? "edit-draft" : "edit-active";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-3">
        <Link
          to="/agent/listings"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to listings
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit listing</h1>
          <p className="text-sm text-muted-foreground">Update details for {clientName || "this listing"}.</p>
        </div>
      </div>

      <nav className="flex items-center gap-1">
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const isCurrent = step === stepNum;
          return (
            <div key={label} className="flex items-center gap-1 flex-1">
              <button
                type="button"
                onClick={() => setStep(stepNum)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors w-full justify-center cursor-pointer
                  ${isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                <span>{stepNum}</span>
                <span className="sm:hidden">{MOBILE_STEP_LABELS[i]}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            </div>
          );
        })}
      </nav>

      {step === 1 && (
        <StepSelectClient
          selectedClientId={data.selectedClientId}
          onChange={() => { /* locked */ }}
          onNext={() => setStep(2)}
          lockedClientName={clientName}
        />
      )}
      {step === 2 && (
        <StepPropertyAndFinancials
          property={data.property}
          financials={data.financials}
          images={data.images}
          onChangeProperty={property => setData(d => ({ ...d, property }))}
          onChangeFinancials={financials => setData(d => ({ ...d, financials }))}
          onChangeImages={images => setData(d => ({ ...d, images }))}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <StepReview
          data={data}
          clientName={clientName}
          onBack={() => setStep(2)}
          onSubmit={handleSubmit}
          saving={saving}
          mode={reviewMode}
          onCancel={() => navigate("/agent/listings")}
          onOwnerAuthorizationChange={v => setData(d => ({ ...d, property: { ...d.property, owner_authorization_confirmed: v } }))}
        />
      )}
    </div>
  );
}
