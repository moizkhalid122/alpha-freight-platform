-- Faster admin employee list: store email on profiles (auth.users is slow to join from API).
-- Run once in Supabase SQL Editor.

alter table public.profiles add column if not exists email text;

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_email_idx on public.profiles (lower(email));

-- Backfill emails from auth.users
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and (p.email is null or p.email = '');

-- Keep emails in sync when new users sign up (optional trigger)
create or replace function public.sync_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_sync on auth.users;
create trigger on_auth_user_email_sync
  after insert or update of email on auth.users
  for each row
  execute function public.sync_profile_email_from_auth();
