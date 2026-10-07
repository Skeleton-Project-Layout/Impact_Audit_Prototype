package org.abhisaran.facilities;

import org.abhisaran.geography.District;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
public class FacilityCodeGenerator {

    private static final Logger log = LoggerFactory.getLogger(FacilityCodeGenerator.class);

    private final FacilityCodeSequenceRepository sequenceRepository;

    public FacilityCodeGenerator(FacilityCodeSequenceRepository sequenceRepository) {
        this.sequenceRepository = sequenceRepository;
    }

    /**
     * Generates a non-recyclable, unique, monotonic facility code in format:
     * {STATE_CODE}-{DISTRICT_CODE}-{TYPE_PREFIX}-{SEQUENCE:04d}
     * e.g., JH-RCH-SCH-0001
     *
     * Uses pessimistic write locking on the sequence row to guarantee zero collisions
     * and strictly monotonic sequence ordering under high concurrency.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW, isolation = Isolation.READ_COMMITTED)
    public String generateNextCode(District district, PilotLocationType type) {
        if (district == null || district.getState() == null) {
            throw new IllegalArgumentException("District and State must not be null for code generation.");
        }
        if (type == null) {
            throw new IllegalArgumentException("PilotLocationType must not be null for code generation.");
        }

        FacilityCodeSequenceId seqId = new FacilityCodeSequenceId(district.getId(), type.getId());

        FacilityCodeSequence sequence = sequenceRepository.findByIdWithLock(seqId)
                .orElseGet(() -> {
                    FacilityCodeSequence newSeq = new FacilityCodeSequence(seqId, 1L);
                    return sequenceRepository.saveAndFlush(newSeq);
                });

        long allocatedNumber = sequence.getNextVal();
        sequence.setNextVal(allocatedNumber + 1);
        sequenceRepository.saveAndFlush(sequence);

        String stateCode = district.getState().getCode2().trim().toUpperCase();
        String districtCode = district.getCode3().trim().toUpperCase();
        String typePrefix = type.getPrefix().trim().toUpperCase();

        String generatedCode = String.format("%s-%s-%s-%04d", stateCode, districtCode, typePrefix, allocatedNumber);
        log.debug("Allocated facility code {} (Seq: {}) for district {} and type {}",
                generatedCode, allocatedNumber, districtCode, typePrefix);

        return generatedCode;
    }
}
