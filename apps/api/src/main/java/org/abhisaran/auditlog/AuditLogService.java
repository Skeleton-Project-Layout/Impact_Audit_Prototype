package org.abhisaran.auditlog;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Records an audit log entry in a new transaction so it persists even if caller transaction rolls back.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(UUID actorId, String actorRole, String action, String objectType,
                    String objectId, String beforeState, String afterState,
                    String reason, String ipAddress) {
        AuditLog entry = new AuditLog(actorId, actorRole, action, objectType, objectId,
                beforeState, afterState, reason, ipAddress);
        auditLogRepository.save(entry);
    }
}
