# Implementation Decisions Log — Abhisaran Platform

This log tracks architectural and implementation decisions, defaults chosen when specifications permit variance, and rationale.

| Decision ID | Date | Category | Summary | Status |
|-------------|------|----------|---------|--------|
| `DEC-001` | 2026-10-08 | Project Architecture | Adopted 10-phase GSD roadmap mirroring Section 17 with Phase 0 as dedicated specs approval phase | `ACCEPTED` |
| `DEC-002` | 2026-10-08 | UI Assets | Ingested `ahfjhabsd/` preview form, styles, and scripts as ground truth reference for audit workspace parity | `ACCEPTED` |
| `DEC-003` | 2026-10-08 | Question Seeding | `question_merge_map.csv` serves as the authoritative seed source for all 72 audit questions and 4 registry fields | `ACCEPTED` |
| `DEC-004` | 2026-10-08 | Monorepo Structure | Fixed structure: `apps/web` (React/Vite), `apps/api` (Spring Boot 3 / Java 21), `apps/ai` (FastAPI / Python 3.11), `shared/golden-vectors` | `ACCEPTED` |

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
