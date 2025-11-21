import { FormStatus } from '@/types/theme';

export type ProjectZone = string;

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

export interface FormRecord {
  id: string;
  annexTitle: string;
  status: FormStatus;
  updatedAt: string;
  createdBy?: string;
  abemisId?: string;
  qrReference?: string;
  linkedProjectId?: string;
  region?: string;
  data: ValidationForm;
}

export interface GeoTag {
  id: string;
  projectId: string;
  photoName: string;
  url: string;
}

export interface ProposalDocument {
  id: string;
  projectId: string;
  fileName: string;
  category: string;
  url: string;
}

export interface ProjectRecord {
  id: string;
  projectCode: string;
  title: string;
  abemisId?: string;
  qrReference?: string;
  zone?: ProjectZone;
  operatingUnit?: string;
  bannerProgram?: string;
  yearFunded?: number;
  projectType?: string;
  region?: string;
  district?: string;
  province?: string;
  municipality?: string;
  barangay?: string;
  stage?: string;
  status?: string;
  author?: string;
  quantity?: string;
  quantityUnit?: string;
  allocatedAmount?: string;
  beneficiary?: string | null;
  prexcProgram?: string;
  subProgram?: string;
  indicatorLevel1?: string;
  indicatorLevel3?: string;
  recipientType?: string;
  budgetProcess?: string;
  geotags?: GeoTag[];
  proposalDocuments?: ProposalDocument[];
  latitude?: string;
  longitude?: string;
  forms: FormRecord[];
}

export interface StandaloneDraft extends FormRecord {}

export interface FormRouteMeta {
  id: string;
  annexTitle: string;
  status: FormStatus;
  abemisId?: string;
  qrReference?: string;
  linkedProjectId?: string;
  linkedProjectTitle?: string;
  projectCode?: string;
  region?: string;
  province?: string;
  barangay?: string;
  municipality?: string;
  zone?: string;
}

export interface FormRoutePayload {
  form: ValidationForm;
  meta: FormRouteMeta;
}

export type ClientFormPayload = {
  id?: string;
  annexTitle: string;
  status: FormStatus;
  linkedProjectId?: string;
  abemisId?: string;
  qrReference?: string;
  data: ValidationForm;
};

export interface AttachmentPayload {
  projectId?: string;
  projectCode?: string;
  abemisId?: string;
  qrReference?: string;
}

export interface AttachmentResult {
  record?: FormRecord;
  synced: boolean;
  error?: string;
}

export interface AttachmentSubmitResult {
  success: boolean;
  message?: string;
  error?: string;
}
