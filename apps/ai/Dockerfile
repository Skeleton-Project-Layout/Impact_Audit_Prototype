# Multi-stage production build for Abhisaran Python AI Microservice
FROM python:3.11-slim AS builder
WORKDIR /install

RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Runtime Image
FROM python:3.11-slim
WORKDIR /app

# Create unprivileged user
RUN useradd -m -u 10001 aiuser

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY app ./app

# Install curl for health monitoring
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

RUN chown -R aiuser:aiuser /app
USER aiuser

ENV PORT=8000
EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
