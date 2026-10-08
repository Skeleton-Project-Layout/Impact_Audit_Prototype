# UI Parity Checklist & Difference Specification — Abhisaran Platform

## 1. Overview & Reference Baseline

The field audit interface in `apps/web` must replicate the visual structure, interactions, styling tokens, and offline capabilities of the reference implementation located in `ahfjhabsd/` (`abhisaran-field-form-preview.html`, `styles.css`, `app.js`, `pdfwriter.js`).

At Phase 4 completion, side-by-side screenshots at **390px (mobile)** and **1280px (desktop)** must be provided alongside this verified checklist.

---

## 2. Visual & Structural Parity Checklist

### 2.1 CSS Variables & Design Tokens (`styles.css` / `auditWorkspace.css`)
- [x] Primary accent color token: `--accent: #0b6b5c` (Light) / `#3fb8a2` (Dark)
- [x] Accent background soft token: `--accent-soft: #dff0ec` (Light) / `#1b3a34` (Dark)
- [x] Background token: `--bg: #eef2f0` (Light) / `#0e1513` (Dark)
- [x] Surface token: `--surface: #ffffff` (Light) / `#16211e` (Dark)
- [x] Secondary surface: `--surface-2: #f6f9f8` (Light) / `#1b2824` (Dark)
- [x] Ink/text tokens: `--ink: #15231f` (Light) / `--ink: #e5eeeb` (Dark)
- [x] Muted text token: `--muted: #566863` (Light) / `#94a7a1` (Dark)
- [x] Border line token: `--line: #d3dcd8` (Light) / `#2b3b36` (Dark)
- [x] Danger token: `--danger: #b3261e` / soft `--danger-soft: #fbe9e7`
- [x] Success token: `--ok: #17703f` / `--ok: #66d19a`
- [x] Warning token: `--warn: #8a5a00` / soft `--warn-soft: #fff4d6`
- [x] Header height: `--hdr: 56px`
- [x] Strip desktop height: `--strip: 112px` (collapsing to 58px on `<960px`)
- [x] Font stack: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`

---

### 2.2 Sticky Header (56px)
- [x] Sticky positioning (`position: sticky; top: 0; z-index: 40; height: 56px`)
- [x] Brand block with styled SVG convergence icon and wordmark `ABHISARAN`
- [x] Location subtitle: shows **location code only** (e.g., `JH-RCH-SCH-0001`), **never facility name**
- [x] Dynamic Save-Status Pill with color indicator:
  - Green dot: "Synced" (verified via HTTP 2xx)
  - Yellow pulsing dot: "Saving…" / "Saved on this device"
  - Red dot: "Sync error (Tap to retry)"
- [x] PDF export dropdown button:
  - "Download Current Page (PDF)"
  - "Download All Pages as One PDF"
- [x] ⋯ Action Menu (dropdown popover, 250px min-width):
  - **+ Add Audit Page**
  - **Duplicate Current Page** (copies all answers, omits evidence attachments)
  - **Export Data** (JSON backup of active location audit)
  - **Import Data** (JSON restore)
  - **Delete This Page** (DRAFT pages only; modal confirmation; audit-logged)
  - **Clear Current Page** (DRAFT pages only; modal confirmation; audit-logged)

---

### 2.3 Page Tabs Strip
- [x] Horizontal scrollable tab list: `Page 1`, `Page 2`, `Page 3`, etc.
- [x] Active tab highlighted with accent pill background and indicator
- [x] Page status badge per tab (Draft / Complete / Submitted)
- [x] Add Page shortcut button at the end of the strip

---

### 2.4 Section Navigator & Progress Strip
- [x] Section selector (desktop sidebar or mobile top dropdown):
  - Section title
  - Question count badge per section (e.g., `12 questions · 8 answered`)
- [x] Real-time Progress Strip:
  - String format: `"Question n of N · x % complete — y of N answered"`
  - Progress bar filling dynamically based on assessed questions
- [x] Search input: filter questions dynamically by keyword or question number (`S04`, `water`)

---

### 2.5 Question Card Rendering (Exact Type Parity)
- [x] Number badge with severity tag (Critical / High / Medium / Info)
- [x] Canonical question text with bold styling
- [x] Helper hint line in muted grey typography
- [x] Rendered input fields matching zip component library:
  - [x] Single-line text input & multi-line textarea
  - [x] Numeric inputs with decimal formatting and boundary checks
  - [x] Percentage input with `%` suffix adornment
  - [x] Radio pills (Yes / No / Partial)
  - [x] Checkbox chips with multi-selection
  - [x] Rating 1–5 segmented buttons
  - [x] Available / Functional / Used (AFU) checkbox matrix grids
  - [x] Multi-row checklist tables with Yes / Partial / No selectors
  - [x] Numeric ratio pairs (e.g. working vs sanctioned)
  - [x] Ranked Top-3 item selectors
- [x] "Mark as Not Applicable" toggle with required text reason field
- [x] "Could Not Be Assessed" toggle with required text reason field

---

### 2.6 Footer Navigation & Toasts
- [x] Fixed footer bar: `[ Previous ]` · `[ Save ]` · `[ Next ]` · `[ Submit all pages for {CODE} ]`
- [x] Sticky bottom margin ensuring content is never obscured by footer
- [x] Toast notification container (top-right desktop, bottom mobile) for autosave & errors

---

### 2.7 Offline-Tolerant Autosave Engine
- [x] IndexedDB database (`abhisaran_offline_db`) storing active audit state
- [x] Debounced autosave on field modification (500ms debounce)
- [x] State transition: Dirty $\rightarrow$ "Saved on this device" $\rightarrow$ Background sync $\rightarrow$ "Synced"
- [x] Network offline detection: gracefully queues failed syncs and displays pending sync badge

---

## 3. Adaptations & Changes vs. Reference Prototype

While the UI appearance and interactions remain visually identical to `ahfjhabsd`, the Abhisaran production platform introduces the following architectural adaptations:

| Feature Dimension | Reference Zip (`ahfjhabsd`) | Abhisaran Production Platform (`apps/web`) |
|-------------------|----------------------------|---------------------------------------------|
| **Question Source** | Hardcoded static JS array (`questions.js`, 67 questions) | Loaded dynamically from API question bank filtered by location domain (`SCHOOL`, `ANGANWADI`, `HEALTH`, `GENERAL`). |
| **Facility Identity** | Identification fields inside the form (School name, UDISE code, Anganwadi ID) | **Completely removed from the form**. Captured once in the restricted Admin Registry; the form header shows the system code only. |
| **Photo Upload (Q60)** | Single checkbox ("Photographs collected?") | **Retired**. Replaced with contextual, per-question evidence attachments. |
| **Evidence Attachments** | None | Question card renders an **"Attach evidence"** box when `evidence_enabled = true`, with file previews, magic-byte checks, EXIF stripping, and attestation. |
| **Multi-Page Scope** | Multiple unrelated records in localStorage | All pages belong to the **single active pilot location**, pooled together upon submission and analysis. |
| **Submission Gate** | Client-side export button | Form features a **"Submit all pages for {CODE}"** button, which server-validates question completeness and locks records as `SUBMITTED`. |
| **Assessment Status** | Unchecked fields defaulted to blank | Explicit options for **"Not applicable"** and **"Could not be assessed"** with mandatory justification fields. |
