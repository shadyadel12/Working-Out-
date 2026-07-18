-- Require an Authenticator Assurance Level 2 session for every admin operation.
-- Existing RLS policies and SECURITY DEFINER RPCs call auth_role(), so enforcing
-- AAL2 here protects both the UI and direct REST/RPC access.
create or replace function public.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p.role = 'admin'
      and coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2'
      then null
    else p.role
  end
  from public.profiles p
  where p.id = auth.uid();
$$;

revoke all on function public.auth_role() from public;
grant execute on function public.auth_role() to authenticated;
