# Requirements Specification — Abhisaran Platform

## Functional Requirements (FR)

### FR-01: Authentication, Authorization & Bootstrap
- **FR-01.1**: Uniform login screen with segmented role selector `[ Government Officer | Admin ]`, User ID, and Password.
- **FR-01.2**: Generic error response ("Invalid ID or password") across all failure modes (wrong password, unknown ID, role mismatch, locked account) to prevent user enumeration.
- **FR-01.3**: Rate limiting enforcing temporary lockout after 5 consecutive failed attempts per (User ID + IP) within 15 minutes.
- **FR-01.4**: Zero backdoor users. The first admin is bootstrapped from environment variables `BOOTSTRAP_ADMIN_ID` and `BOOTSTRAP_ADMIN_PASSWORD` on initial startup with `must_change_password = true`. Bootstrap is a no-op if an admin account already exists.
- **FR-01.5**: Admin resets officer passwords by generating a single-use temporary password displayed once, forcing password update on initial login.

### FR-02: Geography & Pilot Location Management
- **FR-02.1**: Master reference tables for States and Districts (seeded from vetted public standards like LGD) with admin management capabilities.
- **FR-02.2**: Location types table supporting `SCHOOL` (`SCH`), `ANGANWADI` (`AWC`), `PHC / HEALTH FACILITY` (`PHC`), `HOSPITAL` (`HOS`), and `OTHER` (`OTH` with custom label).
- **FR-02.3**: System-generated immutable location codes formatted as `{PREFIX}-{STATE2}-{DIST3}-{SEQ4}` (e.g. `SCH-JH-RAN-0007`). Sequences increment per (type, district) and are never recycled or derived from facility names.
- **FR-02.4**: Restricted Registry (`pilot_location_registry`) sequestering facility names and official codes (e.g., UDISE+ / POSHAN ID), accessible only to Admin with mandatory audit logging. Supported by `STORE_LOCATION_NAMES=false` flag to omit name storage entirely.

### FR-03: Master Question Bank & Rubric Versioning
- **FR-03.1**: Question bank seeded from `question_merge_map.csv` (72 audit questions, 4 registry fields, 1 retired question; 31 scored by default, 42 with evidence upload enabled).
- **FR-03.2**: Support for all field types from reference UI: single/multi-line text, numbers, percentage, date, radio pills, checkbox chips, rating 1–5, checklist Yes/Partial/No rows, Available/Functional/Used (AFU) grids, ratio pairs, and ranked top-3.
- **FR-03.3**: Question versioning: any edit to questions, fields, or rubrics produces a new immutable version. Existing audit pages and analysis runs retain their original question-version snapshot.
- **FR-03.4**: Question Builder featuring live rubric tester (`POST /questions/:id/test-rubric`) executing the server-side `ScoringEngine`.
- **FR-03.5**: Rubric Review dashboard tracking seed items flagged `DEFAULT_PENDING_OWNER_REVIEW` for explicit stakeholder approval.

### FR-04: Field Audit Workspace & Reference UI Parity
- **FR-04.1**: Full visual and behavioural parity with `ahfjhabsd/abhisaran-field-form-preview.html` across mobile (390px) and desktop (1280px) breakpoints.
- **FR-04.2**: Sticky 56px header displaying brand mark, active location code (never name), save-status indicator (Saved / Saving / Not saved / Offline), PDF export menu, and ⋯ action menu.
- **FR-04.3**: Multi-page management per pilot location: Add Page, Duplicate Page (answers copied, evidence omitted), Delete Page (DRAFT only), Clear Page (DRAFT only).
- **FR-04.4**: Section navigation (Community Profile, Domain-specific, Community Interaction, Physical Verification, Summary) with question counts, progress strip, and search.
- **FR-04.5**: Offline-tolerant local autosave to IndexedDB with status distinction: "Saved on this device" vs. "Synced" (verified via HTTP 2xx only).
- **FR-04.6**: Multi-page submission validation: requires all applicable scored questions across all pages to be answered or explicitly marked "Not applicable" / "Could not be assessed" with mandatory reason.
- **FR-04.7**: Submission lock: submitted pages become immutable (`SUBMITTED`), location enters `READY_FOR_ANALYSIS`. Admin may reopen with mandatory logged reason.

### FR-05: Per-Question Evidence Management
- **FR-05.1**: Attachment controls rendered only for questions where `evidence_enabled = true`, displaying helper hints (e.g., "Admission register").
- **FR-05.2**: File constraints: JPG, PNG, WEBP, PDF up to 10 MB each, maximum 10 files per question per page.
- **FR-05.3**: Strict file sanitization: validation via magic bytes (mime type sniffing), automatic stripping of EXIF/GPS metadata, storage under random UUID keys.
- **FR-05.4**: Mandatory privacy attestation checkbox prior to first upload in session: *"No faces, children, names, Aadhaar/phone numbers or addresses are visible in this file."*
- **FR-05.5**: Secure file retrieval via backend-issued short-lived signed URLs (5-minute expiration) with district/role authorization validation.

