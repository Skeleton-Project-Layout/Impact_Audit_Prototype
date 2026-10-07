package org.abhisaran.facilities;

import org.abhisaran.geography.District;
import org.abhisaran.geography.DistrictRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
public class FacilityCodeGeneratorConcurrencyTest {

    @Autowired
    private FacilityCodeGenerator codeGenerator;

    @Autowired
    private DistrictRepository districtRepository;

    @Autowired
    private PilotLocationTypeRepository typeRepository;

    @Test
    @DisplayName("Facility code generator handles 100 concurrent requests with ZERO collisions and strictly monotonic sequence")
    void testHundredConcurrentCodeGenerationRequests() throws InterruptedException {
        District ranchi = districtRepository.findByCode3("RCH").orElseThrow();
        PilotLocationType schoolType = typeRepository.findByCode("SCHOOL").orElseThrow();

        int totalRequests = 100;
        int threadPoolSize = 25;
        ExecutorService executor = Executors.newFixedThreadPool(threadPoolSize);

        CountDownLatch readyLatch = new CountDownLatch(totalRequests);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(totalRequests);

        ConcurrentLinkedQueue<String> generatedCodes = new ConcurrentLinkedQueue<>();
        ConcurrentLinkedQueue<Throwable> exceptions = new ConcurrentLinkedQueue<>();

        for (int i = 0; i < totalRequests; i++) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    // Wait for all threads to be ready, then unleash simultaneously
                    startLatch.await();
                    String code = codeGenerator.generateNextCode(ranchi, schoolType);
                    generatedCodes.add(code);
                } catch (Throwable t) {
                    exceptions.add(t);
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        // Wait until all threads are queued and ready
        readyLatch.await(10, TimeUnit.SECONDS);

        // Fire all 100 concurrent requests simultaneously
        startLatch.countDown();

        // Wait for all 100 to complete
        boolean finishedInTime = finishLatch.await(45, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(finishedInTime).as("All 100 concurrent requests must complete within 45s").isTrue();
        assertThat(exceptions).as("Zero exceptions during concurrent code generation").isEmpty();
        assertThat(generatedCodes).hasSize(totalRequests);

        // 1. Verify Zero Collisions (Unique set size must be 100)
        Set<String> uniqueCodes = new HashSet<>(generatedCodes);
        assertThat(uniqueCodes)
                .as("All 100 codes must be unique with zero duplicate collisions")
                .hasSize(totalRequests);

        // 2. Verify Format and Monotonicity
        Pattern codePattern = Pattern.compile("^JH-RCH-SCH-(\\d{4})$");
        List<Integer> sequenceNumbers = new ArrayList<>();

        for (String code : generatedCodes) {
            Matcher matcher = codePattern.matcher(code);
            assertThat(matcher.matches()).as("Code must match format JH-RCH-SCH-0001: " + code).isTrue();
            sequenceNumbers.add(Integer.parseInt(matcher.group(1)));
        }

        Collections.sort(sequenceNumbers);

        // Verify strictly monotonic sequence numbers without gaps or overlaps
        for (int i = 0; i < sequenceNumbers.size() - 1; i++) {
            int current = sequenceNumbers.get(i);
            int next = sequenceNumbers.get(i + 1);
            assertThat(next)
                    .as("Sequence must be strictly monotonic: current " + current + ", next " + next)
                    .isEqualTo(current + 1);
        }

        System.out.println("Generated 100 concurrent unique codes: " +
                sequenceNumbers.get(0) + " -> " + sequenceNumbers.get(sequenceNumbers.size() - 1));
    }
}
