# The LifeCharter Collective — iPhone app

A Capacitor 8 shell (`ios/`, `capacitor.config.ts`, `capacitor-www/`) around the live
Collective at https://lccommandsuite.com/community. Web changes ship to the app
instantly; a new App Store build is only needed for native changes (icon, plugins,
permissions, capacitor.config.ts).

- Bundle ID: `com.lifecharter.collective` · Team ID: `FLC73LFHKN` · iPhone only, portrait
- Native: Apple push (APNs), haptics, launch screen, status bar, universal links
  (`/.well-known/apple-app-site-association`), password autofill, offline screen
- The app is detected via the `LifeCharterCollectiveApp` user agent / Capacitor bridge
  (`src/lib/community/native.ts`). Inside it: no Plus pricing, checkout, invitations or
  billing links, and no Explore cards that link to outside sales pages
  (App Store 3.1.1 / 3.1.3(f)). Plus members still get every Plus feature.

## One-time setup (needs the Apple Developer account active)

1. **Xcode** — install from the Mac App Store, open it once, accept the licence.
   Then: `sudo xcode-select -s /Applications/Xcode.app`.
2. **App ID** — developer.apple.com → Certificates, Identifiers & Profiles → Identifiers →
   `+` → App IDs → `com.lifecharter.collective`, capabilities: **Push Notifications**,
   **Associated Domains**.
3. **APNs key** — Keys → `+` → "Collective Push" → Apple Push Notifications service →
   download `AuthKey_XXXXXXXXXX.p8` (downloadable once). In Vercel
   (project `lifecharter-architecture`) add:
   - `APNS_KEY_ID` = the 10-character key ID
   - `APNS_PRIVATE_KEY` = the full contents of the .p8 file
   - `APNS_TEAM_ID` = `FLC73LFHKN` (only if the Team ID changes after the conversion)
4. **App Store Connect** → Apps → `+` New App → iOS, name "LifeCharter Collective",
   bundle ID above, SKU `lifecharter-collective`.

## Build & upload

```bash
npm install
npx cap sync ios
npx cap open ios
```

In Xcode: select the **App** target → Signing & Capabilities → Team = LifeCharter
(automatic signing). Choose **Any iOS Device (arm64)** → Product → **Archive** →
Distribute App → App Store Connect → Upload. The build appears in TestFlight in
~15 minutes.

## Before submitting for review

- A reviewer account (not a real member) + invite code in *App Review Information*.
- Privacy "nutrition labels" (see APP-STORE-LISTING.md).
- The LifeCharter Library has content (it's hidden from members while empty).
