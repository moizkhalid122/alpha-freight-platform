-- Run in Supabase SQL Editor so admin panel can read employee data via RLS.
-- Note: email is stored in auth.users — NOT in public.profiles.

-- 1) Set your admin account role
update public.profiles
set role = 'admin'
where id in (
  select id from auth.users where lower(email) = 'moizkhalid598@gmail.com'
);

-- 2) Ensure employee accounts have role = employee (shows in admin Employees list)
update public.profiles p
set role = 'employee'
where exists (
  select 1 from public.employee_profiles ep where ep.id = p.id
)
and coalesce(p.role, '') <> 'admin';

-- 3) Extend is_platform_admin() to match app email whitelist
create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and lower(coalesce(role, '')) = 'admin'
  )
  or lower(coalesce(auth.jwt() ->> 'email', '')) = 'moizkhalid598@gmail.com';
$$;

grant execute on function public.is_platform_admin() to authenticated;
