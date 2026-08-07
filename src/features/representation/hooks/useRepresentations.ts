import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";
import type { AgentContactRequest, ExchangeAssignment, Representation, RepresentationInvite } from "../types";

export function useRepresentations(perspective: "investor" | "agent") {
  const { user } = useAuth();
  const { isDemo } = useWorkspaceMode();
  return useQuery({
    queryKey: ["representations", perspective, user?.id, isDemo],
    enabled: !!user,
    queryFn: async () => {
      const column = perspective === "investor" ? "investor_id" : "agent_id";
      const { data, error } = await (supabase
        .from("agent_representations" as any)
        .select("*")
        .eq(column, user!.id)
        .eq("is_demo", isDemo)
        .order("created_at", { ascending: false }) as any);
      if (error) throw error;
      return (data ?? []) as Representation[];
    },
  });
}

export function useExchangeAssignments(perspective: "investor" | "agent") {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["exchange-agent-assignments", perspective, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const column = perspective === "investor" ? "investor_id" : "agent_id";
      const { data, error } = await (supabase
        .from("exchange_agent_assignments" as any)
        .select("*")
        .eq(column, user!.id)
        .eq("status", "active") as any);
      if (error) throw error;
      return (data ?? []) as ExchangeAssignment[];
    },
  });
}

export function useAgentContactRequests(perspective: "investor" | "agent") {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["agent-contact-requests", perspective, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const column = perspective === "investor" ? "investor_id" : "representing_agent_id";
      const { data, error } = await (supabase
        .from("agent_contact_requests" as any)
        .select("*")
        .eq(column, user!.id)
        .order("requested_at", { ascending: false }) as any);
      if (error) throw error;
      return (data ?? []) as AgentContactRequest[];
    },
  });
}

export function useRepresentationInvites() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["representation-invites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("representation_invites" as any)
        .select("id, representation_id, direction, email, token, status, expires_at, last_sent_at, send_count, delivery_status, delivery_error_code, created_by, created_at")
        .eq("created_by", user!.id)
        .order("created_at", { ascending: false }) as any);
      if (error) throw error;
      return (data ?? []) as RepresentationInvite[];
    },
  });
}
