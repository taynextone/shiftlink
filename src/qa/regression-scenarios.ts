export type QaRole = 'NURSE' | 'HOSPITAL_ADMIN' | 'SUPER_ADMIN';

export type QaApiBoundary = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
};

export type QaRegressionScenario = {
  id: string;
  title: string;
  ownerRole: QaRole;
  entryRoutes: string[];
  seededRecords: string[];
  apiBoundaries: QaApiBoundary[];
  browserAssertions: string[];
};

export const publicBrowserRoutes = ['/', '/login', '/register'] as const;

export const protectedBrowserRoutes = [
  { path: '/nurse', roles: ['NURSE'] },
  { path: '/nurse/jobs', roles: ['NURSE'] },
  { path: '/nurse/availability', roles: ['NURSE'] },
  { path: '/nurse/matches', roles: ['NURSE'] },
  { path: '/nurse/profile', roles: ['NURSE'] },
  { path: '/nurse/contracts', roles: ['NURSE'] },
  { path: '/onboarding', roles: ['NURSE', 'HOSPITAL_ADMIN'] },
  { path: '/hospital', roles: ['HOSPITAL_ADMIN', 'SUPER_ADMIN'] },
  { path: '/hospital/shifts', roles: ['HOSPITAL_ADMIN', 'SUPER_ADMIN'] },
  { path: '/hospital/offers', roles: ['HOSPITAL_ADMIN', 'SUPER_ADMIN'] },
  { path: '/hospital/dossier', roles: ['HOSPITAL_ADMIN', 'SUPER_ADMIN'] },
  { path: '/hospital/contracts', roles: ['HOSPITAL_ADMIN', 'SUPER_ADMIN'] },
  { path: '/hospital/billing', roles: ['HOSPITAL_ADMIN', 'SUPER_ADMIN'] },
  { path: '/admin/ops', roles: ['SUPER_ADMIN'] },
  { path: '/admin/verification', roles: ['SUPER_ADMIN'] },
] as const;

export const unauthenticatedApiBoundaries: QaApiBoundary[] = [
  { method: 'GET', path: '/api/v1/auth/me' },
  { method: 'GET', path: '/api/v1/job-shifts' },
  { method: 'GET', path: '/api/v1/job-shifts/billing/summary' },
  { method: 'GET', path: '/api/v1/job-shifts/dossier-overview' },
  { method: 'GET', path: '/api/v1/matches/hospital-offers' },
  { method: 'GET', path: '/api/v1/matches/visible-job-shifts' },
  { method: 'GET', path: '/api/v1/nurse-profile/me/dashboard' },
  { method: 'GET', path: '/api/v1/nurse-profile/verification/admin/NUR-AB12CD34' },
  { method: 'GET', path: '/api/v1/admin/audit-logs' },
  { method: 'GET', path: '/api/v1/admin/metrics' },
  { method: 'GET', path: '/api/v1/admin/payroll-export' },
];

export const nurseForbiddenApiPaths = [
  '/api/v1/job-shifts',
  '/api/v1/job-shifts/billing/summary',
  '/api/v1/job-shifts/dossier-overview',
  '/api/v1/matches/hospital-offers',
  '/api/v1/admin/audit-logs',
  '/api/v1/admin/payroll-export',
  '/api/v1/nurse-profile/verification/admin/NUR-AB12CD34',
] as const;

export const hospitalForbiddenApiPaths = [
  '/api/v1/matches/visible-job-shifts',
  '/api/v1/nurse-profile/me/dashboard',
  '/api/v1/nurse-profile/me/verification',
] as const;

export const superadminOnlyApiPaths = [
  '/api/v1/job-shifts/async-failures',
  '/api/v1/admin/audit-logs',
  '/api/v1/admin/metrics',
  '/api/v1/nurse-profile/verification/admin/NUR-AB12CD34',
] as const;

export const hospitalAdminOnlyApiPaths = [
  '/api/v1/admin/payroll-export',
] as const;

