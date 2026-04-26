alter table instructor_profiles
  add column if not exists stripe_customer_id text;
