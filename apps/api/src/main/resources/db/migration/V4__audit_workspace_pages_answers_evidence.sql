-- Flyway Migration V4: Audit Workspace, Multi-Page Audits, Answers, Evidence Attachments, Submissions

-- 1. Audit Pages Table (one pilot location can have multiple pages)
CREATE TABLE IF NOT EXISTS audit_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pilot_location_id UUID NOT NULL REFERENCES pilot_locations(id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'SUBMITTED'
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_audit_pages_location_page UNIQUE (pilot_location_id, page_number)
);

CREATE INDEX IF NOT EXISTS idx_audit_pages_location ON audit_pages(pilot_location_id);
CREATE INDEX IF NOT EXISTS idx_audit_pages_status ON audit_pages(status);

-- 2. Audit Answers Table (stores question answers per page instance)
CREATE TABLE IF NOT EXISTS audit_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_page_id UUID NOT NULL REFERENCES audit_pages(id) ON DELETE CASCADE,
    question_id VARCHAR(64) NOT NULL REFERENCES question_bank(id),
    question_version_id UUID NOT NULL REFERENCES question_versions(id),
    answer_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_na BOOLEAN NOT NULL DEFAULT FALSE,
    na_reason TEXT,
    is_not_assessed BOOLEAN NOT NULL DEFAULT FALSE,
    not_assessed_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_audit_answers_page_question UNIQUE (audit_page_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_audit_answers_page ON audit_answers(audit_page_id);
CREATE INDEX IF NOT EXISTS idx_audit_answers_question ON audit_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_audit_answers_version ON audit_answers(question_version_id);

-- 3. Evidence Attachments Table (per-question contextual file uploads)
CREATE TABLE IF NOT EXISTS evidence_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_page_id UUID NOT NULL REFERENCES audit_pages(id) ON DELETE CASCADE,
    question_id VARCHAR(64) NOT NULL REFERENCES question_bank(id),
    storage_path VARCHAR(512) NOT NULL,
    file_name VARCHAR(256) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(64) NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    attestation_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_page ON evidence_attachments(audit_page_id);
CREATE INDEX IF NOT EXISTS idx_evidence_question ON evidence_attachments(question_id);

-- 4. Audit Submissions Table (records submission event across all pages of a location)
CREATE TABLE IF NOT EXISTS audit_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pilot_location_id UUID NOT NULL REFERENCES pilot_locations(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES users(id),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    page_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    question_version_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    reopened_by UUID REFERENCES users(id),
    reopened_at TIMESTAMPTZ,
    reopen_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_submissions_location ON audit_submissions(pilot_location_id);
