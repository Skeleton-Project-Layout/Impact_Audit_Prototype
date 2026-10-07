package org.abhisaran.facilities.dto;

import java.time.Instant;
import java.util.UUID;

public class FacilityResponse {
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
    private String facilityName;
    private String officialCode;
    private Instant createdAt;

    public FacilityResponse() {
    }

    public FacilityResponse(UUID id, String code, String typeCode, String typePrefix, String typeLabel,
                            String domain, Integer districtId, String districtCode, String districtName,
                            Integer blockId, String blockName, Integer panchayatId, String panchayatName,
                            String status, boolean isDemo, String facilityName, String officialCode,
                            Instant createdAt) {
        this.id = id;
        this.code = code;
        this.typeCode = typeCode;
        this.typePrefix = typePrefix;
        this.typeLabel = typeLabel;
        this.domain = domain;
        this.districtId = districtId;
        this.districtCode = districtCode;
        this.districtName = districtName;
        this.blockId = blockId;
        this.blockName = blockName;
        this.panchayatId = panchayatId;
        this.panchayatName = panchayatName;
        this.status = status;
        this.isDemo = isDemo;
        this.facilityName = facilityName;
        this.officialCode = officialCode;
        this.createdAt = createdAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
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
        private String facilityName;
        private String officialCode;
        private Instant createdAt;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder code(String code) { this.code = code; return this; }
        public Builder typeCode(String typeCode) { this.typeCode = typeCode; return this; }
        public Builder typePrefix(String typePrefix) { this.typePrefix = typePrefix; return this; }
        public Builder typeLabel(String typeLabel) { this.typeLabel = typeLabel; return this; }
        public Builder domain(String domain) { this.domain = domain; return this; }
        public Builder districtId(Integer districtId) { this.districtId = districtId; return this; }
        public Builder districtCode(String districtCode) { this.districtCode = districtCode; return this; }
        public Builder districtName(String districtName) { this.districtName = districtName; return this; }
        public Builder blockId(Integer blockId) { this.blockId = blockId; return this; }
        public Builder blockName(String blockName) { this.blockName = blockName; return this; }
        public Builder panchayatId(Integer panchayatId) { this.panchayatId = panchayatId; return this; }
        public Builder panchayatName(String panchayatName) { this.panchayatName = panchayatName; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder isDemo(boolean isDemo) { this.isDemo = isDemo; return this; }
        public Builder facilityName(String facilityName) { this.facilityName = facilityName; return this; }
        public Builder officialCode(String officialCode) { this.officialCode = officialCode; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }

        public FacilityResponse build() {
            return new FacilityResponse(id, code, typeCode, typePrefix, typeLabel, domain, districtId,
                    districtCode, districtName, blockId, blockName, panchayatId, panchayatName,
                    status, isDemo, facilityName, officialCode, createdAt);
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getTypeCode() { return typeCode; }
    public void setTypeCode(String typeCode) { this.typeCode = typeCode; }
    public String getTypePrefix() { return typePrefix; }
    public void setTypePrefix(String typePrefix) { this.typePrefix = typePrefix; }
    public String getTypeLabel() { return typeLabel; }
    public void setTypeLabel(String typeLabel) { this.typeLabel = typeLabel; }
    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }
    public Integer getDistrictId() { return districtId; }
    public void setDistrictId(Integer districtId) { this.districtId = districtId; }
    public String getDistrictCode() { return districtCode; }
    public void setDistrictCode(String districtCode) { this.districtCode = districtCode; }
    public String getDistrictName() { return districtName; }
    public void setDistrictName(String districtName) { this.districtName = districtName; }
    public Integer getBlockId() { return blockId; }
    public void setBlockId(Integer blockId) { this.blockId = blockId; }
    public String getBlockName() { return blockName; }
    public void setBlockName(String blockName) { this.blockName = blockName; }
    public Integer getPanchayatId() { return panchayatId; }
    public void setPanchayatId(Integer panchayatId) { this.panchayatId = panchayatId; }
    public String getPanchayatName() { return panchayatName; }
    public void setPanchayatName(String panchayatName) { this.panchayatName = panchayatName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public boolean isDemo() { return isDemo; }
    public void setDemo(boolean demo) { isDemo = demo; }
    public String getFacilityName() { return facilityName; }
    public void setFacilityName(String facilityName) { this.facilityName = facilityName; }
    public String getOfficialCode() { return officialCode; }
    public void setOfficialCode(String officialCode) { this.officialCode = officialCode; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
