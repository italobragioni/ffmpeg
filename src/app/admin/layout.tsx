import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth";
import { Logo } from "@/components/brand/logo";

export const metadata = { title: "Super Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <ShieldCheck className="size-3.5" /> Super Admin
            </span>
          </div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Voltar ao app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">{children}</main>
    </div>
  );
}
