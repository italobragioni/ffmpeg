import Link from "next/link";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { AlertCircle, Clock } from "lucide-react";
import type { Subscription } from "@/types";
import { can, type Role } from "@/lib/constants";

export function TrialBanner({
  subscription,
  role,
}: {
  subscription: Subscription | null;
  role: Role;
}) {
  if (!subscription) return null;

  if (subscription.subscription_status === "trial") {
    const daysLeft = differenceInCalendarDays(parseISO(subscription.trial_ends_at), new Date());
    if (daysLeft < 0) {
      return (
        <Banner tone="destructive" icon={AlertCircle}>
          Seu período de teste terminou.{" "}
          {can(role, "org.configure") && (
            <Link href="/configuracoes/plano" className="font-semibold underline">
              Escolher um plano
            </Link>
          )}
        </Banner>
      );
    }
    return (
      <Banner tone="warning" icon={Clock}>
        Você está no período de teste — {daysLeft === 0 ? "último dia" : `${daysLeft} dia(s) restantes`}.{" "}
        {can(role, "org.configure") && (
          <Link href="/configuracoes/plano" className="font-semibold underline">
            Ver planos
          </Link>
        )}
      </Banner>
    );
  }

  if (subscription.subscription_status === "past_due") {
    return (
      <Banner tone="destructive" icon={AlertCircle}>
        Há uma pendência no pagamento da sua assinatura.
      </Banner>
    );
  }

  return null;
}

function Banner({
  tone,
  icon: Icon,
  children,
}: {
  tone: "warning" | "destructive";
  icon: typeof Clock;
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
