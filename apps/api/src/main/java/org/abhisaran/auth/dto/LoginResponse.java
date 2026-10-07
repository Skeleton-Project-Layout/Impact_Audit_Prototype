package org.abhisaran.auth.dto;

import org.abhisaran.users.UserRole;
import java.util.UUID;

public class LoginResponse {

    private UUID id;
    private String loginId;
    private String displayName;
    private String designation;
    private UserRole role;
    private boolean mustChangePassword;

    public LoginResponse() {
    }

    public LoginResponse(UUID id, String loginId, String displayName, String designation,
                         UserRole role, boolean mustChangePassword) {
        this.id = id;
        this.loginId = loginId;
        this.displayName = displayName;
        this.designation = designation;
        this.role = role;
        this.mustChangePassword = mustChangePassword;
    }

    public UUID getId() {
        return id;
    }

    public String getLoginId() {
        return loginId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDesignation() {
        return designation;
    }

    public UserRole getRole() {
        return role;
    }

    public boolean isMustChangePassword() {
        return mustChangePassword;
    }
}
