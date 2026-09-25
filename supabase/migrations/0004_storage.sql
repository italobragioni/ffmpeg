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
