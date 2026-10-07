/* Dependency-free PDF generator (A4, built-in Helvetica fonts) + ABHISARAN record layout */

const PDFW = (() => {
  /* Helvetica / Helvetica-Bold advance widths (1/1000 em) for ASCII 32..126 */
  const REG = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
    556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015,
    667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611,
    278, 278, 278, 469, 556, 333,
    556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500,
    334, 260, 334, 584];
  const BOLD = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
    556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975,
    722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611,
    333, 278, 333, 584, 556, 333,
    556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500,
    389, 280, 389, 584];

  /* characters outside ASCII that WinAnsi can show */
  const WIN = {
    0x20AC: 0x80, 0x2026: 0x85, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94,
    0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x2122: 0x99
  };
  const SPECIAL_W = { 0x2026: [1000, 1000], 0x2018: [222, 278], 0x2019: [222, 278], 0x201C: [333, 500], 0x201D: [333, 500],
    0x2022: [350, 350], 0x2013: [556, 556], 0x2014: [1000, 1000], 0x2122: [1000, 1000], 0x20AC: [556, 556] };

  function charW(ch, bold) {
    const c = ch.charCodeAt(0);
    const tbl = bold ? BOLD : REG;
    if (c >= 32 && c <= 126) return tbl[c - 32];
    if (SPECIAL_W[c]) return SPECIAL_W[c][bold ? 1 : 0];
    if (c === 0xB0) return 400;
    if (c >= 160 && c <= 255) {
      const b = ch.normalize('NFD').charCodeAt(0);
      if (b >= 32 && b <= 126) return tbl[b - 32];
      return 556;
    }
    return 556; /* shown as '?' */
  }

  /* unicode string -> WinAnsi byte string */
  function toWin(s) {
    let o = '';
    for (const ch of norm(s)) {
      const c = ch.codePointAt(0);
      if (c >= 32 && c <= 126) o += ch;
      else if (c >= 160 && c <= 255) o += String.fromCharCode(c);
      else if (WIN[c]) o += String.fromCharCode(WIN[c]);
      else if (c === 9) o += ' ';
      else o += '?';
    }
    return o;
  }
  function esc(win) {
    let o = '';
    for (let i = 0; i < win.length; i++) {
      const c = win.charCodeAt(i), ch = win[i];
      if (ch === '(' || ch === ')' || ch === '\\') o += '\\' + ch;
      else if (c < 32 || c > 126) o += '\\' + c.toString(8).padStart(3, '0');
      else o += ch;
    }
    return o;
  }

  const SYM = { '\u2265': '>=', '\u2264': '<=', '\u2192': '->', '\u2190': '<-', '\u20B9': 'Rs ', '\u2248': '~', '\u2212': '-', '\u2011': '-', '\u00A0': ' ', '\u2713': 'Yes', '\u00D7': 'x' };
  const norm = s => String(s).replace(/[\u2265\u2264\u2192\u2190\u20B9\u2248\u2212\u2011\u00A0\u2713\u00D7]/g, c => SYM[c]);

  const fmt = n => String(Math.round(n * 100) / 100);
  const col = c => c.map(v => fmt(v / 255)).join(' ');

  class Doc {
    constructor() { this.W = 595.28; this.H = 841.89; this.pages = []; this.cur = null; }
    addPage() { this.cur = []; this.pages.push(this.cur); return this.pages.length; }
    setPage(i) { this.cur = this.pages[i - 1]; }
    width(s, font, size) {
      const bold = font === 'F2';
      let w = 0;
      for (const ch of norm(s)) w += charW(ch, bold);
      return w * size / 1000;
    }
    text(s, x, y, o = {}) {
      const font = o.font || 'F1', size = o.size || 10, color = o.color || [0, 0, 0];
      this.cur.push(`BT /${font} ${fmt(size)} Tf ${col(color)} rg ${fmt(x)} ${fmt(this.H - y)} Td (${esc(toWin(s))}) Tj ET`);
    }
    line(x1, y1, x2, y2, w, color) {
      this.cur.push(`${fmt(w)} w ${col(color)} RG ${fmt(x1)} ${fmt(this.H - y1)} m ${fmt(x2)} ${fmt(this.H - y2)} l S`);
    }
    rect(x, y, w, h, o = {}) {
      let op = '';
      if (o.fill) op += `${col(o.fill)} rg `;
      if (o.stroke) op += `${fmt(o.lw || 0.6)} w ${col(o.stroke)} RG `;
      const paint = o.fill && o.stroke ? 'B' : o.fill ? 'f' : 'S';
      this.cur.push(`${op}${fmt(x)} ${fmt(this.H - y - h)} ${fmt(w)} ${fmt(h)} re ${paint}`);
    }
    build(title) {
      const n = this.pages.length;
      const body = [];
      body[1] = '<< /Type /Catalog /Pages 2 0 R >>';
      const kids = [];
      for (let i = 0; i < n; i++) kids.push(`${6 + 2 * i} 0 R`);
      body[2] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${n} >>`;
      body[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
      body[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
      body[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>';
      for (let i = 0; i < n; i++) {
        const data = this.pages[i].join('\n');
        body[6 + 2 * i] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${fmt(this.W)} ${fmt(this.H)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${7 + 2 * i} 0 R >>`;
        body[7 + 2 * i] = `<< /Length ${data.length} >>\nstream\n${data}\nendstream`;
      }
      const infoNo = 6 + 2 * n;
      const d = new Date();
      const p2 = v => String(v).padStart(2, '0');
      const stamp = `D:${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`;
      body[infoNo] = `<< /Title (${esc(toWin(title))}) /Producer (ABHISARAN Field Form) /Creator (ABHISARAN Field Form) /CreationDate (${stamp}) >>`;
      let out = '%PDF-1.4\n%âãÏÓ\n';
      const offs = [];
      for (let i = 1; i <= infoNo; i++) {
        offs[i] = out.length;
        out += `${i} 0 obj\n${body[i]}\nendobj\n`;
      }
      const xref = out.length;
      out += `xref\n0 ${infoNo + 1}\n0000000000 65535 f \n`;
      for (let i = 1; i <= infoNo; i++) out += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
      out += `trailer\n<< /Size ${infoNo + 1} /Root 1 0 R /Info ${infoNo} 0 R >>\nstartxref\n${xref}\n%%EOF`;
      const bytes = new Uint8Array(out.length);
      for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
      return bytes;
    }
  }

  /* ------------------------------------------------------------------ */
  const COL = {
    accent: [11, 107, 92], ink: [24, 36, 33], ans: [8, 52, 110], gray: [104, 116, 112],
    line: [196, 205, 201], white: [255, 255, 255], soft: [226, 240, 236]
  };
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? `${m[3]} ${MON[+m[2] - 1]} ${m[1]}` : (iso || '');
  }

  function wrap(d, str, font, size, maxW) {
    const out = [];
    String(str).split(/\r\n|\r|\n/).forEach(par => {
      if (par.trim() === '') { out.push(''); return; }
      let line = '';
      par.split(' ').forEach(word => {
        let w = word;
        const test = line ? line + ' ' + w : w;
        if (d.width(test, font, size) <= maxW) { line = test; return; }
        if (line) { out.push(line); line = ''; }
        while (d.width(w, font, size) > maxW) {
          let cut = 1;
          while (cut < w.length && d.width(w.slice(0, cut + 1), font, size) <= maxW) cut++;
          out.push(w.slice(0, cut));
          w = w.slice(cut);
        }
        line = w;
      });
      out.push(line);
    });
    return out;
  }

  function fit(d, str, font, size, maxW) {
    str = String(str || '');
    if (d.width(str, font, size) <= maxW) return str;
    while (str.length > 1 && d.width(str + '...', font, size) > maxW) str = str.slice(0, -1);
    return str + '...';
  }

  /* turn a question + its answers into printable rows */
  function pdfRows(q, rec) {
    const a = rec.answers['question' + q.n] || {};
    const rows = [];
    const blank = '____';
    q.fields.forEach(f => {
      const v = a[f.k];
      if (f.type === 'grid') {
        f.rows.forEach(rw => {
          const parts = f.cols.map(c => `${c.label}: ${a[rw.k + '_' + c.k] || blank}`);
          rows.push({ label: rw.label, value: parts.join('      '), minLines: 1 });
        });
      } else if (f.type === 'numtable') {
        f.rows.forEach(rw => {
          const parts = f.cols.map(c => `${c.label}: ${a[rw.k + '_' + c.k] !== undefined ? a[rw.k + '_' + c.k] : blank}`);
          rows.push({ label: rw.label, value: parts.join('      '), minLines: 1 });
        });
      } else if (f.type === 'check') {
        rows.push({ label: f.label, value: (v || []).join(', '), minLines: 1 });
      } else if (f.type === 'area') {
        const label = f.label === 'Answer' ? '' : f.label;
        rows.push({ label, value: v || '', minLines: 2 });
      } else {
        let val = v || '';
        if (f.type === 'number' && f.max === 100 && val !== '') val += ' %';
        rows.push({ label: f.label, value: val, minLines: 1 });
      }
    });
    return rows;
  }

  function buildPdf(records, opts = {}) {
    const numOf = ri => (opts.nums ? opts.nums[ri] : ri + 1);
    const totalRecs = opts.total || records.length;
    const d = new Doc();
    const PW = d.W, PH = d.H, M = 42, CW = PW - 2 * M, TOP = 66, BOT = PH - 54, LH = 15.5;
    const meta = [];
    let y = 0, curRi = 0;

    function newPage(ri, first) {
      d.addPage();
      meta.push({ ri, first });
      curRi = ri;
      y = first ? 0 : TOP;
    }
    function ensure(h) { if (y + h > BOT) newPage(curRi, false); }

    function titleBlock(rec, ri) {
      const band = 66;
      d.rect(0, 0, PW, band, { fill: COL.accent });
      const title = 'ABHISARAN – VILLAGE BASELINE & IMPACT ASSESSMENT FIELD FORM';
      let size = 12.5;
      while (d.width(title, 'F2', size) > CW && size > 8) size -= 0.25;
      d.text(title, M, 30, { font: 'F2', size, color: COL.white });
      d.text('East Khasi Hills Pilot', M, 50, { font: 'F1', size: 11, color: [214, 238, 232] });
      y = band + 18;
      const bh = 38, gap = 10;
      const w1 = 130, w3 = 150, w2 = CW - w1 - w3 - 2 * gap;
      const boxes = [
        { x: M, w: w1, label: 'DATE', value: fmtDate(rec.date) },
        { x: M + w1 + gap, w: w2, label: 'VILLAGE', value: rec.village || '' },
        { x: M + w1 + w2 + 2 * gap, w: w3, label: 'RECORD', value: `Village Record ${numOf(ri)} of ${totalRecs}` }
      ];
      boxes.forEach(b => {
        d.rect(b.x, y, b.w, bh, { fill: [247, 250, 249], stroke: COL.line, lw: 0.7 });
        d.text(b.label, b.x + 8, y + 12, { font: 'F2', size: 7, color: COL.gray });
        d.text(fit(d, b.value, 'F2', 10.5, b.w - 16), b.x + 8, y + 29, { font: 'F2', size: 10.5, color: COL.ans });
      });
      y += bh + 18;
    }

    function sectionHeading(s, extra) {
      ensure(24 + extra);
      d.rect(M, y, CW, 20, { fill: COL.accent });
      d.text(s.title, M + 8, y + 13.6, { font: 'F2', size: 9.5, color: COL.white });
      y += 20 + 9;
    }

    function drawArrowTitle(text, x, base, size) {
      const segs = text.split('↔').map(s => s.trim());
      let cx = x;
      segs.forEach((s, i) => {
        if (i > 0) {
          cx += 5;
          const ax = cx, bx = cx + 14, ay = base - size * 0.32;
          d.line(ax, ay, bx, ay, 0.9, COL.ink);
          d.line(ax, ay, ax + 3.2, ay - 2.4, 0.9, COL.ink);
          d.line(ax, ay, ax + 3.2, ay + 2.4, 0.9, COL.ink);
          d.line(bx, ay, bx - 3.2, ay - 2.4, 0.9, COL.ink);
          d.line(bx, ay, bx - 3.2, ay + 2.4, 0.9, COL.ink);
          cx = bx + 5;
        }
        d.text(s, cx, base, { font: 'F2', size, color: COL.ink });
        cx += d.width(s, 'F2', size);
      });
    }
    function arrowTitleWidth(text, size) {
      const segs = text.split('↔').map(s => s.trim());
      return segs.reduce((w, s) => w + d.width(s, 'F2', size), 0) + (segs.length - 1) * 24;
    }

    function drawRow(row) {
      const ax = M + 26, aw = CW - 26;
      const labelW = row.label ? 128 : 0;
      const vx = ax + labelW, vw = aw - labelW;
      const lines = row.value !== '' ? wrap(d, row.value, 'F1', 9.5, vw - 4) : [];
      const n = Math.max(lines.length, row.minLines);
      for (let i = 0; i < n; i++) {
        ensure(LH);
        const base = y + LH - 4.8;
        if (i === 0 && row.label) {
          let ls = 8;
          while (d.width(row.label, 'F2', ls) > labelW - 8 && ls > 6) ls -= 0.25;
          d.text(row.label, ax, base, { font: 'F2', size: ls, color: COL.gray });
        }
        if (lines[i]) d.text(lines[i], vx, base, { font: 'F1', size: 9.5, color: COL.ans });
        d.line(vx, y + LH - 1.6, ax + aw, y + LH - 1.6, 0.4, COL.line);
        y += LH;
      }
    }

    function drawQuestion(q, rec) {
      const nx = M + 26, qw = CW - 26;
      const arrow = q.text.indexOf('↔') >= 0 && arrowTitleWidth(q.text, 10) <= qw;
      const tlines = arrow ? [q.text] : wrap(d, q.text.replace(/↔/g, '<->'), 'F2', 10, qw);
      const rows = pdfRows(q, rec);
      ensure(tlines.length * 13 + 13 + LH + 2);
      d.text(q.n + '.', M, y + 10, { font: 'F2', size: 10, color: COL.accent });
      tlines.forEach((t, i) => {
        if (arrow) drawArrowTitle(t, nx, y + 10, 10);
        else d.text(t, nx, y + 10 + i * 13, { font: 'F2', size: 10, color: COL.ink });
      });
      y += tlines.length * 13;
      if (q.hint) { d.text(q.hint, nx, y + 8, { font: 'F3', size: 8.2, color: COL.gray }); y += 12; }
      y += 3;
      rows.forEach(drawRow);
      y += 11;
    }

    records.forEach((rec, ri) => {
      newPage(ri, true);
      titleBlock(rec, ri);
      SECTIONS.forEach((s, si) => {
        const qs = QUESTIONS.filter(q => q.s === si);
        sectionHeading(s, 44);
        qs.forEach(q => drawQuestion(q, rec));
        y += 4;
      });
    });

    /* running headers and footers */
    const total = d.pages.length;
    for (let i = 0; i < total; i++) {
      d.setPage(i + 1);
      const m = meta[i], rec = records[m.ri];
      if (!m.first) {
        d.text('ABHISARAN – VILLAGE BASELINE & IMPACT ASSESSMENT FIELD FORM', M, 36, { font: 'F2', size: 7.5, color: COL.accent });
        const right = fit(d, `Village Record ${numOf(m.ri)} of ${totalRecs}${rec.village ? '  |  ' + rec.village : ''}`, 'F1', 7.5, 230);
        d.text(right, PW - M - d.width(right, 'F1', 7.5), 36, { font: 'F1', size: 7.5, color: COL.gray });
        d.line(M, 42, PW - M, 42, 0.6, COL.line);
      }
      d.line(M, PH - 38, PW - M, PH - 38, 0.6, COL.line);
      d.text('East Khasi Hills Pilot  |  Field data record', M, PH - 26, { font: 'F1', size: 7.5, color: COL.gray });
      const pg = `Page ${i + 1} of ${total}`;
      d.text(pg, PW - M - d.width(pg, 'F1', 7.5), PH - 26, { font: 'F1', size: 7.5, color: COL.gray });
    }
    const title = records.length === 1
      ? `ABHISARAN Field Form - ${records[0].village || 'Village Record ' + numOf(0)}`
      : `ABHISARAN Field Form - ${records.length} village records`;
    return d.build(title);
  }

  function download(bytes, filename) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 4000);

    /* Cross-frame message to ABHISARAN /source portal */
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const msg = {
          type: 'ABHISARAN_PDF_EXPORTED',
          fileName: filename,
          dataUrl: reader.result,
          byteLength: bytes.length
        };
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(msg, '*');
        }
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(msg, '*');
        }
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.warn('PDF postMessage hook error:', err);
    }
  }

  return { buildPdf, download, Doc };
})();

if (typeof module !== 'undefined') module.exports = PDFW;
