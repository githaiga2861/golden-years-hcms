# Architecture Notes

## Principles
1. **Verified hours are the single source of truth.** Scheduling is a plan; the visit
   (clock in/out) is the fact; verification is the office's sign-off. Billing and payroll
   only ever read verified facts.
2. **Caregivers never see money.** RLS hides rates, invoices, and settings from caregiver roles
   at the database level — not just in the UI.
3. **Offline is a first-class path.** Clock events, task checks, and notes queue in
   localStorage and replay in order through idempotent RPCs (`clock_in` is safe to replay).
4. **Medicaid is out of scope on purpose.** No ProviderOne fields, no EVV aggregator format.
   If that ever changes, visits already capture the underlying data (who/what/when/where).

## Data flow
- `shifts` (plan) → `visits` (fact; created by the `clock_in` RPC, which also snapshots the
  client's care-plan tasks into `visit_tasks` so mid-visit plan edits never corrupt history).
- `process_visit_clock` trigger computes geofence distance server-side (never trust the client),
  flags `location_ok`, advances shift status, and raises alerts.
- `v_visit_ledger` view joins everything billing/payroll needs: worked hours, bill rate
  (shift override → client default), pay rate (shift override → caregiver default).
- `generate_invoice` RPC: verified + unbilled visits in a period → numbered invoice + line
  items, marks visits billed (atomic).

## Security model
- Roles: `admin`, `scheduler`, `coordinator` (office) and `caregiver` (app only).
- All helper functions (`is_office`, `my_caregiver_id`) are `security definer` so RLS
  policies stay short and auditable.
- Caregiver visit updates are blocked once `verified = true` (locked history).

## Phase 2 integration points (already stubbed)
- `invoices.qb_*` columns + Settings card → QuickBooks Online OAuth app.
- `message_threads` / `messages` tables + RLS → in-app chat.
- `caregivers.mileage_rate` → GPS trip capture between clients.
- `caregivers.caregiver_kind = 'live_in'` → multi-day placements with sleep-time carve-outs.
