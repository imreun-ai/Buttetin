const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const KEY = 'khReportCard.v2';
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const f2 = v => v == null ? '' : (Math.round(v * 100) / 100).toFixed(2);

const FIELDS = [['office', 'ឈ្មោះការិយាល័យ'], ['province', 'ខេត្ត'], ['school', 'ឈ្មោះសាលា'], ['cls', 'ថ្នាក់'], ['year', 'ឆ្នាំសិក្សា'], ['date', 'កាលបរិច្ឆេទ ថ្ងៃ/ខែ/ឆ្នាំ (ឧ. 21/11/2026) → បង្ហាញចន្ទគតិ និងសុរិយគតិស្វ័យប្រវត្តិ'], ['place', 'ទីកន្លែងចុះហត្ថលេខា (ឧ. កណ្តៀង)'], ['lunar', 'ចន្ទគតិ (ស្វ័យប្រវត្តិ · កែដោយដៃបាន)'], ['signDate', 'ទីកន្លែង និងសុរិយគតិ (ស្វ័យប្រវត្តិ · កែដោយដៃបាន)'], ['teacher', 'ឈ្មោះគ្រូបន្ទុក'], ['principal', 'ឈ្មោះនាយកសាលា']];
const CALC = [['M', 'មធ្យមភាគពេញ (ឧ. ៥០)'], ['skillPct', 'វិជ្ជាសម្បទា = ម.ប្រចាំឆ្នាំ × ...%'], ['skillMax', 'ពិន្ទុបំណិនសម្បទា (ពេញ)'], ['charMax', 'ពិន្ទុចរិយាសម្បទា (ពេញ)']];

const TBL_SUBJ = ['ភាសាខ្មែរ', 'គណិតវិទ្យា', 'រូបវិទ្យា', 'គីមីវិទ្យា', 'ជីវវិទ្យា', 'ប្រវត្តិវិទ្យា', 'ព័ត៌មានវិទ្យា', 'សីលធម៌', 'ផែនដីវិទ្យា', 'ភូមិវិទ្យា', 'គេហវិទ្យា', 'អប់រំកាយ', 'ភាសាចិន/បំណិន', 'សេដ្ឋកិច្ច', 'សិល្បៈ', 'កសិកម្ម', 'អង់គ្លេស'];
const _L7 = [100, 100, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, null, 50, 50, 50];
const _L9 = [100, 100, 35, 25, 35, 33, 50, 35, 25, 32, 50, 50, 50, null, 50, 50, 50];
const _L10 = [150, 150, 50, 37, 38, 37, 50, 38, 25, 38, 37, 50, 50, null, 50, 50, 100];
const _SCI = [75, 125, 75, 75, 75, 50, 50, 50, 50, 50, null, 50, 50, 50, 50, 50, 50];
const _SOC = [125, 75, 50, 50, 50, 75, 50, 75, 50, 75, null, 50, 50, 50, 50, 50, 50];
const LEVEL_MAX = { '7': _L7, '8': _L7, '9': _L9, '10': _L10, '11 វិទ្យាសាស្ត្រ': _SCI, '11 សង្គម': _SOC, '12 វិទ្យាសាស្ត្រ': _SCI, '12 សង្គម': _SOC };
const DISPLAY_ORDER = ['ភាសាខ្មែរ', 'សីលធម៌', 'ប្រវត្តិវិទ្យា', 'ភូមិវិទ្យា', 'គណិតវិទ្យា', 'រូបវិទ្យា', 'គីមីវិទ្យា', 'ជីវវិទ្យា', 'ផែនដីវិទ្យា', 'អង់គ្លេស', 'គេហវិទ្យា', 'កសិកម្ម', 'អប់រំកាយ', 'ព័ត៌មានវិទ្យា', 'ភាសាចិន/បំណិន', 'សេដ្ឋកិច្ច', 'សិល្បៈ'];
const NAME_ALIAS = { 'សីល-ពលរដ្ឋ': 'សីលធម៌', 'សីលធម៌-ពលរដ្ឋ': 'សីលធម៌', 'ភាសាអង់គ្លេស': 'អង់គ្លេស', 'ការអប់រំកាយ': 'អប់រំកាយ' };
const canon = n => { n = String(n || '').trim(); return NAME_ALIAS[n] || n; };
const coefOf = (max, M) => Math.round(max / (Number(M) || 50) * 1000) / 1000;
function subjectsForLevel(lv) {
  const arr = LEVEL_MAX[lv]; if (!arr) return [];
  return DISPLAY_ORDER.map(n => [n, arr[TBL_SUBJ.indexOf(n)]]).filter(x => x[1] != null);
}
/* ជ្រើសកម្រិតថ្នាក់ → កំណត់មុខវិជ្ជា + ពិន្ទុពេញ + មេគុណ (= ពិន្ទុពេញ ÷ មធ្យមភាគពេញ) ស្វ័យប្រវត្តិ */
function applyLevel(lv) {
  const list = subjectsForLevel(lv); if (!list.length) return false;
  const M = st.settings.M, keep = new Set(list.map(x => x[0]));
  const removed = st.subjects.filter(j => TBL_SUBJ.includes(canon(j.name)) && !keep.has(canon(j.name)));
  const hasScore = removed.some(j => st.students.some(s => (s.s1 || {})[j.id] !== undefined || (s.s2 || {})[j.id] !== undefined));
  if (hasScore && !confirm('មុខវិជ្ជាខ្លះ (' + removed.map(j => j.name).join(', ') + ') មិនមានក្នុងកម្រិតនេះ ហើយមានពិន្ទុរួចហើយ។ ពិន្ទុទាំងនោះនឹងត្រូវលុប។ បន្ត?')) return false;
  const byName = {}; st.subjects.forEach(j => { byName[canon(j.name)] = j; });
  const next = list.map(([name, max]) => { const o = byName[name]; return { id: o ? o.id : uid(), name, max, coef: coefOf(max, M) }; });
  const custom = st.subjects.filter(j => !TBL_SUBJ.includes(canon(j.name)));
  removed.forEach(j => st.students.forEach(s => { delete (s.s1 || {})[j.id]; delete (s.s2 || {})[j.id]; }));
  st.subjects = next.concat(custom);
  st.settings.level = lv; save(); return true;
}
const KH_MONTHS = ['មករា', 'កុម្ភៈ', 'មិនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
const toKh = s => String(s).replace(/\d/g, d => KD[d]);
const toLat = s => String(s).replace(/[០-៩]/g, d => KD.indexOf(d));
const dobKh = s => toKh(String(s == null ? '' : s).trim().replace(/[\/.\-]+/g, ' ').replace(/\s+/g, ' '));
function parseDMY(str) {
  const m = toLat(str || '').trim().match(/^(\d{1,2})\s*[\/.\-\s]\s*(\d{1,2})\s*[\/.\-\s]\s*(\d{4})$/);
  if (!m) return null;
  const d = +m[1], mo = +m[2], y = +m[3], dt = new Date(y, mo - 1, d, 12);
  return (dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d) ? { d, mo, y, dt } : null;
}
/* សុរិយគតិ (គណនាខ្លួនឯង) + ចន្ទគតិ (ប្រើបណ្ណាល័យ momentkh) */
function khDates(str) {
  const p = parseDMY(str); if (!p) return null;
  const solar = 'ថ្ងៃទី' + toKh(p.d) + ' ខែ' + KH_MONTHS[p.mo - 1] + ' ឆ្នាំ' + toKh(p.y);
  let lunar = '';
  try { const MK = window.momentkh; if (MK && MK.fromDate) lunar = MK.format(MK.fromDate(p.dt), 'ថ្ងៃW dN ខែm ឆ្នាំa e ព.ស.b'); } catch (e) {}
  return { solar, lunar };
}
function autoDates() {
  const r = khDates(st.settings.date); if (!r) return false;
  if (r.lunar) st.settings.lunar = r.lunar;
  st.settings.signDate = ((st.settings.place || '').trim() + ' ' + r.solar).trim();
  ['lunar', 'signDate'].forEach(k => { const el = document.querySelector('#setForm [data-k="' + k + '"]'); if (el) el.value = st.settings[k] || ''; });
  return !!r.lunar;
}
function defaults() {
  return {
    settings: { office: 'ការិយាល័យ អប់រំ យុវជន និង កីឡា ស្រុកកណ្តៀង', province: 'ពោធិ៍សាត់', school: 'វិទ្យាល័យ ហ៊ុន សែន កណ្តៀង', cls: '១២ A', year: '២០២៦-២០២៧', date: '21/11/2026', place: 'កណ្តៀង', lunar: '', signDate: '', teacher: 'អុឹម រើន', principal: '', M: 50, skillPct: 80, skillMax: 5, charMax: 5, level: '12 វិទ្យាសាស្ត្រ', gradeStyle: 'words', gradeW: [80, 65, 50], gradeL: [90, 80, 70, 60, 50] },
    subjects: subjectsForLevel('12 វិទ្យាសាស្ត្រ').map(([name, max]) => ({ id: uid(), name, max, coef: coefOf(max, 50) })),
    students: []
  };
}
let st, ui = { api: '', auto: false, kh: true, sel: null, tab: 'set' }, C = null;
function load() {
  try {
    const j = JSON.parse(localStorage.getItem(KEY));
    if (j && j.data) {
      st = j.data; ui = Object.assign(ui, j.ui || {});
      st.settings = Object.assign({ level: '', gradeStyle: 'words', gradeW: [80, 65, 50], gradeL: [90, 80, 70, 60, 50] }, st.settings);
      st.students = st.students.map(s => Object.assign(newStudent(), s));
      return;
    }
  } catch (e) {}
  st = defaults();
}
let tmr, syncTmr;
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ data: st, ui })); } catch (e) { toast('Local Storage ពេញ!'); }
  setStatus('បានរក្សាទុក ' + new Date().toLocaleTimeString());
  if (ui.auto && ui.api) { clearTimeout(syncTmr); syncTmr = setTimeout(() => push(true), 2500); }
}
const setStatus = t => { $('#status').textContent = t; };
function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('show'); clearTimeout(tmr); tmr = setTimeout(() => e.classList.remove('show'), 2800); }
const KD = '០១២៣៤៥៦៧៨៩';
const kd = s => ui.kh ? String(s).replace(/\d/g, d => KD[d]) : String(s);
const recalc = () => { C = yearAll(st); return C; };
const normSex = v => { const s = String(v).trim().toLowerCase(); if (['ស្រី', 'ស', 'f', 'female', 'woman'].includes(s)) return 'ស្រី'; return 'ប្រុស'; };
const splitName = n => { const p = String(n || '').trim().split(/\s+/); return [p[0] || '', p.slice(1).join(' ')]; };
const COND = [['moral', 'សីលធម៌'], ['labor', 'ពលកម្ម-បង្កបង្កើនផល'], ['health', 'សុខភាព-អនាម័យ']];
const COND_OPTS = ['ល្អ', 'ល្អបង្គួរ', 'មធ្យម', 'ខ្សោយ', 'A', 'B', 'C', 'D', 'E', 'F'];
const defCond = () => ({ moral: ['ល្អ', 'ល្អ', 'ល្អ'], labor: ['ល្អ', 'ល្អ', 'ល្អ'], health: ['ល្អ', 'ល្អ', 'ល្អ'] });
const newStudent = (o = {}) => Object.assign({ id: uid(), sid: '', name: '', sex: 'ប្រុស', dob: '', a1p: 0, a1u: 0, a2p: 0, a2u: 0, m1: '', m2: '', skill: '', char: '', cond: defCond(), s1: {}, s2: {} }, o);
const GRADE_LABEL = { A: 'ល្អប្រសើរ', B: 'ល្អណាស់', C: 'ល្អ', D: 'ល្អបង្គួរ', E: 'មធ្យម', F: 'ខ្សោយ' };

