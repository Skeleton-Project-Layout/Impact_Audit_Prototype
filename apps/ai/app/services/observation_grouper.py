from typing import List, Dict


def group_observations_by_theme(observations: List[str]) -> Dict[str, List[str]]:
    groups = {
        "Infrastructure & Utilities": [],
        "Operational Maintenance & Equipment": [],
        "Staffing & Service Continuity": [],
        "Safety, Hygiene & Compliance": [],
        "General Field Notes": []
    }

    for obs in observations:
        lower = obs.lower()
        if any(w in lower for w in ["water", "pipe", "toilet", "tap", "electricity", "building", "room", "roof", "boundary"]):
            groups["Infrastructure & Utilities"].append(obs)
        elif any(w in lower for w in ["repair", "broken", "functional", "leak", "door", "window", "inventory", "stock"]):
            groups["Operational Maintenance & Equipment"].append(obs)
        elif any(w in lower for w in ["staff", "teacher", "doctor", "nurse", "worker", "attendance", "absent", "shift"]):
            groups["Staffing & Service Continuity"].append(obs)
        elif any(w in lower for w in ["safety", "hazard", "fire", "sanitation", "waste", "clean", "hygiene", "soap", "first aid"]):
            groups["Safety, Hygiene & Compliance"].append(obs)
        else:
            groups["General Field Notes"].append(obs)

    # Filter out empty categories
    return {k: v for k, v in groups.items() if len(v) > 0}
