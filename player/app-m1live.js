// Parmate player app — 1vs1 Match Play LIVE between two buddies (v26).
// Loaded by index.html with a plain <script src> right after app-match.js.
//
// How it works
//   The host sets up a 1vs1 as usual. When the opponent is a buddy (a Parmate account, not a guest)
//   "Live scoring" is on by default. START creates m1live/{id}: the full setup (course, players, strokes)
//   plus a map of hole results. Only the two players can read it (Firestore rules).
//   Every signed-in user has ONE listener on m1live where players contains their uid. It drives:
//     - the invite prompt for the buddy ("Robbie started a 1vs1 match · Join / Not now / Decline"),
//     - the bell cards (Join / Continue / Decline / Cancel) and the bell badge,
//     - live score updates on the open scorecard, and toasts when the other player joins, declines,
//       changes a score you entered, or saves.
//   Both players may enter both scores. Each hole is written as one field (h.<hole>), so two phones
//   editing different holes never overwrite each other. A score overwritten by the other player is
//   marked "changed by <name>" on the hole.
//   Each player saves their own copy of the match, from their own side (the buddy's copy is flipped).
//   Guests and "Live scoring" switched off: nothing here runs, 1vs1 works exactly as before.
//
// Document m1live/{id}
//   uidA, uidB, players:[uidA,uidB], status 'live'|'complete', nameA, nameB, courseName, holes,
//   course {name, holes, par, parPerHole, indexPerHole, _playedLoopName}, setup {scoring, a, b, calc},
//   h { "<hole>": {a, b, c, ba, bb, xa, xb} }   a/b gross (0 = pick up), c concede ('A'|'B'),
//                                               ba/bb uid who entered, xa/xb uid who changed the other's entry
//   extraCount, halved, joinedB, declinedB, savedA, savedB, createdAt, updatedAt, lastBy

var _m1L = { uid: null, unsub: null, docs: {}, prompted: {}, first: true, syncWarnAt: 0 };

function m1LiveMe() { return (window._fbAuth && window._fbAuth.currentUser) ? window._fbAuth.currentUser.uid : null; }
function m1LiveRef(id) { return window._fbDb.collection('m1live').doc(id); }
function m1LiveRole(d) { return d && d.uidA === m1LiveMe() ? 'A' : 'B'; }
function m1LiveOther(d) { return m1LiveRole(d) === 'A' ? (d.nameB || 'Opponent') : (d.nameA || 'Opponent'); }
function m1LiveFirst(name) { return (typeof m1Short === 'function') ? m1Short(name) : String(name || '').split(/\s+/)[0]; }
function m1LiveNameOf(m, uid) {   // name of the player with this uid inside the open match
  if (!m) return '';
  if (m.a && m.a.uid === uid) return m.a.name;
  if (m.b && m.b.uid === uid) return m.b.name;
  return '';
}

// ── Setup screen: "Live scoring with <buddy>" switch ────────────────────
// A buddy is a Parmate account in your buddy list (guests have no uid).
function m1LiveCan(m) {
  if (!m || !m.b || m.b.isGuest || !m.b.uid || !m1LiveMe()) return false;
  var list = (typeof _buddies !== 'undefined' && Array.isArray(_buddies)) ? _buddies : [];
  return list.some(function (x) { return x.uid === m.b.uid; });
}
function m1LiveSetupRow(m) {
  var row = document.getElementById('m1_liveRow'); if (!row) return;
  var can = m1LiveCan(m);
  row.style.display = can ? '' : 'none';
  if (!can) return;
  var nm = document.getElementById('m1_liveName'); if (nm) nm.textContent = m1LiveFirst(m.b.name);
  var chk = document.getElementById('m1_liveChk'); if (chk) chk.checked = !m.liveOff;
}
function m1LiveToggle(on) { if (typeof m1On === 'function' && m1On()) m1M().liveOff = !on; }

