# Seamless Offline-First Sync Strategy

## Overview

The FMR Validation app now implements a **dual-sync strategy** optimized for handling massive datasets (thousands of FMR projects) while providing seamless real-time form updates.

## Architecture

### Two-Tier Sync Approach

1. **Projects Sync** - Once Daily (24 hours)
   - Full dataset refresh from ABEMIS
   - Optimized for large datasets (thousands of records)
   - Reduces bandwidth and improves performance
   
2. **Forms Sync** - Seamless Real-time (30 seconds)
   - Incremental updates only
   - Optimistic UI updates
   - Background queue for offline operations

## Mobile App Implementation

### Storage Layer (`storage/`)

#### `offline-store.ts`
- Separate timestamp tracking for projects and forms
- `last-projects-sync-at` - Tracks daily project sync
- `last-forms-sync-at` - Tracks incremental form sync
- Functions: `getLastProjectsSyncTimestamp()`, `setLastProjectsSyncTimestamp()`, etc.

#### `sync-queue.ts` (NEW)
- Persistent queue for offline operations
- Stores: create, update, attach, delete operations
- Max 3 retry attempts per operation
- Automatic cleanup on success

### Background Sync (`hooks/useBackgroundSync.ts`)

**Features:**
- Runs every 30 seconds when app is active
- Processes pending queue operations
- Fetches incremental form updates
- Network state monitoring
- App foreground detection

**Triggers:**
- Periodic (30s interval)
- App comes to foreground
- Network reconnects
- Manual refresh

### Data Provider (`providers/OfflineDataProvider.tsx`)

**Enhanced `refresh()` function:**
```typescript
refresh({
  silent?: boolean,      // Hide loading spinner
  force?: boolean,       // Force sync regardless of cache
  projectsOnly?: boolean, // Sync only projects
  formsOnly?: boolean    // Sync only forms (incremental)
})
```

**Optimistic Updates:**
- `saveDraft()` - Save locally first, sync in background
- `attachDraft()` - Attach locally, queue if offline
- `deleteDraft()` - Delete locally, queue if offline

**Queue Integration:**
- Failed operations automatically queued
- Retried on next sync cycle
- Max 3 attempts before manual intervention

### API Layer (`lib/api.ts`)

**New Endpoints:**
```typescript
fetchProjectsFromServer()           // GET /sync/projects
fetchFormsFromServer(since?)        // GET /sync/forms?since=<timestamp>
syncFormsFromClient(forms)          // POST /sync/forms
```

## Backend Implementation

### Sync Service (`modules/sync/`)

#### `sync.controller.ts`
**New Routes:**
- `GET /sync/projects` - Projects-only sync
- `GET /sync/forms?since=<timestamp>` - Incremental forms sync
- `POST /sync/forms` - Upsert client forms

#### `sync.service.ts`
**New Method:**
```typescript
async getIncrementalForms(sinceTimestamp?: number) {
  // Returns only forms updated after timestamp
  // Filters by updatedAt field
  // Includes both project forms and standalone drafts
}
```

**Updated Configuration:**
- Default `ABEMIS_SYNC_INTERVAL_MS`: 86400000 (24 hours)
- Changed from 15 minutes to reduce load

## Sync Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Action                              │
│  (Create/Update/Attach/Delete Form)                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Save Locally  │ (Optimistic Update)
         │  (SQLite)     │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │  Online?      │
         └───┬───────┬───┘
             │       │
         Yes │       │ No
             │       │
             ▼       ▼
    ┌────────────┐  ┌──────────────┐
    │ Sync to    │  │ Add to Queue │
    │ Server     │  │              │
    └─────┬──────┘  └──────┬───────┘
          │                │
          │                │
          ▼                │
    ┌────────────┐         │
    │ Success?   │         │
    └─┬────────┬─┘         │
      │        │           │
   Yes│        │No         │
      │        └───────────┘
      │                │
      ▼                ▼
┌──────────────┐  ┌──────────────┐
│ Incremental  │  │ Retry Later  │
│ Forms Sync   │  │ (Max 3x)     │
└──────────────┘  └──────────────┘
```

## Background Sync Process

```
Every 30 seconds (when app active):
┌─────────────────────────────────────┐
│ 1. Check Network Status             │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 2. Process Sync Queue               │
│    - Retry failed operations        │
│    - Remove successful ops          │
│    - Track retry count              │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 3. Incremental Forms Sync           │
│    GET /sync/forms?since=<timestamp>│
│    - Fetch only updated forms       │
│    - Merge into local cache         │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 4. Update UI (if needed)            │
└─────────────────────────────────────┘
```

## Daily Projects Sync

```
Every 24 hours (or manual refresh):
┌─────────────────────────────────────┐
│ 1. Check Last Projects Sync         │
│    - Read last-projects-sync-at     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 2. Fetch Full Projects              │
│    GET /sync/snapshot               │
│    - All projects + forms           │
│    - Thousands of records           │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 3. Replace Local Cache              │
│    - Update SQLite                  │
│    - Update timestamp               │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 4. Refresh UI                       │
└─────────────────────────────────────┘
```

## Benefits

### Performance
- ✅ Reduced bandwidth usage (incremental sync)
- ✅ Faster app startup (cached projects)
- ✅ Responsive UI (optimistic updates)
- ✅ Efficient for large datasets

### User Experience
- ✅ Works offline seamlessly
- ✅ No waiting for sync
- ✅ Automatic retry on failure
- ✅ Real-time form updates
- ✅ No data loss

### Reliability
- ✅ Persistent queue for offline ops
- ✅ Automatic retry mechanism
- ✅ Network state monitoring
- ✅ Separate sync schedules
- ✅ Conflict-free updates

## Configuration

### Mobile App
No configuration needed - works out of the box with smart defaults.

### Backend
`.env` configuration:
```bash
# Projects sync interval (24 hours)
ABEMIS_SYNC_INTERVAL_MS=86400000

# Disable background sync
# ABEMIS_SYNC_INTERVAL_MS=0
```

## Monitoring & Debugging

### Logs
All sync operations are logged with context:
```typescript
logger.info('sync', 'background:processing', { count: queue.length });
logger.info('offline', 'refresh:projects-sync', { reason: 'scheduled' });
logger.info('offline', 'refresh:forms-sync', { since: lastFormsSync });
```

### Queue Status
Check pending operations:
```typescript
import { getPendingSyncCount } from '@/storage/sync-queue';
const count = await getPendingSyncCount();
```

## Migration Notes

### Existing Users
- First launch will sync all projects (one-time)
- Subsequent launches use incremental sync
- No data migration needed
- Backward compatible with existing cache

### Testing
1. Test offline creation → queue → online sync
2. Test network interruption during sync
3. Test app backgrounding/foregrounding
4. Test large dataset performance (1000+ projects)
5. Test incremental sync with various timestamps

## Future Enhancements

- [ ] Conflict resolution for concurrent edits
- [ ] Partial project sync (by region/zone)
- [ ] Compression for large payloads
- [ ] Delta sync for project updates
- [ ] Sync progress indicators
- [ ] Manual queue management UI
