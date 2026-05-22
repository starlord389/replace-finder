import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";
import { hasOperationalAgentAccess } from "@/lib/agentVerification";

type AppRole = Enums<"app_role">;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  /** Primary role for the user, derived from user_roles (single source of truth). */
  role: AppRole | null;
  /** @deprecated use `role` */
  profileRole: AppRole | null;
  profileName: string | null;
  isAgent: boolean;
  isVerifiedAgent: boolean;
  isSuspendedAgent: boolean;
  agentVerificationStatus: string | null;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  roles: [],
  loading: true,
  signOut: async () => {},
  hasRole: () => false,
  role: null,
  profileRole: null,
  profileName: null,
  isAgent: false,
  isVerifiedAgent: false,
  isSuspendedAgent: false,
  agentVerificationStatus: null,
});

/** Admin wins, then agent, then anything else. */
function pickPrimaryRole(roles: AppRole[]): AppRole | null {
  if (roles.includes("admin" as AppRole)) return "admin" as AppRole;
  if (roles.includes("agent" as AppRole)) return "agent" as AppRole;
  return roles[0] ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [agentVerificationStatus, setAgentVerificationStatus] = useState<string | null>(null);

  const loading = authLoading || rolesLoading;
  const role = pickPrimaryRole(roles);
  const isAgent = role === ("agent" as AppRole);
  const isSuspendedAgent = isAgent && agentVerificationStatus === "suspended";
  const isVerifiedAgent = isAgent && hasOperationalAgentAccess(agentVerificationStatus);

  const fetchUserData = async (userId: string) => {
    setRolesLoading(true);
    const [rolesResult, profileResult] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("full_name, verification_status").eq("id", userId).single(),
    ]);

    setRoles(rolesResult.data?.map((r) => r.role) ?? []);
    setProfileName(profileResult.data?.full_name ?? null);
    setAgentVerificationStatus(profileResult.data?.verification_status ?? null);
    setRolesLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setAuthLoading(false);
        if (session?.user) {
          fetchUserData(session.user.id);
        } else {
          setRoles([]);
          setProfileName(null);
          setAgentVerificationStatus(null);
          setRolesLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setRolesLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasRole = (r: AppRole) => roles.includes(r);

  return (
    <AuthContext.Provider value={{
      session, user, roles, loading, signOut, hasRole,
      role, profileRole: role, profileName, isAgent, isVerifiedAgent, isSuspendedAgent, agentVerificationStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
