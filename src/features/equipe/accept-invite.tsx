"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, type Role } from "@/lib/constants";

export function AcceptInvite({
  token,
  orgName,
  role,
  isAuthed,
}: {
  token: string;
  orgName: string;
  role: Role;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function accept() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("accept_invitation", { p_token: token });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível aceitar o convite", { description: error.message });
      return;
    }
    toast.success(`Bem-vindo à ${orgName}!`);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-muted-foreground">
        Você foi convidado para participar da{" "}
        <strong className="text-foreground">{orgName}</strong> como{" "}
        <strong className="text-foreground">{ROLE_LABELS[role]}</strong>.
      </p>
      {isAuthed ? (
        <Button className="w-full" onClick={accept} loading={loading}>
          Aceitar convite
        </Button>
      ) : (
        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href={`/signup?next=/convite/${token}`}>Criar conta e entrar</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/login?next=/convite/${token}`}>Já tenho conta</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
