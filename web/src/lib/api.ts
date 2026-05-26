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



export type AdminReleaseControlResult = {
  nurseProfile: {
    id: string;
    publicId: string;
    displayName: string;
    isReleasedForMatching: boolean;
    releasedAt?: string | null;
  };
  documents: Array<{
    id: string;
    documentType: string;
    status: string;
    reviewedAt?: string | null;
    rejectionReason?: string | null;
    createdAt: string;
  }>;
  reason?: string | null;
};

export type AdminVerificationOverview = {
  nurseProfile: {
    id: string;
    publicId: string;
    displayName: string;
    isReleasedForMatching: boolean;
    releasedAt?: string | null;
  };
  documents: Array<{
    id: string;
    documentType: string;
    status: string;
    reviewedAt?: string | null;
    rejectionReason?: string | null;
    createdAt: string;
  }>;
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
  expiresAt?: string | null;
  respondedAt?: string | null;
  signedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  invoiceId?: string | null;
  nurseProfileId?: string;
  jobShiftId?: string;
  nurse: {
    id: string;
    publicId: string;
    displayName: string;
    minHourlyRate: string;
    whatsappOptIn: boolean;
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




export type ContractVoidOverview = {
  matchContractId: string;
  status: string;
  executionStatus: string;
  voidEvent: null | {
    actorUserId: string;
    actorRole: string;
    reason: string;
    createdAt: string;
  };
};

export type ContractExecutionOverview = {
  matchContractId: string;
  executionStatus: string;
  fullyExecutedAt?: string | null;
  signatureEvents: Array<{
    id: string;
    signerUserId: string;
    signerRole: string;
    signatureIntent: string;
    createdAt: string;
  }>;
};

export type ContractSnapshotResponse = {
  snapshotId: string;
  version: number;
  summaryText: string;
  snapshot: Record<string, unknown>;
};

export type ContractPdfResponse = {
  fileUrl: string;
  objectKey: string;
  expiresIn: number;
};

export type ContractLifecycle = {
  matchContractId: string;
  jobShiftId: string;
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




export type AsyncProcessFailureRow = {
  id: string;
  queueName: string;
  jobName: string;
  jobId?: string | null;
  relatedEntityId?: string | null;
  attemptCount?: number | null;
  errorMessage: string;
  createdAt: string;
};

export type HospitalWebhookEventRow = {
  id: string;
  hospitalProfileId: string;
  clinicName: string;
  eventType: string;
  deliveryAttempts: number;
  lastAttemptAt?: string | null;
  deliveredAt?: string | null;
  lastError?: string | null;
  createdAt: string;
  status: string;
};

export type HospitalBillingExportRow = {
  invoiceId: string;
  invoiceStatus: string;
  invoiceAmount: string;
  createdAt: string;
  matchContractId: string;
  matchStatus: string;
  externalJobShiftId: string;
  jobShiftId: string;
  jobShiftTitle: string;
  locationCity: string;
  nursePublicId: string;
  nurseDisplayName: string;
  signedAt: string;
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
    const rawMessage = await response.text();
    let message = rawMessage;

    try {
      const parsed = JSON.parse(rawMessage) as { message?: string; error?: string };
      message = parsed.message ?? parsed.error ?? rawMessage;
    } catch {
      message = rawMessage;
    }

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
  getAdminVerificationOverview: (publicId: string) => request<{ verification: AdminVerificationOverview }>(`/nurse-profile/verification/admin/${encodeURIComponent(publicId)}`),
  setMatchingRelease: (input: { publicId: string; release: boolean; reason?: string }) =>
    request<{ releaseControl: AdminReleaseControlResult }>('/nurse-profile/verification/release', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
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
    request<{ status: 'ACCEPTED' | 'DECLINED'; matchContract: HospitalOffer }>('/matches/respond', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  listHospitalJobShifts: () => request<{ jobShifts: HospitalJobShift[] }>('/job-shifts'),
  getHospitalBillingSummary: () => request<{ summary: HospitalBillingSummary }>('/job-shifts/billing/summary'),
  getInvoiceDetail: (id: string) => request<{
    id: string; status: string; amount: string; invoicePdfUrl: string | null;
    createdAt: string; updatedAt: string; contractId: string; contractStatus: string;
    jobShiftTitle: string | null; jobShiftLocation: string | null;
    nurseDisplayName: string; nursePublicId: string;
  }>(`/job-shifts/billing/invoices/${encodeURIComponent(id)}`),
  markInvoicePaid: (id: string) => request<{ id: string; status: string }>(`/job-shifts/billing/invoices/${encodeURIComponent(id)}/mark-paid`, { method: 'POST' }),
  listHospitalWebhookEvents: (limit = 25) => request<{ events: HospitalWebhookEventRow[] }>(`/job-shifts/webhooks?limit=${encodeURIComponent(String(limit))}`),
  listAsyncProcessFailures: (limit = 25) => request<{ failures: AsyncProcessFailureRow[] }>(`/job-shifts/async-failures?limit=${encodeURIComponent(String(limit))}`),
  retryWebhookEvent: (id: string) => request<{ id: string; status: string }>(`/job-shifts/webhooks/${encodeURIComponent(id)}/retry`, { method: 'POST' }),
  resolveAsyncFailure: (id: string) => request<{ id: string; resolved: boolean }>(`/job-shifts/async-failures/${encodeURIComponent(id)}/resolve`, { method: 'POST' }),
  exportHospitalBilling: (query?: { status?: 'PENDING' | 'PAID'; format?: 'json' | 'csv'; limit?: number }) => {
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.format) params.set('format', query.format);
    if (query?.limit) params.set('limit', String(query.limit));
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return request<{ format: 'json'; rows: HospitalBillingExportRow[] }>(`/job-shifts/billing/export${suffix}`);
  },
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
  reopenOffer: (input: { matchContractId: string }) =>
    request<{ matchContract: { id: string; status: string } }>('/matches/reopen', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  extendOfferExpiry: (input: { matchContractId: string }) =>
    request<{ matchContract: { id: string; status: string } }>('/matches/extend-offer', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  retryOfferWhatsapp: (input: { matchContractId: string }) =>
    request<{ matchContractId: string; queued: boolean }>('/matches/retry-whatsapp', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  getWhatsAppEvents: (contractId: string) =>
    request<{ events: Array<{ id: string; eventType: string; phoneNumber: string; messageText: string; status: string; attemptCount: number; lastError: string | null; deliveredAt: string | null; createdAt: string; updatedAt: string }> }>(`/job-shifts/whatsapp/${encodeURIComponent(contractId)}/events`),
  getAuditLogs: (options?: { action?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (options?.action) params.set('action', options.action);
    if (options?.limit) params.set('limit', String(options.limit));
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return request<{ logs: Array<{ id: string; action: string; actorUserId: string; actorRole: string; targetEntityType: string | null; targetEntityId: string | null; metadata: Record<string, unknown> | null; createdAt: string }>; total: number }>(`/admin/audit-logs${suffix}`);
  },
  getHospitalWhatsAppEvents: (options?: { status?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    if (options?.limit) params.set('limit', String(options.limit));
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return request<{ events: Array<{ id: string; eventType: string; phoneNumber: string; messageText: string; status: string; attemptCount: number; lastError: string | null; deliveredAt: string | null; createdAt: string; updatedAt: string; contractId: string; nurseDisplayName: string; jobShiftTitle: string | null }> }>(`/job-shifts/whatsapp/events${suffix}`);
  },
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
  getContractSnapshot: (contractId: string) => request<{ contractSnapshot: ContractSnapshotResponse }>(`/matches/contract/${contractId}/snapshot`),
  getContractPdf: (contractId: string) => request<{ contractPdf: ContractPdfResponse }>(`/matches/contract/${contractId}/pdf`),
  getContractExecutionOverview: (contractId: string) => request<{ execution: ContractExecutionOverview }>(`/matches/contract/${contractId}/execution`),
  getContractVoidOverview: (contractId: string) => request<{ voiding: ContractVoidOverview }>(`/matches/contract/${contractId}/void`),
  completeOnboarding: (input: { displayName: string; phoneNumber: string; whatsappOptIn: boolean; minHourlyRate?: number; specializations?: string[]; clinicName?: string; billingAddress?: string }) =>
    request<{ id: string; displayName: string; phoneNumber: string; whatsappOptIn: boolean; hasCompletedOnboarding: boolean }>('/nurse-profiles/me/onboarding', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  uploadVerificationDocument: (input: { documentType: string; fileName: string; contentType: string; fileSize: number }) =>
    request<{ id: string; uploadUrl: string }>('/nurse-profiles/me/documents', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  getBusinessMetrics: () => request<{
    users: { totalNurses: number; totalHospitals: number };
    shifts: { total: number };
    contracts: { total: number; signed: number; pending: number; declined: number; expired: number; conversionRate: number };
    invoices: { total: number; paid: number; pending: number; paymentRate: number };
    notifications: { total: number; delivered: number; failed: number; deliveryRate: number };
  }>('/admin/metrics'),
  getPayrollExport: () => request<{
    rows: Array<{
      nurseDisplayName: string;
      nursePublicId: string;
      contractId: string;
      jobShiftTitle: string;
      jobShiftStartDate: string;
      jobShiftEndDate: string;
      agreedHours: number;
      hourlyRate: number;
      totalAmount: string;
      invoiceStatus: string;
      invoiceId: string;
    }>;
  }>('/admin/payroll-export'),
  updateWebhookConfig: (input: { webhookUrl?: string; webhookSecret?: string }) =>
    request<{ webhookUrl: string | null; webhookSecretConfigured: boolean }>('/job-shifts/webhook-config', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  getHospitalDossierOverview: () => request<{
    dossiers: Array<{
      nurseProfileId: string;
      publicId: string;
      displayName: string;
      isReleasedForMatching: boolean;
      signedAssignmentsCount: number;
      verifiedDocumentsCount: number;
      lastAssignmentDate: string | null;
    }>;
  }>('/job-shifts/dossier-overview'),
  reportNoShow: (contractId: string) => request(`/matches/contract/${encodeURIComponent(contractId)}/no-show`, { method: 'POST' }),
  cancelContractByHospital: (contractId: string, reason: string) => request(`/matches/contract/${encodeURIComponent(contractId)}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  completeContract: (contractId: string) => request(`/matches/contract/${encodeURIComponent(contractId)}/complete`, { method: 'POST' }),
};
