"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { LayoutGrid, List, Search } from "lucide-react";
import { CASE_STATUS_ORDER, CASE_STATUS_SHORT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const view = params.get("view") ?? "list";
  const status = params.get("status") ?? "";
  const [q, setQ] = useState(params.get("q") ?? "");

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="mb-4 space-y-3">
      <div className="flex items-center gap-2">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setParam("q", q.trim());
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, responsável, telefone ou protocolo…"
            className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </form>
        <div className="flex overflow-hidden rounded-md border border-input">
          <button
            onClick={() => setParam("view", "list")}
            className={cn(
              "flex size-10 items-center justify-center",
              view === "list" ? "bg-accent text-accent-foreground" : "bg-card text-muted-foreground",
            )}
            aria-label="Lista"
          >
            <List className="size-4" />
          </button>
          <button
            onClick={() => setParam("view", "kanban")}
            className={cn(
              "hidden size-10 items-center justify-center sm:flex",
              view === "kanban" ? "bg-accent text-accent-foreground" : "bg-card text-muted-foreground",
            )}
            aria-label="Kanban"
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </div>

      {view !== "kanban" && (
        <div className="flex flex-wrap gap-2">
          <Chip active={!status} onClick={() => setParam("status", "")}>
            Todos
          </Chip>
          {CASE_STATUS_ORDER.map((s) => (
            <Chip key={s} active={status === s} onClick={() => setParam("status", s)}>
              {CASE_STATUS_SHORT[s]}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
