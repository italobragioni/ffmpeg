-- ==============================================================================
-- SOLENE — Setup completo do banco (todas as migrations na ordem).
-- Cole este arquivo inteiro no Supabase → SQL Editor e rode uma única vez.
-- Depois, rode supabase/seed.sql (opcional) para dados de demonstração.
-- ==============================================================================


-- >>> supabase/migrations/0001_schema.sql

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


-- >>> supabase/migrations/0002_functions.sql

-- =============================================================================
-- SOLENE — Functions, triggers & security-definer RPCs
-- =============================================================================

-- --- Membership helpers (SECURITY DEFINER to avoid RLS recursion) ------------

create or replace function public.is_org_member(org uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from organization_members m
    where m.organization_id = org and m.user_id = auth.uid() and m.status = 'active'
  );
$$;

create or replace function public.has_org_role(org uuid, allowed text[])
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from organization_members m
    where m.organization_id = org and m.user_id = auth.uid()
      and m.status = 'active' and m.role = any(allowed)
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from profiles p where p.id = auth.uid() and p.is_super_admin = true);
$$;

-- --- Auth: create a profile row for every new user ---------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --- Protocol numbering (SOL-YYYY-000123) ------------------------------------

create table if not exists public.case_counters (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  year            int  not null,
  last_number     int  not null default 0,
  primary key (organization_id, year)
);

