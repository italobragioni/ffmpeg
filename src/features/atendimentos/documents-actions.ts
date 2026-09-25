"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";

type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

export async function registerDocument(input: {
  caseId: string;
  name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  category: "document" | "authorization" | "receipt" | "other";
}): Promise<Result> {
  const ctx = await requireSession();
  const supabase = createClient();
  const { error } = await supabase.from("documents").insert({
    organization_id: ctx.organization.id,
    case_id: input.caseId,
    name: input.name,
    storage_path: input.storage_path,
    mime_type: input.mime_type,
    size_bytes: input.size_bytes,
    category: input.category,
    uploaded_by: ctx.user.id,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/atendimentos/${input.caseId}`);
  return { ok: true, data: undefined };
}

export async function deleteDocument(
  id: string,
  storagePath: string,
  caseId: string,
): Promise<Result> {
  await requireSession();
  const supabase = createClient();
  await supabase.storage.from("documents").remove([storagePath]);
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/atendimentos/${caseId}`);
  return { ok: true, data: undefined };
}

/** Short-lived signed URL for a private document. */
export async function getDocumentUrl(storagePath: string): Promise<Result<string>> {
  await requireSession();
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(storagePath, 60);
  if (error || !data) return { ok: false, error: error?.message ?? "Erro ao gerar link." };
  return { ok: true, data: data.signedUrl };
}
