export interface PilotLocationType {
  id: number;
  code: string;
  prefix: string;
  label: string;
  domain: string;
}

export interface FacilityResponse {
  id: string;
  code: string;
  typeCode: string;
  typePrefix: string;
  typeLabel: string;
  domain: string;
  districtId: number;
  districtCode: string;
  districtName: string;
  blockId: number | null;
  blockName: string | null;
  panchayatId: number | null;
  panchayatName: string | null;
  status: string;
  isDemo: boolean;
  facilityName: string | null;
  officialCode: string | null;
  createdAt: string;
}

export interface RegisterFacilityRequest {
  typeCode: string;
  districtId: number;
  blockId?: number | null;
  panchayatId?: number | null;
  facilityName: string;
  officialCode?: string | null;
  isDemo?: boolean;
}

export interface CsvRowError {
  rowNumber: number;
  field: string;
  message: string;
}

export interface CsvUploadSummary {
  totalRows: number;
  successCount: number;
  failureCount: number;
  createdFacilities: FacilityResponse[];
  errors: CsvRowError[];
}

export const fetchLocationTypes = async (): Promise<PilotLocationType[]> => {
  const res = await fetch('/api/v1/facilities/types');
  if (!res.ok) throw new Error('Failed to load facility types');
  return res.json();
};

export const registerFacility = async (data: RegisterFacilityRequest): Promise<FacilityResponse> => {
  const res = await fetch('/api/v1/facilities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to register facility' }));
    throw new Error(err.error || err.message || 'Failed to register facility');
  }
  return res.json();
};

export const searchFacilities = async (params: {
  districtId?: number;
  typeId?: number;
  blockId?: number;
  status?: string;
  page?: number;
  size?: number;
}): Promise<{ content: FacilityResponse[]; totalElements: number; totalPages: number }> => {
  const query = new URLSearchParams();
  if (params.districtId) query.set('districtId', params.districtId.toString());
  if (params.typeId) query.set('typeId', params.typeId.toString());
  if (params.blockId) query.set('blockId', params.blockId.toString());
  if (params.status) query.set('status', params.status);
  query.set('page', (params.page ?? 0).toString());
  query.set('size', (params.size ?? 20).toString());

  const res = await fetch(`/api/v1/facilities?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to search facilities');
  return res.json();
};

export const uploadFacilityCsv = async (file: File): Promise<CsvUploadSummary> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/v1/facilities/bulk-upload', {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Bulk upload failed' }));
    throw new Error(err.error || err.message || 'Bulk upload failed');
  }
  return res.json();
};
