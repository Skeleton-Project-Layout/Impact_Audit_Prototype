const fs = require('fs');
const path = require('path');

function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          currentVal += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentVal += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        currentRow.push(currentVal);
        currentVal = '';
      } else if (c === '\r') {
      } else if (c === '\n') {
        currentRow.push(currentVal);
        rows.push(currentRow);
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += c;
      }
    }
  }
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal);
    rows.push(currentRow);
  }
  return rows;
}

const csvPath = path.join(__dirname, '..', 'question_merge_map.csv');
const csv = parseCSV(fs.readFileSync(csvPath, 'utf8'));
const headers = csv[0].map(h => h.trim());
const rows = csv.slice(1).map(row => {
  const obj = {};
  headers.forEach((h, i) => obj[h] = (row[i] || '').trim());
  return obj;
});

const auditQuestions = rows.filter(r => r.merge_action !== 'MOVED_TO_REGISTRY' && r.merge_action !== 'RETIRED');

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + str.replace(/'/g, "''") + "'";
}

function escapeJson(obj) {
  return escapeSql(JSON.stringify(obj));
}

function getFieldsSchema(q) {
  const id = q.merged_id;
  const rt = q.response_type;
  
  // Specific question custom field layouts
  if (id === 'S03' || id === 'P02') {
    return [
      { name: 'sanctioned', label: 'Sanctioned Posts', type: 'number', min: 0, required: true },
      { name: 'working', label: 'Currently Working', type: 'number', min: 0, required: true },
      { name: 'present_today', label: 'Present Today', type: 'number', min: 0, required: true }
    ];
  }
  if (id === 'S04' || id === 'A03') {
    return [
      { name: 'attendance_pct', label: 'Average Attendance (%)', type: 'number', min: 0, max: 100, step: 0.1, unit: '%', required: true }
    ];
  }
  if (id === 'S06') {
    return [
      { name: 'fln_proficient_pct', label: 'Foundational Stage Meeting FLN Competencies (%)', type: 'number', min: 0, max: 100, step: 0.1, unit: '%', required: true },
      { name: 'remedial_count', label: 'Students receiving remedial support', type: 'number', min: 0, required: false },
      { name: 'learning_concerns', label: 'Primary learning concerns observed', type: 'text', required: false }
    ];
  }
  if (id === 'S07' || id === 'S08' || id === 'A08' || id === 'A12') {
    return [
      { name: 'rating', label: 'Observation Rating (1 to 5)', type: 'rating', min: 1, max: 5, required: true,
        options: [
          { value: 1, label: '1 - Highly Deficient / Absent' },
          { value: 2, label: '2 - Poor / Substandard' },
          { value: 3, label: '3 - Satisfactory / Basic' },
          { value: 4, label: '4 - Good / Active' },
          { value: 5, label: '5 - Exemplary / Full Uptake' }
        ]
      },
      { name: 'observation_notes', label: 'Observation Notes', type: 'textarea', required: false }
    ];
  }
  if (id === 'S09') {
    return [
      { name: 'available', label: 'Guidance and counselling service available?', type: 'radio', options: ['YES', 'NO'], required: true },
      { name: 'students_supported', label: 'Number of students supported in last 30 days', type: 'number', min: 0, required: false }
    ];
  }
  if (id === 'S10') {
    return [
      { name: 'grid', label: 'Audio-Visual / Digital Facilities', type: 'grid_afu',
        rows: ['Electricity Connection', 'Internet / WiFi Connectivity', 'Smart TV / Projector Display', 'Tablets / Computers for Students'],
        columns: ['available', 'functional', 'used'],
        score_used: true
      }
    ];
  }
  if (id === 'S11') {
    return [
      { name: 'grid', label: 'WASH Facilities', type: 'grid_afu',
        rows: ['Drinking Water Facility', 'Boys Toilet Facility', 'Girls Toilet Facility', 'CWSN Accessible Toilet', 'Handwashing Station with Soap'],
        columns: ['available', 'functional'],
        score_used: false
      }
    ];
  }
  if (id === 'S12' || id === 'P11') {
    return [
      { name: 'checklist', label: 'Fire Safety & Emergency Checklist', type: 'checklist_ynp',
        items: [
          'Functional fire extinguisher present and tagged within inspection expiry',
          'Unobstructed emergency exits and clearly marked evacuation routes',
          'Working alarm / siren / notification system',
          'Evacuation drill conducted within the last 6 months'
        ]
      },
      { name: 'last_drill_date', label: 'Date of last drill / inspection', type: 'date', required: false }
    ];
  }
  if (id === 'S13') {
    return [
      { name: 'checklist', label: 'CWSN & Inclusive Facilities', type: 'checklist_ynp',
        items: [
          'Ramp with handrail for barrier-free physical access',
          'CWSN-accessible toilet facility',
          'Appropriate TLM / Braille / tactile assistive learning aids',
          'Designated special educator or inclusive teacher support'
        ]
      },
      { name: 'cwsn_count', label: 'Identified CWSN enrolled', type: 'number', min: 0, required: false }
    ];
  }
  if (id === 'A04') {
    return [
      { name: 'registered', label: 'Total Registered Pregnant & Lactating Mothers', type: 'number', min: 0, required: true },
      { name: 'receiving', label: 'Mothers Actively Receiving Services & Take-Home Ration', type: 'number', min: 0, required: true }
    ];
  }
  if (id === 'A05') {
    return [
      { name: 'checklist', label: 'Supplementary Nutrition Schedule', type: 'checklist_ynp',
        items: [
          'Supplementary nutrition distributed strictly per monthly schedule',
          'Take Home Ration (THR) packets available in clean, sealed condition',
          'Hot cooked meal served daily with mandated variety/nutrition standards',
          'Hygienic food storage and clean drinking water cooking area'
        ]
      }
    ];
  }
  if (id === 'A06') {
    return [
      { name: 'checklist', label: 'Growth Monitoring & Equipment', type: 'checklist_ynp',
        items: [
          'Functional digital infant weighing scale available',
          'Functional stadiometer / infantometer height measurement tool available',
          'MUAC measurement tapes available and staff trained',
          'Growth charts plotted and updated within last 30 days'
        ]
      }
    ];
  }
  if (id === 'A07') {
    return [
      { name: 'identified', label: 'Children Identified as Nutritionally Vulnerable (SAM / MAM)', type: 'number', min: 0, required: true },
      { name: 'followed_up', label: 'Vulnerable Children Provided Active Follow-up / NRC Referral', type: 'number', min: 0, required: true }
    ];
  }
  if (id === 'A09') {
    return [
      { name: 'grid', label: 'ECCE Play & Learning Materials', type: 'grid_afu',
        rows: ['Picture Storybooks & Chart Posters', 'Age-appropriate Puzzles & Building Blocks', 'Local Language Toys & Puppet Kits', 'Outdoor Activity & Play Equipment'],
        columns: ['available', 'functional', 'used'],
        score_used: true
      }
    ];
  }
  if (id === 'A10') {
    return [
      { name: 'checklist', label: 'Anganwadi Infrastructure & Safety', type: 'checklist_ynp',
        items: [
          'Safe and potable drinking water source within premises',
          'Clean, functional, child-friendly toilet facility',
          'Handwashing station with continuous running water and soap',
          'Adequate natural ventilation, lighting, and child-safe boundary'
        ]
      }
    ];
  }
  if (id === 'A11') {
    return [
      { name: 'checklist', label: 'Health Check-ups & VHND', type: 'checklist_ynp',
        items: [
          'Monthly Village Health Sanitation and Nutrition Day (VHSND) conducted',
          'Routine immunisation tracking up to date for 0-6 years',
          'Biannual Vitamin A and biannual deworming administered',
          'Referrals to PHC/CHC tracked and documented'
        ]
      }
    ];
  }
  if (id === 'A13') {
    return [
      { name: 'checklist', label: 'Anganwadi Emergency & Safety', type: 'checklist_ynp',
        items: [
          'Fire safety / sand buckets or extinguisher readily available',
          'Stocked and unexpired first aid kit accessible to worker',
          'Safe electrical wiring without exposed cords or sockets at child height',
          'Emergency contact numbers (doctor, hospital, police) clearly displayed'
        ]
      }
    ];
  }
  if (id === 'P04') {
    return [
      { name: 'checklist', label: 'Essential Medicines Availability', type: 'checklist_ynp',
        items: [
          'Essential antibiotics and analgesics currently in stock',
          'ORS packets and Zinc dispersible tablets in stock',
          'Antihypertensive and basic diabetes management drugs in stock',
          'Emergency obstetric and child life-saving injections in stock'
        ]
      },
      { name: 'stockouts_count', label: 'Number of stock-out incidents in last 30 days', type: 'number', min: 0, required: false }
    ];
  }
  if (id === 'P05') {
    return [
      { name: 'grid', label: 'Essential Basic Diagnostics', type: 'grid_afu',
        rows: ['Blood Pressure Monitor (Sphygmomanometer / Digital)', 'Glucometer with Test Strips', 'Hemoglobinometer / Sahli Kit', 'Urine Protein & Sugar Test Strips', 'Malaria Rapid Diagnostic Kits (RDT)', 'Pulse Oximeter'],
        columns: ['available', 'functional'],
        score_used: false
      }
    ];
  }
  if (id === 'P06') {
    return [
      { name: 'checklist', label: 'Maternal Health & Delivery Services', type: 'checklist_ynp',
        items: [
          'Antenatal care (ANC) check-ups with blood pressure and Hb testing',
          'Functional labour room / institutional delivery capability or 24/7 link',
          'Postnatal care (PNC) monitoring and counselling provided',
          'High-risk pregnancy identification and completed emergency referral'
        ]
      }
    ];
  }
  if (id === 'P07') {
    return [
      { name: 'checklist', label: 'Child Health & Immunisation Services', type: 'checklist_ynp',
        items: [
          'Functional cold chain equipment (ILR / Deep Freezer) maintaining 2-8°C',
          'Routine childhood immunisation sessions conducted without stockouts',
          'Management of acute childhood respiratory infections & diarrhoea',
          'Infant growth monitoring and severe malnutrition referral'
        ]
      }
    ];
  }
  if (id === 'P08') {
    return [
      { name: 'checklist', label: 'NCD Screening & Management', type: 'checklist_ynp',
        items: [
          'Screening for hypertension and diabetes for eligible adults (30+)',
          'Oral / breast / cervical cancer awareness and primary screening',
          'Regular monthly medicine dispensation for registered NCD patients',
          'Documented follow-up tracking for non-compliant chronic patients'
        ]
      }
    ];
  }
  if (id === 'P09') {
    return [
      { name: 'checklist', label: 'Emergency, Trauma & Counselling', type: 'checklist_ynp',
        items: [
          'Functional first aid and trauma resuscitation kit',
          'Anti-snake venom (ASV) and anti-rabies vaccine (ARV) in stock',
          'Emergency ambulance / referral transportation tie-up functional',
          'Mental health support and basic psychosocial counselling available'
        ]
      }
    ];
  }
  if (id === 'P12') {
    return [
      { name: 'checklist', label: 'Utilities, Waste & Infection Control', type: 'checklist_ynp',
        items: [
          'Uninterrupted 24/7 power supply with functional generator / inverter backup',
          'Continuous running potable water in clinical areas and toilets',
          'Colour-coded biomedical waste segregation bins and sharp disposal pits',
          'Standard infection control protocols, autoclaving and PPE available'
        ]
      }
    ];
  }
  if (id === 'P13') {
    return [
      { name: 'physical_reported', label: 'Physical register count of services delivered', type: 'number', min: 0, required: true },
      { name: 'digital_reported', label: 'HMIS / digital portal recorded count', type: 'number', min: 0, required: true },
      { name: 'mismatch_pct', label: 'Calculated / Observed Mismatch Percentage (%)', type: 'number', min: 0, max: 100, step: 0.1, unit: '%', required: true }
    ];
  }

  // Generic fallback based on response_type
  if (rt.includes('Numbers') || rt.includes('Number')) {
    return [
      { name: 'numeric_value', label: q.canonical_text, type: 'number', min: 0, required: false },
      { name: 'notes', label: 'Additional details', type: 'text', required: false }
    ];
  }
  if (rt.includes('Percentage')) {
    return [
      { name: 'percentage_value', label: q.canonical_text, type: 'number', min: 0, max: 100, step: 0.1, unit: '%', required: false }
    ];
  }
  if (rt.includes('Rating')) {
    return [
      { name: 'rating', label: 'Rating (1 to 5)', type: 'rating', min: 1, max: 5, required: false },
      { name: 'notes', label: 'Observation notes', type: 'text', required: false }
    ];
  }
  if (rt.includes('Yes/No')) {
    return [
      { name: 'response', label: 'Response', type: 'radio', options: ['YES', 'NO'], required: false },
      { name: 'remarks', label: 'Remarks', type: 'text', required: false }
    ];
  }
  if (rt.includes('Top-3')) {
    return [
      { name: 'gap_1', label: 'Priority 1 (Highest Impact Gap)', type: 'text', required: false },
      { name: 'gap_2', label: 'Priority 2 Gap', type: 'text', required: false },
      { name: 'gap_3', label: 'Priority 3 Gap', type: 'text', required: false },
      { name: 'single_intervention', label: 'Single most critical intervention recommended', type: 'textarea', required: false }
    ];
  }
  if (rt.includes('Narrative') || rt.includes('Structured')) {
    return [
      { name: 'observation', label: 'Detailed Field Observation', type: 'textarea', required: false }
    ];
  }

  return [
    { name: 'response', label: 'Response / Finding', type: 'textarea', required: false }
  ];
}

