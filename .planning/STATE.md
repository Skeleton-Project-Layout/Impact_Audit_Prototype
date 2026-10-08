# Project State — Abhisaran Platform

## Current Status

- **Current Milestone**: Milestone 1 (v1.0.0 Production Release)
- **Current Phase**: **Phase 5 — Deterministic Scoring Engine & Details View**
- **Status**: Completed (Paused at Phase 5 Gate for User Approval)
- **Active Task**: Phase 5 completed; awaiting User Review & Approval before proceeding to Phase 6 (Officer Scoping, Delivery & Inbox).

## Phase Progress

| Phase | Description | Status | Gate Requirement |
|---|---|---|---|
| **Phase 0** | Architecture, Data Model, Scoring Spec, UI Parity, API Spec | 🟢 COMPLETED | Owner Review & Approval (`docs/`) |
| **Phase 1** | Foundation, Auth, Migrations, Splash Animation | 🟢 COMPLETED | Login works for both roles, no default credentials, splash animation working |
| **Phase 2** | Geography & Pilot Location Management | 🟢 COMPLETED | 4 pilot districts queryable, 100 concurrent code generator test passed, CSV bulk upload tested |
| **Phase 3** | Question Bank, Versioning & Rubric Tester | 🟢 COMPLETED | Exactly 72 questions seeded, version bump $N \to N+1$ preserves immutability, all 7 rubrics tested in sandbox with Section 9.5 clamping |
| **Phase 4** | Field Audit Workspace & Reference UI Parity | 🟢 COMPLETED | Parity Checklist verified, 390px mobile & 1280px desktop responsive layouts, 35/35 backend tests pass |
| **Phase 5** | Deterministic Scoring Engine & Details View | 🟢 COMPLETED | Golden Vectors & Ledger Balance (Active Gate) |
| **Phase 6** | Officer Scoping, Delivery & Inbox | ⚪ READY TO START | Scoped Delivery in Single Tx |
| **Phase 7** | Dashboard, Bulk Analyse & PDF Reports | ⚪ NOT STARTED | No-ranking Dashboards & PDF Export |
| **Phase 8** | Assistive AI Microservice (FastAPI) | ⚪ NOT STARTED | Zero DB Access & AI Isolation Test |
| **Phase 9** | Hardening, E2E Playwright & Deployment | ⚪ NOT STARTED | Full E2E Pass on Real Postgres |

## Key Decisions & Conventions

- Exact reference UI parity achieved with `ahfjhabsd/` design tokens, responsive typography, 56px sticky header, and fixed bottom bar.
- Multi-page field audit workspace with sequential page numbering, page duplication, and page deletion rules (minimum 1 page required).
- IndexedDB offline autosave engine (`abhisaran_offline_db`) with debounced 500ms sync and 3-state status pill.
- Server-side PII guard (`PiiDetector`) strictly rejects Aadhaar, phone numbers, and emails with HTTP 422.
- Magic-byte evidence verification (JPEG, PNG, WebP, PDF), EXIF/GPS stripping, and mandatory anti-PII attestation checkbox.
- Multi-page pooled pure scoring engine evaluates $\text{ACS} = \left(\frac{\sum \text{earned\_w}}{\sum \text{max\_w}}\right) \times 100$.
- Deduction Ledger enforces strict mathematical balancing $\sum \text{loss\_contribution} \equiv 100.00 - \text{ACS}$ ($< 0.001$).
- 5 shared golden vectors verify canonical 4-page audit, perfect score, critical clamps, provisional badge (<70% coverage), and zero-denominator handling.
- Immutable analysis runs, items, and ledger persisted in PostgreSQL schema `public` via Flyway migration V5.
- 43/43 Maven backend tests pass against real PostgreSQL; Vite web app builds with 0 errors.

## Blockers & Dependencies

- Phase 5 Gate: Awaiting user review and approval to proceed to Phase 6 (Officer Scoping, Delivery & Inbox).
