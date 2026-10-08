package org.abhisaran.scoring.persistence;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "analysis_ledger")
public class AnalysisLedgerEntry {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_run_id", nullable = false)
    private AnalysisRun analysisRun;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_item_id")
    private AnalysisItem analysisItem;

    @Column(name = "question_id", nullable = false, length = 64)
    private String questionId;

    @Column(name = "page_number", nullable = false)
    private int pageNumber = 1;

    @Column(name = "question_text", nullable = false, columnDefinition = "text")
    private String questionText;

    @Column(nullable = false, length = 16)
    private String severity;

    @Column(precision = 4, scale = 2, nullable = false)
    private BigDecimal weight;

    @Column(name = "lost_weighted_points", precision = 8, scale = 4, nullable = false)
    private BigDecimal lostWeightedPoints;

    @Column(name = "deduction_percentage", precision = 6, scale = 2, nullable = false)
    private BigDecimal deductionPercentage;

    @Column(name = "loss_explanation", nullable = false, columnDefinition = "text")
    private String lossExplanation;

    @Column(name = "suggested_intervention", columnDefinition = "text")
    private String suggestedIntervention;

    public AnalysisLedgerEntry() {
    }

    public AnalysisLedgerEntry(UUID id, AnalysisRun analysisRun, AnalysisItem analysisItem, String questionId,
                               int pageNumber, String questionText, String severity, BigDecimal weight,
                               BigDecimal lostWeightedPoints, BigDecimal deductionPercentage,
                               String lossExplanation, String suggestedIntervention) {
        this.id = id != null ? id : UUID.randomUUID();
        this.analysisRun = analysisRun;
        this.analysisItem = analysisItem;
        this.questionId = questionId;
        this.pageNumber = pageNumber;
        this.questionText = questionText;
        this.severity = severity;
        this.weight = weight;
        this.lostWeightedPoints = lostWeightedPoints;
        this.deductionPercentage = deductionPercentage;
        this.lossExplanation = lossExplanation;
        this.suggestedIntervention = suggestedIntervention;
    }

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public AnalysisRun getAnalysisRun() { return analysisRun; }
    public void setAnalysisRun(AnalysisRun analysisRun) { this.analysisRun = analysisRun; }

    public AnalysisItem getAnalysisItem() { return analysisItem; }
    public void setAnalysisItem(AnalysisItem analysisItem) { this.analysisItem = analysisItem; }

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }

    public int getPageNumber() { return pageNumber; }
    public void setPageNumber(int pageNumber) { this.pageNumber = pageNumber; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public BigDecimal getWeight() { return weight; }
    public void setWeight(BigDecimal weight) { this.weight = weight; }

    public BigDecimal getLostWeightedPoints() { return lostWeightedPoints; }
    public void setLostWeightedPoints(BigDecimal lostWeightedPoints) { this.lostWeightedPoints = lostWeightedPoints; }

    public BigDecimal getDeductionPercentage() { return deductionPercentage; }
    public void setDeductionPercentage(BigDecimal deductionPercentage) { this.deductionPercentage = deductionPercentage; }

    public String getLossExplanation() { return lossExplanation; }
    public void setLossExplanation(String lossExplanation) { this.lossExplanation = lossExplanation; }

    public String getSuggestedIntervention() { return suggestedIntervention; }
    public void setSuggestedIntervention(String suggestedIntervention) { this.suggestedIntervention = suggestedIntervention; }
}
