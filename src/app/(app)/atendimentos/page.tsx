import Link from "next/link";
import { Plus, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { can, type CaseStatus, CASE_STATUS_ORDER } from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/features/atendimentos/filter-bar";
import { CaseListCard } from "@/features/atendimentos/case-list-card";
import { KanbanBoard } from "@/features/atendimentos/kanban-board";
import type { FuneralCase } from "@/types";

export const metadata = { title: "Atendimentos" };

export default async function AtendimentosPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; view?: string };
}) {
  const { role } = await requireSession();
  const supabase = createClient();
  const view = searchParams.view === "kanban" ? "kanban" : "list";
  const q = searchParams.q?.trim();
  const status = CASE_STATUS_ORDER.includes(searchParams.status as CaseStatus)
    ? (searchParams.status as CaseStatus)
    : undefined;

  let query = supabase
    .from("funeral_cases")
    .select("*, assignee:profiles!funeral_cases_assigned_to_fkey(full_name)")
    .order("created_at", { ascending: false });

  if (q) {
    const like = `%${q}%`;
    query = query.or(
      `deceased_name.ilike.${like},family_name.ilike.${like},family_phone.ilike.${like},protocol.ilike.${like}`,
    );
  }
  if (view === "list" && status) query = query.eq("status", status);

  const { data } = await query;
  const cases = (data as (FuneralCase & { assignee?: { full_name: string | null } | null })[]) ?? [];

  return (
    <div>
      <PageHeader
        title="Atendimentos"
        description="Acompanhe cada família, do primeiro contato à despedida."
        actions={
          can(role, "cases.create") && (
            <Button asChild>
              <Link href="/atendimentos/novo">
                <Plus /> Novo
              </Link>
            </Button>
          )
        }
      />

      <FilterBar />

      {cases.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={q ? "Nenhum resultado" : "Nenhum atendimento ainda"}
          description={
            q
              ? "Tente outro termo de busca."
              : "Crie o primeiro atendimento para começar a acompanhar sua operação."
          }
          action={
            !q &&
            can(role, "cases.create") && (
              <Button asChild>
                <Link href="/atendimentos/novo">
                  <Plus /> Novo atendimento
                </Link>
              </Button>
            )
          }
        />
      ) : view === "kanban" ? (
        <KanbanBoard cases={cases} />
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <CaseListCard key={c.id} funeralCase={c} />
          ))}
        </div>
      )}
    </div>
  );
}
