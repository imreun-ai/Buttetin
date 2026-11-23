/**
 * ប្រព័ន្ធព្រឹត្តិបត្រពិន្ទុ - Google Apps Script
 * 1) Run setup() ម្តង ដើម្បីបង្កើត Sheet   2) Deploy ជា Web app (Anyone)
 */
var SPREADSHEET_ID = '1A7HNCPOa3s1r75X0ycEF8OatRDC3cyWnBIGYHwxWFew';
var ROSTER_ID = '16Qwf980aFgGEO2P4a7t4i-YSiGINXuKhjUkzYuMpf5A';   // Sheet ឈ្មោះសិស្ស (ភ្ជាប់ជាប់ជានិច្ច)
var TABLES = {
  settings: { name: 'App_ការកំណត់', head: ['key', 'value'] },
  subjects: { name: 'App_មុខវិជ្ជា', head: ['id', 'name', 'coef', 'max', 'count'] },
  students: { name: 'App_សិស្ស', head: ['id', 'sid', 'name', 'sex', 'dob', 'a1p', 'a1u', 'a2p', 'a2u', 'm1', 'm2', 'skill', 'char', 'cond'] },
  scores:   { name: 'App_ពិន្ទុ', head: ['studentId', 'subjectId', 's1', 's2'] },
  classes:  { name: 'App_ថ្នាក់', head: ['cls', 'part', 'json'] }
};

function getSS_() {
  try { var a = SpreadsheetApp.getActiveSpreadsheet(); if (a) return a; } catch (e) {}
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function ensure_(key) {
  var ss = getSS_(), t = TABLES[key];
  var sh = ss.getSheetByName(t.name);
  if (sh) {
    sh.getRange(1, 1, 1, t.head.length).setValues([t.head]);   // keep header in sync with newer versions
  } else {
    sh = ss.insertSheet(t.name);
    sh.getRange(1, 1, 1, t.head.length).setValues([t.head]).setFontWeight('bold').setBackground('#e8eefc');
    sh.setFrozenRows(1);
    sh.getRange(1, 1, sh.getMaxRows(), t.head.length).setNumberFormat('@');
  }
  return sh;
}

function setup() {
  for (var k in TABLES) ensure_(k);
  return 'OK';
}

function write_(key, rows) {
  var t = TABLES[key], sh = ensure_(key);
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, t.head.length).clearContent();
  if (rows && rows.length) {
    if (sh.getMaxRows() < rows.length + 1) sh.insertRowsAfter(sh.getMaxRows(), rows.length + 1 - sh.getMaxRows());
    var r = sh.getRange(2, 1, rows.length, t.head.length);
    r.setNumberFormat('@');
    r.setValues(rows.map(function (x) {
      return x.map(function (v) { return v === null || v === undefined ? '' : String(v); });
    }));
  }
}

function read_(key) {
  var t = TABLES[key], sh = ensure_(key), last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, t.head.length).getValues();
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var body = JSON.parse(e.postData.contents);
    if (body.action !== 'save') return json_({ ok: false, error: 'unknown action' });
    var d = body.data;
    write_('settings', Object.keys(d.settings || {}).map(function (k) { return [k, d.settings[k]]; }));
    write_('subjects', (d.subjects || []).map(function (s) { return [s.id, s.name, s.coef, s.max, s.count === false ? 0 : 1]; }));
    write_('students', (d.students || []).map(function (s) {
      return [s.id, s.sid, s.name, s.sex, s.dob, s.a1p, s.a1u, s.a2p, s.a2u, s.m1, s.m2, s.skill, s.char, JSON.stringify(s.cond || {})];
    }));
    var sc = [];
    (d.students || []).forEach(function (s) {
      var a = s.s1 || {}, b = s.s2 || {}, ids = {}, k;
      for (k in a) ids[k] = 1;
      for (k in b) ids[k] = 1;
      for (k in ids) {
        var v1 = a[k] === undefined ? '' : a[k], v2 = b[k] === undefined ? '' : b[k];
        if (v1 !== '' || v2 !== '') sc.push([s.id, k, v1, v2]);
      }
    });
    write_('scores', sc);
    var store = d.store || {}, crow = [];
    for (var ck in store) {
      var js = JSON.stringify(store[ck]);
      for (var p = 0, i = 0; i < js.length; i += 40000, p++) crow.push([ck, p, js.substr(i, 40000)]);
    }
    write_('classes', crow);
    return json_({ ok: true, students: (d.students || []).length, scores: sc.length });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function roster_() {
  try {
    var ss = SpreadsheetApp.openById(ROSTER_ID);
    var v = ss.getSheetByName('ឈ្មោះសិស្ស').getDataRange().getDisplayValues();
    var h = v[0].map(function (x) { return String(x).replace(/\s/g, ''); });
    var ci = h.indexOf('អត្តលេខ'), cn = h.indexOf('ឈ្មោះសិស្ស'), cs = h.indexOf('ភេទ'), cd = h.indexOf('ថ្ងៃខែឆ្នាំកំណើត'), cc = h.indexOf('ថ្នាក់');
    var rows = v.slice(1).filter(function (r) { return r[cn]; }).map(function (r) {
      return { sid: r[ci], name: r[cn], sex: r[cs], dob: r[cd], cls: r[cc] };
    });
    var cl = ss.getSheetByName('ថ្នាក់');
    var classes = cl ? cl.getDataRange().getValues().slice(1).map(function (r) { return String(r[0]).trim(); }).filter(String) : [];
    return json_({ ok: true, rows: rows, classes: classes });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'roster') return roster_();
  try {
    var settings = {};
    read_('settings').forEach(function (r) { settings[r[0]] = r[1]; });
    var subjects = read_('subjects').map(function (r) {
      return { id: String(r[0]), name: r[1], coef: Number(r[2]) || 1, max: Number(r[3]) || 100, count: String(r[4]) !== '0' };
    });
    var students = read_('students').map(function (r) {
      var cond = {};
      try { cond = JSON.parse(r[13] || '{}'); } catch (x) {}
      return { id: String(r[0]), sid: r[1], name: r[2], sex: r[3], dob: r[4], a1p: r[5], a1u: r[6], a2p: r[7], a2u: r[8],
               m1: r[9], m2: r[10], skill: r[11], char: r[12], cond: cond, s1: {}, s2: {} };
    });
    var byId = {};
    students.forEach(function (s) { byId[s.id] = s; });
    read_('scores').forEach(function (r) {
      var s = byId[String(r[0])];
      if (!s) return;
      if (r[2] !== '') s.s1[String(r[1])] = Number(r[2]);
      if (r[3] !== '') s.s2[String(r[1])] = Number(r[3]);
    });
    var store = {}, parts = {};
    read_('classes').forEach(function (r) { var k = String(r[0]); (parts[k] = parts[k] || []).push([Number(r[1]), String(r[2])]); });
    for (var k in parts) {
      parts[k].sort(function (a, b) { return a[0] - b[0]; });
      try { store[k] = JSON.parse(parts[k].map(function (x) { return x[1]; }).join('')); } catch (x) {}
    }
    return json_({ ok: true, data: { settings: settings, subjects: subjects, students: students, store: store } });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}
