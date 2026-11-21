/* ===== ការគណនា (pure functions, take state `st`) ===== */
const isNum = v => v !== '' && v != null && !isNaN(Number(v));
const mean2 = (a, b) => a == null ? (b == null ? null : b) : (b == null ? a : (a + b) / 2);

function rankMap(items) {
  const vals = items.filter(x => x.v != null);
  const m = {};
  items.forEach(x => { m[x.id] = x.v == null ? null : vals.filter(y => y.v > x.v + 1e-9).length + 1; });
  return m;
}

function gradeOf(st, a) {
  if (a == null) return '';
  const p = a / (Number(st.settings.M) || 50) * 100;
  if (p >= 90) return 'A';
  if (p >= 80) return 'B';
  if (p >= 70) return 'C';
  if (p >= 60) return 'D';
  if (p >= 50) return 'E';
  return 'F';
}

function addRanks(st, rows, pairs) {
  pairs.forEach(([src, dst]) => {
    const m = rankMap(st.students.map(s => ({ id: s.id, v: rows[s.id][src] })));
    st.students.forEach(s => { rows[s.id][dst] = m[s.id]; });
  });
}

function semCalc(st, k) {
  const M = Number(st.settings.M) || 50;
  const rows = {};
  st.students.forEach(s => {
    const sc = s['s' + k] || {};
    let tot = 0, cf = 0;
    const sub = {};
    st.subjects.forEach(j => {
      const raw = sc[j.id];
      if (isNum(raw)) {
        const n = Number(raw) / (Number(j.max) || M) * M;
        sub[j.id] = { raw: Number(raw), n };
        tot += n * (Number(j.coef) || 0);
        cf += Number(j.coef) || 0;
      } else sub[j.id] = null;
    });
    const avg = cf ? tot / cf : null;
    const mo = isNum(s['m' + k]) ? Number(s['m' + k]) : null;
    rows[s.id] = { sub, tot: cf ? tot : null, avg, mo, sav: (avg != null && mo != null) ? (avg + mo) / 2 : null };
  });
  st.subjects.forEach(j => {
    const m = rankMap(st.students.map(s => ({ id: s.id, v: rows[s.id].sub[j.id] ? rows[s.id].sub[j.id].n : null })));
    st.students.forEach(s => { rows[s.id]['r_' + j.id] = m[s.id]; });
  });
  addRanks(st, rows, [['avg', 'rk'], ['mo', 'mrk'], ['sav', 'srk']]);
  st.students.forEach(s => { rows[s.id].gr = gradeOf(st, rows[s.id].sav); });
  return { rows };
}

function yearAll(st) {
  const A = semCalc(st, 1), B = semCalc(st, 2);
  const rows = {};
  st.students.forEach(s => {
    const a = A.rows[s.id], b = B.rows[s.id], sub = {};
    st.subjects.forEach(j => {
      const x = a.sub[j.id], y = b.sub[j.id];
      const n = mean2(x ? x.n : null, y ? y.n : null);
      const raw = mean2(x ? x.raw : null, y ? y.raw : null);
      sub[j.id] = n == null ? null : { raw, n };
    });
    rows[s.id] = { sub, tot: mean2(a.tot, b.tot), avg: mean2(a.avg, b.avg), mo: mean2(a.mo, b.mo), sav: mean2(a.sav, b.sav) };
  });
  st.subjects.forEach(j => {
    const m = rankMap(st.students.map(s => ({ id: s.id, v: rows[s.id].sub[j.id] ? rows[s.id].sub[j.id].n : null })));
    st.students.forEach(s => { rows[s.id]['r_' + j.id] = m[s.id]; });
  });
  addRanks(st, rows, [['avg', 'rk'], ['mo', 'mrk'], ['sav', 'srk']]);
  st.students.forEach(s => { rows[s.id].gr = gradeOf(st, rows[s.id].sav); });
  const Y = { rows };

  const sp = Number(st.settings.skillPct);
  const pct = isNaN(sp) ? 80 : sp;
  const K = { rows: {} };
  st.students.forEach(s => {
    const y = Y.rows[s.id].sav;
    const v = y == null ? null : y * pct / 100;
    const sk = isNum(s.skill) ? Number(s.skill) : 0;
    const ch = isNum(s.char) ? Number(s.char) : 0;
    K.rows[s.id] = { vij: v, tot: v == null ? null : v + sk + ch };
  });
  addRanks(st, K.rows, [['tot', 'rk']]);
  return { A, B, Y, K };
}

if (typeof module !== 'undefined') module.exports = { isNum, mean2, rankMap, gradeOf, semCalc, yearAll };
