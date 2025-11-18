import { FormStatus } from '@/theme';

export interface ValidationForm {
  id: string;
  validationDate: string;
  district: string;
  nameOfProject: string;
  typeOfProject: string;
  proponent: string;
  locationBarangay: string;
  locationMunicipality: string;
  locationProvince: string;
  scopeOfWorks: string;
  estimatedCost: string;
  estimatedLengthLinear: string;
  estimatedLengthWidth: string;
  estimatedLengthThickness: string;
  projectLinkNarrative: string;
  publicMarketName: string;
  distanceKm: string;
  agriCommodities: string;
  areaHectares: string;
  numFarmers: string;
  roadRemarks: string;
  barangaysCovered: string;
  startLatDMS: string;
  startLonDMS: string;
  endLatDMS: string;
  endLonDMS: string;
  preparedByName: string;
  preparedByDesignation: string;
  recommendedByName: string;
  notedByName: string;
  status: FormStatus;
  updatedAt: string;
}
