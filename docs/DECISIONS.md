# Implementation Decisions Log — Abhisaran Platform

This log tracks architectural and implementation decisions, defaults chosen when specifications permit variance, and rationale.

| Decision ID | Date | Category | Summary | Status |
|-------------|------|----------|---------|--------|
| `DEC-001` | 2026-10-08 | Project Architecture | Adopted 10-phase GSD roadmap mirroring Section 17 with Phase 0 as dedicated specs approval phase | `ACCEPTED` |
| `DEC-002` | 2026-10-08 | UI Assets | Ingested `ahfjhabsd/` preview form, styles, and scripts as ground truth reference for audit workspace parity | `ACCEPTED` |
| `DEC-003` | 2026-10-08 | Question Seeding | `question_merge_map.csv` serves as the authoritative seed source for all 72 audit questions and 4 registry fields | `ACCEPTED` |
| `DEC-004` | 2026-10-08 | Monorepo Structure | Fixed structure: `apps/web` (React/Vite), `apps/api` (Spring Boot 3 / Java 21), `apps/ai` (FastAPI / Python 3.11), `shared/golden-vectors` | `ACCEPTED` |
| `DEC-005` | 2026-10-08 | Authentication Security | HttpOnly, Secure, SameSite=Lax session cookies selected over localStorage tokens to eliminate token exfiltration | `ACCEPTED` |
| `DEC-006` | 2026-10-08 | PII Ingestion Rejection | Strict server-side regex rejection (HTTP 422) on save for Aadhaar, 10-digit Indian phones, and email addresses | `ACCEPTED` |
| `DEC-007` | 2026-10-08 | Atomic Analysis & Delivery | Analysis run persistence, deduction ledger generation, and district officer deliveries executed in a single DB transaction | `ACCEPTED` |
| `DEC-008` | 2026-10-08 | Cold-Start Absorption | 2.8s SVG convergence logo animation pre-warms `/health` to absorb serverless container spin-up latencies | `ACCEPTED` |

---

## Detailed Decision Records

### DEC-001: 10-Phase GSD Structure with Explicit Gates
- **Context**: The project prompt mandates strict phase-by-phase execution, with zero build-ahead and approval gates between phases.
- **Decision**: Configured `.planning/config.json` with gates requiring explicit confirmation and established `.planning/ROADMAP.md` with Phases 0 through 9.
- **Label**: `IMPLEMENTATION DECISION`

### DEC-002: Ingestion of `ahfjhabsd/` as Parity Baseline
- **Context**: The user specified that the audit workspace must look and behave exactly like the reference preview in `ahfjhabsd`.
- **Decision**: Copied `ahfjhabsd` into workspace and created `docs/UI_PARITY_CHECKLIST.md` in Phase 0 to track pixel and behavioural parity at 390px and 1280px.
- **Label**: `IMPLEMENTATION DECISION`

### DEC-003: Authoritative Seed Model
- **Context**: `question_merge_map.csv` maps 112 source questions from the zip and CSV into 72 audit questions, 4 registry fields, and 1 retired item.
- **Decision**: Use `question_merge_map.csv` directly for database migrations and schema definitions, keeping all absorbed sub-fields as multi-field components on single question cards.
- **Label**: `IMPLEMENTATION DECISION`

### DEC-004: Monorepo Structure
- **Context**: Fixed stack mandate in Section 3: `apps/web`, `apps/api`, `apps/ai`, `shared/golden-vectors`, `docs`.
- **Decision**: Implement directory layout with unified root docker-compose and package scripts.
- **Label**: `IMPLEMENTATION DECISION`

### DEC-005: HttpOnly Session Cookies
- **Context**: Section 3 and Section 14 require strict security preventing credential theft or leakage.
- **Decision**: Store authentication tokens in httpOnly, Secure, SameSite=Lax cookies with 8h absolute and 30m idle timeouts.
- **Label**: `IMPLEMENTATION DECISION`

### DEC-006: Server-Side PII Rejection
- **Context**: Section 14 requires that Aadhaar-like 12-digit numbers, 10-digit Indian phones, or email addresses are never stored.
- **Decision**: Intercept answer payload saves on the server with authoritative regex validations; reject immediately with HTTP 422.
- **Label**: `IMPLEMENTATION DECISION`

### DEC-007: Atomic Analysis and Delivery
- **Context**: Section 11 states: "On a successful analysis the server, in the same transaction, creates a delivery row for every active officer... If the transaction fails nothing is half-written."
- **Decision**: Wrap analysis calculation, run recording, ledger item creation, and officer delivery insertions in a single `@Transactional` method.
- **Label**: `IMPLEMENTATION DECISION`

### DEC-008: Cold-Start Absorption via SVG Convergence Animation
- **Context**: Section 4 and Section 51 require that free-tier cold starts (30–60s) are handled gracefully without blank screens.
- **Decision**: The 2.8s SVG convergence splash animation concurrently triggers `GET /health` to wake up the backend container.
- **Label**: `IMPLEMENTATION DECISION`
