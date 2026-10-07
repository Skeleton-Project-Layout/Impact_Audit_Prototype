package org.abhisaran.geography;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "blocks", uniqueConstraints = {
    @UniqueConstraint(name = "uq_district_block_code", columnNames = {"district_id", "code"})
})
public class Block {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "district_id", nullable = false)
    @JsonIgnore
    private District district;

    @Column(nullable = false, length = 16)
    private String code;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(nullable = false)
    private boolean active = true;

    public Block() {
    }

    public Block(Integer id, District district, String code, String name, boolean active) {
        this.id = id;
        this.district = district;
        this.code = code;
        this.name = name;
        this.active = active;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public District getDistrict() {
        return district;
    }

    public void setDistrict(District district) {
        this.district = district;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
