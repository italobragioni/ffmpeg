import {
  startOfDay,
  subDays,
  startOfMonth,
  endOfDay,
  subMonths,
  format,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClipboardCheck, ClipboardList, Church, Flame } from "lucide-react";
import { requireCapability } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/features/dashboard/stat-card";
import { ReportFilter } from "@/features/relatorios/report-filter";
import { SERVICE_TYPE_LABELS, type ServiceType } from "@/lib/constants";

export const metadata = { title: "Relatórios" };

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
  status: string;
  service_type: string | null;
  assigned_to: string | null;
  created_at: string;
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: { period?: string; from?: string; to?: string };
}) {
  await requireCapability("reports.view");
  const supabase = createClient();
  const period = searchParams.period ?? "30d";
  const { start, end } = resolveRange(period, searchParams.from, searchParams.to);

  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

  const [{ data: periodCases }, { data: trendCases }, { data: members }] = await Promise.all([
    supabase
      .from("funeral_cases")
      .select("status, service_type, assigned_to, created_at")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString()),
    supabase
      .from("funeral_cases")
      .select("created_at")
      .gte("created_at", sixMonthsAgo.toISOString()),
    supabase.from("organization_members").select("user_id, profile:profiles(full_name)"),
  ]);

  const cases = (periodCases as CaseRow[]) ?? [];
  const total = cases.length;
  const finished = cases.filter((c) => c.status === "finished").length;
  const burials = cases.filter((c) => c.service_type === "burial").length;
  const cremations = cases.filter((c) => c.service_type === "cremation").length;

  // Monthly trend (last 6 months)
  const monthKeys: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    monthKeys.push({ key: format(d, "yyyy-MM"), label: format(d, "MMM", { locale: ptBR }) });
  }
  const trendCounts = new Map<string, number>();
  for (const c of (trendCases as { created_at: string }[]) ?? []) {
    const k = format(parseISO(c.created_at), "yyyy-MM");
    trendCounts.set(k, (trendCounts.get(k) ?? 0) + 1);
  }
  const trend = monthKeys.map((m) => ({ ...m, count: trendCounts.get(m.key) ?? 0 }));
  const maxTrend = Math.max(1, ...trend.map((t) => t.count));

  // Per employee
  const nameByUser = new Map<string, string>();
  for (const m of (members as unknown as { user_id: string; profile: { full_name: string | null } | { full_name: string | null }[] | null }[]) ?? []) {
    const p = Array.isArray(m.profile) ? m.profile[0] : m.profile;
    nameByUser.set(m.user_id, p?.full_name ?? "Usuário");
  }
  const perEmployee = new Map<string, number>();
  for (const c of cases) {
    const name = c.assigned_to ? nameByUser.get(c.assigned_to) ?? "Sem responsável" : "Sem responsável";
    perEmployee.set(name, (perEmployee.get(name) ?? 0) + 1);
  }
  const employeeRows = [...perEmployee.entries()].sort((a, b) => b[1] - a[1]);

  // Service types
  const serviceCounts: Record<string, number> = { burial: 0, cremation: 0, other: 0 };
  for (const c of cases) {
    if (c.service_type && c.service_type in serviceCounts) serviceCounts[c.service_type]++;
  }

  return (
    <div>
      <PageHeader title="Relatórios" description="Acompanhe os números da sua operação." />
      <ReportFilter />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="Atendimentos" value={total} tone="primary" />
        <StatCard icon={ClipboardCheck} label="Concluídos" value={finished} />
        <StatCard icon={Church} label="Sepultamentos" value={burials} />
        <StatCard icon={Flame} label="Cremações" value={cremations} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Atendimentos por mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end justify-between gap-3">
              {trend.map((t) => (
                <div key={t.key} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{t.count}</span>
                  <div
                    className="w-full rounded-t-md bg-primary/80 transition-all"
                    style={{ height: `${(t.count / maxTrend) * 100}%`, minHeight: t.count ? "4px" : "0" }}
                  />
                  <span className="text-xs capitalize text-muted-foreground">{t.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tipos de serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(["burial", "cremation", "other"] as ServiceType[]).map((s) => {
              const value = serviceCounts[s];
              const pct = total ? Math.round((value / total) * 100) : 0;
              return (
                <div key={s}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-foreground">{SERVICE_TYPE_LABELS[s]}</span>
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Atendimentos por funcionário</CardTitle>
        </CardHeader>
        <CardContent>
          {employeeRows.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Sem dados no período.</p>
          ) : (
            <div className="space-y-2">
              {employeeRows.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between border-b border-border/60 py-2 last:border-0">
                  <span className="text-sm text-foreground">{name}</span>
                  <span className="text-sm font-medium text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
