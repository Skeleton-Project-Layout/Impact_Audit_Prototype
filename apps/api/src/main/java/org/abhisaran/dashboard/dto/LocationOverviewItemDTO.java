package org.abhisaran.dashboard.dto;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.UUID;

public class LocationOverviewItemDTO {

    private UUID id;
    private String code;
    private String typeCode;
    private String typePrefix;
    private String typeLabel;
    private String domain;
    private Integer districtId;
    private String districtCode;
    private String districtName;
    private Integer blockId;
    private String blockName;
    private Integer panchayatId;
    private String panchayatName;
    private String status;
    private boolean isDemo;
    private int pageCount;
    private Double latestAcsScore;
    private String latestAlertBand;
    private Double latestCoveragePct;
    private boolean latestIsProvisional;
    private int latestRedFlagsCount;
    private UUID latestRunId;
    private int latestRunNumber;
    private Instant lastAnalysedAt;
    private Instant lastSubmittedAt;
    private Instant createdAt;

    public LocationOverviewItemDTO() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getTypeCode() {
        return typeCode;
    }

    public void setTypeCode(String typeCode) {
        this.typeCode = typeCode;
    }

    public String getTypePrefix() {
        return typePrefix;
    }

    public void setTypePrefix(String typePrefix) {
        this.typePrefix = typePrefix;
    }

    public String getTypeLabel() {
        return typeLabel;
    }

    public void setTypeLabel(String typeLabel) {
        this.typeLabel = typeLabel;
    }

    public String getDomain() {
        return domain;
    }

    public void setDomain(String domain) {
        this.domain = domain;
    }

    public Integer getDistrictId() {
        return districtId;
    }

    public void setDistrictId(Integer districtId) {
        this.districtId = districtId;
    }

    public String getDistrictCode() {
        return districtCode;
    }

    public void setDistrictCode(String districtCode) {
        this.districtCode = districtCode;
    }

    public String getDistrictName() {
        return districtName;
    }

    public void setDistrictName(String districtName) {
        this.districtName = districtName;
    }

    public Integer getBlockId() {
        return blockId;
    }

    public void setBlockId(Integer blockId) {
        this.blockId = blockId;
    }

    public String getBlockName() {
        return blockName;
    }

    public void setBlockName(String blockName) {
        this.blockName = blockName;
    }

    public Integer getPanchayatId() {
        return panchayatId;
    }

    public void setPanchayatId(Integer panchayatId) {
        this.panchayatId = panchayatId;
    }

    public String getPanchayatName() {
        return panchayatName;
    }

    public void setPanchayatName(String panchayatName) {
        this.panchayatName = panchayatName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isDemo() {
        return isDemo;
    }

    public void setDemo(boolean demo) {
        isDemo = demo;
    }

    public int getPageCount() {
        return pageCount;
    }

    public void setPageCount(int pageCount) {
        this.pageCount = pageCount;
    }

    public Double getLatestAcsScore() {
        return latestAcsScore;
    }

    public void setLatestAcsScore(Double latestAcsScore) {
        this.latestAcsScore = latestAcsScore;
    }

    public String getLatestAlertBand() {
        return latestAlertBand;
    }

    public void setLatestAlertBand(String latestAlertBand) {
        this.latestAlertBand = latestAlertBand;
    }

    public Double getLatestCoveragePct() {
        return latestCoveragePct;
    }

    public void setLatestCoveragePct(Double latestCoveragePct) {
        this.latestCoveragePct = latestCoveragePct;
    }

    public boolean isLatestIsProvisional() {
        return latestIsProvisional;
    }

    public void setLatestIsProvisional(boolean latestIsProvisional) {
        this.latestIsProvisional = latestIsProvisional;
    }

    public int getLatestRedFlagsCount() {
        return latestRedFlagsCount;
    }

    public void setLatestRedFlagsCount(int latestRedFlagsCount) {
        this.latestRedFlagsCount = latestRedFlagsCount;
    }

    public UUID getLatestRunId() {
        return latestRunId;
    }

    public void setLatestRunId(UUID latestRunId) {
        this.latestRunId = latestRunId;
    }

    public int getLatestRunNumber() {
        return latestRunNumber;
    }

    public void setLatestRunNumber(int latestRunNumber) {
        this.latestRunNumber = latestRunNumber;
    }

    public Instant getLastAnalysedAt() {
        return lastAnalysedAt;
    }

    public void setLastAnalysedAt(Instant lastAnalysedAt) {
        this.lastAnalysedAt = lastAnalysedAt;
    }

    public Instant getLastSubmittedAt() {
        return lastSubmittedAt;
    }

    public void setLastSubmittedAt(Instant lastSubmittedAt) {
        this.lastSubmittedAt = lastSubmittedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
