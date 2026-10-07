# Phase 2 Summary — Geography & Pilot Location Management

## Deliverables Summary

Phase 2 implements the hierarchical administrative geography model (State, District, Block, Panchayat) in PostgreSQL, establishes the 4 Jharkhand pilot districts, provides deterministic non-recyclable institutional code generation, supports bulk CSV facility ingestion with per-row diagnostic reporting, and delivers full administrative UI views.

---

### 1. Database Schema & Seed Data (`V2__geography_pilot_locations.sql`)
- **Administrative Hierarchy**:
  - `states`: LGD reference table with 2-letter codes (`JH`).
  - `districts`: District reference table with 3-letter codes (`RCH`, `DHN`, `BOK`, `ESB`).
  - `blocks`: Administrative blocks scoped to districts.
  - `panchayats`: Gram Panchayats scoped to blocks.
- **Pilot Scope**:
  - State: **Jharkhand** (`JH`)
  - 4 Pilot Districts: **Ranchi** (`RCH`), **Dhanbad** (`DHN`), **Bokaro** (`BOK`), **East Singhbhum** (`ESB`).
  - Pilot Blocks & Panchayats pre-seeded for immediate local governance testing (Kanke, Namkum, Ratu, Ormanjhi, Chas, Bermo, etc.).
- **Institutional Types & Facility Registry**:
  - `pilot_location_types`: Seeded with 4 pilot institutional types:
    - `SCHOOL` (prefix `SCH`, domain `SCHOOL`, label `School`)
    - `ANGANWADI` (prefix `AWC`, domain `ANGANWADI`, label `Anganwadi Centre`)
    - `PHC` (prefix `PHC`, domain `HEALTH`, label `Primary Health Centre`)
    - `HOSPITAL` (prefix `HOS`, domain `HEALTH`, label `Hospital / CHC`)
  - `facility_code_sequences`: Dedicated row-level sequence tracker initialized per `(district_id, type_id)`.
  - `pilot_locations`: Public institutional entities with unique permanent codes and status tracking.
  - `pilot_location_registry`: Restricted sequestered table storing facility names and external administrative codes (UDISE+, POSHAN Tracker, NIN).

---

### 2. Deterministic Non-Recyclable Code Generator (`FacilityCodeGenerator.java`)
- **Format**: `{state_code2}-{district_code3}-{type_prefix}-{sequence:04d}` (e.g. `JH-RCH-SCH-0001`, `JH-DHN-AWC-0001`, `JH-BOK-PHC-0001`, `JH-ESB-HOS-0001`).
- **Concurrency & Monotonicity Guarantee**:
  - Pessimistic write locking (`SELECT ... FOR UPDATE`) on the sequence row.
  - Transaction isolation in `REQUIRES_NEW` ensures dedicated sequence increment per allocation.
  - Tested with **100 concurrent requests** fired simultaneously across 25 thread workers:
    - **0 duplicate collisions** (100 unique codes allocated).
    - **Strictly monotonic sequence numbers** without gaps or overlaps.

---

### 3. CSV Bulk Upload with Validation Diagnostics (`CsvFacilityBulkUploadService.java`)
- **Header Parsing & Validation**: Accepts standard CSV formats with columns: `type_code`, `district_code`, `block_code`, `panchayat_code`, `facility_name`, `official_code`.
- **Row-Level Diagnostic Reporting**:
  - Validates facility type, district existence, block validity within district, panchayat validity within block, and mandatory facility names.
  - Skips invalid rows and reports line number, field name, and descriptive failure reason.
  - Tested with a 50-row CSV containing 40 valid and 10 invalid rows:
    - 40 facilities successfully registered with unique codes.
    - 10 invalid rows caught with exact row-level diagnostic errors.

---

### 4. Admin UI (`apps/web`)
- **Geography Hierarchy Manager** ([`GeographyManagementScreen.tsx`](file:///c:/Users/abhin/Desktop/Arijit%20Backend/Impact_Audit_prototype/apps/web/src/features/geography/GeographyManagementScreen.tsx)):
  - Segmented pilot district browser (Ranchi, Dhanbad, Bokaro, East Singhbhum).
  - Block and Panchayat hierarchy cards with summary counts.
  - Interactive modals to add new administrative blocks and panchayats.
- **Facility Registry & Allocator** ([`FacilityRegistryScreen.tsx`](file:///c:/Users/abhin/Desktop/Arijit%20Backend/Impact_Audit_prototype/apps/web/src/features/facilities/FacilityRegistryScreen.tsx)):
  - **Directory Tab**: Real-time table of registered facilities with unique codes, sequestered names, district/block breadcrumbs, and filters.
  - **Single Registration Tab**: Real-time code allocation preview with copyable permanent code badge.
  - **Bulk CSV Upload Tab**: File picker, sample CSV template download, progress spinner, and granular diagnostic error table.
- **Navigation Integration** ([`App.tsx`](file:///c:/Users/abhin/Desktop/Arijit%20Backend/Impact_Audit_prototype/apps/web/src/App.tsx)):
  - Top navigation bar for Admin switching between `Overview`, `Geography Hierarchy`, and `Facility Registry`.

---

### 5. Verification & Gate Checklist

| Verification Target | Expected | Result |
|---|---|---|
| **Flyway Migration V2** | Clean run on real PostgreSQL 16 | ✅ **PASSED** (Schema & seeds applied) |
| **4 Pilot Districts Present** | Ranchi, Dhanbad, Bokaro, East Singhbhum queryable | ✅ **PASSED** (Verified in `GeographyIntegrationTest`) |
| **100 Concurrent Requests Test** | Zero collisions, strictly monotonic sequence | ✅ **PASSED** (100 unique codes: `JH-RCH-SCH-0241` to `0340`) |
| **CSV Bulk Upload (50 rows)** | Valid rows registered, invalid rows flagged with line numbers | ✅ **PASSED** (40 registered, 10 errors reported per row) |
| **Full Maven Test Suite** | 14/14 tests passing on real PostgreSQL | ✅ **PASSED** (0 failures, 0 errors) |
| **Frontend Production Build** | Clean Vite + TypeScript build | ✅ **PASSED** (`built in 4.70s`, 0 errors) |
