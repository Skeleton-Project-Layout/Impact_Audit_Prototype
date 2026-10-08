package org.abhisaran.dashboard.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class BulkAnalyseRequest {

    private List<UUID> locationIds = new ArrayList<>();

    public BulkAnalyseRequest() {
    }

    public BulkAnalyseRequest(List<UUID> locationIds) {
        this.locationIds = locationIds;
    }

    public List<UUID> getLocationIds() {
        return locationIds;
    }

    public void setLocationIds(List<UUID> locationIds) {
        this.locationIds = locationIds;
    }
}
