from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class PiiScreenRequest(BaseModel):
    text: str


class PiiScreenResponse(BaseModel):
    contains_pii: bool
    detected_types: List[str]
    masked_text: str


class ExtractTextRequest(BaseModel):
    evidence_id: str
    file_name: Optional[str] = None
    content_base64: Optional[str] = None


class ExtractTextResponse(BaseModel):
    evidence_id: str
    extracted_text: str
    confidence: float
    blocks_count: int


class LedgerItemInput(BaseModel):
    question_id: str
    page_number: int
    question_text: str
    severity: str
    weight: float
    lost_weighted_points: float
    deduction_percentage: float
    loss_explanation: str
    suggested_intervention: Optional[str] = None


class SummariseRunRequest(BaseModel):
    facility_code: str
    run_number: int
    acs_score: Optional[float] = None
    alert_band: Optional[str] = None
    is_provisional: bool
    coverage_pct: float
    total_applicable_questions: int
    total_assessed_questions: int
    triggered_red_flags_count: int
    ledger: List[LedgerItemInput] = Field(default_factory=list)
    sections: Optional[List[Dict[str, Any]]] = None


class SummariseRunResponse(BaseModel):
    service_id: str
    summary_narrative: str
    key_findings: List[str]
    priority_interventions: List[str]
    disclaimer: str
    quality_metadata: Dict[str, Any]


class GroupObservationsRequest(BaseModel):
    observations: List[str]


class GroupObservationsResponse(BaseModel):
    groups: Dict[str, List[str]]
