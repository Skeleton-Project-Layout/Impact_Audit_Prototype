-- Flyway Migration V5: Analysis Runs, Analysis Items, and Deduction Ledger

-- 1. Analysis Runs Table (immutable snapshot of an ACS evaluation run)
CREATE TABLE IF NOT EXISTS analysis_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pilot_location_id UUID NOT NULL REFERENCES pilot_locations(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES audit_submissions(id) ON DELETE SET NULL,
    run_number INT NOT NULL DEFAULT 1,
    acs_score NUMERIC(5,2), -- nullable when not calculable (zero denominator)
    alert_band VARCHAR(32), -- 'RED', 'ORANGE', 'AMBER', 'LIGHT_GREEN', 'DARK_GREEN'
    is_provisional BOOLEAN NOT NULL DEFAULT FALSE,
    coverage_pct NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    total_applicable_questions INT NOT NULL DEFAULT 0,
    total_assessed_questions INT NOT NULL DEFAULT 0,
    total_max_weighted_points NUMERIC(10,4) NOT NULL DEFAULT 0.0000,
    total_earned_weighted_points NUMERIC(10,4) NOT NULL DEFAULT 0.0000,
    total_deductions_weighted_points NUMERIC(10,4) NOT NULL DEFAULT 0.0000,
    triggered_red_flags_count INT NOT NULL DEFAULT 0,
    run_by UUID REFERENCES users(id),
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED'
);

CREATE INDEX IF NOT EXISTS idx_analysis_runs_location ON analysis_runs(pilot_location_id);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_submission ON analysis_runs(submission_id);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_analyzed_at ON analysis_runs(analyzed_at DESC);

-- 2. Analysis Items Table (granular per-question evaluation breakdown)
CREATE TABLE IF NOT EXISTS analysis_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
    audit_page_id UUID REFERENCES audit_pages(id) ON DELETE SET NULL,
    question_id VARCHAR(64) NOT NULL REFERENCES question_bank(id),
    question_version_id UUID REFERENCES question_versions(id),
    page_number INT NOT NULL DEFAULT 1,
    severity VARCHAR(16) NOT NULL,
    weight NUMERIC(4,2) NOT NULL,
    raw_earned_points NUMERIC(6,3),
    raw_max_points NUMERIC(6,3),
    weighted_earned_points NUMERIC(8,4),
    weighted_max_points NUMERIC(8,4),
    is_na BOOLEAN NOT NULL DEFAULT FALSE,
    is_not_assessed BOOLEAN NOT NULL DEFAULT FALSE,
    is_red_flag BOOLEAN NOT NULL DEFAULT FALSE,
    alert_band VARCHAR(32),
    clamped_red BOOLEAN NOT NULL DEFAULT FALSE,
    working_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_analysis_items_run ON analysis_items(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_analysis_items_question ON analysis_items(question_id);
CREATE INDEX IF NOT EXISTS idx_analysis_items_page ON analysis_items(audit_page_id);

-- 3. Analysis Deduction Ledger Table (waterfall of point deductions strictly balancing to 100 - ACS)
CREATE TABLE IF NOT EXISTS analysis_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
    analysis_item_id UUID REFERENCES analysis_items(id) ON DELETE SET NULL,
    question_id VARCHAR(64) NOT NULL,
    page_number INT NOT NULL DEFAULT 1,
    question_text TEXT NOT NULL,
    severity VARCHAR(16) NOT NULL,
    weight NUMERIC(4,2) NOT NULL,
    lost_weighted_points NUMERIC(8,4) NOT NULL,
    deduction_percentage NUMERIC(6,2) NOT NULL,
    loss_explanation TEXT NOT NULL,
    suggested_intervention TEXT
);

CREATE INDEX IF NOT EXISTS idx_analysis_ledger_run ON analysis_ledger(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_analysis_ledger_item ON analysis_ledger(analysis_item_id);
