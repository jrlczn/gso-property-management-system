import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./server";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

/** Redirects to /login if there's no active session. */
export async function requireUser() {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "active") {
    redirect("/login");
  }
  return profile;
}

/** Redirects non-admins back to the dashboard. Always re-check role in
 * server actions too - proxy.ts route matching alone is not sufficient. */
export async function requireAdmin() {
  const profile = await requireUser();
  if (profile.role !== "admin") {
    redirect("/dashboard");
  }
  return profile;
}
