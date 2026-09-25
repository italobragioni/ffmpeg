import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Users,
  Package,
  BarChart3,
  Settings,
} from "lucide-react";

export const APP_NAME = "SOLENE";
export const APP_TAGLINE = "Gestão funerária simples e organizada.";

// ---------------------------------------------------------------------------
// Roles & permissions
// ---------------------------------------------------------------------------

export type Role = "admin" | "manager" | "attendant" | "operational";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  manager: "Gestor",
  attendant: "Atendente",
  operational: "Operacional",
};

export const ROLE_ORDER: Role[] = ["admin", "manager", "attendant", "operational"];

/** Coarse capability flags derived from the spec (section 4). */
export type Capability =
  | "org.configure"
  | "users.manage"
  | "cases.viewAll"
  | "cases.create"
  | "cases.edit"
  | "cases.assign"
  | "cases.updateStage"
  | "reports.view"
  | "calendar.manage"
  | "inventory.manage"
  | "portal.configure";

const CAPS: Record<Role, Capability[]> = {
  admin: [
    "org.configure",
    "users.manage",
    "cases.viewAll",
    "cases.create",
    "cases.edit",
    "cases.assign",
    "cases.updateStage",
    "reports.view",
    "calendar.manage",
    "inventory.manage",
    "portal.configure",
  ],
  manager: [
    "cases.viewAll",
    "cases.create",
    "cases.edit",
    "cases.assign",
    "cases.updateStage",
    "reports.view",
    "calendar.manage",
    "inventory.manage",
    "portal.configure",
  ],
  attendant: ["cases.create", "cases.edit", "cases.updateStage"],
  operational: ["cases.updateStage"],
};

export function can(role: Role | null | undefined, capability: Capability): boolean {
  if (!role) return false;
  return CAPS[role]?.includes(capability) ?? false;
}

// ---------------------------------------------------------------------------
// Case pipeline (section 9)
// ---------------------------------------------------------------------------

export type CaseStatus =
  | "new"
  | "removal"
  | "preparation"
  | "wake"
  | "burial"
  | "finished";

export const CASE_STATUS_ORDER: CaseStatus[] = [
  "new",
  "removal",
  "preparation",
  "wake",
  "burial",
  "finished",
];

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  new: "Novo atendimento",
  removal: "Remoção",
  preparation: "Preparação",
  wake: "Velório",
  burial: "Sepultamento/Cremação",
  finished: "Finalizado",
};

export const CASE_STATUS_SHORT: Record<CaseStatus, string> = {
  new: "Novo",
  removal: "Remoção",
  preparation: "Preparação",
  wake: "Velório",
  burial: "Sepultamento",
  finished: "Finalizado",
};

/** Tailwind tokens for status pills — calm, non-alarming palette. */
export const CASE_STATUS_STYLES: Record<CaseStatus, string> = {
  new: "bg-accent text-accent-foreground",
  removal: "bg-secondary/60 text-secondary-foreground",
  preparation: "bg-warning/15 text-warning-foreground",
  wake: "bg-primary/10 text-primary",
  burial: "bg-primary/15 text-primary",
  finished: "bg-success/15 text-success",
};

// ---------------------------------------------------------------------------
// Service types (section 8, step 4)
// ---------------------------------------------------------------------------

export type ServiceType = "burial" | "cremation" | "other";

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  burial: "Sepultamento",
  cremation: "Cremação",
  other: "Outro",
};

// ---------------------------------------------------------------------------
// Calendar events (section 13)
// ---------------------------------------------------------------------------

export type EventType = "removal" | "wake" | "burial" | "cremation" | "other";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  removal: "Remoção",
  wake: "Velório",
  burial: "Sepultamento",
  cremation: "Cremação",
  other: "Outro",
};

export const EVENT_TYPE_STYLES: Record<EventType, string> = {
  removal: "bg-secondary/60 text-secondary-foreground border-secondary",
  wake: "bg-primary/10 text-primary border-primary/20",
  burial: "bg-primary/15 text-primary border-primary/30",
  cremation: "bg-warning/15 text-warning-foreground border-warning/30",
  other: "bg-muted text-muted-foreground border-border",
};

// ---------------------------------------------------------------------------
// Inventory (section 18)
// ---------------------------------------------------------------------------

export type InventoryCategory = "urns" | "flowers" | "materials" | "other";

export const INVENTORY_CATEGORY_LABELS: Record<InventoryCategory, string> = {
  urns: "Urnas",
  flowers: "Flores",
  materials: "Materiais",
  other: "Outros",
};

// ---------------------------------------------------------------------------
// Plans & subscription (section 23)
// ---------------------------------------------------------------------------

export type Plan = "essential" | "pro";
export type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled";

export const PLAN_LABELS: Record<Plan, string> = {
  essential: "Essencial",
  pro: "Pro",
};

export const PLANS = [
  {
    id: "essential" as Plan,
    name: "Essencial",
    price: 149,
    highlight: false,
    tagline: "Para começar com organização.",
    userLimit: 3,
    features: [
      "Até 3 usuários",
      "Atendimentos ilimitados",
      "Agenda operacional",
      "Checklists automáticos",
      "Portal da família",
    ],
  },
  {
    id: "pro" as Plan,
    name: "Pro",
    price: 249,
    highlight: true,
    tagline: "Para operações completas.",
    userLimit: null,
    features: [
      "Usuários ilimitados",
      "Tudo do Essencial",
      "Controle de estoque",
      "Relatórios e gráficos",
      "Personalização da marca",
      "Recursos avançados",
    ],
  },
];

export const TRIAL_DAYS = 14;

// ---------------------------------------------------------------------------
// Navigation (section 6)
// ---------------------------------------------------------------------------

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  cap?: Capability;
}

export const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/atendimentos", label: "Atendimentos", icon: ClipboardList },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/equipe", label: "Equipe", icon: Users, cap: "users.manage" },
  { href: "/estoque", label: "Estoque", icon: Package, cap: "inventory.manage" },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3, cap: "reports.view" },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export const DEFAULT_CHECKLIST_TEMPLATE: string[] = [
  "Remoção confirmada",
  "Documentação recebida",
  "Urna selecionada",
  "Ornamentação definida",
  "Preparação realizada",
  "Sala/capela confirmada",
  "Horário do velório confirmado",
  "Veículo reservado",
  "Sepultamento/cremação confirmado",
  "Família avisada",
];
