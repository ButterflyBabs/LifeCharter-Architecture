# Meta Conversions API (server-side pixel)

Our server sends conversions straight to Meta, alongside the browser Meta Pixel. Ad blockers and
Safari tracking protection can't block it. It's built directly into the app (`src/lib/metaCapi.ts`),
with no third-party vendor. It does nothing until the access token below is set.

Pixel: **1084205054362982** ("AmiLynne Carroll Websites", Sacred Kaleidoscope Community).

## What gets sent

| Event | When | Sent from | Event id (for dedup) |
|---|---|---|---|
| Purchase | Any completed Stripe checkout: Command Suite, The Life Shift, SOUL Sessions Payment Links, Collective Plus, Website Build | `api/stripe/webhook` | Stripe checkout session id. The `/get-started/success` pixel Purchase uses the same id, so Meta counts it once. |
| Lead | A Suite form is submitted (new submission only) | `api/forms/[id]` | `_event_id` posted with the form, or a server id |
| Lead | Executive Business Assessment completed | `api/assessment-results` | `eventId` posted, or a server id |
| Schedule | A booking page books a new meeting (not reschedules) | `api/book/[slug]` | `booking-<booking id>` |

Email, phone, and first and last name are SHA-256 hashed before they leave our server. When the
request comes from a browser, the visitor's IP, browser, and Meta cookies (`_fbp` / `_fbc`) are
also sent, to help Meta match the event.

## Babs's steps (one time)

1. Open Events Manager for the pixel:
   https://business.facebook.com/events_manager2/list/pixel/1084205054362982/settings
2. Scroll to **Conversions API** → **Set up direct integration** → **Generate access token**.
   Copy the token and keep it private. It's a password for sending events.
3. Open the Command Suite project's environment variables in Vercel:
   https://vercel.com/dashboard → the Command Suite project → **Settings** → **Environment Variables**.
   Add **Key** `META_CAPI_TOKEN`, **Value** = the token, **Environment** = Production only. Save.
4. Redeploy Production so the new variable takes effect (**Deployments** → latest Production →
   **⋯** → **Redeploy**).

### Optional: confirm it's working

1. In Events Manager open **Test events**:
   https://business.facebook.com/events_manager2/list/pixel/1084205054362982/test_events
   Copy the test code shown (it looks like `TEST12345`).
2. In Vercel add `META_TEST_EVENT_CODE` = that code (Production), and redeploy.
3. Submit a Suite form or book a test meeting as Eloise. Within a minute a **Server** event
   appears in Test events.
4. **Remove `META_TEST_EVENT_CODE`** from Vercel and redeploy. While it's set, events go only to
   Test events and don't count for ads.

## Settings

- `META_CAPI_TOKEN`: secret. Without it, nothing is sent.
- `META_PIXEL_ID`: optional. Defaults to the shared pixel above.
- `META_TEST_EVENT_CODE`: optional, and only for testing (see above).

Each send gives up after 2.5 seconds and never breaks the checkout, form, or booking. Failures
are only logged (`meta capi …` in the Vercel logs).
