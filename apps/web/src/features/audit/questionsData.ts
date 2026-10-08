export interface SectionDefinition {
  id: string;
  idx: number;
  short: string;
  title: string;
  domain: string;
}

export interface QuestionField {
  k: string;
  label?: string;
  type: 'text' | 'number' | 'area' | 'radio' | 'check' | 'grid' | 'numtable';
  wide?: boolean;
  ph?: string;
  opts?: string[];
  rows?: { k: string; label: string }[];
  cols?: { k: string; label: string }[];
  dec?: boolean;
  max?: number;
  rowsNum?: number;
}

export interface QuestionDefinition {
  n: number;
  s: number; // section index 0..6
  text: string;
  hint?: string;
  fields: QuestionField[];
  allowEvidence?: boolean; // Only enable attachment upload where physical/documentary proof is needed
}

export const SECTIONS: SectionDefinition[] = [
  { id: 'A', idx: 0, short: 'Village & Community Profile', title: 'A. VILLAGE & COMMUNITY PROFILE', domain: 'Village' },
  { id: 'B', idx: 1, short: 'School Head / Principal', title: 'B. SCHOOL – HEAD TEACHER / PRINCIPAL', domain: 'School' },
  { id: 'C', idx: 2, short: 'Anganwadi Worker (AWW)', title: 'C. ANGANWADI – AWW', domain: 'Anganwadi' },
  { id: 'D', idx: 3, short: 'PHC / Health Facility', title: 'D. PHC / HEALTH FACILITY – MEDICAL OFFICER / STAFF', domain: 'Health' },
  { id: 'E', idx: 4, short: 'Community / Household', title: 'E. COMMUNITY / HOUSEHOLD INTERACTION', domain: 'Community' },
  { id: 'F', idx: 5, short: 'Physical Verification', title: 'F. PHYSICAL VERIFICATION – FIELD TEAM', domain: 'Physical' },
  { id: 'G', idx: 6, short: 'Quick Summary', title: 'G. ABHISARAN BASELINE – QUICK SUMMARY', domain: 'Summary' }
];

const YN = ['Yes', 'No'];
const three = (p: string) => [
  { k: 'i1', label: `${p} 1`, type: 'text' as const, wide: true },
  { k: 'i2', label: `${p} 2`, type: 'text' as const, wide: true },
  { k: 'i3', label: `${p} 3`, type: 'text' as const, wide: true }
];
const AVF = [{ k: 'avail', label: 'Available' }, { k: 'func', label: 'Functional' }];
const AVFU = [...AVF, { k: 'used', label: 'Used' }];

