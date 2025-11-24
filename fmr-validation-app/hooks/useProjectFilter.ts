import { useMemo } from 'react';
import { LocatorFilter } from '@/types/filters';
import { FormStatus } from '@/types/theme';

type ProjectData = {
  id: string;
  projectName: string;
  projectCode?: string;
  abemisId?: string;
  latitude?: number | null;
  longitude?: number | null;
  region?: string | null;
  province?: string | null;
  municipality?: string | null;
  barangay?: string | null;
  status?: FormStatus;
  geotags?: { id: string; url: string; photoName?: string }[];
};

export function useProjectFilter(
  allProjects: ProjectData[],
  selectedLocation: LocatorFilter
) {
  const filteredProjects = useMemo(() => {
    const query = selectedLocation.searchQuery?.trim().toLowerCase() ?? '';
    const hasLocationFilter = Boolean(
      selectedLocation.region || selectedLocation.province || selectedLocation.municipality
    );
    const hasFilter = hasLocationFilter || Boolean(query);

    if (!hasFilter) {
      return [];
    }

    return allProjects.filter((project) => {
      // Location filters
      if (selectedLocation.region && project.region?.toLowerCase() !== selectedLocation.region.toLowerCase()) {
        return false;
      }
      if (
        selectedLocation.province &&
        project.province?.toLowerCase() !== selectedLocation.province.toLowerCase()
      ) {
        return false;
      }
      if (
        selectedLocation.municipality &&
        project.municipality?.toLowerCase() !== selectedLocation.municipality.toLowerCase()
      ) {
        return false;
      }

      if (query) {
        const matchesQuery = [project.projectName, project.abemisId]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query));
        if (!matchesQuery) {
          return false;
        }
      }

      return true;
    });
  }, [allProjects, selectedLocation]);

  return filteredProjects;
}
