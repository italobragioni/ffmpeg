import { redirect } from "next/navigation";
import { LogOut, RefreshCw, Lock } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/constants";
import { Logo } from "@/components/brand/logo";
import { PlanSelector } from "@/features/configuracoes/plan-selector";
import { buildCaktoUrl } from "@/lib/cakto";
import { hexToHsl } from "@/lib/utils";

export const metadata = { title: "Ativar assinatura" };

export default async function AssinarPage() {
  const { user, organization, role, subscription } = await requireSession();

  // Já ativa ou dono do SaaS -> vai direto para o app.
  if (subscription?.subscription_status === "active" || user.is_super_admin) {
    redirect("/dashboard");
  }

  const canManage = can(role, "org.configure");
  const primary = hexToHsl(organization.primary_color);
  const caktoEssentialUrl = buildCaktoUrl("essential", organization.id, organization.email);
  const caktoProUrl = buildCaktoUrl("pro", organization.id, organization.email);
  const pastDue = subscription?.subscription_status === "past_due";

  return (
    <div
      className="min-h-screen bg-background"
      style={primary ? ({ "--primary": primary, "--ring": primary } as React.CSSProperties) : undefined}
    >
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Logo />
          <form action="/api/auth/signout" method="post">
            <button className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <LogOut className="size-4" /> Sair
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Lock className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {pastDue ? "Regularize sua assinatura" : "Ative sua assinatura para começar"}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            {canManage
              ? "Escolha um plano para liberar o SOLENE. Sem fidelidade — cancele quando quiser."
              : "A assinatura desta funerária está inativa. Peça ao administrador para ativar um plano."}
          </p>
        </div>

        {canManage ? (
          <PlanSelector
            currentPlan={subscription?.plan ?? "essential"}
            canManage={canManage}
            hasSubscription={!!subscription?.provider_customer_id}
            isActive={false}
            caktoEssentialUrl={caktoEssentialUrl}
            caktoProUrl={caktoProUrl}
          />
        ) : (
          <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Fale com o administrador da sua funerária para liberar o acesso.
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-3">
          <a
            href="/assinar"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-4 py-2 text-sm font-medium shadow-soft hover:bg-muted"
          >
            <RefreshCw className="size-4" /> Já assinei — atualizar
          </a>
          <p className="text-xs text-muted-foreground">
            Após o pagamento ser aprovado, o acesso é liberado automaticamente.
          </p>
        </div>
      </main>
    </div>
  );
}
