# Spendes — Offline Support Implementation Plan

Status: **planning only** (no code written yet).
Target: **Phase 1 (offline reads) + Phase 2 (offline writes for key paths)**. Phase 3 intentionally out of scope.

> Before implementing any Expo code, confirm package versions against the versioned
> Expo docs for this project's SDK (currently **Expo 54**). Install native/Expo deps with
> `npx expo install` so it resolves SDK-compatible versions — don't pin manually.

---

## Why this is low-risk here

The data layer is already offline-friendly:

- All server state flows through **React Query** (`@tanstack/react-query` ^5.90).
- Queries + mutations are centralized in [`src/features/hooks.ts`](src/features/hooks.ts).
- Query keys are centralized in `qk` ([`src/api/queryKeys.ts`](src/api/queryKeys.ts)).
- `@react-native-async-storage/async-storage` is already a dependency.
- Token storage already has a web fallback ([`src/api/tokens.ts`](src/api/tokens.ts)).

So most of the work is wiring, not rearchitecting.

---

## Phase 1 — Offline reads (cache persistence)  ⭐ do first

**Goal:** app opens offline and shows the last-synced data instead of spinners/blank screens. Background-refreshes when back online.

**Effort:** ~1 hour · **Risk:** very low (read-only) · **Backend changes:** none.

### Packages
```bash
npx expo install @tanstack/react-query-persist-client @tanstack/query-async-storage-persister
# (async-storage already installed)
```

### Steps

1. **Create a persister** next to the client in [`src/data/queryClient.ts`](src/data/queryClient.ts):
   ```ts
   import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
   import AsyncStorage from '@react-native-async-storage/async-storage';

   export const persister = createAsyncStoragePersister({
     storage: AsyncStorage,
     key: 'spendes.rq-cache',
     throttleTime: 1000,
   });
   ```
   Also bump `gcTime` on the default query options to be **≥ maxAge** (e.g. `24 * 60 * 60_000`) — React Query won't persist/restore a query whose `gcTime` is shorter than the persist `maxAge`. Current `gcTime` is 5 min, which would defeat persistence.

2. **Swap the provider** in [`src/app/_layout.tsx`](src/app/_layout.tsx): replace `QueryClientProvider` with `PersistQueryClientProvider`:
   ```tsx
   <PersistQueryClientProvider
     client={queryClient}
     persistOptions={{
       persister,
       maxAge: 24 * 60 * 60 * 1000,            // 24h
       buster: Constants.expoConfig?.version,  // invalidate cache on app version bump
       dehydrateOptions: {
         // skip volatile/cheap queries that aren't worth persisting
         shouldDehydrateQuery: (q) =>
           q.state.status === 'success' &&
           q.queryKey[0] !== 'notificationsUnread', // the 45s poll
       },
     }}
   >
   ```

3. **Clear cache on sign-out.** In the sign-out flow (where [`clearTokens()`](src/api/tokens.ts) is called), also:
   ```ts
   await persister.removeClient();   // wipe persisted cache
   queryClient.clear();              // wipe in-memory cache
   ```
   Critical: prevents one user's financial data persisting into the next session on a shared device.

4. **(Optional) "Last synced" indicator.** Surface `dataUpdatedAt` from a key query (e.g. overview) so users know data may be stale offline. Nice-to-have.

### Phase 1 gotchas
- **Per-user safety:** cache is cleared on sign-out (step 3), so no cross-user leakage. If you support account switching without full sign-out, also include the user id in the persist `key`.
- **Infinite queries** (`useExpenses`, `useNotifications`, `useIncomeList`) persist fine — restored with their loaded pages.
- **Sensitive data at rest:** the cache lands in AsyncStorage (plain, not encrypted). It's the user's own data on their own device, but if you want it encrypted, swap the storage adapter for an encrypted one (e.g. MMKV-with-encryption or a SecureStore-backed adapter). Decide explicitly.

---

## Phase 2 — Offline writes (queue + replay) for key paths

**Goal:** user can add an expense / create a split / record a settlement while offline; the UI updates immediately and the change syncs on reconnect.

**Scope (only the on-the-go writes):**
- `useCreateExpense` ([hooks.ts](src/features/hooks.ts))
- `useCreateGroupSplit` / `useCreateFriendSplit`
- `useRecordGroupSettlement` / `useRecordFriendSettlement`

Leave the rest (budgets, goals, investments, profile edits) online-only for now — they're rarely done offline.

**Effort:** medium · **Risk:** medium · **Backend changes:** YES (idempotency).

### Packages
```bash
npx expo install @react-native-community/netinfo
# expo-crypto for client-side UUID idempotency keys (or use crypto.randomUUID where available)
npx expo install expo-crypto
```

### Frontend steps

