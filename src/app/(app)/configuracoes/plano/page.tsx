import { requireSession } from "@/lib/auth";
import { can, PLAN_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PlanSelector } from "@/features/configuracoes/plan-selector";
import { buildCaktoUrl } from "@/lib/cakto";

export const metadata = { title: "Plano" };

const STATUS_LABELS: Record<string, string> = {
  trial: "Sem assinatura ativa",
  active: "Ativa",
  past_due: "Pagamento pendente",
  cancelled: "Cancelada",
};

export default async function PlanoPage() {
  const { role, subscription, organization } = await requireSession();
  const caktoEmail = organization.email;
  const caktoEssentialUrl = buildCaktoUrl("essential", organization.id, caktoEmail);
  const caktoProUrl = buildCaktoUrl("pro", organization.id, caktoEmail);

  return (
    <div>
      <PageHeader title="Plano e assinatura" description="Gerencie seu plano do SOLENE." />

      {subscription && (
        <Card className="mb-6">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Plano atual</p>
              <p className="text-xl font-semibold text-foreground">
                {PLAN_LABELS[subscription.plan]}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-sm text-muted-foreground">Situação</p>
              <p className="font-medium text-foreground">
                {STATUS_LABELS[subscription.subscription_status] ?? subscription.subscription_status}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <PlanSelector
        currentPlan={subscription?.plan ?? "essential"}
        canManage={can(role, "org.configure")}
        hasSubscription={!!subscription?.provider_customer_id}
        isActive={subscription?.subscription_status === "active"}
        caktoEssentialUrl={caktoEssentialUrl}
        caktoProUrl={caktoProUrl}
      />
    </div>
  );
}
