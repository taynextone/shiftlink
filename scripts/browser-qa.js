#!/usr/bin/env node

const {
  renderBrowserQaChecklistMarkdown,
  renderBrowserQaExecutionPlanMarkdown,
  renderBrowserQaRunReportMarkdown,
} = require('../dist/qa/browser-checklist');

const command = process.argv[2] ?? 'plan';

const renderers = {
  checklist: renderBrowserQaChecklistMarkdown,
  plan: renderBrowserQaExecutionPlanMarkdown,
  report: renderBrowserQaRunReportMarkdown,
};

const render = renderers[command];

if (!render) {
  console.error('Usage: node scripts/browser-qa.js [checklist|plan|report]');
  process.exit(1);
}

process.stdout.write(`${render()}\n`);
