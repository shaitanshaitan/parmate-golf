// Parmate player app — Solo Round: one player, stroke play (gross + net) or Stableford.
// Loaded by index.html with a plain <script src> right after app-main.js (no defer/async/module).
//
// Reuses the Team Round flow: course + loop choice (screen-trcourse) and the hole-by-hole and
// full scorecards (screen-trscore / screen-trfull). Solo adds one setup screen (screen-solosetup)
// and small hooks in app-main.js that call into this file when _trFlow.mode === 'solo'.
// Team rounds never enter this code path: every hook checks soloOn() first.
//
// WHS (World Handicap System):
//   Course Handicap  = Index x (Slope / 113) + (Course Rating - Par)        [9 holes: half the Index]
//   Playing Handicap = Course Handicap x allowance (default 100%, WHS competition advice 95%)
//   Strokes per hole: PH 1-18 gives one stroke on stroke index 1..PH; above 18 a second round
//   starts again at SI 1; a plus handicap gives strokes back starting at the easiest hole.
//   Stableford points = 2 + (par + strokes received - gross), never below 0; a pick-up scores 0.

// ═════════════════════════════════════════════════════════════════════
// A1 · CALCULATION CORE (pure functions, no DOM; covered by the headless tests)
// ═════════════════════════════════════════════════════════════════════
var SOLO_DEFAULT_PCT = 100;

// WHS rounding: nearest whole number, .5 away from zero (+1.5 -> +2, plus 1.5 -> plus 2).
function soloRound(x, decimals) {
  var f = Math.pow(10, decimals || 0);
  return (x < 0 ? -Math.round(-x * f) : Math.round(x * f)) / f;
}

// Index used for play: 9 holes use half the 18-hole Handicap Index, to one decimal.
function soloPlayIndex(index, holes) {
  var i = parseFloat(index);
  if (isNaN(i)) return null;
  return (holes <= 9) ? soloRound(i / 2, 1) : i;
}

// Course + Playing Handicap for one player on one tee.
// tee = { rating, slope, par } for the holes actually played (9 or 18).
function trCalcSingle(index, tee, holes, allowancePct) {
  var pi = soloPlayIndex(index, holes);
  if (pi == null || !tee || tee.rating == null || tee.slope == null) return null;
  var rating = Number(tee.rating), slope = Number(tee.slope), par = Number(tee.par);
  var pct = (allowancePct == null || isNaN(allowancePct)) ? SOLO_DEFAULT_PCT : Number(allowancePct);
  var chRaw = pi * (slope / 113) + (rating - par);
  return {
    playIndex: pi,
    courseHcpRaw: chRaw,
    courseHcp: soloRound(chRaw),
    playingHcp: soloRound(chRaw * pct / 100),   // allowance on the unrounded Course Handicap
    allowancePct: pct,
  };
}

// Rank 1..n of every hole by stroke index (works for 1-18, 1-9 and odd/even 9-hole SI sets).
function soloSIRanks(siArr, n) {
  var arr = [];
  for (var i = 0; i < n; i++) {
    var v = (siArr && siArr[i] != null && !isNaN(Number(siArr[i]))) ? Number(siArr[i]) : (i + 1);
    arr.push({ i: i, si: v });
  }
  arr.sort(function (a, b) { return (a.si - b.si) || (a.i - b.i); });
  var out = new Array(n);
  arr.forEach(function (x, r) { out[x.i] = r + 1; });
  return out;
}

// Handicap strokes per hole (array of n). Negative numbers = strokes given back (plus handicap).
function trStrokesPerHole(ph, siArr, n) {
  n = n || (siArr ? siArr.length : 18);
  var ranks = soloSIRanks(siArr, n), out = new Array(n).fill(0);
  if (!ph) return out;
  var k = Math.abs(ph), base = Math.floor(k / n), rem = k % n;
  for (var i = 0; i < n; i++) {
    var extra = (ph > 0) ? (ranks[i] <= rem ? 1 : 0) : (ranks[i] > n - rem ? 1 : 0);
    var v = base + extra;
    out[i] = v ? (ph > 0 ? v : -v) : 0;
  }
  return out;
}

// One hole. gross 0 = picked up (Stableford only).
function soloHolePoints(gross, par, strokes) {
  if (gross == null) return null;
  if (gross === 0) return 0;
  return Math.max(0, 2 + (par + strokes) - gross);
}
function soloHoleNet(gross, strokes) {
  if (gross == null || gross === 0) return null;
  return gross - strokes;
}

