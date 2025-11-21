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
- Mobile keeps an offline snapshot in SQLite (`storage/offline-store.ts`), hydrated by `/sync/snapshot` when signed in or by cached data when offline.
- Pull-to-refresh (Forms tab) calls `syncDrafts` to push standalone drafts; if offline, shows an alert and skips the push. Afterward, it silently refreshes the snapshot.
- Saves/attachments: when signed in, `saveDraft` pushes the draft via `/sync/forms` and `attachDraft` calls `/forms/:id/attach`, then refreshes the snapshot in the background. Offline paths write to the cache and queue for later.
- Deletes: standalone draft delete calls `/forms/:id` when signed in; otherwise it deletes locally. Snapshot refresh runs after server delete.
- Sync depends on AuthProvider tokens; if not signed in or network fails, local cache remains the source until connectivity/auth is restored.
