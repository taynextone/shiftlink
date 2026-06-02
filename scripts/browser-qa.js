#!/usr/bin/env node

const {
  buildBrowserQaRunReport,
  renderBrowserQaChecklistMarkdown,
  renderBrowserQaExecutionPlanMarkdown,
  renderBrowserQaRunReportMarkdown,
} = require('../dist/qa/browser-checklist');

const command = process.argv[2] ?? 'plan';

const renderers = {
  checklist: renderBrowserQaChecklistMarkdown,
  plan: renderBrowserQaExecutionPlanMarkdown,
  report: renderBrowserQaRunReportMarkdown,
  'report-json': () => JSON.stringify(buildBrowserQaRunReport(), null, 2),
};

const render = renderers[command];

if (!render) {
  console.error('Usage: node scripts/browser-qa.js [checklist|plan|report|report-json]');
  process.exit(1);
}

process.stdout.write(`${render()}\n`);
