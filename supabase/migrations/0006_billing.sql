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
