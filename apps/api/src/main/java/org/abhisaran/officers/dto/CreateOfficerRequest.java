package org.abhisaran.officers.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public class CreateOfficerRequest {

    @NotBlank(message = "Login ID is required")
    @Size(min = 3, max = 64, message = "Login ID must be between 3 and 64 characters")
    private String loginId;

    @NotBlank(message = "Display name is required")
    @Size(max = 128, message = "Display name must not exceed 128 characters")
    private String displayName;

    private String designation;

    @NotBlank(message = "Temporary password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    private List<Integer> districtIds = new ArrayList<>();

    public CreateOfficerRequest() {
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public List<Integer> getDistrictIds() {
        return districtIds;
    }

    public void setDistrictIds(List<Integer> districtIds) {
        this.districtIds = districtIds;
    }
}
