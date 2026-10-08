package org.abhisaran.questions;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "severity_weights")
public class SeverityWeight {

    @Id
    @Column(length = 16, nullable = false)
    private String severity; // 'CRITICAL', 'HIGH', 'MEDIUM'

    @Column(nullable = false)
    private int weight; // 3, 2, 1

    @Column(name = "version_number", nullable = false)
    private int versionNumber = 1;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public SeverityWeight() {
    }

    public SeverityWeight(String severity, int weight, int versionNumber) {
        this.severity = severity;
        this.weight = weight;
        this.versionNumber = versionNumber;
        this.updatedAt = Instant.now();
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public int getWeight() {
        return weight;
    }

    public void setWeight(int weight) {
        this.weight = weight;
    }

    public int getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(int versionNumber) {
        this.versionNumber = versionNumber;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
