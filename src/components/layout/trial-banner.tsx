import Link from "next/link";
import { AlertCircle, Sparkles } from "lucide-react";
import type { Subscription } from "@/types";
import { can, type Role } from "@/lib/constants";

/**
 * Prompts the funeral home to activate a paid plan while it has no active
 * subscription. (No free-trial messaging.)
 */
export function TrialBanner({
  subscription,
  role,
}: {
  subscription: Subscription | null;
  role: Role;
}) {
  if (!subscription || subscription.subscription_status === "active") return null;

  const canConfigure = can(role, "org.configure");

  if (subscription.subscription_status === "past_due") {
    return (
      <Banner tone="destructive" icon={AlertCircle}>
        Há uma pendência no pagamento da sua assinatura.{" "}
        {canConfigure && (
          <Link href="/configuracoes/plano" className="font-semibold underline">
            Regularizar
          </Link>
        )}
      </Banner>
    );
  }

  return (
    <Banner tone="warning" icon={Sparkles}>
      Ative sua assinatura para liberar o SOLENE por completo.{" "}
      {canConfigure && (
        <Link href="/configuracoes/plano" className="font-semibold underline">
          Ver planos
        </Link>
      )}
    </Banner>
  );
}

function Banner({
  tone,
  icon: Icon,
  children,
}: {
  tone: "warning" | "destructive";
  icon: typeof AlertCircle;
  children: React.ReactNode;
}) {
  const styles =
    tone === "warning"
      ? "bg-warning/15 text-warning-foreground"
      : "bg-destructive/10 text-destructive";
  return (
    <div className={`mb-6 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${styles}`}>
      <Icon className="size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
