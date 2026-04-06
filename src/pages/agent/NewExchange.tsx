import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { WizardState, initialWizardState, parseCurrency } from "@/lib/exchangeWizardTypes";
import StepSelectClient from "@/components/exchange/StepSelectClient";
import StepPropertyDetails from "@/components/exchange/StepPropertyDetails";
import StepFinancials from "@/components/exchange/StepFinancials";
import StepCriteria from "@/components/exchange/StepCriteria";
import StepReview from "@/components/exchange/StepReview";
import { Enums } from "@/integrations/supabase/types";

const STEPS = ["Select Client", "Property Details", "Financials", "Criteria", "Review"];

export default function NewExchange() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardState>(initialWizardState);
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState("");

  // resolve client name when selected
  useEffect(() => {
    if (!data.selectedClientId) { setClientName(""); return; }
    supabase.from("agent_clients").select("client_name").eq("id", data.selectedClientId).single()
      .then(({ data: c }) => setClientName(c?.client_name || ""));
  }, [data.selectedClientId]);

  const handleSubmit = async (activate: boolean) => {
    if (!user) return;
    setSaving(true);
    try {
      const p = data.property;
      const f = data.financials;
      const c = data.criteria;

      // 1. Insert pledged_property
      const { data: prop, error: propErr } = await supabase.from("pledged_properties").insert({
        agent_id: user.id,
        property_name: p.property_name || null,
        address: p.address || null,
        unit_suite: p.unit_suite || null,
        city: p.city || null,
        state: p.state || null,
        zip: p.zip || null,
        county: p.county || null,
        asset_type: (p.asset_type || null) as Enums<"asset_type"> | null,
        asset_subtype: p.asset_subtype || null,
        strategy_type: (p.strategy_type || null) as Enums<"strategy_type"> | null,
        property_class: p.property_class || null,
        year_built: p.year_built ? parseInt(p.year_built) : null,
        units: p.units ? parseInt(p.units) : null,
        building_square_footage: p.building_square_footage ? parseFloat(p.building_square_footage) : null,
        land_area_acres: p.land_area_acres ? parseFloat(p.land_area_acres) : null,
        num_buildings: p.num_buildings ? parseInt(p.num_buildings) : null,
        num_stories: p.num_stories ? parseInt(p.num_stories) : null,
        parking_spaces: p.parking_spaces ? parseInt(p.parking_spaces) : null,
        parking_type: p.parking_type || null,
        construction_type: p.construction_type || null,
        roof_type: p.roof_type || null,
        hvac_type: p.hvac_type || null,
        property_condition: p.property_condition || null,
        zoning: p.zoning || null,
        amenities: p.amenities.length > 0 ? p.amenities : null,
        recent_renovations: p.recent_renovations || null,
        description: p.description || null,
        status: activate ? "active" as const : "draft" as const,
        source: "agent_pledge" as const,
        ...(activate ? { listed_at: new Date().toISOString() } : {}),
      }).select("id").single();
      if (propErr) throw propErr;

      // 2. Insert property_financials
      const { error: finErr } = await supabase.from("property_financials").insert({
        property_id: prop.id,
        asking_price: parseCurrency(f.asking_price),
        noi: parseCurrency(f.noi),
        occupancy_rate: parseCurrency(f.occupancy_rate),
        cap_rate: parseCurrency(f.cap_rate),
        gross_scheduled_income: parseCurrency(f.gross_scheduled_income),
        effective_gross_income: parseCurrency(f.effective_gross_income),
        vacancy_rate: parseCurrency(f.vacancy_rate),
        annual_revenue: parseCurrency(f.annual_revenue),
        annual_expenses: parseCurrency(f.annual_expenses),
        real_estate_taxes: parseCurrency(f.real_estate_taxes),
        insurance: parseCurrency(f.insurance),
        utilities: parseCurrency(f.utilities),
        management_fee: parseCurrency(f.management_fee),
        maintenance_repairs: parseCurrency(f.maintenance_repairs),
        capex_reserves: parseCurrency(f.capex_reserves),
        other_expenses: parseCurrency(f.other_expenses),
        average_rent_per_unit: parseCurrency(f.average_rent_per_unit),
        loan_balance: parseCurrency(f.loan_balance),
        loan_rate: parseCurrency(f.loan_rate),
        loan_type: f.loan_type || null,
        loan_maturity_date: f.loan_maturity_date || null,
        annual_debt_service: parseCurrency(f.annual_debt_service),
        has_prepayment_penalty: f.has_prepayment_penalty,
        prepayment_penalty_details: f.prepayment_penalty_details || null,
      });
      if (finErr) throw finErr;

      // 3. Insert exchange (no criteria_id yet)
      const { data: exchange, error: exErr } = await supabase.from("exchanges").insert({
        agent_id: user.id,
        client_id: data.selectedClientId,
        relinquished_property_id: prop.id,
        exchange_proceeds: parseCurrency(f.exchange_proceeds),
        estimated_equity: parseCurrency(f.estimated_equity),
        estimated_basis: parseCurrency(f.estimated_basis),
        estimated_gain: parseCurrency(f.estimated_gain),
        estimated_tax_liability: parseCurrency(f.estimated_tax_liability),
        sale_close_date: f.sale_close_date || null,
        status: "draft" as const,
      }).select("id").single();
      if (exErr) throw exErr;

      // 4. Insert replacement_criteria (with exchange_id)
      const { data: criteria, error: crErr } = await supabase.from("replacement_criteria").insert({
        exchange_id: exchange.id,
        target_asset_types: c.target_asset_types,
        target_states: c.target_states,
        target_price_min: parseCurrency(c.target_price_min) || 0,
        target_price_max: parseCurrency(c.target_price_max) || 0,
        urgency: c.urgency || null,
        target_metros: c.target_metros.length > 0 ? c.target_metros : null,
        target_strategies: c.target_strategies.length > 0 ? c.target_strategies : null,
        target_property_classes: c.target_property_classes.length > 0 ? c.target_property_classes : null,
        target_cap_rate_min: parseCurrency(c.target_cap_rate_min),
        target_cap_rate_max: parseCurrency(c.target_cap_rate_max),
        target_occupancy_min: parseCurrency(c.target_occupancy_min),
        target_year_built_min: c.target_year_built_min ? parseInt(c.target_year_built_min) : null,
        target_units_min: c.target_units_min ? parseInt(c.target_units_min) : null,
        target_units_max: c.target_units_max ? parseInt(c.target_units_max) : null,
        target_sf_min: c.target_sf_min ? parseInt(c.target_sf_min) : null,
        target_sf_max: c.target_sf_max ? parseInt(c.target_sf_max) : null,
        open_to_dsts: c.open_to_dsts,
        open_to_tics: c.open_to_tics,
        must_replace_debt: c.must_replace_debt,
        min_debt_replacement: parseCurrency(c.min_debt_replacement),
        additional_notes: c.additional_notes || null,
      }).select("id").single();
      if (crErr) throw crErr;

      // 5. Update exchange with criteria_id + update property with exchange_id
      // The auto_exchange_status trigger will fire here and set status to 'active'
      const [exUp, propUp] = await Promise.all([
        supabase.from("exchanges").update({ criteria_id: criteria.id }).eq("id", exchange.id),
        supabase.from("pledged_properties").update({ exchange_id: exchange.id }).eq("id", prop.id),
      ]);
      if (exUp.error) throw exUp.error;
      if (propUp.error) throw propUp.error;

      // 6. Timeline entries
      await supabase.from("exchange_timeline").insert([
        { exchange_id: exchange.id, event_type: "created", description: `Exchange created for ${clientName}`, actor_id: user.id },
        ...(activate ? [{ exchange_id: exchange.id, event_type: "property_pledged", description: "Property pledged to the network", actor_id: user.id }] : []),
      ]);

      if (activate) {
        try {
          const { data: matchResult } = await supabase.functions.invoke("run-auto-matching", {
            body: { exchange_id: exchange.id, property_id: prop.id }
          });
          if (matchResult?.total_new_matches > 0) {
            toast.success(`Exchange activated! ${matchResult.total_new_matches} match${matchResult.total_new_matches === 1 ? '' : 'es'} found.`);
          } else {
            toast.success("Exchange activated! Your property is now in the network.");
          }
        } catch {
          toast.success("Exchange activated! Matching will run shortly.");
        }
        navigate(`/agent/exchanges/${exchange.id}`);
      } else {
        toast.success("Exchange saved as draft.");
        navigate(`/agent/exchanges/${exchange.id}`);
      }
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error("Failed to save exchange: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Exchange</h1>
        <p className="text-sm text-muted-foreground">Create a 1031 exchange for one of your clients.</p>
      </div>

      {/* Step Progress */}
      <nav className="flex items-center gap-1">
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = step > stepNum;
          const isCurrent = step === stepNum;
          return (
            <div key={label} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => isCompleted && setStep(stepNum)}
                disabled={!isCompleted}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors w-full justify-center
                  ${isCurrent ? "bg-primary text-primary-foreground" : isCompleted ? "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer" : "bg-muted text-muted-foreground"}`}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : <span>{stepNum}</span>}
                <span className="hidden sm:inline">{label}</span>
              </button>
            </div>
          );
        })}
      </nav>

      {/* Step Content */}
      {step === 1 && (
        <StepSelectClient selectedClientId={data.selectedClientId}
          onChange={id => setData(d => ({ ...d, selectedClientId: id }))}
          onNext={() => setStep(2)} />
      )}
      {step === 2 && (
        <StepPropertyDetails data={data.property}
          onChange={property => setData(d => ({ ...d, property }))}
          onNext={() => setStep(3)} onBack={() => setStep(1)} />
      )}
      {step === 3 && (
        <StepFinancials data={data.financials}
          onChange={financials => setData(d => ({ ...d, financials }))}
          onNext={() => setStep(4)} onBack={() => setStep(2)} />
      )}
      {step === 4 && (
        <StepCriteria data={data.criteria} loanBalance={data.financials.loan_balance}
          onChange={criteria => setData(d => ({ ...d, criteria }))}
          onNext={() => setStep(5)} onBack={() => setStep(3)} />
      )}
      {step === 5 && (
        <StepReview data={data} clientName={clientName}
          onBack={() => setStep(4)} onSubmit={handleSubmit} saving={saving} />
      )}
    </div>
  );
}
