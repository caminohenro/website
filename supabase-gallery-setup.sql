-- ============================================================================
-- CAMINO HENRO: "SIGHTINGS OF HENRO" PHOTO GALLERY SETUP
-- Paste this entire script into the Supabase SQL Editor and click "Run".
-- ============================================================================

create extension if not exists pgcrypto;

-- 1. Create the gallery_submissions table
create table if not exists public.gallery_submissions (
  id uuid primary key default gen_random_uuid(),
  photographer_name text not null check (char_length(photographer_name) between 1 and 80),
  photographer_email text,
  location text not null check (char_length(location) between 2 and 120),
  date_taken date default current_date,
  caption text check (char_length(caption) <= 1500),
  image_data text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_gallery_submissions_status_date
  on public.gallery_submissions (status, date_taken desc, created_at desc);

-- 2. Enable Row Level Security (RLS)
alter table public.gallery_submissions enable row level security;

-- Revoke direct select on private email column from anonymous visitors,
-- while granting public read access only to safe display columns.
revoke all on public.gallery_submissions from anon;
grant select (
  id,
  photographer_name,
  location,
  date_taken,
  caption,
  image_data,
  status,
  created_at
) on public.gallery_submissions to anon, authenticated;

grant insert (
  photographer_name,
  photographer_email,
  location,
  date_taken,
  caption,
  image_data,
  status
) on public.gallery_submissions to anon, authenticated;

-- Policy 1 (anon SELECT): Visitors can ONLY view rows where status = 'approved'
drop policy if exists "Public can view approved gallery photos" on public.gallery_submissions;
create policy "Public can view approved gallery photos"
  on public.gallery_submissions
  for select
  to anon, authenticated
  using (status = 'approved');

-- Policy 2 (anon INSERT): Visitors can ONLY insert new rows with status = 'pending'
drop policy if exists "Visitors can submit pending gallery photos" on public.gallery_submissions;
create policy "Visitors can submit pending gallery photos"
  on public.gallery_submissions
  for insert
  to anon, authenticated
  with check (status = 'pending');

-- Optional public view that explicitly excludes photographer_email
create or replace view public.public_gallery_sightings as
  select
    id,
    photographer_name,
    location,
    date_taken,
    caption,
    image_data,
    status,
    created_at
  from public.gallery_submissions
  where status = 'approved';

grant select on public.public_gallery_sightings to anon, authenticated;

-- ============================================================================
-- 3. SECURITY DEFINER RPC FUNCTIONS FOR INLINE ON-PAGE ADMIN MODERATION
-- ============================================================================

-- RPC 1: Verify Henro's admin passcode against public.forum_users ('henro' row)
-- Falls back to default passcode 'henro' if public.forum_users does not exist yet.
create or replace function public.verify_henro_admin_passcode(p_admin_passcode text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_stored_hash text;
  v_clean_passcode text := trim(coalesce(p_admin_passcode, ''));
begin
  if v_clean_passcode = '' then
    return false;
  end if;

  if to_regclass('public.forum_users') is not null then
    execute 'select password_hash from public.forum_users where lower(username) = ''henro'' limit 1'
      into v_stored_hash;

    if v_stored_hash is not null then
      return (v_stored_hash = crypt(v_clean_passcode, v_stored_hash));
    end if;
  end if;

  return (v_clean_passcode = 'henro');
end;
$$;

-- RPC 2: List all pending photo submissions for Henro's review drawer
create or replace function public.admin_list_pending_photos(p_admin_passcode text)
returns table (
  id uuid,
  photographer_name text,
  photographer_email text,
  location text,
  date_taken date,
  caption text,
  image_data text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_henro_admin_passcode(p_admin_passcode) then
    raise exception 'Invalid admin passcode.';
  end if;

  return query
  select
    g.id,
    g.photographer_name,
    g.photographer_email,
    g.location,
    g.date_taken,
    g.caption,
    g.image_data,
    g.status,
    g.created_at
  from public.gallery_submissions g
  where g.status = 'pending'
  order by g.created_at desc;
end;
$$;

-- RPC 3: Approve or delete a photo submission directly from /gallery
create or replace function public.admin_moderate_photo(
  p_admin_passcode text,
  p_photo_id uuid,
  p_new_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_action text := lower(trim(coalesce(p_new_status, '')));
begin
  if not public.verify_henro_admin_passcode(p_admin_passcode) then
    raise exception 'Invalid admin passcode.';
  end if;

  if v_action = 'approved' then
    update public.gallery_submissions
    set status = 'approved'
    where id = p_photo_id;

    return jsonb_build_object(
      'success', true,
      'photo_id', p_photo_id,
      'new_status', 'approved'
    );
  elsif v_action in ('delete', 'rejected') then
    delete from public.gallery_submissions
    where id = p_photo_id;

    return jsonb_build_object(
      'success', true,
      'photo_id', p_photo_id,
      'new_status', 'deleted'
    );
  else
    raise exception 'Unsupported moderation status: %. Use approved or delete.', p_new_status;
  end if;
end;
$$;

grant execute on function public.verify_henro_admin_passcode(text) to anon, authenticated;
grant execute on function public.admin_list_pending_photos(text) to anon, authenticated;
grant execute on function public.admin_moderate_photo(text, uuid, text) to anon, authenticated;
