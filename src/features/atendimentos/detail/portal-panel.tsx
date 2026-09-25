"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Copy,
  ExternalLink,
  Share2,
  Check,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fromNow } from "@/lib/format";
import {
  ensureMemorial,
  setMemorialPublished,
  moderateMessage,
  deleteMessage,
} from "../actions";
import type { FuneralCase, MemorialMessage, PublicMemorial } from "@/types";
import { buildShareMessage } from "@/lib/share";
import { whatsappLink } from "@/lib/utils";

export function PortalPanel({
  funeralCase: c,
  memorial,
  messages,
  appUrl,
  canConfigure,
}: {
  funeralCase: FuneralCase;
  memorial: PublicMemorial | null;
  messages: MemorialMessage[];
  appUrl: string;
  canConfigure: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const url = memorial ? `${appUrl}/memorial/${memorial.slug}` : "";
  const pending = messages.filter((m) => m.status === "pending");
  const approved = messages.filter((m) => m.status === "approved");

  async function activate() {
    setBusy(true);
    const res = await ensureMemorial(c.id, c.deceased_name);
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("Página criada. Publique quando estiver pronta.");
    router.refresh();
  }

  async function togglePublish(next: boolean) {
    if (!memorial) return;
    setBusy(true);
    const res = await setMemorialPublished(memorial.id, next, c.id);
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(next ? "Página publicada." : "Página despublicada.");
    router.refresh();
  }

  function copy() {
    navigator.clipboard.writeText(url);
    toast.success("Link copiado.");
  }

  function share() {
    const message = buildShareMessage(c, memorial?.is_published ? url : undefined);
    if (navigator.share) navigator.share({ title: c.deceased_name, text: message }).catch(() => {});
    else window.open(whatsappLink(null, message), "_blank");
  }

  async function moderate(id: string, status: "approved" | "rejected") {
    const res = await moderateMessage(id, status, c.id);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }

  async function remove(id: string) {
    const res = await deleteMessage(id, c.id);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="size-4 text-primary" /> Portal da família
        </CardTitle>
        {memorial && (
          <Badge
            className={memorial.is_published ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}
          >
            {memorial.is_published ? "Publicada" : "Não publicada"}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!memorial ? (
          <>
            <p className="text-sm text-muted-foreground">
              Crie uma página pública e respeitosa com as informações da despedida.
              Nenhum dado privado da família é exibido — a página começa desativada.
            </p>
            {canConfigure && (
              <Button onClick={activate} loading={busy}>
                <Globe /> Criar página da família
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-2">
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{url}</span>
              <Button size="icon" variant="ghost" className="size-8" onClick={copy}>
                <Copy className="size-4" />
              </Button>
              <a href={url} target="_blank" rel="noreferrer">
                <Button size="icon" variant="ghost" className="size-8">
                  <ExternalLink className="size-4" />
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap gap-2">
              {canConfigure && (
                <Button
                  variant={memorial.is_published ? "outline" : "default"}
                  size="sm"
                  loading={busy}
                  onClick={() => togglePublish(!memorial.is_published)}
                >
                  {memorial.is_published ? "Despublicar" : "Publicar página"}
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={share}>
                <Share2 /> Compartilhar
              </Button>
            </div>

            {/* Tributes moderation */}
            <div className="border-t border-border pt-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <MessageSquare className="size-4" /> Homenagens
                {pending.length > 0 && (
                  <Badge className="bg-warning/15 text-warning-foreground">
                    {pending.length} aguardando
                  </Badge>
                )}
              </p>

              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma homenagem recebida.</p>
              )}

              <div className="space-y-2">
                {pending.map((m) => (
                  <div key={m.id} className="rounded-md border border-warning/30 bg-warning/5 p-3">
                    <p className="text-sm text-foreground">{m.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {m.author_name} · {fromNow(m.created_at)}
                    </p>
                    {canConfigure && (
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" onClick={() => moderate(m.id, "approved")}>
                          <Check /> Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => remove(m.id)}
                        >
                          <Trash2 /> Excluir
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {approved.map((m) => (
                  <div key={m.id} className="rounded-md border border-border p-3">
                    <p className="text-sm text-foreground">{m.body}</p>
                    <p className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{m.author_name} · {fromNow(m.created_at)}</span>
                      {canConfigure && (
                        <button
                          onClick={() => remove(m.id)}
                          className="text-destructive hover:underline"
                        >
                          Excluir
                        </button>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
