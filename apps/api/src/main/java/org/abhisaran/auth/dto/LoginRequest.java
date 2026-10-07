package org.abhisaran.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.abhisaran.users.UserRole;

public class LoginRequest {

    @NotBlank(message = "User ID is required")
    private String loginId;

    @NotBlank(message = "Password is required")
    private String password;

    @NotNull(message = "Role is required")
    private UserRole role;

    public LoginRequest() {
    }

    public LoginRequest(String loginId, String password, UserRole role) {
        this.loginId = loginId;
        this.password = password;
        this.role = role;
    }

    public String getLoginId() {
        return loginId;
    }

    public void setLoginId(String loginId) {
        this.loginId = loginId;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }
}
