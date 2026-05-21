export type AuthUser = {
  id: string;
  email: string;
  role: string;
  verificationStatus?: string;
  nurseProfile?: unknown;
  hospitalProfile?: unknown;
};

export type AuthState = {
  userId: string;
  role: string;
  cookieName: string;
};

export type VisibleJobShift = {
  id: string;
  title?: string | null;
  department?: string | null;
  stationName?: string | null;
  locationCity?: string | null;
  startTime: string;
  endTime: string;
  totalPlannedHours: string;
  clinicName: string;
  requirements: Array<{ tag: string; priority: string }>;
};

export type OwnMatchContract = {
  id: string;
  status: string;
  expiresAt?: string | null;
  signedAt?: string | null;
  jobShift: {
    title?: string | null;
    locationCity?: string | null;
    startTime: string;
    endTime: string;
    hospitalProfile: { clinicName: string };
  };
};

export type VerificationOverview = {
  isReleasedForMatching: boolean;
  releasedAt?: string | null;
  documents: Array<{
    id: string;
    documentType: string;
    status: string;
    reviewedAt?: string | null;
  }>;
};

export type HospitalJobShift = {
  id: string;
  title?: string | null;
  locationCity?: string | null;
  startTime: string;
  endTime: string;
  status: string;
  totalPlannedHours: string;
};

export type HospitalOffer = {
  id: string;
  status: string;
  nurse: {
    id: string;
    publicId: string;
    displayName: string;
    minHourlyRate: string;
  };
};

export type Candidate = {
  nurseProfileId: string;
  publicId: string;
  displayName: string;
  minHourlyRate: string;
  preferredShiftType: string;
  preferredTagMatches: number;
  matchingAvailabilityBlockId: string;
  matchingCity: string;
};

export type ContractLifecycle = {
  matchContractId: string;
  status: string;
  executionStatus: string;
  signedAt?: string | null;
  fullyExecutedAt?: string | null;
  contractPdf: { available: boolean; fileUrl: string | null };
  snapshotSummary: {
    currentSnapshotVersion: number | null;
    totalSnapshots: number;
  };
  signatureSummary: {
    totalSignatures: number;
  };
  voidSummary: null | { reason: string; actorRole: string };
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: (input: { email: string; password: string }) =>
    request<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  registerNurse: (input: Record<string, unknown>) =>
    request<{ user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  getSession: () => request<{ auth: AuthState }>('/auth/me'),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  getVisibleJobShifts: () => request<{ jobShifts: VisibleJobShift[] }>('/matches/visible-job-shifts'),
  getOwnMatches: () => request<{ matchContracts: OwnMatchContract[] }>('/matches/me'),
  getVerificationOverview: () => request<{ verification: VerificationOverview }>('/nurse-profile/me/verification'),
  respondToMatchOffer: (input: { matchContractId: string; action: 'ACCEPT' | 'DECLINE' }) =>
    request('/matches/respond', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  listHospitalJobShifts: () => request<{ jobShifts: HospitalJobShift[] }>('/job-shifts'),
  importHospitalJobShift: (input: Record<string, unknown>) =>
    request<{ mode: 'created' | 'updated'; jobShift: HospitalJobShift }>('/job-shifts/import', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  listHospitalOffers: (jobShiftId: string) =>
    request<{ offers: HospitalOffer[]; jobShift: HospitalJobShift }>(`/matches/hospital-offers?jobShiftId=${encodeURIComponent(jobShiftId)}`),
  findCandidates: (jobShiftId: string) =>
    request<{ jobShiftId: string; candidates: Candidate[] }>('/matches/candidates', {
      method: 'POST',
      body: JSON.stringify({ jobShiftId }),
    }),
  createOffer: (input: { jobShiftId: string; nurseProfileId: string }) =>
    request<{ matchContract: { id: string; status: string } }>('/matches/offer', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  signContractExecution: (contractId: string) =>
    request<{ execution: { executionStatus: string; signatureCount: number } }>(`/matches/contract/${contractId}/execution/sign`, {
      method: 'POST',
    }),
  voidContract: (contractId: string, reason: string) =>
    request<{ voiding: { executionStatus: string; reason: string } }>(`/matches/contract/${contractId}/void`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  getContractLifecycle: (contractId: string) => request<{ lifecycle: ContractLifecycle }>(`/matches/contract/${contractId}/lifecycle`),
};
