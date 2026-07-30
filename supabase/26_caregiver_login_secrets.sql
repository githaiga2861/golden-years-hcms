-- ============================================================
-- 26_caregiver_login_secrets.sql
-- Stores each caregiver's current Care App login password,
-- encrypted (not plain-text), purely so the office can include it
-- when emailing a new caregiver their download link + login details.
-- Kept in sync automatically whenever a password is set or changed,
-- whether by the office or by the caregiver themselves.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists caregiver_login_secrets (
  caregiver_id  uuid primary key references caregivers(id) on delete cascade,
  email         text not null,
  enc_password  bytea not null,
  updated_at    timestamptz not null default now()
);

alter table caregiver_login_secrets enable row level security;
drop policy if exists "office full caregiver_login_secrets" on caregiver_login_secrets;
create policy "office full caregiver_login_secrets" on caregiver_login_secrets for all using (is_full_office());

-- Called only from server-side Edge Functions (service role), never
-- directly from the browser — encrypts and stores the password.
create or replace function upsert_caregiver_login_secret(p_caregiver_id uuid, p_email text, p_password text)
returns void security definer set search_path = public language plpgsql as $$
begin
  insert into caregiver_login_secrets (caregiver_id, email, enc_password, updated_at)
  values (p_caregiver_id, p_email, pgp_sym_encrypt(p_password, 'Ud0AckAxq_nGn_JbloFEhJMZNvcqyscaE930mqkX0Eo'), now())
  on conflict (caregiver_id) do update
    set email = excluded.email, enc_password = excluded.enc_password, updated_at = now();
end $$;

-- Called only from a server-side Edge Function — decrypts on demand
-- for populating the email draft. Office-only via that function's
-- own role check, never exposed for direct client use.
create or replace function decrypt_caregiver_login_secret(p_caregiver_id uuid)
returns text security definer set search_path = public language plpgsql as $$
declare
  v_enc bytea;
begin
  select enc_password into v_enc from caregiver_login_secrets where caregiver_id = p_caregiver_id;
  if v_enc is null then return null; end if;
  return pgp_sym_decrypt(v_enc, 'Ud0AckAxq_nGn_JbloFEhJMZNvcqyscaE930mqkX0Eo');
end $$;

-- These functions bypass RLS by design (security definer) — they must
-- only ever be callable via the service role from Edge Functions, never
-- directly by any client, or any caregiver could read another's password.
revoke execute on function upsert_caregiver_login_secret(uuid, text, text) from public, anon, authenticated;
revoke execute on function decrypt_caregiver_login_secret(uuid) from public, anon, authenticated;
