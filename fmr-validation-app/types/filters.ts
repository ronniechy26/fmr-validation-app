import { FormStatus } from './theme';

/**
 * Location filter type for filtering by region, province, and municipality
 */
export interface RegionFilter {
  region?: string;
  province?: string;
  municipality?: string;
}

/**
 * Locator filter type that supports location fields and text search
 */
export interface LocatorFilter extends RegionFilter {
  searchQuery?: string;
}

/**
 * Key filter type for filtering projects by attributes
 */
export type KeyFilter = 'all' | 'withForms' | 'withoutForms' | 'withGeotags' | 'withDocs';

/**
 * FMR item type for displaying FMR projects in lists and maps
 */
export interface FMRItem {
  id: string;
  projectName: string;
  barangay: string;
  municipality: string;
  province?: string;
  region?: string;
  projectCode?: string;
  abemisId?: string;
  geotags?: { id: string; url: string; photoName?: string }[];
  status: FormStatus;
  latitude?: number;
  longitude?: number;
}

/**
 * Location option type for populating location dropdowns
 */
export interface LocationOption {
  region?: string;
  province?: string;
  municipality?: string;
  barangay?: string;
}
