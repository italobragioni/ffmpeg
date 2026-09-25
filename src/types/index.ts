import type {
  Role,
  CaseStatus,
  ServiceType,
  EventType,
  InventoryCategory,
  Plan,
  SubscriptionStatus,
} from "@/lib/constants";

export interface Organization {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  zip_code: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  primary_color: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_super_admin: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: Role;
  status: "active" | "suspended";
  created_at: string;
  updated_at: string;
  profile?: Profile | null;
}

export interface Subscription {
  id: string;
  organization_id: string;
  plan: Plan;
  subscription_status: SubscriptionStatus;
  trial_started_at: string;
  trial_ends_at: string;
  provider: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  organization_id: string;
  name: string;
  capacity: number | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FuneralCase {
  id: string;
  organization_id: string;
  branch_id: string | null;
  protocol: string;
  status: CaseStatus;
  assigned_to: string | null;
  created_by: string | null;

  deceased_name: string;
  birth_date: string | null;
  death_date: string | null;
  death_time: string | null;
  death_city: string | null;
  deceased_notes: string | null;

  family_name: string | null;
  family_phone: string | null;
  family_whatsapp: string | null;
  family_email: string | null;
  family_relationship: string | null;

  removal_place: string | null;
  removal_address: string | null;
  removal_date: string | null;
  removal_time: string | null;
  removal_responsible: string | null;
  removal_notes: string | null;

  service_type: ServiceType | null;
  wake_place: string | null;
  wake_room_id: string | null;
  wake_start: string | null;
  wake_end: string | null;
  final_place: string | null;
  final_datetime: string | null;

  urn: string | null;
  ornamentation: string | null;
  vehicle: string | null;
  internal_notes: string | null;

  created_at: string;
  updated_at: string;

  // joins
  assignee?: Profile | null;
  room?: Room | null;
}

export interface CaseTask {
  id: string;
  organization_id: string;
  case_id: string;
  title: string;
  position: number;
  is_done: boolean;
  completed_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  completer?: Profile | null;
}

export interface CaseNote {
  id: string;
  organization_id: string;
  case_id: string;
  author_id: string | null;
  kind: "note" | "system";
  body: string;
  created_at: string;
  author?: Profile | null;
}

export interface CaseStatusHistory {
  id: string;
  case_id: string;
  from_status: CaseStatus | null;
  to_status: CaseStatus;
  changed_by: string | null;
  created_at: string;
  changer?: Profile | null;
}

export interface CalendarEvent {
  id: string;
  organization_id: string;
  case_id: string | null;
  room_id: string | null;
  type: EventType;
  title: string;
  location: string | null;
  responsible: string | null;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  room?: Room | null;
}

export interface PublicMemorial {
  id: string;
  organization_id: string;
  case_id: string;
  slug: string;
  is_published: boolean;
  epitaph: string | null;
  show_wake: boolean;
  show_final: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemorialMessage {
  id: string;
  organization_id: string;
  memorial_id: string;
  author_name: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
}

export interface InventoryItem {
  id: string;
  organization_id: string;
  name: string;
  category: InventoryCategory;
  sku: string | null;
  quantity: number;
  min_quantity: number;
  cost_price: number | null;
  sale_price: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CaseDocument {
  id: string;
  organization_id: string;
  case_id: string | null;
  category: "document" | "authorization" | "receipt" | "other";
  name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  organization_id: string;
  user_id: string | null;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Invitation {
  id: string;
  organization_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: Role;
  token: string;
  status: "pending" | "accepted" | "revoked";
  expires_at: string;
  created_at: string;
}

/** The authenticated session's context, resolved once per request. */
export interface SessionContext {
  user: Profile;
  organization: Organization;
  role: Role;
  subscription: Subscription | null;
}
