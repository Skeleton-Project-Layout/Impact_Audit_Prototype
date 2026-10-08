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

const csv = parseCSV(fs.readFileSync(path.join(__dirname, '..', 'question_merge_map.csv'), 'utf8'));
const headers = csv[0].map(h => h.trim());
const data = csv.slice(1).map(row => {
  const obj = {};
  headers.forEach((h, i) => obj[h] = (row[i] || '').trim());
  return obj;
});

const scored = data.filter(r => r.scored_default === 'Y');
console.log('Scored questions count:', scored.length);
scored.forEach(q => {
  console.log(`[${q.merged_id}] (${q.severity}) rubric: ${q.rubric_type_default}`);
  console.log(`   Text: ${q.canonical_text}`);
  console.log(`   Response Type: ${q.response_type}`);
  console.log(`   Red Flag: ${q.red_flag_logic}`);
  console.log(`   Notes: ${q.notes}`);
  console.log('---');
});
