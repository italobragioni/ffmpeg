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
