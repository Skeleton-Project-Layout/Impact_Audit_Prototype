package org.abhisaran.delivery.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class DeliveryInboxDTO {

    private UUID id;
    private UUID runId;
    private UUID locationId;
    private String locationCode;
    private String facilityType;
    private Integer districtId;
    private String districtName;
    private String blockName;
    private String panchayatName;
    private Double acsScore;
    private String alertBand;
    private Double coveragePct;
    private boolean provisional;
    private int triggeredRedFlagsCount;
    private OffsetDateTime deliveredAt;
    private OffsetDateTime readAt;
    private OffsetDateTime acknowledgedAt;
    private String acknowledgmentNotes;
    private boolean read;
    private boolean acknowledged;

    public DeliveryInboxDTO() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getRunId() {
        return runId;
    }

    public void setRunId(UUID runId) {
        this.runId = runId;
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

    public String getFacilityType() {
        return facilityType;
    }

    public void setFacilityType(String facilityType) {
        this.facilityType = facilityType;
    }

    public Integer getDistrictId() {
        return districtId;
    }

    public void setDistrictId(Integer districtId) {
        this.districtId = districtId;
    }

    public String getDistrictName() {
        return districtName;
    }

    public void setDistrictName(String districtName) {
        this.districtName = districtName;
    }

    public String getBlockName() {
        return blockName;
    }

    public void setBlockName(String blockName) {
        this.blockName = blockName;
    }

    public String getPanchayatName() {
        return panchayatName;
    }

    public void setPanchayatName(String panchayatName) {
        this.panchayatName = panchayatName;
    }

    public Double getAcsScore() {
        return acsScore;
    }

    public void setAcsScore(Double acsScore) {
        this.acsScore = acsScore;
    }

    public String getAlertBand() {
        return alertBand;
    }

    public void setAlertBand(String alertBand) {
        this.alertBand = alertBand;
    }

    public Double getCoveragePct() {
        return coveragePct;
    }

    public void setCoveragePct(Double coveragePct) {
        this.coveragePct = coveragePct;
    }

    public boolean isProvisional() {
        return provisional;
    }

    public void setProvisional(boolean provisional) {
        this.provisional = provisional;
    }

    public int getTriggeredRedFlagsCount() {
        return triggeredRedFlagsCount;
    }

    public void setTriggeredRedFlagsCount(int triggeredRedFlagsCount) {
        this.triggeredRedFlagsCount = triggeredRedFlagsCount;
    }

    public OffsetDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(OffsetDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }

    public OffsetDateTime getReadAt() {
        return readAt;
    }

    public void setReadAt(OffsetDateTime readAt) {
        this.readAt = readAt;
    }

    public OffsetDateTime getAcknowledgedAt() {
        return acknowledgedAt;
    }

    public void setAcknowledgedAt(OffsetDateTime acknowledgedAt) {
        this.acknowledgedAt = acknowledgedAt;
    }

    public String getAcknowledgmentNotes() {
        return acknowledgmentNotes;
    }

    public void setAcknowledgmentNotes(String acknowledgmentNotes) {
        this.acknowledgmentNotes = acknowledgmentNotes;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public boolean isAcknowledged() {
        return acknowledged;
    }

    public void setAcknowledged(boolean acknowledged) {
        this.acknowledged = acknowledged;
    }
}
