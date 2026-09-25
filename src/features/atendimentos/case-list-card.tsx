import Link from "next/link";
import { User, CalendarClock, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import type { FuneralCase } from "@/types";

export function CaseListCard({
  funeralCase: c,
}: {
  funeralCase: FuneralCase & { assignee?: { full_name: string | null } | null };
}) {
  const next = c.wake_start ?? c.final_datetime;
  return (
    <Link href={`/atendimentos/${c.id}`}>
      <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-lift">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-foreground">{c.deceased_name}</p>
            <StatusBadge status={c.status} className="hidden sm:inline-flex" />
          </div>
          <p className="text-xs text-muted-foreground">{c.protocol}</p>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="size-3.5" />
              {c.assignee?.full_name ?? "Sem responsável"}
            </span>
            {next && (
              <span className="flex items-center gap-1.5">
                <CalendarClock className="size-3.5" />
                {formatDateTime(next)}
              </span>
            )}
          </div>
          <StatusBadge status={c.status} className="mt-2 sm:hidden" />
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
      </Card>
    </Link>
  );
}
