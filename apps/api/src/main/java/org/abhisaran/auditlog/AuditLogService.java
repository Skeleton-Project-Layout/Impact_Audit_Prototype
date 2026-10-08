package org.abhisaran.auditlog;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final org.abhisaran.users.UserRepository userRepository;

    public AuditLogService(AuditLogRepository auditLogRepository, org.abhisaran.users.UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
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

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logUserAction(org.abhisaran.users.User user, String action, String objectType, String objectId, String reason, String ipAddress) {
        UUID actorId = user != null ? user.getId() : null;
        String actorRole = user != null ? user.getRole().name() : "ANONYMOUS";
        log(actorId, actorRole, action, objectType, objectId, null, null, reason, ipAddress != null ? ipAddress : "127.0.0.1");
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<org.abhisaran.auditlog.dto.AuditLogDTO> searchAuditLogs(
            String action, String actorRole, String objectType, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<AuditLog> page = auditLogRepository.searchAuditLogs(
                action != null && !action.isBlank() ? action : null,
                actorRole != null && !actorRole.isBlank() ? actorRole : null,
                objectType != null && !objectType.isBlank() ? objectType : null,
                pageable
        );

        return page.map(log -> {
            String username = null;
            if (log.getActorId() != null) {
                username = userRepository.findById(log.getActorId())
                        .map(org.abhisaran.users.User::getLoginId)
                        .orElse(null);
            }
            return new org.abhisaran.auditlog.dto.AuditLogDTO(
                    log.getId(),
                    log.getActorId(),
                    username,
                    log.getActorRole(),
                    log.getAction(),
                    log.getObjectType(),
                    log.getObjectId(),
                    log.getBeforeState(),
                    log.getAfterState(),
                    log.getReason(),
                    log.getIpAddress(),
                    log.getCreatedAt()
            );
        });
    }
}
