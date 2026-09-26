-- =============================================================================
-- SOLENE — Schema (organizations, cases, calendar, memorials, inventory, etc.)
-- Multi-tenant SaaS for funeral homes. All commercial tables carry
-- organization_id and are isolated with Row Level Security (see 0003_rls.sql).
-- =============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "unaccent";

-- Generic updated_at trigger ---------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- Tenancy
-- =============================================================================

create table public.organizations (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  cnpj           text,
  phone          text,
  whatsapp       text,
  email          text,
  zip_code       text,
  street         text,
  number         text,
  complement     text,
  district       text,
  city           text,
  state          text,
  logo_url       text,
  primary_color  text default '#174C4F',
  onboarding_completed boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger trg_organizations_updated before update on public.organizations
  for each row execute function public.set_updated_at();

-- One row per auth user
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  full_name      text,
  phone          text,
  avatar_url     text,
  is_super_admin boolean not null default false,
  last_seen_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Membership of a user in an organization (the tenant link)
create table public.organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  role            text not null default 'attendant'
                    check (role in ('admin','manager','attendant','operational')),
  status          text not null default 'active'
                    check (status in ('active','suspended')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index idx_members_org on public.organization_members(organization_id);
create index idx_members_user on public.organization_members(user_id);
create trigger trg_members_updated before update on public.organization_members
  for each row execute function public.set_updated_at();

-- Invitations by link/e-mail (section 17)
create table public.invitations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email           text,
  full_name       text,
  phone           text,
  role            text not null default 'attendant'
                    check (role in ('admin','manager','attendant','operational')),
  token           text not null unique default encode(gen_random_bytes(18), 'hex'),
  status          text not null default 'pending'
                    check (status in ('pending','accepted','revoked')),
  invited_by      uuid references public.profiles(id) on delete set null,
  accepted_by     uuid references public.profiles(id) on delete set null,
  expires_at      timestamptz not null default (now() + interval '14 days'),
  created_at      timestamptz not null default now()
);
create index idx_invitations_org on public.invitations(organization_id);
create index idx_invitations_token on public.invitations(token);

-- Branches (optional multi-unit) — section 28
create table public.branches (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  phone           text,
  address         text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_branches_org on public.branches(organization_id);
create trigger trg_branches_updated before update on public.branches
  for each row execute function public.set_updated_at();

-- Subscription / plan / trial (section 23)
create table public.subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null unique references public.organizations(id) on delete cascade,
  plan               text not null default 'essential' check (plan in ('essential','pro')),
  subscription_status text not null default 'trial'
                       check (subscription_status in ('trial','active','past_due','cancelled')),
  trial_started_at   timestamptz not null default now(),
  trial_ends_at      timestamptz not null default (now() + interval '7 days'),
  -- Gateway-agnostic layer: never bound to a single provider (Asaas/MercadoPago/Stripe)
  provider           text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger trg_subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Rooms / chapels (section 14)
-- =============================================================================

create table public.rooms (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  capacity        integer,
  description     text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_rooms_org on public.rooms(organization_id);
create trigger trg_rooms_updated before update on public.rooms
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Funeral cases (section 8)
-- =============================================================================

create sequence if not exists public.case_protocol_seq;

create table public.funeral_cases (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  branch_id          uuid references public.branches(id) on delete set null,
  protocol           text not null,
  status             text not null default 'new'
                       check (status in ('new','removal','preparation','wake','burial','finished')),
  assigned_to        uuid references public.profiles(id) on delete set null,
  created_by         uuid references public.profiles(id) on delete set null,

  -- Step 1 — deceased
  deceased_name      text not null,
  birth_date         date,
  death_date         date,
  death_time         time,
  death_city         text,
  deceased_notes     text,

  -- Step 2 — family / responsible
  family_name        text,
  family_phone       text,
  family_whatsapp    text,
  family_email       text,
  family_relationship text,

  -- Step 3 — removal
  removal_place      text,
  removal_address    text,
  removal_date       date,
  removal_time       time,
  removal_responsible text,
  removal_notes      text,

  -- Step 4 — service
  service_type       text check (service_type in ('burial','cremation','other')),
  wake_place         text,
  wake_room_id       uuid references public.rooms(id) on delete set null,
  wake_start         timestamptz,
  wake_end           timestamptz,
  final_place        text,             -- cemetery / crematorium
  final_datetime     timestamptz,

  -- Step 5 — details
  urn                text,
  ornamentation      text,
  vehicle            text,
  internal_notes     text,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (organization_id, protocol)
);
create index idx_cases_org on public.funeral_cases(organization_id);
create index idx_cases_status on public.funeral_cases(organization_id, status);
create index idx_cases_assigned on public.funeral_cases(assigned_to);
create index idx_cases_created_at on public.funeral_cases(organization_id, created_at desc);
create index idx_cases_search on public.funeral_cases
  using gin (to_tsvector('portuguese',
    coalesce(deceased_name,'') || ' ' || coalesce(family_name,'') || ' ' || coalesce(protocol,'')));
create trigger trg_cases_updated before update on public.funeral_cases
  for each row execute function public.set_updated_at();

-- Status transitions (section 9)
create table public.case_status_history (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id         uuid not null references public.funeral_cases(id) on delete cascade,
  from_status     text,
  to_status       text not null,
  changed_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index idx_status_history_case on public.case_status_history(case_id, created_at);

-- Checklist tasks (section 11)
create table public.case_tasks (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id         uuid not null references public.funeral_cases(id) on delete cascade,
  title           text not null,
  position        integer not null default 0,
  is_done         boolean not null default false,
  completed_by    uuid references public.profiles(id) on delete set null,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_tasks_case on public.case_tasks(case_id, position);
create trigger trg_tasks_updated before update on public.case_tasks
  for each row execute function public.set_updated_at();

-- Notes + automatic timeline (section 12)
create table public.case_notes (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id         uuid not null references public.funeral_cases(id) on delete cascade,
  author_id       uuid references public.profiles(id) on delete set null,
  kind            text not null default 'note'
                    check (kind in ('note','system')),
  body            text not null,
  created_at      timestamptz not null default now()
);
create index idx_notes_case on public.case_notes(case_id, created_at);

-- Documents (section 30) — files stored privately in Supabase Storage
create table public.documents (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id         uuid references public.funeral_cases(id) on delete cascade,
  category        text not null default 'document'
                    check (category in ('document','authorization','receipt','other')),
  name            text not null,
  storage_path    text not null,
  mime_type       text,
  size_bytes      bigint,
  uploaded_by     uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index idx_documents_case on public.documents(case_id);
create index idx_documents_org on public.documents(organization_id);

-- =============================================================================
-- Calendar (section 13)
-- =============================================================================

create table public.calendar_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id         uuid references public.funeral_cases(id) on delete cascade,
  room_id         uuid references public.rooms(id) on delete set null,
  type            text not null default 'other'
                    check (type in ('removal','wake','burial','cremation','other')),
  title           text not null,
  location        text,
  responsible     text,
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_events_org_time on public.calendar_events(organization_id, starts_at);
create index idx_events_room on public.calendar_events(room_id, starts_at);
create index idx_events_case on public.calendar_events(case_id);
create trigger trg_events_updated before update on public.calendar_events
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Public family memorial (section 15)
-- =============================================================================

create table public.public_memorials (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id         uuid not null unique references public.funeral_cases(id) on delete cascade,
  slug            text not null unique,
  is_published    boolean not null default false,   -- OFF by default (LGPD, section 32)
  epitaph         text default 'Com carinho, familiares e amigos se despedem.',
  -- Only explicitly authorized public fields are copied here (never family PII)
  show_wake       boolean not null default true,
  show_final      boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_memorials_org on public.public_memorials(organization_id);
create trigger trg_memorials_updated before update on public.public_memorials
  for each row execute function public.set_updated_at();

create table public.memorial_messages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  memorial_id     uuid not null references public.public_memorials(id) on delete cascade,
  author_name     text not null,
  body            text not null,
  status          text not null default 'pending'
                    check (status in ('pending','approved','rejected')),
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz,
  reviewed_by     uuid references public.profiles(id) on delete set null
);
create index idx_memorial_messages_memorial on public.memorial_messages(memorial_id, status);

-- =============================================================================
-- Inventory (section 18)
-- =============================================================================

create table public.inventory_items (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  category        text not null default 'other'
                    check (category in ('urns','flowers','materials','other')),
  sku             text,
  quantity        integer not null default 0,
  min_quantity    integer not null default 0,
  cost_price      numeric(12,2),
  sale_price      numeric(12,2),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_inventory_org on public.inventory_items(organization_id);
create trigger trg_inventory_updated before update on public.inventory_items
  for each row execute function public.set_updated_at();

create table public.inventory_movements (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  item_id         uuid not null references public.inventory_items(id) on delete cascade,
  case_id         uuid references public.funeral_cases(id) on delete set null,
  delta           integer not null,      -- negative = consumption, positive = restock
  reason          text,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index idx_movements_item on public.inventory_movements(item_id, created_at);
create index idx_movements_org on public.inventory_movements(organization_id);

create table public.case_inventory_items (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id         uuid not null references public.funeral_cases(id) on delete cascade,
  item_id         uuid not null references public.inventory_items(id) on delete cascade,
  quantity        integer not null default 1,
  created_at      timestamptz not null default now()
);
create index idx_case_items_case on public.case_inventory_items(case_id);

-- =============================================================================
-- Notifications (section 21) & Audit log (section 29)
-- =============================================================================

create table public.notifications (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete cascade, -- null = whole org
  type            text not null default 'info',
  title           text not null,
  body            text,
  link            text,
  is_read         boolean not null default false,
  created_at      timestamptz not null default now()
);
create index idx_notifications_user on public.notifications(user_id, is_read, created_at desc);
create index idx_notifications_org on public.notifications(organization_id, created_at desc);

create table public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id        uuid references public.profiles(id) on delete set null,
  action          text not null,       -- e.g. 'case.created', 'case.status_changed'
  entity          text not null,       -- e.g. 'funeral_case'
  entity_id       uuid,
  metadata        jsonb not null default '{}'::jsonb,  -- never store secrets/passwords
  created_at      timestamptz not null default now()
);
create index idx_audit_org on public.audit_logs(organization_id, created_at desc);
create index idx_audit_entity on public.audit_logs(entity, entity_id);
