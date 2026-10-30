/* Parmate · GPS distances (free): front / centre / back of the green on the score screens.
   v40 (30 Oct 2026). Team Round + Solo (screen-trscore) and 1vs1 (screen-m1score).
   - Course data: OpenStreetMap hole lines and greens, one JSON file per course in gps/.
   - Location stays on the phone: never stored, never sent.
   - GPS only runs while a score screen is visible and the player has tapped "Show distances".
   - The card is opted out of i18n.js (data-no-i18n) and carries its own EN/NL words,
     because the shared dictionary turns "Back" into "Terug" (the back button). */
(function () {
  'use strict';

  // Normalised course name (lowercase letters and digits only) → data file.
  var GPS_FILES = {
    golfamsteldijk: 'gps/golf-amsteldijk.json?v=20261030a',
    amsteldijk:     'gps/golf-amsteldijk.json?v=20261030a'
  };

  var MAX_ACC = 20;        // m; worse readings are ignored
  var WINDOW_MS = 8000;    // average the readings of the last 8 s
  var HOLD_MS = 30000;     // standing still: a phone may send few new readings, keep the last good one this long
  var ALONG_MIN = 15;      // m; show "Along the fairway" when it is this much longer than straight
  var FAR_M = 1500;        // m; further from the green = not on the course
  var YARD = 0.9144;

  var WORDS = {
    en: {
      title: 'To the green', front: 'Front', centre: 'Centre', back: 'Back',
      along: 'Along the fairway', show: 'Show distances', searching: 'Searching for GPS…',
      far: "You're not on the course", blocked: 'Location is blocked. Allow it in your browser settings.',
      nodata: 'No GPS data for this course yet', loading: 'Loading course data…',
      offline: 'Course data could not be loaded. Check your connection.',
      unsupported: 'This browser has no location support.',
      privacy: 'Your location stays on this phone.',
      osm: 'Course data © OpenStreetMap contributors',
      iphone: 'GPS is built and tested on Android. iPhone should work, but has not been tested yet.',
      nohole: 'No GPS data for this hole'
    },
    nl: {
      title: 'Naar de green', front: 'Voor', centre: 'Midden', back: 'Achter',
      along: 'Via de fairway', show: 'Toon afstanden', searching: 'GPS zoeken…',
      far: 'Je bent niet op de baan', blocked: 'Locatie is geblokkeerd. Sta dit toe in de instellingen van je browser.',
      nodata: 'Nog geen GPS-gegevens voor deze baan', loading: 'Baangegevens laden…',
      offline: 'De baangegevens konden niet worden geladen. Controleer je verbinding.',
      unsupported: 'Deze browser ondersteunt geen locatie.',
      privacy: 'Je locatie blijft op deze telefoon.',
      osm: 'Baangegevens © OpenStreetMap-bijdragers',
      iphone: 'GPS is gebouwd en getest op Android. Op een iPhone zou het moeten werken, maar dat is nog niet getest.',
      nohole: 'Geen GPS-gegevens voor deze hole'
    }
  };
  function W(k) {
    var nl = false;
    try { nl = (typeof _lang !== 'undefined') ? _lang === 'nl' : !!(window.pmI18n && window.pmI18n.isNl()); } catch (e) {}
    return (nl ? WORDS.nl : WORDS.en)[k];
  }

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var S = {
    screenId: null,     // 'trscore' | 'm1score'
    hole: 0,            // course hole index of the round (0-based)
    course: null,       // _trFlow.course at the last update
    key: null,          // normalised course name
    geo: null,          // loaded data for S.key
    geoState: 'none',   // none | loading | ready | nodata | error
    watchId: null,
    readings: [],
    lastFix: null,
    wake: null,
    on: lsGet('pmGpsOn') === '1',
    blocked: false,
    timer: null
  };

  /* ── units (Account Settings › Distances) ─────────────────────────── */
  function pmGetUnits() {
    var u = lsGet('pmUnits');
    if (u !== 'm' && u !== 'yd') {
      try { if (typeof _profile !== 'undefined' && _profile && (_profile.units === 'm' || _profile.units === 'yd')) u = _profile.units; } catch (e) {}
    }
    return u === 'yd' ? 'yd' : 'm';
  }
  function pmApplyUnits(u) {
    u = (u === 'yd') ? 'yd' : 'm';
    lsSet('pmUnits', u);
    pmSyncUnitsPicker();
    render();
    return u;
  }
  function pmSyncUnitsPicker() {
    var cur = pmGetUnits();
    document.querySelectorAll('.pm-units-opt').forEach(function (b) {
      var on = b.getAttribute('data-units-opt') === cur;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function pmSetUnits(u) {
    u = pmApplyUnits(u);
    try { if (typeof _profile !== 'undefined') { _profile = _profile || {}; _profile.units = u; } } catch (e) {}
    try {
      var usr = window._fbAuth && window._fbAuth.currentUser;
      if (usr && window._fbDb) window._fbDb.collection('users').doc(usr.uid).collection('profile').doc('data')
        .set({ units: u }, { merge: true }).catch(function (e) { console.warn('units save failed', e); });
    } catch (e) { console.warn('units save failed', e); }
  }
  window.pmGetUnits = pmGetUnits;
  window.pmApplyUnits = pmApplyUnits;
  window.pmSyncUnitsPicker = pmSyncUnitsPicker;
  window.pmSetUnits = pmSetUnits;

  /* ── geometry ─────────────────────────────────────────────────────── */
  function haversine(a, b) {
    var R = 6371008.8, r = Math.PI / 180;
    var dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
    var h = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.pow(Math.sin(dLng / 2), 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function projector(ref) {
    var kx = 111320 * Math.cos(ref[0] * Math.PI / 180), ky = 110574;
    return function (p) { return [(p[1] - ref[1]) * kx, (p[0] - ref[0]) * ky]; };
  }
  function pointInPoly(pt, poly) {
    var inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  // Front and back: where the line from the player through the green centre enters and leaves the green.
  function greenDistances(pos, hole) {
    var c = haversine(pos, hole.centre);
    var toXY = projector(hole.centre);
    var P = toXY(pos), G = hole.green.map(toXY);
    var dx = -P[0], dy = -P[1], len = Math.hypot(dx, dy);
    if (len < 0.5) return { f: 0, c: 0, b: 0 };
    dx /= len; dy /= len;
    var hits = [];
    for (var i = 0; i < G.length - 1; i++) {
      var x1 = G[i][0], y1 = G[i][1], ex = G[i + 1][0] - x1, ey = G[i + 1][1] - y1;
      var den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) continue;
      var t = ((x1 - P[0]) * ey - (y1 - P[1]) * ex) / den;
      var u = ((x1 - P[0]) * dy - (y1 - P[1]) * dx) / den;
      if (t >= 0 && u >= 0 && u <= 1) hits.push(t);
    }
    if (!hits.length) return { f: c, c: c, b: c };
    var scale = c / len;
    var onGreen = pointInPoly(P, G);
    return { f: onGreen ? 0 : Math.min.apply(null, hits) * scale, c: c, b: Math.max.apply(null, hits) * scale };
  }
  // Distance along the line of play (as watches show on doglegs); null when past the last bend or off the hole.
  function alongFairway(pos, hole) {
    if (!hole.line || hole.line.length < 3) return null;
    var toXY = projector(hole.centre);
    var pts = hole.line.slice(0, -1).concat([hole.centre]).map(toXY), P = toXY(pos), best = null;
    for (var i = 0; i < pts.length - 1; i++) {
      var x1 = pts[i][0], y1 = pts[i][1], dx = pts[i + 1][0] - x1, dy = pts[i + 1][1] - y1;
      var t = Math.max(0, Math.min(1, ((P[0] - x1) * dx + (P[1] - y1) * dy) / (dx * dx + dy * dy)));
      var off = Math.hypot(P[0] - (x1 + t * dx), P[1] - (y1 + t * dy));
      if (!best || off < best.off) best = { off: off, i: i };
    }
    if (!best || best.off > 60 || best.i >= pts.length - 2) return null;
    var d = Math.hypot(P[0] - pts[best.i + 1][0], P[1] - pts[best.i + 1][1]);
    for (var k = best.i + 1; k < pts.length - 1; k++) d += Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]);
    return d;
  }

  /* ── course data ──────────────────────────────────────────────────── */
  function normName(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

  function loadGeo(key) {
    var file = GPS_FILES[key];
    if (!file) { S.geoState = 'nodata'; S.geo = null; return; }
    S.geoState = 'loading'; S.geo = null;
    fetch(file).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (g) { if (S.key !== key) return; S.geo = g; S.geoState = 'ready'; render(); })
      .catch(function (e) { console.warn('GPS data', e); if (S.key !== key) return; S.geoState = 'error'; render(); });
  }

  // Course hole index of the round → hole data. Uses _geoLoops (the loops being played, set by
  // trComposeCourse); rounds started before v40 have none and walk the course's loops in order.
  function holeData(i) {
    var g = S.geo; if (!g || !g.loops || !g.loops.length) return null;
    var c = S.course || {};
    var order = (c._geoLoops && c._geoLoops.length) ? c._geoLoops.slice() : [0];
    var findLoop = function (idx) {
      for (var j = 0; j < g.loops.length; j++) if (g.loops[j].loopIndex === idx) return g.loops[j];
      return g.loops.length === 1 ? g.loops[0] : null;
    };
    var guard = 0;
    while (guard++ < 4) {
      for (var k = 0; k < order.length; k++) {
        var loop = findLoop(order[k]); if (!loop) return null;
        var n = loop.holes.length;
        if (i < n) {
          for (var h = 0; h < n; h++) if (loop.holes[h].n === i + 1) return loop.holes[h];
          return loop.holes[i] || null;
        }
        i -= n;
      }
      if (c._geoLoops && c._geoLoops.length) return null;   // known loops ran out
      // legacy round: repeat the last loop (same 9 played twice)
    }
    return null;
  }

  /* ── position ─────────────────────────────────────────────────────── */
  function smoothed() {
    var now = Date.now();
    S.readings = S.readings.filter(function (r) { return now - r.t <= WINDOW_MS; });
    if (!S.readings.length) {
      var f = S.lastFix;
      return (f && f.acc <= MAX_ACC && now - f.t <= HOLD_MS) ? [f.lat, f.lng] : null;
    }
    var w = 0, lat = 0, lng = 0;
    S.readings.forEach(function (r) { var k = 1 / Math.pow(Math.max(r.acc, 1), 2); w += k; lat += r.lat * k; lng += r.lng * k; });
    return [lat / w, lng / w];
  }
  function onFix(p) {
    S.blocked = false;
    S.lastFix = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, t: Date.now() };
    if (S.lastFix.acc <= MAX_ACC) S.readings.push(S.lastFix);
    render();
  }
  function onErr(e) {
    if (e && e.code === 1) { S.blocked = true; stopWatch(); }
    render();
  }
  function screenEl() { return S.screenId ? document.getElementById('screen-' + S.screenId) : null; }
  function screenActive() { var el = screenEl(); return !!(el && el.classList.contains('active')); }
  function shouldRun() {
    return S.on && !S.blocked && S.geoState === 'ready' && screenActive() && !document.hidden && ('geolocation' in navigator);
  }
  function startWatch() {
    if (S.watchId !== null) return;
    S.watchId = navigator.geolocation.watchPosition(onFix, onErr, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
    if ('wakeLock' in navigator && !S.wake) {
      navigator.wakeLock.request('screen').then(function (l) {
        S.wake = l; l.addEventListener('release', function () { S.wake = null; });
      }).catch(function () {});
    }
  }
  function stopWatch() {
    if (S.watchId !== null) { try { navigator.geolocation.clearWatch(S.watchId); } catch (e) {} }
    S.watchId = null; S.readings = [];
    if (S.wake) { try { S.wake.release(); } catch (e) {} S.wake = null; }
  }
  function sync() { if (shouldRun()) startWatch(); else if (S.watchId !== null) stopWatch(); }

  /* ── card ─────────────────────────────────────────────────────────── */
  var PIN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"></path><circle cx="12" cy="9.5" r="2.5"></circle></svg>';

  function ensureCard() {
    var scr = screenEl(); if (!scr) return null;
    var card = scr.querySelector('.pmgps-card');
    if (card) return card;
    var nav = scr.querySelector('.hole-nav'); if (!nav) return null;
    var anchor = nav.closest('.section') || nav;
    var wrap = document.createElement('div');
    wrap.className = 'section pmgps-section';
    wrap.innerHTML =
      '<div class="pmgps-card" data-no-i18n>' +
        '<div class="pmgps-head"><span class="pmgps-title">' + PIN + '<span class="pmgps-t"></span></span><span class="pmgps-acc"></span></div>' +
        '<div class="pmgps-grid">' +
          '<div class="pmgps-cell"><div class="pmgps-lbl" data-k="front"></div><div class="pmgps-val pmgps-side" data-v="f">–</div></div>' +
          '<div class="pmgps-cell"><div class="pmgps-lbl" data-k="centre"></div><div class="pmgps-val pmgps-mid" data-v="c">–</div></div>' +
          '<div class="pmgps-cell"><div class="pmgps-lbl" data-k="back"></div><div class="pmgps-val pmgps-side" data-v="b">–</div></div>' +
        '</div>' +
        '<div class="pmgps-along"><span class="pmgps-along-t"></span> <b class="pmgps-along-v"></b></div>' +
        '<div class="pmgps-msg"></div>' +
        '<button type="button" class="pmgps-start"></button>' +
        '<div class="pmgps-note"></div>' +
        '<div class="pmgps-osm"></div>' +
      '</div>';
    anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
    wrap.querySelector('.pmgps-start').addEventListener('click', function () {
      if (!('geolocation' in navigator)) { S.blocked = true; render(); return; }
      S.on = true; lsSet('pmGpsOn', '1'); S.blocked = false;
      sync(); render();
    });
    scr.classList.add('pmgps-on');
    return wrap.querySelector('.pmgps-card');
  }

  function show(el, on) { if (el) el.style.display = on ? '' : 'none'; }

  function render() {
    var card = ensureCard(); if (!card) return;
    var q = function (s) { return card.querySelector(s); };
    var unit = pmGetUnits(), uLbl = unit === 'yd' ? 'yd' : 'm';
    var fmt = function (m) { return m == null ? '–' : String(Math.round(unit === 'yd' ? m / YARD : m)); };
    q('.pmgps-t').textContent = W('title');
    card.querySelectorAll('.pmgps-lbl').forEach(function (e) { e.textContent = W(e.getAttribute('data-k')); });
    q('.pmgps-start').textContent = W('show');
    q('.pmgps-osm').textContent = W('osm');
    q('.pmgps-along-t').textContent = W('along');

    var grid = q('.pmgps-grid'), msg = q('.pmgps-msg'), start = q('.pmgps-start'), note = q('.pmgps-note');
    var acc = q('.pmgps-acc'), along = q('.pmgps-along'), osm = q('.pmgps-osm');
    var setMsg = function (t) { msg.textContent = t || ''; show(msg, !!t); };
    card.classList.remove('stale', 'quiet');
    show(along, false); acc.textContent = ''; note.textContent = '';

    if (S.geoState === 'nodata' || S.geoState === 'none') {
      card.classList.add('quiet');
      show(grid, false); show(start, false); show(osm, false); show(note, false);
      setMsg(W('nodata')); return;
    }
    show(osm, true);
    if (S.geoState === 'loading') { show(grid, false); show(start, false); show(note, false); setMsg(W('loading')); return; }
    if (S.geoState === 'error') { show(grid, false); show(start, false); show(note, false); setMsg(W('offline')); return; }

    var hole = holeData(S.hole);
    if (!hole) { show(grid, false); show(start, false); show(note, false); setMsg(W('nohole')); return; }

    if (!S.on || !('geolocation' in navigator)) {
      show(grid, false); show(start, ('geolocation' in navigator)); show(note, true);
      note.textContent = W('privacy') + (/iPhone|iPad|iPod/.test(navigator.userAgent) ? ' ' + W('iphone') : '');
      setMsg(('geolocation' in navigator) ? '' : W('unsupported'));
      return;
    }
    show(start, false); show(note, false); show(grid, true);
    if (S.blocked) { card.classList.add('stale'); setMsg(W('blocked')); fill(null); return; }

    var pos = smoothed();
    if (S.lastFix) acc.textContent = 'GPS ± ' + fmt(S.lastFix.acc) + ' ' + uLbl;
    if (!pos) { card.classList.add('stale'); setMsg(W('searching')); fill(null); return; }

    var d = greenDistances(pos, hole);
    if (d.c > FAR_M) { card.classList.add('stale'); setMsg(W('far')); fill(null); return; }
    setMsg('');
    fill(d);
    var a = alongFairway(pos, hole);
    if (a !== null && a - d.c > ALONG_MIN) { show(along, true); q('.pmgps-along-v').textContent = fmt(a) + ' ' + uLbl; }

    function fill(dd) {
      q('[data-v="f"]').textContent = dd ? fmt(dd.f) : '–';
      q('[data-v="c"]').textContent = dd ? fmt(dd.c) : '–';
      q('[data-v="b"]').textContent = dd ? fmt(dd.b) : '–';
    }
  }

  /* ── entry point: called by the score screens on every hole render ── */
  function pmGpsUpdate(screenId, holeIdx) {
    try {
      S.screenId = screenId;
      S.hole = holeIdx || 0;
      S.course = (typeof _trFlow !== 'undefined' && _trFlow) ? _trFlow.course : null;
      var key = normName(S.course && S.course.name);
      if (key !== S.key) { S.key = key; stopWatch(); loadGeo(key); }
      render();
      sync();
      if (!S.timer) S.timer = setInterval(function () {
        if (S.watchId !== null && !shouldRun()) stopWatch();
        if (S.watchId !== null) render();   // drop stale readings when fixes stop arriving
      }, 2000);
    } catch (e) { console.warn('pmGpsUpdate', e); }
  }
  window.pmGpsUpdate = pmGpsUpdate;
  window.pmGpsStop = stopWatch;

  // Re-render straight away when the language changes (i18n.js sets <html lang>).
  try { new MutationObserver(function () { if (S.screenId) render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] }); } catch (e) {}

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopWatch();
    else if (shouldRun()) { startWatch(); render(); }
  });
})();