create or replace function public.next_protocol(org uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  y int := extract(year from now());
  n int;
begin
  insert into public.case_counters (organization_id, year, last_number)
  values (org, y, 1)
  on conflict (organization_id, year)
    do update set last_number = public.case_counters.last_number + 1
  returning last_number into n;
  return 'SOL-' || y || '-' || lpad(n::text, 6, '0');
end;
$$;

-- --- Audit helper ------------------------------------------------------------

create or replace function public.log_audit(
  p_org uuid, p_action text, p_entity text, p_entity_id uuid, p_metadata jsonb default '{}'::jsonb
)
returns void
language sql security definer set search_path = public
as $$
  insert into public.audit_logs (organization_id, actor_id, action, entity, entity_id, metadata)
  values (p_org, auth.uid(), p_action, p_entity, p_entity_id, coalesce(p_metadata, '{}'::jsonb));
$$;

-- --- Case lifecycle ----------------------------------------------------------

-- Assign protocol + creator before insert
create or replace function public.before_case_insert()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.protocol is null or new.protocol = '' then
    new.protocol := public.next_protocol(new.organization_id);
  end if;
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_before_case_insert on public.funeral_cases;
create trigger trg_before_case_insert
  before insert on public.funeral_cases
  for each row execute function public.before_case_insert();

-- After insert: seed checklist, initial history, timeline note, audit
create or replace function public.after_case_insert()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  tmpl text[] := array[
    'Remoção confirmada','Documentação recebida','Urna selecionada','Ornamentação definida',
    'Preparação realizada','Sala/capela confirmada','Horário do velório confirmado',
    'Veículo reservado','Sepultamento/cremação confirmado','Família avisada'
  ];
  t text;
  i int := 0;
begin
  foreach t in array tmpl loop
    insert into public.case_tasks (organization_id, case_id, title, position)
    values (new.organization_id, new.id, t, i);
    i := i + 1;
  end loop;

  insert into public.case_status_history (organization_id, case_id, from_status, to_status, changed_by)
  values (new.organization_id, new.id, null, new.status, new.created_by);

  insert into public.case_notes (organization_id, case_id, author_id, kind, body)
  values (new.organization_id, new.id, new.created_by, 'system', 'Atendimento criado.');

  perform public.log_audit(
    new.organization_id, 'case.created', 'funeral_case', new.id,
    jsonb_build_object('protocol', new.protocol, 'deceased_name', new.deceased_name)
  );
  return new;
end;
$$;

drop trigger if exists trg_after_case_insert on public.funeral_cases;
create trigger trg_after_case_insert
  after insert on public.funeral_cases
  for each row execute function public.after_case_insert();

-- On status change: history + timeline note + audit
create or replace function public.after_case_status_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.case_status_history (organization_id, case_id, from_status, to_status, changed_by)
    values (new.organization_id, new.id, old.status, new.status, auth.uid());

    insert into public.case_notes (organization_id, case_id, author_id, kind, body)
    values (new.organization_id, new.id, auth.uid(), 'system',
            'Status alterado para ' || new.status || '.');

    perform public.log_audit(
      new.organization_id, 'case.status_changed', 'funeral_case', new.id,
      jsonb_build_object('from', old.status, 'to', new.status)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_after_case_status_change on public.funeral_cases;
create trigger trg_after_case_status_change
  after update on public.funeral_cases
  for each row execute function public.after_case_status_change();

-- On task completion: stamp completer + timeline note
create or replace function public.after_task_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.is_done and not old.is_done then
    new.completed_by := auth.uid();
    new.completed_at := now();
  elsif not new.is_done and old.is_done then
    new.completed_by := null;
    new.completed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_before_task_update on public.case_tasks;
create trigger trg_before_task_update
  before update on public.case_tasks
  for each row execute function public.after_task_update();

create or replace function public.after_task_done()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.is_done and not old.is_done then
    insert into public.case_notes (organization_id, case_id, author_id, kind, body)
    values (new.organization_id, new.case_id, auth.uid(), 'system',
            'Checklist: "' || new.title || '" concluído.');
    perform public.log_audit(new.organization_id, 'task.completed', 'case_task', new.id,
      jsonb_build_object('title', new.title));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_after_task_done on public.case_tasks;
create trigger trg_after_task_done
  after update on public.case_tasks
  for each row execute function public.after_task_done();

-- --- Inventory movements apply to stock + low-stock notification -------------

create or replace function public.apply_inventory_movement()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  item public.inventory_items%rowtype;
begin
  update public.inventory_items
    set quantity = quantity + new.delta
    where id = new.item_id
    returning * into item;

  if item.quantity <= item.min_quantity then
    insert into public.notifications (organization_id, user_id, type, title, body, link)
    values (new.organization_id, null, 'inventory_low', 'Estoque baixo',
            item.name || ' está com estoque baixo (' || item.quantity || ' un.)', '/estoque');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_apply_movement on public.inventory_movements;
create trigger trg_apply_movement
  after insert on public.inventory_movements
  for each row execute function public.apply_inventory_movement();

-- --- New memorial message -> notification ------------------------------------

create or replace function public.after_memorial_message()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.notifications (organization_id, user_id, type, title, body, link)
  values (new.organization_id, null, 'memorial_message', 'Nova homenagem aguardando aprovação',
          new.author_name || ' deixou uma homenagem.', '/atendimentos');
  return new;
end;
$$;

drop trigger if exists trg_after_memorial_message on public.memorial_messages;
create trigger trg_after_memorial_message
  after insert on public.memorial_messages
  for each row execute function public.after_memorial_message();

-- =============================================================================
-- Onboarding RPC — creates org + admin membership + trial subscription atomically
-- =============================================================================

create or replace function public.create_organization(
  p_name text,
  p_cnpj text default null,
  p_phone text default null,
  p_whatsapp text default null,
  p_email text default null,
  p_zip_code text default null,
  p_street text default null,
  p_number text default null,
  p_complement text default null,
  p_district text default null,
  p_city text default null,
  p_state text default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  org_id uuid;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.organizations
    (name, cnpj, phone, whatsapp, email, zip_code, street, number, complement, district, city, state)
  values
    (p_name, p_cnpj, p_phone, p_whatsapp, p_email, p_zip_code, p_street, p_number, p_complement, p_district, p_city, p_state)
  returning id into org_id;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (org_id, uid, 'admin', 'active');

  insert into public.subscriptions (organization_id, trial_ends_at)
  values (org_id, now() + interval '7 days');

  -- A couple of starter rooms so the calendar isn't empty
  insert into public.rooms (organization_id, name) values
    (org_id, 'Sala 01'), (org_id, 'Sala 02');

  perform public.log_audit(org_id, 'organization.created', 'organization', org_id,
    jsonb_build_object('name', p_name));

  return org_id;
end;
$$;

-- Stamp organization_id on memorial messages from the parent memorial
-- (prevents a public submitter from spoofing another tenant's org id)
create or replace function public.before_memorial_message_insert()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  pm public.public_memorials%rowtype;
begin
  select * into pm from public.public_memorials where id = new.memorial_id;
  if not found or not pm.is_published then
    raise exception 'memorial not available';
  end if;
  new.organization_id := pm.organization_id;
  new.status := 'pending';
  return new;
end;
$$;

drop trigger if exists trg_before_memorial_message on public.memorial_messages;
create trigger trg_before_memorial_message
  before insert on public.memorial_messages
  for each row execute function public.before_memorial_message_insert();

-- Public read of a single invitation (for the accept-invite screen)
create or replace function public.get_invitation(p_token text)
returns table (organization_id uuid, organization_name text, role text, email text, expired boolean)
language sql stable security definer set search_path = public
as $$
  select i.organization_id, o.name, i.role, i.email, (i.expires_at <= now() or i.status <> 'pending')
  from public.invitations i
  join public.organizations o on o.id = i.organization_id
  where i.token = p_token;
$$;

-- =============================================================================
-- Invitation acceptance RPC (link-based join, section 17)
-- =============================================================================

create or replace function public.accept_invitation(p_token text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  inv public.invitations%rowtype;
begin
  if uid is null then raise exception 'not authenticated'; end if;

  select * into inv from public.invitations
  where token = p_token and status = 'pending' and expires_at > now();

  if not found then
    raise exception 'invalid or expired invitation';
  end if;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (inv.organization_id, uid, inv.role, 'active')
  on conflict (organization_id, user_id)
    do update set status = 'active', role = excluded.role;

  update public.invitations
    set status = 'accepted', accepted_by = uid
    where id = inv.id;

  perform public.log_audit(inv.organization_id, 'member.joined', 'organization_member', uid,
    jsonb_build_object('role', inv.role));

  return inv.organization_id;
end;
$$;


-- >>> supabase/migrations/0003_rls.sql

-- =============================================================================
-- SOLENE — Row Level Security
-- Every commercial table is isolated by organization_id. A user only ever sees
-- rows for organizations they are an active member of. Super admins (SaaS owner)
-- may read across tenants for the /admin area.
-- =============================================================================

-- Profiles visibility helper (co-members can see each other's names)
create or replace function public.shares_org(target uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from organization_members a
    join organization_members b on a.organization_id = b.organization_id
    where a.user_id = auth.uid() and a.status = 'active'
      and b.user_id = target and b.status = 'active'
  );
$$;

-- Enable RLS everywhere ------------------------------------------------------
alter table public.organizations        enable row level security;
alter table public.profiles             enable row level security;
alter table public.organization_members enable row level security;
alter table public.invitations          enable row level security;
alter table public.branches             enable row level security;
alter table public.subscriptions        enable row level security;
alter table public.rooms                enable row level security;
alter table public.funeral_cases        enable row level security;
alter table public.case_status_history  enable row level security;
alter table public.case_tasks           enable row level security;
alter table public.case_notes           enable row level security;
alter table public.documents            enable row level security;
alter table public.calendar_events      enable row level security;
alter table public.public_memorials     enable row level security;
alter table public.memorial_messages    enable row level security;
alter table public.inventory_items      enable row level security;
alter table public.inventory_movements  enable row level security;
alter table public.case_inventory_items enable row level security;
alter table public.notifications        enable row level security;
alter table public.audit_logs           enable row level security;
alter table public.case_counters        enable row level security;

-- --- organizations -----------------------------------------------------------
create policy org_select on public.organizations for select
  using (public.is_org_member(id) or public.is_super_admin());
create policy org_update on public.organizations for update
  using (public.has_org_role(id, array['admin']) or public.is_super_admin())
  with check (public.has_org_role(id, array['admin']) or public.is_super_admin());

-- --- profiles ----------------------------------------------------------------
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.shares_org(id) or public.is_super_admin());
create policy profiles_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- --- organization_members ----------------------------------------------------
create policy members_select on public.organization_members for select
  using (public.is_org_member(organization_id) or public.is_super_admin());
create policy members_insert on public.organization_members for insert
  with check (public.has_org_role(organization_id, array['admin']) or public.is_super_admin());
create policy members_update on public.organization_members for update
  using (public.has_org_role(organization_id, array['admin']) or public.is_super_admin())
  with check (public.has_org_role(organization_id, array['admin']) or public.is_super_admin());
create policy members_delete on public.organization_members for delete
  using (public.has_org_role(organization_id, array['admin']) or public.is_super_admin());

-- --- invitations -------------------------------------------------------------
create policy invitations_all on public.invitations for all
  using (public.has_org_role(organization_id, array['admin','manager']) or public.is_super_admin())
  with check (public.has_org_role(organization_id, array['admin','manager']) or public.is_super_admin());

-- --- branches ----------------------------------------------------------------
create policy branches_select on public.branches for select
  using (public.is_org_member(organization_id) or public.is_super_admin());
create policy branches_write on public.branches for all
  using (public.has_org_role(organization_id, array['admin','manager']))
  with check (public.has_org_role(organization_id, array['admin','manager']));

-- --- subscriptions -----------------------------------------------------------
create policy subs_select on public.subscriptions for select
  using (public.is_org_member(organization_id) or public.is_super_admin());
create policy subs_update on public.subscriptions for update
  using (public.has_org_role(organization_id, array['admin']) or public.is_super_admin())
  with check (public.has_org_role(organization_id, array['admin']) or public.is_super_admin());

-- --- rooms -------------------------------------------------------------------
create policy rooms_select on public.rooms for select
  using (public.is_org_member(organization_id) or public.is_super_admin());
create policy rooms_write on public.rooms for all
  using (public.has_org_role(organization_id, array['admin','manager']))
  with check (public.has_org_role(organization_id, array['admin','manager']));

-- --- funeral_cases -----------------------------------------------------------
-- Operational users only see cases assigned to them; others see all org cases.
create policy cases_select on public.funeral_cases for select
  using (
    public.is_super_admin() or (
      public.is_org_member(organization_id) and (
        public.has_org_role(organization_id, array['admin','manager','attendant'])
        or assigned_to = auth.uid()
      )
    )
  );
create policy cases_insert on public.funeral_cases for insert
  with check (public.has_org_role(organization_id, array['admin','manager','attendant']));
create policy cases_update on public.funeral_cases for update
  using (
    public.has_org_role(organization_id, array['admin','manager','attendant'])
    or (public.is_org_member(organization_id) and assigned_to = auth.uid())
  )
  with check (
    public.has_org_role(organization_id, array['admin','manager','attendant'])
    or (public.is_org_member(organization_id) and assigned_to = auth.uid())
  );
create policy cases_delete on public.funeral_cases for delete
  using (public.has_org_role(organization_id, array['admin','manager']));

-- --- case_status_history (writes happen via triggers) ------------------------
create policy status_history_select on public.case_status_history for select
  using (public.is_org_member(organization_id) or public.is_super_admin());

-- --- case_tasks --------------------------------------------------------------
create policy tasks_select on public.case_tasks for select
  using (public.is_org_member(organization_id) or public.is_super_admin());
create policy tasks_write on public.case_tasks for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- --- case_notes --------------------------------------------------------------
create policy notes_select on public.case_notes for select
  using (public.is_org_member(organization_id) or public.is_super_admin());
create policy notes_insert on public.case_notes for insert
  with check (public.is_org_member(organization_id));

-- --- documents ---------------------------------------------------------------
create policy documents_select on public.documents for select
  using (public.is_org_member(organization_id) or public.is_super_admin());
create policy documents_insert on public.documents for insert
  with check (public.is_org_member(organization_id));
create policy documents_delete on public.documents for delete
  using (uploaded_by = auth.uid() or public.has_org_role(organization_id, array['admin','manager']));

-- --- calendar_events ---------------------------------------------------------
create policy events_select on public.calendar_events for select
  using (public.is_org_member(organization_id) or public.is_super_admin());
create policy events_write on public.calendar_events for all
  using (public.has_org_role(organization_id, array['admin','manager','attendant']))
  with check (public.has_org_role(organization_id, array['admin','manager','attendant']));

-- --- public_memorials --------------------------------------------------------
-- Members manage; anyone (anon) may read a published memorial.
create policy memorials_select on public.public_memorials for select
  using (is_published = true or public.is_org_member(organization_id) or public.is_super_admin());
create policy memorials_write on public.public_memorials for all
  using (public.has_org_role(organization_id, array['admin','manager']))
  with check (public.has_org_role(organization_id, array['admin','manager']));

-- --- memorial_messages -------------------------------------------------------
-- Anyone may read approved messages; members read all (to moderate).
create policy memorial_msgs_select on public.memorial_messages for select
  using (status = 'approved' or public.is_org_member(organization_id) or public.is_super_admin());
-- Anyone may submit a tribute (org id + pending status enforced by trigger).
create policy memorial_msgs_insert on public.memorial_messages for insert
  with check (true);
create policy memorial_msgs_update on public.memorial_messages for update
  using (public.has_org_role(organization_id, array['admin','manager']))
  with check (public.has_org_role(organization_id, array['admin','manager']));
create policy memorial_msgs_delete on public.memorial_messages for delete
  using (public.has_org_role(organization_id, array['admin','manager']));

-- --- inventory ---------------------------------------------------------------
create policy inventory_select on public.inventory_items for select
  using (public.is_org_member(organization_id) or public.is_super_admin());
create policy inventory_write on public.inventory_items for all
  using (public.has_org_role(organization_id, array['admin','manager']))
  with check (public.has_org_role(organization_id, array['admin','manager']));

create policy movements_select on public.inventory_movements for select
  using (public.is_org_member(organization_id) or public.is_super_admin());
create policy movements_insert on public.inventory_movements for insert
  with check (public.has_org_role(organization_id, array['admin','manager']));

create policy case_items_select on public.case_inventory_items for select
  using (public.is_org_member(organization_id) or public.is_super_admin());
create policy case_items_write on public.case_inventory_items for all
  using (public.has_org_role(organization_id, array['admin','manager','attendant']))
  with check (public.has_org_role(organization_id, array['admin','manager','attendant']));

-- --- notifications -----------------------------------------------------------
create policy notifications_select on public.notifications for select
  using (public.is_org_member(organization_id) and (user_id is null or user_id = auth.uid()));
create policy notifications_update on public.notifications for update
  using (public.is_org_member(organization_id) and (user_id is null or user_id = auth.uid()))
  with check (public.is_org_member(organization_id));

-- --- audit_logs (read for admins; writes only via security-definer helper) ---
create policy audit_select on public.audit_logs for select
  using (public.has_org_role(organization_id, array['admin']) or public.is_super_admin());


-- >>> supabase/migrations/0004_storage.sql

-- =============================================================================
-- SOLENE — Storage buckets & policies
--   documents : private (signed URLs only). Path: <organization_id>/<case_id>/<file>
--   branding  : public read (logos).        Path: <organization_id>/<file>
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

-- Helper: first path segment as uuid (organization id)
create or replace function public.storage_org_id(name text)
returns uuid
language sql immutable
as $$
  select nullif(split_part(name, '/', 1), '')::uuid;
$$;

-- --- documents (private) -----------------------------------------------------
create policy documents_read on storage.objects for select
  using (bucket_id = 'documents' and public.is_org_member(public.storage_org_id(name)));
create policy documents_insert on storage.objects for insert
  with check (bucket_id = 'documents' and public.is_org_member(public.storage_org_id(name)));
create policy documents_update on storage.objects for update
  using (bucket_id = 'documents' and public.is_org_member(public.storage_org_id(name)));
create policy documents_delete on storage.objects for delete
  using (bucket_id = 'documents' and public.is_org_member(public.storage_org_id(name)));

-- --- branding (public read, member write) ------------------------------------
create policy branding_read on storage.objects for select
  using (bucket_id = 'branding');
create policy branding_write on storage.objects for insert
  with check (bucket_id = 'branding'
    and public.has_org_role(public.storage_org_id(name), array['admin','manager']));
create policy branding_update on storage.objects for update
  using (bucket_id = 'branding'
    and public.has_org_role(public.storage_org_id(name), array['admin','manager']));
create policy branding_delete on storage.objects for delete
  using (bucket_id = 'branding'
    and public.has_org_role(public.storage_org_id(name), array['admin','manager']));


-- >>> supabase/migrations/0005_public_memorial.sql

-- =============================================================================
-- SOLENE — Public memorial access (LGPD-safe)
-- The public page never reads funeral_cases directly (RLS blocks anon). Instead
-- these SECURITY DEFINER functions expose ONLY the explicitly public fields of a
-- PUBLISHED memorial, and accept tributes as "pending" for later moderation.
-- =============================================================================

-- Tributes are submitted exclusively through the RPC below, so remove the
-- permissive direct-insert policy created in 0003.
drop policy if exists memorial_msgs_insert on public.memorial_messages;

create or replace function public.get_public_memorial(p_slug text)
returns table (
  deceased_name  text,
  birth_year     int,
  death_year     int,
  epitaph        text,
  org_name       text,
  org_logo       text,
  primary_color  text,
  show_wake      boolean,
  wake_start     timestamptz,
  wake_end       timestamptz,
  wake_place     text,
  wake_room      text,
  show_final     boolean,
  service_type   text,
  final_datetime timestamptz,
  final_place    text
)
language sql stable security definer set search_path = public
as $$
  select
    fc.deceased_name,
    extract(year from fc.birth_date)::int,
    extract(year from fc.death_date)::int,
    pm.epitaph,
    o.name,
    o.logo_url,
    o.primary_color,
    pm.show_wake,
    case when pm.show_wake then fc.wake_start end,
    case when pm.show_wake then fc.wake_end end,
    case when pm.show_wake then fc.wake_place end,
    case when pm.show_wake then r.name end,
    pm.show_final,
    case when pm.show_final then fc.service_type end,
    case when pm.show_final then fc.final_datetime end,
    case when pm.show_final then fc.final_place end
  from public.public_memorials pm
  join public.funeral_cases fc on fc.id = pm.case_id
  join public.organizations o on o.id = pm.organization_id
  left join public.rooms r on r.id = fc.wake_room_id
  where pm.slug = p_slug and pm.is_published = true;
$$;

-- Public list of APPROVED tributes for a published memorial.
create or replace function public.get_public_tributes(p_slug text)
returns table (author_name text, body text, created_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select m.author_name, m.body, m.created_at
  from public.memorial_messages m
  join public.public_memorials pm on pm.id = m.memorial_id
  where pm.slug = p_slug and pm.is_published = true and m.status = 'approved'
  order by m.created_at desc;
$$;

-- Submit a tribute (enters as "pending" for moderation).
create or replace function public.post_memorial_message(
  p_slug text, p_author_name text, p_body text
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  pm public.public_memorials%rowtype;
begin
  if length(coalesce(trim(p_author_name), '')) = 0 or length(coalesce(trim(p_body), '')) = 0 then
    raise exception 'name and message are required';
  end if;

  select * into pm from public.public_memorials where slug = p_slug and is_published = true;
  if not found then
    raise exception 'memorial not available';
  end if;

  insert into public.memorial_messages (organization_id, memorial_id, author_name, body, status)
  values (pm.organization_id, pm.id, left(trim(p_author_name), 120), left(trim(p_body), 2000), 'pending');
end;
$$;

grant execute on function public.get_public_memorial(text) to anon, authenticated;
grant execute on function public.get_public_tributes(text) to anon, authenticated;
grant execute on function public.post_memorial_message(text, text, text) to anon, authenticated;


-- >>> supabase/migrations/0006_billing.sql

-- =============================================================================
-- SOLENE — Faturamento (billing)
-- Valor cobrado por atendimento + registro de pagamentos recebidos.
-- =============================================================================

-- Valor total do serviço, por atendimento
alter table public.funeral_cases
  add column if not exists total_amount numeric(12,2);

-- Pagamentos recebidos (permite parcelas)
create table if not exists public.case_payments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id         uuid not null references public.funeral_cases(id) on delete cascade,
  amount          numeric(12,2) not null check (amount > 0),
  method          text not null default 'pix'
                    check (method in ('dinheiro','pix','cartao','boleto','convenio','outro')),
  paid_at         date not null default current_date,
  notes           text,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists idx_payments_case on public.case_payments(case_id, paid_at);
create index if not exists idx_payments_org on public.case_payments(organization_id, paid_at);

alter table public.case_payments enable row level security;

create policy payments_select on public.case_payments for select
  using (public.is_org_member(organization_id) or public.is_super_admin());
create policy payments_write on public.case_payments for all
  using (public.has_org_role(organization_id, array['admin','manager','attendant']))
  with check (public.has_org_role(organization_id, array['admin','manager','attendant']));

-- Auditoria + timeline ao registrar um pagamento
create or replace function public.after_payment_insert()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.case_notes (organization_id, case_id, author_id, kind, body)
  values (new.organization_id, new.case_id, auth.uid(), 'system',
          'Pagamento registrado: R$ ' || to_char(new.amount, 'FM999G999G990D00') || '.');
  perform public.log_audit(new.organization_id, 'payment.created', 'case_payment', new.id,
    jsonb_build_object('amount', new.amount, 'method', new.method));
  return new;
end;
$$;

drop trigger if exists trg_after_payment_insert on public.case_payments;
create trigger trg_after_payment_insert
  after insert on public.case_payments
  for each row execute function public.after_payment_insert();

