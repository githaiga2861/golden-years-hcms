-- ============================================================
-- 28_document_records.sql
-- Filled copies of the forms on the Documentation page (Patient
-- Admission Packet, assessments, nurse notes …). Each save keeps the
-- typed answers so the form can be reopened, edited and reprinted.
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================

create table if not exists document_records (
  id          uuid primary key default gen_random_uuid(),
  doc_key     text not null,                     -- 'admission', 'assessment', 'nurse' …
  client_id   uuid references clients(id) on delete set null,
  title       text,
  data        jsonb not null default '{}'::jsonb,
  status      text not null default 'draft' check (status in ('draft', 'completed')),
  created_by  uuid references profiles(id) default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists document_records_client_idx on document_records (client_id, doc_key);
create index if not exists document_records_updated_idx on document_records (updated_at desc);

alter table document_records enable row level security;
drop policy if exists "office full document_records" on document_records;
create policy "office full document_records" on document_records
  for all using (is_office()) with check (is_office());

create or replace function document_records_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists document_records_touch on document_records;
create trigger document_records_touch before update on document_records
  for each row execute function document_records_touch();
