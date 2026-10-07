# Project State — Abhisaran Platform

## Current Status

- **Current Milestone**: Milestone 1 (v1.0.0 Production Release)
- **Current Phase**: **Phase 2 — Geography & Pilot Location Management**
- **Status**: Completed (Paused at Phase 2 Gate)
- **Active Task**: Awaiting Owner Review & Approval on Phase 2 Gate before starting Phase 3.

## Phase Progress

| Phase | Description | Status | Gate Requirement |
|-------|-------------|--------|------------------|
| **Phase 0** | Architecture, Data Model, Scoring Spec, UI Parity, API Spec | 🟢 COMPLETED | Owner Review & Approval (`docs/`) |
| **Phase 1** | Foundation, Auth, Migrations, Splash Animation | 🟢 COMPLETED | Login works for both roles, no default credentials, splash animation working |
| **Phase 2** | Geography & Pilot Location Management | 🟢 COMPLETED | 4 pilot districts queryable, 100 concurrent code generator test passed, CSV bulk upload tested (Active Gate) |
| **Phase 3** | Question Bank, Versioning & Rubric Tester | ⚪ READY TO START | Seed Import & Version Snapshots |
| **Phase 4** | Field Audit Workspace & Reference UI Parity | ⚪ NOT STARTED | Parity Checklist & Side-by-side Screenshots |
| **Phase 5** | Deterministic Scoring Engine & Details View | ⚪ NOT STARTED | Golden Vectors & Ledger Balance |
| **Phase 6** | Officer Scoping, Delivery & Inbox | ⚪ NOT STARTED | Scoped Delivery in Single Tx |
| **Phase 7** | Dashboard, Bulk Analyse & PDF Reports | ⚪ NOT STARTED | No-ranking Dashboards & PDF Export |
| **Phase 8** | Assistive AI Microservice (FastAPI) | ⚪ NOT STARTED | Zero DB Access & AI Isolation Test |
| **Phase 9** | Hardening, E2E Playwright & Deployment | ⚪ NOT STARTED | Full E2E Pass on Real Postgres |

## Key Decisions & Conventions

- Geography hierarchy implemented in PostgreSQL: `states`, `districts`, `blocks`, `panchayats`, `pilot_location_types`, `pilot_locations`, `pilot_location_registry`, `facility_code_sequences`.
- Pilot restricted to 4 Jharkhand districts: Ranchi (`RCH`), Dhanbad (`DHN`), Bokaro (`BOK`), East Singhbhum (`ESB`).
- Non-recyclable unique codes allocated in format `{state_code2}-{district_code3}-{type_prefix}-{sequence:04d}` (e.g. `JH-RCH-SCH-0001`).
- Concurrency test executed with 100 simultaneous threads against real PostgreSQL: 0 collisions, strictly monotonic sequence.
- Bulk CSV upload parser processes row-by-row with granular validation diagnostics (tested with 50 rows).
- Admin UI includes Geography Hierarchy Manager and Facility Registry with Directory, Single Registration, and Bulk Upload tabs.

## Blockers & Dependencies

- Phase 2 Gate: Awaiting user review and approval (`continue`) to proceed to Phase 3 (Question Bank, Versioning & Rubric Tester).
