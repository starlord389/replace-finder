import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { WizardState, initialWizardState } from "@/lib/exchangeWizardTypes";
import StepSelectClient from "@/components/exchange/StepSelectClient";
import StepPropertyAndFinancials from "@/components/exchange/StepPropertyAndFinancials";
import StepCriteria from "@/components/exchange/StepCriteria";
import StepReview from "@/components/exchange/StepReview";
import { useUpdateExchange } from "@/features/exchanges/hooks/useUpdateExchange";

const STEPS = ["Client", "Property & Financials", "Criteria", "Review"];
const MOBILE_STEP_LABELS = ["Client", "Property", "Criteria", "Review"];

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
        toast.error("Exchange not found");
        navigate("/agent/exchanges");
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
          city: p?.city ?? "",
          state: p?.state ?? "",
          zip: p?.zip ?? "",
          asset_type: p?.asset_type ?? "",
          year_built: p?.year_built?.toString() ?? "",
          units: p?.units?.toString() ?? "",
          building_square_footage: p?.building_square_footage?.toString() ?? "",
          description: p?.description ?? "",
        },
        financials: {
          asking_price: f?.asking_price?.toString() ?? "",
          noi: f?.noi?.toString() ?? "",
          occupancy_rate: f?.occupancy_rate?.toString() ?? "",
          cap_rate: f?.cap_rate?.toString() ?? "",
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
  }, [id, user, navigate]);

  const handleSubmit = async (primaryAction: boolean) => {
    if (!id) return;
    setSaving(true);

    // Determine intent based on current status & button pressed
    // Draft: secondary=save_draft, primary(true)=publish
    // Active: secondary=move_to_draft, primary(true)=save_active
    let intent: "save_draft" | "publish" | "save_active" | "move_to_draft";
    if (exchangeStatus === "draft") {
      intent = primaryAction ? "publish" : "save_draft";
    } else {
      intent = primaryAction ? "save_active" : "move_to_draft";
    }

    try {
      await updateExchange.mutateAsync({ exchangeId: id, intent, data });
      const messages: Record<typeof intent, string> = {
        save_draft: "Changes saved as draft.",
        publish: "Exchange published — matching queued.",
        save_active: "Changes saved.",
        move_to_draft: "Exchange moved to draft.",
      };
      toast.success(messages[intent]);
      navigate(`/agent/exchanges/${id}`);
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Exchange</h1>
        <p className="text-sm text-muted-foreground">Update details for {clientName || "this exchange"}.</p>
      </div>

      <nav className="flex items-center gap-1">
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = step > stepNum;
          const isCurrent = step === stepNum;
          return (
            <div key={label} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => (isCompleted || stepNum < step + 1) && setStep(stepNum)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors w-full justify-center
                  ${isCurrent ? "bg-primary text-primary-foreground" : isCompleted ? "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer" : "bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer"}`}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : <span>{stepNum}</span>}
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
        <StepCriteria
          data={data.criteria}
          onChange={criteria => setData(d => ({ ...d, criteria }))}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && (
        <StepReview
          data={data}
          clientName={clientName}
          onBack={() => setStep(3)}
          onSubmit={handleSubmit}
          saving={saving}
          mode={reviewMode}
          onCancel={() => navigate(`/agent/exchanges/${id}`)}
        />
      )}
    </div>
  );
}
