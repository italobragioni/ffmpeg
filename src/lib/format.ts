import {
  format,
  formatDistanceToNow,
  isSameDay,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = typeof value === "string" ? parseISO(value) : value;
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(value?: string | Date | null): string {
  const d = toDate(value);
  return d ? format(d, "dd/MM/yyyy", { locale: ptBR }) : "—";
}

export function formatDateLong(value?: string | Date | null): string {
  const d = toDate(value);
  return d ? format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "—";
}

export function formatDateTime(value?: string | Date | null): string {
  const d = toDate(value);
  return d ? format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—";
}

export function formatTime(value?: string | Date | null): string {
  const d = toDate(value);
  return d ? format(d, "HH:mm", { locale: ptBR }) : "—";
}

export function formatTimeRange(start?: string | null, end?: string | null): string {
  const s = toDate(start);
  const e = toDate(end);
  if (!s) return "—";
  if (!e) return format(s, "HH:mm", { locale: ptBR });
  if (isSameDay(s, e)) {
    return `${format(s, "HH:mm", { locale: ptBR })} às ${format(e, "HH:mm", { locale: ptBR })}`;
  }
  return `${formatDateTime(s)} — ${formatDateTime(e)}`;
}

export function fromNow(value?: string | Date | null): string {
  const d = toDate(value);
  return d ? formatDistanceToNow(d, { addSuffix: true, locale: ptBR }) : "—";
}

export function formatCurrency(value?: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Compact currency for tight spaces (charts): R$ 2,8k. */
export function formatCurrencyCompact(value: number): string {
  if (Math.abs(value) >= 1000) {
    const k = value / 1000;
    return `R$ ${k.toFixed(k % 1 === 0 ? 0 : 1).replace(".", ",")}k`;
  }
  return `R$ ${Math.round(value)}`;
}

/** "Boa tarde" greeting based on local hour. */
export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function firstName(name?: string | null): string {
  return name?.trim().split(/\s+/)[0] ?? "";
}
