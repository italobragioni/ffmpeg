import { Building2, Activity, Clock, Ban, Users, ClipboardList, TrendingUp, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/features/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientTable, type ClientRow } from "@/features/admin/client-table";
import { PLANS, PLAN_LABELS, type Plan, type SubscriptionStatus } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";

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
  const activeClients = clients.filter((c) => c.status === "active");
  const activeOrgs = activeClients.length;
  const noSubOrgs = clients.filter((c) => c.status === "trial").length;
  const cancelledOrgs = clients.filter((c) => c.status === "cancelled").length;

  // MRR = soma do preço dos planos das assinaturas ativas
  const priceByPlan = Object.fromEntries(PLANS.map((p) => [p.id, p.price])) as Record<Plan, number>;
  const mrr = activeClients.reduce((sum, c) => sum + (priceByPlan[c.plan] ?? 0), 0);

  // Distribuição de planos entre as ativas
  const activeByPlan = PLANS.map((p) => ({
    id: p.id as Plan,
    label: PLAN_LABELS[p.id as Plan],
    count: activeClients.filter((c) => c.plan === p.id).length,
    revenue: activeClients.filter((c) => c.plan === p.id).length * p.price,
  }));

  // Novas funerárias neste mês
  const now = new Date();
  const newThisMonth = clients.filter((c) => {
    const d = new Date(c.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Painel do SaaS</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão geral de todas as funerárias.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Receita recorrente (MRR)" value={formatCurrency(mrr)} tone="primary" />
        <StatCard icon={Activity} label="Assinaturas ativas" value={activeOrgs} />
        <StatCard icon={Building2} label="Funerárias" value={totalOrgs} />
        <StatCard icon={UserPlus} label="Novas no mês" value={newThisMonth} />
        <StatCard icon={Clock} label="Sem assinatura" value={noSubOrgs} />
        <StatCard icon={Ban} label="Canceladas" value={cancelledOrgs} />
        <StatCard icon={Users} label="Usuários totais" value={userCount ?? 0} />
        <StatCard icon={ClipboardList} label="Atendimentos" value={caseCount ?? 0} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assinaturas por plano</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeByPlan.map((p) => {
            const pct = activeOrgs ? Math.round((p.count / activeOrgs) * 100) : 0;
            return (
              <div key={p.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-foreground">{p.label} · {p.count} ativa(s)</span>
                  <span className="text-muted-foreground">{formatCurrency(p.revenue)}/mês</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Clientes</h2>
        <ClientTable clients={clients} />
      </div>
    </div>
  );
}
