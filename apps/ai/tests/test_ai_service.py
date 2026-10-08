import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import AI_SERVICE_TOKEN

client = TestClient(app)
AUTH_HEADERS = {"X-AI-Service-Token": AI_SERVICE_TOKEN}


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert data["database_connected"] is False
    assert data["isolation_verified"] is True


def test_unauthorized_access():
    response = client.post("/v1/pii-screen", json={"text": "Hello test"})
    assert response.status_code == 401

    response_bad_token = client.post(
        "/v1/pii-screen",
        json={"text": "Hello test"},
        headers={"X-AI-Service-Token": "invalid-token"}
    )
    assert response_bad_token.status_code == 401


def test_pii_screening():
    payload = {
        "text": "Officer contact is 9876543210 and Aadhaar is 5432 1098 7654. Email: test@jharkhand.gov.in"
    }
    response = client.post("/v1/pii-screen", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["contains_pii"] is True
    assert "PHONE" in data["detected_types"]
    assert "AADHAAR" in data["detected_types"]
    assert "EMAIL" in data["detected_types"]
    assert "[PHONE_REDACTED]" in data["masked_text"]
    assert "[AADHAAR_REDACTED]" in data["masked_text"]
    assert "[EMAIL_REDACTED]" in data["masked_text"]
    assert "9876543210" not in data["masked_text"]


def test_summarise_run_narrative():
    payload = {
        "facility_code": "JH-RCH-001",
        "run_number": 1,
        "acs_score": 75.0,
        "alert_band": "LIGHT_GREEN",
        "is_provisional": False,
        "coverage_pct": 92.5,
        "total_applicable_questions": 40,
        "total_assessed_questions": 37,
        "triggered_red_flags_count": 1,
        "ledger": [
            {
                "question_id": "S11",
                "page_number": 1,
                "question_text": "Is functional drinking water available?",
                "severity": "CRITICAL",
                "weight": 2.5,
                "lost_weighted_points": 2.5,
                "deduction_percentage": 25.0,
                "loss_explanation": "Tap water absent or non-functional",
                "suggested_intervention": "Install solar borewell and chlorination kit"
            }
        ]
    }
    response = client.post("/v1/summarise-run", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "JH-RCH-001" in data["summary_narrative"]
    assert "75.0" in data["summary_narrative"]
    assert "LIGHT GREEN" in data["summary_narrative"]
    assert "S11" in data["summary_narrative"]
    assert "ASSISTIVE AI DRAFT" in data["disclaimer"]
    assert len(data["key_findings"]) >= 1
    assert len(data["priority_interventions"]) >= 1
    assert data["quality_metadata"]["hallucination_index"] == 0.0


def test_group_observations():
    payload = {
        "observations": [
            "Broken boundary wall near eastern wing",
            "Drinking water tap leaking continuously",
            "Teacher attendance register updated on paper only",
            "First aid kit expired last quarter"
        ]
    }
    response = client.post("/v1/group-observations", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    groups = response.json()["groups"]
    assert "Infrastructure & Utilities" in groups
    assert "Staffing & Service Continuity" in groups
    assert "Safety, Hygiene & Compliance" in groups