// ── Host: START creates the live match ──────────────────────────────────
function m1LiveCourse(c) {
  c = c || {};
  return { name: c.name || '', holes: c.holes || null, par: c.par != null ? c.par : null,
           parPerHole: (c.parPerHole || []).slice(), indexPerHole: (c.indexPerHole || []).slice(),
           _playedLoopName: c._playedLoopName || null, courseId: c.courseId || c.id || null };
}
function m1LiveStartIfWanted(m) {
  m.liveId = null; m.liveRole = null; m.by = {}; m._dirty = {}; m._live = null;
  if (m.liveOff || !m1LiveCan(m) || !window._fbDb) return;
  var me = m1LiveMe(), ref = window._fbDb.collection('m1live').doc();
  var a = m1Clone(m.a);
  if (typeof _profile !== 'undefined' && _profile) {
    if (_profile.avatarUrl) a.avatarUrl = _profile.avatarUrl;
    if (_profile.avatarId != null) a.avatarId = _profile.avatarId;
  }
  var c = _trFlow.course || {};
  var doc = m1Clone({
    v: 1, uidA: me, uidB: m.b.uid, players: [me, m.b.uid], status: 'live',
    nameA: m.a.name || 'Player', nameB: m.b.name || 'Player', courseName: c.name || '', holes: m.calc.n,
    course: m1LiveCourse(c),
    setup: { scoring: m.scoring, a: a, b: m.b, calc: m.calc },
    h: {}, extraCount: 0, halved: false,
    joinedB: false, declinedB: false, savedA: false, savedB: false,
    createdAt: Date.now(), updatedAt: Date.now(), lastBy: me,
  });
  m.liveId = ref.id; m.liveRole = 'A';
  m._live = { joinedB: false, declinedB: false, nameA: doc.nameA, nameB: doc.nameB };
  _m1L.prompted[ref.id] = true;
  ref.set(doc).then(function () {
    m1Toast('📡 Live match started. ' + m1LiveFirst(m.b.name) + ' can join from the bell.', 'success');
  }).catch(function (e) {
    console.warn('m1live create', e);
    if (_trFlow && _trFlow.m1 && _trFlow.m1.liveId === ref.id) { _trFlow.m1.liveId = null; _trFlow.m1._live = null; }
    m1Toast('Live scoring could not start. You score on this phone only.', 'error');
    if (typeof m1RenderScore === 'function') m1RenderScore();
  });
}

// ── Local changes → Firestore ──────────────────────────────────────────
// Called by m1SetScore / m1SetConcede BEFORE the value changes.
function m1LiveMark(h, p, v) {
  var m = m1M(); if (!m || !m.liveId) return;
  var me = m1LiveMe(), k = p === 'A' ? 'a' : 'b';
  m.by = m.by || {}; m._dirty = m._dirty || {};
  var b = m.by[h] = m.by[h] || {};
  var prev = m1Score(h, p), pb = b['b' + k];
  if (prev !== v) b['x' + k] = (prev != null && pb && pb !== me) ? me : null;
  b['b' + k] = me;
  m._dirty[h] = 1;
}
function m1LiveMarkConcede(h) {
  var m = m1M(); if (!m || !m.liveId) return;
  m._dirty = m._dirty || {}; m._dirty[h] = 1;
}
function m1LiveNN(v) { return v === undefined ? null : v; }
function m1LiveFlush() {
  if (typeof m1On !== 'function' || !m1On()) return;
  var m = m1M(); if (!m || !m.liveId || !m.calc || !window._fbDb) return;
  var me = m1LiveMe(), up = { extraCount: (m.extra || []).length, halved: !!m.halved, updatedAt: Date.now(), lastBy: me };
  Object.keys(m._dirty || {}).forEach(function (k) {
    var h = parseInt(k, 10), b = (m.by && m.by[h]) || {};
    up['h.' + h] = { a: m1LiveNN(m1Score(h, 'A')), b: m1LiveNN(m1Score(h, 'B')), c: m1LiveNN(m1Concede(h)),
                     ba: b.ba || null, bb: b.bb || null, xa: b.xa || null, xb: b.xb || null };
  });
  m._dirty = {};
  m1LiveRef(m.liveId).update(up).catch(function (e) {
    console.warn('m1live sync', e);
    if (Date.now() - _m1L.syncWarnAt > 20000) { _m1L.syncWarnAt = Date.now(); m1Toast('Score not synced. Check your connection.', 'error'); }
  });
}
// "Play extra hole": the new hole starts empty on both phones (also clears any old data under that hole).
function m1LiveExtraAdded() {
  var m = m1M(); if (!m || !m.liveId) return;
  m._dirty = m._dirty || {}; m._dirty[m1N() + m.extra.length - 1] = 1;
}

