package org.abhisaran.facilities;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pilot_location_registry")
public class PilotLocationRegistry {

    @Id
    @Column(name = "location_id")
    private UUID locationId;

    @Column(length = 255)
    private String name;

    @Column(name = "official_code", length = 64)
    private String officialCode;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public PilotLocationRegistry() {
    }

    public PilotLocationRegistry(UUID locationId, String name, String officialCode) {
        this.locationId = locationId;
        this.name = name;
        this.officialCode = officialCode;
        this.updatedAt = Instant.now();
    }

    @PrePersist
    @PreUpdate
    public void prePersistOrUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getLocationId() { return locationId; }
    public void setLocationId(UUID locationId) { this.locationId = locationId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getOfficialCode() { return officialCode; }
    public void setOfficialCode(String officialCode) { this.officialCode = officialCode; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