/* ===== ១. ការកំណត់ ===== */
function renderSettings() {
  $('#setForm').innerHTML = FIELDS.map(([k, l]) => `<div><label>${l}</label><input data-k="${k}" value="${esc(st.settings[k] || '')}"></div>`).join('');
  $('#calcForm').innerHTML = CALC.map(([k, l]) => `<div><label>${l}</label><input type="number" step="any" data-k="${k}" value="${st.settings[k]}"></div>`).join('') +
    `<div><label>&nbsp;</label><label class="inl"><input type="checkbox" id="khDigits" ${ui.kh ? 'checked' : ''}> លេខខ្មែរក្នុងក្បាលព្រឹត្តិបត្រ (ឆ្នាំសិក្សា ថ្នាក់)</label></div>` +
    `<div><label>ទម្រង់និទ្ទេស</label><select id="gradeStyle"><option value="words" ${st.settings.gradeStyle !== 'letters' ? 'selected' : ''}>ល្អ / ល្អបង្គួរ / មធ្យម / ខ្សោយ</option><option value="letters" ${st.settings.gradeStyle === 'letters' ? 'selected' : ''}>A / B / C / D / E / F</option></select></div>` +
    `<div><label>ល្អ · ល្អបង្គួរ · មធ្យម (% ទាបបំផុត)</label><input data-g="gradeW" value="${(st.settings.gradeW || [80, 65, 50]).join(', ')}"></div>` +
    `<div><label>A · B · C · D · E (% ទាបបំផុត)</label><input data-g="gradeL" value="${(st.settings.gradeL || [90, 80, 70, 60, 50]).join(', ')}"></div>`;
  $('#levelSel').innerHTML = '<option value="">— ជ្រើសរើសកម្រិតថ្នាក់ —</option>' + Object.keys(LEVEL_MAX).map(l => `<option value="${l}" ${st.settings.level === l ? 'selected' : ''}>ថ្នាក់ទី ${l}</option>`).join('');
  $('#subjTable').innerHTML = '<tr><th>#</th><th>មុខវិជ្ជា</th><th>មេគុណ</th><th>ពិន្ទុពេញ</th><th></th></tr>' +
    st.subjects.map((j, i) => `<tr><td>${i + 1}</td><td><input data-j="${j.id}" data-f="name" value="${esc(j.name)}" style="text-align:left"></td><td><input type="number" step="0.5" data-j="${j.id}" data-f="coef" value="${j.coef}"></td><td><input type="number" data-j="${j.id}" data-f="max" value="${j.max}"></td><td><button class="b r" data-del="${j.id}">✕</button></td></tr>`).join('');
}
function bindSettings() {
  const onSet = e => {
    const t = e.target;
    if (t.id === 'khDigits') { ui.kh = t.checked; save(); return; }
    const k = t.dataset.k; if (!k) return;
    st.settings[k] = t.type === 'number' ? (t.value === '' ? '' : Number(t.value)) : t.value;
    if (k === 'date' || k === 'place') { const ok = autoDates(); if (k === 'date' && parseDMY(t.value) && !ok) toast('មិនទាន់ទាញចន្ទគតិបាន (ត្រូវការអ៊ីនធឺណិតដើម្បីផ្ទុកបណ្ណាល័យ)'); }
    save();
  };
  $('#setForm').addEventListener('input', onSet);
  $('#calcForm').addEventListener('input', onSet);
  $('#subjTable').addEventListener('input', e => {
    const t = e.target, j = st.subjects.find(x => x.id === t.dataset.j); if (!j) return;
    j[t.dataset.f] = t.dataset.f === 'name' ? t.value : Number(t.value); save();
  });
  $('#subjTable').addEventListener('click', e => {
    const id = e.target.dataset.del; if (!id) return;
    if (!confirm('លុបមុខវិជ្ជានេះ?')) return;
    st.subjects = st.subjects.filter(x => x.id !== id);
    st.students.forEach(s => { delete s.s1[id]; delete s.s2[id]; });
    save(); renderSettings();
  });
  $('#levelSel').onchange = e => {
    const lv = e.target.value; if (!lv) return;
    if (applyLevel(lv)) { renderSettings(); toast('បានកំណត់មុខវិជ្ជា ' + st.subjects.length + ' តាមថ្នាក់ទី ' + lv); }
    else renderSettings();
  };
  $('#calcForm').addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'gradeStyle') { st.settings.gradeStyle = t.value; save(); return; }
    if (t.dataset.g) {
      const need = t.dataset.g === 'gradeW' ? 3 : 5, nums = t.value.split(/[,\s]+/).filter(Boolean).map(Number);
      if (nums.length !== need || nums.some(isNaN)) { toast('សូមបញ្ចូលលេខ ' + need + ' ចែកដោយក្បៀស'); t.value = (st.settings[t.dataset.g] || []).join(', '); return; }
      st.settings[t.dataset.g] = nums; save();
    }
  });
  $('#addSubj').onclick = () => { st.subjects.push({ id: uid(), name: 'មុខវិជ្ជាថ្មី', coef: 1, max: Number(st.settings.M) || 50 }); save(); renderSettings(); };
  $('#expJson').onclick = () => {
    const b = new Blob([JSON.stringify(st, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'report-card-backup.json'; a.click();
  };
  $('#impJsonBtn').onclick = () => $('#impJson').click();
  $('#impJson').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(t => { try { const d = JSON.parse(t); if (!d.students || !d.subjects) throw 0; st = d; save(); renderAll(); toast('ស្តារបានជោគជ័យ'); } catch (x) { toast('ឯកសារមិនត្រឹមត្រូវ'); } });
    e.target.value = '';
  };
  $('#resetAll').onclick = () => { if (confirm('លុបទិន្នន័យទាំងអស់ក្នុង Local Storage?')) { localStorage.removeItem(KEY); load(); renderAll(); } };
}

/* ===== Excel helpers ===== */
const normH = s => String(s == null ? '' : s).replace(/[\s​.\-_()/]/g, '').toLowerCase();
function colOf(heads, aliases) {
  const al = aliases.map(normH), hs = heads.map(normH);
  let i = hs.findIndex(h => al.includes(h));
  if (i < 0) i = hs.findIndex(h => h && al.some(a => h.startsWith(a)));
  return i;
}
function readXlsx(file) {
  return new Promise((res, rej) => {
    if (!window.XLSX) return rej(new Error('មិនអាចផ្ទុក Library Excel (ត្រូវការអ៊ីនធឺណិត)'));
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const wb = XLSX.read(fr.result, { type: 'array', cellDates: true });
        const a = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: '' });
        let hi = a.findIndex(r => r.filter(c => String(c).trim() !== '').length >= 2); if (hi < 0) hi = 0;
        res({ heads: (a[hi] || []).map(h => String(h).trim()), rows: a.slice(hi + 1).filter(r => r.some(c => String(c).trim() !== '')) });
      } catch (e) { rej(e); }
    };
    fr.onerror = () => rej(new Error('អានឯកសារមិនបាន'));
    fr.readAsArrayBuffer(file);
  });
}
function fmtDate(v) {
  if (v instanceof Date && !isNaN(v)) {
    const d = new Date(v.getTime() + 12 * 3600e3), p = n => String(n).padStart(2, '0');
    return p(d.getUTCDate()) + '/' + p(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear();
  }
  return String(v == null ? '' : v).trim();
}
function download(wb, name) { XLSX.writeFile(wb, name); }
function aoaBook(sheets) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(([n, a]) => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(a), n));
  return wb;
}
function findStudent(sid, name) {
  sid = String(sid == null ? '' : sid).trim();
  if (sid) { const s = st.students.find(x => String(x.sid).trim() === sid); if (s) return s; }
  name = String(name || '').trim();
  return name ? st.students.find(x => x.name.replace(/\s+/g, '') === name.replace(/\s+/g, '')) : null;
}
const needXlsx = () => { if (!window.XLSX) { toast('មិនអាចផ្ទុក Library Excel (ត្រូវការអ៊ីនធឺណិត)'); return false; } return true; };

