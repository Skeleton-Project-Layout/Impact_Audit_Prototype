import re
from typing import Tuple, List

# Indian Phone numbers (+91 or 10-digit mobile starting with 6-9)
PHONE_REGEX = re.compile(r'(?:\+91[\-\s]?)?[6789]\d{9}\b')

# 12-digit Aadhaar pattern (with or without spaces/dashes)
AADHAAR_REGEX = re.compile(r'\b[2-9]\d{3}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}\b')

# Email pattern
EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b')


def screen_and_mask_pii(text: str) -> Tuple[bool, List[str], str]:
    if not text:
        return False, [], ""

    detected_types = []
    masked = text

    if AADHAAR_REGEX.search(masked):
        detected_types.append("AADHAAR")
        masked = AADHAAR_REGEX.sub("[AADHAAR_REDACTED]", masked)

    if PHONE_REGEX.search(masked):
        detected_types.append("PHONE")
        masked = PHONE_REGEX.sub("[PHONE_REDACTED]", masked)

    if EMAIL_REGEX.search(masked):
        detected_types.append("EMAIL")
        masked = EMAIL_REGEX.sub("[EMAIL_REDACTED]", masked)

    contains_pii = len(detected_types) > 0
    return contains_pii, detected_types, masked
