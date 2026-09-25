"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CASE_STATUS_ORDER,
  CASE_STATUS_SHORT,
  type CaseStatus,
} from "@/lib/constants";
import { updateCaseStatus } from "../actions";
import { cn } from "@/lib/utils";

export function PipelineBar({
  caseId,
  status,
  canEdit,
}: {
  caseId: string;
  status: CaseStatus;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<CaseStatus>(status);
  const [loading, setLoading] = useState(false);
  const currentIndex = CASE_STATUS_ORDER.indexOf(current);
  const nextStatus = CASE_STATUS_ORDER[currentIndex + 1];

  async function change(to: CaseStatus) {
    if (!canEdit || to === current) return;
    const prev = current;
    setCurrent(to);
    setLoading(true);
    const res = await updateCaseStatus(caseId, to);
    setLoading(false);
    if (!res.ok) {
      setCurrent(prev);
      toast.error(res.error);
    } else {
      toast.success(`Status atualizado para ${CASE_STATUS_SHORT[to]}.`);
      router.refresh();
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-1 overflow-x-auto no-scrollbar">
          {CASE_STATUS_ORDER.map((s, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            return (
              <div key={s} className="flex shrink-0 items-center">
                <button
                  type="button"
                  disabled={!canEdit || loading}
                  onClick={() => change(s)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    active && "bg-primary text-primary-foreground",
                    done && "bg-primary/10 text-primary",
                    !active && !done && "bg-muted text-muted-foreground hover:bg-accent",
                    canEdit && "cursor-pointer",
                  )}
                >
                  {done && <Check className="size-3" />}
                  {CASE_STATUS_SHORT[s]}
                </button>
                {i < CASE_STATUS_ORDER.length - 1 && (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
                )}
              </div>
            );
          })}
        </div>
        {canEdit && nextStatus && (
          <Button size="sm" variant="outline" loading={loading} onClick={() => change(nextStatus)}>
            Avançar
          </Button>
        )}
      </div>
    </Card>
  );
}
