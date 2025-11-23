# Type Centralization Summary

## Overview
All reusable filter and location-related types have been moved to a centralized location for better code organization and reusability.

## New Types File
**Location**: `/types/filters.ts`

### Types Defined:

1. **`RegionFilter`** - Interface for location filtering
   ```typescript
   interface RegionFilter {
     region?: string;
     province?: string;
     municipality?: string;
   }
   ```
   **Used in:**
   - `LocationFilterBottomSheet.tsx`
   - `ProjectFilterBottomSheet.tsx`
   - `FormListScreen.tsx`
   - `LocatorScreen.tsx`

2. **`KeyFilter`** - Type for project attribute filtering
   ```typescript
   type KeyFilter = 'all' | 'withForms' | 'withoutForms' | 'withGeotags' | 'withDocs';
   ```
   **Used in:**
   - `ProjectFilterBottomSheet.tsx`
   - `FormListScreen.tsx`

3. **`FMRItem`** - Interface for FMR project display
   ```typescript
   interface FMRItem {
     id: string;
     projectName: string;
     barangay: string;
     municipality: string;
     status: FormStatus;
     latitude?: number;
     longitude?: number;
   }
   ```
   **Used in:**
   - `FMRListBottomSheet.tsx`
   - `LocatorScreen.tsx`

4. **`LocationOption`** - Interface for location dropdown options
   ```typescript
   interface LocationOption {
     region?: string;
     province?: string;
     municipality?: string;
     barangay?: string;
   }
   ```
   **Available for future use**

## Files Updated

### Components:
1. ✅ `components/FMRListBottomSheet.tsx` - Now imports `FMRItem`
2. ✅ `components/LocationFilterBottomSheet.tsx` - Now imports `RegionFilter`
3. ✅ `components/ProjectFilterBottomSheet.tsx` - Now imports `KeyFilter` and `RegionFilter`

### Screens:
4. ✅ `screens/FormListScreen.tsx` - Now imports `KeyFilter` and `RegionFilter`

## Benefits

1. **Single Source of Truth** - Types defined once, used everywhere
2. **Easier Maintenance** - Update types in one place
3. **Better IntelliSense** - Consistent type definitions across the app
4. **Reduced Duplication** - No more duplicate type definitions
5. **Improved Consistency** - Same types used across all components

## Import Pattern

```typescript
// Old way (inline types)
type RegionFilter = { region?: string; province?: string; municipality?: string };

// New way (centralized)
import { RegionFilter } from '@/types/filters';
```

## Future Additions

When adding new filter or location-related types, add them to `/types/filters.ts` to maintain consistency.