1. **Connectivity → React Query.** Register NetInfo with `onlineManager` once at startup (e.g. top of [`src/data/queryClient.ts`](src/data/queryClient.ts) or a small `online.ts`):
   ```ts
   import NetInfo from '@react-native-community/netinfo';
   import { onlineManager } from '@tanstack/react-query';

   onlineManager.setEventListener((setOnline) =>
     NetInfo.addEventListener((s) => setOnline(!!s.isConnected)),
   );
   ```
   With React Query's default `networkMode: 'online'`, mutations fired offline are automatically **paused** instead of failing.

2. **Register mutation defaults by key** so paused mutations survive an app restart and can be replayed. React Query can only resume a paused/persisted mutation if a `mutationFn` is registered for its `mutationKey`. For each queued path:
   ```ts
   queryClient.setMutationDefaults(['createExpense'], {
     mutationFn: (body) => expensesApi.create(body),
     onMutate: optimisticAddExpense,   // see step 3
     onError: rollback,
     onSettled: () => invalidateAfterTransaction(),
   });
   ```
   Then the hook becomes `useMutation({ mutationKey: ['createExpense'] })` (no inline `mutationFn`).

3. **Optimistic updates with temp IDs.** In `onMutate`, write the new item into the relevant cache(s) with a temporary client id (e.g. `optimistic:<uuid>`) and a `pendingSync: true` flag so the UI can show a "pending" badge. On success, reconcile/replace with the server record; on error, roll back. The settlement and split caches (`qk.groupBalances`, `qk.groupExpenses`, `qk.friendExpenses`) must be updated too so balances reflect the pending change.

4. **Persist the mutation cache.** `PersistQueryClientProvider` already persists *both* query and mutation caches, so queued mutations survive app kill. On startup, after restore, resume:
   ```ts
   // onSuccess of the persist provider, or on reconnect:
   queryClient.resumePausedMutations().then(() => queryClient.invalidateQueries());
   ```
   Also resume when connectivity returns (NetInfo listener).

5. **Idempotency key per mutation.** Generate a UUID in `onMutate`, attach it to the request as an `Idempotency-Key` header (extend the thin wrappers in [`src/api/http.ts`](src/api/http.ts) / the axios instance in `client.ts` to accept/forward it). The same key must be reused on replay — so store it in the optimistic record, not regenerated.

6. **Offline UX.**
   - A small **offline banner** (NetInfo `isConnected`) so users know they're offline.
   - **Pending badges** on optimistic rows (`pendingSync`).
   - Disable/relabel actions that genuinely can't work offline (see UPI note).

### Backend steps (Express)

1. **Idempotency middleware** for the mutating split/expense/settlement routes:
   - New collection `idempotency_keys`: `{ key, userId, method, path, statusCode, responseBody, createdAt }` with a **TTL index** on `createdAt` (e.g. expire after 48h).
   - On a request carrying `Idempotency-Key`:
     - If `(userId, key)` exists → return the stored `statusCode` + `responseBody` (do **not** re-execute).
     - Else execute, then store the response keyed by `(userId, key)` before returning.
   - Scope by `userId` to avoid cross-user key collisions.
2. Apply it to: create expense, create group/friend split, record settlement. (Reads need nothing.)

### Phase 2 gotchas
- **UPI settlement is special.** The *settlement record* can be queued offline, but the actual **UPI payment cannot** — it needs the UPI app + live network. Plan the UX so "record settlement" can be optimistic/queued, while the UPI deep-link only fires when online. Don't let a queued record imply money actually moved.
- **401 / token refresh while offline.** Verify the axios interceptor in [`src/api/client.ts`](src/api/client.ts) treats a *network error* differently from a real `401` — a failed-because-offline request must **not** trigger a logout/token-clear. Check this before shipping Phase 2.
- **Replay ordering / conflicts.** Queued writes replay in order; the backend is authoritative on final balances (the `onSettled` invalidation refetches truth). Idempotency prevents duplicates from retries.
- **Stale optimistic state:** if a replay ultimately fails server-side (validation), surface it (toast + keep/rollback the row) rather than silently dropping.

---

## Phase 3 — Full offline-first (NOT recommended now)

Local SQLite / WatermelonDB / PowerSync (or RxDB) as the source of truth with bi-directional sync. Large rewrite; only justified if "fully works offline" becomes a core selling point. Revisit later.

---

## Suggested sequencing

1. **Phase 1** (reads) — ship it; immediate UX win, near-zero risk.
2. **Backend idempotency middleware** — independent, can land anytime.
3. **Phase 2** for the three on-the-go write paths, one mutation at a time (start with `createExpense`).
4. Re-evaluate whether more write paths or Phase 3 are worth it based on real usage.

## Test plan
- Airplane mode: open app cold → data shows (Phase 1).
- Add expense in airplane mode → row appears with pending badge (Phase 2) → re-enable network → syncs once, no duplicate (idempotency).
- Kill app while a mutation is queued → relaunch → still queued → reconnect → replays.
- Sign out → relaunch → no previous user's data in cache.
- Flap network mid-request → no duplicate writes, no spurious logout.
```
