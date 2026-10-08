package org.abhisaran.dashboard.dto;

import java.util.ArrayList;
import java.util.List;

public class BulkAnalyseResponse {

    private int totalRequested;
    private int totalSuccess;
    private int totalFailed;
    private List<BulkAnalyseItemResult> results = new ArrayList<>();

    public BulkAnalyseResponse() {
    }

    public BulkAnalyseResponse(int totalRequested, int totalSuccess, int totalFailed, List<BulkAnalyseItemResult> results) {
        this.totalRequested = totalRequested;
        this.totalSuccess = totalSuccess;
        this.totalFailed = totalFailed;
        this.results = results;
    }

    public int getTotalRequested() {
        return totalRequested;
    }

    public void setTotalRequested(int totalRequested) {
        this.totalRequested = totalRequested;
    }

    public int getTotalSuccess() {
        return totalSuccess;
    }

    public void setTotalSuccess(int totalSuccess) {
        this.totalSuccess = totalSuccess;
    }

    public int getTotalFailed() {
        return totalFailed;
    }

    public void setTotalFailed(int totalFailed) {
        this.totalFailed = totalFailed;
    }

    public List<BulkAnalyseItemResult> getResults() {
        return results;
    }

    public void setResults(List<BulkAnalyseItemResult> results) {
        this.results = results;
    }
}
