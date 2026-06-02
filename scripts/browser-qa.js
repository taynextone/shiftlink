#!/usr/bin/env node

const fs = require('node:fs');

const {
  buildBrowserQaChecklistDocument,
  buildBrowserQaExecutionPlan,
  buildBrowserQaResultTemplate,
  buildBrowserQaRunReport,
  getNextBrowserQaExecutionBatch,
  parseBrowserQaRunResults,
  renderBrowserQaChecklistMarkdown,
  renderBrowserQaExecutionPlanMarkdown,
  renderBrowserQaResultTemplateMarkdown,
  renderBrowserQaRunReportMarkdown,
  renderNextBrowserQaExecutionBatchMarkdown,
} = require('../dist/qa/browser-checklist');

const command = process.argv[2] ?? 'plan';
const resultPaths = process.argv.slice(3);

function loadResults() {
  if (resultPaths.length === 0) {
    return [];
  }

  return resultPaths.flatMap((resultPath) => {
    const rawJson = fs.readFileSync(resultPath, 'utf8');
    return parseBrowserQaRunResults(JSON.parse(rawJson));
  });
}

const renderers = {
  checklist: renderBrowserQaChecklistMarkdown,
  'checklist-json': () => JSON.stringify(buildBrowserQaChecklistDocument(), null, 2),
  plan: renderBrowserQaExecutionPlanMarkdown,
  'plan-json': () => JSON.stringify(buildBrowserQaExecutionPlan(), null, 2),
  'next-batch': () => renderNextBrowserQaExecutionBatchMarkdown(undefined, loadResults()),
  'next-batch-json': () => JSON.stringify(getNextBrowserQaExecutionBatch(undefined, loadResults()), null, 2),
  'result-template': () => renderBrowserQaResultTemplateMarkdown(undefined, loadResults()),
  'result-template-json': () => JSON.stringify(buildBrowserQaResultTemplate(undefined, loadResults()), null, 2),
  report: () => renderBrowserQaRunReportMarkdown(undefined, loadResults()),
  'report-json': () => JSON.stringify(buildBrowserQaRunReport(undefined, loadResults()), null, 2),
};

const render = renderers[command];

if (!render) {
  console.error('Usage: node scripts/browser-qa.js [checklist|checklist-json|plan|plan-json|next-batch|next-batch-json|result-template|result-template-json|report|report-json] [results.json ...]');
  process.exit(1);
}

process.stdout.write(`${render()}\n`);