function getRubricConfig(q) {
  const id = q.merged_id;
  const rawRubric = q.rubric_type_default;
  const isScored = q.scored_default === 'Y';
  
  if (!isScored || rawRubric.startsWith('NONE')) {
    return {
      type: 'NONE',
      scored: false,
      max_raw_points: 0,
      description: 'Informational question — not scored in baseline ACS calculation.'
    };
  }

  if (rawRubric.startsWith('RATIO')) {
    let num = 'working';
    let den = 'sanctioned';
    let max = 10;
    if (id === 'S03' || id === 'P02') {
      return {
        type: 'RATIO',
        scored: true,
        max_raw_points: 10,
        numerator_field: 'working',
        denominator_field: 'sanctioned',
        secondary_numerator: 'present_today',
        rule_description: 'Proportion of sanctioned staff working and present today. Denominator 0 = not assessed.'
      };
    }
    if (id === 'A04') {
      return {
        type: 'RATIO',
        scored: true,
        max_raw_points: 10,
        numerator_field: 'receiving',
        denominator_field: 'registered',
        rule_description: 'Proportion of registered pregnant/lactating mothers receiving services.'
      };
    }
    if (id === 'A07') {
      return {
        type: 'RATIO',
        scored: true,
        max_raw_points: 10,
        numerator_field: 'followed_up',
        denominator_field: 'identified',
        rule_description: 'Proportion of identified vulnerable children receiving active follow-up/referral.'
      };
    }
  }

  if (rawRubric.startsWith('PERCENT_THRESHOLD')) {
    if (id === 'S04' || id === 'A03') {
      return {
        type: 'PERCENT_THRESHOLD',
        scored: true,
        max_raw_points: 10,
        field_name: 'attendance_pct',
        threshold: 75,
        partial_margin: 10,
        inverted: false,
        rule_description: '>= 75% earns full points (10); 65% to < 75% earns partial points (5); < 65% earns 0.'
      };
    }
    if (id === 'S06') {
      return {
        type: 'PERCENT_THRESHOLD',
        scored: true,
        max_raw_points: 10,
        field_name: 'fln_proficient_pct',
        threshold: 70,
        partial_margin: 10,
        inverted: false,
        rule_description: '>= 70% earns full points (10); 60% to < 70% earns partial points (5); < 60% earns 0.'
      };
    }
    if (id === 'P13') {
      return {
        type: 'PERCENT_THRESHOLD',
        scored: true,
        max_raw_points: 10,
        field_name: 'mismatch_pct',
        threshold: 10,
        partial_margin: 10,
        inverted: true,
        rule_description: '<= 10% mismatch earns full points (10); >10% and <=20% earns partial points (5); > 20% earns 0.'
      };
    }
  }

  if (rawRubric === 'RATING_1_5') {
    return {
      type: 'RATING_1_5',
      scored: true,
      max_raw_points: 10,
      field_name: 'rating',
      formula: '(rating - 1) / 4 * max',
      red_flag_threshold: 2,
      rule_description: 'Rating 1 to 5 mapped to 0..10 points: (r-1)/4*10. Score <= 2 triggers red flag.'
    };
  }

  if (rawRubric === 'YESNO_WITH_COUNT') {
    return {
      type: 'YESNO_WITH_COUNT',
      scored: true,
      max_raw_points: 10,
      boolean_field: 'available',
      count_field: 'students_supported',
      rule_description: 'Available with positive uptake = 10 pts; Available but zero uptake = 5 pts; Not available = 0 pts.'
    };
  }

  if (rawRubric.startsWith('GRID_AFU')) {
    const scoreUsed = rawRubric.includes('score_used=true');
    let rows = [];
    if (id === 'S10') rows = ['Electricity Connection', 'Internet / WiFi Connectivity', 'Smart TV / Projector Display', 'Tablets / Computers for Students'];
    else if (id === 'S11') rows = ['Drinking Water Facility', 'Boys Toilet Facility', 'Girls Toilet Facility', 'CWSN Accessible Toilet', 'Handwashing Station with Soap'];
    else if (id === 'A09') rows = ['Picture Storybooks & Chart Posters', 'Age-appropriate Puzzles & Building Blocks', 'Local Language Toys & Puppet Kits', 'Outdoor Activity & Play Equipment'];
    else if (id === 'P05') rows = ['Blood Pressure Monitor', 'Glucometer with Test Strips', 'Hemoglobinometer / Sahli Kit', 'Urine Protein & Sugar Test Strips', 'Malaria Rapid Diagnostic Kits (RDT)', 'Pulse Oximeter'];
    
    const ptsPerRow = scoreUsed ? 3 : 2;
    return {
      type: 'GRID_AFU',
      scored: true,
      max_raw_points: rows.length * ptsPerRow,
      score_used: scoreUsed,
      rows: rows,
      points_per_row: ptsPerRow,
      rule_description: `Per row: Available=1 pt, Functional=1 pt (only if available). ${scoreUsed ? 'Used=1 pt.' : 'Used recorded but not scored.'}`
    };
  }

  if (rawRubric === 'CHECKLIST_YNP') {
    const fields = getFieldsSchema(q);
    const checklistField = fields.find(f => f.type === 'checklist_ynp');
    const items = checklistField ? checklistField.items : ['Item 1', 'Item 2', 'Item 3', 'Item 4'];
    return {
      type: 'CHECKLIST_YNP',
      scored: true,
      max_raw_points: items.length,
      items: items,
      yes_points: 1.0,
      partial_points: 0.5,
      no_points: 0.0,
      rule_description: 'Per checklist item: Yes = 1.0 pt, Partial = 0.5 pt, No = 0 pt. N/A excluded from total.'
    };
  }

  return {
    type: 'NONE',
    scored: false,
    max_raw_points: 0,
    description: 'Informational question'
  };
}

