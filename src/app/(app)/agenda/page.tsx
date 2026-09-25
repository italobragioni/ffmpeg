import Link from "next/link";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarClock, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { EVENT_TYPE_LABELS, EVENT_TYPE_STYLES, type EventType } from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AgendaControls } from "@/features/agenda/agenda-controls";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types";

export const metadata = { title: "Agenda" };

type View = "day" | "week" | "month";

function range(view: View, offset: number) {
  const now = new Date();
  if (view === "day") {
    const base = addDays(now, offset);
    return { start: startOfDay(base), end: endOfDay(base), label: format(base, "d 'de' MMMM", { locale: ptBR }) };
  }
  if (view === "month") {
    const base = addMonths(now, offset);
    return { start: startOfMonth(base), end: endOfMonth(base), label: format(base, "MMMM 'de' yyyy", { locale: ptBR }) };
  }
  const base = addWeeks(now, offset);
  const start = startOfWeek(base, { weekStartsOn: 0 });
  const end = endOfWeek(base, { weekStartsOn: 0 });
  return {
    start,
    end,
    label: `${format(start, "d MMM", { locale: ptBR })} – ${format(end, "d MMM", { locale: ptBR })}`,
  };
}

/** Flag events sharing a room with an overlapping window. */
function findConflicts(events: CalendarEvent[]): Set<string> {
  const conflicts = new Set<string>();
  const byRoom = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    if (!e.room_id) continue;
    const arr = byRoom.get(e.room_id) ?? [];
    arr.push(e);
    byRoom.set(e.room_id, arr);
  }
  for (const arr of byRoom.values()) {
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i];
        const b = arr[j];
        const aStart = parseISO(a.starts_at).getTime();
        const aEnd = a.ends_at ? parseISO(a.ends_at).getTime() : aStart + 2 * 3600_000;
        const bStart = parseISO(b.starts_at).getTime();
        const bEnd = b.ends_at ? parseISO(b.ends_at).getTime() : bStart + 2 * 3600_000;
        if (aStart < bEnd && bStart < aEnd) {
          conflicts.add(a.id);
          conflicts.add(b.id);
        }
      }
    }
  }
  return conflicts;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { view?: string; offset?: string };
}) {
  await requireSession();
  const supabase = createClient();
  const view = (["day", "week", "month"].includes(searchParams.view ?? "") ? searchParams.view : "week") as View;
  const offset = parseInt(searchParams.offset ?? "0", 10) || 0;
  const { start, end, label } = range(view, offset);

  const { data } = await supabase
    .from("calendar_events")
    .select("*, room:rooms(name)")
    .gte("starts_at", start.toISOString())
    .lte("starts_at", end.toISOString())
    .order("starts_at");

  const events = (data as CalendarEvent[]) ?? [];
  const conflicts = findConflicts(events);

  // Group by day
  const groups = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = format(parseISO(e.starts_at), "yyyy-MM-dd");
    const arr = groups.get(key) ?? [];
    arr.push(e);
    groups.set(key, arr);
  }

  return (
    <div>
      <PageHeader title="Agenda" description="Remoções, velórios, sepultamentos e cremações." />
      <AgendaControls label={label} />

      {conflicts.size > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-warning/15 px-4 py-2.5 text-sm text-warning-foreground">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>Há eventos com possível conflito de sala neste período. Verifique os itens destacados.</span>
        </div>
      )}

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nenhum evento neste período"
          description="Os eventos são criados automaticamente a partir das datas informadas nos atendimentos."
        />
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([day, dayEvents]) => (
            <div key={day}>
              <h2 className="mb-2 text-sm font-semibold capitalize text-foreground">
                {format(parseISO(day + "T00:00:00"), "EEEE, d 'de' MMMM", { locale: ptBR })}
                {isSameDay(parseISO(day + "T00:00:00"), new Date()) && (
                  <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                    hoje
                  </span>
                )}
              </h2>
              <Card className="divide-y divide-border">
                {dayEvents.map((e) => {
                  const inner = (
                    <div
                      className={cn(
                        "flex items-center gap-3 p-4",
                        conflicts.has(e.id) && "bg-warning/5",
                      )}
                    >
                      <div className="w-12 shrink-0 text-sm font-semibold text-foreground">
                        {formatTime(e.starts_at)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={cn("border", EVENT_TYPE_STYLES[e.type as EventType])}>
                            {EVENT_TYPE_LABELS[e.type as EventType]}
                          </Badge>
                          {conflicts.has(e.id) && (
                            <span className="inline-flex items-center gap-1 text-xs text-warning-foreground">
                              <TriangleAlert className="size-3" /> conflito
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate font-medium text-foreground">{e.title}</p>
                        {(e.room?.name || e.location || e.responsible) && (
                          <p className="truncate text-sm text-muted-foreground">
                            {[e.room?.name, e.location, e.responsible].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                  return e.case_id ? (
                    <Link key={e.id} href={`/atendimentos/${e.case_id}`} className="block hover:bg-muted/40">
                      {inner}
                    </Link>
                  ) : (
                    <div key={e.id}>{inner}</div>
                  );
                })}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
