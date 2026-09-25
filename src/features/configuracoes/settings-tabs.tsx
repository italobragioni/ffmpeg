"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Building2, Users, CreditCard, DoorOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { updateOrganization, updateProfile, upsertRoom, deleteRoom } from "./actions";
import { fetchAddressByCep, formatCep } from "@/lib/cep";
import type { Organization, Profile, Room } from "@/types";

export function SettingsTabs({
  organization,
  profile,
  rooms,
  canConfigureOrg,
  canManageRooms,
}: {
  organization: Organization;
  profile: Profile;
  rooms: Room[];
  canConfigureOrg: boolean;
  canManageRooms: boolean;
}) {
  return (
    <Tabs defaultValue="company">
      <TabsList>
        <TabsTrigger value="company">Empresa</TabsTrigger>
        <TabsTrigger value="profile">Perfil</TabsTrigger>
        <TabsTrigger value="rooms">Salas</TabsTrigger>
        <TabsTrigger value="more">Mais</TabsTrigger>
      </TabsList>

      <TabsContent value="company">
        <CompanyForm organization={organization} canEdit={canConfigureOrg} />
      </TabsContent>
      <TabsContent value="profile">
        <ProfileForm profile={profile} />
      </TabsContent>
      <TabsContent value="rooms">
        <RoomsSection rooms={rooms} canManage={canManageRooms} />
      </TabsContent>
      <TabsContent value="more">
        <MoreSection />
      </TabsContent>
    </Tabs>
  );
}

