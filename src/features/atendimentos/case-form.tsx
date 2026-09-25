"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import {
  User2,
  Users,
  Truck,
  Church,
  Package,
  Check,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createCase, updateCase, checkRoomConflict, type CaseInput } from "./actions";
import type { FuneralCase, Room } from "@/types";

const STEPS = [
  { icon: User2, title: "Falecido" },
  { icon: Users, title: "Família" },
  { icon: Truck, title: "Remoção" },
  { icon: Church, title: "Serviço" },
  { icon: Package, title: "Detalhes" },
];

type FormState = Record<keyof CaseInput, string>;

function emptyState(): FormState {
  return {
    deceased_name: "",
    birth_date: "",
    death_date: "",
    death_time: "",
    death_city: "",
    deceased_notes: "",
    family_name: "",
    family_phone: "",
    family_whatsapp: "",
    family_email: "",
    family_relationship: "",
    removal_place: "",
    removal_address: "",
    removal_date: "",
    removal_time: "",
    removal_responsible: "",
    removal_notes: "",
    service_type: "",
    wake_place: "",
    wake_room_id: "",
    wake_start: "",
    wake_end: "",
    final_place: "",
    final_datetime: "",
    urn: "",
    ornamentation: "",
    vehicle: "",
    internal_notes: "",
  } as FormState;
}

function fromCase(c: FuneralCase): FormState {
  const s = emptyState();
  const dtLocal = (iso: string | null) => (iso ? iso.slice(0, 16) : "");
  return {
    ...s,
    deceased_name: c.deceased_name ?? "",
    birth_date: c.birth_date ?? "",
    death_date: c.death_date ?? "",
    death_time: c.death_time ?? "",
    death_city: c.death_city ?? "",
    deceased_notes: c.deceased_notes ?? "",
    family_name: c.family_name ?? "",
    family_phone: c.family_phone ?? "",
    family_whatsapp: c.family_whatsapp ?? "",
    family_email: c.family_email ?? "",
    family_relationship: c.family_relationship ?? "",
    removal_place: c.removal_place ?? "",
    removal_address: c.removal_address ?? "",
    removal_date: c.removal_date ?? "",
    removal_time: c.removal_time ?? "",
    removal_responsible: c.removal_responsible ?? "",
    removal_notes: c.removal_notes ?? "",
    service_type: c.service_type ?? "",
    wake_place: c.wake_place ?? "",
    wake_room_id: c.wake_room_id ?? "",
    wake_start: dtLocal(c.wake_start),
    wake_end: dtLocal(c.wake_end),
    final_place: c.final_place ?? "",
    final_datetime: dtLocal(c.final_datetime),
    urn: c.urn ?? "",
    ornamentation: c.ornamentation ?? "",
    vehicle: c.vehicle ?? "",
    internal_notes: c.internal_notes ?? "",
  };
}

