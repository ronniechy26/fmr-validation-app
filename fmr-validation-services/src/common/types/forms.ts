export type FormStatus = 'Draft' | 'Pending Sync' | 'Synced' | 'Error';

export type ProjectZone = string;

export interface ValidationForm {
  id: string;
  validationDate: string;
  district?: string;
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
  abemisId?: string;
  qrReference?: string;
  linkedProjectId?: string;
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
  forms: FormRecord[];
}

export interface FlattenedFormRecord extends FormRecord {
  projectName?: string;
  district?: string;
  locationBarangay?: string;
  locationMunicipality?: string;
  locationProvince?: string;
  zone?: ProjectZone;
}

export interface FormAttachmentInput {
  projectId?: string;
  projectCode?: string;
  abemisId?: string;
  qrReference?: string;
}