/* ===== ២. សិស្ស ===== */
function renderStudents() {
  $('#cnt').textContent = st.students.length;
  $('#stuTable').innerHTML = '<tr><th>ល.រ</th><th>អត្តលេខ</th><th>ឈ្មោះ</th><th>ភេទ</th><th>ថ្ងៃខែឆ្នាំកំណើត</th><th>មានច្បាប់ ឆ១</th><th>អត់ច្បាប់ ឆ១</th><th>មានច្បាប់ ឆ២</th><th>អត់ច្បាប់ ឆ២</th><th></th></tr>' +
    st.students.map((s, i) => `<tr data-id="${s.id}"><td>${i + 1}</td>
    <td><input data-f="sid" value="${esc(s.sid)}"></td>
    <td><input data-f="name" value="${esc(s.name)}" style="text-align:left;min-width:180px"></td>
    <td><select data-f="sex"><option ${s.sex === 'ប្រុស' ? 'selected' : ''}>ប្រុស</option><option ${s.sex === 'ស្រី' ? 'selected' : ''}>ស្រី</option></select></td>
    <td><input data-f="dob" value="${esc(s.dob)}" placeholder="01/01/2008"></td>
    <td><input type="number" min="0" data-f="a1p" value="${s.a1p}"></td>
    <td><input type="number" min="0" data-f="a1u" value="${s.a1u}"></td>
    <td><input type="number" min="0" data-f="a2p" value="${s.a2p}"></td>
    <td><input type="number" min="0" data-f="a2u" value="${s.a2u}"></td>
    <td><button class="b r" data-del="${s.id}">✕</button></td></tr>`).join('');
  applyAllQ();
}
function bindStudents() {
  $('#stuTable').addEventListener('input', e => {
    const tr = e.target.closest('tr[data-id]'), t = e.target; if (!tr || !t.dataset.f) return;
    const s = st.students.find(x => x.id === tr.dataset.id); if (!s) return;
    s[t.dataset.f] = t.type === 'number' ? (Number(t.value) || 0) : t.value; save();
  });
  $('#stuTable').addEventListener('click', e => {
    const id = e.target.dataset.del; if (!id) return;
    if (!confirm('លុបសិស្សនេះ (រួមទាំងពិន្ទុ)?')) return;
    st.students = st.students.filter(x => x.id !== id); save(); renderStudents();
  });
  $('#addStu').onclick = () => { st.students.push(newStudent({ name: '' })); save(); renderStudents(); };
  $('#tplStu').onclick = () => { if (!needXlsx()) return; download(aoaBook([['សិស្ស', [['អត្តលេខ', 'ឈ្មោះ', 'ភេទ', 'ថ្ងៃខែឆ្នាំកំណើត'], ['001', 'ឧទាហរណ៍ សុខា', 'ប្រុស', '01/01/2008']]]]), 'គំរូ-បញ្ជីសិស្ស.xlsx'); };
  $('#expStu').onclick = () => { if (!needXlsx()) return; download(aoaBook([['សិស្ស', [['អត្តលេខ', 'ឈ្មោះ', 'ភេទ', 'ថ្ងៃខែឆ្នាំកំណើត']].concat(st.students.map(s => [s.sid, s.name, s.sex, s.dob]))]]), 'បញ្ជីសិស្ស-' + st.settings.cls + '.xlsx'); };
  $('#impStuBtn').onclick = () => $('#f-stu').click();
  $('#f-stu').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try {
      const { heads, rows } = await readXlsx(f);
      const ci = colOf(heads, ['អត្តលេខ', 'អត្តលេខសិស្ស', 'លេខ', 'id', 'studentid']);
      const cn = colOf(heads, ['ឈ្មោះ', 'ឈ្មោះសិស្ស', 'គោត្តនាមនាម', 'គោត្តនាមនិងនាម', 'name', 'fullname']);
      const cs = colOf(heads, ['ភេទ', 'sex', 'gender']);
      const cd = colOf(heads, ['ថ្ងៃខែឆ្នាំកំណើត', 'ថ្ងៃកំណើត', 'កំណើត', 'dob', 'birthday', 'birthdate']);
      if (cn < 0) return toast('រកមិនឃើញជួរ «ឈ្មោះ»');
      let add = 0, upd = 0;
      rows.forEach(r => {
        const name = String(r[cn] || '').trim(); if (!name) return;
        const sid = ci >= 0 ? String(r[ci]).trim() : '';
        const ex = sid ? st.students.find(x => String(x.sid).trim() === sid) : null;
        const data = { sid, name, sex: cs >= 0 ? normSex(r[cs]) : 'ប្រុស', dob: cd >= 0 ? fmtDate(r[cd]) : '' };
        if (ex) { Object.assign(ex, data); upd++; } else { st.students.push(newStudent(data)); add++; }
      });
      save(); renderStudents(); toast(`បន្ថែម ${add} · ធ្វើបច្ចុប្បន្នភាព ${upd}`);
    } catch (err) { toast('មានបញ្ហា ៖ ' + err.message); }
  };
}

