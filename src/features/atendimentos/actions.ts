"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { can, CASE_STATUS_ORDER, type CaseStatus } from "@/lib/constants";
import { slugify, randomSlugSuffix } from "@/lib/utils";

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

const caseSchema = z.object({
  deceased_name: z.string().min(1, "Informe o nome do falecido."),
  birth_date: z.preprocess(emptyToNull, z.string().nullable()),
  death_date: z.preprocess(emptyToNull, z.string().nullable()),
  death_time: z.preprocess(emptyToNull, z.string().nullable()),
  death_city: z.preprocess(emptyToNull, z.string().nullable()),
  deceased_notes: z.preprocess(emptyToNull, z.string().nullable()),

  family_name: z.preprocess(emptyToNull, z.string().nullable()),
  family_phone: z.preprocess(emptyToNull, z.string().nullable()),
  family_whatsapp: z.preprocess(emptyToNull, z.string().nullable()),
  family_email: z.preprocess(emptyToNull, z.string().nullable()),
  family_relationship: z.preprocess(emptyToNull, z.string().nullable()),

  removal_place: z.preprocess(emptyToNull, z.string().nullable()),
  removal_address: z.preprocess(emptyToNull, z.string().nullable()),
  removal_date: z.preprocess(emptyToNull, z.string().nullable()),
  removal_time: z.preprocess(emptyToNull, z.string().nullable()),
  removal_responsible: z.preprocess(emptyToNull, z.string().nullable()),
  removal_notes: z.preprocess(emptyToNull, z.string().nullable()),

  service_type: z.preprocess(emptyToNull, z.enum(["burial", "cremation", "other"]).nullable()),
  wake_place: z.preprocess(emptyToNull, z.string().nullable()),
  wake_room_id: z.preprocess(emptyToNull, z.string().uuid().nullable()),
  wake_start: z.preprocess(emptyToNull, z.string().nullable()),
  wake_end: z.preprocess(emptyToNull, z.string().nullable()),
  final_place: z.preprocess(emptyToNull, z.string().nullable()),
  final_datetime: z.preprocess(emptyToNull, z.string().nullable()),

  urn: z.preprocess(emptyToNull, z.string().nullable()),
  ornamentation: z.preprocess(emptyToNull, z.string().nullable()),
  vehicle: z.preprocess(emptyToNull, z.string().nullable()),
  internal_notes: z.preprocess(emptyToNull, z.string().nullable()),
});

export type CaseInput = z.input<typeof caseSchema>;
type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

/** Auto-create calendar events from the case's scheduled dates. */
async function syncCaseEvents(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  caseId: string,
  data: z.infer<typeof caseSchema>,
) {
  // Remove existing auto-generated events for this case, then recreate.
  await supabase.from("calendar_events").delete().eq("case_id", caseId);

  const events: Record<string, unknown>[] = [];
  const name = data.deceased_name;

  if (data.removal_date) {
    const starts = data.removal_time
      ? `${data.removal_date}T${data.removal_time}`
      : `${data.removal_date}T08:00`;
    events.push({
      organization_id: orgId,
      case_id: caseId,
      type: "removal",
      title: `Remoção — ${name}`,
      location: data.removal_place,
      responsible: data.removal_responsible,
      starts_at: new Date(starts).toISOString(),
    });
  }
  if (data.wake_start) {
    events.push({
      organization_id: orgId,
      case_id: caseId,
      room_id: data.wake_room_id,
      type: "wake",
      title: `Velório — ${name}`,
      location: data.wake_place,
      starts_at: new Date(data.wake_start).toISOString(),
      ends_at: data.wake_end ? new Date(data.wake_end).toISOString() : null,
    });
  }
  if (data.final_datetime) {
    events.push({
      organization_id: orgId,
      case_id: caseId,
      type: data.service_type === "cremation" ? "cremation" : "burial",
      title: `${data.service_type === "cremation" ? "Cremação" : "Sepultamento"} — ${name}`,
      location: data.final_place,
      starts_at: new Date(data.final_datetime).toISOString(),
    });
  }
  if (events.length) await supabase.from("calendar_events").insert(events);
}

