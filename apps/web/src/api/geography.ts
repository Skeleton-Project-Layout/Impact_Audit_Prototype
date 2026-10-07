export interface State {
  id: number;
  code2: string;
  name: string;
  active: boolean;
}

export interface District {
  id: number;
  stateId: number;
  stateCode: string;
  code3: string;
  name: string;
  active: boolean;
}

export interface Block {
  id: number;
  districtId: number;
  districtCode: string;
  code: string;
  name: string;
  active: boolean;
}

export interface Panchayat {
  id: number;
  blockId: number;
  blockCode: string;
  code: string;
  name: string;
  active: boolean;
}

export interface CreateBlockRequest {
  districtId: number;
  code: string;
  name: string;
}

export interface CreatePanchayatRequest {
  blockId: number;
  code: string;
  name: string;
}

export const fetchStates = async (): Promise<State[]> => {
  const res = await fetch('/api/v1/geography/states');
  if (!res.ok) throw new Error('Failed to load states');
  return res.json();
};

export const fetchDistricts = async (stateId?: number): Promise<District[]> => {
  const url = stateId ? `/api/v1/geography/districts?stateId=${stateId}` : '/api/v1/geography/districts';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load districts');
  return res.json();
};

export const fetchBlocks = async (districtId: number): Promise<Block[]> => {
  const res = await fetch(`/api/v1/geography/districts/${districtId}/blocks`);
  if (!res.ok) throw new Error('Failed to load blocks');
  return res.json();
};

export const fetchPanchayats = async (blockId: number): Promise<Panchayat[]> => {
  const res = await fetch(`/api/v1/geography/blocks/${blockId}/panchayats`);
  if (!res.ok) throw new Error('Failed to load panchayats');
  return res.json();
};

export const createBlock = async (data: CreateBlockRequest): Promise<Block> => {
  const res = await fetch('/api/v1/geography/blocks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create block' }));
    throw new Error(err.error || err.message || 'Failed to create block');
  }
  return res.json();
};

export const createPanchayat = async (data: CreatePanchayatRequest): Promise<Panchayat> => {
  const res = await fetch('/api/v1/geography/panchayats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create panchayat' }));
    throw new Error(err.error || err.message || 'Failed to create panchayat');
  }
  return res.json();
};
