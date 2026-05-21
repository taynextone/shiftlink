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
    request<{ user: { id: string; role: string; email: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  registerNurse: (input: Record<string, unknown>) =>
    request<{ user: { id: string; role: string; email: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  getVisibleJobShifts: () => request<{ jobShifts: VisibleJobShift[] }>('/matches/visible-job-shifts'),
  getOwnMatches: () => request<{ matchContracts: OwnMatchContract[] }>('/matches/me'),
  getVerificationOverview: () => request<{ verification: VerificationOverview }>('/nurse-profile/me/verification'),
  respondToMatchOffer: (input: { matchContractId: string; action: 'ACCEPT' | 'DECLINE' }) =>
    request('/matches/respond', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};
