"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currentSubscriptionStatus } from "./billing-actions";

export function PaymentConfirming() {
  const [active, setActive] = useState(false);
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    async function check() {
      attempts += 1;
      try {
        const { status } = await currentSubscriptionStatus();
        if (status === "active") {
          setActive(true);
          // Full reload so the app layout re-evaluates the paywall.
          window.location.assign("/dashboard");
          return;
        }
      } catch {
        /* keep trying */
      }
      if (attempts >= 20) {
        setWaited(true); // ~60s without activation
        return;
      }
      timer = setTimeout(check, 3000);
    }

    check();
    return () => clearTimeout(timer);
  }, []);

  if (active) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-7" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Assinatura ativada!</h1>
        <p className="mt-2 text-muted-foreground">Redirecionando para o app…</p>
      </div>
    );
  }

  if (waited) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Clock className="size-7" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Estamos confirmando seu pagamento</h1>
        <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
          A confirmação pode levar alguns instantes. Assim que for aprovada, seu acesso é liberado
          automaticamente — você pode tentar novamente ou voltar em seguida.
        </p>
        <div className="mt-6 flex flex-col items-center gap-2">
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
          <Button asChild variant="ghost">
            <Link href="/dashboard">Ir para o app</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Loader2 className="size-7 animate-spin" />
      </div>
      <h1 className="text-2xl font-semibold text-foreground">Confirmando seu pagamento…</h1>
      <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
        Pagamento recebido! Estamos liberando seu acesso ao SOLENE. Isso leva poucos segundos.
      </p>
    </div>
  );
}
