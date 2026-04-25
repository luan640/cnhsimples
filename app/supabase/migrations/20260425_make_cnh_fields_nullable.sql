alter table public.instructor_profiles
  alter column cnh_number                   drop not null,
  alter column cnh_expires_at               drop not null,
  alter column detran_credential_number     drop not null,
  alter column detran_credential_expires_at drop not null;