// ── Firestore → the open scorecard ─────────────────────────────────────
function m1LiveFill(m, d) {   // copies the doc's hole data into the match object
  var n = m.calc.n, H = d.h || {};
  m.by = {};
  for (var i = 0; i < n; i++) {
    var x = H[i] || {};
    m.scoresA[i] = x.a != null ? x.a : null;
    m.scoresB[i] = x.b != null ? x.b : null;
    m.concede[i] = x.c || null;
    m.by[i] = { ba: x.ba || null, bb: x.bb || null, xa: x.xa || null, xb: x.xb || null };
  }
  var ex = [];
  for (var k = 0; k < (d.extraCount || 0); k++) {
    var y = H[n + k] || {};
    ex.push({ a: y.a != null ? y.a : null, b: y.b != null ? y.b : null, c: y.c || null });
    m.by[n + k] = { ba: y.ba || null, bb: y.bb || null, xa: y.xa || null, xb: y.xb || null };
  }
  m.extra = ex;
  m.halved = !!d.halved;
  m._live = { joinedB: !!d.joinedB, declinedB: !!d.declinedB, savedA: !!d.savedA, savedB: !!d.savedB, nameA: d.nameA, nameB: d.nameB };
  if (typeof m1Normalize === 'function') m1Normalize();
}
function m1LiveApplyDoc(d) {
  if (typeof m1On !== 'function' || !m1On()) return;
  var m = m1M(); if (!m || !m.calc || m.liveId !== d._id) return;
  if (m._dirty && Object.keys(m._dirty).length) return;   // a local change is about to be sent; its echo comes next
  var me = m1LiveMe(), n = m.calc.n;
  var before = m1StateNow(), viewH = m.hole, viewRes = m1Result(viewH), prevExtra = m.extra.length, prevHalved = m.halved;
  var oldA = m.scoresA.slice(), oldB = m.scoresB.slice(), oldBy = m1Clone(m.by || {});
  m1LiveFill(m, d);
  // the other player changed a score that you entered
  var changed = [];
  for (var i = 0; i < n; i++) {
    var ob = oldBy[i] || {}, nb = m.by[i] || {};
    if ((oldA[i] !== m.scoresA[i] && ob.ba === me && nb.ba && nb.ba !== me) ||
        (oldB[i] !== m.scoresB[i] && ob.bb === me && nb.bb && nb.bb !== me)) changed.push(i + 1);
  }
  if (changed.length) m1Toast(m1LiveFirst(m1LiveNameOf(m, d.lastBy) || m1LiveOther(d)) + ' changed hole ' + changed.join(', '), 'info');

  var scr = document.querySelector('.screen.active'), sid = scr ? scr.id : '';
  if (sid === 'screen-m1full') { if (typeof m1RenderFull === 'function') m1RenderFull(); return; }
  if (sid !== 'screen-m1score') return;
  var s = m1StateNow();
  var fin = document.getElementById('m1s_finish'), finOpen = fin && fin.classList.contains('open');
  var squareOpen = finOpen && !!document.querySelector('#m1s_finBtns [data-act="extra"]');
  if (squareOpen && (m.extra.length > prevExtra || (m.halved && !prevHalved))) {
    m1HideFinish();
    if (m.extra.length > prevExtra) m.hole = m1HoleTotal() - 1;
  }
  if (m.hole > m1MaxHole()) m.hole = m1MaxHole();
  m1RenderScore();
  if (s.out.done && !before.out.done && !m.saved) { m1ShowFinish('done'); return; }
  var lastH = m1HoleTotal() - 1;
  var needChoice = s.st.allSquareEnd && !s.exs.decided && !m.halved && m1Result(lastH) != null;
  var hadChoice = before.st.allSquareEnd && !before.exs.decided && !prevHalved && prevExtra === m.extra.length;
  if (needChoice && !hadChoice && !finOpen) { m.hole = lastH; m1RenderScore(); m1ShowFinish('square'); return; }
  // the hole you are looking at was just finished on the other phone: move on, like after your own entry
  if (viewRes == null && m.hole === viewH && m1Result(viewH) != null && viewH < m1MaxHole() && m1Result(viewH + 1) == null &&
      !(typeof _m1Np !== 'undefined' && _m1Np.open)) {
    setTimeout(function () { if (m1On() && m1M().hole === viewH && m1M().liveId === d._id) { m1M().hole = viewH + 1; m1RenderScore(); } }, 350);
  }
}

