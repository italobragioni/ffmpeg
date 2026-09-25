import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { TrialBanner } from "@/components/layout/trial-banner";
import { hexToHsl } from "@/lib/utils";
import { firstName } from "@/lib/format";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, organization, role, subscription } = await requireSession();
  const primary = hexToHsl(organization.primary_color);

  return (
    <div
      style={primary ? ({ "--primary": primary, "--ring": primary } as React.CSSProperties) : undefined}
    >
      <AppShell
        role={role}
        userName={firstName(user.full_name) || user.full_name || "Usuário"}
        orgName={organization.name}
      >
        <TrialBanner subscription={subscription} role={role} />
        {children}
      </AppShell>
    </div>
  );
}
