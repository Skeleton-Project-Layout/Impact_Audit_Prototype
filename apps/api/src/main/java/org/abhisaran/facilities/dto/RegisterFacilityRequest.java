package org.abhisaran.facilities.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class RegisterFacilityRequest {

    @NotBlank(message = "Facility type code is required (e.g., SCHOOL, ANGANWADI, PHC, HOSPITAL)")
    private String typeCode;

    @NotNull(message = "District ID is required")
    private Integer districtId;

    private Integer blockId;

    private Integer panchayatId;

    @NotBlank(message = "Facility name is required")
    private String facilityName;

    private String officialCode;

    private boolean isDemo = false;

    public RegisterFacilityRequest() {
    }

    public RegisterFacilityRequest(String typeCode, Integer districtId, Integer blockId, Integer panchayatId,
                                   String facilityName, String officialCode, boolean isDemo) {
        this.typeCode = typeCode;
        this.districtId = districtId;
        this.blockId = blockId;
        this.panchayatId = panchayatId;
        this.facilityName = facilityName;
        this.officialCode = officialCode;
        this.isDemo = isDemo;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String typeCode;
        private Integer districtId;
        private Integer blockId;
        private Integer panchayatId;
        private String facilityName;
        private String officialCode;
        private boolean isDemo = false;

        public Builder typeCode(String typeCode) { this.typeCode = typeCode; return this; }
        public Builder districtId(Integer districtId) { this.districtId = districtId; return this; }
        public Builder blockId(Integer blockId) { this.blockId = blockId; return this; }
        public Builder panchayatId(Integer panchayatId) { this.panchayatId = panchayatId; return this; }
        public Builder facilityName(String facilityName) { this.facilityName = facilityName; return this; }
        public Builder officialCode(String officialCode) { this.officialCode = officialCode; return this; }
        public Builder isDemo(boolean isDemo) { this.isDemo = isDemo; return this; }

        public RegisterFacilityRequest build() {
            return new RegisterFacilityRequest(typeCode, districtId, blockId, panchayatId, facilityName, officialCode, isDemo);
        }
    }

    public String getTypeCode() { return typeCode; }
    public void setTypeCode(String typeCode) { this.typeCode = typeCode; }
    public Integer getDistrictId() { return districtId; }
    public void setDistrictId(Integer districtId) { this.districtId = districtId; }
    public Integer getBlockId() { return blockId; }
    public void setBlockId(Integer blockId) { this.blockId = blockId; }
    public Integer getPanchayatId() { return panchayatId; }
    public void setPanchayatId(Integer panchayatId) { this.panchayatId = panchayatId; }
    public String getFacilityName() { return facilityName; }
    public void setFacilityName(String facilityName) { this.facilityName = facilityName; }
    public String getOfficialCode() { return officialCode; }
    public void setOfficialCode(String officialCode) { this.officialCode = officialCode; }
    public boolean isDemo() { return isDemo; }
    public void setDemo(boolean demo) { isDemo = demo; }
}
