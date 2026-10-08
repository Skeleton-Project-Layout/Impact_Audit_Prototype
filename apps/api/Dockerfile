# Multi-stage production build for Abhisaran Spring Boot API
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# Cache Maven dependencies
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -B || true

# Build application artifact
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# Runtime Image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Non-root user for security
RUN addgroup -S abhisaran && adduser -S abhisaran -G abhisaran

# Minimal tools for container healthcheck
RUN apk add --no-cache curl

COPY --from=builder /workspace/target/abhisaran-api-1.0.0.jar app.jar

RUN chown -R abhisaran:abhisaran /app
USER abhisaran

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT}/actuator/health || exit 1

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
