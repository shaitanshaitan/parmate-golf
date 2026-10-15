// Parmate player app — 1vs1 Match Play on one device (A3).
// Loaded by index.html with a plain <script src> right after app-solo.js (no defer/async/module).
// Needs app-solo.js for trCalcSingle, trStrokesPerHole and soloPhLabel.
//
// Flow: Choose Game -> cgMatch1v1() -> screen-trcourse (shared course + loop step)
//       -> screen-m1setup -> screen-m1score (hole by hole) <-> screen-m1full (all holes) -> save.
// Team rounds, team matches and Solo never enter this code path: every hook checks m1On() first.
//
// WHS match play (singles):
//   Course Handicap per player  = Index x (Slope / 113) + (Course Rating - Par)   [9 holes: half the Index]
//   Playing Handicap            = Course Handicap x allowance (default 100%)
//   The lower player plays off 0. The higher player receives the DIFFERENCE, one stroke per hole
//   on the lowest stroke index holes (a second stroke when the difference is more than the holes).
//   Different tees are covered by the (Rating - Par) term of each Course Handicap.
//   Gross match: no handicap strokes at all.
//   Extra holes: replay the course from hole 1, strokes fall on the same holes as in the round;
//   the first hole that is not halved decides the match.

// ═════════════════════════════════════════════════════════════════════
// CALCULATION CORE (pure functions, no DOM; covered by tests/match_core.test.js)
// ═════════════════════════════════════════════════════════════════════
var M1_DEFAULT_PCT = 100;

// Strokes per hole for both players. phA / phB are Playing Handicaps (may be negative for plus).
function trMatchStrokes(phA, phB, siArr, n) {
  n = n || (siArr ? siArr.length : 18);
  var a = Number(phA) || 0, b = Number(phB) || 0, diff = Math.abs(a - b);
  var zero = new Array(n).fill(0);
  if (!diff) return { diff: 0, receiver: null, a: zero.slice(), b: zero.slice() };
  var recv = a > b ? 'A' : 'B';
  var given = trStrokesPerHole(diff, siArr, n);
  return { diff: diff, receiver: recv, a: recv === 'A' ? given : zero.slice(), b: recv === 'B' ? given : zero.slice() };
}

// One hole. gross 0 = picked up (loses the hole unless both pick up).
// concede: 'A' = player A conceded the hole (B wins it), 'B' = player B conceded.
// Returns 'A', 'B', 'H' (halved) or null (not finished).
function m1HoleResult(gA, gB, stA, stB, concede) {
  if (concede === 'A') return 'B';
  if (concede === 'B') return 'A';
  if (gA == null || gB == null) return null;
  if (gA === 0 && gB === 0) return 'H';
  if (gA === 0) return 'B';
  if (gB === 0) return 'A';
  var nA = gA - (stA || 0), nB = gB - (stB || 0);
  return nA < nB ? 'A' : (nA > nB ? 'B' : 'H');
}

// Match state over the stipulated holes (results: array of 'A' | 'B' | 'H' | null, length n).
// up > 0 means A is up. A match is decided once the lead is bigger than the holes left.
function trMatchState(results, n) {
  n = n || results.length;
  var up = 0, played = 0, wonA = 0, wonB = 0, halved = 0, decidedAt = null, closeUp = 0, closeLeft = 0;
  for (var i = 0; i < n; i++) {
    var r = results[i];
    if (r == null) continue;
    played++;
    if (r === 'A') { up++; wonA++; } else if (r === 'B') { up--; wonB++; } else halved++;
    if (decidedAt == null && Math.abs(up) > n - played) { decidedAt = i; closeUp = up; closeLeft = n - played; }
    if (decidedAt != null) break;
  }
  var left = n - played;
  var decided = decidedAt != null;
  var finalUp = decided ? closeUp : up;
  var st = {
    up: finalUp, played: played, left: decided ? closeLeft : left, n: n,
    wonA: wonA, wonB: wonB, halved: halved,
    decided: decided, decidedAt: decidedAt,
    allSquareEnd: !decided && played === n && up === 0,
    dormie: !decided && left > 0 && Math.abs(up) === left,
    winner: decided ? (finalUp > 0 ? 'A' : 'B') : null,
    text: '',
  };
  if (decided) st.text = st.left > 0 ? (Math.abs(finalUp) + '&' + st.left) : (Math.abs(finalUp) + ' up');
  else if (st.allSquareEnd) st.text = 'All square';
  else st.text = up === 0 ? 'All square' : (Math.abs(up) + ' up');
  return st;
}

// Extra holes after an all-square match: sudden death, first hole that is not halved wins.
function m1ExtraState(extraResults, n) {
  for (var i = 0; i < extraResults.length; i++) {
    var r = extraResults[i];
    if (r === 'A' || r === 'B') return { decided: true, winner: r, hole: n + i + 1, played: i + 1 };
  }
  var played = extraResults.filter(function (x) { return x != null; }).length;
  return { decided: false, winner: null, hole: null, played: played };
}

// "19th", "20th", "21st"
function m1Ordinal(k) {
  var s = (k % 100 >= 11 && k % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[k % 10] || 'th');
  return k + s;
}

// Final outcome of the whole match (stipulated holes + extra holes).
// Returns { done, winner: 'A'|'B'|'H'|null, text } where text is the closeout ("3&2", "1 up", "at the 19th", "Halved").
function m1Outcome(state, extra, halvedChosen) {
  if (state.decided) return { done: true, winner: state.winner, text: state.text };
  if (!state.allSquareEnd) return { done: false, winner: null, text: state.text };
  if (extra && extra.decided) return { done: true, winner: extra.winner, text: 'at the ' + m1Ordinal(extra.hole) };
  if (halvedChosen) return { done: true, winner: 'H', text: 'Halved' };
  return { done: false, winner: null, text: 'All square' };
}

// ═════════════════════════════════════════════════════════════════════
// FLOW (browser only)
// ═════════════════════════════════════════════════════════════════════
function m1On() {
  return (typeof _trFlow !== 'undefined') && !!_trFlow && _trFlow.mode === 'match1v1';
}
function m1M() { return _trFlow.m1; }
function m1Toast(msg, type) { if (typeof showToast === 'function') showToast(msg, type); }
function m1Esc(s) { return (typeof esc === 'function') ? esc(s) : String(s == null ? '' : s); }
function m1Clone(o) { return JSON.parse(JSON.stringify(o)); }   // also drops undefined (Firestore rejects it)
// Loop name for meta lines, left out when it only repeats the hole count ("9-holes", "18 holes")
function m1LoopLabel(c, n) {
  var l = (c && c._playedLoopName) || '';
  return /^\s*(9|18|27)[\s-]*hol(e|es)\s*$/i.test(l) ? '' : l;
}
// Long names get a smaller font in the narrow stats boxes, so they stay on one line
function m1FitName(el, name) {
  if (!el) return;
  var l = String(name || '').length;
  el.classList.toggle('long', l > 11 && l <= 14);
  el.classList.toggle('xlong', l > 14);
}
function m1Short(name) { return String(name || '').trim().split(/\s+/)[0] || ''; }   // first name, never cut off

function m1AvatarOf(p) {
  if (!p) return 'icons/home-crown.png';
  if (p.isMe && typeof _profile !== 'undefined' && _profile) {
    var AVm = (typeof AVATARS !== 'undefined') ? AVATARS : {};
    return _profile.avatarUrl || (_profile.avatarId != null && AVm[_profile.avatarId]) || 'icons/home-crown.png';
  }
  if (p.isGuest) return 'icons/home-crown.png';
  if (typeof _avatarFor === 'function') { var a = _avatarFor(p); if (a) return a; }
  var AV = (typeof AVATARS !== 'undefined') ? AVATARS : {};
  return p.avatarUrl || (p.avatarId != null && AV[p.avatarId]) || 'icons/home-crown.png';
}

