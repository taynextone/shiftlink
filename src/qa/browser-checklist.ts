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
