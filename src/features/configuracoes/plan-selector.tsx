"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PLANS, type Plan } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { setPlan } from "./actions";
import { cn } from "@/lib/utils";

export function PlanSelector({
  currentPlan,
  canManage,
}: {
  currentPlan: Plan;
  canManage: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<Plan | null>(null);

  async function choose(plan: Plan) {
    setLoading(plan);
    const res = await setPlan(plan);
    setLoading(null);
    if (!res.ok) return toast.error(res.error);
    toast.success("Plano atualizado.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {PLANS.map((plan) => {
          const current = plan.id === currentPlan;
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
                    onClick={() => choose(plan.id)}
                  >
                    {current ? "Plano atual" : `Escolher ${plan.name}`}
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
          A cobrança online será ativada em breve. A arquitetura é agnóstica de gateway e poderá
          integrar Asaas, Mercado Pago ou Stripe sem alterar o restante do sistema.
        </span>
      </div>
    </div>
  );
}
