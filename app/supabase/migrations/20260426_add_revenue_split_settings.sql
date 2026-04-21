create table if not exists public.platform_settings (
  id boolean primary key default true check (id = true),
  default_platform_split_rate numeric(5,4) not null default 0.2000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_settings_default_platform_split_rate_check
    check (default_platform_split_rate >= 0 and default_platform_split_rate < 1)
);

insert into public.platform_settings (id, default_platform_split_rate)
values (true, 0.2000)
on conflict (id) do nothing;

alter table public.instructor_profiles
  add column if not exists platform_split_rate numeric(5,4);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'instructor_profiles_platform_split_rate_check'
  ) then
    alter table public.instructor_profiles
      add constraint instructor_profiles_platform_split_rate_check
      check (platform_split_rate is null or (platform_split_rate >= 0 and platform_split_rate < 1));
  end if;
end $$;
