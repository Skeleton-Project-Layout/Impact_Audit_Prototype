package org.abhisaran.geography.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateBlockRequest {

    @NotNull(message = "District ID is required")
    private Integer districtId;

    @NotBlank(message = "Block code is required")
    @Size(min = 2, max = 16, message = "Block code must be between 2 and 16 characters")
    private String code;

    @NotBlank(message = "Block name is required")
    @Size(min = 2, max = 128, message = "Block name must be between 2 and 128 characters")
    private String name;

    public CreateBlockRequest() {
    }

    public CreateBlockRequest(Integer districtId, String code, String name) {
        this.districtId = districtId;
        this.code = code;
        this.name = name;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Integer districtId;
        private String code;
        private String name;

        public Builder districtId(Integer districtId) {
            this.districtId = districtId;
            return this;
        }

        public Builder code(String code) {
            this.code = code;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public CreateBlockRequest build() {
            return new CreateBlockRequest(districtId, code, name);
        }
    }

    public Integer getDistrictId() {
        return districtId;
    }

    public void setDistrictId(Integer districtId) {
        this.districtId = districtId;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
