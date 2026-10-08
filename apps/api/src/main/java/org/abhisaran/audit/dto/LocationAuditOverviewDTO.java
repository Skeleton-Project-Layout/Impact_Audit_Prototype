package org.abhisaran.audit.dto;

import java.util.List;
import java.util.UUID;

public class LocationAuditOverviewDTO {
    private UUID locationId;
    private String locationCode;
    private String status;
    private List<AuditPageDTO> pages;
    private boolean canSubmit;

    public LocationAuditOverviewDTO() {
    }

    public LocationAuditOverviewDTO(UUID locationId, String locationCode, String status, List<AuditPageDTO> pages, boolean canSubmit) {
        this.locationId = locationId;
        this.locationCode = locationCode;
        this.status = status;
        this.pages = pages;
        this.canSubmit = canSubmit;
    }

    public UUID getLocationId() {
        return locationId;
    }

    public void setLocationId(UUID locationId) {
        this.locationId = locationId;
    }

    public String getLocationCode() {
        return locationCode;
    }

    public void setLocationCode(String locationCode) {
        this.locationCode = locationCode;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<AuditPageDTO> getPages() {
        return pages;
    }

    public void setPages(List<AuditPageDTO> pages) {
        this.pages = pages;
    }

    public boolean isCanSubmit() {
        return canSubmit;
    }

    public void setCanSubmit(boolean canSubmit) {
        this.canSubmit = canSubmit;
    }
}