// Choose Game -> 1vs1 Match Play
function cgMatch1v1() {
  _gameMode = 'single';
  if (typeof trStart !== 'function') return;
  trStart();                      // fresh _trFlow and shows screen-trcourse
  var me = soloMe();
  var uid = (window._fbAuth && window._fbAuth.currentUser) ? window._fbAuth.currentUser.uid : null;
  _trFlow.mode = 'match1v1';
  _trFlow.team = { name: me.name, size: 1, players: [me] };
  _trFlow.m1 = {
    scoring: 'net', pct: M1_DEFAULT_PCT,
    a: { name: me.name, index: me.hcp, gender: me.gender || 'M', teeKey: null, isMe: true, uid: uid, avatarId: me.avatarId != null ? me.avatarId : null },
    b: null,
  };
}

// ── Tees (gender-aware, per player) ────────────────────────────────────
function m1TeeOptions(gender) {
  var c = (_trFlow && _trFlow.course) || {};
  var arr = (gender === 'F' && c.women && c.women.length) ? c.women : (c.tees || []);
  return arr.filter(function (t) { return t && t.rating != null && t.slope != null; });
}
function m1HasWomenTees() {
  var c = (_trFlow && _trFlow.course) || {};
  return !!(c.women && c.women.some(function (t) { return t && t.rating != null && t.slope != null; }));
}
function m1Tee(p) {
  if (!p) return null;
  var opts = m1TeeOptions(p.gender), key = (p.teeKey || '').toLowerCase();
  var t = opts.find(function (x) { return (x.label || '').toLowerCase() === key; })
       || opts.find(function (x) { return /medal|geel|yellow/i.test(x.label || ''); })
       || opts[0];
  if (!t) return null;
  var c = _trFlow.course || {};
  return { label: t.label, rating: Number(t.rating), slope: Number(t.slope), par: Number(t.par) || Number(c.par) || 72 };
}

// Everything the scorecard needs, from the current setup
function m1CalcNow() {
  var f = _trFlow, m = f.m1, c = f.course || {};
  var n = (typeof trcTotal === 'function') ? trcTotal() : (c.holes || 18);
  var si = c.indexPerHole || [];
  var tA = m1Tee(m.a), tB = m.b ? m1Tee(m.b) : null;
  var net = m.scoring === 'net';
  var pct = 100;   // 1vs1: net uses the full Playing Handicaps, no allowance setting
  var cA = tA ? trCalcSingle(m.a.index, tA, n, pct) : null;
  var cB = (tB && m.b) ? trCalcSingle(m.b.index, tB, n, pct) : null;
  var ms = (net && cA && cB) ? trMatchStrokes(cA.playingHcp, cB.playingHcp, si, n)
         : { diff: 0, receiver: null, a: new Array(n).fill(0), b: new Array(n).fill(0) };
  return { n: n, tA: tA, tB: tB, cA: cA, cB: cB, ms: ms, net: net, siOk: soloHasValidSI(si, n) };
}

// ── screen routing (called from showScreen in app-main.js) ─────────────
function m1InitStep(id, el) {
  if (id === 'm1setup') m1RenderSetup(el);
  else if (id === 'm1score') m1RenderScore();
  else if (id === 'm1full') m1RenderFull();
}
// Leaving the 1vs1 scorecard by any route pauses an unsaved match (same banner as Team Round).
function m1BeforeShow(id) {
  var s = document.getElementById('screen-m1score');
  if (s && s.classList.contains('active') && id !== 'm1score' && id !== 'm1full') m1MaybePause();
}

// ═════════════════════════════════════════════════════════════════════
// screen-m1setup
// ═════════════════════════════════════════════════════════════════════
function m1Back() { showScreen('trcourse'); }

