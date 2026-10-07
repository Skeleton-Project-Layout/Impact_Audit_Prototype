# REST API Specification — Abhisaran Platform

## 1. Overview & Protocol Standards

- **Base Path**: `/api/v1`
- **Content Type**: `application/json` (except multipart file uploads at `/evidence`)
- **Authentication**: HTTP-Only Secure Cookie (`SESSIONID` or `Bearer` token in cookie)
- **Role Enforcement**: Method and object-level server verification. Officers are strictly constrained to locations within their active district scope.
- **Error Standard**: RFC 7807 Problem Details for HTTP APIs (`application/problem+json`).

---

## 2. Authentication & System Endpoints

### `POST /auth/login`
Authenticates a user into an Admin or Government Officer session.
- **Access**: Public
- **Request Body**:
  ```json
  {
    "login_id": "GOV-00001",
    "password": "Password#123",
    "role": "OFFICER"
  }
  ```
- **Responses**:
  - `200 OK`: Sets httpOnly secure cookie; returns user profile:
    ```json
    {
      "id": "c1f7b02b-8a21-4b13-91ec-29b1b70c399b",
      "login_id": "GOV-00001",
      "display_name": "District Officer",
      "role": "OFFICER",
      "must_change_password": false,
      "assigned_districts": [101, 102]
    }
    ```
  - `401 Unauthorized`: Uniform message preventing account enumeration:
    ```json
    { "error": "Invalid ID or password." }
    ```
  - `429 Too Many Requests`: Account temporarily locked following 5 failed attempts.

### `POST /auth/logout`
Terminates active session and clears authentication cookies.
- **Access**: Authenticated

