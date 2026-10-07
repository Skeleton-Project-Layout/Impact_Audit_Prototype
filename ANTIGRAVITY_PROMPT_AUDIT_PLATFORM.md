# PROMPT FOR ANTIGRAVITY — ABHISARAN AUDIT & ACS PLATFORM (new project)

> **Attach to the workspace before starting:**
> 1. `ahfjhabsd.zip` — **UI reference.** Unzip it and open `abhisaran-field-form-preview.html` in a browser. The audit screen must look and behave like this (Section 7).
> 2. `Abhisaran_Master_45_Questions.csv` — 45 questions with Severity, Evidence, Red-Flag Logic, Suggested Intervention.
> 3. `question_merge_map.csv` — the **de-duplicated master question bank** (zip's 67 + CSV's 45 → 72 audit questions + 4 registry fields + 1 retired). Treat it as the seed data. Every one of the 112 source questions appears in it exactly once.

---

## 0. HOW YOU MUST WORK

1. **Read the three attachments fully before writing code.** Then produce `docs/` (architecture, ER diagram in Mermaid, scoring spec, UI-parity checklist, API list) and **stop for my approval**.
2. Build **phase by phase** (Section 17). At the end of each phase: run all tests, run migrations on a real PostgreSQL, boot the app, and report exactly what exists and what doesn't. **Stop at each gate and wait for "continue".** Never build ahead.
3. If something is unspecified, pick the default given here (marked **DEFAULT**), log it in `docs/DECISIONS.md` with the label `IMPLEMENTATION DECISION`, and keep going. Don't invent business rules silently.
4. Ask me questions only at phase gates.

---

## 1. PRODUCT IN ONE PARAGRAPH

A two-role web app. **Admin** creates *pilot locations* (a school, Anganwadi, hospital, or anything else), fills **audit pages** for them using a mobile-friendly field form, uploads optional evidence per question, submits all pages of a location together, then presses **Analyse** on the dashboard. A **deterministic scoring engine** turns the answers into an **ACS (Abhisaran Continuity Score, 0–100)** with a full red→green alert spectrum and an exact trail of *which answers lost how many points*. Each analysed result is delivered automatically to every **Government Officer** whose assigned district(s) contain that location. Dashboards and officer views show **location codes only — never names**.

Flow: `Logo splash → Login (Government Officer | Admin) → Admin: [Audit] or [Dashboard]  /  Officer: ACS inbox`

---

## 2. NON-NEGOTIABLE ENGINEERING RULES
(These exist because a previous build of this product broke every one of them.)

1. **No fake data, ever.** Every number, name, officer, score, strength or gap on screen comes from the database. Empty state = an empty-state message, never placeholder numbers. A `seed:demo` script may create rows flagged `is_demo=true`; the UI shows a visible "DEMO DATA" banner and production refuses to run it.
2. **No backdoor credentials.** No default/shared password in code, migrations or comments. No seeded users. The first admin is created once from env vars `BOOTSTRAP_ADMIN_ID` / `BOOTSTRAP_ADMIN_PASSWORD`, flagged `must_change_password`, and the bootstrap is a no-op if any admin exists.
3. **No default secrets.** App refuses to start if `JWT_SECRET`/`SESSION_SECRET` is missing or < 32 bytes. No `localhost` URLs in frontend code; use a relative `/api` base or `VITE_API_BASE_URL`.
4. **Scores are never produced by AI.** The scoring engine is a pure, deterministic Java class (`ScoringEngine`, no Spring/DB/clock/random/network inside it). The Python AI service (Section 3A) has **no write path** to scores, bands, flags, answers, evidence status or any stored result; its outputs are always `DRAFT`, stored in a separate table, and never feed back into scoring.
5. **Scoring references stable option IDs, never string matching.** (No `contains("FORMAL")`-style logic — "INFORMAL" would match.)
6. **Missing ≠ zero.** An unanswered question is *Not assessed* (excluded and reported as coverage); a real "No / Not available" answer is a real 0. Never silently convert one into the other.
7. **Migrations are immutable once committed.** Never edit an applied migration — add a new one. CI fails if a committed migration file's checksum changes.
8. **Tests run against real PostgreSQL with the real Flyway migrations** (Testcontainers). Not H2, not mocks, for anything involving persistence, rollbacks, or security. `spring.jpa.hibernate.ddl-auto=validate`; JSONB columns mapped with `@JdbcTypeCode(SqlTypes.JSON)`.
9. **Never report success that didn't happen.** A failed/404/403 sync is an error, not "synced". A deletion screen/certificate must correspond to rows actually deleted. A transaction that throws must not leave a half-record or lose an audit entry.
10. **Server is the authority.** RBAC, scoring, status transitions and visibility rules are enforced on the server. The browser never computes a stored or displayed score; the rubric tester in the question builder calls the API (`POST /questions/:id/test-rubric`), which runs the same `ScoringEngine`.

