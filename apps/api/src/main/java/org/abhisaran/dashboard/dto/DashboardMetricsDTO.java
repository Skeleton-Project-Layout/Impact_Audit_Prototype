package org.abhisaran.dashboard.dto;

public class DashboardMetricsDTO {

    private long totalLocations;
    private long readyForAnalysisCount;
    private long analysedCount;
    private long draftCount;
    private long registeredCount;

    public DashboardMetricsDTO() {
    }

    public DashboardMetricsDTO(long totalLocations, long readyForAnalysisCount,
                               long analysedCount, long draftCount, long registeredCount) {
        this.totalLocations = totalLocations;
        this.readyForAnalysisCount = readyForAnalysisCount;
        this.analysedCount = analysedCount;
        this.draftCount = draftCount;
        this.registeredCount = registeredCount;
    }

    public long getTotalLocations() {
        return totalLocations;
    }

    public void setTotalLocations(long totalLocations) {
        this.totalLocations = totalLocations;
    }

    public long getReadyForAnalysisCount() {
        return readyForAnalysisCount;
    }

    public void setReadyForAnalysisCount(long readyForAnalysisCount) {
        this.readyForAnalysisCount = readyForAnalysisCount;
    }

    public long getAnalysedCount() {
        return analysedCount;
    }

    public void setAnalysedCount(long analysedCount) {
        this.analysedCount = analysedCount;
    }

    public long getDraftCount() {
        return draftCount;
    }

    public void setDraftCount(long draftCount) {
        this.draftCount = draftCount;
    }

    public long getRegisteredCount() {
        return registeredCount;
    }

    public void setRegisteredCount(long registeredCount) {
        this.registeredCount = registeredCount;
    }
}
