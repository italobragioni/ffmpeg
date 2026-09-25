import { requireCapability } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { CaseForm } from "@/features/atendimentos/case-form";
import type { Room } from "@/types";

export const metadata = { title: "Novo atendimento" };

export default async function NovoAtendimentoPage() {
  const ctx = await requireCapability("cases.create");
  const supabase = createClient();
  const { data: rooms } = await supabase
    .from("rooms")
    .select("*")
    .eq("is_active", true)
    .order("name");

  void ctx;
  return (
    <div>
      <PageHeader
        title="Novo atendimento"
        description="Preencha as etapas. Só o nome do falecido é obrigatório — o resto pode ser completado depois."
      />
      <CaseForm rooms={(rooms as Room[]) ?? []} />
    </div>
  );
}