### `POST /auth/change-password`
Updates password for current user. Required if `must_change_password` is true.
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "current_password": "OldPassword#123",
    "new_password": "NewSecurePassword#456"
  }
  ```

### `GET /health`
Public actuator health check used by the frontend splash animation to pre-warm cold containers.
- **Access**: Public
- **Response**: `200 OK` `{"status": "UP"}`

---

## 3. Pilot Locations & Geography Management

### `GET /reference/states` & `GET /reference/districts`
Retrieves master geographic hierarchy.
- **Access**: Authenticated (Admin & Officer scoped)

### `GET /locations`
Lists pilot locations with server-side filtering.
- **Access**: `ROLE_ADMIN`
- **Query Params**: `state_id`, `district_id`, `type`, `status`, `search` (by code)
- **Response**: Array of location records (contains `code`, never facility name).

### `POST /locations`
Creates a new pilot location with an immutable generated code.
- **Access**: `ROLE_ADMIN`
- **Request Body**:
  ```json
  {
    "type_id": 1,
    "district_id": 101,
    "restricted_name": "Govt High School Bundu",
    "official_code": "UDISE-20010901201"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "id": "e2a1b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    "code": "SCH-JH-RAN-0007",
    "type_prefix": "SCH",
    "status": "REGISTERED"
  }
  ```

### `GET /registry/:locationId`
Accesses restricted facility name and official code.
- **Access**: `ROLE_ADMIN` only (audit-logged upon every read).

---

## 4. Audit Workspace & Evidence Endpoints

### `POST /locations/:locationId/pages`
Appends a new audit page pass to the location.
- **Access**: `ROLE_ADMIN`
- **Response**: `201 Created` with new `page_id` and question version snapshot.

### `PUT /pages/:pageId/answers`
Autosaves question answers for an active audit page.
- **Access**: `ROLE_ADMIN`
- **Server Guard**: Validates free-text answers with regex; rejects if Aadhaar, phone number, or email is detected.
- **Request Body**:
  ```json
  {
    "answers": [
      {
        "question_version_id": "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
        "value": { "available": true, "functional": false, "used": false },
        "is_na": false,
        "is_not_assessed": false
      }
    ]
  }
  ```
- **Responses**:
  - `200 OK`: `{"status": "SYNCED", "saved_at": "2026-10-08T02:00:00Z"}`
  - `422 Unprocessable Entity`: `{"error": "Personal Identifiable Information (phone/Aadhaar/email) detected. Submission rejected."}`

### `POST /pages/:pageId/evidence`
Uploads an evidence file attachment for a specific question.
- **Access**: `ROLE_ADMIN`
- **Headers**: `Content-Type: multipart/form-data`
- **Validation**: Magic bytes checked; EXIF stripped; file stored under random UUID.
- **Response**: `201 Created` `{"evidence_id": "...", "mime_type": "image/jpeg"}`

### `POST /locations/:locationId/submit`
Validates all audit pages for completeness and locks records.
- **Access**: `ROLE_ADMIN`
- **Validation**: Rejects if any scored question is unassessed without an explicit N/A or CNA reason.
- **Response**: `200 OK` (flips location status to `READY_FOR_ANALYSIS`).

### `POST /locations/:locationId/reopen`
Reopens submitted audit pages to DRAFT status with mandatory logged reason.
- **Access**: `ROLE_ADMIN`

---

## 5. Scoring & Analysis Execution

### `POST /locations/:locationId/analyse`
Executes pure Java `ScoringEngine` across pooled submitted pages.
- **Access**: `ROLE_ADMIN`
- **Transaction**: In a single atomic transaction:
  1. Computes ACS, band, deduction ledger, and coverage.
  2. Inserts `analysis_runs`, `analysis_items`, and `analysis_ledger`.
  3. Inserts `delivery` records for all active officers with matching district scope.
  4. Updates location status to `ANALYSED`.
- **Response**:
  ```json
  {
    "run_id": "f4a5b6c7-d8e9-0f1a-2b3c-4d5e6f7a8b9c",
    "location_code": "SCH-JH-RAN-0007",
    "acs_exact": 84.62,
    "acs_rounded": 85,
    "alert_band": "LIGHT_GREEN",
    "coverage_pct": 96.50,
    "is_provisional": false,
    "delivered_officers_count": 3
  }
  ```

### `GET /results/:runId`
Shared analysis details view (accessible by Admin and in-scope Officers).
- **Access**: Authenticated (scoped)
- **Response Payload**:
  - Location code, state, district, run date, pooled page count.
  - Overall ACS, alert band, coverage percentage, provisional badge flag.
  - **Deduction Ledger**: List of items explaining exact points lost from 100.
  - **Alert Cards**: Categorized by alert band (Red to Dark Green) with suggested interventions.
  - **Rubric Workings**: Step-by-step point calculations per question.
  - **Evidence Gallery**: Attachment references with signed download URLs.

---

## 6. Government Officer Portal Endpoints

### `GET /me/inbox`
Retrieves deliveries for the authenticated officer within assigned districts.
- **Access**: `ROLE_OFFICER`
- **Ordering**: Unread deliveries (`read_at IS NULL`) prioritized first.

### `GET /me/results/:runId/evidence/:evidenceId`
Retrieves a short-lived signed URL (5-minute expiration) to view evidence.
- **Access**: `ROLE_OFFICER` (verified against officer's district jurisdiction).
- **Response**: `{"signed_url": "https://storage.supabase.co/...", "expires_in_seconds": 300}`

---

## 7. Assistive AI Endpoints (Admin Only Proxy)

Protected by `FEATURE_AI=true` flag. Internal communication via `AI_SERVICE_TOKEN`.

### `POST /ai/extract-text/:evidenceId`
Triggers assistive OCR extraction on an evidence document to support human transcription.
- **Access**: `ROLE_ADMIN`

### `POST /ai/summarise-run/:runId`
Generates an assistive narrative summary of an analysis run based purely on its deduction ledger.
- **Access**: `ROLE_ADMIN`
- **Output**: Persisted as `DRAFT` in `ai_drafts` table with mandatory disclaimer banner.

### `POST /ai/drafts/:id/accept` & `POST /ai/drafts/:id/reject`
Records admin review decision on assistive drafts. Does not alter stored scoring numbers.
