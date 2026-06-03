import { browserRegressionScenarios, type QaRegressionScenario, type QaVisualCheckpoint, type QaViewport } from './regression-scenarios';

export type BrowserQaChecklistItem = {
  id: string;
  scenarioId: string;
  title: string;
  ownerRole: QaRegressionScenario['ownerRole'];
  route: string;
  viewport: QaViewport;
  seededRecords: string[];
  criticalRegions: string[];
  expectedSignals: string[];
  browserAssertions: string[];
};

export type BrowserQaChecklistSummary = {
  itemCount: number;
  roles: QaRegressionScenario['ownerRole'][];
  routes: string[];
  viewports: QaViewport[];
};

export type BrowserQaChecklistDocument = {
  summary: BrowserQaChecklistSummary;
  items: BrowserQaChecklistItem[];
};

export type BrowserQaExecutionBatch = {
  id: string;
  ownerRole: QaRegressionScenario['ownerRole'];
  viewport: QaViewport;
  items: BrowserQaChecklistItem[];
};

export type BrowserQaExecutionBatchSummary = {
  id: string;
  ownerRole: QaRegressionScenario['ownerRole'];
  viewport: QaViewport;
  summary: BrowserQaRunSummary;
};

export type BrowserQaExecutionPlan = {
  batchCount: number;
  itemCount: number;
  nextBatchId: string | null;
  batches: BrowserQaExecutionBatch[];
};

export type BrowserQaNextExecutionBatch = BrowserQaExecutionBatch & {
  summary: BrowserQaRunSummary;
};

export type BrowserQaRunStatus = 'pending' | 'passed' | 'failed' | 'blocked';

export type BrowserQaRunResult = {
  itemId: string;
  status: Exclude<BrowserQaRunStatus, 'pending'>;
  batchId?: string;
  note?: string;
  checkedAt?: string;
};

export type BrowserQaResultTemplateItem = Pick<
  BrowserQaChecklistItem,
  'id' | 'ownerRole' | 'route' | 'viewport' | 'title' | 'seededRecords' | 'criticalRegions' | 'expectedSignals' | 'browserAssertions'
> & {
  status: null;
  checkedAt: string;
  note: string;
  previousResult?: BrowserQaRunResult;
};

export type BrowserQaResultTemplate = {
  batchId: string | null;
  ownerRole: QaRegressionScenario['ownerRole'] | null;
  viewport: QaViewport | null;
  statusOptions: BrowserQaRunResult['status'][];
  itemCount: number;
  items: BrowserQaResultTemplateItem[];
};

export type BrowserQaRunSummary = {
  total: number;
  pending: number;
  passed: number;
  failed: number;
  blocked: number;
  complete: boolean;
  needsAttention: boolean;
};

export type BrowserQaRunAudit = {
  unknownItemIds: string[];
  duplicateItemIds: string[];
  batchMismatches: string[];
};

export type BrowserQaRunValidation = {
  valid: boolean;
  resultCount: number;
  audit: BrowserQaRunAudit;
  warnings: string[];
};

export type BrowserQaOpenItem = BrowserQaChecklistItem & {
  status: BrowserQaRunStatus;
  result?: BrowserQaRunResult;
};

export type BrowserQaRunReport = {
  summary: BrowserQaRunSummary;
  batchSummaries: BrowserQaExecutionBatchSummary[];
  nextBatchId: string | null;
  audit: BrowserQaRunAudit;
  openItems: BrowserQaOpenItem[];
};

const browserQaResultStatuses = new Set<BrowserQaRunResult['status']>(['passed', 'failed', 'blocked']);

