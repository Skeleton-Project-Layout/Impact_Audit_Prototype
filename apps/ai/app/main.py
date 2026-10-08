from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.config import AI_SERVICE_TOKEN, SERVICE_ID
from app.models import (
    PiiScreenRequest, PiiScreenResponse,
    ExtractTextRequest, ExtractTextResponse,
    SummariseRunRequest, SummariseRunResponse,
    GroupObservationsRequest, GroupObservationsResponse,
    ClassifyReportRequest, ClassifyReportResponse
)
from app.services.pii_scrubber import screen_and_mask_pii
from app.services.ocr_extractor import extract_text_from_evidence
from app.services.narrative_summarizer import generate_run_narrative
from app.services.observation_grouper import group_observations_by_theme
from app.services.smart_classifier import classify_pilot_audit


app = FastAPI(
    title="Abhisaran Assistive AI Service",
    description="Stateless, secondary AI microservice providing PII masking, OCR transcription, and deduction ledger summaries. ZERO database access by architectural contract.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_token(x_ai_service_token: str = Header(None, alias="X-AI-Service-Token")):
    if not x_ai_service_token or x_ai_service_token != AI_SERVICE_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-AI-Service-Token header."
        )


@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service_id": SERVICE_ID,
        "database_connected": False,
        "isolation_verified": True
    }


@app.post("/v1/pii-screen", response_model=PiiScreenResponse)
def pii_screen(req: PiiScreenRequest, x_ai_service_token: str = Header(None, alias="X-AI-Service-Token")):
    verify_token(x_ai_service_token)
    has_pii, types, masked = screen_and_mask_pii(req.text)
    return PiiScreenResponse(
        contains_pii=has_pii,
        detected_types=types,
        masked_text=masked
    )


@app.post("/v1/extract-text", response_model=ExtractTextResponse)
def extract_text(req: ExtractTextRequest, x_ai_service_token: str = Header(None, alias="X-AI-Service-Token")):
    verify_token(x_ai_service_token)
    text, conf, blocks = extract_text_from_evidence(req.evidence_id, req.file_name, req.content_base64)
    return ExtractTextResponse(
        evidence_id=req.evidence_id,
        extracted_text=text,
        confidence=conf,
        blocks_count=blocks
    )


@app.post("/v1/summarise-run", response_model=SummariseRunResponse)
def summarise_run(req: SummariseRunRequest, x_ai_service_token: str = Header(None, alias="X-AI-Service-Token")):
    verify_token(x_ai_service_token)
    return generate_run_narrative(req)


@app.post("/v1/group-observations", response_model=GroupObservationsResponse)
def group_observations(req: GroupObservationsRequest, x_ai_service_token: str = Header(None, alias="X-AI-Service-Token")):
    verify_token(x_ai_service_token)
    return GroupObservationsResponse(groups=group_observations_by_theme(req.observations))


@app.post("/v1/classify-report", response_model=ClassifyReportResponse)
def classify_report(req: ClassifyReportRequest, x_ai_service_token: str = Header(None, alias="X-AI-Service-Token")):
    verify_token(x_ai_service_token)
    res = classify_pilot_audit(
        facility_code=req.facility_code,
        facility_type=req.facility_type,
        domain=req.domain,
        answers=req.answers,
        scored_items=req.scored_items,
        evidence_items=req.evidence_items
    )
    return ClassifyReportResponse(**res)

