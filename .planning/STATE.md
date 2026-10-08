# Project State — Abhisaran Platform

## Current Status

- **Current Milestone**: Milestone 1 (v1.0.0 Production Release)
- **Current Phase**: **Phase 3 — Question Bank, Versioning & Rubric Tester**
- **Status**: Completed (Paused at Phase 3 Gate for Owner Review)
- **Active Task**: Phase 3 completed; awaiting Owner Review & Approval before proceeding to Phase 4 (Field Audit Workspace & Reference UI Parity).

## Phase Progress

| Phase | Description | Status | Gate Requirement |
|---|---|---|---|
| **Phase 0** | Architecture, Data Model, Scoring Spec, UI Parity, API Spec | 🟢 COMPLETED | Owner Review & Approval (`docs/`) |
| **Phase 1** | Foundation, Auth, Migrations, Splash Animation | 🟢 COMPLETED | Login works for both roles, no default credentials, splash animation working |
| **Phase 2** | Geography & Pilot Location Management | 🟢 COMPLETED | 4 pilot districts queryable, 100 concurrent code generator test passed, CSV bulk upload tested |
| **Phase 3** | Question Bank, Versioning & Rubric Tester | 🟢 COMPLETED | Exactly 72 questions seeded, version bump $N \to N+1$ preserves immutability, all 7 rubrics tested in sandbox with Section 9.5 clamping (Active Gate) |
| **Phase 4** | Field Audit Workspace & Reference UI Parity | ⚪ READY TO START | Parity Checklist & Side-by-side Screenshots |
| **Phase 5** | Deterministic Scoring Engine & Details View | ⚪ NOT STARTED | Golden Vectors & Ledger Balance |
| **Phase 6** | Officer Scoping, Delivery & Inbox | ⚪ NOT STARTED | Scoped Delivery in Single Tx |
| **Phase 7** | Dashboard, Bulk Analyse & PDF Reports | ⚪ NOT STARTED | No-ranking Dashboards & PDF Export |
| **Phase 8** | Assistive AI Microservice (FastAPI) | ⚪ NOT STARTED | Zero DB Access & AI Isolation Test |
| **Phase 9** | Hardening, E2E Playwright & Deployment | ⚪ NOT STARTED | Full E2E Pass on Real Postgres |

## Key Decisions & Conventions

- Exact 72 questions seeded from `question_merge_map.csv` in V3 Flyway migration with version 1 snapshots.
- Pure Java `ScoringEngine` implemented without Spring annotations, DB, clock, random, or network calls (Section 2 Rule 4).
- All 7 rubric models implemented: `GRID_AFU`, `CHECKLIST_YNP`, `YESNO_WITH_COUNT`, `RATING_1_5`, `PERCENT_THRESHOLD`, `RATIO`, and `NONE`.
- Section 9.5 Rule enforced: Any Critical-severity question with score $< 50\%$ is clamped to RED.
- Version bump endpoint `PUT /api/v1/questions/:id` produces immutable version $N+1$ while keeping version $N$ untouched for existing audits.
- Full UI components delivered: `QuestionBankScreen`, `RubricTesterScreen`, and `RubricReviewScreen` with light/dark theme support.
- 29/29 Maven backend tests passing against real PostgreSQL; Vite web app builds with 0 errors.

## Blockers & Dependencies

- Phase 3 Gate: Awaiting user review and approval to proceed to Phase 4 (Field Audit Workspace & Reference UI Parity).