function m1TeeButtons(p, which) {
  var opts = m1TeeOptions(p ? p.gender : 'M'), cur = m1Tee(p);
  if (p && cur && !p.teeKey) p.teeKey = cur.label;
  if (!opts.length) return '<div class="so-warn-inline">No tee ratings for this course.</div>';
  return opts.map(function (t) {
    var on = cur && t.label === cur.label;
    return '<button class="tee-btn' + (on ? ' active' : '') + '" type="button" data-p="' + which + '" data-tee="' + String(t.label).replace(/"/g, '&quot;') + '">' +
           '<span class="tee-dot ' + soloTeeDot(t.label) + '"></span>' + m1Esc(t.label) + '</button>';
  }).join('');
}

// Opponent summary line: "HCP 24.5 · Ladies · Medal" (Men/Ladies only when the course has ladies' tees)
function m1OppMeta(p) {
  if (!p) return '';
  var t = m1Tee(p), parts = ['HCP ' + ((p.index != null && p.index !== '') ? p.index : '–')];
  if (m1HasWomenTees()) parts.push(p.gender === 'F' ? 'Ladies' : 'Men');
  if (t) parts.push(t.label);
  return parts.join(' · ');
}

function m1RenderSetup(scr) {
  if (!m1On()) return;
  scr = scr || document.getElementById('screen-m1setup');
  var m = m1M(), c = _trFlow.course || {};
  var set = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
  set('m1_course', c.name || 'Course');
  set('m1_nameA', m.a.name || 'You');
  var avA = document.getElementById('m1_avA'); if (avA) avA.src = m1AvatarOf(m.a);
  var iA = document.getElementById('m1_indexA');
  if (iA && document.activeElement !== iA) iA.value = (m.a.index != null && m.a.index !== '') ? m.a.index : '';
  var wA = document.getElementById('m1_teesA'); if (wA) wA.innerHTML = m1TeeButtons(m.a, 'A');

  // opponent: dashed "Choose opponent" until chosen, then one summary line with Edit
  var ch = document.getElementById('m1_chooseB'), op = document.getElementById('m1_oppB');
  if (ch) ch.style.display = m.b ? 'none' : '';
  if (op) op.style.display = m.b ? '' : 'none';
  if (m.b) {
    var avB = document.getElementById('m1_avB'); if (avB) avB.src = m1AvatarOf(m.b);
    set('m1_nameB', m.b.name);
    set('m1_metaB', m1OppMeta(m.b));
  }
  scr.querySelectorAll('.m1-sc').forEach(function (b) { b.classList.toggle('active', b.dataset.sc === m.scoring); });
  var st = scr.querySelector('.play-btn'); if (st) st.classList.toggle('m1-wait', !m.b);

  if (!scr._m1Wired) {
    scr.addEventListener('click', function (e) {
      if (!m1On()) return;
      var mm = m1M();
      var tb = e.target.closest('.tee-btn[data-p]');
      if (tb) {
        if (tb.dataset.p === 'A') { mm.a.teeKey = tb.dataset.tee; m1RenderSetup(scr); }
        else if (mm.draft) { mm.draft.teeKey = tb.dataset.tee; m1RenderDetails(); }
        return;
      }
      var sb = e.target.closest('.m1-sc');
      if (sb) { mm.scoring = sb.dataset.sc; m1RenderSetup(scr); var ib = document.getElementById('m1_scInfo'); if (ib && ib.style.display !== 'none') ib.textContent = m1ScoringText(); return; }
      var gb = e.target.closest('.m1-g');
      if (gb && mm.draft) { mm.draft.gender = gb.dataset.g; mm.draft.teeKey = null; mm.draft.genderFromProfile = false; m1RenderDetails(); return; }
      var bud = e.target.closest('.m1-bud');
      if (bud) { m1PickBuddy(parseInt(bud.dataset.i, 10)); return; }
    });
    scr.addEventListener('input', function (e) {
      if (!m1On()) return;
      var mm = m1M(), v = e.target.value;
      if (e.target.id === 'm1_indexA') { mm.a.index = v === '' ? null : v; m1RenderSetupResult(); }
      else if (e.target.id === 'm1_indexB') { if (mm.draft) mm.draft.index = v === '' ? null : v; }
    });
    scr.addEventListener('keydown', function (e) {
      if (e.target.id === 'm1_guestName' && e.key === 'Enter') m1PickGuest();
      if (e.target.id === 'm1_indexB' && e.key === 'Enter') e.target.blur();
    });
    scr._m1Wired = true;
  }
  m1RenderSetupResult();
}

function m1RenderSetupResult() {
  var m = m1M(), c = _trFlow.course || {}, r = m1CalcNow();
  var set = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
  var par = r.tA ? r.tA.par : (c.par != null ? c.par : '–');
  set('m1_courseMeta', [m1LoopLabel(c, r.n), r.n + ' holes', 'Par ' + par].filter(Boolean).join(' · '));
  var line = '', sub = '';
  if (!r.net) line = 'Gross match, no strokes';
  else if (m.b && r.cA && r.cB) {
    var rcv = r.ms.receiver === 'A' ? m.a.name : (m.b ? m.b.name : '');
    if (!r.ms.diff) line = 'Same Playing HCP, no strokes';
    else line = m1Short(rcv) + (r.ms.diff === 1 ? ' receives 1 stroke' : (' receives ' + r.ms.diff + ' strokes'));
    sub = 'Playing HCP · ' + m1Short(m.a.name) + ' ' + soloPhLabel(r.cA.playingHcp) + ' · ' + m1Short(m.b.name) + ' ' + soloPhLabel(r.cB.playingHcp);
  }
  var box = document.getElementById('m1_resBox'); if (box) box.style.display = line ? '' : 'none';
  set('m1_res', line); set('m1_resSub', sub);
  var w = document.getElementById('m1_warn');
  if (w) {
    if (r.net && r.ms.diff && !r.siOk) { w.textContent = 'This course has no complete stroke index. Strokes are given on holes 1 to ' + Math.min(r.ms.diff, r.n) + ' in order.'; w.style.display = ''; }
    else w.style.display = 'none';
  }
}

function m1ScoringText() {
  return (_trFlow && _trFlow.m1 && _trFlow.m1.scoring === 'gross')
    ? 'Mano a mano, no handicaps. The lowest score on a hole wins it.'
    : 'Based on both Playing Handicaps. The higher handicap receives the difference, one stroke per hole on the hardest holes (lowest stroke index).';
}
function m1ScoringInfo() {
  var box = document.getElementById('m1_scInfo'); if (!box) return;
  var open = box.style.display === 'none';
  box.textContent = m1ScoringText();
  box.style.display = open ? '' : 'none';
  var btn = document.querySelector('#screen-m1setup .so-info'); if (btn) btn.classList.toggle('on', open);
}

// ── Opponent sheet: step 1 choose (buddy or guest), step 2 details (HCP, tees for, tee) ──
// The sheet edits a draft; Done copies it to the match, closing the sheet throws it away.
function m1BuddyList() {
  return (typeof _buddies !== 'undefined' && Array.isArray(_buddies)) ? _buddies : [];
}
function m1SheetStep(n) {
  var s1 = document.getElementById('m1_step1'), s2 = document.getElementById('m1_step2');
  if (s1) s1.style.display = n === 1 ? '' : 'none';
  if (s2) s2.style.display = n === 2 ? '' : 'none';
  var d1 = document.getElementById('m1_dot1'), d2 = document.getElementById('m1_dot2');
  if (d1) d1.classList.toggle('on', n === 1);
  if (d2) d2.classList.toggle('on', n === 2);
  var sh = document.getElementById('m1_sheet'); if (sh) sh.classList.add('open');
}
function m1RenderList() {
  var list = document.getElementById('m1_buddyList'), b = m1BuddyList();
  if (!list) return;
  list.innerHTML = b.length ? b.map(function (x, i) {
    return '<button class="m1-bud" type="button" data-i="' + i + '"><img src="' + m1Esc(m1AvatarOf(x)) + '" alt="">' +
           '<span class="m1-bud-name" data-no-i18n>' + m1Esc(x.name || 'Buddy') + '</span>' +
           '<span class="m1-bud-hcp">' + (x.hcp != null ? 'HCP ' + x.hcp : '') + '</span><span class="m1-chev">&rsaquo;</span></button>';
  }).join('') : '<div class="m1-sheet-empty">No buddies yet. Add a guest below.</div>';
}
// "Choose opponent": step 1
function m1OpenPicker() {
  m1RenderList();
  var g = document.getElementById('m1_guestName'); if (g) g.value = '';
  m1SheetStep(1);
}
// "Edit" on the opponent line: straight to step 2 with the current opponent
function m1OpenDetails() {
  var m = m1M(); if (!m.b) { m1OpenPicker(); return; }
  m.draft = m1Clone(m.b);
  m1RenderDetails(); m1SheetStep(2);
}
function m1BackToList() { m1OpenPicker(); }
function m1ClosePicker() {
  var sh = document.getElementById('m1_sheet'); if (sh) sh.classList.remove('open');
  if (_trFlow && _trFlow.m1) _trFlow.m1.draft = null;
}
function m1RenderDetails() {
  var d = m1M().draft; if (!d) return;
  var set = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
  var av = document.getElementById('m1_dAv'); if (av) av.src = m1AvatarOf(d);
  set('m1_dName', d.name);
  var iB = document.getElementById('m1_indexB');
  if (iB && document.activeElement !== iB) iB.value = (d.index != null && d.index !== '') ? d.index : '';
  var gw = document.getElementById('m1_genderWrap'); if (gw) gw.style.display = m1HasWomenTees() ? '' : 'none';
  document.querySelectorAll('#m1_genderB .m1-g').forEach(function (b) { b.classList.toggle('active', b.dataset.g === (d.gender || 'M')); });
  set('m1_genderCap', d.genderFromProfile ? 'Filled in from the profile' : '');
  var wB = document.getElementById('m1_teesB'); if (wB) wB.innerHTML = m1TeeButtons(d, 'D');
}
function m1ToDetails(p) {
  m1M().draft = p;
  m1RenderDetails(); m1SheetStep(2);
  if (p.index == null) { var iB = document.getElementById('m1_indexB'); if (iB) setTimeout(function () { iB.focus(); }, 50); }
}
function m1PickBuddy(i) {
  var x = m1BuddyList()[i]; if (!x) return;
  m1ToDetails({ name: x.name || 'Buddy', index: (x.hcp != null ? x.hcp : null), uid: x.uid || null, avatarId: (x.avatarId != null ? x.avatarId : null),
                avatarUrl: x.avatarUrl || null, gender: x.gender || 'M', genderFromProfile: !!x.gender, teeKey: null, isGuest: false });
}
function m1PickGuest() {
  var g = document.getElementById('m1_guestName'), name = g ? g.value.trim() : '';
  if (!name) { m1Toast('Enter a name for your guest'); if (g) g.focus(); return; }
  m1ToDetails({ name: name, index: null, uid: null, gender: 'M', genderFromProfile: false, teeKey: null, isGuest: true });
}
// "Done": the draft becomes the opponent
function m1DetailsDone() {
  var m = m1M(), d = m.draft; if (!d) { m1ClosePicker(); return; }
  if (d.index != null && d.index !== '' && !m1ValidIndex(d.index)) { m1Toast("Enter " + m1Short(d.name) + "'s Handicap Index (-10 to 54)"); return; }
  var t = m1Tee(d); if (t) d.teeKey = t.label;
  m.b = d; m.draft = null;
  var sh = document.getElementById('m1_sheet'); if (sh) sh.classList.remove('open');
  m1RenderSetup();
}

// ── START ──────────────────────────────────────────────────────────────
function m1ValidIndex(v) { var x = parseFloat(v); return !isNaN(x) && x >= -10 && x <= 54; }
function m1Start() {
  if (!m1On()) return;
  var m = m1M(), r = m1CalcNow();
  if (!m.b) { m1Toast('Choose your opponent'); m1OpenPicker(); return; }
  if (r.net) {
    if (!m1ValidIndex(m.a.index)) { m1Toast('Enter your Handicap Index (-10 to 54)'); return; }
    if (!m1ValidIndex(m.b.index)) { m1Toast('Enter ' + m1Short(m.b.name) + "'s Handicap Index (-10 to 54)"); m1OpenDetails(); return; }
    if (!r.tA || !r.tB || !r.cA || !r.cB) { m1Toast('Choose a tee with a rating and slope'); return; }
  }
  m.a.index = m1ValidIndex(m.a.index) ? parseFloat(m.a.index) : null;
  m.b.index = m1ValidIndex(m.b.index) ? parseFloat(m.b.index) : null;
  m.calc = {
    n: r.n, net: r.net, pct: r.net ? 100 : null,
    teeA: r.tA, teeB: r.tB,
    chA: r.cA ? r.cA.courseHcp : null, phA: r.cA ? r.cA.playingHcp : null,
    chB: r.cB ? r.cB.courseHcp : null, phB: r.cB ? r.cB.playingHcp : null,
    diff: r.ms.diff, receiver: r.ms.receiver, strokesA: r.ms.a, strokesB: r.ms.b, siOk: r.siOk,
  };
  m.scoresA = new Array(r.n).fill(null);
  m.scoresB = new Array(r.n).fill(null);
  m.concede = new Array(r.n).fill(null);
  m.extra = [];
  m.halved = false;
  m.hole = 0;
  m.saved = false;
  // fresh match: clear any paused round + banner (same rule as a new Team Round or Solo Round)
  _pausedRound = null; _scRoundSaved = false;
  if (typeof hidePausedRoundBanner === 'function') hidePausedRoundBanner();
  if (typeof clearPausedRoundFromCloud === 'function') clearPausedRoundFromCloud();
  showScreen('m1score');
}

// ═════════════════════════════════════════════════════════════════════
// Scoring state helpers
// ═════════════════════════════════════════════════════════════════════
function m1N() { return m1M().calc.n; }
function m1HoleTotal() { return m1N() + m1M().extra.length; }
function m1CourseHole(h) { return h % m1N(); }
function m1Score(h, p) {
  var m = m1M(), n = m1N();
  if (h < n) return p === 'A' ? m.scoresA[h] : m.scoresB[h];
  var x = m.extra[h - n]; return x ? (p === 'A' ? x.a : x.b) : null;
}
function m1SetScore(h, p, v) {
  var m = m1M(), n = m1N();
  if (h < n) { if (p === 'A') m.scoresA[h] = v; else m.scoresB[h] = v; return; }
  var x = m.extra[h - n]; if (x) { if (p === 'A') x.a = v; else x.b = v; }
}
function m1Concede(h) { var m = m1M(), n = m1N(); return h < n ? m.concede[h] : ((m.extra[h - n] || {}).c || null); }
function m1SetConcede(h, v) { var m = m1M(), n = m1N(); if (h < n) m.concede[h] = v; else if (m.extra[h - n]) m.extra[h - n].c = v; }
function m1Strokes(h, p) { var c = m1M().calc, i = m1CourseHole(h); return ((p === 'A' ? c.strokesA : c.strokesB) || [])[i] || 0; }
function m1Result(h) { return m1HoleResult(m1Score(h, 'A'), m1Score(h, 'B'), m1Strokes(h, 'A'), m1Strokes(h, 'B'), m1Concede(h)); }

function m1StateNow() {
  var m = m1M(), n = m1N(), res = [], ex = [];
  for (var i = 0; i < n; i++) res.push(m1Result(i));
  for (var k = 0; k < m.extra.length; k++) ex.push(m1Result(n + k));
  var st = trMatchState(res, n), exs = m1ExtraState(ex, n);
  return { res: res, ex: ex, st: st, exs: exs, out: m1Outcome(st, exs, m.halved) };
}
// After any change: extra holes and "halved" only exist while the match is all square after the last hole.
function m1Normalize() {
  var m = m1M(), s = m1StateNow();
  if (!s.st.allSquareEnd) { m.extra = []; m.halved = false; }
  else if (s.exs.decided) {
    m.extra = m.extra.slice(0, s.exs.played);   // drop extra holes after the deciding one
    m.halved = false;
  }
  if (m.extra.length) m.halved = false;
  var max = m1MaxHole();
  if (m.hole > max) m.hole = max;
}
// Last hole that can be scored: the closeout hole once decided, otherwise the last (extra) hole.
function m1MaxHole() {
  var s = m1StateNow(), n = m1N(), m = m1M();
  if (s.st.decided) return s.st.decidedAt;
  if (s.st.allSquareEnd && m.extra.length) return n + m.extra.length - 1;
  return n - 1;
}

function m1Name(p) { var m = m1M(); return (p === 'A' ? m.a.name : m.b.name) || (p === 'A' ? 'You' : 'Opponent'); }
function m1ResultLine(out) {   // "Robbie wins 3&2", "Robbie wins at the 19th", "Match halved"
  if (out.winner === 'H') return 'Match halved';
  return m1Name(out.winner) + ' wins ' + out.text;
}

// ═════════════════════════════════════════════════════════════════════
// screen-m1score
// ═════════════════════════════════════════════════════════════════════
var _m1Np = { open: false, p: null, buf: '' };

function m1RenderScore() {
  if (!m1On() || !m1M().calc) return;
  var scr = document.getElementById('screen-m1score'); if (!scr) return;
  var m = m1M(), c = _trFlow.course || {}, n = m1N(), h = m.hole, ch = m1CourseHole(h);
  var set = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
  set('m1s_course', c.name || 'Course');
  set('m1s_meta', [m1LoopLabel(c, n), n + ' holes', m.calc.net ? 'Net' : 'Gross'].filter(Boolean).join(' · '));

  var s = m1StateNow(), st = s.st, out = s.out;
  // status bar
  var box = document.getElementById('m1s_status'), main = '', sub = '';
  var leader = st.up > 0 ? 'A' : (st.up < 0 ? 'B' : null);
  if (out.done) { main = m1ResultLine(out); sub = (out.winner === 'H') ? ('All square after ' + n) : (c.name || ''); }
  else if (st.allSquareEnd) { main = 'All square'; sub = m.extra.length ? ('Sudden death · extra hole ' + m.extra.length) : ('after ' + n + ' holes'); }
  else if (!leader) { main = 'All square'; sub = st.left + ' to play'; }
  else { main = m1Name(leader) + ' ' + Math.abs(st.up) + ' up'; sub = (st.dormie ? 'Dormie · ' : '') + st.left + ' to play'; }
  set('m1s_statusMain', main); set('m1s_statusSub', sub);
  if (box) {
    box.classList.toggle('done', out.done);
    box.classList.toggle('up', !out.done && !!leader);
    box.classList.toggle('dormie', !out.done && st.dormie);
  }

  // hole navigator
  var par = trcPar(ch), si = trcSI(ch);
  if (h < n) { set('m1s_holeTitle', 'Hole ' + (h + 1) + ' / ' + n); set('m1s_holePar', 'Par ' + par + ' · SI ' + si); }
  else { set('m1s_holeTitle', 'Extra hole ' + (h - n + 1)); set('m1s_holePar', 'Hole ' + (ch + 1) + ' · Par ' + par + ' · SI ' + si); }
  var max = m1MaxHole();
  var pv = document.getElementById('m1s_prev'); if (pv) pv.style.visibility = h > 0 ? '' : 'hidden';
  var nx = document.getElementById('m1s_next'); if (nx) nx.style.visibility = h < max ? '' : 'hidden';

  // player rows
  var r = m1Result(h), cc = m1Concede(h);
  ['A', 'B'].forEach(function (p) {
    set('m1s_name' + p, m1Name(p));
    var av = document.getElementById('m1s_av' + p); if (av) av.src = m1AvatarOf(p === 'A' ? m.a : m.b);
    var k = m1Strokes(h, p), stEl = document.getElementById('m1s_st' + p);
    if (stEl) {
      stEl.textContent = !m.calc.net ? '' : (k > 0 ? (k === 1 ? '● 1 stroke' : '●● ' + k + ' strokes') : 'No stroke');
      stEl.classList.toggle('none', k <= 0);
    }
    var g = m1Score(h, p), sc = document.getElementById('m1s_score' + p);
    if (sc) {
      sc.textContent = g == null ? '–' : (g === 0 ? 'P' : g);
      sc.classList.toggle('active', _m1Np.open && _m1Np.p === p);
      sc.classList.toggle('locked', !!cc);
    }
    var row = document.getElementById('m1s_row' + p); if (row) row.classList.toggle('won', r === p);
    var cb = scr.querySelector('.m1-concede[data-p="' + p + '"]');
    if (cb) { cb.classList.toggle('on', cc === p); cb.textContent = cc === p ? 'Conceded' : 'Concede'; }
  });
  var hr = '';
  if (r === 'H') hr = 'Hole halved';
  else if (r) hr = (cc ? m1Short(m1Name(cc)) + ' concedes · ' : '') + m1Name(r) + ' wins the hole';
  set('m1s_holeRes', hr);

  // dots: one per hole (+ extra holes), coloured from player A's side
  var dots = document.getElementById('m1s_dots');
  if (dots) {
    var html = '', tot = m1HoleTotal();
    for (var i = 0; i < tot; i++) {
      var ri = m1Result(i), cls = 'dot' + (i === h ? ' active' : '') + (i >= n ? ' extra' : '');
      if (ri === 'A') cls += ' won'; else if (ri === 'B') cls += ' lost'; else if (ri === 'H') cls += ' halved';
      html += '<div class="' + cls + '" data-h="' + i + '"></div>';
    }
    dots.innerHTML = html;
  }
  var sv = document.getElementById('m1s_save'); if (sv) { sv.classList.toggle('ready', out.done); sv.textContent = m.saved ? '✓ SAVED' : 'SAVE MATCH'; }
  m1WireScore(scr);
}

function m1WireScore(scr) {
  if (scr._m1Wired) return;
  scr.addEventListener('click', function (e) {
    if (!m1On() || !m1M().calc) return;
    var sb = e.target.closest('.m1-score');
    if (sb) { m1OpenNumpad(sb.dataset.p); return; }
    var cb = e.target.closest('.m1-concede');
    if (cb) { m1ToggleConcede(cb.dataset.p); return; }
    var d = e.target.closest('#m1s_dots .dot');
    if (d) { m1CloseNumpad(); var t = parseInt(d.dataset.h, 10); if (t <= m1MaxHole()) { m1M().hole = t; m1RenderScore(); } return; }
    var nb = e.target.closest('#m1s_npGrid .num-btn');
    if (nb) { m1NumKey(nb.dataset.val); return; }
    if (e.target.closest('#m1s_npOk')) { m1NumOk(); return; }
    var fb = e.target.closest('.m1-fin-btn');
    if (fb) { m1FinishAction(fb.dataset.act); return; }
    if (_m1Np.open && !e.target.closest('#m1s_numpad')) m1CloseNumpad();
  });
  scr._m1Wired = true;
}

function m1GoHole(d) {
  if (!m1On() || !m1M().calc) return;
  m1CloseNumpad(true);
  var m = m1M(), t = m.hole + d;
  if (t < 0 || t > m1MaxHole()) return;
  m.hole = t; m1RenderScore();
}

// ── numpad ─────────────────────────────────────────────────────────────
function m1OpenNumpad(p) {
  var m = m1M(), h = m.hole;
  if (m1Concede(h)) { m1Toast('Hole conceded. Tap Conceded to undo.'); return; }
  _m1Np = { open: true, p: p, buf: '' };
  var cur = m1Score(h, p);
  var ctx = document.getElementById('m1s_npContext');
  if (ctx) ctx.textContent = m1Short(m1Name(p)) + ' · hole ' + (m1CourseHole(h) + 1) + ' · par ' + trcPar(m1CourseHole(h)) + ' · 0 = pick up';
  var dsp = document.getElementById('m1s_npDisplay'); if (dsp) dsp.textContent = cur == null ? '–' : (cur === 0 ? 'P' : cur);
  var np = document.getElementById('m1s_numpad'); if (np) np.classList.add('open');
  m1RenderScore();
}
function m1CloseNumpad(silent) {
  if (!_m1Np.open) return;
  _m1Np = { open: false, p: null, buf: '' };
  var np = document.getElementById('m1s_numpad'); if (np) np.classList.remove('open');
  if (!silent) m1RenderScore();
}
function m1NumKey(v) {
  if (v === 'del') _m1Np.buf = _m1Np.buf.slice(0, -1);
  else if (_m1Np.buf.length < 2) _m1Np.buf = (_m1Np.buf === '0') ? v : _m1Np.buf + v;
  var dsp = document.getElementById('m1s_npDisplay');
  if (dsp) dsp.textContent = _m1Np.buf === '' ? '–' : (_m1Np.buf === '0' ? 'P' : _m1Np.buf);
}
function m1NumOk() {
  var m = m1M(), h = m.hole, p = _m1Np.p;
  var before = m1StateNow().out.done;
  if (_m1Np.buf !== '') {
    var v = parseInt(_m1Np.buf, 10);
    if (v > 20) { m1Toast('Enter 1 to 20 strokes, or 0 to pick up'); return; }
    m1SetScore(h, p, v);
  }
  var other = p === 'A' ? 'B' : 'A';
  m1Normalize();
  if (m1Score(h, other) == null && m1Score(h, p) != null) { m1OpenNumpad(other); return; }   // score the other player next
  m1CloseNumpad(true);
  m1AfterChange(h, before);
}
function m1ToggleConcede(p) {
  var m = m1M(), h = m.hole;
  m1CloseNumpad(true);
  var before = m1StateNow().out.done;
  m1SetConcede(h, m1Concede(h) === p ? null : p);
  m1Normalize();
  m1AfterChange(h, before);
}

// After a hole changes: finish panel, extra-hole choice, or move on to the next hole.
function m1AfterChange(h, wasDone) {
  var m = m1M(), s = m1StateNow(), n = m1N();
  m1RenderScore();
  if (s.out.done && !wasDone) { m1ShowFinish('done'); return; }
  if (s.st.allSquareEnd && !s.exs.decided && !m.halved && h === m1HoleTotal() - 1 && m1Result(h) != null) { m1ShowFinish('square'); return; }
  if (m1Result(h) != null && h === m.hole && h < m1MaxHole() && m1Result(h + 1) == null) {
    setTimeout(function () { if (m1On() && m1M().hole === h) { m1M().hole = h + 1; m1RenderScore(); } }, 350);
  }
}

// ── finish panel ───────────────────────────────────────────────────────
function m1ShowFinish(kind) {
  var m = m1M(), s = m1StateNow(), n = m1N(), c = _trFlow.course || {};
  var set = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
  var btns = document.getElementById('m1s_finBtns');
  if (kind === 'square') {
    set('m1s_finTitle', 'All square after ' + (m.extra.length ? 'extra hole ' + m.extra.length : n));
    set('m1s_finSub', 'Play an extra hole to decide the winner, or halve the match.');
    if (btns) btns.innerHTML = '<button class="m1-fin-btn primary" type="button" data-act="extra">Play extra hole</button>' +
                               '<button class="m1-fin-btn" type="button" data-act="halve">Halve the match</button>' +
                               '<button class="m1-fin-btn link" type="button" data-act="close">Back to scorecard</button>';
  } else {
    set('m1s_finTitle', m1ResultLine(s.out));
    set('m1s_finSub', s.out.winner === 'H' ? ('All square after ' + n + ' holes at ' + (c.name || 'the course')) : ('at ' + (c.name || 'the course')));
    if (btns) btns.innerHTML = '<button class="m1-fin-btn primary" type="button" data-act="save">Save match</button>' +
                               '<button class="m1-fin-btn link" type="button" data-act="close">Back to scorecard</button>';
  }
  var f = document.getElementById('m1s_finish'); if (f) f.classList.add('open');
}
function m1HideFinish() { var f = document.getElementById('m1s_finish'); if (f) f.classList.remove('open'); }
function m1FinishAction(act) {
  var m = m1M();
  m1HideFinish();
  if (act === 'extra') { m.extra.push({ a: null, b: null, c: null }); m.halved = false; m.hole = m1HoleTotal() - 1; m1RenderScore(); return; }
  if (act === 'halve') { m.halved = true; m1RenderScore(); m1ShowFinish('done'); return; }
  if (act === 'save') { m1Save(); return; }
  m1RenderScore();
}

function m1LeaveScorecard() { showScreen('m1setup'); }   // showScreen pauses an unsaved match first

// ═════════════════════════════════════════════════════════════════════
// screen-m1full (all holes)
// ═════════════════════════════════════════════════════════════════════
function m1StrokeMarks(k) { return k > 0 ? '<sup class="m1-dots">' + new Array(k + 1).join('•') + '</sup>' : ''; }
function m1Cell(g, k, won) {
  var v = g == null ? '–' : (g === 0 ? 'P' : g);
  return (won ? '<span class="m1-win">' + v + '</span>' : v) + m1StrokeMarks(k);
}
function m1RunText(run) { return run === 0 ? 'AS' : (Math.abs(run) + (run > 0 ? ' UP' : ' DN')); }

// Table rows for any match (live or saved): d = { n, par[], si[], sA[], sB[], kA[], kB[], res[], extra[{a,b,c,r}] }
function m1TableRows(d) {
  var html = '', run = 0, closed = false;
  for (var i = 0; i < d.n; i++) {
    var r = d.res[i], mst = '';
    if (r && !closed) { run += r === 'A' ? 1 : (r === 'B' ? -1 : 0); mst = '<span class="m1-mst ' + (run > 0 ? 'a' : (run < 0 ? 'b' : '')) + '">' + m1RunText(run) + '</span>'; }
    if (d.closeAt != null && i === d.closeAt) closed = true;
    var si = d.si[i] != null ? d.si[i] : (i + 1);
    var siCls = d.siAvg ? (si <= 6 ? 'si-hard' : (si <= 12 ? 'si-avg' : 'si-easy')) : trcSIClassSafe(si);
    html += '<tr><td>' + (i + 1) + '</td><td>' + (d.par[i] != null ? d.par[i] : '–') + '</td><td><span class="si-badge ' + siCls + '">' + si + '</span></td>' +
            '<td>' + m1Cell(d.sA[i], d.kA[i] || 0, r === 'A') + '</td><td>' + m1Cell(d.sB[i], d.kB[i] || 0, r === 'B') + '</td><td>' + (mst || '–') + '</td></tr>';
  }
  var extraRows = '';
  (d.extra || []).forEach(function (x, k) {
    var i = k % d.n, r = x.r;
    var mst = r ? '<span class="m1-mst ' + (r === 'A' ? 'a' : (r === 'B' ? 'b' : '')) + '">' + (r === 'H' ? 'AS' : (r === 'A' ? 'WIN' : 'LOSS')) + '</span>' : '–';
    extraRows += '<tr class="m1-extra"><td>' + (d.n + k + 1) + '</td><td>' + (d.par[i] != null ? d.par[i] : '–') + '</td><td>' + (d.si[i] != null ? d.si[i] : '–') + '</td>' +
            '<td>' + m1Cell(x.a, d.kA[i] || 0, r === 'A') + '</td><td>' + m1Cell(x.b, d.kB[i] || 0, r === 'B') + '</td><td>' + mst + '</td></tr>';
  });
  // totals: holes won per player and the result (styled as the last row of the table)
  var wA = 0, wB = 0, closed2 = false;
  for (var j = 0; j < d.n && !closed2; j++) { if (d.res[j] === 'A') wA++; else if (d.res[j] === 'B') wB++; if (d.closeAt != null && j === d.closeAt) closed2 = true; }
  (d.extra || []).forEach(function (x) { if (x.r === 'A') wA++; else if (x.r === 'B') wB++; });
  var parTot = 0; for (var q = 0; q < d.n; q++) parTot += Number(d.par[q]) || 0;
  return html + extraRows + '<tr><td>WON</td><td>' + (parTot || '–') + '</td><td></td><td>' + wA + '</td><td>' + wB + '</td><td>' + m1Esc(d.total || '–') + '</td></tr>';
}
function trcSIClassSafe(si) { return (typeof trcSIClass === 'function') ? trcSIClass(si) : (si <= 6 ? 'si-hard' : (si <= 12 ? 'si-average' : 'si-easy')); }

function m1RenderFull() {
  if (!m1On() || !m1M().calc) return;
  var m = m1M(), c = _trFlow.course || {}, n = m1N(), s = m1StateNow();
  var set = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
  set('m1f_course', c.name || 'Course');
  set('m1f_meta', [m1LoopLabel(c, n), m1Name('A') + ' vs ' + m1Name('B'), m.calc.net ? 'Net' : 'Gross'].filter(Boolean).join(' · '));
  set('m1f_lblA', m1Short(m1Name('A'))); set('m1f_lblB', m1Short(m1Name('B')));
  m1FitName(document.getElementById('m1f_lblA'), m1Short(m1Name('A'))); m1FitName(document.getElementById('m1f_lblB'), m1Short(m1Name('B')));
  set('m1f_thA', m1Short(m1Name('A'))); set('m1f_thB', m1Short(m1Name('B')));
  set('m1f_stMatch', s.out.done ? m1ShortText(s.out.winner === 'H' ? 'Halved' : s.out.text) : (s.st.up === 0 ? 'AS' : m1RunText(s.st.up)));
  set('m1f_stA', s.st.wonA + s.ex.filter(function (x) { return x === 'A'; }).length);
  set('m1f_stB', s.st.wonB + s.ex.filter(function (x) { return x === 'B'; }).length);
  set('m1f_stHoles', m.extra.length ? (n + '+' + m.extra.length) : (s.st.played + ' / ' + n));
  var par = [], si = [], kA = [], kB = [];
  for (var i = 0; i < n; i++) { par.push(trcPar(i)); si.push(trcSI(i)); kA.push(m1Strokes(i, 'A')); kB.push(m1Strokes(i, 'B')); }
  var body = document.getElementById('m1f_body');
  if (body) body.innerHTML = m1TableRows({ n: n, par: par, si: si, sA: m.scoresA, sB: m.scoresB, kA: kA, kB: kB, res: s.res, closeAt: s.st.decidedAt,
    total: s.out.done ? m1ShortText(s.out.winner === 'H' ? 'Halved' : s.out.text).toUpperCase() : (s.st.up === 0 ? 'AS' : m1RunText(s.st.up)),
    extra: m.extra.map(function (x, k) { return { a: x.a, b: x.b, c: x.c, r: s.ex[k] }; }) });
}

// ═════════════════════════════════════════════════════════════════════
// Save
// ═════════════════════════════════════════════════════════════════════
async function m1Save() {
  if (!m1On() || !m1M().calc) return;
  var m = m1M(), calc = m.calc, c = _trFlow.course || {}, n = calc.n, s = m1StateNow();
  if (m.saved) { m1Toast('This match is already saved'); return; }
  if (!s.out.done && s.st.allSquareEnd) { m1ShowFinish('square'); return; }
  if (!s.out.done) { m1Toast('Finish the match first'); return; }
  var uid = (window._fbAuth && window._fbAuth.currentUser) ? window._fbAuth.currentUser.uid : null;
  if (!uid) { m1Toast('Please sign in to save the match.', 'error'); return; }
  var w = s.out.winner;
  var exWonA = s.ex.filter(function (x) { return x === 'A'; }).length, exWonB = s.ex.filter(function (x) { return x === 'B'; }).length;
  var holesPlayed = s.st.played + m.extra.length;
  var round = m1Clone({
    id: Date.now().toString(),
    isMatch: false,
    mode: 'match1v1',
    format: '1vs1 Match Play',
    scoring: calc.net ? 'net' : 'gross',
    allowancePct: calc.net ? calc.pct : null,
    courseName: c.name || '',
    loopName: c._playedLoopName || c.name || '',
    teamName: m.a.name || 'You',
    holes: n, holesPlayed: holesPlayed,
    par: (c.parPerHole || []).slice(0, n),
    index: (c.indexPerHole || []).slice(0, n),
    playerA: { name: m.a.name, uid: m.a.uid || null, isMe: true, hcp: m.a.index, gender: m.a.gender || 'M',
               tee: calc.teeA ? calc.teeA.label : null, courseHcp: calc.chA, playingHcp: calc.phA },
    playerB: { name: m.b.name, uid: m.b.uid || null, isGuest: !!m.b.isGuest, hcp: m.b.index, gender: m.b.gender || 'M',
               avatarId: m.b.avatarId != null ? m.b.avatarId : null,
               tee: calc.teeB ? calc.teeB.label : null, courseHcp: calc.chB, playingHcp: calc.phB },
    strokeDiff: calc.diff, strokeReceiver: calc.receiver,
    strokesA: calc.strokesA.slice(), strokesB: calc.strokesB.slice(),
    scoresA: m.scoresA.slice(), scoresB: m.scoresB.slice(), concede: m.concede.slice(),
    extra: m.extra.map(function (x) { return { a: x.a, b: x.b, c: x.c }; }),
    result: { winner: w, text: s.out.text, up: s.st.up, wonA: s.st.wonA + exWonA, wonB: s.st.wonB + exWonB, halved: s.st.halved,
              decidedAt: s.st.decidedAt, extraHoles: m.extra.length },
    resultText: m1ResultLine(s.out),
    playedAt: new Date().toISOString(),
  });
  var btn = document.getElementById('m1s_save'); if (btn) btn.textContent = '⏳';
  try {
    await window._fbDb.collection('users').doc(uid).collection('rounds').doc(round.id).set(round);
    if (typeof _savedRounds !== 'undefined') _savedRounds.unshift(round);
    if (typeof renderMyData === 'function') renderMyData();
    m.saved = true;
    m1Toast('Match saved', 'success');
    _scRoundSaved = true; _pausedRound = null;
    if (typeof hidePausedRoundBanner === 'function') hidePausedRoundBanner();
    if (typeof clearPausedRoundFromCloud === 'function') clearPausedRoundFromCloud();
    if (typeof updateNotifBadge === 'function') updateNotifBadge();
    window._activeRound = round;
    showScreen(document.getElementById('screen-rounddetail') ? 'rounddetail' : 'home');
  } catch (e) {
    if (btn) btn.textContent = 'SAVE MATCH';
    m1Toast('Could not save: ' + ((e && e.message) || e), 'error');
  }
}

// ═════════════════════════════════════════════════════════════════════
// Pause / resume (shares the Team Round banner and users/{uid}/state/pausedRound)
// ═════════════════════════════════════════════════════════════════════
function m1MaybePause() {
  if (!m1On()) return;
  var m = m1M();
  if (!m.calc || m.saved || (typeof _pausedRound !== 'undefined' && _pausedRound)) return;
  m1CloseNumpad(true); m1HideFinish();
  var n = m1N(), played = [], any = false;
  for (var i = 0; i < n; i++) {
    var has = m.scoresA[i] != null || m.scoresB[i] != null || !!m.concede[i];
    played.push(has ? 1 : null); if (has) any = true;
  }
  if (!any) return;
  var c = _trFlow.course || {};
  _pausedRound = m1Clone({
    mode: 'match1v1',
    m1: m,
    course: c,
    team: _trFlow.team || null,
    trcScores: played,          // marker per hole so the existing cloud restore keeps the paused match
    trcHole: m.hole,
    courseName: c.name || 'Course',
    holesPlayed: played.filter(function (x) { return x; }).length,
    holes: n,
    pausedAt: new Date().toISOString(),
  });
  if (typeof showPausedRoundBanner === 'function') showPausedRoundBanner();
  if (typeof savePausedRoundToCloud === 'function') savePausedRoundToCloud();
  if (typeof updateNotifBadge === 'function') updateNotifBadge();
  m1Toast('Match paused · tap the banner to resume.', 'info');
}
// Called first thing in resumePausedRound(); returns true when it resumed a 1vs1 match.
function m1ResumePaused() {
  if (typeof _pausedRound === 'undefined' || !_pausedRound || _pausedRound.mode !== 'match1v1' || !_pausedRound.m1) return false;
  var p = _pausedRound;
  if (!_trFlow) _trFlow = {};
  _trFlow.course = m1Clone(p.course || {});
  _trFlow.team = p.team ? m1Clone(p.team) : null;
  _trFlow.mode = 'match1v1';
  _trFlow.solo = null;
  _trFlow.m1 = m1Clone(p.m1);
  var m = _trFlow.m1;
  m.extra = m.extra || []; m.concede = m.concede || new Array(m.calc.n).fill(null);
  _scRoundSaved = false;
  _pausedRound = null;   // cleared so leaving again snapshots the latest scores
  if (typeof hidePausedRoundBanner === 'function') hidePausedRoundBanner();
  if (typeof updateNotifBadge === 'function') updateNotifBadge();
  showScreen('m1score');
  return true;
}

// ═════════════════════════════════════════════════════════════════════
// History, Home, round detail and share card
// ═════════════════════════════════════════════════════════════════════
function m1IsRound(r) { return !!r && r.mode === 'match1v1'; }
function m1Outlook(r) {   // from the saver's side (player A)
  var w = r.result && r.result.winner;
  return w === 'A' ? 'Won' : (w === 'B' ? 'Lost' : 'Halved');
}
function m1OutColor(o) { return o === 'Won' ? 'var(--green)' : (o === 'Lost' ? 'var(--red)' : 'var(--gold)'); }
function m1IsNl() { return !!(window.pmI18n && typeof pmI18n.isNl === 'function' && pmI18n.isNl()); }
function m1ShortText(t) {   // '3&2', '1 up', 'AS', '20th' (NL: '20e')
  t = t || '';
  if (t === 'Halved') return 'AS';
  var m = t.match(/^at the (\d+)/);
  if (m) return m1IsNl() ? (m[1] + 'e') : m1Ordinal(parseInt(m[1], 10));
  return t;
}
function m1ShortResult(r) { return m1ShortText(r.result && r.result.text); }

// Game History: the "1vs1" tab (called from renderMatches in app-profile.js)
function m1RenderHistory(ROOT, all, f) {
  var type = ROOT._ghType;
  var b = ROOT.querySelector('#btnM1');
  if (b) { b.onclick = function () { ROOT._ghType = 'M1'; renderMatches(ROOT); }; b.classList.toggle('active', type === 'M1'); }
  var tog = ROOT.querySelector('.type-toggle'); if (tog) tog.classList.add('m1-four');
  var wrap = ROOT.querySelector('#m1Cards'), anchor = ROOT.querySelector('#soCards') || ROOT.querySelector('#trCards');
  if (!wrap && anchor) { wrap = document.createElement('div'); wrap.id = 'm1Cards'; anchor.parentNode.insertBefore(wrap, anchor.nextSibling); }
  if (!wrap) return;
  wrap.style.display = type === 'M1' ? 'block' : 'none';
  if (type !== 'M1') return;
  var mine = (all || []).filter(m1IsRound), list = mine.filter(function (r) { return typeof _ghPassFilter !== 'function' || _ghPassFilter(r, f); });
  wrap.innerHTML = list.length ? '' : '<div style="text-align:center;color:var(--text-3);font-family:Inter,sans-serif;font-size:14px;padding:32px 0;">' + (mine.length ? 'No matches in this filter.' : 'No 1vs1 matches yet.') + '</div>';
  list.forEach(function (r) {
    var o = m1Outlook(r), col = m1OutColor(o), B = r.playerB || {};
    var d = (typeof _mDate === 'function') ? _mDate(r.playedAt) : '';
    var card = document.createElement('div'); card.className = 'round-card';
    card.innerHTML = '<div class="round-left"><div class="round-date">' + d + '</div>' +
      '<div class="round-course">' + m1Esc(r.courseName || 'Course') + '</div>' +
      '<div class="round-meta">' + m1Esc(m1LoopLabel({ _playedLoopName: r.loopName }) || r.courseName || '') + ' · ' + (r.holes || 18) + 'H · vs <span data-no-i18n>' + m1Esc(B.name || 'Opponent') + '</span></div>' +
      '<div class="round-format">' + (r.scoring === 'gross' ? 'Gross' : 'Net') + '</div></div>' +
      '<div class="round-right"><div class="round-gross" style="color:' + col + ';">' + m1Esc(m1ShortResult(r)) + '</div><div class="round-par-label">Result</div>' +
      '<div class="round-vspar" style="color:' + col + ';">' + o + '</div><div class="round-vspar-label">Outcome</div></div>' +
      '<div class="round-chevron">›</div>';
    card.onclick = function () { window._activeRound = r; if (document.getElementById('screen-rounddetail')) showScreen('rounddetail'); };
    wrap.appendChild(card);
  });
}

// Home: "1vs1 Matches | Last 5"
function m1RenderHomeRow(all, fmtDate, escF) {
  var row = document.getElementById('homeM1Row'); if (!row) return;
  var tOf = function (r) { return Date.parse(r.playedAt || r.date || 0) || 0; };
  var list = (all || []).filter(m1IsRound).sort(function (a, b) { return tOf(b) - tOf(a); }).slice(0, 5);
  window._homeM1List = list;
  if (!list.length) { row.innerHTML = '<div class="hh-empty">No 1vs1 matches yet. Challenge a buddy to see it here.</div>'; return; }
  row.innerHTML = list.map(function (r, i) {
    var o = m1Outlook(r), cls = o === 'Won' ? '' : (o === 'Lost' ? 'loss' : 'as'), B = r.playerB || {};
    return '<div class="hh-card" onclick="window._activeRound=window._homeM1List[' + i + ']; showScreen(&quot;rounddetail&quot;)">'
      + '<div class="hh-card-l"><div class="hh-card-date">' + fmtDate(r.playedAt) + '</div>'
      + '<div class="hh-card-course">' + escF(r.courseName || 'Course') + '</div>'
      + '<div class="hh-card-meta">' + escF(m1LoopLabel({ _playedLoopName: r.loopName }) || r.courseName || '') + ' · ' + (r.holes || 18) + 'H · vs <span data-no-i18n>' + escF(B.name || 'Opponent') + '</span></div>'
      + '<div class="hh-card-fmt"><span>' + (r.scoring === 'gross' ? 'Gross' : 'Net') + '</span> · <span>' + o + '</span></div></div>'   // separate nodes so each word is translated
      + '<div class="hh-match-badge ' + cls + '">' + escF(m1ShortResult(r)) + '</div></div>';
  }).join('');
}

// Round Detail (screen-rounddetail). Returns true when it rendered a 1vs1 match.
function m1DetailHook(ROOT, r) {
  var tbl = ROOT.querySelector('.sc-table'); if (tbl) tbl.classList.toggle('m1-mode', m1IsRound(r));
  if (!m1IsRound(r)) {   // shared screen: undo the 1vs1 name labels so Team Round / Solo labels translate again
    ROOT.querySelectorAll('.stats-bar .stat-label.m1-name-lbl').forEach(function (e) { e.classList.remove('m1-name-lbl', 'long', 'xlong'); e.removeAttribute('data-no-i18n'); });
    var sb0 = ROOT.querySelector('.stats-bar'); if (sb0) sb0.classList.remove('m1-names');
    return false;
  }
  m1RenderDetail(ROOT, r); return true;
}
function m1RenderDetail(ROOT, r) {
  var A = r.playerA || {}, B = r.playerB || {}, n = r.holes || (r.par || []).length || 18;
  var set = function (sel, val) { var e = ROOT.querySelector(sel); if (e) e.textContent = val; };
  var fmtDate = function (d) { try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } };
  var sub = ROOT.querySelector('.sub-header .title'); if (sub) sub.textContent = '1vs1 Match';
  set('.meta-date', fmtDate(r.playedAt));
  set('.meta-course', r.courseName || 'Course');
  var rows = ROOT.querySelectorAll('.round-meta-header .meta-row');
  if (rows[0]) rows[0].textContent = [m1LoopLabel({ _playedLoopName: r.loopName }), n + ' holes'].filter(Boolean).join(' · ') + ' · ' + (r.scoring === 'gross' ? 'Gross' : 'Net');
  if (rows[1]) rows[1].textContent = (A.name || 'You') + (A.playingHcp != null && r.scoring !== 'gross' ? ' (PH ' + soloPhLabel(A.playingHcp) + ')' : '') + ' vs ' +
                                     (B.name || 'Opponent') + (B.playingHcp != null && r.scoring !== 'gross' ? ' (PH ' + soloPhLabel(B.playingHcp) + ')' : '');
  set('.meta-thcp', r.resultText || '');
  var labels = ROOT.querySelectorAll('.stats-bar .stat-label'), vals = ROOT.querySelectorAll('.stats-bar .stat-value');
  var L = ['Result', m1Short(A.name) || 'You', m1Short(B.name) || 'Opp', 'Holes'];
  labels.forEach(function (e, i) { if (L[i]) e.textContent = L[i]; });
  var res = r.result || {}, o = m1Outlook(r);
  if (vals[0]) { vals[0].textContent = m1ShortResult(r) || '–'; vals[0].className = 'stat-value ' + (o === 'Won' ? 'neg' : (o === 'Lost' ? 'pos' : '')); }
  if (vals[1]) { vals[1].textContent = res.wonA != null ? res.wonA : '–'; vals[1].className = 'stat-value'; }
  if (vals[2]) { vals[2].textContent = res.wonB != null ? res.wonB : '–'; vals[2].className = 'stat-value'; }
  var hp = (r.holesPlayed != null ? r.holesPlayed : n);
  if (vals[3]) { vals[3].textContent = hp > n ? (n + '+' + (hp - n)) : (hp + '/' + n); vals[3].className = 'stat-value'; }
  [labels[1], labels[2]].forEach(function (e, k) { if (e) { e.setAttribute('data-no-i18n', ''); e.classList.add('m1-name-lbl'); m1FitName(e, L[k + 1]); } });
  var sbar = ROOT.querySelector('.stats-bar'); if (sbar) sbar.classList.add('m1-names');
  [labels[0], labels[3]].forEach(function (e) { if (e) e.classList.remove('m1-name-lbl'); });
  var th = ROOT.querySelector('.sc-table thead tr');
  if (th) th.innerHTML = '<th>Hole</th><th>Par</th><th>SI</th><th data-no-i18n>' + m1Esc(m1Short(A.name) || 'You') + '</th><th data-no-i18n>' + m1Esc(m1Short(B.name) || 'Opp') + '</th><th>Match</th>';
  var tb = ROOT.querySelector('.sc-table tbody'); if (!tb) return;
  var sA = r.scoresA || [], sB = r.scoresB || [], kA = r.strokesA || [], kB = r.strokesB || [], cc = r.concede || [];
  var resArr = [];
  for (var i = 0; i < n; i++) resArr.push(m1HoleResult(sA[i], sB[i], kA[i] || 0, kB[i] || 0, cc[i]));
  var extra = (r.extra || []).map(function (x, k) { var j = k % n; return { a: x.a, b: x.b, c: x.c, r: m1HoleResult(x.a, x.b, kA[j] || 0, kB[j] || 0, x.c) }; });
  tb.innerHTML = m1TableRows({ n: n, par: r.par || [], si: r.index || [], sA: sA, sB: sB, kA: kA, kB: kB, res: resArr, closeAt: res.decidedAt, extra: extra,
    total: (m1ShortResult(r) || '–').toUpperCase(), siAvg: true });
}

