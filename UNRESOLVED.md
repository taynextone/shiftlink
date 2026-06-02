# Shiftlink Unresolved Items

Purpose: track concrete blockers that prevent the roadmap from being fully closed. Keep this list short and actionable.

## Phase 7 - Browser Validation / Visual QA

Status: blocked externally
Priority: critical

Blocker:
- OpenClaw visual QA / screenshot execution path is unavailable because no paired node is connected.

Evidence:
- Repeated `nodes status` checks during Phase 7 heartbeats returned no connected nodes.
- Local Chromium is installed, but the repo has no Playwright/Puppeteer dependency or local screenshot harness wired into Phase 7.
- Docker access is unavailable from the heartbeat runtime, so the local app/database stack cannot be started for an authenticated browser pass from here.
- Code-side QA coverage and browser QA handoff tooling are present, including checklist, execution plan, next-batch selection, result templates, and resumable reports.

Current next batch when visual QA is available:
- `npm run qa:browser-next`
- `npm run qa:browser-result-template`

Unblock criteria:
- A connected OpenClaw node or equivalent browser/screenshot runner is available.
- Run the current next-batch browser QA slice across desktop and mobile.
- Feed filled result artifacts back into `npm run qa:browser-report -- <results.json>` until all batches are passed or concrete UI findings are filed.

Do not expand this file with new roadmap themes unless Jurica explicitly changes the active mode.
