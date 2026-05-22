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


export type AvailabilityBlock = {
  id: string;
  title?: string | null;
  city: string;
  postalCode?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  radiusKm: number;
  startTime: string;
  endTime: string;
  notes?: string | null;
  isBooked: boolean;
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


export type VerificationDocumentReviewResult = {
  id: string;
  documentType: string;
  status: string;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  nurseProfile: {
    id: string;
    publicId: string;
    displayName: string;
    isReleasedForMatching: boolean;
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
  externalJobShiftId?: string | null;
  title?: string | null;
  locationCity?: string | null;
  startTime: string;
  endTime: string;
  status: string;
  totalPlannedHours: string;
  requirements?: Array<{ tag: string; priority: string }>;
  offerCounts?: { total: number; pending: number; declined: number; signed: number; expired: number; canceled: number; invoiced: number };
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


export type HospitalNurseDossier = {
  nurseProfileId: string;
  publicId: string;
  displayName: string;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  minHourlyRate: string;
  preferredShiftType?: string | null;
  isReleasedForMatching: boolean;
  releasedAt?: string | null;
  specializations: string[];
  verifiedDocuments: Array<{
    id: string;
    documentType: string;
    status: string;
    reviewedAt?: string | null;
    objectKey: string;
    signedUrl: string;
    expiresIn: number;
  }>;
  signedAssignments: Array<{
    matchContractId: string;
    jobShiftId: string;
    startTime: string;
    endTime: string;
    locationCity?: string | null;
    hospitalProfileId: string;
    clinicName: string;
  }>;
};

export type ContractLifecycle = {
  matchContractId: string;
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: string | null;
  respondedAt?: string | null;
  status: string;
  executionStatus: string;
  signedAt?: string | null;
  fullyExecutedAt?: string | null;
  hospital?: { hospitalProfileId: string; clinicName: string };
  nurse?: { nurseProfileId: string; publicId: string; displayName: string };
  contractPdf: { available: boolean; fileUrl: string | null };
  invoice?: null | { id: string; status: string; amount: string; invoicePdfUrl: string | null };
  snapshotSummary: {
    currentSnapshotId?: string | null;
    currentSnapshotVersion: number | null;
    totalSnapshots: number;
    versions?: Array<{ id: string; version: number; createdAt: string; summaryText: string }>;
  };
  signatureSummary: {
    totalSignatures: number;
    events?: Array<{ id: string; signerUserId: string; signerRole: string; signatureIntent: string; snapshotId: string; createdAt: string }>;
  };
  voidSummary: null | { id?: string; actorUserId?: string; reason: string; actorRole: string; createdAt?: string };
};

export type HospitalBillingSummary = {
  signedContracts: number;
  invoiceCount: number;
  totalInvoiceAmount: number;
  pendingInvoiceAmount: number;
  paidInvoiceAmount: number;
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
  reviewVerificationDocument: (input: { documentId: string; status: 'VERIFIED' | 'REJECTED'; rejectionReason?: string }) =>
    request<{ verificationDocument: VerificationDocumentReviewResult }>('/nurse-profile/verification/review', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  listOwnAvailabilityBlocks: () => request<{ blocks: AvailabilityBlock[] }>('/nurse-availability/me'),
  createOwnAvailabilityBlock: (input: { title?: string; city: string; postalCode?: string; radiusKm: number; startTime: string; endTime: string; notes?: string }) =>
    request<{ block: AvailabilityBlock }>('/nurse-availability/me', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  deleteOwnAvailabilityBlock: (blockId: string) =>
    request<void>(`/nurse-availability/me/${blockId}`, { method: 'DELETE' }),
  updateOwnAvailabilityBlock: (blockId: string, input: { title?: string; city?: string; postalCode?: string; radiusKm?: number; startTime?: string; endTime?: string; notes?: string }) =>
    request<{ block: AvailabilityBlock }>(`/nurse-availability/me/${blockId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  replaceOwnAvailabilityBlocks: (input: { blocks: Array<{ title?: string; city: string; postalCode?: string; radiusKm: number; startTime: string; endTime: string; notes?: string }> }) =>
    request<{ blocks: AvailabilityBlock[] }>('/nurse-availability/me', {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
  copyOwnAvailabilityBlock: (input: { sourceBlockId: string; copies: Array<{ startTime: string; endTime: string }> }) =>
    request<{ blocks: AvailabilityBlock[] }>('/nurse-availability/me/copy', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  respondToMatchOffer: (input: { matchContractId: string; action: 'ACCEPT' | 'DECLINE' }) =>
    request('/matches/respond', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  listHospitalJobShifts: () => request<{ jobShifts: HospitalJobShift[] }>('/job-shifts'),
  getHospitalBillingSummary: () => request<HospitalBillingSummary>('/job-shifts/billing/summary'),
  getHospitalNurseDossier: (nurseProfileId: string) => request<{ dossier: HospitalNurseDossier }>(`/documents/dossier/${nurseProfileId}`),
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
