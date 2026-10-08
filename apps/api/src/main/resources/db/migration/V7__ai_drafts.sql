-- V7__ai_drafts.sql
-- Isolated storage for assistive AI narrative drafts and OCR extractions.
-- Strictly detached from scoring algorithms and calculation ledgers.

CREATE TABLE ai_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type VARCHAR(32) NOT NULL,       -- 'ANALYSIS_RUN', 'EVIDENCE_OCR', 'OBSERVATIONS'
    target_id UUID NOT NULL,
    service_id VARCHAR(64) NOT NULL,
    input_refs JSONB NOT NULL,              -- IDs only, never names or raw text
    output_text TEXT NOT NULL,
    quality_metadata JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACCEPTED', 'REJECTED')),
    accepted_by UUID REFERENCES users(id),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_drafts_target ON ai_drafts(target_type, target_id);