/* ===== ៣-៥. តារាងពិន្ទុ ===== */
function scoreTable(k) {
  const ed = k !== 'y', subs = st.subjects;
  const lab = k === 'y' ? 'ប្រចាំឆ្នាំ' : 'ប្រចាំឆមាស';
  let h = '<thead><tr><th rowspan="2" class="sk c1">អត្តលេខ</th><th rowspan="2" class="sk c2">ឈ្មោះ</th><th rowspan="2" class="sk c3">ភេទ</th>' +
    subs.map(j => `<th colspan="2">${esc(j.name)}<br><small>×${j.coef} · /${j.max}</small></th>`).join('') +
    `<th rowspan="2">ពិន្ទុសរុប</th><th rowspan="2">មធ្យមភាគ<br>ប្រឡង</th><th rowspan="2">ចំ.ថ្នាក់</th><th rowspan="2">មធ្យមភាគ<br>ខែ</th><th rowspan="2">ចំ.ថ្នាក់</th><th rowspan="2">មធ្យមភាគ<br>${lab}</th><th rowspan="2">ចំ.ថ្នាក់</th><th rowspan="2">និទ្ទេស</th></tr><tr>` +
    subs.map(() => '<th>ពិន្ទុ</th><th>ល.ថ្នាក់</th>').join('') + '</tr></thead><tbody>';
  st.students.forEach(s => {
    h += `<tr data-id="${s.id}"><td class="sk c1">${esc(s.sid)}</td><td class="sk c2 l">${esc(s.name)}</td><td class="sk c3">${esc(s.sex)}</td>`;
    subs.forEach(j => {
      if (ed) { const v = (s['s' + k] || {})[j.id]; h += `<td><input type="number" step="0.01" min="0" max="${j.max}" data-s="${s.id}" data-j="${j.id}" value="${v === undefined ? '' : v}"></td>`; }
      else h += `<td data-k="v_${j.id}" data-s="${s.id}"></td>`;
      h += `<td class="rk" data-k="r_${j.id}" data-s="${s.id}"></td>`;
    });
    const d = key => `<td data-k="${key}" data-s="${s.id}"></td>`;
    h += d('tot') + d('avg') + `<td class="rk" data-k="rk" data-s="${s.id}"></td>`;
    h += ed ? `<td><input type="number" step="0.01" min="0" data-s="${s.id}" data-m="1" value="${s['m' + k] === undefined ? '' : s['m' + k]}"></td>` : d('mo');
    h += `<td class="rk" data-k="mrk" data-s="${s.id}"></td>` + d('sav') + `<td class="rk" data-k="srk" data-s="${s.id}"></td><td class="gr" data-k="gr" data-s="${s.id}"></td></tr>`;
  });
  return h + '</tbody>';
}
const RANK_KEYS = new Set(['rk', 'mrk', 'srk']);
function refreshTable(root, comp) {
  $$('[data-k]', root).forEach(el => {
    const row = comp.rows[el.dataset.s]; if (!row) return;
    const k = el.dataset.k; let v;
    if (k.startsWith('v_')) { const x = row.sub[k.slice(2)]; v = x ? x.raw : null; }
    else v = row[k];
    el.textContent = v == null ? '' : (RANK_KEYS.has(k) || k.startsWith('r_') || k === 'gr') ? String(v) : f2(v);
  });
}
function renderSem(k) {
  const el = k === 'y' ? $('#tblY') : $('#tbl' + k);
  el.innerHTML = scoreTable(k);
  recalc();
  refreshTable(el, k === 1 ? C.A : k === 2 ? C.B : C.Y);
  applyAllQ();
}
function bindSem(k) {
  const el = $('#tbl' + k);
  el.addEventListener('input', e => {
    const t = e.target, s = st.students.find(x => x.id === t.dataset.s); if (!s) return;
    if (t.dataset.m) s['m' + k] = t.value === '' ? '' : Number(t.value);
    else { const o = s['s' + k] = s['s' + k] || {}; if (t.value === '') delete o[t.dataset.j]; else o[t.dataset.j] = Number(t.value); }
    save(); recalc(); refreshTable(el, k === 1 ? C.A : C.B);
  });
}
function semExportRows(k) {
  recalc();
  const comp = k === 1 ? C.A : k === 2 ? C.B : C.Y, lab = k === 'y' ? 'ប្រចាំឆ្នាំ' : 'ប្រចាំឆមាស';
  const head = ['អត្តលេខ', 'ឈ្មោះ', 'ភេទ'];
  st.subjects.forEach(j => head.push(j.name, 'ល.ថ្នាក់ ' + j.name));
  head.push('ពិន្ទុសរុប', 'មធ្យមភាគប្រឡង', 'ចំ.ថ្នាក់', 'មធ្យមភាគខែ', 'ចំ.ថ្នាក់', 'មធ្យមភាគ' + lab, 'ចំ.ថ្នាក់', 'និទ្ទេស');
  const rows = st.students.map(s => {
    const r = comp.rows[s.id], a = [s.sid, s.name, s.sex], n = v => v == null ? '' : Math.round(v * 100) / 100;
    st.subjects.forEach(j => a.push(r.sub[j.id] ? n(r.sub[j.id].raw) : '', r['r_' + j.id] == null ? '' : r['r_' + j.id]));
    a.push(n(r.tot), n(r.avg), r.rk == null ? '' : r.rk, n(r.mo), r.mrk == null ? '' : r.mrk, n(r.sav), r.srk == null ? '' : r.srk, r.gr);
    return a;
  });
  return [head].concat(rows);
}
async function importScores(k, file) {
  const { heads, rows } = await readXlsx(file);
  const ci = colOf(heads, ['អត្តលេខ', 'អត្តលេខសិស្ស', 'លេខ', 'id']);
  const cn = colOf(heads, ['ឈ្មោះ', 'ឈ្មោះសិស្ស', 'name']);
  const cm = colOf(heads, ['មធ្យមភាគខែ', 'ម.ខែ', 'month', 'monthavg']);
  const cols = st.subjects.map(j => ({ j, c: heads.findIndex(h => normH(h) === normH(j.name)) })).filter(x => x.c >= 0);
  if (ci < 0 && cn < 0) return toast('រកមិនឃើញជួរ «អត្តលេខ» ឬ «ឈ្មោះ»');
  if (!cols.length && cm < 0) return toast('រកមិនឃើញជួរមុខវិជ្ជា ដែលត្រូវនឹងឈ្មោះមុខវិជ្ជាក្នុងការកំណត់');
  let ok = 0; const miss = [];
  rows.forEach(r => {
    const s = findStudent(ci >= 0 ? r[ci] : '', cn >= 0 ? r[cn] : '');
    if (!s) { miss.push(String(ci >= 0 ? r[ci] : r[cn])); return; }
    const o = s['s' + k] = s['s' + k] || {};
    cols.forEach(({ j, c }) => { const v = r[c]; if (isNum(v)) o[j.id] = Number(v); });
    if (cm >= 0 && isNum(r[cm])) s['m' + k] = Number(r[cm]);
    ok++;
  });
  save(); renderSem(k);
  toast(`នាំចូល ${ok} នាក់` + (miss.length ? ` · រកមិនឃើញ ${miss.length} (${miss.slice(0, 3).join(', ')}...)` : ''));
}
function bindScoreButtons() {
  $$('[data-tpl]').forEach(b => b.onclick = () => {
    if (!needXlsx()) return;
    const head = ['អត្តលេខ', 'ឈ្មោះ', 'ភេទ'].concat(st.subjects.map(j => j.name), ['មធ្យមភាគខែ']);
    download(aoaBook([['ពិន្ទុ', [head].concat(st.students.map(s => [s.sid, s.name, s.sex]))]]), `គំរូ-ពិន្ទុឆមាសទី${b.dataset.tpl}.xlsx`);
  });
  $$('[data-imp]').forEach(b => b.onclick = () => $('#f-s' + b.dataset.imp).click());
  [1, 2].forEach(k => $('#f-s' + k).onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { await importScores(k, f); } catch (err) { toast('មានបញ្ហា ៖ ' + err.message); }
  });
  $$('[data-exp]').forEach(b => b.onclick = () => {
    if (!needXlsx()) return;
    const k = b.dataset.exp === 'y' ? 'y' : Number(b.dataset.exp);
    download(aoaBook([[k === 'y' ? 'ប្រចាំឆ្នាំ' : 'ឆមាសទី' + k, semExportRows(k)]]), (k === 'y' ? 'ពិន្ទុប្រចាំឆ្នាំ' : 'ពិន្ទុឆមាសទី' + k) + '-' + st.settings.cls + '.xlsx');
  });
}

