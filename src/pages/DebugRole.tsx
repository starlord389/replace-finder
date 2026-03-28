import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export default function DebugRole() {
  const { user, roles, hasRole, loading } = useAuth();
  const [dbRoles, setDbRoles] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("*").eq("user_id", user.id).then(({ data }) => setDbRoles(data ?? []));
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => setProfile(data));
  }, [user]);

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Not logged in</p>;

  return (
    <div style={{ padding: 32, fontFamily: "monospace" }}>
      <h1>Role Debug</h1>
      <p>Auth User ID: {user.id}</p>
      <p>Auth User Email: {user.email}</p>
      <p>hasRole("admin"): {String(hasRole("admin"))}</p>
      <p>All roles from useAuth: {JSON.stringify(roles)}</p>
      <p>DB user_roles query result: {JSON.stringify(dbRoles)}</p>
      <p>DB profile: {JSON.stringify(profile)}</p>
    </div>
  );
}