export async function createCase(input: CaseInput): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireSession();
  if (!can(ctx.role, "cases.create")) return { ok: false, error: "Sem permissão." };

  const parsed = caseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos." };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("funeral_cases")
    .insert({
      ...parsed.data,
      organization_id: ctx.organization.id,
      assigned_to: ctx.user.id,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Erro ao criar." };

  await syncCaseEvents(supabase, ctx.organization.id, data.id, parsed.data);

  revalidatePath("/atendimentos");
  revalidatePath("/dashboard");
  revalidatePath("/agenda");
  return { ok: true, data: { id: data.id } };
}

export async function updateCase(id: string, input: CaseInput): Promise<ActionResult> {
  const ctx = await requireSession();
  if (!can(ctx.role, "cases.edit")) return { ok: false, error: "Sem permissão." };

  const parsed = caseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados inválidos." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("funeral_cases").update(parsed.data).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await syncCaseEvents(supabase, ctx.organization.id, id, parsed.data);

  revalidatePath(`/atendimentos/${id}`);
  revalidatePath("/atendimentos");
  revalidatePath("/agenda");
  return { ok: true, data: undefined };
}

export async function updateCaseStatus(id: string, status: CaseStatus): Promise<ActionResult> {
  await requireSession();
  if (!CASE_STATUS_ORDER.includes(status)) return { ok: false, error: "Status inválido." };
  const supabase = createClient();
  const { error } = await supabase.from("funeral_cases").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/atendimentos/${id}`);
  revalidatePath("/atendimentos");
  revalidatePath("/dashboard");
  return { ok: true, data: undefined };
}

export async function assignCase(id: string, userId: string | null): Promise<ActionResult> {
  const ctx = await requireSession();
  if (!can(ctx.role, "cases.assign")) return { ok: false, error: "Sem permissão." };
  const supabase = createClient();
  const { error } = await supabase
    .from("funeral_cases")
    .update({ assigned_to: userId })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/atendimentos/${id}`);
  revalidatePath("/atendimentos");
  return { ok: true, data: undefined };
}

/**
 * Detect a room booking conflict for the given window (section 13). Advisory
 * only — the UI warns but never blocks.
 */
export async function checkRoomConflict(
  roomId: string,
  start: string,
  end: string | null,
  excludeCaseId?: string,
): Promise<{ conflict: boolean; withName?: string }> {
  await requireSession();
  if (!roomId || !start) return { conflict: false };
  const supabase = createClient();
  const startIso = new Date(start).toISOString();
  const endIso = end ? new Date(end).toISOString() : new Date(new Date(start).getTime() + 2 * 3600_000).toISOString();

  let query = supabase
    .from("calendar_events")
    .select("title, starts_at, ends_at, case_id")
    .eq("room_id", roomId)
    .lt("starts_at", endIso);
  if (excludeCaseId) query = query.neq("case_id", excludeCaseId);

  const { data } = await query;
  const overlap = (data ?? []).find((e) => {
    const eEnd = e.ends_at ?? new Date(new Date(e.starts_at).getTime() + 2 * 3600_000).toISOString();
    return eEnd > startIso;
  });
  return overlap ? { conflict: true, withName: overlap.title } : { conflict: false };
}

// --- Notes -----------------------------------------------------------------

