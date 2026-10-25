import "server-only";
import type { Plan } from "@/lib/constants";

/** Hosted checkout URL per plan (configured in the Cakto dashboard). */
export function caktoCheckoutUrl(plan: Plan): string | null {
  const map: Record<Plan, string | undefined> = {
    essential: process.env.CAKTO_CHECKOUT_ESSENCIAL,
    pro: process.env.CAKTO_CHECKOUT_PRO,
  };
  return map[plan] ?? null;
}

export function caktoEnabled(): boolean {
  return !!(process.env.CAKTO_CHECKOUT_ESSENCIAL || process.env.CAKTO_CHECKOUT_PRO);
}

/**
 * Build a checkout URL carrying our reconciliation data so the webhook can tie
 * the purchase back to the organization. We pass both a `ref` (org id) and the
 * customer e-mail (prefill + fallback match).
 */
export function buildCaktoUrl(plan: Plan, orgId: string, email?: string | null): string | null {
  const base = caktoCheckoutUrl(plan);
  if (!base) return null;
  const url = new URL(base);
  url.searchParams.set("ref", orgId);
  if (email) url.searchParams.set("email", email);
  return url.toString();
}

/** Best-effort: map a Cakto event/status string to our subscription_status. */
export function mapCaktoStatus(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (/(refund|reembols|charge|estorn|cancel|refus|recus|expir|declin)/.test(s)) return "cancelled";
  if (/(approv|aprovad|paid|pago|complete|active|ativ|renew|renov|authorized)/.test(s)) return "active";
  if (/(pending|aguard|waiting|processing|em_analise|analise)/.test(s)) return "past_due";
  return null;
}

/** Best-effort: infer the plan from a Cakto payload (offer id or amount). */
export function inferPlan(offerId: string | null | undefined, amount: number | null): Plan | null {
  if (offerId) {
    if (offerId === process.env.CAKTO_OFFER_PRO) return "pro";
    if (offerId === process.env.CAKTO_OFFER_ESSENCIAL) return "essential";
  }
  if (amount != null) {
    if (amount >= 80) return "pro";
    if (amount >= 30) return "essential";
  }
  return null;
}
