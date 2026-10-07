package org.abhisaran.geography.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreatePanchayatRequest {

    @NotNull(message = "Block ID is required")
    private Integer blockId;

    @NotBlank(message = "Panchayat code is required")
    @Size(min = 2, max = 16, message = "Panchayat code must be between 2 and 16 characters")
    private String code;

    @NotBlank(message = "Panchayat name is required")
    @Size(min = 2, max = 128, message = "Panchayat name must be between 2 and 128 characters")
    private String name;

    public CreatePanchayatRequest() {
    }

    public CreatePanchayatRequest(Integer blockId, String code, String name) {
        this.blockId = blockId;
        this.code = code;
        this.name = name;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Integer blockId;
        private String code;
        private String name;

        public Builder blockId(Integer blockId) {
            this.blockId = blockId;
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

        public CreatePanchayatRequest build() {
            return new CreatePanchayatRequest(blockId, code, name);
        }
    }

    public Integer getBlockId() {
        return blockId;
    }

    public void setBlockId(Integer blockId) {
        this.blockId = blockId;
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
