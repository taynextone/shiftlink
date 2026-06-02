import {
  browserRegressionScenarios,
  getScenarioForRoute,
  hospitalForbiddenApiPaths,
  nurseForbiddenApiPaths,
  protectedBrowserRoutes,
  publicBrowserRoutes,
  superadminOnlyApiPaths,
  unauthenticatedApiBoundaries,
} from '../src/qa/regression-scenarios';

describe('phase 7 browser regression scenario manifest', () => {
  it('keeps scenario ids unique and actionable', () => {
    const ids = browserRegressionScenarios.map((scenario) => scenario.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const scenario of browserRegressionScenarios) {
      expect(scenario.title).toContain(' ');
      expect(scenario.entryRoutes.length).toBeGreaterThanOrEqual(2);
      expect(scenario.seededRecords.length).toBeGreaterThanOrEqual(3);
      expect(scenario.apiBoundaries.length).toBeGreaterThanOrEqual(3);
      expect(scenario.browserAssertions.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('assigns every protected product route to a browser regression scenario', () => {
    for (const route of protectedBrowserRoutes) {
      expect(getScenarioForRoute(route.path)).toBeDefined();
    }
  });

  it('keeps public entry points explicit for visual QA', () => {
    expect(publicBrowserRoutes).toEqual(['/', '/login', '/register']);
  });

  it('keeps smoke-test API boundaries represented in scenario coverage', () => {
    const scenarioBoundaries = new Set(
      browserRegressionScenarios.flatMap((scenario) => scenario.apiBoundaries.map((boundary) => `${boundary.method} ${boundary.path}`)),
    );

    for (const boundary of unauthenticatedApiBoundaries) {
      if (boundary.path === '/api/v1/auth/me') {
        continue;
      }
      expect(scenarioBoundaries).toContain(`${boundary.method} ${boundary.path}`);
    }
  });

  it('keeps every scenario backed by actionable visual checkpoints', () => {
    for (const scenario of browserRegressionScenarios) {
      expect(scenario.visualCheckpoints.length).toBeGreaterThanOrEqual(2);
      for (const checkpoint of scenario.visualCheckpoints) {
        expect(scenario.entryRoutes).toContain(checkpoint.route);
        expect(checkpoint.viewports.length).toBeGreaterThan(0);
        expect(checkpoint.criticalRegions.length).toBeGreaterThanOrEqual(2);
        expect(checkpoint.expectedSignals.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('keeps core visual routes covered across desktop and mobile while node QA is blocked', () => {
    const responsiveCheckpointRoutes = new Set(
      browserRegressionScenarios.flatMap((scenario) =>
        scenario.visualCheckpoints
          .filter((checkpoint) => checkpoint.viewports.includes('desktop') && checkpoint.viewports.includes('mobile'))
          .map((checkpoint) => checkpoint.route),
      ),
    );

    for (const route of ['/nurse', '/nurse/contracts', '/hospital', '/hospital/contracts', '/hospital/billing', '/admin/verification', '/admin/ops']) {
      expect(responsiveCheckpointRoutes).toContain(route);
    }
  });

  it('keeps role-forbidden boundary groups non-empty and disjoint by actor intent', () => {
    expect(nurseForbiddenApiPaths.length).toBeGreaterThan(0);
    expect(hospitalForbiddenApiPaths.length).toBeGreaterThan(0);
    expect(superadminOnlyApiPaths.length).toBeGreaterThan(0);

    const hospitalOnlySet = new Set(hospitalForbiddenApiPaths);
    for (const path of nurseForbiddenApiPaths) {
      expect(hospitalOnlySet.has(path)).toBe(false);
    }
  });
});
