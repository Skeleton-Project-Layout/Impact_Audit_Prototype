# Abhisaran Platform Operations & Disaster Recovery Runbook

**Version:** 1.0.0  
**Target Environments:** Local Docker Compose, Render Cloud, Kubernetes / AWS / GCP  
**Date:** October 2026  

---

## 1. System Topology & Architecture Overview

The Abhisaran Platform operates as a distributed, isolated microservices topology:

```
                      Internet / Browser
                              │
                              ▼
                   ┌──────────────────────┐
                   │  abhisaran-web       │
                   │  (React / Nginx)     │
                   │  Port 80 / 3000      │
                   └──────────┬───────────┘
                              │ Reverse Proxy /api/*
                              ▼
                   ┌──────────────────────┐
                   │  abhisaran-api       │
                   │  (Spring Boot 3.3.4) │
                   │  Port 8080           │
                   └─────┬──────────┬─────┘
           JDBC (5432)   │          │ HTTP + Token Auth (8000)
                         │          │ (Zero DB Privileges)
                         ▼          ▼
            ┌───────────────┐   ┌──────────────────────┐
            │ PostgreSQL 16 │   │  abhisaran-ai        │
            │ (abhisaran-db)│   │  (Python FastAPI)    │
            └───────────────┘   └──────────────────────┘
```

---

## 2. Environment Variables & Secret Configuration

| Service | Variable Name | Required | Default / Example | Purpose |
|---|---|---|---|---|
| **api** | `PORT` | Yes | `8080` | HTTP port for Spring Boot |
| **api** | `SPRING_DATASOURCE_URL` | Yes | `jdbc:postgresql://localhost:5432/abhisaran` | PostgreSQL JDBC connection URL |
| **api** | `SPRING_DATASOURCE_USERNAME` | Yes | `abhisaran_user` | PostgreSQL connection username |
| **api** | `SPRING_DATASOURCE_PASSWORD` | Yes | `secret` | PostgreSQL connection password |
| **api** | `JWT_SECRET` | Yes | 64-char random hex string | HMAC-SHA256 token signing secret ($\ge 32$ bytes) |
| **api** | `BOOTSTRAP_ADMIN_ID` | Yes | `admin` | Initial administrator login ID |
| **api** | `BOOTSTRAP_ADMIN_PASSWORD` | Yes | `Admin#Bootstrap2026!` | Initial administrator password |
| **api** | `AI_SERVICE_URL` | No | `http://localhost:8000` | Address of isolated FastAPI service |
| **api** | `AI_SERVICE_TOKEN` | Yes | 32-char token | Shared token passed in `X-AI-Service-Token` |
| **api** | `FEATURE_AI` | No | `true` | Feature flag toggle for AI draft capabilities |
| **ai** | `AI_SERVICE_TOKEN` | Yes | 32-char token | Expected token in `X-AI-Service-Token` header |
| **ai** | `PORT` | No | `8000` | HTTP port for Uvicorn |

---

## 3. Cold Start Handling (Free / Hobby Tier Hosting)

On serverless or hobby platforms (e.g. Render, Railway, Fly.io), the API service may sleep after periods of inactivity, requiring 30–60 seconds to boot.

### Architectural Mitigations in Place:
1. **Interactive Splash & Loader**:
   - The React frontend `<AbhisaranLoader />` and splash screen handle cold-starts gracefully.
   - Pings `GET /actuator/health` with exponential backoff (2s, 4s, 8s, up to 60s).
   - Displays clear status: `"Waking up the server… Preparing secure audit environment"`.
   - Never shows a blank white screen or raw HTTP 502/503 errors.
2. **Spring Boot Native Startup Optimizations**:
   - JIT bytecode verification `-Djava.security.egd=file:/dev/./urandom`.
   - Flyway database migration check runs in $< 50$ms.

---

## 4. Database Maintenance, Backup & Disaster Recovery

### 4.1 Automated Logical Backup (`pg_dump`)
Run a cron job or scheduled pipeline to export complete daily snapshots:

