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

function buildChecklistId(scenarioId: string, checkpoint: QaVisualCheckpoint, viewport: QaViewport): string {
  const routeSlug = checkpoint.route.replace(/^\//, '').replace(/\//g, '-') || 'home';
  return `${scenarioId}:${routeSlug}:${viewport}`;
}

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

export function summarizeBrowserQaRun(items = buildBrowserQaChecklist(), results: BrowserQaRunResult[] = []): BrowserQaRunSummary {
  const resultByItemId = new Map(results.map((result) => [result.itemId, result]));
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

export function getOpenBrowserQaChecklistItems(items = buildBrowserQaChecklist(), results: BrowserQaRunResult[] = []): BrowserQaChecklistItem[] {
  const resultByItemId = new Map(results.map((result) => [result.itemId, result]));
  return items.filter((item) => resultByItemId.get(item.id)?.status !== 'passed');
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