/* ===== ៦. បំណិន ===== */
function renderSkill() {
  recalc();
  $('#tblK').innerHTML = `<thead><tr><th>អត្តលេខ</th><th>គោត្តនាម</th><th>នាម</th><th>ភេទ</th><th>វិជ្ជាសម្បទា<br><small>ម.ប្រចាំឆ្នាំ × ${esc(st.settings.skillPct)}/100</small></th><th>ពិន្ទុបំណិនសម្បទា<br><small>/${esc(st.settings.skillMax)}</small></th><th>ពិន្ទុចរិយាសម្បទា<br><small>/${esc(st.settings.charMax)}</small></th><th>សរុប ម.ប្រ.ឆ្នាំ</th><th>ចំ.ថ្នាក់</th>` +
    COND.map(([, l]) => `<th colspan="3">${l}<br><small>ឆ១ · ឆ២ · ឆ្នាំ</small></th>`).join('') + `</tr></thead><tbody>` +
    st.students.map(s => {
      const [ln, fn] = splitName(s.name);
      return `<tr data-id="${s.id}"><td>${esc(s.sid)}</td><td class="l">${esc(ln)}</td><td class="l">${esc(fn)}</td><td>${esc(s.sex)}</td>
      <td data-k="vij" data-s="${s.id}"></td>
      <td><input type="number" step="0.01" min="0" max="${st.settings.skillMax}" data-s="${s.id}" data-f="skill" value="${s.skill === undefined ? '' : s.skill}"></td>
      <td><input type="number" step="0.01" min="0" max="${st.settings.charMax}" data-s="${s.id}" data-f="char" value="${s.char === undefined ? '' : s.char}"></td>
      <td data-k="tot" data-s="${s.id}"></td><td class="rk" data-k="rk" data-s="${s.id}"></td>` +
      COND.map(([key]) => [0, 1, 2].map(i => `<td><select data-s="${s.id}" data-cond="${key}" data-i="${i}">${COND_OPTS.map(o => `<option ${((s.cond && s.cond[key] && s.cond[key][i]) || 'ល្អ') === o ? 'selected' : ''}>${o}</option>`).join('')}</select></td>`).join('')).join('') + '</tr>';
    }).join('') + '</tbody>';
  refreshSkill();
  applyAllQ();
}
function refreshSkill() {
  $$('#tblK [data-k]').forEach(el => {
    const r = C.K.rows[el.dataset.s]; if (!r) return;
    const v = r[el.dataset.k]; el.textContent = v == null ? '' : el.dataset.k === 'rk' ? String(v) : f2(v);
  });
}
function bindSkill() {
  $('#tblK').addEventListener('change', e => {
    const t = e.target, s = st.students.find(x => x.id === t.dataset.s);
    if (!s || !t.dataset.cond) return;
    s.cond = s.cond || defCond();
    s.cond[t.dataset.cond] = s.cond[t.dataset.cond] || ['ល្អ', 'ល្អ', 'ល្អ'];
    s.cond[t.dataset.cond][Number(t.dataset.i)] = t.value; save();
  });
  $('#tblK').addEventListener('input', e => {
    const t = e.target, s = st.students.find(x => x.id === t.dataset.s); if (!s || !t.dataset.f) return;
    s[t.dataset.f] = t.value === '' ? '' : Number(t.value); save(); recalc(); refreshSkill();
  });
  const rows = () => {
    recalc();
    return [['អត្តលេខ', 'គោត្តនាម', 'នាម', 'ភេទ', 'វិជ្ជាសម្បទា', 'បំណិនសម្បទា', 'ចរិយាសម្បទា', 'សរុបម.ប្រ.ឆ្នាំ', 'ចំ.ថ្នាក់']].concat(st.students.map(s => {
      const [ln, fn] = splitName(s.name), r = C.K.rows[s.id], n = v => v == null ? '' : Math.round(v * 100) / 100;
      return [s.sid, ln, fn, s.sex, n(r.vij), s.skill, s.char, n(r.tot), r.rk == null ? '' : r.rk];
    }));
  };
  $('#expSk').onclick = () => { if (needXlsx()) download(aoaBook([['បំណិន', rows()]]), 'ពិន្ទុបំណិន-' + st.settings.cls + '.xlsx'); };
  $('#tplSk').onclick = () => { if (needXlsx()) download(aoaBook([['បំណិន', [['អត្តលេខ', 'ឈ្មោះ', 'ភេទ', 'បំណិនសម្បទា', 'ចរិយាសម្បទា']].concat(st.students.map(s => [s.sid, s.name, s.sex, s.skill, s.char]))]]), 'គំរូ-ពិន្ទុបំណិន.xlsx'); };
  $('#impSkBtn').onclick = () => $('#f-sk').click();
  $('#f-sk').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try {
      const { heads, rows: rs } = await readXlsx(f);
      const ci = colOf(heads, ['អត្តលេខ', 'អត្តលេខសិស្ស', 'id']);
      const cn = colOf(heads, ['ឈ្មោះ', 'ឈ្មោះសិស្ស', 'name']);
      const ck = colOf(heads, ['បំណិនសម្បទា', 'ពិន្ទុបំណិនសម្បទា', 'បំណិន', 'skill']);
      const cc = colOf(heads, ['ចរិយាសម្បទា', 'ពិន្ទុចរិយាសម្បទា', 'ចរិយា', 'conduct']);
      if (ck < 0 && cc < 0) return toast('រកមិនឃើញជួរ «បំណិនសម្បទា» ឬ «ចរិយាសម្បទា»');
      let ok = 0;
      rs.forEach(r => {
        const s = findStudent(ci >= 0 ? r[ci] : '', cn >= 0 ? r[cn] : ''); if (!s) return;
        if (ck >= 0 && isNum(r[ck])) s.skill = Number(r[ck]);
        if (cc >= 0 && isNum(r[cc])) s.char = Number(r[cc]);
        ok++;
      });
      save(); renderSkill(); toast('នាំចូល ' + ok + ' នាក់');
    } catch (err) { toast('មានបញ្ហា ៖ ' + err.message); }
  };
}

