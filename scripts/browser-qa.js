#!/usr/bin/env node

const fs = require('node:fs');

const {
  buildBrowserQaRunReport,
  parseBrowserQaRunResults,
  renderBrowserQaChecklistMarkdown,
  renderBrowserQaExecutionPlanMarkdown,
  renderBrowserQaRunReportMarkdown,
} = require('../dist/qa/browser-checklist');

const command = process.argv[2] ?? 'plan';
const resultPath = process.argv[3];

function loadResults() {
  if (!resultPath) {
    return [];
  }

  const rawJson = fs.readFileSync(resultPath, 'utf8');
  return parseBrowserQaRunResults(JSON.parse(rawJson));
}

const renderers = {
  checklist: renderBrowserQaChecklistMarkdown,
  plan: renderBrowserQaExecutionPlanMarkdown,
  report: () => renderBrowserQaRunReportMarkdown(undefined, loadResults()),
  'report-json': () => JSON.stringify(buildBrowserQaRunReport(undefined, loadResults()), null, 2),
};

const render = renderers[command];

if (!render) {
  console.error('Usage: node scripts/browser-qa.js [checklist|plan|report|report-json] [results.json]');
  process.exit(1);
}

process.stdout.write(`${render()}\n`);
