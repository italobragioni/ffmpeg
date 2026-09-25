import { requireCapability } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { InventoryManager } from "@/features/estoque/inventory-manager";
import type { InventoryItem } from "@/types";

export const metadata = { title: "Estoque" };

export default async function EstoquePage() {
  await requireCapability("inventory.manage");
  const supabase = createClient();
  const { data } = await supabase
    .from("inventory_items")
    .select("*")
    .order("category")
    .order("name");

  return (
    <div>
      <PageHeader title="Estoque" description="Urnas, flores e materiais com alerta de estoque baixo." />
      <InventoryManager items={(data as InventoryItem[]) ?? []} />
    </div>
  );
}