/* ===== ៧. ព្រឹត្តិបត្រ ===== */
function renderSelect() {
  const v = $('#cardSel').value || ui.sel;
  $('#cardSel').innerHTML = st.students.map((s, i) => `<option value="${s.id}">${i + 1}. ${esc(s.sid)} ${esc(s.name)}</option>`).join('');
  if (st.students.some(s => s.id === v)) $('#cardSel').value = v;
}
function cardHTML(s) {
  const S = st.settings, A = C.A.rows[s.id], B = C.B.rows[s.id], Y = C.Y.rows[s.id], K = C.K.rows[s.id];
  const fm = v => v == null ? '' : f2(v);
  const fr = v => v == null ? '' : String(v);
  const sc = v => v == null ? '' : String(Math.round(v * 100) / 100);
  const p2 = n => String(Number(n) || 0).padStart(2, '0');
  const grp = [A, B, Y];
  const cond = s.cond || defCond();
  const rows = st.subjects.map(j => {
    let t = `<tr><td class="n b">${esc(j.name)}</td>`;
    grp.forEach(g => { t += `<td>${g.sub[j.id] ? sc(g.sub[j.id].raw) : ''}</td><td class="red">${fr(g['r_' + j.id])}</td>`; });
    return t + '<td></td></tr>';
  }).join('');
  const pair = (label, key, rk, right) => `<tr><td class="n b">${label}</td>${grp.map(g => `<td>${fm(g[key])}</td><td class="red">${fr(g[rk])}</td>`).join('')}${right}</tr>`;
  const line = t => `<td class="n">${t}</td>`;
  const a1p = Number(s.a1p) || 0, a1u = Number(s.a1u) || 0, a2p = Number(s.a2p) || 0, a2u = Number(s.a2u) || 0;
  const condRow = (key, label, right) => `<tr><td class="n b">${label}</td>${[0, 1, 2].map(i => `<td colspan="2">${esc((cond[key] || [])[i] || 'ល្អ')}</td>`).join('')}${right}</tr>`;
  const lbl = g => g.gr || '';
  const sign = (title, who, name) => `<div><div>${title}</div><div style="border-bottom:1.5px dotted #000;margin:20px 8px 14px"></div><div>${esc(S.lunar)}</div><div>${esc(S.signDate)}</div><div class="b">${who}</div><div class="sp"></div><div class="b">${esc(name)}</div></div>`;
  return `<div class="card" data-id="${s.id}"><div class="in">
  <div class="c moul" style="font-size:14px">ព្រះរាជាណាចក្រកម្ពុជា</div>
  <div class="c moul" style="font-size:12.5px;margin-top:2px">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
  <div class="hl moul">${esc(S.province)}<br>${esc(S.school)}</div>
  <h2 class="red">ព្រឹត្តិបត្រពិន្ទុប្រចាំឆ្នាំសិក្សា ${esc(kd(S.year))}</h2>
  <table class="ib"><colgroup><col style="width:21%"><col style="width:3%"><col style="width:30%"><col style="width:14%"><col style="width:3%"><col></colgroup>
    <tr><td>របស់សិស្សឈ្មោះ</td><td>:</td><td class="blue nm ctr">${esc(s.name)}</td><td>ភេទ</td><td>:</td><td class="blue">${esc(s.sex)}</td></tr>
    <tr><td>ថ្ងៃខែឆ្នាំកំណើត</td><td>:</td><td class="blue ctr" style="font-weight:400">${esc(dobKh(s.dob))}</td><td>ថ្នាក់ទី</td><td>:</td><td class="blue">${esc(kd(S.cls))}</td></tr></table>
  <table class="main"><colgroup><col style="width:150px">${'<col style="width:54px"><col style="width:54px">'.repeat(3)}<col></colgroup>
  <tr><th rowspan="2">មុខវិជ្ជា</th><th colspan="2">ឆមាសទី១</th><th colspan="2">ឆមាសទី២</th><th colspan="2">ប្រចាំឆ្នាំ</th><th rowspan="2" style="font-size:11.5px">មូលវិចារ ហត្ថលេខា<br>និងឈ្មោះគ្រូមុខវិជ្ជា</th></tr>
  <tr>${'<th>ពិន្ទុ</th><th class="red">ចំ.ថ្នាក់</th>'.repeat(3)}</tr>
  ${rows}
  ${pair('សរុបពិន្ទុប្រឡងឆមាស', 'tot', 'rk', '<td class="b">បានទទួល</td>')}
  ${pair('មធ្យមភាគពិន្ទុប្រឡងឆមាស', 'avg', 'rk', line('ប័ណ្ណសរសើរចំនួន............'))}
  ${pair('មធ្យមភាគពិន្ទុខែឆមាស', 'mo', 'mrk', line('លិខិតសរសើរចំនួន............'))}
  ${pair('មធ្យមភាគពិន្ទុប្រចាំឆមាស', 'sav', 'srk', line('សក្ខីប័ណ្ណលើកទឹកចិត្ត........'))}
  ${condRow('moral', 'សីលធម៌', line('មធ្យមភាគពិន្ទុវិជ្ជាសម្បទា : ' + fm(K.vij)))}
  ${condRow('labor', 'ពលកម្ម-បង្កបង្កើនផល', line('មធ្យមភាគពិន្ទុបំណិនសម្បទា : ' + (s.skill === '' || s.skill == null ? '' : f2(Number(s.skill)))))}
  ${condRow('health', 'សុខភាព-អនាម័យ', line('មធ្យមភាគពិន្ទុចរិយាសម្បទា : ' + (s.char === '' || s.char == null ? '' : f2(Number(s.char)))))}
  <tr><td class="n b" rowspan="2">ចំនួនអវត្តមាន</td><td colspan="2">មានច្បាប់:${p2(a1p)} ដង</td><td colspan="2">មានច្បាប់:${p2(a2p)} ដង</td><td colspan="2">មានច្បាប់:${p2(a1p + a2p)} ដង</td>${line('មធ្យមភាគពិន្ទុប្រចាំឆ្នាំ : <b>' + fm(K.tot) + '</b>')}</tr>
  <tr><td colspan="2">អត់ច្បាប់:${p2(a1u)} ដង</td><td colspan="2">អត់ច្បាប់:${p2(a2u)} ដង</td><td colspan="2">អត់ច្បាប់:${p2(a1u + a2u)} ដង</td><td></td></tr>
  <tr><td class="n b">ការសិក្សា</td>${grp.map(g => `<td colspan="2">${lbl(g)}</td>`).join('')}<td></td></tr>
  </table>
  <div class="sign">${sign('មូលវិចារណ៍នាយកសាលា', 'នាយកសាលា', S.principal)}${sign('មូលវិចារណ៍គ្រូបន្ទុកថ្នាក់', 'គ្រូបន្ទុកថ្នាក់', S.teacher)}</div>
  </div></div>`;
}
function fitCards(root) {
  $$('.card', root).forEach(c => {
    const inn = $('.in', c); if (!inn) return;
    inn.style.transform = ''; inn.style.width = '';
    const cs = getComputedStyle(c);
    const avail = c.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const h = inn.offsetHeight;
    if (h > avail) {
      const k = avail / h;
      inn.style.transformOrigin = 'top left'; inn.style.width = (100 / k) + '%'; inn.style.transform = 'scale(' + k + ')';
    }
  });
}
function renderCards() {
  recalc();
  const s = st.students.find(x => x.id === $('#cardSel').value);
  $('#cards').innerHTML = s ? cardHTML(s) : '<p class="hint" style="text-align:center;background:#fff;padding:30px">មិនទាន់មានសិស្ស។</p>';
  fitCards($('#cards')); if (document.fonts) document.fonts.ready.then(() => fitCards($('#cards')));
}
function bindCards() {
  $('#cardSel').onchange = () => { ui.sel = $('#cardSel').value; renderCards(); };
  const doPrint = all => {
    if (!st.students.length) return toast('មិនទាន់មានសិស្ស');
    recalc();
    if (all) $('#cards').innerHTML = st.students.map(cardHTML).join('');
    fitCards($('#cards'));
    setTimeout(() => { fitCards($('#cards')); window.print(); renderCards(); }, 400);
  };
  $('#btnPrint').onclick = () => doPrint(false);
  $('#btnPrintAll').onclick = () => doPrint(true);
  $('#btnPdf').onclick = () => { const s = st.students.find(x => x.id === $('#cardSel').value); makePDF(s ? [s] : []); };
  $('#btnPdfAll').onclick = () => makePDF(st.students);
}
async function makePDF(list) {
  if (!window.jspdf || !window.html2canvas) return toast('មិនអាចផ្ទុក Library (ត្រូវការអ៊ីនធឺណិត)');
  if (!list.length) return toast('មិនទាន់មានសិស្ស');
  recalc();
  const stage = $('#stage'), pdf = new jspdf.jsPDF('p', 'mm', 'a4');
  toast('កំពុងបង្កើត PDF...'); await document.fonts.ready;
  for (let i = 0; i < list.length; i++) {
    stage.innerHTML = cardHTML(list[i]); fitCards(stage);
    const cv = await html2canvas(stage.firstElementChild, { scale: 2, backgroundColor: '#fff', useCORS: true });
    if (i) pdf.addPage();
    pdf.addImage(cv.toDataURL('image/jpeg', .95), 'JPEG', 0, 0, 210, 297);
    setStatus('PDF ' + (i + 1) + '/' + list.length);
  }
  stage.innerHTML = '';
  pdf.save(list.length === 1 ? 'ព្រឹត្តិបត្រ-' + list[0].name + '.pdf' : 'ព្រឹត្តិបត្រ-' + st.settings.cls + '.pdf');
  toast('បាននាំចេញ PDF');
}