export function CaseForm({
  rooms,
  initial,
}: {
  rooms: Room[];
  initial?: FuneralCase;
}) {
  const router = useRouter();
  const isEdit = !!initial;
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(initial ? fromCase(initial) : emptyState());
  const [conflict, setConflict] = useState<string | null>(null);

  const set = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Advisory room-conflict check (section 13) — warns, never blocks.
  useEffect(() => {
    if (!form.wake_room_id || !form.wake_start) {
      setConflict(null);
      return;
    }
    let active = true;
    const t = setTimeout(async () => {
      const res = await checkRoomConflict(
        form.wake_room_id,
        form.wake_start,
        form.wake_end || null,
        initial?.id,
      );
      if (active) setConflict(res.conflict ? res.withName ?? "outro evento" : null);
    }, 400);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [form.wake_room_id, form.wake_start, form.wake_end, initial?.id]);

  function next() {
    if (step === 0 && !form.deceased_name.trim()) {
      toast.error("Informe o nome do falecido.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function submit() {
    if (!form.deceased_name.trim()) {
      toast.error("Informe o nome do falecido.");
      setStep(0);
      return;
    }
    setLoading(true);

    if (isEdit) {
      const result = await updateCase(initial!.id, form as CaseInput);
      setLoading(false);
      if (!result.ok) return toast.error(result.error);
      toast.success("Atendimento atualizado.");
      router.push(`/atendimentos/${initial!.id}`);
    } else {
      const result = await createCase(form as CaseInput);
      setLoading(false);
      if (!result.ok) return toast.error(result.error);
      toast.success("Atendimento criado com sucesso.");
      router.push(`/atendimentos/${result.data.id}`);
    }
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Stepper */}
      <div className="mb-6 flex items-center justify-between overflow-x-auto no-scrollbar">
        {STEPS.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => setStep(i)}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full border text-sm transition-colors",
                i < step && "border-primary bg-primary text-primary-foreground",
                i === step && "border-primary bg-accent text-primary",
                i > step && "border-border bg-card text-muted-foreground",
              )}
            >
              {i < step ? <Check className="size-4" /> : <s.icon className="size-4" />}
            </span>
            <span
              className={cn(
                "text-[11px] font-medium",
                i === step ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.title}
            </span>
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          {step === 0 && (
            <Section title="Dados do falecido">
              <Field label="Nome completo" required>
                <Input value={form.deceased_name} onChange={(e) => set("deceased_name", e.target.value)} />
              </Field>
              <Row>
                <Field label="Data de nascimento">
                  <Input type="date" value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} />
                </Field>
                <Field label="Data do falecimento">
                  <Input type="date" value={form.death_date} onChange={(e) => set("death_date", e.target.value)} />
                </Field>
              </Row>
              <Row>
                <Field label="Hora do falecimento">
                  <Input type="time" value={form.death_time} onChange={(e) => set("death_time", e.target.value)} />
                </Field>
                <Field label="Cidade">
                  <Input value={form.death_city} onChange={(e) => set("death_city", e.target.value)} />
                </Field>
              </Row>
              <Field label="Observações">
                <Textarea value={form.deceased_notes} onChange={(e) => set("deceased_notes", e.target.value)} />
              </Field>
            </Section>
          )}

          {step === 1 && (
            <Section title="Responsável / Família" hint="Informe apenas o que já souber.">
              <Field label="Nome do responsável">
                <Input value={form.family_name} onChange={(e) => set("family_name", e.target.value)} />
              </Field>
              <Row>
                <Field label="Telefone">
                  <Input value={form.family_phone} onChange={(e) => set("family_phone", e.target.value)} placeholder="(00) 00000-0000" />
                </Field>
                <Field label="WhatsApp">
                  <Input value={form.family_whatsapp} onChange={(e) => set("family_whatsapp", e.target.value)} placeholder="(00) 00000-0000" />
                </Field>
              </Row>
              <Row>
                <Field label="E-mail">
                  <Input type="email" value={form.family_email} onChange={(e) => set("family_email", e.target.value)} />
                </Field>
                <Field label="Parentesco">
                  <Input value={form.family_relationship} onChange={(e) => set("family_relationship", e.target.value)} placeholder="Filho(a), cônjuge…" />
                </Field>
              </Row>
            </Section>
          )}

          {step === 2 && (
            <Section title="Remoção">
              <Field label="Local da remoção">
                <Input value={form.removal_place} onChange={(e) => set("removal_place", e.target.value)} placeholder="Hospital, residência…" />
              </Field>
              <Field label="Endereço">
                <Input value={form.removal_address} onChange={(e) => set("removal_address", e.target.value)} />
              </Field>
              <Row>
                <Field label="Data">
                  <Input type="date" value={form.removal_date} onChange={(e) => set("removal_date", e.target.value)} />
                </Field>
                <Field label="Horário">
                  <Input type="time" value={form.removal_time} onChange={(e) => set("removal_time", e.target.value)} />
                </Field>
              </Row>
              <Field label="Responsável pela remoção">
                <Input value={form.removal_responsible} onChange={(e) => set("removal_responsible", e.target.value)} />
              </Field>
              <Field label="Observações">
                <Textarea value={form.removal_notes} onChange={(e) => set("removal_notes", e.target.value)} />
              </Field>
            </Section>
          )}

          {step === 3 && (
            <Section title="Serviço">
              <Field label="Tipo de serviço">
                <Select value={form.service_type} onChange={(e) => set("service_type", e.target.value)}>
                  <option value="">Selecione…</option>
                  <option value="burial">Sepultamento</option>
                  <option value="cremation">Cremação</option>
                  <option value="other">Outro</option>
                </Select>
              </Field>
              <Row>
                <Field label="Local do velório">
                  <Input value={form.wake_place} onChange={(e) => set("wake_place", e.target.value)} />
                </Field>
                <Field label="Sala / capela">
                  <Select value={form.wake_room_id} onChange={(e) => set("wake_room_id", e.target.value)}>
                    <option value="">Selecione…</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </Row>
              <Row>
                <Field label="Início do velório">
                  <Input type="datetime-local" value={form.wake_start} onChange={(e) => set("wake_start", e.target.value)} />
                </Field>
                <Field label="Fim do velório">
                  <Input type="datetime-local" value={form.wake_end} onChange={(e) => set("wake_end", e.target.value)} />
                </Field>
              </Row>
              {conflict && (
                <div className="flex items-start gap-2 rounded-md bg-warning/15 px-3 py-2 text-sm text-warning-foreground">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  <span>Existe outro evento agendado para essa sala neste período ({conflict}). Você ainda pode salvar.</span>
                </div>
              )}
              <Field label="Local do sepultamento / cremação">
                <Input value={form.final_place} onChange={(e) => set("final_place", e.target.value)} placeholder="Cemitério / crematório" />
              </Field>
              <Field label="Data e horário">
                <Input type="datetime-local" value={form.final_datetime} onChange={(e) => set("final_datetime", e.target.value)} />
              </Field>
            </Section>
          )}

          {step === 4 && (
            <Section title="Detalhes">
              <Field label="Urna selecionada">
                <Input value={form.urn} onChange={(e) => set("urn", e.target.value)} />
              </Field>
              <Field label="Ornamentação">
                <Input value={form.ornamentation} onChange={(e) => set("ornamentation", e.target.value)} />
              </Field>
              <Field label="Veículo">
                <Input value={form.vehicle} onChange={(e) => set("vehicle", e.target.value)} />
              </Field>
              <Field label="Observações internas">
                <Textarea value={form.internal_notes} onChange={(e) => set("internal_notes", e.target.value)} />
              </Field>
            </Section>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || loading}
            >
              <ArrowLeft /> Voltar
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next}>
                Continuar <ArrowRight />
              </Button>
            ) : (
              <Button onClick={submit} loading={loading}>
                {isEdit ? "Salvar alterações" : "Criar atendimento"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {hint && <p className="mb-4 mt-0.5 text-sm text-muted-foreground">{hint}</p>}
      <div className={cn("space-y-4", !hint && "mt-4")}>{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
