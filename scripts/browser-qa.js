#!/usr/bin/env node

const fs = require('node:fs');

const {
  buildBrowserQaChecklistDocument,
  buildBrowserQaExecutionPlan,
  buildBrowserQaResultTemplate,
  buildBrowserQaRunReport,
  assertBrowserQaRunResultsValid,
  validateBrowserQaRunResults,
  getNextBrowserQaExecutionBatch,
  parseBrowserQaRunResults,
  renderBrowserQaChecklistMarkdown,
  renderBrowserQaExecutionPlanMarkdown,
  renderBrowserQaResultTemplateMarkdown,
  renderBrowserQaRunReportMarkdown,
  renderBrowserQaRunValidationResultMarkdown,
  renderBrowserQaRunValidationMarkdown,
  renderNextBrowserQaExecutionBatchMarkdown,
} = require('../dist/qa/browser-checklist');

const command = process.argv[2] ?? 'plan';
const resultPaths = process.argv.slice(3);

function readResultSource(resultPath) {
  if (resultPath === '-') {
    return fs.readFileSync(0, 'utf8');
  }

  return fs.readFileSync(resultPath, 'utf8');
}

function loadResults() {
  if (resultPaths.length === 0) {
    return [];
  }

  return resultPaths.flatMap((resultPath) => {
    const rawJson = readResultSource(resultPath);
    return parseBrowserQaRunResults(JSON.parse(rawJson));
  });
}

function renderStrictValidation(asJson = false) {
  const validation = assertBrowserQaRunResultsValid(undefined, loadResults());
  return asJson
    ? JSON.stringify(validation, null, 2)
    : renderBrowserQaRunValidationResultMarkdown(validation);
}

const renderers = {
  checklist: renderBrowserQaChecklistMarkdown,
  'checklist-json': () => JSON.stringify(buildBrowserQaChecklistDocument(), null, 2),
  plan: () => renderBrowserQaExecutionPlanMarkdown(undefined, loadResults()),
  'plan-json': () => JSON.stringify(buildBrowserQaExecutionPlan(undefined, loadResults()), null, 2),
  'next-batch': () => renderNextBrowserQaExecutionBatchMarkdown(undefined, loadResults()),
  'next-batch-json': () => JSON.stringify(getNextBrowserQaExecutionBatch(undefined, loadResults()), null, 2),
  'result-template': () => renderBrowserQaResultTemplateMarkdown(undefined, loadResults()),
  'result-template-json': () => JSON.stringify(buildBrowserQaResultTemplate(undefined, loadResults()), null, 2),
  report: () => renderBrowserQaRunReportMarkdown(undefined, loadResults()),
  'report-json': () => JSON.stringify(buildBrowserQaRunReport(undefined, loadResults()), null, 2),
  validate: () => renderBrowserQaRunValidationMarkdown(undefined, loadResults()),
  'validate-json': () => JSON.stringify(validateBrowserQaRunResults(undefined, loadResults()), null, 2),
  'validate-strict': () => renderStrictValidation(false),
  'validate-strict-json': () => renderStrictValidation(true),
};

const render = renderers[command];

if (!render) {
  console.error('Usage: node scripts/browser-qa.js [checklist|checklist-json|plan|plan-json|next-batch|next-batch-json|result-template|result-template-json|report|report-json|validate|validate-json|validate-strict|validate-strict-json] [results.json ...|-]');
  process.exit(1);
}

try {
  process.stdout.write(`${render()}\n`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
