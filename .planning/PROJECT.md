# ABHISARAN — Audit & ACS Platform

## What This Is

The **Abhisaran Audit & ACS Platform** is a secure, role-based governance and audit system designed for public service delivery monitoring across vulnerable institutions—including Schools, Anganwadis, Primary Health Centres (PHCs), and Hospitals.

The platform provides:
1. A mobile-friendly field audit form (`apps/web` Admin role) replicating the reference field experience (`ahfjhabsd/abhisaran-field-form-preview.html`), allowing administrators to conduct multi-page field audits with per-question evidence attachments.
2. A strictly deterministic scoring engine (`ScoringEngine` in Java 21) that translates audit responses into the **Abhisaran Continuity Score (ACS, 0–100)** with a granular deduction ledger where `Σ lost_w / Σ max_w * 100` mathematically equals `100 − ACS`.
3. Automated delivery of analysed scores and alerts to **Government Officers** scoped strictly by assigned district(s), presenting anonymised location codes only (`SCH-JH-RAN-0007`) and zero direct PII.
4. An assistive, isolated Python FastAPI AI service (`apps/ai`) with zero direct database access, providing PII pre-screening, OCR text extraction, and narrative drafting under human acceptance.

## Core Values & Principles

- **Zero Fake Data**: Every score, name, alert, and gap originates from the database. Empty states are explicitly rendered; demo data requires `is_demo=true` with prominent visual banners and is blocked in production.
- **Server is Rule Authority**: RBAC, scoring, status transitions, and data masking are enforced strictly on the server (`apps/api`). The browser never computes or alters stored scores.
- **Scores Are Never Produced by AI**: The scoring engine is a pure, side-effect-free Java class. AI models cannot touch, alter, or write scores or DB state.
- **Stable References Over String Matching**: Scoring references stable, immutable option IDs—never fragile string lookups.
- **Missing ≠ Zero**: Unanswered questions are classified as *Not Assessed* (excluded from score calculation, factored into coverage percentage). Genuine negative responses evaluate to a true 0.
- **Codes Only, Privacy First**: Dashboards, officer views, reports, and public outputs use system-generated location codes (`{PREFIX}-{STATE2}-{DIST3}-{SEQ4}`). Location names are sequestered in an admin-restricted registry with mandatory audit logging.
- **Immutable Migrations & Real Postgres Testing**: Flyway migrations are immutable once committed. Testcontainers with real PostgreSQL and Flyway migrations underpin all integration and security tests.

## Tech Stack & Architecture

```
Impact_Audit_prototype/
├── apps/
│   ├── web/               # React 18+ + TypeScript + Vite (Admin + Officer Shells, Vanilla CSS tokens)
│   ├── api/               # Java 21 + Spring Boot 3.x (Maven, Spring Data JPA, Spring Security, Flyway)
│   └── ai/                # Python 3.11 + FastAPI (Assistive only, internal token-authenticated)
├── shared/
│   └── golden-vectors/    # Canonical JSON scoring fixtures shared across test suites
├── docs/                  # Architecture, ER diagrams (Mermaid), scoring spec, UI-parity checklist, API specs
├── ahfjhabsd/             # Reference UI implementation (preview HTML, styles, JS, pdfwriter)
└── question_merge_map.csv # Master de-duplicated question bank (72 audit questions + 4 registry fields)
```

- **Frontend (`apps/web`)**:
  - React + TypeScript + Vite.
  - Color Tokens: Primary Accent `#0b6b5c` / `#3fb8a2`, Soft `#dff0ec`, Ink `#15231f`, Dark Background `#0e1513 → #16211e`.
  - Offline-tolerant autosave with IndexedDB.
  - Two role shells: Admin (Locations, Audits, Bank, Officers, Registry, Logs) and Officer (ACS Inbox, Location Score Details).
  - Logo splash animation: ~2.8s SVG convergence particle animation skipping after 600ms on interaction.

- **Backend (`apps/api`)**:
  - Java 21 + Spring Boot 3.x.
  - Packages: `auth`, `users`, `geography`, `locations`, `questions`, `audit`, `evidence`, `scoring`, `analysis`, `delivery`, `officers`, `registry`, `auditlog`, `ai`, `common`.
  - Authentication: Argon2id password hashing, httpOnly + Secure session/JWT cookies, CSRF protection, DB-backed login rate-limiting (5 failures / 15 min lock).
  - Validation: Hibernate Validator, `@JdbcTypeCode(SqlTypes.JSON)` for JSONB columns, `ddl-auto=validate`.

- **Database & Storage**:
  - PostgreSQL (Supabase pooler compatible).
  - Supabase Storage private bucket for evidence files; served exclusively via short-lived backend-issued signed URLs (5 min expiry) after authorization.

- **AI Microservice (`apps/ai`)**:
  - Python 3.11 + FastAPI.
  - Server-to-server only via `AI_SERVICE_TOKEN`, feature-flagged `FEATURE_AI=false` by default.
  - Endpoints: `/v1/pii-screen`, `/v1/extract-text`, `/v1/summarise-run`, `/v1/group-observations`.
  - Writes to `ai_drafts` table via Spring backend proxy; zero DB access credentials.

## Roles & User Flow

1. **Logo Splash**: 2.8s convergence animation with API pre-warming (`GET /health`), skip on keypress/tap.
2. **Login Screen**: Segmented control `[ Government Officer | Admin ]`, User ID + Password, uniform failure message ("Invalid ID or password").
3. **Admin**:
   - Creates Pilot Locations with auto-generated code (`SCH-JH-RAN-0007`).
   - Opens Audit Workspace: selects location, manages pages, fills question cards, attaches evidence files.
   - Submits all pages together (validates all scored questions answered or marked N/A with reason).
   - Triggers **Analyse**: runs deterministic `ScoringEngine`, stores immutable `analysis_run`, and automatically creates `delivery` records for all officers with matching district scope.
4. **Government Officer**:
   - Lands on **ACS Inbox**: unread deliveries first, followed by analysed locations in assigned district scope.
   - Opens **Location Details**: views ACS gauge (0–100), alert spectrum (Red to Dark Green), score deduction waterfall explaining point losses, per-section breakdown, and evidence gallery via signed URLs.
   - Read-only; zero visibility into other districts, draft audits, location names, officer rosters, or raw audit logs.

## Success Criteria

1. 100% parity with reference UI form in `ahfjhabsd/abhisaran-field-form-preview.html`.
2. Exact mathematical scoring integrity where the deduction ledger sums to `100 − ACS`.
3. Full test suite passing against real PostgreSQL using Testcontainers.
4. Zero PII leakage across all officer and public views.
