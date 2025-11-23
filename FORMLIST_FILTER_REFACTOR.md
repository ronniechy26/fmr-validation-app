# FormListScreen Filter Refactor

## Problem
The current FormListScreen uses a single FilterBottomSheet for both FMR Projects and Standalone Drafts, but:
- **Form Status filter doesn't make sense for FMR Projects** (projects themselves don't have status, only their forms do)
- **Standalone Drafts need Form Status filtering** (Draft, Pending Sync, Synced, Error)

## Solution

### 1. **FMR Projects Tab**
- Use `ProjectFilterBottomSheet` (no status filter)
- Filter by:
  - ✅ Project Attributes (all, with forms, no forms, with geotags, with documents)
  - ✅ Location (Region, Province, Municipality)
- Remove status filter logic from projects filtering

### 2. **Standalone Drafts Tab**
- Add **Status Filter Chips** directly in the UI (like the old design)
- Filter by:
  - ✅ Form Status (All, Draft, Pending Sync, Synced, Error)
  - ✅ Search query
- Remove the filter button (disabled state) - use inline chips instead

## Changes Required

### Files to Modify
1. `/screens/FormListScreen.tsx`
   - Import `ProjectFilterBottomSheet` instead of `FilterBottomSheet`
   - Add status filter chips for Standalone Drafts tab
   - Update filter logic to separate projects and drafts
   - Remove status matching from `filteredProjects`
   - Keep status matching only in `filteredStandaloneDrafts`

### New Component
- ✅ `ProjectFilterBottomSheet.tsx` - Created (filters without status)

## Implementation Details

### FMR Projects Filtering
```typescript
// Remove this from filteredProjects:
const matchesStatus =
  activeFilter === 'All' ||
  project.forms.some((form) => form.status === activeFilter);

// Keep only:
const matchesKey = ...
const matchesRegion = ...
```

### Standalone Drafts UI
```tsx
{activeTab === 'drafts' && (
  <View style={styles.statusFilters}>
    {filters.map((filter) => (
      <FilterChip
        key={filter}
        label={filter}
        active={filter === activeFilter}
        onPress={() => setActiveFilter(filter)}
      />
    ))}
  </View>
)}
```

### Filter Button Logic
```typescript
// Only show filter button for projects tab
const filterDisabled = activeTab === 'drafts';

// For drafts, show inline status chips instead
```

## Benefits
1. ✅ **Clearer UX** - Separate filters for different data types
2. ✅ **Better Performance** - No unnecessary status checks on projects
3. ✅ **Intuitive** - Status chips visible for drafts, hidden for projects
4. ✅ **Consistent** - Matches the data model (projects don't have status, forms do)
