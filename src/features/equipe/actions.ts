"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireCapability } from "@/lib/auth";
import type { Role } from "@/lib/constants";

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

const inviteSchema = z.object({
  full_name: z.string().min(1, "Informe o nome."),
  email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.enum(["admin", "manager", "attendant", "operational"]),
});

export async function createInvitation(input: {
  full_name: string;
  email?: string;
  phone?: string;
  role: Role;
}): Promise<Result<{ token: string }>> {
  const ctx = await requireCapability("users.manage");
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("invitations")
    .insert({
      organization_id: ctx.organization.id,
      full_name: parsed.data.full_name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      role: parsed.data.role,
      invited_by: ctx.user.id,
    })
    .select("token")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Erro ao convidar." };
  revalidatePath("/equipe");
  return { ok: true, data: { token: data.token } };
}

export async function revokeInvitation(id: string): Promise<Result> {
  await requireCapability("users.manage");
  const supabase = createClient();
  const { error } = await supabase.from("invitations").update({ status: "revoked" }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/equipe");
  return { ok: true, data: undefined };
}

export async function updateMemberRole(memberId: string, role: Role): Promise<Result> {
  await requireCapability("users.manage");
  const supabase = createClient();
  const { error } = await supabase.from("organization_members").update({ role }).eq("id", memberId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/equipe");
  return { ok: true, data: undefined };
}

export async function setMemberStatus(
  memberId: string,
  status: "active" | "suspended",
): Promise<Result> {
  await requireCapability("users.manage");
  const supabase = createClient();
  const { error } = await supabase.from("organization_members").update({ status }).eq("id", memberId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/equipe");
  return { ok: true, data: undefined };
}

export async function removeMember(memberId: string): Promise<Result> {
  const ctx = await requireCapability("users.manage");
  const supabase = createClient();
  // Guard: never remove the last admin.
  const { data: member } = await supabase
    .from("organization_members")
    .select("user_id, role")
    .eq("id", memberId)
    .maybeSingle();
  if (member?.user_id === ctx.user.id) {
    return { ok: false, error: "Você não pode remover a si mesmo." };
  }
  const { error } = await supabase.from("organization_members").delete().eq("id", memberId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/equipe");
  return { ok: true, data: undefined };
}
