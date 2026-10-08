package org.abhisaran.delivery.persistence;

import jakarta.persistence.*;
import org.abhisaran.facilities.PilotLocation;
import org.abhisaran.geography.District;
import org.abhisaran.scoring.persistence.AnalysisRun;
import org.abhisaran.users.User;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "deliveries", uniqueConstraints = {
    @UniqueConstraint(name = "uq_officer_run_delivery", columnNames = {"officer_id", "run_id"})
})
public class Delivery {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "officer_id", nullable = false)
    private User officer;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "run_id", nullable = false)
    private AnalysisRun analysisRun;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "location_id", nullable = false)
    private PilotLocation pilotLocation;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "district_id", nullable = false)
    private District district;

    @Column(name = "delivered_at", nullable = false, updatable = false)
    private OffsetDateTime deliveredAt;

    @Column(name = "read_at")
    private OffsetDateTime readAt;

    @Column(name = "acknowledged_at")
    private OffsetDateTime acknowledgedAt;

    @Column(name = "acknowledgment_notes", columnDefinition = "TEXT")
    private String acknowledgmentNotes;

    public Delivery() {
    }

    public Delivery(UUID id, User officer, AnalysisRun analysisRun, PilotLocation pilotLocation, District district) {
        this.id = id != null ? id : UUID.randomUUID();
        this.officer = officer;
        this.analysisRun = analysisRun;
        this.pilotLocation = pilotLocation;
        this.district = district;
        this.deliveredAt = OffsetDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.deliveredAt == null) {
            this.deliveredAt = OffsetDateTime.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getOfficer() {
        return officer;
    }

    public void setOfficer(User officer) {
        this.officer = officer;
    }

    public AnalysisRun getAnalysisRun() {
        return analysisRun;
    }

    public void setAnalysisRun(AnalysisRun analysisRun) {
        this.analysisRun = analysisRun;
    }

    public PilotLocation getPilotLocation() {
        return pilotLocation;
    }

    public void setPilotLocation(PilotLocation pilotLocation) {
        this.pilotLocation = pilotLocation;
    }

    public District getDistrict() {
        return district;
    }

    public void setDistrict(District district) {
        this.district = district;
    }

    public OffsetDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(OffsetDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }

    public OffsetDateTime getReadAt() {
        return readAt;
    }

    public void setReadAt(OffsetDateTime readAt) {
        this.readAt = readAt;
    }

    public OffsetDateTime getAcknowledgedAt() {
        return acknowledgedAt;
    }

    public void setAcknowledgedAt(OffsetDateTime acknowledgedAt) {
        this.acknowledgedAt = acknowledgedAt;
    }

    public String getAcknowledgmentNotes() {
        return acknowledgmentNotes;
    }

    public void setAcknowledgmentNotes(String acknowledgmentNotes) {
        this.acknowledgmentNotes = acknowledgmentNotes;
    }
}
