"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Plus, Trash2, Check, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  paymentStatus,
  type PaymentMethod,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { setCaseAmount, addPayment, deletePayment } from "./actions";
import type { CasePayment } from "@/types";

export function BillingCard({
  caseId,
  total,
  payments,
  canEdit,
}: {
  caseId: string;
  total: number | null;
  payments: CasePayment[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editingTotal, setEditingTotal] = useState(false);
  const [totalInput, setTotalInput] = useState(total != null ? String(total) : "");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pay, setPay] = useState({
    amount: "",
    method: "pix" as PaymentMethod,
    paid_at: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const received = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalNum = Number(total) || 0;
  const balance = Math.max(totalNum - received, 0);
  const status = paymentStatus(total, received);

  async function saveTotal() {
    setBusy(true);
    const res = await setCaseAmount(caseId, totalInput);
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    setEditingTotal(false);
    toast.success("Valor do serviço atualizado.");
    router.refresh();
  }

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await addPayment(caseId, {
      amount: pay.amount,
      method: pay.method,
      paid_at: pay.paid_at,
      notes: pay.notes,
    });
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    setPay({ ...pay, amount: "", notes: "" });
    setAdding(false);
    toast.success("Pagamento registrado.");
    router.refresh();
  }

  async function remove(id: string) {
    const res = await deletePayment(id, caseId);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="size-4 text-primary" /> Faturamento
        </CardTitle>
        <Badge className={PAYMENT_STATUS_STYLES[status]}>{PAYMENT_STATUS_LABELS[status]}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Totals */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">Valor</p>
            <p className="mt-0.5 break-words text-sm font-semibold text-foreground">{formatCurrency(totalNum)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">Recebido</p>
            <p className="mt-0.5 break-words text-sm font-semibold text-success">{formatCurrency(received)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">A receber</p>
            <p className="mt-0.5 break-words text-sm font-semibold text-foreground">{formatCurrency(balance)}</p>
          </div>
        </div>

        {/* Edit total */}
        {canEdit &&
          (editingTotal ? (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="mb-1 block text-xs">Valor do serviço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={totalInput}
                  onChange={(e) => setTotalInput(e.target.value)}
                  autoFocus
                />
              </div>
              <Button size="sm" onClick={saveTotal} loading={busy}>
                <Check /> Salvar
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditingTotal(true)}>
              <Pencil /> {totalNum > 0 ? "Alterar valor do serviço" : "Definir valor do serviço"}
            </Button>
          ))}

        {/* Payments list */}
        {payments.length > 0 && (
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground">Pagamentos</p>
            {payments.map((p) => (
              <div key={p.id} className="flex items-center gap-3 text-sm">
                <span className="flex-1 text-foreground">
                  {formatCurrency(Number(p.amount))}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {PAYMENT_METHOD_LABELS[p.method]} · {formatDate(p.paid_at)}
                  </span>
                </span>
                {canEdit && (
                  <button
                    onClick={() => remove(p.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                    aria-label="Excluir pagamento"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add payment */}
        {canEdit &&
          (adding ? (
            <form onSubmit={submitPayment} className="space-y-3 border-t border-border pt-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="mb-1 block text-xs">Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={pay.amount}
                    onChange={(e) => setPay({ ...pay, amount: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">Forma</Label>
                  <Select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value as PaymentMethod })}>
                    {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                      <option key={m} value={m}>
                        {PAYMENT_METHOD_LABELS[m]}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Data</Label>
                <Input type="date" value={pay.paid_at} onChange={(e) => setPay({ ...pay, paid_at: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" loading={busy}>
                  Registrar
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <Button variant="secondary" size="sm" className="w-full" onClick={() => setAdding(true)}>
              <Plus /> Registrar pagamento
            </Button>
          ))}
      </CardContent>
    </Card>
  );
}
