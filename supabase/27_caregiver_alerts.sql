-- ============================================================
-- 27_caregiver_alerts.sql
-- Office → caregiver alerts ("your shift changed, refresh the app",
-- "you forgot to key in visit notes", etc).
--
-- Sent from Messages → Alerts in the office system. Shown in the
-- Care App as a gold banner, the same way "update available" is,
-- until the caregiver taps the action button or "Got it".
--
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- ============================================================

create table if not exists caregiver_alerts (
  id               uuid primary key default gen_random_uuid(),
  caregiver_id     uuid not null references caregivers(id) on delete cascade,
  alert_type       text not null default 'custom',
  title            text not null,
  body             text,
  -- What the button on the caregiver's phone does.
  action           text not null default 'acknowledge'
                   check (action in ('refresh', 'open_visit', 'open_schedule', 'open_profile', 'acknowledge')),
  shift_id         uuid references shifts(id) on delete set null,
  priority         text not null default 'normal' check (priority in ('normal', 'urgent')),
  created_by       uuid references profiles(id) default auth.uid(),
  created_at       timestamptz not null default now(),
  seen_at          timestamptz,
  acknowledged_at  timestamptz
);

create index if not exists caregiver_alerts_open_idx on caregiver_alerts (caregiver_id, acknowledged_at);
create index if not exists caregiver_alerts_created_idx on caregiver_alerts (created_at desc);

alter table caregiver_alerts enable row level security;

drop policy if exists "office full caregiver_alerts" on caregiver_alerts;
create policy "office full caregiver_alerts" on caregiver_alerts
  for all using (is_office()) with check (is_office());

drop policy if exists "caregiver reads own alerts" on caregiver_alerts;
create policy "caregiver reads own alerts" on caregiver_alerts
  for select using (caregiver_id = my_caregiver_id());

drop policy if exists "caregiver acknowledges own alerts" on caregiver_alerts;
create policy "caregiver acknowledges own alerts" on caregiver_alerts
  for update using (caregiver_id = my_caregiver_id()) with check (caregiver_id = my_caregiver_id());

-- A caregiver may only stamp seen/acknowledged — never rewrite the alert.
create or replace function caregiver_alerts_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_office() then
    new.caregiver_id := old.caregiver_id;
    new.alert_type   := old.alert_type;
    new.title        := old.title;
    new.body         := old.body;
    new.action       := old.action;
    new.shift_id     := old.shift_id;
    new.priority     := old.priority;
    new.created_by   := old.created_by;
    new.created_at   := old.created_at;
  end if;
  return new;
end $$;

drop trigger if exists caregiver_alerts_guard on caregiver_alerts;
create trigger caregiver_alerts_guard before update on caregiver_alerts
  for each row execute function caregiver_alerts_guard();

-- Live delivery to the Care App (realtime).
do $$
begin
  alter publication supabase_realtime add table caregiver_alerts;
exception when duplicate_object then null;
end $$;

-- Lets the office drop an entry in a caregiver's notification bell when the
-- push function can't be reached (the alert banner still shows either way).
drop policy if exists "office inserts push log" on push_notifications_log;
create policy "office inserts push log" on push_notifications_log
  for insert with check (is_office());
