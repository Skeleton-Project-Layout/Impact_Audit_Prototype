package org.abhisaran.audit.pii;

public class PiiDetectedException extends RuntimeException {
    public PiiDetectedException(String message) {
        super(message);
    }
}
