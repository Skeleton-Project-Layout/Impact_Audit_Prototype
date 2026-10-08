package org.abhisaran.scoring;

/**
 * Supported Rubric Types for deterministic scoring in Abhisaran ACS Platform.
 * Strictly maps stable option types and rules (Section 9.1).
 */
public enum RubricType {
    GRID_AFU,
    CHECKLIST_YNP,
    YESNO_WITH_COUNT,
    RATING_1_5,
    PERCENT_THRESHOLD,
    RATIO,
    NONE;

    public static RubricType fromString(String val) {
        if (val == null || val.isBlank()) {
            return NONE;
        }
        String clean = val.trim().toUpperCase();
        if (clean.startsWith("GRID_AFU")) return GRID_AFU;
        if (clean.startsWith("CHECKLIST_YNP")) return CHECKLIST_YNP;
        if (clean.startsWith("YESNO_WITH_COUNT")) return YESNO_WITH_COUNT;
        if (clean.startsWith("RATING_1_5")) return RATING_1_5;
        if (clean.startsWith("PERCENT_THRESHOLD")) return PERCENT_THRESHOLD;
        if (clean.startsWith("RATIO")) return RATIO;
        return NONE;
    }
}
