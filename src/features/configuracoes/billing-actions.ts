"use server";

import { createClient } from "@/lib/supabase/server";
import { requireCapability } from "@/lib/auth";
import { getStripe, priceIdForPlan } from "@/lib/stripe";
import type { Plan } from "@/lib/constants";

type Result = { ok: true; url: string } | { ok: false; error: string };

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/** Ensure the org has a Stripe customer; returns its id. */
async function ensureCustomer(): Promise<
  { ok: true; customerId: string; orgId: string } | { ok: false; error: string }
> {
  const ctx = await requireCapability("org.configure");
  const supabase = createClient();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("provider_customer_id")
    .eq("organization_id", ctx.organization.id)
    .maybeSingle();

  if (sub?.provider_customer_id) {
    return { ok: true, customerId: sub.provider_customer_id, orgId: ctx.organization.id };
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    name: ctx.organization.name,
    email: ctx.organization.email || undefined,
    metadata: { organization_id: ctx.organization.id },
  });

  await supabase
    .from("subscriptions")
    .update({ provider: "stripe", provider_customer_id: customer.id })
    .eq("organization_id", ctx.organization.id);

  return { ok: true, customerId: customer.id, orgId: ctx.organization.id };
}

export async function createCheckoutSession(plan: Plan): Promise<Result> {
  try {
    const priceId = priceIdForPlan(plan);
    if (!priceId) return { ok: false, error: "Preço deste plano não configurado no Stripe." };

    const cust = await ensureCustomer();
    if (!cust.ok) return cust;

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: cust.customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: cust.orgId,
      subscription_data: { metadata: { organization_id: cust.orgId } },
      allow_promotion_codes: true,
      locale: "pt-BR",
      success_url: `${appUrl()}/configuracoes/plano?status=success`,
      cancel_url: `${appUrl()}/configuracoes/plano?status=cancel`,
    });

    if (!session.url) return { ok: false, error: "Não foi possível iniciar o pagamento." };
    return { ok: true, url: session.url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao conectar ao Stripe." };
  }
}

export async function createPortalSession(): Promise<Result> {
  try {
    const ctx = await requireCapability("org.configure");
    const supabase = createClient();
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("provider_customer_id")
      .eq("organization_id", ctx.organization.id)
      .maybeSingle();

    if (!sub?.provider_customer_id) {
      return { ok: false, error: "Nenhuma assinatura ativa para gerenciar." };
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.provider_customer_id,
      return_url: `${appUrl()}/configuracoes/plano`,
    });
    return { ok: true, url: session.url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao abrir o portal." };
  }
}
