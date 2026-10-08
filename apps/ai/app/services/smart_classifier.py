from typing import List, Dict, Any, Optional
import os
import json

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")


def classify_pilot_audit(
    facility_code: str,
    facility_type: str,
    domain: str,
    answers: Dict[str, Any],
    scored_items: Optional[List[Dict[str, Any]]] = None,
    evidence_items: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Smartly scans the submitted questionnaire, classifies the audit into thematic
    assessment points (e.g. Water, School, Health, Nutrition, Power, Community),
    assigns color-coded individuality alerts (RED, ORANGE, AMBER, GREEN),
    calculates scores per point and total ACS, and associates relevant evidence.
    """
    scored_items = scored_items or []
    evidence_items = evidence_items or []

    # Normalize answers if passed as list of items
    norm_answers: Dict[str, Any] = {}
    if isinstance(answers, list):
        for item in answers:
            if isinstance(item, dict):
                qid = item.get("questionId") or item.get("code") or item.get("question_id") or ""
                val = item.get("value") or item.get("raw_value") or item
                if qid:
                    norm_answers[str(qid)] = val
    elif isinstance(answers, dict):
        norm_answers = answers

    CANONICAL_TO_ZIP = {
        "S01": "8",   # School name & UDISE+
        "S02": "10",  # Enrolment boys/girls
        "S03": "11",  # Teachers sanctioned & present
        "S04": "12",  # Attendance
        "S05": "13",  # Dropouts
        "S06": "14",  # Foundational learning
        "S07": "68",  # FLN/TLM in school
        "S08": "69",  # Experiential pedagogy
        "S09": "70",  # Guidance & counselling
        "S10": "19",  # Electricity & digital facilities
        "S11": "17",  # Water & WASH
        "S12": "71",  # Fire safety in school
        "S13": "16",  # CWSN special needs
        "S14": "72",  # NGO / CSR school support
        "S15": "21",  # School gaps
        "A01": "23",  # Anganwadi name & code
        "A02": "24",  # AWC registered children
        "A03": "25",  # AWC regular attendance
        "A04": "26",  # Pregnant & lactating mothers
        "A05": "27",  # Supplementary nutrition / THR
        "A06": "28",  # Growth monitoring
        "A07": "29",  # Nutritionally vulnerable children
        "A08": "30",  # ECCE preschool activities
        "A09": "31",  # Learning toys & TLM
        "A10": "73",  # AWC drinking water & child-safe space
        "A11": "32",  # Health check-up / immunization
        "A12": "74",  # POSHAN Tracker accuracy
        "A13": "75",  # Child fire safety & emergency
        "A14": "76",  # NGO / CSR Anganwadi support
        "A15": "33",  # Anganwadi challenges
        "P01": "77",  # Facility profile & population covered
        "P02": "35",  # Doctors / nurses / ANM presence
        "P03": "36",  # OPD patient load
        "P04": "37",  # Essential medicines
        "P05": "38",  # Basic diagnostics
        "P06": "39",  # Maternal health
        "P07": "40",  # Child health & immunisation
        "P08": "41",  # NCD screening
        "P09": "78",  # Mental health & trauma response
        "P10": "42",  # Common health problems
        "P11": "79",  # PHC Fire safety & evacuation
        "P12": "80",  # Power backup & biomedical waste
        "P13": "81",  # Service delivery vs HMIS registers
        "P14": "82",  # NGO / CSR health support
        "P15": "45",  # Health system gaps
        "C01": "2",   # Population & households
        "C02": "3",   # 3 biggest issues
        "C03": "4",   # Government services used
        "C04": "5",   # Difficult to access services
        "C05": "6",   # Seasonal problems
        "C06": "7"    # Vulnerable groups
    }
    ZIP_TO_CANONICAL = {v: k for k, v in CANONICAL_TO_ZIP.items()}

    # Map question answers by number
    ans_map: Dict[int, Any] = {}
    for k, v in norm_answers.items():
        k_str = str(k).strip()
        if k_str in CANONICAL_TO_ZIP:
            ans_map[int(CANONICAL_TO_ZIP[k_str])] = v
        elif k_str.startswith("question"):
            try:
                ans_map[int(k_str.replace("question", ""))] = v
            except ValueError:
                pass
        elif k_str.isdigit():
            ans_map[int(k_str)] = v

    # Helper to find evidence for questions/codes
    def get_evidence_for_codes(codes: List[str]) -> List[Dict[str, Any]]:
        evs = []
        for ev in evidence_items:
            q_id = str(ev.get("questionId", "")).strip()
            mapped_num = CANONICAL_TO_ZIP.get(q_id, q_id.replace("question", ""))
            mapped_canonical = ZIP_TO_CANONICAL.get(mapped_num, q_id)
            if any(q_id == c or mapped_num == c or mapped_canonical == c for c in codes):
                evs.append({
                    "id": ev.get("id"),
                    "fileName": ev.get("fileName", "Evidence Document"),
                    "fileSizeBytes": ev.get("fileSizeBytes", 0),
                    "mimeType": ev.get("mimeType", "application/octet-stream"),
                    "downloadUrl": f"/api/v1/evidence/{ev.get('id')}/file" if ev.get("id") else None
                })
        return evs

    points: List[Dict[str, Any]] = []

    # -------------------------------------------------------------------------
    # 1. POINT: DRINKING WATER & SANITATION (WASH)
    # Questions: 17 (water), 18 (toilets), 27 (sanitation in AWC), 31 (hygiene)
    # -------------------------------------------------------------------------
    has_water_q = 17 in ans_map or 18 in ans_map or 27 in ans_map or any("water" in str(v).lower() for v in norm_answers.values())
    if has_water_q or domain in ["School", "Education", "Village", "Health"]:
        q17 = ans_map.get(17, {})
        q18 = ans_map.get(18, {})
        ev17_18 = get_evidence_for_codes(["17", "18", "S11", "S12"])

        # Evaluate status
        water_grid = q17.get("g", {}) if isinstance(q17, dict) else {}
        toilet_grid = q18.get("g", {}) if isinstance(q18, dict) else {}
        water_remarks = q17.get("remarks", "") if isinstance(q17, dict) else ""
        toilet_remarks = q18.get("remarks", "") if isinstance(q18, dict) else ""

        is_water_func = bool(water_grid.get("water", {}).get("func")) if isinstance(water_grid.get("water"), dict) else False
        is_water_avail = bool(water_grid.get("water", {}).get("avail")) if isinstance(water_grid.get("water"), dict) else False
        are_toilets_func = any(
            bool(toilet_grid.get(k, {}).get("func"))
            for k in ["boys", "girls", "cwsn"]
            if isinstance(toilet_grid.get(k), dict)
        )

        findings = []
        if not is_water_avail and not is_water_func:
            findings.append("Safe drinking water is unavailable and non-functional on premises.")
        elif not is_water_func:
            findings.append("Water supply infrastructure is physically present but non-functional.")
        else:
            findings.append("Drinking water supply is available and functional for daily use.")

        if not are_toilets_func:
            findings.append("Toilets for boys/girls/CWSN are non-functional or severely degraded.")
        else:
            findings.append("Functional toilet facilities available with separate arrangements.")

        if water_remarks:
            findings.append(f"Field Note: {water_remarks}")
        if toilet_remarks:
            findings.append(f"WASH Note: {toilet_remarks}")

        # Determine alert and score
        if not is_water_func or not are_toilets_func:
            alert_color = "RED"
            alert_label = "🔴 Critical Deficiencies"
            score = 30.0
            summary = "Critical failure in basic WASH facilities. Drinking water supply or student toilets are completely non-functional, posing immediate health and dignity risks."
            action = "Immediate sanction for plumbing overhaul, drinking water filtration, and gender-segregated toilet restoration."
        elif not is_water_avail:
            alert_color = "ORANGE"
            alert_label = "🟠 High Risk / Inadequate"
            score = 55.0
            summary = "Partial sanitation available but drinking water source remains unreliable or distant."
            action = "Connect facility to Jal Jeevan Mission piped network and install dedicated storage tanks."
        else:
            alert_color = "GREEN"
            alert_label = "🟢 Optimal Continuity"
            score = 95.0
            summary = "Water supply and sanitation infrastructure are fully functional and in regular use."
            action = "Maintain periodic water quality testing and preventive drainage maintenance."

        points.append({
            "id": "water_sanitation",
            "title": "Drinking Water & Sanitation Infrastructure",
            "icon": "💧",
            "alertColor": alert_color,
            "alertLabel": alert_label,
            "score": score,
            "maxScore": 100.0,
            "summary": summary,
            "keyFindings": findings,
            "evidence": ev17_18,
            "suggestedAction": action
        })

    # -------------------------------------------------------------------------
    # 2. POINT: PRIMARY & SECONDARY SCHOOL EDUCATION
    # Questions: 8-16, 20, 21 (enrolment, teachers, attendance, dropouts, FLN)
    # -------------------------------------------------------------------------
    has_school_q = any(n in ans_map for n in [8, 9, 10, 11, 12, 13, 14, 15, 20])
    if has_school_q or domain in ["School", "Education"]:
        q10 = ans_map.get(10, {}) # enrolment
        q11 = ans_map.get(11, {}) # teachers
        q12 = ans_map.get(12, {}) # attendance
        q13 = ans_map.get(13, {}) # dropouts
        ev_school = get_evidence_for_codes(["8", "10", "11", "12", "13", "14", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S13", "S14"])

        att_pct = 75.0
        try:
            if isinstance(q12, dict) and q12.get("attendance"):
                att_pct = float(q12.get("attendance"))
        except (ValueError, TypeError):
            pass

        sanctioned = int(q11.get("sanctioned") or 0) if isinstance(q11, dict) else 0
        working = int(q11.get("working") or 0) if isinstance(q11, dict) else 0
        dropout_count = int(q13.get("number") or 0) if isinstance(q13, dict) else 0

        findings = []
        findings.append(f"Average student attendance recorded at {att_pct:.1f}%.")
        if sanctioned > 0:
            findings.append(f"Teacher staffing: {working} working out of {sanctioned} sanctioned posts.")
        if dropout_count > 0:
            findings.append(f"{dropout_count} students identified as frequently absent or at acute risk of dropping out.")

        if att_pct < 65.0 or (sanctioned > 0 and working / max(1, sanctioned) < 0.6):
            alert_color = "RED"
            alert_label = "🔴 Critical Dropout / Staffing Risk"
            score = 42.0
            summary = f"Severe educational interruption: Attendance is critically low ({att_pct:.1f}%) with acute teacher vacancy."
            action = "Deploy urgent remedial staff and initiate community door-to-door retention campaigns."
        elif att_pct < 75.0 or dropout_count >= 5:
            alert_color = "ORANGE"
            alert_label = "🟠 High Risk / Low Attendance"
            score = 64.0
            summary = f"Attendance ({att_pct:.1f}%) is below the state continuity benchmark of 75.0%. Multiple students at dropout risk."
            action = "Establish student attendance tracking council and remedial Foundational Literacy (FLN) sessions."
        else:
            alert_color = "GREEN"
            alert_label = "🟢 Good Learning Continuity"
            score = 88.0
            summary = f"Student attendance is strong ({att_pct:.1f}%) with stable teacher availability and minimal dropout risk."
            action = "Strengthen digital pedagogy and experiential learning materials."

        points.append({
            "id": "school_education",
            "title": "School Operations & Foundational Learning",
            "icon": "🏫",
            "alertColor": alert_color,
            "alertLabel": alert_label,
            "score": score,
            "maxScore": 100.0,
            "summary": summary,
            "keyFindings": findings,
            "evidence": ev_school,
            "suggestedAction": action
        })

    # -------------------------------------------------------------------------
    # 3. POINT: HEALTH CARE & MEDICAL CONTINUITY (PHC / CHC)
    # Questions: 34-45 (staffing, OPD, essential medicines, diagnostics, maternal)
    # -------------------------------------------------------------------------
    has_health_q = any(n in ans_map for n in [34, 35, 36, 37, 38, 39, 41])
    if has_health_q or domain in ["Health"]:
        q35 = ans_map.get(35, {}) # staff
        q37 = ans_map.get(37, {}) # medicines
        q39 = ans_map.get(39, {}) # maternal
        ev_health = get_evidence_for_codes(["34", "35", "36", "37", "38", "39", "P01", "P02", "P03", "P04", "P05", "P06", "P07"])

        med_avail = str(q37.get("available", "")).lower() if isinstance(q37, dict) else ""
        med_gaps = q37.get("gaps", "") if isinstance(q37, dict) else ""

        findings = []
        if "yes" in med_avail or med_avail == "true":
            findings.append("Essential emergency medicines are generally stocked and available.")
        else:
            findings.append("Frequent stockouts of essential medicines and first-line antibiotics.")

        if med_gaps:
            findings.append(f"Supply Gaps: {med_gaps}")

        if "no" in med_avail:
            alert_color = "RED"
            alert_label = "🔴 Critical Medicine Stockout"
            score = 38.0
            summary = "Acute healthcare delivery barrier: Essential medicine supply is interrupted, forcing patients into out-of-pocket expenses."
            action = "Issue emergency indent to District Drug Warehouse and establish automated buffer stock replenishment."
        else:
            alert_color = "GREEN"
            alert_label = "🟢 Functional Health Service"
            score = 90.0
            summary = "PHC staff present, diagnostic testing active, and essential maternal/child health services operational."
            action = "Sustain routine cold-chain vaccine monitoring and ANC/PNC outreach."

        points.append({
            "id": "health_phc",
            "title": "Health Facility & Essential Medicines",
            "icon": "🏥",
            "alertColor": alert_color,
            "alertLabel": alert_label,
            "score": score,
            "maxScore": 100.0,
            "summary": summary,
            "keyFindings": findings,
            "evidence": ev_health,
            "suggestedAction": action
        })

    # -------------------------------------------------------------------------
    # 4. POINT: CHILD NUTRITION & ANGANWADI (AWW)
    # Questions: 24-32 (registered children, supplementary nutrition, growth)
    # -------------------------------------------------------------------------
    has_awc_q = any(n in ans_map for n in [24, 25, 26, 27, 28, 29, 30])
    if has_awc_q or domain in ["Nutrition", "Anganwadi"]:
        q27 = ans_map.get(27, {}) # nutrition
        q28 = ans_map.get(28, {}) # growth
        q29 = ans_map.get(29, {}) # vulnerable
        ev_awc = get_evidence_for_codes(["24", "25", "26", "27", "28", "29", "A01", "A02", "A03", "A04", "A05", "A06", "A07"])

        nut_reg = str(q27.get("regular", "")).lower() if isinstance(q27, dict) else ""
        growth_reg = str(q28.get("regular", "")).lower() if isinstance(q28, dict) else ""
        vuln_count = int(q29.get("number") or 0) if isinstance(q29, dict) else 0

        findings = []
        if "yes" in nut_reg:
            findings.append("Hot cooked meals / Take Home Rations (THR) supplied regularly as per schedule.")
        else:
            findings.append("Irregular supplementary food delivery to children and nursing mothers.")

        if "yes" in growth_reg:
            findings.append("Monthly growth monitoring conducted with functional weighing equipment.")
        else:
            findings.append("Growth monitoring measurements delayed or equipment calibration needed.")

        if vuln_count > 0:
            findings.append(f"{vuln_count} children flagged as nutritionally vulnerable requiring tracking.")

        if "no" in nut_reg or vuln_count > 5:
            alert_color = "RED"
            alert_label = "🔴 Nutrition Supply Interrupted"
            score = 45.0
            summary = "Critical nutritional gap: Supplementary feeding supply line has experienced disruptions."
            action = "Fast-track food supply logistics through ICDS supervisor and enroll flagged children into NRC tracking."
        elif "no" in growth_reg:
            alert_color = "AMBER"
            alert_label = "🟡 Needs Equipment / Monitoring"
            score = 68.0
            summary = "Food supply is continuous but growth monitoring apparatus requires replacement or training."
            action = "Procure calibrated infantometer and stadiometer under POSHAN Abhiyaan."
        else:
            alert_color = "GREEN"
            alert_label = "🟢 Optimal Nutrition Coverage"
            score = 92.0
            summary = "High adherence to ECCE learning, regular supplementary nutrition, and active growth monitoring."
            action = "Maintain mother counseling sessions on balanced micronutrient feeding."

        points.append({
            "id": "child_nutrition",
            "title": "Early Childhood Nutrition & Anganwadi Support",
            "icon": "👶",
            "alertColor": alert_color,
            "alertLabel": alert_label,
            "score": score,
            "maxScore": 100.0,
            "summary": summary,
            "keyFindings": findings,
            "evidence": ev_awc,
            "suggestedAction": action
        })

    # -------------------------------------------------------------------------
    # 5. POINT: POWER, DIGITAL & TELECOM CONNECTIVITY
    # Questions: 19 (electricity, internet, digital)
    # -------------------------------------------------------------------------
    has_power_q = 19 in ans_map
    if has_power_q:
        q19 = ans_map.get(19, {})
        ev_pwr = get_evidence_for_codes(["19", "S10", "P05"])
        grid = q19.get("g", {}) if isinstance(q19, dict) else {}
        has_elec = bool(grid.get("elec", {}).get("func")) if isinstance(grid.get("elec"), dict) else False
        has_net = bool(grid.get("net", {}).get("func")) if isinstance(grid.get("net"), dict) else False

        findings = []
        findings.append(f"Grid Electricity: {'Functional' if has_elec else 'Non-functional / Frequent outages'}.")
        findings.append(f"Broadband / Internet: {'Connected' if has_net else 'No connectivity / Dead zone'}.")

        if not has_elec:
            alert_color = "RED"
            alert_label = "🔴 Power Blackout"
            score = 30.0
            summary = "Facility lacks reliable electrical supply, disrupting digital classrooms and cold storage."
            action = "Sanction rooftop solar backup panel installation."
        elif not has_net:
            alert_color = "AMBER"
            alert_label = "🟡 Offline / No Connectivity"
            score = 65.0
            summary = "Power is functional but telecom connectivity remains offline."
            action = "Deploy BharatNet fibre or satellite uplink dongle."
        else:
            alert_color = "GREEN"
            alert_label = "🟢 Connected & Powered"
            score = 95.0
            summary = "Continuous power and active digital infrastructure supporting administration."
            action = "Maintain regular battery backup checks."

        points.append({
            "id": "power_digital",
            "title": "Electricity, Digital & Telecommunications",
            "icon": "⚡",
            "alertColor": alert_color,
            "alertLabel": alert_label,
            "score": score,
            "maxScore": 100.0,
            "summary": summary,
            "keyFindings": findings,
            "evidence": ev_pwr,
            "suggestedAction": action
        })

    # -------------------------------------------------------------------------
    # 6. POINT: COMMUNITY & VULNERABILITY RESILIENCE
    # Questions: 1-7, 46-55 (issues, seasonal, groups, barriers)
    # -------------------------------------------------------------------------
    has_comm_q = any(n in ans_map for n in [3, 4, 6, 7, 47, 51, 54])
    if has_comm_q or domain in ["Village", "Community"]:
        q3 = ans_map.get(3, {}) # 3 issues
        q6 = ans_map.get(6, {}) # seasonal
        q7 = ans_map.get(7, {}) # vulnerable groups
        ev_comm = get_evidence_for_codes(["1", "2", "3", "4", "5", "6", "7", "46", "47", "C01", "C02", "C03", "C04", "C05", "C06"])

        seasonal = str(q6.get("seasonal", "")).lower() if isinstance(q6, dict) else ""
        groups = q7.get("groups", []) if isinstance(q7, dict) else []

        findings = []
        if isinstance(q3, dict):
            issues = [q3.get(k) for k in ["i1", "i2", "i3"] if q3.get(k)]
            if issues:
                findings.append(f"Top Community Priorities: {', '.join(issues)}.")

        if "yes" in seasonal:
            findings.append("Seasonal climate/transport disruption impacts family livelihoods and access.")
        if groups:
            findings.append(f"Vulnerable groups identified: {', '.join(groups)}.")

        if "yes" in seasonal or len(groups) >= 3:
            alert_color = "AMBER"
            alert_label = "🟡 Seasonal Vulnerability"
            score = 62.0
            summary = "Community experiences monsoon and transit bottlenecks causing temporary service isolation."
            action = "Establish pre-monsoon essential stock reserves and emergency village transport protocols."
        else:
            alert_color = "GREEN"
            alert_label = "🟢 Stable Community Access"
            score = 85.0
            summary = "Moderate climate resilience with accessible government welfare coverage."
            action = "Strengthen village convergence committee meetings."

        points.append({
            "id": "community_livelihood",
            "title": "Community Livelihood & Vulnerability Support",
            "icon": "👥",
            "alertColor": alert_color,
            "alertLabel": alert_label,
            "score": score,
            "maxScore": 100.0,
            "summary": summary,
            "keyFindings": findings,
            "evidence": ev_comm,
            "suggestedAction": action
        })

    # Calculate overall mathematical ACS score
    if points:
        total_score = sum(p["score"] for p in points) / len(points)
        # Any RED point pulls down the band
        has_red = any(p["alertColor"] == "RED" for p in points)
        has_orange = any(p["alertColor"] == "ORANGE" for p in points)
        if has_red:
            total_score = min(total_score, 54.0)
            overall_band = "RED"
        elif has_orange:
            total_score = min(total_score, 68.0)
            overall_band = "ORANGE"
        elif total_score >= 80.0:
            overall_band = "GREEN"
        else:
            overall_band = "AMBER"
    else:
        total_score = 0.0
        overall_band = "PENDING"

    return {
        "facilityCode": facility_code,
        "facilityType": facility_type,
        "domain": domain,
        "acsScore": round(total_score, 1),
        "alertBand": overall_band,
        "points": points,
        "generatedAt": "now"
    }
