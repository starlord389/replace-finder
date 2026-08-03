import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";
import type { InvestorInquiry } from "@/features/investor/types";
import type { Tables } from "@/integrations/supabase/types";

type InquiryRow = Tables<"listing_inquiries">;
type PropertySummary = Pick<
  Tables<"pledged_properties_secure">,
  "id" | "property_name" | "address" | "city" | "state"
>;
type ProfileSummary = Pick<Tables<"profiles">, "id" | "full_name" | "email" | "phone">;

async function hydrateInquiries(rows: InquiryRow[], includeInvestor: boolean): Promise<InvestorInquiry[]> {
  const propertyIds = Array.from(new Set(rows.map((row) => row.property_id)));
  const investorIds = includeInvestor ? Array.from(new Set(rows.map((row) => row.investor_id))) : [];

  let properties: PropertySummary[] = [];
  if (propertyIds.length) {
    const { data, error } = await supabase
      .from("pledged_properties_secure")
      .select("id, property_name, address, city, state")
      .in("id", propertyIds);
    if (error) throw error;
    properties = data ?? [];
  }

  let profiles: ProfileSummary[] = [];
  if (investorIds.length) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .in("id", investorIds);
    if (error) throw error;
    profiles = data ?? [];
  }

  const propertyMap = new Map<string, PropertySummary>();
  for (const property of properties) {
    if (property.id) propertyMap.set(property.id, property);
  }
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  return rows.map((row) => {
    const property = propertyMap.get(row.property_id);
    const profile = profileMap.get(row.investor_id);
    return {
      id: row.id,
      investorId: row.investor_id,
      propertyId: row.property_id,
      listingAgentId: row.listing_agent_id,
      initialMessage: row.initial_message,
      agentResponse: row.agent_response,
      status: row.status,
      createdAt: row.created_at,
      respondedAt: row.responded_at,
      propertyName: property?.property_name || property?.address || "Investment property",
      propertyLocation: [property?.city, property?.state].filter(Boolean).join(", ") || null,
      investorName: profile?.full_name ?? null,
      investorEmail: profile?.email ?? null,
      investorPhone: profile?.phone ?? null,
    };
  });
}

export function useInvestorInquiries() {
  const { user, hasRole } = useAuth();
  const { isDemo } = useWorkspaceMode();
  const effectiveDemo = isDemo && hasRole("admin");
  const queryClient = useQueryClient();
  const queryKey = ["investor-inquiries", user?.id, effectiveDemo];

  const query = useQuery({
    queryKey,
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listing_inquiries")
        .select("*")
        .eq("investor_id", user!.id)
        .eq("is_demo", effectiveDemo)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return hydrateInquiries(data ?? [], false);
    },
  });

  const create = useMutation({
    mutationFn: async ({ propertyId, listingAgentId, message }: { propertyId: string; listingAgentId: string; message: string }) => {
      if (!user) throw new Error("Sign in to contact the listing agent.");
      const { error } = await supabase.from("listing_inquiries").insert({
        investor_id: user.id,
        property_id: propertyId,
        listing_agent_id: listingAgentId,
        initial_message: message.trim(),
        is_demo: effectiveDemo,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { ...query, create };
}

export function useAgentInvestorInquiries() {
  const { user, hasRole } = useAuth();
  const { isDemo } = useWorkspaceMode();
  const effectiveDemo = isDemo && hasRole("admin");
  const queryClient = useQueryClient();
  const queryKey = ["agent-investor-inquiries", user?.id, effectiveDemo];

  const query = useQuery({
    queryKey,
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listing_inquiries")
        .select("*")
        .eq("listing_agent_id", user!.id)
        .eq("is_demo", effectiveDemo)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return hydrateInquiries(data ?? [], true);
    },
  });

  const respond = useMutation({
    mutationFn: async ({ inquiryId, response }: { inquiryId: string; response: string }) => {
      const { error } = await supabase
        .from("listing_inquiries")
        .update({ agent_response: response.trim(), status: "responded" })
        .eq("id", inquiryId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { ...query, respond };
}
