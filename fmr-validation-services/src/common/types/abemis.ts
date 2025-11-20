export type AbemisPagination = {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
};

export type AbemisInfraListItem = {
  id: number;
  project_id: string;
  project_title: string;
  operating_unit?: string;
  banner_program?: string;
  year_funded?: number | string;
  project_type?: string;
  region?: string;
  province?: string;
  district?: string;
  municipality?: string;
  barangay?: string;
  stage?: string;
  status?: string;
  author?: string;
  quantity?: string;
  quantity_unit?: string;
  latitude?: string;
  longitude?: string;
};

export type AbemisGeoTag = {
  id: string | number;
  project_id: string | number;
  photo_name: string;
  url: string;
};

export type AbemisProposalDoc = {
  id: string | number;
  project_id: string | number;
  file_name: string;
  category: string;
  url: string;
};

export type AbemisInfraDetail = AbemisInfraListItem & {
  allocated_amount?: string;
  beneficiary?: string;
  prexc_program?: string;
  sub_program?: string;
  indicator_level1?: string;
  indicator_level3?: string;
  recipient_type?: string;
  budget_process?: string;
  geotag?: AbemisGeoTag[];
  proposalDocuments?: AbemisProposalDoc[];
  latitude?: string;
  longitude?: string;
};

export type AbemisInfraListResponse = {
  success: boolean;
  pagination: AbemisPagination;
  count: number;
  data: AbemisInfraListItem[];
};

export type AbemisInfraDetailResponse = {
  success: boolean;
  data: AbemisInfraDetail;
};
