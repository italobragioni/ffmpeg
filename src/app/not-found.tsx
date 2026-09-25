import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <Logo size="lg" />
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Página não encontrada</h1>
        <p className="mt-2 text-muted-foreground">
          O endereço que você procura não existe ou foi movido.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Voltar ao início</Link>
      </Button>
    </div>
  );
}
