"use client";

import { useRouter } from "next/navigation";
import { Ban, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLAN_LABELS, type Plan, type SubscriptionStatus } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { setOrgStatus } from "./actions";

export interface ClientRow {
  organization_id: string;
  name: string;
  plan: Plan;
  status: SubscriptionStatus;
  created_at: string;
  trial_ends_at: string;
}

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  trial: "bg-warning/15 text-warning-foreground",
  active: "bg-success/15 text-success",
  past_due: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trial: "Teste",
  active: "Ativo",
  past_due: "Pendente",
  cancelled: "Suspenso",
};

export function ClientTable({ clients }: { clients: ClientRow[] }) {
  const router = useRouter();

  async function change(id: string, status: SubscriptionStatus) {
    const res = await setOrgStatus(id, status);
    if (!res.ok) return toast.error(res.error);
    toast.success(status === "cancelled" ? "Acesso suspenso." : "Acesso reativado.");
    router.refresh();
  }

  return (
    <Card className="overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Funerária</th>
              <th className="px-4 py-3 font-medium">Plano</th>
              <th className="px-4 py-3 font-medium">Cadastro</th>
              <th className="px-4 py-3 font-medium">Fim do teste</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {clients.map((c) => (
              <tr key={c.organization_id}>
                <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{PLAN_LABELS[c.plan]}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(c.created_at)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(c.trial_ends_at)}</td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_STYLES[c.status]}>{STATUS_LABELS[c.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {c.status === "cancelled" ? (
                    <Button size="sm" variant="outline" onClick={() => change(c.organization_id, "active")}>
                      <RotateCcw /> Reativar
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => change(c.organization_id, "cancelled")}>
                      <Ban /> Suspender
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-border md:hidden">
        {clients.map((c) => (
          <div key={c.organization_id} className="p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-foreground">{c.name}</p>
              <Badge className={STATUS_STYLES[c.status]}>{STATUS_LABELS[c.status]}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {PLAN_LABELS[c.plan]} · cadastro {formatDate(c.created_at)}
            </p>
            <div className="mt-3">
              {c.status === "cancelled" ? (
                <Button size="sm" variant="outline" onClick={() => change(c.organization_id, "active")}>
                  <RotateCcw /> Reativar
                </Button>
              ) : (
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => change(c.organization_id, "cancelled")}>
                  <Ban /> Suspender
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {clients.length === 0 && (
        <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma funerária cadastrada.</p>
      )}
    </Card>
  );
}