/* ===== ៨. Google ===== */
async function push(silent) {
  if (!ui.api) return toast('សូមបញ្ចូល Web App URL');
  setStatus('កំពុងផ្ញើទៅ Google...');
  try {
    const res = await fetch(ui.api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'save', data: st }) });
    const j = await res.json(); if (!j.ok) throw new Error(j.error);
    setStatus('បានផ្ញើទៅ Google ' + new Date().toLocaleTimeString());
    if (!silent) toast('ផ្ញើបានជោគជ័យ (' + j.students + ' សិស្ស)');
  } catch (e) { setStatus('ផ្ញើមិនបាន'); toast('មានបញ្ហា ៖ ' + e.message); }
}
async function pull() {
  if (!ui.api) return toast('សូមបញ្ចូល Web App URL');
  if (!confirm('ទិន្នន័យក្នុងម៉ាស៊ីននេះនឹងត្រូវជំនួសដោយទិន្នន័យពី Google។ បន្ត?')) return;
  setStatus('កំពុងទាញយក...');
  try {
    const res = await fetch(ui.api + (ui.api.includes('?') ? '&' : '?') + 'action=load');
    const j = await res.json(); if (!j.ok) throw new Error(j.error);
    const d = j.data, num = v => v === '' || v == null ? '' : (isNaN(Number(v)) ? '' : Number(v));
    if (d.subjects.length) st.subjects = d.subjects;
    const set = Object.assign({}, d.settings);
    ['M', 'skillPct', 'skillMax', 'charMax'].forEach(k => { if (k in set) set[k] = Number(set[k]) || st.settings[k]; });
    st.settings = Object.assign(st.settings, set);
    [['gradeW', 3, [80, 65, 50]], ['gradeL', 5, [90, 80, 70, 60, 50]]].forEach(([k, n, df]) => {
      const v = typeof st.settings[k] === 'string' ? st.settings[k].split(',').map(Number) : st.settings[k];
      st.settings[k] = (Array.isArray(v) && v.length === n && !v.some(isNaN)) ? v : df;
    });
    st.students = d.students.map(s => newStudent(Object.assign({}, s, { a1p: Number(s.a1p) || 0, a1u: Number(s.a1u) || 0, a2p: Number(s.a2p) || 0, a2u: Number(s.a2u) || 0, m1: num(s.m1), m2: num(s.m2), skill: num(s.skill), char: num(s.char), cond: (s.cond && s.cond.moral) ? s.cond : defCond() })));
    save(); renderAll(); toast('ទាញយកបានជោគជ័យ');
  } catch (e) { setStatus('ទាញយកមិនបាន'); toast('មានបញ្ហា ៖ ' + e.message); }
}
function bindSync() {
  $('#gsView').value = (window.GS_CODE || '').trim();
  $('#copyGs').onclick = async () => {
    const t = $('#gsView').value;
    try { await navigator.clipboard.writeText(t); } catch (e) { $('#gsView').select(); document.execCommand('copy'); }
    $('#copyMsg').textContent = '✔ បានចម្លងកូដ'; toast('បានចម្លងកូដ Apps Script');
  };
  $('#api').oninput = e => { ui.api = e.target.value.trim(); save(); };
  $('#auto').onchange = e => { ui.auto = e.target.checked; save(); };
  $('#pushG').onclick = () => push(false);
  $('#pullG').onclick = pull;
}

