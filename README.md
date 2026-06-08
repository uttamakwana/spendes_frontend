# Spendes — Mobile App (Expo / React Native)

Premium **personal + social finance** app for India — track expenses & income, split
bills with groups and friends, settle up over **UPI**, and plan with budgets, EMIs,
goals and investments. Built with **Expo SDK 56**, **React Native 0.85**, **expo-router**,
**TanStack Query** and **TypeScript (strict)**.

Pairs with the Spendes backend (`/api/v1`) — see `docs/FRONTEND_PLAN.md` in the backend
repo for the full API contract.

## Quick start

```bash
npm install
# Point the app at your backend (physical device needs your machine's LAN IP):
cp .env.example .env   # then set EXPO_PUBLIC_API_HOST=<your-ip>:3000
npm run start          # then press a (Android) / i (iOS), or scan the QR in Expo Go
```

- The dev fallback auto-detects the Metro host IP and uses port `3000`, so on a simulator
  you often don't need `.env` at all.
- In dev the backend OTP is mocked — use **`123456`** at the OTP screen.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run start` | Expo dev server |
| `npm run android` / `npm run ios` | Launch on a device/emulator |
| `npx tsc --noEmit` | Type-check |
| `npm run lint` | Lint |

## Architecture

```
src/
├─ app/                 # expo-router routes (file-based)
│  ├─ _layout.tsx        # providers (QueryClient · Theme · Auth) + root Stack
│  ├─ index.tsx          # auth-gated redirect
│  ├─ onboarding.tsx     # value props → phone → OTP → register/login
│  ├─ (tabs)/            # Home · Groups · Insights · Profile (custom tab bar + center FAB)
│  ├─ add.tsx            # central "+" chooser (transparent modal)
│  ├─ add-transaction.tsx, add-split.tsx, settle.tsx
│  ├─ transactions/, friends/, groups/, budgets/, emis/, goals/, investments/, profile/
├─ api/                 # axios client (envelope unwrap + refresh-on-401), typed endpoints, query keys
├─ auth/                # AuthProvider (secure-store tokens, session restore, sign-out cascade)
├─ data/                # QueryClient + the invalidation cascade (splits → personal finance)
├─ features/            # hooks (TanStack Query), TxnRow, Keypad, custom TabBar
├─ theme/               # design tokens, light/dark, accents, Inter type scale
├─ ui/                  # design-system kit (Button, Card, Money, Avatar, charts, Sheet, …)
└─ lib/                 # money formatting (₹ Indian grouping), category styling
```

### Key conventions
- **One envelope:** the axios response interceptor returns `data` directly; `401` triggers a
  single-flight token refresh, then sign-out on failure.
- **Invalidation cascade:** a group/friend split materializes share rows into personal
  expenses, so split & settlement mutations also invalidate expenses, budgets and analytics
  (`src/data/invalidate.ts`).
- **Money semantics:** owed-to-you = green, you-owe = red, settled = neutral — everywhere.
- **Tabular ₹ figures** with Indian lakh/crore grouping; a single brand accent (configurable
  in Profile) over a neutral canvas, with full light/dark support.

## Notes
- Split shares are read-only personal expenses — manage them in the group/friend, not here.
- Settle-up opens the UPI deep link, then you confirm and the app records the settlement.
- Pro entitlements are dormant on the backend; the Pro card is a tasteful placeholder.
