package org.abhisaran.delivery.dto;

import java.util.ArrayList;
import java.util.List;

public class InboxSummaryDTO {

    private long totalDeliveries;
    private long unreadCount;
    private long acknowledgedCount;
    private List<DistrictSummaryDTO> assignedDistricts = new ArrayList<>();
    private List<DeliveryInboxDTO> deliveries = new ArrayList<>();

    public InboxSummaryDTO() {
    }

    public long getTotalDeliveries() {
        return totalDeliveries;
    }

    public void setTotalDeliveries(long totalDeliveries) {
        this.totalDeliveries = totalDeliveries;
    }

    public long getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(long unreadCount) {
        this.unreadCount = unreadCount;
    }

    public long getAcknowledgedCount() {
        return acknowledgedCount;
    }

    public void setAcknowledgedCount(long acknowledgedCount) {
        this.acknowledgedCount = acknowledgedCount;
    }

    public List<DistrictSummaryDTO> getAssignedDistricts() {
        return assignedDistricts;
    }

    public void setAssignedDistricts(List<DistrictSummaryDTO> assignedDistricts) {
        this.assignedDistricts = assignedDistricts;
    }

    public List<DeliveryInboxDTO> getDeliveries() {
        return deliveries;
    }

    public void setDeliveries(List<DeliveryInboxDTO> deliveries) {
        this.deliveries = deliveries;
    }
}
