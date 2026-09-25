"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VIEWS = [
  { id: "day", label: "Hoje" },
  { id: "week", label: "Semana" },
  { id: "month", label: "Mês" },
];

export function AgendaControls({ label }: { label: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const view = params.get("view") ?? "week";
  const offset = parseInt(params.get("offset") ?? "0", 10) || 0;

  function setParams(next: { view?: string; offset?: number }) {
    const p = new URLSearchParams(params.toString());
    if (next.view !== undefined) {
      p.set("view", next.view);
      p.set("offset", "0");
    }
    if (next.offset !== undefined) p.set("offset", String(next.offset));
    router.push(`/agenda?${p.toString()}`);
  }

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setParams({ offset: offset - 1 })}>
          <ChevronLeft />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setParams({ offset: 0 })}>
          Hoje
        </Button>
        <Button variant="outline" size="icon" onClick={() => setParams({ offset: offset + 1 })}>
          <ChevronRight />
        </Button>
        <span className="ml-1 text-sm font-medium capitalize text-foreground">{label}</span>
      </div>
      <div className="inline-flex overflow-hidden rounded-md border border-input">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setParams({ view: v.id })}
            className={cn(
              "px-4 py-2 text-sm",
              view === v.id ? "bg-accent text-accent-foreground" : "bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
