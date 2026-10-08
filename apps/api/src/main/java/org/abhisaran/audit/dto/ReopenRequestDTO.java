package org.abhisaran.audit.dto;

import jakarta.validation.constraints.NotBlank;

public class ReopenRequestDTO {

    @NotBlank(message = "Reopen reason is mandatory")
    private String reason;

    public ReopenRequestDTO() {
    }

    public ReopenRequestDTO(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
