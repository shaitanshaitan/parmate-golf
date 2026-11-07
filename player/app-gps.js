/* Parmate · GPS distances (free): front / centre / back of the green on the score screens.
   v40 (30 Oct 2026). Team Round + Solo (screen-trscore) and 1vs1 (screen-m1score).
   v42: the screen is no longer kept on (battery); GPS pauses while the phone sleeps.
   v43: hole map for Pro (Map button on the card; free users see a short Pro note). Map data per course in gps/<course>-map.json.
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
  // v43: hole map (Pro). Fairways, greens, tees, bunkers, water and trees; loaded when a Pro user opens the map.
  var MAP_FILES = {
    golfamsteldijk: 'gps/golf-amsteldijk-map.json?v=20261107a',
    amsteldijk:     'gps/golf-amsteldijk-map.json?v=20261107a'
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
      nohole: 'No GPS data for this hole',
      map: 'Map', proMap: 'The hole map is part of Parmate Pro.', seePro: 'See Pro',
      hole: 'Hole', par: 'Par', scorecard: 'SCORECARD', clear: 'Clear target', backScores: 'Back to scores',
      youTarget: 'You → target', targetCentre: 'Target → centre',
      tapHint: 'Tap the map to measure to a point.', mapLoading: 'Loading the hole map…',
      mapError: 'The hole map could not be loaded. Check your connection.',
      prevHole: 'Previous hole', nextHole: 'Next hole'
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
      nohole: 'Geen GPS-gegevens voor deze hole',
      map: 'Kaart', proMap: 'De holekaart hoort bij Parmate Pro.', seePro: 'Bekijk Pro',
      hole: 'Hole', par: 'Par', scorecard: 'SCOREKAART', clear: 'Doel wissen', backScores: 'Terug naar scores',
      youTarget: 'Jij → doel', targetCentre: 'Doel → midden',
      tapHint: 'Klik op de kaart om tot een punt te meten.', mapLoading: 'Holekaart laden…',
      mapError: 'De holekaart kon niet worden geladen. Controleer je verbinding.',
      prevHole: 'Vorige hole', nextHole: 'Volgende hole'
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
    // v42: no Wake Lock. The phone sleeps after its own timeout (the screen was most of the battery
    // use in the 30 Oct round); GPS stops with it and picks up again when the phone wakes.
  }
  function stopWatch() {
    if (S.watchId !== null) { try { navigator.geolocation.clearWatch(S.watchId); } catch (e) {} }
    S.watchId = null; S.readings = [];
    S.lastFix = null;   // after a pause, show "Searching for GPS…" until a fresh position arrives (never an old spot)
  }
  function sync() { if (shouldRun()) startWatch(); else if (S.watchId !== null) stopWatch(); }

  /* ── card ─────────────────────────────────────────────────────────── */
  var PIN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"></path><circle cx="12" cy="9.5" r="2.5"></circle></svg>';

  var MAPICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"></path><line x1="9" y1="4" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="20"></line></svg>';

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
        '<div class="pmgps-head"><span class="pmgps-title">' + PIN + '<span class="pmgps-t"></span></span>' +
          '<button type="button" class="pmgps-mapbtn">' + MAPICON + '<span class="pmgps-mapbtn-t"></span><span class="pmgps-pro">PRO</span></button></div>' +
        '<div class="pmgps-grid">' +
          '<div class="pmgps-cell"><div class="pmgps-lbl" data-k="front"></div><div class="pmgps-val pmgps-side" data-v="f">–</div></div>' +
          '<div class="pmgps-cell"><div class="pmgps-lbl" data-k="centre"></div><div class="pmgps-val pmgps-mid" data-v="c">–</div></div>' +
          '<div class="pmgps-cell"><div class="pmgps-lbl" data-k="back"></div><div class="pmgps-val pmgps-side" data-v="b">–</div></div>' +
        '</div>' +
        '<div class="pmgps-foot"><span class="pmgps-along"><span class="pmgps-along-t"></span> <b class="pmgps-along-v"></b></span><span class="pmgps-acc"></span></div>' +
        '<div class="pmgps-msg"></div>' +
        '<div class="pmgps-upsell"><span class="pmgps-upsell-t"></span><button type="button" class="pmgps-upsell-btn"></button></div>' +
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
    wrap.querySelector('.pmgps-mapbtn').addEventListener('click', function () {
      if (isPro()) { openMap(); return; }
      var up = wrap.querySelector('.pmgps-upsell');
      up.classList.toggle('open');
    });
    wrap.querySelector('.pmgps-upsell-btn').addEventListener('click', function () {
      if (typeof pmOpenPlan === 'function') pmOpenPlan(); else if (typeof showScreen === 'function') showScreen('subscription');
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
    q('.pmgps-mapbtn-t').textContent = W('map');
    q('.pmgps-upsell-t').textContent = W('proMap');
    q('.pmgps-upsell-btn').textContent = W('seePro');

    var grid = q('.pmgps-grid'), msg = q('.pmgps-msg'), start = q('.pmgps-start'), note = q('.pmgps-note');
    var acc = q('.pmgps-acc'), along = q('.pmgps-along'), osm = q('.pmgps-osm'), foot = q('.pmgps-foot');
    var mapBtn = q('.pmgps-mapbtn'), upsell = q('.pmgps-upsell');
    var setMsg = function (t) { msg.textContent = t || ''; show(msg, !!t); };
    card.classList.remove('stale', 'quiet');
    show(along, false); acc.textContent = ''; note.textContent = ''; show(foot, false);
    var pro = isPro();
    show(q('.pmgps-pro'), !pro);
    if (pro) upsell.classList.remove('open');
    var hasMap = !!MAP_FILES[S.key];
    show(mapBtn, false);
    if (M.open) drawMap();   // redraws only when the hole or unit changed, then updates the live part

    if (S.geoState === 'nodata' || S.geoState === 'none') {
      card.classList.add('quiet');
      show(grid, false); show(start, false); show(osm, false); show(note, false); upsell.classList.remove('open');
      setMsg(W('nodata')); return;
    }
    show(osm, true);
    if (S.geoState === 'loading') { show(grid, false); show(start, false); show(note, false); setMsg(W('loading')); return; }
    if (S.geoState === 'error') { show(grid, false); show(start, false); show(note, false); setMsg(W('offline')); return; }

    var hole = holeData(S.hole);
    if (!hole) { show(grid, false); show(start, false); show(note, false); setMsg(W('nohole')); return; }
    show(mapBtn, hasMap);

    if (!S.on || !('geolocation' in navigator)) {
      show(grid, false); show(start, ('geolocation' in navigator)); show(note, true);
      note.textContent = W('privacy') + (/iPhone|iPad|iPod/.test(navigator.userAgent) ? ' ' + W('iphone') : '');
      setMsg(('geolocation' in navigator) ? '' : W('unsupported'));
      return;
    }
    show(start, false); show(note, false); show(grid, true);
    if (S.blocked) { card.classList.add('stale'); setMsg(W('blocked')); fill(null); return; }

    var pos = smoothed();
    if (S.lastFix) { acc.textContent = 'GPS ± ' + fmt(S.lastFix.acc) + ' ' + uLbl; show(foot, true); }
    if (!pos) { card.classList.add('stale'); setMsg(W('searching')); fill(null); return; }

    var d = greenDistances(pos, hole);
    if (d.c > FAR_M) { card.classList.add('stale'); setMsg(W('far')); fill(null); return; }
    setMsg('');
    fill(d);
    var a = alongFairway(pos, hole);
    if (a !== null && a - d.c > ALONG_MIN) { show(along, true); show(foot, true); q('.pmgps-along-v').textContent = fmt(a) + ' ' + uLbl; }

    function fill(dd) {
      q('[data-v="f"]').textContent = dd ? fmt(dd.f) : '–';
      q('[data-v="c"]').textContent = dd ? fmt(dd.c) : '–';
      q('[data-v="b"]').textContent = dd ? fmt(dd.b) : '–';
    }
  }

  /* ── hole map (Pro, v43) ──────────────────────────────────────────── */
  // Full-screen layer over the score screen (the score screen stays active, so GPS keeps running).
  // The hole is turned so the back tee is at the bottom and the green at the top; 1 SVG unit = 1 metre.
  var SVGNS = 'http://www.w3.org/2000/svg';
  var COL = { rough: '#dbe8d1', outline: '#c8ddb9', trees: '#7fa86b', fairway: '#a9d18e', water: '#8fc0e6',
              bunker: '#e9dcae', tee: '#86b874', green: '#4caf50', greenEdge: '#2e7d32', line: '#24342b',
              you: '#1565c0', target: '#c0392b' };
  var M = { open: false, key: null, data: null, state: 'none', frame: null, target: null, hole: -1, el: null };

  function isPro() { try { return typeof isProUser === 'function' && isProUser(); } catch (e) { return false; } }

  function svgEl(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function ensureMapEl() {
    if (M.el) return M.el;
    var el = document.createElement('div');
    el.id = 'pmGpsMap';
    el.className = 'pmgm';
    el.setAttribute('data-no-i18n', '');
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML =
      '<div class="pmgm-bar"><span class="pmgm-title"><span class="pmgm-hole"></span><span class="pmgm-pro">PRO</span></span>' +
        '<button type="button" class="pmgm-close"></button></div>' +
      '<div class="pmgm-dist">' +
        '<button type="button" class="pmgm-arrow" data-dir="prev">&lt;</button>' +
        '<div class="pmgm-grid">' +
          '<div><div class="pmgps-lbl" data-k="front"></div><div class="pmgps-val pmgps-side" data-m="f">–</div></div>' +
          '<div><div class="pmgps-lbl" data-k="centre"></div><div class="pmgps-val pmgps-mid" data-m="c">–</div></div>' +
          '<div><div class="pmgps-lbl" data-k="back"></div><div class="pmgps-val pmgps-side" data-m="b">–</div></div>' +
        '</div>' +
        '<button type="button" class="pmgm-arrow" data-dir="next">&gt;</button>' +
      '</div>' +
      '<div class="pmgm-area">' +
        '<svg class="pmgm-svg" xmlns="' + SVGNS + '" preserveAspectRatio="xMidYMid meet" role="img"></svg>' +
        '<div class="pmgm-chips"><span class="pmgm-chip pmgm-along"></span><span class="pmgm-chip pmgm-acc"></span></div>' +
        '<div class="pmgm-msg"></div>' +
        '<div class="pmgm-readout"></div>' +
      '</div>' +
      '<div class="pmgm-foot"><button type="button" class="pmgm-clear"></button><button type="button" class="pmgm-back"></button></div>' +
      '<div class="pmgm-osm"></div>';
    document.body.appendChild(el);
    el.querySelector('.pmgm-close').addEventListener('click', function () { closeMap(); });
    el.querySelector('.pmgm-back').addEventListener('click', function () { closeMap(); });
    el.querySelector('.pmgm-clear').addEventListener('click', function () { M.target = null; drawMapLive(); });
    el.querySelectorAll('.pmgm-arrow').forEach(function (b) {
      b.addEventListener('click', function () {
        // Use the score screen's own hole buttons, so the round and the map stay on the same hole.
        var btns = screenEl() ? screenEl().querySelectorAll('.hole-nav button') : [];
        var btn = b.getAttribute('data-dir') === 'prev' ? btns[0] : btns[btns.length - 1];
        if (btn && !btn.disabled) btn.click();
      });
    });
    el.querySelector('.pmgm-svg').addEventListener('click', function (ev) {
      if (!M.frame) return;
      var svg = ev.currentTarget, pt = svg.createSVGPoint();
      pt.x = ev.clientX; pt.y = ev.clientY;
      var ctm = svg.getScreenCTM(); if (!ctm) return;
      var s = pt.matrixTransform(ctm.inverse());
      M.target = M.frame.toLatLng([s.x, s.y]);
      drawMapLive();
    });
    window.addEventListener('resize', function () { if (M.open) { M.hole = -1; drawMap(); } });
    M.el = el;
    return el;
  }

  function loadMapData(key) {
    var file = MAP_FILES[key];
    if (!file) { M.state = 'none'; M.data = null; return; }
    if (M.key === key && (M.state === 'ready' || M.state === 'loading')) return;
    M.key = key; M.state = 'loading'; M.data = null;
    fetch(file).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) { if (M.key !== key) return; M.data = d; M.state = 'ready'; M.hole = -1; drawMap(); })
      .catch(function (e) { console.warn('GPS map', e); if (M.key !== key) return; M.state = 'error'; drawMap(); });
  }

  function openMap() {
    if (!isPro() || !MAP_FILES[S.key]) return;
    ensureMapEl();
    M.open = true; M.target = null; M.hole = -1;
    M.el.classList.add('open');
    document.documentElement.classList.add('pmgm-lock');
    if (!S.on && ('geolocation' in navigator)) { S.on = true; lsSet('pmGpsOn', '1'); S.blocked = false; }
    loadMapData(S.key);
    sync();
    drawMap();
    render();
  }
  function closeMap() {
    M.open = false; M.target = null;
    if (M.el) M.el.classList.remove('open');
    document.documentElement.classList.remove('pmgm-lock');
  }
  window.pmGpsMapOpen = openMap;
  window.pmGpsMapClose = closeMap;

  function makeFrame(h) {
    var o = h.centre;
    var kx = 111320 * Math.cos(o[0] * Math.PI / 180), ky = 110574;
    var t = h.line[0], tx = (t[1] - o[1]) * kx, ty = (t[0] - o[0]) * ky;
    var rot = Math.PI / 2 - Math.atan2(-ty, -tx);          // tee → green points up
    var cr = Math.cos(rot), sr = Math.sin(rot);
    return {
      toSvg: function (p) { var x = (p[1] - o[1]) * kx, y = (p[0] - o[0]) * ky; return [x * cr - y * sr, -(x * sr + y * cr)]; },
      toLatLng: function (s) { var xr = s[0], yr = -s[1]; var x = xr * cr + yr * sr, y = -xr * sr + yr * cr; return [o[0] + y / ky, o[1] + x / kx]; }
    };
  }

  // Static part: the hole and its surroundings. Redrawn when the hole, the unit or the size changes.
  function drawMap() {
    if (!M.open || !M.el) return;
    var el = M.el, svg = el.querySelector('.pmgm-svg');
    var hole = holeData(S.hole);
    var par = (S.course && S.course.parPerHole) ? S.course.parPerHole[S.hole] : null;
    el.querySelector('.pmgm-hole').textContent = W('hole') + ' ' + (S.hole + 1) + (par ? ' · ' + W('par') + ' ' + par : '');
    el.querySelector('.pmgm-close').textContent = W('scorecard');
    el.querySelector('.pmgm-clear').textContent = W('clear');
    el.querySelector('.pmgm-back').textContent = W('backScores');
    el.querySelector('.pmgm-osm').textContent = W('osm');
    el.querySelectorAll('.pmgps-lbl').forEach(function (e) { e.textContent = W(e.getAttribute('data-k')); });
    el.querySelectorAll('.pmgm-arrow').forEach(function (b) {
      b.setAttribute('aria-label', W(b.getAttribute('data-dir') === 'prev' ? 'prevHole' : 'nextHole'));
    });
    var btns = screenEl() ? screenEl().querySelectorAll('.hole-nav button') : [];
    if (btns.length) {
      el.querySelector('[data-dir="prev"]').disabled = !!btns[0].disabled;
      el.querySelector('[data-dir="next"]').disabled = !!btns[btns.length - 1].disabled;
    }
    svg.setAttribute('aria-label', el.querySelector('.pmgm-hole').textContent);
    var msg = el.querySelector('.pmgm-msg');
    if (M.state !== 'ready' || !hole) {
      svg.textContent = ''; M.frame = null;
      msg.textContent = M.state === 'error' ? W('mapError') : (!hole && M.state === 'ready' ? W('nohole') : W('mapLoading'));
      msg.style.display = '';
      drawMapLive();
      return;
    }
    msg.style.display = 'none';
    var unit = pmGetUnits();
    var sig = S.hole + '|' + unit;
    if (M.hole === sig && M.frame) { drawMapLive(); return; }
    if (String(M.hole).split('|')[0] !== String(S.hole)) M.target = null;   // new hole: forget the target
    M.hole = sig;

    var f = makeFrame(hole);
    var pts = hole.line.concat(hole.green).map(f.toSvg);
    var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    var x0 = Math.min.apply(null, xs) - 45, x1 = Math.max.apply(null, xs) + 45;
    var y0 = Math.min.apply(null, ys) - 30, y1 = Math.max.apply(null, ys) + 25;
    var box = svg.getBoundingClientRect();
    var bw = box.width || 360, bh = box.height || 440;
    var w = x1 - x0, hh = y1 - y0, aspect = bw / bh;
    if (w / hh < aspect) { var nw = hh * aspect; x0 -= (nw - w) / 2; w = nw; }
    else { var nh = w / aspect; y0 -= (nh - hh) / 2; hh = nh; }
    svg.setAttribute('viewBox', [x0, y0, w, hh].map(function (v) { return v.toFixed(1); }).join(' '));
    var u = hh / bh;                                            // metres per screen pixel
    M.frame = { toSvg: f.toSvg, toLatLng: f.toLatLng, u: u, view: [x0, y0, w, hh] };

    var path = function (polys) {
      return polys.map(function (poly) {
        return 'M' + poly.map(function (p) { var s = f.toSvg(p); return s[0].toFixed(1) + ' ' + s[1].toFixed(1); }).join('L') + 'Z';
      }).join('');
    };
    var F = M.data.features || {};
    svg.textContent = '';
    svgEl('rect', { x: x0, y: y0, width: w, height: hh, fill: COL.rough }, svg);
    if (F.outline) svgEl('path', { d: path(F.outline), fill: COL.outline }, svg);
    if (F.trees) svgEl('path', { d: path(F.trees), fill: COL.trees, 'fill-opacity': 0.75 }, svg);
    if (F.fairway) svgEl('path', { d: path(F.fairway), fill: COL.fairway }, svg);
    if (F.water) svgEl('path', { d: path(F.water), fill: COL.water }, svg);
    if (F.bunker) svgEl('path', { d: path(F.bunker), fill: COL.bunker, stroke: '#cdbb84', 'stroke-width': (0.8 * u).toFixed(2) }, svg);
    if (F.tee) svgEl('path', { d: path(F.tee), fill: COL.tee, stroke: '#4f7f3f', 'stroke-width': (0.8 * u).toFixed(2) }, svg);
    if (F.green) svgEl('path', { d: path(F.green), fill: COL.green, stroke: COL.greenEdge, 'stroke-width': (1.2 * u).toFixed(2) }, svg);

    // Rings around the green centre in the chosen unit.
    var step = unit === 'yd' ? YARD : 1;
    [100, 150, 200].forEach(function (r) {
      var R = r * step;
      svgEl('circle', { cx: 0, cy: 0, r: R.toFixed(1), fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.85,
        'stroke-width': (1.2 * u).toFixed(2), 'stroke-dasharray': (5 * u).toFixed(1) + ' ' + (5 * u).toFixed(1) }, svg);
      var tx = svgEl('text', { x: (6 * u).toFixed(1), y: (R - 4 * u).toFixed(1), 'font-size': (11 * u).toFixed(1),
        'font-family': 'Roboto, sans-serif', 'font-weight': 700, fill: '#ffffff', stroke: 'rgba(0,0,0,.35)',
        'stroke-width': (2.5 * u).toFixed(2), 'paint-order': 'stroke' }, svg);
      tx.textContent = r;
    });
    // Line of play and green centre.
    svgEl('polyline', { points: hole.line.map(function (p) { return f.toSvg(p).map(function (v) { return v.toFixed(1); }).join(','); }).join(' '),
      fill: 'none', stroke: COL.line, 'stroke-opacity': 0.55, 'stroke-width': (1.5 * u).toFixed(2),
      'stroke-dasharray': (6 * u).toFixed(1) + ' ' + (5 * u).toFixed(1) }, svg);
    svgEl('circle', { cx: 0, cy: 0, r: (3.5 * u).toFixed(2), fill: '#ffffff', stroke: COL.greenEdge, 'stroke-width': (1.5 * u).toFixed(2) }, svg);
    svgEl('g', { 'class': 'pmgm-live' }, svg);
    drawMapLive();
  }

  // Live part: your position, the target and the numbers. Called on every GPS update.
  function drawMapLive() {
    if (!M.open || !M.el) return;
    if (!screenActive()) { closeMap(); return; }               // left the score screen some other way
    var el = M.el, unit = pmGetUnits(), uLbl = unit === 'yd' ? 'yd' : 'm';
    var fmt = function (m) { return m == null ? '–' : String(Math.round(unit === 'yd' ? m / YARD : m)); };
    var hole = holeData(S.hole);
    var pos = (S.on && !S.blocked) ? smoothed() : null;
    var d = (pos && hole) ? greenDistances(pos, hole) : null;
    if (d && d.c > FAR_M) d = null;
    el.querySelector('[data-m="f"]').textContent = d ? fmt(d.f) : '–';
    el.querySelector('[data-m="c"]').textContent = d ? fmt(d.c) : '–';
    el.querySelector('[data-m="b"]').textContent = d ? fmt(d.b) : '–';
    var a = (d && hole) ? alongFairway(pos, hole) : null;
    var alongEl = el.querySelector('.pmgm-along'), accEl = el.querySelector('.pmgm-acc');
    if (a !== null && d && a - d.c > ALONG_MIN) { alongEl.textContent = W('along') + ' ' + fmt(a) + ' ' + uLbl; alongEl.style.display = ''; }
    else alongEl.style.display = 'none';
    if (S.lastFix && S.on) { accEl.textContent = 'GPS ± ' + fmt(S.lastFix.acc) + ' ' + uLbl; accEl.style.display = ''; }
    else accEl.style.display = 'none';
    el.querySelector('.pmgm-clear').disabled = !M.target;

    var ro = el.querySelector('.pmgm-readout');
    if (M.target && hole) {
      ro.innerHTML = '';
      if (pos && d) {
        var a1 = document.createElement('div');
        a1.innerHTML = '<span class="pmgm-ro-l"></span><span class="pmgm-ro-v pmgm-ro-red"></span>';
        a1.firstChild.textContent = W('youTarget'); a1.lastChild.textContent = fmt(haversine(pos, M.target)) + ' ' + uLbl;
        ro.appendChild(a1);
      }
      var a2 = document.createElement('div');
      a2.className = 'pmgm-ro-right';
      a2.innerHTML = '<span class="pmgm-ro-l"></span><span class="pmgm-ro-v"></span>';
      a2.firstChild.textContent = W('targetCentre'); a2.lastChild.textContent = fmt(haversine(M.target, hole.centre)) + ' ' + uLbl;
      ro.appendChild(a2);
      ro.classList.remove('hint');
    } else {
      ro.textContent = M.frame ? W('tapHint') : '';
      ro.classList.add('hint');
    }
    ro.style.display = ro.textContent ? '' : 'none';

    var g = el.querySelector('.pmgm-live');
    if (!g || !M.frame) return;
    g.textContent = '';
    var u = M.frame.u;
    var P = (pos && d) ? M.frame.toSvg(pos) : null;
    if (M.target) {
      var T = M.frame.toSvg(M.target), dash = (4 * u).toFixed(1) + ' ' + (3 * u).toFixed(1);
      if (P) svgEl('line', { x1: P[0], y1: P[1], x2: T[0], y2: T[1], stroke: COL.target, 'stroke-width': (1.8 * u).toFixed(2), 'stroke-dasharray': dash }, g);
      svgEl('line', { x1: T[0], y1: T[1], x2: 0, y2: 0, stroke: COL.target, 'stroke-width': (1.8 * u).toFixed(2), 'stroke-dasharray': dash }, g);
      svgEl('circle', { cx: T[0], cy: T[1], r: (7 * u).toFixed(2), fill: '#ffffff', stroke: COL.target, 'stroke-width': (2.5 * u).toFixed(2) }, g);
    }
    if (P) {
      var accR = S.lastFix ? Math.min(S.lastFix.acc, 60) : 0;
      if (accR > 0) svgEl('circle', { cx: P[0], cy: P[1], r: accR.toFixed(1), fill: COL.you, 'fill-opacity': 0.15, stroke: COL.you, 'stroke-opacity': 0.4, 'stroke-width': u.toFixed(2) }, g);
      svgEl('circle', { cx: P[0], cy: P[1], r: (7 * u).toFixed(2), fill: COL.you, stroke: '#ffffff', 'stroke-width': (2.5 * u).toFixed(2) }, g);
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