// ── Scorecard extras: live pill + "changed by" ─────────────────────────
function m1LiveDecorate(h) {
  var m = m1M(), pill = document.getElementById('m1s_live');
  var L = m && m._live;
  if (pill) {
    if (!m || !m.liveId) { pill.style.display = 'none'; }
    else {
      var other = m1LiveFirst(m.liveRole === 'A' ? (m.b && m.b.name) : (m.a && m.a.name));
      var txt, cls = 'on';
      if (m.liveRole === 'A' && L && L.declinedB) { txt = '📡 ' + other + ' declined · you score on this phone'; cls = 'off'; }
      else if (m.liveRole === 'A' && !(L && L.joinedB)) { txt = '📡 Waiting for ' + other + ' to join'; cls = 'wait'; }
      else txt = '📡 Live with ' + other;
      pill.textContent = txt; pill.className = 'm1-live-pill ' + cls; pill.style.display = '';
    }
  }
  ['A', 'B'].forEach(function (p) {
    var el = document.getElementById('m1s_by' + p); if (!el) return;
    var b = (m && m.liveId && m.by && m.by[h]) || {}, x = b[p === 'A' ? 'xa' : 'xb'];
    if (x && x !== m1LiveMe()) { el.textContent = 'changed by ' + m1LiveFirst(m1LiveNameOf(m, x)); el.style.display = ''; }
    else { el.textContent = ''; el.style.display = 'none'; }
  });
}

// ── Open / join / decline / cancel ─────────────────────────────────────
function m1LiveBuild(d) {   // _trFlow for this live match, seen from my side
  var role = m1LiveRole(d), su = d.setup || {};
  var a = m1Clone(su.a || {}), b = m1Clone(su.b || {});
  a.isMe = role === 'A'; b.isMe = role === 'B'; a.isGuest = false; b.isGuest = false;
  a.uid = d.uidA; b.uid = d.uidB;
  var calc = m1Clone(su.calc || {}), n = calc.n;
  _trFlow = {
    course: m1Clone(d.course || {}), holes: n, loopIdx: null, parByHole: [], siByHole: [],
    team: { name: a.name || '', size: 1, players: [] }, teeKey: 'medal', format: '35_15',
    mode: 'match1v1', solo: null,
    m1: {
      scoring: su.scoring || 'net', pct: calc.pct || 100, a: a, b: b, calc: calc,
      scoresA: new Array(n).fill(null), scoresB: new Array(n).fill(null), concede: new Array(n).fill(null),
      extra: [], halved: false, hole: 0, saved: role === 'A' ? !!d.savedA : !!d.savedB,
      liveId: d._id, liveRole: role, by: {}, _dirty: {}, _live: null,
    },
  };
  var m = _trFlow.m1;
  m1LiveFill(m, d);
  var max = m1MaxHole(), h = 0;
  while (h < max && m1Result(h) != null) h++;
  m.hole = h;
  return m;
}
async function m1LiveOpen(id, join) {
  var me = m1LiveMe(); if (!me || !window._fbDb) return;
  // v29: always start from the server copy; the listener's copy can be stale after the phone slept
  var d = await m1LiveFetch(id);
  if (d === undefined) d = _m1L.docs[id];          // offline: fall back to the last known copy
  if (d) _m1L.docs[id] = d;
  if (!d) { m1Toast('This live match no longer exists.', 'error'); m1LiveRefreshBell(); return; }
  _m1L.prompted[id] = true;
  m1LiveClosePrompt();
  // leave any scorecard first, so an unsaved round there is paused as usual
  var act = document.querySelector('.screen.active'), aid = act ? act.id : '';
  if (/^screen-(trscore|trfull|m1score|m1full|soloscore|solofull|tmscore|tmfull)$/.test(aid) && typeof showScreen === 'function') showScreen('home');
  var m = m1LiveBuild(d);
  _scRoundSaved = false;
  if (join && m.liveRole === 'B' && !d.joinedB) {
    m1LiveRef(id).update({ joinedB: true, declinedB: false, updatedAt: Date.now(), lastBy: me })
      .catch(function (e) { console.warn('m1live join', e); m1Toast('Could not join. Check your connection.', 'error'); });
  }
  showScreen('m1score');
  var st = m1StateNow();
  if (st.out.done && !m.saved) m1ShowFinish('done');
}
async function m1LiveDecline(id) {
  var d = _m1L.docs[id]; if (!d) return;
  var joined = !!d.joinedB;
  if (d.status === 'complete') { if (typeof confirm === 'function' && !confirm('Remove this finished match without saving your copy?')) return; }
  else if (joined && typeof confirm === 'function' && !confirm('Leave this live match? ' + m1LiveFirst(d.nameA) + ' keeps scoring on their phone.')) return;
  _m1L.prompted[id] = true;
  m1LiveClosePrompt();
  try {
    if (d.status === 'complete') await m1LiveRef(id).delete();   // v29: host already saved: nothing left to keep
    else await m1LiveRef(id).update({ declinedB: true, joinedB: false, updatedAt: Date.now(), lastBy: m1LiveMe() });
  }
  catch (e) { console.warn('m1live decline', e); m1Toast('Could not update. Check your connection.', 'error'); return; }
  m1LiveDetachIfOpen(id);
  m1Toast(joined ? 'You left the live match.' : 'Invite declined.', 'info');
}
async function m1LiveCancel(id) {
  var d = _m1L.docs[id]; if (!d) return;
  if (typeof confirm === 'function' && !confirm('Cancel this live match? ' + m1LiveFirst(d.nameB) + ' can no longer score in it.')) return;
  try { await m1LiveRef(id).delete(); }
  catch (e) { console.warn('m1live cancel', e); m1Toast('Could not cancel. Check your connection.', 'error'); return; }
  m1LiveDetachIfOpen(id);
  m1Toast('Live match cancelled.', 'success');
}
// The match is no longer live for me: keep the scores on this phone as a normal 1vs1.
function m1LiveDetachIfOpen(id) {
  if (typeof m1On !== 'function' || !m1On()) return;
  var m = m1M(); if (!m || m.liveId !== id) return;
  m.liveId = null; m._live = null;
  var scr = document.querySelector('.screen.active');
  if (scr && scr.id === 'screen-m1score') m1RenderScore();
}

