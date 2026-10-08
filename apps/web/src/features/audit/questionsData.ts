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
    n: 11, s: 1, text: 'Teachers sanctioned / working?', hint: 'Record numbers',
    fields: [
      { k: 'sanctioned', label: 'Sanctioned', type: 'number' },
      { k: 'working', label: 'Working', type: 'number' }
    ]
  },
  {
    n: 12, s: 1, text: 'Average attendance?', hint: 'Recent monthly figure if available',
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
    n: 17, s: 1, text: 'Drinking water available and functional?', hint: 'Available / Functional / Used',
    fields: [
      { k: 'g', type: 'grid', rows: [{ k: 'water', label: 'Drinking water' }], cols: AVFU },
      { k: 'remarks', label: 'Remarks', type: 'area' }
    ]
  },
  {
    n: 18, s: 1, text: 'Toilets available and functional?', hint: 'Boys / Girls / CWSN',
    fields: [
      { k: 'g', type: 'grid', rows: [{ k: 'boys', label: 'Boys' }, { k: 'girls', label: 'Girls' }, { k: 'cwsn', label: 'CWSN' }], cols: AVF },
      { k: 'remarks', label: 'Remarks', type: 'area' }
    ]
  },
  {
    n: 19, s: 1, text: 'Electricity / internet / digital facilities?', hint: 'Available / Functional / Used',
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
    n: 24, s: 2, text: 'Number of registered children? Boys / Girls?', hint: 'Current register',
    fields: [
      { k: 'total', label: 'Registered children', type: 'number' },
      { k: 'boys', label: 'Boys', type: 'number' },
      { k: 'girls', label: 'Girls', type: 'number' }
    ]
  },
  {
    n: 25, s: 2, text: 'Number of children attending regularly?', hint: 'If available',
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
    n: 27, s: 2, text: 'Nutrition / supplementary food provided regularly?', hint: 'Yes / No + issues',
    fields: [
      { k: 'regular', label: 'Provided regularly?', type: 'radio', opts: YN },
      { k: 'issues', label: 'Issues', type: 'area' }
    ]
  },
  {
    n: 28, s: 2, text: 'Growth monitoring done regularly?', hint: 'Yes / No + frequency',
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
    n: 31, s: 2, text: 'Learning materials / toys available and usable?', hint: 'Available / Functional',
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
    n: 35, s: 3, text: 'Doctors / nurses / ANM / other staff sanctioned & available?', hint: 'Numbers',
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
    n: 36, s: 3, text: 'Approx. OPD / patient load?', hint: 'Recent month if possible',
    fields: [
      { k: 'load', label: 'Approx. OPD / patient load', type: 'number' },
      { k: 'period', label: 'Month / period', type: 'text', wide: true }
    ]
  },
  {
    n: 37, s: 3, text: 'Are essential medicines generally available?', hint: 'Yes / No + major gaps',
    fields: [
      { k: 'available', label: 'Generally available?', type: 'radio', opts: YN },
      { k: 'gaps', label: 'Major gaps', type: 'area' }
    ]
  },
  {
    n: 38, s: 3, text: 'Are basic diagnostics available?', hint: 'List major available tests',
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
    n: 59, s: 5, text: 'Facilities claimed as available but found non-functional?', hint: 'Record specifics',
    fields: [{ k: 'notes', label: 'Specifics', type: 'area' }]
  },
  {
    n: 60, s: 5, text: 'Photographs / documentary evidence collected?', hint: 'Yes / No; note photo/file numbers',
    fields: [
      { k: 'collected', label: 'Collected?', type: 'radio', opts: YN },
      { k: 'numbers', label: 'Photo / file numbers', type: 'text', wide: true }
    ]
  },
  {
    n: 61, s: 5, text: 'Any major observation not captured above?', hint: 'Field notes',
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
  }
];

export const QMAP: Record<number, QuestionDefinition> = {};
QUESTIONS.forEach(q => { QMAP[q.n] = q; });
