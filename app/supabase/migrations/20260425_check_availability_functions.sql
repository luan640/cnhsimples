create or replace function public.check_email_taken(check_email text)
returns boolean
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  return exists (
    select 1 from auth.users where email = lower(trim(check_email))
  );
end;
$$;

grant execute on function public.check_email_taken(text) to anon;
grant execute on function public.check_email_taken(text) to authenticated;
