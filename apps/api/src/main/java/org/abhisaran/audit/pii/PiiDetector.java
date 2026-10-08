package org.abhisaran.audit.pii;

import java.util.Collection;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Server-Side PII Guard enforcing Section 14.2 & Section 15.
 * Rejects text containing Aadhaar-like 12-digit numbers, 10-digit Indian mobile numbers,
 * or e-mail addresses.
 */
public final class PiiDetector {

    // 12-digit Aadhaar number: exactly 12 digits, contiguous or separated by spaces/hyphens
    private static final Pattern AADHAAR_PATTERN = Pattern.compile(
            "(?<!\\d)(?:[2-9]\\d{3}[\\s-]\\d{4}[\\s-]\\d{4}|\\d{12})(?!\\d)"
    );

    // 10-digit Indian mobile number: begins with 6-9, optional +91/91/0 prefix
    private static final Pattern PHONE_PATTERN = Pattern.compile(
            "(?<!\\d)(?:(?:\\+91|91|0)[\\s-]?)?[6-9]\\d{9}(?!\\d)"
    );

    // Standard RFC-compliant email address pattern
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
    );

    private PiiDetector() {
    }

    /**
     * Recursively inspects data structures (Strings, Maps, Collections) for prohibited PII.
     * Throws PiiDetectedException immediately upon first violation.
     */
    public static void validateNoPii(Object data) {
        if (data == null) {
            return;
        }

        if (data instanceof String str) {
            validateString(str);
        } else if (data instanceof Map<?, ?> map) {
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                if (entry.getValue() != null) {
                    validateNoPii(entry.getValue());
                }
            }
        } else if (data instanceof Collection<?> coll) {
            for (Object item : coll) {
                if (item != null) {
                    validateNoPii(item);
                }
            }
        }
    }

    public static void validateString(String text) {
        if (text == null || text.isBlank()) {
            return;
        }

        if (AADHAAR_PATTERN.matcher(text).find()) {
            throw new PiiDetectedException("Personal Identifiable Information (12-digit Aadhaar number) detected. Submission rejected.");
        }

        if (PHONE_PATTERN.matcher(text).find()) {
            throw new PiiDetectedException("Personal Identifiable Information (10-digit mobile number) detected. Submission rejected.");
        }

        if (EMAIL_PATTERN.matcher(text).find()) {
            throw new PiiDetectedException("Personal Identifiable Information (email address) detected. Submission rejected.");
        }
    }
}