// Totals over the holes played so far. A pick-up counts as net double bogey for gross/net
// (the score that is worth 0 Stableford points), so totals stay comparable.
function soloTotals(scores, parArr, strokes) {
  var t = { played: 0, gross: 0, net: 0, parPlayed: 0, points: 0, pickups: 0, n: scores.length };
  for (var i = 0; i < scores.length; i++) {
    var g = scores[i]; if (g == null) continue;
    var p = Number(parArr[i] != null ? parArr[i] : 4), s = strokes[i] || 0;
    var gAdj = (g === 0) ? (p + s + 2) : g;
    if (g === 0) t.pickups++;
    t.played++; t.gross += gAdj; t.net += gAdj - s; t.parPlayed += p;
    t.points += soloHolePoints(g, p, s);
  }
  t.vsPar = t.gross - t.parPlayed;
  t.netVsPar = t.net - t.parPlayed;
  return t;
}

// True when the stroke index per hole looks usable: n distinct numbers.
function soloHasValidSI(siArr, n) {
  if (!Array.isArray(siArr) || siArr.length < n) return false;
  var seen = {};
  for (var i = 0; i < n; i++) {
    var v = Number(siArr[i]);
    if (!v || isNaN(v) || seen[v]) return false;
    seen[v] = 1;
  }
  return true;
}

function soloSigned(v) { return v > 0 ? '+' + v : (v === 0 ? 'E' : String(v)); }
function soloPhLabel(ph) { return ph < 0 ? '+' + (-ph) : String(ph); }   // plus handicap shown as +2

// ═════════════════════════════════════════════════════════════════════
// A2 · FLOW
// ═════════════════════════════════════════════════════════════════════
function soloOn() {
  return (typeof _trFlow !== 'undefined') && !!_trFlow && _trFlow.mode === 'solo';
}

function soloMe() {
  var p = (typeof _profile !== 'undefined' && _profile) ? _profile : {};
  return { name: p.displayName || 'You', hcp: (p.hcpIndex != null ? p.hcpIndex : null), avatarId: p.avatarId,
           gender: p.gender || 'M', isMe: true };
}

// Choose Game -> Solo Round
function cgSolo() {
  _gameMode = 'single';
  if (typeof trStart !== 'function') return;
  trStart();                      // fresh _trFlow and shows screen-trcourse
  var me = soloMe();
  _trFlow.mode = 'solo';
  _trFlow.team = { name: me.name, size: 1, players: [me] };
  _trFlow.solo = { format: 'stroke', pct: SOLO_DEFAULT_PCT, index: me.hcp, teeKey: null, gender: me.gender };
}

// Tee options for this player's gender on the composed course
function soloTeeOptions() {
  var c = (_trFlow && _trFlow.course) || {};
  var g = (_trFlow.solo && _trFlow.solo.gender) || 'M';
  var arr = (g === 'F' && c.women && c.women.length) ? c.women : (c.tees || []);
  return arr.filter(function (t) { return t && t.rating != null && t.slope != null; });
}
function soloTee() {
  var opts = soloTeeOptions(), key = (_trFlow.solo.teeKey || '').toLowerCase();
  var t = opts.find(function (x) { return (x.label || '').toLowerCase() === key; })
       || opts.find(function (x) { return /medal|geel|yellow/i.test(x.label || ''); })
       || opts[0];
  if (!t) return null;
  var c = _trFlow.course || {};
  return { label: t.label, rating: Number(t.rating), slope: Number(t.slope), par: Number(t.par) || Number(c.par) || 72 };
}
function soloTeeDot(label) {
  var l = (label || '').toLowerCase();
  if (/champ|wit|white/.test(l)) return 'champion';
  if (/forward|rood|red/.test(l)) return 'forward';
  if (/blue|blauw/.test(l)) return 'blue';
  if (/senior/.test(l)) return 'senior';
  return 'medal';
}

// Everything the scorecard needs, computed from the current setup
function soloCalcNow() {
  var f = _trFlow, n = (typeof trcTotal === 'function') ? trcTotal() : ((f.course && f.course.holes) || 18);
  var tee = soloTee();
  var calc = tee ? trCalcSingle(f.solo.index, tee, n, f.solo.pct) : null;
  var si = (f.course && f.course.indexPerHole) || [];
  return {
    n: n, tee: tee, calc: calc,
    strokes: calc ? trStrokesPerHole(calc.playingHcp, si, n) : new Array(n).fill(0),
    siOk: soloHasValidSI(si, n),
  };
}

// ── screen-solosetup ───────────────────────────────────────────────────
function soloInitStep(id, el) {
  if (id === 'solosetup') soloRenderSetup(el);
}