---

## 3. TECH STACK AND REPO (FIXED — do not substitute)

- **Frontend:** React + TypeScript + Vite (`apps/web`). Two shells inside one app: public/login + admin + officer, with shared design system, API client, permissions.
- **Backend (system of record and rule authority):** **Java 21 + Spring Boot 3.x** (`apps/api`, Maven): Spring Web, Spring Data JPA, **Spring Security**, **Flyway**, Bean Validation, Actuator. Packages: `auth, users, geography, locations, questions, audit (pages/answers), evidence, scoring, analysis, delivery, officers, registry, auditlog, ai (client), common`.
- **AI service (assistive only):** **Python 3.11 + FastAPI** (`apps/ai`). See Section 3A.
- **Database:** PostgreSQL (Supabase-hosted in production, pooler connection string). **Evidence files** in a private Supabase Storage bucket, served only through backend-issued short-lived signed URLs (5 min) after an authorization check.
- **Shared test data:** `shared/golden-vectors/*.json` — scoring input/expected-output vectors used by the Java tests (and by the AI service's isolation tests).
- **Auth:** Spring Security; **Argon2id** (or BCrypt cost ≥ 12) password hashing; httpOnly + Secure + SameSite=Lax session cookie or short-lived JWT in an httpOnly cookie; CSRF protection; 8 h absolute / 30 min idle expiry; login rate limiting stored in the DB (or Bucket4j). Method-level `@PreAuthorize` **plus** object-level checks in services (district scope for officers).
- **Deploy:** Dockerfiles for `api`, `ai`, `web`; `render.yaml` + `docker-compose.yml` for local. Free-tier cold starts (30–60 s) must be handled gracefully by the splash/loader ("Waking up the server…", retry with backoff, never a blank screen). Spring must bind `server.port=${PORT:8080}`; Actuator `/actuator/health` public with `show-details=never`; all other actuator endpoints authenticated or disabled. Add `org.flywaydb:flyway-database-postgresql` (Postgres 16/17 support). Flyway `validate-on-migrate=true`; never `repair` in production code paths.
- All UI strings in a single i18n file (English now; Hindi later).

---

## 3A. AI SERVICE (Python / FastAPI) — ASSISTIVE ONLY

**Purpose:** help humans, never decide. Spring calls it **server-to-server only** (the browser never talks to it); it is not publicly routable; it requires an internal shared token (`AI_SERVICE_TOKEN`); timeouts ≤ 8 s; if it is down, every audit/score/dashboard feature still works (the AI features simply show "unavailable"). Feature-flagged: `FEATURE_AI=false` by default.

**Allowed endpoints (all responses carry `model/service id, timestamp, input refs (IDs only), output, quality metadata, status=DRAFT`):**
- `POST /v1/pii-screen` — scans free text (and OCR'd evidence text) for Aadhaar-like numbers, mobile numbers, e-mails and likely person names; returns *suspected* findings. Used as an extra warning layer; the Java regex check remains the authoritative gate.
- `POST /v1/extract-text` — OCR / text extraction from an evidence image or PDF (to help the admin read a register photo). Output is a suggestion shown next to the file, never stored as an answer automatically.
- `POST /v1/summarise-run` — a plain-language narrative of an **already-computed** analysis run, built only from the deduction ledger and alerts passed in. Labelled "AI-drafted summary — not an official finding".
- `POST /v1/group-observations` — groups similar free-text notes/gaps for readability.

**Forbidden for the AI service (enforce with tests):** computing or adjusting any ACS, earned/max points, band, colour, severity, weight, coverage; marking evidence verified; creating/changing questions, rubrics or alerts; choosing districts/officers; any write to the main database (it has **no DB credentials at all**). Spring stores AI drafts in `ai_drafts` (separate table, status `DRAFT|ACCEPTED|REJECTED`); an admin must explicitly accept a draft, and even then it only appears as labelled narrative text — it never alters scoring tables. The AI service receives **only** code-based, PII-screened content (never names/registry data).
- Add `ai_drafts` to the data model and the `/api/v1/ai/*` proxy endpoints to Section 15 (admin-only).

---

## 4. LOGO SPLASH + LOADING ANIMATION

**Concept: convergence.** *Abhisaran* (अभिसरण) means convergence.

- **Logo mark (SVG, you design it):** an abstract "A" whose two strokes and crossbar are three *streams* converging on one bright apex node; thin concentric ring around it. Wordmark `ABHISARAN` (wide letter-spacing, semibold) with a small `अभिसरण` beneath. Colours from the zip's tokens: accent `#0b6b5c` / `#3fb8a2`, soft `#dff0ec`, ink `#15231f`, dark bg `#0e1513 → #16211e`.
- **Splash sequence (~2.8 s):** (1) dark gradient bg fades in; (2) the three strokes draw in with `stroke-dashoffset`; (3) 12–16 small light particles travel along curved paths and converge into the apex; (4) apex flashes, ring pulses once; (5) letters of `ABHISARAN` rise in with 40 ms stagger, then `अभिसरण` fades in; (6) hold 0.5 s → cross-fade to login.
- Plays once per browser session (`sessionStorage`). Tap/click/Enter/Esc skips after 600 ms. While it plays, the app pre-warms the API (`GET /health`) so a cold server wakes up behind the animation.
- `prefers-reduced-motion`: static logo with a 400 ms fade; no particles.
- **Reusable `<AbhisaranLoader />`** (looping variant: particles orbit and converge, mark gently breathes) for route changes, data loading and the long **"Analysing…"** state. It accepts a status line (real steps, e.g. "Scoring page 2 of 4…").
- Implementation: inline SVG + CSS/Web Animations (or Framer Motion). **No video/GIF/Lottie file.** < 20 KB, 60 fps on a low-end phone, `role="status"`, `aria-live="polite"`. Also generate the favicon/PWA icon from the mark.

---

## 5. LOGIN

- One screen after splash with a **segmented control: `Government Officer | Admin`**. Fields: **User ID**, **Password** (show/hide, caps-lock hint). Button shows the loader while submitting.
- Admin tab accepts only admin accounts; Officer tab only officer accounts. Any failure (wrong ID, wrong password, wrong tab, disabled account) returns the **same generic message** "Invalid ID or password." (no account enumeration).
- Rate limit: 5 failures / 15 min per (ID + IP) → temporary lockout; every attempt audit-logged.
- No self-signup, no email "forgot password". Admin resets an officer's password (generates a one-time temporary password shown once; forced change at next login). Password policy ≥ 10 chars.
- After login: Admin → **Admin Home**; Officer → **ACS Inbox** (Section 12).

---

## 6. ADMIN HOME

Two large cards:
1. **Open Audit** → pilot-location picker (search by code, filters) → **Audit Workspace** (Section 7).
2. **Open Dashboard** → Dashboard (Section 10).

Header: user, theme toggle (light/dark, same tokens as the zip), logout.

---

## 7. THE AUDIT WORKSPACE — "exactly like the zip"

**Open `ahfjhabsd/abhisaran-field-form-preview.html`, `src/template.html`, `src/styles.css`, `src/app.js`, `src/pdfwriter.js` and replicate the experience.** Reuse the CSS variables and layout. At the phase gate, give me **side-by-side screenshots** (reference vs. yours) at 390 px and 1280 px, plus a ticked parity checklist.

**Parity checklist (must all be true):**
- Sticky header (56 px): brand block, **save-status pill** (Saved / Saving… / Not saved), **PDF button with menu** ("Download Current Page" / "Download All Pages as One PDF"), **⋯ menu**.
- ⋯ menu: **+ Add Audit Page**, **Duplicate Current Page** (independent copy incl. answers, *not* evidence), **Export Data** (JSON backup), **Import Data**, **Delete This Page**, **Clear Current Page** (delete/clear only for pages still in DRAFT, with the zip's confirmation dialog; audit-logged).
- **Page tabs** strip: "Page 1, Page 2 …" — all pages belong to the **one selected pilot location** (its code shown in the header, never its name).
- **Section navigator** (dropdown/list with question counts and answered counts), **progress strip** ("Question n of N · x % complete — y of N answered"), **question search** (by word or number).
- **Question cards**: number badge, question text, grey hint line, then fields rendered by type exactly as in the zip: text, number (decimal/max), textarea, radio pills (Yes/No), checkbox chips, **Available / Functional / Used checkbox grids**, numeric tables.
- Footer: **Previous · Save · Next**. Toasts. Responsive (strip 112 px → 58 px under 700 px). Light/dark theme.
- **Offline-tolerant autosave** to IndexedDB with status "Saved on this device" → "Synced". Sync only reports success on a real 2xx. Failed syncs stay queued and visible with a retry button.
- PDF export reproduces the zip's behaviour (current page / all pages) and shows the **location code only**.

**What changes vs. the zip:**
- Questions are **loaded from the question bank** (Section 8), filtered by the location type's *domain* (SCHOOL / ANGANWADI / HEALTH / GENERAL). Sections shown: Community Profile, the location's own domain section, Community Interaction, Physical Verification (relevant items), Summary.
- **A pilot location can have multiple audit pages.** Each page = one complete pass of the form. All pages are pooled when scoring (Section 9).
- **Per-question evidence upload** — only on questions where `evidence_enabled = true` (Section 8). The question card shows an **"Attach evidence"** control with the CSV's evidence hint (e.g. "Admission register") as helper text.
- **Identification questions (school name/UDISE, Anganwadi name/code, facility name, village) are NOT in the form** — they belong to the restricted pilot-location registry (Section 6/Section 14).
- Zip Q60 ("Photographs collected?") is retired — replaced by the per-question evidence feature.
- Every scored question can also be marked **"Not applicable"** or **"Could not be assessed"** — both require a short reason (see Section 9.4).

**Evidence upload rules:**
- jpg / png / webp / pdf, ≤ 10 MB each, up to 10 files per question per page (configurable). Validate by magic bytes, not extension. **Strip EXIF/GPS** from images. Store under a random UUID name (original filename discarded).
- Before the first upload in a session, require the tick-box: *"No faces, children, names, Aadhaar/phone numbers or addresses are visible in this file."*
- Thumbnails + lightbox. Evidence can be removed only while its page is DRAFT.
- Offline: queue uploads and retry; show pending count.

**Submitting:**
- Button **"Submit all pages for {CODE}"**. Server validates every page and shows a report: unanswered scored questions per page. Submission is allowed only when each such question is answered or explicitly marked N/A / Could-not-assess with a reason.
- On success: all pages of the location become **SUBMITTED (locked)**, the location status becomes **READY_FOR_ANALYSIS**, and a `submission` record stores who/when/which pages/which question-version IDs.
- Admin may **Reopen** with a mandatory reason (audit-logged) → pages return to DRAFT; after re-submission the location shows "Re-analysis needed" until analysed again.

---

## 8. QUESTION BANK

**Seed from `question_merge_map.csv`** (72 audit questions; 31 scored by default — 15 Critical, 13 High, 3 Medium; 42 with evidence upload on by default). Columns map to the model: `merged_id, applies_to, section, canonical_text, response_type, severity, scored_default, rubric_type_default, evidence_upload_default, evidence_hint, red_flag_logic, suggested_intervention, source refs`. Where a merged question absorbed zip sub-questions (see `merge_action = MERGED` and `notes`), render **all the sub-fields as fields of one question card** in the zip's style (e.g. S11 = water + toilets boys/girls/CWSN + handwashing in one Available/Functional grid).

Rows with `MOVED_TO_REGISTRY` become registry fields; `RETIRED` is not imported.

**Admin Question Builder (Dashboard → Question Bank):**
- Add / edit / deactivate (never hard-delete). Fields: text, hint, section, **applies to** (domains), severity (Critical/High/Medium), **field list** (text, textarea, number, percentage, date, radio, checkbox chips, rating 1–5, checklist Yes/Partial/No rows, Available/Functional/Used grid rows+columns, ratio pair, top-3), **scored? (yes/no)**, rubric type + parameters, red-flag logic text, suggested intervention, optional per-band alert message overrides, order.
- **☐ "Allow evidence upload for this question"** tick box (+ optional hint text, max files, optional "evidence required"). Unticked = no upload control appears.
- **Live rubric tester:** enter a sample answer → shows points earned/max and the resulting colour using the real engine.
- **Versioning:** every edit creates a new version. Pages snapshot the question versions when created; submitted audits and past analyses are never altered by later edits. Show a diff and "used by N submitted audits".
- Import/Export the bank as CSV/JSON. Rubric defaults from the merge map are flagged `DEFAULT_PENDING_OWNER_REVIEW` and listed on a **Rubric Review** screen so I can approve them.

---

## 9. SCORING ENGINE — THE ACS (deterministic; implement exactly)

### 9.1 Rubric types (per scored question)
Each rubric maps an answer to `earned` and `max` **raw points**:
| Rubric | Rule (DEFAULT — all parameters editable + versioned) |
|---|---|
| `GRID_AFU` | Per row: **Available = 1 pt, Functional = 1 pt** (Functional only counts if Available). "Used" = +1 pt only when `score_used=true` (materials/digital questions); otherwise recorded but not scored. *Example: Drinking water — available but not functional ⇒ **1 of 2**.* |
| `CHECKLIST_YNP` | Per row: Yes = 1, Partial = 0.5, No = 0, N/A = excluded (max not counted). |
| `YESNO` / `YESNO_WITH_COUNT` | Positive answer = max; Yes-but-zero-uptake (count field) = 50 %; negative = 0. Polarity configurable. |
| `RATING_1_5` | `earned = (rating − 1) / 4 × max` (so ≤ 2 = red, matching the CSV's "≤2" flag). |
| `PERCENT_THRESHOLD(T)` | ≥ T ⇒ full; within `partial_margin` (DEFAULT 10 pts) below T ⇒ 50 %; else 0. For "mismatch ≤ 10 %" (P13) the polarity is inverted. |
| `RATIO` | `earned = max × min(1, numerator / denominator)` (e.g. working ÷ sanctioned). Denominator 0 ⇒ Not assessed. |
| `NONE` | Informational; never scored, shown with a grey "Info" chip. |

The seed rubric/threshold per question is the `rubric_type_default` column of the merge map. Questions with `scored_default = N` that the CSV flags but gives no numeric threshold (e.g. S05) stay informational until I set a threshold in the builder.

### 9.2 Severity weights
`weight(Critical)=3, weight(High)=2, weight(Medium)=1` (**DEFAULT**, stored in a versioned `severity_weights` table).
`earned_w = earned × weight`, `max_w = max × weight`.

### 9.3 ACS
Across **all submitted pages of the location**, over every applicable, assessed, scored question instance:

```
ACS = ( Σ earned_w / Σ max_w ) × 100          (store exact decimal; headline = round-half-up integer; details = 1 decimal)
```
**Deduction ledger (mandatory):** for each instance, `lost_w = max_w − earned_w` and its ACS-point contribution `lost_w / Σ max_w × 100`. **The ledger must sum to exactly `100 − ACS`** (a test asserts this). This is the answer to "what made it lose 30 points?": show the ledger sorted by contribution, each row with question, answer summary, `earned/max` raw, weight, ACS points lost, rubric rule text, page number and evidence links.

*Worked example to include as a unit test:* location with 4 pages where the total weighted deduction is 10 of 100 weighted points ⇒ ACS = 90.

### 9.4 Not applicable / not assessed / coverage
- **Not applicable** (reason required): removed from numerator **and** denominator.
- **Could not be assessed** (reason required) and **unanswered**: also excluded, but counted in **coverage = assessed scored ÷ applicable scored**. Coverage is displayed next to every ACS in every view.
- If coverage < `min_coverage` (DEFAULT 70 %), the ACS is shown as **PROVISIONAL**.
- If nothing is assessed ⇒ ACS = `null` and the UI shows "Not calculable" (never 0).

### 9.5 Alert spectrum (red → green)
Same cut-offs for the overall ACS and for each question's `earned ÷ max` (**DEFAULT**, table `alert_bands`, versioned):
| Band | Range | Label |
|---|---|---|
| **RED** | 0–39.99 | Needs immediate attention |
| **ORANGE** | 40–54.99 | Critical gaps |
| **AMBER** | 55–69.99 | Needs improvement |
| **LIGHT GREEN** | 70–89.99 | Good — a few things are off |
| **DARK GREEN** | 90–100 | All good |

Extra rule: a **Critical-severity** question with `earned ÷ max < 50 %` is always **RED**. Show the bands as discrete chips *and* as a continuous red→green gradient gauge with a marker at the ACS.

### 9.6 Alert text
Each scored question instance yields a deterministic alert message: per-band override text if present, else the template `"{short label}: {answer summary}. {red-flag logic, when triggered}. Suggested action: {suggested_intervention}."` (seeded from the CSV columns). Messages use the **location code**, never a name.

### 9.7 Output record (`analysis_run`, immutable)
Stores: location, submission ID, engine version, question-version IDs, rubric/weight/band versions used, per-instance results (earned, max, weight, band, rule text, evidence IDs), ledger, ACS exact + rounded, band, coverage, pooled-pages count, per-page ACS, per-section ACS, `created_by`, `created_at`. **Re-analysis creates a new run; old runs are kept** (history visible to admin). Option "Re-analyse with current rubrics" is explicit; default uses the submission's snapshot.

---

## 10. ADMIN DASHBOARD

Left nav: **Overview · Pilot Locations · Question Bank · Government Officers · Registry (restricted) · Audit Log · Settings**.

**Overview / Pilot Locations list** — table/cards with: **code**, **type chip**, **state**, **district**, **pages**, **status** (Registered / Draft / **Ready to analyse** / **Analysed** / Re-analysis needed), **ACS chip** (colour + number + coverage) when analysed, last submitted, last analysed, actions **[Analyse] [View details] [Open audit]**.
- **Filters:** state → district (dependent), pilot-location type, status; search by code. Summary tiles (counts by status). Bulk **Analyse selected**.
- Default sort = code. **No ACS sorting, no leaderboard, no "top/bottom N", no rank column** (non-ranking principle carried over from the AEHT framework; lifting it would be a deliberate later change).
- **Analyse** → calls the API → shows `<AbhisaranLoader/>` with real step text → on completion the row flips to Analysed with its ACS, and the delivery to officers happens (Section 12).

**View details (admin & officer share this component; officer is read-only):**
1. Header: code, type, state/district, analysed at, run ID, pages pooled, **coverage**, PROVISIONAL badge if relevant.
2. **ACS gauge** (spectrum) + label + **"Explain score"** panel: the formula with real numbers, and a **waterfall from 100 down to the ACS** built from the deduction ledger.
3. **Alerts grouped by spectrum level** (Red → Dark green) with count chips as filters. Each alert card: colour chip, severity chip, short label, answer summary, `lost X of Y points (−Z ACS pts)`, alert message, suggested action, page reference, **evidence thumbnails**.
4. **Per-section breakdown** with colours.
5. Per-question expandable rows with the rubric working shown (e.g. "Available ✔ +1 · Functional ✘ +0 = 1/2 × weight 3 = 3/6").
6. **Evidence gallery** with lightbox (images + PDFs), via signed URLs after an authorization check.
7. Run history (admin only) and **Download ACS report (PDF)** — code only.

**Pilot location creation (Dashboard → Pilot Locations → New):**
- **Type first** (required): SCHOOL (`SCH`), ANGANWADI (`AWC`), PHC / HEALTH FACILITY (`PHC`), HOSPITAL (`HOS`), OTHER (`OTH`, with a free-text label such as "Ration shop"). Types live in a table (`prefix`, `label`, `domain`) so admin can add more; each maps to a question *domain* (HEALTH covers PHC and Hospital; OTHER maps to GENERAL).
- State, district (from the reference data), optional restricted name and official code (UDISE+/centre code).
- **System-generated immutable code:** `{PREFIX}-{STATE2}-{DIST3}-{SEQ4}` e.g. `SCH-JH-RAN-0007`. The prefix tells which body is affected; the sequence is per (type, district), never reused, **never derived from the name**.

**Government Officers (Dashboard → Government Officers):**
- Create officer: auto ID (`GOV-00001`) or admin-chosen unique ID, display name, designation (optional), **one-time temporary password**, **assigned districts** (multi-select across states; "all districts in this state" shortcut). Edit scope, reset password, disable/enable. Every change is audit-logged and takes effect immediately.
- **Access = read-only on analysed results (ACS, details, evidence) of locations whose district is in the officer's scope.** Nothing else.

**Registry (restricted, admin only):** code ↔ name/official code, for field logistics. Each view is audit-logged. Env flag `STORE_LOCATION_NAMES=false` disables storing names entirely.

---

## 11. ANALYSE → DELIVER (automatic)

On a successful analysis the server, in the same transaction, creates a `delivery` row for **every active officer whose district scope includes the location's district**: `(officer_id, analysis_run_id, delivered_at, read_at=null)`. If scope is granted later, the officer can see existing analysed results in that district immediately and gets a back-filled delivery. Authorization is always by **scope**, deliveries only drive the inbox/unread badge. If the transaction fails nothing is half-written.

---

## 12. GOVERNMENT OFFICER PORTAL

- **ACS Inbox:** new/unread deliveries first, then all analysed locations in scope. Cards/rows: code, type, state/district, ACS chip (colour + number), coverage, analysed date, unread dot.
- Filters: state, district (only those in scope), type. Search by code. Same no-ranking rule.
- **View details:** the same component as the admin's, read-only, with evidence gallery.
- An officer **cannot** see: other districts, unanalysed/draft locations, location names/registry, other officers, audit log, question-bank editing, or raw drafts.

---

## 13. DATA MODEL (normalised; design the ER diagram in docs)

`users` (id, login_id, role ADMIN|OFFICER, display_name, designation, password_hash, must_change_password, active) · `states`, `districts` (state_id, code3, name, **seeded from a vetted public dataset such as LGD; admin can add/edit**) · `officer_districts` (officer_id, district_id) · `pilot_location_types` · `pilot_locations` (code UNIQUE, type_id, district_id, status, is_demo, created_by) · `pilot_location_registry` (location_id, name, official_code) · `question_bank` / `question_versions` (fields JSONB, rubric JSONB, severity, applies_to, evidence_enabled, hint, alert overrides, status) · `severity_weights`, `alert_bands`, `scoring_settings` (versioned) · `audit_pages` (location_id, number, status, question_version_ids) · `answers` (page_id, question_version_id, value JSONB, na_reason, not_assessed_reason) · `evidence` (answer/question ref, storage_key, mime, size, uploaded_by) · `submissions` · `analysis_runs`, `analysis_items`, `analysis_ledger` · `deliveries` · `ai_drafts` (target_type, target_id, service_id, input_refs, output, quality, status, accepted_by) · `audit_log` (append-only: who, role, action, object, before, after, reason, ip, at) · `login_attempts`. No table stores beneficiary or staff personal data.

---

## 14. PRIVACY & VISIBILITY RULES

1. **Codes only** on every dashboard, officer view, PDF, export, URL, page title and API response outside the admin-only Registry.
2. **Free-text masking:** before any answer text leaves the server to a dashboard/officer/PDF, replace occurrences of the location's registered name tokens/official code with its code. **On save**, reject text containing Aadhaar-like 12-digit numbers, 10-digit Indian mobile numbers or e-mail addresses, with a clear message (do not store them).
3. Evidence: private bucket, signed URLs, authorization checked every request, EXIF stripped, upload attestation tick-box.
4. Append-only audit log for: login/fail/lockout, location create/edit, question create/edit/deactivate, officer create/scope-change/reset/disable, page create/delete/clear, submit, reopen, analyse, registry view, evidence download.

---

## 15. API (REST, `/api/v1`, every route RBAC-checked server-side)

`POST /auth/login` · `POST /auth/logout` · `POST /auth/change-password` · `GET /health`
Admin: `GET/POST /locations` · `GET /locations/:id` · `POST /locations/:id/pages` · `PUT /pages/:id/answers` · `POST /pages/:id/duplicate` · `DELETE|POST /pages/:id` (delete/clear while DRAFT) · `POST /pages/:pageId/evidence` · `DELETE /evidence/:id` (DRAFT only) · `POST /locations/:id/submit` · `POST /locations/:id/reopen` · `POST /locations/:id/analyse` · `POST /locations/analyse-bulk` · `GET /locations/:id/runs` · `GET/POST/PUT /questions` · `POST /questions/:id/test-rubric` · `GET/POST/PUT /officers` · `POST /officers/:id/reset-password` · `GET /registry/:locationId` · `GET /audit-log` · `GET /reference/states|districts|location-types`
AI (admin only, proxied by Spring, flag-gated): `POST /ai/extract-text/:evidenceId` · `POST /ai/summarise-run/:runId` · `POST /ai/drafts/:id/accept|reject`
Officer: `GET /me/inbox` · `GET /me/results` · `GET /me/results/:runId` · `GET /me/results/:runId/evidence/:id`
Shared read model for details: `GET /results/:runId` (server decides what the caller may see).

---

## 16. TESTS THAT MUST EXIST AND PASS (real PostgreSQL)

- **Scoring (JUnit 5 pure unit tests + golden vectors from `shared/golden-vectors` with explicit numbers):** water *available-not-functional = 1/2*; GRID with/without `score_used`; CHECKLIST Yes/Partial/No/N-A; RATING 1–5 mapping; PERCENT_THRESHOLD incl. partial margin and inverted polarity; RATIO with denominator 0; severity weights; **ledger sums to exactly 100 − ACS**; N/A rebasing; unanswered/could-not-assess excluded and counted in coverage; PROVISIONAL below min coverage; `null` ACS when nothing assessed; band edges (39.99/40, 54.99/55, 69.99/70, 89.99/90); **Critical-<50 % ⇒ RED**; multi-page pooling; determinism (same input ⇒ identical output 1 000×); no `contains()`-style matching (options are IDs).
- **Versioning:** editing a question never changes a submitted audit or an existing run; re-analyse creates a new run.
- **RBAC / visibility:** officer cannot read other districts, unanalysed locations, registry, names, audit log; scope change takes effect immediately; admin-only routes reject officers; **no API response outside the registry ever contains a location name**; free-text masking works; Aadhaar/phone/e-mail rejected on save.
- **State machine:** DRAFT → SUBMITTED → ANALYSED → REOPENED → re-submitted → "Re-analysis needed"; submitted pages are immutable; delete/clear only in DRAFT.
- **Transactions:** a failed analysis leaves no partial run/deliveries; an upload rejection or PII rejection still records its audit entry (assert rows exist **after** the exception, against real Postgres).
- **Auth:** no default credentials exist; bootstrap is once-only; lockout after 5 failures; generic error message; forced password change; app refuses to boot without secrets.
- **Evidence:** wrong magic bytes rejected; EXIF stripped; signed URL expires; officer outside scope gets 403/404.
- **Migrations:** CI fails if a committed migration's checksum changes; fresh-DB and upgrade paths both pass.
- **AI isolation (Java + Python):** the AI service has no DB credentials; no scoring/answer/evidence-status table is writable by the AI client class (architecture test); AI outputs are always `DRAFT`; accepting a draft changes no score; with `FEATURE_AI=false` or the service down, all core flows still pass; the AI service never receives location names or registry data.
- **E2E (Playwright):** splash → admin login → create location → fill 2 pages with evidence → submit → analyse → officer (with matching district) logs in, sees the ACS, opens details and evidence; second officer (other district) sees nothing.
- **Accessibility/perf:** keyboard navigable, reduced-motion respected, splash/loader ≥ 55 fps on throttled CPU.

---

## 17. PHASES AND GATES (stop after each)

0. **Docs only** (read attachments; architecture, ERD, scoring spec, UI-parity checklist, API) → my approval.
1. **Foundation:** monorepo, CI, migrations, auth, RBAC, first-admin bootstrap, **splash + loader + login** (both roles), health/cold-start handling. *Gate: login works for both roles; no default credentials; animation demo.*
2. **Reference data & locations:** states/districts, location types, location CRUD with generated codes, Admin Home.
3. **Question bank:** import from `question_merge_map.csv`, versioning, builder with evidence tick-box, rubric tester, Rubric Review screen.
4. **Audit workspace** with zip parity, pages, autosave/offline, evidence upload, submit/reopen. *Gate: side-by-side screenshots + parity checklist.*
5. **Scoring engine + analysis + details view** (spectrum, ledger/waterfall, alerts, evidence), run history.
6. **Officers + scope + deliveries + officer portal.**
7. **Dashboard filters, bulk analyse, PDF reports, audit-log screen, registry, polish, accessibility.**
8. **AI assistive service (Python/FastAPI):** PII-screen, text extraction, run-summary drafts, `ai_drafts` table, accept/reject UI, isolation tests. *Gate: everything works with `FEATURE_AI=false` and with the service stopped.*
9. **Hardening & deploy:** security review, full test suite on Postgres, `render.yaml`, runbook, backup/restore notes.

---

## 18. FINAL PRINCIPLE

Every number a user sees must be traceable to **stored answers → a versioned rubric → the deterministic engine → a ledger line**. If you are unsure, choose the option with **no invented data, no hidden scores, no names exposed, and no success message that isn't true** — and ask me at the next gate.
