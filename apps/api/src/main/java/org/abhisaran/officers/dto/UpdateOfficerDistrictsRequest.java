package org.abhisaran.officers.dto;

import java.util.ArrayList;
import java.util.List;

public class UpdateOfficerDistrictsRequest {

    private List<Integer> districtIds = new ArrayList<>();

    public UpdateOfficerDistrictsRequest() {
    }

    public List<Integer> getDistrictIds() {
        return districtIds;
    }

    public void setDistrictIds(List<Integer> districtIds) {
        this.districtIds = districtIds;
    }
}
