import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { can, type Capability } from "@/lib/constants";
import type { Organization, Profile, Subscription, SessionContext } from "@/types";

/**
 * Resolve the current user, their profile, active organization membership and
 * subscription. Cached per-request. Returns null when not authenticated or the
 * user has no active organization yet (needs onboarding).
 */
export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, organization:organizations(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!profile || !membership || !membership.organization) return null;

  const organization = membership.organization as unknown as Organization;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("organization_id", organization.id)
    .maybeSingle();

  return {
    user: profile as Profile,
    organization,
    role: membership.role,
    subscription: (subscription as Subscription) ?? null,
  };
});

/** Require an authenticated user with an organization; redirect otherwise. */
export async function requireSession(): Promise<SessionContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ctx = await getSessionContext();
  if (!ctx) redirect("/onboarding");
  return ctx;
}

/** Require a specific capability; redirect to dashboard if lacking. */
export async function requireCapability(capability: Capability): Promise<SessionContext> {
  const ctx = await requireSession();
  if (!can(ctx.role, capability)) redirect("/dashboard");
  return ctx;
}

/** Require the SaaS owner (super admin) for the /admin area. */
export async function requireSuperAdmin(): Promise<Profile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_super_admin) redirect("/dashboard");
  return profile as Profile;
}
