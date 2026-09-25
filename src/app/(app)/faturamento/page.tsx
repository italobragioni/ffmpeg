import Link from "next/link";
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  subMonths,
  format,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Wallet, TrendingUp, CircleDollarSign, Clock, ArrowRight } from "lucide-react";
import { requireCapability } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  SERVICE_TYPE_LABELS,
  paymentStatus,
  type PaymentMethod,
  type ServiceType,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/features/dashboard/stat-card";
import { ReportFilter } from "@/features/relatorios/report-filter";
import { RevenueChart } from "@/features/faturamento/revenue-chart";

export const metadata = { title: "Faturamento" };

function resolveRange(period: string, from?: string, to?: string) {
  const now = new Date();
  if (period === "custom" && from && to) {
    return { start: startOfDay(parseISO(from)), end: endOfDay(parseISO(to)) };
  }
  if (period === "today") return { start: startOfDay(now), end: endOfDay(now) };
  if (period === "7d") return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
  if (period === "month") return { start: startOfMonth(now), end: endOfDay(now) };
  return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
}

interface CaseRow {
  id: string;
  deceased_name: string;
  service_type: string | null;
  total_amount: number | null;
  created_at: string;
}
interface PaymentRow {
  case_id: string;
  amount: number;
  method: string;
  paid_at: string;
}

export default async function FaturamentoPage({
  searchParams,
}: {
  searchParams: { period?: string; from?: string; to?: string };
}) {
  await requireCapability("reports.view");
  const supabase = createClient();
  const period = searchParams.period ?? "30d";
  const { start, end } = resolveRange(period, searchParams.from, searchParams.to);

  const [{ data: casesData }, { data: paymentsData }] = await Promise.all([
    supabase
      .from("funeral_cases")
      .select("id, deceased_name, service_type, total_amount, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("case_payments").select("case_id, amount, method, paid_at"),
  ]);

  const cases = (casesData as CaseRow[]) ?? [];
  const payments = (paymentsData as PaymentRow[]) ?? [];

  const inPeriod = (iso: string) => {
    const t = parseISO(iso).getTime();
    return t >= start.getTime() && t <= end.getTime();
  };

  // Received per case (all time) — for status + outstanding
  const receivedByCase = new Map<string, number>();
  for (const p of payments) {
    receivedByCase.set(p.case_id, (receivedByCase.get(p.case_id) ?? 0) + Number(p.amount));
  }

  // KPIs
  const periodCases = cases.filter((c) => inPeriod(c.created_at));
  const billedInPeriod = periodCases.reduce((s, c) => s + (Number(c.total_amount) || 0), 0);
  const billedCount = periodCases.filter((c) => (Number(c.total_amount) || 0) > 0).length;
  const ticket = billedCount > 0 ? billedInPeriod / billedCount : 0;
  const receivedInPeriod = payments
    .filter((p) => inPeriod(p.paid_at))
    .reduce((s, p) => s + Number(p.amount), 0);
  const outstanding = cases.reduce((s, c) => {
    const total = Number(c.total_amount) || 0;
    const rec = receivedByCase.get(c.id) ?? 0;
    return s + Math.max(total - rec, 0);
  }, 0);

  // Monthly billed (last 6 months)
  const months: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    months.push({ key: format(d, "yyyy-MM"), label: format(d, "MMM", { locale: ptBR }) });
  }
  const billedByMonth = new Map<string, number>();
  for (const c of cases) {
    const k = format(parseISO(c.created_at), "yyyy-MM");
    billedByMonth.set(k, (billedByMonth.get(k) ?? 0) + (Number(c.total_amount) || 0));
  }
  const trend = months.map((m) => ({ label: m.label, value: billedByMonth.get(m.key) ?? 0 }));

  // By service (period)
  const byService: Record<string, number> = { burial: 0, cremation: 0, other: 0 };
  for (const c of periodCases) {
    if (c.service_type && c.service_type in byService) {
      byService[c.service_type] += Number(c.total_amount) || 0;
    }
  }
  const serviceTotal = Object.values(byService).reduce((a, b) => a + b, 0);

  // By method (period)
  const byMethod = new Map<string, number>();
  for (const p of payments.filter((p) => inPeriod(p.paid_at))) {
    byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + Number(p.amount));
  }
  const methodTotal = [...byMethod.values()].reduce((a, b) => a + b, 0);

  // Recent
  const recent = cases.slice(0, 8).map((c) => {
    const total = Number(c.total_amount) || 0;
    const received = receivedByCase.get(c.id) ?? 0;
    return { ...c, total, received, status: paymentStatus(c.total_amount, received) };
  });

  const hasAnyBilling = cases.some((c) => (Number(c.total_amount) || 0) > 0) || payments.length > 0;

  return (
    <div>
      <PageHeader
        title="Faturamento"
        description="Acompanhe a receita da sua funerária: faturado, recebido e a receber."
      />
      <ReportFilter basePath="/faturamento" />

      {!hasAnyBilling && (
        <div className="mb-6 rounded-lg border border-dashed border-border bg-card/50 p-4 text-sm text-muted-foreground">
          Dica: defina o <strong>valor do serviço</strong> e registre <strong>pagamentos</strong> dentro
          de cada atendimento (aba Visão geral → Faturamento). Os números aparecem aqui automaticamente.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Faturado no período" value={formatCurrency(billedInPeriod)} tone="primary" />
        <StatCard icon={CircleDollarSign} label="Recebido no período" value={formatCurrency(receivedInPeriod)} />
        <StatCard icon={Clock} label="A receber (em aberto)" value={formatCurrency(outstanding)} />
        <StatCard icon={Wallet} label="Ticket médio" value={formatCurrency(ticket)} />
      </div>

      {/* Revenue chart */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Receita por mês</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={trend} />
        </CardContent>
      </Card>

      {/* Breakdowns */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receita por tipo de serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(["burial", "cremation", "other"] as ServiceType[]).map((s) => {
              const value = byService[s];
              const pct = serviceTotal ? Math.round((value / serviceTotal) * 100) : 0;
              return (
                <div key={s}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-foreground">{SERVICE_TYPE_LABELS[s]}</span>
                    <span className="text-muted-foreground">{formatCurrency(value)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Formas de pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {methodTotal === 0 ? (
              <p className="py-2 text-center text-sm text-muted-foreground">Nenhum pagamento no período.</p>
            ) : (
              (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[])
                .filter((m) => (byMethod.get(m) ?? 0) > 0)
                .map((m) => {
                  const value = byMethod.get(m) ?? 0;
                  const pct = Math.round((value / methodTotal) * 100);
                  return (
                    <div key={m}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-foreground">{PAYMENT_METHOD_LABELS[m]}</span>
                        <span className="text-muted-foreground">{formatCurrency(value)} · {pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-secondary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent billing */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Atendimentos recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <EmptyState icon={Wallet} title="Sem atendimentos" className="m-4 border-0" />
          ) : (
            <div className="divide-y divide-border">
              {recent.map((c) => (
                <Link
                  key={c.id}
                  href={`/atendimentos/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{c.deceased_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.total > 0
                        ? `${formatCurrency(c.received)} de ${formatCurrency(c.total)}`
                        : "Valor não definido"}
                    </p>
                  </div>
                  <Badge className={PAYMENT_STATUS_STYLES[c.status]}>
                    {PAYMENT_STATUS_LABELS[c.status]}
                  </Badge>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
