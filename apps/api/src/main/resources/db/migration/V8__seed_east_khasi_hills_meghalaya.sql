-- V8__seed_east_khasi_hills_meghalaya.sql
-- Seed East Khasi Hills (East Khalasi), Meghalaya geography, pilot locations, and sample audit data

-- 1. State: Meghalaya
INSERT INTO states (id, code2, name, active) VALUES
(2, 'ML', 'Meghalaya', TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code2 = EXCLUDED.code2;

-- 2. District: East Khasi Hills (East Khalasi)
INSERT INTO districts (id, state_id, code3, name, active) VALUES
(5, 2, 'EKH', 'East Khasi Hills (East Khalasi)', TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code3 = EXCLUDED.code3;

-- 3. Blocks: Mylliem, Mawphlang, Sohra, Pynursla
INSERT INTO blocks (id, district_id, code, name, active) VALUES
(17, 5, 'MYL', 'Mylliem', TRUE),
(18, 5, 'MWP', 'Mawphlang', TRUE),
(19, 5, 'SOH', 'Sohra (Cherrapunji)', TRUE),
(20, 5, 'PYN', 'Pynursla', TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;

-- 4. Panchayats / Villages
INSERT INTO panchayats (id, block_id, code, name, active) VALUES
(33, 17, 'MYL_P1', 'Mylliem Central', TRUE),
(34, 17, 'MYL_P2', '1 & 1/2 Mile Upper Shillong', TRUE),
(35, 18, 'MWP_P1', 'Mawphlang Village', TRUE),
(36, 18, 'MWP_P2', 'Laitsohpliah', TRUE),
(37, 19, 'SOH_P1', 'Sohra Town', TRUE),
(38, 19, 'SOH_P2', 'Nongriat', TRUE),
(39, 20, 'PYN_P1', 'Mawlynnong Village', TRUE),
(40, 20, 'PYN_P2', 'Pynursla Bazar', TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;

-- Reset sequences safely
SELECT setval('states_id_seq', (SELECT GREATEST(MAX(id), 2) FROM states));
SELECT setval('districts_id_seq', (SELECT GREATEST(MAX(id), 5) FROM districts));
SELECT setval('blocks_id_seq', (SELECT GREATEST(MAX(id), 20) FROM blocks));
SELECT setval('panchayats_id_seq', (SELECT GREATEST(MAX(id), 40) FROM panchayats));

-- 5. Facility Code Sequences for District 5 (EKH)
INSERT INTO facility_code_sequences (district_id, type_id, next_val) VALUES
(5, 1, 10), (5, 2, 10), (5, 3, 10), (5, 4, 10)
ON CONFLICT (district_id, type_id) DO UPDATE SET next_val = EXCLUDED.next_val;

-- 6. Pilot Locations for East Khasi Hills, Meghalaya
INSERT INTO pilot_locations (id, code, type_id, district_id, block_id, panchayat_id, status, is_demo, created_at, updated_at) VALUES
('b1111111-2222-3333-4444-555555555551', 'ML-EKH-SCH-0001', 1, 5, 17, 33, 'READY_FOR_ANALYSIS', FALSE, NOW() - INTERVAL '2 days', NOW()),
('b1111111-2222-3333-4444-555555555552', 'ML-EKH-AWC-0001', 2, 5, 18, 35, 'READY_FOR_ANALYSIS', FALSE, NOW() - INTERVAL '2 days', NOW()),
('b1111111-2222-3333-4444-555555555553', 'ML-EKH-PHC-0001', 3, 5, 19, 37, 'READY_FOR_ANALYSIS', FALSE, NOW() - INTERVAL '2 days', NOW()),
('b1111111-2222-3333-4444-555555555554', 'ML-EKH-SCH-0002', 1, 5, 20, 39, 'DRAFT', FALSE, NOW() - INTERVAL '1 days', NOW())
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, code = EXCLUDED.code;

-- 7. Pilot Location Registry (School, Anganwadi, PHC)
INSERT INTO pilot_location_registry (location_id, name, official_code, updated_at) VALUES
('b1111111-2222-3333-4444-555555555551', 'East Khasi Government Higher Secondary School, Mylliem', 'UDISE-170101001', NOW()),
('b1111111-2222-3333-4444-555555555552', 'Mawphlang Model Anganwadi Centre', 'POSHAN-ML-EKH-042', NOW()),
('b1111111-2222-3333-4444-555555555553', 'Sohra Primary Health Centre, Cherrapunji', 'NIN-541290', NOW()),
('b1111111-2222-3333-4444-555555555554', 'Mawlynnong Village Community School', 'UDISE-170202008', NOW())
ON CONFLICT (location_id) DO UPDATE SET name = EXCLUDED.name, official_code = EXCLUDED.official_code;

-- 8. Seed Audit Page for ML-EKH-SCH-0001
INSERT INTO audit_pages (id, pilot_location_id, page_number, status, created_at, updated_at) VALUES
('c1111111-2222-3333-4444-555555555551', 'b1111111-2222-3333-4444-555555555551', 1, 'DRAFT', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
