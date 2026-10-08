package org.abhisaran.dashboard.dto;

import java.util.ArrayList;
import java.util.List;

public class DashboardOverviewDTO {

    private DashboardMetricsDTO metrics;
    private List<LocationOverviewItemDTO> items = new ArrayList<>();
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    public DashboardOverviewDTO() {
    }

    public DashboardOverviewDTO(DashboardMetricsDTO metrics, List<LocationOverviewItemDTO> items,
                                int page, int size, long totalElements, int totalPages) {
        this.metrics = metrics;
        this.items = items;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
    }

    public DashboardMetricsDTO getMetrics() {
        return metrics;
    }

    public void setMetrics(DashboardMetricsDTO metrics) {
        this.metrics = metrics;
    }

    public List<LocationOverviewItemDTO> getItems() {
        return items;
    }

    public void setItems(List<LocationOverviewItemDTO> items) {
        this.items = items;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }
}