export const browserRegressionScenarios: QaRegressionScenario[] = [
  {
    id: 'nurse-activation-to-offer',
    title: 'Nurse activation, availability, matching, and offer response',
    ownerRole: 'NURSE',
    entryRoutes: ['/nurse', '/nurse/profile', '/nurse/availability', '/nurse/jobs', '/nurse/matches', '/nurse/contracts', '/onboarding'],
    seededRecords: [
      'released nurse profile with healthcare documents approved',
      'future availability block that fits one open shift',
      'visible open hospital shift with specialization requirements',
      'pending offer and one signed contract for contract tab regression',
    ],
    apiBoundaries: [
      { method: 'GET', path: '/api/v1/nurse-profile/me/dashboard' },
      { method: 'GET', path: '/api/v1/matches/visible-job-shifts' },
      { method: 'GET', path: '/api/v1/matches/me' },
      { method: 'GET', path: '/api/v1/nurse-profile/me/verification' },
    ],
    browserAssertions: [
      'dashboard shows activation progress and latest operational status',
      'availability edits preserve booked-block guardrails',
      'job and match pages show direct next actions without raw ids',
      'contract page exposes signature, PDF, invoice, and terminal-state context',
    ],
  },
  {
    id: 'hospital-shift-to-billing-ops',
    title: 'Hospital shift import, offers, dossier, contracts, and billing operations',
    ownerRole: 'HOSPITAL_ADMIN',
    entryRoutes: ['/hospital', '/hospital/shifts', '/hospital/offers', '/hospital/dossier', '/hospital/contracts', '/hospital/billing', '/onboarding'],
    seededRecords: [
      'hospital profile with billing address and onboarding complete',
      'open shift, pending-offer shift, signed-offer shift, and import-blocked shift',
      'released nurse dossier with verified documents visible to the hospital',
      'contract lifecycle rows covering pending signature, fully executed, voided, and paid-invoice blockers',
      'draft, pending, overdue, paid, and canceled platform invoices',
      'bounded HR/payroll export rows for signed contracts with no platform payroll or payout ownership',
    ],
    apiBoundaries: [
      { method: 'GET', path: '/api/v1/job-shifts' },
      { method: 'GET', path: '/api/v1/matches/hospital-offers' },
      { method: 'GET', path: '/api/v1/job-shifts/dossier-overview' },
      { method: 'GET', path: '/api/v1/job-shifts/billing/summary' },
      { method: 'GET', path: '/api/v1/admin/payroll-export' },
    ],
    browserAssertions: [
      'dashboard hotspots route to the first actionable blocked entity',
      'offer list supports direct accept and decline decisions with lifecycle context',
      'dossier view separates released verified evidence from restricted material',
      'contract and billing pages surface void, invoice, PDF, billing export, and HR handoff states',
      'HR/payroll export controls stay framed as a clinical-system handoff, not platform payroll',
    ],
  },
  {
    id: 'superadmin-control-plane',
    title: 'Superadmin verification, audit, async failure, and intervention control plane',
    ownerRole: 'SUPER_ADMIN',
    entryRoutes: ['/admin/verification', '/admin/ops', '/hospital', '/hospital/contracts', '/hospital/billing'],
    seededRecords: [
      'nurse profile with pending, approved, and rejected verification documents',
      'failed billing, webhook, and WhatsApp async processes with retry counts',
      'undelivered webhook event with last error and delivery attempts',
      'audit log entries for release, destructive action, retry, and contract intervention',
      'contract requiring manual governance around billing conflict or void blocker',
    ],
    apiBoundaries: [
      { method: 'GET', path: '/api/v1/admin/metrics' },
      { method: 'GET', path: '/api/v1/admin/audit-logs' },
      { method: 'GET', path: '/api/v1/job-shifts/async-failures' },
      { method: 'GET', path: '/api/v1/nurse-profile/verification/admin/NUR-AB12CD34' },
    ],
    browserAssertions: [
      'verification review, release, and rejection controls remain visible and permissioned',
      'ops control plane ranks billing and webhook failures ahead of lower-severity queues',
      'retry and resolve-style actions preserve confirmations and status feedback',
      'audit and metrics surfaces provide enough context for operator follow-up',
    ],
  },
];

export function getScenarioForRoute(path: string) {
  return browserRegressionScenarios.find((scenario) => scenario.entryRoutes.includes(path));
}
