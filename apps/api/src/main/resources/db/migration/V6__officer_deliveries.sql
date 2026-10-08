-- ============================================================================
-- V6__officer_deliveries.sql
-- Abhisaran Platform: Result Deliveries & Jurisdiction Scoping
-- ============================================================================

CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES pilot_locations(id) ON DELETE CASCADE,
    district_id INT NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    acknowledgment_notes TEXT,
    CONSTRAINT uq_officer_run_delivery UNIQUE(officer_id, run_id)
);

CREATE INDEX idx_deliveries_officer_read ON deliveries(officer_id, read_at);
CREATE INDEX idx_deliveries_district ON deliveries(district_id);
CREATE INDEX idx_deliveries_location ON deliveries(location_id);
CREATE INDEX idx_deliveries_run ON deliveries(run_id);
