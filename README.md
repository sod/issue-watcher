# Watch mode ignores files outside the workspace root

Reproduction for `@angular/build` 22.2.0: in watch mode (`ng serve`, `ng build --watch`), changes to files that live
outside the Angular workspace root never trigger a rebuild.

## Setup

- `app/` is the Angular workspace (contains `angular.json`).
- `lib/greeting.ts` lives outside of it and is imported by `app/src/app/app.ts` through the tsconfig path
  `@lib/*` → `../lib/*`. This is a common monorepo layout for shared libraries.

## Reproduce

```bash
yarn install
```

```bash
yarn watch
```

1. Wait for `Watch mode enabled. Watching for file changes...`.
2. Change something in `app/src/app/app.ts` → a rebuild runs, as expected.
3. Change the string in `lib/greeting.ts` → **nothing happens**. The new text only appears after restarting the
   watcher.

`yarn start` (`ng serve`) behaves the same.

## Expected

Changing `lib/greeting.ts` triggers a rebuild, as it did before the watcher was rewritten on top of `@parcel/watcher`.

## Cause

`packages/angular/build/src/utils/watcher.ts`, `ParcelExternalManager.ensureDirWatched()`:

```ts
this.pendingSubscriptions.set(dirKey, subPromise);

try {
  const sub = await subPromise;
  if (this.externalDirFiles.has(dirKey) && !this.isCoveredByExistingExternal(dirKey)) {
    this.extraSubscriptions.set(dirKey, sub);
    // ...
  } else {
    sub.unsubscribe().catch(() => {});
  }
} finally {
  this.pendingSubscriptions.delete(dirKey);
}
```

Every file outside the workspace root gets its own Parcel subscription for its directory. After that subscription
resolves, `isCoveredByExistingExternal(dirKey)` still sees the subscription's own entry in `pendingSubscriptions`,
because that entry is only removed in `finally`. The check therefore always returns `true`, and the new subscription
is unsubscribed immediately. So no directory outside the workspace root is ever watched.

## Fix

Remove the pending entry before the coverage check:

```diff
   try {
     const sub = await subPromise;
+    this.pendingSubscriptions.delete(dirKey);
     if (this.externalDirFiles.has(dirKey) && !this.isCoveredByExistingExternal(dirKey)) {
```
