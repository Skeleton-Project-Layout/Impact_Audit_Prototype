package org.abhisaran.scoring;

import org.abhisaran.scoring.model.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * Pure Deterministic Scoring Engine.
 * 
 * Strict Architectural Rule (Section 2 Rule 4):
 * No Spring annotations, no Database, no Clock, no Random, and no Network calls.
 * Evaluates raw points, weighted deductions, spectrum bands, and red-flag logic
 * strictly based on stable option types and deterministic mathematical formulas.
 */
public final class ScoringEngine {

    private ScoringEngine() {
        // Pure utility class
    }

    public static int getWeightForSeverity(String severity) {
        if (severity == null) return 1;
        switch (severity.trim().toUpperCase()) {
            case "CRITICAL":
                return 3;
            case "HIGH":
                return 2;
            case "MEDIUM":
            default:
                return 1;
        }
    }

    public static RubricEvaluationResult evaluateQuestion(
            String questionId,
            String severity,
            Map<String, Object> rubricConfig,
            Map<String, Object> answerValue,
            String redFlagLogic,
            String suggestedIntervention
    ) {
        int weight = getWeightForSeverity(severity);
        return evaluateQuestion(questionId, severity, weight, rubricConfig, answerValue, redFlagLogic, suggestedIntervention);
    }

