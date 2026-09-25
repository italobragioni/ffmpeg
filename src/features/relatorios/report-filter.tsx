"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PERIODS = [
  { id: "today", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "month", label: "Este mês" },
];

export function ReportFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const period = params.get("period") ?? "30d";
  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");

  function setPeriod(id: string) {
    router.push(`/relatorios?period=${id}`);
  }

  function applyCustom() {
    if (!from || !to) return;
    router.push(`/relatorios?period=custom&from=${from}&to=${to}`);
  }

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              period === p.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="h-9 min-w-0 flex-1 sm:w-40 sm:flex-none"
        />
        <span className="shrink-0 text-sm text-muted-foreground">até</span>
        <Input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="h-9 min-w-0 flex-1 sm:w-40 sm:flex-none"
        />
        <Button size="sm" variant="outline" className="shrink-0" onClick={applyCustom}>
          Aplicar
        </Button>
      </div>
    </div>
  );
}
