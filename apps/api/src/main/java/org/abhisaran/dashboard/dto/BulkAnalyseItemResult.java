package org.abhisaran.dashboard.dto;

import java.util.UUID;

public class BulkAnalyseItemResult {

    private UUID locationId;
    private String locationCode;
    private boolean success;
    private Double acsScore;
    private String alertBand;
    private Double coveragePct;
    private UUID runId;
    private int deliveredOfficersCount;
    private String errorMessage;

    public BulkAnalyseItemResult() {
    }

    public BulkAnalyseItemResult(UUID locationId, String locationCode, boolean success,
                                Double acsScore, String alertBand, Double coveragePct,
                                UUID runId, int deliveredOfficersCount, String errorMessage) {
        this.locationId = locationId;
        this.locationCode = locationCode;
        this.success = success;
        this.acsScore = acsScore;
        this.alertBand = alertBand;
        this.coveragePct = coveragePct;
        this.runId = runId;
        this.deliveredOfficersCount = deliveredOfficersCount;
        this.errorMessage = errorMessage;
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

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
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

    public UUID getRunId() {
        return runId;
    }

    public void setRunId(UUID runId) {
        this.runId = runId;
    }

    public int getDeliveredOfficersCount() {
        return deliveredOfficersCount;
    }

    public void setDeliveredOfficersCount(int deliveredOfficersCount) {
        this.deliveredOfficersCount = deliveredOfficersCount;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}
