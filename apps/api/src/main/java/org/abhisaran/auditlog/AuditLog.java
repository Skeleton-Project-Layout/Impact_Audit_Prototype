package org.abhisaran.auditlog;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_id")
    private UUID actorId;

    @Column(name = "actor_role", nullable = false, length = 20)
    private String actorRole;

    @Column(nullable = false, length = 64)
    private String action;

    @Column(name = "object_type", nullable = false, length = 64)
    private String objectType;

    @Column(name = "object_id", nullable = false, length = 64)
    private String objectId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "before_state")
    private String beforeState;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "after_state")
    private String afterState;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public AuditLog() {
    }

    public AuditLog(UUID actorId, String actorRole, String action, String objectType,
                    String objectId, String beforeState, String afterState,
                    String reason, String ipAddress) {
        this.actorId = actorId;
        this.actorRole = actorRole;
        this.action = action;
        this.objectType = objectType;
        this.objectId = objectId;
        this.beforeState = beforeState;
        this.afterState = afterState;
        this.reason = reason;
        this.ipAddress = ipAddress;
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public UUID getActorId() {
        return actorId;
    }

    public String getActorRole() {
        return actorRole;
    }

    public String getAction() {
        return action;
    }

    public String getObjectType() {
        return objectType;
    }

    public String getObjectId() {
        return objectId;
    }

    public String getBeforeState() {
        return beforeState;
    }

    public String getAfterState() {
        return afterState;
    }

    public String getReason() {
        return reason;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
