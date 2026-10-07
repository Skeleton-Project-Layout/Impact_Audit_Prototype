package org.abhisaran.geography;

import jakarta.persistence.*;

@Entity
@Table(name = "states")
public class State {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 2, unique = true)
    private String code2;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(nullable = false)
    private boolean active = true;

    public State() {
    }

    public State(Integer id, String code2, String name, boolean active) {
        this.id = id;
        this.code2 = code2;
        this.name = name;
        this.active = active;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getCode2() {
        return code2;
    }

    public void setCode2(String code2) {
        this.code2 = code2;
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