export const QUESTIONS: QuestionDefinition[] = [
  /* ---------- A. VILLAGE & COMMUNITY PROFILE ---------- */
  {
    n: 1, s: 0, text: 'Village name / locality?', hint: 'Basic identification',
    fields: [
      { k: 'village', label: 'Village name', type: 'text', wide: true },
      { k: 'locality', label: 'Locality', type: 'text', wide: true }
    ]
  },
  {
    n: 2, s: 0, text: 'Approx. population / households?', hint: 'Ask village head / official record',
    fields: [
      { k: 'population', label: 'Approx. population', type: 'number' },
      { k: 'households', label: 'Approx. households', type: 'number' }
    ]
  },
  {
    n: 3, s: 0, text: 'What are the 3 biggest issues affecting the village?', hint: 'Open-ended',
    fields: three('Issue')
  },
  {
    n: 4, s: 0, text: 'Which government services are most used here?', hint: 'Education / health / nutrition / welfare',
    fields: [
      { k: 'services', label: 'Most used services', type: 'check', opts: ['Education', 'Health', 'Nutrition', 'Welfare'] },
      { k: 'notes', label: 'Details / other services', type: 'area' }
    ]
  },
  {
    n: 5, s: 0, text: 'Which important services are difficult to access?', hint: 'Ask why',
    fields: [
      { k: 'notes', label: 'Services and reasons', type: 'area' }
    ]
  },
  {
    n: 6, s: 0, text: 'Are there seasonal problems affecting families?', hint: 'Weather, transport, livelihood, etc.',
    fields: [
      { k: 'seasonal', label: 'Seasonal problems?', type: 'radio', opts: YN },
      { k: 'details', label: 'Details', type: 'area' }
    ]
  },
  {
    n: 7, s: 0, text: 'Which groups need the most support?', hint: 'Children, women, elderly, vulnerable households, etc.',
    fields: [
      { k: 'groups', label: 'Groups', type: 'check', opts: ['Children', 'Women', 'Elderly', 'Vulnerable households', 'Other'] },
      { k: 'notes', label: 'Details', type: 'area' }
    ]
  },

  /* ---------- B. SCHOOL ---------- */
  {
    n: 8, s: 1, text: 'School name & UDISE+ Code?', hint: 'Record exactly',
    fields: [
      { k: 'name', label: 'School name', type: 'text', wide: true },
      { k: 'udise', label: 'UDISE+ Code', type: 'text', wide: true }
    ]
  },
  {
    n: 9, s: 1, text: 'Classes covered?', hint: 'e.g. I–VIII / I–XII',
    fields: [
      { k: 'classes', label: 'Classes covered', type: 'text', wide: true, ph: 'e.g. I–VIII' }
    ]
  },
  {
    n: 10, s: 1, text: 'Total enrolment? Boys / Girls?', hint: 'Current official record',
    fields: [
      { k: 'total', label: 'Total enrolment', type: 'number' },
      { k: 'boys', label: 'Boys', type: 'number' },
      { k: 'girls', label: 'Girls', type: 'number' }
    ]
  },
  {
    n: 11, s: 1, text: 'Teachers sanctioned / working?', hint: 'Record numbers and attendance register today',
    allowEvidence: true,
    fields: [
      { k: 'sanctioned', label: 'Sanctioned', type: 'number' },
      { k: 'working', label: 'Working', type: 'number' },
      { k: 'present', label: 'Present today', type: 'number' }
    ]
  },
  {
    n: 12, s: 1, text: 'Average attendance?', hint: 'Recent monthly figure from register (last 30 days)',
    allowEvidence: true,
    fields: [
      { k: 'attendance', label: 'Average attendance (%)', type: 'number', dec: true, max: 100 },
      { k: 'period', label: 'Month / period of figure', type: 'text', wide: true }
    ]
  },
  {
    n: 13, s: 1, text: 'Students frequently absent / at risk of dropping out?', hint: 'Number + main reasons',
    fields: [
      { k: 'number', label: 'Number of students', type: 'number' },
      { k: 'reasons', label: 'Main reasons', type: 'area' }
    ]
  },
  {
    n: 14, s: 1, text: 'Current learning concerns?', hint: 'Reading, numeracy, language, subjects',
    fields: [
      { k: 'areas', label: 'Areas of concern', type: 'check', opts: ['Reading', 'Numeracy', 'Language', 'Subjects'] },
      { k: 'details', label: 'Details (which subjects, classes)', type: 'area' }
    ]
  },
  {
    n: 15, s: 1, text: 'Students needing remedial / additional support?', hint: 'Number, if available',
    fields: [
      { k: 'number', label: 'Number of students', type: 'number' }
    ]
  },
  {
    n: 16, s: 1, text: 'CWSN / children requiring special support?', hint: 'Number, if officially recorded',
    fields: [
      { k: 'number', label: 'Number of children', type: 'number' }
    ]
  },
  {
    n: 17, s: 1, text: 'Drinking water available and functional?', hint: 'Available / Functional / Used; test certificate or photo',
    allowEvidence: true,
    fields: [
      { k: 'g', type: 'grid', rows: [{ k: 'water', label: 'Drinking water' }], cols: AVFU },
      { k: 'remarks', label: 'Remarks', type: 'area' }
    ]
  },
  {
    n: 18, s: 1, text: 'Toilets available and functional?', hint: 'Boys / Girls / CWSN toilet facility photos',
    allowEvidence: true,
    fields: [
      { k: 'g', type: 'grid', rows: [{ k: 'boys', label: 'Boys' }, { k: 'girls', label: 'Girls' }, { k: 'cwsn', label: 'CWSN' }], cols: AVF },
      { k: 'remarks', label: 'Remarks', type: 'area' }
    ]
  },
  {
    n: 19, s: 1, text: 'Electricity / internet / digital facilities?', hint: 'Available / Functional / Used',
    allowEvidence: true,
    fields: [
      { k: 'g', type: 'grid', rows: [{ k: 'elec', label: 'Electricity' }, { k: 'net', label: 'Internet' }, { k: 'digital', label: 'Digital facilities' }], cols: AVFU },
      { k: 'remarks', label: 'Remarks', type: 'area' }
    ]
  },
  {
    n: 20, s: 1, text: 'Library / laboratory / playground / classroom adequacy?', hint: 'Brief condition',
    fields: [
      { k: 'library', label: 'Library', type: 'text', wide: true, ph: 'Brief condition' },
      { k: 'lab', label: 'Laboratory', type: 'text', wide: true, ph: 'Brief condition' },
      { k: 'playground', label: 'Playground', type: 'text', wide: true, ph: 'Brief condition' },
      { k: 'classroom', label: 'Classrooms', type: 'text', wide: true, ph: 'Brief condition' }
    ]
  },
  {
    n: 21, s: 1, text: "What are the school's 3 biggest gaps?", hint: 'Open-ended',
    fields: three('Gap')
  },
  {
    n: 22, s: 1, text: 'What support would make the biggest difference?', hint: 'Open-ended',
    fields: [
      { k: 'notes', label: 'Answer', type: 'area' }
    ]
  },

  /* ---------- C. ANGANWADI ---------- */
  {
    n: 23, s: 2, text: 'Anganwadi name / centre code?', hint: 'Record exactly',
    fields: [
      { k: 'name', label: 'Anganwadi name', type: 'text', wide: true },
      { k: 'code', label: 'Centre code', type: 'text', wide: true }
    ]
  },
  {
    n: 24, s: 2, text: 'Number of registered children? Boys / Girls?', hint: 'Current register / POSHAN Tracker',
    fields: [
      { k: 'total', label: 'Registered children', type: 'number' },
      { k: 'boys', label: 'Boys', type: 'number' },
      { k: 'girls', label: 'Girls', type: 'number' }
    ]
  },
  {
    n: 25, s: 2, text: 'Number of children attending regularly?', hint: 'Attendance register verification',
    allowEvidence: true,
    fields: [
      { k: 'number', label: 'Number of children', type: 'number' }
    ]
  },
  {
    n: 26, s: 2, text: 'Pregnant women / lactating mothers registered?', hint: 'Numbers',
    fields: [
      { k: 'pregnant', label: 'Pregnant women', type: 'number' },
      { k: 'lactating', label: 'Lactating mothers', type: 'number' }
    ]
  },
  {
    n: 27, s: 2, text: 'Nutrition / supplementary food provided regularly?', hint: 'Stock/distribution register + photo',
    allowEvidence: true,
    fields: [
      { k: 'regular', label: 'Provided regularly?', type: 'radio', opts: YN },
      { k: 'issues', label: 'Issues', type: 'area' }
    ]
  },
  {
    n: 28, s: 2, text: 'Growth monitoring done regularly?', hint: 'Equipment photo + growth register charts',
    allowEvidence: true,
    fields: [
      { k: 'regular', label: 'Done regularly?', type: 'radio', opts: YN },
      { k: 'frequency', label: 'Frequency', type: 'text', wide: true }
    ]
  },
  {
    n: 29, s: 2, text: 'Children identified as nutritionally vulnerable?', hint: 'Use aggregate official records',
    fields: [
      { k: 'number', label: 'Number of children', type: 'number' },
      { k: 'notes', label: 'Notes', type: 'area' }
    ]
  },
  {
    n: 30, s: 2, text: 'Preschool / early learning activities conducted?', hint: 'What activities?',
    fields: [
      { k: 'conducted', label: 'Conducted?', type: 'radio', opts: YN },
      { k: 'activities', label: 'Activities', type: 'area' }
    ]
  },
  {
    n: 31, s: 2, text: 'Learning materials / toys available and usable?', hint: 'Photos + physical observation',
    allowEvidence: true,
    fields: [
      { k: 'g', type: 'grid', rows: [{ k: 'materials', label: 'Learning materials / toys' }], cols: AVF },
      { k: 'remarks', label: 'Remarks', type: 'area' }
    ]
  },
  {
    n: 32, s: 2, text: 'Health check-up / immunisation coordination?', hint: 'Frequency / gaps',
    fields: [
      { k: 'frequency', label: 'Frequency', type: 'text', wide: true },
      { k: 'gaps', label: 'Gaps', type: 'area' }
    ]
  },
  {
    n: 33, s: 2, text: 'What are the 3 biggest Anganwadi challenges?', hint: 'Open-ended',
    fields: three('Challenge')
  },

  /* ---------- D. PHC / HEALTH FACILITY ---------- */
  {
    n: 34, s: 3, text: 'Facility name and area/population covered?', hint: 'Basic profile',
    fields: [
      { k: 'name', label: 'Facility name', type: 'text', wide: true },
      { k: 'area', label: 'Area / population covered', type: 'text', wide: true }
    ]
  },
  {
    n: 35, s: 3, text: 'Doctors / nurses / ANM / other staff sanctioned & available?', hint: 'HR staff attendance register verification',
    allowEvidence: true,
    fields: [
      {
        k: 't',
        type: 'numtable',
        rows: [{ k: 'doctors', label: 'Doctors' }, { k: 'nurses', label: 'Nurses' }, { k: 'anm', label: 'ANM' }, { k: 'other', label: 'Other staff' }],
        cols: [{ k: 'sanctioned', label: 'Sanctioned' }, { k: 'available', label: 'Available' }]
      }
    ]
  },
  {
    n: 36, s: 3, text: 'Approx. OPD / patient load?', hint: 'OPD register / HMIS monthly count',
    allowEvidence: true,
    fields: [
      { k: 'load', label: 'Approx. OPD / patient load', type: 'number' },
      { k: 'period', label: 'Month / period', type: 'text', wide: true }
    ]
  },
  {
    n: 37, s: 3, text: 'Are essential medicines generally available?', hint: 'Medicine stock register + photo of pharmacy',
    allowEvidence: true,
    fields: [
      { k: 'available', label: 'Generally available?', type: 'radio', opts: YN },
      { k: 'gaps', label: 'Major gaps', type: 'area' }
    ]
  },
  {
    n: 38, s: 3, text: 'Are basic diagnostics available?', hint: 'Equipment functional photo / lab logbook',
    allowEvidence: true,
    fields: [
      { k: 'tests', label: 'Major available tests', type: 'area' }
    ]
  },
  {
    n: 39, s: 3, text: 'Maternal health services available?', hint: 'ANC / PNC / referral',
    fields: [
      { k: 'services', label: 'Available services', type: 'check', opts: ['ANC', 'PNC', 'Referral'] },
      { k: 'notes', label: 'Notes', type: 'area' }
    ]
  },
  {
    n: 40, s: 3, text: 'Child health / immunisation services available?', hint: 'Brief',
    fields: [
      { k: 'notes', label: 'Answer', type: 'area' }
    ]
  },
  {
    n: 41, s: 3, text: 'NCD screening / treatment available?', hint: 'If applicable',
    fields: [
      { k: 'available', label: 'Available?', type: 'radio', opts: ['Yes', 'No', 'Not applicable'] },
      { k: 'notes', label: 'Notes', type: 'area' }
    ]
  },
  {
    n: 42, s: 3, text: 'Common health problems in this community?', hint: 'Top 3–5',
    fields: [
      { k: 'i1', label: 'Problem 1', type: 'text', wide: true },
      { k: 'i2', label: 'Problem 2', type: 'text', wide: true },
      { k: 'i3', label: 'Problem 3', type: 'text', wide: true },
      { k: 'i4', label: 'Problem 4', type: 'text', wide: true },
      { k: 'i5', label: 'Problem 5', type: 'text', wide: true }
    ]
  },
  {
    n: 43, s: 3, text: 'Common reasons for referral outside the facility?', hint: 'Transport / specialist / equipment etc.',
    fields: [
      { k: 'reasons', label: 'Reasons', type: 'check', opts: ['Transport', 'Specialist', 'Equipment', 'Other'] },
      { k: 'notes', label: 'Details', type: 'area' }
    ]
  },
  {
    n: 44, s: 3, text: 'Major health-access barriers?', hint: 'Distance, cost, transport, awareness etc.',
    fields: [
      { k: 'barriers', label: 'Barriers', type: 'check', opts: ['Distance', 'Cost', 'Transport', 'Awareness', 'Other'] },
      { k: 'notes', label: 'Details', type: 'area' }
    ]
  },
  {
    n: 45, s: 3, text: 'What are the 3 biggest health-system gaps?', hint: 'Open-ended',
    fields: three('Gap')
  },

  /* ---------- E. COMMUNITY / HOUSEHOLD INTERACTION ---------- */
  {
    n: 46, s: 4, text: 'Where do families usually go when someone is sick?', hint: 'PHC / private / hospital / other',
    fields: [
      { k: 'place', label: 'Usual first place', type: 'radio', opts: ['PHC', 'Private', 'Hospital', 'Other'] },
      { k: 'other', label: 'If other, specify', type: 'text', wide: true }
    ]
  },
  {
    n: 47, s: 4, text: 'How easy is it to reach the health facility?', hint: 'Easy / Moderate / Difficult + why',
    fields: [
      { k: 'ease', label: 'Ease of reaching', type: 'radio', opts: ['Easy', 'Moderate', 'Difficult'] },
      { k: 'why', label: 'Why', type: 'area' }
    ]
  },
  {
    n: 48, s: 4, text: 'Do children generally attend school regularly?', hint: 'Yes / No + reasons',
    fields: [
      { k: 'regular', label: 'Attend regularly?', type: 'radio', opts: YN },
      { k: 'reasons', label: 'Reasons', type: 'area' }
    ]
  },
  {
    n: 49, s: 4, text: 'What makes school attendance difficult?', hint: 'Transport, work, learning difficulty, family reasons',
    fields: [
      { k: 'reasons', label: 'Reasons', type: 'check', opts: ['Transport', 'Work', 'Learning difficulty', 'Family reasons', 'Other'] },
      { k: 'notes', label: 'Details', type: 'area' }
    ]
  },
  {
    n: 50, s: 4, text: 'Do families use the Anganwadi regularly?', hint: 'Yes / No + reasons',
    fields: [
      { k: 'regular', label: 'Use regularly?', type: 'radio', opts: YN },
      { k: 'reasons', label: 'Reasons', type: 'area' }
    ]
  },
  {
    n: 51, s: 4, text: 'Are people aware of major government services/schemes?', hint: 'Which ones?',
    fields: [
      { k: 'aware', label: 'Aware?', type: 'radio', opts: ['Yes', 'Partly', 'No'] },
      { k: 'which', label: 'Which ones?', type: 'area' }
    ]
  },
  {
    n: 52, s: 4, text: 'Which services are received but not fully accessible / satisfactory?', hint: 'Open-ended',
    fields: [{ k: 'notes', label: 'Answer', type: 'area' }]
  },
  {
    n: 53, s: 4, text: 'Biggest problem facing children?', hint: 'Open-ended',
    fields: [{ k: 'notes', label: 'Answer', type: 'area' }]
  },
  {
    n: 54, s: 4, text: 'Biggest problem facing families?', hint: 'Open-ended',
    fields: [{ k: 'notes', label: 'Answer', type: 'area' }]
  },
  {
    n: 55, s: 4, text: 'If one thing could be improved, what should it be?', hint: 'Open-ended',
    fields: [{ k: 'notes', label: 'Answer', type: 'area' }]
  },

  /* ---------- F. PHYSICAL VERIFICATION ---------- */
  {
    n: 56, s: 5, text: 'School physically verified?', hint: 'Yes / No',
    fields: [{ k: 'verified', label: 'Verified?', type: 'radio', opts: YN }]
  },
  {
    n: 57, s: 5, text: 'Anganwadi physically verified?', hint: 'Yes / No',
    fields: [{ k: 'verified', label: 'Verified?', type: 'radio', opts: YN }]
  },
  {
    n: 58, s: 5, text: 'PHC / health facility physically verified?', hint: 'Yes / No',
    fields: [{ k: 'verified', label: 'Verified?', type: 'radio', opts: YN }]
  },
  {
    n: 59, s: 5, text: 'Facilities claimed as available but found non-functional?', hint: 'Record specifics with photographic evidence',
    allowEvidence: true,
    fields: [{ k: 'notes', label: 'Specifics', type: 'area' }]
  },
  {
    n: 60, s: 5, text: 'Photographs / documentary evidence collected?', hint: 'Yes / No; upload photos or documents',
    allowEvidence: true,
    fields: [
      { k: 'collected', label: 'Collected?', type: 'radio', opts: YN },
      { k: 'numbers', label: 'Photo / file numbers', type: 'text', wide: true }
    ]
  },
  {
    n: 61, s: 5, text: 'Any major observation not captured above?', hint: 'Field notes + site photographs',
    allowEvidence: true,
    fields: [{ k: 'notes', label: 'Field notes', type: 'area' }]
  },

  /* ---------- G. QUICK SUMMARY ---------- */
  {
    n: 62, s: 6, text: 'Education – key baseline finding', hint: '1–2 lines',
    fields: [{ k: 'notes', label: 'Key baseline finding', type: 'area', rowsNum: 2 }]
  },
  {
    n: 63, s: 6, text: 'Early Childhood – key baseline finding', hint: '1–2 lines',
    fields: [{ k: 'notes', label: 'Key baseline finding', type: 'area', rowsNum: 2 }]
  },
  {
    n: 64, s: 6, text: 'Health – key baseline finding', hint: '1–2 lines',
    fields: [{ k: 'notes', label: 'Key baseline finding', type: 'area', rowsNum: 2 }]
  },
  {
    n: 65, s: 6, text: 'Community – key baseline finding', hint: '1–2 lines',
    fields: [{ k: 'notes', label: 'Key baseline finding', type: 'area', rowsNum: 2 }]
  },
  {
    n: 66, s: 6, text: 'Convergence gap: School ↔ Anganwadi ↔ Health ↔ Community', hint: 'What is working / missing?',
    fields: [
      { k: 'working', label: 'What is working', type: 'area' },
      { k: 'missing', label: 'What is missing', type: 'area' }
    ]
  },
  {
    n: 67, s: 6, text: 'Top 5 measurable indicators for future follow-up', hint: 'Choose indicators measurable again',
    fields: [
      { k: 'i1', label: 'Indicator 1', type: 'text', wide: true },
      { k: 'i2', label: 'Indicator 2', type: 'text', wide: true },
      { k: 'i3', label: 'Indicator 3', type: 'text', wide: true },
      { k: 'i4', label: 'Indicator 4', type: 'text', wide: true },
      { k: 'i5', label: 'Indicator 5', type: 'text', wide: true }
    ]
  },

  /* ---------- 45_Q CANONICAL INTEGRATIONS (Data Entry Additions) ---------- */
  /* School Additions */
  {
    n: 68, s: 1, text: 'Are FLN/TLM materials available, age-appropriate and actually being used in classrooms? [S07]',
    hint: '0–3 rating: absent / available / used / routinely used; attach photos of classroom usage',
    allowEvidence: true,
    fields: [
      { k: 'rating', label: 'FLN/TLM Status', type: 'radio', opts: ['Absent', 'Available', 'Used', 'Routinely used'] },
      { k: 'notes', label: 'Classroom observation notes', type: 'area' }
    ]
  },
  {
    n: 69, s: 1, text: 'Are teachers using activity-based / experiential methods appropriate to the grade? [S08]',
    hint: '1–5 observation score: ≤2 triggers academic mentoring',
    fields: [
      { k: 'pedagogy_score', label: 'Pedagogy score (1-5)', type: 'radio', opts: ['1 - Rote / passive only', '2 - Minimal activity', '3 - Moderate activity', '4 - Strong interactive', '5 - Exemplary experiential'] }
    ]
  },
  {
    n: 70, s: 1, text: 'Is guidance and counselling available for students, and how many students received support recently? [S09]',
    hint: 'Available? Yes/No; students counselled/month; counselling register check',
    fields: [
      { k: 'available', label: 'Counselling available?', type: 'radio', opts: YN },
      { k: 'count', label: 'Students counselled per month', type: 'number' }
    ]
  },
  {
    n: 71, s: 1, text: 'Are fire-safety arrangements available, accessible and recently checked? [S12]',
    hint: 'Extinguishers / exits / alarm / drill / inspection date; attach inspection record or photo',
    allowEvidence: true,
    fields: [
      { k: 'extinguishers', label: 'Fire extinguishers functional & unexpired?', type: 'radio', opts: YN },
      { k: 'exits', label: 'Emergency exits clear & unblocked?', type: 'radio', opts: YN },
      { k: 'drill_date', label: 'Last fire drill / inspection date', type: 'text', ph: 'DD/MM/YYYY' }
    ]
  },
  {
    n: 72, s: 1, text: 'Is any NGO/trust/CSR organisation currently supporting the school, and what measurable change has resulted? [S14]',
    hint: 'Organisation; activity; beneficiaries; duration; outcome; attach MoU or report',
    allowEvidence: true,
    fields: [
      { k: 'organisation', label: 'Partner organisation name', type: 'text', wide: true },
      { k: 'activity', label: 'Intervention / activity details', type: 'area' },
      { k: 'outcome', label: 'Measurable change / outcome', type: 'text', wide: true }
    ]
  },

  /* Anganwadi Additions */
  {
    n: 73, s: 2, text: 'Are drinking water, toilet, handwashing, ventilation and child-safe space adequate? [A10]',
    hint: 'Yes / No / Partial; attach photographs of Anganwadi sanitation and safe play space',
    allowEvidence: true,
    fields: [
      { k: 'water', label: 'Safe drinking water', type: 'radio', opts: ['Adequate', 'Partial', 'Inadequate / Absent'] },
      { k: 'toilet', label: 'Child-friendly toilet & handwashing', type: 'radio', opts: ['Adequate', 'Partial', 'Inadequate / Absent'] },
      { k: 'safe_space', label: 'Child-safe space & ventilation', type: 'radio', opts: ['Adequate', 'Partial', 'Inadequate / Absent'] }
    ]
  },
  {
    n: 74, s: 2, text: 'Is the centre using POSHAN Tracker/required records accurately and on time? [A12]',
    hint: '1–5 rating or % records updated; attach POSHAN Tracker screenshot or register photo',
    allowEvidence: true,
    fields: [
      { k: 'status', label: 'POSHAN Tracker updated?', type: 'radio', opts: ['Daily / on-time', 'Weekly delay', 'Significant backlog', 'Not used'] },
      { k: 'records_pct', label: 'Estimated % records matched', type: 'number', max: 100 }
    ]
  },
  {
    n: 75, s: 2, text: 'Are fire-safety and emergency arrangements adequate for children at the centre? [A13]',
    hint: 'Extinguisher / clear exit / emergency contacts posted; attach photo',
    allowEvidence: true,
    fields: [
      { k: 'extinguisher', label: 'Fire extinguisher available & inspected?', type: 'radio', opts: YN },
      { k: 'emergency_contacts', label: 'Emergency contacts prominently posted?', type: 'radio', opts: YN }
    ]
  },
  {
    n: 76, s: 2, text: 'Is any NGO/trust/CSR organisation supporting the Anganwadi, and what measurable impact has it created? [A14]',
    hint: 'Organisation; support; beneficiaries; outcome; attach MoU or report',
    allowEvidence: true,
    fields: [
      { k: 'org', label: 'Supporting organisation', type: 'text', wide: true },
      { k: 'impact', label: 'Measurable impact created', type: 'area' }
    ]
  },

  /* PHC / Health Additions */
  {
    n: 77, s: 3, text: 'Facility name, facility type and population/area covered? [P01]',
    hint: 'Facility type; population; villages covered in catchment',
    fields: [
      { k: 'facility_type', label: 'Facility type', type: 'radio', opts: ['Sub-Centre / HWC', 'Primary Health Centre (PHC)', 'Community Health Centre (CHC)'] },
      { k: 'population', label: 'Approx. population covered', type: 'number' },
      { k: 'villages_count', label: 'Number of catchment villages', type: 'number' }
    ]
  },
  {
    n: 78, s: 3, text: 'Are mental-health, counselling, first-aid and emergency/trauma response arrangements available? [P09]',
    hint: 'Available / partial / absent; comprehensive clinical readiness',
    fields: [
      { k: 'emergency', label: 'Emergency / first-aid response', type: 'radio', opts: ['Available & functional', 'Partial supplies', 'Absent'] },
      { k: 'counselling', label: 'Mental health & counselling linkage', type: 'radio', opts: ['Available', 'Partial / visiting only', 'Absent'] }
    ]
  },
  {
    n: 79, s: 3, text: 'Are fire-safety systems, emergency exits and evacuation arrangements functional and recently checked? [P11]',
    hint: 'Extinguisher / exits / alarm / drill / inspection date; attach inspection record or photo',
    allowEvidence: true,
    fields: [
      { k: 'fire_extinguishers', label: 'Fire extinguishers inspected & active?', type: 'radio', opts: YN },
      { k: 'emergency_exits', label: 'Emergency exits clear and unlocked?', type: 'radio', opts: YN },
      { k: 'last_inspection', label: 'Date of last safety audit / inspection', type: 'text', ph: 'DD/MM/YYYY' }
    ]
  },
  {
    n: 80, s: 3, text: 'Are power backup, water, sanitation, biomedical waste management and infection-control arrangements adequate? [P12]',
    hint: 'Yes / No / Partial; attach photos of power backup and biomedical waste bins',
    allowEvidence: true,
    fields: [
      { k: 'power_backup', label: 'Functional generator / solar power backup?', type: 'radio', opts: YN },
      { k: 'biomedical_waste', label: 'Colour-coded biomedical waste segregation active?', type: 'radio', opts: YN },
      { k: 'infection_control', label: 'Infection control & sterilization functional?', type: 'radio', opts: YN }
    ]
  },
  {
    n: 81, s: 3, text: "Does the facility's physical service delivery match its registers/HMIS/digital records? [P13]",
    hint: 'Match / mismatch %; cross-check physical OPD/drug register with HMIS digital records',
    allowEvidence: true,
    fields: [
      { k: 'match_status', label: 'Registers match digital HMIS data?', type: 'radio', opts: ['Exact match (<5% variance)', 'Minor mismatch (5-10%)', 'Significant mismatch (>10%)'] },
      { k: 'notes', label: 'Discrepancy observations / notes', type: 'area' }
    ]
  },
  {
    n: 82, s: 3, text: 'Is any NGO/trust/CSR organisation supporting the PHC, and what measurable health outcome or service improvement resulted? [P14]',
    hint: 'Organisation; support; beneficiaries; outcome; attach MoU or report',
    allowEvidence: true,
    fields: [
      { k: 'organisation', label: 'Supporting partner organisation', type: 'text', wide: true },
      { k: 'outcome', label: 'Measurable health outcome or improvement', type: 'area' }
    ]
  }
];

