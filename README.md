# Golden Years Home Care Management System

Operations software for **Golden Years Home Health Supported Living LLC** (Sumner, WA).
Private-pay clients and caregiver management only — Medicaid / ProviderOne is intentionally out of scope
and handled separately by the agency.

## What's in this repo

| Folder | What it is |
|---|---|
| `web/` | **Main System** — the office web app: landing page, registration, scheduling, care plans, verified hours, invoicing, alerts, team roles, settings. |
| `caregiver-app/` | **Golden Years Care App** — a separate, installable PWA for caregivers: clock in/out with GPS, ADL checklists, visit notes. Works offline. |
| `supabase/` | Database: schema, row-level security, functions/triggers (alerts engine, geofence math, invoice generation), demo seed data. |
| `docs/` | Setup guide, architecture notes, and the phased roadmap. |

## The core pipeline

```
Shift (scheduled) ──▶ Visit (GPS clock in/out) ──▶ Office verifies hours
                                                        │
                                    ┌───────────────────┴──────────────────┐
                                    ▼                                      ▼
                          Invoice (private pay)                Payroll hours (CSV → QuickBooks)
```

Only **verified** clocked hours ever become billable. Caregivers never see financials.

## Quick start

1. Create a Supabase project, run the four SQL files in `supabase/` in order (SQL Editor).
2. Create a `client-documents` storage bucket (private).
3. Copy `.env.example` → `.env` in both `web/` and `caregiver-app/` with your project URL + anon key.
4. `npm install && npm run dev` in each app.
5. Create your admin login: Supabase → Authentication → Add user, then in the SQL editor:
   `update profiles set role = 'admin' where email = 'you@example.com';`

Full walkthrough: **docs/SETUP.md**.

## Tech

React 18 + Vite · Supabase (Postgres, Auth, RLS, Storage) · no CSS framework (hand-built design system
matched to goldenyearshomehealthllc.com, #0b5394 / gold).

## Phase status

- ✅ Phase 1 (this repo): scheduling, registration, care plans + ADLs, GPS clock in/out with offline sync,
  alerts engine, verified hours, invoice generation, payroll CSV export, roles, physician document storage.
- 🔜 Phase 2: QuickBooks Online OAuth sync, in-app messaging, mileage GPS tracking, e-signatures,
  live-in shift handling, family portal, push notifications.
