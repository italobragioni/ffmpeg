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
