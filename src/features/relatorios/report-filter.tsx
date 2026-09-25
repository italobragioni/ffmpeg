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
  const [showCustom, setShowCustom] = useState(false);

  function setPeriod(id: string) {
    router.push(`/relatorios?period=${id}`);
  }

  function applyCustom() {
    if (!from || !to) return;
    router.push(`/relatorios?period=custom&from=${from}&to=${to}`);
  }

  const customActive = period === "custom";

  return (
    <div className="mb-6 space-y-3">
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
        <button
          onClick={() => setShowCustom((v) => !v)}
          className={cn(
            "rounded-full border px-3 py-1 text-sm transition-colors",
            customActive || showCustom
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:bg-muted",
          )}
        >
          Período personalizado
        </button>
      </div>

      {(showCustom || customActive) && (
        <div className="flex items-end gap-2 rounded-lg border border-border bg-card p-3">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">De</label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 w-full"
            />
          </div>
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Até</label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 w-full"
            />
          </div>
          <Button size="sm" className="h-9 shrink-0" onClick={applyCustom} disabled={!from || !to}>
            Aplicar
          </Button>
        </div>
      )}
    </div>
  );
}
