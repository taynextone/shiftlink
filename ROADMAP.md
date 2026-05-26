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
Status: complete
Priority: critical

Checklist:
- [done] Superadmin verification review workflow
- [done] Release / unrelease controls in verification ops
- [done] Hospital dossier access workflow in UI
- [done] Billing operations surface for hospital admins
- [done] Linked ops navigation between shifts / offers / contracts / dossiers / billing
- [done] Hospital offers page can directly accept / decline pending offers
- [done] Contract lifecycle / execution / void / snapshot / PDF operational views
- [done] Contract and billing exception context is surfaced in UI
- [done] Superadmin ops dashboard / control plane route exists
- [done] Dashboard hotspots are prioritized and route more precisely
- [done] Webhook and async worker failure visibility exists in dashboard
- [done] Retry-attempt and deeper processing telemetry are visible in ops surfaces
- [done] Contract exception / dispute / intervention tooling is operationally complete
- [done] Superadmin / ops dashboard is centralized enough for most intervention work
- [done] Queue / webhook / worker failure handling goes beyond visibility into real intervention depth
- [done] Add stronger operator actions for failed async/webhook processes (retry / requeue / resolve-style handling where product-appropriate)
- [done] Close remaining offer / notification lifecycle intervention gaps
- [done] Close the last contract / billing edge-state intervention gaps that still need manual judgment

Definition of done:
- key non-end-user operational workflows are possible without DB/manual shell work
- operators can not only see failures and edge states, but also drive the normal intervention path from the product UI

### 2. Verification / Documents / Dossier End-to-End
Status: pending
Priority: critical

Checklist:
- [todo] Document upload UX
- [done] Review / approve / reject UI
- [partial] Verification state transitions visible in UI
- [done] Nurse dossier review UX for hospital side where allowed
- [partial] Artifact download / access UX
- [partial] Document / audit history visibility

Definition of done:
- verification and dossier flows work end-to-end in product UI with correct permissions

### 3. Contract / Billing Completion
Status: in_progress
Priority: critical

Checklist:
- [partial] Invoice detail UX
- [partial] Invoice export UX
- [partial] Contract snapshot detail UX refinement
- [partial] Signature event detail UX refinement
- [partial] PDF artifact handling UX
- [partial] Clearer contract state machine views
- [partial] Exception states for void / paid / fully executed contracts
- [done] Billing-conflict severity / intervention context is surfaced in contract ops
- [done] Invoice PDF visibility is surfaced where available
- [todo] Finish the remaining operator path for edge states without relying on implicit knowledge

Definition of done:
- contract governance and billing are operable through the app, not just inspectable by developers

---

## Phase 2 — Workflow Hardening

### 4. Notifications / Delivery Flows
Status: in_progress
Priority: high

Checklist:
- [done] Visible notification state in UI
- [done] Offer communication lifecycle visibility
- [done] Delivery failure handling where applicable
- [done] More complete event / status feedback around async processes

### 5. Form / Validation / Error Hardening
Status: in_progress
Priority: high

Checklist:
- [done] Finish consistent Field / Feedback usage everywhere
- [done] Better mutation-state handling
- [partial] Stronger inline validation
- [done] Better destructive-action confirmation patterns
- [done] Tighter empty / error / success state consistency

Definition of done:
- app-wide form behavior is consistent, defensive, and professional

### 6. List / Detail / Navigation Cohesion
Status: in_progress
Priority: high

Checklist:
- [done] Reduce remaining raw / manual ID-driven interactions
- [done] Improve context handoff across views
- [done] Deepen master-detail patterns where backend supports it
- [done] Refine action emphasis and information hierarchy
- [done] Shifts can hand off directly into offer operations context
- [done] Ops dashboard and billing/contract/dossier surfaces cross-link more coherently

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
Status: in_progress
Priority: critical

Needed:
- verify access controls across sensitive flows
- audit log visibility and retention expectations
- data handling review for healthcare-adjacent sensitivity
- deletion / retention / export policy support
- permission boundary review across nurse/hospital/admin roles

### 9. Reliability / Production Hardening
Status: in_progress
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
- Phase 3 — Go-Live Readiness
- Active: Reliability / Production Hardening (Punkt 9) — concurrency fixes, audit logging
- Completed: Security / Compliance / Audit Readiness (Punkt 8) — audit logging, ConfirmModal, access controls verified
- Phase 2 — Workflow Hardening: COMPLETE ✅
- Phase 1 — Core Product Completion: COMPLETE ✅
