import Link from "next/link";
import { User, CalendarClock, CircleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import type { FuneralCase } from "@/types";

export function ActiveCaseCard({
  funeralCase: c,
  pending,
}: {
  funeralCase: FuneralCase & { assignee?: { full_name: string | null } | null };
  pending: number;
}) {
  const nextAppointment = c.wake_start ?? c.final_datetime ?? c.removal_date;

  return (
    <Link href={`/atendimentos/${c.id}`}>
      <Card className="h-full transition-shadow hover:shadow-lift">
        <CardContent className="p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{c.deceased_name}</p>
              <p className="text-xs text-muted-foreground">{c.protocol}</p>
            </div>
            <StatusBadge status={c.status} />
          </div>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <User className="size-3.5" />
              {c.assignee?.full_name ?? "Sem responsável"}
            </p>
            {nextAppointment && (
              <p className="flex items-center gap-2">
                <CalendarClock className="size-3.5" />
                {formatDateTime(nextAppointment)}
              </p>
            )}
            {pending > 0 && (
              <p className="flex items-center gap-2 text-warning-foreground">
                <CircleAlert className="size-3.5" />
                {pending} pendência{pending > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
