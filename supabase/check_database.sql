-- =============================================================================
-- SOLENE — Check-up do banco de dados
-- Cole no Supabase → SQL Editor → Run. Retorna um relatório de status.
-- ✅ = ok   ❌ FALTANDO = precisa rodar a migração correspondente
-- =============================================================================

with checks as (
  -- Tabelas esperadas
  select 'Tabela: ' || t.name as item,
         case when c.table_name is not null then '✅' else '❌ FALTANDO' end as status
  from (values
    ('organizations'),('profiles'),('organization_members'),('invitations'),('branches'),
    ('subscriptions'),('rooms'),('funeral_cases'),('case_status_history'),('case_tasks'),
    ('case_notes'),('documents'),('calendar_events'),('public_memorials'),('memorial_messages'),
    ('inventory_items'),('inventory_movements'),('case_inventory_items'),('notifications'),
    ('audit_logs'),('case_counters'),('case_payments')
  ) as t(name)
  left join information_schema.tables c
    on c.table_schema = 'public' and c.table_name = t.name

  union all
  -- Coluna de faturamento (migração 0006)
  select 'Coluna funeral_cases.total_amount',
    case when exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='funeral_cases' and column_name='total_amount'
    ) then '✅' else '❌ FALTANDO (rode a migração do Faturamento)' end

  union all
  -- Buckets de storage
  select 'Bucket: ' || b.id,
    case when s.id is not null then '✅' else '❌ FALTANDO' end
  from (values ('documents'), ('branding')) as b(id)
  left join storage.buckets s on s.id = b.id

  union all
  -- Funções essenciais
  select 'Função: ' || f.name,
    case when exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='public' and p.proname = f.name
    ) then '✅' else '❌ FALTANDO' end
  from (values
    ('create_organization'),('accept_invitation'),('is_org_member'),('has_org_role'),
    ('get_public_memorial'),('post_memorial_message'),('after_payment_insert')
  ) as f(name)

  union all
  -- RLS ativo nas tabelas sensíveis
  select 'RLS ativo: ' || tablename,
    case when rowsecurity then '✅' else '❌ DESLIGADO' end
  from pg_tables
  where schemaname='public'
    and tablename in ('organizations','funeral_cases','memorial_messages','case_payments','subscriptions')

  union all
  -- Padrão do período de teste
  select 'Padrão trial (subscriptions.trial_ends_at)',
    coalesce((
      select case when pg_get_expr(adbin, adrelid) ilike '%7 days%' then '✅ 7 dias'
                  when pg_get_expr(adbin, adrelid) ilike '%14 days%' then '⚠️ ainda 14 dias'
                  else '⚠️ ' || pg_get_expr(adbin, adrelid) end
      from pg_attrdef d
      join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
      where a.attrelid = 'public.subscriptions'::regclass and a.attname = 'trial_ends_at'
    ), '—')

  union all
  -- Contagens (visão geral dos dados)
  select 'Dados: organizações', (select count(*)::text from public.organizations)
  union all
  select 'Dados: atendimentos', (select count(*)::text from public.funeral_cases)
  union all
  select 'Dados: membros/usuários', (select count(*)::text from public.organization_members)
)
select * from checks order by status, item;
