# Google verification pack: LifeCharter Command Suite sign-in app

Prepared 2026-10-10 for the Google Cloud project "LifeCharter" (OAuth consent screen, status: In production, unverified).
Goal: remove the "unverified app" warning and the 100-user cap so any client can connect Gmail and Google Calendar.

## What Google will review

The app asks for these scopes (src/lib/google.ts):

| Scope | Class | Why the Suite needs it |
|---|---|---|
| openid, email, profile | Basic | Identify which Google account was connected. |
| gmail.modify | Restricted | Read the client's inbox in the Suite's Inbox view and mark messages read. |
| gmail.send | Sensitive | Send a reply the client wrote and approved, from their own address. |
| calendar.readonly | Sensitive | Show the client's busy times so booking pages never double-book them. |
| calendar.events | Sensitive | Add a booked consultation to the client's own calendar. |
| drive.file | Non-sensitive | Save a recording the client chose to upload into a folder the app created. |

**Restricted scopes (gmail.modify) trigger an extra step: a third-party security assessment (CASA, Tier 2), repeated yearly.**
This is the long and sometimes paid part. Two ways to shorten it:

1. **Drop gmail.modify and use gmail.readonly + gmail.send.** Both are still sensitive/restricted for reading mail, so the assessment likely still applies, but the justification is simpler ("read to display, send to reply"). "Mark read" is the only thing modify adds.
2. **Drop inbox reading entirely and keep only gmail.send** (and calendar scopes). Sending is Sensitive, not Restricted, so verification is a normal review without the security assessment. Cost: the Suite's Inbox view for Gmail would go away.

Decision for Babs: does the Suite NEED to read the client's inbox, or is sending enough for launch?

## What to submit (Google Cloud console > APIs & Services > OAuth consent screen)

1. **App name / logo / support email**: "LifeCharter Command Suite", support@lccommandsuite.com.
2. **Home page**: https://lccommandsuite.com
3. **Privacy policy**: https://lccommandsuite.com/legal/privacy-policy. It must state, in plain words, that Google user data is used only to provide the features the user turns on, is not sold, is not used for ads, is not used to train AI models, and humans do not read it. (Check the live policy for a "Google API Services User Data Policy, including the Limited Use requirements" sentence; add it if missing.)
4. **Authorized domain**: lccommandsuite.com (already added).
5. **Scope justification** (one short paragraph per sensitive scope, from the table above).
6. **Demo video** (YouTube, unlisted), about 3 to 5 minutes, showing:
   - Opening https://lccommandsuite.com and signing in.
   - Settings, Connect Google: the consent screen with the app name and each scope, then Allow.
   - Where each scope is used: the Inbox view (read + mark read), approving and sending a reply, a booking page that respects calendar busy times, a booked event appearing in Google Calendar.
   - Disconnecting Google in Settings and what it removes.
   - Narrate in English; show the browser address bar and the OAuth client ID if asked.
7. **Test account**: Google reviewers may ask for a login; use an Eloise account, never a real client.

## Timeline expectations

- Sensitive-scope review only: typically 1 to 3 weeks.
- With a restricted scope: add the security assessment, typically several weeks and a vendor fee. Plan for 1 to 2 months and a decision on cost.

## Until verified

- Up to 100 users can still connect (they see an "unverified app" screen and click Advanced > Go to LifeCharter Command Suite).
- Tell clients that screen is expected, in the Help library entry for connecting Google.
