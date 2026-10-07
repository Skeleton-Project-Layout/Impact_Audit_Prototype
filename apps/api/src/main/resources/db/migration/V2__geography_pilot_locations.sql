-- ============================================================================
-- V2__geography_pilot_locations.sql
-- Abhisaran Platform: Geography Hierarchy, Pilot Locations & Code Sequences
-- ============================================================================

-- 1. States & Districts
CREATE TABLE states (
    id SERIAL PRIMARY KEY,
    code2 VARCHAR(2) NOT NULL UNIQUE,       -- 'JH'
    name VARCHAR(128) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    state_id INT NOT NULL REFERENCES states(id) ON DELETE RESTRICT,
    code3 VARCHAR(3) NOT NULL,              -- 'RCH', 'DHN', 'BOK', 'ESB'
    name VARCHAR(128) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_state_district_code UNIQUE(state_id, code3)
);
CREATE INDEX idx_districts_state ON districts(state_id);

-- 2. Blocks & Panchayats
CREATE TABLE blocks (
    id SERIAL PRIMARY KEY,
    district_id INT NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
    code VARCHAR(16) NOT NULL,
    name VARCHAR(128) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_district_block_code UNIQUE (district_id, code)
);
CREATE INDEX idx_blocks_district ON blocks(district_id);

CREATE TABLE panchayats (
    id SERIAL PRIMARY KEY,
    block_id INT NOT NULL REFERENCES blocks(id) ON DELETE RESTRICT,
    code VARCHAR(16) NOT NULL,
    name VARCHAR(128) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_block_panchayat_code UNIQUE (block_id, code)
);
CREATE INDEX idx_panchayats_block ON panchayats(block_id);

-- 3. Officer Districts (jurisdiction mapping)
CREATE TABLE officer_districts (
    id SERIAL PRIMARY KEY,
    officer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    district_id INT NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by UUID REFERENCES users(id),
    CONSTRAINT uq_officer_district UNIQUE(officer_id, district_id)
);
CREATE INDEX idx_officer_districts_officer ON officer_districts(officer_id);
CREATE INDEX idx_officer_districts_district ON officer_districts(district_id);

-- 4. Pilot Location Types
CREATE TABLE pilot_location_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(16) NOT NULL UNIQUE,       -- 'SCHOOL', 'ANGANWADI', 'PHC', 'HOSPITAL'
    prefix VARCHAR(4) NOT NULL UNIQUE,     -- 'SCH', 'AWC', 'PHC', 'HOS'
    label VARCHAR(64) NOT NULL,
    domain VARCHAR(32) NOT NULL            -- 'SCHOOL', 'ANGANWADI', 'HEALTH', 'GENERAL'
);

-- 5. Facility Code Sequences (for strictly monotonic, collision-free codes)
CREATE TABLE facility_code_sequences (
    district_id INT NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
    type_id INT NOT NULL REFERENCES pilot_location_types(id) ON DELETE RESTRICT,
    next_val BIGINT NOT NULL DEFAULT 1,
    PRIMARY KEY (district_id, type_id)
);

-- 6. Pilot Locations (Public anonymized entity)
CREATE TABLE pilot_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) NOT NULL UNIQUE,       -- e.g. 'JH-RCH-SCH-0001'
    type_id INT NOT NULL REFERENCES pilot_location_types(id),
    district_id INT NOT NULL REFERENCES districts(id),
    block_id INT REFERENCES blocks(id),
    panchayat_id INT REFERENCES panchayats(id),
    status VARCHAR(32) NOT NULL DEFAULT 'REGISTERED'
        CHECK (status IN ('REGISTERED', 'DRAFT', 'READY_FOR_ANALYSIS', 'ANALYSED', 'REOPENED')),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pilot_locations_district ON pilot_locations(district_id);
CREATE INDEX idx_pilot_locations_status ON pilot_locations(status);
CREATE INDEX idx_pilot_locations_block ON pilot_locations(block_id);

