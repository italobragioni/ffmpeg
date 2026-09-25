import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTime, formatDate } from "@/lib/format";
import { EVENT_TYPE_LABELS, EVENT_TYPE_STYLES, type EventType } from "@/lib/constants";
import type { CalendarEvent } from "@/types";
import { isToday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export function UpcomingEvents({ events }: { events: CalendarEvent[] }) {
  return (
    <Card className="divide-y divide-border">
      {events.map((e) => {
        const start = parseISO(e.starts_at);
        const href = e.case_id ? `/atendimentos/${e.case_id}` : "/agenda";
        return (
          <Link key={e.id} href={href} className="flex items-start gap-3 p-4 hover:bg-muted/50">
            <div className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-muted py-1.5">
              <span className="text-base font-semibold leading-none text-foreground">
                {formatTime(e.starts_at)}
              </span>
              <span className="mt-1 text-[11px] text-muted-foreground">
                {isToday(start) ? "hoje" : formatDate(e.starts_at)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge className={cn("border", EVENT_TYPE_STYLES[e.type as EventType])}>
                  {EVENT_TYPE_LABELS[e.type as EventType]}
                </Badge>
              </div>
              <p className="mt-1 truncate font-medium text-foreground">{e.title}</p>
              {(e.location || e.room?.name) && (
                <p className="truncate text-sm text-muted-foreground">
                  {[e.room?.name, e.location].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </Card>
  );
}
