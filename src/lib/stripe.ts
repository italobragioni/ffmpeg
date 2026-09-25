import "server-only";
import Stripe from "stripe";
import type { Plan } from "@/lib/constants";

let cached: Stripe | null = null;

/** Lazy server-side Stripe client. Throws if the secret key is missing. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurada.");
  if (!cached) cached = new Stripe(key);
  return cached;
}

/** Map a SOLENE plan to its Stripe Price ID (from env). */
export function priceIdForPlan(plan: Plan): string | null {
  const map: Record<Plan, string | undefined> = {
    essential: process.env.STRIPE_PRICE_ESSENCIAL,
    pro: process.env.STRIPE_PRICE_PRO,
  };
  return map[plan] ?? null;
}

/** Map a Stripe Price ID back to a SOLENE plan. */
export function planForPriceId(priceId: string | null | undefined): Plan | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_ESSENCIAL) return "essential";
  return null;
}

/** Map a Stripe subscription status to our subscription_status. */
export function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "trialing":
      return "trial";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "cancelled";
    default:
      return "past_due";
  }
}
