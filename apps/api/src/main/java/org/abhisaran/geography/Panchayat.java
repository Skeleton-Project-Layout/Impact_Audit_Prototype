package org.abhisaran.geography;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "panchayats", uniqueConstraints = {
    @UniqueConstraint(name = "uq_block_panchayat_code", columnNames = {"block_id", "code"})
})
public class Panchayat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "block_id", nullable = false)
    @JsonIgnore
    private Block block;

    @Column(nullable = false, length = 16)
    private String code;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(nullable = false)
    private boolean active = true;

    public Panchayat() {
    }

    public Panchayat(Integer id, Block block, String code, String name, boolean active) {
        this.id = id;
        this.block = block;
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

    public Block getBlock() {
        return block;
    }

    public void setBlock(Block block) {
        this.block = block;
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
