alter table instructor_profiles
  add column if not exists hidden_from_search boolean not null default false;
