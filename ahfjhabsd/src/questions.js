/* ABHISARAN – Village Baseline & Impact Assessment Field Form (Page 1 only: Q1–Q67) */

const SECTIONS = [
  { id: 'A', short: 'Village & Community', title: 'A. VILLAGE & COMMUNITY PROFILE' },
  { id: 'B', short: 'School', title: 'B. SCHOOL – HEAD TEACHER / PRINCIPAL' },
  { id: 'C', short: 'Anganwadi', title: 'C. ANGANWADI – AWW' },
  { id: 'D', short: 'Health Facility', title: 'D. PHC / HEALTH FACILITY – MEDICAL OFFICER / STAFF' },
  { id: 'E', short: 'Community', title: 'E. COMMUNITY / HOUSEHOLD INTERACTION' },
  { id: 'F', short: 'Physical Verification', title: 'F. PHYSICAL VERIFICATION – FIELD TEAM' },
  { id: 'G', short: 'Quick Summary', title: 'G. ABHISARAN BASELINE – QUICK SUMMARY' }
];

/* field builders */
const T = (k, label, o = {}) => ({ k, label, type: 'text', ...o });
const N = (k, label, o = {}) => ({ k, label, type: 'number', ...o });
const A = (k, label, o = {}) => ({ k, label, type: 'area', ...o });
const R = (k, label, opts, o = {}) => ({ k, label, type: 'radio', opts, ...o });
const C = (k, label, opts, o = {}) => ({ k, label, type: 'check', opts, ...o });
const G = (k, rows, cols) => ({ k, type: 'grid', rows, cols });
const NT = (k, rows, cols) => ({ k, type: 'numtable', rows, cols });
const YN = ['Yes', 'No'];
const Q = (n, s, text, hint, fields) => ({ n, s, text, hint, fields });
const three = (p) => [T('i1', p + ' 1'), T('i2', p + ' 2'), T('i3', p + ' 3')];
const AVF = [{ k: 'avail', label: 'Available' }, { k: 'func', label: 'Functional' }];
const AVFU = [...AVF, { k: 'used', label: 'Used' }];

