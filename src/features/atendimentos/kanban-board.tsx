"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { toast } from "sonner";
import {
  CASE_STATUS_ORDER,
  CASE_STATUS_SHORT,
  type CaseStatus,
} from "@/lib/constants";
import { updateCaseStatus } from "./actions";
import type { FuneralCase } from "@/types";
import { cn } from "@/lib/utils";

type Case = FuneralCase & { assignee?: { full_name: string | null } | null };

export function KanbanBoard({ cases }: { cases: Case[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Case[]>(cases);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<CaseStatus | null>(null);

  async function drop(status: CaseStatus) {
    setOverCol(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const current = items.find((c) => c.id === id);
    if (!current || current.status === status) return;

    const prev = items;
    setItems((list) => list.map((c) => (c.id === id ? { ...c, status } : c)));

    const res = await updateCaseStatus(id, status);
    if (!res.ok) {
      setItems(prev);
      toast.error(res.error);
    } else {
      toast.success(`Movido para ${CASE_STATUS_SHORT[status]}.`);
      router.refresh();
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {CASE_STATUS_ORDER.map((status) => {
        const colCases = items.filter((c) => c.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(status);
            }}
            onDrop={() => drop(status)}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-lg border bg-muted/40 transition-colors",
              overCol === status ? "border-primary bg-accent/50" : "border-border",
            )}
          >
            <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
              <span className="text-sm font-semibold text-foreground">
                {CASE_STATUS_SHORT[status]}
              </span>
              <span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">
                {colCases.length}
              </span>
            </div>
            <div className="flex min-h-[120px] flex-1 flex-col gap-2 p-2">
              {colCases.map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={() => setDragId(c.id)}
                  onDragEnd={() => setDragId(null)}
                  className={cn(
                    "cursor-grab rounded-md border border-border bg-card p-3 shadow-soft active:cursor-grabbing",
                    dragId === c.id && "opacity-50",
                  )}
                >
                  <Link href={`/atendimentos/${c.id}`} className="block">
                    <p className="truncate text-sm font-medium text-foreground">
                      {c.deceased_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.protocol}</p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="size-3" />
                      {c.assignee?.full_name ?? "Sem responsável"}
                    </p>
                  </Link>
                </div>
              ))}
              {colCases.length === 0 && (
                <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                  Arraste um atendimento para cá
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
