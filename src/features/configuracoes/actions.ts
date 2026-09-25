"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireSession, requireCapability } from "@/lib/auth";
import type { Plan } from "@/lib/constants";

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

const orgSchema = z.object({
  name: z.string().min(1, "Informe o nome."),
  cnpj: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  zip_code: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  primary_color: z.string().optional().nullable(),
  logo_url: z.string().optional().nullable(),
});

export async function updateOrganization(input: Record<string, unknown>): Promise<Result> {
  const ctx = await requireCapability("org.configure");
  const parsed = orgSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };
  const supabase = createClient();
  const { error } = await supabase
    .from("organizations")
    .update(parsed.data)
    .eq("id", ctx.organization.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/configuracoes");
  revalidatePath("/dashboard");
  return { ok: true, data: undefined };
}

export async function updateProfile(input: { full_name: string; phone?: string }): Promise<Result> {
  const ctx = await requireSession();
  if (!input.full_name.trim()) return { ok: false, error: "Informe seu nome." };
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: input.full_name.trim(), phone: input.phone || null })
    .eq("id", ctx.user.id);
  if (error) return { ok: false, error: error.message };
  await supabase.auth.updateUser({ data: { full_name: input.full_name.trim() } });
  revalidatePath("/configuracoes");
  return { ok: true, data: undefined };
}

// --- Rooms ------------------------------------------------------------------

const roomSchema = z.object({
  name: z.string().min(1, "Informe o nome da sala."),
  capacity: z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().int().min(0).nullable(),
  ),
  description: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

export async function upsertRoom(id: string | null, input: Record<string, unknown>): Promise<Result> {
  const ctx = await requireCapability("calendar.manage");
  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };
  const supabase = createClient();
  if (id) {
    const { error } = await supabase.from("rooms").update(parsed.data).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("rooms")
      .insert({ ...parsed.data, organization_id: ctx.organization.id });
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/configuracoes");
  return { ok: true, data: undefined };
}

export async function deleteRoom(id: string): Promise<Result> {
  await requireCapability("calendar.manage");
  const supabase = createClient();
  const { error } = await supabase.from("rooms").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/configuracoes");
  return { ok: true, data: undefined };
}

// --- Plan (gateway-agnostic; no real billing wired yet) ---------------------

export async function setPlan(plan: Plan): Promise<Result> {
  const ctx = await requireCapability("org.configure");
  const supabase = createClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({ plan })
    .eq("organization_id", ctx.organization.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/configuracoes/plano");
  return { ok: true, data: undefined };
}
