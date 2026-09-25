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

  insert into public.subscriptions (organization_id) values (org_id);

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