-- 7. Pilot Location Registry (Restricted PII sequestered storage)
CREATE TABLE pilot_location_registry (
    location_id UUID PRIMARY KEY REFERENCES pilot_locations(id) ON DELETE CASCADE,
    name VARCHAR(255),
    official_code VARCHAR(64),              -- e.g. UDISE+ code, POSHAN ID, NIN
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SEED DATA: Jharkhand & 4 Pilot Districts
-- ============================================================================

-- State: Jharkhand
INSERT INTO states (id, code2, name, active) VALUES (1, 'JH', 'Jharkhand', TRUE);

-- 4 Pilot Districts
INSERT INTO districts (id, state_id, code3, name, active) VALUES
(1, 1, 'RCH', 'Ranchi', TRUE),
(2, 1, 'DHN', 'Dhanbad', TRUE),
(3, 1, 'BOK', 'Bokaro', TRUE),
(4, 1, 'ESB', 'East Singhbhum', TRUE);

-- Reset sequence for districts & states
SELECT setval('states_id_seq', 1);
SELECT setval('districts_id_seq', 4);

-- 4 Facility Types
INSERT INTO pilot_location_types (id, code, prefix, label, domain) VALUES
(1, 'SCHOOL', 'SCH', 'School', 'SCHOOL'),
(2, 'ANGANWADI', 'AWC', 'Anganwadi Centre', 'ANGANWADI'),
(3, 'PHC', 'PHC', 'Primary Health Centre', 'HEALTH'),
(4, 'HOSPITAL', 'HOS', 'Hospital / CHC', 'HEALTH');

SELECT setval('pilot_location_types_id_seq', 4);

-- Initialize Facility Code Sequences for all (district, type) pairs
INSERT INTO facility_code_sequences (district_id, type_id, next_val) VALUES
(1, 1, 1), (1, 2, 1), (1, 3, 1), (1, 4, 1),
(2, 1, 1), (2, 2, 1), (2, 3, 1), (2, 4, 1),
(3, 1, 1), (3, 2, 1), (3, 3, 1), (3, 4, 1),
(4, 1, 1), (4, 2, 1), (4, 3, 1), (4, 4, 1);

-- Pilot Blocks: Ranchi (District 1)
INSERT INTO blocks (id, district_id, code, name, active) VALUES
(1, 1, 'KNK', 'Kanke', TRUE),
(2, 1, 'NMK', 'Namkum', TRUE),
(3, 1, 'RTU', 'Ratu', TRUE),
(4, 1, 'ORM', 'Ormanjhi', TRUE);

-- Pilot Blocks: Dhanbad (District 2)
INSERT INTO blocks (id, district_id, code, name, active) VALUES
(5, 2, 'DHN_B', 'Dhanbad Sadar', TRUE),
(6, 2, 'JHR', 'Jharia', TRUE),
(7, 2, 'GVP', 'Govindpur', TRUE),
(8, 2, 'BGM', 'Baghmara', TRUE);

-- Pilot Blocks: Bokaro (District 3)
INSERT INTO blocks (id, district_id, code, name, active) VALUES
(9, 3, 'CHS', 'Chas', TRUE),
(10, 3, 'BRM', 'Bermo', TRUE),
(11, 3, 'CDK', 'Chandankiyari', TRUE),
(12, 3, 'JRD', 'Jaridih', TRUE);

-- Pilot Blocks: East Singhbhum (District 4)
INSERT INTO blocks (id, district_id, code, name, active) VALUES
(13, 4, 'GCJ', 'Golmuri Cum Jugsalai', TRUE),
(14, 4, 'PTK', 'Potka', TRUE),
(15, 4, 'GTS', 'Ghatshila', TRUE),
(16, 4, 'BHG', 'Baharagora', TRUE);

SELECT setval('blocks_id_seq', 16);

-- Sample Pilot Panchayats (at least 2 per block for the pilot)
INSERT INTO panchayats (id, block_id, code, name, active) VALUES
-- Ranchi
(1, 1, 'KNK_P1', 'Kanke North', TRUE),
(2, 1, 'KNK_P2', 'Kanke South', TRUE),
(3, 2, 'NMK_P1', 'Namkum East', TRUE),
(4, 2, 'NMK_P2', 'Namkum West', TRUE),
(5, 3, 'RTU_P1', 'Ratu Chati', TRUE),
(6, 3, 'RTU_P2', 'Tigra', TRUE),
(7, 4, 'ORM_P1', 'Ormanjhi Central', TRUE),
(8, 4, 'ORM_P2', 'Chutupalu', TRUE),
-- Dhanbad
(9, 5, 'DHN_P1', 'Saraidhela', TRUE),
(10, 5, 'DHN_P2', 'Hirapur', TRUE),
(11, 6, 'JHR_P1', 'Jharia Khas', TRUE),
(12, 6, 'JHR_P2', 'Lodna', TRUE),
(13, 7, 'GVP_P1', 'Govindpur North', TRUE),
(14, 7, 'GVP_P2', 'Govindpur South', TRUE),
(15, 8, 'BGM_P1', 'Baghmara Central', TRUE),
(16, 8, 'BGM_P2', 'Barora', TRUE),
-- Bokaro
(17, 9, 'CHS_P1', 'Chas North', TRUE),
(18, 9, 'CHS_P2', 'Chas South', TRUE),
(19, 10, 'BRM_P1', 'Bermo Bazar', TRUE),
(20, 10, 'BRM_P2', 'Phusro', TRUE),
(21, 11, 'CDK_P1', 'Chandankiyari East', TRUE),
(22, 11, 'CDK_P2', 'Chandankiyari West', TRUE),
(23, 12, 'JRD_P1', 'Jaridih North', TRUE),
(24, 12, 'JRD_P2', 'Jaridih South', TRUE),
-- East Singhbhum
(25, 13, 'GCJ_P1', 'Jugsalai Rural', TRUE),
(26, 13, 'GCJ_P2', 'Parsudih', TRUE),
(27, 14, 'PTK_P1', 'Potka Central', TRUE),
(28, 14, 'PTK_P2', 'Hata', TRUE),
(29, 15, 'GTS_P1', 'Ghatshila Bazar', TRUE),
(30, 15, 'GTS_P2', 'Moubhandar', TRUE),
(31, 16, 'BHG_P1', 'Baharagora Central', TRUE),
(32, 16, 'BHG_P2', 'Barasol', TRUE);

SELECT setval('panchayats_id_seq', 32);
