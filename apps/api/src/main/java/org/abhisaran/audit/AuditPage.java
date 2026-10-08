package org.abhisaran.audit;

import jakarta.persistence.*;
import org.abhisaran.facilities.PilotLocation;
import org.abhisaran.users.User;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_pages", uniqueConstraints = {
        @UniqueConstraint(name = "uq_audit_pages_location_page", columnNames = {"pilot_location_id", "page_number"})
})
public class AuditPage {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pilot_location_id", nullable = false)
    private PilotLocation pilotLocation;

    @Column(name = "page_number", nullable = false)
    private int pageNumber;

    @Column(nullable = false, length = 32)
    private String status = "DRAFT"; // DRAFT, SUBMITTED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public AuditPage() {
    }

    public AuditPage(UUID id, PilotLocation pilotLocation, int pageNumber, String status, User createdBy) {
        this.id = id != null ? id : UUID.randomUUID();
        this.pilotLocation = pilotLocation;
        this.pageNumber = pageNumber;
        this.status = status != null ? status : "DRAFT";
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public PilotLocation getPilotLocation() {
        return pilotLocation;
    }

    public void setPilotLocation(PilotLocation pilotLocation) {
        this.pilotLocation = pilotLocation;
    }

    public int getPageNumber() {
        return pageNumber;
    }

    public void setPageNumber(int pageNumber) {
        this.pageNumber = pageNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
