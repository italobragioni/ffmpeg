"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Phone, Pencil, Share2, UserCog, Check } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from "@/components/ui/dropdown-menu";
import { whatsappLink } from "@/lib/utils";
import { buildShareMessage } from "@/lib/share";
import { assignCase } from "../actions";
import type { FuneralCase } from "@/types";

interface Member {
  user_id: string;
  full_name: string | null;
}

export function CaseHeader({
  funeralCase: c,
  members,
  memorialUrl,
  canEdit,
  canAssign,
}: {
  funeralCase: FuneralCase;
  members: Member[];
  memorialUrl: string | null;
  canEdit: boolean;
  canAssign: boolean;
}) {
  const router = useRouter();
  const [assignedTo, setAssignedTo] = useState(c.assigned_to);
  const phone = c.family_whatsapp || c.family_phone;

  function share() {
    const message = buildShareMessage(c, memorialUrl ?? undefined);
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: c.deceased_name, text: message }).catch(() => {});
    } else {
      window.open(whatsappLink(null, message), "_blank");
    }
  }

  async function assign(userId: string | null) {
    const prev = assignedTo;
    setAssignedTo(userId);
    const res = await assignCase(c.id, userId);
    if (!res.ok) {
      setAssignedTo(prev);
      toast.error(res.error);
    } else {
      toast.success("Responsável atualizado.");
      router.refresh();
    }
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <StatusBadge status={c.status} />
            <span className="text-xs text-muted-foreground">{c.protocol}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {c.deceased_name}
          </h1>
          {c.family_name && (
            <p className="mt-1 text-sm text-muted-foreground">
              Responsável: {c.family_name}
              {c.family_relationship ? ` (${c.family_relationship})` : ""}
              {phone ? ` · ${phone}` : ""}
            </p>
          )}
        </div>

        {canAssign && (
          <DropdownMenu>
            <DropdownTrigger>
              <span className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm shadow-soft hover:bg-muted">
                <UserCog className="size-4 text-muted-foreground" />
                {members.find((m) => m.user_id === assignedTo)?.full_name ?? "Atribuir"}
              </span>
            </DropdownTrigger>
            <DropdownContent className="w-56">
              <DropdownItem onClick={() => assign(null)}>Sem responsável</DropdownItem>
              {members.map((m) => (
                <DropdownItem key={m.user_id} onClick={() => assign(m.user_id)}>
                  {assignedTo === m.user_id && <Check />}
                  <span className={assignedTo === m.user_id ? "" : "pl-6"}>{m.full_name}</span>
                </DropdownItem>
              ))}
            </DropdownContent>
          </DropdownMenu>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Button
          variant="outline"
          size="sm"
          disabled={!phone}
          onClick={() => window.open(whatsappLink(phone), "_blank")}
        >
          <MessageCircle /> WhatsApp
        </Button>
        <Button
          asChild={!!phone}
          variant="outline"
          size="sm"
          disabled={!phone}
        >
          {phone ? (
            <a href={`tel:${phone}`}>
              <Phone /> Ligar
            </a>
          ) : (
            <span>
              <Phone /> Ligar
            </span>
          )}
        </Button>
        {canEdit && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/atendimentos/${c.id}/editar`}>
              <Pencil /> Editar
            </Link>
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={share}>
          <Share2 /> Compartilhar
        </Button>
      </div>
    </Card>
  );
}
