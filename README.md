# Watch mode ignores files outside the workspace root

`@angular/build` 22.2.0 doesn't rebuild when a file outside the workspace root (`app/`) changes, here `lib/greeting.ts`.

```bash
yarn install
```

## Bug

```bash
WATCHER_FIX=0 yarn watch
```

Edit `lib/greeting.ts` → no rebuild.

## Fixed

```bash
WATCHER_FIX=1 yarn watch
```

Edit `lib/greeting.ts` → rebuild.

The fix (`.yarn/patches/`) in `ParcelExternalManager.ensureDirWatched()`:

```diff
   const sub = await subPromise;
+  this.pendingSubscriptions.delete(dirKey);
   if (this.externalDirFiles.has(dirKey) && !this.isCoveredByExistingExternal(dirKey)) {
```

Without it, `isCoveredByExistingExternal()` matches the subscription's own pending entry and unsubscribes it right away.
