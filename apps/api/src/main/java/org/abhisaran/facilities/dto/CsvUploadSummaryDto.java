package org.abhisaran.facilities.dto;

import java.util.ArrayList;
import java.util.List;

public class CsvUploadSummaryDto {
    private int totalRows;
    private int successCount;
    private int failureCount;
    private List<FacilityResponse> createdFacilities = new ArrayList<>();
    private List<CsvRowErrorDto> errors = new ArrayList<>();

    public CsvUploadSummaryDto() {
    }

    public CsvUploadSummaryDto(int totalRows, int successCount, int failureCount,
                               List<FacilityResponse> createdFacilities, List<CsvRowErrorDto> errors) {
        this.totalRows = totalRows;
        this.successCount = successCount;
        this.failureCount = failureCount;
        this.createdFacilities = createdFacilities != null ? createdFacilities : new ArrayList<>();
        this.errors = errors != null ? errors : new ArrayList<>();
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private int totalRows;
        private int successCount;
        private int failureCount;
        private List<FacilityResponse> createdFacilities = new ArrayList<>();
        private List<CsvRowErrorDto> errors = new ArrayList<>();

        public Builder totalRows(int totalRows) { this.totalRows = totalRows; return this; }
        public Builder successCount(int successCount) { this.successCount = successCount; return this; }
        public Builder failureCount(int failureCount) { this.failureCount = failureCount; return this; }
        public Builder createdFacilities(List<FacilityResponse> list) { this.createdFacilities = list; return this; }
        public Builder errors(List<CsvRowErrorDto> list) { this.errors = list; return this; }

        public CsvUploadSummaryDto build() {
            return new CsvUploadSummaryDto(totalRows, successCount, failureCount, createdFacilities, errors);
        }
    }

    public int getTotalRows() { return totalRows; }
    public void setTotalRows(int totalRows) { this.totalRows = totalRows; }
    public int getSuccessCount() { return successCount; }
    public void setSuccessCount(int successCount) { this.successCount = successCount; }
    public int getFailureCount() { return failureCount; }
    public void setFailureCount(int failureCount) { this.failureCount = failureCount; }
    public List<FacilityResponse> getCreatedFacilities() { return createdFacilities; }
    public void setCreatedFacilities(List<FacilityResponse> list) { this.createdFacilities = list; }
    public List<CsvRowErrorDto> getErrors() { return errors; }
    public void setErrors(List<CsvRowErrorDto> errors) { this.errors = errors; }
}
