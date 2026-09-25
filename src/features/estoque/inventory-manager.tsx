"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, Pencil, Trash2, Package, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { INVENTORY_CATEGORY_LABELS, type InventoryCategory } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { upsertItem, deleteItem, registerMovement } from "./actions";
import type { InventoryItem } from "@/types";
import { cn } from "@/lib/utils";

const emptyForm = {
  name: "",
  category: "urns" as InventoryCategory,
  sku: "",
  quantity: "0",
  min_quantity: "0",
  cost_price: "",
  sale_price: "",
};

export function InventoryManager({ items }: { items: InventoryItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(false);

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm });
    setOpen(true);
  }
  function openEdit(item: InventoryItem) {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      sku: item.sku ?? "",
      quantity: String(item.quantity),
      min_quantity: String(item.min_quantity),
      cost_price: item.cost_price != null ? String(item.cost_price) : "",
      sale_price: item.sale_price != null ? String(item.sale_price) : "",
    });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await upsertItem(editing?.id ?? null, form);
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(editing ? "Item atualizado." : "Item adicionado.");
    setOpen(false);
    router.refresh();
  }

  async function move(item: InventoryItem, delta: number) {
    if (item.quantity + delta < 0) return;
    const res = await registerMovement(item.id, delta);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }

  async function remove(id: string) {
    const res = await deleteItem(id);
    if (!res.ok) return toast.error(res.error);
    toast.success("Item removido.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <PackagePlus /> Novo item
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Estoque vazio"
          description="Cadastre urnas, flores e materiais para acompanhar seu estoque."
          action={
            <Button onClick={openNew}>
              <Plus /> Adicionar item
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const low = item.quantity <= item.min_quantity;
            return (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {INVENTORY_CATEGORY_LABELS[item.category]}
                      {item.sku ? ` · ${item.sku}` : ""}
                    </p>
                  </div>
                  {low && <Badge className="bg-warning/15 text-warning-foreground">Estoque baixo</Badge>}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="size-8" onClick={() => move(item, -1)}>
                      <Minus className="size-4" />
                    </Button>
                    <span className={cn("min-w-8 text-center text-lg font-semibold", low ? "text-warning-foreground" : "text-foreground")}>
                      {item.quantity}
                    </span>
                    <Button size="icon" variant="outline" className="size-8" onClick={() => move(item, 1)}>
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <div className="flex gap-0.5">
                    <button onClick={() => openEdit(item)} className="rounded p-1.5 text-muted-foreground hover:bg-muted">
                      <Pencil className="size-4" />
                    </button>
                    <button onClick={() => remove(item.id)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {item.sale_price != null && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Venda: {formatCurrency(item.sale_price)}
                  </p>
                )}
                {item.min_quantity > 0 && (
                  <p className="text-xs text-muted-foreground">Mínimo: {item.min_quantity}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen} title={editing ? "Editar item" : "Novo item"}>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Produto</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as InventoryCategory })}
              >
                {Object.entries(INVENTORY_CATEGORY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Código / SKU</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Quantidade</Label>
              <Input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Estoque mínimo</Label>
              <Input type="number" min={0} value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Preço de custo</Label>
              <Input type="number" step="0.01" min={0} value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Preço de venda</Label>
              <Input type="number" step="0.01" min={0} value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} />
            </div>
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            {editing ? "Salvar" : "Adicionar"}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
