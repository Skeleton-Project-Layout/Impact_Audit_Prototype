package org.abhisaran.auditlog.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class AuditLogDTO {

    private Long id;
    private UUID actorId;
    private String actorUsername;
    private String actorRole;
    private String action;
    private String objectType;
    private String objectId;
    private String beforeState;
    private String afterState;
    private String reason;
    private String ipAddress;
    private OffsetDateTime createdAt;

    public AuditLogDTO() {
    }

    public AuditLogDTO(Long id, UUID actorId, String actorUsername, String actorRole,
                       String action, String objectType, String objectId,
                       String beforeState, String afterState, String reason,
                       String ipAddress, OffsetDateTime createdAt) {
        this.id = id;
        this.actorId = actorId;
        this.actorUsername = actorUsername;
        this.actorRole = actorRole;
        this.action = action;
        this.objectType = objectType;
        this.objectId = objectId;
        this.beforeState = beforeState;
        this.afterState = afterState;
        this.reason = reason;
        this.ipAddress = ipAddress;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UUID getActorId() {
        return actorId;
    }

    public void setActorId(UUID actorId) {
        this.actorId = actorId;
    }

    public String getActorUsername() {
        return actorUsername;
    }

    public void setActorUsername(String actorUsername) {
        this.actorUsername = actorUsername;
    }

    public String getActorRole() {
        return actorRole;
    }

    public void setActorRole(String actorRole) {
        this.actorRole = actorRole;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getObjectType() {
        return objectType;
    }

    public void setObjectType(String objectType) {
        this.objectType = objectType;
    }

    public String getObjectId() {
        return objectId;
    }

    public void setObjectId(String objectId) {
        this.objectId = objectId;
    }

    public String getBeforeState() {
        return beforeState;
    }

    public void setBeforeState(String beforeState) {
        this.beforeState = beforeState;
    }

    public String getAfterState() {
        return afterState;
    }

    public void setAfterState(String afterState) {
        this.afterState = afterState;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