    @SuppressWarnings("unchecked")
    public static RubricEvaluationResult evaluateQuestion(
            String questionId,
            String severity,
            int severityWeight,
            Map<String, Object> rubricConfig,
            Map<String, Object> answerValue,
            String redFlagLogic,
            String suggestedIntervention
    ) {
        boolean isCritical = "CRITICAL".equalsIgnoreCase(severity);

        if (rubricConfig == null || rubricConfig.isEmpty()) {
            return RubricEvaluationResult.unscored(questionId, severityWeight, "No rubric configuration", suggestedIntervention);
        }

        String rawType = (String) rubricConfig.getOrDefault("type", "NONE");
        RubricType rubricType = RubricType.fromString(rawType);

        if (rubricType == RubricType.NONE) {
            return RubricEvaluationResult.unscored(questionId, severityWeight, "Informational question — not scored.", suggestedIntervention);
        }

        if (answerValue == null || answerValue.isEmpty()) {
            return RubricEvaluationResult.unassessed(questionId, severityWeight, "No answer provided", suggestedIntervention);
        }

        // Check if explicitly marked not assessed / NA
        Object naFlag = answerValue.get("is_na");
        if (Boolean.TRUE.equals(naFlag) || "true".equalsIgnoreCase(String.valueOf(naFlag))) {
            String reason = (String) answerValue.getOrDefault("na_reason", "Marked Not Applicable");
            return RubricEvaluationResult.unassessed(questionId, severityWeight, reason, suggestedIntervention);
        }

        Object notAssessedFlag = answerValue.get("is_not_assessed");
        if (Boolean.TRUE.equals(notAssessedFlag) || "true".equalsIgnoreCase(String.valueOf(notAssessedFlag))) {
            String reason = (String) answerValue.getOrDefault("not_assessed_reason", "Could not be assessed");
            return RubricEvaluationResult.unassessed(questionId, severityWeight, reason, suggestedIntervention);
        }

        double rawEarned = 0.0;
        double rawMax = 0.0;
        boolean redFlag = false;
        String redFlagReason = null;
        StringBuilder working = new StringBuilder();

        switch (rubricType) {
            case GRID_AFU: {
                boolean scoreUsed = Boolean.TRUE.equals(rubricConfig.get("score_used")) ||
                        "true".equalsIgnoreCase(String.valueOf(rubricConfig.get("score_used")));
                double ptsPerRow = scoreUsed ? 3.0 : 2.0;

                Object rowsObj = answerValue.get("rows");
                if (rowsObj instanceof List<?> rowList) {
                    for (Object r : rowList) {
                        if (r instanceof Map<?, ?> rowMap) {
                            Object nameObj = rowMap.get("name");
                            String name = nameObj != null ? String.valueOf(nameObj) : "Item";
                            boolean available = isTruthy(rowMap.get("available"));
                            boolean functional = isTruthy(rowMap.get("functional"));
                            boolean used = isTruthy(rowMap.get("used"));

                            rawMax += ptsPerRow;
                            double rowEarned = 0.0;
                            if (available) {
                                rowEarned += 1.0;
                                if (functional) {
                                    rowEarned += 1.0;
                                }
                                if (scoreUsed && used) {
                                    rowEarned += 1.0;
                                }
                            }
                            rawEarned += rowEarned;
                            working.append(name).append(": ")
                                    .append(available ? "Avail(1)" : "Avail(0)").append(" ")
                                    .append(functional ? "Func(1)" : "Func(0)");
                            if (scoreUsed) {
                                working.append(" ").append(used ? "Used(1)" : "Used(0)");
                            }
                            working.append(" = ").append((int) rowEarned).append("/").append((int) ptsPerRow).append("; ");

                            if (!available || !functional) {
                                redFlag = true;
                                if (redFlagReason == null) {
                                    redFlagReason = (redFlagLogic != null && !redFlagLogic.isBlank())
                                            ? redFlagLogic
                                            : "Facility " + name + " is not fully functional or absent.";
                                }
                            }
                        }
                    }
                } else if (rowsObj instanceof Map<?, ?> rowMapContainer) {
                    for (Map.Entry<?, ?> entry : rowMapContainer.entrySet()) {
                        String name = String.valueOf(entry.getKey());
                        if (entry.getValue() instanceof Map<?, ?> rowMap) {
                            boolean available = isTruthy(rowMap.get("available"));
                            boolean functional = isTruthy(rowMap.get("functional"));
                            boolean used = isTruthy(rowMap.get("used"));

                            rawMax += ptsPerRow;
                            double rowEarned = 0.0;
                            if (available) {
                                rowEarned += 1.0;
                                if (functional) {
                                    rowEarned += 1.0;
                                }
                                if (scoreUsed && used) {
                                    rowEarned += 1.0;
                                }
                            }
                            rawEarned += rowEarned;
                            working.append(name).append("=").append((int) rowEarned).append("/").append((int) ptsPerRow).append("; ");

                            if (!available || !functional) {
                                redFlag = true;
                                if (redFlagReason == null) {
                                    redFlagReason = (redFlagLogic != null && !redFlagLogic.isBlank())
                                            ? redFlagLogic
                                            : "Facility " + name + " is not fully functional or absent.";
                                }
                            }
                        }
                    }
                }

                if (rawMax == 0.0) {
                    Object cfgRows = rubricConfig.get("rows");
                    if (cfgRows instanceof List<?> cfgList) {
                        rawMax = cfgList.size() * ptsPerRow;
                    } else {
                        rawMax = 10.0;
                    }
                }

                double configuredMax = parseDouble(rubricConfig.get("max_points"), parseDouble(rubricConfig.get("max_pts"), 0.0));
                if (configuredMax > 0.0) {
                    if (rawMax > 0.0) {
                        rawEarned = (rawEarned / rawMax) * configuredMax;
                    }
                    rawMax = configuredMax;
                }
                break;
            }

            case CHECKLIST_YNP: {
                Object itemsObj = answerValue.get("items");
                int itemCount = 0;
                int naCount = 0;

                if (itemsObj instanceof List<?> itemList) {
                    for (Object itm : itemList) {
                        itemCount++;
                        String status = "NO";
                        String name = "Item " + itemCount;
                        if (itm instanceof Map<?, ?> itmMap) {
                            Object itemObj = itmMap.get("item");
                            if (itemObj != null) name = String.valueOf(itemObj);
                            Object statusObj = itmMap.get("status");
                            status = statusObj != null ? String.valueOf(statusObj).toUpperCase() : "NO";
                        } else if (itm instanceof String itmStr) {
                            status = itmStr.toUpperCase();
                        }

                        if ("NA".equals(status) || "N/A".equals(status)) {
                            naCount++;
                            working.append(name).append(": N/A (excluded); ");
                            continue;
                        }

                        rawMax += 1.0;
                        if ("YES".equals(status)) {
                            rawEarned += 1.0;
                            working.append(name).append(": YES (1.0); ");
                        } else if ("PARTIAL".equals(status)) {
                            rawEarned += 0.5;
                            working.append(name).append(": PARTIAL (0.5); ");
                            redFlag = true;
                            if (redFlagReason == null) {
                                redFlagReason = (redFlagLogic != null && !redFlagLogic.isBlank()) ? redFlagLogic : name + " partially met";
                            }
                        } else {
                            working.append(name).append(": NO (0.0); ");
                            redFlag = true;
                            if (redFlagReason == null) {
                                redFlagReason = (redFlagLogic != null && !redFlagLogic.isBlank()) ? redFlagLogic : name + " absent or not compliant";
                            }
                        }
                    }
                } else if (itemsObj instanceof Map<?, ?> itmMapContainer) {
                    for (Map.Entry<?, ?> entry : itmMapContainer.entrySet()) {
                        itemCount++;
                        String name = String.valueOf(entry.getKey());
                        String status = String.valueOf(entry.getValue()).toUpperCase();

                        if ("NA".equals(status) || "N/A".equals(status)) {
                            naCount++;
                            working.append(name).append(": N/A (excluded); ");
                            continue;
                        }

                        rawMax += 1.0;
                        if ("YES".equals(status)) {
                            rawEarned += 1.0;
                            working.append(name).append(": YES (1.0); ");
                        } else if ("PARTIAL".equals(status)) {
                            rawEarned += 0.5;
                            working.append(name).append(": PARTIAL (0.5); ");
                            redFlag = true;
                            if (redFlagReason == null) {
                                redFlagReason = (redFlagLogic != null && !redFlagLogic.isBlank()) ? redFlagLogic : name + " partially met";
                            }
                        } else {
                            working.append(name).append(": NO (0.0); ");
                            redFlag = true;
                            if (redFlagReason == null) {
                                redFlagReason = (redFlagLogic != null && !redFlagLogic.isBlank()) ? redFlagLogic : name + " absent or not compliant";
                            }
                        }
                    }
                }

                if (rawMax == 0.0) {
                    if (itemCount > 0 && itemCount == naCount) {
                        return RubricEvaluationResult.unassessed(questionId, severityWeight, "All checklist items marked Not Applicable", suggestedIntervention);
                    }
                    rawMax = 4.0;
                }

                double configuredMax = parseDouble(rubricConfig.get("max_points"), parseDouble(rubricConfig.get("max_pts"), 0.0));
                if (configuredMax > 0.0) {
                    if (rawMax > 0.0) {
                        rawEarned = (rawEarned / rawMax) * configuredMax;
                    }
                    rawMax = configuredMax;
                }
                break;
            }

            case YESNO_WITH_COUNT: {
                double configuredMax = parseDouble(rubricConfig.get("max_points"), parseDouble(rubricConfig.get("max_pts"), 10.0));
                rawMax = configuredMax;
                boolean available = isTruthy(answerValue.get("available")) || isTruthy(answerValue.get("response"));
                double count = parseDouble(answerValue.getOrDefault("count", answerValue.get("students_supported")), 0.0);

                if (!available) {
                    rawEarned = 0.0;
                    redFlag = true;
                    redFlagReason = (redFlagLogic != null && !redFlagLogic.isBlank()) ? redFlagLogic : "Service not available";
                    working.append("Available: NO -> 0/").append(rawMax).append(" pts. Red flag triggered.");
                } else {
                    if (count > 0) {
                        rawEarned = rawMax;
                        working.append("Available: YES, Uptake: ").append((int) count).append(" supported -> ").append(rawMax).append("/").append(rawMax).append(" pts.");
                    } else {
                        rawEarned = rawMax * 0.5;
                        redFlag = true;
                        redFlagReason = "Service available but zero uptake recorded.";
                        working.append("Available: YES, Uptake: 0 -> ").append(rawEarned).append("/").append(rawMax).append(" pts (50% uptake penalty). Red flag triggered.");
                    }
                }
                break;
            }

            case RATING_1_5: {
                double configuredMax = parseDouble(rubricConfig.get("max_points"), parseDouble(rubricConfig.get("max_pts"), 10.0));
                rawMax = configuredMax;
                double rating = parseDouble(answerValue.getOrDefault("rating", answerValue.get("value")), 1.0);
                if (rating < 1.0) rating = 1.0;
                if (rating > 5.0) rating = 5.0;

                rawEarned = ((rating - 1.0) / 4.0) * rawMax;
                working.append("Rating ").append(rating).append("/5 -> (").append(rating).append(" - 1)/4 * ").append(rawMax).append(" = ")
                        .append(String.format("%.2f", rawEarned)).append("/").append(rawMax).append(" pts.");

                if (rating <= 2.0) {
                    redFlag = true;
                    redFlagReason = (redFlagLogic != null && !redFlagLogic.isBlank())
                            ? redFlagLogic
                            : "Observation score " + rating + " is at or below critical threshold (<= 2).";
                }
                break;
            }

            case PERCENT_THRESHOLD: {
                double configuredMax = parseDouble(rubricConfig.get("max_points"), parseDouble(rubricConfig.get("max_pts"), 10.0));
                rawMax = configuredMax;
                double threshold = parseDouble(rubricConfig.get("threshold"), 75.0);
                double partialMargin = parseDouble(rubricConfig.get("partial_margin"), 10.0);
                boolean inverted = Boolean.TRUE.equals(rubricConfig.get("inverted")) ||
                        "true".equalsIgnoreCase(String.valueOf(rubricConfig.get("inverted")));

                double pctVal = parseDouble(
                        answerValue.getOrDefault("percentage",
                                answerValue.getOrDefault("attendance_pct",
                                        answerValue.getOrDefault("fln_proficient_pct",
                                                answerValue.getOrDefault("mismatch_pct", answerValue.get("value"))))),
                        0.0
                );

                if (!inverted) {
                    if (pctVal >= threshold) {
                        rawEarned = rawMax;
                        working.append("Observed ").append(pctVal).append("% >= benchmark ").append(threshold).append("% -> Full points (").append(rawMax).append("/").append(rawMax).append(").");
                    } else if (pctVal >= (threshold - partialMargin)) {
                        rawEarned = 0.5 * rawMax;
                        redFlag = true;
                        redFlagReason = (redFlagLogic != null && !redFlagLogic.isBlank()) ? redFlagLogic : pctVal + "% is below benchmark " + threshold + "%";
                        working.append("Observed ").append(pctVal).append("% within partial margin [").append(threshold - partialMargin).append("%, ").append(threshold).append("%) -> Partial points (").append(rawEarned).append("/").append(rawMax).append(").");
                    } else {
                        rawEarned = 0.0;
                        redFlag = true;
                        redFlagReason = (redFlagLogic != null && !redFlagLogic.isBlank()) ? redFlagLogic : pctVal + "% is critically below benchmark " + threshold + "%";
                        working.append("Observed ").append(pctVal).append("% < ").append(threshold - partialMargin).append("% -> 0/").append(rawMax).append(" pts.");
                    }
                } else {
                    if (pctVal <= threshold) {
                        rawEarned = rawMax;
                        working.append("Observed mismatch ").append(pctVal).append("% <= allowable ").append(threshold).append("% -> Full points (").append(rawMax).append("/").append(rawMax).append(").");
                    } else if (pctVal <= (threshold + partialMargin)) {
                        rawEarned = 0.5 * rawMax;
                        redFlag = true;
                        redFlagReason = (redFlagLogic != null && !redFlagLogic.isBlank()) ? redFlagLogic : "Mismatch " + pctVal + "% exceeds allowable " + threshold + "%";
                        working.append("Observed mismatch ").append(pctVal).append("% within partial margin (").append(threshold).append("%, ").append(threshold + partialMargin).append("%] -> Partial points (").append(rawEarned).append("/").append(rawMax).append(").");
                    } else {
                        rawEarned = 0.0;
                        redFlag = true;
                        redFlagReason = (redFlagLogic != null && !redFlagLogic.isBlank()) ? redFlagLogic : "Severe mismatch " + pctVal + "% > " + (threshold + partialMargin) + "%";
                        working.append("Observed mismatch ").append(pctVal).append("% > ").append(threshold + partialMargin).append("% -> 0/").append(rawMax).append(" pts.");
                    }
                }
                break;
            }

            case RATIO: {
                double configuredMax = parseDouble(rubricConfig.get("max_points"), parseDouble(rubricConfig.get("max_pts"), 10.0));
                rawMax = configuredMax;
                String numField = (String) rubricConfig.getOrDefault("numerator_field", "working");
                String denField = (String) rubricConfig.getOrDefault("denominator_field", "sanctioned");

                double numerator = parseDouble(answerValue.getOrDefault(numField, answerValue.get("numerator")), -1.0);
                double denominator = parseDouble(answerValue.getOrDefault(denField, answerValue.get("denominator")), -1.0);

                if (denominator < 0.0) {
                    denominator = parseDouble(answerValue.get("registered"), parseDouble(answerValue.get("identified"), 0.0));
                }
                if (numerator < 0.0) {
                    numerator = parseDouble(answerValue.get("receiving"), parseDouble(answerValue.get("followed_up"), 0.0));
                }

                if (denominator <= 0.0) {
                    return RubricEvaluationResult.unassessed(
                            questionId,
                            severityWeight,
                            "Denominator is zero or missing (" + denField + "=0)",
                            suggestedIntervention
                    );
                }

                if (numerator < 0.0) numerator = 0.0;
                if (numerator > denominator) numerator = denominator;

                double ratio = numerator / denominator;
                rawEarned = rawMax * ratio;
                working.append("Ratio: ").append((int) numerator).append("/").append((int) denominator)
                        .append(" = ").append(String.format("%.2f", ratio * 100)).append("% -> ")
                        .append(String.format("%.2f", rawEarned)).append("/").append(rawMax).append(" pts.");

                if (ratio < 1.0) {
                    redFlag = true;
                    redFlagReason = (redFlagLogic != null && !redFlagLogic.isBlank())
                            ? redFlagLogic
                            : "Deficit identified: " + (int) (denominator - numerator) + " gap.";
                }
                break;
            }

            default:
                return RubricEvaluationResult.unscored(questionId, severityWeight, "Unrecognized rubric type", suggestedIntervention);
        }

        double earnedWeighted = rawEarned * severityWeight;
        double maxWeighted = rawMax * severityWeight;
        double pointsLost = maxWeighted - earnedWeighted;
        double percentage = rawMax > 0.0 ? (rawEarned / rawMax) * 100.0 : 0.0;

        AlertBandType alertBand = AlertBandType.fromPercentage(percentage, isCritical);

        return new RubricEvaluationResult(
                rawEarned,
                rawMax,
                severityWeight,
                earnedWeighted,
                maxWeighted,
                pointsLost,
                percentage,
                alertBand,
                redFlag,
                redFlagReason,
                suggestedIntervention,
                working.toString(),
                true,
                null
        );
    }

