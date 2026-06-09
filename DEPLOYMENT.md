# Spendes — Build, Share & Publish

How to test Spendes on real devices, share it with friends, and ship it to the
App Store / Play Store. Builds run in **EAS (Expo Application Services)** cloud — you
do **not** need a Mac for iOS.

> The app is **Expo SDK 54** (managed). Verify Expo specifics against
> https://docs.expo.dev/versions/v54.0.0/ before changing native config.

---

## 0. The one prerequisite that blocks everything: a hosted backend

The app does not work on someone else's phone until the backend is reachable over
**HTTPS**. The frontend resolves its API base URL from env (see `src/api/config.ts`):

| Var | Meaning |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Full base incl. `/api/v1` (takes priority) |
| `EXPO_PUBLIC_API_HOST` | Just `host[:port]`; `/api/v1` is appended |
| _(neither)_ | Dev fallback to the Metro host's LAN IP, port 3000 |

- **Local dev:** `.env` sets `EXPO_PUBLIC_API_HOST` to your machine's LAN IP. Used by
  `expo start` / Expo Go only.
- **Built apps (preview & production):** the URL is baked in at build time from
  **`eas.json` → `build.<profile>.env.EXPO_PUBLIC_API_URL`**, currently
  `https://api.spendes.app/api/v1`. **Change it there if your host differs, then rebuild.**

**Deploy `../spendes_backend`** to that host with: MongoDB Atlas, a managed Redis, real
`JWT` secrets, and CORS allowing the app. OTP is mocked (`123456`) until real SMS is wired —
fine for a friends test; give reviewers a demo number + that code in the review notes.

**Quick test before hosting:** tunnel local backend and point the build at it —
```powershell
cloudflared tunnel --url http://localhost:3000   # or: ngrok http 3000
# put the printed https URL + /api/v1 into eas.json env, then rebuild
```

---

## 1. One-time setup (already done in this repo)

- `eas.json` — `development` / `preview` / `production` profiles. `preview` makes an
  installable **APK**; `production` auto-increments build numbers (managed remotely via
  `cli.appVersionSource: "remote"`).
- `app.json` — `ios.bundleIdentifier` + `android.package` = **`com.spendes.app`**
  (permanent once published), `extra.eas.projectId`, `owner`.

Install the CLI and log in once:
```powershell
npm install -g eas-cli
eas login
eas whoami          # confirm
```

---

## 2. Test on your own devices

**Expo Go (fastest, free):**
```powershell
npm start           # install "Expo Go" on the phone, scan the QR
```
Works for everything **except** UPI deep links + the `LSApplicationQueriesSchemes`
config — those only run in a real build (§3).

**Full native build (for UPI etc.):** use the preview build below.

---

## 3. Share with friends

### Android — direct APK (no paid account)
```powershell
npm run android:preview        # eas build -p android --profile preview
```
First run: let EAS generate & store the keystore. When it finishes, EAS prints a
**URL + QR** — send it; friends tap, allow "install unknown apps," install. Re-run to
ship an update (send the new link).

### iOS — TestFlight (needs Apple Developer account, $99/yr)
```powershell
npm run ios:prod               # eas build -p ios --profile production
npm run submit:ios             # eas submit -p ios --latest
```
Then in **App Store Connect → TestFlight**, add testers by Apple ID (internal: up to
100, instant; external: up to 10k, light review). There is **no** sideloadable APK
equivalent on iOS.

---

## 4. Publish to the stores

```powershell
npm run android:prod && npm run submit:android     # Play
npm run ios:prod && npm run submit:ios             # App Store
```
Then complete each console's listing:

- **Screenshots** in every required device size, app name, description, category.
- **Privacy policy URL** that actually resolves (the app links `spendes.app/privacy`
  and `spendes.app/terms` — publish those pages).
- **Data safety (Play) / Privacy "nutrition labels" (Apple):** disclose that you collect
  **phone numbers** and **contacts**. Be ready to justify contacts access.
- Content rating, pricing (free).

Review: Apple ~1–3 days; Google ~hours–days. New **personal** Play accounts now usually
require a **closed test with 12+ testers for 14 days** before production — your preview
APK testers can serve as those testers.

---

## 5. Gotchas / pre-submit checklist

- [ ] Backend live over HTTPS at the URL baked into `eas.json`.
- [ ] A working **demo login** for reviewers (mock OTP `123456`, documented in review notes).
- [ ] `spendes.app/privacy` and `/terms` pages exist.
- [ ] **`android.permission.WRITE_CONTACTS`** is declared but the app only *reads* contacts
      (`expo-contacts`). Play will question a write-contacts permission the app doesn't use —
      remove it from `app.json` unless you actually add contact-writing, or expect a review flag.
- [ ] Back up the EAS-managed Android keystore (`eas credentials`) — losing it means you can
      never update the same Play listing.
- [ ] Versioning is remote (`appVersionSource: "remote"`); `production` builds auto-increment.
      Bump the human-facing `version` in `app.json` for each public release.
- [ ] UPI deep links only work on a **physical device with a UPI app installed** — never in
      Expo Go, emulators, simulators, or web.

---

## Command reference

| Script | What it does |
| --- | --- |
| `npm start` | Metro dev server (Expo Go) |
| `npm run android:preview` | Shareable Android **APK** (internal distribution) |
| `npm run android:prod` | Android **AAB** for the Play Store |
| `npm run ios:preview` | iOS internal build (needs registered device) |
| `npm run ios:prod` | iOS build for TestFlight / App Store |
| `npm run submit:android` | Upload latest Android build to Play |
| `npm run submit:ios` | Upload latest iOS build to App Store Connect |
