"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Info, CreditCard, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PLANS, type Plan } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { createCheckoutSession, createPortalSession } from "./billing-actions";
import { cn } from "@/lib/utils";

export function PlanSelector({
  currentPlan,
  canManage,
  hasSubscription,
  isActive,
}: {
  currentPlan: Plan;
  canManage: boolean;
  hasSubscription: boolean;
  isActive: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState<Plan | "portal" | null>(null);

  useEffect(() => {
    const status = params.get("status");
    if (status === "success") {
      toast.success("Pagamento concluído! Sua assinatura está sendo ativada.");
      router.replace("/configuracoes/plano");
    } else if (status === "cancel") {
      toast("Pagamento cancelado.");
      router.replace("/configuracoes/plano");
    }
  }, [params, router]);

  async function subscribe(plan: Plan) {
    setLoading(plan);
    const res = await createCheckoutSession(plan);
    setLoading(null);
    if (!res.ok) return toast.error(res.error);
    window.location.assign(res.url);
  }

  async function openPortal() {
    setLoading("portal");
    const res = await createPortalSession();
    setLoading(null);
    if (!res.ok) return toast.error(res.error);
    window.location.assign(res.url);
  }

  return (
    <div className="space-y-4">
      {canManage && hasSubscription && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <CreditCard className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Gerenciar assinatura</p>
              <p className="text-xs text-muted-foreground">
                Atualize o cartão, veja faturas ou cancele quando quiser.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={openPortal} loading={loading === "portal"}>
            <ExternalLink /> Abrir portal de cobrança
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {PLANS.map((plan) => {
          const current = plan.id === currentPlan && isActive;
          return (
            <Card key={plan.id} className={cn("flex flex-col", plan.highlight && "ring-1 ring-primary/20")}>
              <CardContent className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  {current && (
                    <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
                      Plano atual
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold text-foreground">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                {canManage && (
                  <Button
                    className="mt-6"
                    variant={current ? "outline" : plan.highlight ? "default" : "secondary"}
                    disabled={current}
                    loading={loading === plan.id}
                    onClick={() => subscribe(plan.id)}
                  >
                    {current ? "Plano atual" : `Assinar ${plan.name}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <span>
          Pagamento processado com segurança pela <strong>Stripe</strong>. Você pode alterar de plano
          ou cancelar a qualquer momento pelo portal de cobrança.
        </span>
      </div>
    </div>
  );
}
