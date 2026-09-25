"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Copy,
  MoreVertical,
  Shield,
  UserMinus,
  Ban,
  RotateCcw,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS, ROLE_ORDER, type Role } from "@/lib/constants";
import { fromNow } from "@/lib/format";
import {
  createInvitation,
  revokeInvitation,
  updateMemberRole,
  setMemberStatus,
  removeMember,
} from "./actions";

interface MemberRow {
  id: string;
  user_id: string;
  role: Role;
  status: "active" | "suspended";
  full_name: string | null;
  phone: string | null;
  last_seen_at: string | null;
}

interface InviteRow {
  id: string;
  full_name: string | null;
  email: string | null;
  role: Role;
  token: string;
  created_at: string;
}

export function TeamManager({
  members,
  invitations,
  appUrl,
  currentUserId,
}: {
  members: MemberRow[];
  invitations: InviteRow[];
  appUrl: string;
  currentUserId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", role: "attendant" as Role });
  const [loading, setLoading] = useState(false);
  const [lastLink, setLastLink] = useState<string | null>(null);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await createInvitation(form);
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    const link = `${appUrl}/convite/${res.data.token}`;
    setLastLink(link);
    navigator.clipboard.writeText(link).catch(() => {});
    toast.success("Convite criado. Link copiado.");
    setForm({ full_name: "", email: "", phone: "", role: "attendant" });
    router.refresh();
  }

  async function changeRole(id: string, role: Role) {
    const res = await updateMemberRole(id, role);
    if (!res.ok) return toast.error(res.error);
    toast.success("Perfil atualizado.");
    router.refresh();
  }

  async function toggleStatus(m: MemberRow) {
    const next = m.status === "active" ? "suspended" : "active";
    const res = await setMemberStatus(m.id, next);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }

  async function remove(id: string) {
    const res = await removeMember(id);
    if (!res.ok) return toast.error(res.error);
    toast.success("Membro removido.");
    router.refresh();
  }

  async function revoke(id: string) {
    const res = await revokeInvitation(id);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setLastLink(null);
            setOpen(true);
          }}
        >
          <UserPlus /> Convidar funcionário
        </Button>
      </div>

      {/* Members */}
      <Card className="divide-y divide-border">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 p-4">
            <Avatar name={m.full_name} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">
                {m.full_name ?? "Usuário"}
                {m.user_id === currentUserId && (
                  <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                )}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {ROLE_LABELS[m.role]}
                {m.phone ? ` · ${m.phone}` : ""}
                {m.last_seen_at ? ` · visto ${fromNow(m.last_seen_at)}` : ""}
              </p>
            </div>
            {m.status === "suspended" && (
              <Badge className="bg-destructive/10 text-destructive">Suspenso</Badge>
            )}
            {m.user_id !== currentUserId && (
              <DropdownMenu>
                <DropdownTrigger>
                  <span className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                    <MoreVertical className="size-4" />
                  </span>
                </DropdownTrigger>
                <DropdownContent className="w-52">
                  <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    Alterar perfil
                  </div>
                  {ROLE_ORDER.map((r) => (
                    <DropdownItem key={r} onClick={() => changeRole(m.id, r)}>
                      <Shield /> {ROLE_LABELS[r]}
                    </DropdownItem>
                  ))}
                  <DropdownSeparator />
                  <DropdownItem onClick={() => toggleStatus(m)}>
                    {m.status === "active" ? (
                      <>
                        <Ban /> Suspender acesso
                      </>
                    ) : (
                      <>
                        <RotateCcw /> Reativar acesso
                      </>
                    )}
                  </DropdownItem>
                  <DropdownItem className="text-destructive" onClick={() => remove(m.id)}>
                    <UserMinus /> Remover
                  </DropdownItem>
                </DropdownContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </Card>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground">Convites pendentes</h2>
          <Card className="divide-y divide-border">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-4">
                <div className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Mail className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{inv.full_name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {ROLE_LABELS[inv.role]}
                    {inv.email ? ` · ${inv.email}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(`${appUrl}/convite/${inv.token}`);
                    toast.success("Link copiado.");
                  }}
                >
                  <Copy /> Link
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => revoke(inv.id)}>
                  Revogar
                </Button>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Invite dialog */}
      <Dialog open={open} onOpenChange={setOpen} title="Convidar funcionário">
        {lastLink ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Compartilhe este link com o funcionário. Ao acessá-lo e criar a conta, ele entra
              automaticamente na sua funerária.
            </p>
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-2">
              <span className="min-w-0 flex-1 truncate text-sm">{lastLink}</span>
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(lastLink);
                  toast.success("Copiado.");
                }}
              >
                <Copy /> Copiar
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
              Concluir
            </Button>
          </div>
        ) : (
          <form onSubmit={invite} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail (opcional)</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone (opcional)</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Perfil</Label>
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                {ROLE_ORDER.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" className="w-full" loading={loading}>
              Gerar convite
            </Button>
          </form>
        )}
      </Dialog>
    </div>
  );
}