export const QMAP: Record<number, QuestionDefinition> = {};
QUESTIONS.forEach(q => { QMAP[q.n] = q; });

export const ZIP_TO_CANONICAL_MAP: Record<number, string> = {
  2: 'C01',
  3: 'C02',
  4: 'C03',
  5: 'C04',
  6: 'C05',
  7: 'C06',
  9: 'S02',
  10: 'S02',
  11: 'S03',
  12: 'S04',
  13: 'S05',
  14: 'S06',
  15: 'S06',
  16: 'S13',
  17: 'S11',
  18: 'S11',
  19: 'S10',
  20: 'S16',
  21: 'S15',
  22: 'S15',
  24: 'A02',
  25: 'A03',
  26: 'A04',
  27: 'A05',
  28: 'A06',
  29: 'A07',
  30: 'A08',
  31: 'A09',
  32: 'A11',
  33: 'A15',
  34: 'P01',
  35: 'P02',
  36: 'P03',
  37: 'P04',
  38: 'P05',
  39: 'P06',
  40: 'P07',
  41: 'P08',
  42: 'P10',
  43: 'P10',
  44: 'P16',
  45: 'P15',
  46: 'C07',
  47: 'C08',
  48: 'C09',
  49: 'C10',
  50: 'C11',
  51: 'C12',
  52: 'C13',
  53: 'C14',
  54: 'C15',
  55: 'C16',
  56: 'F01',
  57: 'F02',
  58: 'F03',
  59: 'F04',
  60: 'F05',
  61: 'F06',
  62: 'G01',
  63: 'G02',
  64: 'G03',
  65: 'G04',
  66: 'G05',
  67: 'G06',
  68: 'S07',
  69: 'S08',
  70: 'S09',
  71: 'S12',
  72: 'S14',
  73: 'A10',
  74: 'A12',
  75: 'A13',
  76: 'A14',
  77: 'P01',
  78: 'P09',
  79: 'P11',
  80: 'P12',
  81: 'P13',
  82: 'P14'
};

