# Project State — Abhisaran Platform

## Current Status

- **Current Milestone**: Milestone 1 (v1.0.0 Production Release)
- **Current Phase**: **Phase 1 — Foundation, Monorepo, Auth, RBAC & Brand Splash**
- **Status**: Completed (Paused at Phase 1 Gate)
- **Active Task**: Awaiting Owner Review & Approval on Phase 1 Gate before starting Phase 2.

## Phase Progress

| Phase | Description | Status | Gate Requirement |
|-------|-------------|--------|------------------|
| **Phase 0** | Architecture, Data Model, Scoring Spec, UI Parity, API Spec | 🟢 COMPLETED | Owner Review & Approval (`docs/`) |
| **Phase 1** | Foundation, Auth, Migrations, Splash Animation | 🟢 COMPLETED | Login works for both roles, no default credentials, splash animation working (Active Gate) |
| **Phase 2** | Geography & Pilot Location Management | ⚪ READY TO START | Non-recyclable Code Generation (4 pilot districts) |
| **Phase 3** | Question Bank, Versioning & Rubric Tester | ⚪ NOT STARTED | Seed Import & Version Snapshots |
| **Phase 4** | Field Audit Workspace & Reference UI Parity | ⚪ NOT STARTED | Parity Checklist & Side-by-side Screenshots |
| **Phase 5** | Deterministic Scoring Engine & Details View | ⚪ NOT STARTED | Golden Vectors & Ledger Balance |
| **Phase 6** | Officer Scoping, Delivery & Inbox | ⚪ NOT STARTED | Scoped Delivery in Single Tx |
| **Phase 7** | Dashboard, Bulk Analyse & PDF Reports | ⚪ NOT STARTED | No-ranking Dashboards & PDF Export |
| **Phase 8** | Assistive AI Microservice (FastAPI) | ⚪ NOT STARTED | Zero DB Access & AI Isolation Test |
| **Phase 9** | Hardening, E2E Playwright & Deployment | ⚪ NOT STARTED | Full E2E Pass on Real Postgres |

## Key Decisions & Conventions

- Reference UI files copied to workspace (`ahfjhabsd/`, `Abhisaran_Master_45_Questions.csv`, `question_merge_map.csv`).
- Phase 0 specifications generated and approved in `docs/` (`ARCHITECTURE.md`, `DATA_MODEL.md`, `SCORING_SPEC.md`, `UI_PARITY_CHECKLIST.md`, `API_SPEC.md`, `DECISIONS.md`).
- Real PostgreSQL 16 container (`abhisaran-pg`) running on port 5432; all tests executed against real database (no H2 mocks).
- BCrypt cost $\ge 12$ password hashing, $\ge 32$ byte secret validator, zero-backdoor bootstrap runner with `must_change_password=true`.
- Rate limiting: 5 consecutive failures triggers a 15-minute lockout (HTTP 429).
- Anti-enumeration: Identical 401 response (`"Invalid ID or password."`) across bad passwords, nonexistent users, and role tab mismatches.
- Brand logo: Convergence SVG brand mark with 2.8s particle animation, cold-start pre-warming (`GET /health`), and interactive skip.
- Segmented dual-role login interface implemented with design tokens matching reference UI.

## Blockers & Dependencies

- Phase 1 Gate: Awaiting user review and approval (`continue`) to proceed to Phase 2 (Geography & Pilot Location Management).