// ── After saving my copy ───────────────────────────────────────────────
function m1LiveSaved() {
  var m = m1M(); if (!m || !m.liveId) return;
  var id = m.liveId, role = m.liveRole, d = _m1L.docs[id] || {};
  var otherSaved = role === 'A' ? !!d.savedB : !!d.savedA;
  var ref = m1LiveRef(id), me = m1LiveMe();
  var mark = function () {
    return ref.update(role === 'A' ? { savedA: true, status: 'complete', updatedAt: Date.now(), lastBy: me }
                                   : { savedB: true, updatedAt: Date.now(), lastBy: me });
  };
  // v29: clean up only when both copies are saved, or the buddy explicitly declined. A buddy whose phone
  // was locked (or who never opened the invite) can still open the finished match and save their copy.
  var del = (otherSaved && (role === 'A' || d.status === 'complete')) || (role === 'A' && d.declinedB);
  var p = del ? ref.delete().catch(function () { return mark(); }) : mark();
  p.catch(function (e) { console.warn('m1live saved', e); });
}

// The buddy's copy is stored from the buddy's side: they are player A in their own history.
function m1FlipRound(r) {
  var sw = function (x) { return x === 'A' ? 'B' : (x === 'B' ? 'A' : x); };
  var o = m1Clone(r), A = o.playerA, B = o.playerB;
  o.playerA = B; o.playerB = A;
  o.playerA.isMe = true; o.playerA.isGuest = false;
  o.playerB.isMe = false; o.playerB.isGuest = false;
  if (o.playerB.avatarId == null && A && A.avatarId != null) o.playerB.avatarId = A.avatarId;
  o.teamName = o.playerA.name || 'You';
  var t = o.scoresA; o.scoresA = o.scoresB; o.scoresB = t;
  t = o.strokesA; o.strokesA = o.strokesB; o.strokesB = t;
  o.concede = (o.concede || []).map(sw);
  o.extra = (o.extra || []).map(function (x) { return { a: x.b, b: x.a, c: sw(x.c) }; });
  o.strokeReceiver = sw(o.strokeReceiver);
  if (o.result) {
    o.result.winner = sw(o.result.winner);
    t = o.result.wonA; o.result.wonA = o.result.wonB; o.result.wonB = t;
    if (typeof o.result.up === 'number') o.result.up = -o.result.up;
  }
  return o;
}

