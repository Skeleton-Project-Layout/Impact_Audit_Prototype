package org.abhisaran.facilities;

import jakarta.persistence.*;

@Entity
@Table(name = "pilot_location_types")
public class PilotLocationType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 16, unique = true)
    private String code;

    @Column(nullable = false, length = 4, unique = true)
    private String prefix;

    @Column(nullable = false, length = 64)
    private String label;

    @Column(nullable = false, length = 32)
    private String domain;

    public PilotLocationType() {
    }

    public PilotLocationType(Integer id, String code, String prefix, String label, String domain) {
        this.id = id;
        this.code = code;
        this.prefix = prefix;
        this.label = label;
        this.domain = domain;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getPrefix() {
        return prefix;
    }

    public void setPrefix(String prefix) {
        this.prefix = prefix;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getDomain() {
        return domain;
    }

    public void setDomain(String domain) {
        this.domain = domain;
    }
}