let sql = `-- ============================================================================
-- V3__question_bank_versioning.sql
-- Abhisaran Audit Platform: Master Question Bank & Immutable Versioning
-- 72 Audit Questions Seeded with Version 1 Snapshots
-- ============================================================================

-- 1. Question Bank Catalog (Master Metadata)
CREATE TABLE question_bank (
    id VARCHAR(16) PRIMARY KEY,             -- 'C01', 'S02', 'A02', 'P01', etc.
    domain VARCHAR(32) NOT NULL,            -- 'SCHOOL', 'ANGANWADI', 'HEALTH', 'ALL'
    section VARCHAR(32) NOT NULL,           -- 'COMMUNITY_PROFILE', 'SCHOOL', 'ANGANWADI', 'HEALTH', 'COMMUNITY_INTERACTION', 'PHYSICAL_VERIFICATION', 'SUMMARY'
    canonical_text TEXT NOT NULL,
    response_type VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM')),
    scored_default BOOLEAN NOT NULL DEFAULT FALSE,
    rubric_type_default VARCHAR(64) NOT NULL,
    evidence_upload_default BOOLEAN NOT NULL DEFAULT FALSE,
    evidence_hint TEXT,
    red_flag_logic TEXT,
    suggested_intervention TEXT,
    source_csv_id VARCHAR(32),
    source_zip_q VARCHAR(32),
    merge_action VARCHAR(32),
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qb_domain ON question_bank(domain);
CREATE INDEX idx_qb_section ON question_bank(section);
CREATE INDEX idx_qb_severity ON question_bank(severity);
CREATE INDEX idx_qb_active ON question_bank(active);

-- 2. Question Versions (Immutable Snapshots for Audits and Scoring)
CREATE TABLE question_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id VARCHAR(16) NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    text TEXT NOT NULL,
    hint TEXT,
    fields_schema JSONB NOT NULL,
    rubric_config JSONB NOT NULL,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM')),
    scored BOOLEAN NOT NULL DEFAULT FALSE,
    evidence_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    evidence_hint TEXT,
    red_flag_logic TEXT,
    suggested_intervention TEXT,
    alert_overrides JSONB,
    status VARCHAR(32) NOT NULL DEFAULT 'DEFAULT_PENDING_OWNER_REVIEW'
        CHECK (status IN ('ACTIVE', 'DEFAULT_PENDING_OWNER_REVIEW', 'ARCHIVED')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_question_version UNIQUE (question_id, version_number)
);

CREATE INDEX idx_qv_question_id ON question_versions(question_id);
CREATE INDEX idx_qv_status ON question_versions(status);

-- 3. Severity Weights Configuration (Versioned Defaults)
CREATE TABLE severity_weights (
    severity VARCHAR(16) PRIMARY KEY CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM')),
    weight INT NOT NULL,
    version_number INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO severity_weights (severity, weight, version_number) VALUES
('CRITICAL', 3, 1),
('HIGH', 2, 1),
('MEDIUM', 1, 1);

-- 4. Alert Bands Configuration (Red -> Green Spectrum)
CREATE TABLE alert_bands (
    band VARCHAR(20) PRIMARY KEY CHECK (band IN ('RED', 'ORANGE', 'AMBER', 'LIGHT_GREEN', 'DARK_GREEN')),
    min_score NUMERIC(5, 2) NOT NULL,
    max_score NUMERIC(5, 2) NOT NULL,
    label VARCHAR(64) NOT NULL,
    color_hex VARCHAR(16) NOT NULL,
    version_number INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO alert_bands (band, min_score, max_score, label, color_hex, version_number) VALUES
('RED', 0.00, 39.99, 'Needs immediate attention', '#dc2626', 1),
('ORANGE', 40.00, 54.99, 'Critical gaps', '#f97316', 1),
('AMBER', 55.00, 69.99, 'Needs improvement', '#f59e0b', 1),
('LIGHT_GREEN', 70.00, 89.99, 'Good — a few things are off', '#84cc16', 1),
('DARK_GREEN', 90.00, 100.00, 'All good', '#10b981', 1);

-- 5. Scoring Global Settings
CREATE TABLE scoring_settings (
    id VARCHAR(32) PRIMARY KEY,
    setting_value VARCHAR(128) NOT NULL,
    description TEXT,
    version_number INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO scoring_settings (id, setting_value, description, version_number) VALUES
('MIN_COVERAGE_PCT', '70.0', 'Minimum assessed coverage percentage before an ACS is marked PROVISIONAL', 1),
('CRITICAL_RED_THRESHOLD', '50.0', 'Questions with Critical severity below this percentage are clamped to RED', 1),
('PARTIAL_MARGIN_PCT', '10.0', 'Percentage margin below threshold that qualifies for partial (50%) points', 1);

-- ============================================================================
-- SEED DATA: Exactly 72 Audit Questions from question_merge_map.csv
-- ============================================================================
`;

