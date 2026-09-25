"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, Circle } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import { addNote } from "../actions";
import { cn } from "@/lib/utils";
import type { CaseNote } from "@/types";

type Note = CaseNote & { author?: { full_name: string | null } | null };

export function Timeline({
  caseId,
  notes,
}: {
  caseId: string;
  notes: Note[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    const text = body.trim();
    if (!text) return;
    setLoading(true);
    const res = await addNote(caseId, text);
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    setBody("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Adicionar uma observação ao histórico…"
          rows={2}
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={submit} loading={loading} disabled={!body.trim()}>
            <MessageSquarePlus /> Adicionar
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        {notes.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            O histórico aparecerá aqui automaticamente.
          </p>
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-5">
            {notes.map((n) => (
              <li key={n.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[23px] top-1 flex size-3 items-center justify-center rounded-full ring-4 ring-card",
                    n.kind === "system" ? "bg-muted-foreground/50" : "bg-primary",
                  )}
                >
                  <Circle className="size-0" />
                </span>
                <p className="text-sm text-foreground">{n.body}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {n.kind === "note" && n.author?.full_name ? `${n.author.full_name} · ` : ""}
                  {formatDateTime(n.created_at)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