// Share card fields (used by _scDerive in app-sharecard.js)
function m1ShareDerive(r, base) {
  var A = r.playerA || {}, B = r.playerB || {}, res = r.result || {}, o = m1Outlook(r);
  var t = (res.text || '').toUpperCase();
  base.isMatch = true;
  base.subtitle = '1VS1 MATCH';
  base.teamLine = (A.name || 'You') + ' VS ' + (B.name || 'Opponent');
  base.result = o === 'Halved' ? 'HALVED' : ((o === 'Won' ? 'WON ' : 'LOST ') + t);
  base.rows = [
    ['WINNER', o === 'Halved' ? 'HALVED' : String(o === 'Won' ? (A.name || 'You') : (B.name || 'Opponent')).toUpperCase(), ''],
    ['HOLES WON', (res.wonA != null ? res.wonA : 0) + ' – ' + (res.wonB != null ? res.wonB : 0), ''],
    ['SCORING', r.scoring === 'gross' ? 'GROSS' : 'NET', ''],
    ['HOLES', String(r.holesPlayed != null ? r.holesPlayed : (r.holes || '')), ''],
    ['DATE', '', '']
  ];
  return base;
}

// Node (headless tests) can require this file for the pure functions.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { trMatchStrokes: trMatchStrokes, m1HoleResult: m1HoleResult, trMatchState: trMatchState,
    m1ExtraState: m1ExtraState, m1Ordinal: m1Ordinal, m1Outcome: m1Outcome };
}
