import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { Logo } from "@/components/brand/logo";
import { hexToHsl } from "@/lib/utils";
import { PaymentConfirming } from "@/features/configuracoes/payment-confirming";

export const metadata = { title: "Confirmando pagamento" };

export default async function PagamentoPage() {
  const { organization, subscription } = await requireSession();

  // Já ativa -> direto para o app.
  if (subscription?.subscription_status === "active") {
    redirect("/dashboard");
  }

  const primary = hexToHsl(organization.primary_color);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background px-4"
      style={primary ? ({ "--primary": primary, "--ring": primary } as React.CSSProperties) : undefined}
    >
      <div className="mb-8">
        <Logo size="lg" />
      </div>
      <PaymentConfirming />
    </div>
  );
}
