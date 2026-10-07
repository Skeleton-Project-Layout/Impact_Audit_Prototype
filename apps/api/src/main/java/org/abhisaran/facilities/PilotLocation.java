package org.abhisaran.facilities;

import jakarta.persistence.*;
import org.abhisaran.geography.Block;
import org.abhisaran.geography.District;
import org.abhisaran.geography.Panchayat;
import org.abhisaran.users.User;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pilot_locations")
public class PilotLocation {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false, length = 32, unique = true)
    private String code;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "type_id", nullable = false)
    private PilotLocationType type;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "district_id", nullable = false)
    private District district;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "block_id")
    private Block block;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "panchayat_id")
    private Panchayat panchayat;

    @Column(nullable = false, length = 32)
    private String status = "REGISTERED";

    @Column(name = "is_demo", nullable = false)
    private boolean isDemo = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public PilotLocation() {
    }

    public PilotLocation(UUID id, String code, PilotLocationType type, District district, Block block,
                         Panchayat panchayat, String status, boolean isDemo, User createdBy) {
        this.id = id != null ? id : UUID.randomUUID();
        this.code = code;
        this.type = type;
        this.district = district;
        this.block = block;
        this.panchayat = panchayat;
        this.status = status != null ? status : "REGISTERED";
        this.isDemo = isDemo;
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

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public PilotLocationType getType() { return type; }
    public void setType(PilotLocationType type) { this.type = type; }
    public District getDistrict() { return district; }
    public void setDistrict(District district) { this.district = district; }
    public Block getBlock() { return block; }
    public void setBlock(Block block) { this.block = block; }
    public Panchayat getPanchayat() { return panchayat; }
    public void setPanchayat(Panchayat panchayat) { this.panchayat = panchayat; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public boolean isDemo() { return isDemo; }
    public void setDemo(boolean demo) { isDemo = demo; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
