# Setup Guide

## 1. Supabase project
1. Create a project at supabase.com (choose a region close to WA, e.g. us-west-1).
2. Open **SQL Editor** and run, in order:
   - `supabase/01_schema.sql`
   - `supabase/02_policies.sql`
   - `supabase/03_functions.sql`
   - `supabase/04_seed.sql` (optional demo data)
3. **Storage** → create bucket `client-documents` (private). Add policies allowing
   authenticated office users to read/write (Storage → Policies), e.g. allow all
   operations where `is_office()` — or start with "authenticated can read/write" and tighten later.
4. **Authentication → Providers**: enable Email. Turn OFF "Confirm email" for the
   simplest start (the office creates accounts by hand), or keep it on if you prefer.

## 2. Create the first admin
1. Authentication → **Add user** → email + password (this is the owner's login).
2. SQL Editor: `update profiles set role = 'admin' where email = 'owner@example.com';`

## 3. Run the apps locally
```bash
cd web && cp .env.example .env   # paste your Project URL + anon key
npm install && npm run dev       # http://localhost:5173

cd ../caregiver-app && cp .env.example .env
npm install && npm run dev       # http://localhost:5174
```

## 4. Onboard a caregiver
1. Main System → Caregivers → **Register caregiver** (name, phone, email, rates).
2. Supabase → Authentication → **Add user** with the caregiver's email (their app password).
3. Main System → Caregivers → open the caregiver → **App account** tab → link their login.
4. Caregiver installs the Care App on their phone (open the URL → "Add to Home Screen") and signs in.

## 5. Scheduled alert sweep (recommended)
The alerts for *missed clock-in* and *missing clock-out* are produced by `detect_visit_exceptions()`.
Run it every 10 minutes with pg_cron (Database → Extensions → enable `pg_cron`):
```sql
select cron.schedule('gy-visit-sweep', '*/10 * * * *', 'select detect_visit_exceptions()');
```

## 6. Deploying
- Both apps are static builds: `npm run build` → deploy `dist/` to Vercel, Netlify, or any static host.
- Deploy the Care App at its own URL (e.g. care.goldenyears.app) or under `/care-app/` next to the
  main system; the landing page's "Open & install the Care App" button should point there.
- HTTPS is required for GPS and PWA installation.

## Troubleshooting
- **"Not connected to a database yet"** on the login screen → `.env` missing or dev server not restarted.
- **Caregiver sees "login isn't linked"** in the app → do step 4.3 (link the profile).
- **No location check on clock-in** → the client has no latitude/longitude set. Add coordinates on the
  client record (any maps site shows them) or leave blank to skip GPS checks for that client.
