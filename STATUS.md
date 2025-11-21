# Form status lifecycle

Statuses are defined in `types/theme.ts` as `Draft`, `Pending Sync`, `Synced`, and `Error`. They describe where a form sits between local editing and the server.

## What each status means
- **Draft** – Saved only to local storage. Not queued to send to the server yet. Typically set when you tap “Save Draft” in the form editor.
- **Pending Sync** – Saved locally and queued to send to the backend. Set when you choose “Queue for Sync” in the form editor or when a draft is saved while offline/unauthenticated.
- **Synced** – The draft successfully reached the server. We flip local drafts to `Synced` right after a successful `syncDrafts` call (e.g., pull-to-refresh on Standalone Drafts, Settings → Sync Now, or background refresh after login).
- **Error** – Reserved for server-side failures; not currently set by the client, but the UI can display it if the backend returns an errored form status.

## When statuses change
1) **Creating/editing a form**
   - “Save Draft” keeps the record as `Draft`.
   - “Queue for Sync” saves the record with `Pending Sync` and adds it to the sync queue. If you are online and signed in, the app immediately attempts to push it via `syncFormsFromClient`; otherwise it waits for the next sync.

2) **Syncing**
   - Manual: pull-to-refresh on the Standalone Drafts tab or tap “Sync now” in Settings. Both routes call `syncDrafts`, which sends pending drafts to the server and marks them `Synced` locally on success.
   - Background: after login and on daily refresh windows, the offline provider runs a silent refresh that also triggers `syncDrafts` when online.
   - Attaching a standalone draft to an FMR project does **not** change the status; only a successful sync does.

3) **Failures**
   - If a sync call fails, the status stays `Pending Sync` (or whatever it was) and the record remains queued. Check connectivity or server availability, then rerun sync.

4) **Deletion**
   - Deleting a draft removes it locally. If you are signed in, the delete is also sent to the server; otherwise it is queued until the next online sync.

## Quick reference
- Stuck on `Pending Sync` while already visible in the DB? Run a manual sync (pull-to-refresh drafts or Settings → Sync now) to flip the local copy to `Synced`. Attachment to an FMR is optional for the status change; only sync success matters. 

## Last touch conflict handling
- Each form keeps a `lastTouch` timestamp (also written to SQLite). When we receive forms from the backend or push local changes, the client compares `lastTouch` (falling back to `updatedAt`) between the local snapshot and server payloads. The version with the most recent timestamp wins, so your latest edits—whether local or from the server—prevail when snapshots merge. This applies to both full snapshot refreshes and incremental form syncs.
