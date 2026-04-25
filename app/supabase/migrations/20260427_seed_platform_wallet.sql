-- Garante que a carteira da plataforma existe com ID fixo conhecido pelo código
insert into public.wallets (owner_id, owner_type, balance)
values ('00000000-0000-0000-0000-000000000001', 'platform', 0)
on conflict (owner_id, owner_type) do nothing;
