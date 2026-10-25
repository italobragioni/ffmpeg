import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapCaktoStatus, inferPlan } from "@/lib/cakto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Dig a value out of a nested object trying several dot-paths. */
function pick(obj: unknown, paths: string[]): string | null {
  for (const path of paths) {
    let cur: unknown = obj;
    let ok = true;
    for (const key of path.split(".")) {
      if (cur && typeof cur === "object" && key in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[key];
      } else {
        ok = false;
        break;
      }
    }
    if (ok && cur != null && (typeof cur === "string" || typeof cur === "number")) {
      return String(cur);
    }
  }
  return null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const expected = process.env.CAKTO_WEBHOOK_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CAKTO_WEBHOOK_SECRET não configurado" }, { status: 500 });
  }

  const raw = await request.text();
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    body = {};
  }

  // Verify the shared secret (Cakto may send it in the body or a header).
  const provided =
    pick(body, ["secret", "token", "data.secret", "webhook_secret"]) ??
    request.headers.get("x-cakto-signature") ??
    request.headers.get("x-webhook-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    null;

  if (provided !== expected) {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }

  const statusRaw = pick(body, ["event", "type", "event_type", "status", "data.status", "payment.status"]);
  const status = mapCaktoStatus(statusRaw);

  const ref = pick(body, [
    "ref",
    "data.ref",
    "metadata.ref",
    "external_reference",
    "data.external_reference",
    "utm_content",
    "data.utm.content",
    "src",
  ]);
  const email = pick(body, [
    "customer.email",
    "data.customer.email",
    "buyer.email",
    "data.buyer.email",
    "client.email",
    "data.email",
    "email",
  ]);
  const offerId = pick(body, ["offer.id", "data.offer.id", "product.id", "data.product.id", "offer_id", "plan.id"]);
  let amount = Number(
    pick(body, ["amount", "data.amount", "value", "data.value", "total", "payment.amount"]) ?? "0",
  );
  if (amount > 1000) amount = amount / 100; // normalize cents -> reais

  if (!status) {
    // Unknown/ignored event — acknowledge so Cakto doesn't retry forever.
    return NextResponse.json({ received: true, ignored: statusRaw });
  }

  const admin = createAdminClient();
  const plan = inferPlan(offerId, Number.isFinite(amount) ? amount : null);
  const patch: Record<string, unknown> = {
    provider: "cakto",
    subscription_status: status,
  };
  if (plan) patch.plan = plan;

  // Resolve the organization: prefer the ref we passed in the checkout URL.
  let orgId: string | null = ref && UUID_RE.test(ref) ? ref : null;
  if (!orgId && email) {
    const { data } = await admin
      .from("organizations")
      .select("id")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();
    orgId = data?.id ?? null;
  }

  if (!orgId) {
    return NextResponse.json(
      { received: true, warning: "organização não encontrada", email, ref },
      { status: 200 },
    );
  }

  const { error } = await admin.from("subscriptions").update(patch).eq("organization_id", orgId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: true, organization_id: orgId, status });
}