// ── The one listener ───────────────────────────────────────────────────
function startM1LiveListener(uid) {
  if (!uid || !window._fbDb) return;
  stopM1LiveListener(true);
  _m1L.uid = uid; _m1L.first = true;
  try {
    _m1L.unsub = window._fbDb.collection('m1live').where('players', 'array-contains', uid)
      .onSnapshot(function (snap) {
        _m1L.lastSnapAt = Date.now();
        var prev = _m1L.docs, docs = {};
        snap.forEach(function (doc) { docs[doc.id] = Object.assign({ _id: doc.id }, doc.data()); });
        _m1L.docs = docs;
        Object.keys(docs).forEach(function (id) {
          try { m1LiveEvents(docs[id], prev[id], _m1L.first); } catch (e) { console.warn('m1live events', e); }
          try { m1LiveApplyDoc(docs[id]); } catch (e) { console.warn('m1live apply', e); }
        });
        Object.keys(prev).forEach(function (id) { if (!docs[id]) { try { m1LiveRemoved(prev[id]); } catch (e) {} } });
        _m1L.first = false;
        m1LiveRefreshBell();
      }, function (err) { console.warn('m1live listener', err); });
  } catch (e) { console.warn('startM1LiveListener', e); }
}
function stopM1LiveListener(keep) {
  if (_m1L.unsub) { try { _m1L.unsub(); } catch (e) {} _m1L.unsub = null; }
  if (!keep) { _m1L.docs = {}; _m1L.prompted = {}; _m1L.uid = null; m1LiveClosePrompt(); }
}
function m1LiveEvents(d, p, first) {
  var me = m1LiveMe(), role = m1LiveRole(d), other = m1LiveFirst(m1LiveOther(d));
  if (role === 'B') {
    var invite = d.status === 'live' && !d.joinedB && !d.declinedB && !d.savedB;
    var inIt = (typeof m1On === 'function' && m1On() && m1M() && m1M().liveId === d._id);
    if (invite && !_m1L.prompted[d._id] && !inIt) { _m1L.prompted[d._id] = true; m1LiveShowPrompt(d); }
    if (p && !p.savedA && d.savedA && !d.savedB) m1Toast(other + ' saved the match. Save your copy too.', 'info');
    return;
  }
  if (!p || first) return;
  if (!p.joinedB && d.joinedB) m1Toast('📡 ' + other + ' joined the live match', 'success');
  if (!p.declinedB && d.declinedB) m1Toast(other + (p.joinedB ? ' left the live match. You keep scoring on your phone.' : ' declined. You keep scoring on your phone.'), 'info');
  if (!p.savedB && d.savedB && !d.savedA) m1Toast(other + ' saved the match. Save your copy too.', 'info');
}
function m1LiveRemoved(p) {
  var role = m1LiveRole(p);
  var wasOpen = (typeof m1On === 'function' && m1On() && m1M() && m1M().liveId === p._id);
  if (role === 'B' && !p.savedB && p.status !== 'complete' && (p.joinedB || wasOpen))
    m1Toast(m1LiveFirst(p.nameA) + ' cancelled the live match. Your scores stay on this phone.', 'info');
  if (_m1L.prompted[p._id]) m1LiveClosePrompt(p._id);
  m1LiveDetachIfOpen(p._id);
}

