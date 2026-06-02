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

export type BrowserQaNextExecutionBatch = BrowserQaExecutionBatch & {
  summary: BrowserQaRunSummary;
};

export type BrowserQaRunStatus = 'pending' | 'passed' | 'failed' | 'blocked';

export type BrowserQaRunResult = {
  itemId: string;
  status: Exclude<BrowserQaRunStatus, 'pending'>;
  note?: string;
  checkedAt?: string;
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

export function getOpenBrowserQaChecklistItems(items = buildBrowserQaChecklist(), results: BrowserQaRunResult[] = []): BrowserQaChecklistItem[] {
  const resultByItemId = latestResultByItemId(results);
  return items.filter((item) => resultByItemId.get(item.id)?.status !== 'passed');
}

export function auditBrowserQaRunResults(items = buildBrowserQaChecklist(), results: BrowserQaRunResult[] = []): BrowserQaRunAudit {
  const knownItemIds = new Set(items.map((item) => item.id));
  const seenItemIds = new Set<string>();
  const duplicateItemIds = new Set<string>();
  const unknownItemIds = new Set<string>();

  for (const result of results) {
    if (!knownItemIds.has(result.itemId)) {
      unknownItemIds.add(result.itemId);
      continue;
    }

    if (seenItemIds.has(result.itemId)) {
      duplicateItemIds.add(result.itemId);
    }

    seenItemIds.add(result.itemId);
  }

  return {
    unknownItemIds: [...unknownItemIds].sort(),
    duplicateItemIds: [...duplicateItemIds].sort(),
  };
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
  const batches = buildBrowserQaExecutionBatches(items);
  const nextBatch = getNextBrowserQaExecutionBatch(items);
  const lines = [
    '# Phase 7 Browser QA Execution Plan',
    '',
    `Batches: ${batches.length}`,
    `Items: ${items.length}`,
    `Next batch: ${nextBatch?.id ?? 'none'}`,
    '',
  ];

  for (const batch of batches) {
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

  if (report.audit.duplicateItemIds.length > 0 || report.audit.unknownItemIds.length > 0) {
    lines.push(
      '## Result data audit',
      '',
      `- Duplicate item ids: ${report.audit.duplicateItemIds.length > 0 ? report.audit.duplicateItemIds.join(', ') : 'none'}`,
      `- Unknown item ids: ${report.audit.unknownItemIds.length > 0 ? report.audit.unknownItemIds.join(', ') : 'none'}`,
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
      `- [${item.status}] ${item.id} (${item.ownerRole}, ${item.route}, ${item.viewport})${formatOptionalNote(item.result)}`,
    );
  }

  return lines.join('\n').trimEnd();
}
