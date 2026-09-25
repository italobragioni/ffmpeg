import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsTabs } from "@/features/configuracoes/settings-tabs";
import type { Room } from "@/types";

export const metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const ctx = await requireSession();
  const supabase = createClient();
  const { data: rooms } = await supabase.from("rooms").select("*").order("name");

  return (
    <div>
      <PageHeader title="Configurações" description="Empresa, perfil, salas e plano." />
      <SettingsTabs
        organization={ctx.organization}
        profile={ctx.user}
        rooms={(rooms as Room[]) ?? []}
        canConfigureOrg={can(ctx.role, "org.configure")}
        canManageRooms={can(ctx.role, "calendar.manage")}
      />
    </div>
  );
}
