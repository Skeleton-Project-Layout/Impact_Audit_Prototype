package org.abhisaran.questions;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "scoring_settings")
public class ScoringSetting {

    @Id
    @Column(length = 32, nullable = false)
    private String id;

    @Column(name = "setting_value", length = 128, nullable = false)
    private String settingValue;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "version_number", nullable = false)
    private int versionNumber = 1;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public ScoringSetting() {
    }

    public ScoringSetting(String id, String settingValue, String description, int versionNumber) {
        this.id = id;
        this.settingValue = settingValue;
        this.description = description;
        this.versionNumber = versionNumber;
        this.updatedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSettingValue() {
        return settingValue;
    }

    public void setSettingValue(String settingValue) {
        this.settingValue = settingValue;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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
