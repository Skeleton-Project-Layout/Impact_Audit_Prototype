package org.abhisaran.facilities;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class FacilityCodeSequenceId implements Serializable {

    @Column(name = "district_id")
    private Integer districtId;

    @Column(name = "type_id")
    private Integer typeId;

    public FacilityCodeSequenceId() {
    }

    public FacilityCodeSequenceId(Integer districtId, Integer typeId) {
        this.districtId = districtId;
        this.typeId = typeId;
    }

    public Integer getDistrictId() {
        return districtId;
    }

    public void setDistrictId(Integer districtId) {
        this.districtId = districtId;
    }

    public Integer getTypeId() {
        return typeId;
    }

    public void setTypeId(Integer typeId) {
        this.typeId = typeId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FacilityCodeSequenceId that = (FacilityCodeSequenceId) o;
        return Objects.equals(districtId, that.districtId) && Objects.equals(typeId, that.typeId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(districtId, typeId);
    }
}
