package org.abhisaran.officers.persistence;

import jakarta.persistence.*;
import org.abhisaran.geography.District;
import org.abhisaran.users.User;

import java.time.OffsetDateTime;

@Entity
@Table(name = "officer_districts", uniqueConstraints = {
    @UniqueConstraint(name = "uq_officer_district", columnNames = {"officer_id", "district_id"})
})
public class OfficerDistrict {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "officer_id", nullable = false)
    private User officer;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "district_id", nullable = false)
    private District district;

    @Column(name = "granted_at", nullable = false, updatable = false)
    private OffsetDateTime grantedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "granted_by")
    private User grantedBy;

    public OfficerDistrict() {
    }

    public OfficerDistrict(User officer, District district, User grantedBy) {
        this.officer = officer;
        this.district = district;
        this.grantedBy = grantedBy;
        this.grantedAt = OffsetDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.grantedAt == null) {
            this.grantedAt = OffsetDateTime.now();
        }
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public User getOfficer() {
        return officer;
    }

    public void setOfficer(User officer) {
        this.officer = officer;
    }

    public District getDistrict() {
        return district;
    }

    public void setDistrict(District district) {
        this.district = district;
    }

    public OffsetDateTime getGrantedAt() {
        return grantedAt;
    }

    public void setGrantedAt(OffsetDateTime grantedAt) {
        this.grantedAt = grantedAt;
    }

    public User getGrantedBy() {
        return grantedBy;
    }

    public void setGrantedBy(User grantedBy) {
        this.grantedBy = grantedBy;
    }
}
