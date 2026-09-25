"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireCapability } from "@/lib/auth";

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

const num = (v: unknown) => (v === "" || v === null || v === undefined ? null : Number(v));

const itemSchema = z.object({
  name: z.string().min(1, "Informe o nome do produto."),
  category: z.enum(["urns", "flowers", "materials", "other"]),
  sku: z.string().optional().nullable(),
  quantity: z.preprocess(num, z.number().int().min(0)),
  min_quantity: z.preprocess(num, z.number().int().min(0)),
  cost_price: z.preprocess(num, z.number().min(0).nullable()),
  sale_price: z.preprocess(num, z.number().min(0).nullable()),
});

export async function upsertItem(
  id: string | null,
  input: Record<string, unknown>,
): Promise<Result> {
  const ctx = await requireCapability("inventory.manage");
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0].message };

  const supabase = createClient();
  if (id) {
    const { error } = await supabase.from("inventory_items").update(parsed.data).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("inventory_items")
      .insert({ ...parsed.data, organization_id: ctx.organization.id });
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/estoque");
  return { ok: true, data: undefined };
}

export async function deleteItem(id: string): Promise<Result> {
  await requireCapability("inventory.manage");
  const supabase = createClient();
  const { error } = await supabase.from("inventory_items").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/estoque");
  return { ok: true, data: undefined };
}

/** Register a stock movement (delta applied to quantity by DB trigger). */
export async function registerMovement(
  itemId: string,
  delta: number,
  reason?: string,
): Promise<Result> {
  const ctx = await requireCapability("inventory.manage");
  if (!Number.isFinite(delta) || delta === 0) return { ok: false, error: "Quantidade inválida." };
  const supabase = createClient();
  const { error } = await supabase.from("inventory_movements").insert({
    organization_id: ctx.organization.id,
    item_id: itemId,
    delta,
    reason: reason ?? (delta > 0 ? "Entrada" : "Saída"),
    created_by: ctx.user.id,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/estoque");
  return { ok: true, data: undefined };
}
