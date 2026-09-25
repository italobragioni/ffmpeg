import { differenceInCalendarDays, parseISO } from "date-fns";
import { requireSession } from "@/lib/auth";
import { can, PLAN_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PlanSelector } from "@/features/configuracoes/plan-selector";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Plano" };

const STATUS_LABELS: Record<string, string> = {
  trial: "Período de teste",
  active: "Ativo",
  past_due: "Pagamento pendente",
  cancelled: "Cancelado",
};

export default async function PlanoPage() {
  const { role, subscription } = await requireSession();

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
              {subscription.subscription_status === "trial" && (
                <p className="text-sm text-muted-foreground">
                  {Math.max(0, differenceInCalendarDays(parseISO(subscription.trial_ends_at), new Date()))}{" "}
                  dia(s) restantes · termina em {formatDate(subscription.trial_ends_at)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <PlanSelector
        currentPlan={subscription?.plan ?? "essential"}
        canManage={can(role, "org.configure")}
      />
    </div>
  );
}
