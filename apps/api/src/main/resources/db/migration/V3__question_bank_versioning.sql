-- ============================================================================
-- V3__question_bank_versioning.sql
-- Abhisaran Audit Platform: Master Question Bank & Immutable Versioning
-- 72 Audit Questions Seeded with Version 1 Snapshots
-- ============================================================================

-- 1. Question Bank Catalog (Master Metadata)
CREATE TABLE question_bank (
    id VARCHAR(16) PRIMARY KEY,             -- 'C01', 'S02', 'A02', 'P01', etc.
    domain VARCHAR(32) NOT NULL,            -- 'SCHOOL', 'ANGANWADI', 'HEALTH', 'ALL'
    section VARCHAR(32) NOT NULL,           -- 'COMMUNITY_PROFILE', 'SCHOOL', 'ANGANWADI', 'HEALTH', 'COMMUNITY_INTERACTION', 'PHYSICAL_VERIFICATION', 'SUMMARY'
    canonical_text TEXT NOT NULL,
    response_type VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM')),
    scored_default BOOLEAN NOT NULL DEFAULT FALSE,
    rubric_type_default VARCHAR(64) NOT NULL,
    evidence_upload_default BOOLEAN NOT NULL DEFAULT FALSE,
    evidence_hint TEXT,
    red_flag_logic TEXT,
    suggested_intervention TEXT,
    source_csv_id VARCHAR(32),
    source_zip_q VARCHAR(32),
    merge_action VARCHAR(32),
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qb_domain ON question_bank(domain);
CREATE INDEX idx_qb_section ON question_bank(section);
CREATE INDEX idx_qb_severity ON question_bank(severity);
CREATE INDEX idx_qb_active ON question_bank(active);

-- 2. Question Versions (Immutable Snapshots for Audits and Scoring)
CREATE TABLE question_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id VARCHAR(16) NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    text TEXT NOT NULL,
    hint TEXT,
    fields_schema JSONB NOT NULL,
    rubric_config JSONB NOT NULL,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM')),
    scored BOOLEAN NOT NULL DEFAULT FALSE,
    evidence_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    evidence_hint TEXT,
    red_flag_logic TEXT,
    suggested_intervention TEXT,
    alert_overrides JSONB,
    status VARCHAR(32) NOT NULL DEFAULT 'DEFAULT_PENDING_OWNER_REVIEW'
        CHECK (status IN ('ACTIVE', 'DEFAULT_PENDING_OWNER_REVIEW', 'ARCHIVED')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_question_version UNIQUE (question_id, version_number)
);

CREATE INDEX idx_qv_question_id ON question_versions(question_id);
CREATE INDEX idx_qv_status ON question_versions(status);

-- 3. Severity Weights Configuration (Versioned Defaults)
CREATE TABLE severity_weights (
    severity VARCHAR(16) PRIMARY KEY CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM')),
    weight INT NOT NULL,
    version_number INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO severity_weights (severity, weight, version_number) VALUES
('CRITICAL', 3, 1),
('HIGH', 2, 1),
('MEDIUM', 1, 1);

-- 4. Alert Bands Configuration (Red -> Green Spectrum)
CREATE TABLE alert_bands (
    band VARCHAR(20) PRIMARY KEY CHECK (band IN ('RED', 'ORANGE', 'AMBER', 'LIGHT_GREEN', 'DARK_GREEN')),
    min_score NUMERIC(5, 2) NOT NULL,
    max_score NUMERIC(5, 2) NOT NULL,
    label VARCHAR(64) NOT NULL,
    color_hex VARCHAR(16) NOT NULL,
    version_number INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO alert_bands (band, min_score, max_score, label, color_hex, version_number) VALUES
('RED', 0.00, 39.99, 'Needs immediate attention', '#dc2626', 1),
('ORANGE', 40.00, 54.99, 'Critical gaps', '#f97316', 1),
('AMBER', 55.00, 69.99, 'Needs improvement', '#f59e0b', 1),
('LIGHT_GREEN', 70.00, 89.99, 'Good — a few things are off', '#84cc16', 1),
('DARK_GREEN', 90.00, 100.00, 'All good', '#10b981', 1);

-- 5. Scoring Global Settings
CREATE TABLE scoring_settings (
    id VARCHAR(32) PRIMARY KEY,
    setting_value VARCHAR(128) NOT NULL,
    description TEXT,
    version_number INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO scoring_settings (id, setting_value, description, version_number) VALUES
('MIN_COVERAGE_PCT', '70.0', 'Minimum assessed coverage percentage before an ACS is marked PROVISIONAL', 1),
('CRITICAL_RED_THRESHOLD', '50.0', 'Questions with Critical severity below this percentage are clamped to RED', 1),
('PARTIAL_MARGIN_PCT', '10.0', 'Percentage margin below threshold that qualifies for partial (50%) points', 1);

-- ============================================================================
-- SEED DATA: Exactly 72 Audit Questions from question_merge_map.csv
-- ============================================================================

-- Question 1: C01 (COMMUNITY_PROFILE)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'C01',
    'ALL',
    'COMMUNITY_PROFILE',
    'Approx. population / households?',
    'Mixed',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '2',
    'UNIQUE_ZIP',
    'Context question; not scored.',
    TRUE,
    1
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'C01',
    1,
    'Approx. population / households?',
    'Context question; not scored.',
    '[{"name":"response","label":"Response / Finding","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 2: C02 (COMMUNITY_PROFILE)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'C02',
    'ALL',
    'COMMUNITY_PROFILE',
    'What are the 3 biggest issues affecting the village?',
    'Mixed',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '3',
    'UNIQUE_ZIP',
    'Context question; not scored.',
    TRUE,
    2
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'C02',
    1,
    'What are the 3 biggest issues affecting the village?',
    'Context question; not scored.',
    '[{"name":"response","label":"Response / Finding","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 3: C03 (COMMUNITY_PROFILE)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'C03',
    'ALL',
    'COMMUNITY_PROFILE',
    'Which government services are most used here?',
    'Mixed',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '4',
    'UNIQUE_ZIP',
    'Context question; not scored.',
    TRUE,
    3
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'C03',
    1,
    'Which government services are most used here?',
    'Context question; not scored.',
    '[{"name":"response","label":"Response / Finding","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 4: C04 (COMMUNITY_PROFILE)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'C04',
    'ALL',
    'COMMUNITY_PROFILE',
    'Which important services are difficult to access?',
    'Mixed',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '5',
    'UNIQUE_ZIP',
    'Context question; not scored.',
    TRUE,
    4
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'C04',
    1,
    'Which important services are difficult to access?',
    'Context question; not scored.',
    '[{"name":"response","label":"Response / Finding","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 5: C05 (COMMUNITY_PROFILE)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'C05',
    'ALL',
    'COMMUNITY_PROFILE',
    'Are there seasonal problems affecting families?',
    'Mixed',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '6',
    'UNIQUE_ZIP',
    'Context question; not scored.',
    TRUE,
    5
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'C05',
    1,
    'Are there seasonal problems affecting families?',
    'Context question; not scored.',
    '[{"name":"response","label":"Response / Finding","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 6: C06 (COMMUNITY_PROFILE)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'C06',
    'ALL',
    'COMMUNITY_PROFILE',
    'Which groups need the most support?',
    'Mixed',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '7',
    'UNIQUE_ZIP',
    'Context question; not scored.',
    TRUE,
    6
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'C06',
    1,
    'Which groups need the most support?',
    'Context question; not scored.',
    '[{"name":"response","label":"Response / Finding","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 7: S02 (SCHOOL)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'S02',
    'SCHOOL',
    'SCHOOL',
    'Classes covered and total enrolment by boys and girls?',
    'Numbers',
    'MEDIUM',
    false,
    'NONE',
    true,
    'Admission register',
    'Major unexplained enrolment change',
    'Verify enrolment',
    'S02',
    '9;10',
    'MERGED',
    'Zip Q9 (classes) + Q10 (enrolment) folded into CSV S02. No baseline to score against.',
    TRUE,
    7
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'S02',
    1,
    'Classes covered and total enrolment by boys and girls?',
    'Zip Q9 (classes) + Q10 (enrolment) folded into CSV S02. No baseline to score against.',
    '[{"name":"numeric_value","label":"Classes covered and total enrolment by boys and girls?","type":"number","min":0,"required":false},{"name":"notes","label":"Additional details","type":"text","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    true,
    'Admission register',
    'Major unexplained enrolment change',
    'Verify enrolment',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 8: S03 (SCHOOL)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'S03',
    'SCHOOL',
    'SCHOOL',
    'How many teachers are sanctioned, working and present today?',
    'Numbers',
    'HIGH',
    true,
    'RATIO(working/sanctioned; present/sanctioned)',
    true,
    'Staff record + attendance',
    'Vacancy or attendance gap',
    'Staffing/attendance action',
    'S03',
    '11',
    'MERGED',
    'Zip Q11 folded in (adds present-today).',
    TRUE,
    8
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'S03',
    1,
    'How many teachers are sanctioned, working and present today?',
    'Zip Q11 folded in (adds present-today).',
    '[{"name":"sanctioned","label":"Sanctioned Posts","type":"number","min":0,"required":true},{"name":"working","label":"Currently Working","type":"number","min":0,"required":true},{"name":"present_today","label":"Present Today","type":"number","min":0,"required":true}]'::jsonb,
    '{"type":"RATIO","scored":true,"max_raw_points":10,"numerator_field":"working","denominator_field":"sanctioned","secondary_numerator":"present_today","rule_description":"Proportion of sanctioned staff working and present today. Denominator 0 = not assessed."}'::jsonb,
    'HIGH',
    true,
    true,
    'Staff record + attendance',
    'Vacancy or attendance gap',
    'Staffing/attendance action',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 9: S04 (SCHOOL)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'S04',
    'SCHOOL',
    'SCHOOL',
    'What is the average student attendance for the last 30 days?',
    'Percentage',
    'HIGH',
    true,
    'PERCENT_THRESHOLD(>=75)',
    true,
    'Attendance register',
    '<75%',
    'Attendance improvement plan',
    'S04',
    '12',
    'MERGED',
    'Zip Q12 folded in.',
    TRUE,
    9
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'S04',
    1,
    'What is the average student attendance for the last 30 days?',
    'Zip Q12 folded in.',
    '[{"name":"attendance_pct","label":"Average Attendance (%)","type":"number","min":0,"max":100,"step":0.1,"unit":"%","required":true}]'::jsonb,
    '{"type":"PERCENT_THRESHOLD","scored":true,"max_raw_points":10,"field_name":"attendance_pct","threshold":75,"partial_margin":10,"inverted":false,"rule_description":">= 75% earns full points (10); 65% to < 75% earns partial points (5); < 65% earns 0."}'::jsonb,
    'HIGH',
    true,
    true,
    'Attendance register',
    '<75%',
    'Attendance improvement plan',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 10: S05 (SCHOOL)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'S05',
    'SCHOOL',
    'SCHOOL',
    'How many students are frequently absent or at risk of dropping out?',
    'Number',
    'CRITICAL',
    false,
    'NONE (owner to set threshold)',
    true,
    'Attendance / counselling record',
    'High concentration of at-risk students',
    'Case follow-up',
    'S05',
    '13',
    'MERGED',
    'Zip Q13 folded in. CSV gives no numeric threshold for "high concentration".',
    TRUE,
    10
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'S05',
    1,
    'How many students are frequently absent or at risk of dropping out?',
    'Zip Q13 folded in. CSV gives no numeric threshold for "high concentration".',
    '[{"name":"numeric_value","label":"How many students are frequently absent or at risk of dropping out?","type":"number","min":0,"required":false},{"name":"notes","label":"Additional details","type":"text","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'CRITICAL',
    false,
    true,
    'Attendance / counselling record',
    'High concentration of at-risk students',
    'Case follow-up',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 11: S06 (SCHOOL)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'S06',
    'SCHOOL',
    'SCHOOL',
    'What proportion of foundational-stage students are meeting expected FLN competencies?',
    'Percentage',
    'CRITICAL',
    true,
    'PERCENT_THRESHOLD(>=70)',
    true,
    'Assessment record / sample assessment',
    '<70% meeting benchmark',
    'Remedial FLN plan',
    'S06',
    '14;15',
    'MERGED',
    'Zip Q14 (learning concerns) + Q15 (remedial count) kept as supporting sub-fields.',
    TRUE,
    11
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'S06',
    1,
    'What proportion of foundational-stage students are meeting expected FLN competencies?',
    'Zip Q14 (learning concerns) + Q15 (remedial count) kept as supporting sub-fields.',
    '[{"name":"fln_proficient_pct","label":"Foundational Stage Meeting FLN Competencies (%)","type":"number","min":0,"max":100,"step":0.1,"unit":"%","required":true},{"name":"remedial_count","label":"Students receiving remedial support","type":"number","min":0,"required":false},{"name":"learning_concerns","label":"Primary learning concerns observed","type":"text","required":false}]'::jsonb,
    '{"type":"PERCENT_THRESHOLD","scored":true,"max_raw_points":10,"field_name":"fln_proficient_pct","threshold":70,"partial_margin":10,"inverted":false,"rule_description":">= 70% earns full points (10); 60% to < 70% earns partial points (5); < 60% earns 0."}'::jsonb,
    'CRITICAL',
    true,
    true,
    'Assessment record / sample assessment',
    '<70% meeting benchmark',
    'Remedial FLN plan',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 12: S07 (SCHOOL)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'S07',
    'SCHOOL',
    'SCHOOL',
    'Are FLN/TLM materials available, age-appropriate and actually being used in classrooms?',
    'Rating',
    'HIGH',
    true,
    'RATING_1_5',
    true,
    'Photographs + classroom observation',
    'Available but not used',
    'Teacher support',
    'S07',
    NULL,
    'CSV_ONLY',
    NULL,
    TRUE,
    12
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'S07',
    1,
    'Are FLN/TLM materials available, age-appropriate and actually being used in classrooms?',
    NULL,
    '[{"name":"rating","label":"Observation Rating (1 to 5)","type":"rating","min":1,"max":5,"required":true,"options":[{"value":1,"label":"1 - Highly Deficient / Absent"},{"value":2,"label":"2 - Poor / Substandard"},{"value":3,"label":"3 - Satisfactory / Basic"},{"value":4,"label":"4 - Good / Active"},{"value":5,"label":"5 - Exemplary / Full Uptake"}]},{"name":"observation_notes","label":"Observation Notes","type":"textarea","required":false}]'::jsonb,
    '{"type":"RATING_1_5","scored":true,"max_raw_points":10,"field_name":"rating","formula":"(rating - 1) / 4 * max","red_flag_threshold":2,"rule_description":"Rating 1 to 5 mapped to 0..10 points: (r-1)/4*10. Score <= 2 triggers red flag."}'::jsonb,
    'HIGH',
    true,
    true,
    'Photographs + classroom observation',
    'Available but not used',
    'Teacher support',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 13: S08 (SCHOOL)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'S08',
    'SCHOOL',
    'SCHOOL',
    'Are teachers using activity-based / experiential methods appropriate to the grade?',
    'Rating',
    'MEDIUM',
    true,
    'RATING_1_5',
    true,
    'Classroom observation',
    '≤2',
    'Academic mentoring',
    'S08',
    NULL,
    'CSV_ONLY',
    NULL,
    TRUE,
    13
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'S08',
    1,
    'Are teachers using activity-based / experiential methods appropriate to the grade?',
    NULL,
    '[{"name":"rating","label":"Observation Rating (1 to 5)","type":"rating","min":1,"max":5,"required":true,"options":[{"value":1,"label":"1 - Highly Deficient / Absent"},{"value":2,"label":"2 - Poor / Substandard"},{"value":3,"label":"3 - Satisfactory / Basic"},{"value":4,"label":"4 - Good / Active"},{"value":5,"label":"5 - Exemplary / Full Uptake"}]},{"name":"observation_notes","label":"Observation Notes","type":"textarea","required":false}]'::jsonb,
    '{"type":"RATING_1_5","scored":true,"max_raw_points":10,"field_name":"rating","formula":"(rating - 1) / 4 * max","red_flag_threshold":2,"rule_description":"Rating 1 to 5 mapped to 0..10 points: (r-1)/4*10. Score <= 2 triggers red flag."}'::jsonb,
    'MEDIUM',
    true,
    true,
    'Classroom observation',
    '≤2',
    'Academic mentoring',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 14: S09 (SCHOOL)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'S09',
    'SCHOOL',
    'SCHOOL',
    'Is guidance and counselling available for students, and how many students received support recently?',
    'Yes/No + Number',
    'HIGH',
    true,
    'YESNO_WITH_COUNT',
    true,
    'Counselling register',
    'No service or zero uptake where need exists',
    'Counselling linkage',
    'S09',
    NULL,
    'CSV_ONLY',
    NULL,
    TRUE,
    14
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'S09',
    1,
    'Is guidance and counselling available for students, and how many students received support recently?',
    NULL,
    '[{"name":"available","label":"Guidance and counselling service available?","type":"radio","options":["YES","NO"],"required":true},{"name":"students_supported","label":"Number of students supported in last 30 days","type":"number","min":0,"required":false}]'::jsonb,
    '{"type":"YESNO_WITH_COUNT","scored":true,"max_raw_points":10,"boolean_field":"available","count_field":"students_supported","rule_description":"Available with positive uptake = 10 pts; Available but zero uptake = 5 pts; Not available = 0 pts."}'::jsonb,
    'HIGH',
    true,
    true,
    'Counselling register',
    'No service or zero uptake where need exists',
    'Counselling linkage',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 15: S10 (SCHOOL)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'S10',
    'SCHOOL',
    'SCHOOL',
    'Are functional audio-visual/digital facilities available and used for teaching?',
    'Rating',
    'MEDIUM',
    true,
    'GRID_AFU(score_used=true)',
    true,
    'Photo + observation',
    'Functional but unused',
    'Digital pedagogy support',
    'S10',
    '19',
    'MERGED',
    'Zip Q19 grid (electricity/internet/digital) replaces CSV rating; "used" is scored because CSV flags functional-but-unused.',
    TRUE,
    15
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'S10',
    1,
    'Are functional audio-visual/digital facilities available and used for teaching?',
    'Zip Q19 grid (electricity/internet/digital) replaces CSV rating; "used" is scored because CSV flags functional-but-unused.',
    '[{"name":"grid","label":"Audio-Visual / Digital Facilities","type":"grid_afu","rows":["Electricity Connection","Internet / WiFi Connectivity","Smart TV / Projector Display","Tablets / Computers for Students"],"columns":["available","functional","used"],"score_used":true}]'::jsonb,
    '{"type":"GRID_AFU","scored":true,"max_raw_points":12,"score_used":true,"rows":["Electricity Connection","Internet / WiFi Connectivity","Smart TV / Projector Display","Tablets / Computers for Students"],"points_per_row":3,"rule_description":"Per row: Available=1 pt, Functional=1 pt (only if available). Used=1 pt."}'::jsonb,
    'MEDIUM',
    true,
    true,
    'Photo + observation',
    'Functional but unused',
    'Digital pedagogy support',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 16: S11 (SCHOOL)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'S11',
    'SCHOOL',
    'SCHOOL',
    'Are drinking water, functional toilets, handwashing and girls'' WASH facilities available?',
    'Checklist',
    'CRITICAL',
    true,
    'GRID_AFU(score_used=false)',
    true,
    'Photographs',
    'Any critical facility absent',
    'Immediate repair/provision',
    'S11',
    '17;18',
    'MERGED',
    'Zip Q17 (water) + Q18 (toilets boys/girls/CWSN) + handwashing row. Water row max = 2 (available + functional).',
    TRUE,
    16
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'S11',
    1,
    'Are drinking water, functional toilets, handwashing and girls'' WASH facilities available?',
    'Zip Q17 (water) + Q18 (toilets boys/girls/CWSN) + handwashing row. Water row max = 2 (available + functional).',
    '[{"name":"grid","label":"WASH Facilities","type":"grid_afu","rows":["Drinking Water Facility","Boys Toilet Facility","Girls Toilet Facility","CWSN Accessible Toilet","Handwashing Station with Soap"],"columns":["available","functional"],"score_used":false}]'::jsonb,
    '{"type":"GRID_AFU","scored":true,"max_raw_points":10,"score_used":false,"rows":["Drinking Water Facility","Boys Toilet Facility","Girls Toilet Facility","CWSN Accessible Toilet","Handwashing Station with Soap"],"points_per_row":2,"rule_description":"Per row: Available=1 pt, Functional=1 pt (only if available). Used recorded but not scored."}'::jsonb,
    'CRITICAL',
    true,
    true,
    'Photographs',
    'Any critical facility absent',
    'Immediate repair/provision',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 17: S12 (SCHOOL)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'S12',
    'SCHOOL',
    'SCHOOL',
    'Are fire-safety arrangements available, accessible and recently checked?',
    'Checklist + Date',
    'CRITICAL',
    true,
    'CHECKLIST_YNP',
    true,
    'Photos + inspection record',
    'No extinguisher, blocked exit or no drill/inspection',
    'Immediate safety action',
    'S12',
    NULL,
    'CSV_ONLY',
    NULL,
    TRUE,
    17
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'S12',
    1,
    'Are fire-safety arrangements available, accessible and recently checked?',
    NULL,
    '[{"name":"checklist","label":"Fire Safety & Emergency Checklist","type":"checklist_ynp","items":["Functional fire extinguisher present and tagged within inspection expiry","Unobstructed emergency exits and clearly marked evacuation routes","Working alarm / siren / notification system","Evacuation drill conducted within the last 6 months"]},{"name":"last_drill_date","label":"Date of last drill / inspection","type":"date","required":false}]'::jsonb,
    '{"type":"CHECKLIST_YNP","scored":true,"max_raw_points":4,"items":["Functional fire extinguisher present and tagged within inspection expiry","Unobstructed emergency exits and clearly marked evacuation routes","Working alarm / siren / notification system","Evacuation drill conducted within the last 6 months"],"yes_points":1,"partial_points":0.5,"no_points":0,"rule_description":"Per checklist item: Yes = 1.0 pt, Partial = 0.5 pt, No = 0 pt. N/A excluded from total."}'::jsonb,
    'CRITICAL',
    true,
    true,
    'Photos + inspection record',
    'No extinguisher, blocked exit or no drill/inspection',
    'Immediate safety action',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 18: S13 (SCHOOL)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'S13',
    'SCHOOL',
    'SCHOOL',
    'Are CWSN/inclusive education facilities and reasonable accommodations available?',
    'Checklist',
    'HIGH',
    true,
    'CHECKLIST_YNP',
    true,
    'Photo + school record',
    'Identified CWSN without support',
    'Accessibility/support',
    'S13',
    '16',
    'MERGED',
    'Zip Q16 (CWSN count) kept as supporting field.',
    TRUE,
    18
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'S13',
    1,
    'Are CWSN/inclusive education facilities and reasonable accommodations available?',
    'Zip Q16 (CWSN count) kept as supporting field.',
    '[{"name":"checklist","label":"CWSN & Inclusive Facilities","type":"checklist_ynp","items":["Ramp with handrail for barrier-free physical access","CWSN-accessible toilet facility","Appropriate TLM / Braille / tactile assistive learning aids","Designated special educator or inclusive teacher support"]},{"name":"cwsn_count","label":"Identified CWSN enrolled","type":"number","min":0,"required":false}]'::jsonb,
    '{"type":"CHECKLIST_YNP","scored":true,"max_raw_points":4,"items":["Ramp with handrail for barrier-free physical access","CWSN-accessible toilet facility","Appropriate TLM / Braille / tactile assistive learning aids","Designated special educator or inclusive teacher support"],"yes_points":1,"partial_points":0.5,"no_points":0,"rule_description":"Per checklist item: Yes = 1.0 pt, Partial = 0.5 pt, No = 0 pt. N/A excluded from total."}'::jsonb,
    'HIGH',
    true,
    true,
    'Photo + school record',
    'Identified CWSN without support',
    'Accessibility/support',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 19: S14 (SCHOOL)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'S14',
    'SCHOOL',
    'SCHOOL',
    'Is any NGO/trust/CSR organisation currently supporting the school, and what measurable change has resulted?',
    'Structured + Narrative',
    'MEDIUM',
    false,
    'NONE',
    true,
    'MoU/report/photo/before-after data',
    'Activity reported but no evidence/outcome',
    'Document impact / coordinate',
    'S14',
    NULL,
    'CSV_ONLY',
    'Informational; evidence expected.',
    TRUE,
    19
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'S14',
    1,
    'Is any NGO/trust/CSR organisation currently supporting the school, and what measurable change has resulted?',
    'Informational; evidence expected.',
    '[{"name":"observation","label":"Detailed Field Observation","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    true,
    'MoU/report/photo/before-after data',
    'Activity reported but no evidence/outcome',
    'Document impact / coordinate',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 20: S15 (SCHOOL)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'S15',
    'SCHOOL',
    'SCHOOL',
    'What are the school''s three biggest gaps, and what single intervention would make the biggest difference?',
    'Top-3 + Priority',
    'HIGH',
    false,
    'NONE',
    false,
    'Photo/record where applicable',
    'Critical gap identified',
    'Create action plan',
    'S15',
    '21;22',
    'MERGED',
    'Zip Q21 (3 gaps) + Q22 (support needed) folded in.',
    TRUE,
    20
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'S15',
    1,
    'What are the school''s three biggest gaps, and what single intervention would make the biggest difference?',
    'Zip Q21 (3 gaps) + Q22 (support needed) folded in.',
    '[{"name":"gap_1","label":"Priority 1 (Highest Impact Gap)","type":"text","required":false},{"name":"gap_2","label":"Priority 2 Gap","type":"text","required":false},{"name":"gap_3","label":"Priority 3 Gap","type":"text","required":false},{"name":"single_intervention","label":"Single most critical intervention recommended","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'HIGH',
    false,
    false,
    'Photo/record where applicable',
    'Critical gap identified',
    'Create action plan',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 21: S16 (SCHOOL)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'S16',
    'SCHOOL',
    'SCHOOL',
    'Library / laboratory / playground / classroom adequacy?',
    'Text',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '20',
    'UNIQUE_ZIP',
    'Library / lab / playground / classroom condition.',
    TRUE,
    21
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'S16',
    1,
    'Library / laboratory / playground / classroom adequacy?',
    'Library / lab / playground / classroom condition.',
    '[{"name":"response","label":"Response / Finding","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 22: A02 (ANGANWADI)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'A02',
    'ANGANWADI',
    'ANGANWADI',
    'How many registered children are there, by age and gender?',
    'Numbers',
    'MEDIUM',
    false,
    'NONE',
    true,
    'Register / POSHAN Tracker',
    'Large unexplained mismatch',
    'Reconcile records',
    'A02',
    '24',
    'MERGED',
    'Zip Q24 folded in.',
    TRUE,
    22
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'A02',
    1,
    'How many registered children are there, by age and gender?',
    'Zip Q24 folded in.',
    '[{"name":"numeric_value","label":"How many registered children are there, by age and gender?","type":"number","min":0,"required":false},{"name":"notes","label":"Additional details","type":"text","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    true,
    'Register / POSHAN Tracker',
    'Large unexplained mismatch',
    'Reconcile records',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 23: A03 (ANGANWADI)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'A03',
    'ANGANWADI',
    'ANGANWADI',
    'How many registered children attend regularly?',
    'Number + %',
    'HIGH',
    true,
    'PERCENT_THRESHOLD(>=75)',
    true,
    'Attendance register',
    '<75%',
    'Community mobilisation',
    'A03',
    '25',
    'MERGED',
    NULL,
    TRUE,
    23
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'A03',
    1,
    'How many registered children attend regularly?',
    NULL,
    '[{"name":"attendance_pct","label":"Average Attendance (%)","type":"number","min":0,"max":100,"step":0.1,"unit":"%","required":true}]'::jsonb,
    '{"type":"PERCENT_THRESHOLD","scored":true,"max_raw_points":10,"field_name":"attendance_pct","threshold":75,"partial_margin":10,"inverted":false,"rule_description":">= 75% earns full points (10); 65% to < 75% earns partial points (5); < 65% earns 0."}'::jsonb,
    'HIGH',
    true,
    true,
    'Attendance register',
    '<75%',
    'Community mobilisation',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 24: A04 (ANGANWADI)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'A04',
    'ANGANWADI',
    'ANGANWADI',
    'How many pregnant women and lactating mothers are registered and receiving services?',
    'Numbers',
    'HIGH',
    true,
    'RATIO(receiving/registered)',
    true,
    'Register / POSHAN Tracker',
    'Registered but not receiving service',
    'Follow-up',
    'A04',
    '26',
    'MERGED',
    NULL,
    TRUE,
    24
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'A04',
    1,
    'How many pregnant women and lactating mothers are registered and receiving services?',
    NULL,
    '[{"name":"registered","label":"Total Registered Pregnant & Lactating Mothers","type":"number","min":0,"required":true},{"name":"receiving","label":"Mothers Actively Receiving Services & Take-Home Ration","type":"number","min":0,"required":true}]'::jsonb,
    '{"type":"RATIO","scored":true,"max_raw_points":10,"numerator_field":"receiving","denominator_field":"registered","rule_description":"Proportion of registered pregnant/lactating mothers receiving services."}'::jsonb,
    'HIGH',
    true,
    true,
    'Register / POSHAN Tracker',
    'Registered but not receiving service',
    'Follow-up',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 25: A05 (ANGANWADI)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'A05',
    'ANGANWADI',
    'ANGANWADI',
    'Is supplementary nutrition / THR / hot cooked meal being provided as scheduled?',
    'Checklist',
    'CRITICAL',
    true,
    'CHECKLIST_YNP',
    true,
    'Stock/distribution record + photo',
    'Missed distribution',
    'Supply/escalation',
    'A05',
    '27',
    'MERGED',
    NULL,
    TRUE,
    25
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'A05',
    1,
    'Is supplementary nutrition / THR / hot cooked meal being provided as scheduled?',
    NULL,
    '[{"name":"checklist","label":"Supplementary Nutrition Schedule","type":"checklist_ynp","items":["Supplementary nutrition distributed strictly per monthly schedule","Take Home Ration (THR) packets available in clean, sealed condition","Hot cooked meal served daily with mandated variety/nutrition standards","Hygienic food storage and clean drinking water cooking area"]}]'::jsonb,
    '{"type":"CHECKLIST_YNP","scored":true,"max_raw_points":4,"items":["Supplementary nutrition distributed strictly per monthly schedule","Take Home Ration (THR) packets available in clean, sealed condition","Hot cooked meal served daily with mandated variety/nutrition standards","Hygienic food storage and clean drinking water cooking area"],"yes_points":1,"partial_points":0.5,"no_points":0,"rule_description":"Per checklist item: Yes = 1.0 pt, Partial = 0.5 pt, No = 0 pt. N/A excluded from total."}'::jsonb,
    'CRITICAL',
    true,
    true,
    'Stock/distribution record + photo',
    'Missed distribution',
    'Supply/escalation',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 26: A06 (ANGANWADI)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'A06',
    'ANGANWADI',
    'ANGANWADI',
    'Is growth monitoring being conducted on schedule with functional weighing/height equipment?',
    'Checklist',
    'CRITICAL',
    true,
    'CHECKLIST_YNP',
    true,
    'Equipment photo + growth records',
    'Equipment unavailable or measurements overdue',
    'Repair/replacement + follow-up',
    'A06',
    '28',
    'MERGED',
    NULL,
    TRUE,
    26
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'A06',
    1,
    'Is growth monitoring being conducted on schedule with functional weighing/height equipment?',
    NULL,
    '[{"name":"checklist","label":"Growth Monitoring & Equipment","type":"checklist_ynp","items":["Functional digital infant weighing scale available","Functional stadiometer / infantometer height measurement tool available","MUAC measurement tapes available and staff trained","Growth charts plotted and updated within last 30 days"]}]'::jsonb,
    '{"type":"CHECKLIST_YNP","scored":true,"max_raw_points":4,"items":["Functional digital infant weighing scale available","Functional stadiometer / infantometer height measurement tool available","MUAC measurement tapes available and staff trained","Growth charts plotted and updated within last 30 days"],"yes_points":1,"partial_points":0.5,"no_points":0,"rule_description":"Per checklist item: Yes = 1.0 pt, Partial = 0.5 pt, No = 0 pt. N/A excluded from total."}'::jsonb,
    'CRITICAL',
    true,
    true,
    'Equipment photo + growth records',
    'Equipment unavailable or measurements overdue',
    'Repair/replacement + follow-up',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 27: A07 (ANGANWADI)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'A07',
    'ANGANWADI',
    'ANGANWADI',
    'How many children are identified as nutritionally vulnerable, and how many received follow-up/referral?',
    'Numbers',
    'CRITICAL',
    true,
    'RATIO(followed_up/identified)',
    true,
    'Growth record + referral record',
    'Vulnerable child without follow-up',
    'Case management/referral',
    'A07',
    '29',
    'MERGED',
    NULL,
    TRUE,
    27
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'A07',
    1,
    'How many children are identified as nutritionally vulnerable, and how many received follow-up/referral?',
    NULL,
    '[{"name":"identified","label":"Children Identified as Nutritionally Vulnerable (SAM / MAM)","type":"number","min":0,"required":true},{"name":"followed_up","label":"Vulnerable Children Provided Active Follow-up / NRC Referral","type":"number","min":0,"required":true}]'::jsonb,
    '{"type":"RATIO","scored":true,"max_raw_points":10,"numerator_field":"followed_up","denominator_field":"identified","rule_description":"Proportion of identified vulnerable children receiving active follow-up/referral."}'::jsonb,
    'CRITICAL',
    true,
    true,
    'Growth record + referral record',
    'Vulnerable child without follow-up',
    'Case management/referral',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 28: A08 (ANGANWADI)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'A08',
    'ANGANWADI',
    'ANGANWADI',
    'Are preschool/ECCE activities conducted regularly using age-appropriate play-based methods?',
    'Rating',
    'HIGH',
    true,
    'RATING_1_5',
    true,
    'Observation + activity record',
    '≤2 or no regular sessions',
    'ECCE mentoring',
    'A08',
    '30',
    'MERGED',
    NULL,
    TRUE,
    28
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'A08',
    1,
    'Are preschool/ECCE activities conducted regularly using age-appropriate play-based methods?',
    NULL,
    '[{"name":"rating","label":"Observation Rating (1 to 5)","type":"rating","min":1,"max":5,"required":true,"options":[{"value":1,"label":"1 - Highly Deficient / Absent"},{"value":2,"label":"2 - Poor / Substandard"},{"value":3,"label":"3 - Satisfactory / Basic"},{"value":4,"label":"4 - Good / Active"},{"value":5,"label":"5 - Exemplary / Full Uptake"}]},{"name":"observation_notes","label":"Observation Notes","type":"textarea","required":false}]'::jsonb,
    '{"type":"RATING_1_5","scored":true,"max_raw_points":10,"field_name":"rating","formula":"(rating - 1) / 4 * max","red_flag_threshold":2,"rule_description":"Rating 1 to 5 mapped to 0..10 points: (r-1)/4*10. Score <= 2 triggers red flag."}'::jsonb,
    'HIGH',
    true,
    true,
    'Observation + activity record',
    '≤2 or no regular sessions',
    'ECCE mentoring',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 29: A09 (ANGANWADI)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'A09',
    'ANGANWADI',
    'ANGANWADI',
    'Are learning materials, toys and local-language TLM available, usable and actually used?',
    'Rating',
    'MEDIUM',
    true,
    'GRID_AFU(score_used=true)',
    true,
    'Photos + observation',
    'Available but not used',
    'Material/worker support',
    'A09',
    '31',
    'MERGED',
    NULL,
    TRUE,
    29
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'A09',
    1,
    'Are learning materials, toys and local-language TLM available, usable and actually used?',
    NULL,
    '[{"name":"grid","label":"ECCE Play & Learning Materials","type":"grid_afu","rows":["Picture Storybooks & Chart Posters","Age-appropriate Puzzles & Building Blocks","Local Language Toys & Puppet Kits","Outdoor Activity & Play Equipment"],"columns":["available","functional","used"],"score_used":true}]'::jsonb,
    '{"type":"GRID_AFU","scored":true,"max_raw_points":12,"score_used":true,"rows":["Picture Storybooks & Chart Posters","Age-appropriate Puzzles & Building Blocks","Local Language Toys & Puppet Kits","Outdoor Activity & Play Equipment"],"points_per_row":3,"rule_description":"Per row: Available=1 pt, Functional=1 pt (only if available). Used=1 pt."}'::jsonb,
    'MEDIUM',
    true,
    true,
    'Photos + observation',
    'Available but not used',
    'Material/worker support',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 30: A10 (ANGANWADI)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'A10',
    'ANGANWADI',
    'ANGANWADI',
    'Are drinking water, toilet, handwashing, ventilation and child-safe space adequate?',
    'Checklist',
    'HIGH',
    true,
    'CHECKLIST_YNP',
    true,
    'Photos',
    'Any critical gap',
    'Repair/provision',
    'A10',
    NULL,
    'CSV_ONLY',
    NULL,
    TRUE,
    30
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'A10',
    1,
    'Are drinking water, toilet, handwashing, ventilation and child-safe space adequate?',
    NULL,
    '[{"name":"checklist","label":"Anganwadi Infrastructure & Safety","type":"checklist_ynp","items":["Safe and potable drinking water source within premises","Clean, functional, child-friendly toilet facility","Handwashing station with continuous running water and soap","Adequate natural ventilation, lighting, and child-safe boundary"]}]'::jsonb,
    '{"type":"CHECKLIST_YNP","scored":true,"max_raw_points":4,"items":["Safe and potable drinking water source within premises","Clean, functional, child-friendly toilet facility","Handwashing station with continuous running water and soap","Adequate natural ventilation, lighting, and child-safe boundary"],"yes_points":1,"partial_points":0.5,"no_points":0,"rule_description":"Per checklist item: Yes = 1.0 pt, Partial = 0.5 pt, No = 0 pt. N/A excluded from total."}'::jsonb,
    'HIGH',
    true,
    true,
    'Photos',
    'Any critical gap',
    'Repair/provision',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 31: A11 (ANGANWADI)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'A11',
    'ANGANWADI',
    'ANGANWADI',
    'Are health check-ups, immunisation coordination and referrals functioning regularly?',
    'Checklist + Frequency',
    'HIGH',
    true,
    'CHECKLIST_YNP',
    true,
    'Health record / VHND record',
    'Missed sessions or unresolved referrals',
    'Coordinate with health team',
    'A11',
    '32',
    'MERGED',
    NULL,
    TRUE,
    31
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'A11',
    1,
    'Are health check-ups, immunisation coordination and referrals functioning regularly?',
    NULL,
    '[{"name":"checklist","label":"Health Check-ups & VHND","type":"checklist_ynp","items":["Monthly Village Health Sanitation and Nutrition Day (VHSND) conducted","Routine immunisation tracking up to date for 0-6 years","Biannual Vitamin A and biannual deworming administered","Referrals to PHC/CHC tracked and documented"]}]'::jsonb,
    '{"type":"CHECKLIST_YNP","scored":true,"max_raw_points":4,"items":["Monthly Village Health Sanitation and Nutrition Day (VHSND) conducted","Routine immunisation tracking up to date for 0-6 years","Biannual Vitamin A and biannual deworming administered","Referrals to PHC/CHC tracked and documented"],"yes_points":1,"partial_points":0.5,"no_points":0,"rule_description":"Per checklist item: Yes = 1.0 pt, Partial = 0.5 pt, No = 0 pt. N/A excluded from total."}'::jsonb,
    'HIGH',
    true,
    true,
    'Health record / VHND record',
    'Missed sessions or unresolved referrals',
    'Coordinate with health team',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 32: A12 (ANGANWADI)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'A12',
    'ANGANWADI',
    'ANGANWADI',
    'Is the centre using POSHAN Tracker/required records accurately and on time?',
    'Rating',
    'CRITICAL',
    true,
    'RATING_1_5',
    true,
    'Screenshot + register',
    'Field record differs from digital record',
    'Reconciliation/training',
    'A12',
    NULL,
    'CSV_ONLY',
    NULL,
    TRUE,
    32
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'A12',
    1,
    'Is the centre using POSHAN Tracker/required records accurately and on time?',
    NULL,
    '[{"name":"rating","label":"Observation Rating (1 to 5)","type":"rating","min":1,"max":5,"required":true,"options":[{"value":1,"label":"1 - Highly Deficient / Absent"},{"value":2,"label":"2 - Poor / Substandard"},{"value":3,"label":"3 - Satisfactory / Basic"},{"value":4,"label":"4 - Good / Active"},{"value":5,"label":"5 - Exemplary / Full Uptake"}]},{"name":"observation_notes","label":"Observation Notes","type":"textarea","required":false}]'::jsonb,
    '{"type":"RATING_1_5","scored":true,"max_raw_points":10,"field_name":"rating","formula":"(rating - 1) / 4 * max","red_flag_threshold":2,"rule_description":"Rating 1 to 5 mapped to 0..10 points: (r-1)/4*10. Score <= 2 triggers red flag."}'::jsonb,
    'CRITICAL',
    true,
    true,
    'Screenshot + register',
    'Field record differs from digital record',
    'Reconciliation/training',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 33: A13 (ANGANWADI)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'A13',
    'ANGANWADI',
    'ANGANWADI',
    'Are fire-safety and emergency arrangements adequate for children at the centre?',
    'Checklist',
    'CRITICAL',
    true,
    'CHECKLIST_YNP',
    true,
    'Photos',
    'No basic emergency arrangement',
    'Immediate safety action',
    'A13',
    NULL,
    'CSV_ONLY',
    NULL,
    TRUE,
    33
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'A13',
    1,
    'Are fire-safety and emergency arrangements adequate for children at the centre?',
    NULL,
    '[{"name":"checklist","label":"Anganwadi Emergency & Safety","type":"checklist_ynp","items":["Fire safety / sand buckets or extinguisher readily available","Stocked and unexpired first aid kit accessible to worker","Safe electrical wiring without exposed cords or sockets at child height","Emergency contact numbers (doctor, hospital, police) clearly displayed"]}]'::jsonb,
    '{"type":"CHECKLIST_YNP","scored":true,"max_raw_points":4,"items":["Fire safety / sand buckets or extinguisher readily available","Stocked and unexpired first aid kit accessible to worker","Safe electrical wiring without exposed cords or sockets at child height","Emergency contact numbers (doctor, hospital, police) clearly displayed"],"yes_points":1,"partial_points":0.5,"no_points":0,"rule_description":"Per checklist item: Yes = 1.0 pt, Partial = 0.5 pt, No = 0 pt. N/A excluded from total."}'::jsonb,
    'CRITICAL',
    true,
    true,
    'Photos',
    'No basic emergency arrangement',
    'Immediate safety action',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 34: A14 (ANGANWADI)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'A14',
    'ANGANWADI',
    'ANGANWADI',
    'Is any NGO/trust/CSR organisation supporting the Anganwadi, and what measurable impact has it created?',
    'Structured + Narrative',
    'MEDIUM',
    false,
    'NONE',
    true,
    'MoU/report/photo/before-after data',
    'No evidence of claimed impact',
    'Coordinate/document impact',
    'A14',
    NULL,
    'CSV_ONLY',
    NULL,
    TRUE,
    34
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'A14',
    1,
    'Is any NGO/trust/CSR organisation supporting the Anganwadi, and what measurable impact has it created?',
    NULL,
    '[{"name":"observation","label":"Detailed Field Observation","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    true,
    'MoU/report/photo/before-after data',
    'No evidence of claimed impact',
    'Coordinate/document impact',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 35: A15 (ANGANWADI)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'A15',
    'ANGANWADI',
    'ANGANWADI',
    'What are the three biggest Anganwadi gaps, and what support would create the greatest improvement?',
    'Top-3 + Priority',
    'HIGH',
    false,
    'NONE',
    false,
    'Photo/record where applicable',
    'Critical service gap',
    'Create action plan',
    'A15',
    '33',
    'MERGED',
    NULL,
    TRUE,
    35
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'A15',
    1,
    'What are the three biggest Anganwadi gaps, and what support would create the greatest improvement?',
    NULL,
    '[{"name":"gap_1","label":"Priority 1 (Highest Impact Gap)","type":"text","required":false},{"name":"gap_2","label":"Priority 2 Gap","type":"text","required":false},{"name":"gap_3","label":"Priority 3 Gap","type":"text","required":false},{"name":"single_intervention","label":"Single most critical intervention recommended","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'HIGH',
    false,
    false,
    'Photo/record where applicable',
    'Critical service gap',
    'Create action plan',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 36: P01 (HEALTH)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'P01',
    'HEALTH',
    'HEALTH',
    'Facility name, facility type and population/area covered?',
    'Structured',
    'MEDIUM',
    false,
    'NONE',
    true,
    'Facility record',
    'Coverage data unavailable',
    'Verify catchment',
    'P01',
    NULL,
    'CSV_ONLY',
    'Facility type + population covered only (name moved to registry).',
    TRUE,
    36
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'P01',
    1,
    'Facility name, facility type and population/area covered?',
    'Facility type + population covered only (name moved to registry).',
    '[{"name":"observation","label":"Detailed Field Observation","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    true,
    'Facility record',
    'Coverage data unavailable',
    'Verify catchment',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 37: P02 (HEALTH)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'P02',
    'HEALTH',
    'HEALTH',
    'How many doctors, nurses, ANM/MPW and other staff are sanctioned, working and present?',
    'Numbers',
    'CRITICAL',
    true,
    'RATIO(working/sanctioned; present/sanctioned)',
    true,
    'HR record + attendance',
    'Critical vacancy/absence',
    'Staffing/escalation',
    'P02',
    '35',
    'MERGED',
    NULL,
    TRUE,
    37
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'P02',
    1,
    'How many doctors, nurses, ANM/MPW and other staff are sanctioned, working and present?',
    NULL,
    '[{"name":"sanctioned","label":"Sanctioned Posts","type":"number","min":0,"required":true},{"name":"working","label":"Currently Working","type":"number","min":0,"required":true},{"name":"present_today","label":"Present Today","type":"number","min":0,"required":true}]'::jsonb,
    '{"type":"RATIO","scored":true,"max_raw_points":10,"numerator_field":"working","denominator_field":"sanctioned","secondary_numerator":"present_today","rule_description":"Proportion of sanctioned staff working and present today. Denominator 0 = not assessed."}'::jsonb,
    'CRITICAL',
    true,
    true,
    'HR record + attendance',
    'Critical vacancy/absence',
    'Staffing/escalation',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 38: P03 (HEALTH)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'P03',
    'HEALTH',
    'HEALTH',
    'What is the approximate OPD/patient load for the last 30 days?',
    'Number',
    'MEDIUM',
    false,
    'NONE',
    true,
    'OPD register/HMIS',
    'Sudden unexplained drop/spike',
    'Verify cause',
    'P03',
    '36',
    'MERGED',
    NULL,
    TRUE,
    38
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'P03',
    1,
    'What is the approximate OPD/patient load for the last 30 days?',
    NULL,
    '[{"name":"numeric_value","label":"What is the approximate OPD/patient load for the last 30 days?","type":"number","min":0,"required":false},{"name":"notes","label":"Additional details","type":"text","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    true,
    'OPD register/HMIS',
    'Sudden unexplained drop/spike',
    'Verify cause',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 39: P04 (HEALTH)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'P04',
    'HEALTH',
    'HEALTH',
    'Are essential medicines available today, and were there stock-outs in the last 30 days?',
    'Checklist + Number',
    'CRITICAL',
    true,
    'CHECKLIST_YNP',
    true,
    'Stock register + photo',
    'Critical medicine stock-out',
    'Replenishment',
    'P04',
    '37',
    'MERGED',
    NULL,
    TRUE,
    39
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'P04',
    1,
    'Are essential medicines available today, and were there stock-outs in the last 30 days?',
    NULL,
    '[{"name":"checklist","label":"Essential Medicines Availability","type":"checklist_ynp","items":["Essential antibiotics and analgesics currently in stock","ORS packets and Zinc dispersible tablets in stock","Antihypertensive and basic diabetes management drugs in stock","Emergency obstetric and child life-saving injections in stock"]},{"name":"stockouts_count","label":"Number of stock-out incidents in last 30 days","type":"number","min":0,"required":false}]'::jsonb,
    '{"type":"CHECKLIST_YNP","scored":true,"max_raw_points":4,"items":["Essential antibiotics and analgesics currently in stock","ORS packets and Zinc dispersible tablets in stock","Antihypertensive and basic diabetes management drugs in stock","Emergency obstetric and child life-saving injections in stock"],"yes_points":1,"partial_points":0.5,"no_points":0,"rule_description":"Per checklist item: Yes = 1.0 pt, Partial = 0.5 pt, No = 0 pt. N/A excluded from total."}'::jsonb,
    'CRITICAL',
    true,
    true,
    'Stock register + photo',
    'Critical medicine stock-out',
    'Replenishment',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 40: P05 (HEALTH)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'P05',
    'HEALTH',
    'HEALTH',
    'Are essential/basic diagnostics available and functional?',
    'Checklist',
    'HIGH',
    true,
    'GRID_AFU(score_used=false)',
    true,
    'Equipment + lab record',
    'Critical diagnostic unavailable',
    'Repair/procurement',
    'P05',
    '38',
    'MERGED',
    NULL,
    TRUE,
    40
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'P05',
    1,
    'Are essential/basic diagnostics available and functional?',
    NULL,
    '[{"name":"grid","label":"Essential Basic Diagnostics","type":"grid_afu","rows":["Blood Pressure Monitor (Sphygmomanometer / Digital)","Glucometer with Test Strips","Hemoglobinometer / Sahli Kit","Urine Protein & Sugar Test Strips","Malaria Rapid Diagnostic Kits (RDT)","Pulse Oximeter"],"columns":["available","functional"],"score_used":false}]'::jsonb,
    '{"type":"GRID_AFU","scored":true,"max_raw_points":12,"score_used":false,"rows":["Blood Pressure Monitor","Glucometer with Test Strips","Hemoglobinometer / Sahli Kit","Urine Protein & Sugar Test Strips","Malaria Rapid Diagnostic Kits (RDT)","Pulse Oximeter"],"points_per_row":2,"rule_description":"Per row: Available=1 pt, Functional=1 pt (only if available). Used recorded but not scored."}'::jsonb,
    'HIGH',
    true,
    true,
    'Equipment + lab record',
    'Critical diagnostic unavailable',
    'Repair/procurement',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 41: P06 (HEALTH)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'P06',
    'HEALTH',
    'HEALTH',
    'Which maternal health services are available, and are referrals completed when required?',
    'Checklist + Number',
    'CRITICAL',
    true,
    'CHECKLIST_YNP',
    true,
    'Registers/referral records',
    'Uncompleted high-risk referral',
    'Referral escalation',
    'P06',
    '39',
    'MERGED',
    NULL,
    TRUE,
    41
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'P06',
    1,
    'Which maternal health services are available, and are referrals completed when required?',
    NULL,
    '[{"name":"checklist","label":"Maternal Health & Delivery Services","type":"checklist_ynp","items":["Antenatal care (ANC) check-ups with blood pressure and Hb testing","Functional labour room / institutional delivery capability or 24/7 link","Postnatal care (PNC) monitoring and counselling provided","High-risk pregnancy identification and completed emergency referral"]}]'::jsonb,
    '{"type":"CHECKLIST_YNP","scored":true,"max_raw_points":4,"items":["Antenatal care (ANC) check-ups with blood pressure and Hb testing","Functional labour room / institutional delivery capability or 24/7 link","Postnatal care (PNC) monitoring and counselling provided","High-risk pregnancy identification and completed emergency referral"],"yes_points":1,"partial_points":0.5,"no_points":0,"rule_description":"Per checklist item: Yes = 1.0 pt, Partial = 0.5 pt, No = 0 pt. N/A excluded from total."}'::jsonb,
    'CRITICAL',
    true,
    true,
    'Registers/referral records',
    'Uncompleted high-risk referral',
    'Referral escalation',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 42: P07 (HEALTH)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'P07',
    'HEALTH',
    'HEALTH',
    'Are child health and immunisation services available and regularly coordinated?',
    'Checklist + Frequency',
    'HIGH',
    true,
    'CHECKLIST_YNP',
    true,
    'Immunisation/VHND record',
    'Missed sessions/low coverage',
    'Convergence action',
    'P07',
    '40',
    'MERGED',
    NULL,
    TRUE,
    42
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'P07',
    1,
    'Are child health and immunisation services available and regularly coordinated?',
    NULL,
    '[{"name":"checklist","label":"Child Health & Immunisation Services","type":"checklist_ynp","items":["Functional cold chain equipment (ILR / Deep Freezer) maintaining 2-8°C","Routine childhood immunisation sessions conducted without stockouts","Management of acute childhood respiratory infections & diarrhoea","Infant growth monitoring and severe malnutrition referral"]}]'::jsonb,
    '{"type":"CHECKLIST_YNP","scored":true,"max_raw_points":4,"items":["Functional cold chain equipment (ILR / Deep Freezer) maintaining 2-8°C","Routine childhood immunisation sessions conducted without stockouts","Management of acute childhood respiratory infections & diarrhoea","Infant growth monitoring and severe malnutrition referral"],"yes_points":1,"partial_points":0.5,"no_points":0,"rule_description":"Per checklist item: Yes = 1.0 pt, Partial = 0.5 pt, No = 0 pt. N/A excluded from total."}'::jsonb,
    'HIGH',
    true,
    true,
    'Immunisation/VHND record',
    'Missed sessions/low coverage',
    'Convergence action',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 43: P08 (HEALTH)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'P08',
    'HEALTH',
    'HEALTH',
    'Are NCD screening, treatment and follow-up services available for eligible patients?',
    'Checklist + Numbers',
    'HIGH',
    true,
    'CHECKLIST_YNP',
    true,
    'NCD register',
    'Screening without follow-up',
    'Follow-up system',
    'P08',
    '41',
    'MERGED',
    NULL,
    TRUE,
    43
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'P08',
    1,
    'Are NCD screening, treatment and follow-up services available for eligible patients?',
    NULL,
    '[{"name":"checklist","label":"NCD Screening & Management","type":"checklist_ynp","items":["Screening for hypertension and diabetes for eligible adults (30+)","Oral / breast / cervical cancer awareness and primary screening","Regular monthly medicine dispensation for registered NCD patients","Documented follow-up tracking for non-compliant chronic patients"]}]'::jsonb,
    '{"type":"CHECKLIST_YNP","scored":true,"max_raw_points":4,"items":["Screening for hypertension and diabetes for eligible adults (30+)","Oral / breast / cervical cancer awareness and primary screening","Regular monthly medicine dispensation for registered NCD patients","Documented follow-up tracking for non-compliant chronic patients"],"yes_points":1,"partial_points":0.5,"no_points":0,"rule_description":"Per checklist item: Yes = 1.0 pt, Partial = 0.5 pt, No = 0 pt. N/A excluded from total."}'::jsonb,
    'HIGH',
    true,
    true,
    'NCD register',
    'Screening without follow-up',
    'Follow-up system',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 44: P09 (HEALTH)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'P09',
    'HEALTH',
    'HEALTH',
    'Are mental-health, counselling, first-aid and emergency/trauma response arrangements available?',
    'Checklist',
    'CRITICAL',
    true,
    'CHECKLIST_YNP',
    true,
    'Facility observation + record',
    'No emergency/first-aid arrangement',
    'Immediate preparedness action',
    'P09',
    NULL,
    'CSV_ONLY',
    NULL,
    TRUE,
    44
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'P09',
    1,
    'Are mental-health, counselling, first-aid and emergency/trauma response arrangements available?',
    NULL,
    '[{"name":"checklist","label":"Emergency, Trauma & Counselling","type":"checklist_ynp","items":["Functional first aid and trauma resuscitation kit","Anti-snake venom (ASV) and anti-rabies vaccine (ARV) in stock","Emergency ambulance / referral transportation tie-up functional","Mental health support and basic psychosocial counselling available"]}]'::jsonb,
    '{"type":"CHECKLIST_YNP","scored":true,"max_raw_points":4,"items":["Functional first aid and trauma resuscitation kit","Anti-snake venom (ASV) and anti-rabies vaccine (ARV) in stock","Emergency ambulance / referral transportation tie-up functional","Mental health support and basic psychosocial counselling available"],"yes_points":1,"partial_points":0.5,"no_points":0,"rule_description":"Per checklist item: Yes = 1.0 pt, Partial = 0.5 pt, No = 0 pt. N/A excluded from total."}'::jsonb,
    'CRITICAL',
    true,
    true,
    'Facility observation + record',
    'No emergency/first-aid arrangement',
    'Immediate preparedness action',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 45: P10 (HEALTH)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'P10',
    'HEALTH',
    'HEALTH',
    'What are the three most common health problems in the catchment, and what are the major reasons for referral outside the facility?',
    'Top-3 + Narrative',
    'HIGH',
    false,
    'NONE',
    true,
    'OPD/referral records',
    'High avoidable referral burden',
    'Service-gap intervention',
    'P10',
    '42;43',
    'MERGED',
    'Zip Q42 (common problems) + Q43 (referral reasons) folded in.',
    TRUE,
    45
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'P10',
    1,
    'What are the three most common health problems in the catchment, and what are the major reasons for referral outside the facility?',
    'Zip Q42 (common problems) + Q43 (referral reasons) folded in.',
    '[{"name":"gap_1","label":"Priority 1 (Highest Impact Gap)","type":"text","required":false},{"name":"gap_2","label":"Priority 2 Gap","type":"text","required":false},{"name":"gap_3","label":"Priority 3 Gap","type":"text","required":false},{"name":"single_intervention","label":"Single most critical intervention recommended","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'HIGH',
    false,
    true,
    'OPD/referral records',
    'High avoidable referral burden',
    'Service-gap intervention',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 46: P11 (HEALTH)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'P11',
    'HEALTH',
    'HEALTH',
    'Are fire-safety systems, emergency exits and evacuation arrangements functional and recently checked?',
    'Checklist + Date',
    'CRITICAL',
    true,
    'CHECKLIST_YNP',
    true,
    'Photos + inspection record',
    'Blocked exit/no extinguisher/no inspection',
    'Immediate safety action',
    'P11',
    NULL,
    'CSV_ONLY',
    NULL,
    TRUE,
    46
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'P11',
    1,
    'Are fire-safety systems, emergency exits and evacuation arrangements functional and recently checked?',
    NULL,
    '[{"name":"checklist","label":"Fire Safety & Emergency Checklist","type":"checklist_ynp","items":["Functional fire extinguisher present and tagged within inspection expiry","Unobstructed emergency exits and clearly marked evacuation routes","Working alarm / siren / notification system","Evacuation drill conducted within the last 6 months"]},{"name":"last_drill_date","label":"Date of last drill / inspection","type":"date","required":false}]'::jsonb,
    '{"type":"CHECKLIST_YNP","scored":true,"max_raw_points":4,"items":["Functional fire extinguisher present and tagged within inspection expiry","Unobstructed emergency exits and clearly marked evacuation routes","Working alarm / siren / notification system","Evacuation drill conducted within the last 6 months"],"yes_points":1,"partial_points":0.5,"no_points":0,"rule_description":"Per checklist item: Yes = 1.0 pt, Partial = 0.5 pt, No = 0 pt. N/A excluded from total."}'::jsonb,
    'CRITICAL',
    true,
    true,
    'Photos + inspection record',
    'Blocked exit/no extinguisher/no inspection',
    'Immediate safety action',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 47: P12 (HEALTH)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'P12',
    'HEALTH',
    'HEALTH',
    'Are power backup, water, sanitation, biomedical waste management and infection-control arrangements adequate?',
    'Checklist',
    'CRITICAL',
    true,
    'CHECKLIST_YNP',
    true,
    'Photos + records',
    'Critical utility/infection-control gap',
    'Immediate corrective action',
    'P12',
    NULL,
    'CSV_ONLY',
    NULL,
    TRUE,
    47
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'P12',
    1,
    'Are power backup, water, sanitation, biomedical waste management and infection-control arrangements adequate?',
    NULL,
    '[{"name":"checklist","label":"Utilities, Waste & Infection Control","type":"checklist_ynp","items":["Uninterrupted 24/7 power supply with functional generator / inverter backup","Continuous running potable water in clinical areas and toilets","Colour-coded biomedical waste segregation bins and sharp disposal pits","Standard infection control protocols, autoclaving and PPE available"]}]'::jsonb,
    '{"type":"CHECKLIST_YNP","scored":true,"max_raw_points":4,"items":["Uninterrupted 24/7 power supply with functional generator / inverter backup","Continuous running potable water in clinical areas and toilets","Colour-coded biomedical waste segregation bins and sharp disposal pits","Standard infection control protocols, autoclaving and PPE available"],"yes_points":1,"partial_points":0.5,"no_points":0,"rule_description":"Per checklist item: Yes = 1.0 pt, Partial = 0.5 pt, No = 0 pt. N/A excluded from total."}'::jsonb,
    'CRITICAL',
    true,
    true,
    'Photos + records',
    'Critical utility/infection-control gap',
    'Immediate corrective action',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 48: P13 (HEALTH)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'P13',
    'HEALTH',
    'HEALTH',
    'Does the facility''s physical service delivery match its registers/HMIS/digital records?',
    'Yes/No + %',
    'CRITICAL',
    true,
    'PERCENT_THRESHOLD(mismatch<=10)',
    true,
    'Register + digital screenshot',
    'Mismatch >10%',
    'Reconciliation/audit',
    'P13',
    NULL,
    'CSV_ONLY',
    NULL,
    TRUE,
    48
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'P13',
    1,
    'Does the facility''s physical service delivery match its registers/HMIS/digital records?',
    NULL,
    '[{"name":"physical_reported","label":"Physical register count of services delivered","type":"number","min":0,"required":true},{"name":"digital_reported","label":"HMIS / digital portal recorded count","type":"number","min":0,"required":true},{"name":"mismatch_pct","label":"Calculated / Observed Mismatch Percentage (%)","type":"number","min":0,"max":100,"step":0.1,"unit":"%","required":true}]'::jsonb,
    '{"type":"PERCENT_THRESHOLD","scored":true,"max_raw_points":10,"field_name":"mismatch_pct","threshold":10,"partial_margin":10,"inverted":true,"rule_description":"<= 10% mismatch earns full points (10); >10% and <=20% earns partial points (5); > 20% earns 0."}'::jsonb,
    'CRITICAL',
    true,
    true,
    'Register + digital screenshot',
    'Mismatch >10%',
    'Reconciliation/audit',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 49: P14 (HEALTH)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'P14',
    'HEALTH',
    'HEALTH',
    'Is any NGO/trust/CSR organisation supporting the PHC, and what measurable health outcome or service improvement resulted?',
    'Structured + Narrative',
    'MEDIUM',
    false,
    'NONE',
    true,
    'MoU/report/photo/before-after data',
    'Activity without measurable outcome',
    'Coordinate/document impact',
    'P14',
    NULL,
    'CSV_ONLY',
    NULL,
    TRUE,
    49
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'P14',
    1,
    'Is any NGO/trust/CSR organisation supporting the PHC, and what measurable health outcome or service improvement resulted?',
    NULL,
    '[{"name":"observation","label":"Detailed Field Observation","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    true,
    'MoU/report/photo/before-after data',
    'Activity without measurable outcome',
    'Coordinate/document impact',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 50: P15 (HEALTH)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'P15',
    'HEALTH',
    'HEALTH',
    'What are the three biggest health-system gaps, and what one intervention would have the greatest impact?',
    'Top-3 + Priority',
    'HIGH',
    false,
    'NONE',
    false,
    'Records/evidence',
    'Critical service gap',
    'Create action plan',
    'P15',
    '45',
    'MERGED',
    NULL,
    TRUE,
    50
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'P15',
    1,
    'What are the three biggest health-system gaps, and what one intervention would have the greatest impact?',
    NULL,
    '[{"name":"gap_1","label":"Priority 1 (Highest Impact Gap)","type":"text","required":false},{"name":"gap_2","label":"Priority 2 Gap","type":"text","required":false},{"name":"gap_3","label":"Priority 3 Gap","type":"text","required":false},{"name":"single_intervention","label":"Single most critical intervention recommended","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'HIGH',
    false,
    false,
    'Records/evidence',
    'Critical service gap',
    'Create action plan',
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 51: P16 (HEALTH)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'P16',
    'HEALTH',
    'HEALTH',
    'Major health-access barriers?',
    'Checklist + Narrative',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '44',
    'UNIQUE_ZIP',
    'Major health-access barriers.',
    TRUE,
    51
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'P16',
    1,
    'Major health-access barriers?',
    'Major health-access barriers.',
    '[{"name":"observation","label":"Detailed Field Observation","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 52: C07 (COMMUNITY_INTERACTION)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'C07',
    'ALL',
    'COMMUNITY_INTERACTION',
    'Where do families usually go when someone is sick?',
    'Mixed',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '46',
    'UNIQUE_ZIP',
    'Household-interaction question; not scored.',
    TRUE,
    52
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'C07',
    1,
    'Where do families usually go when someone is sick?',
    'Household-interaction question; not scored.',
    '[{"name":"response","label":"Response / Finding","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 53: C08 (COMMUNITY_INTERACTION)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'C08',
    'ALL',
    'COMMUNITY_INTERACTION',
    'How easy is it to reach the health facility?',
    'Mixed',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '47',
    'UNIQUE_ZIP',
    'Household-interaction question; not scored.',
    TRUE,
    53
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'C08',
    1,
    'How easy is it to reach the health facility?',
    'Household-interaction question; not scored.',
    '[{"name":"response","label":"Response / Finding","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 54: C09 (COMMUNITY_INTERACTION)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'C09',
    'ALL',
    'COMMUNITY_INTERACTION',
    'Do children generally attend school regularly?',
    'Mixed',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '48',
    'UNIQUE_ZIP',
    'Household-interaction question; not scored.',
    TRUE,
    54
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'C09',
    1,
    'Do children generally attend school regularly?',
    'Household-interaction question; not scored.',
    '[{"name":"response","label":"Response / Finding","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 55: C10 (COMMUNITY_INTERACTION)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'C10',
    'ALL',
    'COMMUNITY_INTERACTION',
    'What makes school attendance difficult?',
    'Mixed',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '49',
    'UNIQUE_ZIP',
    'Household-interaction question; not scored.',
    TRUE,
    55
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'C10',
    1,
    'What makes school attendance difficult?',
    'Household-interaction question; not scored.',
    '[{"name":"response","label":"Response / Finding","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 56: C11 (COMMUNITY_INTERACTION)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'C11',
    'ALL',
    'COMMUNITY_INTERACTION',
    'Do families use the Anganwadi regularly?',
    'Mixed',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '50',
    'UNIQUE_ZIP',
    'Household-interaction question; not scored.',
    TRUE,
    56
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'C11',
    1,
    'Do families use the Anganwadi regularly?',
    'Household-interaction question; not scored.',
    '[{"name":"response","label":"Response / Finding","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 57: C12 (COMMUNITY_INTERACTION)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'C12',
    'ALL',
    'COMMUNITY_INTERACTION',
    'Are people aware of major government services/schemes?',
    'Mixed',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '51',
    'UNIQUE_ZIP',
    'Household-interaction question; not scored.',
    TRUE,
    57
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'C12',
    1,
    'Are people aware of major government services/schemes?',
    'Household-interaction question; not scored.',
    '[{"name":"response","label":"Response / Finding","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 58: C13 (COMMUNITY_INTERACTION)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'C13',
    'ALL',
    'COMMUNITY_INTERACTION',
    'Which services are received but not fully accessible / satisfactory?',
    'Mixed',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '52',
    'UNIQUE_ZIP',
    'Household-interaction question; not scored.',
    TRUE,
    58
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'C13',
    1,
    'Which services are received but not fully accessible / satisfactory?',
    'Household-interaction question; not scored.',
    '[{"name":"response","label":"Response / Finding","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 59: C14 (COMMUNITY_INTERACTION)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'C14',
    'ALL',
    'COMMUNITY_INTERACTION',
    'Biggest problem facing children?',
    'Mixed',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '53',
    'UNIQUE_ZIP',
    'Household-interaction question; not scored.',
    TRUE,
    59
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'C14',
    1,
    'Biggest problem facing children?',
    'Household-interaction question; not scored.',
    '[{"name":"response","label":"Response / Finding","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 60: C15 (COMMUNITY_INTERACTION)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'C15',
    'ALL',
    'COMMUNITY_INTERACTION',
    'Biggest problem facing families?',
    'Mixed',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '54',
    'UNIQUE_ZIP',
    'Household-interaction question; not scored.',
    TRUE,
    60
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'C15',
    1,
    'Biggest problem facing families?',
    'Household-interaction question; not scored.',
    '[{"name":"response","label":"Response / Finding","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 61: C16 (COMMUNITY_INTERACTION)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'C16',
    'ALL',
    'COMMUNITY_INTERACTION',
    'If one thing could be improved, what should it be?',
    'Mixed',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '55',
    'UNIQUE_ZIP',
    'Household-interaction question; not scored.',
    TRUE,
    61
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'C16',
    1,
    'If one thing could be improved, what should it be?',
    'Household-interaction question; not scored.',
    '[{"name":"response","label":"Response / Finding","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 62: F01 (PHYSICAL_VERIFICATION)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'F01',
    'SCHOOL',
    'PHYSICAL_VERIFICATION',
    'School physically verified?',
    'Yes/No',
    'HIGH',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '56',
    'UNIQUE_ZIP',
    'Verification flag, not scored.',
    TRUE,
    62
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'F01',
    1,
    'School physically verified?',
    'Verification flag, not scored.',
    '[{"name":"response","label":"Response","type":"radio","options":["YES","NO"],"required":false},{"name":"remarks","label":"Remarks","type":"text","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'HIGH',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 63: F02 (PHYSICAL_VERIFICATION)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'F02',
    'ANGANWADI',
    'PHYSICAL_VERIFICATION',
    'Anganwadi physically verified?',
    'Yes/No',
    'HIGH',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '57',
    'UNIQUE_ZIP',
    NULL,
    TRUE,
    63
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'F02',
    1,
    'Anganwadi physically verified?',
    NULL,
    '[{"name":"response","label":"Response","type":"radio","options":["YES","NO"],"required":false},{"name":"remarks","label":"Remarks","type":"text","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'HIGH',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 64: F03 (PHYSICAL_VERIFICATION)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'F03',
    'HEALTH',
    'PHYSICAL_VERIFICATION',
    'PHC / health facility physically verified?',
    'Yes/No',
    'HIGH',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '58',
    'UNIQUE_ZIP',
    NULL,
    TRUE,
    64
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'F03',
    1,
    'PHC / health facility physically verified?',
    NULL,
    '[{"name":"response","label":"Response","type":"radio","options":["YES","NO"],"required":false},{"name":"remarks","label":"Remarks","type":"text","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'HIGH',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 65: F04 (PHYSICAL_VERIFICATION)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'F04',
    'ALL',
    'PHYSICAL_VERIFICATION',
    'Facilities claimed as available but found non-functional?',
    'Narrative',
    'HIGH',
    false,
    'NONE',
    true,
    NULL,
    NULL,
    NULL,
    NULL,
    '59',
    'UNIQUE_ZIP',
    'Claimed-available-but-non-functional notes; evidence expected.',
    TRUE,
    65
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'F04',
    1,
    'Facilities claimed as available but found non-functional?',
    'Claimed-available-but-non-functional notes; evidence expected.',
    '[{"name":"observation","label":"Detailed Field Observation","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'HIGH',
    false,
    true,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 66: F05 (PHYSICAL_VERIFICATION)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'F05',
    'ALL',
    'PHYSICAL_VERIFICATION',
    'Any major observation not captured above?',
    'Narrative',
    'MEDIUM',
    false,
    'NONE',
    true,
    NULL,
    NULL,
    NULL,
    NULL,
    '61',
    'UNIQUE_ZIP',
    NULL,
    TRUE,
    66
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'F05',
    1,
    'Any major observation not captured above?',
    NULL,
    '[{"name":"observation","label":"Detailed Field Observation","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    true,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 67: G01 (SUMMARY)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'G01',
    'SCHOOL',
    'SUMMARY',
    'Education – key baseline finding',
    'Narrative',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '62',
    'UNIQUE_ZIP',
    'Narrative summary; not scored.',
    TRUE,
    67
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'G01',
    1,
    'Education – key baseline finding',
    'Narrative summary; not scored.',
    '[{"name":"observation","label":"Detailed Field Observation","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 68: G02 (SUMMARY)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'G02',
    'ANGANWADI',
    'SUMMARY',
    'Early Childhood – key baseline finding',
    'Narrative',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '63',
    'UNIQUE_ZIP',
    'Narrative summary; not scored.',
    TRUE,
    68
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'G02',
    1,
    'Early Childhood – key baseline finding',
    'Narrative summary; not scored.',
    '[{"name":"observation","label":"Detailed Field Observation","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 69: G03 (SUMMARY)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'G03',
    'HEALTH',
    'SUMMARY',
    'Health – key baseline finding',
    'Narrative',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '64',
    'UNIQUE_ZIP',
    'Narrative summary; not scored.',
    TRUE,
    69
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'G03',
    1,
    'Health – key baseline finding',
    'Narrative summary; not scored.',
    '[{"name":"observation","label":"Detailed Field Observation","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 70: G04 (SUMMARY)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'G04',
    'ALL',
    'SUMMARY',
    'Community – key baseline finding',
    'Narrative',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '65',
    'UNIQUE_ZIP',
    'Narrative summary; not scored.',
    TRUE,
    70
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'G04',
    1,
    'Community – key baseline finding',
    'Narrative summary; not scored.',
    '[{"name":"observation","label":"Detailed Field Observation","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 71: G05 (SUMMARY)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'G05',
    'ALL',
    'SUMMARY',
    'Convergence gap: School ↔ Anganwadi ↔ Health ↔ Community',
    'Narrative',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '66',
    'UNIQUE_ZIP',
    'Narrative summary; not scored.',
    TRUE,
    71
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'G05',
    1,
    'Convergence gap: School ↔ Anganwadi ↔ Health ↔ Community',
    'Narrative summary; not scored.',
    '[{"name":"observation","label":"Detailed Field Observation","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);

-- Question 72: G06 (SUMMARY)
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    'G06',
    'ALL',
    'SUMMARY',
    'Top 5 measurable indicators for future follow-up',
    'Narrative',
    'MEDIUM',
    false,
    'NONE',
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    '67',
    'UNIQUE_ZIP',
    'Narrative summary; not scored.',
    TRUE,
    72
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    'G06',
    1,
    'Top 5 measurable indicators for future follow-up',
    'Narrative summary; not scored.',
    '[{"name":"observation","label":"Detailed Field Observation","type":"textarea","required":false}]'::jsonb,
    '{"type":"NONE","scored":false,"max_raw_points":0,"description":"Informational question — not scored in baseline ACS calculation."}'::jsonb,
    'MEDIUM',
    false,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);
