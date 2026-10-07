(function () {
  'use strict';

  const KEY = 'abhisaran_field_form_v1';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TOTAL_Q = QUESTIONS.length;

  let records = [], currentId = null, section = 0, curQ = 1;
  let dirty = false, storageOk = true, saveTimer = null, lastSaved = null;

  /* ---------------------------------------------------------------- data */
  const uid = () => 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  function todayISO() {
    const d = new Date(), p = v => String(v).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
  function blankAnswers() {
    const a = {};
    QUESTIONS.forEach(q => { a['question' + q.n] = {}; });
    return a;
  }
  function blankRecord() { return { id: uid(), date: todayISO(), village: '', answers: blankAnswers() }; }
  function normRecord(r) {
    const answers = blankAnswers();
    if (r && r.answers && typeof r.answers === 'object') {
      Object.keys(answers).forEach(k => {
        const src = r.answers[k];
        if (src && typeof src === 'object' && !Array.isArray(src)) answers[k] = JSON.parse(JSON.stringify(src));
      });
    }
    const village = String((r && r.village) || (answers.question1 && answers.question1.village) || '');
    if (village) answers.question1.village = village;
    return { id: (r && r.id) || uid(), date: String((r && r.date) || todayISO()), village, answers };
  }
  const rec = () => records.find(r => r.id === currentId) || records[0];
  const recIndex = () => Math.max(0, records.findIndex(r => r.id === rec().id));
  const fieldOf = (n, k) => (QMAP[n].fields.find(f => f.k === k)) || {};

  function qAnswered(r, n) {
    const a = r.answers['question' + n] || {};
    return Object.values(a).some(v => Array.isArray(v) ? v.length > 0 : String(v).trim() !== '');
  }
  function stats(r) {
    const sec = SECTIONS.map(() => ({ done: 0, total: 0 }));
    let done = 0;
    QUESTIONS.forEach(q => {
      sec[q.s].total++;
      if (qAnswered(r, q.n)) { sec[q.s].done++; done++; }
    });
    return { done, sec };
  }

  /* ---------------------------------------------------------- persistence */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return false;
      const d = JSON.parse(raw);
      if (!d || !Array.isArray(d.records) || !d.records.length) return false;
      records = d.records.map(normRecord);
      currentId = records.some(r => r.id === d.currentId) ? d.currentId : records[0].id;
      section = Number.isInteger(d.section) && d.section >= 0 && d.section < SECTIONS.length ? d.section : 0;
      return true;
    } catch (e) { return false; }
  }
  function persist() {
    clearTimeout(saveTimer); saveTimer = null;
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: 1, records, currentId, section, savedAt: Date.now() }));
      storageOk = true; dirty = false; lastSaved = new Date();
      setStatus('saved');
    } catch (e) {
      storageOk = false; setStatus('error');
    }
    $('#banner').hidden = storageOk;
  }
  function scheduleSave() {
    dirty = true; setStatus('saving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 350);
  }
  function setStatus(kind) {
    const el = $('#saveStatus');
    el.className = 'status' + (kind === 'saving' ? ' saving' : kind === 'error' ? ' error' : '');
    const t = el.querySelector('.t');
    if (kind === 'saving') t.textContent = 'Saving…';
    else if (kind === 'error') t.textContent = 'Not saved – export a backup';
    else {
      const d = lastSaved || new Date(), p = v => String(v).padStart(2, '0');
      t.textContent = `Saved ${p(d.getHours())}:${p(d.getMinutes())}`;
    }
  }

  /* -------------------------------------------------------------- toasts */
  let toastTimer;
  function toast(msg, ms = 3200) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, ms);
  }

  /* --------------------------------------------------------------- modal */
  function modal(o) {
    const host = $('#modal');
    const typed = o.confirmText;
    host.innerHTML = `<div class="scrim" id="scrim"><div class="dlg" role="dialog" aria-modal="true" aria-labelledby="dlgT">
      <h2 id="dlgT">${esc(o.title)}</h2>
      <p>${o.body}</p>
      ${typed ? `<input type="text" id="dlgInput" placeholder="Type ${esc(typed)}" autocomplete="off" aria-label="Type ${esc(typed)} to confirm">` : ''}
      <div class="acts">${o.actions.map((a, i) => `<button class="btn ${a.cls || ''}" data-i="${i}" ${a.needsText ? 'disabled' : ''}>${esc(a.label)}</button>`).join('')}</div>
    </div></div>`;
    host.hidden = false;
    const close = () => { host.hidden = true; host.innerHTML = ''; document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    const input = $('#dlgInput');
    if (input) {
      input.addEventListener('input', () => {
        const ok = input.value.trim() === typed;
        host.querySelectorAll('button[data-i]').forEach(b => { if (o.actions[+b.dataset.i].needsText) b.disabled = !ok; });
      });
      input.focus();
    }
    host.querySelector('#scrim').addEventListener('click', e => { if (e.target.id === 'scrim') close(); });
    host.querySelectorAll('button[data-i]').forEach(b => b.addEventListener('click', () => {
      const a = o.actions[+b.dataset.i];
      close();
      if (a.fn) a.fn();
    }));
    const first = host.querySelector('button[data-i]:not([disabled])');
    if (first && !input) first.focus();
  }

  /* ------------------------------------------------------------ rendering */
  function fieldHTML(q, f, a) {
    const id = `q${q.n}-${f.k}`;
    const v = a[f.k];
    const data = `data-q="${q.n}" data-k="${f.k}"`;
    switch (f.type) {
      case 'text':
        return `<div class="fld ${f.wide ? 'wide' : ''}"><label for="${id}">${esc(f.label)}</label><input type="text" id="${id}" ${data} data-t="text" value="${esc(v || '')}" placeholder="${esc(f.ph || '')}" autocomplete="off"></div>`;
      case 'number':
        return `<div class="fld"><label for="${id}">${esc(f.label)}</label><input type="text" id="${id}" ${data} data-t="num" inputmode="${f.dec ? 'decimal' : 'numeric'}" value="${esc(v || '')}" placeholder="0" autocomplete="off"></div>`;
      case 'area':
        return `<div class="fld full"><label for="${id}">${esc(f.label)}</label><textarea id="${id}" ${data} data-t="area" class="${f.rows === 2 ? 'small' : ''}" rows="${f.rows || 3}">${esc(v || '')}</textarea></div>`;
      case 'radio':
        return `<div class="fld full"><span class="lbl" id="${id}-l">${esc(f.label)}</span><div class="seg" role="radiogroup" aria-labelledby="${id}-l">${f.opts.map(o => `<button type="button" class="opt" role="radio" aria-checked="${v === o}" data-mode="radio" ${data} data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div></div>`;
      case 'check':
        return `<div class="fld full"><span class="lbl" id="${id}-l">${esc(f.label)}</span><div class="seg" role="group" aria-labelledby="${id}-l">${f.opts.map(o => `<button type="button" class="opt chip" role="checkbox" aria-checked="${(v || []).includes(o)}" data-mode="check" ${data} data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div></div>`;
      case 'grid':
        return `<div class="fld full"><div class="grid-rows">${f.rows.map(rw => `<div class="grow-row"><span class="gl">${esc(rw.label)}</span><div class="gcols">${f.cols.map(c => {
          const key = rw.k + '_' + c.k, cur = a[key];
          return `<div class="gcol"><span class="lbl">${esc(c.label)}</span><div class="seg" role="radiogroup" aria-label="${esc(rw.label + ' ' + c.label)}">${['Yes', 'No'].map(o => `<button type="button" class="opt" role="radio" aria-checked="${cur === o}" data-mode="radio" data-q="${q.n}" data-k="${key}" data-v="${o}">${o}</button>`).join('')}</div></div>`;
        }).join('')}</div></div>`).join('')}</div></div>`;
      case 'numtable':
        return `<div class="fld full"><div class="tbl-wrap"><table class="nt"><thead><tr><th></th>${f.cols.map(c => `<th scope="col">${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${f.rows.map(rw => `<tr><th scope="row">${esc(rw.label)}</th>${f.cols.map(c => {
          const key = rw.k + '_' + c.k;
          return `<td><input type="text" ${`data-q="${q.n}" data-k="${key}"`} data-t="num" inputmode="numeric" value="${esc(a[key] || '')}" placeholder="0" aria-label="${esc(rw.label + ' ' + c.label)}" autocomplete="off"></td>`;
        }).join('')}</tr>`).join('')}</tbody></table></div></div>`;
    }
    return '';
  }

  function cardHTML(q, r) {
    const a = r.answers['question' + q.n] || {};
    const note = (q.n === 10 || q.n === 24) ? `<div class="fld full"><div class="note" id="note-q${q.n}" hidden></div></div>` : '';
    return `<article class="qcard ${qAnswered(r, q.n) ? 'done' : ''}" id="card-${q.n}" data-n="${q.n}">
      <div class="qhead"><span class="qnum">${q.n}</span><div><h3 class="qtext">${esc(q.text)}</h3>${q.hint ? `<p class="qhint">${esc(q.hint)}</p>` : ''}</div></div>
      <div class="qbody">${q.fields.map(f => fieldHTML(q, f, a)).join('')}${note}</div>
    </article>`;
  }

  function autosize(t) {
    t.style.height = 'auto';
    t.style.height = Math.max(t.scrollHeight + 2, 66) + 'px';
  }

  function renderForm() {
    const r = rec();
    const qs = QUESTIONS.filter(q => q.s === section);
    $('#form').innerHTML = qs.map(q => cardHTML(q, r)).join('');
    $$('#form textarea').forEach(autosize);
    checkSum(10); checkSum(24);
    const s = SECTIONS[section];
    $('#secHead').innerHTML = `<h2>${esc(s.title)}</h2><span>${qs.length} questions · Q${qs[0].n}–Q${qs[qs.length - 1].n}</span>`;
    const first = qs[0].n;
    if (curQ < first || curQ > qs[qs.length - 1].n) curQ = first;
  }

  function renderTabs() {
    $('#tabs').innerHTML = records.map((r, i) => `<button class="tab" role="tab" data-id="${r.id}" aria-current="${r.id === rec().id}" aria-selected="${r.id === rec().id}" title="Record ${i + 1} – ${esc(r.village || 'Untitled')}">${i + 1} · ${esc(r.village || 'Untitled')}</button>`).join('');
    const cur = $('#tabs .tab[aria-current="true"]');
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function renderRecHead() {
    const r = rec();
    $('#hdrDate').value = r.date || '';
    $('#hdrVillage').value = r.village || '';
    $('#recBadge').textContent = `Village Record ${recIndex() + 1} of ${records.length}`;
    $('#pdfCurSub').textContent = `Village Record ${recIndex() + 1} of ${records.length}`;
    $('#pdfAllSub').textContent = `${records.length} record${records.length === 1 ? '' : 's'}, in order`;
  }

  function renderNav() {
    const st = stats(rec());
    $('#navList').innerHTML = SECTIONS.map((s, i) => {
      const x = st.sec[i], ok = x.done === x.total;
      return `<button class="nav-item ${i === section ? 'on' : ''}" data-sec="${i}"><span class="nl">${s.id}. ${esc(s.short)}</span><span class="ns ${ok ? 'ok' : ''}">${ok ? '✓ Complete' : '○ Incomplete'} · ${x.done}/${x.total} answered</span></button>`;
    }).join('');
    const sel = $('#jump');
    sel.innerHTML = SECTIONS.map((s, i) => `<option value="${i}" ${i === section ? 'selected' : ''}>${s.id}. ${esc(s.short)} — ${st.sec[i].total} questions ${st.sec[i].done === st.sec[i].total ? '✓' : '○'}</option>`).join('');
    sel.value = String(section);
  }

  function updateStrip() {
    const st = stats(rec());
    const pct = Math.round(st.done / TOTAL_Q * 100);
    $('#stripQ').textContent = `Question ${curQ} of ${TOTAL_Q}`;
    $('#stripPct').textContent = `${pct}% complete · ${st.done} of ${TOTAL_Q} answered`;
    $('#barFill').style.width = pct + '%';
    $('#bar').setAttribute('aria-valuenow', pct);
    $('#bbInfo').textContent = `${SECTIONS[section].id}. ${SECTIONS[section].short}`;
    $('#prevBtn').disabled = section === 0;
    $('#nextBtn').disabled = section === SECTIONS.length - 1;
  }

  function updateChrome() {
    const r = rec();
    $$('#form .qcard').forEach(c => c.classList.toggle('done', qAnswered(r, +c.dataset.n)));
    renderNav();
    updateStrip();
    const tab = $('#tabs .tab[aria-current="true"]');
    if (tab) { const i = recIndex(); tab.textContent = `${i + 1} · ${r.village || 'Untitled'}`; tab.title = `Record ${i + 1} – ${r.village || 'Untitled'}`; }
  }

  function renderAll() {
    renderTabs(); renderRecHead(); renderForm(); renderNav(); updateStrip();
  }

  /* ------------------------------------------------------------- editing */
  function setAnswer(n, k, val) {
    const r = rec();
    const key = 'question' + n;
    const a = r.answers[key] || (r.answers[key] = {});
    const empty = val == null || val === '' || (Array.isArray(val) && !val.length);
    if (empty) delete a[k]; else a[k] = val;
    if (n === 1 && k === 'village') {
      r.village = val || '';
      if ($('#hdrVillage').value !== r.village) $('#hdrVillage').value = r.village;
    }
    scheduleSave();
    updateChrome();
  }

  function cleanNum(v, f) {
    if (f && f.dec) {
      v = v.replace(/[^0-9.]/g, '');
      const i = v.indexOf('.');
      if (i >= 0) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, '').slice(0, 2);
    } else v = v.replace(/[^0-9]/g, '');
    v = v.slice(0, 9);
    if (/^0\d/.test(v)) v = v.replace(/^0+/, '') || '0';
    if (f && f.max != null && v !== '' && parseFloat(v) > f.max) v = String(f.max);
    return v;
  }

  function checkSum(n) {
    const note = $('#note-q' + n);
    if (!note) return;
    const a = rec().answers['question' + n] || {};
    const t = a.total, b = a.boys, g = a.girls;
    if (t !== undefined && b !== undefined && g !== undefined && (+b + +g) !== +t) {
      note.hidden = false;
      note.textContent = `Boys + Girls = ${+b + +g}, but the total entered is ${+t}. Please re-check the figures.`;
    } else note.hidden = true;
  }

  function onInput(e) {
    const t = e.target;
    if (!t.dataset || !t.dataset.q || t.dataset.mode) return;
    const n = +t.dataset.q, k = t.dataset.k;
    let v = t.value;
    if (t.dataset.t === 'num') {
      const base = k.split('_')[0];
      const f = fieldOf(n, k) || fieldOf(n, base);
      const c = cleanNum(v, f);
      if (c !== v) { const pos = t.selectionStart; t.value = c; try { t.setSelectionRange(pos - (v.length - c.length), pos - (v.length - c.length)); } catch (x) { /* ignore */ } }
      v = c;
    }
    if (t.tagName === 'TEXTAREA') autosize(t);
    setAnswer(n, k, v);
    if (n === 10 || n === 24) checkSum(n);
  }

  function onOptClick(e) {
    const b = e.target.closest('.opt');
    if (!b) return;
    const n = +b.dataset.q, k = b.dataset.k, v = b.dataset.v;
    const group = b.parentElement;
    if (b.dataset.mode === 'radio') {
      const was = b.getAttribute('aria-checked') === 'true';
      group.querySelectorAll('.opt').forEach(x => x.setAttribute('aria-checked', 'false'));
      if (!was) b.setAttribute('aria-checked', 'true');
      setAnswer(n, k, was ? '' : v);
    } else {
      b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
      const vals = Array.from(group.querySelectorAll('.opt')).filter(x => x.getAttribute('aria-checked') === 'true').map(x => x.dataset.v);
      setAnswer(n, k, vals);
    }
  }

  /* ----------------------------------------------------------- navigation */
  function setSection(i, scroll = true) {
    section = Math.max(0, Math.min(SECTIONS.length - 1, i));
    renderForm(); renderNav(); updateStrip();
    scheduleSave();
    if (scroll) $('#secHead').scrollIntoView({ block: 'start' });
  }

  function goQ(n) {
    const q = QMAP[n];
    if (!q) return;
    if (q.s !== section) setSection(q.s, false);
    curQ = n;
    lockUntil = Date.now() + 1200;
    updateStrip();
    requestAnimationFrame(() => {
      const el = $('#card-' + n);
      if (!el) return;
      el.scrollIntoView({ block: 'start' });
      el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
    });
  }

  let ticking = false, lockUntil = 0;
  function onScroll() {
    if (ticking || Date.now() < lockUntil) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const cards = $$('#form .qcard');
      if (!cards.length) return;
      const line = $('#strip').getBoundingClientRect().bottom + 60;
      let pick = cards[0];
      cards.forEach(c => { if (c.getBoundingClientRect().top <= line) pick = c; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) pick = cards[cards.length - 1];
      const n = +pick.dataset.n;
      if (n !== curQ) { curQ = n; updateStrip(); }
    });
  }

  /* -------------------------------------------------------------- records */
  function switchTo(id, top) {
    currentId = id;
    renderAll();
    scheduleSave();
    if (top) window.scrollTo({ top: 0 });
  }
  function addRecord() {
    const r = blankRecord();
    records.push(r);
    section = 0; curQ = 1;
    switchTo(r.id, true);
    toast(`Village Record ${records.length} created – a fresh, blank copy of all ${TOTAL_Q} questions.`);
  }
  function duplicateRecord() {
    const src = rec();
    const copy = normRecord(JSON.parse(JSON.stringify(src)));
    copy.id = uid();
    copy.village = src.village ? src.village + ' (copy)' : '';
    if (copy.village) copy.answers.question1.village = copy.village;
    records.splice(recIndex() + 1, 0, copy);
    switchTo(copy.id, true);
    toast(`Village Record ${recIndex() + 1} created as a new, independent copy. Changes here will not affect the original.`, 5000);
  }
  function clearCurrent() {
    const i = recIndex();
    modal({
      title: 'Clear current record?',
      body: `All answers in <b>Village Record ${i + 1}${rec().village ? ' – ' + esc(rec().village) : ''}</b> will be erased. Other records are not affected. This cannot be undone.`,
      actions: [{ label: 'Cancel' }, {
        label: 'Clear record', cls: 'danger', fn: () => {
          const r = rec(); r.answers = blankAnswers(); r.village = ''; r.date = todayISO();
          renderAll(); persist(); toast('Record cleared.');
        }
      }]
    });
  }
  function deleteRecord() {
    if (records.length === 1) { clearCurrent(); return; }
    const i = recIndex();
    modal({
      title: 'Delete this record?',
      body: `<b>Village Record ${i + 1}${rec().village ? ' – ' + esc(rec().village) : ''}</b> and all its answers will be removed. The remaining records are renumbered. This cannot be undone.`,
      actions: [{ label: 'Cancel' }, {
        label: 'Delete record', cls: 'danger', fn: () => {
          records.splice(i, 1);
          currentId = records[Math.min(i, records.length - 1)].id;
          renderAll(); persist(); toast('Record deleted.');
        }
      }]
    });
  }
  function clearAll() {
    modal({
      title: 'Clear ALL records?',
      body: `This permanently erases <b>all ${records.length} record${records.length === 1 ? '' : 's'}</b> and every answer in them, leaving one blank record. Export a backup first if you might need the data. This cannot be undone.`,
      confirmText: 'DELETE ALL',
      actions: [
        { label: 'Export backup first', fn: () => { exportData(); } },
        { label: 'Cancel' },
        {
          label: 'Erase everything', cls: 'danger', needsText: true, fn: () => {
            const r = blankRecord(); records = [r]; currentId = r.id; section = 0; curQ = 1;
            renderAll(); persist(); window.scrollTo({ top: 0 }); toast('All records cleared.');
          }
        }]
    });
  }

  /* ------------------------------------------------------ backup / restore */
  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 4000);
  }
  function exportData() {
    persist();
    const payload = { app: 'abhisaran-field-form', version: 1, exportedAt: new Date().toISOString(), records };
    download(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `abhisaran-backup-${todayISO()}.json`);
    toast(`Backup downloaded (${records.length} record${records.length === 1 ? '' : 's'}).`);
  }
  function importFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      let list;
      try {
        const d = JSON.parse(reader.result);
        list = Array.isArray(d) ? d : d.records;
        if (!Array.isArray(list) || !list.length || !list.every(x => x && typeof x === 'object')) throw new Error('bad');
        list = list.map(normRecord);
      } catch (e) { toast('That file is not a valid ABHISARAN backup.', 5000); return; }
      modal({
        title: `Import ${list.length} record${list.length === 1 ? '' : 's'}?`,
        body: 'Add them after your current records, or replace everything with the backup.',
        actions: [
          { label: 'Cancel' },
          {
            label: 'Add to existing', fn: () => {
              list.forEach(r => { r.id = uid(); records.push(r); });
              switchTo(records[records.length - list.length].id, true); persist(); toast('Records added.');
            }
          },
          {
            label: 'Replace all', cls: 'danger', fn: () => {
              records = list; currentId = records[0].id; section = 0; curQ = 1;
              renderAll(); persist(); window.scrollTo({ top: 0 }); toast('Backup restored.');
            }
          }]
      });
    };
    reader.onerror = () => toast('Could not read that file.');
    reader.readAsText(file);
  }

  /* ------------------------------------------------------------------ pdf */
  function safeName(s) { return String(s || '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40); }
  function pdfCurrent() {
    try {
      persist();
      const i = recIndex(), r = rec();
      const bytes = PDFW.buildPdf([r], { nums: [i + 1], total: records.length });
      PDFW.download(bytes, `ABHISARAN_Record-${i + 1}${r.village ? '_' + safeName(r.village) : ''}_${todayISO()}.pdf`);
      toast(`PDF created for Village Record ${i + 1}.`);
    } catch (e) { console.error(e); toast('Could not create the PDF: ' + e.message, 6000); }
  }
  function pdfAll() {
    try {
      persist();
      const bytes = PDFW.buildPdf(records, { total: records.length });
      PDFW.download(bytes, `ABHISARAN_All-${records.length}-Records_${todayISO()}.pdf`);
      toast(`One PDF created with ${records.length} record${records.length === 1 ? '' : 's'}.`);
    } catch (e) { console.error(e); toast('Could not create the PDF: ' + e.message, 6000); }
  }

  /* --------------------------------------------------------------- search */
  function runSearch() {
    const q = $('#search').value.trim().toLowerCase();
    const box = $('#results');
    if (!q) { box.hidden = true; return; }
    const num = q.replace(/^q/, '');
    const hits = QUESTIONS.filter(x =>
      (/^\d+$/.test(num) && String(x.n) === num) ||
      x.text.toLowerCase().includes(q) || (x.hint || '').toLowerCase().includes(q) ||
      x.fields.some(f => (f.label || '').toLowerCase().includes(q))
    ).slice(0, 10);
    box.innerHTML = hits.length
      ? hits.map(x => `<button data-goto="${x.n}"><b>Q${x.n}</b><span>${esc(x.text)}</span><small>${SECTIONS[x.s].id}</small></button>`).join('')
      : '<div class="none">No matching question.</div>';
    box.hidden = false;
  }

  /* ---------------------------------------------------------------- menus */
  function closeMenus() {
    ['pdf', 'more'].forEach(k => { $('#' + k + 'Menu').hidden = true; $('#' + k + 'Btn').setAttribute('aria-expanded', 'false'); });
  }
  function toggleMenu(k) {
    const m = $('#' + k + 'Menu'), was = !m.hidden;
    closeMenus();
    if (!was) { m.hidden = false; $('#' + k + 'Btn').setAttribute('aria-expanded', 'true'); }
  }

  function act(name) {
    closeMenus();
    switch (name) {
      case 'pdf-current': return pdfCurrent();
      case 'pdf-all': return pdfAll();
      case 'add': return addRecord();
      case 'duplicate': return duplicateRecord();
      case 'export': return exportData();
      case 'import': return $('#importFile').click();
      case 'delete': return deleteRecord();
      case 'clear': return clearCurrent();
      case 'clearall': return clearAll();
    }
  }

  /* ----------------------------------------------------------------- init */
  function init() {
    if (!load()) { const r = blankRecord(); records = [r]; currentId = r.id; section = 0; }
    try { localStorage.setItem(KEY + '_probe', '1'); localStorage.removeItem(KEY + '_probe'); storageOk = true; } catch (e) { storageOk = false; }
    $('#banner').hidden = storageOk;
    if (storageOk) persist(); else setStatus('error');
    renderAll();

    $('#form').addEventListener('input', onInput);
    $('#form').addEventListener('click', onOptClick);
    $('#form').addEventListener('focusin', e => {
      const c = e.target.closest('.qcard');
      if (c && +c.dataset.n !== curQ) { curQ = +c.dataset.n; updateStrip(); }
    });

    $('#hdrDate').addEventListener('input', e => { rec().date = e.target.value; scheduleSave(); });
    $('#hdrVillage').addEventListener('input', e => {
      const v = e.target.value, r = rec();
      r.village = v;
      if (v) r.answers.question1.village = v; else delete r.answers.question1.village;
      const q1 = $('#q1-village'); if (q1 && q1.value !== v) q1.value = v;
      scheduleSave(); updateChrome();
    });

    $('#tabs').addEventListener('click', e => { const b = e.target.closest('.tab'); if (b && b.dataset.id !== rec().id) switchTo(b.dataset.id, false); });
    $('#navList').addEventListener('click', e => { const b = e.target.closest('[data-sec]'); if (b) setSection(+b.dataset.sec); });
    $('#jump').addEventListener('change', e => setSection(+e.target.value));
    $('#prevBtn').addEventListener('click', () => setSection(section - 1));
    $('#nextBtn').addEventListener('click', () => setSection(section + 1));
    $('#saveBtn').addEventListener('click', () => { persist(); toast(storageOk ? 'Saved on this device.' : 'Could not save automatically – use Export Data.'); });
    $('#pdfBtn').addEventListener('click', e => { e.stopPropagation(); toggleMenu('pdf'); });
    $('#moreBtn').addEventListener('click', e => { e.stopPropagation(); toggleMenu('more'); });
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-act]');
      if (a) { act(a.dataset.act); return; }
      if (!e.target.closest('.pop')) closeMenus();
      const g = e.target.closest('[data-goto]');
      if (g) { $('#results').hidden = true; $('#search').value = ''; goQ(+g.dataset.goto); return; }
      if (!e.target.closest('.searchbox')) $('#results').hidden = true;
    });
    $('#search').addEventListener('input', runSearch);
    $('#search').addEventListener('keydown', e => { if (e.key === 'Escape') { $('#results').hidden = true; e.target.value = ''; } if (e.key === 'Enter') { const f = $('#results [data-goto]'); if (f) f.click(); } });
    $('#importFile').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) importFile(f); });
    window.addEventListener('scroll', onScroll, { passive: true });

    const flush = () => { if (dirty) persist(); };
    window.addEventListener('beforeunload', e => {
      flush();
      if (dirty || !storageOk) { e.preventDefault(); e.returnValue = ''; }
    });
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  }

  init();
})();