const QUESTIONS = [
  /* ---------- A. VILLAGE & COMMUNITY PROFILE ---------- */
  Q(1, 0, 'Village name / locality?', 'Basic identification', [
    T('village', 'Village name', { wide: true, sync: 'village' }), T('locality', 'Locality', { wide: true })]),
  Q(2, 0, 'Approx. population / households?', 'Ask village head / official record', [
    N('population', 'Approx. population'), N('households', 'Approx. households')]),
  Q(3, 0, 'What are the 3 biggest issues affecting the village?', 'Open-ended', three('Issue').map(f => ({ ...f, wide: true }))),
  Q(4, 0, 'Which government services are most used here?', 'Education / health / nutrition / welfare', [
    C('services', 'Most used services', ['Education', 'Health', 'Nutrition', 'Welfare']),
    A('notes', 'Details / other services')]),
  Q(5, 0, 'Which important services are difficult to access?', 'Ask why', [
    A('notes', 'Services and reasons')]),
  Q(6, 0, 'Are there seasonal problems affecting families?', 'Weather, transport, livelihood, etc.', [
    R('seasonal', 'Seasonal problems?', YN), A('details', 'Details')]),
  Q(7, 0, 'Which groups need the most support?', 'Children, women, elderly, vulnerable households, etc.', [
    C('groups', 'Groups', ['Children', 'Women', 'Elderly', 'Vulnerable households', 'Other']),
    A('notes', 'Details')]),

  /* ---------- B. SCHOOL ---------- */
  Q(8, 1, 'School name & UDISE+ Code?', 'Record exactly', [
    T('name', 'School name', { wide: true }), T('udise', 'UDISE+ Code', { wide: true })]),
  Q(9, 1, 'Classes covered?', 'e.g. I–VIII / I–XII', [
    T('classes', 'Classes covered', { wide: true, ph: 'e.g. I–VIII' })]),
  Q(10, 1, 'Total enrolment? Boys / Girls?', 'Current official record', [
    N('total', 'Total enrolment'), N('boys', 'Boys'), N('girls', 'Girls')]),
  Q(11, 1, 'Teachers sanctioned / working?', 'Record numbers', [
    N('sanctioned', 'Sanctioned'), N('working', 'Working')]),
  Q(12, 1, 'Average attendance?', 'Recent monthly figure if available', [
    N('attendance', 'Average attendance (%)', { dec: true, max: 100 }), T('period', 'Month / period of figure', { wide: true })]),
  Q(13, 1, 'Students frequently absent / at risk of dropping out?', 'Number + main reasons', [
    N('number', 'Number of students'), A('reasons', 'Main reasons')]),
  Q(14, 1, 'Current learning concerns?', 'Reading, numeracy, language, subjects', [
    C('areas', 'Areas of concern', ['Reading', 'Numeracy', 'Language', 'Subjects']),
    A('details', 'Details (which subjects, classes)')]),
  Q(15, 1, 'Students needing remedial / additional support?', 'Number, if available', [
    N('number', 'Number of students')]),
  Q(16, 1, 'CWSN / children requiring special support?', 'Number, if officially recorded', [
    N('number', 'Number of children')]),
  Q(17, 1, 'Drinking water available and functional?', 'Available / Functional / Used', [
    G('g', [{ k: 'water', label: 'Drinking water' }], AVFU), A('remarks', 'Remarks')]),
  Q(18, 1, 'Toilets available and functional?', 'Boys / Girls / CWSN', [
    G('g', [{ k: 'boys', label: 'Boys' }, { k: 'girls', label: 'Girls' }, { k: 'cwsn', label: 'CWSN' }], AVF),
    A('remarks', 'Remarks')]),
  Q(19, 1, 'Electricity / internet / digital facilities?', 'Available / Functional / Used', [
    G('g', [{ k: 'elec', label: 'Electricity' }, { k: 'net', label: 'Internet' }, { k: 'digital', label: 'Digital facilities' }], AVFU),
    A('remarks', 'Remarks')]),
  Q(20, 1, 'Library / laboratory / playground / classroom adequacy?', 'Brief condition', [
    T('library', 'Library', { wide: true, ph: 'Brief condition' }),
    T('lab', 'Laboratory', { wide: true, ph: 'Brief condition' }),
    T('playground', 'Playground', { wide: true, ph: 'Brief condition' }),
    T('classroom', 'Classrooms', { wide: true, ph: 'Brief condition' })]),
  Q(21, 1, "What are the school's 3 biggest gaps?", 'Open-ended', three('Gap').map(f => ({ ...f, wide: true }))),
  Q(22, 1, 'What support would make the biggest difference?', 'Open-ended', [A('notes', 'Answer')]),

  /* ---------- C. ANGANWADI ---------- */
  Q(23, 2, 'Anganwadi name / centre code?', 'Record exactly', [
    T('name', 'Anganwadi name', { wide: true }), T('code', 'Centre code', { wide: true })]),
  Q(24, 2, 'Number of registered children? Boys / Girls?', 'Current register', [
    N('total', 'Registered children'), N('boys', 'Boys'), N('girls', 'Girls')]),
  Q(25, 2, 'Number of children attending regularly?', 'If available', [
    N('number', 'Number of children')]),
  Q(26, 2, 'Pregnant women / lactating mothers registered?', 'Numbers', [
    N('pregnant', 'Pregnant women'), N('lactating', 'Lactating mothers')]),
  Q(27, 2, 'Nutrition / supplementary food provided regularly?', 'Yes / No + issues', [
    R('regular', 'Provided regularly?', YN), A('issues', 'Issues')]),
  Q(28, 2, 'Growth monitoring done regularly?', 'Yes / No + frequency', [
    R('regular', 'Done regularly?', YN), T('frequency', 'Frequency', { wide: true })]),
  Q(29, 2, 'Children identified as nutritionally vulnerable?', 'Use aggregate official records', [
    N('number', 'Number of children'), A('notes', 'Notes')]),
  Q(30, 2, 'Preschool / early learning activities conducted?', 'What activities?', [
    R('conducted', 'Conducted?', YN), A('activities', 'Activities')]),
  Q(31, 2, 'Learning materials / toys available and usable?', 'Available / Functional', [
    G('g', [{ k: 'materials', label: 'Learning materials / toys' }], AVF), A('remarks', 'Remarks')]),
  Q(32, 2, 'Health check-up / immunisation coordination?', 'Frequency / gaps', [
    T('frequency', 'Frequency', { wide: true }), A('gaps', 'Gaps')]),
  Q(33, 2, 'What are the 3 biggest Anganwadi challenges?', 'Open-ended', three('Challenge').map(f => ({ ...f, wide: true }))),

  /* ---------- D. PHC / HEALTH FACILITY ---------- */
  Q(34, 3, 'Facility name and area/population covered?', 'Basic profile', [
    T('name', 'Facility name', { wide: true }), T('area', 'Area / population covered', { wide: true })]),
  Q(35, 3, 'Doctors / nurses / ANM / other staff sanctioned & available?', 'Numbers', [
    NT('t', [{ k: 'doctors', label: 'Doctors' }, { k: 'nurses', label: 'Nurses' }, { k: 'anm', label: 'ANM' }, { k: 'other', label: 'Other staff' }],
      [{ k: 'sanctioned', label: 'Sanctioned' }, { k: 'available', label: 'Available' }])]),
  Q(36, 3, 'Approx. OPD / patient load?', 'Recent month if possible', [
    N('load', 'Approx. OPD / patient load'), T('period', 'Month / period', { wide: true })]),
  Q(37, 3, 'Are essential medicines generally available?', 'Yes / No + major gaps', [
    R('available', 'Generally available?', YN), A('gaps', 'Major gaps')]),
  Q(38, 3, 'Are basic diagnostics available?', 'List major available tests', [
    A('tests', 'Major available tests')]),
  Q(39, 3, 'Maternal health services available?', 'ANC / PNC / referral', [
    C('services', 'Available services', ['ANC', 'PNC', 'Referral']), A('notes', 'Notes')]),
  Q(40, 3, 'Child health / immunisation services available?', 'Brief', [A('notes', 'Answer')]),
  Q(41, 3, 'NCD screening / treatment available?', 'If applicable', [
    R('available', 'Available?', ['Yes', 'No', 'Not applicable']), A('notes', 'Notes')]),
  Q(42, 3, 'Common health problems in this community?', 'Top 3–5', [
    T('i1', 'Problem 1', { wide: true }), T('i2', 'Problem 2', { wide: true }), T('i3', 'Problem 3', { wide: true }),
    T('i4', 'Problem 4', { wide: true }), T('i5', 'Problem 5', { wide: true })]),
  Q(43, 3, 'Common reasons for referral outside the facility?', 'Transport / specialist / equipment etc.', [
    C('reasons', 'Reasons', ['Transport', 'Specialist', 'Equipment', 'Other']), A('notes', 'Details')]),
  Q(44, 3, 'Major health-access barriers?', 'Distance, cost, transport, awareness etc.', [
    C('barriers', 'Barriers', ['Distance', 'Cost', 'Transport', 'Awareness', 'Other']), A('notes', 'Details')]),
  Q(45, 3, 'What are the 3 biggest health-system gaps?', 'Open-ended', three('Gap').map(f => ({ ...f, wide: true }))),

  /* ---------- E. COMMUNITY / HOUSEHOLD INTERACTION ---------- */
  Q(46, 4, 'Where do families usually go when someone is sick?', 'PHC / private / hospital / other', [
    R('place', 'Usual first place', ['PHC', 'Private', 'Hospital', 'Other']), T('other', 'If other, specify', { wide: true })]),
  Q(47, 4, 'How easy is it to reach the health facility?', 'Easy / Moderate / Difficult + why', [
    R('ease', 'Ease of reaching', ['Easy', 'Moderate', 'Difficult']), A('why', 'Why')]),
  Q(48, 4, 'Do children generally attend school regularly?', 'Yes / No + reasons', [
    R('regular', 'Attend regularly?', YN), A('reasons', 'Reasons')]),
  Q(49, 4, 'What makes school attendance difficult?', 'Transport, work, learning difficulty, family reasons', [
    C('reasons', 'Reasons', ['Transport', 'Work', 'Learning difficulty', 'Family reasons', 'Other']), A('notes', 'Details')]),
  Q(50, 4, 'Do families use the Anganwadi regularly?', 'Yes / No + reasons', [
    R('regular', 'Use regularly?', YN), A('reasons', 'Reasons')]),
  Q(51, 4, 'Are people aware of major government services/schemes?', 'Which ones?', [
    R('aware', 'Aware?', ['Yes', 'Partly', 'No']), A('which', 'Which ones?')]),
  Q(52, 4, 'Which services are received but not fully accessible / satisfactory?', 'Open-ended', [A('notes', 'Answer')]),
  Q(53, 4, 'Biggest problem facing children?', 'Open-ended', [A('notes', 'Answer')]),
  Q(54, 4, 'Biggest problem facing families?', 'Open-ended', [A('notes', 'Answer')]),
  Q(55, 4, 'If one thing could be improved, what should it be?', 'Open-ended', [A('notes', 'Answer')]),

  /* ---------- F. PHYSICAL VERIFICATION ---------- */
  Q(56, 5, 'School physically verified?', 'Yes / No', [R('verified', 'Verified?', YN)]),
  Q(57, 5, 'Anganwadi physically verified?', 'Yes / No', [R('verified', 'Verified?', YN)]),
  Q(58, 5, 'PHC / health facility physically verified?', 'Yes / No', [R('verified', 'Verified?', YN)]),
  Q(59, 5, 'Facilities claimed as available but found non-functional?', 'Record specifics', [A('notes', 'Specifics')]),
  Q(60, 5, 'Photographs / documentary evidence collected?', 'Yes / No; note photo/file numbers', [
    R('collected', 'Collected?', YN), T('numbers', 'Photo / file numbers', { wide: true })]),
  Q(61, 5, 'Any major observation not captured above?', 'Field notes', [A('notes', 'Field notes')]),

  /* ---------- G. QUICK SUMMARY ---------- */
  Q(62, 6, 'Education – key baseline finding', '1–2 lines', [A('notes', 'Key baseline finding', { rows: 2 })]),
  Q(63, 6, 'Early Childhood – key baseline finding', '1–2 lines', [A('notes', 'Key baseline finding', { rows: 2 })]),
  Q(64, 6, 'Health – key baseline finding', '1–2 lines', [A('notes', 'Key baseline finding', { rows: 2 })]),
  Q(65, 6, 'Community – key baseline finding', '1–2 lines', [A('notes', 'Key baseline finding', { rows: 2 })]),
  Q(66, 6, 'Convergence gap: School ↔ Anganwadi ↔ Health ↔ Community', 'What is working / missing?', [
    A('working', 'What is working'), A('missing', 'What is missing')]),
  Q(67, 6, 'Top 5 measurable indicators for future follow-up', 'Choose indicators measurable again', [
    T('i1', 'Indicator 1', { wide: true }), T('i2', 'Indicator 2', { wide: true }), T('i3', 'Indicator 3', { wide: true }),
    T('i4', 'Indicator 4', { wide: true }), T('i5', 'Indicator 5', { wide: true })])
];

const QMAP = {};
QUESTIONS.forEach(q => { QMAP[q.n] = q; });
