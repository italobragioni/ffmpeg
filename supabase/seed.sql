-- =============================================================================
-- SOLENE — Demo seed
-- Creates a demo funeral home (Funerária Serenidade) with users, cases,
-- events, checklists and a published memorial so the app isn't empty.
--
-- Demo logins (password for all): solene123
--   joao@serenidade.com    — Administrador
--   ana@serenidade.com     — Atendente
--   carlos@serenidade.com  — Operacional
--   owner@solene.app       — Super Admin (SaaS owner, sees /admin)
-- =============================================================================

-- Fixed IDs so we can cross-reference below.
-- Users
--   João   : 11111111-1111-1111-1111-111111111111
--   Ana    : 22222222-2222-2222-2222-222222222222
--   Carlos : 33333333-3333-3333-3333-333333333333
--   Owner  : 44444444-4444-4444-4444-444444444444
-- Org      : aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa

-- --- Auth users (handle_new_user trigger creates matching profiles) ----------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','joao@serenidade.com', crypt('solene123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}','{"full_name":"João Almeida"}', now(), now()),
  ('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ana@serenidade.com', crypt('solene123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}','{"full_name":"Ana Ribeiro"}', now(), now()),
  ('33333333-3333-3333-3333-333333333333','00000000-0000-0000-0000-000000000000','authenticated','authenticated','carlos@serenidade.com', crypt('solene123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}','{"full_name":"Carlos Mendes"}', now(), now()),
  ('44444444-4444-4444-4444-444444444444','00000000-0000-0000-0000-000000000000','authenticated','authenticated','owner@solene.app', crypt('solene123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}','{"full_name":"Dono do Solene"}', now(), now())
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  (gen_random_uuid(),'11111111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111', '{"sub":"11111111-1111-1111-1111-111111111111","email":"joao@serenidade.com"}','email', now(), now(), now()),
  (gen_random_uuid(),'22222222-2222-2222-2222-222222222222','22222222-2222-2222-2222-222222222222', '{"sub":"22222222-2222-2222-2222-222222222222","email":"ana@serenidade.com"}','email', now(), now(), now()),
  (gen_random_uuid(),'33333333-3333-3333-3333-333333333333','33333333-3333-3333-3333-333333333333', '{"sub":"33333333-3333-3333-3333-333333333333","email":"carlos@serenidade.com"}','email', now(), now(), now()),
  (gen_random_uuid(),'44444444-4444-4444-4444-444444444444','44444444-4444-4444-4444-444444444444', '{"sub":"44444444-4444-4444-4444-444444444444","email":"owner@solene.app"}','email', now(), now(), now())
on conflict do nothing;

-- Ensure profiles exist (in case the trigger is disabled) + names.
insert into public.profiles (id, full_name) values
  ('11111111-1111-1111-1111-111111111111','João Almeida'),
  ('22222222-2222-2222-2222-222222222222','Ana Ribeiro'),
  ('33333333-3333-3333-3333-333333333333','Carlos Mendes'),
  ('44444444-4444-4444-4444-444444444444','Dono do Solene')
on conflict (id) do update set full_name = excluded.full_name;

update public.profiles set is_super_admin = true where id = '44444444-4444-4444-4444-444444444444';

-- --- Organization ------------------------------------------------------------
insert into public.organizations (id, name, phone, whatsapp, email, city, state, primary_color, onboarding_completed)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Funerária Serenidade','(11) 3333-0000','(11) 99999-0000','contato@serenidade.com','São Paulo','SP','#174C4F', true)
on conflict (id) do nothing;

insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','admin'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','22222222-2222-2222-2222-222222222222','attendant'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','33333333-3333-3333-3333-333333333333','operational')
on conflict (organization_id, user_id) do nothing;

insert into public.subscriptions (organization_id, plan, subscription_status)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','pro','trial')
on conflict (organization_id) do nothing;

-- Rooms
insert into public.rooms (id, organization_id, name, capacity) values
  ('bbbbbbb1-0000-0000-0000-000000000001','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Sala 01', 60),
  ('bbbbbbb1-0000-0000-0000-000000000002','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Sala 02', 80),
  ('bbbbbbb1-0000-0000-0000-000000000003','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Capela Principal', 120)
on conflict (id) do nothing;

-- --- Cases (triggers create checklist + history + timeline automatically) ----
insert into public.funeral_cases
  (id, organization_id, protocol, status, assigned_to, created_by, deceased_name, birth_date, death_date,
   death_city, family_name, family_phone, family_whatsapp, family_relationship, service_type,
   wake_place, wake_room_id, wake_start, wake_end, final_place, final_datetime, urn)
values
  ('ccccccc1-0000-0000-0000-000000000001','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','SOL-2026-000001','wake',
   '22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111',
   'Maria Aparecida Silva','1948-03-12','2026-09-24','São Paulo','Roberto Silva','(11) 98888-1111','(11) 98888-1111','Filho','burial',
   'Funerária Serenidade','bbbbbbb1-0000-0000-0000-000000000002', now() + interval '2 hours', now() + interval '8 hours',
   'Cemitério Municipal', now() + interval '1 day' + interval '9 hours','Urna Modelo Cedro'),
  ('ccccccc1-0000-0000-0000-000000000002','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','SOL-2026-000002','preparation',
   '33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111',
   'José Carlos de Souza','1955-07-01','2026-09-25','Guarulhos','Fernanda Souza','(11) 97777-2222','(11) 97777-2222','Filha','cremation',
   'Funerária Serenidade','bbbbbbb1-0000-0000-0000-000000000001', now() + interval '1 day' + interval '4 hours', now() + interval '1 day' + interval '10 hours',
   'Crematório Vila Alpina', now() + interval '2 days' + interval '11 hours', null),
  ('ccccccc1-0000-0000-0000-000000000003','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','SOL-2026-000003','removal',
   '33333333-3333-3333-3333-333333333333','22222222-2222-2222-2222-222222222222',
   'Antônio Pereira','1940-11-20','2026-09-25','São Paulo','Lucas Pereira','(11) 96666-3333','(11) 96666-3333','Neto','burial',
   'Funerária Serenidade','bbbbbbb1-0000-0000-0000-000000000003', now() + interval '6 hours', now() + interval '12 hours',
   'Cemitério da Paz', now() + interval '1 day' + interval '15 hours','Urna Modelo Pinho')
on conflict (id) do nothing;

-- Keep the protocol counter ahead of the seeded protocols.
insert into public.case_counters (organization_id, year, last_number)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', extract(year from now())::int, 3)
on conflict (organization_id, year) do update set last_number = greatest(public.case_counters.last_number, 3);

-- Calendar events (the app normally creates these from the case dates).
insert into public.calendar_events (organization_id, case_id, room_id, type, title, location, starts_at, ends_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','ccccccc1-0000-0000-0000-000000000001','bbbbbbb1-0000-0000-0000-000000000002','wake','Velório — Maria Aparecida Silva','Funerária Serenidade', now() + interval '2 hours', now() + interval '8 hours'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','ccccccc1-0000-0000-0000-000000000001',null,'burial','Sepultamento — Maria Aparecida Silva','Cemitério Municipal', now() + interval '1 day' + interval '9 hours', null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','ccccccc1-0000-0000-0000-000000000003','bbbbbbb1-0000-0000-0000-000000000003','removal','Remoção — Antônio Pereira','Hospital São Luiz', now() + interval '6 hours', null)
on conflict do nothing;

-- Mark a couple of Maria's checklist tasks as done, for a realistic timeline.
update public.case_tasks set is_done = true, completed_by = '33333333-3333-3333-3333-333333333333', completed_at = now()
where case_id = 'ccccccc1-0000-0000-0000-000000000001' and title in ('Remoção confirmada','Urna selecionada');

-- Published memorial for Maria + one approved and one pending tribute.
insert into public.public_memorials (id, organization_id, case_id, slug, is_published)
values ('ddddddd1-0000-0000-0000-000000000001','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','ccccccc1-0000-0000-0000-000000000001','maria-aparecida-silva-x8kj2', true)
on conflict (id) do nothing;

insert into public.memorial_messages (organization_id, memorial_id, author_name, body, status, reviewed_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','ddddddd1-0000-0000-0000-000000000001','Família Silva','Descanse em paz, sempre lembrada com muito carinho.','approved', now()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','ddddddd1-0000-0000-0000-000000000001','Vizinhos da Rua das Flores','Nossos sentimentos a toda a família.','pending', null)
on conflict do nothing;

-- Inventory
insert into public.inventory_items (organization_id, name, category, sku, quantity, min_quantity, sale_price)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Urna Modelo Cedro','urns','URN-001', 4, 2, 2800.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Urna Modelo Pinho','urns','URN-002', 1, 2, 1600.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Coroa de Flores Branca','flowers','FLO-001', 6, 3, 350.00),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Véu para urna','materials','MAT-001', 10, 5, 90.00)
on conflict do nothing;
