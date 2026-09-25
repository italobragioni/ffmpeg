"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CASE_STATUS_SHORT, type CaseStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Result {
  id: string;
  protocol: string;
  deceased_name: string;
  family_name: string | null;
  status: CaseStatus;
}

export function GlobalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const like = `%${term}%`;
      const { data } = await supabase
        .from("funeral_cases")
        .select("id, protocol, deceased_name, family_name, status")
        .or(
          `deceased_name.ilike.${like},family_name.ilike.${like},family_phone.ilike.${like},protocol.ilike.${like}`,
        )
        .order("created_at", { ascending: false })
        .limit(6);
      setResults((data as Result[]) ?? []);
      setLoading(false);
      setOpen(true);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  function go(id: string) {
    setOpen(false);
    setQ("");
    router.push(`/atendimentos/${id}`);
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q.length >= 2 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && q.trim()) {
              setOpen(false);
              router.push(`/atendimentos?q=${encodeURIComponent(q.trim())}`);
            }
          }}
          placeholder="Buscar por nome, responsável, telefone ou protocolo…"
          className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-9 text-sm shadow-soft placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lift animate-fade-in">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => go(r.id)}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <ClipboardList className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-foreground">
                  {r.deceased_name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {r.protocol} {r.family_name ? `· ${r.family_name}` : ""}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {CASE_STATUS_SHORT[r.status]}
              </span>
            </button>
          ))}
        </div>
      )}
      {open && !loading && q.trim().length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-border bg-popover p-4 text-center text-sm text-muted-foreground shadow-lift">
          Nenhum atendimento encontrado.
        </div>
      )}
    </div>
  );
}
