## FMR Validation App Flow

```mermaid
flowchart TD
  A[App Start] --> B[AuthProvider loads session]
  B -->|Valid token| C{OfflineDataProvider}
  B -->|No token| L[Login Screen]

  C -->|Load SQLite snapshot| D[Cached projects + drafts]
  C -->|Token present| E[/sync/snapshot from BFF]
  E --> F[Replace SQLite cache]
  D --> G[(Tabs Navigation)]

  G --> H[Forms Tab]
  H --> I[Filters BottomSheet<br/>status/key/location]
  H --> J[Search projects/ABEMIS/location]
  H --> K[Open project/form -> FormDetailScreen]
  K --> M[Attached forms list] --> N[FormDataScreen]
  K --> O[AttachmentSheet -> link draft]
  K --> P[Geotag photos & proposal docs]

  G --> Q[Add Button] --> R[Annex Select / Form Editor]
  G --> S[Analytics Tab] --> T[Reads cache]
  G --> U[Locator Tab] --> V[Reads cache]
  G --> W[Settings Tab]

  subgraph Offline Cache
    D
    F
  end

  subgraph Backend
    E --> X[SyncService refresh from ABEMIS]
    O --> Y[/forms attach / sync]
  end
```

## Syncing Mechanics

**Dual-sync strategy for optimal performance:**

### Projects Sync (Daily)
- Mobile keeps projects in SQLite (`storage/offline-store.ts`), refreshed once every 24 hours via `/sync/snapshot` or `/sync/projects`
- Projects contain thousands of FMR records, so daily sync reduces bandwidth and improves performance
- Timestamp tracked separately via `last-projects-sync-at` key
- Manual refresh available via pull-to-refresh (forces immediate sync)

### Forms Sync (Seamless/Real-time)
- Forms sync happens automatically every 30 seconds when app is active and online
- Uses incremental sync via `/sync/forms?since=<timestamp>` to fetch only updated forms
- Optimistic updates: changes are saved locally immediately, then synced in background
- Failed operations are queued in `storage/sync-queue.ts` and retried automatically
- Network state monitoring triggers sync when connectivity is restored
- Timestamp tracked via `last-forms-sync-at` key

### Offline Queue
- All create/update/attach/delete operations work offline with optimistic updates
- Operations are queued and automatically synced when online
- Max 3 retry attempts per operation before manual intervention needed
- Queue is processed on app foreground, network reconnect, and every 30s when active

### Sync Flow
1. **Saves/attachments**: When online, immediately sync via `/sync/forms` or `/forms/:id/attach`, then refresh forms incrementally. When offline, save locally and add to queue.
2. **Deletes**: When online, call `/forms/:id` then refresh. When offline, delete locally and queue for later.
3. **Pull-to-refresh**: Syncs projects if >24h old, always syncs forms incrementally.
4. **Background sync**: Processes queue and fetches incremental form updates every 30s.
5. **App foreground**: Triggers immediate sync check.
6. **Network reconnect**: Automatically processes pending queue.

All sync operations depend on AuthProvider tokens; if not signed in or network fails, local cache remains the source until connectivity/auth is restored.
