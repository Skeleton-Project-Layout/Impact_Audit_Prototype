package org.abhisaran.delivery.dto;

public class AcknowledgeDeliveryRequest {

    private String notes;

    public AcknowledgeDeliveryRequest() {
    }

    public AcknowledgeDeliveryRequest(String notes) {
        this.notes = notes;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
