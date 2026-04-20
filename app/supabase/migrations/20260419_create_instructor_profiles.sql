create table if not exists public.instructor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  cpf text not null unique,
  birth_date date not null,
  phone text not null,
  photo_url text,
  bio text,
  hourly_rate numeric(10,2) not null,
  experience_years integer,
  category text not null check (category in ('A', 'B', 'AB')),
  cnh_number text not null,
  cnh_expires_at date not null,
  detran_credential_number text not null,
  detran_credential_expires_at date not null,
  cep text not null,
  street text not null,
  number text not null,
  neighborhood text not null,
  city text not null,
  state text not null default 'CE',
  latitude double precision,
  longitude double precision,
  service_radius_km integer not null default 5,
  pix_key_type text,
  pix_key text,
  rating numeric(3,2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'docs_rejected', 'docs_approved', 'active', 'inactive', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.instructor_documents (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references public.instructor_profiles(id) on delete cascade,
  type text not null check (type in ('cnh', 'detran_credential')),
  file_url text not null,
  verified boolean not null default false,
  verified_at timestamptz,
  rejected_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (instructor_id, type)
);

create index if not exists instructor_profiles_status_idx
  on public.instructor_profiles (status);

create index if not exists instructor_profiles_city_idx
  on public.instructor_profiles (city);

create index if not exists instructor_profiles_category_idx
  on public.instructor_profiles (category);

create index if not exists instructor_documents_instructor_idx
  on public.instructor_documents (instructor_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists instructor_profiles_set_updated_at on public.instructor_profiles;
create trigger instructor_profiles_set_updated_at
before update on public.instructor_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists instructor_documents_set_updated_at on public.instructor_documents;
create trigger instructor_documents_set_updated_at
before update on public.instructor_documents
for each row
execute function public.set_updated_at();

alter table public.instructor_profiles enable row level security;
alter table public.instructor_documents enable row level security;

drop policy if exists "Instructors can read own profile" on public.instructor_profiles;
create policy "Instructors can read own profile"
on public.instructor_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Instructors can insert own profile" on public.instructor_profiles;
create policy "Instructors can insert own profile"
on public.instructor_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Instructors can update own profile" on public.instructor_profiles;
create policy "Instructors can update own profile"
on public.instructor_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Instructors can read own documents" on public.instructor_documents;
create policy "Instructors can read own documents"
on public.instructor_documents
for select
to authenticated
using (
  exists (
    select 1
    from public.instructor_profiles profiles
    where profiles.id = instructor_documents.instructor_id
      and profiles.user_id = auth.uid()
  )
);

drop policy if exists "Instructors can insert own documents" on public.instructor_documents;
create policy "Instructors can insert own documents"
on public.instructor_documents
for insert
to authenticated
with check (
  exists (
    select 1
    from public.instructor_profiles profiles
    where profiles.id = instructor_documents.instructor_id
      and profiles.user_id = auth.uid()
  )
);

drop policy if exists "Instructors can update own documents" on public.instructor_documents;
create policy "Instructors can update own documents"
on public.instructor_documents
for update
to authenticated
using (
  exists (
    select 1
    from public.instructor_profiles profiles
    where profiles.id = instructor_documents.instructor_id
      and profiles.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.instructor_profiles profiles
    where profiles.id = instructor_documents.instructor_id
      and profiles.user_id = auth.uid()
  )
);
