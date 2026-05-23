# Shiftlink Roadmap

Purpose: single execution backlog from current product-ready alpha toward a marketable product.

Principles:
- sustainable, scalable, clean, hardened
- professional product quality, not generic demo work
- real backend-driven flows only
- finish one meaningful block at a time
- verify with build/test before claiming done

## Current Product Status
- Strong backend and frontend foundation exists.
- Real nurse and hospital flows exist.
- Product is not yet market-ready.
- Biggest gap is no longer basic app structure; it is operational completeness, compliance-grade process coverage, and go-live hardening.

---

## Phase 1 — Core Product Completion

### 1. Operations / Admin Surface
Status: in_progress
Priority: critical

Needed:
- [done] Nurse verification review workflow
- [done] Hospital dossier access workflows in UI
- [done] Billing operations surface
- [partial] Contract exception / dispute / intervention tooling
- [done] linked contract / dossier / offer operational workflows
- [partial] Superadmin / operations dashboard
- [done] Release / unrelease controls
- [partial] Queue / webhook / processing failure visibility

Definition of done:
- key non-end-user operational workflows are possible without DB/manual shell work
- Current gap to done: dashboard/control-plane and linked ops navigation are materially improved; remaining gap is broader superadmin-centralization, deeper queue/worker intervention depth, and the final stretch of contract/billing exception handling across edge states

### 2. Verification / Documents / Dossier End-to-End
Status: pending
Priority: critical

Needed:
- document upload UX
- review / approve / reject UI
- verification state transitions visible in UI
- nurse dossier review UX for hospital side where allowed
- artifact download/access UX
- document/audit history visibility

Definition of done:
- verification and dossier flows work end-to-end in product UI with correct permissions

### 3. Contract / Billing Completion
Status: in_progress
Priority: critical

Needed:
- [partial] invoice detail UX
- [partial] invoice export UX
- [partial] contract snapshot detail UX refinement
- [partial] signature event detail UX refinement
- [partial] PDF artifact handling UX
- [partial] clearer contract state machine views
- [todo] exception states for void / paid / fully executed contracts

Definition of done:
- contract governance and billing are operable through the app, not just inspectable by developers

---

## Phase 2 — Workflow Hardening

### 4. Notifications / Delivery Flows
Status: pending
Priority: high

Needed:
- visible notification state in UI
- offer communication lifecycle visibility
- delivery failure handling where applicable
- more complete event/status feedback around async processes

### 5. Form / Validation / Error Hardening
Status: in_progress
Priority: high

Needed:
- finish consistent Field/Feedback usage everywhere
- better mutation-state handling
- stronger inline validation
- better destructive-action confirmation patterns
- tighter empty/error/success state consistency

Definition of done:
- app-wide form behavior is consistent, defensive, and professional

### 6. List / Detail / Navigation Cohesion
Status: in_progress
Priority: high

Needed:
- [partial] reduce remaining raw/manual ID-driven interactions
- [partial] improve context handoff across views
- [partial] deepen master-detail patterns where backend supports it
- [partial] refine action emphasis and information hierarchy

Definition of done:
- operational flows feel connected and product-like instead of tool-like

---

## Phase 3 — Go-Live Readiness

### 7. QA / Browser Validation / E2E Confidence
Status: pending
Priority: critical

Needed:
- browser-level visual QA path working again
- rendered UI review of all major screens
- end-to-end smoke coverage for top workflows
- seeded realistic test scenarios
- regression checklist

Blocked note:
- current OpenClaw visual QA path issue is tracked separately in `UNRESOLVED.md`

### 8. Security / Compliance / Audit Readiness
Status: pending
Priority: critical

Needed:
- verify access controls across sensitive flows
- audit log visibility and retention expectations
- data handling review for healthcare-adjacent sensitivity
- deletion / retention / export policy support
- permission boundary review across nurse/hospital/admin roles

### 9. Reliability / Production Hardening
Status: pending
Priority: critical

Needed:
- queue failure recovery visibility
- retry/error handling review
- concurrency/race-condition review in contract/offer flows
- operational health checks and runbooks
- deployment/runtime configuration review

---

## Phase 4 — Commercial Readiness

### 10. Onboarding / Activation UX
Status: pending
Priority: medium

Needed:
- clearer first-run flows
- role-specific onboarding help
- activation progress cues
- reduced operator dependency for new users

### 11. Product Metrics / Business Visibility
Status: pending
Priority: medium

Needed:
- fill-rate and conversion visibility
- signed contract metrics
- invoice pipeline visibility
- operational KPIs in dashboards

---

## Execution Order
1. Operations / Admin Surface
2. Verification / Documents / Dossier End-to-End
3. Contract / Billing Completion
4. Form / Validation / Error Hardening
5. List / Detail / Navigation Cohesion
6. Notifications / Delivery Flows
7. QA / Browser Validation / E2E Confidence
8. Security / Compliance / Audit Readiness
9. Reliability / Production Hardening
10. Onboarding / Activation UX
11. Product Metrics / Business Visibility

---

## Current Active Block
- Operations / Admin Surface
- Progress in this block:
  - superadmin verification review UI added
  - admin verification lookup improved via nurse public ID context
  - hospital dossier access UI added
  - hospital billing operations page added
  - release / unrelease controls added for superadmin verification workflow
  - hospital dashboard upgraded into a real ops surface with backend-backed summaries
  - webhook and async worker failure visibility added to the ops dashboard
  - intervention hotspots are now prioritized on the dashboard as a control-plane view
  - dashboard hotspot routing is now more role-aware and operationally precise
  - async failure visibility is now gated cleanly by role instead of leaking into hospital-admin error paths
  - offer, shift import, and contract void intervention guidance was added to operational surfaces
  - contract lifecycle / execution / snapshot / PDF ops flows added and improved
  - contract summary now includes billing exception guidance and invoice PDF visibility when available
  - offers / dossiers / contracts linked into a connected ops workflow
  - backend-backed operational summaries improved across offers and contracts
- Remaining focus inside this block:
  - central superadmin/ops dashboard
  - release / unrelease controls
  - queue / webhook / processing failure visibility
  - stronger exception / intervention tooling
