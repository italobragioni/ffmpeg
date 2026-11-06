-- =============================================================================
-- SOLENE — Seed de DEMONSTRAÇÃO (para gravar VSL / conteúdo)
-- Preenche a SUA organização (a mais recente) com uma operação completa:
-- atendimentos em todas as etapas, agenda de hoje/semana, faturamento com
-- pagamentos, estoque, equipe, memoriais e notificações.
-- Datas são relativas (sempre "atuais"). Seguro: não duplica se rodar de novo.
--
-- Logins dos membros demo (senha: solene123):
--   ana@demo.solene      — Atendente
--   carlos@demo.solene    — Operacional
--   marcos@demo.solene    — Gestor
-- (Você continua como administrador/dono.)
-- =============================================================================

-- --- Bloco A: membros demo da equipe ----------------------------------------
do $$
declare
  v_org uuid;
begin
  select id into v_org from public.organizations order by created_at desc limit 1;
  if v_org is null then raise exception 'Nenhuma organização encontrada. Faça o cadastro primeiro.'; end if;

  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    ('0a11a11a-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ana@demo.solene', crypt('solene123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}','{"full_name":"Ana Ribeiro"}', now(), now()),
    ('0c22c22c-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','carlos@demo.solene', crypt('solene123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}','{"full_name":"Carlos Mendes"}', now(), now()),
    ('0d33d33d-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','marcos@demo.solene', crypt('solene123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}','{"full_name":"Marcos Tavares"}', now(), now())
  on conflict (id) do nothing;

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values
    (gen_random_uuid(),'0a11a11a-0000-0000-0000-000000000001','0a11a11a-0000-0000-0000-000000000001','{"sub":"0a11a11a-0000-0000-0000-000000000001","email":"ana@demo.solene"}','email', now(), now(), now()),
    (gen_random_uuid(),'0c22c22c-0000-0000-0000-000000000002','0c22c22c-0000-0000-0000-000000000002','{"sub":"0c22c22c-0000-0000-0000-000000000002","email":"carlos@demo.solene"}','email', now(), now(), now()),
    (gen_random_uuid(),'0d33d33d-0000-0000-0000-000000000003','0d33d33d-0000-0000-0000-000000000003','{"sub":"0d33d33d-0000-0000-0000-000000000003","email":"marcos@demo.solene"}','email', now(), now(), now())
  on conflict do nothing;

  insert into public.profiles (id, full_name, phone) values
    ('0a11a11a-0000-0000-0000-000000000001','Ana Ribeiro','(11) 98111-0001'),
    ('0c22c22c-0000-0000-0000-000000000002','Carlos Mendes','(11) 98222-0002'),
    ('0d33d33d-0000-0000-0000-000000000003','Marcos Tavares','(11) 98333-0003')
  on conflict (id) do update set full_name = excluded.full_name, phone = excluded.phone;

  insert into public.organization_members (organization_id, user_id, role) values
    (v_org,'0a11a11a-0000-0000-0000-000000000001','attendant'),
    (v_org,'0c22c22c-0000-0000-0000-000000000002','operational'),
    (v_org,'0d33d33d-0000-0000-0000-000000000003','manager')
  on conflict (organization_id, user_id) do nothing;
end $$;

-- --- Bloco B: operação completa (atendimentos, agenda, faturamento, etc.) -----
do $$
declare
  v_org uuid;
  v_admin uuid;
  v_r1 uuid;  -- sala
  v_r2 uuid;
  c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid; c6 uuid; c7 uuid; c8 uuid;
  m1 uuid; m2 uuid; msg uuid;
begin
  select id into v_org from public.organizations order by created_at desc limit 1;
  select om.user_id into v_admin from public.organization_members om
    where om.organization_id = v_org and om.role = 'admin' order by om.created_at limit 1;

  -- Guard: não duplica
  if exists (select 1 from public.funeral_cases where organization_id = v_org and deceased_name = 'Terezinha de Jesus Oliveira') then
    raise notice 'Dados demo já existem — nada inserido.';
    return;
  end if;

  select id into v_r1 from public.rooms where organization_id = v_org order by name asc  limit 1;
  select id into v_r2 from public.rooms where organization_id = v_org order by name desc limit 1;

  -- Atendimentos (os gatilhos criam checklist, histórico e protocolo)
  insert into public.funeral_cases
    (organization_id, status, assigned_to, created_by, deceased_name, birth_date, death_date, death_city,
     family_name, family_phone, family_whatsapp, family_relationship, service_type,
     wake_place, wake_room_id, wake_start, wake_end, final_place, final_datetime, urn, ornamentation, total_amount, created_at)
  values
    (v_org,'wake',v_admin,v_admin,'Terezinha de Jesus Oliveira','1945-02-10',current_date,'São Paulo','Roberto Oliveira','(11) 98888-1001','(11) 98888-1001','Filho','burial','Funerária',v_r2, now()+interval '2 hour', now()+interval '8 hour','Cemitério Municipal', now()+interval '1 day'+interval '9 hour','Urna Modelo Cedro','Arranjo de rosas brancas',4200, now())
    returning id into c1;
  insert into public.funeral_cases
    (organization_id, status, assigned_to, created_by, deceased_name, birth_date, death_date, death_city,
     family_name, family_phone, family_whatsapp, family_relationship, service_type,
     removal_place, removal_address, final_place, final_datetime, total_amount, created_at)
  values
    (v_org,'removal',v_admin,v_admin,'Benedito Ferreira Lima','1952-06-21',current_date,'Guarulhos','Fernanda Lima','(11) 97777-1002','(11) 97777-1002','Filha','burial','Hospital São Luiz','Av. Brasil, 1200', 'Cemitério da Paz', now()+interval '1 day'+interval '16 hour',3500, now())
    returning id into c2;
  insert into public.funeral_cases
    (organization_id, status, assigned_to, created_by, deceased_name, birth_date, death_date, death_city,
     family_name, family_phone, family_whatsapp, family_relationship, service_type,
     wake_place, wake_room_id, wake_start, wake_end, final_place, final_datetime, total_amount, created_at)
  values
    (v_org,'preparation',v_admin,v_admin,'Sebastião Rodrigues da Costa','1948-11-03',current_date - 1,'São Paulo','Paulo Costa','(11) 96666-1003','(11) 96666-1003','Filho','cremation','Funerária',v_r1, now()+interval '1 day'+interval '4 hour', now()+interval '1 day'+interval '10 hour','Crematório Vila Alpina', now()+interval '2 day'+interval '11 hour',3800, now()-interval '1 day')
    returning id into c3;
  insert into public.funeral_cases
    (organization_id, status, assigned_to, created_by, deceased_name, birth_date, death_date, death_city,
     family_name, family_phone, family_whatsapp, family_relationship, service_type,
     wake_place, wake_room_id, wake_start, wake_end, final_place, final_datetime, urn, total_amount, created_at)
  values
    (v_org,'wake',v_admin,v_admin,'Maria das Graças Souza','1950-09-14',current_date,'São Paulo','Juliana Souza','(11) 95555-1004','(11) 95555-1004','Filha','burial','Funerária',v_r1, now()+interval '1 hour', now()+interval '7 hour','Cemitério Municipal', now()+interval '1 day'+interval '15 hour','Urna Premium Imperial',4600, now()-interval '1 day')
    returning id into c4;
  insert into public.funeral_cases
    (organization_id, status, assigned_to, created_by, deceased_name, birth_date, death_date, death_city,
     family_name, family_phone, family_whatsapp, family_relationship, service_type,
     final_place, final_datetime, urn, total_amount, created_at)
  values
    (v_org,'burial',v_admin,v_admin,'Antônio Carlos Pereira','1943-04-30',current_date - 1,'Osasco','Ricardo Pereira','(11) 94444-1005','(11) 94444-1005','Filho','burial','Cemitério Gethsêmani', now()+interval '3 hour','Urna Premium Imperial',5200, now()-interval '2 day')
    returning id into c5;
  insert into public.funeral_cases
    (organization_id, status, assigned_to, created_by, deceased_name, birth_date, death_date, death_city,
     family_name, family_phone, family_whatsapp, family_relationship, service_type, total_amount, created_at)
  values
    (v_org,'finished',v_admin,v_admin,'José Raimundo Alves','1939-01-25',current_date - 6,'São Paulo','Marta Alves','(11) 93333-1006','(11) 93333-1006','Filha','cremation',3900, now()-interval '6 day')
    returning id into c6;
  insert into public.funeral_cases
    (organization_id, status, assigned_to, created_by, deceased_name, birth_date, death_date, death_city,
     family_name, family_phone, family_whatsapp, family_relationship, service_type, total_amount, created_at)
  values
    (v_org,'finished',v_admin,v_admin,'Francisca Nunes Barbosa','1941-07-19',current_date - 9,'Diadema','Sandra Nunes','(11) 92222-1007','(11) 92222-1007','Filha','burial',4100, now()-interval '9 day')
    returning id into c7;
  insert into public.funeral_cases
    (organization_id, status, assigned_to, created_by, deceased_name, death_date, death_city,
     family_name, family_phone, family_whatsapp, family_relationship, created_at)
  values
    (v_org,'new',v_admin,v_admin,'Aparecida Gomes dos Santos',current_date,'São Paulo','Lucas Gomes','(11) 91111-1008','(11) 91111-1008','Neto', now())
    returning id into c8;

  -- Reatribui alguns para os membros demo (se existirem)
  update public.funeral_cases set assigned_to = '0a11a11a-0000-0000-0000-000000000001'
    where id in (c1, c4) and exists (select 1 from public.profiles where id='0a11a11a-0000-0000-0000-000000000001');
  update public.funeral_cases set assigned_to = '0c22c22c-0000-0000-0000-000000000002'
    where id in (c2, c5) and exists (select 1 from public.profiles where id='0c22c22c-0000-0000-0000-000000000002');
  update public.funeral_cases set assigned_to = '0d33d33d-0000-0000-0000-000000000003'
    where id in (c3, c6) and exists (select 1 from public.profiles where id='0d33d33d-0000-0000-0000-000000000003');

  -- Agenda (velórios, remoções, sepultamentos)
  insert into public.calendar_events (organization_id, case_id, room_id, type, title, location, responsible, starts_at, ends_at) values
    (v_org, c1, v_r2, 'wake',    'Velório — Terezinha de Jesus Oliveira', 'Funerária', 'Ana Ribeiro', now()+interval '2 hour', now()+interval '8 hour'),
    (v_org, c1, null, 'burial',  'Sepultamento — Terezinha de Jesus Oliveira', 'Cemitério Municipal', 'Carlos Mendes', now()+interval '1 day'+interval '9 hour', null),
    (v_org, c4, v_r1, 'wake',    'Velório — Maria das Graças Souza', 'Funerária', 'Ana Ribeiro', now()+interval '1 hour', now()+interval '7 hour'),
    (v_org, c4, null, 'burial',  'Sepultamento — Maria das Graças Souza', 'Cemitério Municipal', 'Carlos Mendes', now()+interval '1 day'+interval '15 hour', null),
    (v_org, c2, null, 'removal', 'Remoção — Benedito Ferreira Lima', 'Hospital São Luiz', 'Carlos Mendes', now()+interval '5 hour', null),
    (v_org, c5, null, 'burial',  'Sepultamento — Antônio Carlos Pereira', 'Cemitério Gethsêmani', 'Carlos Mendes', now()+interval '3 hour', null),
    (v_org, c3, v_r1, 'wake',    'Velório — Sebastião Rodrigues da Costa', 'Funerária', 'Marcos Tavares', now()+interval '1 day'+interval '4 hour', now()+interval '1 day'+interval '10 hour'),
    (v_org, c3, null, 'cremation','Cremação — Sebastião Rodrigues da Costa', 'Crematório Vila Alpina', 'Marcos Tavares', now()+interval '2 day'+interval '11 hour', null);

  -- Faturamento (pagamentos)
  insert into public.case_payments (organization_id, case_id, amount, method, paid_at, created_by) values
    (v_org, c1, 2000, 'pix', current_date, v_admin),
    (v_org, c4, 4600, 'cartao', current_date, v_admin),
    (v_org, c5, 2600, 'dinheiro', current_date, v_admin),
    (v_org, c6, 3900, 'boleto', current_date - 5, v_admin),
    (v_org, c7, 4100, 'pix', current_date - 8, v_admin);

  -- Conclui parte dos checklists (mostra "concluído por ... às ...")
  update public.case_tasks set is_done = true, completed_by = v_admin, completed_at = now()
    where case_id in (c1, c4, c5) and title in ('Remoção confirmada','Documentação recebida','Urna selecionada','Ornamentação definida');
  update public.case_tasks set is_done = true, completed_by = v_admin, completed_at = now()
    where case_id in (c6, c7); -- finalizados: tudo concluído

  -- Memoriais públicos + homenagens
  insert into public.public_memorials (organization_id, case_id, slug, is_published)
  values (v_org, c1, 'terezinha-de-jesus-oliveira-' || substr(md5(random()::text),1,5), true) returning id into m1;
  insert into public.public_memorials (organization_id, case_id, slug, is_published)
  values (v_org, c4, 'maria-das-gracas-souza-' || substr(md5(random()::text),1,5), true) returning id into m2;

  insert into public.memorial_messages (memorial_id, author_name, body) values (m1,'Família Oliveira','Sua bondade vai nos acompanhar para sempre. Descanse em paz, mãe.') returning id into msg;
  update public.memorial_messages set status='approved', reviewed_at=now() where id = msg;
  insert into public.memorial_messages (memorial_id, author_name, body) values (m1,'Vizinhos do Jardim das Flores','Uma pessoa iluminada. Nossos sentimentos à família.') returning id into msg;
  update public.memorial_messages set status='approved', reviewed_at=now() where id = msg;
  insert into public.memorial_messages (memorial_id, author_name, body) values (m1,'Amigos da Igreja','Estaremos em oração pela família.'); -- fica pendente

  insert into public.memorial_messages (memorial_id, author_name, body) values (m2,'Netos da Maria','Vó, obrigado por tanto amor. Te amamos.') returning id into msg;
  update public.memorial_messages set status='approved', reviewed_at=now() where id = msg;

  -- Estoque (com itens em baixa)
  insert into public.inventory_items (organization_id, name, category, sku, quantity, min_quantity, cost_price, sale_price) values
    (v_org,'Urna Premium Imperial','urns','URN-010', 3, 2, 3200, 5200),
    (v_org,'Urna Modelo Cedro','urns','URN-001', 5, 2, 1700, 2800),
    (v_org,'Urna Infantil Branca','urns','URN-005', 1, 2, 900, 1500),
    (v_org,'Coroa de Flores Luxo','flowers','FLO-010', 4, 3, 260, 480),
    (v_org,'Arranjo de Rosas','flowers','FLO-002', 8, 4, 110, 220),
    (v_org,'Véu e paramentos','materials','MAT-001', 12, 6, 40, 90),
    (v_org,'Livro de presença','materials','MAT-004', 2, 5, 18, 45)
  on conflict do nothing;

  -- Notificações (sininho)
  insert into public.notifications (organization_id, user_id, type, title, body, link) values
    (v_org, null, 'event', 'Velório de Maria das Graças começa em 1 hora', 'Sala 01 — Funerária', '/agenda'),
    (v_org, null, 'task', 'Carlos concluiu a remoção', 'Benedito Ferreira Lima', '/atendimentos'),
    (v_org, null, 'inventory_low', 'Estoque baixo', 'Urna Infantil Branca está com estoque baixo (1 un.)', '/estoque');

  raise notice 'Operação de demonstração criada com sucesso na organização %.', v_org;
end $$;