// ── v29: catching up after the phone slept ─────────────────────────────
// A locked phone freezes the page; the live connection can come back stale, so listener updates stop.
// Three safety nets: (1) on wake-up, reconnect Firestore and fetch the open match from the server,
// (2) Continue / Join always start from the server copy, (3) while the live scorecard is on screen,
// fetch the server copy when nothing came in for 30 s (one small read).
function m1LiveFetch(id) {   // doc | null (gone) | undefined (no connection)
  var ref = m1LiveRef(id);
  var wrap = function (s) { return s.exists ? Object.assign({ _id: s.id }, s.data()) : null; };
  return ref.get({ source: 'server' }).then(wrap).catch(function (e) {
    if (e && e.code === 'permission-denied') return null;   // deleted (rules can't see a missing doc)
    return undefined;
  });
}
function m1LiveFilled(m) {
  var k = 0; (m.scoresA || []).forEach(function (v, i) { if (v != null) k++; if (m.scoresB[i] != null) k++; });
  return k;
}
async function m1LiveRefreshOpen() {
  if (typeof m1On !== 'function' || !m1On()) return;
  var m = m1M(); if (!m || !m.liveId || !m.calc || _m1L.refreshing) return;
  var id = m.liveId;
  _m1L.refreshing = true;
  try {
    if (m._dirty && Object.keys(m._dirty).length) m1LiveFlush();   // send my own pending change first
    var before = m1LiveFilled(m);
    var d = await m1LiveFetch(id);
    if (d === undefined) return;                                    // offline: try again later
    _m1L.lastSnapAt = Date.now();
    if (d === null) { var prev = _m1L.docs[id]; delete _m1L.docs[id]; if (prev) m1LiveRemoved(prev); else m1LiveDetachIfOpen(id); m1LiveRefreshBell(); return; }
    _m1L.docs[id] = d;
    m1LiveApplyDoc(d);
    if (m1On() && m1M().liveId === id && m1LiveFilled(m1M()) > before) m1Toast('Scorecard brought up to date', 'info');
    m1LiveRefreshBell();
  } finally { _m1L.refreshing = false; }
}
var _m1HiddenAt = 0;
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'hidden') { _m1HiddenAt = Date.now(); return; }
  var away = _m1HiddenAt ? Date.now() - _m1HiddenAt : 0; _m1HiddenAt = 0;
  if (away < 2000 || !m1LiveMe() || !window._fbDb) return;
  var open = typeof m1On === 'function' && m1On() && m1M() && m1M().liveId;
  if (!open && !Object.keys(_m1L.docs).length) return;
  var db = window._fbDb, p = Promise.resolve();
  if (away >= 20000 && typeof db.disableNetwork === 'function' && typeof db.enableNetwork === 'function')
    p = db.disableNetwork().then(function () { return db.enableNetwork(); }).catch(function () {});
  p.then(function () { m1LiveRefreshOpen(); });
});
setInterval(function () {
  if (document.visibilityState !== 'visible' || typeof m1On !== 'function' || !m1On()) return;
  var m = m1M(); if (!m || !m.liveId) return;
  var sid = ((document.querySelector('.screen.active') || {}).id) || '';
  if (sid !== 'screen-m1score' && sid !== 'screen-m1full') return;
  if (Date.now() - (_m1L.lastSnapAt || 0) >= 30000) m1LiveRefreshOpen();
}, 10000);

