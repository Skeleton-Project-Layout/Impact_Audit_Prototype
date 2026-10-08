# Phase 3 Summary: Question Bank, Versioning & Rubric Tester

**Status**: COMPLETED  
**Completed Date**: 2026-10-08  
**Verification**: 29/29 Maven tests pass (PostgreSQL integration + pure unit tests), Vite frontend production build succeeds with 0 errors.

---

## 1. Objectives & Scope Delivered

Phase 3 established the core mathematical and question management foundation of the Abhisaran Platform:
1. **Database Schema & Question Seeding (V3 Flyway Migration)**:
   - Created `question_bank`, `question_versions`, `severity_weights`, `alert_bands`, and `scoring_settings` tables in PostgreSQL.
   - Seeded all **72 canonical audit questions** strictly aligned with `question_merge_map.csv` across the 4 key domains (`EDUCATION`, `WASH`, `HEALTH_NUTRITION`, `GOVERNANCE`).
   - Every question initialised with Version 1 snapshot, status `DEFAULT_PENDING_OWNER_REVIEW`, JSONB `fields_schema`, JSONB `rubric_config`, evidence upload flags, red flag logic, and suggested interventions.
   - Configured baseline severity weights (`CRITICAL`: 3×, `HIGH`: 2×, `MEDIUM`: 1×) and the 5-tier alert spectrum (`RED`, `ORANGE`, `AMBER`, `LIGHT_GREEN`, `DARK_GREEN`).

2. **Pure Deterministic Java `ScoringEngine` (Section 2 Rule 4 Compliant)**:
   - Designed completely isolated from Spring, database, system clock, random seeds, and network calls.
   - Fully implements all 7 rubric calculation models:
     - `GRID_AFU`: Available (1), Functional (1), Used (1) across components.
     - `CHECKLIST_YNP`: Yes (+1.0), Partial (+0.5), No (0.0), N/A (excluded from denominator).
     - `YESNO_WITH_COUNT`: Binary response + uptake count; 50% points penalty on available with zero uptake.
     - `RATING_1_5`: `(rating - 1) / 4 * max`; ratings $\le 2$ trigger red flags.
     - `PERCENT_THRESHOLD`: Standard and inverted benchmark thresholds with partial compliance margins.
     - `RATIO`: `(numerator / denominator) * max`; unassessed on zero denominator.
     - `NONE`: Informational unscored questions contributing 0 points to aggregations.
   - Implements **Section 9.5 Critical Clamping Rule**: Any Critical-severity question with an earned percentage $< 50\%$ is unconditionally clamped to the **RED** alert band.

3. **Backend Question Bank Service & REST APIs**:
   - `GET /api/v1/questions`: Multi-faceted querying by domain, section, severity, scored status, and search query.
   - `GET /api/v1/questions/:id`: Full question detail with latest version and immutable history trail.
   - `GET /api/v1/questions/:id/versions`: Complete immutable version timeline.
   - `PUT /api/v1/questions/:id`: Version bump mechanism ($N \to N+1$), preserving Version $N$ immutability and creating structured audit log records.
   - `POST /api/v1/questions/:id/approve-rubric`: Single-question approval transitioning status from `DEFAULT_PENDING_OWNER_REVIEW` to `ACTIVE`.
   - `POST /api/v1/questions/bulk-approve-rubrics`: Section 8 bulk owner review sign-off.
   - `POST /api/v1/questions/:id/test-rubric`: Sandbox test endpoint against active question versions.
   - `POST /api/v1/questions/test-rubric-ad-hoc`: Sandbox test endpoint for arbitrary user-defined rubrics.

4. **Frontend User Interfaces**:
   - `QuestionBankScreen.tsx`: Searchable 72-question browser, multi-attribute filter chips, version bump modal ($N \to N+1$), and version history audit drawer.
   - `RubricTesterScreen.tsx`: Interactive dual-mode sandbox (Question Bank mode + Ad-Hoc mode) supporting all 7 rubric types, live numerical score breakdown, 1-click simulation presets, red flag alerts, Section 9.5 clamp badges, and monospace mathematical formula working trails.
   - `RubricReviewScreen.tsx`: Section 8 Owner Review screen with summary metrics, bulk approval modal, per-question approval buttons, and 1-click sandbox testing.
   - Universal Navigation wired in `App.tsx` with light/dark theme persistence and responsive layouts.

---

## 2. Test Verification Matrix

| Test Suite | Tests Run | Pass | Fail | Execution Time | Scope |
|---|---|---|---|---|---|
| `ScoringEngineUnitTest` | 9 | 9 | 0 | 4 ms | Pure unit tests for all 7 rubrics, Section 9.5 clamping, and zero-denominator |
| `QuestionBankIntegrationTest` | 6 | 6 | 0 | 1.45 s | 72 questions seed verification, version bumps ($N \to N+1$), prior immutability, rubric test, bulk approval |
| `FacilityCodeGeneratorConcurrencyTest` | 1 | 1 | 0 | 10.31 s | Concurrent multi-threaded facility code generation |
| `CsvBulkUploadIntegrationTest` | 1 | 1 | 0 | 2.45 s | CSV facility batch ingest |
| `GeographyIntegrationTest` | 3 | 3 | 0 | 0.11 s | Hierarchy validation |
| `AuthIntegrationTest` | 9 | 9 | 0 | 0.52 s | Argon2id authentication, RBAC, lockout |
| **Total Maven Backend Suite** | **29** | **29** | **0** | **24.86 s** | **Full application test suite** |
| `npm run build (apps/web)` | 42 modules | 42 | 0 | 7.72 s | TypeScript typechecking + Vite production bundle |

---

## 3. Key Decisions & Technical Notes

- **Version Immutability**: `question_versions` rows are append-only. When a question is edited, a new row with `version_number = N + 1` is inserted, and `question_bank.latest_version_id` is updated. Existing audits referencing version $N$ will remain attached to version $N$.
- **Database JSONB State**: In `audit_log`, `before_state` and `after_state` must be valid JSON strings or null. Serialized Java maps using Jackson `objectMapper.writeValueAsString(...)` ensure compatibility with PostgreSQL's `jsonb` type.
- **Section 9.5 Clamp**: Implemented directly inside `AlertBandType.fromPercentage(percentage, isCritical)` ensuring consistent application across both single-question testing and future composite ACS calculations.
