package org.abhisaran.questions;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "alert_bands")
public class AlertBand {

    @Id
    @Column(length = 20, nullable = false)
    private String band; // 'RED', 'ORANGE', 'AMBER', 'LIGHT_GREEN', 'DARK_GREEN'

    @Column(name = "min_score", precision = 5, scale = 2, nullable = false)
    private BigDecimal minScore;

    @Column(name = "max_score", precision = 5, scale = 2, nullable = false)
    private BigDecimal maxScore;

    @Column(length = 64, nullable = false)
    private String label;

    @Column(name = "color_hex", length = 16, nullable = false)
    private String colorHex;

    @Column(name = "version_number", nullable = false)
    private int versionNumber = 1;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public AlertBand() {
    }

    public AlertBand(String band, BigDecimal minScore, BigDecimal maxScore, String label, String colorHex, int versionNumber) {
        this.band = band;
        this.minScore = minScore;
        this.maxScore = maxScore;
        this.label = label;
        this.colorHex = colorHex;
        this.versionNumber = versionNumber;
        this.updatedAt = Instant.now();
    }

    public String getBand() {
        return band;
    }

    public void setBand(String band) {
        this.band = band;
    }

    public BigDecimal getMinScore() {
        return minScore;
    }

    public void setMinScore(BigDecimal minScore) {
        this.minScore = minScore;
    }

    public BigDecimal getMaxScore() {
        return maxScore;
    }

    public void setMaxScore(BigDecimal maxScore) {
        this.maxScore = maxScore;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getColorHex() {
        return colorHex;
    }

    public void setColorHex(String colorHex) {
        this.colorHex = colorHex;
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