// ── Bell: cards + badge ────────────────────────────────────────────────
function m1LiveOpenDocs() {
  var me = m1LiveMe();
  return Object.keys(_m1L.docs).map(function (k) { return _m1L.docs[k]; }).filter(function (d) {
    var role = d.uidA === me ? 'A' : 'B';
    if (role === 'A') return !d.savedA;
    return !d.savedB && !d.declinedB;
  }).sort(function (x, y) { return (y.createdAt || 0) - (x.createdAt || 0); });
}
function m1LiveBadgeCount() { return m1LiveOpenDocs().length; }
// "Golf Amsteldijk · 9 holes · waiting for Annie": every part its own node, so each part translates
// (the course name never does).
function m1LiveBits(course, parts) {
  var e = (typeof esc === 'function') ? esc : function (x) { return x; };
  var out = []; if (course) out.push('<span data-no-i18n>' + e(course) + '</span>');
  (parts || []).forEach(function (x) { if (x) out.push('<span>' + e(x) + '</span>'); });
  return out.join(' · ');
}
function m1LiveBellHtml() {
  var list = m1LiveOpenDocs(); if (!list.length) return '';
  var e = (typeof esc === 'function') ? esc : function (x) { return x; };
  var _t = (typeof t === 'function') ? t : function (k) { return k === 'og_cancel' ? 'Cancel' : (k === 'og_continue' ? 'Continue' : k); };
  return '<div class="og-section-label">Live 1vs1</div>' + list.map(function (d) {
    var role = m1LiveRole(d), other = m1LiveOther(d), invite = role === 'B' && !d.joinedB && d.status === 'live';
    var bits = []; if (d.holes) bits.push(d.holes + ' holes');
    var title, badge = '<span class="og-badge active">1VS1 LIVE</span>', btns;
    if (invite) {
      title = '<span data-no-i18n>' + e(other) + '</span> <span>invites you to a 1vs1</span>';
      badge = '<span class="og-badge waiting">INVITE</span>';
      btns = '<button class="og-btn og-cancel" onclick="m1LiveDecline(\'' + d._id + '\')">✕ Decline</button>' +
             '<button class="og-btn og-continue" onclick="m1LiveOpen(\'' + d._id + '\', true)">▶ Join</button>';
    } else {
      title = '<span>1vs1 vs</span> <span data-no-i18n>' + e(other) + '</span>';
      if (role === 'A' && d.declinedB) bits.push(m1LiveFirst(other) + ' declined');
      else if (role === 'A' && !d.joinedB) bits.push('waiting for ' + m1LiveFirst(other));
      if (d.status === 'complete') bits.push('save your copy');
      btns = (role === 'A'
                ? '<button class="og-btn og-cancel" onclick="m1LiveCancel(\'' + d._id + '\')">✕ ' + _t('og_cancel') + '</button>'
                : '<button class="og-btn og-cancel" onclick="m1LiveDecline(\'' + d._id + '\')">✕ Leave</button>') +
             '<button class="og-btn og-continue" onclick="m1LiveOpen(\'' + d._id + '\', false)">▶ ' + _t('og_continue') + '</button>';
    }
    return '<div class="open-game-card m1l-card-bell"><div class="og-btns">' + btns + '</div>' +
           '<div class="og-info">' + badge + '<div class="og-title">' + title + '</div>' +
           '<div class="og-sub">' + m1LiveBits(d.courseName, bits) + '</div></div></div>';
  }).join('');
}
function m1LiveRefreshBell() {
  if (typeof updateNotifBadge === 'function') updateNotifBadge();
  var scr = document.getElementById('screen-notifications');
  if (scr && scr.classList.contains('active') && typeof renderNotifList === 'function') renderNotifList(scr);
}

// ── Invite prompt ──────────────────────────────────────────────────────
function m1LiveShowPrompt(d) {
  m1LiveClosePrompt();
  var nudge = document.getElementById('pmNudge'); if (nudge && nudge.parentNode) nudge.parentNode.removeChild(nudge);   // the invite wins; the profile reminder returns next sign-in
  var e = (typeof esc === 'function') ? esc : function (x) { return x; };
  var su = d.setup || {}, bits = [];
  if (d.holes) bits.push(d.holes + ' holes');
  bits.push(su.scoring === 'gross' ? 'Gross' : 'Net');
  var ov = document.createElement('div');
  ov.className = 'm1l-prompt'; ov.id = 'm1lPrompt'; ov.setAttribute('data-id', d._id);
  ov.innerHTML = '<div class="m1l-card">' +
    '<div class="m1l-ic">⛳</div>' +
    '<div class="m1l-title"><span data-no-i18n>' + e(d.nameA || 'Your buddy') + '</span> started a 1vs1 match</div>' +
    '<div class="m1l-sub">' + m1LiveBits(d.courseName, bits) + '</div>' +
    '<div class="m1l-txt">Join to see the live scorecard and enter scores on your phone too.</div>' +
    '<div class="m1l-btns">' +
      '<button class="m1l-btn primary" type="button" data-act="join">Join</button>' +
      '<button class="m1l-btn" type="button" data-act="later">Not now</button>' +
      '<button class="m1l-btn link" type="button" data-act="decline">Decline</button>' +
    '</div></div>';
  ov.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-act]');
    if (!b) { if (ev.target === ov) m1LiveClosePrompt(); return; }
    var act = b.getAttribute('data-act');
    if (act === 'join') m1LiveOpen(d._id, true);
    else if (act === 'decline') m1LiveDecline(d._id);
    else { m1LiveClosePrompt(); m1Toast('The invite stays in the bell.', 'info'); }
  });
  document.body.appendChild(ov);
  requestAnimationFrame(function () { ov.classList.add('open'); });
}
function m1LiveClosePrompt(id) {
  var ov = document.getElementById('m1lPrompt'); if (!ov) return;
  if (id && ov.getAttribute('data-id') !== id) return;
  ov.parentNode.removeChild(ov);
}

// Node (headless tests) can require this file for the pure flip function.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { m1FlipRound: m1FlipRound };
}
