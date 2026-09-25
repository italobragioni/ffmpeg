import { differenceInCalendarDays, parseISO } from "date-fns";
import { Building2, Activity, Clock, AlertTriangle, Users, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/features/dashboard/stat-card";
import { ClientTable, type ClientRow } from "@/features/admin/client-table";
import type { Plan, SubscriptionStatus } from "@/lib/constants";

export default async function AdminPage() {
  const supabase = createClient();

  const [{ data: subs }, { count: userCount }, { count: caseCount }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("organization_id, plan, subscription_status, trial_ends_at, created_at, organization:organizations(name, created_at)")
      .order("created_at", { ascending: false }),
    supabase.from("organization_members").select("id", { count: "exact", head: true }),
    supabase.from("funeral_cases").select("id", { count: "exact", head: true }),
  ]);

  const clients: ClientRow[] = ((subs as unknown as {
    organization_id: string;
    plan: Plan;
    subscription_status: SubscriptionStatus;
    trial_ends_at: string;
    created_at: string;
    organization: { name: string; created_at: string } | { name: string; created_at: string }[] | null;
  }[]) ?? []).map((s) => {
    const org = Array.isArray(s.organization) ? s.organization[0] : s.organization;
    return {
      organization_id: s.organization_id,
      name: org?.name ?? "—",
      plan: s.plan,
      status: s.subscription_status,
      created_at: org?.created_at ?? s.created_at,
      trial_ends_at: s.trial_ends_at,
    };
  });

  const totalOrgs = clients.length;
  const activeOrgs = clients.filter((c) => c.status === "active").length;
  const trialOrgs = clients.filter((c) => c.status === "trial").length;
  const expiringSoon = clients.filter(
    (c) =>
      c.status === "trial" &&
      differenceInCalendarDays(parseISO(c.trial_ends_at), new Date()) <= 3 &&
      differenceInCalendarDays(parseISO(c.trial_ends_at), new Date()) >= 0,
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Painel do SaaS</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão geral de todas as funerárias.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard icon={Building2} label="Funerárias" value={totalOrgs} tone="primary" />
        <StatCard icon={Activity} label="Ativas" value={activeOrgs} />
        <StatCard icon={Clock} label="Em teste" value={trialOrgs} />
        <StatCard icon={AlertTriangle} label="Testes vencendo" value={expiringSoon} />
        <StatCard icon={Users} label="Usuários totais" value={userCount ?? 0} />
        <StatCard icon={ClipboardList} label="Atendimentos" value={caseCount ?? 0} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Clientes</h2>
        <ClientTable clients={clients} />
      </div>
    </div>
  );
}
