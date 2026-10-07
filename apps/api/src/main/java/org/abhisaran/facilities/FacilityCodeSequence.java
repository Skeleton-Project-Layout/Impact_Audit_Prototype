package org.abhisaran.facilities;

import jakarta.persistence.*;

@Entity
@Table(name = "facility_code_sequences")
public class FacilityCodeSequence {

    @EmbeddedId
    private FacilityCodeSequenceId id;

    @Column(name = "next_val", nullable = false)
    private Long nextVal = 1L;

    public FacilityCodeSequence() {
    }

    public FacilityCodeSequence(FacilityCodeSequenceId id, Long nextVal) {
        this.id = id;
        this.nextVal = nextVal != null ? nextVal : 1L;
    }

    public FacilityCodeSequenceId getId() {
        return id;
    }

    public void setId(FacilityCodeSequenceId id) {
        this.id = id;
    }

    public Long getNextVal() {
        return nextVal;
    }

    public void setNextVal(Long nextVal) {
        this.nextVal = nextVal;
    }
}
