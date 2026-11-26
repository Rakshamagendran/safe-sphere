'use strict';
/* Campus Shield – frontend demo. All data lives in memory only (no storage, no network). */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const el = (tag, text, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };

/* Toast */
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove('show'), 3200); }

/* Navigation + dark mode */
$('#menuBtn').addEventListener('click', e => { const open = $('#links').classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', open); });
$$('#links a').forEach(a => a.addEventListener('click', () => $('#links').classList.remove('open')));
$('#themeBtn').addEventListener('click', () => { const d = document.documentElement; d.dataset.theme = d.dataset.theme === 'dark' ? 'light' : 'dark'; });

/* ---------- Sample data (synthetic) ---------- */
const BASE = {
  'CS-1001': { status: 'Under review', date: '12 Sep 2026', auth: 'HOD', next: 'Dean review if a related report arrives', msg: 'Your report has reached the HOD in minimized form.', tl: ['Report received', 'Sent to HOD (minimized)'] },
  'CS-2002': { status: 'Escalated to Dean', date: '03 Sep 2026', auth: 'Dean', next: 'Higher authority review if another related report arrives', msg: 'A related report was matched. The Dean is reviewing.', tl: ['Report received', 'Sent to HOD', 'Related report matched', 'Escalated to Dean'] },
  'CS-3003': { status: 'Flagged for higher review', date: '20 Aug 2026', auth: 'Higher Authority', next: 'Authorized review of the pattern', msg: 'Repeated reports are flagged for authorized review. This is not a finding of guilt.', tl: ['Report received', 'Sent to HOD', 'Escalated to Dean', 'Flagged for higher authority'] }
};
let DEMO = JSON.parse(JSON.stringify(BASE));

/* ---------- Multi-step form ---------- */
const CATS = {
  offline: ['Following or stalking', 'Unwanted behaviour', 'Threats or intimidation', 'Physical or in-person harassment', 'Other offline incident'],
  online: ['Fake account', 'Obscene or abusive content', 'Online threats', 'Cyber harassment', 'Other online incident']
};
const MAX_FILES = 5, MAX_SIZE = 5 * 1024 * 1024, OK_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
let step = 1, files = [], busy = false;
const form = $('#form'), steps = $$('.step');
const complaintType = () => { const r = form.querySelector('[name=type]:checked'); return r ? r.value : ''; };

function showStep(n) {
  step = n;
  steps.forEach(s => { s.hidden = +s.dataset.step !== n; });
  $('#bar').style.width = n * 20 + '%';
  $('#stepLabel').textContent = 'Step ' + n + ' of 5';
  $('#back').hidden = n === 1; $('#next').hidden = n === 5; $('#submit').hidden = n !== 5;
  $('#err').textContent = '';
}
function validate(n) {
  let msg = '';
  if (n === 1 && !complaintType()) msg = 'Choose offline or online ragging to continue.';
  if (n === 2) {
    if (!$('#date').value) msg = 'Enter the incident date.';
    else if (!$('#time').value) msg = 'Enter the approximate time.';
    else if (!$('#place').value.trim()) msg = 'Enter the location or platform.';
    else if (!$('#cat').value) msg = 'Select a category.';
    else if ($('#desc').value.trim().length < 15) msg = 'Add a short description (at least 15 characters).';
  }
  if (n === 5 && !$('#confirm').checked) msg = 'Tick the confirmation box to submit.';
  $('#err').textContent = msg;
  return !msg;
}
form.addEventListener('change', e => {
  if (e.target.name !== 'type') return;
  const t = complaintType(), cat = $('#cat');
  cat.replaceChildren(el('option', 'Select a category'), ...CATS[t].map(c => { const o = el('option', c); o.value = c; return o; }));
  cat.firstChild.value = '';
  $('#placeLbl').textContent = t === 'online' ? 'Online platform' : 'Campus location';
  $('#evHint').textContent = (t === 'online' ? 'Attach screenshot evidence if available. ' : '') + 'Images only: PNG, JPG or WebP, up to 5 files, 5 MB each. Files stay in your browser and are not uploaded or stored.';
});
$('#next').addEventListener('click', () => { if (validate(step)) showStep(step + 1); });
$('#back').addEventListener('click', () => showStep(step - 1));

/* Evidence files: validate, list, remove */
function renderFiles() {
  $('#fileList').replaceChildren(...files.map((f, i) => {
    const li = el('li'); li.append(el('span', f.name + ' (' + Math.ceil(f.size / 1024) + ' KB)'));
    const b = el('button', 'Remove'); b.type = 'button'; b.setAttribute('aria-label', 'Remove ' + f.name);
    b.addEventListener('click', () => { files.splice(i, 1); renderFiles(); });
    li.append(b); return li;
  }));
}
$('#files').addEventListener('change', e => {
  let problem = '';
  [...e.target.files].forEach(f => {
    if (!OK_TYPES.includes(f.type)) problem = f.name + ' is not a PNG, JPG or WebP image.';
    else if (f.size > MAX_SIZE) problem = f.name + ' is over 5 MB.';
    else if (files.length >= MAX_FILES) problem = 'You can attach up to 5 images.';
    else files.push(f);
  });
  e.target.value = ''; renderFiles(); $('#err').textContent = problem;
});

/* Submit (demo): confirm, prevent duplicates, generate ID in memory */
form.addEventListener('submit', ev => {
  ev.preventDefault();
  if (busy || !validate(5)) return;
  if (!window.confirm('This is a demo. Nothing will be sent to any authority. Continue?')) return;
  busy = true; const b = $('#submit'); b.disabled = true; b.textContent = 'Submitting…';
  setTimeout(() => {
    const id = 'CS-' + Math.floor(1000 + Math.random() * 9000), anon = $('#anon').checked;
    DEMO[id] = { status: 'Received (demo)', date: new Date().toLocaleDateString('en-GB'), auth: 'HOD', next: 'Dean review if a related report arrives', msg: anon ? 'Anonymous report: follow-up and status updates may be limited.' : 'Your demo report was received.', tl: ['Report received (demo)'] };
    const r = $('#result'); r.hidden = false;
    r.replaceChildren(el('strong', 'Demo report created. Reference ID: ' + id), el('p', 'Nothing was sent or stored. Use this ID in Track a report.'));
    form.reset(); files = []; renderFiles(); $('#cat').replaceChildren(); showStep(1);
    b.disabled = false; b.textContent = 'Submit report'; busy = false;
    $('#refId').value = id; toast('Demo report created: ' + id);
  }, 900);
});

/* ---------- Escalation simulation ---------- */
let esc = 0;
const ESC_MSG = ['No reports yet. Press the button to simulate a related report.', 'First report: HOD receives a minimized report.', 'Second related report: the Dean reviews, identity still withheld.', 'Third related report: flagged for higher-authority review. This is a signal, not proof.'];
function renderEsc() {
  $$('.node').forEach((n, i) => n.classList.toggle('on', i < esc));
  $('#escFill').style.width = (esc ? (esc - 1) / 2 * 100 : 0) + '%';
  $('#escMsg').textContent = ESC_MSG[esc];
  $('#escNext').disabled = esc === 3;
}
$('#escNext').addEventListener('click', () => { if (esc < 3) { esc++; renderEsc(); toast('Simulated: escalation stage ' + esc); } });
$('#escReset').addEventListener('click', () => { esc = 0; renderEsc(); });

/* ---------- Tracking ---------- */
$('#trackForm').addEventListener('submit', e => {
  e.preventDefault();
  const id = $('#refId').value.trim().toUpperCase(), out = $('#trackOut'), r = DEMO[id];
  if (!r) { out.replaceChildren(el('p', 'No report found for "' + id.slice(0, 20) + '". Check the ID, or try CS-1001.', 'err')); return; }
  const dl = el('dl', null, 'kv');
  [['Reference ID', id], ['Status', r.status], ['Submitted', r.date], ['Responsible', r.auth], ['Next review', r.next], ['Latest update', r.msg]]
    .forEach(([k, v]) => { dl.append(el('dt', k), el('dd', v)); });
  const tl = el('ul', null, 'tl'); r.tl.forEach(t => tl.append(el('li', t)));
  out.replaceChildren(dl, el('h3', 'Timeline'), tl, el('p', 'Sample data. No complainant identity or incident details are shown.', 'muted'));
});

/* ---------- Authority panel (visual demo only) ---------- */
const ROLES = {
  student: ['Your view', [['Your reports', 'Status and reference ID only'], ['Notification', 'CS-1001 is now with the HOD'], ['Privacy', 'Only you see what you wrote']]],
  hod: ['HOD view (sample)', [['Notification', 'New minimized report received'], ['Reporter', null], ['Suspect details', 'Shown only if the reporter chose to share'], ['Action', 'Review; watch for related reports']]],
  dean: ['Dean view (sample)', [['Notification', 'Second related report escalated'], ['Reporter', null], ['Pattern', 'Needs careful matching, not assumed'], ['Action', 'Further review']]],
  higher: ['Higher Authority view (sample)', [['Notification', 'Third related report flagged'], ['Reporter', null], ['Disclosure', 'Only when authorized, necessary and permitted'], ['Action', 'Authorized pattern review; protect reporters from retaliation']]]
};
function renderRole(k) {
  const [title, rows] = ROLES[k], dl = el('dl', null, 'kv');
  rows.forEach(([a, b]) => { dl.append(el('dt', a)); const dd = el('dd'); if (b === null) dd.append(el('span', 'Withheld', 'mask')); else dd.textContent = b; dl.append(dd); });
  $('#roleOut').replaceChildren(el('h3', title), dl, el('p', 'Privacy: identifying details are masked in all authority views.', 'muted'));
  $$('.role').forEach(b => b.setAttribute('aria-pressed', b.dataset.role === k));
}
$$('.role').forEach(b => b.addEventListener('click', () => renderRole(b.dataset.role)));

/* ---------- Safe-zone map (illustrative) ---------- */
function pickPin(g) {
  $$('.pin').forEach(p => p.classList.toggle('sel', p === g));
  $('#mapNote').textContent = g.dataset.name + ': illustrative placeholder, not a verified safe zone.';
}
$$('.pin').forEach(g => {
  g.addEventListener('click', () => pickPin(g));
  g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickPin(g); } });
});

/* ---------- Reset demo ---------- */
$('#resetDemo').addEventListener('click', () => {
  DEMO = JSON.parse(JSON.stringify(BASE)); esc = 0; files = [];
  form.reset(); renderFiles(); showStep(1); renderEsc(); renderRole('student');
  $('#result').hidden = true; $('#refId').value = '';
  $('#trackOut').replaceChildren(el('p', 'Enter a reference ID to see its status.', 'muted'));
  toast('Demo data reset');
});

showStep(1); renderEsc(); renderRole('student');