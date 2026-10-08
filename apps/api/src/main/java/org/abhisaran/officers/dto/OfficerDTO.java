package org.abhisaran.officers.dto;

import org.abhisaran.delivery.dto.DistrictSummaryDTO;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class OfficerDTO {

    private UUID id;
    private String loginId;
    private String displayName;
    private String designation;
    private boolean active;
    private boolean mustChangePassword;
    private List<DistrictSummaryDTO> assignedDistricts = new ArrayList<>();
    private long totalDeliveries;
    private long unreadDeliveries;
    private OffsetDateTime createdAt;

    public OfficerDTO() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getLoginId() {
        return loginId;
    }

    public void setLoginId(String loginId) {
        this.loginId = loginId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public boolean isMustChangePassword() {
        return mustChangePassword;
    }

    public void setMustChangePassword(boolean mustChangePassword) {
        this.mustChangePassword = mustChangePassword;
    }

    public List<DistrictSummaryDTO> getAssignedDistricts() {
        return assignedDistricts;
    }

    public void setAssignedDistricts(List<DistrictSummaryDTO> assignedDistricts) {
        this.assignedDistricts = assignedDistricts;
    }

    public long getTotalDeliveries() {
        return totalDeliveries;
    }

    public void setTotalDeliveries(long totalDeliveries) {
        this.totalDeliveries = totalDeliveries;
    }

    public long getUnreadDeliveries() {
        return unreadDeliveries;
    }

    public void setUnreadDeliveries(long unreadDeliveries) {
        this.unreadDeliveries = unreadDeliveries;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