```bash
# Perform compressed logical backup
pg_dump -h localhost -p 5432 -U abhisaran_user -Fc -f "abhisaran_backup_$(date +%Y%m%d_%H%M%S).dump" abhisaran

# Encrypt backup archive with GPG
gpg --symmetric --cipher-algo AES256 "abhisaran_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### 4.2 Point-in-Time Restore Procedure
In the event of database failure or corrupted deployment:

```bash
# 1. Stop the API service to terminate active connection pool
docker stop abhisaran-api

# 2. Terminate remaining idle connections
psql -U abhisaran_user -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'abhisaran';"

# 3. Restore database cleanly from dump
pg_restore -U abhisaran_user -d abhisaran --clean --if-exists abhisaran_backup_20261008.dump

# 4. Verify Flyway schema history
psql -U abhisaran_user -d abhisaran -c "SELECT installed_rank, version, description, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;"

# 5. Restart API service
docker start abhisaran-api
```

### 4.3 Database Migration Policy
- Flyway `validate-on-migrate=true` is strictly enabled.
- **NEVER** run `flyway repair` in automated production pipelines.
- If a checksum mismatch occurs in CI or staging, author an explicit forward migration (`V8__...sql`).

---

## 5. Secret Rotation Procedures

### 5.1 Rotating JWT Secret
1. Generate new 64-character secret: `openssl rand -hex 32`.
2. Update `JWT_SECRET` in environment variables / Render secrets.
3. Restart `abhisaran-api`.
4. *Impact*: Active user sessions will expire and require re-login. No persistent user or audit data is lost.

### 5.2 Rotating AI Service Token
1. Generate new token: `openssl rand -hex 16`.
2. Update `AI_SERVICE_TOKEN` simultaneously on both `abhisaran-api` and `abhisaran-ai`.
3. Restart `abhisaran-ai`, then restart `abhisaran-api`.
4. *Fallback behavior*: If there is any transient mismatch during rotation, `AiServiceClient` will catch the 401/403 and seamlessly utilize the offline resilient kernel draft generator without user interruption.

---

## 6. Incident Response & Forensic Audit Queries

### 6.1 Querying Security Audit Log
The `audit_log` table is append-only and records every actor action with IP and JSON states:

```sql
-- Find failed login attempts or lockouts in the last 24 hours
SELECT id, login_id, ip_address, attempted_at, failure_reason 
FROM login_attempts 
WHERE attempted_at > NOW() - INTERVAL '24 hours' AND success = false 
ORDER BY attempted_at DESC;

-- Trace all actions performed on a specific facility code
SELECT a.id, a.actor_role, a.action, a.object_type, a.object_id, a.before_state, a.after_state, a.created_at, a.ip_address
FROM audit_log a
WHERE a.object_id = 'JH-RCH-SCH-0001'
ORDER BY a.created_at DESC;

-- Identify rejected PII uploads or modifications
SELECT a.id, a.actor_id, a.action, a.reason, a.created_at
FROM audit_log a
WHERE a.action LIKE '%PII%' OR a.reason LIKE '%PII%'
ORDER BY a.created_at DESC;
```

### 6.2 AI Service Outage Mitigation
If the Python microservice is offline or experiencing high latency ($> 8$s):
1. The platform automatically triggers the `abhisaran-ai-resilient-kernel` fallback.
2. If desired, Administrators can disable outbound AI calls completely by setting `FEATURE_AI=false` in environment variables and restarting the API.
3. Core audit submissions, question version bumps, and the deterministic Java ScoringEngine continue running at 100% capacity.

---

## 7. Health Checks & Monitoring Endpoints

| Endpoint | Method | Expected Status | Description |
|---|---|---|---|
| `/actuator/health` | GET | `200 OK` (JSON `{"status":"UP"}`) | Spring Boot & DB liveness probe |
| `/api/v1/ai/status` | GET | `200 OK` | AI microservice connectivity status |
| `http://ai:8000/health` | GET | `200 OK` (JSON `{"status":"healthy"}`) | Python FastAPI liveness probe |
| `/` | GET | `200 OK` | Web frontend Nginx static entry point |