export async function addNote(caseId: string, body: string): Promise<ActionResult> {
  const ctx = await requireSession();
  const text = body.trim();
  if (!text) return { ok: false, error: "A observação está vazia." };
  const supabase = createClient();
  const { error } = await supabase.from("case_notes").insert({
    organization_id: ctx.organization.id,
    case_id: caseId,
    author_id: ctx.user.id,
    kind: "note",
    body: text,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/atendimentos/${caseId}`);
  return { ok: true, data: undefined };
}

// --- Checklist tasks --------------------------------------------------------

export async function toggleTask(taskId: string, isDone: boolean): Promise<ActionResult> {
  await requireSession();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("case_tasks")
    .update({ is_done: isDone })
    .eq("id", taskId)
    .select("case_id")
    .single();
  if (error) return { ok: false, error: error.message };
  if (data) revalidatePath(`/atendimentos/${data.case_id}`);
  return { ok: true, data: undefined };
}

export async function addTask(caseId: string, title: string): Promise<ActionResult> {
  const ctx = await requireSession();
  const text = title.trim();
  if (!text) return { ok: false, error: "Informe o título da tarefa." };
  const supabase = createClient();
  const { count } = await supabase
    .from("case_tasks")
    .select("id", { count: "exact", head: true })
    .eq("case_id", caseId);
  const { error } = await supabase.from("case_tasks").insert({
    organization_id: ctx.organization.id,
    case_id: caseId,
    title: text,
    position: count ?? 0,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/atendimentos/${caseId}`);
  return { ok: true, data: undefined };
}

export async function editTask(taskId: string, title: string, caseId: string): Promise<ActionResult> {
  await requireSession();
  const text = title.trim();
  if (!text) return { ok: false, error: "Informe o título da tarefa." };
  const supabase = createClient();
  const { error } = await supabase.from("case_tasks").update({ title: text }).eq("id", taskId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/atendimentos/${caseId}`);
  return { ok: true, data: undefined };
}

export async function deleteTask(taskId: string, caseId: string): Promise<ActionResult> {
  await requireSession();
  const supabase = createClient();
  const { error } = await supabase.from("case_tasks").delete().eq("id", taskId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/atendimentos/${caseId}`);
  return { ok: true, data: undefined };
}

// --- Public memorial --------------------------------------------------------

export async function ensureMemorial(caseId: string, deceasedName: string): Promise<ActionResult<{ slug: string }>> {
  const ctx = await requireSession();
  if (!can(ctx.role, "portal.configure")) return { ok: false, error: "Sem permissão." };
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("public_memorials")
    .select("slug")
    .eq("case_id", caseId)
    .maybeSingle();
  if (existing) return { ok: true, data: { slug: existing.slug } };

  const slug = `${slugify(deceasedName)}-${randomSlugSuffix()}`;
  const { error } = await supabase.from("public_memorials").insert({
    organization_id: ctx.organization.id,
    case_id: caseId,
    slug,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/atendimentos/${caseId}`);
  return { ok: true, data: { slug } };
}

export async function setMemorialPublished(
  memorialId: string,
  published: boolean,
  caseId: string,
): Promise<ActionResult> {
  const ctx = await requireSession();
  if (!can(ctx.role, "portal.configure")) return { ok: false, error: "Sem permissão." };
  const supabase = createClient();
  const { error } = await supabase
    .from("public_memorials")
    .update({ is_published: published })
    .eq("id", memorialId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/atendimentos/${caseId}`);
  return { ok: true, data: undefined };
}

export async function moderateMessage(
  id: string,
  status: "approved" | "rejected",
  caseId: string,
): Promise<ActionResult> {
  const ctx = await requireSession();
  if (!can(ctx.role, "portal.configure")) return { ok: false, error: "Sem permissão." };
  const supabase = createClient();
  const { error } = await supabase
    .from("memorial_messages")
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: ctx.user.id })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/atendimentos/${caseId}`);
  return { ok: true, data: undefined };
}

export async function deleteMessage(id: string, caseId: string): Promise<ActionResult> {
  const ctx = await requireSession();
  if (!can(ctx.role, "portal.configure")) return { ok: false, error: "Sem permissão." };
  const supabase = createClient();
  const { error } = await supabase.from("memorial_messages").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/atendimentos/${caseId}`);
  return { ok: true, data: undefined };
}
