package org.abhisaran.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class AiSummariseRunResponse {

    @JsonProperty("service_id")
    private String serviceId;

    @JsonProperty("summary_narrative")
    private String summaryNarrative;

    @JsonProperty("key_findings")
    private List<String> keyFindings;

    @JsonProperty("priority_interventions")
    private List<String> priorityInterventions;

    @JsonProperty("disclaimer")
    private String disclaimer;

    @JsonProperty("quality_metadata")
    private Map<String, Object> qualityMetadata;

    public AiSummariseRunResponse() {}

    public String getServiceId() { return serviceId; }
    public void setServiceId(String serviceId) { this.serviceId = serviceId; }

    public String getSummaryNarrative() { return summaryNarrative; }
    public void setSummaryNarrative(String summaryNarrative) { this.summaryNarrative = summaryNarrative; }

    public List<String> getKeyFindings() { return keyFindings; }
    public void setKeyFindings(List<String> keyFindings) { this.keyFindings = keyFindings; }

    public List<String> getPriorityInterventions() { return priorityInterventions; }
    public void setPriorityInterventions(List<String> priorityInterventions) { this.priorityInterventions = priorityInterventions; }

    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }

    public Map<String, Object> getQualityMetadata() { return qualityMetadata; }
    public void setQualityMetadata(Map<String, Object> qualityMetadata) { this.qualityMetadata = qualityMetadata; }
}
