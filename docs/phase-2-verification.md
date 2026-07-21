# Phase 2 — Live Verification Checklist

The lead pipeline shipped **without live credentials** (none existed during the
build). Everything below is the manual, one-time verification the operator runs
**after provisioning the services**. Work top to bottom; each step tells you
what to do, where, and what you must see before moving on.

No coding is required. You will need: the Supabase project dashboard, the
Vercel project dashboard, the Resend dashboard, the Cloudflare Turnstile
dashboard, and access to the broker notification inbox.

---

## 1. Apply the database schema (once, before anything else)

The schema is **applied manually, never by code** (`supabase/schema.sql` is the
source of truth).

1. Open the Supabase project → **SQL Editor** → **New query**.
2. Open the file `supabase/schema.sql` from this repository, copy its entire
   contents, paste into the editor, press **Run**.
3. Expect: "Success. No rows returned."
4. Verify in **Table Editor**: three tables exist — `leads`, `lead_events`,
   `rate_limits`.
5. Verify RLS: each of the three tables shows **RLS enabled** and **no
   policies**. That is correct and intentional — only the service-role key
   (server) can touch them.

## 2. Fill the environment variables

In Vercel → Project → **Settings → Environment Variables**, set each of the
following (copy names exactly). Then **redeploy** so they take effect.

| Variable | Where its value comes from |
| --- | --- |
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` key. Server-only. NEVER add any variant beginning with `NEXT_PUBLIC_` — the build blocks it, do not work around it. |
| `TURNSTILE_SECRET` | Cloudflare Turnstile → the site's **Secret key** |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile → the site's **Site key** (this one is public by design) |
| `LEAD_IP_SALT` | Any long random string (40+ characters). Rotating it later resets rate-limit memory only — acceptable. |
| `RESEND_API_KEY` | Resend → API Keys |
| `LEAD_FROM_ADDRESS` | The verified sending address in Resend (requires the domain's DKIM setup — blocked on the domain decision D-06) |
| `BROKER_NOTIFY_EMAIL` | The broker's inbox for lead alerts |
| `CRON_SECRET` | Any long random string; Vercel automatically presents it to the cron route |
| `CRM_PROVIDER` | `null` (leave as-is until a CRM cutover is decided) |
| `TWILIO_*`, `BROKER_NOTIFY_PHONE`, `TWILIO_ENABLED` | Leave `TWILIO_ENABLED=0`. SMS stays off until Phase 6. |

**Behavior before env is filled** (expected, by design): submitting the form
returns a 503 naming the missing variable; the build and every page stay green.

## 3. Test submission (happy path)

1. Visit `https://<preview-domain>/en/contact`.
2. Confirm the Turnstile widget appears when you scroll to the form.
3. Fill **Full name** and **Email** (use a real inbox you can check), tick no
   checkboxes, write a short message. Submit.
4. Expect: the form is replaced by "Message sent" confirmation.
5. In Supabase **Table Editor → leads**: one new row. Check its columns:
   `source_type = contact`, `route = /en/contact`, `locale = en`,
   `status = new`, `crm_sync_status = pending`, `ip_hash` is a 64-character
   hex string (NOT your IP address), `consent_ts` is empty (no boxes ticked).
6. Repeat once on `https://<preview-domain>/es/contacto` and verify
   `locale = es`, `route = /es/contacto`.

## 4. Inbox checks

1. **Broker alert**: the `BROKER_NOTIFY_EMAIL` inbox received "New lead: …"
   containing every field you typed plus the source chain (source type, route,
   locale, UTM).
2. **Lead confirmation**: the lead's inbox received **NOTHING**. This is
   correct — the confirmation body is still a placeholder awaiting the
   client's copy, so the send is deliberately skipped (see step 5's event).
   Once the client's email copy is delivered and deployed
   (`content/emails.ts`), re-run this step and expect a real confirmation in
   the language of the page you submitted on.

## 5. Audit the lead_events chain

In Supabase → **Table Editor → lead_events**, filter by the new lead's id
(`lead_id`). Expect, in order:

1. `created` — always present. **If this row is missing anything else is
   irrelevant; stop and report.**
2. `email_broker_sent` — present if step 4.1 succeeded; otherwise a
   `notify_error` row whose `detail` names the provider error.
3. `email_lead_sent` with `detail = {"skipped":"tk_body"}` — the deliberate
   skip from step 4.2. (After the client's copy ships, this becomes
   `email_lead_sent` with no skip detail.)

## 6. Rate-limit probe

1. Submit the contact form **6 times within one hour** from the same network
   (vary the email each time to avoid the dedupe in step 7).
2. Expect: submissions 1–5 succeed; submission **6** shows the error state.
3. In Supabase → `rate_limits`: one row for your `ip_hash` with `hits >= 6`.
4. This is a fixed hourly window — wait for the top of the next hour and one
   more submission succeeds again.

## 7. Dedupe probe

1. Submit the form twice within a few minutes with the **same email address**
   on the same page.
2. Expect: both show the success state, but Supabase → `leads` contains only
   **one** row for that email, and only one `created` event exists. The second
   submission silently returned the first lead's id — no duplicate alert email
   should have arrived either.

## 8. Bot-defense spot checks (optional but recommended)

- **Time trap**: submit within ~2 seconds of the page loading. Expect the
  normal success message but NO new row in `leads` — the drop is silent by
  design.
- **Turnstile**: with `TURNSTILE_SECRET` temporarily set to a wrong value,
  a submission shows the error state (server answers 403). Restore the secret
  afterward and redeploy.

## 9. CRM sync sweep

1. In Vercel → Project → **Settings → Cron Jobs**, add a job for
   `/api/crm/sync` (daily is fine while the CRM is `null`). Vercel sends the
   `CRON_SECRET` authorization automatically.
2. Trigger it once (Vercel → Cron Jobs → Run), or from a terminal:
   `curl -H "Authorization: Bearer <CRON_SECRET>" https://<domain>/api/crm/sync`
3. Expect JSON like `{"processed":N,"synced":0,"skipped":N,"failed":0}`.
4. In Supabase → `leads`: the earlier rows now show `crm_sync_status =
   skipped` (correct while `CRM_PROVIDER=null`), each with a `status_changed`
   event on its chain.

## 10. Sign-off items still open after this checklist

- Client copy for the confirmation email body (EN + ES) → `content/emails.ts`,
  then re-run steps 4.2 and 5.3.
- Attorney/client review of the two consent checkbox texts and the contact
  page answer paragraph (flagged in the Phase 2 completion report).
- The `LEAD_FROM_ADDRESS` domain (DKIM) is blocked on the domain decision
  (D-06).
- Known limitation (accepted): the rate-limit counter uses read-then-write, so
  two truly simultaneous submissions can occasionally count as one. Harmless
  at this traffic level.