function buildChecklistId(scenarioId: string, checkpoint: QaVisualCheckpoint, viewport: QaViewport): string {
  const routeSlug = checkpoint.route.replace(/^\//, '').replace(/\//g, '-') || 'home';
  return `${scenarioId}:${routeSlug}:${viewport}`;
}

function latestResultByItemId(results: BrowserQaRunResult[]): Map<string, BrowserQaRunResult> {
  return new Map(results.map((result) => [result.itemId, result]));
}

function formatOptionalNote(result?: BrowserQaRunResult): string {
  if (!result?.note) {
    return '';
  }

  return ` - ${result.note}`;
}

function formatResultProvenance(result?: BrowserQaRunResult): string {
  const provenance = [
    result?.batchId ? `batch ${result.batchId}` : null,
    result?.checkedAt ? `checked ${result.checkedAt}` : null,
  ].filter(Boolean);

  return provenance.length > 0 ? ` (${provenance.join(', ')})` : '';
}

const roleExecutionOrder: QaRegressionScenario['ownerRole'][] = ['NURSE', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'];
const viewportExecutionOrder: QaViewport[] = ['desktop', 'mobile'];

export function buildBrowserQaChecklist(scenarios = browserRegressionScenarios): BrowserQaChecklistItem[] {
  return scenarios.flatMap((scenario) =>
    scenario.visualCheckpoints.flatMap((checkpoint) =>
      checkpoint.viewports.map((viewport) => ({
        id: buildChecklistId(scenario.id, checkpoint, viewport),
        scenarioId: scenario.id,
        title: scenario.title,
        ownerRole: scenario.ownerRole,
        route: checkpoint.route,
        viewport,
        seededRecords: scenario.seededRecords,
        criticalRegions: checkpoint.criticalRegions,
        expectedSignals: checkpoint.expectedSignals,
        browserAssertions: scenario.browserAssertions,
      })),
    ),
  );
}

export function getBrowserQaChecklistForRoute(route: string, scenarios = browserRegressionScenarios): BrowserQaChecklistItem[] {
  return buildBrowserQaChecklist(scenarios).filter((item) => item.route === route);
}

export function summarizeBrowserQaChecklist(items = buildBrowserQaChecklist()): BrowserQaChecklistSummary {
  return {
    itemCount: items.length,
    roles: [...new Set(items.map((item) => item.ownerRole))].sort(),
    routes: [...new Set(items.map((item) => item.route))].sort(),
    viewports: [...new Set(items.map((item) => item.viewport))].sort(),
  };
}

export function buildBrowserQaChecklistDocument(items = buildBrowserQaChecklist()): BrowserQaChecklistDocument {
  return {
    summary: summarizeBrowserQaChecklist(items),
    items,
  };
}

export function buildBrowserQaExecutionBatches(items = buildBrowserQaChecklist()): BrowserQaExecutionBatch[] {
  return roleExecutionOrder.flatMap((ownerRole) =>
    viewportExecutionOrder.flatMap((viewport) => {
      const batchItems = items.filter((item) => item.ownerRole === ownerRole && item.viewport === viewport);
      if (batchItems.length === 0) {
        return [];
      }

      return [{
        id: `${ownerRole.toLowerCase()}:${viewport}`,
        ownerRole,
        viewport,
        items: batchItems,
      }];
    }),
  );
}

export function summarizeBrowserQaRun(items = buildBrowserQaChecklist(), results: BrowserQaRunResult[] = []): BrowserQaRunSummary {
  const resultByItemId = latestResultByItemId(results);
  const counts = items.reduce(
    (summary, item) => {
      const status = resultByItemId.get(item.id)?.status ?? 'pending';
      summary[status] += 1;
      return summary;
    },
    { pending: 0, passed: 0, failed: 0, blocked: 0 } as Record<BrowserQaRunStatus, number>,
  );

  return {
    total: items.length,
    pending: counts.pending,
    passed: counts.passed,
    failed: counts.failed,
    blocked: counts.blocked,
    complete: counts.pending === 0,
    needsAttention: counts.failed > 0 || counts.blocked > 0,
  };
}

export function summarizeBrowserQaExecutionBatches(
  items = buildBrowserQaChecklist(),
  results: BrowserQaRunResult[] = [],
): BrowserQaExecutionBatchSummary[] {
  return buildBrowserQaExecutionBatches(items).map((batch) => ({
    id: batch.id,
    ownerRole: batch.ownerRole,
    viewport: batch.viewport,
    summary: summarizeBrowserQaRun(batch.items, results),
  }));
}

export function getNextBrowserQaExecutionBatch(
  items = buildBrowserQaChecklist(),
  results: BrowserQaRunResult[] = [],
): BrowserQaNextExecutionBatch | null {
  const batches = buildBrowserQaExecutionBatches(items);

  for (const batch of batches) {
    const summary = summarizeBrowserQaRun(batch.items, results);
    if (!summary.complete || summary.needsAttention) {
      return {
        ...batch,
        summary,
      };
    }
  }

  return null;
}

export function buildBrowserQaExecutionPlan(items = buildBrowserQaChecklist()): BrowserQaExecutionPlan {
  const batches = buildBrowserQaExecutionBatches(items);
  return {
    batchCount: batches.length,
    itemCount: items.length,
    nextBatchId: getNextBrowserQaExecutionBatch(items)?.id ?? null,
    batches,
  };
}

export function buildBrowserQaResultTemplate(
  items = buildBrowserQaChecklist(),
  results: BrowserQaRunResult[] = [],
): BrowserQaResultTemplate {
  const nextBatch = getNextBrowserQaExecutionBatch(items, results);
  const resultByItemId = latestResultByItemId(results);
  return {
    batchId: nextBatch?.id ?? null,
    ownerRole: nextBatch?.ownerRole ?? null,
    viewport: nextBatch?.viewport ?? null,
    statusOptions: ['passed', 'failed', 'blocked'],
    itemCount: nextBatch?.items.length ?? 0,
    items: nextBatch?.items.map((item) => ({
      id: item.id,
      ownerRole: item.ownerRole,
      route: item.route,
      viewport: item.viewport,
      title: item.title,
      seededRecords: item.seededRecords,
      criticalRegions: item.criticalRegions,
      expectedSignals: item.expectedSignals,
      browserAssertions: item.browserAssertions,
      status: null,
      checkedAt: '',
      note: '',
      ...(resultByItemId.has(item.id) ? { previousResult: resultByItemId.get(item.id)! } : {}),
    })) ?? [],
  };
}

export function getOpenBrowserQaChecklistItems(items = buildBrowserQaChecklist(), results: BrowserQaRunResult[] = []): BrowserQaChecklistItem[] {
  const resultByItemId = latestResultByItemId(results);
  return items.filter((item) => resultByItemId.get(item.id)?.status !== 'passed');
}

export function auditBrowserQaRunResults(items = buildBrowserQaChecklist(), results: BrowserQaRunResult[] = []): BrowserQaRunAudit {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const seenItemIds = new Set<string>();
  const duplicateItemIds = new Set<string>();
  const unknownItemIds = new Set<string>();
  const batchMismatches = new Set<string>();

  for (const result of results) {
    const item = itemById.get(result.itemId);
    if (!item) {
      unknownItemIds.add(result.itemId);
      continue;
    }

    const expectedBatchId = `${item.ownerRole.toLowerCase()}:${item.viewport}`;
    if (result.batchId && result.batchId !== expectedBatchId) {
      batchMismatches.add(`${result.itemId} expected ${expectedBatchId} but got ${result.batchId}`);
    }

    if (seenItemIds.has(result.itemId)) {
      duplicateItemIds.add(result.itemId);
    }

    seenItemIds.add(result.itemId);
  }

  return {
    unknownItemIds: [...unknownItemIds].sort(),
    duplicateItemIds: [...duplicateItemIds].sort(),
    batchMismatches: [...batchMismatches].sort(),
  };
}

export function validateBrowserQaRunResults(items = buildBrowserQaChecklist(), results: BrowserQaRunResult[] = []): BrowserQaRunValidation {
  const audit = auditBrowserQaRunResults(items, results);
  const warnings = [
    audit.unknownItemIds.length > 0 ? `Unknown item ids: ${audit.unknownItemIds.join(', ')}` : null,
    audit.duplicateItemIds.length > 0 ? `Duplicate item ids: ${audit.duplicateItemIds.join(', ')}` : null,
    audit.batchMismatches.length > 0 ? `Batch mismatches: ${audit.batchMismatches.join('; ')}` : null,
  ].filter((warning): warning is string => Boolean(warning));

  return {
    valid: warnings.length === 0,
    resultCount: results.length,
    audit,
    warnings,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidCheckedAt(value: string): boolean {
  return value.length > 0 && !Number.isNaN(Date.parse(value));
}

function buildBrowserQaResultDefaults(
  value: Record<string, unknown>,
  inheritedDefaults: Pick<BrowserQaRunResult, 'batchId' | 'checkedAt'> = {},
): Pick<BrowserQaRunResult, 'batchId' | 'checkedAt'> {
  if (value.batchId !== undefined && (typeof value.batchId !== 'string' || value.batchId.length === 0)) {
    throw new Error('Browser QA result wrapper batchId must be a non-empty string when provided.');
  }

  if (value.checkedAt !== undefined && (typeof value.checkedAt !== 'string' || !isValidCheckedAt(value.checkedAt))) {
    throw new Error('Browser QA result wrapper checkedAt must be a valid date string when provided.');
  }

  return {
    ...inheritedDefaults,
    ...(value.batchId ? { batchId: value.batchId as string } : {}),
    ...(value.checkedAt ? { checkedAt: value.checkedAt as string } : {}),
  };
}

function parseBrowserQaRunResult(
  value: unknown,
  index: number,
  defaults: Pick<BrowserQaRunResult, 'batchId' | 'checkedAt'> = {},
): BrowserQaRunResult {
  if (!isRecord(value)) {
    throw new Error(`Browser QA result at index ${index} must be an object.`);
  }

  if (typeof value.itemId !== 'string' || value.itemId.length === 0) {
    throw new Error(`Browser QA result at index ${index} must include a non-empty itemId.`);
  }

  if (typeof value.status !== 'string' || !browserQaResultStatuses.has(value.status as BrowserQaRunResult['status'])) {
    throw new Error(`Browser QA result at index ${index} must use status passed, failed, or blocked.`);
  }

  const result: BrowserQaRunResult = {
    itemId: value.itemId,
    status: value.status as BrowserQaRunResult['status'],
    ...defaults,
  };

  if (value.batchId !== undefined) {
    if (typeof value.batchId !== 'string' || value.batchId.length === 0) {
      throw new Error(`Browser QA result at index ${index} batchId must be a non-empty string when provided.`);
    }
    result.batchId = value.batchId;
  }

  if (value.note !== undefined) {
    if (typeof value.note !== 'string') {
      throw new Error(`Browser QA result at index ${index} note must be a string when provided.`);
    }
    result.note = value.note;
  }

  if (value.checkedAt !== undefined) {
    if (typeof value.checkedAt !== 'string' || !isValidCheckedAt(value.checkedAt)) {
      throw new Error(`Browser QA result at index ${index} checkedAt must be a valid date string when provided.`);
    }
    result.checkedAt = value.checkedAt;
  }

  return result;
}

function parseBrowserQaTemplateResult(
  value: unknown,
  index: number,
  defaults: Pick<BrowserQaRunResult, 'batchId' | 'checkedAt'> = {},
): BrowserQaRunResult | null {
  if (!isRecord(value)) {
    throw new Error(`Browser QA template item at index ${index} must be an object.`);
  }

  if (typeof value.id !== 'string' || value.id.length === 0) {
    throw new Error(`Browser QA template item at index ${index} must include a non-empty id.`);
  }

  if (value.status === null) {
    return null;
  }

  if (typeof value.status !== 'string' || !browserQaResultStatuses.has(value.status as BrowserQaRunResult['status'])) {
    throw new Error(`Browser QA template item at index ${index} must use status passed, failed, blocked, or null.`);
  }

  const result: BrowserQaRunResult = {
    itemId: value.id,
    status: value.status as BrowserQaRunResult['status'],
    ...defaults,
  };

  if (value.note !== undefined && value.note !== '') {
    if (typeof value.note !== 'string') {
      throw new Error(`Browser QA template item at index ${index} note must be a string when provided.`);
    }
    result.note = value.note;
  }

  if (value.batchId !== undefined) {
    if (typeof value.batchId !== 'string' || value.batchId.length === 0) {
      throw new Error(`Browser QA template item at index ${index} batchId must be a non-empty string when provided.`);
    }
    result.batchId = value.batchId;
  }

  if (value.checkedAt !== undefined && value.checkedAt !== null && value.checkedAt !== '') {
    if (typeof value.checkedAt !== 'string' || !isValidCheckedAt(value.checkedAt)) {
      throw new Error(`Browser QA template item at index ${index} checkedAt must be a valid date string when provided.`);
    }
    result.checkedAt = value.checkedAt;
  }

  return result;
}

function parseBrowserQaRunResultsWithDefaults(
  value: unknown,
  inheritedDefaults: Pick<BrowserQaRunResult, 'batchId' | 'checkedAt'> = {},
): BrowserQaRunResult[] {
  if (isRecord(value) && Array.isArray(value.artifacts)) {
    const defaults = buildBrowserQaResultDefaults(value, inheritedDefaults);
    return value.artifacts.flatMap((artifact, index) => {
      try {
        return parseBrowserQaRunResultsWithDefaults(artifact, defaults);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Browser QA artifact at index ${index} is invalid: ${message}`);
      }
    });
  }

  if (isRecord(value) && Array.isArray(value.items)) {
    const defaults = buildBrowserQaResultDefaults(value, inheritedDefaults);
    return value.items.flatMap((item, index) => {
      const result = parseBrowserQaTemplateResult(item, index, defaults);
      return result ? [result] : [];
    });
  }

  const defaults = isRecord(value) ? buildBrowserQaResultDefaults(value, inheritedDefaults) : inheritedDefaults;
  const rawResults = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.results)
      ? value.results
      : null;

  if (!rawResults) {
    throw new Error('Browser QA results JSON must be an array, an object with a results array, or a result template object with an items array.');
  }

  return rawResults.map((result, index) => parseBrowserQaRunResult(result, index, defaults));
}

export function parseBrowserQaRunResults(value: unknown): BrowserQaRunResult[] {
  return parseBrowserQaRunResultsWithDefaults(value);
}

export function buildBrowserQaRunReport(items = buildBrowserQaChecklist(), results: BrowserQaRunResult[] = []): BrowserQaRunReport {
  const resultByItemId = latestResultByItemId(results);
  const openItems: BrowserQaOpenItem[] = getOpenBrowserQaChecklistItems(items, results).map((item) => {
    const result = resultByItemId.get(item.id);
    return {
      ...item,
      status: result?.status ?? 'pending',
      ...(result ? { result } : {}),
    };
  });

  return {
    summary: summarizeBrowserQaRun(items, results),
    batchSummaries: summarizeBrowserQaExecutionBatches(items, results),
    nextBatchId: getNextBrowserQaExecutionBatch(items, results)?.id ?? null,
    audit: auditBrowserQaRunResults(items, results),
    openItems,
  };
}

export function renderBrowserQaChecklistMarkdown(items = buildBrowserQaChecklist()): string {
  const summary = summarizeBrowserQaChecklist(items);
  const lines = [
    '# Phase 7 Browser QA Checklist',
    '',
    `Items: ${summary.itemCount}`,
    `Roles: ${summary.roles.join(', ')}`,
    `Routes: ${summary.routes.join(', ')}`,
    `Viewports: ${summary.viewports.join(', ')}`,
    '',
  ];

  for (const item of items) {
    lines.push(
      `## ${item.id}`,
      '',
      `- Role: ${item.ownerRole}`,
      `- Route: ${item.route}`,
      `- Viewport: ${item.viewport}`,
      `- Scenario: ${item.title}`,
      `- Seeded records: ${item.seededRecords.join('; ')}`,
      `- Critical regions: ${item.criticalRegions.join('; ')}`,
      `- Expected signals: ${item.expectedSignals.join('; ')}`,
      `- Browser assertions: ${item.browserAssertions.join('; ')}`,
      '',
    );
  }

  return lines.join('\n').trimEnd();
}

export function renderBrowserQaExecutionPlanMarkdown(items = buildBrowserQaChecklist()): string {
  const plan = buildBrowserQaExecutionPlan(items);
  const lines = [
    '# Phase 7 Browser QA Execution Plan',
    '',
    `Batches: ${plan.batchCount}`,
    `Items: ${plan.itemCount}`,
    `Next batch: ${plan.nextBatchId ?? 'none'}`,
    '',
  ];

  for (const batch of plan.batches) {
    lines.push(
      `## ${batch.id}`,
      '',
      `- Role: ${batch.ownerRole}`,
      `- Viewport: ${batch.viewport}`,
      `- Items: ${batch.items.length}`,
      `- Routes: ${[...new Set(batch.items.map((item) => item.route))].join(', ')}`,
      '',
    );

    for (const item of batch.items) {
      lines.push(`- ${item.id}: ${item.criticalRegions.join('; ')}`);
    }

    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

export function renderNextBrowserQaExecutionBatchMarkdown(
  items = buildBrowserQaChecklist(),
  results: BrowserQaRunResult[] = [],
): string {
  const nextBatch = getNextBrowserQaExecutionBatch(items, results);

  if (!nextBatch) {
    return [
      '# Phase 7 Browser QA Next Batch',
      '',
      'Next batch: none',
      'All browser QA batches are complete without attention flags.',
    ].join('\n');
  }

  const lines = [
    '# Phase 7 Browser QA Next Batch',
    '',
    `Batch: ${nextBatch.id}`,
    `Role: ${nextBatch.ownerRole}`,
    `Viewport: ${nextBatch.viewport}`,
    `Items: ${nextBatch.items.length}`,
    `Passed: ${nextBatch.summary.passed}`,
    `Failed: ${nextBatch.summary.failed}`,
    `Blocked: ${nextBatch.summary.blocked}`,
    `Pending: ${nextBatch.summary.pending}`,
    `Needs attention: ${nextBatch.summary.needsAttention ? 'yes' : 'no'}`,
    '',
  ];

  for (const item of nextBatch.items) {
    lines.push(
      `## ${item.id}`,
      '',
      `- Route: ${item.route}`,
      `- Scenario: ${item.title}`,
      `- Seeded records: ${item.seededRecords.join('; ')}`,
      `- Critical regions: ${item.criticalRegions.join('; ')}`,
      `- Expected signals: ${item.expectedSignals.join('; ')}`,
      `- Browser assertions: ${item.browserAssertions.join('; ')}`,
      '',
    );
  }

  return lines.join('\n').trimEnd();
}

export function renderBrowserQaResultTemplateMarkdown(
  items = buildBrowserQaChecklist(),
  results: BrowserQaRunResult[] = [],
): string {
  const template = buildBrowserQaResultTemplate(items, results);

  if (!template.batchId) {
    return [
      '# Phase 7 Browser QA Result Template',
      '',
      'Batch: none',
      'All browser QA batches are complete without attention flags.',
    ].join('\n');
  }

  const lines = [
    '# Phase 7 Browser QA Result Template',
    '',
    `Batch: ${template.batchId}`,
    `Role: ${template.ownerRole ?? 'none'}`,
    `Viewport: ${template.viewport ?? 'none'}`,
    `Status options: ${template.statusOptions.join(', ')}`,
    `Items: ${template.itemCount}`,
    '',
  ];

  for (const item of template.items) {
    lines.push(
      `## ${item.id}`,
      '',
      `- Role: ${item.ownerRole}`,
      `- Route: ${item.route}`,
      `- Viewport: ${item.viewport}`,
      `- Scenario: ${item.title}`,
      `- Seeded records: ${item.seededRecords.join('; ')}`,
      `- Critical regions: ${item.criticalRegions.join('; ')}`,
      `- Expected signals: ${item.expectedSignals.join('; ')}`,
      `- Browser assertions: ${item.browserAssertions.join('; ')}`,
      `- Previous result: ${item.previousResult ? `${item.previousResult.status}${formatResultProvenance(item.previousResult)}${formatOptionalNote(item.previousResult)}` : 'none'}`,
      '- Status: ',
      '- Checked at: ',
      '- Note: ',
      '',
    );
  }

  return lines.join('\n').trimEnd();
}

export function renderBrowserQaRunReportMarkdown(items = buildBrowserQaChecklist(), results: BrowserQaRunResult[] = []): string {
  const report = buildBrowserQaRunReport(items, results);
  const lines = [
    '# Phase 7 Browser QA Run Report',
    '',
    `Total: ${report.summary.total}`,
    `Passed: ${report.summary.passed}`,
    `Failed: ${report.summary.failed}`,
    `Blocked: ${report.summary.blocked}`,
    `Pending: ${report.summary.pending}`,
    `Complete: ${report.summary.complete ? 'yes' : 'no'}`,
    `Needs attention: ${report.summary.needsAttention ? 'yes' : 'no'}`,
    `Next batch: ${report.nextBatchId ?? 'none'}`,
    '',
  ];

  lines.push('## Batch summaries', '');
  for (const batch of report.batchSummaries) {
    lines.push(
      `- ${batch.id}: ${batch.summary.passed}/${batch.summary.total} passed, ${batch.summary.failed} failed, ${batch.summary.blocked} blocked, ${batch.summary.pending} pending, attention ${batch.summary.needsAttention ? 'yes' : 'no'}`,
    );
  }
  lines.push('');

  if (report.audit.duplicateItemIds.length > 0 || report.audit.unknownItemIds.length > 0 || report.audit.batchMismatches.length > 0) {
    lines.push(
      '## Result data audit',
      '',
      `- Duplicate item ids: ${report.audit.duplicateItemIds.length > 0 ? report.audit.duplicateItemIds.join(', ') : 'none'}`,
      `- Unknown item ids: ${report.audit.unknownItemIds.length > 0 ? report.audit.unknownItemIds.join(', ') : 'none'}`,
      `- Batch mismatches: ${report.audit.batchMismatches.length > 0 ? report.audit.batchMismatches.join('; ') : 'none'}`,
      '',
    );
  }

  if (report.openItems.length === 0) {
    lines.push('## Open items', '', 'None.');
    return lines.join('\n').trimEnd();
  }

  lines.push('## Open items', '');

  for (const item of report.openItems) {
    lines.push(
      `- [${item.status}] ${item.id} (${item.ownerRole}, ${item.route}, ${item.viewport})${formatResultProvenance(item.result)}${formatOptionalNote(item.result)}`,
    );
  }

  return lines.join('\n').trimEnd();
}

export function renderBrowserQaRunValidationMarkdown(items = buildBrowserQaChecklist(), results: BrowserQaRunResult[] = []): string {
  const validation = validateBrowserQaRunResults(items, results);
  const lines = [
    '# Phase 7 Browser QA Result Validation',
    '',
    `Valid: ${validation.valid ? 'yes' : 'no'}`,
    `Results: ${validation.resultCount}`,
    `Duplicate item ids: ${validation.audit.duplicateItemIds.length > 0 ? validation.audit.duplicateItemIds.join(', ') : 'none'}`,
    `Unknown item ids: ${validation.audit.unknownItemIds.length > 0 ? validation.audit.unknownItemIds.join(', ') : 'none'}`,
    `Batch mismatches: ${validation.audit.batchMismatches.length > 0 ? validation.audit.batchMismatches.join('; ') : 'none'}`,
  ];

  if (validation.warnings.length === 0) {
    lines.push('', 'Warnings: none');
    return lines.join('\n');
  }

  lines.push('', '## Warnings', '');
  for (const warning of validation.warnings) {
    lines.push(`- ${warning}`);
  }

  return lines.join('\n').trimEnd();
}