function CompanyForm({ organization, canEdit }: { organization: Organization; canEdit: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(organization.logo_url ?? "");
  const [color, setColor] = useState(organization.primary_color ?? "#174C4F");
  const [form, setForm] = useState({
    name: organization.name ?? "",
    cnpj: organization.cnpj ?? "",
    phone: organization.phone ?? "",
    whatsapp: organization.whatsapp ?? "",
    email: organization.email ?? "",
    zip_code: organization.zip_code ?? "",
    street: organization.street ?? "",
    number: organization.number ?? "",
    complement: organization.complement ?? "",
    district: organization.district ?? "",
    city: organization.city ?? "",
    state: organization.state ?? "",
  });

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "png";
    const path = `${organization.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("branding").upload(path, file, { upsert: true });
    if (error) {
      setUploading(false);
      return toast.error("Falha no upload", { description: error.message });
    }
    const url = supabase.storage.from("branding").getPublicUrl(path).data.publicUrl;
    setLogoUrl(url);
    setUploading(false);
    toast.success("Logo enviada. Salve para aplicar.");
  }

  async function handleCep(value: string) {
    const masked = formatCep(value);
    setForm((f) => ({ ...f, zip_code: masked }));
    if (masked.replace(/\D/g, "").length === 8) {
      setCepLoading(true);
      const addr = await fetchAddressByCep(masked);
      setCepLoading(false);
      if (addr) {
        setForm((f) => ({
          ...f,
          zip_code: masked,
          street: addr.street || f.street,
          district: addr.district || f.district,
          city: addr.city || f.city,
          state: addr.state || f.state,
        }));
      }
    }
  }

  async function save() {
    setLoading(true);
    const res = await updateOrganization({ ...form, primary_color: color, logo_url: logoUrl || null });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("Dados da empresa atualizados.");
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="size-full object-contain" />
            ) : (
              <Building2 className="size-6 text-muted-foreground" />
            )}
          </div>
          {canEdit && (
            <div className="flex items-center gap-3">
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onLogo} />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="animate-spin" /> : null}
                Alterar logo
              </Button>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Cor</Label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="size-8 cursor-pointer rounded border border-border"
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Nome da funerária</Label>
          <Input value={form.name} disabled={!canEdit} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="CNPJ" value={form.cnpj} disabled={!canEdit} onChange={(v) => setForm({ ...form, cnpj: v })} />
          <Field label="Telefone" value={form.phone} disabled={!canEdit} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="WhatsApp" value={form.whatsapp} disabled={!canEdit} onChange={(v) => setForm({ ...form, whatsapp: v })} />
          <Field label="E-mail" value={form.email} disabled={!canEdit} onChange={(v) => setForm({ ...form, email: v })} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label={cepLoading ? "CEP (buscando…)" : "CEP"} value={form.zip_code} disabled={!canEdit} onChange={handleCep} />
          <div className="col-span-2">
            <Field label="Rua" value={form.street} disabled={!canEdit} onChange={(v) => setForm({ ...form, street: v })} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Número" value={form.number} disabled={!canEdit} onChange={(v) => setForm({ ...form, number: v })} />
          <div className="col-span-2">
            <Field label="Bairro" value={form.district} disabled={!canEdit} onChange={(v) => setForm({ ...form, district: v })} />
          </div>
        </div>
        <Field label="Cidade" value={form.city} disabled={!canEdit} onChange={(v) => setForm({ ...form, city: v })} />
        {canEdit && (
          <Button onClick={save} loading={loading}>
            Salvar alterações
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [name, setName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const res = await updateProfile({ full_name: name, phone });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("Perfil atualizado.");
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="space-y-1.5">
          <Label>Nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Telefone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <Button onClick={save} loading={loading}>
          Salvar
        </Button>
      </CardContent>
    </Card>
  );
}

function RoomsSection({ rooms, canManage }: { rooms: Room[]; canManage: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState({ name: "", capacity: "", description: "", is_active: true });
  const [loading, setLoading] = useState(false);

  function openNew() {
    setEditing(null);
    setForm({ name: "", capacity: "", description: "", is_active: true });
    setOpen(true);
  }
  function openEdit(r: Room) {
    setEditing(r);
    setForm({
      name: r.name,
      capacity: r.capacity != null ? String(r.capacity) : "",
      description: r.description ?? "",
      is_active: r.is_active,
    });
    setOpen(true);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await upsertRoom(editing?.id ?? null, form);
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(editing ? "Sala atualizada." : "Sala criada.");
    setOpen(false);
    router.refresh();
  }
  async function remove(id: string) {
    const res = await deleteRoom(id);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={openNew}>
            <Plus /> Nova sala
          </Button>
        </div>
      )}
      {rooms.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Nenhuma sala cadastrada.
          </CardContent>
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {rooms.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-4">
              <div className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <DoorOpen className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{r.name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.capacity ? `${r.capacity} lugares` : "Sem capacidade definida"}
                </p>
              </div>
              {!r.is_active && <Badge className="bg-muted text-muted-foreground">Inativa</Badge>}
              {canManage && (
                <div className="flex gap-0.5">
                  <button onClick={() => openEdit(r)} className="rounded p-1.5 text-muted-foreground hover:bg-muted">
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => remove(r.id)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen} title={editing ? "Editar sala" : "Nova sala"}>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label>Capacidade (opcional)</Label>
            <Input type="number" min={0} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="size-4 rounded border-input"
            />
            Sala ativa
          </label>
          <Button type="submit" className="w-full" loading={loading}>
            {editing ? "Salvar" : "Criar"}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}

function MoreSection() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Link href="/equipe">
        <Card className="p-5 transition-shadow hover:shadow-lift">
          <Users className="mb-2 size-5 text-primary" />
          <p className="font-medium text-foreground">Usuários</p>
          <p className="text-sm text-muted-foreground">Convide e gerencie sua equipe.</p>
        </Card>
      </Link>
      <Link href="/configuracoes/plano">
        <Card className="p-5 transition-shadow hover:shadow-lift">
          <CreditCard className="mb-2 size-5 text-primary" />
          <p className="font-medium text-foreground">Plano</p>
          <p className="text-sm text-muted-foreground">Assinatura, teste e cobrança.</p>
        </Card>
      </Link>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
