package org.abhisaran.geography.dto;

public class GeographyDto {

    public static class StateResponse {
        private Integer id;
        private String code2;
        private String name;
        private boolean active;

        public StateResponse() {}

        public StateResponse(Integer id, String code2, String name, boolean active) {
            this.id = id;
            this.code2 = code2;
            this.name = name;
            this.active = active;
        }

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private Integer id;
            private String code2;
            private String name;
            private boolean active;

            public Builder id(Integer id) { this.id = id; return this; }
            public Builder code2(String code2) { this.code2 = code2; return this; }
            public Builder name(String name) { this.name = name; return this; }
            public Builder active(boolean active) { this.active = active; return this; }
            public StateResponse build() { return new StateResponse(id, code2, name, active); }
        }

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        public String getCode2() { return code2; }
        public void setCode2(String code2) { this.code2 = code2; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }
    }

    public static class DistrictResponse {
        private Integer id;
        private Integer stateId;
        private String stateCode;
        private String code3;
        private String name;
        private boolean active;

        public DistrictResponse() {}

        public DistrictResponse(Integer id, Integer stateId, String stateCode, String code3, String name, boolean active) {
            this.id = id;
            this.stateId = stateId;
            this.stateCode = stateCode;
            this.code3 = code3;
            this.name = name;
            this.active = active;
        }

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private Integer id;
            private Integer stateId;
            private String stateCode;
            private String code3;
            private String name;
            private boolean active;

            public Builder id(Integer id) { this.id = id; return this; }
            public Builder stateId(Integer stateId) { this.stateId = stateId; return this; }
            public Builder stateCode(String stateCode) { this.stateCode = stateCode; return this; }
            public Builder code3(String code3) { this.code3 = code3; return this; }
            public Builder name(String name) { this.name = name; return this; }
            public Builder active(boolean active) { this.active = active; return this; }
            public DistrictResponse build() { return new DistrictResponse(id, stateId, stateCode, code3, name, active); }
        }

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        public Integer getStateId() { return stateId; }
        public void setStateId(Integer stateId) { this.stateId = stateId; }
        public String getStateCode() { return stateCode; }
        public void setStateCode(String stateCode) { this.stateCode = stateCode; }
        public String getCode3() { return code3; }
        public void setCode3(String code3) { this.code3 = code3; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }
    }

    public static class BlockResponse {
        private Integer id;
        private Integer districtId;
        private String districtCode;
        private String code;
        private String name;
        private boolean active;

        public BlockResponse() {}

        public BlockResponse(Integer id, Integer districtId, String districtCode, String code, String name, boolean active) {
            this.id = id;
            this.districtId = districtId;
            this.districtCode = districtCode;
            this.code = code;
            this.name = name;
            this.active = active;
        }

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private Integer id;
            private Integer districtId;
            private String districtCode;
            private String code;
            private String name;
            private boolean active;

            public Builder id(Integer id) { this.id = id; return this; }
            public Builder districtId(Integer districtId) { this.districtId = districtId; return this; }
            public Builder districtCode(String districtCode) { this.districtCode = districtCode; return this; }
            public Builder code(String code) { this.code = code; return this; }
            public Builder name(String name) { this.name = name; return this; }
            public Builder active(boolean active) { this.active = active; return this; }
            public BlockResponse build() { return new BlockResponse(id, districtId, districtCode, code, name, active); }
        }

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        public Integer getDistrictId() { return districtId; }
        public void setDistrictId(Integer districtId) { this.districtId = districtId; }
        public String getDistrictCode() { return districtCode; }
        public void setDistrictCode(String districtCode) { this.districtCode = districtCode; }
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }
    }

    public static class PanchayatResponse {
        private Integer id;
        private Integer blockId;
        private String blockCode;
        private String code;
        private String name;
        private boolean active;

        public PanchayatResponse() {}

        public PanchayatResponse(Integer id, Integer blockId, String blockCode, String code, String name, boolean active) {
            this.id = id;
            this.blockId = blockId;
            this.blockCode = blockCode;
            this.code = code;
            this.name = name;
            this.active = active;
        }

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private Integer id;
            private Integer blockId;
            private String blockCode;
            private String code;
            private String name;
            private boolean active;

            public Builder id(Integer id) { this.id = id; return this; }
            public Builder blockId(Integer blockId) { this.blockId = blockId; return this; }
            public Builder blockCode(String blockCode) { this.blockCode = blockCode; return this; }
            public Builder code(String code) { this.code = code; return this; }
            public Builder name(String name) { this.name = name; return this; }
            public Builder active(boolean active) { this.active = active; return this; }
            public PanchayatResponse build() { return new PanchayatResponse(id, blockId, blockCode, code, name, active); }
        }

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        public Integer getBlockId() { return blockId; }
        public void setBlockId(Integer blockId) { this.blockId = blockId; }
        public String getBlockCode() { return blockCode; }
        public void setBlockCode(String blockCode) { this.blockCode = blockCode; }
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }
    }
}
