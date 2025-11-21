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
