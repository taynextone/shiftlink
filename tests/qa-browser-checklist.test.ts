import {
  buildBrowserQaChecklist,
  getBrowserQaChecklistForRoute,
  renderBrowserQaChecklistMarkdown,
  summarizeBrowserQaChecklist,
} from '../src/qa/browser-checklist';
import { browserRegressionScenarios } from '../src/qa/regression-scenarios';

describe('phase 7 browser QA checklist builder', () => {
  it('expands visual checkpoints into per-viewport checklist items', () => {
    const checklist = buildBrowserQaChecklist();
    const expectedCount = browserRegressionScenarios.reduce(
      (total, scenario) =>
        total + scenario.visualCheckpoints.reduce((checkpointTotal, checkpoint) => checkpointTotal + checkpoint.viewports.length, 0),
      0,
    );

    expect(checklist).toHaveLength(expectedCount);
    expect(checklist.length).toBeGreaterThanOrEqual(15);
  });

  it('keeps checklist ids unique and route-stable', () => {
    const checklist = buildBrowserQaChecklist();
    const ids = checklist.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('hospital-shift-to-billing-ops:hospital-billing:desktop');
    expect(ids).toContain('hospital-shift-to-billing-ops:hospital-billing:mobile');
  });

  it('carries scenario setup and visual expectations into each checklist item', () => {
    const [item] = getBrowserQaChecklistForRoute('/admin/ops');

    expect(item).toEqual(
      expect.objectContaining({
        ownerRole: 'SUPER_ADMIN',
        route: '/admin/ops',
        scenarioId: 'superadmin-control-plane',
      }),
    );
    expect(item.seededRecords.length).toBeGreaterThanOrEqual(3);
    expect(item.criticalRegions).toContain('async failure queue');
    expect(item.expectedSignals.join(' ')).toContain('highest severity queue');
    expect(item.browserAssertions.length).toBeGreaterThanOrEqual(3);
  });

  it('filters checklist entries by route across all required viewports', () => {
    const billingItems = getBrowserQaChecklistForRoute('/hospital/billing');

    expect(billingItems.map((item) => item.viewport).sort()).toEqual(['desktop', 'mobile']);
    expect(billingItems.every((item) => item.route === '/hospital/billing')).toBe(true);
  });

  it('summarizes checklist role, route, and viewport coverage', () => {
    const summary = summarizeBrowserQaChecklist();

    expect(summary.itemCount).toBe(buildBrowserQaChecklist().length);
    expect(summary.roles).toEqual(['HOSPITAL_ADMIN', 'NURSE', 'SUPER_ADMIN']);
    expect(summary.viewports).toEqual(['desktop', 'mobile']);
    expect(summary.routes).toContain('/admin/ops');
    expect(summary.routes).toContain('/hospital/billing');
    expect(summary.routes).toContain('/nurse/contracts');
  });

  it('renders a stable markdown runlist for later browser execution', () => {
    const markdown = renderBrowserQaChecklistMarkdown();

    expect(markdown).toContain('# Phase 7 Browser QA Checklist');
    expect(markdown).toContain('Items: 17');
    expect(markdown).toContain('## hospital-shift-to-billing-ops:hospital-billing:desktop');
    expect(markdown).toContain('- Critical regions: billing summary; invoice detail; HR/payroll handoff');
    expect(markdown).toContain('- Expected signals: pending rows are prioritized; HR handoff is not described as Shiftlink payroll');
  });
});
