import os

AI_SERVICE_TOKEN = os.getenv("AI_SERVICE_TOKEN", "abhisaran-internal-ai-token-2026")
SERVICE_ID = "abhisaran-ai-kernel-v1"
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
