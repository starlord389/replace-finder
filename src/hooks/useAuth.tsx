import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
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

  // The user id we've already requested role/profile data for (claimed synchronously at
  // the decision site). Used to skip redundant re-fetches on non-identity auth events
  // (TOKEN_REFRESHED, re-emitted SIGNED_IN on tab refocus, USER_UPDATED) and to de-dupe the
  // mount-time getSession()/INITIAL_SESSION double fetch, so layouts don't remount.
  const claimedUserIdRef = useRef<string | null>(null);
  // Whether role/profile data has actually finished loading for the claimed user. Lets a
  // failed fetch keep prior roles (and not flash the spinner) on a re-fetch of a known uid.
  const loadedUserIdRef = useRef<string | null>(null);

  const loading = authLoading || rolesLoading;
  const role = pickPrimaryRole(roles);
  // A user counts as an agent if they hold the agent role at all — even if they
  // also hold admin — so agent-view features keep working for dual-role accounts.
  const isAgent = roles.includes("agent" as AppRole);
  const isSuspendedAgent = isAgent && agentVerificationStatus === "suspended";
  const isVerifiedAgent = isAgent && hasOperationalAgentAccess(agentVerificationStatus);

  const fetchUserData = async (userId: string) => {
    // Only show the spinner for a fresh identity. If data for this uid is already loaded
    // (e.g. a background refresh), keep the prior roles visible so layouts — which gate on
    // rolesLoading — don't flash a remount.
    const hasLoadedData = loadedUserIdRef.current === userId;
    if (!hasLoadedData) setRolesLoading(true);
    try {
      const [rolesResult, profileResult] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("full_name, verification_status").eq("id", userId).maybeSingle(),
      ]);

      // Surface query errors instead of silently treating {data:null,error} as "no roles":
      // blanking roles would demote a valid agent/admin to roleless for the session.
      if (rolesResult.error) {
        throw rolesResult.error;
      }
      setRoles(rolesResult.data?.map((r) => r.role) ?? []);
      // A profile error should not wipe a known agent status; only overwrite profile
      // fields when the query succeeded (a missing row legitimately resolves to null).
      if (!profileResult.error) {
        setProfileName(profileResult.data?.full_name ?? null);
        setAgentVerificationStatus(profileResult.data?.verification_status ?? null);
      } else {
        console.error("[useAuth] profile fetch failed", profileResult.error);
      }
      loadedUserIdRef.current = userId;
    } catch (err) {
      console.error("[useAuth] fetchUserData failed", err);
      // Do NOT blank already-loaded roles on failure — keep the user authorized with their
      // prior roles and let a later event retry. Only clear when we never had data, and
      // release the claim so the next auth event can retry the fetch.
      if (!hasLoadedData) {
        setRoles([]);
        setProfileName(null);
        setAgentVerificationStatus(null);
        if (claimedUserIdRef.current === userId) claimedUserIdRef.current = null;
      }
    } finally {
      if (!hasLoadedData) setRolesLoading(false);
    }
  };

  // Synchronously claim a uid and schedule its data fetch. Returns false (and does nothing)
  // if this uid was already claimed, which is how we skip non-identity re-emits and de-dupe
  // the mount-time double fetch. Deferring the actual call avoids the onAuthStateChange
  // deadlock (awaiting Supabase inside the callback hangs the client).
  const requestUserData = (userId: string, defer: boolean) => {
    if (claimedUserIdRef.current === userId) return false;
    claimedUserIdRef.current = userId;
    if (defer) {
      setTimeout(() => { fetchUserData(userId); }, 0);
    } else {
      fetchUserData(userId);
    }
    return true;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setAuthLoading(false);
        if (session?.user) {
          // Only re-fetch role/profile on a genuine identity change. TOKEN_REFRESHED
          // (hourly), re-emitted SIGNED_IN (tab refocus) and USER_UPDATED all arrive with
          // the same user.id; requestUserData skips them (uid already claimed) so we don't
          // set rolesLoading=true and remount the authenticated page (losing dialogs/scroll).
          requestUserData(session.user.id, true);
        } else {
          claimedUserIdRef.current = null;
          loadedUserIdRef.current = null;
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
        // De-dupe mount-time double fetch: the INITIAL_SESSION event also fires for this
        // session. requestUserData no-ops if that handler already claimed this uid.
        requestUserData(session.user.id, false);
      } else if (claimedUserIdRef.current === null) {
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