auditQuestions.forEach((q, idx) => {
  const displayOrder = idx + 1;
  const severity = q.severity.toUpperCase();
  const scoredDefault = q.scored_default === 'Y';
  const evidenceDefault = q.evidence_upload_default === 'Y';
  const fields = getFieldsSchema(q);
  const rubric = getRubricConfig(q);

  sql += `
-- Question ${displayOrder}: ${q.merged_id} (${q.section})
INSERT INTO question_bank (
    id, domain, section, canonical_text, response_type, severity,
    scored_default, rubric_type_default, evidence_upload_default, evidence_hint,
    red_flag_logic, suggested_intervention, source_csv_id, source_zip_q,
    merge_action, notes, active, display_order
) VALUES (
    ${escapeSql(q.merged_id)},
    ${escapeSql(q.applies_to)},
    ${escapeSql(q.section)},
    ${escapeSql(q.canonical_text)},
    ${escapeSql(q.response_type)},
    ${escapeSql(severity)},
    ${scoredDefault},
    ${escapeSql(q.rubric_type_default)},
    ${evidenceDefault},
    ${escapeSql(q.evidence_hint || null)},
    ${escapeSql(q.red_flag_logic || null)},
    ${escapeSql(q.suggested_intervention || null)},
    ${escapeSql(q.source_csv_id || null)},
    ${escapeSql(q.source_zip_q || null)},
    ${escapeSql(q.merge_action || null)},
    ${escapeSql(q.notes || null)},
    TRUE,
    ${displayOrder}
);

INSERT INTO question_versions (
    question_id, version_number, text, hint,
    fields_schema, rubric_config, severity, scored,
    evidence_enabled, evidence_hint, red_flag_logic, suggested_intervention,
    alert_overrides, status
) VALUES (
    ${escapeSql(q.merged_id)},
    1,
    ${escapeSql(q.canonical_text)},
    ${escapeSql(q.notes || null)},
    ${escapeJson(fields)}::jsonb,
    ${escapeJson(rubric)}::jsonb,
    ${escapeSql(severity)},
    ${scoredDefault},
    ${evidenceDefault},
    ${escapeSql(q.evidence_hint || null)},
    ${escapeSql(q.red_flag_logic || null)},
    ${escapeSql(q.suggested_intervention || null)},
    NULL,
    'DEFAULT_PENDING_OWNER_REVIEW'
);
`;
});

const outPath = path.join(__dirname, '..', 'apps', 'api', 'src', 'main', 'resources', 'db', 'migration', 'V3__question_bank_versioning.sql');
fs.writeFileSync(outPath, sql, 'utf8');
console.log('Successfully generated V3 migration at:', outPath);
console.log('Total questions written:', auditQuestions.length);
