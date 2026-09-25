"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ClipboardList,
  Calendar,
  Plus,
  Menu as MenuIcon,
  LogOut,
  User,
  ChevronsUpDown,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown-menu";
import { GlobalSearch } from "./global-search";
import { NotificationsMenu } from "./notifications-menu";
import { MAIN_NAV, ROLE_LABELS, can, type Role } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ShellProps {
  role: Role;
  userName: string;
  orgName: string;
  children: React.ReactNode;
}

export function AppShell({ role, userName, orgName, children }: ShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = MAIN_NAV.filter((item) => !item.cap || can(role, item.cap));

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Link href="/dashboard">
            <Logo />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-5 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <UserBlock userName={userName} orgName={orgName} role={role} />
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur lg:px-8">
          <Link href="/dashboard" className="lg:hidden">
            <Logo size="sm" />
          </Link>
          <div className="hidden flex-1 md:block lg:max-w-md">
            <GlobalSearch />
          </div>
          <div className="flex flex-1 items-center justify-end gap-1">
            <NotificationsMenu />
            <div className="hidden lg:block">
              <UserMenu userName={userName} />
            </div>
          </div>
        </header>

        {/* Mobile search */}
        <div className="border-b border-border bg-background p-4 md:hidden">
          <GlobalSearch />
        </div>

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur safe-bottom lg:hidden">
        <div className="grid grid-cols-5 items-end">
          <BottomLink href="/dashboard" label="Início" icon={Home} active={isActive("/dashboard")} />
          <BottomLink href="/atendimentos" label="Atendimentos" icon={ClipboardList} active={pathname === "/atendimentos"} />
          <Link
            href="/atendimentos/novo"
            className="flex flex-col items-center justify-center pb-1"
          >
            <span className="-mt-5 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lift ring-4 ring-background">
              <Plus className="size-7" />
            </span>
            <span className="mt-0.5 text-[11px] font-medium text-primary">Novo</span>
          </Link>
          <BottomLink href="/agenda" label="Agenda" icon={Calendar} active={isActive("/agenda")} />
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-0.5 py-2 text-muted-foreground"
          >
            <MenuIcon className="size-5" />
            <span className="text-[11px] font-medium">Menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" menu */}
      <Dialog open={menuOpen} onOpenChange={setMenuOpen} title="Menu">
        <nav className="grid grid-cols-2 gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="flex flex-col gap-2 rounded-lg border border-border p-4 text-sm font-medium hover:bg-muted"
            >
              <item.icon className="size-5 text-primary" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 border-t border-border pt-4">
          <div className="mb-3">
            <p className="text-sm font-medium text-foreground">{userName}</p>
            <p className="text-xs text-muted-foreground">{orgName} · {ROLE_LABELS[role]}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/configuracoes"
              onClick={() => setMenuOpen(false)}
              className="flex flex-1 items-center justify-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-muted"
            >
              <User className="size-4" /> Perfil
            </Link>
            <form action="/api/auth/signout" method="post" className="flex-1">
              <button className="flex w-full items-center justify-center gap-2 rounded-md border border-input px-3 py-2 text-sm text-destructive hover:bg-muted">
                <LogOut className="size-4" /> Sair
              </button>
            </form>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function BottomLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-0.5 py-2",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" />
      <span className="text-[11px] font-medium">{label}</span>
    </Link>
  );
}

function UserBlock({
  userName,
  orgName,
  role,
}: {
  userName: string;
  orgName: string;
  role: Role;
}) {
  return (
    <DropdownMenu>
      <DropdownTrigger>
        <div className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted">
          <Avatar name={userName} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{userName}</p>
            <p className="truncate text-xs text-muted-foreground">{orgName}</p>
          </div>
          <ChevronsUpDown className="size-4 text-muted-foreground" />
        </div>
      </DropdownTrigger>
      <DropdownContent align="start" className="w-56">
        <div className="px-3 py-2">
          <p className="text-sm font-medium">{userName}</p>
          <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
        </div>
        <DropdownSeparator />
        <Link href="/configuracoes">
          <DropdownItem>
            <User /> Meu perfil
          </DropdownItem>
        </Link>
        <form action="/api/auth/signout" method="post">
          <DropdownItem type="submit" className="text-destructive">
            <LogOut /> Sair
          </DropdownItem>
        </form>
      </DropdownContent>
    </DropdownMenu>
  );
}

function UserMenu({ userName }: { userName: string }) {
  return (
    <DropdownMenu>
      <DropdownTrigger>
        <Avatar name={userName} />
      </DropdownTrigger>
      <DropdownContent className="w-52">
        <Link href="/configuracoes">
          <DropdownItem>
            <User /> Meu perfil
          </DropdownItem>
        </Link>
        <form action="/api/auth/signout" method="post">
          <DropdownItem type="submit" className="text-destructive">
            <LogOut /> Sair
          </DropdownItem>
        </form>
      </DropdownContent>
    </DropdownMenu>
  );
}
