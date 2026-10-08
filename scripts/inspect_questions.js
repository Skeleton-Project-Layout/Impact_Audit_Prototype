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
        // ignore
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
const data = csv.slice(1).map(row => {
  const obj = {};
  headers.forEach((h, i) => obj[h] = (row[i] || '').trim());
  return obj;
});

const auditQuestions = data.filter(r => r.merge_action !== 'MOVED_TO_REGISTRY' && r.merge_action !== 'RETIRED');
console.log('Audit questions count:', auditQuestions.length);

const rubricTypes = {};
const sections = {};
const domains = {};
const scored = { Y: 0, N: 0 };
const severities = {};

auditQuestions.forEach(q => {
  rubricTypes[q.rubric_type_default] = (rubricTypes[q.rubric_type_default] || 0) + 1;
  sections[q.section] = (sections[q.section] || 0) + 1;
  domains[q.applies_to] = (domains[q.applies_to] || 0) + 1;
  scored[q.scored_default] = (scored[q.scored_default] || 0) + 1;
  severities[q.severity] = (severities[q.severity] || 0) + 1;
});

console.log('Sections:', sections);
console.log('Domains:', domains);
console.log('Scored:', scored);
console.log('Severities:', severities);
console.log('Rubric types:', rubricTypes);
