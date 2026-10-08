package org.abhisaran.scoring;

import java.util.List;
import java.util.Map;

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
                    // Fallback using config rows if answer didn't contain explicit list structure
                    Object cfgRows = rubricConfig.get("rows");
                    if (cfgRows instanceof List<?> cfgList) {
                        rawMax = cfgList.size() * ptsPerRow;
                    } else {
                        rawMax = 10.0;
                    }
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
                            // NO
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
                    rawMax = 4.0; // standard default
                }
                break;
            }

            case YESNO_WITH_COUNT: {
                rawMax = 10.0;
                boolean available = isTruthy(answerValue.get("available")) || isTruthy(answerValue.get("response"));
                double count = parseDouble(answerValue.getOrDefault("count", answerValue.get("students_supported")), 0.0);

                if (!available) {
                    rawEarned = 0.0;
                    redFlag = true;
                    redFlagReason = (redFlagLogic != null && !redFlagLogic.isBlank()) ? redFlagLogic : "Service not available";
                    working.append("Available: NO -> 0/10 pts. Red flag triggered.");
                } else {
                    if (count > 0) {
                        rawEarned = 10.0;
                        working.append("Available: YES, Uptake: ").append((int) count).append(" supported -> 10/10 pts.");
                    } else {
                        // Yes-but-zero-uptake (Section 9.1: 50% points)
                        rawEarned = 5.0;
                        redFlag = true;
                        redFlagReason = "Service available but zero uptake recorded.";
                        working.append("Available: YES, Uptake: 0 -> 5/10 pts (50% uptake penalty). Red flag triggered.");
                    }
                }
                break;
            }

            case RATING_1_5: {
                rawMax = 10.0;
                double rating = parseDouble(answerValue.getOrDefault("rating", answerValue.get("value")), 1.0);
                if (rating < 1.0) rating = 1.0;
                if (rating > 5.0) rating = 5.0;

                // Section 9.1 formula: earned = (rating - 1) / 4 * max
                rawEarned = ((rating - 1.0) / 4.0) * rawMax;
                working.append("Rating ").append(rating).append("/5 -> (").append(rating).append(" - 1)/4 * 10 = ")
                        .append(String.format("%.2f", rawEarned)).append("/10 pts.");

                // Section 9.1: rating <= 2 triggers red flag
                if (rating <= 2.0) {
                    redFlag = true;
                    redFlagReason = (redFlagLogic != null && !redFlagLogic.isBlank())
                            ? redFlagLogic
                            : "Observation score " + rating + " is at or below critical threshold (<= 2).";
                }
                break;
            }

            case PERCENT_THRESHOLD: {
                rawMax = 10.0;
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
                    // Regular threshold (e.g. attendance >= 75%)
                    if (pctVal >= threshold) {
                        rawEarned = rawMax;
                        working.append("Observed ").append(pctVal).append("% >= benchmark ").append(threshold).append("% -> Full points (10/10).");
                    } else if (pctVal >= (threshold - partialMargin)) {
                        rawEarned = 0.5 * rawMax;
                        redFlag = true;
                        redFlagReason = (redFlagLogic != null && !redFlagLogic.isBlank()) ? redFlagLogic : pctVal + "% is below benchmark " + threshold + "%";
                        working.append("Observed ").append(pctVal).append("% within partial margin [").append(threshold - partialMargin).append("%, ").append(threshold).append("%) -> Partial points (5/10).");
                    } else {
                        rawEarned = 0.0;
                        redFlag = true;
                        redFlagReason = (redFlagLogic != null && !redFlagLogic.isBlank()) ? redFlagLogic : pctVal + "% is critically below benchmark " + threshold + "%";
                        working.append("Observed ").append(pctVal).append("% < ").append(threshold - partialMargin).append("% -> 0/10 pts.");
                    }
                } else {
                    // Inverted polarity (e.g. mismatch <= 10%)
                    if (pctVal <= threshold) {
                        rawEarned = rawMax;
                        working.append("Observed mismatch ").append(pctVal).append("% <= allowable ").append(threshold).append("% -> Full points (10/10).");
                    } else if (pctVal <= (threshold + partialMargin)) {
                        rawEarned = 0.5 * rawMax;
                        redFlag = true;
                        redFlagReason = (redFlagLogic != null && !redFlagLogic.isBlank()) ? redFlagLogic : "Mismatch " + pctVal + "% exceeds allowable " + threshold + "%";
                        working.append("Observed mismatch ").append(pctVal).append("% within partial margin (").append(threshold).append("%, ").append(threshold + partialMargin).append("%] -> Partial points (5/10).");
                    } else {
                        rawEarned = 0.0;
                        redFlag = true;
                        redFlagReason = (redFlagLogic != null && !redFlagLogic.isBlank()) ? redFlagLogic : "Severe mismatch " + pctVal + "% > " + (threshold + partialMargin) + "%";
                        working.append("Observed mismatch ").append(pctVal).append("% > ").append(threshold + partialMargin).append("% -> 0/10 pts.");
                    }
                }
                break;
            }

            case RATIO: {
                rawMax = 10.0;
                String numField = (String) rubricConfig.getOrDefault("numerator_field", "working");
                String denField = (String) rubricConfig.getOrDefault("denominator_field", "sanctioned");

                double numerator = parseDouble(answerValue.getOrDefault(numField, answerValue.get("numerator")), -1.0);
                double denominator = parseDouble(answerValue.getOrDefault(denField, answerValue.get("denominator")), -1.0);

                if (denominator < 0.0) {
                    // Try alternative standard fields
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
                if (numerator > denominator) numerator = denominator; // Clamp to 1.0 ratio max

                double ratio = numerator / denominator;
                rawEarned = rawMax * ratio;
                working.append("Ratio: ").append((int) numerator).append("/").append((int) denominator)
                        .append(" = ").append(String.format("%.2f", ratio * 100)).append("% -> ")
                        .append(String.format("%.2f", rawEarned)).append("/10 pts.");

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