    /**
     * Pure Deterministic Multi-Page Location Audit Evaluator.
     * Evaluates pooled ACS score, Deduction Ledger, Section Breakdowns,
     * and strictly asserts mathematical balance: sum(ledger deductions) == 100.00 - ACS.
     */
    public static LocationScoreResult evaluateLocationAudit(LocationAssessmentInput input) {
        if (input == null || input.getQuestions() == null || input.getQuestions().isEmpty()) {
            return new LocationScoreResult(
                    input != null ? input.getLocationId() : null,
                    input != null ? input.getSubmissionId() : null,
                    null,
                    null,
                    true,
                    0.0,
                    0,
                    0,
                    0.0,
                    0.0,
                    0.0,
                    0,
                    Collections.emptyList(),
                    Collections.emptyList(),
                    Collections.emptyMap(),
                    0.0,
                    0.0,
                    true
            );
        }

        List<EvaluatedQuestionItem> evaluatedItems = new ArrayList<>();
        int totalApplicableQuestions = 0;
        int totalAssessedQuestions = 0;
        double totalMaxWeighted = 0.0;
        double totalEarnedWeighted = 0.0;
        int triggeredRedFlagsCount = 0;

        for (QuestionAssessmentInput q : input.getQuestions()) {
            int weight = q.getWeightOverride() != null && q.getWeightOverride() > 0
                    ? q.getWeightOverride()
                    : getWeightForSeverity(q.getSeverity());

            boolean isNa = q.isNa() || (q.getAnswerValue() != null && isTruthy(q.getAnswerValue().get("is_na")));
            boolean isNotAssessed = q.isNotAssessed() || (q.getAnswerValue() != null && isTruthy(q.getAnswerValue().get("is_not_assessed")));

            Map<String, Object> rubricConfig = q.getRubricConfig();
            boolean isScored = rubricConfig != null && !rubricConfig.isEmpty() &&
                    RubricType.fromString((String) rubricConfig.getOrDefault("type", "NONE")) != RubricType.NONE;

            if (!isScored) {
                evaluatedItems.add(new EvaluatedQuestionItem(
                        q.getPageId(),
                        q.getPageNumber(),
                        q.getQuestionId(),
                        q.getQuestionVersionId(),
                        q.getQuestionText(),
                        q.getSection(),
                        q.getSeverity() != null ? q.getSeverity() : "MEDIUM",
                        weight,
                        0.0,
                        0.0,
                        0.0,
                        0.0,
                        0.0,
                        0.0,
                        isNa,
                        isNotAssessed,
                        false,
                        false,
                        false,
                        null,
                        null,
                        q.getSuggestedIntervention(),
                        "Informational question — not scored."
                ));
                continue;
            }

            if (isNa) {
                evaluatedItems.add(new EvaluatedQuestionItem(
                        q.getPageId(),
                        q.getPageNumber(),
                        q.getQuestionId(),
                        q.getQuestionVersionId(),
                        q.getQuestionText(),
                        q.getSection(),
                        q.getSeverity() != null ? q.getSeverity() : "MEDIUM",
                        weight,
                        0.0,
                        0.0,
                        0.0,
                        0.0,
                        0.0,
                        0.0,
                        true,
                        false,
                        true,
                        false,
                        false,
                        null,
                        null,
                        q.getSuggestedIntervention(),
                        q.getNaReason() != null ? q.getNaReason() : "Marked Not Applicable"
                ));
                continue;
            }

            totalApplicableQuestions++;

            if (isNotAssessed || q.getAnswerValue() == null || q.getAnswerValue().isEmpty()) {
                evaluatedItems.add(new EvaluatedQuestionItem(
                        q.getPageId(),
                        q.getPageNumber(),
                        q.getQuestionId(),
                        q.getQuestionVersionId(),
                        q.getQuestionText(),
                        q.getSection(),
                        q.getSeverity() != null ? q.getSeverity() : "MEDIUM",
                        weight,
                        0.0,
                        0.0,
                        0.0,
                        0.0,
                        0.0,
                        0.0,
                        false,
                        true,
                        true,
                        false,
                        false,
                        null,
                        null,
                        q.getSuggestedIntervention(),
                        q.getNotAssessedReason() != null ? q.getNotAssessedReason() : "Could not be assessed"
                ));
                continue;
            }

            RubricEvaluationResult result = evaluateQuestion(
                    q.getQuestionId(),
                    q.getSeverity(),
                    weight,
                    q.getRubricConfig(),
                    q.getAnswerValue(),
                    q.getRedFlagLogic(),
                    q.getSuggestedIntervention()
            );

            if (!result.isAssessed()) {
                evaluatedItems.add(new EvaluatedQuestionItem(
                        q.getPageId(),
                        q.getPageNumber(),
                        q.getQuestionId(),
                        q.getQuestionVersionId(),
                        q.getQuestionText(),
                        q.getSection(),
                        q.getSeverity() != null ? q.getSeverity() : "MEDIUM",
                        weight,
                        0.0,
                        0.0,
                        0.0,
                        0.0,
                        0.0,
                        0.0,
                        false,
                        true,
                        true,
                        false,
                        false,
                        null,
                        null,
                        q.getSuggestedIntervention(),
                        result.getRuleWorkingText()
                ));
                continue;
            }

            totalAssessedQuestions++;
            totalMaxWeighted += result.getMaxWeighted();
            totalEarnedWeighted += result.getEarnedWeighted();

            boolean isCritical = "CRITICAL".equalsIgnoreCase(q.getSeverity());
            boolean clampedRed = isCritical && result.getRawMax() > 0.0 && (result.getRawEarned() / result.getRawMax()) < 0.50;
            boolean isRedFlag = result.isRedFlagTriggered() || clampedRed;
            if (isRedFlag) {
                triggeredRedFlagsCount++;
            }

            AlertBandType itemBand = result.getAlertBand();
            if (clampedRed) {
                itemBand = AlertBandType.RED;
            }

            evaluatedItems.add(new EvaluatedQuestionItem(
                    q.getPageId(),
                    q.getPageNumber(),
                    q.getQuestionId(),
                    q.getQuestionVersionId(),
                    q.getQuestionText(),
                    q.getSection(),
                    q.getSeverity() != null ? q.getSeverity() : "MEDIUM",
                    weight,
                    result.getRawEarned(),
                    result.getRawMax(),
                    result.getEarnedWeighted(),
                    result.getMaxWeighted(),
                    result.getPointsLost(),
                    0.0,
                    false,
                    false,
                    true,
                    isRedFlag,
                    clampedRed,
                    itemBand,
                    result.getRedFlagReason() != null ? result.getRedFlagReason() : (clampedRed ? "Critical severity question earned < 50% points." : null),
                    q.getSuggestedIntervention() != null ? q.getSuggestedIntervention() : result.getSuggestedIntervention(),
                    result.getRuleWorkingText()
            ));
        }

        double totalDeductionsWeighted = totalMaxWeighted - totalEarnedWeighted;
        double coveragePct = totalApplicableQuestions > 0
                ? round2((totalAssessedQuestions * 100.0) / totalApplicableQuestions)
                : 0.0;
        boolean isProvisional = coveragePct < 70.0;

        Double acsScore = null;
        AlertBandType alertBand = null;

        if (totalMaxWeighted > 0.0 && totalAssessedQuestions > 0) {
            double rawAcs = (totalEarnedWeighted / totalMaxWeighted) * 100.0;
            acsScore = round2(rawAcs);
            alertBand = AlertBandType.fromPercentage(acsScore, false);
        }

        List<DeductionLedgerItem> deductionLedger = new ArrayList<>();
        double ledgerSum = 0.0;

        if (acsScore != null && totalMaxWeighted > 0.0) {
            for (EvaluatedQuestionItem item : evaluatedItems) {
                if (item.isScored() && !item.isNa() && !item.isNotAssessed() && item.getWeightedLost() > 0.0001) {
                    double rawContrib = (item.getWeightedLost() / totalMaxWeighted) * 100.0;
                    double contrib = round2(rawContrib);
                    item.setLossContribution(contrib);

                    String explanation = item.getRedFlagReason();
                    if (explanation == null || explanation.isBlank()) {
                        explanation = item.getWorkingNotes();
                    }
                    if (explanation == null || explanation.isBlank()) {
                        explanation = String.format("Lost %.2f weighted points (earned %.2f / %.2f)",
                                item.getWeightedLost(), item.getRawEarned(), item.getRawMax());
                    }

                    deductionLedger.add(new DeductionLedgerItem(
                            item.getQuestionId(),
                            item.getPageNumber(),
                            item.getQuestionText() != null ? item.getQuestionText() : item.getQuestionId(),
                            item.getSeverity(),
                            item.getWeight(),
                            round2(item.getWeightedLost()),
                            contrib,
                            explanation,
                            item.getSuggestedIntervention()
                    ));
                }
            }

            deductionLedger.sort((a, b) -> Double.compare(b.getLostWeightedPoints(), a.getLostWeightedPoints()));

            double targetDeduction = round2(100.00 - acsScore);
            double currentSum = 0.0;
            for (DeductionLedgerItem di : deductionLedger) {
                currentSum += di.getDeductionPercentage();
            }
            currentSum = round2(currentSum);

            double diff = round2(targetDeduction - currentSum);
            if (Math.abs(diff) > 0.0001 && !deductionLedger.isEmpty()) {
                DeductionLedgerItem topItem = deductionLedger.get(0);
                topItem.setDeductionPercentage(round2(topItem.getDeductionPercentage() + diff));
                for (EvaluatedQuestionItem itm : evaluatedItems) {
                    if (itm.getQuestionId().equals(topItem.getQuestionId()) && itm.getPageNumber() == topItem.getPageNumber()) {
                        itm.setLossContribution(topItem.getDeductionPercentage());
                        break;
                    }
                }
            }

            ledgerSum = 0.0;
            for (DeductionLedgerItem di : deductionLedger) {
                ledgerSum += di.getDeductionPercentage();
            }
            ledgerSum = round2(ledgerSum);
        }

        Map<String, SectionScoreSummary> sectionScores = new LinkedHashMap<>();
        Map<String, double[]> sectionAccumulators = new LinkedHashMap<>();

        for (EvaluatedQuestionItem itm : evaluatedItems) {
            if (itm.isScored() && !itm.isNa() && !itm.isNotAssessed()) {
                String sec = itm.getSection() != null && !itm.getSection().isBlank() ? itm.getSection().trim().toUpperCase() : "GENERAL";
                double[] acc = sectionAccumulators.computeIfAbsent(sec, k -> new double[3]);
                acc[0] += itm.getWeightedEarned();
                acc[1] += itm.getWeightedMax();
                acc[2] += 1.0;
            }
        }

        for (Map.Entry<String, double[]> entry : sectionAccumulators.entrySet()) {
            String sec = entry.getKey();
            double earnedW = round2(entry.getValue()[0]);
            double maxW = round2(entry.getValue()[1]);
            int count = (int) entry.getValue()[2];
            double pct = maxW > 0.0 ? round2((earnedW / maxW) * 100.0) : 0.0;
            AlertBandType band = AlertBandType.fromPercentage(pct, false);
            sectionScores.put(sec, new SectionScoreSummary(sec, earnedW, maxW, pct, band, count));
        }

        double ledgerBalanceDiff = acsScore != null ? Math.abs(ledgerSum - round2(100.00 - acsScore)) : 0.0;
        boolean isLedgerBalanced = ledgerBalanceDiff < 0.001;

        return new LocationScoreResult(
                input.getLocationId(),
                input.getSubmissionId(),
                acsScore,
                alertBand,
                isProvisional,
                coveragePct,
                totalApplicableQuestions,
                totalAssessedQuestions,
                round2(totalMaxWeighted),
                round2(totalEarnedWeighted),
                round2(totalDeductionsWeighted),
                triggeredRedFlagsCount,
                evaluatedItems,
                deductionLedger,
                sectionScores,
                ledgerSum,
                ledgerBalanceDiff,
                isLedgerBalanced
        );
    }

    private static double round2(double val) {
        if (Double.isNaN(val) || Double.isInfinite(val)) return 0.0;
        return BigDecimal.valueOf(val).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private static boolean isTruthy(Object val) {
        if (val == null) return false;
        if (val instanceof Boolean b) return b;
        String s = String.valueOf(val).trim().toUpperCase();
        return "TRUE".equals(s) || "YES".equals(s) || "1".equals(s) || "Y".equals(s);
    }

    private static double parseDouble(Object val, double fallback) {
        if (val == null) return fallback;
        if (val instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(String.valueOf(val).trim());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }
}
