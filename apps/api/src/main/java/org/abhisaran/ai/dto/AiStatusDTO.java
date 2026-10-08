package org.abhisaran.ai.dto;

public class AiStatusDTO {
    private boolean featureEnabled;
    private String serviceStatus;
    private String serviceUrl;
    private String serviceId;

    public AiStatusDTO() {}

    public AiStatusDTO(boolean featureEnabled, String serviceStatus, String serviceUrl, String serviceId) {
        this.featureEnabled = featureEnabled;
        this.serviceStatus = serviceStatus;
        this.serviceUrl = serviceUrl;
        this.serviceId = serviceId;
    }

    public boolean isFeatureEnabled() { return featureEnabled; }
    public void setFeatureEnabled(boolean featureEnabled) { this.featureEnabled = featureEnabled; }

    public String getServiceStatus() { return serviceStatus; }
    public void setServiceStatus(String serviceStatus) { this.serviceStatus = serviceStatus; }

    public String getServiceUrl() { return serviceUrl; }
    public void setServiceUrl(String serviceUrl) { this.serviceUrl = serviceUrl; }

    public String getServiceId() { return serviceId; }
    public void setServiceId(String serviceId) { this.serviceId = serviceId; }
}