function soloRenderSetup(scr) {
  if (!soloOn()) return;
  var f = _trFlow, c = f.course || {}, me = (f.team.players || [])[0] || soloMe();
  var set = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
  set('so_course', c.name || 'Course');
  set('so_name', me.name || 'You');
  var av = document.getElementById('so_avatar');
  if (av) {
    var src = null, AV = (typeof AVATARS !== 'undefined') ? AVATARS : {};
    if (typeof _profile !== 'undefined' && _profile) src = _profile.avatarUrl || (_profile.avatarId != null && AV[_profile.avatarId]) || null;
    av.src = src || 'icons/home-crown.png';
  }
  var idx = document.getElementById('so_index');
  if (idx && document.activeElement !== idx) idx.value = (f.solo.index != null && f.solo.index !== '') ? f.solo.index : '';
  f.solo.pct = SOLO_DEFAULT_PCT;   // Solo is always 100% (allowances belong to matches / organisers)

  // tee buttons from the course data (gender-aware)
  var wrap = document.getElementById('so_tees');
  if (wrap) {
    var opts = soloTeeOptions(), cur = soloTee();
    if (cur && !f.solo.teeKey) f.solo.teeKey = cur.label;
    wrap.innerHTML = opts.length ? opts.map(function (t) {
      var on = cur && t.label === cur.label;
      return '<button class="tee-btn' + (on ? ' active' : '') + '" type="button" data-tee="' + String(t.label).replace(/"/g, '&quot;') + '">' +
             '<span class="tee-dot ' + soloTeeDot(t.label) + '"></span>' + t.label + '</button>';
    }).join('') : '<div class="so-warn-inline">No tee ratings for this course.</div>';
  }
  scr.querySelectorAll('.so-fmt').forEach(function (b) { b.classList.toggle('active', b.dataset.fmt === f.solo.format); });

  if (!scr._soWired) {
    scr.addEventListener('click', function (e) {
      var tb = e.target.closest('#so_tees .tee-btn');
      if (tb) { _trFlow.solo.teeKey = tb.dataset.tee; soloRenderSetup(scr); return; }
      var fb = e.target.closest('.so-fmt');
      if (fb) { _trFlow.solo.format = fb.dataset.fmt; soloRenderSetup(scr); var ib = document.getElementById('so_fmtInfo'); if (ib && ib.style.display !== 'none') ib.textContent = soloFormatText(); return; }
    });
    scr.addEventListener('input', function (e) {
      if (!soloOn()) return;
      if (e.target.id === 'so_index') _trFlow.solo.index = e.target.value === '' ? null : e.target.value;
      soloRenderSetupResult();
    });
    scr._soWired = true;
  }
  soloRenderSetupResult();
}

function soloRenderSetupResult() {
  var f = _trFlow, c = f.course || {}, r = soloCalcNow();
  var set = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
  // course line: loop, holes, par, plus rating and slope of the chosen tee
  var parts = [c._playedLoopName || c.name || '', r.n + ' holes', 'Par ' + (r.tee ? r.tee.par : (c.par != null ? c.par : '–'))];
  if (r.tee) { parts.push('Rating ' + r.tee.rating); parts.push('Slope ' + r.tee.slope); }
  set('so_courseMeta', parts.filter(Boolean).join(' · '));
  set('so_ch', r.calc ? soloPhLabel(r.calc.playingHcp) : '–');   // at 100% Course HCP = Playing HCP
  var w = document.getElementById('so_warn');
  if (w) {
    if (!r.siOk) { w.textContent = 'This course has no complete stroke index. Handicap strokes are spread over holes 1 to ' + r.n + ' in order.'; w.style.display = ''; }
    else w.style.display = 'none';
  }
}

// (i) next to the format switch: opens / closes a short explanation under it
function soloFormatText() {
  var stable = _trFlow && _trFlow.solo && _trFlow.solo.format === 'stableford';
  return stable
    ? 'Points per hole on your net score: net par 2, net birdie 3, net bogey 1. Enter 0 to pick up.'
    : 'Count every stroke. Your net score is your gross score minus your handicap strokes.';
}
function soloFormatInfo() {
  var box = document.getElementById('so_fmtInfo'); if (!box) return;
  var open = box.style.display === 'none';
  box.textContent = soloFormatText();
  box.style.display = open ? '' : 'none';
  var btn = document.querySelector('#screen-solosetup .so-info'); if (btn) btn.classList.toggle('on', open);
}

function soloBack() { showScreen('trcourse'); }

function soloStart() {
  if (!soloOn()) return;
  var r = soloCalcNow();
  var idx = parseFloat(_trFlow.solo.index);
  if (isNaN(idx) || idx < -10 || idx > 54) { if (typeof showToast === 'function') showToast('Enter your Handicap Index (-10 to 54)'); return; }
  if (!r.tee || !r.calc) { if (typeof showToast === 'function') showToast('Choose a tee with a rating and slope'); return; }
  var me = _trFlow.team.players[0];
  me.hcp = idx; me.teeKey = r.tee.label;
  _trFlow.solo.calc = { tee: r.tee, courseHcp: r.calc.courseHcp, playingHcp: r.calc.playingHcp, playIndex: r.calc.playIndex,
                        strokes: r.strokes, siOk: r.siOk, n: r.n };
  if (typeof trbStartScorecard === 'function') trbStartScorecard();
}

// ── Scorecard hooks (called from app-main.js) ──────────────────────────
function soloStrokesNow() {
  var s = _trFlow && _trFlow.solo && _trFlow.solo.calc;
  return (s && s.strokes) ? s.strokes : new Array((typeof trcTotal === 'function') ? trcTotal() : 18).fill(0);
}
function soloFmtLabel(fmt) { return fmt === 'stableford' ? 'Stableford' : 'Stroke play'; }

var SOLO_TEAM_STAT_LABELS = ['Gross', 'Par Played', 'vs Par', 'Holes'];
function soloSetStatLabels(scr, labels) {
  if (!scr) return;
  scr.querySelectorAll('.stats-bar .stat-label').forEach(function (e, i) { if (labels[i] && e.textContent !== labels[i]) e.textContent = labels[i]; });
}

// trcInit: header line + stat labels. For team rounds it only restores the original labels.
function soloDecorate(scr) {
  if (!soloOn()) { soloSetStatLabels(scr, SOLO_TEAM_STAT_LABELS); return; }
  var c = _trFlow.course || {}, s = _trFlow.solo, calc = s.calc || {};
  var cm = scr.querySelector('.context-meta');
  if (cm) cm.textContent = (c._playedLoopName || '') + ' · Par ' + (c.par || '–') + ' · PH ' + soloPhLabel(calc.playingHcp || 0) + ' · ' + soloFmtLabel(s.format);
  soloSetStatLabels(scr, s.format === 'stableford' ? ['Gross', 'Points', 'Net vs Par', 'Holes'] : ['Gross', 'Net', 'Net vs Par', 'Holes']);
}

// trcUpdateView: strokes on this hole + net / points line. Hidden for team rounds.
function soloUpdateHole() {
  var info = document.querySelector('#screen-trscore .hole-info'); if (!info) return;
  var line = document.getElementById('so_holeStrokes');
  if (!line) { line = document.createElement('div'); line.id = 'so_holeStrokes'; line.className = 'so-hole-strokes'; info.appendChild(line); }
  var hint = document.querySelector('#screen-trscore .score-hint');
  if (!soloOn()) { line.style.display = 'none'; if (hint && hint.textContent !== 'tap to score') hint.textContent = 'tap to score'; return; }
  var h = _trcHole, st = soloStrokesNow()[h] || 0, par = trcPar(h), g = _trcScores[h];
  line.style.display = '';
  line.textContent = st > 0 ? (st === 1 ? '● 1 handicap stroke' : '●● ' + st + ' handicap strokes')
                   : (st < 0 ? 'Gives back ' + (-st) + (st === -1 ? ' stroke' : ' strokes') : 'No handicap stroke');
  line.classList.toggle('none', st === 0);
  var stable = _trFlow.solo.format === 'stableford';
  var disp = document.getElementById('trc_scoreDisplay');
  if (g === 0 && disp) disp.textContent = 'P';
  if (hint) {
    var txt;
    if (g == null) txt = stable ? 'tap to score · 0 = pick up' : 'tap to score';
    else if (g === 0) txt = 'Picked up · 0 points';
    else txt = stable ? ('Net ' + soloHoleNet(g, st) + ' · ' + soloHolePoints(g, par, st) + (soloHolePoints(g, par, st) === 1 ? ' point' : ' points'))
                      : ('Net ' + soloHoleNet(g, st));
    if (hint.textContent !== txt) hint.textContent = txt;
  }
  var ctx = document.getElementById('trc_numpadContext');
  if (ctx) ctx.textContent = (_trFlow.team.players[0].name || 'You') + ' · hole ' + (h + 1) + ' · par ' + par + (st ? (' · ' + (st > 0 ? '+' + st : st) + ' hcp') : '');
}

// trcUpdateStats: returns true when it handled a solo round (caller then stops).
function soloUpdateStats() {
  if (!soloOn()) return false;
  var n = trcTotal(), t = soloTotals(_trcScores, (_trFlow.course.parPerHole || []), soloStrokesNow());
  var set = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
  var any = t.played > 0;
  set('trc_statGross', any ? t.gross : '–');
  set('trc_statPar', any ? (_trFlow.solo.format === 'stableford' ? t.points : t.net) : '–');
  set('trc_statVsPar', any ? soloSigned(t.netVsPar) : '–');
  set('trc_statHoles', (_trcHole + 1) + ' / ' + n);
  return true;
}

// Numpad OK: 0 only means "picked up" in Stableford.
function soloScoreOk(v) {
  if (!soloOn()) return true;
  if (v === 0 && _trFlow.solo.format !== 'stableford') { if (typeof showToast === 'function') showToast('Enter your strokes (1 or more)'); return false; }
  return true;
}

// trcRenderFull: returns true when it rendered a solo card; otherwise restores the team header.
function soloRenderFull(scr) {
  var thead = scr.querySelector('.sc-table thead tr');
  if (thead && scr._soOrigHead == null) scr._soOrigHead = thead.innerHTML;
  if (!soloOn()) {
    if (thead && scr._soOrigHead != null && thead.innerHTML !== scr._soOrigHead) thead.innerHTML = scr._soOrigHead;
    soloSetStatLabels(scr, SOLO_TEAM_STAT_LABELS);
    return false;
  }
  var c = _trFlow.course || {}, n = trcTotal(), s = _trFlow.solo, strokes = soloStrokesNow(), stable = s.format === 'stableford';
  var cn = scr.querySelector('.course-name'); if (cn) cn.textContent = c.name || 'Course';
  var cm = scr.querySelector('.course-meta'); if (cm) cm.textContent = (c._playedLoopName ? c._playedLoopName + ' · ' : '') + 'Par ' + (c.par || '–') + ' · PH ' + soloPhLabel((s.calc || {}).playingHcp || 0) + ' · ' + soloFmtLabel(s.format);
  if (thead) thead.innerHTML = '<th>Hole</th><th>Par</th><th>SI</th><th>Score</th><th>' + (stable ? 'Pts' : 'Net') + '</th>';
  var tbody = scr.querySelector('.sc-table tbody'); if (!tbody) return true;
  var rows = '', totPar = 0;
  for (var i = 0; i < n; i++) {
    var par = trcPar(i), si = trcSI(i), g = _trcScores[i], st = strokes[i] || 0;
    totPar += par;
    rows += '<tr><td>' + (i + 1) + '</td><td>' + par + '</td><td><span class="si-badge ' + trcSIClass(si) + '">' + si + '</span></td>' +
            '<td>' + soloScoreCell(g, par, st) + '</td><td>' + soloLastCell(g, par, st, stable) + '</td></tr>';
  }
  var t = soloTotals(_trcScores, (c.parPerHole || []), strokes), any = t.played > 0;
  rows += '<tr><td>SCORE</td><td>' + totPar + '</td><td>–</td><td>' + (any ? t.gross : '–') + '</td><td>' + (any ? (stable ? t.points : t.net) : '–') + '</td></tr>';
  tbody.innerHTML = rows;
  var cells = scr.querySelectorAll('.stats-bar .stat-value');
  soloSetStatLabels(scr, stable ? ['Gross', 'Points', 'Net vs Par', 'Holes'] : ['Gross', 'Net', 'Net vs Par', 'Holes']);
  if (cells.length >= 4) {
    cells[0].textContent = any ? t.gross : '–';
    cells[1].textContent = any ? (stable ? t.points : t.net) : '–';
    cells[2].textContent = any ? soloSigned(t.netVsPar) : '–';
    cells[2].className = 'stat-value' + (any ? (t.netVsPar > 0 ? ' positive' : (t.netVsPar < 0 ? ' negative' : '')) : '');
    cells[3].textContent = t.played + ' / ' + n;
  }
  return true;
}
function soloStrokeMarks(st) { return st > 0 ? '<sup class="so-dots">' + new Array(st + 1).join('•') + '</sup>' : (st < 0 ? '<sup class="so-dots minus">+' + (-st) + '</sup>' : ''); }
function soloScoreCell(g, par, st) {
  if (g == null) return '–' + soloStrokeMarks(st);
  if (g === 0) return 'P' + soloStrokeMarks(st);
  var cls = g > par ? 'over-par' : (g < par ? 'under-par' : '');
  return (cls ? '<span class="' + cls + '">' + g + '</span>' : g) + soloStrokeMarks(st);
}
function soloLastCell(g, par, st, stable) {
  if (g == null) return '–';
  if (stable) return String(soloHolePoints(g, par, st));
  return g === 0 ? '–' : String(soloHoleNet(g, st));
}

// Back from the scorecard goes to the Solo setup (the team flow goes to its result screen).
function soloLeaveTarget() { return soloOn() ? 'solosetup' : null; }

// ── Save ───────────────────────────────────────────────────────────────
async function soloSaveRound() {
  var c = _trFlow.course || {}, n = trcTotal(), s = _trFlow.solo, calc = s.calc || {};
  var played = _trcScores.filter(function (x) { return x != null; });
  if (played.length < n) { if (typeof showToast === 'function') showToast('Enter all ' + n + ' hole scores first'); return; }
  var uid = (window._fbAuth && window._fbAuth.currentUser) ? window._fbAuth.currentUser.uid : null;
  if (!uid) { if (typeof showToast === 'function') showToast('Please sign in to save the round.', 'error'); return; }
  var strokes = soloStrokesNow(), par = (c.parPerHole || []).slice(), t = soloTotals(_trcScores, par, strokes);
  var me = _trFlow.team.players[0];
  var round = {
    id: Date.now().toString(),
    isMatch: false,
    mode: 'solo',
    soloFormat: s.format,
    format: soloFmtLabel(s.format),
    allowancePct: s.pct,
    courseName: c.name || '',
    loopName: c._playedLoopName || c.name || '',
    teamName: me.name || 'You',
    holes: n, holesPlayed: played.length,
    par: par,
    index: (c.indexPerHole || []).slice(),
    scores: _trcScores.slice(),
    strokes: strokes.slice(),
    tee: calc.tee ? calc.tee.label : null,
    rating: calc.tee ? calc.tee.rating : null, slope: calc.tee ? calc.tee.slope : null, teePar: calc.tee ? calc.tee.par : null,
    players: [{ name: me.name, hcp: me.hcp, teeKey: me.teeKey, courseHcp: calc.courseHcp, playingHcp: calc.playingHcp }],
    courseHcp: calc.courseHcp, playingHcp: calc.playingHcp,
    totalPar: t.parPlayed, gross: t.gross, vsPar: t.vsPar,
    net: t.net, netVsPar: t.netVsPar,
    stablefordPoints: (s.format === 'stableford') ? t.points : null,
    pickups: t.pickups,
    playedAt: new Date().toISOString(),
  };
  var saveBtn = document.querySelector('#screen-trscore .save-round-btn');
  if (saveBtn) saveBtn.textContent = '⏳';
  try {
    await window._fbDb.collection('users').doc(uid).collection('rounds').doc(round.id).set(round);
    if (typeof _savedRounds !== 'undefined') _savedRounds.unshift(round);
    if (typeof renderMyData === 'function') renderMyData();
    if (saveBtn) saveBtn.textContent = '✓ Saved';
    if (typeof showToast === 'function') showToast(s.format === 'stableford' ? ('Round saved — ' + t.points + ' points') : ('Round saved — net ' + soloSigned(t.netVsPar)), 'success');
    _scRoundSaved = true; _pausedRound = null;
    if (typeof hidePausedRoundBanner === 'function') hidePausedRoundBanner();
    if (typeof clearPausedRoundFromCloud === 'function') clearPausedRoundFromCloud();
    window._activeRound = round;
    if (document.getElementById('screen-rounddetail')) showScreen('rounddetail'); else showScreen('home');
  } catch (e) {
    if (saveBtn) saveBtn.textContent = 'SAVE ROUND';
    if (typeof showToast === 'function') showToast('Could not save: ' + ((e && e.message) || e), 'error');
  }
}

// ── Paused round (leave the scorecard, resume later) ───────────────────
function soloPauseSnapshot() {
  return soloOn() ? { mode: 'solo', solo: JSON.parse(JSON.stringify(_trFlow.solo)) } : { mode: null, solo: null };
}
function soloPauseRestore(p) {
  if (!_trFlow) _trFlow = {};
  _trFlow.mode = (p && p.mode) || null;
  _trFlow.solo = (p && p.solo) ? JSON.parse(JSON.stringify(p.solo)) : null;
}

// ═════════════════════════════════════════════════════════════════════
// History, round detail and share card
// ═════════════════════════════════════════════════════════════════════
function soloIsRound(r) { return !!r && r.mode === 'solo'; }

// Game History card (Solo tab)
function soloHistoryCard(r) {
  var stable = r.soloFormat === 'stableford';
  var big = stable ? (r.stablefordPoints != null ? r.stablefordPoints : '–') : (r.net != null ? r.net : '–');
  var vs = (r.netVsPar != null) ? r.netVsPar : null;
  var vsCol = vs == null ? 'var(--text-3)' : (vs > 0 ? 'var(--red)' : (vs < 0 ? 'var(--green)' : 'var(--text-3)'));
  var holes = r.holes || (r.scores || []).length || 18;
  var d = (typeof _mDate === 'function') ? _mDate(r.playedAt || r.date) : '';
  var esc2 = (typeof esc === 'function') ? esc : function (x) { return x; };
  var card = document.createElement('div'); card.className = 'round-card';
  card.innerHTML = '<div class="round-left"><div class="round-date">' + d + '</div>' +
    '<div class="round-course">' + esc2(r.courseName || 'Course') + '</div>' +
    '<div class="round-meta">' + esc2(r.loopName || '') + ' · ' + holes + 'H · ' + (r.tee ? esc2(r.tee) + ' · ' : '') + 'PH ' + soloPhLabel(r.playingHcp || 0) + '</div>' +
    '<div class="round-format">' + (r.format || '') + ' · Gross ' + (r.gross != null ? r.gross : '–') + '</div></div>' +
    '<div class="round-right"><div class="round-gross">' + big + '</div><div class="round-par-label">' + (stable ? 'Points' : 'Net') + '</div>' +
    '<div class="round-vspar" style="color:' + vsCol + ';">' + (vs != null ? soloSigned(vs) : '–') + '</div><div class="round-vspar-label">Net vs Par</div></div>' +
    '<div class="round-chevron">›</div>';
  card.onclick = function () { window._activeRound = r; if (document.getElementById('screen-rounddetail')) showScreen('rounddetail'); };
  return card;
}

// Home: "Solo Rounds | Last 5" (same card style as Team Rounds). Tap opens the round detail.
function soloRenderHomeRow(all, fmtDate, esc) {
  var row = document.getElementById('homeSoloRow'); if (!row) return;
  var tOf = function (r) { return Date.parse(r.playedAt || r.date || 0) || 0; };
  var list = (all || []).filter(soloIsRound).sort(function (a, b) { return tOf(b) - tOf(a); }).slice(0, 5);
  window._homeSoloList = list;
  if (!list.length) { row.innerHTML = '<div class="hh-empty">No solo rounds yet \u2014 play a Solo Round to see it here.</div>'; return; }
  row.innerHTML = list.map(function (r, i) {
    var stable = r.soloFormat === 'stableford';
    var big = stable ? (r.stablefordPoints != null ? r.stablefordPoints : '\u2013') : (r.net != null ? r.net : '\u2013');
    var vs = (r.netVsPar != null) ? r.netVsPar : null;
    var vsCol = vs == null ? '#777' : (vs > 0 ? '#c85a4a' : (vs < 0 ? '#1a6b3c' : '#777'));
    var holes = r.holes || (r.scores || []).length || 18;
    return '<div class="hh-card" onclick="window._activeRound=window._homeSoloList[' + i + ']; showScreen(&quot;rounddetail&quot;)">'
      + '<div class="hh-card-l"><div class="hh-card-date">' + fmtDate(r.playedAt || r.date) + '</div>'
      + '<div class="hh-card-course">' + esc(r.courseName || 'Course') + '</div>'
      + '<div class="hh-card-meta">' + esc(r.loopName || '') + ' \u00b7 ' + holes + 'H \u00b7 PH ' + soloPhLabel(r.playingHcp || 0) + '</div>'
      + '<div class="hh-card-fmt">' + esc(r.format || '') + '</div></div>'
      + '<div class="hh-card-r"><div class="hh-card-gross">' + big + '</div><div class="hh-card-lbl">' + (stable ? 'POINTS' : 'NET') + '</div>'
      + '<div class="hh-card-vspar" style="color:' + vsCol + '">' + (vs != null ? soloSigned(vs) : '\u2013') + '</div><div class="hh-card-lbl">NET VS PAR</div></div></div>';
  }).join('');
}

// Round Detail for a solo round
function soloRenderDetail(ROOT, r) {
  var stable = r.soloFormat === 'stableford';
  var scores = r.scores || [], par = r.par || [], si = r.index || r.si || [];
  var n = Math.max(scores.length, par.length, r.holes || 0) || 18;
  var strokes = (Array.isArray(r.strokes) && r.strokes.length === n) ? r.strokes : trStrokesPerHole(r.playingHcp || 0, si, n);
  var t = soloTotals(scores, par, strokes);
  var set = function (sel, val) { var e = ROOT.querySelector(sel); if (e) e.textContent = val; };
  var fmtDate = function (d) { try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } };
  var sub = ROOT.querySelector('.sub-header .title'); if (sub) sub.textContent = 'Solo Round';
  set('.meta-date', fmtDate(r.playedAt || r.date));
  set('.meta-course', r.courseName || 'Course');
  var rows = ROOT.querySelectorAll('.round-meta-header .meta-row');
  if (rows[0]) rows[0].textContent = (r.loopName || '') + ' · ' + n + ' holes' + (r.tee ? (' · ' + r.tee + ' tee') : '');
  if (rows[1]) rows[1].textContent = (r.teamName || '') + ' · ' + (r.format || '');   // Solo is always 100%, so no percentage
  set('.meta-thcp', 'PH ' + soloPhLabel(r.playingHcp || 0) + (r.courseHcp != null ? ' · CH ' + soloPhLabel(r.courseHcp) : ''));
  var labels = ROOT.querySelectorAll('.stats-bar .stat-label'), vals = ROOT.querySelectorAll('.stats-bar .stat-value');
  var L = stable ? ['Points', 'Gross', 'Net vs Par', 'Holes'] : ['Net', 'Gross', 'Net vs Par', 'Holes'];
  labels.forEach(function (e, i) { if (L[i]) e.textContent = L[i]; });
  if (vals[0]) { vals[0].textContent = stable ? t.points : t.net; vals[0].className = 'stat-value'; }
  if (vals[1]) { vals[1].textContent = t.gross || '–'; vals[1].className = 'stat-value'; }
  if (vals[2]) { vals[2].textContent = t.played ? soloSigned(t.netVsPar) : '–'; vals[2].className = 'stat-value ' + (t.netVsPar > 0 ? 'neg' : (t.netVsPar < 0 ? 'pos' : '')); }
  if (vals[3]) { vals[3].textContent = t.played + '/' + n; vals[3].className = 'stat-value'; }
  var th = ROOT.querySelector('.sc-table thead tr');
  if (th) th.innerHTML = '<th>Hole</th><th>Par</th><th>SI</th><th>Score</th><th>' + (stable ? 'Pts' : 'Net') + '</th>';
  var tb = ROOT.querySelector('.sc-table tbody'); if (!tb) return;
  var html = '';
  for (var i = 0; i < n; i++) {
    var pv = par[i], g = scores[i], sv = si[i], st = strokes[i] || 0;
    var siCls = (sv != null) ? (sv <= 6 ? 'si-hard' : (sv <= 12 ? 'si-avg' : 'si-easy')) : 'si-avg';
    html += '<tr><td>' + (i + 1) + '</td><td>' + (pv != null ? pv : '–') + '</td><td>' + (sv != null ? '<span class="si-badge ' + siCls + '">' + sv + '</span>' : '–') + '</td>' +
            '<td>' + soloScoreCell(g, pv != null ? pv : 4, st) + '</td><td>' + soloLastCell(g, pv != null ? pv : 4, st, stable) + '</td></tr>';
  }
  html += '<tr class="totals-row"><td>SCORE</td><td>' + (par.reduce(function (a, b) { return a + (b || 0); }, 0) || '–') + '</td><td></td><td>' + (t.gross || '–') + '</td><td>' + (stable ? t.points : t.net) + '</td></tr>';
  tb.innerHTML = html;
}

