package org.abhisaran.geography;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "districts", uniqueConstraints = {
    @UniqueConstraint(name = "uq_state_district_code", columnNames = {"state_id", "code3"})
})
public class District {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "state_id", nullable = false)
    @JsonIgnore
    private State state;

    @Column(nullable = false, length = 3)
    private String code3;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(nullable = false)
    private boolean active = true;

    public District() {
    }

    public District(Integer id, State state, String code3, String name, boolean active) {
        this.id = id;
        this.state = state;
        this.code3 = code3;
        this.name = name;
        this.active = active;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public State getState() {
        return state;
    }

    public void setState(State state) {
        this.state = state;
    }

    public String getCode3() {
        return code3;
    }

    public void setCode3(String code3) {
        this.code3 = code3;
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