/* ===== ស្វែងរក (ឈ្មោះ / អត្តលេខ) ===== */
const normQ = s => toLat(String(s == null ? '' : s)).toLowerCase().replace(/\s+/g, '');
function applyQ(inp) {
  const table = $(inp.dataset.q); if (!table) return;
  const words = toLat(inp.value).toLowerCase().split(/\s+/).filter(Boolean);
  const byId = {}; st.students.forEach(s => { byId[s.id] = s; });
  let shown = 0, total = 0;
  $$('tr[data-id]', table).forEach(tr => {
    const s = byId[tr.dataset.id]; total++;
    const hay = normQ(s ? s.name + ' ' + s.sid : '') + ' ' + toLat(s ? s.name : '').toLowerCase();
    const ok = !words.length || words.every(w => hay.includes(w.replace(/\s+/g, '')));
    tr.hidden = !ok; if (ok) shown++;
  });
  const c = inp.parentElement.querySelector('.qc');
  if (c) c.textContent = words.length ? 'បង្ហាញ ' + shown + ' / ' + total : '';
}
const applyAllQ = () => $$('input.q').forEach(applyQ);
document.addEventListener('input', e => { if (e.target.classList && e.target.classList.contains('q')) applyQ(e.target); });

/* ===== Tabs ===== */
function showTab(p) {
  ui.tab = p;
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.p === p));
  $$('.panel').forEach(x => x.classList.toggle('on', x.id === 'p-' + p));
  if (p === 'set') renderSettings();
  if (p === 'stu') renderStudents();
  if (p === 's1') renderSem(1);
  if (p === 's2') renderSem(2);
  if (p === 'y') renderSem('y');
  if (p === 'sk') renderSkill();
  if (p === 'card') { renderSelect(); renderCards(); }
  if (p === 'sync') { $('#api').value = ui.api || ''; $('#auto').checked = !!ui.auto; }
}
function renderAll() { showTab(ui.tab || 'set'); }

load();
if (!st.settings.dateAutoV2) { if (!st.settings.place) st.settings.place = 'កណ្តៀង'; if (parseDMY(st.settings.date)) autoDates(); st.settings.dateAutoV2 = 1; save(); }
bindSettings(); bindStudents(); bindSem(1); bindSem(2); bindScoreButtons(); bindSkill(); bindCards(); bindSync();
$('#nav').addEventListener('click', e => { if (e.target.dataset.p) showTab(e.target.dataset.p); });
renderAll();