### FR-06: Deterministic Scoring Engine (ACS 0–100)
- **FR-06.1**: Pure, deterministic Java implementation (`ScoringEngine`) without database, network, clock, or Spring framework dependencies.
- **FR-06.2**: Supported Rubric Evaluators:
  - `GRID_AFU`: Available = 1 pt, Functional = 1 pt (Functional contingent on Available). Used = +1 pt only when `score_used = true`.
  - `CHECKLIST_YNP`: Yes = 1, Partial = 0.5, No = 0, N/A = excluded.
  - `YESNO` / `YESNO_WITH_COUNT`: Yes = max points, Yes with zero uptake count = 50%, No = 0.
  - `RATING_1_5`: `earned = (rating − 1) / 4 × max`.
  - `PERCENT_THRESHOLD(T)`: ≥ T yields full; within partial margin (default 10) below T yields 50%; otherwise 0. Inverted polarity for mismatch thresholds (P13).
  - `RATIO`: `earned = max × min(1, numerator / denominator)`. Denominator 0 = Not assessed.
  - `NONE`: Informational item (never scored).
- **FR-06.3**: Severity Weighting: Critical = 3, High = 2, Medium = 1 (`weight`). Weighted points: `earned_w = earned × weight`, `max_w = max × weight`.
- **FR-06.4**: Multi-Page Pooling & Formula:
  $$\text{ACS} = \left(\frac{\sum \text{earned\_w}}{\sum \text{max\_w}}\right) \times 100$$
- **FR-06.5**: Mathematical Deduction Ledger: for each question instance, `lost_w = max_w − earned_w` and point contribution = `(lost_w / Σ max_w) × 100`. The sum of all ledger contributions must strictly equal `100 − ACS`.
- **FR-06.6**: Coverage & Edge Cases:
  - $\text{Coverage} = \frac{\text{Assessed Scored Questions}}{\text{Applicable Scored Questions}}$.
  - If coverage < 70% (`min_coverage`), ACS is badged as **PROVISIONAL**.
  - If zero questions are assessed, ACS evaluates to `null` ("Not calculable"), never 0.
- **FR-06.7**: Alert Spectrum & Cut-offs:
  - RED: 0–39.99 (Needs immediate attention)
  - ORANGE: 40–54.99 (Critical gaps)
  - AMBER: 55–69.99 (Needs improvement)
  - LIGHT GREEN: 70–89.99 (Good — a few things are off)
  - DARK GREEN: 90–100 (All good)
  - Critical question with `earned / max < 50%` is unconditionally classified as **RED**.

### FR-07: Analysis Execution & Automatic Delivery
- **FR-07.1**: Admin triggers analysis on `READY_FOR_ANALYSIS` location; creates immutable `analysis_run`, `analysis_items`, and `analysis_ledger` records.
- **FR-07.2**: In the exact same database transaction, creates a `delivery` record for every active Government Officer whose district scope includes the location's district.
- **FR-07.3**: If officer district scope is granted later, historical analysed locations in that district are immediately visible with back-filled deliveries.

### FR-08: Government Officer Portal & Shared Details View
- **FR-08.1**: Officer ACS Inbox displaying new/unread deliveries and all analysed locations within assigned scope.
- **FR-08.2**: Read-only shared Details View featuring ACS gauge, alert spectrum cards, deduction waterfall from 100 down to ACS, section breakdown, rubric working details, and authenticated evidence gallery.
- **FR-08.3**: Strict isolation: officers cannot view other districts, draft audits, location names, officer directories, or audit logs.

### FR-09: Assistive AI Microservice (`apps/ai`)
- **FR-09.1**: Isolated Python FastAPI microservice communicating server-to-server only via internal `AI_SERVICE_TOKEN`.
- **FR-09.2**: Feature-flagged `FEATURE_AI=false` by default. Core application remains 100% operational when AI is disabled or down.
- **FR-09.3**: Zero database credentials and zero write access to scores, weights, bands, or audit answers.
- **FR-09.4**: Endpoints for PII scanning (`/v1/pii-screen`), OCR extraction (`/v1/extract-text`), narrative drafting (`/v1/summarise-run`), and observation grouping (`/v1/group-observations`). Outputs stored in `ai_drafts` table with `status = DRAFT`.

---

## Non-Functional Requirements (NFR)

- **NFR-01 (Security & PII Prevention)**: Server-side regex gates reject save requests containing 12-digit Aadhaar numbers, 10-digit Indian phone numbers, or email addresses. Registered location names are masked into codes before leaving the server.
- **NFR-02 (Auditability)**: Append-only `audit_log` records all logins, lockouts, location/question mutations, officer scope modifications, page actions, analysis runs, registry lookups, and evidence accesses.
- **NFR-03 (Performance & Cold-Start)**: SVG convergence animation (~2.8s, 60fps on mobile) pre-warms backend `/health` endpoint to absorb 30–60s free-tier container cold starts.
- **NFR-04 (Database & Test Integrity)**: `spring.jpa.hibernate.ddl-auto = validate`. Migrations are immutable once committed. Integration tests execute against real PostgreSQL containers via Testcontainers.
- **NFR-05 (Accessibility & Usability)**: WCAG 2.1 AA compliance, full keyboard navigation, `prefers-reduced-motion` fallbacks for animations.
