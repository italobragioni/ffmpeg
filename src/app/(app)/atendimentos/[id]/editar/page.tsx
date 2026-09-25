import { notFound } from "next/navigation";
import { requireCapability } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { CaseForm } from "@/features/atendimentos/case-form";
import type { FuneralCase, Room } from "@/types";

export const metadata = { title: "Editar atendimento" };

export default async function EditarAtendimentoPage({ params }: { params: { id: string } }) {
  await requireCapability("cases.edit");
  const supabase = createClient();

  const [{ data: funeralCase }, { data: rooms }] = await Promise.all([
    supabase.from("funeral_cases").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("rooms").select("*").eq("is_active", true).order("name"),
  ]);

  if (!funeralCase) notFound();

  return (
    <div>
      <PageHeader
        title="Editar atendimento"
        description={`Protocolo ${(funeralCase as FuneralCase).protocol}`}
      />
      <CaseForm rooms={(rooms as Room[]) ?? []} initial={funeralCase as FuneralCase} />
    </div>
  );
}