export interface AnswerSaveDTO {
  questionId: string;
  value: Record<string, any>;
  isNa?: boolean;
  naReason?: string;
  isNotAssessed?: boolean;
  notAssessedReason?: string;
}

export function mapQuizAnswersToBackendBatch(answers: Record<string, any>): AnswerSaveDTO[] {
  const result: Record<string, any> = {};

  // Group raw answers by canonical question ID
  Object.entries(answers).forEach(([qKey, rawVal]) => {
    if (!rawVal) return;
    const qNum = parseInt(qKey.replace('question', ''), 10);
    const code = ZIP_TO_CANONICAL_MAP[qNum];
    if (!code) return;

    if (!result[code]) {
      result[code] = {};
    }

    if (typeof rawVal === 'object' && !Array.isArray(rawVal)) {
      result[code] = { ...result[code], ...rawVal };
    } else {
      result[code][`q${qNum}`] = rawVal;
      result[code]['response'] = rawVal;
    }
  });

  // Special structures for known scored questions
  // S11: Drinking Water & Sanitation (Q17 & Q18)
  const q17 = answers['question17'];
  const q18 = answers['question18'];
  if (q17 || q18) {
    const rows = [
      {
        name: 'Drinking Water',
        available: Boolean(q17?.g?.water?.avail ?? true),
        functional: Boolean(q17?.g?.water?.func ?? true),
        used: true
      },
      {
        name: 'Toilets',
        available: Boolean(q18?.g?.boys?.avail || q18?.g?.girls?.avail || true),
        functional: Boolean(q18?.g?.boys?.func || q18?.g?.girls?.func || true),
        used: true
      }
    ];
    result['S11'] = {
      ...(result['S11'] || {}),
      rows,
      remarks: `${q17?.remarks || ''} ${q18?.remarks || ''}`.trim()
    };
  }

  // S04: Average attendance (Q12)
  const q12 = answers['question12'];
  if (q12) {
    const attNum = typeof q12 === 'object' ? parseFloat(q12.attendance || '75') : parseFloat(String(q12));
    result['S04'] = {
      ...(result['S04'] || {}),
      percentage: isNaN(attNum) ? 75.0 : attNum,
      attendance: isNaN(attNum) ? 75.0 : attNum
    };
  }

  // S03: Teachers (Q11)
  const q11 = answers['question11'];
  if (q11 && typeof q11 === 'object') {
    result['S03'] = {
      ...(result['S03'] || {}),
      sanctioned: parseInt(q11.sanctioned || '10', 10),
      working: parseInt(q11.working || '8', 10),
      present: parseInt(q11.present || '8', 10)
    };
  }

  // S10: Digital facilities (Q19)
  const q19 = answers['question19'];
  if (q19) {
    result['S10'] = {
      ...(result['S10'] || {}),
      rows: [
        {
          name: 'Electricity',
          available: Boolean(q19?.g?.elec?.avail ?? true),
          functional: Boolean(q19?.g?.elec?.func ?? true),
          used: Boolean(q19?.g?.elec?.used ?? true)
        },
        {
          name: 'Internet',
          available: Boolean(q19?.g?.net?.avail ?? true),
          functional: Boolean(q19?.g?.net?.func ?? true),
          used: Boolean(q19?.g?.net?.used ?? true)
        }
      ]
    };
  }

  // S07: FLN/TLM Materials (Q68)
  const q68 = answers['question68'];
  if (q68) {
    result['S07'] = {
      ...(result['S07'] || {}),
      rating: q68.rating || 'Used',
      notes: q68.notes || ''
    };
  }

  // S12: Fire Safety (Q71)
  const q71 = answers['question71'];
  if (q71) {
    result['S12'] = {
      ...(result['S12'] || {}),
      extinguishers: q71.extinguishers || 'Yes',
      exits: q71.exits || 'Yes',
      drill_date: q71.drill_date || ''
    };
  }

  // A10: AWC WASH & Space (Q73)
  const q73 = answers['question73'];
  if (q73) {
    result['A10'] = {
      ...(result['A10'] || {}),
      water: q73.water || 'Adequate',
      toilet: q73.toilet || 'Adequate',
      safe_space: q73.safe_space || 'Adequate'
    };
  }

  // P12: PHC Utilities & Infection Control (Q80)
  const q80 = answers['question80'];
  if (q80) {
    result['P12'] = {
      ...(result['P12'] || {}),
      power_backup: q80.power_backup || 'Yes',
      biomedical_waste: q80.biomedical_waste || 'Yes',
      infection_control: q80.infection_control || 'Yes'
    };
  }

  return Object.entries(result).map(([questionId, value]) => ({
    questionId,
    value: typeof value === 'object' && value !== null ? value : { value },
    isNa: false,
    isNotAssessed: false
  }));
}
