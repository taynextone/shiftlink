import {
  auditBrowserQaRunResults,
  buildBrowserQaChecklist,
  buildBrowserQaChecklistDocument,
  buildBrowserQaExecutionBatches,
  buildBrowserQaExecutionPlan,
  buildBrowserQaResultTemplate,
  buildBrowserQaRunReport,
  getBrowserQaChecklistForRoute,
  getNextBrowserQaExecutionBatch,
  getOpenBrowserQaChecklistItems,
  parseBrowserQaRunResults,
  renderBrowserQaChecklistMarkdown,
  renderBrowserQaExecutionPlanMarkdown,
  renderBrowserQaResultTemplateMarkdown,
  renderBrowserQaRunReportMarkdown,
  renderBrowserQaRunValidationMarkdown,
  renderNextBrowserQaExecutionBatchMarkdown,
  summarizeBrowserQaChecklist,
  summarizeBrowserQaExecutionBatches,
  summarizeBrowserQaRun,
  validateBrowserQaRunResults,
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

  it('builds a structured browser QA checklist document for automation handoff', () => {
    const document = buildBrowserQaChecklistDocument();

    expect(document.summary).toEqual(summarizeBrowserQaChecklist(document.items));
    expect(document.summary.itemCount).toBe(17);
    expect(document.items[0]).toEqual(
      expect.objectContaining({
        id: 'nurse-activation-to-offer:nurse:desktop',
        ownerRole: 'NURSE',
        route: '/nurse',
        viewport: 'desktop',
      }),
    );
    expect(document.items.some((item) => item.id === 'superadmin-control-plane:admin-ops:mobile')).toBe(true);
  });

  it('renders a stable markdown runlist for later browser execution', () => {
    const markdown = renderBrowserQaChecklistMarkdown();

    expect(markdown).toContain('# Phase 7 Browser QA Checklist');
    expect(markdown).toContain('Items: 17');
    expect(markdown).toContain('## hospital-shift-to-billing-ops:hospital-billing:desktop');
    expect(markdown).toContain('- Critical regions: billing summary; invoice detail; HR/payroll handoff');
    expect(markdown).toContain('- Expected signals: pending rows are prioritized; HR handoff is not described as Shiftlink payroll');
  });

  it('groups browser QA execution into stable role and viewport batches', () => {
    const batches = buildBrowserQaExecutionBatches();

    expect(batches.map((batch) => batch.id)).toEqual([
      'nurse:desktop',
      'nurse:mobile',
      'hospital_admin:desktop',
      'hospital_admin:mobile',
      'super_admin:desktop',
      'super_admin:mobile',
    ]);
    expect(batches.find((batch) => batch.id === 'hospital_admin:mobile')?.items.map((item) => item.route)).toEqual([
      '/hospital',
      '/hospital/contracts',
      '/hospital/billing',
    ]);
  });

  it('keeps execution batches lossless against the full checklist', () => {
    const checklist = buildBrowserQaChecklist();
    const batchedItems = buildBrowserQaExecutionBatches(checklist).flatMap((batch) => batch.items);

    expect(batchedItems).toHaveLength(checklist.length);
    expect(new Set(batchedItems.map((item) => item.id))).toEqual(new Set(checklist.map((item) => item.id)));
  });

  it('renders browser QA execution batches as a stable markdown plan', () => {
    const markdown = renderBrowserQaExecutionPlanMarkdown();

    expect(markdown).toContain('# Phase 7 Browser QA Execution Plan');
    expect(markdown).toContain('Batches: 6');
    expect(markdown).toContain('Items: 17');
    expect(markdown).toContain('Next batch: nurse:desktop');
    expect(markdown).toContain('## hospital_admin:desktop');
    expect(markdown).toContain('- Role: HOSPITAL_ADMIN');
    expect(markdown).toContain('- Viewport: desktop');
    expect(markdown).toContain('- Status: 0/3 passed, 0 failed, 0 blocked, 3 pending, attention no');
    expect(markdown).toContain('- Routes: /hospital, /hospital/contracts, /hospital/billing');
    expect(markdown).toContain('- hospital-shift-to-billing-ops:hospital-billing:desktop: billing summary; invoice detail; HR/payroll handoff');
  });

  it('builds a structured browser QA execution plan for automation handoff', () => {
    const plan = buildBrowserQaExecutionPlan();

    expect(plan.batchCount).toBe(6);
    expect(plan.itemCount).toBe(17);
    expect(plan.nextBatchId).toBe('nurse:desktop');
    expect(plan.batchSummaries).toHaveLength(6);
    expect(plan.batches.map((batch) => batch.id)).toEqual([
      'nurse:desktop',
      'nurse:mobile',
      'hospital_admin:desktop',
      'hospital_admin:mobile',
      'super_admin:desktop',
      'super_admin:mobile',
    ]);
    expect(plan.batches.find((batch) => batch.id === 'super_admin:mobile')?.items.map((item) => item.route)).toEqual([
      '/admin/verification',
      '/admin/ops',
    ]);
  });

  it('keeps execution plans resumable with prior browser QA results', () => {
    const checklist = buildBrowserQaChecklist();
    const [nurseDesktop] = buildBrowserQaExecutionBatches(checklist);
    const results = nurseDesktop.items.map((item) => ({ itemId: item.id, status: 'passed' as const }));
    const plan = buildBrowserQaExecutionPlan(checklist, results);
    const markdown = renderBrowserQaExecutionPlanMarkdown(checklist, results);

    expect(plan.nextBatchId).toBe('nurse:mobile');
    expect(plan.batchSummaries.find((summary) => summary.id === 'nurse:desktop')?.summary).toEqual({
      total: nurseDesktop.items.length,
      pending: 0,
      passed: nurseDesktop.items.length,
      failed: 0,
      blocked: 0,
      complete: true,
      needsAttention: false,
    });
    expect(markdown).toContain('Next batch: nurse:mobile');
    expect(markdown).toContain(`- Status: ${nurseDesktop.items.length}/${nurseDesktop.items.length} passed, 0 failed, 0 blocked, 0 pending, attention no`);
  });

  it('summarizes browser QA execution status per role and viewport batch', () => {
    const checklist = buildBrowserQaChecklist();
    const batches = buildBrowserQaExecutionBatches(checklist);
    const [nurseDesktop] = batches;
    const hospitalMobile = batches.find((batch) => batch.id === 'hospital_admin:mobile')!;
    const summaries = summarizeBrowserQaExecutionBatches(checklist, [
      ...nurseDesktop.items.map((item) => ({ itemId: item.id, status: 'passed' as const })),
      { itemId: hospitalMobile.items[0].id, status: 'failed' as const, note: 'Dashboard hotspot overflow' },
    ]);

    expect(summaries.find((summary) => summary.id === 'nurse:desktop')?.summary).toEqual({
      total: nurseDesktop.items.length,
      pending: 0,
      passed: nurseDesktop.items.length,
      failed: 0,
      blocked: 0,
      complete: true,
      needsAttention: false,
    });
    expect(summaries.find((summary) => summary.id === 'hospital_admin:mobile')?.summary).toEqual({
      total: hospitalMobile.items.length,
      pending: hospitalMobile.items.length - 1,
      passed: 0,
      failed: 1,
      blocked: 0,
      complete: false,
      needsAttention: true,
    });
  });

  it('selects the next incomplete browser QA execution batch in stable order', () => {
    const checklist = buildBrowserQaChecklist();
    const batches = buildBrowserQaExecutionBatches(checklist);
    const [nurseDesktop, nurseMobile] = batches;
    const results = nurseDesktop.items.map((item) => ({ itemId: item.id, status: 'passed' as const }));

    expect(getNextBrowserQaExecutionBatch(checklist, results)).toEqual(
      expect.objectContaining({
        id: 'nurse:mobile',
        summary: expect.objectContaining({
          pending: nurseMobile.items.length,
          complete: false,
          needsAttention: false,
        }),
      }),
    );
  });

  it('keeps failed completed batches as the next browser QA attention target', () => {
    const checklist = buildBrowserQaChecklist();
    const [nurseDesktop] = buildBrowserQaExecutionBatches(checklist);
    const failedResults = nurseDesktop.items.map((item, index) => ({
      itemId: item.id,
      status: index === 0 ? 'failed' as const : 'passed' as const,
    }));

    expect(getNextBrowserQaExecutionBatch(checklist, failedResults)).toEqual(
      expect.objectContaining({
        id: 'nurse:desktop',
        summary: expect.objectContaining({
          pending: 0,
          complete: true,
          needsAttention: true,
        }),
      }),
    );
  });

  it('renders the next browser QA execution batch for focused screenshot handoff', () => {
    const checklist = buildBrowserQaChecklist();
    const [nurseDesktop] = buildBrowserQaExecutionBatches(checklist);
    const markdown = renderNextBrowserQaExecutionBatchMarkdown(
      checklist,
      nurseDesktop.items.map((item) => ({ itemId: item.id, status: 'passed' as const })),
    );

    expect(markdown).toContain('# Phase 7 Browser QA Next Batch');
    expect(markdown).toContain('Batch: nurse:mobile');
    expect(markdown).toContain('Role: NURSE');
    expect(markdown).toContain('Viewport: mobile');
    expect(markdown).toContain('Items: 3');
    expect(markdown).toContain('Pending: 3');
    expect(markdown).toContain('## nurse-activation-to-offer:nurse:mobile');
    expect(markdown).toContain('- Critical regions: activation progress; recent contracts; upcoming availability');
    expect(markdown).not.toContain('## nurse-activation-to-offer:nurse:desktop');
  });

  it('renders no next browser QA batch once every item passed', () => {
    const checklist = buildBrowserQaChecklist();
    const markdown = renderNextBrowserQaExecutionBatchMarkdown(
      checklist,
      checklist.map((item) => ({ itemId: item.id, status: 'passed' as const })),
    );

    expect(markdown).toContain('Next batch: none');
    expect(markdown).toContain('All browser QA batches are complete without attention flags.');
  });

  it('builds a fillable result template for the next browser QA batch', () => {
    const checklist = buildBrowserQaChecklist();
    const [nurseDesktop] = buildBrowserQaExecutionBatches(checklist);
    const template = buildBrowserQaResultTemplate(
      checklist,
      nurseDesktop.items.map((item) => ({ itemId: item.id, status: 'passed' as const })),
    );

    expect(template.batchId).toBe('nurse:mobile');
    expect(template.ownerRole).toBe('NURSE');
    expect(template.viewport).toBe('mobile');
    expect(template.statusOptions).toEqual(['passed', 'failed', 'blocked']);
    expect(template.itemCount).toBe(3);
    expect(template.items).toHaveLength(3);
    expect(template.items[0]).toEqual(
      expect.objectContaining({
        id: 'nurse-activation-to-offer:nurse:mobile',
        status: null,
        checkedAt: '',
        note: '',
        route: '/nurse',
        viewport: 'mobile',
      }),
    );
    expect(template.items[0].seededRecords).toContain('released nurse profile with healthcare documents approved');
    expect(template.items[0].criticalRegions).toContain('activation progress');
  });

  it('builds an empty result template once every browser QA batch passed', () => {
    const checklist = buildBrowserQaChecklist();
    const template = buildBrowserQaResultTemplate(
      checklist,
      checklist.map((item) => ({ itemId: item.id, status: 'passed' as const })),
    );

    expect(template).toEqual({
      batchId: null,
      ownerRole: null,
      viewport: null,
      statusOptions: ['passed', 'failed', 'blocked'],
      itemCount: 0,
      items: [],
    });
  });

  it('renders a fillable browser QA result template as markdown', () => {
    const checklist = buildBrowserQaChecklist();
    const [nurseDesktop] = buildBrowserQaExecutionBatches(checklist);
    const markdown = renderBrowserQaResultTemplateMarkdown(
      checklist,
      nurseDesktop.items.map((item) => ({ itemId: item.id, status: 'passed' as const })),
    );

    expect(markdown).toContain('# Phase 7 Browser QA Result Template');
    expect(markdown).toContain('Batch: nurse:mobile');
    expect(markdown).toContain('Role: NURSE');
    expect(markdown).toContain('Viewport: mobile');
    expect(markdown).toContain('Status options: passed, failed, blocked');
    expect(markdown).toContain('Items: 3');
    expect(markdown).toContain('## nurse-activation-to-offer:nurse:mobile');
    expect(markdown).toContain('- Role: NURSE');
    expect(markdown).toContain('- Route: /nurse');
    expect(markdown).toContain('- Viewport: mobile');
    expect(markdown).toContain('- Seeded records: released nurse profile with healthcare documents approved');
    expect(markdown).toContain('- Critical regions: activation progress; recent contracts; upcoming availability');
    expect(markdown).toContain('- Status: ');
    expect(markdown).toContain('- Checked at: ');
    expect(markdown).toContain('- Note: ');
    expect(markdown).not.toContain('## nurse-activation-to-offer:nurse:desktop');
  });

  it('allows empty checked-at placeholders in filled browser QA result templates', () => {
    const checklist = buildBrowserQaChecklist();

    expect(parseBrowserQaRunResults({
      batchId: 'nurse:desktop',
      items: [
        { id: checklist[0].id, status: 'passed', checkedAt: '', note: '' },
        { id: checklist[1].id, status: 'blocked', checkedAt: null, note: 'Screenshot node unavailable' },
        { id: checklist[2].id, status: null, checkedAt: '', note: '' },
      ],
    })).toEqual([
      {
        itemId: checklist[0].id,
        status: 'passed',
        batchId: 'nurse:desktop',
      },
      {
        itemId: checklist[1].id,
        status: 'blocked',
        batchId: 'nurse:desktop',
        note: 'Screenshot node unavailable',
      },
    ]);
  });

  it('carries previous failed or blocked results into attention-target templates', () => {
    const checklist = buildBrowserQaChecklist();
    const [nurseDesktop] = buildBrowserQaExecutionBatches(checklist);
    const previousResults = nurseDesktop.items.map((item, index) => ({
      itemId: item.id,
      status: index === 0 ? 'failed' as const : 'passed' as const,
      note: index === 0 ? 'Desktop contract cards overlap the activation panel' : undefined,
      checkedAt: index === 0 ? '2026-06-03T01:30:00.000Z' : undefined,
    }));
    const template = buildBrowserQaResultTemplate(checklist, previousResults);
    const markdown = renderBrowserQaResultTemplateMarkdown(checklist, previousResults);

    expect(template.batchId).toBe('nurse:desktop');
    expect(template.items[0]).toEqual(
      expect.objectContaining({
        id: nurseDesktop.items[0].id,
        status: null,
        note: '',
        previousResult: {
          itemId: nurseDesktop.items[0].id,
          status: 'failed',
          note: 'Desktop contract cards overlap the activation panel',
          checkedAt: '2026-06-03T01:30:00.000Z',
        },
      }),
    );
    expect(template.items[1]).toEqual(
      expect.objectContaining({
        previousResult: {
          itemId: nurseDesktop.items[1].id,
          status: 'passed',
        },
      }),
    );
    expect(markdown).toContain('- Previous result: failed (checked 2026-06-03T01:30:00.000Z) - Desktop contract cards overlap the activation panel');
    expect(markdown).toContain('- Previous result: passed');
  });

  it('renders an empty browser QA result template once every batch passed', () => {
    const checklist = buildBrowserQaChecklist();
    const markdown = renderBrowserQaResultTemplateMarkdown(
      checklist,
      checklist.map((item) => ({ itemId: item.id, status: 'passed' as const })),
    );

    expect(markdown).toContain('Batch: none');
    expect(markdown).toContain('All browser QA batches are complete without attention flags.');
  });

  it('summarizes browser QA run status with pending work by default', () => {
    const checklist = buildBrowserQaChecklist();
    const summary = summarizeBrowserQaRun(checklist, [
      { itemId: checklist[0].id, status: 'passed' },
      { itemId: checklist[1].id, status: 'failed', note: 'Mobile layout overlaps action row' },
      { itemId: checklist[2].id, status: 'blocked', note: 'Seed record missing' },
    ]);

    expect(summary).toEqual({
      total: checklist.length,
      pending: checklist.length - 3,
      passed: 1,
      failed: 1,
      blocked: 1,
      complete: false,
      needsAttention: true,
    });
  });

  it('treats a fully passed browser QA run as complete without attention flags', () => {
    const checklist = buildBrowserQaChecklist();
    const results = checklist.map((item) => ({ itemId: item.id, status: 'passed' as const }));

    expect(summarizeBrowserQaRun(checklist, results)).toEqual({
      total: checklist.length,
      pending: 0,
      passed: checklist.length,
      failed: 0,
      blocked: 0,
      complete: true,
      needsAttention: false,
    });
  });

  it('keeps failed, blocked, and pending browser QA items open', () => {
    const checklist = buildBrowserQaChecklist();
    const openItems = getOpenBrowserQaChecklistItems(checklist, [
      { itemId: checklist[0].id, status: 'passed' },
      { itemId: checklist[1].id, status: 'failed' },
      { itemId: checklist[2].id, status: 'blocked' },
    ]);

    expect(openItems).not.toContainEqual(checklist[0]);
    expect(openItems).toContainEqual(checklist[1]);
    expect(openItems).toContainEqual(checklist[2]);
    expect(openItems).toContainEqual(checklist[3]);
  });

  it('audits duplicate and unknown browser QA result rows before report handoff', () => {
    const checklist = buildBrowserQaChecklist();
    const audit = auditBrowserQaRunResults(checklist, [
      { itemId: checklist[0].id, status: 'failed', note: 'Old result before recheck' },
      { itemId: checklist[0].id, status: 'passed', note: 'Latest result should win' },
      { itemId: 'legacy-route:removed:desktop', status: 'blocked', note: 'Stale local artifact' },
    ]);

    expect(audit).toEqual({
      duplicateItemIds: [checklist[0].id],
      unknownItemIds: ['legacy-route:removed:desktop'],
      batchMismatches: [],
    });
    expect(summarizeBrowserQaRun(checklist, [
      { itemId: checklist[0].id, status: 'failed' },
      { itemId: checklist[0].id, status: 'passed' },
    ])).toEqual({
      total: checklist.length,
      pending: checklist.length - 1,
      passed: 1,
      failed: 0,
      blocked: 0,
      complete: false,
      needsAttention: false,
    });
  });

  it('validates browser QA result artifacts before screenshot report handoff', () => {
    const checklist = buildBrowserQaChecklist();
    const validation = validateBrowserQaRunResults(checklist, [
      { itemId: checklist[0].id, status: 'passed' },
      { itemId: checklist[1].id, status: 'blocked', note: 'Canvas node unavailable' },
    ]);

    expect(validation).toEqual({
      valid: true,
      resultCount: 2,
      audit: {
        duplicateItemIds: [],
        unknownItemIds: [],
        batchMismatches: [],
      },
      warnings: [],
    });
    expect(renderBrowserQaRunValidationMarkdown(checklist, [
      { itemId: checklist[0].id, status: 'passed' },
    ])).toContain('Warnings: none');
  });

  it('surfaces stale and duplicate browser QA result artifact warnings', () => {
    const checklist = buildBrowserQaChecklist();
    const validation = validateBrowserQaRunResults(checklist, [
      { itemId: checklist[0].id, status: 'failed', note: 'Old overflow finding' },
      { itemId: checklist[0].id, status: 'passed', note: 'Latest recheck' },
      { itemId: 'legacy-route:removed:desktop', status: 'blocked' },
    ]);
    const markdown = renderBrowserQaRunValidationMarkdown(checklist, [
      { itemId: checklist[0].id, status: 'failed' },
      { itemId: checklist[0].id, status: 'passed' },
      { itemId: 'legacy-route:removed:desktop', status: 'blocked' },
    ]);

    expect(validation).toEqual({
      valid: false,
      resultCount: 3,
      audit: {
        duplicateItemIds: [checklist[0].id],
        unknownItemIds: ['legacy-route:removed:desktop'],
        batchMismatches: [],
      },
      warnings: [
        'Unknown item ids: legacy-route:removed:desktop',
        `Duplicate item ids: ${checklist[0].id}`,
      ],
    });
    expect(markdown).toContain('# Phase 7 Browser QA Result Validation');
    expect(markdown).toContain('Valid: no');
    expect(markdown).toContain(`Duplicate item ids: ${checklist[0].id}`);
    expect(markdown).toContain('Unknown item ids: legacy-route:removed:desktop');
  });

  it('surfaces browser QA result batch mismatches before report handoff', () => {
    const checklist = buildBrowserQaChecklist();
    const validation = validateBrowserQaRunResults(checklist, [
      { itemId: checklist[0].id, status: 'passed', batchId: 'hospital_admin:desktop' },
    ]);
    const markdown = renderBrowserQaRunValidationMarkdown(checklist, [
      { itemId: checklist[0].id, status: 'passed', batchId: 'hospital_admin:desktop' },
    ]);

    expect(validation).toEqual({
      valid: false,
      resultCount: 1,
      audit: {
        duplicateItemIds: [],
        unknownItemIds: [],
        batchMismatches: [`${checklist[0].id} expected nurse:desktop but got hospital_admin:desktop`],
      },
      warnings: [
        `Batch mismatches: ${checklist[0].id} expected nurse:desktop but got hospital_admin:desktop`,
      ],
    });
    expect(markdown).toContain(`Batch mismatches: ${checklist[0].id} expected nurse:desktop but got hospital_admin:desktop`);
  });

  it('renders a browser QA run report with open items and result data audit', () => {
    const checklist = buildBrowserQaChecklist();
    const nurseDesktopItems = buildBrowserQaExecutionBatches(checklist).find((batch) => batch.id === 'nurse:desktop')!.items;
    const markdown = renderBrowserQaRunReportMarkdown(checklist, [
      ...nurseDesktopItems.map((item) => ({ itemId: item.id, status: 'passed' as const })),
      { itemId: checklist[1].id, status: 'failed', batchId: 'nurse:mobile', checkedAt: '2026-06-03T05:45:00.000Z', note: 'Mobile metric cards overlap' },
      { itemId: checklist[3].id, status: 'blocked', note: 'Screenshot node disconnected' },
      { itemId: checklist[3].id, status: 'blocked', note: 'Screenshot node disconnected' },
      { itemId: 'legacy-route:removed:mobile', status: 'failed' },
    ]);

    expect(markdown).toContain('# Phase 7 Browser QA Run Report');
    expect(markdown).toContain(`Total: ${checklist.length}`);
    expect(markdown).toContain(`Passed: ${nurseDesktopItems.length}`);
    expect(markdown).toContain('Failed: 1');
    expect(markdown).toContain('Blocked: 1');
    expect(markdown).toContain(`Pending: ${checklist.length - nurseDesktopItems.length - 2}`);
    expect(markdown).toContain('Next batch: nurse:mobile');
    expect(markdown).toContain(`- nurse:desktop: ${nurseDesktopItems.length}/${nurseDesktopItems.length} passed, 0 failed, 0 blocked, 0 pending, attention no`);
    expect(markdown).toContain('- nurse:mobile: 0/3 passed, 1 failed, 1 blocked, 1 pending, attention yes');
    expect(markdown).toContain(`- Duplicate item ids: ${checklist[3].id}`);
    expect(markdown).toContain('- Unknown item ids: legacy-route:removed:mobile');
    expect(markdown).toContain('- Batch mismatches: none');
    expect(markdown).toContain(`[failed] ${checklist[1].id}`);
    expect(markdown).toContain('(batch nurse:mobile, checked 2026-06-03T05:45:00.000Z)');
    expect(markdown).toContain('Mobile metric cards overlap');
    expect(markdown).not.toContain(`[passed] ${checklist[0].id}`);
  });

  it('builds a structured browser QA run report for JSON handoff', () => {
    const checklist = buildBrowserQaChecklist();
    const [nurseDesktop] = buildBrowserQaExecutionBatches(checklist);
    const report = buildBrowserQaRunReport(checklist, [
      ...nurseDesktop.items.map((item) => ({ itemId: item.id, status: 'passed' as const })),
      { itemId: checklist[3].id, status: 'blocked' as const, note: 'Screenshot node unavailable' },
      { itemId: 'legacy-route:removed:desktop', status: 'failed' as const },
    ]);

    expect(report.summary).toEqual({
      total: checklist.length,
      pending: checklist.length - nurseDesktop.items.length - 1,
      passed: nurseDesktop.items.length,
      failed: 0,
      blocked: 1,
      complete: false,
      needsAttention: true,
    });
    expect(report.nextBatchId).toBe('nurse:mobile');
    expect(report.audit).toEqual({
      duplicateItemIds: [],
      unknownItemIds: ['legacy-route:removed:desktop'],
      batchMismatches: [],
    });
    expect(report.batchSummaries.find((summary) => summary.id === 'nurse:desktop')?.summary.complete).toBe(true);
    expect(report.openItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: checklist[3].id,
          status: 'blocked',
          result: expect.objectContaining({
            note: 'Screenshot node unavailable',
          }),
        }),
      ]),
    );
    expect(report.openItems.some((item) => item.id === nurseDesktop.items[0].id)).toBe(false);
  });

  it('parses browser QA result artifacts from arrays or wrapped result payloads', () => {
    const checklist = buildBrowserQaChecklist();

    expect(parseBrowserQaRunResults([
      { itemId: checklist[0].id, status: 'passed', checkedAt: '2026-06-02T17:00:00.000Z' },
    ])).toEqual([
      { itemId: checklist[0].id, status: 'passed', checkedAt: '2026-06-02T17:00:00.000Z' },
    ]);
    expect(parseBrowserQaRunResults({
      results: [
        { itemId: checklist[1].id, status: 'blocked', note: 'Canvas node unavailable' },
      ],
    })).toEqual([
      { itemId: checklist[1].id, status: 'blocked', note: 'Canvas node unavailable' },
    ]);
  });

  it('parses filled browser QA result templates into run results', () => {
    const checklist = buildBrowserQaChecklist();

    expect(parseBrowserQaRunResults({
      batchId: 'nurse:desktop',
      items: [
        { id: checklist[0].id, status: 'passed', note: '' },
        { id: checklist[1].id, status: 'failed', note: 'Mobile action row overlaps', checkedAt: '2026-06-02T18:30:00.000Z' },
        { id: checklist[2].id, status: null, note: '' },
      ],
    })).toEqual([
      { itemId: checklist[0].id, status: 'passed', batchId: 'nurse:desktop' },
      { itemId: checklist[1].id, status: 'failed', batchId: 'nurse:desktop', note: 'Mobile action row overlaps', checkedAt: '2026-06-02T18:30:00.000Z' },
    ]);
  });

  it('preserves batch provenance from wrapped browser QA result payloads', () => {
    const checklist = buildBrowserQaChecklist();

    expect(parseBrowserQaRunResults({
      batchId: 'hospital_admin:mobile',
      checkedAt: '2026-06-03T07:10:00.000Z',
      results: [
        { itemId: checklist[4].id, status: 'blocked', note: 'Mobile screenshot runner disconnected' },
        {
          itemId: checklist[5].id,
          status: 'failed',
          batchId: 'manual-recheck',
          checkedAt: '2026-06-03T07:20:00.000Z',
          note: 'Explicit batch should win',
        },
      ],
    })).toEqual([
      {
        itemId: checklist[4].id,
        status: 'blocked',
        batchId: 'hospital_admin:mobile',
        checkedAt: '2026-06-03T07:10:00.000Z',
        note: 'Mobile screenshot runner disconnected',
      },
      {
        itemId: checklist[5].id,
        status: 'failed',
        batchId: 'manual-recheck',
        checkedAt: '2026-06-03T07:20:00.000Z',
        note: 'Explicit batch should win',
      },
    ]);
  });

  it('preserves wrapper provenance from filled browser QA result templates', () => {
    const checklist = buildBrowserQaChecklist();

    expect(parseBrowserQaRunResults({
      batchId: 'super_admin:desktop',
      checkedAt: '2026-06-03T07:30:00.000Z',
      items: [
        { id: checklist[14].id, status: 'passed', note: '' },
        { id: checklist[15].id, status: null, note: '' },
      ],
    })).toEqual([
      {
        itemId: checklist[14].id,
        status: 'passed',
        batchId: 'super_admin:desktop',
        checkedAt: '2026-06-03T07:30:00.000Z',
      },
    ]);
  });

  it('preserves explicit item batch provenance from filled browser QA result templates', () => {
    const checklist = buildBrowserQaChecklist();

    expect(parseBrowserQaRunResults({
      batchId: 'nurse:desktop',
      checkedAt: '2026-06-03T10:00:00.000Z',
      items: [
        { id: checklist[0].id, status: 'passed', note: '' },
        {
          id: checklist[1].id,
          status: 'blocked',
          batchId: 'manual-overflow-recheck',
          checkedAt: '2026-06-03T10:15:00.000Z',
          note: 'Manual mobile overflow recheck',
        },
      ],
    })).toEqual([
      {
        itemId: checklist[0].id,
        status: 'passed',
        batchId: 'nurse:desktop',
        checkedAt: '2026-06-03T10:00:00.000Z',
      },
      {
        itemId: checklist[1].id,
        status: 'blocked',
        batchId: 'manual-overflow-recheck',
        checkedAt: '2026-06-03T10:15:00.000Z',
        note: 'Manual mobile overflow recheck',
      },
    ]);
  });

  it('parses wrapped browser QA artifact batches for resumable report generation', () => {
    const checklist = buildBrowserQaChecklist();

    expect(parseBrowserQaRunResults({
      artifacts: [
        [
          { itemId: checklist[0].id, status: 'passed' },
        ],
        {
          results: [
            { itemId: checklist[1].id, status: 'blocked', note: 'Canvas node unavailable' },
          ],
        },
        {
          items: [
            { id: checklist[2].id, status: 'failed', note: 'Mobile toolbar wraps' },
            { id: checklist[3].id, status: null, note: '' },
          ],
        },
      ],
    })).toEqual([
      { itemId: checklist[0].id, status: 'passed' },
      { itemId: checklist[1].id, status: 'blocked', note: 'Canvas node unavailable' },
      { itemId: checklist[2].id, status: 'failed', note: 'Mobile toolbar wraps' },
    ]);
  });

  it('applies wrapper provenance to nested browser QA artifact batches', () => {
    const checklist = buildBrowserQaChecklist();

    expect(parseBrowserQaRunResults({
      batchId: 'nurse:desktop',
      checkedAt: '2026-06-03T11:00:00.000Z',
      artifacts: [
        [
          { itemId: checklist[0].id, status: 'passed' },
        ],
        {
          checkedAt: '2026-06-03T11:15:00.000Z',
          results: [
            { itemId: checklist[1].id, status: 'blocked', note: 'Canvas node unavailable' },
            { itemId: checklist[2].id, status: 'failed', batchId: 'manual-card-recheck', note: 'Desktop card overlap' },
          ],
        },
        {
          items: [
            { id: checklist[3].id, status: 'passed', note: '' },
          ],
        },
      ],
    })).toEqual([
      {
        itemId: checklist[0].id,
        status: 'passed',
        batchId: 'nurse:desktop',
        checkedAt: '2026-06-03T11:00:00.000Z',
      },
      {
        itemId: checklist[1].id,
        status: 'blocked',
        batchId: 'nurse:desktop',
        checkedAt: '2026-06-03T11:15:00.000Z',
        note: 'Canvas node unavailable',
      },
      {
        itemId: checklist[2].id,
        status: 'failed',
        batchId: 'manual-card-recheck',
        checkedAt: '2026-06-03T11:15:00.000Z',
        note: 'Desktop card overlap',
      },
      {
        itemId: checklist[3].id,
        status: 'passed',
        batchId: 'nurse:desktop',
        checkedAt: '2026-06-03T11:00:00.000Z',
      },
    ]);
  });

  it('rejects malformed browser QA template result artifacts before report generation', () => {
    expect(() => parseBrowserQaRunResults({ items: [{ id: '', status: 'passed' }] })).toThrow('non-empty id');
    expect(() => parseBrowserQaRunResults({ items: [{ id: 'x', status: 'pending' }] })).toThrow('passed, failed, blocked, or null');
    expect(() => parseBrowserQaRunResults({ items: [{ id: 'x', status: 'blocked', note: 42 }] })).toThrow('note must be a string');
    expect(() => parseBrowserQaRunResults({ items: [{ id: 'x', status: 'blocked', batchId: '' }] })).toThrow('batchId must be a non-empty string');
  });

  it('rejects malformed browser QA checked-at provenance before report generation', () => {
    expect(() => parseBrowserQaRunResults({
      checkedAt: 'not-a-date',
      results: [{ itemId: 'x', status: 'blocked' }],
    })).toThrow('wrapper checkedAt must be a valid date string');
    expect(() => parseBrowserQaRunResults([
      { itemId: 'x', status: 'blocked', checkedAt: 'not-a-date' },
    ])).toThrow('checkedAt must be a valid date string');
    expect(() => parseBrowserQaRunResults({
      items: [{ id: 'x', status: 'blocked', checkedAt: 'not-a-date' }],
    })).toThrow('checkedAt must be a valid date string');
    expect(() => parseBrowserQaRunResults({
      checkedAt: 'not-a-date',
      artifacts: [
        [{ itemId: 'x', status: 'blocked' }],
      ],
    })).toThrow('wrapper checkedAt must be a valid date string');
  });

  it('rejects malformed browser QA result artifacts before report generation', () => {
    expect(() => parseBrowserQaRunResults({ artifact: [] })).toThrow('results array');
    expect(() => parseBrowserQaRunResults({ artifacts: [{ artifact: [] }] })).toThrow('artifact at index 0 is invalid');
    expect(() => parseBrowserQaRunResults([{ itemId: 'x', status: 'pending' }])).toThrow('passed, failed, or blocked');
    expect(() => parseBrowserQaRunResults([{ itemId: '', status: 'passed' }])).toThrow('non-empty itemId');
    expect(() => parseBrowserQaRunResults([{ itemId: 'x', status: 'blocked', batchId: '' }])).toThrow('batchId must be a non-empty string');
    expect(() => parseBrowserQaRunResults([{ itemId: 'x', status: 'blocked', note: 42 }])).toThrow('note must be a string');
    expect(() => parseBrowserQaRunResults({ checkedAt: 42, results: [{ itemId: 'x', status: 'blocked' }] })).toThrow('wrapper checkedAt');
  });
});
