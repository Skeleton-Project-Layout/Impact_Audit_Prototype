# Project State — Abhisaran Platform

## Current Status

- **Current Milestone**: Milestone 1 (v1.0.0 Production Release)
- **Current Phase**: **Phase 8 — Assistive AI Microservice (FastAPI), Zero-DB Isolation & Admin Draft Review**
- **Status**: Completed (Paused at Phase 8 Gate for User Approval)
- **Active Task**: Phase 8 completed; awaiting User Review & Approval before proceeding to Phase 9 (Hardening, E2E Playwright & Deployment).

## Phase Progress

| Phase | Description | Status | Gate Requirement |
|---|---|---|---|
| **Phase 0** | Architecture, Data Model, Scoring Spec, UI Parity, API Spec | 🟢 COMPLETED | Owner Review & Approval (`docs/`) |
| **Phase 1** | Foundation, Auth, Migrations, Splash Animation | 🟢 COMPLETED | Login works for both roles, no default credentials, splash animation working |
| **Phase 2** | Geography & Pilot Location Management | 🟢 COMPLETED | 4 pilot districts queryable, 100 concurrent code generator test passed, CSV bulk upload tested |
| **Phase 3** | Question Bank, Versioning & Rubric Tester | 🟢 COMPLETED | Exactly 72 questions seeded, version bump $N \to N+1$ preserves immutability, all 7 rubrics tested in sandbox with Section 9.5 clamping |
| **Phase 4** | Field Audit Workspace & Reference UI Parity | 🟢 COMPLETED | Parity Checklist verified, 390px mobile & 1280px desktop responsive layouts, 35/35 backend tests pass |
| **Phase 5** | Deterministic Scoring Engine & Details View | 🟢 COMPLETED | Golden Vectors & Ledger Balance verified |
| **Phase 6** | Officer Scoping, Delivery & Inbox | 🟢 COMPLETED | Scoped Delivery in Single Tx & Zero-PII Inbox |
| **Phase 7** | Dashboard, Bulk Analyse & PDF Reports | 🟢 COMPLETED | No-ranking Dashboards & PDF Export Verified |
| **Phase 8** | Assistive AI Microservice (FastAPI) | 🟢 COMPLETED | Zero DB Access & AI Isolation Verified (Active Gate) |
| **Phase 9** | Hardening, E2E Playwright & Deployment | ⚪ READY TO START | Full E2E Pass on Real Postgres |

## Key Decisions & Conventions

- Exact reference UI parity achieved with `ahfjhabsd/` design tokens, responsive typography, 56px sticky header, and fixed bottom bar.
- Multi-page field audit workspace with sequential page numbering, page duplication, and page deletion rules (minimum 1 page required).
- IndexedDB offline autosave engine (`abhisaran_offline_db`) with debounced 500ms sync and 3-state status pill.
- Server-side PII guard (`PiiDetector`) strictly rejects Aadhaar, phone numbers, and emails with HTTP 422.
- Magic-byte evidence verification (JPEG, PNG, WebP, PDF), EXIF/GPS stripping, and mandatory anti-PII attestation checkbox.
- Multi-page pooled pure scoring engine evaluates $\text{ACS} = \left(\frac{\sum \text{earned\_w}}{\sum \text{max\_w}}\right) \times 100$.
- Deduction Ledger enforces strict mathematical balancing $\sum \text{loss\_contribution} \equiv 100.00 - \text{ACS}$ ($< 0.001$).
- Single-transaction atomic delivery: when `analyseLocation` completes, deliveries are recorded in the exact same database transaction for all active district officers (`DEC-007`).
- Historical delivery back-fill: assigning district scopes to an officer automatically creates delivery records for past completed runs.
- Strict security & jurisdictional bounds: officers can only access their assigned districts; zero PII leakage (only non-identifying district codes, e.g. `JH-RCH-SCH-0001`).
- Non-ranking administrative overview (`DEC-008`): query sorts strictly by `l.code ASC`. Zero league tables, zero top/bottom-N, no rank column.
- Bulk scoring engine processes multi-facility batches with `<AbhisaranLoader />` progression modal and dispatches atomic officer notifications.
- Printable PDF report (`AcsPdfReportView.tsx` with `@media print`) enforces strict code-only presentation with watermark and zero institutional/personal PII.
- Append-only security audit log (`GET /api/v1/audit-log` restricted to `ROLE_ADMIN`) with filtering by actor, action, and object.
- Python FastAPI microservice (`apps/ai`) with 0 database drivers, running in stateless isolation with `X-AI-Service-Token`.
- AI draft persistence in `ai_drafts` via Flyway `V7__ai_drafts.sql` with JSONB Hibernate 6 `@JdbcTypeCode(SqlTypes.JSON)` mappings.
- Absolute scoring immutability: generating, accepting, or rejecting AI drafts strictly cannot mutate ACS scores or question ledger points.
- Resilient offline fallback: when AI service is disabled or unreachable, system seamlessly produces certified rule-based drafts without crashing.
- 55/55 Maven backend tests pass against real PostgreSQL; 8/8 Python pytest tests pass in `apps/ai`; Vite web app builds with 0 errors.

## Blockers & Dependencies

- Phase 8 Gate: Awaiting user review and approval to proceed to Phase 9 (Hardening, E2E Playwright & Deployment).