// Share card fields for a solo round (used by _scDerive in app-sharecard.js)
function soloShareDerive(r, base) {
  var stable = r.soloFormat === 'stableford';
  var nv = (r.netVsPar != null) ? r.netVsPar : 0;
  base.result = stable ? ((r.stablefordPoints != null ? r.stablefordPoints : 0) + ' POINTS') : ('NET ' + (nv === 0 ? 'E' : (nv > 0 ? '+' + nv : nv)));
  base.teamLine = r.teamName || 'Solo';
  base.subtitle = 'SOLO ROUND';
  base.rows = [
    ['GROSS', (r.gross != null ? String(r.gross) : '–'), ''],
    [stable ? 'POINTS' : 'NET', String(stable ? (r.stablefordPoints != null ? r.stablefordPoints : '–') : (r.net != null ? r.net : '–')), ''],
    ['HANDICAP', 'PH ' + soloPhLabel(r.playingHcp || 0), ''],
    ['PAR', (base.parTot ? String(base.parTot) : '–'), ''],
    ['DATE', '', '']
  ];
  return base;
}

// Node (headless tests) can require this file for the pure functions.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { soloRound: soloRound, soloPlayIndex: soloPlayIndex, trCalcSingle: trCalcSingle, soloSIRanks: soloSIRanks,
    trStrokesPerHole: trStrokesPerHole, soloHolePoints: soloHolePoints, soloHoleNet: soloHoleNet, soloTotals: soloTotals,
    soloHasValidSI: soloHasValidSI };
}
