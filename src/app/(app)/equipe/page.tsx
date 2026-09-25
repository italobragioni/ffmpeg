import { requireCapability } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { TeamManager } from "@/features/equipe/team-manager";
import type { Role } from "@/lib/constants";

export const metadata = { title: "Equipe" };

export default async function EquipePage() {
  const ctx = await requireCapability("users.manage");
  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const [{ data: members }, { data: invitations }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("id, user_id, role, status, profile:profiles(full_name, phone, last_seen_at)")
      .order("created_at"),
    supabase
      .from("invitations")
      .select("id, full_name, email, role, token, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const memberRows = ((members as unknown as {
    id: string;
    user_id: string;
    role: Role;
    status: "active" | "suspended";
    profile: { full_name: string | null; phone: string | null; last_seen_at: string | null } | { full_name: string | null; phone: string | null; last_seen_at: string | null }[] | null;
  }[]) ?? []).map((m) => {
    const p = Array.isArray(m.profile) ? m.profile[0] : m.profile;
    return {
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      status: m.status,
      full_name: p?.full_name ?? null,
      phone: p?.phone ?? null,
      last_seen_at: p?.last_seen_at ?? null,
    };
  });

  return (
    <div>
      <PageHeader title="Equipe" description="Convide e gerencie o acesso da sua equipe." />
      <TeamManager
        members={memberRows}
        invitations={(invitations as never) ?? []}
        appUrl={appUrl}
        currentUserId={ctx.user.id}
      />
    </div>
  );
}
