import Link from "next/link";
import { endOfDay, startOfDay } from "date-fns";
import {
  ClipboardList,
  Activity,
  Flame,
  Church,
  Plus,
  CalendarClock,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { greeting } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/features/dashboard/stat-card";
import { UpcomingEvents } from "@/features/dashboard/upcoming-events";
import { ActiveCaseCard } from "@/features/dashboard/active-case-card";
import type { CalendarEvent, FuneralCase } from "@/types";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { user } = await requireSession();
  const supabase = createClient();

  const now = new Date();
  const dayStart = startOfDay(now).toISOString();
  const dayEnd = endOfDay(now).toISOString();

  const [
    { count: createdToday },
    { count: inProgress },
    { data: todayEvents },
    { data: upcoming },
    { data: activeCases },
  ] = await Promise.all([
    supabase
      .from("funeral_cases")
      .select("id", { count: "exact", head: true })
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd),
    supabase
      .from("funeral_cases")
      .select("id", { count: "exact", head: true })
      .neq("status", "finished"),
    supabase
      .from("calendar_events")
      .select("id, type")
      .gte("starts_at", dayStart)
      .lte("starts_at", dayEnd),
    supabase
      .from("calendar_events")
      .select("*, room:rooms(*)")
      .gte("starts_at", now.toISOString())
      .order("starts_at", { ascending: true })
      .limit(6),
    supabase
      .from("funeral_cases")
      .select("*, assignee:profiles!funeral_cases_assigned_to_fkey(full_name)")
      .neq("status", "finished")
      .order("updated_at", { ascending: false })
      .limit(6),
  ]);

  const events = (todayEvents as { type: string }[]) ?? [];
  const wakesToday = events.filter((e) => e.type === "wake").length;
  const burialsToday = events.filter((e) => e.type === "burial" || e.type === "cremation").length;

  // Pending checklist counts for the active cases shown.
  const caseList = (activeCases as FuneralCase[]) ?? [];
  const pendingByCase = new Map<string, number>();
  if (caseList.length > 0) {
    const { data: tasks } = await supabase
      .from("case_tasks")
      .select("case_id")
      .eq("is_done", false)
      .in(
        "case_id",
        caseList.map((c) => c.id),
      );
    for (const t of (tasks as { case_id: string }[]) ?? []) {
      pendingByCase.set(t.case_id, (pendingByCase.get(t.case_id) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {greeting()}, {user.full_name?.split(" ")[0] || "bem-vindo"}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aqui está o panorama da sua operação hoje.
          </p>
        </div>
        <Button asChild>
          <Link href="/atendimentos/novo">
            <Plus /> Novo atendimento
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="Atendimentos hoje" value={createdToday ?? 0} />
        <StatCard icon={Activity} label="Em andamento" value={inProgress ?? 0} tone="primary" />
        <StatCard icon={Church} label="Velórios hoje" value={wakesToday} />
        <StatCard icon={Flame} label="Sepultamentos hoje" value={burialsToday} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Upcoming events */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Próximos eventos</h2>
            <Link href="/agenda" className="text-sm text-primary hover:underline">
              Ver agenda
            </Link>
          </div>
          {(upcoming as CalendarEvent[])?.length ? (
            <UpcomingEvents events={upcoming as CalendarEvent[]} />
          ) : (
            <EmptyState
              icon={CalendarClock}
              title="Nenhum evento agendado"
              description="Os próximos velórios e sepultamentos aparecerão aqui."
            />
          )}
        </div>

        {/* Active cases */}
        <div className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Atendimentos em andamento</h2>
            <Link href="/atendimentos" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          {caseList.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {caseList.map((c) => (
                <ActiveCaseCard
                  key={c.id}
                  funeralCase={c}
                  pending={pendingByCase.get(c.id) ?? 0}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <EmptyState
                  icon={ClipboardList}
                  title="Nenhum atendimento em andamento"
                  description="Crie o primeiro atendimento para começar a acompanhar a operação."
                  action={
                    <Button asChild>
                      <Link href="/atendimentos/novo">
                        Criar atendimento <ArrowRight />
                      </Link>
                    </Button>
                  }
                  className="border-0"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
