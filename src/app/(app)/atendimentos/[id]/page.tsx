import { notFound } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { can, EVENT_TYPE_LABELS, EVENT_TYPE_STYLES, type EventType } from "@/lib/constants";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CaseHeader } from "@/features/atendimentos/detail/case-header";
import { PipelineBar } from "@/features/atendimentos/detail/pipeline-bar";
import { CaseOverview } from "@/features/atendimentos/detail/case-overview";
import { PortalPanel } from "@/features/atendimentos/detail/portal-panel";
import { Checklist } from "@/features/atendimentos/detail/checklist";
import { Timeline } from "@/features/atendimentos/detail/timeline";
import { DocumentsPanel } from "@/features/atendimentos/detail/documents-panel";
import type {
  CalendarEvent,
  CaseDocument,
  CaseNote,
  CaseTask,
  FuneralCase,
  MemorialMessage,
  PublicMemorial,
  Room,
} from "@/types";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("funeral_cases")
    .select("deceased_name")
    .eq("id", params.id)
    .maybeSingle();
  return { title: data?.deceased_name ?? "Atendimento" };
}

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const { role, organization } = await requireSession();
  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const { data: funeralCase } = await supabase
    .from("funeral_cases")
    .select("*, room:rooms(name)")
    .eq("id", params.id)
    .maybeSingle();

  if (!funeralCase) notFound();
  const c = funeralCase as FuneralCase & { room?: { name: string } | null };

  const [
    { data: tasks },
    { data: notes },
    { data: memorial },
    { data: documents },
    { data: events },
    { data: members },
  ] = await Promise.all([
    supabase
      .from("case_tasks")
      .select("*, completer:profiles!case_tasks_completed_by_fkey(full_name)")
      .eq("case_id", c.id)
      .order("position"),
    supabase
      .from("case_notes")
      .select("*, author:profiles!case_notes_author_id_fkey(full_name)")
      .eq("case_id", c.id)
      .order("created_at", { ascending: false }),
    supabase.from("public_memorials").select("*").eq("case_id", c.id).maybeSingle(),
    supabase.from("documents").select("*").eq("case_id", c.id).order("created_at", { ascending: false }),
    supabase.from("calendar_events").select("*").eq("case_id", c.id).order("starts_at"),
    supabase
      .from("organization_members")
      .select("user_id, profile:profiles(full_name)")
      .eq("status", "active"),
  ]);

  let messages: MemorialMessage[] = [];
  if (memorial) {
    const { data: msgs } = await supabase
      .from("memorial_messages")
      .select("*")
      .eq("memorial_id", (memorial as PublicMemorial).id)
      .order("created_at", { ascending: false });
    messages = (msgs as MemorialMessage[]) ?? [];
  }

  const memberList = ((members as unknown as { user_id: string; profile: { full_name: string | null } | { full_name: string | null }[] | null }[]) ?? []).map(
    (m) => {
      const p = Array.isArray(m.profile) ? m.profile[0] : m.profile;
      return { user_id: m.user_id, full_name: p?.full_name ?? "Usuário" };
    },
  );

  const canEdit = can(role, "cases.edit");
  const canUpdateStage = can(role, "cases.updateStage");
  const memorialUrl =
    memorial && (memorial as PublicMemorial).is_published
      ? `${appUrl}/memorial/${(memorial as PublicMemorial).slug}`
      : null;

  const eventList = (events as CalendarEvent[]) ?? [];

  return (
    <div className="space-y-5">
      <CaseHeader
        funeralCase={c}
        members={memberList}
        memorialUrl={memorialUrl}
        canEdit={canEdit}
        canAssign={can(role, "cases.assign")}
      />

      <PipelineBar caseId={c.id} status={c.status} canEdit={canUpdateStage} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-4">
            <CaseOverview funeralCase={c} roomName={c.room?.name} />
            <PortalPanel
              funeralCase={c}
              memorial={(memorial as PublicMemorial) ?? null}
              messages={messages}
              appUrl={appUrl}
              canConfigure={can(role, "portal.configure")}
            />
          </div>
        </TabsContent>

        <TabsContent value="checklist">
          <Checklist caseId={c.id} tasks={(tasks as CaseTask[]) ?? []} canEdit={canUpdateStage} />
        </TabsContent>

        <TabsContent value="agenda">
          {eventList.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Nenhum evento"
              description="Ao informar datas de remoção, velório e sepultamento, os eventos aparecem aqui e na agenda."
            />
          ) : (
            <Card className="divide-y divide-border">
              {eventList.map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-4">
                  <Badge className={cn("border", EVENT_TYPE_STYLES[e.type as EventType])}>
                    {EVENT_TYPE_LABELS[e.type as EventType]}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{e.title}</p>
                    {e.location && (
                      <p className="truncate text-xs text-muted-foreground">{e.location}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {formatDateTime(e.starts_at)}
                  </span>
                </div>
              ))}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsPanel
            caseId={c.id}
            orgId={organization.id}
            documents={(documents as CaseDocument[]) ?? []}
            canEdit={canEdit}
          />
        </TabsContent>

        <TabsContent value="history">
          <Timeline caseId={c.id} notes={(notes as CaseNote[]) ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
