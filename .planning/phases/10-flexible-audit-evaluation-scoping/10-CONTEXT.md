# Phase 10 Context: Flexible Partial Audit Evaluation & Dynamic Facility Scoping

## 1. Executive Summary & Intent
Field auditors frequently audit a single facility (e.g. one primary school, one Anganwadi centre, or one village drop-off location) rather than completing exhaustive forms for every village, school, and audit section in an administrative area. 

This phase establishes **flexible partial audit evaluation** and **on-demand facility/section scoping**:
- An audit can be submitted for ACS evaluation even if only one school, village, or facility is filled.
- There is no requirement to create pages or answer questions for every audit section or facility in a location.
- Deterministic ACS scoring adapts dynamically to evaluated questions without penalizing omitted units with artificial zero scores.

---

## 2. Locked Decisions (Confirmed with User)

### DEC-10-01: Soft-Warning Submission Gate (`AUDIT-SUBMIT-SOFT-WARN`)
- **Behavior**: The pre-flight completeness check (`GET /api/v1/locations/{locationId}/completeness`) provides transparency on unanswered questions and unvisited sections, but **does not block submission**.
- **Backend Rule**: `AuditService.submitLocation()` allows transition to `READY_FOR_ANALYSIS` as long as at least **one** answer exists across the audit pages (i.e. non-empty audit).
- **Frontend UX**: If completeness is $< 100\%$, the modal displays a summary of missing items with a clear action: `"Submit Partial Audit for Evaluation"` alongside `"Return to Editing"`.

### DEC-10-02: Deterministic ACS Dynamic Scaling (`ACS-DYNAMIC-DENOMINATOR`)
- **Scoring Engine Treatment**: Questions that were not assessed or belong to omitted sections/facilities are flagged `NOT_ASSESSED`.
- **Denominator Scaling**: In the pure deterministic formula:
  $$\text{ACS} = \left(\frac{\sum \text{earned\_w}}{\sum \text{max\_w}}\right) \times 100$$
  `NOT_ASSESSED` questions are excluded from the denominator $\sum \text{max\_w}$ (identically to `NA` questions).
- **Ledger Invariant Preserved**: The deduction ledger balance proof remains strictly satisfied:
  $$\sum \text{loss\_contribution} \equiv 100.00 - \text{ACS}$$
  Deductions reflect shortcomings strictly within the facilities and sections actually assessed.

### DEC-10-03: On-Demand Facility & Section Pages (`UI-ON-DEMAND-PAGES`)
- **Workspace Organization**: The Field Audit Workspace does not force or pre-generate pages for every possible facility or section.
- **Auditor Flow**: Auditors create/add pages on demand for the specific facilities they visited (e.g., adding a "School" page or an "Anganwadi" page).
- **Flexibility**: Any unvisited facility or section does not need to be instantiated or created in the workspace.

---

## 3. Scope & Affected Components

### 3.1 Backend (`apps/api`)
- [`AuditService.java`](file:///c:/Users/abhin/Desktop/Arijit%20Backend/Impact_Audit_prototype/apps/api/src/main/java/org/abhisaran/audit/AuditService.java):
  - Refactor `validateCompleteness()` to distinguish between complete audit and valid partial audit.
  - Update `submitLocation()` to permit partial submissions if at least 1 answer is recorded.
- [`ScoringEngine.java`](file:///c:/Users/abhin/Desktop/Arijit%20Backend/Impact_Audit_prototype/apps/api/src/main/java/org/abhisaran/scoring/ScoringEngine.java):
  - Verify that unanswered questions across unvisited sections default to `NOT_ASSESSED` and are excluded from $\sum \text{max\_w}$.
- Integration Tests:
  - [`AuditIntegrationTest.java`](file:///c:/Users/abhin/Desktop/Arijit%20Backend/Impact_Audit_prototype/apps/api/src/test/java/org/abhisaran/audit/AuditIntegrationTest.java): Test partial submission and transition to `READY_FOR_ANALYSIS`.
  - [`ScoringEngineTest.java`](file:///c:/Users/abhin/Desktop/Arijit%20Backend/Impact_Audit_prototype/apps/api/src/test/java/org/abhisaran/scoring/ScoringEngineTest.java): Test ACS computation with partial sections.

### 3.2 Frontend (`apps/web`)
- [`FieldAuditWorkspace.tsx`](file:///c:/Users/abhin/Desktop/Arijit%20Backend/Impact_Audit_prototype/apps/web/src/features/audit/FieldAuditWorkspace.tsx):
  - Update Pre-Flight Completeness modal: show soft warning, list missing questions/sections, provide "Submit Partial Audit" button.
  - Simplify page management to support on-demand addition for visited facilities.

---

## 4. Downstream Planning Next Steps
1. Author `10-01-PLAN.md` with explicit tasks and verification criteria.
2. Update `.planning/ROADMAP.md` and `.planning/STATE.md` with Phase 10.
3. Implement backend changes (`AuditService`, `AuditController`).
4. Implement frontend UI changes (`FieldAuditWorkspace`).
5. Run full Maven test suite and Vite build to confirm 0 regressions.
