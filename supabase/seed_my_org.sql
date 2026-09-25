-- =============================================================================
-- SOLENE — Dados de exemplo para a SUA organização
-- Cole no Supabase → SQL Editor e rode UMA vez. Ele preenche a organização mais
-- recente (a que você criou no cadastro) com atendimentos, agenda, estoque e um
-- memorial publicado. Seguro: se a organização já tiver atendimentos, não faz nada.
-- Os gatilhos criam automaticamente checklist, histórico e protocolo.
-- =============================================================================

do $$
declare
  v_org   uuid;
  v_user  uuid;
  v_room1 uuid;
  v_room2 uuid;
  v_c1    uuid;
  v_c2    uuid;
  v_c3    uuid;
  v_mem   uuid;
  v_msg   uuid;
begin
  -- Organização mais recente (a sua) + seu usuário admin
  select o.id into v_org from public.organizations o order by o.created_at desc limit 1;
  if v_org is null then
    raise exception 'Nenhuma organização encontrada. Faça o cadastro e o onboarding primeiro.';
  end if;

  select om.user_id into v_user
  from public.organization_members om
  where om.organization_id = v_org and om.role = 'admin'
  order by om.created_at limit 1;

  -- Evita duplicar se rodar de novo
  if (select count(*) from public.funeral_cases where organization_id = v_org) > 0 then
    raise notice 'A organização já possui atendimentos — nada foi inserido.';
    return;
  end if;

  select id into v_room1 from public.rooms where organization_id = v_org order by name asc  limit 1;
  select id into v_room2 from public.rooms where organization_id = v_org order by name desc limit 1;

  -- 1) Maria — em Velório
  insert into public.funeral_cases
    (organization_id, status, assigned_to, created_by, deceased_name, birth_date, death_date,
     death_city, family_name, family_phone, family_whatsapp, family_relationship, service_type,
     wake_place, wake_room_id, wake_start, wake_end, final_place, final_datetime, urn)
  values
    (v_org, 'wake', v_user, v_user, 'Maria Aparecida Silva', '1948-03-12', current_date,
     'São Paulo', 'Roberto Silva', '(11) 98888-1111', '(11) 98888-1111', 'Filho', 'burial',
     'Funerária', v_room2, now() + interval '2 hour', now() + interval '8 hour',
     'Cemitério Municipal', now() + interval '1 day' + interval '9 hour', 'Urna Modelo Cedro')
  returning id into v_c1;

  -- 2) José — em Preparação (cremação)
  insert into public.funeral_cases
    (organization_id, status, assigned_to, created_by, deceased_name, birth_date, death_date,
     death_city, family_name, family_phone, family_whatsapp, family_relationship, service_type,
     wake_place, wake_room_id, wake_start, wake_end, final_place, final_datetime)
  values
    (v_org, 'preparation', v_user, v_user, 'José Carlos de Souza', '1955-07-01', current_date,
     'Guarulhos', 'Fernanda Souza', '(11) 97777-2222', '(11) 97777-2222', 'Filha', 'cremation',
     'Funerária', v_room1, now() + interval '1 day' + interval '4 hour', now() + interval '1 day' + interval '10 hour',
     'Crematório Vila Alpina', now() + interval '2 day' + interval '11 hour')
  returning id into v_c2;

  -- 3) Antônio — em Remoção
  insert into public.funeral_cases
    (organization_id, status, assigned_to, created_by, deceased_name, birth_date, death_date,
     death_city, family_name, family_phone, family_whatsapp, family_relationship, service_type,
     final_place, final_datetime, urn)
  values
    (v_org, 'removal', v_user, v_user, 'Antônio Pereira', '1940-11-20', current_date,
     'São Paulo', 'Lucas Pereira', '(11) 96666-3333', '(11) 96666-3333', 'Neto', 'burial',
     'Cemitério da Paz', now() + interval '1 day' + interval '15 hour', 'Urna Modelo Pinho')
  returning id into v_c3;

  -- Agenda (eventos)
  insert into public.calendar_events (organization_id, case_id, room_id, type, title, location, starts_at, ends_at)
  values
    (v_org, v_c1, v_room2, 'wake',    'Velório — Maria Aparecida Silva', 'Funerária',          now() + interval '2 hour', now() + interval '8 hour'),
    (v_org, v_c1, null,    'burial',  'Sepultamento — Maria Aparecida Silva', 'Cemitério Municipal', now() + interval '1 day' + interval '9 hour', null),
    (v_org, v_c3, null,    'removal', 'Remoção — Antônio Pereira', 'Hospital São Luiz',        now() + interval '6 hour', null);

  -- Marca 2 itens do checklist da Maria como concluídos (para o histórico)
  update public.case_tasks
    set is_done = true, completed_by = v_user, completed_at = now()
    where case_id = v_c1 and title in ('Remoção confirmada', 'Urna selecionada');

  -- Memorial público da Maria + homenagens (1 aprovada, 1 aguardando)
  insert into public.public_memorials (organization_id, case_id, slug, is_published)
  values (v_org, v_c1, 'maria-aparecida-silva-' || substr(md5(random()::text), 1, 5), true)
  returning id into v_mem;

  insert into public.memorial_messages (memorial_id, author_name, body)
  values (v_mem, 'Família Silva', 'Descanse em paz, sempre lembrada com muito carinho.')
  returning id into v_msg;
  update public.memorial_messages set status = 'approved', reviewed_at = now() where id = v_msg;

  insert into public.memorial_messages (memorial_id, author_name, body)
  values (v_mem, 'Vizinhos da Rua das Flores', 'Nossos sentimentos a toda a família.');

  -- Estoque
  insert into public.inventory_items (organization_id, name, category, sku, quantity, min_quantity, sale_price)
  values
    (v_org, 'Urna Modelo Cedro', 'urns',      'URN-001', 4, 2, 2800.00),
    (v_org, 'Urna Modelo Pinho', 'urns',      'URN-002', 1, 2, 1600.00),
    (v_org, 'Coroa de Flores Branca', 'flowers','FLO-001', 6, 3, 350.00),
    (v_org, 'Véu para urna', 'materials',     'MAT-001', 10, 5, 90.00);

  raise notice 'Dados de exemplo inseridos com sucesso na organização %.', v_org;
end $$;
