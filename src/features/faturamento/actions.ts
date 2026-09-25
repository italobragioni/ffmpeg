"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { can, type PaymentMethod } from "@/lib/constants";

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

const money = (v: unknown) => (v === "" || v == null ? null : Number(v));

/** Set the total billed amount for a case. */
export async function setCaseAmount(caseId: string, total: unknown): Promise<Result> {
  const ctx = await requireSession();
  if (!can(ctx.role, "cases.edit")) return { ok: false, error: "Sem permissão." };
  const value = money(total);
  if (value != null && (!Number.isFinite(value) || value < 0)) {
    return { ok: false, error: "Valor inválido." };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("funeral_cases")
    .update({ total_amount: value })
    .eq("id", caseId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/atendimentos/${caseId}`);
  revalidatePath("/faturamento");
  return { ok: true, data: undefined };
}

const paymentSchema = z.object({
  amount: z.preprocess(money, z.number().positive("Informe um valor maior que zero.")),
  method: z.enum(["dinheiro", "pix", "cartao", "boleto", "convenio", "outro"]),
  paid_at: z.string().min(1, "Informe a data."),
  notes: z.string().optional().nullable(),
});

export async function addPayment(
  caseId: string,
  input: { amount: unknown; method: PaymentMethod; paid_at: string; notes?: string },
): Promise<Result> {
  const ctx = await requireSession();
  if (!can(ctx.role, "cases.edit")) return { ok: false, error: "Sem permissão." };
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };

  const supabase = createClient();
  const { error } = await supabase.from("case_payments").insert({
    organization_id: ctx.organization.id,
    case_id: caseId,
    amount: parsed.data.amount,
    method: parsed.data.method,
    paid_at: parsed.data.paid_at,
    notes: parsed.data.notes || null,
    created_by: ctx.user.id,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/atendimentos/${caseId}`);
  revalidatePath("/faturamento");
  return { ok: true, data: undefined };
}

export async function deletePayment(id: string, caseId: string): Promise<Result> {
  const ctx = await requireSession();
  if (!can(ctx.role, "cases.edit")) return { ok: false, error: "Sem permissão." };
  const supabase = createClient();
  const { error } = await supabase.from("case_payments").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/atendimentos/${caseId}`);
  revalidatePath("/faturamento");
  return { ok: true, data: undefined };
}
