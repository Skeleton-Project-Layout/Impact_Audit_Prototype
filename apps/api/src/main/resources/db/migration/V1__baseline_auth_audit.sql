-- Baseline migration for Identity, Access Control & Audit Log

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    login_id VARCHAR(64) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'OFFICER')),
    display_name VARCHAR(128) NOT NULL,
    designation VARCHAR(128),
    password_hash VARCHAR(255) NOT NULL,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_login_id ON users(login_id);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, active);

CREATE TABLE IF NOT EXISTS login_attempts (
    id BIGSERIAL PRIMARY KEY,
    login_id VARCHAR(64) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    success BOOLEAN NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_window ON login_attempts(login_id, ip_address, attempted_at);

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    actor_id UUID REFERENCES users(id),
    actor_role VARCHAR(20) NOT NULL,
    action VARCHAR(64) NOT NULL,
    object_type VARCHAR(64) NOT NULL,
    object_id VARCHAR(64) NOT NULL,
    before_state JSONB,
    after_state JSONB,
    reason TEXT,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_lookup ON audit_log(object_type, object_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id, created_at);
