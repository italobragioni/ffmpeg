"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth";
import type { SubscriptionStatus } from "@/lib/constants";

type Result = { ok: true } | { ok: false; error: string };

/** SaaS owner: suspend/reactivate a customer's subscription. */
export async function setOrgStatus(
  organizationId: string,
  status: SubscriptionStatus,
): Promise<Result> {
  await requireSuperAdmin();
  const supabase = createClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({ subscription_status: status })
    .eq("organization_id", organizationId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}
