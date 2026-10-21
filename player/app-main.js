// Parmate player app — core app: i18n helpers, auth, home, teams, rounds, scorecards, navigation
// Loaded by index.html with a plain <script src> at its original spot (no defer/async/module).

// ═══════════════════════════════════
// i18n — TRANSLATIONS
// ═══════════════════════════════════
// LANG (all UI translations) lives in lang.js, loaded just above this script

let _lang = localStorage.getItem('parmate_lang') ||
  (navigator.language.startsWith('nl') ? 'nl' : 'en');

function t(key) {
  return (LANG[_lang] && LANG[_lang][key]) || LANG.en[key] || key;
}

function setLang(lang) {
  _lang = lang;
  localStorage.setItem('parmate_lang', lang);
  applyLang();
  updateLangBtn();
  if (window.pmI18n) pmI18n.setLang(lang);   // translate / restore all other app text (i18n.js)
}

function updateLangBtn() {
  const btn = document.getElementById('langToggleBtn');
  if (!btn) return;
  // Show EN / NL with active one bold
  if (_lang === 'nl') {
    btn.innerHTML = 'EN / <strong style="color:#1a6b3c">NL</strong>';
  } else {
    btn.innerHTML = '<strong style="color:#1a6b3c">EN</strong> / NL';
  }
}

function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else {
      el.textContent = val;
    }
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-ph'));
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.getAttribute('data-i18n-html'));
  });
  updateLangBtn();
}

// ═══════════════════════════════════
// STATE
// ═══════════════════════════════════
const FORMATS = { '35_15':[0.35,0.15], '25_20':[0.25,0.20], '20_15':[0.20,0.15], '50_50':[0.50,0.50],
                  '30_20_10':[0.30,0.20,0.10], '20_15_10':[0.20,0.15,0.10], '15_12_10':[0.15,0.12,0.10],
                  '25_20_15_10':[0.25,0.20,0.15,0.10], '20_15_10_5':[0.20,0.15,0.10,0.05], '15_12_10_7':[0.15,0.12,0.10,0.07] };   // v32: + WHS 30/20/10 and 25/20/15/10
const MAX_COURSES = 20; // personal saved-courses cap — same for Free and Pro
const MAX_TEAMS_FREE         = 2;
const MAX_BUDDIES_FREE       = 5;
const MAX_MATCH_HISTORY_FREE = 8;

function isProUser() {
  if (!(_profile && _profile.tier === 'pro')) return false;
  // A cancelled plan stays Pro only until its end date; after that it's Free.
  if (_profile.proCancelled && _profile.proEndsAt) {
    var ends = new Date(_profile.proEndsAt);
    if (!isNaN(ends.getTime()) && Date.now() >= ends.getTime()) return false;
  }
  return true;
}
function maxTeamsForUser()        { return isProUser() ? Infinity : MAX_TEAMS_FREE; }
function maxBuddiesForUser()      { return isProUser() ? Infinity : MAX_BUDDIES_FREE; }
function maxMatchHistoryForUser() { return isProUser() ? Infinity : MAX_MATCH_HISTORY_FREE; }

let _holes       = 18;
let _gameMode    = 'single'; // 'single' | 'match'
let _savedCourses  = []; // array, max 20
let _calcCourseTees  = []; // tees for currently loaded calc course
let _calcParValues   = null; // par per hole for calc course
let _calcIndexValues = null; // SI per hole for calc course
let _t1PlayerCount   = 2;   // My Team player count (1–4)
let _t2PlayerCount   = 2;   // Opponent Team player count (1–4)

// Profile state
let _profile = null; // { displayName, hcpIndex, homeCourse, avatarId }
let _teams   = [];   // [{ id, teamName, ... }]
let _buddies = [];   // [{ uid, name, hcp, avatarId, addedAt }]
let _pendingRequests = []; // incoming buddy requests
let _sharedCourses = []; // shared course DB — loaded on sign-in
let _msCourseTees  = []; // tees for currently loaded match setup course
let _msT1Count = 2; // player count for My Team in match setup (2–4)
let _msT2Count = 2; // player count for Opponent Team in match setup (2–4)
let _savedTeams    = []; // array, max 2
let _savedRounds   = []; // loaded from Firestore, newest first

// Your UID — gates the CSV import tool
const ADMIN_UID = 'uAEyzbYi5RXHwJYiALrzzaLSjSm1';

const AVATARS = {
  1: "icons/avatars/1.jpg",
  2: "icons/avatars/2.jpg",
  3: "icons/avatars/3.jpg",
  4: "icons/avatars/4.jpg",
  5: "icons/avatars/5.jpg",
  6: "icons/avatars/6.jpg",
  7: "icons/avatars/7.jpg",
  8: "icons/avatars/8.jpg",
  9: "icons/avatars/9.jpg",
  10: "icons/avatars/10.jpg",
  11: "icons/avatars/11.jpg",
  12: "icons/avatars/12.jpg",
  13: "icons/avatars/13.jpg",
  14: "icons/avatars/14.jpg",
  15: "icons/avatars/15.jpg",
  16: "icons/avatars/16.jpg",
  17: "icons/avatars/17.jpg",
  18: "icons/avatars/18.jpg",
  19: "icons/avatars/19.jpg",
  20: "icons/avatars/20.jpg",
  21: "icons/avatars/21.jpg",
  22: "icons/avatars/22.jpg",
  23: "icons/avatars/23.jpg",
  24: "icons/avatars/24.jpg",
  25: "icons/avatars/25.jpg",
  26: "icons/avatars/26.jpg",
  27: "icons/avatars/27.jpg",
  28: "icons/avatars/28.jpg",
  29: "icons/avatars/29.jpg",
  30: "icons/avatars/30.jpg",
  31: "icons/avatars/31.jpg",
  32: "icons/avatars/32.jpg",
  33: "icons/avatars/33.jpg",
  34: "icons/avatars/34.jpg",
  35: "icons/avatars/35.jpg",
};

const COVERS = {
  1: "icons/covers/1.jpg",
  2: "icons/covers/2.jpg",
  3: "icons/covers/3.jpg",
  4: "icons/covers/4.jpg",
  5: "icons/covers/5.jpg",
  6: "icons/covers/6.jpg",
  7: "icons/covers/7.jpg",
};

const PICKER_PAGE_SIZE = 10; // both avatar and cover pickers paginate at this size

let _activeTab   = 'calc';

// ═══════════════════════════════════
// TABS + SWIPE
// ═══════════════════════════════════
function toggleMydataSection(sectionId) {
  const body   = document.getElementById(sectionId + '_body');
  const toggle = document.getElementById(sectionId + '_toggle');
  if (!body) return;
  const isCollapsed = body.style.display === 'none';
  body.style.display   = isCollapsed ? '' : 'none';
  if (toggle) toggle.textContent = isCollapsed ? '−' : '+';
}

// ── COLLAPSIBLE SECTIONS ────────────────────────────────────
const _sectionState = {}; // session memory: sectionId -> collapsed bool

function toggleSection(sectionId) {
  const body   = document.getElementById(sectionId + '_body');
  const header = document.getElementById(sectionId + '_header');
  const toggle = document.getElementById(sectionId + '_toggle');
  if (!body) return;
  const isCollapsed = body.classList.toggle('collapsed');
  if (header) header.classList.toggle('collapsed', isCollapsed);
  if (toggle) toggle.textContent = isCollapsed ? '+' : '−';
  _sectionState[sectionId] = isCollapsed;
}

function initSectionState() {
  // Apply remembered state on load — default all expanded
  ['sec_course','sec_format','sec_myteam'].forEach(id => {
    const body   = document.getElementById(id + '_body');
    const header = document.getElementById(id + '_header');
    const toggle = document.getElementById(id + '_toggle');
    const isCollapsed = _sectionState[id] || false;
    if (body)   body.classList.toggle('collapsed', isCollapsed);
    if (header) header.classList.toggle('collapsed', isCollapsed);
    if (toggle) toggle.textContent = isCollapsed ? '+' : '−';
  });
}

// ═══════════════════════════════════
// NEW-UI SCREEN ROUTER (full redesign)
// ═══════════════════════════════════
let _screenStack = [];
let _navFromPop = false;
function _activeScreenId(){ var el=document.querySelector('.screen.active'); return el ? el.id.replace('screen-','') : 'home'; }
function showScreen(id, opts) {
  opts = opts || {};
  // Leaving the TR scorecard by ANY route (BACK pill, Home nav tab, etc.):
  // if there are unsaved scores, pause the round so it can be resumed later.
  // Excludes 'trfull' (the all-holes view) and 'trscore' itself (staying put).
  const _leavingTrScore = document.getElementById('screen-trscore') &&
        document.getElementById('screen-trscore').classList.contains('active') &&
        id !== 'trscore' && id !== 'trfull';
  if (_leavingTrScore && typeof maybePauseTrRound === 'function') maybePauseTrRound();
  if (typeof m1BeforeShow === 'function') m1BeforeShow(id);   // 1vs1: pause an unsaved match (app-match.js)
  // Clear read-only view mode once we navigate anywhere except the view screens.
  if (id !== 'trloop' && id !== 'trparsi' && typeof _viewMode !== 'undefined') { _viewMode = false; }
  if (id !== 'tmscore' && id !== 'tmfull') window._tmView = null;  // leave saved-match view
  const el = document.getElementById('screen-' + id);
  if (!el) { console.warn('showScreen: no #screen-' + id); return; }
  document.querySelectorAll('.screen.active').forEach(function(s){ s.classList.remove('active'); });
  el.classList.add('active');
  if (!opts.replace) _screenStack.push(id);
  // Keep the device/browser back button in sync with in-app navigation
  if (!_navFromPop) {
    try {
      if (opts.replace) history.replaceState({ screen: id }, '');
      else history.pushState({ screen: id }, '');
    } catch(e){}
  }
  el.scrollTop = 0;
  if (id === 'home' && typeof renderHomeScreen === 'function') renderHomeScreen();
  // NEW-UI: initialise Add Course wizard step behaviours when shown
  if (typeof acInitStep === 'function') acInitStep(id, el);
  if (typeof trInitStep === 'function') trInitStep(id, el);
  if (typeof tmInitStep === 'function') tmInitStep(id, el);
  if (typeof soloInitStep === 'function') soloInitStep(id, el);   // Solo Round setup (app-solo.js)
  if (typeof m1InitStep === 'function') m1InitStep(id, el);   // 1vs1 Match Play screens (app-match.js)
  if (typeof applyLang === 'function') applyLang();
}


// ═══════════════════════════════════════════
// NEW-UI: ADD COURSE WIZARD (AC01–AC05)
// Shared state + navigation. Save is STUBBED
// until the extended course schema is approved.
// ═══════════════════════════════════════════
let _acWizard = null;
const AC_STEPS = ['accourse', 'acloops', 'aclayout', 'acparsi', 'acconfirm'];

function acNewLoop(name) {
  return {
    name: name || '', holes: 9,
    tees: { champion:{r:'',s:'',p:''}, medal:{r:'',s:'',p:''}, senior:{r:'',s:'',p:''}, forward:{r:'',s:'',p:''} },
    women: { blue:{r:'',s:'',p:''}, medal:{r:'',s:'',p:''}, forward:{r:'',s:'',p:''} },
    par: [], si: []
  };
}
function acStart() {
  _acWizard = {
    name: '', country: '', city: '',
    loops: [ acNewLoop('') ],   // flexible 1..N loops, each with own tees + par/SI
    activeLoop: 0,
  };
  showScreen('accourse');
}

// ── EDIT MODE (Pro): start the same wizard, pre-filled from an existing shared course ──
// This is the reverse of acBuildCourse(): Firestore course shape -> _acWizard shape,
// so every existing tee / par / SI is shown and editable rather than starting blank.
function acLoopToWizard(loop) {
  const wl = acNewLoop(loop.name || '');
  wl.holes = loop.holes || 9;
  const teeArr = Array.isArray(loop.tees) ? loop.tees : [];
  const findTee = (key) => teeArr.find(t => (t.label||'').toLowerCase().includes(key));
  const fill = (t) => t ? { r: (t.rating!=null?String(t.rating):''), s: (t.slope!=null?String(t.slope):''), p: (t.par!=null?String(t.par):'') } : { r:'', s:'', p:'' };
  wl.tees.champion = fill(findTee('champ'));
  wl.tees.medal    = fill(findTee('medal') || findTee('standard'));
  wl.tees.senior   = fill(findTee('senior'));
  wl.tees.forward  = fill(findTee('forward') || findTee('fwd'));
  const wArr = Array.isArray(loop.women) ? loop.women : [];
  const findW = (key) => wArr.find(t => (t.label||'').toLowerCase().includes(key));
  wl.women.blue    = fill(findW('blue') || findW('champ'));  // legacy 'Champion' women -> Blue
  wl.women.medal   = fill(findW('medal') || findW('standard'));
  wl.women.forward = fill(findW('forward') || findW('fwd'));
  const holes = wl.holes;
  wl.par = (Array.isArray(loop.parPerHole) && loop.parPerHole.length) ? loop.parPerHole.slice(0, holes) : [];
  wl.si  = (Array.isArray(loop.indexPerHole) && loop.indexPerHole.length) ? loop.indexPerHole.slice(0, holes) : [];
  return wl;
}

function acStartEdit(course) {
  if (!course) return;
  const loops = (Array.isArray(course.loops) && course.loops.length)
    ? course.loops.map(acLoopToWizard)
    : [ acLoopToWizard(course) ];   // legacy single-loop courses stored flat
  _acWizard = {
    name: course.name || '',
    country: course.country || '',
    city: course.city || '',
    loops,
    activeLoop: 0,
    _editDocId: course._docId || null,   // marks this as an edit of an existing doc
  };
  _acInited = {};   // force each step to re-prefill from the new wizard state
  showScreen('accourse');
}

function acGoStep(idx) {
  if (idx < 0) {
    // In edit mode, backing out of step 1 returns to the course list, not home
    if (_acWizard && _acWizard._editDocId) { showScreen('editcourses'); return; }
    showScreen('home'); return;
  }
  if (idx >= AC_STEPS.length) return;
  showScreen(AC_STEPS[idx]);
}
function acStepIndex(id) { return AC_STEPS.indexOf(id); }

// Collect the currently-active step's fields into _acWizard
function acActiveLoop() { return _acWizard.loops[_acWizard.activeLoop] || _acWizard.loops[0]; }
function acCollect(stepId) {
  if (!_acWizard) return;
  const g = id => (document.getElementById(id) || {}).value;
  if (stepId === 'accourse') {
    _acWizard.name = g('ac_courseName') || '';
    _acWizard.country = g('ac_countrySelect') || '';
    _acWizard.city = g('ac_courseCity') || '';
  } else if (stepId === 'acloops') {
    // loop names/holes are written live by the dynamic list handlers
  } else if (stepId === 'aclayout') {
    const t = acActiveLoop().tees;
    t.champion = { r:g('ac_cr'), s:g('ac_cs'), p:g('ac_cp') };
    t.medal    = { r:g('ac_mr'), s:g('ac_ms'), p:g('ac_mp') };
    t.senior   = { r:g('ac_sr'), s:g('ac_ss'), p:g('ac_sp') };
    t.forward  = { r:g('ac_fr'), s:g('ac_fs'), p:g('ac_fp') };
    const w = acActiveLoop().women || (acActiveLoop().women = {});
    w.blue     = { r:g('wcr'), s:g('wcs'), p:g('wcp') };
    w.medal    = { r:g('wmr'), s:g('wms'), p:g('wmp') };
    w.forward  = { r:g('wfr'), s:g('wfs'), p:g('wfp') };
  } else if (stepId === 'acparsi') {
    const scr = document.getElementById('screen-acparsi');
    const holes = scr.querySelectorAll('.si-input').length;
    const L = acActiveLoop(); L.par = []; L.si = [];
    for (let i = 0; i < holes; i++) {
      const pActive = scr.querySelector('.par-btn.active[data-hole="'+i+'"]');
      L.par[i] = pActive ? parseInt(pActive.dataset.par) : null;
      const siEl = document.getElementById('ac-si-'+i);
      const raw = siEl ? siEl.textContent.trim() : '';
      const n = parseInt(raw, 10);
      L.si[i] = (raw !== '' && !isNaN(n)) ? n : null;
    }
  }
}

// Advance: collect current step then go to next
function acNext(fromStepId) {
  acCollect(fromStepId);
  // AC03: require at least one tee (any of Champion/Medal/Senior/Forward) on the active loop
  if (fromStepId === 'aclayout') {
    const t = acActiveLoop().tees || {};
    const filled = ['champion','medal','senior','forward'].some(k => t[k] && String(t[k].r||'').trim() !== '' && String(t[k].s||'').trim() !== '');
    if (!filled) {
      if (typeof showToast === 'function') showToast('Enter at least one tee (rating + slope) to continue');
      const scr = document.getElementById('screen-aclayout');
      const mr = document.getElementById('ac_mr');
      if (mr) { mr.style.borderColor = '#c85a4a'; setTimeout(()=>mr.style.borderColor='', 1500); }
      return;
    }
  }
  const idx = acStepIndex(fromStepId);
  if (idx === AC_STEPS.length - 1) { acSave(); return; }
  acGoStep(idx + 1);
}
function acBack(fromStepId) {
  acCollect(fromStepId);
  acGoStep(acStepIndex(fromStepId) - 1);
}

// Build the engine-compatible course object from wizard state
function acBuildCourse() {
  const w = _acWizard;
  const num = v => { const n = parseFloat(v); return isNaN(n) ? null : n; };

  // Build each loop with its OWN tees + par/SI (one-course-many-loops model)
  const loops = w.loops.map((L, li) => {
    const holes = L.holes || 9;
    const medal = L.tees.medal || {}, champ = L.tees.champion || {}, sr = L.tees.senior || {}, fwd = L.tees.forward || {};
    const par = num(medal.p) || (L.par && L.par.length ? L.par.reduce((a,b)=>a+(b||0),0) : (holes===9?36:72));
    const tees = [];
    if (num(champ.r) != null) tees.push({ label:'Champion', rating:num(champ.r), slope:num(champ.s), par:num(champ.p)||par });
    if (num(medal.r) != null) tees.push({ label:'Medal', rating:num(medal.r), slope:num(medal.s), par });
    if (num(sr.r) != null)    tees.push({ label:'Senior', rating:num(sr.r), slope:num(sr.s), par:num(sr.p)||par });
    if (num(fwd.r) != null)   tees.push({ label:'Forward', rating:num(fwd.r), slope:num(fwd.s), par:num(fwd.p)||par });
    // base rating/slope = Medal if filled, else first filled tee
    const baseTee = (num(medal.r) != null) ? { r:num(medal.r), s:num(medal.s) }
                  : (tees[0] ? { r:tees[0].rating, s:tees[0].slope } : { r:null, s:null });
    const parPerHole   = (L.par && L.par.length === holes && L.par.every(x=>x!=null)) ? L.par.slice() : Array(holes).fill(4);
    const indexPerHole = (L.si  && L.si.length  === holes && L.si.every(x=>x!=null))  ? L.si.slice()  : Array.from({length:holes},(_,i)=>i+1);
    // women's tees (optional) — only include filled ones
    const W = L.women || {};
    const womenTees = [];
    [['medal','Medal'],['blue','Blue'],['forward','Forward']].forEach(([k,lab]) => {
      const wt = W[k] || (k==='blue' ? (W.champion||{}) : {});  // legacy 'champion' -> Blue
      if (num(wt.r) != null) womenTees.push({ label:lab, rating:num(wt.r), slope:num(wt.s), par:num(wt.p)||par });
    });
    const loopObj = {
      name: L.name || ('Loop ' + (li+1)),
      holes, par,
      rating: baseTee.r, slope: baseTee.s,
      parPerHole, indexPerHole, tees,
    };
    if (womenTees.length) loopObj.women = womenTees;
    return loopObj;
  });

  // Course-level summary mirrors the FIRST loop (engine reads loops[] for play)
  const first = loops[0] || {};
  const data = {
    name: w.name || 'Unnamed Course',
    city: w.city || '', country: w.country || '',
    holes: first.holes || 9,
    par: first.par, rating: first.rating, slope: first.slope,
    parPerHole: first.parPerHole, indexPerHole: first.indexPerHole, tees: first.tees,
    loops,
  };
  return data;
}

// REAL save — writes to the shared course DB (same path the engine reads from)
async function acSave() {
  acCollect('acparsi');
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid) { if (typeof showToast==='function') showToast(t ? t('toast_signin_first') : 'Sign in first', 'error'); return; }
  const data = acBuildCourse();
  // Firestore rejects undefined — deep-strip any undefined values
  const stripUndef = (v) => {
    if (Array.isArray(v)) return v.map(stripUndef);
    if (v && typeof v === 'object') {
      const o = {};
      for (const k in v) { if (v[k] !== undefined) o[k] = stripUndef(v[k]); }
      return o;
    }
    return v;
  };
  const cleanData = stripUndef(data);
  if (cleanData.rating == null || cleanData.slope == null) {
    if (typeof showToast==='function') showToast('Please fill in Medal rating and slope.', 'error');
    showScreen('aclayout'); return;
  }
  const saveBtn = document.querySelector('#screen-acconfirm .play-btn span');
  const orig = saveBtn ? saveBtn.textContent : 'SAVE';
  if (saveBtn) saveBtn.textContent = '…';
  try {
    // In edit mode we target the exact document being edited (by _docId), so the
    // right course is updated even if the name was changed. Otherwise fall back to
    // the name-match merge behaviour used by the add-course flow.
    const editDocId = _acWizard && _acWizard._editDocId;
    let existing = null;
    if (editDocId && typeof _sharedCourses !== 'undefined') {
      existing = _sharedCourses.find(c => c._docId === editDocId) || null;
    }
    if (!existing) {
      existing = (typeof _sharedCourses !== 'undefined')
        ? _sharedCourses.find(c => c.name.toLowerCase() === cleanData.name.toLowerCase()) : null;
    }
    if (existing && editDocId) {
      // FULL REPLACE of this course's loops with the edited set — edit mode shows
      // every existing loop pre-filled, so the wizard state IS the intended full course.
      const merged = { ...cleanData };
      await window._fbDb.collection('courses_shared').doc(existing._docId).update({
        ...merged, lastEditedBy: uid, lastEditedAt: new Date().toISOString()
      });
      const idx = _sharedCourses.findIndex(c => c._docId === existing._docId);
      if (idx >= 0) _sharedCourses[idx] = { ..._sharedCourses[idx], ...merged, lastEditedBy: uid };
      if (typeof showToast==='function') showToast('Course "'+cleanData.name+'" updated.', 'success');
      _acWizard = null;
      showScreen('editcourses');
      return;
    }
    if (existing) {
      // MERGE loops: keep the existing course's loops, add/replace by loop name
      const existingLoops = Array.isArray(existing.loops) ? existing.loops.slice() : [];
      const newLoops = Array.isArray(cleanData.loops) ? cleanData.loops : [];
      newLoops.forEach(nl => {
        const i = existingLoops.findIndex(el => (el.name||'').toLowerCase() === (nl.name||'').toLowerCase()
                                              && (el.holes||9) === (nl.holes||9));
        if (i >= 0) existingLoops[i] = nl;          // same name+holes -> update that loop
        else existingLoops.push(nl);                 // otherwise -> add as a new loop
      });
      const merged = { ...cleanData, loops: existingLoops };
      // base rating/slope/par: prefer existing course-level values if present (don't clobber with the new loop's)
      if (existing.rating != null) merged.rating = existing.rating;
      if (existing.slope  != null) merged.slope  = existing.slope;
      if (existing.par    != null) merged.par    = existing.par;
      await window._fbDb.collection('courses_shared').doc(existing._docId).update({
        ...merged, lastEditedBy: uid, lastEditedAt: new Date().toISOString()
      });
      const idx = _sharedCourses.findIndex(c => c._docId === existing._docId);
      if (idx >= 0) _sharedCourses[idx] = { ..._sharedCourses[idx], ...merged, lastEditedBy: uid };
      if (typeof showToast==='function') showToast('Course "'+cleanData.name+'" updated ('+existingLoops.length+' loops).', 'success');
    } else {
      const courseId = 'c_' + Date.now().toString(36);
      const docRef = await window._fbDb.collection('courses_shared').add({
        ...cleanData, courseId, addedBy: uid, lastEditedBy: uid, lastEditedAt: new Date().toISOString()
      });
      if (typeof _sharedCourses !== 'undefined') _sharedCourses.push({ ...cleanData, courseId, _docId: docRef.id, addedBy: uid });
      if (typeof showToast==='function') showToast('Course "'+cleanData.name+'" saved!', 'success');
    }
    _acWizard = null;
    showScreen('home');
  } catch (e) {
    if (saveBtn) saveBtn.textContent = orig;
    if (typeof showToast==='function') showToast('Could not save: ' + e.message, 'error');
    console.error('[Add Course] save failed:', e);
  }
}

// Dispatch step init + prefill from state when a wizard screen is shown
let _acInited = {};
function acInitStep(id, el) {
  const map = {
    accourse: typeof acInit_accourse === 'function' ? acInit_accourse : null,
    acloops:  typeof acInit_acloops  === 'function' ? acInit_acloops  : null,
    aclayout: typeof acInit_aclayout === 'function' ? acInit_aclayout : null,
    acparsi:  typeof acInit_acparsi  === 'function' ? acInit_acparsi  : null,
    acconfirm:typeof acInit_acconfirm=== 'function' ? acInit_acconfirm: null,
  };
  if (!map.hasOwnProperty(id)) return;
  if (!_acInited[id] && map[id]) { try { map[id](el); } catch(e){ console.warn('acInit '+id, e); } _acInited[id] = true; }
  // Prefill the course-details fields from wizard state on every show (so edit
  // mode shows the existing name/country/city, and returning to this step keeps them).
  if (id === 'accourse' && _acWizard) {
    var nEl = document.getElementById('ac_courseName'); if (nEl) nEl.value = _acWizard.name || '';
    var cEl = document.getElementById('ac_countrySelect'); if (cEl && _acWizard.country) { cEl.value = _acWizard.country; cEl.classList.remove('placeholder'); }
    var cityEl = document.getElementById('ac_courseCity'); if (cityEl) cityEl.value = _acWizard.city || '';
  }
  if (id === 'acloops'  && typeof acRenderLoopList === 'function') acRenderLoopList();
  if (id === 'aclayout' && typeof acRenderLoopTabs === 'function') { acRenderLoopTabs('aclayout'); acFillTees(); }
  if (id === 'acparsi'  && typeof acRenderLoopTabs === 'function') { acRenderLoopTabs('acparsi'); acFillParSi(); }
  if (id === 'acconfirm' && typeof acRenderConfirm === 'function') acRenderConfirm(el);
}

// ── AC02: dynamic loop list (add / remove / rename / hole-count) ──
function acRenderLoopList() {
  const host = document.getElementById('ac_loopList');
  if (!host || !_acWizard) return;
  host.innerHTML = '';
  _acWizard.loops.forEach((L, i) => {
    const card = document.createElement('div');
    card.className = 'loop-card';
    card.innerHTML =
      '<div class="loop-card-header" style="display:flex;justify-content:space-between;align-items:center;">' +
        '<span>Loop ' + (i+1) + '</span>' +
        (_acWizard.loops.length > 1 ? '<button type="button" class="ac-loop-del" data-i="'+i+'" style="background:none;border:0;color:#b00;font-size:13px;cursor:pointer;">Remove</button>' : '') +
      '</div>' +
      '<label class="section-label">Loop name</label>' +
      '<input class="text-field" type="text" placeholder="e.g. Loop E" data-i="'+i+'" value="'+(L.name||'')+'">' +
      '<label class="section-label">Number of holes</label>' +
      '<div class="toggle-group">' +
        '<button class="toggle-pill'+(L.holes===9?' active':'')+'" data-i="'+i+'" data-holes="9" type="button">9 holes</button>' +
        '<button class="toggle-pill'+(L.holes===18?' active':'')+'" data-i="'+i+'" data-holes="18" type="button">18 holes</button>' +
      '</div>';
    host.appendChild(card);
  });
  // Add-loop button
  const add = document.createElement('button');
  add.type = 'button'; add.id = 'ac_addLoopBtn';
  add.textContent = '+ Add another loop';
  add.style.cssText = 'margin-top:14px;width:100%;padding:12px;border:1.5px dashed var(--green);border-radius:10px;background:#f4f9f6;color:var(--green);font-weight:600;cursor:pointer;font-family:Inter,sans-serif;';
  host.appendChild(add);

  // wire (delegation on host, attached once)
  if (!host._wired) {
    host.addEventListener('click', (e) => {
      const del = e.target.closest('.ac-loop-del');
      if (del) { _acWizard.loops.splice(parseInt(del.dataset.i),1); if(_acWizard.activeLoop>=_acWizard.loops.length)_acWizard.activeLoop=0; acRenderLoopList(); return; }
      const pill = e.target.closest('.toggle-pill[data-holes]');
      if (pill) { _acWizard.loops[parseInt(pill.dataset.i)].holes = parseInt(pill.dataset.holes); acRenderLoopList(); return; }
      if (e.target.id === 'ac_addLoopBtn') { _acWizard.loops.push(acNewLoop('')); acRenderLoopList(); return; }
    });
    host.addEventListener('input', (e) => {
      const inp = e.target.closest('input[data-i]');
      if (inp) _acWizard.loops[parseInt(inp.dataset.i)].name = inp.value;
    });
    host._wired = true;
  }
}

// ── AC03/AC04: loop-switcher tab strip ──
function acRenderLoopTabs(stepId) {
  const scr = document.getElementById('screen-' + stepId);
  if (!scr || !_acWizard) return;
  let strip = scr.querySelector('.ac-loop-tabs');
  if (!strip) {
    strip = document.createElement('div');
    strip.className = 'ac-loop-tabs';
    strip.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px;';
    const body = scr.querySelector('.body-area');
    const firstLabel = body && body.querySelector('.section-label, .progress-bar');
    if (body) body.insertBefore(strip, firstLabel ? firstLabel.nextSibling : body.firstChild);
  }
  strip.innerHTML = _acWizard.loops.map((L,i) =>
    '<button type="button" class="ac-loop-tab'+(i===_acWizard.activeLoop?' active':'')+'" data-i="'+i+'" data-step="'+stepId+'" '+
    'style="padding:7px 14px;border-radius:18px;border:1.5px solid var(--green);cursor:pointer;font-family:Inter,sans-serif;font-size:13px;font-weight:600;'+
    (i===_acWizard.activeLoop?'background:var(--green);color:#fff;':'background:#fff;color:var(--green);')+'">'+
    (L.name || ('Loop '+(i+1)))+'</button>').join('');
  if (!strip._wired) {
    strip.addEventListener('click', (e) => {
      const tab = e.target.closest('.ac-loop-tab'); if (!tab) return;
      const step = tab.dataset.step;
      acCollect(step);                          // save current loop's data first
      _acWizard.activeLoop = parseInt(tab.dataset.i);
      acRenderLoopTabs(step);
      if (step === 'aclayout') acFillTees(); else acFillParSi();
    });
    strip._wired = true;
  }
}

// Prefill AC03 tee inputs from the active loop
function acFillTees() {
  const L = acActiveLoop(); if (!L) return;
  // loop-name field follows the active loop tab
  const ln = document.getElementById('ac_loopName');
  if (ln) ln.value = ((_acWizard.name ? _acWizard.name + ' ' : '') + (L.name || '')).trim();
  const set = (id,v) => { const e = document.getElementById(id); if (e) e.value = (v==null?'':v); };
  set('ac_cr', L.tees.champion.r); set('ac_cs', L.tees.champion.s); set('ac_cp', L.tees.champion.p);
  set('ac_mr', L.tees.medal.r);    set('ac_ms', L.tees.medal.s);    set('ac_mp', L.tees.medal.p);
  set('ac_sr', (L.tees.senior||{}).r); set('ac_ss', (L.tees.senior||{}).s); set('ac_sp', (L.tees.senior||{}).p);
  set('ac_fr', L.tees.forward.r);  set('ac_fs', L.tees.forward.s);  set('ac_fp', L.tees.forward.p);
  // women's tees (per loop)
  const w = L.women || (L.women = { blue:{r:'',s:'',p:''}, medal:{r:'',s:'',p:''}, forward:{r:'',s:'',p:''} });
  const wBlue = w.blue || w.champion || {r:'',s:'',p:''};  // fall back to legacy 'champion' key
  set('wcr', wBlue.r); set('wcs', wBlue.s); set('wcp', wBlue.p);
  set('wmr', w.medal.r);    set('wms', w.medal.s);    set('wmp', w.medal.p);
  set('wfr', w.forward.r);  set('wfs', w.forward.s);  set('wfp', w.forward.p);
  if (typeof acSyncWomenToggle === 'function') acSyncWomenToggle();
}

// Prefill AC04 par/SI grid from the active loop
function acFillParSi() {
  const L = acActiveLoop(); if (!L) return;
  const scr = document.getElementById('screen-acparsi'); if (!scr) return;
  const holes = L.holes || 9;
  // header label = course + loop name
  const ln = document.getElementById('ac_parsiLoopName') || scr.querySelector('.loop-name-field input') || document.getElementById('ac_loopName2');
  if (ln) ln.value = ((_acWizard.name ? _acWizard.name + ' ' : '') + (L.name || '')).trim();

  function block(start, count, label) {
    let nums='', p3='', p4='', p5='', si='';
    for (let k=0;k<count;k++){
      const idx=start+k;
      nums += '<div class="hole-num">'+(idx+1)+'</div>';
      const pv = (L.par && L.par[idx]!=null) ? L.par[idx] : null;
      const mk = v => '<button class="par-btn'+(pv===v?' active':'')+'" data-hole="'+idx+'" data-par="'+v+'">'+v+'</button>';
      p3+=mk(3); p4+=mk(4); p5+=mk(5);
      const sv = (L.si && L.si[idx]!=null && !isNaN(L.si[idx])) ? L.si[idx] : '';   // BLANK by default
      si += '<div class="si-cell"><span class="si-label">SI</span><div class="si-input" data-hole="'+idx+'" id="ac-si-'+idx+'">'+sv+'</div></div>';
    }
    const cols='grid-template-columns:repeat('+count+',1fr);';
    return (label?'<div class="section-label" style="margin-top:14px;">'+label+'</div>':'')
      +'<div class="section-label">holes</div><div class="hole-grid" style="'+cols+'">'+nums+'</div>'
      +'<div class="section-label">par</div>'
      +'<div class="par-row" style="'+cols+'">'+p3+'</div>'
      +'<div class="par-row" style="'+cols+'">'+p4+'</div>'
      +'<div class="par-row" style="'+cols+'">'+p5+'</div>'
      +'<div class="section-label">stroke index</div><div class="si-row" style="'+cols+'">'+si+'</div>';
  }
  const grid = document.getElementById('ac_parsiGrid');
  if (grid) grid.innerHTML = (holes===18) ? block(0,9,'Front nine')+block(9,9,'Back nine') : block(0,holes,null);
  const note = document.getElementById('ac_siNote');
  if (note) note.innerHTML = 'Each SI is unique on the <span>1\u201318</span> scale.';
  const total=(L.par||[]).reduce((a,b)=>a+(b||0),0);
  const pt=document.getElementById('ac_parTotal'); if(pt) pt.textContent = total||0;
}

// Render AC05 summary from per-loop state
function acRenderConfirm(scr) {
  if (!_acWizard) return;
  const w = _acWizard;
  const rows = scr.querySelectorAll('.confirm-section .summary-row .row-val');
  if (rows[0]) rows[0].textContent = w.name || '—';
  if (rows[1]) rows[1].textContent = w.country || '—';
  if (rows[2]) rows[2].textContent = w.city || '—';
  if (rows[3]) rows[3].textContent = w.loops.length + ' loop' + (w.loops.length>1?'s':'') + ' · ' + w.loops.map(l=>l.name||'?').join(', ');

  const host = document.getElementById('ac_confirmLoops');
  if (!host) return;
  const teeOrder = [['champion','Champion'],['medal','Medal'],['senior','Senior'],['forward','Forward']];
  host.innerHTML = w.loops.map(L => {
    const holes = L.holes || 9;
    const teeRows = teeOrder.filter(([k]) => L.tees[k] && String(L.tees[k].r||'').trim()!=='').map(([k,lab]) => {
      const t = L.tees[k];
      return '<tr><td>'+lab+'</td><td>'+(t.r||'—')+'</td><td>'+(t.s||'—')+'</td><td>'+(t.p||'—')+'</td></tr>';
    }).join('') || '<tr><td colspan="4" style="color:#999;">No tees entered</td></tr>';

    // Women's tees for this loop — only rendered if at least one is entered.
    const wOrder = [['medal','Medal'],['blue','Blue'],['forward','Forward']];
    const wFilled = wOrder.filter(([k]) => L.women && L.women[k] && String(L.women[k].r||'').trim()!=='');
    let womenBlock = '';
    if (wFilled.length) {
      const wRows = wFilled.map(([k,lab]) => {
        const t = L.women[k];
        return '<tr><td>'+lab+'</td><td>'+(t.r||'—')+'</td><td>'+(t.s||'—')+'</td><td>'+(t.p||'—')+'</td></tr>';
      }).join('');
      womenBlock = '<div class="confirm-section">' +
          '<div class="confirm-section-title">Women\u2019s Tees — ' + (L.name||'?') + '</div>' +
          '<table class="tee-table"><thead><tr><th>Tee</th><th>Rating</th><th>Slope</th><th>Par</th></tr></thead><tbody>' + wRows + '</tbody></table>' +
        '</div>';
    }

    let mini = '';
    for (let i=0;i<holes;i++){
      const par = (L.par && L.par[i]!=null) ? L.par[i] : '–';
      mini += '<div class="si-mini-cell"><div class="si-mini-h">H'+(i+1)+'</div><div class="si-mini-v">'+par+'</div></div>';
    }
    for (let i=0;i<holes;i++){
      const si = (L.si && L.si[i]!=null) ? L.si[i] : '–';
      mini += '<div class="si-mini-cell"><div class="si-mini-h">SI</div><div class="si-mini-v">'+si+'</div></div>';
    }
    return '<div class="confirm-section">' +
        '<div class="confirm-section-title">Loop — ' + (L.name||'?') + ' (' + holes + ')</div>' +
        '<table class="tee-table"><thead><tr><th>Tee</th><th>Rating</th><th>Slope</th><th>Par</th></tr></thead><tbody>' + teeRows + '</tbody></table>' +
      '</div>' +
      womenBlock +
      '<div class="confirm-section">' +
        '<div class="confirm-section-title">Par & Stroke Index — ' + (L.name||'?') + '</div>' +
        '<div class="si-mini-grid" style="display:grid;grid-template-columns:repeat(9,1fr);gap:4px;">' + mini + '</div>' +
      '</div>';
  }).join('');
}

function acInit_accourse(ROOT){
  // Country select — remove placeholder style on selection
  const sel = document.getElementById('ac_countrySelect');
  if (sel) sel.addEventListener('change', () => { sel.classList.remove('placeholder'); });
}

function acInit_acloops(ROOT){
  // AC02 is now driven by acRenderLoopList() (dynamic 1..N loops).
}
function acInit_aclayout(ROOT){

  // Clamp inputs to valid range on blur + show inline error
  const rules = {
    cr: {min:27.5, max:80.0, label:'Rating'},
    mr: {min:27.5, max:80.0, label:'Rating'},
    fr: {min:27.5, max:80.0, label:'Rating'},
    cs: {min:55,   max:155,  label:'Slope'},
    ms: {min:55,   max:155,  label:'Slope'},
    fs: {min:55,   max:155,  label:'Slope'},
    cp: {min:27,   max:36,   label:'Par'},
    mp: {min:27,   max:36,   label:'Par'},
    fp: {min:27,   max:36,   label:'Par'},
  };
  Object.entries(rules).forEach(([id, rule]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur', () => {
      const val = parseFloat(el.value);
      if (isNaN(val)) return;
      if (val < rule.min) { el.value = rule.min; el.style.borderColor = 'var(--gold)'; }
      else if (val > rule.max) { el.value = rule.max; el.style.borderColor = 'var(--gold)'; }
      else { el.style.borderColor = 'var(--green)'; }
    });
    el.addEventListener('focus', () => { el.style.borderColor = 'var(--gold)'; });
  });

  // Women's toggle — wired once here, but its ON/OFF state is driven by
  // acSyncWomenToggle() on every screen show (see acFillTees), so it correctly
  // reflects whether the current loop already has women's data.
  const wBtn  = document.getElementById('womenToggleBtn');
  if (wBtn && !wBtn._wired) {
    wBtn._wired = true;
    wBtn.addEventListener('click', () => {
      const on = !(wBtn.dataset.on === '1');
      acSetWomenToggle(on);
    });
  }


}

// Set the women's-tees toggle ON/OFF and show/hide its section.
function acSetWomenToggle(on) {
  const wBtn  = document.getElementById('womenToggleBtn');
  const wKnob = document.getElementById('womenToggleKnob');
  const wSec  = document.getElementById('womenSection');
  if (wBtn)  { wBtn.dataset.on = on ? '1' : '0'; wBtn.style.background = on ? 'var(--green)' : '#ddd'; }
  if (wKnob) wKnob.style.transform = on ? 'translateX(18px)' : 'translateX(0)';
  if (wSec)  wSec.style.display = on ? 'block' : 'none';
}

// Decide whether the toggle should start ON: true if the active loop already
// has any women's rating entered (so editing an existing course reveals it).
function acSyncWomenToggle() {
  const L = (typeof acActiveLoop === 'function') ? acActiveLoop() : null;
  const w = L && L.women;
  const hasWomen = w && ['blue','champion','medal','forward'].some(k => w[k] && String(w[k].r||'').trim() !== '');
  acSetWomenToggle(!!hasWomen);
}

function acInit_acparsi(ROOT){
  const siMax = () => 18;  // SI is always on the 1–18 scale, even for 9-hole loops
  let activeHole = null, buffer = '';
  const numpad  = document.getElementById('ac_numpad');
  const display = document.getElementById('ac_numpadDisplay');
  const context = document.getElementById('ac_numpadContext');
  const grid = document.getElementById('ac_parsiGrid');

  function holeCount(){ return ROOT.querySelectorAll('.si-input').length || 9; }

  // Delegated taps on the (regenerated) grid
  if (grid && !grid._wired) {
    grid.addEventListener('click', (e) => {
      const si = e.target.closest('.si-input');
      if (si) {
        e.stopPropagation();
        activeHole = parseInt(si.dataset.hole);
        buffer = ''; display.textContent = '\u2013';
        context.textContent = 'Hole ' + (activeHole + 1) + ' \u00b7 SI (1\u201318, unique)';
        numpad.classList.add('open');
        ROOT.querySelectorAll('.si-input').forEach(el => el.classList.remove('active'));
        si.classList.add('active');
        return;
      }
      const pb = e.target.closest('.par-btn');
      if (pb) {
        const hole = pb.dataset.hole;
        grid.querySelectorAll('.par-btn[data-hole="'+hole+'"]').forEach(b => b.classList.remove('active'));
        pb.classList.add('active');
        // live-store par + total
        const L = acActiveLoop();
        L.par[parseInt(hole)] = parseInt(pb.dataset.par);
        let t=0; grid.querySelectorAll('.par-btn.active').forEach(b=>t+=parseInt(b.dataset.par));
        const pt=document.getElementById('ac_parTotal'); if(pt) pt.textContent=t;
      }
    });
    grid._wired = true;
  }

  ROOT.querySelectorAll('.num-btn[data-val]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeHole === null) return;
      const next = (buffer + btn.dataset.val).slice(-2);
      if (parseInt(next) > siMax()) return;
      buffer = next; display.textContent = buffer || '\u2013';
    });
  });

  document.getElementById('ac_delBtn').addEventListener('click', (e) => {
    e.stopPropagation(); buffer = buffer.slice(0, -1); display.textContent = buffer || '\u2013';
  });

  document.getElementById('ac_numpadOk').addEventListener('click', (e) => {
    e.stopPropagation();
    if (activeHole !== null && buffer !== '') {
      const val = parseInt(buffer);
      const N = holeCount();
      let isDupe = false;
      for (let i = 0; i < N; i++) {
        if (i === activeHole) continue;
        const cell = document.getElementById('ac-si-' + i);
        if (cell && cell.textContent.trim() === String(val)) { isDupe = true; break; }
      }
      const el = document.getElementById('ac-si-' + activeHole);
      if (!isDupe && val >= 1 && val <= siMax()) {
        el.textContent = val; el.style.borderColor = 'var(--green)';
        acActiveLoop().si[activeHole] = val;   // live-store
      } else {
        el.style.borderColor = '#c85a4a';
        setTimeout(() => el.style.borderColor = 'var(--green)', 1500);
      }
    }
    numpad.classList.remove('open');
    ROOT.querySelectorAll('.si-input').forEach(el => el.classList.remove('active'));
    activeHole = null; buffer = '';
  });

  numpad.addEventListener('click', (e) => { e.stopPropagation(); });
  document.addEventListener('click', (e) => {
    if (numpad.classList.contains('open') && !numpad.contains(e.target) && !e.target.classList.contains('si-input')) {
      numpad.classList.remove('open');
      ROOT.querySelectorAll('.si-input').forEach(el => el.classList.remove('active'));
      activeHole = null; buffer = '';
    }
  });
}

function acInit_acconfirm(ROOT){

  document.getElementById('saveBtn').addEventListener('click', () => {
    // In real app: write full course object to Firestore courses collection
    document.getElementById('successOverlay').classList.add('show');
  });
  document.getElementById('doneBtn').addEventListener('click', () => {
    document.getElementById('successOverlay').classList.remove('show');
  });

}


// ═══════════════════════════════════════════
// NEW-UI: TEAM ROUND FLOW (Screens 04–13)
// Collects via new screens; WHS calc reuses
// the engine's calcTeam/getCH (single source).
// ═══════════════════════════════════════════
let _trFlow = null;
function trStart() {
  _trFlow = {
    course: null,      // selected course object from _sharedCourses (or manual)
    holes: 9,
    loopIdx: null,
    parByHole: [], siByHole: [],
    team: { name:'', size:2, players:[] },
    teeKey: 'medal',
    format: '35_15',
  };
  _trbGuests = [];
  showScreen('trcourse');
}

// Map engine _sharedCourses -> the shape Screen 04's UI expects
function trCourseList() {
  var list = (typeof _sharedCourses !== 'undefined' && _sharedCourses) ? _sharedCourses
           : (window._sharedCourses || []);
  return list.map(c => ({
    _ref: c,
    name: c.name,
    city: c.city || '',
    holes: c.holes || 9,
    loops9: (c.loops && c.loops.length)
      ? c.loops.map(l => ({
          name: l.name || c.name,
          par: (l.par != null) ? l.par
             : (l.parPerHole && l.parPerHole.length) ? l.parPerHole.reduce((a,b)=>a+b,0)
             : c.par,
          holes: l.holes || 9
        }))
      : [{ name: c.name, par: c.par, holes: c.holes || 9 }],
  }));
}

// Re-run a TR screen's init each time it's shown (course list may have changed)
let _trInited = {};
function trInitStep(id, el) {
  const inits = {
    trcourse: typeof trInit_trcourse === 'function' ? trInit_trcourse : null,
    trloop:   typeof trInit_trloop   === 'function' ? trInit_trloop   : null,
    trparsi:  typeof trInit_trparsi  === 'function' ? trInit_trparsi  : null,
  };
  // TR-B screens (trteam..trresult) render every visit, independent of the inits guard
  if (typeof trbInitStep === 'function') trbInitStep(id, el);
  if (id === 'trscore' && typeof trcInit === 'function') trcInit(el);
  if (id === 'trfull'  && typeof trcRenderFull === 'function') trcRenderFull(el);
  if (!inits.hasOwnProperty(id) || !inits[id]) return;
  // trcourse must refresh its course list each visit, but only attach listeners once
  if (_trInited[id]) {
    if (id === 'trcourse' && typeof _trRefreshCourses === 'function') _trRefreshCourses();
  } else {
    try { inits[id](el); _trInited[id] = true; } catch(e){ console.warn('trInit '+id, e); }
  }
  // populate data-driven screens from the chosen course every visit
  if (id === 'trloop'  && typeof trRenderLoop  === 'function') trRenderLoop(el);
  if (id === 'trparsi' && typeof trRenderParSi === 'function') trRenderParSi(el);
}

function trInit_trcourse(ROOT){

  // ── Course database ─────────────────────────────────────
  const COURSES = trCourseList();

  // ── State ───────────────────────────────────────────────
  const state = {
    course: null,      // course object
    holes: 9,          // 9 or 18
    loopSel: [],       // ordered selected loop indexes
    twice: false,      // play single loop twice for 18
  };

  // ── DOM refs ────────────────────────────────────────────
  const courseInput   = document.getElementById('tr_courseName');
  const courseField   = document.getElementById('tr_courseFieldWrap');
  const courseDropdown= document.getElementById('tr_courseDropdown');
  const loopStack     = document.getElementById('tr_loopStack');
  // Loop slots are generated dynamically to match the course's loop count.
  const LOOP_CHECK_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12 10 18 20 6"></polyline></svg>';
  function ensureLoopSlots(n) {
    const have = loopStack.querySelectorAll('.field').length;
    if (have === n) return;
    loopStack.innerHTML = '';
    for (let i=0;i<Math.max(n,1);i++){
      const lab = document.createElement('label');
      lab.className = 'field';
      lab.setAttribute('data-loop-idx', i);
      lab.innerHTML = '<input type="text" autocomplete="off" readonly />'+
        '<span class="loop-meta"></span>'+
        '<span class="loop-check" aria-hidden="true">'+LOOP_CHECK_SVG+'</span>';
      loopStack.appendChild(lab);
    }
  }
  const loopFieldsLive = () => loopStack.querySelectorAll('.field');
  const loopInputsLive = () => loopStack.querySelectorAll('input');
  const loopMetasLive  = () => loopStack.querySelectorAll('.loop-meta');
  const helperText    = document.getElementById('tr_helperText');
  const nextBtn       = document.getElementById('tr_nextBtn');
  const pills         = ROOT.querySelectorAll('.pill-group .pill');

  // ── Build course dropdown ──────────────────────────────
  function buildDropdown(filter) {
    courseDropdown.innerHTML = '';
    const q = (filter || '').toLowerCase().trim();
    const list = COURSES.filter(c => !q || c.name.toLowerCase().includes(q));
    if (list.length === 0) {
      const e = document.createElement('div');
      e.className = 'empty';
      e.textContent = 'No matching courses';
      courseDropdown.appendChild(e);
      return;
    }
    list.forEach((c) => {
      const opt = document.createElement('div');
      opt.className = 'option';
      opt.setAttribute('role', 'option');
      opt.innerHTML = `
        <span class="pin"></span>
        <span style="flex:1;">
          <span style="display:block; font-weight:500; color:#111;">${c.name}</span>
          <span style="display:block; font-size:11px; color:#777; margin-top:2px;">${c.city}</span>
        </span>
      `;
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        selectCourse(c);
        closeDropdown();
      });
      courseDropdown.appendChild(opt);
    });
  }

  function openDropdown() {
    buildDropdown(courseInput.value);
    courseDropdown.classList.add('open');
    courseField.classList.add('open');
  }
  function closeDropdown() {
    courseDropdown.classList.remove('open');
    courseField.classList.remove('open');
  }

  // ── Select a course ─────────────────────────────────────
  function selectCourse(course) {
    state.course = course;
    state.loopSel = [];
    state.twice = false;
    courseInput.value = course.name;
    fillLoops();
    updateNext();
  }
  function loopCount() { return (state.course && state.course.loops9) ? state.course.loops9.length : 0; }
  function loopHoles(i) { const l = state.course && state.course.loops9 && state.course.loops9[i]; return l ? (l.holes || 9) : 9; }
  // does this course have ANY physical 18-hole loop?
  function has18Loop() { for (let i=0;i<loopCount();i++) if (loopHoles(i)>=18) return true; return false; }
  // is loop i selectable given the current hole choice?
  function loopSelectable(i) {
    if (state.holes === 9) return loopHoles(i) === 9;  // 9 holes: only 9-hole loops
    // 18 chosen:
    if (has18Loop()) return loopHoles(i) >= 18;        // only 18-hole loops
    return loopHoles(i) < 18;                          // 9-only course: the 9-hole loop (play twice)
  }
  // a course that is a single loop already covering 18 holes
  function isSingle18() { return state.holes === 18 && loopCount() >= 1 && loopHoles(state.loopSel[0]!=null?state.loopSel[0]:0) >= 18; }
  // play-twice only when 18 requested, course has NO 18-hole loop, and a single 9-hole loop exists
  function twiceEligible() { return state.holes === 18 && !has18Loop() && loopCount() >= 1; }
  function need() {
    if (state.holes === 9) return 1;
    if (has18Loop()) return 1;        // pick one 18-hole loop
    return 1;                          // 9-only course: pick the one 9 (play twice)
  }

  // ── Fill / clear loop fields ────────────────────────────
  function fillLoops() {
    if (!state.course) {
      ensureLoopSlots(1);
      const f = loopFieldsLive()[0];
      if (f) {
        f.classList.remove('fillable', 'selected');
        const inp = f.querySelector('input'); if (inp){ inp.value=''; inp.placeholder='Select a course to see its loops'; }
        const meta = f.querySelector('.loop-meta'); if (meta) meta.textContent='';
        f.style.display = '';
      }
      helperText.textContent = 'Course details appear here once you pick a course above.';
      return;
    }
    const loops = state.course.loops9 || [];
    ensureLoopSlots(loops.length);
    const fields = loopFieldsLive();
    const twiceWrap = document.getElementById('tr_twiceWrap');
    if (twiceWrap) twiceWrap.style.display = twiceEligible() ? '' : 'none';
    fields.forEach((f, i) => {
      const loop = loops[i];
      const inp = f.querySelector('input');
      const meta = f.querySelector('.loop-meta');
      if (!loop || !loopSelectable(i)) {
        f.style.display = 'none';
        f.classList.remove('fillable','selected');
        if (inp) inp.value = '';
        if (meta) meta.textContent = '';
        return;
      }
      f.style.display = '';
      f.classList.add('fillable');
      const ord = state.loopSel.indexOf(i);
      f.classList.toggle('selected', ord !== -1);
      if (inp) inp.value = `${loop.name} (${loopHoles(i)})`;
      if (meta) meta.textContent = `Par ${loop.par}`;
    });
    if (state.holes === 18) {
      if (has18Loop()) {
        helperText.textContent = state.loopSel.length ? `Selected: ${loops[state.loopSel[0]].name} (18 holes)` : 'Tap an 18-hole loop to select it.';
      } else if (twiceEligible()) {
        helperText.textContent = state.twice ? 'Playing this 9-hole loop twice for 18.' : 'This course has only 9 holes — tick “play twice” to make 18.';
      } else {
        helperText.textContent = 'No 18-hole loop available for this course.';
      }
    } else {
      helperText.textContent = state.loopSel.length ? `Selected: ${loops[state.loopSel[0]].name}` : 'Tap a loop to select which one you will play.';
    }
  }

  // ── Update NEXT enabled state ───────────────────────────
  function updateNext() {
    let ready = false;
    if (state.course) {
      if (state.holes === 9) ready = state.loopSel.length === 1;
      else if (has18Loop()) ready = state.loopSel.length === 1;       // pick one 18-hole loop
      else if (twiceEligible()) ready = state.twice;                   // 9-only course, play twice
    }
    nextBtn.classList.toggle('active', ready);
    nextBtn.setAttribute('aria-disabled', ready ? 'false' : 'true');
  }

  // ── Wire up: course field ──────────────────────────────
  courseField.addEventListener('click', (e) => {
    if (e.target.closest('.course-dropdown')) return;
    if (courseDropdown.classList.contains('open')) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });
  document.addEventListener('click', (e) => {
    if (!courseField.contains(e.target)) closeDropdown();
  });

  // ── Wire up: loop selection (delegated — slots are dynamic) ──
  loopStack.addEventListener('click', (e) => {
    const f = e.target.closest('.field'); if (!f) return;
    e.preventDefault();
    if (!state.course) { openDropdown(); return; }
    const i = parseInt(f.getAttribute('data-loop-idx'), 10);
    if (isNaN(i) || !loopSelectable(i)) return;       // ignore hidden/non-selectable
    const pos = state.loopSel.indexOf(i);
    state.loopSel = (pos !== -1) ? [] : [i];          // single selection always
    state.twice = false;
    var tt = document.getElementById('tr_twiceToggle'); if (tt) tt.checked = false;
    fillLoops();
    updateNext();
  });
  // Play same loop twice (1-loop course choosing 18)
  document.getElementById('tr_twiceToggle')?.addEventListener('change', (e) => {
    state.twice = e.target.checked;
    state.loopSel = state.twice ? [0] : [];
    fillLoops(); updateNext();
  });

  // ── Wire up: 9 / 18 pill toggle ────────────────────────
  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pills.forEach((p) => {
        p.classList.remove('active');
        p.setAttribute('aria-checked', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-checked', 'true');
      state.holes = parseInt(pill.dataset.holes, 10);
      state.loopSel = []; state.twice = false;
      var tt2 = document.getElementById('tr_twiceToggle'); if (tt2) tt2.checked = false;
      fillLoops();
      updateNext();
    });
  });

  // ── Refresh / reset button ─────────────────────────────
  document.getElementById('tr_refreshBtn')?.addEventListener('click', (e) => {
    const btn = e.currentTarget;
    const svg = btn.querySelector('svg');

    // Spin icon
    svg.style.transition = 'transform 0.6s ease';
    svg.style.transform = 'rotate(-360deg)';
    setTimeout(() => {
      svg.style.transition = 'none';
      svg.style.transform = 'rotate(0deg)';
    }, 650);

    // Reset state
    state.course = null;
    state.loopSel = [];
    state.twice = false;
    state.holes = 9;

    // Reset UI: course input
    courseInput.value = '';
    closeDropdown();

    // Reset holes pill to "9"
    pills.forEach((p) => {
      const is9 = p.dataset.holes === '9';
      p.classList.toggle('active', is9);
      p.setAttribute('aria-checked', is9 ? 'true' : 'false');
    });

    // Reset loops + helper + NEXT
    fillLoops();
    updateNext();

    // Brief toast on the sub-header
    showToast('Reset');
  });

  // ── Tiny toast ─────────────────────────────────────────
  function showToast(msg) {
    let t = document.getElementById('miniToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'miniToast';
      t.style.cssText = [
        'position:absolute',
        'top:115px',
        'left:50%',
        'transform:translateX(-50%) translateY(-6px)',
        'background:rgba(17,17,17,0.88)',
        'color:#fff',
        'font-family:Inter,sans-serif',
        'font-size:12px',
        'font-weight:500',
        'padding:8px 14px',
        'border-radius:18px',
        'opacity:0',
        'transition:opacity 0.2s ease, transform 0.2s ease',
        'z-index:50',
        'pointer-events:none',
        'box-shadow:0 4px 12px rgba(0,0,0,0.25)',
      ].join(';');
      ROOT.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(() => {
      t.style.opacity = '1';
      t.style.transform = 'translateX(-50%) translateY(0)';
    });
    clearTimeout(t._hide);
    t._hide = setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(-50%) translateY(-6px)';
    }, 1100);
  }

  // ── BACK button — flash ────────────────────────────────
  document.getElementById('tr_backBtn')?.addEventListener('click', (e) => {
    const el = e.currentTarget;
    el.style.background = 'var(--green-hover)';
    setTimeout(() => { el.style.background = ''; }, 150);
  });

  // ── NEXT button click ──────────────────────────────────
  nextBtn.addEventListener('click', () => {
    if (!nextBtn.classList.contains('active')) {
      // Tell the user what to do next
      let msg;
      if (!state.course) {
        msg = 'Choose a course first';
      } else if (state.holes === 18 && !has18Loop()) {
        msg = 'Tick "play this loop twice" to make 18 holes';
      } else if (state.holes === 18) {
        msg = 'Select an 18-hole loop';
      } else {
        msg = 'Choose a loop to continue';
      }
      showToast(msg);
      // Subtle nudge — shake the button
      nextBtn.style.animation = 'none';
      nextBtn.offsetWidth; // reflow
      nextBtn.style.animation = 'nextShake 0.4s ease';
      setTimeout(() => { nextBtn.style.animation = ''; }, 420);
      return;
    }
    // Active state — brief brightness flash
    nextBtn.style.filter = 'brightness(1.15)';
    setTimeout(() => { nextBtn.style.filter = ''; }, 160);
    const baseCourse = state.course && state.course._ref ? state.course._ref : state.course;
    _trFlow.baseCourse = baseCourse;
    _trFlow.holes = state.holes;
    _trFlow.loopSel = state.loopSel.slice();
    _trFlow.twice = state.twice;
    _trFlow.course = trComposeCourse(baseCourse, state.holes, state.loopSel, state.twice);
    _trFlow.loopIdx = state.loopSel[0] != null ? state.loopSel[0] : 0;
    // Loop Layout + Par/SI are no longer separate steps — they're viewable in the
    // Summary. Course par/SI is already composed above, so skip straight to team.
    // (trComposeCourse also sets _trFlow.parByHole/siByHole indirectly; ensure the
    // flow-level copies used by the TM live-match builder are populated here too.)
    if (typeof trSyncParSiFromCourse === 'function') trSyncParSiFromCourse();
    showScreen((typeof soloOn === 'function' && soloOn()) ? 'solosetup'
             : ((typeof m1On === 'function' && m1On()) ? 'm1setup' : 'trteam'));   // Solo and 1vs1 skip team/tee/format
  });

  // ── Add-new-course button — flash ──────────────────────
  document.getElementById('tr_addCourseBtn')?.addEventListener('click', (e) => { acStart(); return;
    const el = e.currentTarget;
    el.style.opacity = '0.55';
    setTimeout(() => { el.style.opacity = ''; }, 160);
  });

  // ── Init ───────────────────────────────────────────────
  fillLoops();
  updateNext();

}

// Compose the course actually played, from chosen loops (WHS-correct 18-hole combine)
function trComposeCourse(base, holes, loopSel, twice) {
  if (!base) return base;
  const loops = base.loops || [];
  // Find this loop's per-9 tee data + par/SI. The Add Course wizard stores
  // course-level tees/parPerHole/indexPerHole; per-loop data falls back to those.
  function nineData(loopIdx) {
    const l = loops[loopIdx] || {};
    return {
      name: l.name || base.name,
      par: (l.par != null) ? l.par
         : (l.parPerHole && l.parPerHole.length) ? l.parPerHole.reduce((a,b)=>a+b,0)
         : (base.par || 0),
      parByHole: (l.parPerHole && l.parPerHole.length) ? l.parPerHole.slice() : (base.parPerHole || []).slice(0,9),
      siByHole:  (l.indexPerHole && l.indexPerHole.length) ? l.indexPerHole.slice() : (base.indexPerHole || []).slice(0,9),
      tees: (l.tees && l.tees.length) ? l.tees : (base.tees || []),
      women: (l.women && l.women.length) ? l.women : (base.women || []),
    };
  }
  const teeVal = (tees, key, field) => {
    const t = (tees||[]).find(x => (x.label||'').toLowerCase().includes(key)); return t ? t[field] : null;
  };

  if (holes === 9 || (holes === 18 && false)) {
    const d = nineData(loopSel[0] != null ? loopSel[0] : 0);
    return { ...base, name: base.name, holes: 9, par: d.par, parPerHole: d.parByHole, indexPerHole: d.siByHole, tees: d.tees, women: d.women, _playedLoopName: d.name };
  }

  // ── 18 holes ──
  // Case 0: the SELECTED loop is itself a physical 18-hole loop — use its own data as-is.
  const selIdx = (loopSel && loopSel[0] != null) ? loopSel[0] : 0;
  const firstLoop = loops[selIdx] || loops[0] || {};
  const firstHoles = firstLoop.holes || base.holes || 9;
  if (firstHoles >= 18 && !twice) {
    const lTees = (firstLoop.tees && firstLoop.tees.length) ? firstLoop.tees : (base.tees || []);
    const med = lTees.find(t => (t.label||'').toLowerCase().includes('medal')) || lTees[0] || {};
    const lPar = (firstLoop.par != null) ? firstLoop.par
               : (firstLoop.parPerHole && firstLoop.parPerHole.length) ? firstLoop.parPerHole.reduce((a,b)=>a+(b||0),0)
               : (base.par != null ? base.par : med.par);
    return {
      ...base,
      holes: 18,
      par: lPar,
      rating: med.rating != null ? med.rating : base.rating,
      slope: med.slope != null ? med.slope : base.slope,
      parPerHole: ((firstLoop.parPerHole && firstLoop.parPerHole.length) ? firstLoop.parPerHole : (base.parPerHole||[])).slice(0, 18),
      indexPerHole: ((firstLoop.indexPerHole && firstLoop.indexPerHole.length) ? firstLoop.indexPerHole : (base.indexPerHole||[])).slice(0, 18),
      tees: lTees,
      women: (firstLoop.women && firstLoop.women.length) ? firstLoop.women : (base.women || []),
      _playedLoopName: firstLoop.name || base.name,
    };
  }
  // Otherwise: same 9 twice, or two different 9-hole loops.
  const sameLoopTwice = (twice || loops.length <= 1);
  let front, back;
  if (sameLoopTwice) { front = nineData(0); back = nineData(0); }
  else { front = nineData(loopSel[0]); back = nineData(loopSel[1]); }

  const keys = ['champ','medal','senior','forward'];
  const TLABEL = { champ:'Champion', medal:'Medal', senior:'Senior', forward:'Forward' };
  const tees18 = [];
  const women18 = [];
  let si18, par18, topRating, topSlope;

  if (sameLoopTwice) {
    // SAME physical 9 played twice: rating & slope UNCHANGED (9-hole values),
    // par doubles, back nine SI = front SI + 1 (Amsteldijk convention).
    keys.forEach(k => {
      const r = teeVal(front.tees, k, 'rating');
      if (r == null) return;
      tees18.push({
        label: TLABEL[k] || k,
        rating: Math.round((Number(r)||0) * 10) / 10,
        slope:  Number(teeVal(front.tees, k, 'slope')) || 0,
        par:    (front.par||0) + (back.par||0),
      });
    });
    keys.forEach(k => {
      const wr = teeVal(front.women, k, 'rating');
      if (wr == null) return;
      women18.push({
        label: TLABEL[k] || k,
        rating: Math.round((Number(wr)||0) * 10) / 10,
        slope:  Number(teeVal(front.women, k, 'slope')) || 0,
        par:    (front.par||0) + (back.par||0),
      });
    });
    si18 = front.siByHole.concat(front.siByHole.map(s => s + 1));
    par18 = front.parByHole.concat(front.parByHole);
    topRating = Math.round((Number(teeVal(front.tees,'medal','rating')) || base.rating || 0) * 10) / 10;
    topSlope  = Number(teeVal(front.tees,'medal','slope')) || base.slope || 0;
  } else {
    // TWO DIFFERENT loops (WHS): rating SUMS, slope AVERAGES (round half-up), par sums, SI interleave.
    keys.forEach(k => {
      const fr = teeVal(front.tees, k, 'rating'), br = teeVal(back.tees, k, 'rating');
      if (fr == null && br == null) return;
      const sf = Number(teeVal(front.tees,k,'slope'))||0, sb = Number(teeVal(back.tees,k,'slope'))||0;
      tees18.push({
        label: TLABEL[k] || k,
        rating: Math.round(((Number(fr)||0) + (Number(br)||0)) * 10) / 10,
        slope:  (sf && sb) ? Math.round((sf + sb) / 2) : (sf || sb),
        par:    (front.par||0) + (back.par||0),
      });
    });
    keys.forEach(k => {
      const fwr = teeVal(front.women, k, 'rating'), bwr = teeVal(back.women, k, 'rating');
      if (fwr == null && bwr == null) return;
      const wsf = Number(teeVal(front.women,k,'slope'))||0, wsb = Number(teeVal(back.women,k,'slope'))||0;
      women18.push({
        label: TLABEL[k] || k,
        rating: Math.round(((Number(fwr)||0) + (Number(bwr)||0)) * 10) / 10,
        slope:  (wsf && wsb) ? Math.round((wsf + wsb) / 2) : (wsf || wsb),
        par:    (front.par||0) + (back.par||0),
      });
    });
    si18 = front.siByHole.map(s => s*2 - 1).concat(back.siByHole.map(s => s*2));
    par18 = front.parByHole.concat(back.parByHole);
    topRating = Math.round(((Number(teeVal(front.tees,'medal','rating'))||base.rating||0) + (Number(teeVal(back.tees,'medal','rating'))||0)) * 10) / 10;
    {
      const sf = Number(teeVal(front.tees,'medal','slope'))||base.slope||0;
      const sb = Number(teeVal(back.tees,'medal','slope'))||0;
      topSlope = (sf && sb) ? Math.round((sf + sb) / 2) : (sf || sb);
    }
  }

  return {
    ...base,
    name: base.name,
    holes: 18,
    par: (front.par||0) + (back.par||0),
    rating: topRating,
    slope: topSlope,
    parPerHole: par18,
    indexPerHole: si18,
    tees: tees18.length ? tees18 : base.tees,
    women: women18.length ? women18 : (base.women || []),
    _playedLoopName: sameLoopTwice ? front.name + ' (\u00d72)' : front.name + ' + ' + back.name,
  };
}

// ── TR step navigation (collect + advance) ──
const TR_ORDER = ['trcourse','trteam','trtee','trformat','trsummary','trresult','trscore','trfullscore'];
function trNext(fromId) {
  if (fromId === 'trparsi') trCollectParSi();
  const i = TR_ORDER.indexOf(fromId);
  // Only navigate to screens that exist yet
  const next = TR_ORDER[i+1];
  if (next && document.getElementById('screen-'+next)) showScreen(next);
  else console.log('[Team Round] next step not built yet:', next);
}

// ── Screen 05: populate tee ratings + loop name from chosen course ──
function trRenderLoop(scr) {
  if (!_trFlow || !_trFlow.course) return;
  const c = _trFlow.course;
  const nameEl = document.getElementById('tr_loopNameInput');
  if (nameEl) {
    // For composed rounds use the played-loop name (e.g. "Polderlus + Parklus"); else the loop/course name
    const loop = (c.loops && c.loops[_trFlow.loopIdx]) ? c.loops[_trFlow.loopIdx] : null;
    const label = c._playedLoopName || (loop ? loop.name : c.name);
    nameEl.value = label + ' (' + (c.holes || (loop ? loop.holes : 9)) + ')';
  }

  const tees = c.tees || [];
  const find = key => tees.find(t => (t.label||'').toLowerCase().includes(key));
  const champ = find('champ'), medal = find('medal') || find('standard') || tees[0], sen = find('senior'), fwd = find('forward') || find('fwd');
  const set = (id,v) => { const e = document.getElementById(id); if (e) e.textContent = (v==null||v==='') ? '—' : v; };
  const block = (prefix, t) => { set('tr_'+prefix+'-rating', t&&t.rating); set('tr_'+prefix+'-slope', t&&t.slope); set('tr_'+prefix+'-par', t&&t.par); };
  block('champ', champ); block('medal', medal); block('senior', sen); block('fwd', fwd);
  // hide tee blocks with no data
  const hideIf = (blkId, t) => { const e = document.getElementById(blkId); if (e) e.style.display = t ? '' : 'none'; };
  hideIf('tr_teeChampion', champ); hideIf('tr_teeMedal', medal); hideIf('tr_teeSenior', sen); hideIf('tr_teeForward', fwd);

  // Women's tees — same layout, only shown if this course actually has women's data,
  // so a course with no women's tees entered doesn't show an empty/confusing section.
  const womenTees = c.women || [];
  function find2(arr, key) { return (arr||[]).find(t => (t.label||'').toLowerCase().includes(key)); }
  const wChamp = find2(womenTees,'champ'), wMedal = find2(womenTees,'medal') || womenTees[0], wFwd = find2(womenTees,'forward') || find2(womenTees,'fwd');
  block('wchamp', wChamp); block('wmedal', wMedal); block('wfwd', wFwd);
  hideIf('tr_teeWomenChampion', wChamp); hideIf('tr_teeWomenMedal', wMedal); hideIf('tr_teeWomenForward', wFwd);
  const wSection = document.getElementById('tr_womenTeesSection');
  if (wSection) wSection.style.display = womenTees.length ? '' : 'none';

  // View mode (opened from summary): BACK returns to the summary, NEXT is hidden.
  applyViewMode('screen-trloop', 'tr_loopNextBtn');
}

// Configure a viewed screen: reroute its BACK to viewBack() and hide its NEXT
// when opened as a read-only view from the summary; restore normal otherwise.
function applyViewMode(screenId, nextBtnId) {
  const scr = document.getElementById(screenId); if (!scr) return;
  const back = scr.querySelector('.back-pill');
  const next = nextBtnId ? document.getElementById(nextBtnId) : scr.querySelector('.play-btn');
  if (_viewMode) {
    if (back) back.onclick = function(){ viewBack(); };
    if (next) next.style.display = 'none';
  } else {
    if (next) next.style.display = '';
    // (normal BACK handlers are set by the screens' own markup/wiring)
  }
}

// ── Screen 06: pre-fill par buttons + SI grid from course ──
function trRenderParSi(scr) {
  if (!_trFlow || !_trFlow.course) return;
  const c = _trFlow.course;
  const loop = (c.loops && c.loops[_trFlow.loopIdx]) ? c.loops[_trFlow.loopIdx] : null;
  const ln = document.getElementById('tr_parsiLoopName');
  if (ln) {
    const label = c._playedLoopName || (loop ? loop.name : c.name);
    ln.value = label + ' (' + (c.holes || (loop ? loop.holes : 9)) + ')';
  }

  // hole count: prefer the chosen holes (Screen 04), else course/loop
  const holes = _trFlow.holes || (loop ? loop.holes : c.holes) || 9;
  const par = (c.parPerHole && c.parPerHole.length) ? c.parPerHole : [];
  const si  = (c.indexPerHole && c.indexPerHole.length) ? c.indexPerHole : [];

  // Build one 9-(or fewer)hole block: hole row + 3 par rows + SI row
  function block(startIdx, count, label) {
    let cells = '', p3 = '', p4 = '', p5 = '', siCells = '';
    for (let k = 0; k < count; k++) {
      const i = startIdx + k;
      cells += '<div class="hole-num">' + (i + 1) + '</div>';
      const pv = par[i];
      const mk = (v) => '<button class="par-btn' + (pv === v ? ' active' : '') + '" data-hole="' + i + '" data-par="' + v + '">' + v + '</button>';
      p3 += mk(3); p4 += mk(4); p5 += mk(5);
      const sv = (si[i] != null) ? si[i] : (i + 1);
      siCells += '<div class="si-cell"><span class="si-label">SI</span><div class="si-input" data-hole="' + i + '" id="tr-si-' + i + '">' + sv + '</div></div>';
    }
    const cols = 'grid-template-columns:repeat(' + count + ',1fr);';
    return (label ? '<div class="section-label" style="margin-top:14px;">' + label + '</div>' : '')
      + '<div class="section-label">holes</div>'
      + '<div class="hole-grid" style="' + cols + '">' + cells + '</div>'
      + '<div class="section-label">par</div>'
      + '<div class="par-row" style="' + cols + '">' + p3 + '</div>'
      + '<div class="par-row" style="' + cols + '">' + p4 + '</div>'
      + '<div class="par-row" style="' + cols + '">' + p5 + '</div>'
      + '<div class="section-label">stroke index</div>'
      + '<div class="si-row" style="' + cols + '">' + siCells + '</div>';
  }

  const grid = document.getElementById('tr_parsiGrid');
  if (grid) {
    if (holes === 18) {
      grid.innerHTML = block(0, 9, 'Front nine') + block(9, 9, 'Back nine');
    } else {
      grid.innerHTML = block(0, holes, null);
    }
  }
  trUpdateParTotal(scr);

  // View mode (opened from summary): BACK returns to summary, NEXT hidden,
  // par buttons read-only (no accidental edits from a view).
  applyViewMode('screen-trparsi', null);
  const parsiScr = document.getElementById('screen-trparsi');
  if (parsiScr) parsiScr.querySelectorAll('.par-btn').forEach(b => { b.style.pointerEvents = _viewMode ? 'none' : ''; });
}

function trUpdateParTotal(scr) {
  const root = scr || document.getElementById('screen-trparsi'); if (!root) return;
  let total = 0;
  root.querySelectorAll('.par-btn.active').forEach(b => total += parseInt(b.dataset.par) || 0);
  const pt = document.getElementById('tr_parTotal'); if (pt) pt.textContent = total;
}

// ── Collect par/SI edits back into _trFlow ──
// Populate the flow-level par/SI arrays from the already-composed course.
// Replaces what the (now-hidden) trparsi screen's trCollectParSi() used to do,
// so the TM live-match builder (which reads _trFlow.parByHole/siByHole) still works.
function trSyncParSiFromCourse() {
  if (!_trFlow || !_trFlow.course) return;
  const c = _trFlow.course;
  _trFlow.parByHole = Array.isArray(c.parPerHole) ? c.parPerHole.slice() : [];
  _trFlow.siByHole  = Array.isArray(c.indexPerHole) ? c.indexPerHole.slice() : [];
}

function trCollectParSi() {
  const scr = document.getElementById('screen-trparsi'); if (!scr || !_trFlow) return;
  const holes = scr.querySelectorAll('.si-input').length || 9;
  _trFlow.parByHole = []; _trFlow.siByHole = [];
  for (let i=0; i<holes; i++) {
    const a = scr.querySelector('.par-btn.active[data-hole="'+i+'"]');
    _trFlow.parByHole[i] = a ? parseInt(a.dataset.par) : null;
    const siEl = document.getElementById('tr-si-'+i);
    _trFlow.siByHole[i] = siEl ? parseInt(siEl.textContent.trim()) : null;
  }
}

function trInit_trloop(ROOT){}

function trInit_trparsi(ROOT){

  let activeHole = null;
  let buffer = '';
  const numpad = document.getElementById('tr_numpad');
  const display = document.getElementById('tr_numpadDisplay');
  const context = document.getElementById('tr_numpadContext');

  function openNumpad(holeIdx) {
    activeHole = holeIdx;
    buffer = '';
    display.textContent = '–';
    context.textContent = 'Hole ' + (holeIdx + 1) + ' · SI';
    numpad.classList.add('open');
    ROOT.querySelectorAll('.si-input').forEach(el => el.classList.remove('active'));
    document.getElementById('tr-si-' + holeIdx).classList.add('active');
  }

  function closeNumpad() {
    numpad.classList.remove('open');
    ROOT.querySelectorAll('.si-input').forEach(el => el.classList.remove('active'));
    activeHole = null;
    buffer = '';
  }

  // Open numpad on SI tap (delegated — grid is regenerated per course)
  const _grid = document.getElementById('tr_parsiGrid');
  if (_grid) {
    _grid.addEventListener('click', (e) => {
      const si = e.target.closest('.si-input');
      if (si) { openNumpad(parseInt(si.dataset.hole)); return; }
      const pb = e.target.closest('.par-btn');
      if (pb) {
        const hole = pb.dataset.hole;
        _grid.querySelectorAll('.par-btn[data-hole="' + hole + '"]').forEach(b => b.classList.remove('active'));
        pb.classList.add('active');
        if (typeof trUpdateParTotal === 'function') trUpdateParTotal(document.getElementById('screen-trparsi'));
      }
    });
  }

  // Number buttons
  ROOT.querySelectorAll('.num-btn[data-val]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (activeHole === null) return;
      const val = btn.dataset.val;
      // Max 2 digits, max value 18
      const next = (buffer === '0' ? val : buffer + val).slice(-2);
      if (parseInt(next) > 18) return;
      buffer = next;
      display.textContent = buffer || '–';
    });
  });

  // Delete
  document.getElementById('tr_delBtn').addEventListener('click', () => {
    if (activeHole === null) return;
    buffer = buffer.slice(0, -1);
    display.textContent = buffer || '–';
  });

  // OK
  document.getElementById('tr_numpadOk').addEventListener('click', () => {
    if (activeHole !== null && buffer !== '') {
      document.getElementById('tr-si-' + activeHole).textContent = parseInt(buffer);
    }
    closeNumpad();
  });

  // Close on body tap outside
  document.addEventListener('click', (e) => {
    if (!numpad.contains(e.target) && !e.target.classList.contains('si-input')) {
      if (numpad.classList.contains('open')) closeNumpad();
    }
  });

  // Par button toggle
  ROOT.querySelectorAll('.par-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const hole = btn.dataset.hole;
      ROOT.querySelectorAll('.par-btn[data-hole="' + hole + '"]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      let total = 0;
      for (let i = 0; i < 9; i++) {
        const a = document.querySelector('.par-btn.active[data-hole="' + i + '"]');
        if (a) total += parseInt(a.dataset.par);
      }
      document.getElementById('tr_parTotal').textContent = total;
    });
  });

}


// ═══════════════════════════════════════════
// TEAM ROUND · Sub-stage B (Screens 07–11)
// Team setup → tees → format → summary → WHS result
// Calculation reuses getCH (single source of truth).
// ═══════════════════════════════════════════

// Build the pool of selectable players: profile (captain) + buddies
function trPlayerPool() {
  const pool = [];
  if (typeof _profile !== 'undefined' && _profile && _profile.displayName) {
    pool.push({ name: _profile.displayName, hcp: (_profile.hcpIndex ?? null), avatarId: _profile.avatarId, gender: _profile.gender || 'M', isMe: true });
  }
  if (typeof _buddies !== 'undefined' && Array.isArray(_buddies)) {
    _buddies.forEach(b => pool.push({ name: b.name, hcp: (b.hcp ?? null), avatarId: b.avatarId, gender: b.gender || 'M' }));
  }
  if (Array.isArray(_trbGuests)) {
    _trbGuests.forEach(g => pool.push({ name: g.name, hcp: (g.hcp ?? null), avatarId: null, gender: g.gender || 'M', isGuest: true }));
  }
  return pool;
}

// Shared tee resolver — the ONE place gender affects which rating/slope/par
// gets used. 'F' with matching women's data on the course uses it; 'M',
// 'O' (Other), or a missing/incomplete women's entry all fall back to the
// standard tee — 'Other' is intentionally treated the same as 'Male' since
// course rating data only ever has two variants (standard + women's).
// Both `tees` and `women` are arrays shaped identically: {label, rating, slope, par}.
function resolveTeeForGender(course, teeKeyOrLabel, gender) {
  if (!course) return null;
  let k = (teeKeyOrLabel || '').toLowerCase();
  // Women's tee set is Medal / Blue / Forward (no Champion). The tee-picker's
  // middle option uses the key 'senior' (men's naming); for women that slot is
  // the Blue tee, so map senior->blue when looking up women's data.
  const kW = (k === 'senior') ? 'blue' : k;
  const searchArray = (arr, key) => {
    if (!arr || !arr.length) return null;
    return arr.find(t => (t.label||'').toLowerCase().includes(key))
        || arr.find(t => (t.label||'').toLowerCase().includes('medal'))
        || arr[0];
  };
  if (gender === 'F' && course.women && course.women.length) {
    const w = searchArray(course.women, kW);
    if (w && w.rating != null && w.slope != null) {
      return { rating:Number(w.rating), slope:Number(w.slope), par:Number(w.par)||72, label:w.label, key:teeKeyOrLabel, source:'women' };
    }
  }
  const m = searchArray(course.tees, k);
  return m ? { rating:Number(m.rating), slope:Number(m.slope), par:Number(m.par)||72, label:m.label, key:teeKeyOrLabel, source:'standard' } : null;
}

// Tee label → engine tee object from the composed course (gender-aware)
function trTeeByKey(key, gender) {
  return resolveTeeForGender(_trFlow.course, key, gender);
}

// Format label "35%/15%" → FORMATS key "35_15"
function trFormatKeyFromLabel(label) {
  const nums = (label.match(/\d+/g) || []);
  return nums.join('_');
}

// ── THE CALCULATION (WHS-correct, reuses getCH) ──
function trCalcTeam() {
  const f = _trFlow;
  const players = (f.team.players || []).filter(p => p && p.hcp != null && !isNaN(parseFloat(p.hcp)));
  if (!players.length) return null;

  // Course Handicap for each player at their chosen tee
  players.forEach(p => {
    const tee = trTeeByKey(p.teeKey || 'medal', p.gender || 'M');
    const rating = tee ? Number(tee.rating) : 0;
    const slope  = tee ? Number(tee.slope)  : 113;
    const par    = tee ? Number(tee.par)    : (f.course.par || 72);
    p.courseHcp = getCH(whsPlayIndex(p.hcp, f.course), slope, rating, par); // raw (unrounded; 9-hole halves index)
    p.chRounded = Math.round(p.courseHcp);
    p.teeLabel = tee ? tee.label : '—';
  });

  // Sort lowest CH first, apply the format's percentage allowances
  const sorted = players.slice().sort((a,b) => a.courseHcp - b.courseHcp);
  const pcts = (f.format === 'custom' && Array.isArray(f.customPcts) && f.customPcts.length)
    ? f.customPcts
    : ((typeof FORMATS !== 'undefined' && FORMATS[f.format]) ? FORMATS[f.format] : [0.35,0.15]);
  let total = 0;
  sorted.forEach((p,i) => {
    p.pct = pcts[Math.min(i, pcts.length-1)] || 0;
    p.contrib = p.courseHcp * p.pct;   // use unrounded CH for the allowance
    total += p.contrib;
  });

  return {
    players: sorted,
    teamHcp: Math.round(total),
    teamHcpRaw: total,
    format: f.format,
    pcts,
  };
}


// Human-readable format label, e.g. "35%/15%" or custom "40%/20%"
function trFormatLabel() {
  const f = _trFlow;
  if (f.format === 'custom' && Array.isArray(f.customPcts) && f.customPcts.length) {
    return f.customPcts.map(p => (Math.round(p*1000)/10)+'%').join('/');   // v32: 0.5% steps stay visible
  }
  const pcts = (typeof FORMATS !== 'undefined' && FORMATS[f.format]) ? FORMATS[f.format] : null;
  if (pcts) return pcts.map(p => Math.round(p*100)+'%').join('/');
  return (f.format||'').split('_').map(n=>n+'%').join('/');
}

// ── TR-B navigation ──
function trbNext(fromId) {
  if (fromId === 'trsummary') { showScreen('trresult'); return; }
  const order = ['trteam','trtee','trformat','trsummary','trresult'];
  // validation per screen
  if (fromId === 'trteam') {
    if (!_trFlow.team.players || !_trFlow.team.players.length) {
      if (typeof showToast==='function') showToast('Select your team first'); return;
    }
  }
  const i = order.indexOf(fromId);
  let next = order[i+1];
  // Entering the own-team tee step
  if (fromId === 'trteam' && typeof _trFlow!=='undefined' && _trFlow) _trFlow._teeTarget = 'team';
  // Team Match reuses TR setup screens. After tees: own → opponent select; opponent → format.
  if (fromId === 'trtee' && _gameMode === 'match') {
    next = (typeof _trFlow!=='undefined' && _trFlow && _trFlow._teeTarget === 'opp') ? 'trformat' : 'tmopp';
  }
  // After choosing the scramble format, match flow goes to the 2v2 handicap screen
  if (fromId === 'trformat' && _gameMode === 'match') next = 'tmhcp';
  if (next && document.getElementById('screen-'+next)) showScreen(next);
}

// Hook into the TR dispatcher (extends trInitStep)
function trbInitStep(id, el) {
  if (id === 'trteam')    trRenderTeam(el);
  if (id === 'trtee')     trRenderTees(el);
  if (id === 'trformat')  trRenderFormats(el);
  if (id === 'trsummary') trRenderSummary(el);
  if (id === 'trresult')  trRenderResult(el);
}

// ── Screen 07: Team Details (name, size, player carousel) ──
let _trbCarousel = { offset:0, selected:new Set(), pool:[] };
let _trbGuests = []; // guest players: name + hcp, this round only
function trRenderTeam(scr) {
  if (!_trFlow.team) _trFlow.team = { name:'', size:2, players:[] };
  const pool = trPlayerPool();
  _trbCarousel.pool = pool;
  // captain (me) is always player 1 — pre-select if present
  _trbCarousel.selected = new Set();
  // team size field
  const sizeVal = document.getElementById('trb_teamSizeVal');
  if (sizeVal) sizeVal.textContent = _trFlow.team.size || 2;
  const nameInput = document.getElementById('trb_teamNameInput');
  if (nameInput) nameInput.value = _trFlow.team.name || '';

  trbRenderCarousel();

  // wire size dropdown (2/3/4) once — toggle the option list
  const sizeField = document.getElementById('trb_teamSizeField');
  const sizeDrop = document.getElementById('trb_sizeDropdown');
  if (sizeDrop) sizeDrop.style.display = 'none';
  if (sizeVal) sizeVal.textContent = _trFlow.team.size ? (_trFlow.team.size + ' Players') : 'choose # of players 2/3/4';
  if (sizeField && !sizeField._wired) {
    sizeField.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sizeDrop) sizeDrop.style.display = (sizeDrop.style.display==='none'||!sizeDrop.style.display) ? 'block' : 'none';
    });
    if (sizeDrop) {
      sizeDrop.addEventListener('click', (e) => {
        const opt = e.target.closest('.size-option'); if (!opt) return;
        _trFlow.team.size = parseInt(opt.dataset.size);
        if (sizeVal) sizeVal.textContent = _trFlow.team.size + ' Players';
        if (sizeField) sizeField.classList.remove('placeholder');
        sizeDrop.style.display = 'none';
        // trim selection to fit (size-1 teammates)
        const maxMates = _trFlow.team.size - 1;
        while (_trbCarousel.selected.size > maxMates) {
          _trbCarousel.selected.delete([..._trbCarousel.selected][_trbCarousel.selected.size-1]);
        }
        trbRenderCarousel();
      });
    }
    document.addEventListener('click', () => { if (sizeDrop) sizeDrop.style.display='none'; });
    sizeField._wired = true;
  }
  // carousel nav
  const prev = document.getElementById('trb_prevBtn'), next = document.getElementById('trb_nextCarBtn');
  if (prev && !prev._wired) { prev.addEventListener('click', ()=>{ _trbCarousel.offset=(_trbCarousel.offset-1+pool.length)%Math.max(pool.length,1); trbRenderCarousel(); }); prev._wired=true; }
  if (next && !next._wired) { next.addEventListener('click', ()=>{ _trbCarousel.offset=(_trbCarousel.offset+1)%Math.max(pool.length,1); trbRenderCarousel(); }); next._wired=true; }
  if (nameInput && !nameInput._wired) { nameInput.addEventListener('input', ()=>{ _trFlow.team.name = nameInput.value; }); nameInput._wired=true; }

  // wire SAVE / BACK action pills (they carry no id) once
  document.querySelectorAll('#screen-trteam .sub-header .action-pill').forEach(btn => {
    if (btn._wired) return;
    const txt = (btn.textContent || '').trim().toUpperCase();
    if (txt === 'SAVE')      btn.addEventListener('click', trbSaveTeam);
    else if (txt === 'BACK') btn.addEventListener('click', () => showScreen('trcourse'));
    btn._wired = true;
  });
  // wire saved-team name dropdown (chevron toggles; options populated dynamically)
  const nameChev = document.getElementById('trb_teamNameChev');
  const nameDrop = document.getElementById('trb_teamNameDropdown');
  if (nameChev && nameDrop && !nameChev._wired) {
    if (nameInput) nameInput.addEventListener('click', e => e.stopPropagation());
    nameChev.addEventListener('click', e => {
      e.stopPropagation();
      nameDrop.style.display = (nameDrop.style.display === 'none' || !nameDrop.style.display) ? 'block' : 'none';
    });
    document.addEventListener('click', () => { if (nameDrop) nameDrop.style.display = 'none'; });
    nameChev._wired = true;
  }
  trbPopulateTeamDropdown();
}

// Save the current "your team" (name + chosen members) to the user's saved teams
async function trbSaveTeam() {
  if (typeof trbCommitTeam === 'function') trbCommitTeam();
  const name = (document.getElementById('trb_teamNameInput')?.value || '').trim() || 'My Team';
  const src  = (_trFlow.team && _trFlow.team.players) || [];
  if (src.length < 2) { if (typeof showToast==='function') showToast('Select at least 2 players first','error'); return; }
  const uid = window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid;
  if (!uid) { if (typeof showToast==='function') showToast('Sign in to save your team','error'); return; }
  const players = src.map(p => ({ name: p.name || '', hcp: (p.hcp != null ? p.hcp : null), gender: 'M', tee: 'main', avatarId: p.avatarId || null }));
  const nameKey = name.trim().toLowerCase();
  const existing = (typeof _savedTeams !== 'undefined')
    ? _savedTeams.find(x => (x.teamName || '').trim().toLowerCase() === nameKey)
    : null;
  const data = {
    id: existing ? existing.id : Date.now().toString(), teamName: name, players,
    p1Name: players[0]?.name || null, p1Hcp: players[0]?.hcp ?? null,
    p2Name: players[1]?.name || null, p2Hcp: players[1]?.hcp ?? null,
    savedAt: new Date().toISOString()
  };
  const isUpdate = !!existing;
  try {
    if (typeof _savedTeams !== 'undefined') {
      if (existing) {
        Object.assign(existing, data);   // update in place (keep same id)
        // enforce unique team name — drop any other entries sharing this name
        _savedTeams = _savedTeams.filter(x => x === existing || (x.teamName || '').trim().toLowerCase() !== nameKey);
      } else {
        if (_savedTeams.length >= maxTeamsForUser()) {
          if (typeof showToast === 'function') showToast(`Free plan allows ${maxTeamsForUser()} saved teams — delete one, or go Pro for unlimited.`, 'error');
          return;
        }
        _savedTeams.push(data);
      }
    }
    if (typeof persistTeams === 'function') await persistTeams(uid);
    if (typeof showToast === 'function') showToast(isUpdate ? 'Team updated!' : 'Team saved!','success');
    if (typeof renderMyData === 'function') renderMyData();
    trbPopulateTeamDropdown();
  } catch(e) { console.warn('trbSaveTeam', e); if (typeof showToast==='function') showToast('Could not save team','error'); }
}

// Fill the name dropdown from the user's saved teams
function trbPopulateTeamDropdown() {
  const dd = document.getElementById('trb_teamNameDropdown');
  if (!dd) return;
  const teams = (typeof _savedTeams !== 'undefined') ? _savedTeams : [];
  if (!teams.length) {
    dd.innerHTML = '<div style="padding:13px 16px; font-family:Inter,sans-serif; font-size:13px; color:#777;">No saved teams yet</div>';
    return;
  }
  dd.innerHTML = teams.map((tm, i) => {
    const n = (tm.teamName || ('Team ' + (i + 1)));
    const cnt = (tm.players || []).length;
    const last = i === teams.length - 1;
    return '<div class="team-name-option" data-idx="' + i + '" style="padding:13px 16px; font-family:Inter,sans-serif; font-size:14px; cursor:pointer;' + (last ? '' : ' border-bottom:1px solid #eee;') + '">' + n + ' <span style="color:#999; font-size:12px;">· ' + cnt + 'p</span></div>';
  }).join('');
  dd.querySelectorAll('.team-name-option').forEach(opt => {
    opt.addEventListener('click', e => {
      e.stopPropagation();
      trbLoadSavedTeam(teams[parseInt(opt.dataset.idx)]);
      dd.style.display = 'none';
    });
  });
}

// Load a saved team into the current flow + carousel selection (best-effort match by name)
function trbLoadSavedTeam(team) {
  if (!team) return;
  _trFlow.team = _trFlow.team || {};
  _trFlow.team.name = team.teamName || '';
  const sp = team.players || [];
  _trFlow.team.size = Math.max(2, Math.min(4, sp.length || 2));
  const nameInput = document.getElementById('trb_teamNameInput'); if (nameInput) nameInput.value = _trFlow.team.name;
  const sizeVal = document.getElementById('trb_teamSizeVal'); if (sizeVal) sizeVal.textContent = _trFlow.team.size + ' Players';
  const sizeField = document.getElementById('trb_teamSizeField'); if (sizeField) sizeField.classList.remove('placeholder');
  // pre-select matching pool members (skip captain — always player 1)
  const pool = _trbCarousel.pool || [];
  _trbCarousel.selected = new Set();
  // Guests are intentionally NEVER auto-loaded from a saved team — they don't
  // have a Parmate account, so their info isn't meant to persist across
  // sessions. This is a deliberate product decision (not a bug): it creates
  // a natural, visible moment to either re-add them manually or invite them
  // to get the app so they're remembered automatically next time.
  const missingGuests = [];
  sp.forEach(p => {
    if (p.guest) { missingGuests.push(p.name || 'Guest'); return; }
    const idx = pool.findIndex(x => !x.isMe && (x.name || '').toLowerCase() === (p.name || '').toLowerCase());
    if (idx >= 0 && _trbCarousel.selected.size < _trFlow.team.size - 1) _trbCarousel.selected.add(idx);
  });
  if (typeof trbRenderCarousel === 'function') trbRenderCarousel();
  if (missingGuests.length && typeof showToast === 'function') {
    const names = missingGuests.join(', ');
    const plural = missingGuests.length > 1;
    showToast(
      (plural ? 'Guests ' : 'Guest ') + names + (plural ? " don't" : " doesn't") +
      ' have Parmate yet — tap "Add guest" to re-add them, or invite them to join so they\'re saved automatically next time.',
      'info'
    );
  }
}

function trbRenderCarousel() {
  const track = document.getElementById('trb_carouselTrack');
  if (!track) return;
  const pool = _trbCarousel.pool;
  const maxMates = (_trFlow.team.size || 2) - 1;
  track.innerHTML = '';
  const AV = (typeof AVATARS !== 'undefined') ? AVATARS : {};
  const shown = Math.min(3, pool.length);
  for (let i=0;i<shown;i++){
    const idx=(_trbCarousel.offset+i)%pool.length;
    const p=pool[idx];
    const isSel=_trbCarousel.selected.has(idx);
    const atMax=!isSel && maxMates>0 && _trbCarousel.selected.size>=maxMates;
    const card=document.createElement('div');
    card.className='player-card'+(isSel?' selected':'')+(atMax?' dimmed':'');
    const avatar = (typeof _avatarFor==='function') ? _avatarFor(p) : ((p.avatarId && AV[p.avatarId]) ? AV[p.avatarId] : 'icons/home-crown.png');
    card.innerHTML='<div class="avatar-wrap"><img src="'+avatar+'" alt=""></div>'+
      '<div class="player-nickname">'+(p.name||'?')+(p.isMe?' (you)':'')+(p.isGuest?' <span class="guest-tag">guest</span>':'')+'</div>'+
      '<div class="player-hcp">hcp '+(p.hcp!=null?p.hcp:'—')+'</div>';
    if (!atMax && !p.isMe) card.addEventListener('click', ()=>{
      if (_trbCarousel.selected.has(idx)) _trbCarousel.selected.delete(idx);
      else { if (_trbCarousel.selected.size>=maxMates) return; _trbCarousel.selected.add(idx); }
      trbCommitTeam(); trbRenderCarousel();
    });
    track.appendChild(card);
  }
  const counter=document.getElementById('trb_selectCounter');
  if (counter) counter.innerHTML = maxMates===0 ? 'Select team size first'
    : '<span>'+_trbCarousel.selected.size+'</span> / '+maxMates+' teammate'+(maxMates>1?'s':'')+' selected';
  trbCommitTeam();
}

// Commit current selection (captain + chosen mates) into _trFlow.team.players
function trbCommitTeam() {
  const pool=_trbCarousel.pool;
  const players=[];
  const me = pool.find(p=>p.isMe);
  if (me) players.push({ name:me.name, hcp:me.hcp, avatarId:me.avatarId, gender:me.gender||'M', teeKey:'medal' });
  [..._trbCarousel.selected].forEach(idx=>{ const p=pool[idx]; if(p && !p.isMe) players.push({ name:p.name, hcp:p.hcp, avatarId:p.avatarId, gender:p.gender||'M', teeKey:'medal' }); });
  _trFlow.team.players = players;
}

let _trbGuestGender = 'M';
function trbSetGuestGender(g){
  _trbGuestGender = g;
  document.querySelectorAll('.trb-guest-gender-opt').forEach(function(btn){
    const sel = btn.getAttribute('data-gender') === g;
    btn.classList.toggle('selected', sel);
    btn.style.background = sel ? 'var(--green)' : '#fff';
    btn.style.color = sel ? '#fff' : 'var(--text)';
    btn.style.borderColor = sel ? 'var(--green)' : 'rgba(0,0,0,0.15)';
  });
}
function trbToggleGuestForm(show){
  const f=document.getElementById('trb_guestForm'); if(!f) return;
  const vis=(show===undefined)?(f.style.display==='none'||!f.style.display):!!show;
  f.style.display=vis?'block':'none';
  if(vis){ const n=document.getElementById('trb_guestName'); if(n) setTimeout(function(){ n.focus(); },50); trbSetGuestGender('M'); }
}
function trbAddGuest(){
  const nEl=document.getElementById('trb_guestName'), hEl=document.getElementById('trb_guestHcp');
  const tt=(typeof t==='function')?t:function(k){return k;};
  const name=((nEl&&nEl.value)||'').trim();
  const hcpRaw=((hEl&&hEl.value)||'').trim();
  if(!name){ if(typeof showToast==='function') showToast(tt('tr_guest_need_name'),'error'); return; }
  let hcp=null;
  if(hcpRaw!==''){ hcp=parseFloat(hcpRaw); if(isNaN(hcp)||hcp<-10||hcp>54){ if(typeof showToast==='function') showToast(tt('tr_guest_bad_hcp'),'error'); return; } }
  if(!Array.isArray(_trbGuests)) _trbGuests=[];
  _trbGuests.push({ name:name, hcp:hcp, gender:_trbGuestGender||'M' });
  if(nEl) nEl.value=''; if(hEl) hEl.value='';
  trbToggleGuestForm(false);
  _trbCarousel.pool=trPlayerPool();
  const gIdx=_trbCarousel.pool.length-1;
  const maxMates=((_trFlow&&_trFlow.team&&_trFlow.team.size)||2)-1;
  if(_trbCarousel.selected.size<maxMates) _trbCarousel.selected.add(gIdx);
  _trbCarousel.offset=gIdx;
  if(typeof trbCommitTeam==='function') trbCommitTeam();
  if(typeof trbRenderCarousel==='function') trbRenderCarousel();
  if(typeof showToast==='function') showToast(tt('tr_guest_added').replace('{name}',name),'success');
}

// ── Screen 08: Choose Tee (per player) ──
function trRenderTees(scr) {
  const _teeTarget = (typeof _trFlow!=='undefined' && _trFlow && _trFlow._teeTarget === 'opp') ? 'opp' : 'team';
  const players = (_teeTarget === 'opp')
    ? ((typeof _tmFlow!=='undefined' && _tmFlow.opponent && _tmFlow.opponent.players) || [])
    : (_trFlow.team.players || []);
  var _ttl = scr.querySelector('.sub-header .title');
  if (_ttl) _ttl.textContent = (_teeTarget === 'opp') ? 'Opponent Tees' : 'Choose Tee';
  const courseTees = (_trFlow.course && _trFlow.course.tees) || [];
  const courseWomenTees = (_trFlow.course && _trFlow.course.women) || [];
  // Which array determines button visibility depends on EACH player's own gender —
  // previously this always used the men's array regardless of who was picking a tee,
  // silently hiding a tee that only exists in the women's data.
  const hasTee = (key, gender) => {
    const arr = (gender === 'F' && courseWomenTees.length) ? courseWomenTees : courseTees;
    return arr.some(t => (t.label||'').toLowerCase().includes(key));
  };
  for (let i=1;i<=4;i++){
    const block=document.getElementById('trb_playerBlock'+i);
    if (!block) continue;
    const p=players[i-1];
    block.style.display = p ? 'block' : 'none';
    if (!p) continue;
    const nick=block.querySelector('.player-nickname');
    if (nick) nick.textContent = p.name || ('Player '+i);
    const avEl=block.querySelector('.player-avatar-wrap img');
    if (avEl) {
      var _tav=null;
      if (_teeTarget==='team' && i===1 && typeof _profile!=='undefined' && _profile && (_profile.avatarUrl||_profile.avatarId!=null)) {
        var _TAV=(typeof AVATARS!=='undefined')?AVATARS:{};
        _tav=_profile.avatarUrl||(_profile.avatarId!=null&&_TAV[_profile.avatarId])||null;
      }
      if (!_tav && typeof _avatarFor==='function') _tav=_avatarFor(p);
      if (_tav) avEl.src=_tav;
    }
    const hcpEl=block.querySelector('.player-hcp');
    if (hcpEl) hcpEl.textContent = 'hcp ' + (p.hcp!=null ? p.hcp : '—');
    const pGender = p.gender || 'M';
    // For women, the middle "senior" slot is the Blue tee — remap the key used
    // to check the women's data array, and relabel the button.
    const teeKeyForGender = (lbl) => (pGender === 'F' && lbl === 'senior') ? 'blue' : lbl;
    // show only tees the course actually offers (per this player's gender)
    block.querySelectorAll('.tee-btn').forEach(btn=>{
      const lbl=(btn.dataset.tee||'').toLowerCase();
      btn.style.display = hasTee(teeKeyForGender(lbl), pGender) ? '' : 'none';
      // Relabel the Senior button to "Blue" for female players (women's tee set
      // is Medal / Blue / Forward, no Senior/Champion).
      if (lbl === 'senior') {
        const nameNode = [...btn.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
        const newText = (pGender === 'F') ? 'Blue' : 'Senior';
        if (nameNode) nameNode.textContent = newText; else btn.lastChild && (btn.lastChild.textContent = newText);
      }
    });
    // ensure the active tee is one that exists; default to first available.
    // Always persist the resolved tee to p.teeKey so it carries into the match doc even
    // when the user doesn't tap (previously left undefined → defaulted to CHAMPION on join).
    const key=(p.teeKey||'medal').toLowerCase();
    let activeBtn=null;
    block.querySelectorAll('.tee-btn').forEach(btn=>{
      const lbl=(btn.dataset.tee||'').toLowerCase();
      const on = hasTee(teeKeyForGender(lbl), pGender) && (lbl===key || lbl.slice(0,4)===key.slice(0,4));
      btn.classList.toggle('active', on);
      if (on && !activeBtn) activeBtn=btn;
    });
    if (!activeBtn) {
      activeBtn=[...block.querySelectorAll('.tee-btn')].find(b=>b.style.display!=='none') || null;
      if (activeBtn) activeBtn.classList.add('active');
    }
    if (activeBtn) p.teeKey = activeBtn.dataset.tee;
  }
  if (!scr._teeWired) {
    scr.addEventListener('click', (e)=>{
      const btn=e.target.closest('.tee-btn'); if(!btn) return;
      const block=btn.closest('[id^="trb_playerBlock"]'); if(!block) return;
      const pi=parseInt(block.id.replace('trb_playerBlock',''))-1;
      block.querySelectorAll('.tee-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      var _arr = ((typeof _trFlow!=='undefined' && _trFlow && _trFlow._teeTarget==='opp')
                  ? ((typeof _tmFlow!=='undefined' && _tmFlow.opponent && _tmFlow.opponent.players) || [])
                  : (_trFlow.team.players||[]));
      if (_arr[pi]) _arr[pi].teeKey = (btn.dataset.tee||'medal');
    });
    scr._teeWired=true;
  }
}

// ── Screen 09: Scramble Format ──
// v32: WHS recommended allowances first (Rules of Handicapping, Appendix C):
//   2 players 35/15 · 3 players 30/20/10 · 4 players 25/20/15/10. Older options stay selectable.
// The pills are drawn from this list; explanations sit behind the "i"; Custom opens a pop-up.
const TR_FORMAT_OPTIONS = {
  2: [ { key:'35_15', whs:true, info:'WHS recommendation for 2 players.' },
       { key:'25_20', info:'More weight on the higher handicap.' },
       { key:'20_15', info:'Lower allowance: fewer strokes for the team.' } ],
  3: [ { key:'30_20_10', whs:true, info:'WHS recommendation for 3 players.' },
       { key:'20_15_10', info:'Lower allowance: fewer strokes for the team.' },
       { key:'15_12_10', info:'Lower allowance: fewer strokes for the team.' } ],
  4: [ { key:'25_20_15_10', whs:true, info:'WHS recommendation for 4 players.' },
       { key:'20_15_10_5', info:'Lower allowance: fewer strokes for the team.' },
       { key:'15_12_10_7', info:'Lower allowance: fewer strokes for the team.' } ]
};
function trFmtSize() { return Math.min(4, Math.max(2, (_trFlow && (_trFlow.team.size || (_trFlow.team.players||[]).length)) || 2)); }
function trFmtPctText(arr) { return arr.map(function(p){ return (Math.round(p*1000)/10) + '%'; }).join(' / '); }
function trFmtEsc(x) { return String(x == null ? '' : x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
// Make sure _trFlow.format fits the team size (a 2-player format can't be used for 3 players).
function trFmtNormalize() {
  const size = trFmtSize(), opts = TR_FORMAT_OPTIONS[size];
  const customOk = _trFlow.format === 'custom' && Array.isArray(_trFlow.customPcts) && _trFlow.customPcts.length === size;
  if (!customOk && !opts.some(function(o){ return o.key === _trFlow.format; })) { _trFlow.format = opts[0].key; _trFlow.customPcts = null; }
}
function trRenderFormats(scr) {
  scr = scr || document.getElementById('screen-trformat'); if (!scr) return;
  const size = trFmtSize();
  const nameBadge=document.getElementById('trb_teamNameBadge'), sizeBadge=document.getElementById('trb_teamSizeBadge');
  const isMatch = (typeof _gameMode !== 'undefined' && _gameMode === 'match');
  if (nameBadge) {
    nameBadge.textContent = _trFlow.team.name || 'Team';
    // In a match there are two teams, so a single team name is misleading — show size only
    nameBadge.style.display = isMatch ? 'none' : '';
    const lbl = nameBadge.previousElementSibling;
    if (lbl && lbl.classList.contains('badge-label')) lbl.style.display = isMatch ? 'none' : '';
  }
  if (sizeBadge) sizeBadge.textContent = size+' Players';
  const title = document.getElementById('trb_fmtTitle'); if (title) title.textContent = size + '-Player Formats';
  trFmtNormalize();
  const grid = document.getElementById('trb_fmtGrid');
  if (grid) {
    const isCustom = _trFlow.format === 'custom';
    let html = TR_FORMAT_OPTIONS[size].map(function(o){
      const on = !isCustom && _trFlow.format === o.key;
      return '<button class="tf-pill' + (on ? ' active' : '') + '" type="button" data-key="' + o.key + '">' +
             '<span class="tf-pct" data-no-i18n>' + trFmtPctText(FORMATS[o.key]) + '</span>' +
             (o.whs ? '<span class="tf-sub">WHS recommended</span>' : '') + '</button>';
    }).join('');
    html += '<button class="tf-pill tf-custom' + (isCustom ? ' active' : '') + '" type="button" data-key="custom">' +
            (isCustom ? '<span class="tf-pct" data-no-i18n>' + trFmtPctText(_trFlow.customPcts) + '</span><span class="tf-sub">Custom · tap to change</span>'
                      : '<span class="tf-pct">Custom</span><span class="tf-sub">Your own percentages</span>') + '</button>';
    grid.innerHTML = html;
  }
  const info = document.getElementById('trb_fmtInfo');
  if (info) info.innerHTML = TR_FORMAT_OPTIONS[size].map(function(o){
      return '<div class="tf-info-row"><b data-no-i18n>' + trFmtPctText(FORMATS[o.key]) + '</b> <span>' + o.info + '</span></div>';
    }).join('') +
    '<div class="tf-info-row"><b>Custom</b> <span>Your own percentages, for example from your competition rules.</span></div>' +
    '<div class="tf-info-row tf-info-foot">The first percentage is for the player with the lowest Course Handicap, the last for the highest.</div>';
  if (!scr._fmtWired) {
    scr.addEventListener('click', function(e){
      const pill = e.target.closest('.tf-pill'); if (!pill) return;
      const key = pill.dataset.key;
      if (key === 'custom') { trFmtCustomOpen(); return; }
      _trFlow.format = key; _trFlow.customPcts = null;
      trRenderFormats(scr);
    });
    scr.addEventListener('keydown', function(e){
      if (e.key === 'Enter' && e.target.closest && e.target.closest('#trb_fmtFields')) { e.preventDefault(); trFmtCustomSave(); }
      if (e.key === 'Escape') trFmtCustomClose();
    });
    scr._fmtWired = true;
  }
}
function trFmtInfo() {
  const box = document.getElementById('trb_fmtInfo'), btn = document.getElementById('trb_fmtInfoBtn'); if (!box) return;
  const open = box.style.display === 'none';
  box.style.display = open ? '' : 'none';
  if (btn) btn.classList.toggle('on', open);
}
// ── Custom allowance pop-up ──
const TR_FMT_PLACES = { 2:['Lowest HCP','Highest HCP'], 3:['Lowest HCP','Middle HCP','Highest HCP'], 4:['Lowest HCP','2nd lowest HCP','3rd lowest HCP','Highest HCP'] };
function trFmtCustomOpen() {
  const size = trFmtSize(), cur = (_trFlow.format === 'custom' && Array.isArray(_trFlow.customPcts) && _trFlow.customPcts.length === size) ? _trFlow.customPcts : null;
  const wrap = document.getElementById('trb_fmtFields'); if (!wrap) return;
  wrap.innerHTML = TR_FMT_PLACES[size].map(function(lbl, i){
    const v = cur ? (Math.round(cur[i]*1000)/10) : '';
    return '<label class="tf-field"><span>' + lbl + '</span><span class="tf-in"><input type="number" inputmode="decimal" min="0" max="100" step="0.5" value="' + v + '" placeholder="0" aria-label="' + lbl + '"><i>%</i></span></label>';
  }).join('');
  const err = document.getElementById('trb_fmtErr'); if (err) err.textContent = '';
  const sh = document.getElementById('trb_fmtSheet'); if (sh) sh.classList.add('open');
  const first = wrap.querySelector('input'); if (first) setTimeout(function(){ first.focus(); }, 60);
}
function trFmtCustomClose() { const sh = document.getElementById('trb_fmtSheet'); if (sh) sh.classList.remove('open'); }
function trFmtCustomSave() {
  const size = trFmtSize(), err = document.getElementById('trb_fmtErr');
  const vals = Array.prototype.map.call(document.querySelectorAll('#trb_fmtFields input'), function(i){ return i.value.trim() === '' ? NaN : Number(i.value); });
  const bad = vals.length !== size || vals.some(function(v){ return !isFinite(v) || v < 0 || v > 100; });
  if (bad) { if (err) err.textContent = 'Enter a percentage from 0 to 100 for every player.'; return; }
  if (!vals.some(function(v){ return v > 0; })) { if (err) err.textContent = 'At least one percentage must be more than 0.'; return; }
  _trFlow.format = 'custom';
  _trFlow.customPcts = vals.map(function(v){ return Math.round(v*10)/1000; });   // 0.5% steps
  trFmtCustomClose();
  trRenderFormats();
}

// ── Screen 10: Game Summary ──
// ── Open the existing full-fidelity Loop Layout / Par&SI screens as read-only
// views from the summary (TR) or tmhcp (TM). _viewReturnScreen remembers where
// to send BACK. _viewMode makes the screens read-only (no editing from here).
let _viewReturnScreen = null;
let _viewMode = false;
function openLayoutView(fromScreen) {
  _viewReturnScreen = fromScreen; _viewMode = true;
  showScreen('trloop');
}
function openParSiView(fromScreen) {
  _viewReturnScreen = fromScreen; _viewMode = true;
  showScreen('trparsi');
}
// BACK handler for the view screens: return to whoever opened them.
function viewBack() {
  const dest = _viewReturnScreen || 'trsummary';
  _viewMode = false; _viewReturnScreen = null;
  showScreen(dest);
}

function trRenderSummary(scr) {
  const c=_trFlow.course||{};
  const rows=scr.querySelectorAll('.summary-row .row-value');
  const medal = trTeeByKey('medal') || (c.tees&&c.tees[0]) || {};
  const fmtLabel = trFormatLabel();
  // order: Team name, Course, Loop, Par, Rating, Slope, Format
  if (rows[0]) rows[0].textContent = (_trFlow.team && _trFlow.team.name) || 'My Team';
  if (rows[1]) rows[1].textContent = c.name || '—';
  if (rows[2]) rows[2].textContent = (c._playedLoopName||c.name||'—') + ' (' + (c.holes||18) + ')';
  if (rows[3]) rows[3].textContent = c.par != null ? c.par : '—';
  if (rows[4]) rows[4].textContent = medal.rating != null ? medal.rating : (c.rating!=null?c.rating:'—');
  if (rows[5]) rows[5].textContent = medal.slope != null ? medal.slope : (c.slope!=null?c.slope:'—');
  if (rows[6]) rows[6].textContent = fmtLabel;
}

// ── Screen 11: Team HCP Result (THE CALCULATION) ──
function trRenderResult(scr) {
  const res = trCalcTeam();
  const c=_trFlow.course||{};
  const valEl=scr.querySelector('.thcp-value');
  const nameEl=scr.querySelector('.thcp-name');
  if (nameEl) nameEl.textContent = (_trFlow.team && _trFlow.team.name) || 'My Team';
  const ch=scr.querySelector('.course-name'); if(ch) ch.textContent = (c._playedLoopName ? c.name : (c.name||'—'));
  const metas = scr.querySelectorAll('.course-meta');
  const medal = trTeeByKey('medal') || (c.tees&&c.tees[0]) || {};
  if (metas[0]) {
    metas[0].innerHTML = '<span>'+(c.holes||18)+' holes</span>|<span>Rating '+(medal.rating!=null?medal.rating:(c.rating!=null?c.rating:'—'))+
      '</span>|<span>Slope '+(medal.slope!=null?medal.slope:(c.slope!=null?c.slope:'—'))+'</span>|<span>Par '+(c.par!=null?c.par:'—')+'</span>';
  }
  if (metas[1]) {
    metas[1].innerHTML = '<span>'+(c._playedLoopName||c.name||'')+'</span>|<span>'+trFormatLabel()+' allowance</span>'+
      (((c.holes||18)<=9) ? '|<span style="color:#1a6b3c;font-weight:700;">'+t('nine_hole_tag')+'</span>' : '');
  }
  if (!res) { if(valEl) valEl.textContent='—'; return; }
  if (valEl) valEl.textContent = res.teamHcp;

  const card=scr.querySelector('.breakdown-card');
  if (card) {
    const teeDotClass = (label) => {
      const l=(label||'').toLowerCase();
      if (l.includes('champ')) return 'champion';
      if (l.includes('senior')) return 'senior';
      if (l.includes('forward')) return 'forward';
      return 'medal';
    };
    card.innerHTML = res.players.map(p => {
      const pct = Math.round(p.pct*100)+'%';
      return '<div class="breakdown-row">'+
        '<div class="breakdown-left">'+
          '<span class="player-label">player</span>'+
          '<span class="tee-dot '+teeDotClass(p.teeLabel)+'"></span>'+
          '<span class="player-name">'+(p.name||'?')+'</span>'+
        '</div>'+
        '<div class="breakdown-right">'+
          '<span class="player-hcp">CH '+p.chRounded+'</span>'+
          '<span class="player-pct">'+pct+'</span>'+
        '</div>'+
      '</div>';
    }).join('');
  }
}


// ═══════════════════════════════════════════
// TEAM ROUND · Sub-stage C (Screens 12–13)
// Hole-by-hole team scorecard + full scorecard table
// ═══════════════════════════════════════════
let _trcScores = [];
let _trcHole = 0;
let _trcBuf = '';

function trcPar(i)  { const c=_trFlow.course||{}; const a=c.parPerHole||[]; return (a[i]!=null)?a[i]:4; }
function trcSI(i)   { const c=_trFlow.course||{}; const a=c.indexPerHole||[]; return (a[i]!=null)?a[i]:(i+1); }
function trcTotal() { const c=_trFlow.course||{}; return c.holes || (c.parPerHole? c.parPerHole.length : 18); }
function trcSILabel(si){ if(si<=6) return 'SI '+si+' – Hard'; if(si<=12) return 'SI '+si+' – Average'; return 'SI '+si+' – Easy'; }
function trcSIClass(si){ if(si<=6) return 'si-hard'; if(si<=12) return 'si-average'; return 'si-easy'; }

// Called when Start Scorecard tapped (from Screen 11)
function trbStartScorecard() {
  if (!document.getElementById('screen-trscore')) {
    if (typeof showToast==='function') showToast('Scorecard unavailable'); return;
  }
  const n = trcTotal();
  // Always start a fresh scorecard. Previously this only reset when the hole
  // count changed, so replaying the same 9/18-hole size kept the old scores
  // (causing stale scores + a phantom vs-par on a brand-new round).
  _trcScores = new Array(n).fill(null);
  _trcHole = 0; _trcBuf = '';
  // Fresh round: clear any paused round + banner and reset the saved flag.
  _pausedRound = null; _scRoundSaved = false;
  if (typeof hidePausedRoundBanner === 'function') hidePausedRoundBanner();
  if (typeof clearPausedRoundFromCloud === 'function') clearPausedRoundFromCloud();
  showScreen('trscore');
}

function trcBuildDots() {
  const row = document.getElementById('trc_dotRow'); if (!row) return;
  const n = trcTotal();
  row.innerHTML = '';
  for (let i=0;i<n;i++){
    const d=document.createElement('span');
    d.className='dot'; d.id='trc_dot-'+i;
    d.addEventListener('click', ()=>{ _trcHole=i; trcUpdateView(); });
    row.appendChild(d);
  }
}

function trcUpdateView() {
  const h=_trcHole, n=trcTotal();
  const team=(_trFlow.team&&_trFlow.team.name)||'team';
  const set=(id,v)=>{const e=document.getElementById(id); if(e)e.textContent=v;};
  set('trc_holeTitle','Hole '+(h+1)+' / '+n);
  set('trc_holePar','Par '+trcPar(h));
  set('trc_holeSI', trcSILabel(trcSI(h)));
  const sc=_trcScores[h];
  set('trc_scoreDisplay', sc!=null?sc:'\u2013');
  set('trc_numpadContext', team+' · hole '+(h+1)+' · par '+trcPar(h));
  document.querySelectorAll('#trc_dotRow .dot').forEach((d,i)=>{
    d.className='dot';
    if(i===h) d.classList.add('active');
    else if(_trcScores[i]!=null) d.classList.add('scored');
  });
  trcUpdateStats();
  if (typeof soloUpdateHole === 'function') soloUpdateHole();   // Solo: strokes + net/points (hidden for team rounds)
}

function trcUpdateStats() {
  if (typeof soloUpdateStats === 'function' && soloUpdateStats()) return;   // Solo: gross/net/points
  const n=trcTotal();
  const played=_trcScores.filter(s=>s!=null);
  const gross=played.reduce((a,b)=>a+b,0);
  const parP=(_trFlow.course.parPerHole||[]).filter((_,i)=>_trcScores[i]!=null).reduce((a,b)=>a+b,0);
  const vs=gross-parP;
  const set=(id,v)=>{const e=document.getElementById(id); if(e)e.textContent=v;};
  set('trc_statGross', played.length?gross:'\u2013');
  set('trc_statPar', played.length?parP:'\u2013');
  set('trc_statVsPar', played.length?(vs>0?'+'+vs:vs):'\u2013');
  set('trc_statHoles', (_trcHole+1)+' / '+n);
}

function trcInit(scr) {
  trcBuildDots();
  // reset the save button label (may have been left as ⏳ after a prior save)
  const sb=scr.querySelector('.save-round-btn'); if(sb) sb.textContent='SAVE ROUND';
  // course context line
  const c=_trFlow.course||{};
  const cc=scr.querySelector('.context-course'); if(cc) cc.textContent=c.name||'Course';
  const cm=scr.querySelector('.context-meta');
  if(cm){
    const res=(typeof trCalcTeam==='function')?trCalcTeam():null;
    const thcp=(res&&res.teamHcp!=null)?(' · Team HCP '+res.teamHcp):'';
    cm.textContent=(c._playedLoopName||'')+' · Par '+(c.par||'–')+thcp;
  }
  if (typeof soloDecorate === 'function') soloDecorate(scr);   // Solo header + stat labels (restores team labels otherwise)
  if (scr._scWired) { trcUpdateView(); return; }

  document.getElementById('trc_prevHole').addEventListener('click', ()=>{ if(_trcHole>0){_trcHole--;trcUpdateView();} });
  document.getElementById('trc_nextHole').addEventListener('click', ()=>{ if(_trcHole<trcTotal()-1){_trcHole++;trcUpdateView();} });
  document.getElementById('trc_scoreArea').addEventListener('click', ()=>{
    _trcBuf=_trcScores[_trcHole]!=null?String(_trcScores[_trcHole]):'';
    document.getElementById('trc_numpadDisplay').textContent=_trcBuf||'\u2013';
    document.getElementById('trc_numpad').classList.add('open');
  });
  scr.querySelectorAll('.num-btn[data-val]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const next=(_trcBuf+btn.dataset.val).slice(-2);
      if(parseInt(next)>20) return;
      _trcBuf=next; document.getElementById('trc_numpadDisplay').textContent=_trcBuf||'\u2013';
    });
  });
  document.getElementById('trc_delBtn').addEventListener('click', ()=>{
    _trcBuf=_trcBuf.slice(0,-1); document.getElementById('trc_numpadDisplay').textContent=_trcBuf||'\u2013';
  });
  document.getElementById('trc_numpadOk').addEventListener('click', ()=>{
    if(_trcBuf!=='' && typeof soloScoreOk==='function' && !soloScoreOk(parseInt(_trcBuf))) return;   // Solo stroke play: 0 not allowed
    if(_trcBuf!==''){ _trcScores[_trcHole]=parseInt(_trcBuf); if(_trcHole<trcTotal()-1)_trcHole++; }
    document.getElementById('trc_numpad').classList.remove('open');
    _trcBuf=''; trcUpdateView();
  });
  // All-holes button -> full scorecard
  const allBtn=scr.querySelector('.all-holes-btn');
  if(allBtn) allBtn.addEventListener('click', ()=>showScreen('trfull'));
  // Save round button
  const saveBtn=scr.querySelector('.save-round-btn');
  if(saveBtn) saveBtn.addEventListener('click', trcSaveRound);

  scr._scWired=true;
  trcUpdateView();
}

// ── Screen 13: Full Scorecard table ──
function trcRenderFull(scr) {
  if (typeof soloRenderFull === 'function' && soloRenderFull(scr)) return;   // Solo card (restores team header otherwise)
  const c=_trFlow.course||{}, n=trcTotal();
  const cn=scr.querySelector('.course-name'); if(cn) cn.textContent=c.name||'Course';
  const cm=scr.querySelector('.course-meta'); if(cm) cm.textContent=(c._playedLoopName?c._playedLoopName+' · ':'')+'Par '+(c.par||'–');
  const tbody=scr.querySelector('.sc-table tbody');
  if(!tbody) return;
  let rows='', totPar=0, totScore=0, anyScore=false, playedCount=0, parPlayed=0;
  for(let i=0;i<n;i++){
    const par=trcPar(i), si=trcSI(i), sc=_trcScores[i];
    totPar+=par;
    let scCell='\u2013';
    if(sc!=null){ totScore+=sc; anyScore=true; playedCount++; parPlayed+=par; scCell = (sc>par)?'<span class="over-par">'+sc+'</span>':(sc<par?'<span class="under-par">'+sc+'</span>':sc); }
    rows+='<tr><td>'+(i+1)+'</td><td>'+par+'</td><td>'+scCell+'</td><td><span class="si-badge '+trcSIClass(si)+'">'+si+'</span></td></tr>';
  }
  // Footer SCORE row: vs-par is against PLAYED holes' par, not the whole course.
  const vs=totScore-parPlayed;
  const totScoreCell = anyScore ? (vs>0?'<span class="over-par">'+totScore+'</span>':(vs<0?'<span class="under-par">'+totScore+'</span>':totScore)) : '\u2013';
  rows+='<tr><td>SCORE</td><td>'+totPar+'</td><td>'+totScoreCell+'</td><td>\u2013</td></tr>';
  tbody.innerHTML=rows;

  // Update the top stats bar from real data. Previously this bar was never
  // refreshed, so it showed the hardcoded HTML placeholders (37 / 34 / +3 / 9-of-9)
  // even on an empty round — the "+3 with no scores" bug.
  const cells = scr.querySelectorAll('.stats-bar .stat-value');
  if (cells.length >= 4) {
    cells[0].textContent = anyScore ? totScore : '\u2013';                 // Gross
    cells[1].textContent = anyScore ? parPlayed : '\u2013';                // Par Played
    const vsEl = cells[2];                                                 // vs Par
    vsEl.textContent = anyScore ? (vs>0?'+'+vs:(vs===0?'E':vs)) : '\u2013';
    vsEl.className = 'stat-value' + (anyScore ? (vs>0?' positive':(vs<0?' negative':'')) : '');
    cells[3].textContent = playedCount + ' / ' + n;                        // Holes
  }
}

// ── Save the completed round (Firestore + Home list) ──
async function trcSaveRound() {
  if (typeof soloOn === 'function' && soloOn()) return soloSaveRound();   // Solo round document
  const c=_trFlow.course||{}, n=trcTotal();
  const played=_trcScores.filter(s=>s!=null);
  if(played.length<n){
    if(typeof showToast==='function') showToast('Enter all '+n+' hole scores first'); return;
  }
  const uid = window._fbAuth && window._fbAuth.currentUser ? window._fbAuth.currentUser.uid : null;
  if(!uid){ if(typeof showToast==='function') showToast('Please sign in to save the round.','error'); return; }
  const res=(typeof trCalcTeam==='function')?trCalcTeam():null;
  const gross=played.reduce((a,b)=>a+b,0);
  const totalPar=(c.parPerHole||[]).reduce((a,b)=>a+(b||0),0);
  const vsPar=gross-totalPar;
  const round={
    id: Date.now().toString(),
    isMatch: false,
    courseName: c.name||'',
    loopName: c._playedLoopName||c.name||'',
    teamName: (_trFlow.team&&_trFlow.team.name)||'My Team',
    teamHcp: res?res.teamHcp:null,
    holes: n, holesPlayed: played.length,
    par: (c.parPerHole||[]).slice(),
    index: (c.indexPerHole||[]).slice(),
    scores: _trcScores.slice(),
    format: (typeof trFormatLabel==='function')?trFormatLabel():'',
    rating: c.rating||null, slope: c.slope||null,
    players: (_trFlow.team&&_trFlow.team.players)?_trFlow.team.players.map(p=>({name:p.name,hcp:p.hcp,teeKey:p.teeKey})):[],
    totalPar, gross, vsPar,
    playedAt: new Date().toISOString(),
  };
  const saveBtn=document.querySelector('#screen-trscore .save-round-btn');
  if(saveBtn) saveBtn.textContent='\u23f3';
  try {
    await window._fbDb.collection('users').doc(uid).collection('rounds').doc(round.id).set(round);
    _savedRounds.unshift(round);
    if(typeof renderMyData==='function') renderMyData();
    if(saveBtn) saveBtn.textContent='\u2713 Saved';
    if(typeof showToast==='function') showToast('Round saved \u2014 '+(vsPar>=0?'+':'')+vsPar+' vs par','success');
    _scRoundSaved = true; _pausedRound = null;
    if (typeof hidePausedRoundBanner === 'function') hidePausedRoundBanner();
    if (typeof clearPausedRoundFromCloud === 'function') clearPausedRoundFromCloud();
    showScreen('home');
  } catch(e){
    if(saveBtn) saveBtn.textContent='Save Round';
    if(typeof showToast==='function') showToast('Could not save: '+(e&&e.message||e),'error');
  }
}

function screenBack() {
  // Anchor to the screen actually on display (the stack top can drift out of sync,
  // which is what caused needing two taps). Drop every stack entry for the current
  // screen, then show the first screen beneath it that's different.
  var cur = (typeof _activeScreenId === 'function')
    ? _activeScreenId()
    : (_screenStack.length ? _screenStack[_screenStack.length - 1] : null);
  while (_screenStack.length && _screenStack[_screenStack.length - 1] === cur) _screenStack.pop();
  var target = _screenStack.length ? _screenStack[_screenStack.length - 1] : 'home';
  if (!target || target === cur) target = 'home';
  showScreen(target, { replace: true });
}

// NEW-UI: Choose Game card actions -> existing engine entry points
function cgTeamRound() {
  // NEW-UI: launch the redesigned Team Round flow (Screen 04+)
  // Explicit reset — without this, a _gameMode left over from a prior
  // Team Match in the same session causes TR to incorrectly branch into
  // TM's opponent-team screen at the trtee step (see the fromId==='trtee'
  // branch below).
  _gameMode = 'single';
  if (typeof trStart === 'function') { trStart(); return; }
  // fallback to legacy match setup if flow not present
  if (typeof setGameMode === 'function') setGameMode('single');
  _gameMode = 'single';
  if (typeof openMatchSetup === 'function') openMatchSetup(true);
}
function cgTeamMatch() {
  // NEW-UI: Team Match reuses the redesigned Team Round setup screens
  // (trcourse → trloop → trparsi → trteam → trtee), then branches into the
  // TM-specific screens (tmopp → tmhcp → tmcode → tmscore/tmfull → tmsummary).
  _gameMode = 'match';
  if (typeof _tmFlow !== 'undefined') { _tmFlow.opponent = null; _tmFlow.matchData = null; }
  // Do NOT reset _tmInited here — re-running the screen inits would stack duplicate
  // event listeners on the persistent DOM. Instead, reset the opponent screen's state.
  var _tmoppEl = document.getElementById('screen-tmopp');
  if (_tmoppEl && typeof _tmoppEl._tmoppReset === 'function') _tmoppEl._tmoppReset();
  window._trbEditingId = null;   // fresh match → not editing a saved team
  if (typeof trStart === 'function') { trStart(); _gameMode = 'match'; return; }
  // legacy fallback only if the redesigned flow is unavailable
  if (typeof openMatchSetup === 'function') openMatchSetup(true);
}

function switchTab(tab) {
  _activeTab = tab;
  const pages = document.getElementById('tabPages');
  pages.classList.toggle('show-mydata', tab === 'mydata');
  document.getElementById('tabBtnCalc').classList.toggle('active',   tab === 'calc');
  document.getElementById('tabBtnMyData').classList.toggle('active', tab === 'mydata');
  // Hide calculate button on My Data tab
  document.querySelector('.calc-wrap').classList.toggle('hidden', tab === 'mydata');
  if (tab === 'mydata') renderMyData();
}

// Swipe detection
(function() {
  let sx = 0, sy = 0, moved = false;
  document.addEventListener('touchstart', e => {
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    moved = false;
  }, { passive: true });
  document.addEventListener('touchend', e => {
    if (moved) return;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      // Only swipe if not inside a results or scorecard overlay
      if (document.getElementById('resultsOverlay').classList.contains('open')) return;
      if (document.getElementById('scorecardOverlay').classList.contains('open')) return;
      if (document.getElementById('roundViewOverlay').classList.contains('open')) return;
      if (dx < 0 && _activeTab === 'calc')   switchTab('mydata');
      if (dx > 0 && _activeTab === 'mydata') switchTab('calc');
    }
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    const dx = Math.abs(e.touches[0].clientX - sx);
    const dy = Math.abs(e.touches[0].clientY - sy);
    if (dx > 8) moved = true; // suppress accidental swipe on vertical scroll
  }, { passive: true });
})();

// ═══════════════════════════════════
// HELPERS
// ═══════════════════════════════════
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast show ' + (type||'error');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 3000);
}
function val(id)      { return document.getElementById(id)?.value?.trim() || ''; }
function numVal(id)   { return parseFloat(document.getElementById(id)?.value); }
function radio(name)  { return document.querySelector(`input[name="${name}"]:checked`)?.value; }
function setVal(id,v) { const el = document.getElementById(id); if (el) el.value = (v ?? ''); }
function setRadio(name,v) { const el = document.querySelector(`input[name="${name}"][value="${v}"]`); if (el) el.checked = true; }

// ═══════════════════════════════════
// HOLES TOGGLE
// ═══════════════════════════════════
function setHoles(n) {
  _holes = n;
  document.getElementById('btn9holes').classList.toggle('active',  n === 9);
  document.getElementById('btn18holes').classList.toggle('active', n === 18);
  document.getElementById('holesNote').classList.toggle('visible', n === 9);
  const parEl  = document.getElementById('course_par');
  const hintEl = document.getElementById('parHint');
  const t1par  = document.getElementById('tee1_par');
  const t3par  = document.getElementById('tee3_par');
  if (n === 9) {
    parEl.placeholder = '36'; if (t1par) t1par.placeholder = '36'; t3par.placeholder = '36';
    hintEl.textContent = 'Typical 9-hole par: 35 or 36';
  } else {
    parEl.placeholder = '72'; if (t1par) t1par.placeholder = '72'; t3par.placeholder = '72';
    hintEl.textContent = '';
  }
}

// ═══════════════════════════════════
// GAME MODE
// ═══════════════════════════════════
function setGameMode(mode) {
  if (mode === 'match') {
    openMatchGate();
    return;
  }
  _gameMode = mode;
  document.getElementById('modeSingle').classList.toggle('active', mode === 'single');
  document.getElementById('modeMatch').classList.toggle('active',  mode === 'match');
  const opp = document.getElementById('opponentSection');
  if (opp) opp.style.display = mode === 'match' ? '' : 'none';
}

// ═══════════════════════════════════
// MATCH GATE
// ═══════════════════════════════════
function openMatchGate() {
  const el = document.getElementById('matchGateOverlay');
  el.style.display = '';
  requestAnimationFrame(() => el.classList.add('open'));
}

function closeMatchGate(keepActive) {
  const el = document.getElementById('matchGateOverlay');
  el.classList.remove('open');
  setTimeout(() => { el.style.display = 'none'; }, 350);
  // Only reset mode buttons when fully cancelling — not when navigating to setup
  if (!keepActive) {
    document.getElementById('modeMatch').classList.remove('active');
    document.getElementById('modeSingle').classList.add('active');
  }
}

// ═══════════════════════════════════
// JOIN MATCH
// ═══════════════════════════════════
let _joinMatchData = null;

function openJoinMatch() {
  closeMatchGate(true); // keepActive — stay in match mode

  // Reset state
  _joinMatchData = null;
  document.getElementById('joinCodeInput').value = '';
  document.getElementById('joinLookupBtn').disabled = true;
  document.getElementById('joinCodeError').style.display = 'none';
  document.getElementById('joinStep1').style.display = '';
  document.getElementById('joinStep2').style.display = 'none';
  if(typeof joinSyncBoxesFromInput==='function') joinSyncBoxesFromInput();

  // Check for ?join=CODE in URL (QR code scan entry point)
  const urlParams = new URLSearchParams(window.location.search);
  const codeFromUrl = urlParams.get('join');
  if (codeFromUrl) {
    document.getElementById('joinCodeInput').value = codeFromUrl.toUpperCase();
    document.getElementById('joinLookupBtn').disabled = false;
    if(typeof joinSyncBoxesFromInput==='function') joinSyncBoxesFromInput();
  }

  const el = document.getElementById('joinMatchOverlay');
  el.style.display = '';
  requestAnimationFrame(() => el.classList.add('open'));
}

function closeJoinMatch() {
  const el = document.getElementById('joinMatchOverlay');
  el.classList.remove('open');
  setTimeout(() => { el.style.display = 'none'; }, 350);
  document.getElementById('modeMatch').classList.remove('active');
  document.getElementById('modeSingle').classList.add('active');
  // Clean URL if came via QR
  if (window.location.search.includes('join=')) {
    history.replaceState({}, '', window.location.pathname);
  }
}

function joinCodeTyped(input) {
  input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  document.getElementById('joinLookupBtn').disabled = input.value.length < 5;
  document.getElementById('joinCodeError').style.display = 'none';
}

// ── Join Match: 5-box code entry (mirrors into the hidden joinCodeInput) ──
function joinBoxEls(){ return ['jc0','jc1','jc2','jc3','jc4'].map(function(id){return document.getElementById(id);}); }
function joinBoxSync(){
  var els=joinBoxEls();
  var v=els.map(function(b){ return (b&&b.value||'').toUpperCase(); }).join('');
  els.forEach(function(b){ if(b) b.classList.toggle('filled', !!b.value); });
  var hid=document.getElementById('joinCodeInput');
  if(hid){ hid.value=v; if(typeof joinCodeTyped==='function') joinCodeTyped(hid); }
}
function joinBoxInput(i){
  var els=joinBoxEls(); var b=els[i]; if(!b) return;
  b.value=(b.value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,1);
  if(b.value && i<4 && els[i+1]) els[i+1].focus();
  joinBoxSync();
}
function joinBoxKey(e,i){
  var els=joinBoxEls();
  if(e.key==='Backspace' && !(els[i]&&els[i].value) && i>0 && els[i-1]){ els[i-1].focus(); els[i-1].value=''; joinBoxSync(); e.preventDefault(); }
  else if(e.key==='Enter'){ var hid=document.getElementById('joinCodeInput'); if(hid && hid.value.length>=5 && typeof joinLookupCode==='function') joinLookupCode(); }
}
function joinBoxPaste(e){
  if(e.preventDefault) e.preventDefault();
  var txt=((((e.clipboardData||window.clipboardData)||{}).getData ? (e.clipboardData||window.clipboardData).getData('text') : '')||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5);
  var els=joinBoxEls();
  for(var i=0;i<5;i++){ if(els[i]) els[i].value=txt[i]||''; }
  joinBoxSync();
  var n=Math.min(txt.length,4); if(els[n]) els[n].focus();
}
function joinSyncBoxesFromInput(){
  var hid=document.getElementById('joinCodeInput'); var v=((hid&&hid.value)||'').toUpperCase();
  var els=joinBoxEls();
  for(var i=0;i<5;i++){ if(els[i]){ els[i].value=v[i]||''; els[i].classList.toggle('filled', !!v[i]); } }
}

async function joinLookupCode() {
  const code = document.getElementById('joinCodeInput').value.trim().toUpperCase();
  if (code.length < 5) return;

  const btn = document.getElementById('joinLookupBtn');
  btn.disabled = true;
  btn.textContent = 'Looking up…';

  const errorEl = document.getElementById('joinCodeError');
  errorEl.style.display = 'none';

  try {
    const snap = await window._fbDb.collection('matches').doc(code).get();

    if (!snap.exists) {
      errorEl.textContent = 'Match code not found. Please check and try again.';
      errorEl.style.display = '';
      btn.disabled = false;
      btn.textContent = 'Find Match →';
      return;
    }

    const data = snap.data();

    if (data.status !== 'waiting') {
      errorEl.textContent = 'This match has already started or is complete.';
      errorEl.style.display = '';
      btn.disabled = false;
      btn.textContent = 'Find Match →';
      return;
    }

    const uid = window._fbAuth?.currentUser?.uid;
    if (data.teamA.uid === uid) {
      errorEl.textContent = 'You cannot join your own match as the opponent.';
      errorEl.style.display = '';
      btn.disabled = false;
      btn.textContent = 'Find Match →';
      return;
    }

    if (data.teamB.uid !== null) {
      errorEl.textContent = 'This match already has two teams.';
      errorEl.style.display = '';
      btn.disabled = false;
      btn.textContent = 'Find Match →';
      return;
    }

    // Match found — store and show confirmation
    _joinMatchData = data;
    joinShowConfirm(data);

  } catch (err) {
    console.error('joinLookupCode error:', err);
    errorEl.textContent = 'Could not look up match. Please check your connection.';
    errorEl.style.display = '';
    btn.disabled = false;
    btn.textContent = 'Find Match →';
  }
}

function joinShowConfirm(data) {
  // Build tee label lookup from match tees if available
  const courseTees = data.tees || [];
  function teeLabel(teeVal) {
    const legacyMap = { champ:'Championship', main:'Standard', fwd:'Forward' };
    if (typeof teeVal === 'string' && legacyMap[teeVal]) return legacyMap[teeVal];
    const idx = parseInt(teeVal);
    if (!isNaN(idx) && courseTees[idx]) return courseTees[idx].label;
    return teeVal ?? 'Standard';
  }

  // Resolve a player's tee: host stores teeKey (label-based, e.g. 'medal'); older data
  // uses a numeric tee index or a legacy key. Return the matching courseTees index / label.
  function teeIndexFor(p){
    if (p && p.teeKey != null && courseTees.length){
      const k = String(p.teeKey).toLowerCase();
      const idx = courseTees.findIndex(t => {
        const lbl = (t.label||'').toLowerCase();
        return lbl.includes(k) || lbl.slice(0,4) === k.slice(0,4);
      });
      if (idx >= 0) return idx;
    }
    const ti = parseInt(p && p.tee);
    return isNaN(ti) ? 0 : ti;
  }
  function teeLabelFor(p){
    if (p && p.teeKey != null && courseTees.length){
      const k = String(p.teeKey).toLowerCase();
      const t = courseTees.find(t => (t.label||'').toLowerCase().includes(k));
      if (t) return t.label;
    }
    return teeLabel(p && p.tee);
  }

  // Opponent card — show ALL players, handle both hcpIndex and hcp field names
  const oppPlayers = data.teamA.players || [];
  const oppRows = oppPlayers.map(p => {
    const hcp = p.hcpIndex ?? p.hcp ?? '—';
    return `<div class="join-confirm-row"><span>${esc(p.name || '—')}</span><span>${hcp} · ${teeLabelFor(p)}</span></div>`;
  }).join('');

  // Format label
  const fmtMap = {
    '35_15':'35% / 15%', '25_20':'25% / 20%', '20_15':'20% / 15%', '50_50':'50% / 50%',
    '30_20_10':'30% / 20% / 10%', '20_15_10':'20% / 15% / 10%', '15_12_10':'15% / 12% / 10%',
    '25_20_15_10':'25% / 20% / 15% / 10%', '20_15_10_5':'20% / 15% / 10% / 5%', '15_12_10_7':'15% / 12% / 10% / 7%'
  };
  const fmtLabel = data.format ? (fmtMap[data.format] || data.format) : '—';

  // Match Summary — design-aligned cards (host set both teams when creating the match)
  const oppPlayerCards = oppPlayers.map((p,i)=>{
    const hcp = p.hcpIndex ?? p.hcp ?? '—';
    return '<div class="js2-player"><span class="js2-pchip">'+(i+1)+'</span><span class="js2-pname">'+esc(p.name||'—')+'</span><span class="js2-phcp">HCP '+hcp+'</span></div>';
  }).join('');
  const loopName = (data.course && (data.course._playedLoopName || data.course.name)) || '—';
  document.getElementById('joinConfirmContent').innerHTML =
    '<div class="js2-card">'+
      '<div class="js2-card-hdr">'+t('js2_opponent')+'</div>'+
      '<div class="js2-teamname">'+esc(data.teamA.teamName||'—')+'</div>'+
      oppPlayerCards+
      '<div class="js2-thcp-row"><span class="js2-thcp-lbl">'+t('js2_teamhcp')+'</span><span class="js2-thcp-badge">'+(data.teamA.teamHcp ?? '—')+'</span></div>'+
    '</div>'+
    '<div class="js2-card">'+
      '<div class="js2-card-hdr">'+t('js2_courseformat')+'</div>'+
      '<div class="js2-kv"><span class="k">'+t('js2_course')+'</span><span class="v">'+esc(data.course.name)+'</span></div>'+
      '<div class="js2-kv"><span class="k">'+t('js2_loop')+'</span><span class="v">'+esc(loopName)+' ('+data.holes+')</span></div>'+
      '<div class="js2-kv"><span class="k">'+t('js2_holes')+'</span><span class="v">'+data.holes+' '+t('js2_holes').toLowerCase()+'</span></div>'+
      '<div class="js2-kv"><span class="k">'+t('js2_format')+'</span><span class="v">'+fmtLabel+'</span></div>'+
    '</div>';
  var _cb=document.getElementById('js2_code'); if(_cb) _cb.textContent = data.matchId || (_joinMatchData&&_joinMatchData.matchId) || '—';

  // Build dynamic Your Team fields — use teamType to determine player count
  const teamBPlayers = data.teamB.players || [];
  const teamType    = data.teamB.teamType || data.teamType || '2P';
  const expectedCount = teamType === '4P' ? 4 : teamType === '3P' ? 3 : 2;
  const playerCount   = Math.max(expectedCount, teamBPlayers.length, 2);

  let teamFieldsHtml = `<div class="field"><label>Team Name</label><input type="text" id="join_t2_name" placeholder="Your team name" value="${esc(data.teamB.teamName || '')}"></div>`;

  for (let pi = 1; pi <= playerCount; pi++) {
    const p      = teamBPlayers[pi - 1] || {};
    const req    = pi <= 2 ? `<span style="color:var(--gold)">*</span>` : '';
    const hcpVal = p.hcpIndex ?? p.hcp ?? '';
    const teePills = courseTees.length > 0
      ? courseTees.map((t, i) => `<div class="tee-pill"><input type="radio" name="join_t2p${pi}_tee" id="join_t2p${pi}_tee${i}" value="${i}" ${(teeIndexFor(p)===i)?'checked':''}><label for="join_t2p${pi}_tee${i}">${esc(t.label)}</label></div>`).join('')
      : `<div class="tee-pill t1"><input type="radio" name="join_t2p${pi}_tee" id="join_t2p${pi}_tee1" value="champ" ${p.tee==='champ'?'checked':''}><label for="join_t2p${pi}_tee1"><span class="dot" style="background:var(--tee1)"></span>Championship</label></div>
         <div class="tee-pill t2"><input type="radio" name="join_t2p${pi}_tee" id="join_t2p${pi}_tee2" value="main" ${(!p.tee||p.tee==='main')?'checked':''}><label for="join_t2p${pi}_tee2"><span class="dot" style="background:var(--tee2)"></span>Standard</label></div>
         <div class="tee-pill t3"><input type="radio" name="join_t2p${pi}_tee" id="join_t2p${pi}_tee3" value="fwd" ${p.tee==='fwd'?'checked':''}><label for="join_t2p${pi}_tee3"><span class="dot" style="background:var(--tee3)"></span>Forward</label></div>`;
    const gM = (!p.gender || p.gender === 'M') ? 'checked' : '';
    const gF = p.gender === 'F' ? 'checked' : '';
    teamFieldsHtml += `
      <div class="js2-player-sub">
      <div class="match-step-sublabel">Player ${pi}</div>
      <div class="field"><label>Name ${req}</label><input type="text" id="join_t2p${pi}_name" placeholder="${pi <= 2 ? 'Required' : 'Optional'}" value="${esc(p.name || '')}"></div>
      <div class="grid-2">
        <div class="field"><label>HCP Index</label><input type="number" id="join_t2p${pi}_hcp" placeholder="0–54" step="0.1" inputmode="decimal" value="${hcpVal}"></div>
        <div class="field"><label>Gender</label><div class="gender-pills">
          <div class="gender-pill"><input type="radio" name="join_t2p${pi}_g" id="join_t2p${pi}_gM" value="M" ${gM}><label for="join_t2p${pi}_gM">♂ M</label></div>
          <div class="gender-pill"><input type="radio" name="join_t2p${pi}_g" id="join_t2p${pi}_gF" value="F" ${gF}><label for="join_t2p${pi}_gF">♀ F</label></div>
        </div></div>
      </div>
      <div class="field"><label>Tee</label><div class="tee-pills">${teePills}</div></div>
      </div>`;
  }

  var _jtf=document.getElementById('joinTeamFields'); if(_jtf) _jtf.innerHTML = teamFieldsHtml;
  document.getElementById('joinStep1').style.display = 'none';
  document.getElementById('joinStep2').style.display = '';
  document.getElementById('joinMatchOverlay').scrollTop = 0;
  document.getElementById('joinLookupBtn').disabled = false;
  document.getElementById('joinLookupBtn').textContent = (typeof t==='function') ? t('join_find_btn') : 'Join Match';
}

// Recompute a team's handicap for a specific match's course, tees and format.
// Self-contained (no _trFlow dependency): only WHS indexes are trusted from any
// looked-up/edited team — course handicap and the team handicap are computed here.
function joinComputeTeamHcp(players, md) {
  const tees = (md && md.tees) || [];
  const courseObj = {
    name: (md && md.course && md.course.name) || 'Course',
    par:  (md && md.course && md.course.par) || 72,
    holes: (md && md.holes) || 18,
    tees: tees
  };
  const list = (players || []).filter(p => p && p.hcp != null && !isNaN(parseFloat(p.hcp)));
  if (!list.length) return { players: [], teamHcp: 0 };
  list.forEach(p => {
    const ti   = (p.teeIndex != null) ? p.teeIndex : 0;
    const tee  = tees[ti] || tees[0] || null;
    const rating = tee ? Number(tee.rating) : 0;
    const slope  = tee ? Number(tee.slope)  : 113;
    const par    = tee ? Number(tee.par)    : courseObj.par;
    const idx    = (typeof whsPlayIndex === 'function') ? whsPlayIndex(parseFloat(p.hcp), courseObj) : parseFloat(p.hcp);
    p.courseHcp  = (typeof getCH === 'function') ? getCH(idx, slope, rating, par) : parseFloat(p.hcp);
    p.chRounded  = Math.round(p.courseHcp);
  });
  const sorted = list.slice().sort((a,b) => a.courseHcp - b.courseHcp);
  const pcts = (typeof FORMATS !== 'undefined' && FORMATS[md && md.format]) ? FORMATS[md.format] : [0.35, 0.15];
  let total = 0;
  sorted.forEach((p,i) => { p.pct = pcts[Math.min(i, pcts.length-1)] || 0; total += p.courseHcp * p.pct; });
  return { players: sorted, teamHcp: Math.round(total) };
}

async function joinConfirm() {
  if (!_joinMatchData) return;

  const btn = document.getElementById('joinConfirmBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Joining…'; }

  const uid  = window._fbAuth?.currentUser?.uid;
  const code = _joinMatchData.matchId;

  // Read the joiner's verified/edited team from the form fields (#joinTeamFields)
  const courseTees = (_joinMatchData.tees) || [];
  const rawB     = _joinMatchData.teamB.players || [];
  const teamType = _joinMatchData.teamB.teamType || _joinMatchData.teamType || '2P';
  const expected = teamType === '4P' ? 4 : teamType === '3P' ? 3 : 2;
  const count    = Math.max(expected, rawB.length, 2);
  const gv = (id)=>{ const e=document.getElementById(id); return e ? e.value.trim() : ''; };
  const gr = (nm)=>{ const e=document.querySelector('input[name="'+nm+'"]:checked'); return e ? e.value : null; };

  const teamName = gv('join_t2_name') || _joinMatchData.teamB.teamName || 'Opponent';
  const players  = [];
  for (let pi = 1; pi <= count; pi++) {
    const nm     = gv('join_t2p'+pi+'_name');
    const hcpRaw = gv('join_t2p'+pi+'_hcp');
    if (!nm && hcpRaw === '') continue;                 // skip empty optional slots
    const tParsed = parseInt(gr('join_t2p'+pi+'_tee'));
    const ti      = isNaN(tParsed) ? 0 : tParsed;
    const g       = gr('join_t2p'+pi+'_g') || 'M';
    const teeLbl  = (courseTees[ti] && courseTees[ti].label) || 'Medal';
    players.push({ name:nm, hcp: (hcpRaw==='' ? null : parseFloat(hcpRaw)),
                   tee:String(ti), teeIndex:ti,
                   teeKey:String(teeLbl).toLowerCase().split(/\s+/)[0], gender:g });
  }

  // Validate: at least 2 players with a name and a valid handicap
  const valid = players.filter(p => p.name && p.hcp != null && !isNaN(p.hcp));
  if (valid.length < 2) {
    showToast('Enter a name and handicap for at least 2 players.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Open Scorecard →'; }
    return;
  }

  // Recompute the team handicap for THIS match's course / tees / format (WHS-correct).
  // Only the WHS indexes port from any looked-up team — the handicap is never reused.
  const recomputed = joinComputeTeamHcp(players, _joinMatchData);
  const teamHcp    = recomputed.teamHcp;

  try {
    await window._fbDb.collection('matches').doc(code).update({
      'teamB.uid':      uid,
      'teamB.teamName': teamName,
      'teamB.players':  players,
      'teamB.teamHcp':  teamHcp,
      status:           'active',
      startedAt:        Date.now()
    });

    window._activeMatchId   = code;
    window._activeMatchRole = 'B';

    showToast('Joined match successfully!', 'success');
    closeJoinMatch();

    // Fetch latest match data and open live scorecard for Team B
    const latestSnap = await window._fbDb.collection('matches').doc(code).get();
    if (latestSnap.exists) {
      openLiveScorecard(latestSnap.data(), 'B');
    }

  } catch (err) {
    console.error('joinConfirm error:', err);
    showToast('Failed to join match. Please try again.', 'error');
    btn.disabled = false;
    btn.textContent = 'Join & Start Scoring →';
  }
}

function joinScanQR() {
  showToast('Point your camera at the QR code to scan.', 'info');
  // Native camera handles QR scanning on mobile — user scans QR,
  // browser opens the join URL, openJoinMatch() reads ?join= param automatically
}

// ═══════════════════════════════════
// MATCH SETUP
// ═══════════════════════════════════
let _msHoles = 9;
let _msMatchData = null;

function openMatchSetup(forceReset) {
  closeMatchGate(true);

  const shouldReset = forceReset || !_msPreserveData;
  _msPreserveData = false; // always clear the flag

  if (shouldReset) {
    _msHoles = 9;
    _msMatchData = null;
    window._msParValues   = null;
    window._msIndexValues = null;

    // Show 9-hole fields, hide 18-hole fields
    const f9  = document.getElementById('ms9holeFields');
    const f18 = document.getElementById('ms18holeFields');
    if (f9)  f9.style.display  = '';
    if (f18) f18.style.display = 'none';
    document.getElementById('ms_btn9').classList.add('active');
    document.getElementById('ms_btn18').classList.remove('active');

    // Pre-fill from calculator
    const courseName = document.getElementById('course_name')?.value || '';
    const rating     = document.getElementById('course_rating')?.value || '';
    const slope      = document.getElementById('course_slope')?.value || '';
    if (courseName) document.getElementById('ms_course_name').value = courseName;
    if (rating)     document.getElementById('ms_rating').value = rating;
    if (slope)      document.getElementById('ms_slope').value = slope;

    const t1name = document.getElementById('team1_name')?.value || '';
    const t1p1   = document.getElementById('t1p1_name')?.value || '';
    const t1p1h  = document.getElementById('t1p1_hcp')?.value || '';
    const t1p2   = document.getElementById('t1p2_name')?.value || '';
    const t1p2h  = document.getElementById('t1p2_hcp')?.value || '';
    if (t1name) document.getElementById('ms_t1_name').value = t1name;
    if (t1p1)   document.getElementById('ms_t1p1_name').value = t1p1;
    if (t1p1h)  document.getElementById('ms_t1p1_hcp').value = t1p1h;
    if (t1p2)   document.getElementById('ms_t1p2_name').value = t1p2;
    if (t1p2h)  document.getElementById('ms_t1p2_hcp').value = t1p2h;

    const t2name = document.getElementById('team2_name')?.value || '';
    const t2p1   = document.getElementById('t2p1_name')?.value || '';
    const t2p1h  = document.getElementById('t2p1_hcp')?.value || '';
    const t2p2   = document.getElementById('t2p2_name')?.value || '';
    const t2p2h  = document.getElementById('t2p2_hcp')?.value || '';
    if (t2name) document.getElementById('ms_t2_name').value = t2name;
    if (t2p1)   document.getElementById('ms_t2p1_name').value = t2p1;
    if (t2p1h)  document.getElementById('ms_t2p1_hcp').value = t2p1h;
    if (t2p2)   document.getElementById('ms_t2p2_name').value = t2p2;
    if (t2p2h)  document.getElementById('ms_t2p2_hcp').value = t2p2h;
  }

  msGoToStep(1);
  // Hide extra player slots and reset format picker
  _msT1Count = 2; _msT2Count = 2;
  ['ms_t1p3_wrap','ms_t1p4_wrap','ms_t2p3_wrap','ms_t2p4_wrap'].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = 'none';
  });
  msUpdateTeamControls('t1');
  msUpdateTeamControls('t2');
  msUpdateFormatForTeamType('2P');
  msUpdateTeePills(); // ensure correct tee options from the start
  setTimeout(() => msRenderParGrid(), 50);

  const el = document.getElementById('matchSetupOverlay');
  el.style.display = '';
  requestAnimationFrame(() => el.classList.add('open'));
}

function closeMatchSetup() {
  const el = document.getElementById('matchSetupOverlay');
  el.classList.remove('open');
  setTimeout(() => {
    el.style.display = 'none';
    // Full reset of state on explicit close
    _msHoles = 9;
    _msMatchData = null;
    window._msParValues   = null;
    window._msIndexValues = null;
  }, 350);
  document.getElementById('modeMatch').classList.remove('active');
  document.getElementById('modeSingle').classList.add('active');
}

let _msPreserveData = false; // true when returning to gate from step 1

function matchSetupBack() {
  let current = 1;
  for (let i = 4; i >= 1; i--) {
    const el = document.getElementById('msStep' + i);
    if (el && el.style.display !== 'none') { current = i; break; }
  }

  if (current === 1) {
    // Close setup but preserve all entered data
    _msPreserveData = true;
    const el = document.getElementById('matchSetupOverlay');
    el.classList.remove('open');
    setTimeout(() => { el.style.display = 'none'; }, 350);
    // Show gate
    openMatchGate();
  } else {
    msGoToStep(current - 1);
  }
}

function msSetHoles(n) {
  _msHoles = n;
  document.getElementById('ms_btn9').classList.toggle('active', n === 9);
  document.getElementById('ms_btn18').classList.toggle('active', n === 18);
  const f9 = document.getElementById('ms9holeFields');
  const f18 = document.getElementById('ms18holeFields');
  if (f9)  f9.style.display  = n === 9  ? '' : 'none';
  if (f18) f18.style.display = n === 18 ? '' : 'none';
  window._msParValues   = null;
  window._msIndexValues = null;
  msRenderParGrid();
}

function msUpdateParGrid() {
  msRenderParGrid();
}

function msUpdateCombinedPar() {
  const fp = parseInt(document.getElementById('ms_front_par')?.value || '0');
  const bp = parseInt(document.getElementById('ms_back_par')?.value  || '0');
  const total = (isNaN(fp) ? 0 : fp) + (isNaN(bp) ? 0 : bp);
  const el = document.getElementById('msCombinedParTotal');
  if (el) el.textContent = total > 0 ? total : '—';
}

function msResetStep1() {
  // Reset course name + fields
  ['ms_course_name','ms_rating','ms_slope','ms_par',
   'ms_front_name','ms_front_rating','ms_front_slope','ms_front_par',
   'ms_back_name','ms_back_rating','ms_back_slope','ms_back_par',
   'ms_combined_rating','ms_combined_slope'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const cpEl = document.getElementById('msCombinedParTotal');
  if (cpEl) cpEl.textContent = '—';
  // Reset to 9 holes
  _msHoles = 9;
  document.getElementById('ms_btn9').classList.add('active');
  document.getElementById('ms_btn18').classList.remove('active');
  const f9  = document.getElementById('ms9holeFields');
  const f18 = document.getElementById('ms18holeFields');
  if (f9)  f9.style.display  = '';
  if (f18) f18.style.display = 'none';
  // Reset grids
  window._msParValues       = null;
  window._msIndexValues     = null;
  window._msFrontParValues  = null;
  window._msFrontIndexValues= null;
  window._msBackParValues   = null;
  window._msBackIndexValues = null;
  _msCourseTees = [];
  msRenderParGrid();
  showToast('Course fields reset.', 'info');
}

function msRenderParGrid(gridId, parValues, indexValues, n) {
  // Defaults for match setup use
  gridId     = gridId     || 'msParGrid';
  n          = n          || _msHoles;
  parValues  = parValues  || window._msParValues;
  indexValues= indexValues|| window._msIndexValues;

  const totalParEl = gridId === 'msParGrid'
    ? document.getElementById('ms_par')
    : document.getElementById('ec_par');
  const totalPar = parseInt(totalParEl?.value || '0');
  // Only use totalPar if it's reasonable for the number of holes
  const minPar = n * 3;
  const maxPar = n * 5;
  const validPar = !isNaN(totalPar) && totalPar >= minPar && totalPar <= maxPar;
  const basePar  = validPar ? Math.round(totalPar / n) : 4;

  // Init par
  if (!parValues || parValues.length !== n) {
    parValues = Array(n).fill(basePar);
  } else if (!isNaN(totalPar) && totalPar > 0) {
    const allSame = parValues.every(v => v === parValues[0]);
    if (allSame) parValues = Array(n).fill(basePar);
  }

  // Init index — default sequential 1..n
  if (!indexValues || indexValues.length !== n) {
    indexValues = Array.from({length: n}, (_, i) => i + 1);
  }

  // Store back to correct source
  if (gridId === 'msParGrid') {
    window._msParValues   = parValues;
    window._msIndexValues = indexValues;
  } else {
    window._ecParValues   = parValues;
    window._ecIndexValues = indexValues;
  }

  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.style.gridTemplateColumns = `repeat(9, 1fr)`;

  const totalId = gridId === 'msParGrid' ? 'msParGridTotal' : 'ecParGridTotal';

  grid.innerHTML = Array.from({length: n}, (_, i) => {
    const p   = parValues[i];
    const idx = indexValues[i];
    const pfx = gridId === 'msParGrid' ? 'ms' : 'ec';
    return `
      <div class="ms-par-hole">
        <div class="ms-par-hole-num">${i + 1}</div>
        <div class="ms-par-btn-group">
          ${[3,4,5].map(v => `<button class="ms-par-btn${p===v?' active':''}" onclick="${pfx}SetHolePar(${i},${v},'${gridId}')">${v}</button>`).join('')}
        </div>
        <div class="ms-par-index-label">SI</div>
        <span class="ms-par-si-badge" id="si_badge_${gridId}_${i}"
          onclick="openSiEditor(${i},'${gridId}')">${idx}</span>
      </div>`;
  }).join('');

  // Update total
  const total = parValues.reduce((a, b) => a + b, 0);
  const totalEl = document.getElementById(totalId);
  if (totalEl) totalEl.textContent = total > 0 ? total : '—';
}

function msSetHolePar(holeIdx, val, gridId) {
  const arr = gridId === 'ecParGrid' ? window._ecParValues : window._msParValues;
  if (!arr) return;
  arr[holeIdx] = val;
  const holes = document.getElementById(gridId)?.querySelectorAll('.ms-par-hole');
  if (holes?.[holeIdx]) {
    holes[holeIdx].querySelectorAll('.ms-par-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.textContent) === val);
    });
  }
  const total = arr.reduce((a, b) => a + b, 0);
  const totalId = gridId === 'ecParGrid' ? 'ecParGridTotal' : 'msParGridTotal';
  const totalEl = document.getElementById(totalId);
  if (totalEl) totalEl.textContent = total > 0 ? total : '—';
}
// Aliases for edit modal
function ecSetHolePar(holeIdx, val, gridId) { msSetHolePar(holeIdx, val, gridId); }

function msSetHoleIndex(holeIdx, val, gridId) {
  const arr = (gridId === 'ecParGrid') ? window._ecIndexValues : window._msIndexValues;
  if (!arr) return;
  arr[holeIdx] = parseInt(val) || holeIdx + 1;
}
function ecSetHoleIndex(holeIdx, val, gridId) { msSetHoleIndex(holeIdx, val, gridId); }

function msValidateIndex(holeIdx, input, gridId) {
  let v = parseInt(input.value);
  if (isNaN(v) || v < 1) v = 1;
  if (v > 18) v = 18;
  input.value = v;
  const arr = (gridId === 'ecParGrid') ? window._ecIndexValues : window._msIndexValues;
  if (arr) arr[holeIdx] = v;
}
function ecValidateIndex(holeIdx, input, gridId) { msValidateIndex(holeIdx, input, gridId); }

// ── SI TAP-TO-EDIT ─────────────────────────────────────────
let _siEditorHole   = -1;
let _siEditorGridId = '';

function openSiEditor(holeIdx, gridId) {
  _siEditorHole   = holeIdx;
  _siEditorGridId = gridId;

  const arr = gridId === 'ecParGrid' ? window._ecIndexValues : window._msIndexValues;
  const current = arr ? arr[holeIdx] : holeIdx + 1;

  document.getElementById('siEditorHoleNum').textContent = holeIdx + 1;
  const input = document.getElementById('siEditorInput');
  input.value = current;
  document.getElementById('siEditorPopup').style.display = 'flex';
  // Highlight badge
  const badge = document.getElementById(`si_badge_${gridId}_${holeIdx}`);
  if (badge) badge.classList.add('editing');
  // Focus input after animation
  setTimeout(() => { input.select(); input.focus(); }, 50);
}

function closeSiEditor() {
  document.getElementById('siEditorPopup').style.display = 'none';
  // Remove editing highlight
  if (_siEditorHole >= 0) {
    const badge = document.getElementById(`si_badge_${_siEditorGridId}_${_siEditorHole}`);
    if (badge) badge.classList.remove('editing');
  }
  _siEditorHole = -1;
}

function confirmSiEditor() {
  if (_siEditorHole < 0) return;
  let v = parseInt(document.getElementById('siEditorInput').value);
  if (isNaN(v) || v < 1) v = 1;
  if (v > 18) v = 18;

  // Write to correct index array based on which grid is being edited
  let arr;
  if (_siEditorGridId === 'ecParGrid')   arr = window._ecIndexValues;
  else if (_siEditorGridId === 'calcParGrid') {
    if (!_calcIndexValues) _calcIndexValues = Array.from({length: _holes}, (_, i) => i + 1);
    arr = _calcIndexValues;
  }
  else arr = window._msIndexValues;
  if (arr) arr[_siEditorHole] = v;

  // Update badge display
  const badge = document.getElementById(`si_badge_${_siEditorGridId}_${_siEditorHole}`);
  if (badge) { badge.textContent = v; badge.classList.remove('editing'); }

  closeSiEditor();
}

function msUpdateParTotal() {
  const total = (window._msParValues || []).reduce((a, b) => a + b, 0);
  const el = document.getElementById('msParGridTotal');
  if (el) el.textContent = total > 0 ? total : '—';
}

// ── MATCH SETUP: TEAM PICKER FROM MY SCRAMBLE ────────────────

function msToggleTeamPicker(team) {
  const pickerId = team === 't1' ? 'msTeamPickerT1' : 'msTeamPickerT2';
  const picker   = document.getElementById(pickerId);
  if (!picker) return;
  if (picker.style.display !== 'none') { picker.style.display = 'none'; return; }
  // Render the list
  if (_savedTeams.length === 0) {
    picker.innerHTML = `<div style="padding:12px;font-size:0.8rem;color:var(--muted);">No saved teams yet — save a team in the Calculator tab first.</div>`;
  } else {
    picker.innerHTML = _savedTeams.map(t => {
      const players = t.players && t.players.length
        ? t.players
        : [{ name: t.p1Name, hcp: t.p1Hcp }, { name: t.p2Name, hcp: t.p2Hcp }].filter(p => p.name);
      const meta = players.map(p => {
        const h = p.hcp != null && !isNaN(p.hcp) ? ` ${p.hcp}` : '';
        return esc(p.name) + (h ? `<strong>${h}</strong>` : '');
      }).join(' · ');
      const badge = t.teamType || (players.length + 'P');
      return `
        <div class="ms-team-load-item" onclick="msLoadTeamIntoSetup('${t.id}','${team}')">
          <div style="flex:1;">
            <div class="ms-team-load-name">${esc(t.teamName)} <span style="background:var(--green);color:#fff;font-size:0.55rem;padding:1px 6px;border-radius:8px;font-weight:700;margin-left:4px;">${badge}</span></div>
            <div class="ms-team-load-meta">${meta}</div>
          </div>
          <span style="color:var(--muted);font-size:1rem;">›</span>
        </div>`;
    }).join('');
  }
  picker.style.display = '';
}

function msLoadTeamIntoSetup(savedId, team) {
  const t = _savedTeams.find(x => x.id === savedId);
  if (!t) return;

  // Build full players list
  let players = t.players && t.players.length
    ? t.players.slice()
    : [{ name: t.p1Name, hcp: t.p1Hcp, gender: 'M', tee: 'main' },
       { name: t.p2Name, hcp: t.p2Hcp, gender: 'M', tee: 'main' }].filter(p => p.name);

  // For profile-sourced teams, inject owner as Player 1
  if (t.source === 'profile' && team === 't1' && _profile?.displayName) {
    const ownerEntry = {
      name:   _profile.displayName,
      hcp:    _profile.hcpIndex ?? null,
      gender: 'M',
      tee:    'main',
    };
    // Don't double-add if already present
    if (!players.find(p => p.name === _profile.displayName)) {
      players = [ownerEntry, ...players];
    }
  }

  const prefix = team === 't1' ? 'ms_t1' : 'ms_t2';

  // Determine player count from teamType (reliable) not players.length
  // Profile teams store buddies-only so players.length is 1 less than actual team size
  const teamType = t.teamType || '2P';
  const expectedCount = teamType === '4P' ? 4 : teamType === '3P' ? 3 : 2;
  const playerCount   = Math.max(expectedCount, Math.min(players.length, 4));

  // Show/hide extra player slots
  ['p3', 'p4'].forEach(p => {
    const wrap = document.getElementById(`ms_${team}${p}_wrap`);
    if (wrap) wrap.style.display = 'none';
  });
  if (playerCount >= 3) { const w = document.getElementById(`ms_${team}p3_wrap`); if (w) w.style.display = ''; }
  if (playerCount >= 4) { const w = document.getElementById(`ms_${team}p4_wrap`); if (w) w.style.display = ''; }

  // Set team name
  setVal(`${prefix}_name`, t.teamName);

  // Fill player slots
  for (let i = 0; i < playerCount; i++) {
    const p   = players[i];
    const pi  = i + 1;
    setVal(`${prefix}p${pi}_name`, p.name || '');
    setVal(`${prefix}p${pi}_hcp`,  p.hcp != null && !isNaN(p.hcp) ? p.hcp : '');
  }

  // Sync count state and update controls
  msSetCount(team, playerCount);
  msUpdateTeamControls(team);
  msUpdateFormatForTeamType(teamType);

  // Close picker
  const pickerId = team === 't1' ? 'msTeamPickerT1' : 'msTeamPickerT2';
  const picker   = document.getElementById(pickerId);
  if (picker) picker.style.display = 'none';

  showToast(`"${t.teamName}" loaded — ${playerCount} players`, 'success');
}

// ── MATCH SETUP: PLAYER COUNT CONTROLS ───────────────────────

function msGetCount(team) { return team === 't1' ? _msT1Count : _msT2Count; }
function msSetCount(team, n) { if (team === 't1') _msT1Count = n; else _msT2Count = n; }

function msUpdateTeamControls(team) {
  const count = msGetCount(team);
  // Show/hide extra player wraps
  const p3 = document.getElementById(`ms_${team}p3_wrap`);
  const p4 = document.getElementById(`ms_${team}p4_wrap`);
  if (p3) p3.style.display = count >= 3 ? '' : 'none';
  if (p4) p4.style.display = count >= 4 ? '' : 'none';
  // Update label + button states
  const label  = document.getElementById(`ms_${team}_count_label`);
  const addBtn = document.getElementById(`ms_${team}_add_btn`);
  const remBtn = document.getElementById(`ms_${team}_remove_btn`);
  if (label)  label.textContent = `${count} player${count > 1 ? 's' : ''}`;
  if (addBtn) addBtn.disabled = count >= 4;
  if (remBtn) remBtn.disabled = count <= 2;
  // Sync format picker to current max player count
  const maxCount = Math.max(_msT1Count, _msT2Count);
  const type = maxCount >= 4 ? '4P' : maxCount >= 3 ? '3P' : '2P';
  msUpdateFormatForTeamType(type);
}

function msAddPlayer(team) {
  const count = msGetCount(team);
  if (count >= 4) return;
  msSetCount(team, count + 1);
  msUpdateTeamControls(team);
  msUpdateTeePills(); // ensure new slot gets correct tee options
}

function msRemovePlayer(team) {
  const count = msGetCount(team);
  if (count <= 2) return;
  // Clear the removed player's fields
  const pi = count;
  const prefix = team === 't1' ? 'ms_t1' : 'ms_t2';
  const nameEl = document.getElementById(`${prefix}p${pi}_name`);
  const hcpEl  = document.getElementById(`${prefix}p${pi}_hcp`);
  if (nameEl) nameEl.value = '';
  if (hcpEl)  hcpEl.value  = '';
  msSetCount(team, count - 1);
  msUpdateTeamControls(team);
}

function msResetTeam(team) {
  const prefix = team === 't1' ? 'ms_t1' : 'ms_t2';
  // Clear all fields
  const nameEl = document.getElementById(`${prefix}_name`);
  if (nameEl) nameEl.value = '';
  for (let pi = 1; pi <= 4; pi++) {
    const n = document.getElementById(`${prefix}p${pi}_name`); if (n) n.value = '';
    const h = document.getElementById(`${prefix}p${pi}_hcp`);  if (h) h.value = '';
  }
  // Reset count to 2
  msSetCount(team, 2);
  msUpdateTeamControls(team);
  // Close picker if open
  const pickerId = team === 't1' ? 'msTeamPickerT1' : 'msTeamPickerT2';
  const picker   = document.getElementById(pickerId);
  if (picker) picker.style.display = 'none';
  showToast(`${team === 't1' ? 'Your' : 'Opponent'} team reset.`, 'info');
}

function msUpdateFormatForTeamType(teamType) {
  const f2 = document.getElementById('ms_fmt_2p');
  const f3 = document.getElementById('ms_fmt_3p');
  const f4 = document.getElementById('ms_fmt_4p');
  if (!f2) return;
  const is4 = teamType === '4P';
  const is3 = teamType === '3P';
  f2.style.display = (!is3 && !is4) ? '' : 'none';
  f3.style.display = is3 ? '' : 'none';
  f4.style.display = is4 ? '' : 'none';
  // Auto-select first option of the visible group
  if (is3) { const r = document.getElementById('ms_fE'); if (r) r.checked = true; }
  else if (is4) { const r = document.getElementById('ms_fG'); if (r) r.checked = true; }
  else { const r = document.getElementById('ms_fA'); if (r) r.checked = true; }
}

// ── MATCH SETUP: SAVE COURSE NUDGE ───────────────────────────

function msCheckSaveNudge() {
  const nudge = document.getElementById('msSaveCourseNudge');
  if (!nudge) return;
  const name = document.getElementById('ms_course_name')?.value.trim();
  if (!name) { nudge.style.display = 'none'; return; }
  const alreadySaved = _savedCourses.some(c => c.name.toLowerCase() === name.toLowerCase());
  const alreadyShared = _sharedCourses.some(c => c.name.toLowerCase() === name.toLowerCase());
  nudge.style.display = (alreadySaved || alreadyShared) ? 'none' : '';
}

function msGoToStep(n) {
  [1,2,3,4].forEach(i => {
    const step = document.getElementById('msStep' + i);
    const dot  = document.getElementById('mss' + i);
    if (step) step.style.display = i === n ? '' : 'none';
    if (dot) {
      dot.classList.toggle('active', i === n);
      dot.classList.toggle('done', i < n);
    }
  });
  document.getElementById('matchSetupOverlay').scrollTop = 0;
}

function msNext(fromStep) {
  if (fromStep === 1) {
    const name = document.getElementById('ms_course_name').value.trim();
    if (!name) { showToast(t('toast_enter_course'), 'error'); return; }
    if (_msHoles === 9) {
      const rating = parseFloat(document.getElementById('ms_rating').value);
      const slope  = parseInt(document.getElementById('ms_slope').value);
      const par    = parseInt(document.getElementById('ms_par').value);
      if (isNaN(rating)) { showToast('Please enter a course rating.', 'error'); return; }
      if (isNaN(slope))  { showToast('Please enter a slope rating.', 'error'); return; }
      if (isNaN(par))    { showToast('Please enter course par.', 'error'); return; }
    } else {
      const cr = parseFloat(document.getElementById('ms_combined_rating').value);
      const cs = parseInt(document.getElementById('ms_combined_slope').value);
      const fp = parseInt(document.getElementById('ms_front_par').value);
      const bp = parseInt(document.getElementById('ms_back_par').value);
      if (isNaN(cr)) { showToast('Please enter a combined rating.', 'error'); return; }
      if (isNaN(cs)) { showToast('Please enter a combined slope.', 'error'); return; }
      if (isNaN(fp)) { showToast('Please enter Front 9 par.', 'error'); return; }
      if (isNaN(bp)) { showToast('Please enter Back 9 par.', 'error'); return; }
    }
    msGoToStep(2);
    msCheckSaveNudge();
  } else if (fromStep === 2) {
    const p1 = document.getElementById('ms_t1p1_name').value.trim();
    const p2 = document.getElementById('ms_t1p2_name').value.trim();
    if (!p1) { showToast(t('toast_enter_p1'), 'error'); return; }
    if (!p2) { showToast(t('toast_enter_p2'), 'error'); return; }
    msGoToStep(3);
  } else if (fromStep === 3) {
    const p1 = document.getElementById('ms_t2p1_name').value.trim();
    const p2 = document.getElementById('ms_t2p2_name').value.trim();
    if (!p1) { showToast(t('toast_enter_p1'), 'error'); return; }
    if (!p2) { showToast(t('toast_enter_p2'), 'error'); return; }
    msBuildReview();
    msGoToStep(4);
  }
}

function msCalcHcp(p1hcp, p1teeIdx, p1g, p2hcp, p2teeIdx, p2g) {
  // Get tee data per player — use index into _msCourseTees
  function getTeeForPlayer(teeIdx) {
    if (_msCourseTees && _msCourseTees.length > 0) {
      const t = _msCourseTees[parseInt(teeIdx) || 0];
      if (t) return t;
    }
    // Fallback to course fields
    if (_msHoles === 9) {
      return {
        rating: parseFloat(document.getElementById('ms_rating').value),
        slope:  parseInt(document.getElementById('ms_slope').value),
        par:    parseInt(document.getElementById('ms_par').value)
      };
    }
    return {
      rating: parseFloat(document.getElementById('ms_combined_rating').value),
      slope:  parseInt(document.getElementById('ms_combined_slope').value),
      par:    (parseInt(document.getElementById('ms_front_par').value)||0) + (parseInt(document.getElementById('ms_back_par').value)||0)
    };
  }

  function ch(idx, teeData) {
    const { rating, slope, par } = teeData;
    if (isNaN(rating) || isNaN(slope) || isNaN(par)) return 0;
    return idx * (slope / 113) + (rating - par);
  }

  const fmt = document.querySelector('input[name="fmt"]:checked')?.value || '35_15';
  const [pct1, pct2] = fmt.split('_').map(Number);

  const players = [];
  if (!isNaN(p1hcp)) players.push(ch(p1hcp, getTeeForPlayer(p1teeIdx)));
  if (!isNaN(p2hcp)) players.push(ch(p2hcp, getTeeForPlayer(p2teeIdx)));
  players.sort((a, b) => a - b);

  const total = (players[0] ?? 0) * (pct1 / 100) + (players[1] ?? 0) * (pct2 / 100);
  return Math.round(total);
}

// Multi-player version used by match setup
function msCalcHcpMulti(players, pcts) {
  function getTeeData(teeIdx) {
    if (_msCourseTees && _msCourseTees.length > 0) {
      const t = _msCourseTees[parseInt(teeIdx) || 0];
      if (t) return t;
    }
    if (_msHoles === 9) {
      return {
        rating: parseFloat(document.getElementById('ms_rating').value),
        slope:  parseInt(document.getElementById('ms_slope').value),
        par:    parseInt(document.getElementById('ms_par').value)
      };
    }
    return {
      rating: parseFloat(document.getElementById('ms_combined_rating').value),
      slope:  parseInt(document.getElementById('ms_combined_slope').value),
      par:    (parseInt(document.getElementById('ms_front_par').value)||0) + (parseInt(document.getElementById('ms_back_par').value)||0)
    };
  }

  const chs = players
    .filter(p => p.hcp != null && !isNaN(p.hcp))
    .map(p => {
      const tee = getTeeData(p.tee);
      if (isNaN(tee.rating) || isNaN(tee.slope) || isNaN(tee.par)) return null;
      return p.hcp * (tee.slope / 113) + (tee.rating - tee.par);
    })
    .filter(v => v !== null)
    .sort((a, b) => a - b);

  let total = 0;
  chs.forEach((ch, i) => { total += ch * (pcts[Math.min(i, pcts.length - 1)] || 0); });
  return Math.round(total);
}

function msBuildReview() {
  const courseName = document.getElementById('ms_course_name').value.trim();
  let rating, slope, par, displayName;

  if (_msHoles === 9) {
    rating = parseFloat(document.getElementById('ms_rating').value);
    slope  = parseInt(document.getElementById('ms_slope').value);
    par    = parseInt(document.getElementById('ms_par').value);
    displayName = courseName;
  } else {
    rating = parseFloat(document.getElementById('ms_combined_rating').value);
    slope  = parseInt(document.getElementById('ms_combined_slope').value);
    const fp = parseInt(document.getElementById('ms_front_par').value);
    const bp = parseInt(document.getElementById('ms_back_par').value);
    par = (isNaN(fp)?0:fp) + (isNaN(bp)?0:bp);
    displayName = courseName; // always use the main course name field
  }

  // Read format from match setup's own selector
  const msFmtVal = document.querySelector('input[name="ms_fmt"]:checked')?.value || '35_15';
  const msPcts   = FORMATS[msFmtVal] || FORMATS['35_15'];

  // Collect all players for each team (up to 4)
  function collectMsPlayers(ti) {
    const ps = [];
    for (let pi = 1; pi <= 4; pi++) {
      const name = document.getElementById(`ms_t${ti}p${pi}_name`)?.value.trim();
      const hcp  = parseFloat(document.getElementById(`ms_t${ti}p${pi}_hcp`)?.value);
      const tee  = document.querySelector(`input[name="ms_t${ti}p${pi}_tee"]:checked`)?.value || '0';
      const g    = document.querySelector(`input[name="ms_t${ti}p${pi}_g"]:checked`)?.value || 'M';
      if (name) ps.push({ name, hcp: isNaN(hcp) ? 0 : hcp, tee, gender: g });
    }
    return ps;
  }

  const t1players = collectMsPlayers(1);
  const t2players = collectMsPlayers(2);

  const t1name = document.getElementById('ms_t1_name').value.trim() || 'My Team';
  const t2name = document.getElementById('ms_t2_name').value.trim() || 'Opponent';

  // Calc HCP using msCalcHcpMulti
  const t1hcp = msCalcHcpMulti(t1players, msPcts);
  const t2hcp = msCalcHcpMulti(t2players, msPcts);

  // Dynamic tee label lookup
  function teeName(idx) {
    if (_msCourseTees && _msCourseTees.length) {
      const t = _msCourseTees[parseInt(idx)];
      if (t) return t.label;
    }
    // Fallback: read the label from the rendered pill if available
    const labelEl = document.querySelector(`label[for="ms_t1p1_tee${idx}"]`);
    if (labelEl) return labelEl.textContent.trim();
    // Legacy string keys
    const legacyMap = { champ:'Championship', main:'Standard', fwd:'Forward', '0':'Medal', '1':'Champion', '2':'Forward' };
    return legacyMap[String(idx)] || `Tee ${idx}`;
  }

  const parArr = (window._msParValues && window._msParValues.length === _msHoles)
    ? window._msParValues.slice()
    : Array(_msHoles).fill(Math.round(par / _msHoles));
  const idxArr = (window._msIndexValues && window._msIndexValues.length === _msHoles)
    ? window._msIndexValues.slice()
    : Array.from({length: _msHoles}, (_, i) => i + 1);

  const parSummary = `
    <table class="ms-par-table">
      <thead><tr><th>Hole</th>${Array.from({length: Math.min(9,_msHoles)},(_,i)=>`<th>${i+1}</th>`).join('')}</tr></thead>
      <tbody>
        <tr><td class="ms-par-table-label">Par</td>${parArr.slice(0,9).map(p=>`<td><strong>${p}</strong></td>`).join('')}</tr>
        <tr><td class="ms-par-table-label">SI</td>${idxArr.slice(0,9).map(s=>`<td>${s}</td>`).join('')}</tr>
      </tbody>
    </table>
    ${_msHoles===18?`<table class="ms-par-table" style="margin-top:6px;">
      <thead><tr><th>Hole</th>${Array.from({length:9},(_,i)=>`<th>${i+10}</th>`).join('')}</tr></thead>
      <tbody>
        <tr><td class="ms-par-table-label">Par</td>${parArr.slice(9).map(p=>`<td><strong>${p}</strong></td>`).join('')}</tr>
        <tr><td class="ms-par-table-label">SI</td>${idxArr.slice(9).map(s=>`<td>${s}</td>`).join('')}</tr>
      </tbody>
    </table>`:''}`;

  _msMatchData = {
    holes:  _msHoles,
    course: { name: displayName, rating, slope, par },
    par:    parArr,
    index:  idxArr,
    format: msFmtVal,
    teamA: { teamName: t1name, teamHcp: t1hcp, players: t1players },
    teamB: { teamName: t2name, teamHcp: t2hcp, players: t2players },
  };

  const fmtLabel = msPcts.map(p => Math.round(p*100)+'%').join(' / ');

  const playerRows = (players, ti) => players.map(p =>
    `<div class="ms-review-row"><span>${esc(p.name)}</span><span>${p.hcp} · ${teeName(p.tee)}</span></div>`
  ).join('');

  document.getElementById('msReviewContent').innerHTML = `
    <div class="ms-review-card">
      <div class="ms-review-card-title">Course</div>
      <div class="ms-review-row"><span>Name</span><span>${displayName}</span></div>
      <div class="ms-review-row"><span>Holes</span><span>${_msHoles}</span></div>
      <div class="ms-review-row"><span>Rating / Slope / Par</span><span>${rating} / ${slope} / ${par}</span></div>
      <div class="ms-review-row"><span>Format</span><span>${fmtLabel}</span></div>
      <div style="margin-top:10px;">
        <div style="font-size:0.7rem;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.1em;">Par &amp; Stroke Index</div>
        ${parSummary}
      </div>
    </div>
    <div class="ms-review-card">
      <div class="ms-review-card-title">Your Team — ${t1name}</div>
      ${playerRows(t1players)}
      <div><span class="ms-review-hcp">Team HCP: ${t1hcp}</span></div>
    </div>
    <div class="ms-review-card">
      <div class="ms-review-card-title">Opponent — ${t2name}</div>
      ${playerRows(t2players)}
      <div><span class="ms-review-hcp">Team HCP: ${t2hcp}</span></div>
    </div>`;
}

async function msGenerateCode() {
  if (!_msMatchData) { showToast('Something went wrong. Please restart.', 'error'); return; }
  const btn = document.getElementById('msGenerateBtn');
  btn.disabled = true;
  btn.textContent = 'Creating match…';

  const code = await createMatch(_msMatchData);
  if (!code) { btn.disabled = false; btn.textContent = 'Generate Match Code →'; return; }

  window._activeMatchId = code;
  window._activeMatchRole = 'A';

  closeMatchSetup();
  openMatchCode(code);

  // Listen for Team B joining then open live scorecard for Team A
  listenToMatch(code, (data) => {
    if (data.status === 'active' && data.teamB?.uid) {
      // Update code screen status
      const statusEl = document.getElementById('matchCodeStatus');
      if (statusEl) statusEl.innerHTML = `<span class="match-code-connected">✅ ${data.teamB.teamName} connected — starting match!</span>`;
      clearTimeout(_matchFallbackTimer);
      setTimeout(() => {
        closeMatchCode();
        openLiveScorecard(data, 'A');
      }, 1500);
    }
  });
}

// ═══════════════════════════════════
// MATCH CODE DISPLAY
// ═══════════════════════════════════
let _matchFallbackTimer = null;

function openMatchCode(code) {
  document.getElementById('matchCodeDisplay').textContent = code;
  document.getElementById('matchCodeStatus').innerHTML = '<span class="match-code-waiting">⏳ Waiting for opponent to join…</span>';
  document.getElementById('matchFallbackLink').style.display = 'none';

  // Generate QR code
  const qrEl = document.getElementById('matchCodeQR');
  qrEl.innerHTML = '';
  const url = `${location.origin}${location.pathname}?join=${code}`;
  new QRCode(qrEl, { text: url, width: 160, height: 160, colorDark:'#000000', colorLight:'#ffffff' });

  const el = document.getElementById('matchCodeOverlay');
  el.style.display = '';
  requestAnimationFrame(() => el.classList.add('open'));

  // Listen for opponent joining
  listenToMatch(code, (data) => {
    if (data.status === 'active' && data.teamB?.uid) {
      document.getElementById('matchCodeStatus').innerHTML =
        `<span class="match-code-connected">✅ ${data.teamB.teamName} connected — starting match!</span>`;
      clearTimeout(_matchFallbackTimer);
      setTimeout(() => closeMatchCode(), 1500);
    }
  });

  // Show fallback link after 2 minutes
  _matchFallbackTimer = setTimeout(() => {
    document.getElementById('matchFallbackLink').style.display = '';
  }, 2 * 60 * 1000);
}

function closeMatchCode() {
  clearTimeout(_matchFallbackTimer);
  if (window._matchUnsubscribe) { window._matchUnsubscribe(); window._matchUnsubscribe = null; }
  const el = document.getElementById('matchCodeOverlay');
  el.classList.remove('open');
  setTimeout(() => { el.style.display = 'none'; }, 350);
}

function shareMatchCode() {
  const code = document.getElementById('matchCodeDisplay').textContent;
  const url  = `${location.origin}${location.pathname}?join=${code}`;
  const text = `Join my Parmate match! Code: ${code}\n${url}`;
  if (navigator.share) {
    navigator.share({ title: 'Parmate Match', text });
  } else {
    navigator.clipboard.writeText(text).then(() => showToast('Link copied!', 'success'));
  }
}

function matchFallback() {
  if (window._activeMatchId) { abandonMatch(window._activeMatchId); window._activeMatchId = null; }
  closeMatchCode();
  // Drop into existing match flow silently
  _gameMode = 'match';
  document.getElementById('modeSingle').classList.remove('active');
  document.getElementById('modeMatch').classList.add('active');
  const opp = document.getElementById('opponentSection');
  if (opp) opp.style.display = '';
}
function getCH(index, slope, rating, par) { return index * (slope / 113) + (rating - par); }

// WHS 9-hole play: use one half of the 18-hole Handicap Index, rounded to one decimal
// (per the USGA Course Handicap method), before computing the Course Handicap with the
// 9-hole rating/slope/par. 18-hole play is unchanged.
function whsPlayIndex(rawIndex, course) {
  const idx = parseFloat(rawIndex);
  let holes = (course && course.holes) ||
              ((typeof _trFlow !== 'undefined' && _trFlow) ? ((_trFlow.course && _trFlow.course.holes) || _trFlow.holes) : 0) || 18;
  return (holes <= 9) ? Math.round((idx / 2) * 10) / 10 : idx;
}

function getTee(teeKey) {
  if (teeKey === 'champ') {
    const r = numVal('tee1_rating'), s = numVal('tee1_slope'), p = numVal('tee1_par') || 72;
    // Fall back to medal tee if championship fields not filled in
    if (!isNaN(r) && !isNaN(s)) return { rating:r, slope:s, par:p, key:'champ' };
  }
  if (teeKey === 'fwd') {
    const r = numVal('tee3_rating'), s = numVal('tee3_slope'), p = numVal('tee3_par') || 72;
    if (!isNaN(r) && !isNaN(s)) return { rating:r, slope:s, par:p, key:'fwd' };
  }
  const r = numVal('course_rating'), s = numVal('course_slope'), p = numVal('course_par') || 72;
  return { rating:r, slope:s, par:p, key:'main' };
}

function getPlayer(ti, pi) {
  const pfx = `t${ti}p${pi}_`;
  return {
    name:   val(pfx+'name') || `Player ${pi}`,
    hcp:    parseFloat(document.getElementById(pfx+'hcp')?.value),
    gender: radio(pfx+'g') || 'M',
    teeKey: radio(pfx+'tee') || 'main'
  };
}

function calcTeam(players, pcts) {
  const active = players.filter(p => !isNaN(p.hcp) && p.hcp >= 0 && p.hcp <= 54);
  if (!active.length) return null;
  active.forEach(p => { const tee = getTee(p.teeKey); p.ch = getCH(p.hcp, tee.slope, tee.rating, tee.par); p.teeUsed = tee.key; });
  active.sort((a,b) => a.ch - b.ch);
  let total = 0;
  active.forEach((p,i) => { p.pct = pcts[Math.min(i, pcts.length-1)] || 0; p.contrib = p.ch * p.pct; total += p.contrib; });
  return { players: active, hcp: Math.round(total) };
}

function calculate() {
  const rating = numVal('course_rating'), slope = numVal('course_slope');
  if (isNaN(rating) || isNaN(slope)) { showToast('Please fill in Course Rating and Slope first.', 'error'); return; }

  // Validate — always require My Team P1; require opp P1 only in match mode
  const p1el = document.getElementById('t1p1_name');
  if (!p1el || !p1el.value.trim()) {
    if (p1el) { p1el.focus(); p1el.style.borderColor = 'var(--red)'; setTimeout(() => { p1el.style.borderColor = ''; }, 2000); }
    showToast('Please enter your name (My Team, Player 1)', 'error'); return;
  }
  if (_gameMode === 'match') {
    const op1 = document.getElementById('t2p1_name');
    if (!op1 || !op1.value.trim()) {
      if (op1) { op1.focus(); op1.style.borderColor = 'var(--red)'; setTimeout(() => { op1.style.borderColor = ''; }, 2000); }
      showToast('Please enter Opponent Player 1 name', 'error'); return;
    }
  }

  const pcts = FORMATS[radio('fmt') || '35_15'];

  // Collect players dynamically
  const t1players = [];
  for (let pi = 1; pi <= _t1PlayerCount; pi++) t1players.push(getPlayer(1, pi));
  const t2players = [];
  for (let pi = 1; pi <= _t2PlayerCount; pi++) t2players.push(getPlayer(2, pi));

  const teams = _gameMode === 'match'
    ? [
        { name: val('team1_name') || 'My Team',   players: t1players },
        { name: val('team2_name') || 'Opponents', players: t2players }
      ]
    : [
        { name: val('team1_name') || 'My Team', players: t1players }
      ];

  const results = []; let any = false;
  for (const team of teams) {
    const res = calcTeam(team.players, pcts);
    if (res) { any = true; results.push({ name: team.name, ...res }); }
    else      results.push({ name: team.name, hcp: null, players: [] });
  }
  if (!any) { showToast(t('toast_hcp_entry'), 'error'); return; }
  renderResults(results, rating, slope, numVal('course_par') || 72, pcts);
  document.getElementById('resultsOverlay').classList.add('open');
  document.getElementById('resultsOverlay').scrollTop = 0;
}

function renderResults(results, rating, slope, par, pcts) {
  const fmt = pcts.map(p => Math.round(p*100)+'%').join(' / ');
  document.getElementById('res_event').textContent = val('course_name') || 'Scramble Results';
  document.getElementById('res_meta').innerHTML = `${_holes} holes · Rating ${rating} · Slope ${slope} · Par ${par}<br>Format: ${fmt} allowance`;
  const sorted = [...results].sort((a,b) => a.hcp === null ? 1 : b.hcp === null ? -1 : a.hcp - b.hcp);
  const tC = { main:'var(--tee2)', champ:'var(--tee1)', fwd:'var(--tee3)' };
  const tN = { main:'Std', champ:'Champ', fwd:'Fwd' };
  let html = '';
  sorted.forEach((team, idx) => {
    if (team.hcp === null) { html += `<div class="result-card"><div class="result-card-top"><div class="result-team-name">${esc(team.name)}</div><div style="font-size:0.65rem;color:var(--muted);padding-top:6px;">No players entered</div></div></div>`; return; }
    const rows = team.players.map(p => `<div class="result-player-row"><div class="result-player-name">${esc(p.name)}</div><div class="result-player-meta"><span class="result-player-hcp">${p.hcp.toFixed(1)}</span><span class="tee-dot-sm" style="background:${tC[p.teeUsed]||tC.main}"></span><span class="result-pct">${Math.round(p.pct*100)}%</span></div></div>`).join('');
    html += `<div class="result-card"><div class="result-card-top"><div><div class="result-team-name">${esc(team.name)}</div><div class="result-strokes">+${team.hcp} stroke${team.hcp!==1?'s':''} off scratch</div></div><div class="result-hcp-block"><div class="result-hcp-num">${team.hcp}</div><div class="result-hcp-label">Team HCP</div></div></div><div class="result-players">${rows}</div></div>`;
    if (idx === 0 && sorted.length === 2 && sorted[1].hcp !== null) {
      const diff = Math.abs(sorted[1].hcp - sorted[0].hcp);
      html += `<div class="result-vs-badge"><span>${esc(sorted[0].name)}</span><span class="result-vs-diff">${diff===0?'Even':diff+' stroke'+(diff!==1?'s':'')}</span><span>${esc(sorted[1].name)}</span></div>`;
    }
  });
  document.getElementById('resultsContent').innerHTML = html;
}

function closeResults() { document.getElementById('resultsOverlay').classList.remove('open'); }

function resetAll() {
  if (!confirm('Reset all fields?')) return;
  // Clear course fields
  ['course_name','course_rating','course_slope','tee1_rating','tee1_slope','tee3_rating','tee3_slope']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  setVal('course_par','72'); setVal('tee1_par','72'); setVal('tee3_par','72');
  setVal('team1_name','add your team name'); setVal('team2_name','add your team name');
  document.getElementById('fA').checked = true;
  setHoles(18);
  setGameMode('single');
  // Reset player counts and re-render (clears all player fields)
  _t1PlayerCount = 2;
  _t2PlayerCount = 2;
  renderTeamPlayers(1, true);
  renderTeamPlayers(2, true);
  // Clear calc course state
  _calcParValues   = null;
  _calcIndexValues = null;
  _calcCourseTees  = [];
  const wrap = document.getElementById('calcParGridWrap');
  if (wrap) wrap.style.display = 'none';
  const drop = document.getElementById('calcCourseDropdown');
  if (drop) drop.style.display = 'none';
}

// ═══════════════════════════════════
// SAVE COURSE (multi-slot)
// ═══════════════════════════════════
// ── MATCH COURSE SAVE / LOAD / EDIT ───────────────────────

function msCollectCourseData() {
  const name = document.getElementById('ms_course_name').value.trim();
  if (!name) return null;
  let rating, slope, par, frontName = null, backName = null, frontPar = null, backPar = null;
  if (_msHoles === 9) {
    rating = parseFloat(document.getElementById('ms_rating').value);
    slope  = parseInt(document.getElementById('ms_slope').value);
    par    = parseInt(document.getElementById('ms_par').value);
  } else {
    rating    = parseFloat(document.getElementById('ms_combined_rating').value);
    slope     = parseInt(document.getElementById('ms_combined_slope').value);
    frontPar  = parseInt(document.getElementById('ms_front_par').value) || null;
    backPar   = parseInt(document.getElementById('ms_back_par').value)  || null;
    par       = (frontPar || 0) + (backPar || 0);
    frontName = document.getElementById('ms_front_name').value.trim() || null;
    backName  = document.getElementById('ms_back_name').value.trim()  || null;
  }
  if (isNaN(rating) || isNaN(slope)) return null;
  const parPerHole   = (window._msParValues   && window._msParValues.length   === _msHoles) ? window._msParValues.slice()   : Array(_msHoles).fill(4);
  const indexPerHole = (window._msIndexValues && window._msIndexValues.length === _msHoles) ? window._msIndexValues.slice() : Array.from({length:_msHoles},(_,i)=>i+1);

  // Build tees array — use existing _msCourseTees if available, else create single tee from current fields
  let tees;
  if (_msCourseTees && _msCourseTees.length > 0) {
    tees = _msCourseTees.map(t => ({ label: t.label, rating: t.rating, slope: t.slope, par: t.par }));
    // Update the tee that matches current rating/slope (in case user edited it)
    const matchIdx = tees.findIndex(t => t.rating === rating && t.slope === slope);
    if (matchIdx < 0) tees.push({ label: 'Medal', rating, slope, par });
  } else {
    tees = [{ label: 'Medal', rating, slope, par }];
  }

  const data = { name, rating, slope, par, holes: _msHoles, parPerHole, indexPerHole, tees };
  if (frontName !== null) data.frontName = frontName;
  if (backName  !== null) data.backName  = backName;
  if (frontPar  !== null) data.frontPar  = frontPar;
  if (backPar   !== null) data.backPar   = backPar;
  return data;
}

async function msShareCourse() {
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid) { showToast(t('toast_signin_first'), 'error'); return; }
  const data = msCollectCourseData();
  if (!data) { showToast('Please fill in course name, rating and slope first.', 'error'); return; }

  // Check if already in shared DB by name
  const existing = _sharedCourses.find(c => c.name.toLowerCase() === data.name.toLowerCase());

  try {
    if (existing) {
      // Update existing shared entry
      await window._fbDb.collection('courses_shared').doc(existing._docId).update({
        ...data,
        lastEditedBy: uid,
        lastEditedAt: new Date().toISOString()
      });
      // Update local cache
      const idx = _sharedCourses.findIndex(c => c._docId === existing._docId);
      if (idx >= 0) _sharedCourses[idx] = { ..._sharedCourses[idx], ...data, lastEditedBy: uid };
      showToast(`"${data.name}" updated in shared database`, 'success');
    } else {
      // Create new shared entry
      const courseId = 'c_' + Date.now().toString(36);
      const docRef   = await window._fbDb.collection('courses_shared').add({
        ...data,
        courseId,
        addedBy:      uid,
        lastEditedBy: uid,
        lastEditedAt: new Date().toISOString()
      });
      _sharedCourses.push({ ...data, courseId, _docId: docRef.id, addedBy: uid });
      window._msCurrentSharedCourseId = courseId;
      showToast(`"${data.name}" added to shared database!`, 'success');
    }
  } catch(e) {
    showToast('Could not save to shared DB: ' + e.message, 'error');
  }
}

async function msSaveCourse() {
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid) { showToast(t('toast_signin_first'), 'error'); return; }

  const name = document.getElementById('ms_course_name').value.trim();
  if (!name) { showToast('Please enter a course name first.', 'error'); return; }

  // Duplicate name check
  if (_savedCourses.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    showToast(t('toast_course_exists'), 'error'); return;
  }
  if (_savedCourses.length >= MAX_COURSES) {
    showToast(`Maximum ${MAX_COURSES} courses — delete one first.`, 'error'); return;
  }

  const data = msCollectCourseData();
  if (!data) { showToast('Please fill in Rating and Slope before saving.', 'error'); return; }

  // Link to shared course if loaded from shared DB
  const sharedMatch = _sharedCourses.find(c => c.name.toLowerCase() === name.toLowerCase());
  const courseId = window._msCurrentSharedCourseId || sharedMatch?.courseId || null;

  const entry = {
    id: Date.now().toString(),
    ...data,
    courseId,
    savedAt: new Date().toISOString()
  };

  try {
    _savedCourses.push(entry);
    await persistCourses(uid);
    showToast(`"${name}" saved to My Courses!`, 'success');
    window._msCurrentSharedCourseId = null;
    renderMyData();
  } catch(e) {
    _savedCourses.pop();
    showToast('Could not save: ' + e.message, 'error');
  }
}

function msShowCourseDropdown(slot) {
  const dropId  = slot === 'front' ? 'msFrontCourseDropdown' : slot === 'back' ? 'msBackCourseDropdown' : 'msCourseDropdown';
  const inputId = slot === 'front' ? 'ms_front_name' : slot === 'back' ? 'ms_back_name' : 'ms_course_name';
  msRenderCourseDropdown(dropId, inputId, slot);
  ['msCourseDropdown','msFrontCourseDropdown','msBackCourseDropdown'].forEach(id => {
    if (id !== dropId) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
  });
  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      const drop = document.getElementById(dropId);
      const inp  = document.getElementById(inputId);
      if (drop && !drop.contains(e.target) && e.target !== inp) {
        drop.style.display = 'none';
        document.removeEventListener('click', handler);
      }
    });
  }, 0);
}

function msFilterCourseDropdown(slot) {
  const dropId  = slot === 'front' ? 'msFrontCourseDropdown' : slot === 'back' ? 'msBackCourseDropdown' : 'msCourseDropdown';
  const inputId = slot === 'front' ? 'ms_front_name' : slot === 'back' ? 'ms_back_name' : 'ms_course_name';
  msRenderCourseDropdown(dropId, inputId, slot);
}

function msRenderCourseDropdown(dropId, inputId, slot) {
  const drop  = document.getElementById(dropId);
  const input = document.getElementById(inputId);
  if (!drop || !input) return;
  const query = input.value.trim().toLowerCase();

  // Shared courses first, then personal saves not already in shared
  const filteredShared   = _sharedCourses.filter(c => !query || c.name.toLowerCase().includes(query));
  const filteredPersonal = _savedCourses.filter(c =>
    (!query || c.name.toLowerCase().includes(query)) &&
    !_sharedCourses.some(s => s.courseId === c.courseId && c.courseId)
  );

  if (filteredShared.length === 0 && filteredPersonal.length === 0) {
    const msg = query
      ? `No courses matching "${query}" — tap 🌐 to add to shared DB`
      : 'No courses yet — tap 🌐 to add a course to the shared database';
    drop.innerHTML = `<div class="ms-course-dropdown-empty">${msg}</div>`;
  } else {
    let html = '';
    if (filteredShared.length > 0) {
      html += filteredShared.map(c => `
        <div class="ms-course-dropdown-item" onclick="msLoadSharedCourse('${c.courseId}','${slot||''}')">
          <div class="ms-course-dropdown-name"><span class="ms-course-badge shared">🌐</span>${esc(c.name)}</div>
          <div class="ms-course-dropdown-meta">${c.holes===9?'9 holes':'18 holes'} · Par ${c.par} · ${c.rating}/${c.slope}</div>
        </div>`).join('');
    }
    if (filteredPersonal.length > 0) {
      if (filteredShared.length > 0) html += `<div class="ms-course-dropdown-divider">My Courses</div>`;
      html += filteredPersonal.map(c => `
        <div class="ms-course-dropdown-item" onclick="msLoadCourseIntoSetup('${c.id}','${slot||''}')">
          <div class="ms-course-dropdown-name"><span class="ms-course-badge personal">👤</span>${esc(c.name)}</div>
          <div class="ms-course-dropdown-meta">${c.holes===9?'9 holes':'18 holes'} · Par ${c.par} · ${c.rating}/${c.slope}</div>
        </div>`).join('');
    }
    drop.innerHTML = html;
  }
  drop.style.display = '';
}

function msLoadSharedCourse(courseId, slot) {
  const c = _sharedCourses.find(s => s.courseId === courseId);
  if (!c) return;
  msLoadCourseIntoSetupData(c, slot);
  ['msCourseDropdown','msFrontCourseDropdown','msBackCourseDropdown'].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = 'none';
  });
  // Store tees for Step 2 tee selector
  if (!slot) {
    _msCourseTees = c.tees && c.tees.length ? c.tees : [{ label: 'Medal', rating: c.rating, slope: c.slope, par: c.par }];
    msUpdateTeePills();
  }
  window._msCurrentSharedCourseId = courseId;
  showToast(`Loaded "${c.name}" from shared database`, 'success');
  const nudge = document.getElementById('msSaveCourseNudge');
  if (nudge) nudge.style.display = 'none';
}

function msLoadCourseIntoSetupData(c, slot) {
  if (slot === 'front') {
    document.getElementById('ms_front_name').value   = c.name;
    document.getElementById('ms_front_rating').value = c.rating || '';
    document.getElementById('ms_front_slope').value  = c.slope  || '';
    document.getElementById('ms_front_par').value    = c.par    || '';
    if (c.parPerHole   && c.parPerHole.length   === 9) window._msFrontParValues   = c.parPerHole.slice();
    if (c.indexPerHole && c.indexPerHole.length === 9) window._msFrontIndexValues = c.indexPerHole.slice();
    msUpdateCombinedPar();
    msMerge18HoleGrid();
    ['msCourseDropdown','msFrontCourseDropdown','msBackCourseDropdown'].forEach(id => {
      const el = document.getElementById(id); if (el) el.style.display = 'none';
    });
    showToast(`Front 9: "${c.name}" loaded!`, 'success');
    return;
  }
  if (slot === 'back') {
    document.getElementById('ms_back_name').value   = c.name;
    document.getElementById('ms_back_rating').value = c.rating || '';
    document.getElementById('ms_back_slope').value  = c.slope  || '';
    document.getElementById('ms_back_par').value    = c.par    || '';
    if (c.parPerHole   && c.parPerHole.length   === 9) window._msBackParValues   = c.parPerHole.slice();
    if (c.indexPerHole && c.indexPerHole.length === 9) window._msBackIndexValues = c.indexPerHole.slice();
    msUpdateCombinedPar();
    msMerge18HoleGrid();
    ['msCourseDropdown','msFrontCourseDropdown','msBackCourseDropdown'].forEach(id => {
      const el = document.getElementById(id); if (el) el.style.display = 'none';
    });
    showToast(`Back 9: "${c.name}" loaded!`, 'success');
    return;
  }
  // Main course slot
  msSetHoles(c.holes || 9);
  document.getElementById('ms_course_name').value = c.name;
  if (c.holes === 9) {
    document.getElementById('ms_rating').value = c.rating || '';
    document.getElementById('ms_slope').value  = c.slope  || '';
    document.getElementById('ms_par').value    = c.par    || '';
  } else {
    document.getElementById('ms_combined_rating').value = c.rating || '';
    document.getElementById('ms_combined_slope').value  = c.slope  || '';
    document.getElementById('ms_front_par').value  = c.frontPar || '';
    document.getElementById('ms_back_par').value   = c.backPar  || '';
    document.getElementById('ms_front_name').value = c.frontName || '';
    document.getElementById('ms_back_name').value  = c.backName  || '';
  }
  if (c.parPerHole   && c.parPerHole.length   === c.holes) window._msParValues   = c.parPerHole.slice();
  if (c.indexPerHole && c.indexPerHole.length === c.holes) window._msIndexValues = c.indexPerHole.slice();
  msRenderParGrid();
  ['msCourseDropdown','msFrontCourseDropdown','msBackCourseDropdown'].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = 'none';
  });
}
function msLoadCourseIntoSetup(id, slot) {
  const c = _savedCourses.find(x => x.id === id);
  if (!c) return;
  ['msCourseDropdown','msFrontCourseDropdown','msBackCourseDropdown'].forEach(dropId => {
    const el = document.getElementById(dropId); if (el) el.style.display = 'none';
  });
  if (!slot || slot === '') {
    document.getElementById('ms_course_name').value = c.name;
    if (_msHoles !== c.holes) { _msHoles = c.holes; msSetHoles(c.holes); }
    if (c.holes === 9) {
      document.getElementById('ms_rating').value = c.rating;
      document.getElementById('ms_slope').value  = c.slope;
      document.getElementById('ms_par').value    = c.par;
    } else {
      document.getElementById('ms_combined_rating').value = c.rating;
      document.getElementById('ms_combined_slope').value  = c.slope;
    }
    if (c.parPerHole   && c.parPerHole.length   === c.holes) window._msParValues   = c.parPerHole.slice();
    if (c.indexPerHole && c.indexPerHole.length === c.holes) window._msIndexValues = c.indexPerHole.slice();
    // Set tees for Step 2
    _msCourseTees = c.tees && c.tees.length ? c.tees : [{ label: 'Medal', rating: c.rating, slope: c.slope, par: c.par }];
    msUpdateTeePills();
    msRenderParGrid();
    showToast(`"${c.name}" loaded!`, 'success');
  } else if (slot === 'front') {
    document.getElementById('ms_front_name').value   = c.name;
    document.getElementById('ms_front_rating').value = c.rating;
    document.getElementById('ms_front_slope').value  = c.slope;
    document.getElementById('ms_front_par').value    = c.par;
    msUpdateCombinedPar();
    msMerge18HoleGrid();
    showToast(`Front 9: "${c.name}" loaded!`, 'success');
  } else if (slot === 'back') {
    document.getElementById('ms_back_name').value   = c.name;
    document.getElementById('ms_back_rating').value = c.rating;
    document.getElementById('ms_back_slope').value  = c.slope;
    document.getElementById('ms_back_par').value    = c.par;
    msUpdateCombinedPar();
    msMerge18HoleGrid();
    showToast(`Back 9: "${c.name}" loaded!`, 'success');
  }
}

// ── TEE SELECTOR ────────────────────────────────────────────

function msUpdateTeePills() {
  // Render dynamic tee pills for all players (p1–p4) based on _msCourseTees
  const players = ['ms_t1p1','ms_t1p2','ms_t1p3','ms_t1p4','ms_t2p1','ms_t2p2','ms_t2p3','ms_t2p4'];
  const tees = _msCourseTees && _msCourseTees.length
    ? _msCourseTees
    : [
        { label: 'Champion', rating: 0, slope: 113, par: 72 },
        { label: 'Medal',    rating: 0, slope: 113, par: 72 },
        { label: 'Forward',  rating: 0, slope: 113, par: 72 },
      ];
  players.forEach(pfx => {
    const container = document.getElementById(`${pfx}_tee_pills`);
    if (!container) return;
    const currentChecked = container.querySelector('input[type="radio"]:checked')?.value;
    container.innerHTML = tees.map((t, i) => `
      <div class="tee-pill">
        <input type="radio" name="${pfx}_tee" id="${pfx}_tee${i}" value="${i}" ${(currentChecked !== undefined ? String(i) === currentChecked : i === 1) ? 'checked' : ''}>
        <label for="${pfx}_tee${i}">${esc(t.label)}</label>
      </div>`).join('');
  });
}

function msGetTeeData(playerPrefix) {
  // Get rating/slope/par for a player based on their selected tee index
  const selected = document.querySelector(`input[name="${playerPrefix}_tee"]:checked`);
  const idx = selected ? parseInt(selected.value) : 0;
  if (_msCourseTees && _msCourseTees[idx]) return _msCourseTees[idx];
  // Fallback to course fields
  if (_msHoles === 9) {
    return {
      rating: parseFloat(document.getElementById('ms_rating').value),
      slope:  parseInt(document.getElementById('ms_slope').value),
      par:    parseInt(document.getElementById('ms_par').value)
    };
  }
  return {
    rating: parseFloat(document.getElementById('ms_combined_rating').value),
    slope:  parseInt(document.getElementById('ms_combined_slope').value),
    par:    parseInt(document.getElementById('ms_front_par').value||0) + parseInt(document.getElementById('ms_back_par').value||0)
  };
}

function msMerge18HoleGrid() {
  const frontName = document.getElementById('ms_front_name')?.value;
  const backName  = document.getElementById('ms_back_name')?.value;
  // Look in personal saves first, then shared DB
  const frontC = _savedCourses.find(c => c.name === frontName)
              || _sharedCourses.find(c => c.name === frontName);
  const backC  = _savedCourses.find(c => c.name === backName)
              || _sharedCourses.find(c => c.name === backName);

  // Use stored values from direct load if available, else fall back to course lookup
  const frontPar = (window._msFrontParValues   && window._msFrontParValues.length   === 9) ? window._msFrontParValues   : (frontC?.parPerHole   || Array(9).fill(4));
  const backPar  = (window._msBackParValues    && window._msBackParValues.length    === 9) ? window._msBackParValues    : (backC?.parPerHole    || Array(9).fill(4));
  const frontIdx = (window._msFrontIndexValues && window._msFrontIndexValues.length === 9) ? window._msFrontIndexValues : (frontC?.indexPerHole || Array.from({length:9},(_,i)=>i*2+1));
  const backIdx  = (window._msBackIndexValues  && window._msBackIndexValues.length  === 9) ? window._msBackIndexValues  : (backC?.indexPerHole  || Array.from({length:9},(_,i)=>i*2+2));

  window._msParValues   = [...frontPar, ...backPar];
  window._msIndexValues = [...frontIdx, ...backIdx];
  msRenderParGrid();
}

// ── EDIT COURSE ────────────────────────────────────────────
let _editCourseId = null;
let _ecHoles = 9;

function openEditCourse(id) {
  const c = _savedCourses.find(x => x.id === id);
  if (!c) return;
  _editCourseId = id;
  _ecHoles = c.holes || 9;
  window._ecParValues   = c.parPerHole   ? c.parPerHole.slice()   : Array(_ecHoles).fill(4);
  window._ecIndexValues = c.indexPerHole ? c.indexPerHole.slice() : Array.from({length:_ecHoles},(_,i)=>i+1);

  document.getElementById('ec_name').value = c.name;
  ecSetHoles(_ecHoles);

  if (_ecHoles === 9) {
    document.getElementById('ec_rating').value = c.rating || '';
    document.getElementById('ec_slope').value  = c.slope  || '';
    document.getElementById('ec_par').value    = c.par    || '';
  } else {
    document.getElementById('ec_front_name').value    = c.frontName || '';
    document.getElementById('ec_front_rating').value  = '';
    document.getElementById('ec_front_slope').value   = '';
    document.getElementById('ec_front_par').value     = '';
    document.getElementById('ec_back_name').value     = c.backName  || '';
    document.getElementById('ec_back_rating').value   = '';
    document.getElementById('ec_back_slope').value    = '';
    document.getElementById('ec_back_par').value      = '';
    document.getElementById('ec_combined_rating').value = c.rating || '';
    document.getElementById('ec_combined_slope').value  = c.slope  || '';
  }

  msRenderParGrid('ecParGrid', window._ecParValues, window._ecIndexValues, _ecHoles);
  document.getElementById('editCourseModal').style.display = 'flex';
}

function closeEditCourse() {
  document.getElementById('editCourseModal').style.display = 'none';
  _editCourseId = null;
}

function ecSetHoles(n) {
  _ecHoles = n;
  document.getElementById('ec_btn9').classList.toggle('active', n === 9);
  document.getElementById('ec_btn18').classList.toggle('active', n === 18);
  document.getElementById('ec9holeFields').style.display  = n === 9  ? '' : 'none';
  document.getElementById('ec18holeFields').style.display = n === 18 ? '' : 'none';
}

function ecUpdateParGrid() {
  msRenderParGrid('ecParGrid', window._ecParValues, window._ecIndexValues, _ecHoles);
}

function ecUpdateCombinedPar() {
  const fp = parseInt(document.getElementById('ec_front_par')?.value || '0');
  const bp = parseInt(document.getElementById('ec_back_par')?.value  || '0');
  const total = (isNaN(fp)?0:fp) + (isNaN(bp)?0:bp);
  const el = document.getElementById('ecCombinedParTotal');
  if (el) el.textContent = total > 0 ? total : '—';
}

async function saveEditCourse() {
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid || !_editCourseId) return;

  const name = document.getElementById('ec_name').value.trim();
  if (!name) { showToast('Please enter a course name.', 'error'); return; }

  const dupExists = _savedCourses.some(c => c.id !== _editCourseId && c.name.toLowerCase() === name.toLowerCase());
  if (dupExists) { showToast(`Another course named "${name}" already exists.`, 'error'); return; }

  let rating, slope, par, frontName, backName;
  if (_ecHoles === 9) {
    rating = parseFloat(document.getElementById('ec_rating').value);
    slope  = parseInt(document.getElementById('ec_slope').value);
    par    = parseInt(document.getElementById('ec_par').value);
  } else {
    rating    = parseFloat(document.getElementById('ec_combined_rating').value);
    slope     = parseInt(document.getElementById('ec_combined_slope').value);
    const fp  = parseInt(document.getElementById('ec_front_par').value);
    const bp  = parseInt(document.getElementById('ec_back_par').value);
    par       = (isNaN(fp)?0:fp) + (isNaN(bp)?0:bp);
    frontName = document.getElementById('ec_front_name').value.trim() || null;
    backName  = document.getElementById('ec_back_name').value.trim()  || null;
  }

  if (isNaN(rating) || isNaN(slope)) { showToast('Please fill in Rating and Slope.', 'error'); return; }

  const parPerHole   = (window._ecParValues   && window._ecParValues.length   === _ecHoles) ? window._ecParValues.slice()   : Array(_ecHoles).fill(4);
  const indexPerHole = (window._ecIndexValues && window._ecIndexValues.length === _ecHoles) ? window._ecIndexValues.slice() : Array.from({length:_ecHoles},(_,i)=>i+1);

  const idx = _savedCourses.findIndex(c => c.id === _editCourseId);
  if (idx === -1) { showToast('Course not found.', 'error'); return; }

  const updatedData = { name, rating, slope, par, holes: _ecHoles, frontName: frontName||null, backName: backName||null, parPerHole, indexPerHole };

  _savedCourses[idx] = { ..._savedCourses[idx], ...updatedData, savedAt: new Date().toISOString() };

  try {
    await persistCourses(uid);

    // If linked to shared DB — push correction there too
    const courseId = _savedCourses[idx].courseId;
    if (courseId) {
      const shared = _sharedCourses.find(c => c.courseId === courseId);
      if (shared) {
        await window._fbDb.collection('courses_shared').doc(shared._docId).update({
          ...updatedData, lastEditedBy: uid, lastEditedAt: new Date().toISOString()
        });
        const si = _sharedCourses.findIndex(c => c.courseId === courseId);
        if (si >= 0) _sharedCourses[si] = { ..._sharedCourses[si], ...updatedData };
        showToast(`"${name}" updated — correction saved to shared database`, 'success');
      } else {
        showToast(`"${name}" updated!`, 'success');
      }
    } else {
      showToast(`"${name}" updated!`, 'success');
    }
    renderMyData();
    closeEditCourse();
  } catch(e) {
    showToast('Could not save: ' + e.message, 'error');
  }
}

// ── CALC COURSE DROPDOWN (shared DB) ───────────────────────

function calcShowCourseDropdown() {
  calcRenderCourseDropdown();
  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      const drop = document.getElementById('calcCourseDropdown');
      const inp  = document.getElementById('course_name');
      if (drop && !drop.contains(e.target) && e.target !== inp) {
        drop.style.display = 'none';
        document.removeEventListener('click', handler);
      }
    });
  }, 0);
}

function calcFilterCourseDropdown() {
  calcRenderCourseDropdown();
}

function calcRenderCourseDropdown() {
  const drop  = document.getElementById('calcCourseDropdown');
  const input = document.getElementById('course_name');
  if (!drop || !input) return;
  const query = input.value.trim().toLowerCase();

  const filteredShared   = _sharedCourses.filter(c => !query || c.name.toLowerCase().includes(query));
  const filteredPersonal = _savedCourses.filter(c =>
    (!query || c.name.toLowerCase().includes(query)) &&
    !_sharedCourses.some(s => s.courseId === c.courseId && c.courseId)
  );

  if (filteredShared.length === 0 && filteredPersonal.length === 0) {
    const msg = query ? `No courses matching "${query}" — tap 🌐 to add` : 'No courses yet';
    drop.innerHTML = `<div class="ms-course-dropdown-empty">${msg}</div>`;
  } else {
    let html = '';
    if (filteredShared.length > 0) {
      html += filteredShared.map(c => `
        <div class="ms-course-dropdown-item" onclick="calcLoadSharedCourse('${c.courseId}')">
          <div class="ms-course-dropdown-name"><span class="ms-course-badge shared">🌐</span>${esc(c.name)}</div>
          <div class="ms-course-dropdown-meta">${c.holes===9?'9 holes':'18 holes'} · Par ${c.par} · ${c.tees ? c.tees.map(t=>t.label).join('/') : c.rating+'/'+c.slope}</div>
        </div>`).join('');
    }
    if (filteredPersonal.length > 0) {
      if (filteredShared.length > 0) html += `<div class="ms-course-dropdown-divider">My Courses</div>`;
      html += filteredPersonal.map(c => `
        <div class="ms-course-dropdown-item" onclick="loadCourseIntoCalc('${c.id}')">
          <div class="ms-course-dropdown-name"><span class="ms-course-badge personal">👤</span>${esc(c.name)}</div>
          <div class="ms-course-dropdown-meta">${c.holes===9?'9 holes':'18 holes'} · Par ${c.par} · ${c.rating}/${c.slope}</div>
        </div>`).join('');
    }
    drop.innerHTML = html;
  }
  drop.style.display = '';
}

function calcLoadSharedCourse(courseId) {
  const c = _sharedCourses.find(s => s.courseId === courseId);
  if (!c) return;

  setHoles(c.holes || 18);
  setVal('course_name', c.name);

  // Fill tee fields from tees array
  const tees = c.tees && c.tees.length ? c.tees : [{ label: 'Medal', rating: c.rating, slope: c.slope, par: c.par }];
  _calcCourseTees = tees;

  // Fill Medal/main tee fields (first tee or the one labelled Medal)
  const medalTee = tees.find(t => t.label.toLowerCase().includes('medal') || t.label.toLowerCase().includes('standard')) || tees[0];
  const champTee = tees.find(t => t.label.toLowerCase().includes('champ'));
  const fwdTee   = tees.find(t => t.label.toLowerCase().includes('forward') || t.label.toLowerCase().includes('fwd'));

  if (medalTee) { setVal('course_rating', medalTee.rating); setVal('course_slope', medalTee.slope); setVal('course_par', medalTee.par); }
  if (champTee) { setVal('tee1_rating',   champTee.rating); setVal('tee1_slope',   champTee.slope); setVal('tee1_par',   champTee.par); }
  if (fwdTee)   { setVal('tee3_rating',   fwdTee.rating);   setVal('tee3_slope',   fwdTee.slope);   setVal('tee3_par',   fwdTee.par); }

  // Update dynamic tee pills for players
  calcUpdateTeePills();

  // Load par/SI grid
  if (c.parPerHole && c.parPerHole.length === c.holes) {
    _calcParValues   = c.parPerHole.slice();
    _calcIndexValues = c.indexPerHole && c.indexPerHole.length === c.holes ? c.indexPerHole.slice() : Array.from({length:c.holes},(_,i)=>i+1);
    calcRenderParGrid();
    document.getElementById('calcParGridWrap').style.display = '';
  } else {
    _calcParValues   = null;
    _calcIndexValues = null;
    document.getElementById('calcParGridWrap').style.display = 'none';
  }

  document.getElementById('calcCourseDropdown').style.display = 'none';
  showToast(`Loaded "${c.name}" from shared database`, 'success');
}

function calcUpdateTeePills() {
  // Update tee pills for all calc players dynamically
  const players = ['t1p1','t1p2','t2p1','t2p2'];
  players.forEach(pfx => {
    const container = document.getElementById(`${pfx}_calc_tee_pills`);
    if (!container) return;
    const tees = _calcCourseTees && _calcCourseTees.length ? _calcCourseTees : null;
    if (!tees) return; // keep hardcoded pills if no DB course loaded
    container.innerHTML = tees.map((t, i) => `
      <div class="tee-pill">
        <input type="radio" name="${pfx}_tee" id="${pfx}_ctee${i}"
          value="${i === 0 ? 'main' : i === 1 ? 'champ' : 'fwd'}"
          ${t.label.toLowerCase().includes('medal') || t.label.toLowerCase().includes('standard') ? 'checked' : ''}>
        <label for="${pfx}_ctee${i}">${esc(t.label)}</label>
      </div>`).join('');
  });
}

function calcRenderParGrid() {
  // Reuse the ms par grid renderer for the calc grid
  const n = _holes;
  const parValues   = _calcParValues   && _calcParValues.length   === n ? _calcParValues   : Array(n).fill(4);
  const indexValues = _calcIndexValues && _calcIndexValues.length === n ? _calcIndexValues : Array.from({length:n},(_,i)=>i+1);

  const grid = document.getElementById('calcParGrid');
  if (!grid) return;
  grid.style.gridTemplateColumns = `repeat(9, 1fr)`;
  grid.innerHTML = Array.from({length: n}, (_, i) => {
    const p   = parValues[i];
    const idx = indexValues[i];
    return `
      <div class="ms-par-hole">
        <div class="ms-par-hole-num">${i + 1}</div>
        <div class="ms-par-btn-group">
          ${[3,4,5].map(v => `<button class="ms-par-btn${p===v?' active':''}" onclick="calcSetHolePar(${i},${v})">${v}</button>`).join('')}
        </div>
        <div class="ms-par-index-label">SI</div>
        <span class="ms-par-si-badge" id="si_badge_calcParGrid_${i}" onclick="openCalcSiEditor(${i})">${idx}</span>
      </div>`;
  }).join('');

  const total = parValues.reduce((a,b)=>a+b,0);
  const totalEl = document.getElementById('calcParGridTotal');
  if (totalEl) totalEl.textContent = total > 0 ? total : '—';
}

function calcSetHolePar(holeIdx, val) {
  if (!_calcParValues) _calcParValues = Array(_holes).fill(4);
  _calcParValues[holeIdx] = val;
  const grid = document.getElementById('calcParGrid');
  if (!grid) return;
  const holes = grid.querySelectorAll('.ms-par-hole');
  if (holes[holeIdx]) {
    holes[holeIdx].querySelectorAll('.ms-par-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.textContent) === val);
    });
  }
  const total = _calcParValues.reduce((a,b)=>a+b,0);
  const totalEl = document.getElementById('calcParGridTotal');
  if (totalEl) totalEl.textContent = total;
}

function openCalcSiEditor(holeIdx) {
  // Reuse the SI editor popup — set context to calc grid
  window._siEditorCalcMode = true;
  openSiEditor(holeIdx, 'calcParGrid');
}

async function calcShareCourse() {
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid) { showToast(t('toast_signin_first'), 'error'); return; }
  const name = val('course_name');
  if (!name) { showToast('Please enter a course name first.', 'error'); return; }

  const rating = numVal('course_rating');
  const slope  = numVal('course_slope');
  const par    = numVal('course_par');
  if (isNaN(rating) || isNaN(slope)) { showToast('Please fill in Rating and Slope first.', 'error'); return; }

  // Build tees from filled fields
  const tees = [];
  if (!isNaN(numVal('tee1_rating'))) tees.push({ label: 'Champion', rating: numVal('tee1_rating'), slope: numVal('tee1_slope'), par: numVal('tee1_par') || par });
  tees.push({ label: 'Medal', rating, slope, par });
  if (!isNaN(numVal('tee3_rating'))) tees.push({ label: 'Forward', rating: numVal('tee3_rating'), slope: numVal('tee3_slope'), par: numVal('tee3_par') || par });

  const parPerHole   = _calcParValues   && _calcParValues.length   === _holes ? _calcParValues.slice()   : Array(_holes).fill(4);
  const indexPerHole = _calcIndexValues && _calcIndexValues.length === _holes ? _calcIndexValues.slice() : Array.from({length:_holes},(_,i)=>i+1);

  const data = { name, holes: _holes, rating, slope, par, tees, parPerHole, indexPerHole };

  try {
    const existing = _sharedCourses.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      await window._fbDb.collection('courses_shared').doc(existing._docId).update({ ...data, lastEditedBy: uid, lastEditedAt: new Date().toISOString() });
      const idx = _sharedCourses.findIndex(c => c._docId === existing._docId);
      if (idx >= 0) _sharedCourses[idx] = { ..._sharedCourses[idx], ...data };
      showToast(`"${name}" updated in shared database`, 'success');
    } else {
      const courseId = 'c_' + Date.now().toString(36);
      const docRef   = await window._fbDb.collection('courses_shared').add({ ...data, courseId, addedBy: uid, lastEditedBy: uid, lastEditedAt: new Date().toISOString() });
      _sharedCourses.push({ ...data, courseId, _docId: docRef.id, addedBy: uid });
      showToast(`"${name}" added to shared database!`, 'success');
    }
  } catch(e) { showToast('Could not save to shared DB: ' + e.message, 'error'); }
}

async function saveCourse() {
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid) { showToast(t('toast_signin_first'), 'error'); return; }
  if (_savedCourses.length >= MAX_COURSES) {
    showToast(`Maximum ${MAX_COURSES} courses — delete one in My Scramble first.`, 'error');
    return;
  }
  const rating = numVal('course_rating'), slope = numVal('course_slope');
  if (isNaN(rating) || isNaN(slope)) { showToast('Please fill in Rating and Slope before saving.', 'error'); return; }
  const data = {
    id:          Date.now().toString(),
    name:        val('course_name') || 'Unnamed Course',
    rating, slope,
    par:         numVal('course_par') || (_holes === 9 ? 36 : 72),
    holes:       _holes,
    tee1_rating: numVal('tee1_rating'),
    tee1_slope:  numVal('tee1_slope'),
    tee1_par:    numVal('tee1_par') || (_holes === 9 ? 36 : 72),
    tee3_rating: numVal('tee3_rating'),
    tee3_slope:  numVal('tee3_slope'),
    tee3_par:    numVal('tee3_par') || (_holes === 9 ? 36 : 72),
    savedAt:     new Date().toISOString(),
  };
  const btn = document.getElementById('saveCourseBtn');
  btn.textContent = '⏳';
  try {
    _savedCourses.push(data);
    await persistCourses(uid);
    btn.textContent = '✓ Saved'; btn.classList.add('saved');
    setTimeout(() => { btn.textContent = '💾 Save'; btn.classList.remove('saved'); }, 2200);
    showToast('Course saved!', 'success');
    renderMyData();
  } catch(e) {
    _savedCourses.pop();
    btn.textContent = '💾 Save';
    showToast('Could not save: ' + e.message, 'error');
  }
}

async function deleteCourse(id) {
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid) return;
  _savedCourses = _savedCourses.filter(c => c.id !== id);
  try { await persistCourses(uid); renderMyData(); showToast('Course deleted.', 'success'); }
  catch(e) { showToast('Error: ' + e.message, 'error'); }
}

async function persistCourses(uid) {
  await window._fbDb.collection('users').doc(uid).collection('saved').doc('courses_v2').set({ list: _savedCourses });
}

function loadCourseIntoCalc(id) {
  const c = _savedCourses.find(x => x.id === id);
  if (!c) return;
  setVal('course_name',   c.name);
  setVal('course_rating', c.rating);
  setVal('course_slope',  c.slope);
  setVal('course_par',    c.par || (c.holes === 9 ? 36 : 72));
  if (!isNaN(c.tee1_rating)) setVal('tee1_rating', c.tee1_rating);
  if (!isNaN(c.tee1_slope))  setVal('tee1_slope',  c.tee1_slope);
  if (!isNaN(c.tee1_par))    setVal('tee1_par',    c.tee1_par);
  if (!isNaN(c.tee3_rating)) setVal('tee3_rating', c.tee3_rating);
  if (!isNaN(c.tee3_slope))  setVal('tee3_slope',  c.tee3_slope);
  if (!isNaN(c.tee3_par))    setVal('tee3_par',    c.tee3_par);
  setHoles(c.holes === 9 ? 9 : 18);

  // Load par/SI grid if available
  if (c.parPerHole && c.parPerHole.length === c.holes) {
    _calcParValues   = c.parPerHole.slice();
    _calcIndexValues = c.indexPerHole && c.indexPerHole.length === c.holes ? c.indexPerHole.slice() : Array.from({length:c.holes},(_,i)=>i+1);
    calcRenderParGrid();
    document.getElementById('calcParGridWrap').style.display = '';
  }

  // Load tees if available
  if (c.tees && c.tees.length) {
    _calcCourseTees = c.tees;
    calcUpdateTeePills();
  }

  // Close dropdown
  const drop = document.getElementById('calcCourseDropdown');
  if (drop) drop.style.display = 'none';

  switchTab('calc');
  document.getElementById('pageCalc').scrollTop = 0;
  showToast(`"${c.name}" loaded!`, 'success');
}

// ── DYNAMIC PLAYER CARDS ────────────────────────────────────

function renderPlayerCard(ti, pi) {
  const pfx   = `t${ti}p${pi}`;
  const label = ti === 1 ? (pi === 1 ? 'Your Name' : `Player ${pi} Name`) : `Player ${pi} Name`;
  const req   = pi === 1 ? `<span style="color:var(--gold)">*</span>` : '';
  return `
    <div class="player-card" id="${pfx}_card">
      <div class="player-card-num">${pi}</div>
      <div class="field">
        <label>${label} ${req}</label>
        <div class="player-name-wrap">
          <input type="text" id="${pfx}_name" placeholder="${pi===1?'Required':'Optional'}"
            oninput="onPlayerNameInput(${ti},${pi},this)"
            onfocus="onPlayerNameFocus(${ti},${pi},this)"
            autocomplete="off">
          <div class="player-suggestions" id="${pfx}_suggestions"></div>
        </div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Handicap Index</label>
          <input type="number" id="${pfx}_hcp" placeholder="0–54" step="0.1" min="0" max="54" inputmode="decimal">
        </div>
        <div class="field"><label>Gender</label>
          <div class="gender-pills">
            <div class="gender-pill"><input type="radio" name="${pfx}_g" id="${pfx}_gM" value="M" checked><label for="${pfx}_gM">♂ M</label></div>
            <div class="gender-pill"><input type="radio" name="${pfx}_g" id="${pfx}_gF" value="F"><label for="${pfx}_gF">♀ F</label></div>
          </div>
        </div>
      </div>
      <div class="field"><label>Tee</label>
        <div class="tee-pills">
          <div class="tee-pill t1"><input type="radio" name="${pfx}_tee" id="${pfx}_tee1" value="champ"><label for="${pfx}_tee1"><span class="dot" style="background:var(--tee1)"></span>Championship</label></div>
          <div class="tee-pill t2"><input type="radio" name="${pfx}_tee" id="${pfx}_tee2" value="main" checked><label for="${pfx}_tee2"><span class="dot" style="background:var(--tee2)"></span>Standard</label></div>
          <div class="tee-pill t3"><input type="radio" name="${pfx}_tee" id="${pfx}_tee3" value="fwd"><label for="${pfx}_tee3"><span class="dot" style="background:var(--tee3)"></span>Forward</label></div>
        </div>
      </div>
    </div>`;
}

function renderTeamPlayers(ti, clearValues = false) {
  const count = ti === 1 ? _t1PlayerCount : _t2PlayerCount;
  const wrap  = document.getElementById(`t${ti}_players_wrap`);
  if (!wrap) return;
  // Save existing values before re-rendering (skip if clearing)
  const saved = {};
  if (!clearValues) {
    for (let pi = 1; pi <= 4; pi++) {
      const pfx = `t${ti}p${pi}`;
      const nameEl = document.getElementById(pfx + '_name');
      const hcpEl  = document.getElementById(pfx + '_hcp');
      const gEl    = document.querySelector(`input[name="${pfx}_g"]:checked`);
      const teeEl  = document.querySelector(`input[name="${pfx}_tee"]:checked`);
      if (nameEl) saved[pi] = { name: nameEl.value, hcp: hcpEl?.value, g: gEl?.value || 'M', tee: teeEl?.value || 'main' };
    }
  }
  // Render cards
  let html = '';
  for (let pi = 1; pi <= count; pi++) html += renderPlayerCard(ti, pi);
  wrap.innerHTML = html;
  // Restore values
  for (let pi = 1; pi <= count; pi++) {
    if (!saved[pi]) continue;
    const pfx = `t${ti}p${pi}`;
    setVal(pfx + '_name', saved[pi].name);
    setVal(pfx + '_hcp',  saved[pi].hcp);
    setRadio(pfx + '_g',   saved[pi].g);
    setRadio(pfx + '_tee', saved[pi].tee);
  }
  // Update controls
  const countLabel = document.getElementById(`t${ti}_count_label`);
  const addBtn     = document.getElementById(`t${ti}_add_btn`);
  const removeBtn  = document.getElementById(`t${ti}_remove_btn`);
  if (countLabel) countLabel.textContent = `${count} player${count > 1 ? 's' : ''}`;
  if (addBtn)     addBtn.disabled    = count >= 4;
  if (removeBtn)  removeBtn.disabled = count <= 1;
  // Update format visibility
  updateFormatVisibility();
}

function addPlayer(ti) {
  if (ti === 1) { if (_t1PlayerCount < 4) { _t1PlayerCount++; renderTeamPlayers(1); } }
  else          { if (_t2PlayerCount < 4) { _t2PlayerCount++; renderTeamPlayers(2); } }
}

function removePlayer(ti) {
  if (ti === 1) { if (_t1PlayerCount > 1) { _t1PlayerCount--; renderTeamPlayers(1); } }
  else          { if (_t2PlayerCount > 1) { _t2PlayerCount--; renderTeamPlayers(2); } }
}

function updateFormatVisibility() {
  // Show format sections based on max player count across both teams
  const max = Math.max(_t1PlayerCount, _t2PlayerCount);
  const show2 = document.getElementById('fmt_2p_section');
  const show3 = document.getElementById('fmt_3p_section');
  const show4 = document.getElementById('fmt_4p_section');
  if (show2) show2.style.display = max <= 2 ? '' : 'none';
  if (show3) show3.style.display = max === 3 ? '' : 'none';
  if (show4) show4.style.display = max >= 4 ? '' : 'none';
  // Auto-select appropriate default format when switching
  const curFmt = radio('fmt');
  const is2p = ['35_15','25_20','20_15','50_50'].includes(curFmt);
  const is3p = ['30_20_10','20_15_10','15_12_10'].includes(curFmt);
  const is4p = ['25_20_15_10','20_15_10_5','15_12_10_7'].includes(curFmt);
  if (max <= 2 && !is2p) document.getElementById('fA').checked = true;
  if (max === 3 && !is3p) { const el = document.getElementById('fE'); if(el) el.checked = true; }
  if (max >= 4 && !is4p) { const el = document.getElementById('fG'); if(el) el.checked = true; }
}

function initTeamPlayers() {
  renderTeamPlayers(1);
  renderTeamPlayers(2);
  // Prefill player 1 from profile
  prefillFromProfile();
}

// ── PLAYER NAME DROPDOWN ─────────────────────────────────────

function getPlayerSuggestions() {
  const pool = [];
  // From My Scramble saved teams
  _savedTeams.forEach(t => {
    const players = getTeamPlayers(t);
    players.forEach(p => {
      if (p.name && !pool.find(x => x.name.toLowerCase() === p.name.toLowerCase()))
        pool.push({ name: p.name, hcp: p.hcp });
    });
  });
  // From Profile buddy teams
  _teams.forEach(t => {
    if (t.buddyName && !pool.find(x => x.name.toLowerCase() === t.buddyName.toLowerCase()))
      pool.push({ name: t.buddyName, hcp: null });
  });
  // From profile itself
  if (_profile?.displayName && !pool.find(x => x.name.toLowerCase() === _profile.displayName.toLowerCase()))
    pool.push({ name: _profile.displayName, hcp: _profile.hcpIndex ?? null });
  return pool;
}

function getTeamPlayers(t) {
  // Support both old 2-player format and new multi-player format
  const players = [];
  if (t.players && Array.isArray(t.players)) return t.players;
  for (let i = 1; i <= 4; i++) {
    const name = t[`p${i}Name`];
    const hcp  = t[`p${i}Hcp`];
    if (name) players.push({ name, hcp });
  }
  return players;
}

function onPlayerNameInput(ti, pi, el) {
  const q = el.value.trim().toLowerCase();
  showPlayerSuggestions(ti, pi, q);
}

function onPlayerNameFocus(ti, pi, el) {
  showPlayerSuggestions(ti, pi, el.value.trim().toLowerCase());
  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      const sugEl = document.getElementById(`t${ti}p${pi}_suggestions`);
      if (sugEl && !sugEl.contains(e.target) && e.target !== el) {
        sugEl.style.display = 'none';
        document.removeEventListener('click', handler);
      }
    });
  }, 0);
}

function showPlayerSuggestions(ti, pi, q) {
  const sugEl = document.getElementById(`t${ti}p${pi}_suggestions`);
  if (!sugEl) return;
  const pool = getPlayerSuggestions();
  const matches = q
    ? pool.filter(p => p.name.toLowerCase().includes(q))
    : pool;
  if (!matches.length) { sugEl.style.display = 'none'; return; }
  sugEl.innerHTML = matches.slice(0, 6).map(p => `
    <div class="player-suggestion-item" onclick="selectPlayerSuggestion(${ti},${pi},'${esc(p.name)}',${p.hcp !== null && p.hcp !== undefined ? p.hcp : 'null'})">
      <span class="player-suggestion-name">${esc(p.name)}</span>
      <span class="player-suggestion-hcp">${p.hcp !== null && p.hcp !== undefined ? 'HCP '+p.hcp : ''}</span>
    </div>`).join('');
  sugEl.style.display = '';
}

function selectPlayerSuggestion(ti, pi, name, hcp) {
  setVal(`t${ti}p${pi}_name`, name);
  if (hcp !== null && hcp !== undefined) setVal(`t${ti}p${pi}_hcp`, hcp);
  const sugEl = document.getElementById(`t${ti}p${pi}_suggestions`);
  if (sugEl) sugEl.style.display = 'none';
}

// ── SAVE TEAM (updated for multi-player) ────────────────────
async function saveTeam() {
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid) { showToast(t('toast_signin_first'), 'error'); return; }
  // Collect players dynamically
  const players = [];
  for (let pi = 1; pi <= _t1PlayerCount; pi++) {
    const pfx = `t1p${pi}`;
    const hcp = numVal(pfx + '_hcp');
    players.push({
      name:   val(pfx + '_name') || '',
      hcp:    isNaN(hcp) ? null : hcp,
      gender: radio(pfx + '_g') || 'M',
      tee:    radio(pfx + '_tee') || 'main',
    });
  }
  const data = {
    id:        Date.now().toString(),
    teamName:  val('team1_name') || 'My Team',
    players,
    p1Name:    players[0]?.name  || null,
    p1Hcp:     players[0]?.hcp   ?? null,
    p2Name:    players[1]?.name  || null,
    p2Hcp:     players[1]?.hcp   ?? null,
    savedAt:   new Date().toISOString(),
  };
  const btn = document.getElementById('saveTeamBtn');
  if (_savedTeams.length >= maxTeamsForUser()) {
    showToast(`Free plan allows ${maxTeamsForUser()} saved teams — delete one, or go Pro for unlimited.`, 'error');
    return;
  }
  btn.textContent = '⏳';
  try {
    _savedTeams.push(data);
    await persistTeams(uid);
    btn.textContent = '✓ Saved'; btn.classList.add('saved');
    setTimeout(() => { btn.textContent = '💾 Save'; btn.classList.remove('saved'); }, 2200);
    showToast('Team saved!', 'success');
    renderMyData();
  } catch(e) {
    _savedTeams.pop();
    btn.textContent = '💾 Save';
    showToast('Could not save: ' + e.message, 'error');
  }
}

async function deleteTeam(id) {
  deleteTeamWithConfirm(id);
}

async function persistTeams(uid) {
  // Firestore rejects undefined values — sanitise the entire list first
  const clean = JSON.parse(JSON.stringify(_savedTeams, (key, val) => {
    if (val !== val) return null;          // NaN → null
    if (val === undefined) return null;    // undefined → null
    return val;
  }));
  await window._fbDb.collection('users').doc(uid).collection('saved').doc('teams_v2').set({ list: clean });
}

function loadTeamIntoCalc(id) {
  const t = _savedTeams.find(x => x.id === id);
  if (!t) return;
  setVal('team1_name', t.teamName);

  // Build players from new or legacy format
  const allPlayers = t.players && t.players.length
    ? t.players
    : [
        { name: t.p1Name, hcp: t.p1Hcp, gender: 'M', tee: 'main' },
        { name: t.p2Name, hcp: t.p2Hcp, gender: 'M', tee: 'main' },
      ].filter(p => p.name);

  if (t.source === 'profile') {
    // Profile teams: buddies fill slots 2, 3, 4 — slot 1 is always the user (auto-filled from profile)
    const buddyPlayers = allPlayers; // already excludes user (see syncProfileTeamToSavedTeams)
    _t1PlayerCount = Math.max(2, Math.min(4, buddyPlayers.length + 1)); // +1 for user in slot 1
    renderTeamPlayers(1);
    // Slot 1 is user — prefill from profile
    prefillFromProfile();
    // Fill buddy slots starting at 2
    buddyPlayers.forEach((p, i) => {
      const pi  = i + 2; // start at slot 2
      if (pi > 4) return;
      const pfx = `t1p${pi}`;
      setVal(pfx + '_name', p.name || '');
      setVal(pfx + '_hcp',  p.hcp != null && !isNaN(p.hcp) ? p.hcp : '');
      setRadio(pfx + '_g',   p.gender || 'M');
      setRadio(pfx + '_tee', p.tee    || 'main');
    });
  } else {
    // Calculator-saved teams: fill all slots starting at 1
    _t1PlayerCount = Math.max(2, Math.min(4, allPlayers.length));
    renderTeamPlayers(1);
    allPlayers.forEach((p, i) => {
      const pi  = i + 1;
      const pfx = `t1p${pi}`;
      setVal(pfx + '_name', p.name || '');
      setVal(pfx + '_hcp',  p.hcp != null && !isNaN(p.hcp) ? p.hcp : '');
      setRadio(pfx + '_g',   p.gender || 'M');
      setRadio(pfx + '_tee', p.tee    || 'main');
    });
  }

  switchTab('calc');
  document.getElementById('pageCalc').scrollTop = 0;
  showToast(`"${t.teamName}" loaded!`, 'success');
}

// ═══════════════════════════════════
// RENDER MY DATA TAB
// ═══════════════════════════════════
function renderMyData() {
  // --- Courses ---
  document.getElementById('courseCount').textContent = `${_savedCourses.length} / ${MAX_COURSES}`;
  document.getElementById('coursesFull').classList.toggle('visible', _savedCourses.length >= MAX_COURSES);
  // Show import button for admin only
  const uid = window._fbAuth?.currentUser?.uid;
  const adminBtn = document.getElementById('adminImportBtn');
  if (adminBtn) adminBtn.style.display = uid === ADMIN_UID ? '' : 'none';
  const cList = document.getElementById('coursesList');
  if (_savedCourses.length === 0) {
    cList.innerHTML = `<div class="saved-empty"><span class="saved-empty-icon">📍</span>No courses saved yet.<br>Fill in course details in the Calculator tab and tap 💾 Save.</div>`;
  } else {
    cList.innerHTML = _savedCourses.map(c => {
      const hLabel  = c.holes === 9 ? '9 holes' : '18 holes';
      const champ   = !isNaN(c.tee1_rating) ? ` · Champ ${c.tee1_rating}/${c.tee1_slope}` : '';
      const fwd     = !isNaN(c.tee3_rating) ? ` · Fwd ${c.tee3_rating}/${c.tee3_slope}` : '';
      const badge   = c.courseId
        ? `<span class="ms-course-badge shared" title="Linked to shared database">🌐</span>`
        : `<span class="ms-course-badge personal" title="Personal save only">👤</span>`;
      return `
        <div class="saved-card">
          <div class="saved-card-icon">📍</div>
          <div class="saved-card-body">
            <div class="saved-card-name">${badge} ${esc(c.name)}</div>
            <div class="saved-card-meta">
              <strong>${hLabel}</strong> · Medal ${c.rating}/${c.slope} · Par ${c.par}${champ}${fwd}
            </div>
          </div>
          <div class="saved-card-actions">
            <button class="btn-card-edit" onclick="openEditCourse('${c.id}')">✏️</button>
            <button class="btn-card-load" onclick="loadCourseIntoCalc('${c.id}')">Load</button>
            <button class="btn-card-delete" onclick="deleteCourse('${c.id}')" title="Delete">🗑</button>
          </div>
        </div>`;
    }).join('');
  }

  // --- Teams ---
  document.getElementById('teamCount').textContent = `${_savedTeams.length}`;
  document.getElementById('teamsFull').classList.remove('visible'); // unlimited — never show cap message
  const tList = document.getElementById('teamsList');
  if (_savedTeams.length === 0) {
    tList.innerHTML = `<div class="saved-empty"><span class="saved-empty-icon">🏌️</span>No teams saved yet.<br>Fill in your team in the Calculator tab and tap 💾 Save.</div>`;
  } else {
    tList.innerHTML = _savedTeams.map(t => {
      const players = t.players && t.players.length
        ? t.players
        : [
            { name: t.p1Name, hcp: t.p1Hcp },
            { name: t.p2Name, hcp: t.p2Hcp },
          ].filter(p => p.name);
      const count = players.length;
      const badge = `<span style="background:var(--green);color:#fff;font-size:0.58rem;padding:2px 7px;border-radius:10px;font-weight:700;margin-left:6px;">${count}P</span>`;
      const playerMeta = players.map(p => {
        const h = isNaN(p.hcp) ? '–' : Number(p.hcp).toFixed(1);
        return `${esc(p.name)} <strong>${h}</strong>`;
      }).join(' &nbsp;·&nbsp; ');
      return `
        <div class="saved-card">
          <div class="saved-card-icon">🏌️</div>
          <div class="saved-card-body">
            <div class="saved-card-name">${esc(t.teamName)}${badge}</div>
            <div class="saved-card-meta">${playerMeta}</div>
          </div>
          <div class="saved-card-actions">
            <button class="btn-card-load" onclick="loadTeamIntoCalc('${t.id}')">Load</button>
            <button class="btn-card-delete" onclick="deleteTeamWithConfirm('${t.id}')" title="Delete">🗑</button>
          </div>
        </div>`;
    }).join('');
  }

  // --- Rounds: cap visible history for Free tier (non-destructive — all
  // rounds remain in Firestore; Pro simply reveals the rest, no migration) ---
  const _visibleRounds = _savedRounds.slice(0, maxMatchHistoryForUser());
  // --- Rounds: split solo vs match ---
  const soloRounds  = _visibleRounds.filter(r => !r.isMatch && r.mode !== 'match1v1');   // legacy list: skip 1vs1 matches
  const matchRounds = _visibleRounds.filter(r =>  r.isMatch);

  document.getElementById('soloRoundCount').textContent  = soloRounds.length;
  document.getElementById('matchRoundCount').textContent = matchRounds.length;

  // Solo rounds
  const srList = document.getElementById('soloRoundsList');
  if (soloRounds.length === 0) {
    srList.innerHTML = `<div class="saved-empty"><span class="saved-empty-icon">📋</span>No solo rounds saved yet.<br>Play in Single mode and tap 💾 Save Round.</div>`;
  } else {
    srList.innerHTML = soloRounds.map(r => {
      const vsPar     = r.vsPar ?? (r.gross - (r.parPlayed || r.totalPar));
      const vsClass   = vsPar < 0 ? 'under' : vsPar > 0 ? 'over' : 'even';
      const vsLabel   = vsPar === 0 ? 'E' : vsPar > 0 ? `+${vsPar}` : `${vsPar}`;
      const hLabel    = (r.holes === 9 ? '9' : '18') + ' holes';
      const playedStr = r.playedAt ? new Date(r.playedAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '';
      const holesNote = r.holesPlayed < r.holes ? ` · ${r.holesPlayed} played` : '';
      return `
        <div class="round-card" onclick="openRoundView('${r.id}')">
          <div class="round-card-icon">📋</div>
          <div class="round-card-body">
            <div class="round-card-name">${esc(r.courseName || 'Unnamed Course')}</div>
            <div class="round-card-meta">
              <strong>${hLabel}${holesNote}</strong> · ${esc(r.teamName || '')} · HCP ${r.teamHcp}
              ${playedStr ? '<br>' + playedStr : ''}
            </div>
          </div>
          <div class="round-score-badge">
            <div class="round-score-num ${vsClass}">${vsLabel}</div>
            <div class="round-score-lbl">vs par</div>
          </div>
          <button class="round-share-btn" onclick="event.stopPropagation();shareRoundFromList('${r.id}')" title="Share scorecard">↗</button>
          <div class="round-card-chevron">›</div>
        </div>`;
    }).join('');
  }

  // Match rounds
  const mrList = document.getElementById('matchRoundsList');
  if (matchRounds.length === 0) {
    mrList.innerHTML = `<div class="saved-empty"><span class="saved-empty-icon">⚔️</span>No match rounds saved yet.<br>Play in Match mode and tap 💾 Save Round.</div>`;
  } else {
    mrList.innerHTML = matchRounds.map(r => {
      const hLabel    = (r.holes === 9 ? '9' : '18') + ' holes';
      const playedStr = r.playedAt ? new Date(r.playedAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '';
      const holesNote = r.holesPlayed < r.holes ? ` · ${r.holesPlayed} played` : '';

      // Recalculate match result from stored scores
      const par       = r.par       || Array(r.holes).fill(4);
      const scores    = r.scores    || Array(r.holes).fill(0);
      const oppScores = r.oppScores || Array(r.holes).fill(0);
      const hcpDiff   = (r.oppHcp || 0) - (r.teamHcp || 0);
      const indexArr  = _denseSIRanks(r.index, r.holes);
      let myWins = 0, oppWins = 0;
      for (let i = 0; i < r.holes; i++) {
        if (scores[i] > 0 && oppScores[i] > 0) {
          const s = strokeOnHoleWithIndex(i, hcpDiff, indexArr, r.holes);
          const myNet  = scores[i]    + (s < 0 ? s : 0);
          const oppNet = oppScores[i] + (s > 0 ? -s : 0);
          if      (myNet < oppNet) myWins++;
          else if (myNet > oppNet) oppWins++;
        }
      }
      const diff = myWins - oppWins;
      let resultLabel, resultClass;
      if (diff > 0)       { resultLabel = `${diff} UP`;  resultClass = 'under'; }
      else if (diff < 0)  { resultLabel = `${Math.abs(diff)} DN`; resultClass = 'over'; }
      else                { resultLabel = 'A/S';          resultClass = 'even'; }

      return `
        <div class="round-card" onclick="openRoundView('${r.id}')">
          <div class="round-card-icon">⚔️</div>
          <div class="round-card-body">
            <div class="round-card-name">${esc(r.courseName || 'Unnamed Course')}</div>
            <div class="round-card-meta">
              <strong>${hLabel}${holesNote}</strong> · ${esc(r.teamName || '')} vs ${esc(r.oppName || 'Opponent')}
              ${playedStr ? '<br>' + playedStr : ''}
            </div>
          </div>
          <div class="round-score-badge">
            <div class="round-score-num ${resultClass}">${resultLabel}</div>
            <div class="round-score-lbl">net result</div>
          </div>
          <button class="round-share-btn" onclick="event.stopPropagation();shareRoundFromList('${r.id}')" title="Share scorecard">↗</button>
          <div class="round-card-chevron">›</div>
        </div>`;
    }).join('');
  }
}

// ═══════════════════════════════════
// LOAD SAVED DATA FROM FIRESTORE
// ═══════════════════════════════════
async function loadSavedData(uid) {
  // Release 2: the four reads run at the same time (one network wait instead of four);
  // results are still handled in the original order below.
  const _db = window._fbDb;
  const [_rC, _rT, _rR, _rS] = await Promise.allSettled([
    _db.collection('users').doc(uid).collection('saved').doc('courses_v2').get(),
    _db.collection('users').doc(uid).collection('saved').doc('teams_v2').get(),
    _db.collection('users').doc(uid).collection('rounds').orderBy('playedAt', 'desc').get(),
    _db.collection('courses_shared').limit(200).get(),
  ]);
  const _got = r => { if (r.status === 'rejected') throw r.reason; return r.value; };

  try {
    const snap = _got(_rC);
    if (snap.exists && Array.isArray(snap.data().list)) {
      _savedCourses = snap.data().list;
    }
  } catch(e) { console.warn('Could not load courses:', e); }

  try {
    const snap = _got(_rT);
    if (snap.exists && Array.isArray(snap.data().list)) {
      _savedTeams = snap.data().list;
    }
  } catch(e) { console.warn('Could not load teams:', e); }

  try {
    const snap = _got(_rR);
    _savedRounds = [];
    snap.forEach(doc => _savedRounds.push(doc.data()));
    // v35: repair a 1vs1 copy that was stored from the opponent's side (this player is
    // playerB). Each player must be playerA in their own history, or a win reads as a loss.
    _savedRounds.forEach((r, i) => {
      if (!r || r.mode !== 'match1v1' || typeof m1FlipRound !== 'function') return;
      const A = r.playerA || {}, B = r.playerB || {};
      if (B.uid !== uid || A.uid === uid) return;
      const fixed = m1FlipRound(r); fixed.repairedSide = true;
      _savedRounds[i] = fixed;
      const rid = (snap.docs && snap.docs[i]) ? snap.docs[i].id : r.id;   // same order as _savedRounds
      if (rid) _db.collection('users').doc(uid).collection('rounds').doc(String(rid)).set(fixed)
        .catch(e => console.warn('1vs1 side repair', e && e.code));
    });
  } catch(e) { console.warn('Could not load rounds:', e); }

  // Load shared course database
  try {
    const snap = _got(_rS);
    _sharedCourses = [];
    snap.forEach(doc => _sharedCourses.push({ ...doc.data(), _docId: doc.id }));
    // Sort alphabetically in JS — no index needed
    _sharedCourses.sort((a, b) => a.name.localeCompare(b.name));
  } catch(e) { console.warn('Could not load shared courses:', e); }

  // Auto-update personal saves that are linked to shared courses
  let didUpdate = false;
  _savedCourses = _savedCourses.map(c => {
    if (!c.courseId) return c;
    const shared = _sharedCourses.find(s => s.courseId === c.courseId);
    if (!shared) return c;
    // Update personal save with latest shared data (preserving id and savedAt)
    didUpdate = true;
    return { ...c, ...shared, id: c.id, savedAt: c.savedAt, courseId: c.courseId };
  });
  if (didUpdate) persistCourses(uid).catch(() => {});

  renderMyData();
}

// ═══════════════════════════════════
// AUTH
// ═══════════════════════════════════
// Release 3c: Instagram, Facebook, TikTok etc. open links in their own built-in browser,
// where Google blocks sign-in. Detect it so the sheet can point people to Chrome/Safari.
function _isInAppBrowser() {
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|FB_IAB|Instagram|LinkedInApp|musical_ly|Bytedance|TikTok|Snapchat|Pinterest|Line\//i.test(ua) ||
         (/Android/.test(ua) && /; wv\)/.test(ua));
}
function _showInAppNotice() {
  const box = document.getElementById('authInAppNotice');
  if (!box) return;
  const inApp = _isInAppBrowser();
  box.style.display = inApp ? 'block' : 'none';
  if (!inApp) return;
  const android = /Android/i.test(navigator.userAgent || '');
  const btn = document.getElementById('authInAppOpen');
  const ios = document.getElementById('authInAppIos');
  if (btn) {
    btn.style.display = android ? 'inline-block' : 'none';
    btn.href = 'intent://' + location.host + location.pathname + location.search + '#Intent;scheme=https;package=com.android.chrome;end';
  }
  if (ios) ios.style.display = android ? 'none' : 'block';
}
function openAuthModal() {
  switchToSignIn();
  document.getElementById('authModal').classList.remove('hidden');
  _showInAppNotice();
  // Release 3c (H11): give the sheet its own history step, so Android Back closes the
  // sheet instead of the whole app.
  try { if (!(history.state && history.state.authSheet)) history.pushState({ screen: _activeScreenId(), authSheet: true }, ''); } catch(e){}
}
function closeAuthModal(fromBack) {
  document.getElementById('authModal').classList.add('hidden');
  clearAuthForms();
  // Closed by sign-in or a tap beside the sheet: drop the sheet's history step again.
  if (!fromBack) { try { if (history.state && history.state.authSheet) history.back(); } catch(e){} }
}
function clearAuthForms() {
  ['signInEmail','signInPass','regName','regEmail','regPass','regPassConfirm'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  setAuthError('signInError',''); setAuthError('registerError','');
  setAuthBtnLoading('btnSignIn',false,'Sign In →'); setAuthBtnLoading('btnRegister',false,'Create Account →');
}
function switchToSignIn() {
  document.getElementById('formSignIn').style.display = 'block';
  document.getElementById('formRegister').style.display = 'none';
  document.getElementById('authModalTitle').textContent = 'Welcome back';
}
function switchToRegister() {
  document.getElementById('formSignIn').style.display = 'none';
  document.getElementById('formRegister').style.display = 'block';
  document.getElementById('authModalTitle').textContent = 'Create account';
}
function setAuthError(id, msg) { const el = document.getElementById(id); if (!el) return; el.textContent = msg; el.classList.toggle('visible', !!msg); }
function setAuthBtnLoading(id, loading, def) { const btn = document.getElementById(id); if (!btn) return; btn.textContent = loading ? 'Please wait…' : def; btn.disabled = loading; }

// Release 1b: while the Google window is open, keep the green "Connecting…" spinner up behind
// it, so returning to the app lands on the spinner instead of the sign-in sheet. On cancel or
// error the spinner closes and the sheet shows the message. Because Google's page blocks
// Firebase from seeing that its window was closed (COOP warning), a 10-second guard starts
// once the app is back in front: if no user arrived by then, treat it as cancelled.
let _gsiGuardT = null;
let _gsiLeft = false;   // true once the app lost focus / went to the background for the Google window
function _gsiMarkLeft() { if (_authInProgress) _gsiLeft = true; }
function _gsiShowSpinner(on) {
  const alo = document.getElementById('authLoadingOverlay');
  if (!alo) return;
  alo.style.display = on ? 'flex' : 'none';
  alo.style.pointerEvents = on ? 'auto' : 'none';
}
function _gsiEnd(msg) {
  clearTimeout(_gsiGuardT); _gsiGuardT = null;
  window.removeEventListener('focus', _gsiArmGuard);
  window.removeEventListener('blur', _gsiMarkLeft);
  document.removeEventListener('visibilitychange', _gsiArmGuard);
  if (!_authInProgress) return;
  _authInProgress = false;
  if (window._fbAuth && window._fbAuth.currentUser) return;   // signed in: onSignedIn() owns the spinner
  _gsiShowSpinner(false);
  if (msg) setAuthError('signInError', msg);
}
function _gsiArmGuard() {
  if (document.visibilityState === 'hidden') { _gsiMarkLeft(); return; }
  if (!_authInProgress || !_gsiLeft) return;   // only once the user has come BACK from the Google window
  clearTimeout(_gsiGuardT);
  _gsiGuardT = setTimeout(function(){ _gsiEnd('Sign-in cancelled.'); }, 10000);
}
async function doGoogleSignIn() {
  if (!window._fbAuth || _authInProgress) return;
  setAuthError('signInError','');
  if (_isInAppBrowser()) {   // Google refuses sign-in here; don't send people into an error page
    setAuthError('signInError', 'Open Parmate in Chrome or Safari to continue with Google, or sign in with email.');
    return;
  }
  _authInProgress = true;   // blocks a service-worker reload while the popup is open (Release 1)
  _gsiLeft = false;
  _gsiShowSpinner(true);
  window.addEventListener('blur', _gsiMarkLeft);
  window.addEventListener('focus', _gsiArmGuard);
  document.addEventListener('visibilitychange', _gsiArmGuard);
  try {
    await window._fbAuth.signInWithPopup(window._fbGoogleProvider);
    closeAuthModal();   // hidden behind the spinner; onSignedIn() takes over from here
    _gsiEnd('');
  } catch(e) {
    _gsiEnd(e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request' ? 'Sign-in cancelled.' : e.code === 'auth/popup-blocked' ? 'Popup blocked.' : 'Google sign-in failed.');
  }
}

async function doEmailSignIn() {
  if (!window._fbAuth) return;
  const email = document.getElementById('signInEmail').value.trim();
  const pass  = document.getElementById('signInPass').value;
  setAuthError('signInError','');
  if (!email) { setAuthError('signInError','Please enter your email.'); return; }
  if (!pass)  { setAuthError('signInError','Please enter your password.'); return; }
  setAuthBtnLoading('btnSignIn',true,'Sign In →');
  try { await window._fbAuth.signInWithEmailAndPassword(email, pass); closeAuthModal(); }
  catch(e) {
    setAuthError('signInError', (e.code==='auth/user-not-found'||e.code==='auth/wrong-password'||e.code==='auth/invalid-credential') ? 'Incorrect email or password.' : e.code==='auth/too-many-requests' ? 'Too many attempts — try again later.' : 'Sign-in failed: '+e.message);
    document.getElementById('signInPass').value = '';
  } finally { setAuthBtnLoading('btnSignIn',false,'Sign In →'); }
}

async function doRegister() {
  if (!window._fbAuth) return;
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass  = document.getElementById('regPass').value;
  const conf  = document.getElementById('regPassConfirm').value;
  setAuthError('registerError','');
  if (!name)           { setAuthError('registerError','Please enter your name.'); return; }
  if (!email)          { setAuthError('registerError','Please enter your email.'); return; }
  if (pass.length < 6) { setAuthError('registerError','Password must be at least 6 characters.'); return; }
  if (pass !== conf)   { setAuthError('registerError','Passwords do not match.'); return; }
  setAuthBtnLoading('btnRegister',true,'Create Account →');
  try {
    const cred = await window._fbAuth.createUserWithEmailAndPassword(email, pass);
    await cred.user.updateProfile({ displayName: name });
    closeAuthModal();
  } catch(e) {
    setAuthError('registerError', e.code==='auth/email-already-in-use' ? 'An account with this email already exists.' : e.code==='auth/weak-password' ? 'Password too weak.' : 'Registration failed: '+e.message);
  } finally { setAuthBtnLoading('btnRegister',false,'Create Account →'); }
}

async function doSignOut() {
  // Close profile overlay immediately
  const overlay = document.getElementById('profileOverlay');
  if (overlay) {
    overlay.classList.remove('open');
    overlay.style.display = 'none';
  }
  if (window._fbAuth) await window._fbAuth.signOut();
}

// ═══════════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════════

// ── LEGAL OVERLAY ────────────────────────────────────────────

function openLegal(tab) {
  showLegalTab(tab || 'privacy');
  const ov = document.getElementById('legalOverlay');
  ov.style.display = '';
  requestAnimationFrame(() => ov.classList.add('open'));
}

function closeLegal() {
  const ov = document.getElementById('legalOverlay');
  ov.classList.remove('open');
  setTimeout(() => { ov.style.display = 'none'; }, 350);
}

function showLegalTab(tab) {
  ['privacy','legal','cookies'].forEach(t => {
    const content = document.getElementById(`legalContent${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const btn     = document.getElementById(`legalTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (content) content.style.display = t === tab ? '' : 'none';
    if (btn)     btn.classList.toggle('active', t === tab);
  });
}

async function requestDataDeletion() {
  const uid = window._fbAuth?.currentUser?.uid;
  const email = window._fbAuth?.currentUser?.email;
  if (!uid) { showToast(t('toast_signin_first'), 'error'); return; }
  if (!confirm(`Send a data deletion request for ${email}?\n\nWe will permanently delete your account and all data within 30 days. This cannot be undone.`)) return;
  try {
    // Write deletion request to Firestore — admin processes manually
    await window._fbDb.collection('deletion_requests').add({
      uid,
      email:     email || null,
      requestedAt: new Date().toISOString(),
      status:    'pending',
    });
    showToast(t('toast_deletion_sent'), 'success');
  } catch(e) {
    // Fallback — email link
    window.location.href = `mailto:legal@theninthtee.eu?subject=Data Deletion Request&body=Please delete my account. UID: ${uid}, Email: ${email}`;
  }
}

// ── WHAT'S NEW MODAL ────────────────────────────────────────

const WHATS_NEW_VERSION = 'parmate_seen_v0.9';

// The pop-up is gone (14 Oct 2026): "What's New" now lives at the top of Help & FAQ (menu).
function checkWhatsNew() { /* no automatic pop-up any more */ }

// Opens Help & FAQ with the What's New section expanded.
function showWhatsNew() {
  if (typeof showScreen === 'function') showScreen('faq');
  var d = document.getElementById('faqWhatsNew'); if (d) d.open = true;
}

function dismissWhatsNew() {
  var d = document.getElementById('faqWhatsNew'); if (d) d.open = false;
}

function openProfile() {
  renderAvatarGrid();
  renderProfileForm();
  renderTeamsList();
  renderBuddiesList();
  renderPendingRequests();
  // Show summary if profile exists, edit form if new user
  if (_profile && _profile.displayName) {
    showProfileSummary();
  } else {
    document.getElementById('profileSummary').style.display = 'none';
    document.getElementById('profileEditSection').style.display = '';
  }
  const el = document.getElementById('profileOverlay');
  el.style.display = '';
  requestAnimationFrame(() => el.classList.add('open'));
}

function toggleProfileEdit() {
  const editSection = document.getElementById('profileEditSection');
  const isHidden = editSection.style.display === 'none';
  editSection.style.display = isHidden ? '' : 'none';
}

function showProfileSummary() {
  if (!_profile) return;
  const summaryEl  = document.getElementById('profileSummary');
  const editEl     = document.getElementById('profileEditSection');
  const avatarImg  = document.getElementById('profileSummaryAvatar');
  const nameEl     = document.getElementById('profileSummaryName');
  const metaEl     = document.getElementById('profileSummaryMeta');
  const courseEl   = document.getElementById('profileSummaryCourse');
  summaryEl.style.display = '';
  editEl.style.display    = 'none';
  if (avatarImg && _profile.avatarId && AVATARS[_profile.avatarId]) {
    avatarImg.src = AVATARS[_profile.avatarId];
  }
  if (nameEl)   nameEl.textContent   = _profile.displayName || '—';
  if (metaEl)   metaEl.textContent   = _profile.hcpIndex !== null && _profile.hcpIndex !== undefined ? `HCP ${_profile.hcpIndex}` : 'HCP not set';
  if (courseEl) courseEl.textContent = _profile.homeCourse || 'No home course set';
}

function closeProfile() {
  const el = document.getElementById('profileOverlay');
  el.classList.remove('open');
  setTimeout(() => { el.style.display = 'none'; }, 350);
}

function renderAvatarGrid() {
  const grid = document.getElementById('avatarGrid');
  const selected = _profile?.avatarId || 1;
  grid.innerHTML = Object.keys(AVATARS).map(id => `
    <div class="avatar-option">
      <input type="radio" name="avatarSelect" id="avt_${id}" value="${id}" ${parseInt(id)===selected?'checked':''}>
      <label for="avt_${id}"><img src="${AVATARS[id]}" alt="Avatar ${id}"></label>
    </div>`).join('');
}

function renderProfileForm() {
  if (!_profile) return;
  const nameEl = document.getElementById('profileName');
  const hcpEl  = document.getElementById('profileHcp');
  const courseEl = document.getElementById('profileHomeCourse');
  if (nameEl)   nameEl.value   = _profile.displayName || '';
  if (hcpEl)    hcpEl.value    = _profile.hcpIndex ?? '';
  if (courseEl) courseEl.value = _profile.homeCourse  || '';
}

function renderPendingRequests() {
  const banner = document.getElementById('profileRequestsBanner');
  const list   = document.getElementById('profileRequestsList');
  if (!banner || !list) return;
  if (_pendingRequests.length === 0) { banner.style.display = 'none'; return; }
  banner.style.display = '';
  list.innerHTML = _pendingRequests.map(r => {
    const avatarHtml = r.fromAvatar && AVATARS[r.fromAvatar]
      ? `<img src="${AVATARS[r.fromAvatar]}" alt="">`
      : `<span>🏌️</span>`;
    const isBuddyReq = r.type === 'buddy_request';
    const subLabel   = isBuddyReq
      ? `<div class="team-buddy-meta">Wants to be your buddy${r.fromHcp != null ? ` · HCP ${r.fromHcp}` : ''}</div>`
      : `<div class="team-buddy-meta">Team: ${esc(r.teamName || '—')}</div>`;
    return `
      <div class="request-card">
        <div class="team-buddy-avatar">${avatarHtml}</div>
        <div class="team-buddy-info">
          <div class="team-buddy-name">${esc(r.fromName || '—')}</div>
          ${subLabel}
        </div>
        <div class="request-card-actions">
          <button class="btn-accept" onclick="acceptBuddyRequest('${r.id}')">✓</button>
          <button class="btn-decline" onclick="declineBuddyRequest('${r.id}')">✕</button>
        </div>
      </div>`;
  }).join('');
}

async function saveProfile() {
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid) return;
  const name    = document.getElementById('profileName').value.trim();
  const hcp     = parseFloat(document.getElementById('profileHcp').value);
  const course  = document.getElementById('profileHomeCourse').value.trim();
  const avatarId = parseInt(document.querySelector('input[name="avatarSelect"]:checked')?.value || 1);
  if (!name) { showToast('Please enter a display name.', 'error'); return; }

  const data = {
    displayName: name,
    hcpIndex:    isNaN(hcp) ? null : hcp,
    homeCourse:  course || null,
    avatarId,
    updatedAt:   new Date().toISOString()
  };

  try {
    // MERGE (not overwrite): this legacy save must never wipe cover, custom
    // avatar/cover URLs, gender, or subscription fields that live on the same
    // profile doc. Using .set(..., {merge:true}) preserves everything not listed.
    await window._fbDb.collection('users').doc(uid).collection('profile').doc('data').set(data, { merge: true });
    // Write to public_profiles for buddy search (flat collection, no index needed)
    await window._fbDb.collection('public_profiles').doc(uid).set({
      displayName: data.displayName,
      hcpIndex:    data.hcpIndex,
      homeCourse:  data.homeCourse,
      avatarId:    data.avatarId
      // v33 privacy: never put the email address in public_profiles
    }, { merge: true });
    // Merge into the in-memory profile too — do NOT replace it, or cover/avatar/
    // tier fields already loaded would be dropped until the next reload.
    _profile = Object.assign({}, _profile || {}, data);
    updateUserPill();
    prefillFromProfile();
    showProfileSummary();
    showToast('Profile saved!', 'success');
  } catch(e) { showToast('Could not save: ' + e.message, 'error'); }
}

function updateUserPill() {
  if (!_profile) return;
  const nameEl    = document.getElementById('userPillName');
  const imgEl     = document.getElementById('userPillAvatarImg');
  const fallback  = document.getElementById('userPillAvatarFallback');
  if (nameEl) nameEl.textContent = _profile.displayName || nameEl.textContent;
  if (_profile.avatarId && AVATARS[_profile.avatarId]) {
    if (imgEl)    { imgEl.src = AVATARS[_profile.avatarId]; imgEl.style.display = ''; }
    if (fallback)   fallback.style.display = 'none';
  }
}

function updateRequestBadge() {
  const badge = document.getElementById('userPillBadge');
  if (badge) badge.style.display = _pendingRequests.length > 0 ? 'flex' : 'none';
}

function prefillFromProfile() {
  if (!_profile) return;
  // Pre-fill Player 1 in calculator
  if (_profile.displayName) {
    const n1 = document.getElementById('t1p1_name');
    if (n1 && !n1.value) n1.value = _profile.displayName;
  }
  if (_profile.hcpIndex !== null && _profile.hcpIndex !== undefined) {
    const h1 = document.getElementById('t1p1_hcp');
    if (h1 && !h1.value) h1.value = _profile.hcpIndex;
  }
  // Pre-fill match setup Step 2
  const msN1 = document.getElementById('ms_t1p1_name');
  const msH1 = document.getElementById('ms_t1p1_hcp');
  if (msN1 && !msN1.value && _profile.displayName) msN1.value = _profile.displayName;
  if (msH1 && !msH1.value && _profile.hcpIndex !== null) msH1.value = _profile.hcpIndex;
}

// ── BUDDY SEARCH OVERLAY ─────────────────────────────────────

let _buddySearchTimer  = null;
let _viewingPublicUid  = null; // uid of the public profile currently open

function openBuddySearch() {
  const ov = document.getElementById('buddySearchOverlay');
  ov.style.display = '';
  requestAnimationFrame(() => ov.classList.add('open'));
  const inp = document.getElementById('buddySearchInput');
  if (inp) { inp.value = ''; if(typeof t==='function') inp.placeholder = t('ab_search_ph'); setTimeout(() => inp.focus(), 350); }
  document.getElementById('buddySearchResults').innerHTML = '';
  const stat = document.getElementById('buddySearchStatus');
  if (stat) { stat.textContent = (typeof t==='function') ? t('ab_status_default') : 'Type a name or email to search'; stat.style.display = ''; }
  renderSentRequests();
  if(typeof renderBuddiesList==='function') renderBuddiesList();
}

function closeBuddySearch() {
  const ov = document.getElementById('buddySearchOverlay');
  ov.classList.remove('open');
  setTimeout(() => { ov.style.display = 'none'; }, 350);
}

function onBuddySearchInput() {
  clearTimeout(_buddySearchTimer);
  const q = document.getElementById('buddySearchInput')?.value.trim();
  const stat = document.getElementById('buddySearchStatus');
  if (!q || q.length < 2) {
    if (stat && q && q.length) { stat.textContent = t('ab_status_short'); stat.style.display = ''; }
    document.getElementById('buddySearchResults').innerHTML = '';
    if (stat && !q) { stat.textContent = t('ab_status_default'); stat.style.display = ''; }
    return;
  }
  if (stat) { stat.textContent = 'Searching…'; stat.style.display = ''; }
  _buddySearchTimer = setTimeout(() => _doBuddySearch(q), 400);
}

async function _doBuddySearch(q) {
  const uid  = window._fbAuth?.currentUser?.uid;
  const stat = document.getElementById('buddySearchStatus');
  const res  = document.getElementById('buddySearchResults');
  if (!uid) return;
  try {
    const ql      = q.toLowerCase().trim();
    const results = [];
    // v33 privacy: email addresses are not in public profiles any more.
    // A FULL email address is looked up exactly (email_index); anything else searches names.
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ql);
    if (ql.indexOf('@') >= 0 && !isEmail) {
      if (stat) { stat.textContent = t('ab_status_full_email'); stat.style.display = ''; }
      res.innerHTML = '';
      return;
    }
    if (isEmail) {
      const fuid = (typeof pmFindUidByEmail === 'function') ? await pmFindUidByEmail(ql) : null;
      if (fuid && fuid !== uid) {
        let d = {};
        try { const ps = await window._fbDb.collection('public_profiles').doc(fuid).get(); if (ps.exists) d = ps.data() || {}; } catch (_) {}
        delete d.email;
        results.push({ uid: fuid, ...d });
      }
    } else {
      // Fetch all public profiles — small dataset, JS filter is reliable
      const snap = await window._fbDb.collection('public_profiles').get();
      snap.forEach(doc => {
        if (doc.id === uid) return; // skip self
        const d = doc.data();
        delete d.email;
        if ((d.displayName || '').toLowerCase().includes(ql)) results.push({ uid: doc.id, ...d });
      });
    }
    if (results.length === 0) {
      if (stat) { stat.textContent = isEmail ? t('ab_status_no_email') : `No players found for "${q}". Make sure they've saved their profile first.`; stat.style.display = ''; }
      res.innerHTML = '';
      return;
    }
    if (stat) stat.style.display = 'none';
    res.innerHTML = results.slice(0, 10).map(r => {
      const hcp = r.hcpIndex != null ? `HCP ${r.hcpIndex}` : '';
      const nm  = esc(r.displayName || '—');
      const safeName = (r.displayName || '').replace(/['"\\]/g, ' ');
      const isBuddy   = _buddies.find(b => b.uid === r.uid);
      const isPending = _sentBuddyRequests.find(s => s.toUid === r.uid);
      const incoming  = _incomingBuddyRequest(r.uid);
      let addBtn;
      if (isBuddy)        addBtn = `<button class="ab-btn added" disabled>\u2713 ${t('ab_buddy')}</button>`;
      else if (incoming)  addBtn = `<button class="ab-btn add" onclick="acceptBuddyRequest('${incoming.id}')">\u2713 ${t('ab_accept')}</button>`;
      else if (isPending) addBtn = `<button class="ab-btn added" disabled>\u23f3 ${t('ab_pending')}</button>`;
      else                addBtn = `<button class="ab-btn add" onclick="addBuddyDirect('${r.uid}','${safeName}')">+ ${t('ab_add')}</button>`;
      return `<div class="ab-row">
        <div class="ab-row-name">${nm}${hcp ? ` <span class="ab-row-sub">${hcp}</span>` : ''}</div>
        <button class="ab-btn" onclick="openPublicProfile('${r.uid}')">${t('ab_profile')}</button>
        ${addBtn}
      </div>`;
    }).join('');
  } catch(e) {
    if (stat) { stat.textContent = 'Search failed: ' + e.message; stat.style.display = ''; }
  }
}

// ── SENT REQUESTS PANEL ──────────────────────────────────────

async function renderSentRequests() {
  const panel = document.getElementById('sentRequestsPanel');
  const list  = document.getElementById('sentRequestsList');
  if (!panel || !list) return;

  // Refresh from Firestore
  const uid = window._fbAuth?.currentUser?.uid;
  if (uid) {
    try {
      const snap = await window._fbDb.collection('users').doc(uid)
        .collection('sentRequests').where('status','==','pending').where('type','==','buddy_request').get();
      _sentBuddyRequests = [];
      snap.forEach(doc => _sentBuddyRequests.push({ id: doc.id, ...doc.data() }));
    } catch(e) {}
  }

  if (_sentBuddyRequests.length === 0) { panel.style.display = 'none'; return; }

  // Filter out entries already accepted (buddy now in _buddies list)
  const pendingOnly = _sentBuddyRequests.filter(r => !_buddies.find(b => b.uid === r.toUid));
  if (pendingOnly.length === 0) { panel.style.display = 'none'; return; }
  panel.style.display = '';

  // Enrich any entries missing toName by fetching from public_profiles
  await Promise.all(pendingOnly.map(async r => {
    if (!r.toName || r.toName === r.toUid) {
      try {
        const snap = await window._fbDb.collection('public_profiles').doc(r.toUid).get();
        if (snap.exists) r.toName = snap.data().displayName || r.toUid;
      } catch(e) {}
    }
  }));

  list.innerHTML = pendingOnly.map(r => {
    const name = r.toName || r.toUid;
    return `
      <div style="display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:8px;">
        <div style="flex:1;">
          <div style="font-size:0.88rem;font-weight:700;color:var(--white);">${esc(name)}</div>
          <div style="margin-top:3px;font-size:0.65rem;color:#c87800;font-weight:700;">⏳ Pending</div>
        </div>
        <button onclick="cancelBuddyRequest('${r.id}','${r.toUid}')"
          style="background:none;border:1px solid var(--border2);border-radius:var(--radius-sm);color:var(--muted);font-size:0.7rem;padding:5px 10px;cursor:pointer;">
          ✕ Cancel
        </button>
      </div>`;
  }).join('');
}

async function cancelBuddyRequest(reqId, toUid) {
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid) return;
  const alreadyBuddy = _buddies.find(b => b.uid === toUid);
  const confirmMsg = alreadyBuddy
    ? 'Remove this buddy?'
    : 'Cancel this buddy request?';
  if (!confirm(confirmMsg)) return;
  try {
    // Delete sent request record
    await window._fbDb.collection('users').doc(uid).collection('sentRequests').doc(reqId).delete();
    // Also delete the pending request from their side if not yet accepted
    if (!alreadyBuddy) {
      try {
        await window._fbDb.collection('users').doc(toUid)
          .collection('buddyRequests').doc(reqId).delete();
      } catch(e) {} // may already be deleted if accepted
    } else {
      // Remove from own buddies too
      await window._fbDb.collection('users').doc(uid).collection('buddies').doc(toUid).delete();
      _buddies = _buddies.filter(b => b.uid !== toUid);
      renderBuddiesList();
    }
    _sentBuddyRequests = _sentBuddyRequests.filter(r => r.id !== reqId);
    renderSentRequests();
    showToast(alreadyBuddy ? 'Buddy removed.' : 'Request cancelled.', 'info');
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}

async function openPublicProfile(buddyUid) {
  _viewingPublicUid = buddyUid;
  // Show overlay immediately with loading state
  const ov = document.getElementById('publicProfileOverlay');
  ov.style.display = '';
  requestAnimationFrame(() => ov.classList.add('open'));
  _renderPublicProfileLoading();

  try {
    const snap = await window._fbDb.collection('public_profiles').doc(buddyUid).get();
    if (!snap.exists) { showToast('Profile not found.', 'error'); return; }
    const d = snap.data();

    // Cover band (uploaded cover, else pre-made coverId, else default green gradient)
    const covEl = document.getElementById('pubProfileCover');
    if (covEl) {
      const _covSrc = d.coverUrl || (d.coverId && typeof COVERS!=='undefined' && COVERS[d.coverId]) || null;
      covEl.style.backgroundImage = _covSrc ? `url('${_covSrc}')` : '';
    }

    // Avatar (uploaded URL preferred, else built-in avatarId, else emoji)
    const avEl = document.getElementById('pubProfileAvatar');
    if (avEl) avEl.innerHTML = d.avatarUrl
      ? `<img src="${d.avatarUrl}" alt="">`
      : (d.avatarId && AVATARS[d.avatarId] ? `<img src="${AVATARS[d.avatarId]}" alt="">` : '🏌️');

    // Name + meta line (HCP · home course; country appended once stats load)
    const nameEl = document.getElementById('pubProfileName');
    const metaEl = document.getElementById('pubProfileMeta');
    if (nameEl) nameEl.textContent = d.displayName || '—';
    const hcpStr = d.hcpIndex != null ? `<b>HCP</b> ${d.hcpIndex}` : 'HCP not set';
    const baseMeta = [hcpStr];
    if (d.homeCourse) baseMeta.push(esc(d.homeCourse));
    if (d.country) baseMeta.push(esc(d.country));
    if (metaEl) metaEl.innerHTML = baseMeta.join(' &nbsp;|&nbsp; ');

    // Add Buddy button state
    _updateAddBuddyBtn(buddyUid);

    // Stats grid + buddies count + country (best-effort reads of their subcollections)
    const stats = await _loadPublicStats(buddyUid);
    const setNum = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setNum('pubBuddyCount', stats.buddies);
    setNum('pubStatDuo',     stats.duo);
    setNum('pubStatMatch',   stats.match);
    setNum('pubStatBuddies', stats.buddies);
    setNum('pubStatTeams',   stats.teams);
    if (metaEl && stats.country) metaEl.innerHTML = baseMeta.concat([esc(stats.country)]).join(' &nbsp;|&nbsp; ');

  } catch(e) { showToast('Could not load profile: ' + e.message, 'error'); }
}

function _renderPublicProfileLoading() {
  const set = (id, v, html) => { const el = document.getElementById(id); if (el) { if (html) el.innerHTML = v; else el.textContent = v; } };
  set('pubProfileAvatar', '👤', true);
  const _cov = document.getElementById('pubProfileCover'); if (_cov) _cov.style.backgroundImage = '';
  set('pubProfileName', '…');
  set('pubProfileMeta', '');
  ['pubBuddyCount','pubStatDuo','pubStatMatch','pubStatBuddies','pubStatTeams'].forEach(id => set(id, '0'));
  const btn = document.getElementById('addBuddyBtn');
  if (btn) { btn.textContent = 'Loading…'; btn.className = 'btn-add-buddy sent'; btn.disabled = true; }
}

// Best-effort counts from a player's own subcollections (graceful 0s if rules block reads).
async function _loadPublicStats(buddyUid) {
  const stats = { duo:0, match:0, buddies:0, teams:0, country:'' };
  const safe = p => p.catch(() => null);
  try {
    const [teamsS, buddiesS, roundsS] = await Promise.all([
      safe(window._fbDb.collection('users').doc(buddyUid).collection('teams').get()),
      safe(window._fbDb.collection('users').doc(buddyUid).collection('buddies').get()),
      safe(window._fbDb.collection('users').doc(buddyUid).collection('rounds').get())
    ]);
    if (teamsS)   stats.teams   = teamsS.size || 0;
    if (buddiesS) stats.buddies = buddiesS.size || 0;
    if (roundsS)  roundsS.forEach(doc => { const r = doc.data() || {}; if (r.isMatch || r.mode === 'match1v1') stats.match++; else stats.duo++; });   // v34: 1vs1 is a match
  } catch(e) { console.warn('_loadPublicStats', e); }
  return stats;
}

function _updateAddBuddyBtn(buddyUid) {
  const btn = document.getElementById('addBuddyBtn');
  if (!btn) return;
  const alreadyBuddy   = _buddies.find(b => b.uid === buddyUid);
  // v25: a request FROM this player is not "pending" for us, it can be accepted right here
  const incoming       = _incomingBuddyRequest(buddyUid);
  const requestPending = _sentBuddyRequests.find(r => r.toUid === buddyUid);
  if (alreadyBuddy) {
    btn.textContent = '✓ Already Buddies';
    btn.className   = 'btn-add-buddy already';
    btn.disabled    = true;
  } else if (incoming) {
    btn.textContent = '✓ Accept request';
    btn.className   = 'btn-add-buddy';
    btn.disabled    = false;
  } else if (requestPending) {
    btn.textContent = '⏳ Request Pending';
    btn.className   = 'btn-add-buddy sent';
    btn.disabled    = true;
  } else {
    btn.textContent = '+ Add as Buddy';
    btn.className   = 'btn-add-buddy';
    btn.disabled    = false;
  }
}

// v25: open buddy request from this player to us (if any)
function _incomingBuddyRequest(fromUid) {
  return (_pendingRequests || []).find(r => r.fromUid === fromUid && (r.type || 'buddy_request') === 'buddy_request') || null;
}

function closePublicProfile() {
  const ov = document.getElementById('publicProfileOverlay');
  ov.classList.remove('open');
  setTimeout(() => { ov.style.display = 'none'; _viewingPublicUid = null; }, 350);
}

// Send a buddy request straight from a search row (no need to open the profile first).
async function addBuddyDirect(buddyUid, toName){
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid || !buddyUid || !_profile) { showToast('Save your profile first.', 'error'); return; }
  if (_buddies.find(b => b.uid === buddyUid)) { showToast('Already your buddy.', 'info'); return; }
  if (_sentBuddyRequests.find(s => s.toUid === buddyUid)) { showToast('Request already pending.', 'info'); return; }
  const _inc = _incomingBuddyRequest(buddyUid);
  if (_inc) { await acceptBuddyRequest(_inc.id); return; }   // v25: they already asked us
  try {
    const reqId = Date.now().toString();
    await window._fbDb.collection('users').doc(buddyUid).collection('buddyRequests').doc(reqId).set({
      type:'buddy_request', fromUid:uid, fromName:_profile.displayName, fromAvatar:_profile.avatarId||null,
      fromHcp:_profile.hcpIndex ?? null, sentAt:new Date().toISOString(), status:'pending'
    });
    await window._fbDb.collection('users').doc(uid).collection('sentRequests').doc(reqId).set({
      toUid:buddyUid, toName:toName||buddyUid, sentAt:new Date().toISOString(), status:'pending', type:'buddy_request'
    });
    _sentBuddyRequests.push({ id:reqId, toUid:buddyUid, toName:toName||buddyUid });
    showToast('Buddy request sent! 🏌️','success');
    if (typeof renderSentRequests==='function') renderSentRequests();
    if (typeof onBuddySearchInput==='function') onBuddySearchInput(); // refresh to show pending state
  } catch(e){ showToast('Could not send request: '+e.message,'error'); }
}

async function addBuddyFromProfile() {
  const uid       = window._fbAuth?.currentUser?.uid;
  const buddyUid  = _viewingPublicUid;
  if (!uid || !buddyUid || !_profile) { showToast('Save your profile first.', 'error'); return; }
  const _inc = _incomingBuddyRequest(buddyUid);
  if (_inc) { await acceptBuddyRequest(_inc.id); _updateAddBuddyBtn(buddyUid); return; }   // v25

  const btn = document.getElementById('addBuddyBtn');
  if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }

  try {
    const reqId = Date.now().toString();
    // Write request to buddy's buddyRequests
    await window._fbDb.collection('users').doc(buddyUid)
      .collection('buddyRequests').doc(reqId).set({
        type:       'buddy_request',
        fromUid:    uid,
        fromName:   _profile.displayName,
        fromAvatar: _profile.avatarId || null,
        fromHcp:    _profile.hcpIndex ?? null,
        sentAt:     new Date().toISOString(),
        status:     'pending',
      });
    // Track sent request locally and in Firestore
    const toName = document.getElementById('pubProfileName')?.textContent || buddyUid;
    await window._fbDb.collection('users').doc(uid)
      .collection('sentRequests').doc(reqId).set({
        toUid: buddyUid, toName, sentAt: new Date().toISOString(), status: 'pending', type: 'buddy_request'
      });
    _sentBuddyRequests.push({ id: reqId, toUid: buddyUid, toName });

    showToast('Buddy request sent! 🏌️', 'success');
    _updateAddBuddyBtn(buddyUid);
    renderSentRequests();
    // Refresh search results to show pending state
    onBuddySearchInput();
  } catch(e) {
    showToast('Could not send request: ' + e.message, 'error');
    _updateAddBuddyBtn(buddyUid);
  }
}

// ── MY BUDDIES LIST ──────────────────────────────────────────

function renderBuddiesList() {
  const list = document.getElementById('profileBuddiesList');
  const olist = document.getElementById('overlayBuddiesList');
  if (!list && !olist) return;
  let html;
  if (_buddies.length === 0) {
    html = `<div style="font-size:0.8rem;color:var(--muted);padding:4px 0 8px;">No buddies yet — tap Find Buddy to search for players.</div>`;
  } else {
    html = _buddies.map(b => {
      const hcp = b.hcp != null ? `HCP ${b.hcp}` : '';
      const nm  = esc(b.name || '—');
      return `<div class="ab-row">
        <div class="ab-row-name">${nm}${hcp ? ` <span class="ab-row-sub">${hcp}</span>` : ''}</div>
        <button class="ab-btn" onclick="_openBuddyProfile('${b.uid}')">${t('ab_profile')}</button>
        <button class="ab-btn remove" onclick="removeBuddy('${b.uid}')">\u2715 ${t('ab_remove')}</button>
      </div>`;
    }).join('');
  }
  if (list) list.innerHTML = html;
  if (olist) olist.innerHTML = html;
}

function _openBuddyProfile(uid){
  var b=(typeof _buddies!=='undefined'?_buddies:[]).find(function(x){return x.uid===uid;});
  if(!b) return;
  window._activeBuddy=b;
  if(typeof closeBuddySearch==='function') closeBuddySearch();
  if(document.getElementById('screen-buddyprofile')) setTimeout(function(){ showScreen('buddyprofile'); }, 360);
}

async function removeBuddy(buddyUid) {
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid || !confirm('Remove this buddy?')) return;
  try {
    await window._fbDb.collection('users').doc(uid).collection('buddies').doc(buddyUid).delete();
    try { await window._fbDb.collection('users').doc(buddyUid).collection('buddies').doc(uid).delete(); } catch(e) { console.warn('reciprocal remove failed:', e); }
    _buddies = _buddies.filter(b => b.uid !== buddyUid);
    renderBuddiesList();
    showToast('Buddy removed.', 'info');
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}

// ── ACCEPT / DECLINE BUDDY REQUESTS (updated) ────────────────

async function acceptBuddyRequest(reqId) {
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid || !_profile) return;
  const req = _pendingRequests.find(r => r.id === reqId);
  if (!req) return;

  if (_buddies.length >= maxBuddiesForUser()) {
    showToast(`Free plan allows ${maxBuddiesForUser()} buddies — remove one, or go Pro for unlimited.`, 'error');
    return;
  }

  try {
    // Write buddy to OWN buddies collection only (can't write to other user's subcollection)
    await window._fbDb.collection('users').doc(uid).collection('buddies').doc(req.fromUid).set({
      name:     req.fromName,
      hcp:      req.fromHcp ?? null,
      avatarId: req.fromAvatar || null,
      addedAt:  new Date().toISOString(),
    });

    // Reciprocal write: add OURSELVES to the requester's buddies immediately
    // (rule permits a doc whose id == our uid). Makes the buddy two-sided at once;
    // the notification below remains as a fallback/heal path.
    try {
      await window._fbDb.collection('users').doc(req.fromUid).collection('buddies').doc(uid).set({
        name:     _profile.displayName || null,
        hcp:      _profile.hcpIndex ?? null,
        avatarId: _profile.avatarId || null,
        addedAt:  new Date().toISOString(),
      });
    } catch(e) { console.warn('reciprocal buddy write failed (falls back to notification):', e); }

    // Notify the sender so they add us to their buddies on next load
    // Include reqId so they can clean up their sentRequests doc
    await window._fbDb.collection('users').doc(req.fromUid)
      .collection('notifications').add({
        type:      'buddy_accepted',
        byUid:     uid,
        byName:    _profile.displayName,
        byAvatar:  _profile.avatarId || null,
        byHcp:     _profile.hcpIndex ?? null,
        reqId:     reqId,  // so sender can delete their sentRequests entry
        at:        new Date().toISOString(),
        read:      false,
      });

    // Delete the request
    await window._fbDb.collection('users').doc(uid).collection('buddyRequests').doc(reqId).delete();

    _pendingRequests = _pendingRequests.filter(r => r.id !== reqId);
    if (!_buddies.find(b => b.uid === req.fromUid)) {
      const nb = await _enrichBuddy({ uid: req.fromUid, name: req.fromName, hcp: req.fromHcp ?? null, avatarId: req.fromAvatar || null, addedAt: new Date().toISOString() });
      if (!_buddies.find(b => b.uid === req.fromUid)) _buddies.push(nb);
    }
    _refreshBuddyUI();   // v25: list, search rows, open profile, 1vs1 opponent sheet
    renderPendingRequests();
    updateRequestBadge();
    showToast(`${req.fromName} is now your buddy! 🏌️`, 'success');
  } catch(e) { showToast('Could not accept: ' + e.message, 'error'); }
}

// ── LOAD BUDDIES ─────────────────────────────────────────────

let _sentBuddyRequests = []; // track sent requests to show pending state

async function loadBuddiesData(uid, skipRender) {
  // Release 2: sentRequests starts together with buddies.
  const _pSent = window._fbDb.collection('users').doc(uid).collection('sentRequests')
    .where('status','==','pending').where('type','==','buddy_request').get();
  _pSent.catch(() => {});
  try {
    const snap = await window._fbDb.collection('users').doc(uid).collection('buddies').get();
    _buddies = [];
    snap.forEach(doc => _buddies.push({ uid: doc.id, ...doc.data() }));
    // Enrich with the buddy's uploaded avatar/cover (best-effort; falls back to avatarId)
    try {
      await Promise.all(_buddies.map(async b => {
        try {
          const ps = await window._fbDb.collection('public_profiles').doc(b.uid).get();
          if (ps.exists) { const d = ps.data() || {};
            if (d.avatarUrl) b.avatarUrl = d.avatarUrl;
            if (d.coverUrl)  b.coverUrl  = d.coverUrl;
            if (d.avatarId != null && b.avatarId == null) b.avatarId = d.avatarId;
            if (d.gender && !b.gender) b.gender = d.gender;
            if (d.coverId  != null && b.coverId  == null) b.coverId  = d.coverId;
          }
        } catch(e) {}
      }));
    } catch(e) {}
    if (!skipRender) renderBuddiesList();
  } catch(e) { console.warn('Could not load buddies:', e); }

  try {
    const snap = await _pSent;
    _sentBuddyRequests = [];
    snap.forEach(doc => _sentBuddyRequests.push({ id: doc.id, ...doc.data() }));
  } catch(e) {}
}
let _currentTeamType   = '2P';
let _selectedBuddy     = null; // legacy alias


// ── PHASE B: TEAM CREATION (owner-only from buddies) ─────────

function setTeamType(type) {
  _currentTeamType = type;
  ['2P','3P','4P'].forEach(t => {
    const btn = document.getElementById(`teamTypeBtn${t}`);
    if (btn) btn.classList.toggle('active', t === type);
  });
  renderBuddyPicker();
}

function showAddTeamForm() {
  if (_buddies.length === 0) {
    showToast('Add at least one buddy first — use 🔍 Find Buddy.', 'info');
    return;
  }
  document.getElementById('addTeamForm').style.display = '';
  document.getElementById('profileAddTeamSection').style.display = 'none';
  _currentTeamType = '2P';
  setTeamType('2P');
  document.getElementById('newTeamName').value = '';
}

function hideAddTeamForm() {
  document.getElementById('addTeamForm').style.display = 'none';
  document.getElementById('profileAddTeamSection').style.display = '';
  document.getElementById('newTeamName').value = '';
}

function renderBuddyPicker() {
  const wrap = document.getElementById('buddyPickerWrap');
  if (!wrap) return;
  const maxBuddies = _currentTeamType === '2P' ? 1 : _currentTeamType === '3P' ? 2 : 3;
  if (_buddies.length === 0) {
    wrap.innerHTML = `<div style="font-size:0.8rem;color:var(--muted);">No buddies yet — find some first.</div>`;
    return;
  }
  wrap.innerHTML = `
    <div style="font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;">
      Pick ${maxBuddies} Buddy${maxBuddies > 1 ? ' (up to ' + maxBuddies + ')' : ''}
    </div>
    ${_buddies.map(b => {
      const _bav = (typeof _avatarFor==='function') ? _avatarFor(b) : ((b.avatarId && AVATARS[b.avatarId]) || null);
      const av = _bav
        ? `<img src="${_bav}" alt="" style="width:100%;height:100%;object-fit:cover;">`
        : `<span style="font-size:0.85rem;">🏌️</span>`;
      const hcp = b.hcp != null ? ` HCP ${b.hcp}` : '';
      return `
        <label style="display:flex;align-items:center;gap:10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:8px;cursor:pointer;">
          <input type="checkbox" name="buddyPick" value="${b.uid}" onchange="onBuddyPickChange()" style="accent-color:var(--green);width:16px;height:16px;flex-shrink:0;">
          <div style="width:32px;height:32px;border-radius:50%;overflow:hidden;flex-shrink:0;background:var(--border);display:flex;align-items:center;justify-content:center;">${av}</div>
          <div style="flex:1;">
            <div style="font-size:0.88rem;font-weight:700;color:var(--white);">${esc(b.name)}</div>
            ${hcp ? `<div style="font-size:0.7rem;color:var(--muted);">${hcp}</div>` : ''}
          </div>
        </label>`;
    }).join('')}
    <div id="buddyPickWarning" style="font-size:0.7rem;color:var(--gold);margin-top:4px;display:none;">
      Select exactly ${maxBuddies} buddy${maxBuddies > 1 ? 's' : ''} for a ${_currentTeamType} team.
    </div>`;
}

function onBuddyPickChange() {
  const maxBuddies = _currentTeamType === '2P' ? 1 : _currentTeamType === '3P' ? 2 : 3;
  const checked = [...document.querySelectorAll('input[name="buddyPick"]:checked')];
  const warn = document.getElementById('buddyPickWarning');
  // Disable unchecked once max reached
  document.querySelectorAll('input[name="buddyPick"]').forEach(cb => {
    if (!cb.checked) cb.disabled = checked.length >= maxBuddies;
  });
  if (warn) warn.style.display = checked.length > maxBuddies ? '' : 'none';
}

async function createTeam() {
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid || !_profile) { showToast('Save your profile first.', 'error'); return; }
  const teamName = document.getElementById('newTeamName').value.trim();
  if (!teamName) { showToast('Enter a team name.', 'error'); return; }

  const maxBuddies = _currentTeamType === '2P' ? 1 : _currentTeamType === '3P' ? 2 : 3;
  const pickedUids = [...document.querySelectorAll('input[name="buddyPick"]:checked')].map(cb => cb.value);
  if (pickedUids.length === 0) { showToast(`Pick at least 1 buddy.`, 'error'); return; }
  if (pickedUids.length > maxBuddies) { showToast(`Pick max ${maxBuddies} buddy${maxBuddies > 1 ? 's' : ''} for ${_currentTeamType}.`, 'error'); return; }

  const pickedBuddies = _buddies.filter(b => pickedUids.includes(b.uid));
  // Build members: owner first, then buddies
  const myEntry  = { uid, name: _profile.displayName, avatarId: _profile.avatarId || null, hcp: _profile.hcpIndex ?? null };
  const members  = [myEntry, ...pickedBuddies.map(b => ({ uid: b.uid, name: b.name, avatarId: b.avatarId || null, hcp: b.hcp ?? null }))];
  const teamId   = Date.now().toString();
  const teamDoc  = {
    teamName,
    teamType: _currentTeamType,
    members,
    ownerId:   uid,
    ownerName: _profile.displayName,
    status:    'active',
    createdAt: new Date().toISOString(),
  };

  try {
    // Save to own teams
    await window._fbDb.collection('users').doc(uid).collection('teams').doc(teamId).set(teamDoc);
    // Notify each buddy (write to their notifications)
    for (const buddy of pickedBuddies) {
      await window._fbDb.collection('users').doc(buddy.uid)
        .collection('notifications').add({
          type:      'added_to_team',
          teamName,
          teamType:  _currentTeamType,
          byName:    _profile.displayName,
          byAvatar:  _profile.avatarId || null,
          at:        new Date().toISOString(),
          read:      false,
        });
    }

    _teams.push({ id: teamId, ...teamDoc });
    hideAddTeamForm();
    renderTeamsList();
    showToast(`Team "${teamName}" created! Buddies notified.`, 'success');
  } catch(e) { showToast('Could not create team: ' + e.message, 'error'); }
}

// ── SAVE TEAM TO MY SCRAMBLE (manual, explicit) ───────────────

async function saveTeamToMyScramble(teamId) {
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid) return;
  const t = _teams.find(x => x.id === teamId);
  if (!t) return;
  if (_savedTeams.find(s => s.profileTeamId === teamId)) {
    showToast('Already in My Scramble.', 'info'); return;
  }
  // Build players: buddies only (exclude owner — slot 1 pre-filled from profile)
  const players = (t.members || [])
    .filter(m => m.uid !== uid && m.name)
    .map(m => ({ name: m.name, hcp: m.hcp ?? null, gender: 'M', tee: 'main' }));
  if (players.length === 0) { showToast('No buddy data to save.', 'error'); return; }
  if (_savedTeams.length >= maxTeamsForUser()) {
    showToast(`Free plan allows ${maxTeamsForUser()} saved teams — delete one, or go Pro for unlimited.`, 'error');
    return;
  }

  const data = {
    id:            Date.now().toString(),
    profileTeamId: teamId,
    teamName:      t.teamName,
    teamType:      t.teamType || '2P',
    players,
    p1Name:  players[0]?.name || null, p1Hcp: players[0]?.hcp ?? null,
    p2Name:  players[1]?.name || null, p2Hcp: players[1]?.hcp ?? null,
    savedAt: new Date().toISOString(),
    source:  'profile',
  };
  _savedTeams.push(data);
  try {
    await persistTeams(uid);
    renderMyData();
    renderTeamsList(); // update the sync button state
    showToast(`"${t.teamName}" saved to My Scramble.`, 'success');
  } catch(e) {
    _savedTeams.pop();
    showToast('Could not save: ' + e.message, 'error');
  }
}

function renderTeamsList() {
  const list = document.getElementById('profileTeamsList');
  if (!list) return;
  if (_teams.length === 0) {
    list.innerHTML = `<div style="font-size:0.8rem;color:var(--muted);margin-bottom:8px;">No teams yet — add a team above.</div>`;
  } else {
    const currentUid = window._fbAuth?.currentUser?.uid;
    list.innerHTML = _teams.map(t => {
      const teamType  = t.teamType || '2P';
      const typeBadge = `<span style="background:var(--green);color:#fff;font-size:0.58rem;padding:2px 7px;border-radius:10px;font-weight:700;margin-left:6px;">${teamType}</span>`;
      // Show only buddy members (not the owner/self)
      const allMembers    = t.members || [];
      const buddyMembers  = allMembers.filter(m => m.uid !== currentUid);
      const memberHtml    = buddyMembers.length > 0
        ? buddyMembers.map(m => {
            const av = (m.avatarId || m.avatar) && AVATARS[m.avatarId || m.avatar]
              ? `<img src="${AVATARS[m.avatarId || m.avatar]}" alt="">`
              : `<span style="font-size:0.75rem;">🏌️</span>`;
            const hcpText = m.hcp != null ? ` <span style="color:var(--muted);font-size:0.7rem;">HCP ${m.hcp}</span>` : '';
            return `<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
              <div class="team-buddy-avatar" style="width:24px;height:24px;font-size:0.7rem;">${av}</div>
              <span style="font-size:0.78rem;color:var(--white);">${esc(m.name || '—')}</span>${hcpText}
            </div>`;
          }).join('')
        : `<div style="font-size:0.75rem;color:var(--muted);margin-top:4px;">No buddies assigned</div>`;
      const alreadySynced = _savedTeams.find(s => s.profileTeamId === t.id);
      const saveBtn = !alreadySynced
        ? `<button class="btn-card-load" onclick="saveTeamToMyScramble('${t.id}')" style="font-size:0.65rem;padding:4px 8px;white-space:nowrap;">💾 My Scramble</button>`
        : `<span style="font-size:0.65rem;color:var(--green);padding:4px 8px;">✓ Saved</span>`;
      return `
        <div class="team-buddy-card" style="align-items:flex-start;margin-bottom:10px;">
          <div style="flex:1;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span class="team-buddy-name">${esc(t.teamName)}${typeBadge}</span>
            </div>
            ${memberHtml}
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
            ${saveBtn}
            <button class="btn-decline" onclick="removeTeam('${t.id}')" style="padding:5px 10px;font-size:0.65rem;" title="Remove">✕</button>
          </div>
        </div>`;
    }).join('');
  }
  const addSection = document.getElementById('profileAddTeamSection');
  if (addSection) addSection.style.display = '';
}

async function declineBuddyRequest(reqId) {
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid) return;
  try {
    await window._fbDb.collection('users').doc(uid).collection('buddyRequests').doc(reqId).delete();
    _pendingRequests = _pendingRequests.filter(r => r.id !== reqId);
    renderPendingRequests();
    updateRequestBadge();
    showToast('Request declined.', 'info');
  } catch(e) {}
}

// ── TEAM DELETE MODAL ────────────────────────────────────────

let _pendingDeleteTeamId   = null; // profile team id
let _pendingDeleteSavedId  = null; // savedTeams id
let _pendingDeleteSource   = null; // 'profile' | 'scramble'

function confirmTeamDelete() {
  const modal = document.getElementById('teamDeleteModal');
  if (modal) modal.style.display = 'none';
  if (_pendingDeleteSource === 'profile') {
    _doRemoveTeam(_pendingDeleteTeamId);
  } else {
    _doDeleteSavedTeam(_pendingDeleteSavedId);
  }
  _pendingDeleteTeamId  = null;
  _pendingDeleteSavedId = null;
  _pendingDeleteSource  = null;
}

function cancelTeamDelete() {
  document.getElementById('teamDeleteModal').style.display = 'none';
  _pendingDeleteTeamId = _pendingDeleteSavedId = _pendingDeleteSource = null;
}

function removeTeam(teamId) {
  const t = _teams.find(x => x.id === teamId);
  _pendingDeleteTeamId  = teamId;
  _pendingDeleteSource  = 'profile';
  const nameEl = document.getElementById('teamDeleteName');
  if (nameEl) nameEl.textContent = t?.teamName || 'this team';
  const bodyEl = document.getElementById('teamDeleteBody');
  if (bodyEl) {
    const buddyCount = (t?.members || []).filter(m => m.uid !== window._fbAuth?.currentUser?.uid).length;
    bodyEl.textContent = buddyCount > 0
      ? `This will remove the team for you and ${buddyCount} buddy${buddyCount > 1 ? 's' : ''}. They will be notified.`
      : 'This will permanently remove the team.';
  }
  document.getElementById('teamDeleteModal').style.display = 'flex';
}

async function _doRemoveTeam(teamId) {
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid) return;
  const t = _teams.find(x => x.id === teamId);
  try {
    // Notify each buddy
    if (t) {
      const buddies = (t.members || []).filter(m => m.uid !== uid);
      for (const buddy of buddies) {
        await window._fbDb.collection('users').doc(buddy.uid)
          .collection('notifications').add({
            type:      'team_removed',
            teamName:  t.teamName,
            removedBy: _profile?.displayName || 'A teammate',
            at:        new Date().toISOString(),
            read:      false,
          });
        // Also remove the team doc from each buddy's teams
        try {
          await window._fbDb.collection('users').doc(buddy.uid).collection('teams').doc(teamId).delete();
        } catch(e) {}
      }
    }
    await window._fbDb.collection('users').doc(uid).collection('teams').doc(teamId).delete();
    _teams = _teams.filter(x => x.id !== teamId);
    // Remove linked My Scramble entry
    const before = _savedTeams.length;
    _savedTeams = _savedTeams.filter(x => x.profileTeamId !== teamId);
    if (_savedTeams.length !== before) await persistTeams(uid);
    renderTeamsList();
    renderMyData();
    showToast('Team removed and buddies notified.', 'success');
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}

function deleteTeamWithConfirm(savedId) {
  const t = _savedTeams.find(x => x.id === savedId);
  _pendingDeleteSavedId = savedId;
  _pendingDeleteSource  = 'scramble';
  const nameEl = document.getElementById('teamDeleteName');
  if (nameEl) nameEl.textContent = t?.teamName || 'this team';
  const bodyEl = document.getElementById('teamDeleteBody');
  if (bodyEl) {
    bodyEl.textContent = t?.profileTeamId
      ? 'This will remove the team from My Scramble and from your Profile. Your buddies will be notified.'
      : 'This will permanently remove the team from My Scramble.';
  }
  document.getElementById('teamDeleteModal').style.display = 'flex';
}

async function _doDeleteSavedTeam(savedId) {
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid) return;
  const t = _savedTeams.find(x => x.id === savedId);
  _savedTeams = _savedTeams.filter(x => x.id !== savedId);
  try {
    await persistTeams(uid);
    // If linked to a profile team, also remove that
    if (t?.profileTeamId) {
      const profileTeam = _teams.find(x => x.id === t.profileTeamId);
      if (profileTeam) {
        const buddies = (profileTeam.members || []).filter(m => m.uid !== uid);
        for (const buddy of buddies) {
          await window._fbDb.collection('users').doc(buddy.uid)
            .collection('notifications').add({
              type: 'team_removed', teamName: profileTeam.teamName,
              removedBy: _profile?.displayName || 'A teammate',
              at: new Date().toISOString(), read: false,
            });
          try { await window._fbDb.collection('users').doc(buddy.uid).collection('teams').doc(t.profileTeamId).delete(); } catch(e) {}
        }
        await window._fbDb.collection('users').doc(uid).collection('teams').doc(t.profileTeamId).delete();
        _teams = _teams.filter(x => x.id !== t.profileTeamId);
        renderTeamsList();
      }
    }
    renderMyData();
    showToast('Team deleted.', 'success');
    // If we deleted from the Team Overview screen, return to My Teams
    try {
      var act=document.querySelector('.screen.active');
      if(act && act.id==='screen-teamoverview' && typeof showScreen==='function'){
        showScreen('myteams', { replace: true });
      }
    } catch(e){}
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}


// Profile course dropdown
function profileShowCourseDropdown() {
  profileRenderCourseDropdown();
  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      const drop = document.getElementById('profileCourseDropdown');
      const inp  = document.getElementById('profileHomeCourse');
      if (drop && !drop.contains(e.target) && e.target !== inp) {
        drop.style.display = 'none';
        document.removeEventListener('click', handler);
      }
    });
  }, 0);
}

function profileFilterCourses() { profileRenderCourseDropdown(); }

function profileRenderCourseDropdown() {
  const drop  = document.getElementById('profileCourseDropdown');
  const input = document.getElementById('profileHomeCourse');
  if (!drop || !input) return;
  const q = input.value.trim().toLowerCase();
  const filtered = _sharedCourses.filter(c => !q || c.name.toLowerCase().includes(q)).slice(0, 8);
  if (filtered.length === 0) { drop.style.display = 'none'; return; }
  drop.innerHTML = filtered.map(c => `
    <div class="ms-course-dropdown-item" onclick="document.getElementById('profileHomeCourse').value='${esc(c.name)}';document.getElementById('profileCourseDropdown').style.display='none';">
      <div class="ms-course-dropdown-name"><span class="ms-course-badge shared">🌐</span>${esc(c.name)}</div>
      <div class="ms-course-dropdown-meta">${c.holes===9?'9':'18'} holes · Par ${c.par}</div>
    </div>`).join('');
  drop.style.display = '';
}

// ── LOAD PROFILE DATA ────────────────────────────────────────

// ── Real-time incoming buddy-request listener ──
// Delivers requests live (badge + banner + toast) without needing a reload.
let _reqUnsub = null;
function startBuddyRequestListener(uid){
  if(!uid || !window._fbDb) return;
  stopBuddyRequestListener();
  let first = true;
  try{
    _reqUnsub = window._fbDb.collection('users').doc(uid).collection('buddyRequests')
      .where('status','==','pending')
      .onSnapshot(function(snap){
        const prevIds = (_pendingRequests||[]).map(function(r){ return r.id; });
        _pendingRequests = [];
        snap.forEach(function(doc){ _pendingRequests.push(Object.assign({ id: doc.id }, doc.data())); });
        if(!first){
          _pendingRequests.forEach(function(r){
            if(prevIds.indexOf(r.id) < 0 && r.type==='buddy_request' && r.fromName && typeof showToast==='function')
              showToast('🏌️ Buddy request from ' + r.fromName, 'info');
          });
        }
        if(!first && typeof _refreshBuddyUI==='function') _refreshBuddyUI();   // v25
        first = false;
        if(typeof updateRequestBadge==='function') updateRequestBadge();
        if(typeof renderPendingRequests==='function') renderPendingRequests();
        if(typeof updateNotifBadge==='function') updateNotifBadge();
        if(typeof renderNotifList==='function') renderNotifList(document.getElementById('screen-notifications'));
      }, function(err){ console.warn('buddyRequests listener error', err); });
  }catch(e){ console.warn('startBuddyRequestListener', e); }
}
function stopBuddyRequestListener(){ if(_reqUnsub){ try{ _reqUnsub(); }catch(e){} _reqUnsub = null; } }

// Mobile browsers/PWAs suspend background tabs, which pauses Firestore live streams.
// When the app returns to the foreground, re-attach the buddy-request listener so any
// requests that arrived while backgrounded show up immediately — no logout/login needed.
let _bellRefreshT = null;
// Release 2: only after sign-in has finished loading (no double listener start during
// login), and only when the app comes back after at least 30 s in the background. Before,
// every focus event (also after the Google popup or any alert) restarted all listeners,
// which re-reads every notification, request and chat thread each time.
let _appReady = false;
let _hiddenSince = 0;
function _refreshLiveOnFocus(){
  if(!_appReady) return;
  if(!_hiddenSince || (Date.now() - _hiddenSince) < 30000){ _hiddenSince = 0; return; }
  _hiddenSince = 0;
  const uid = window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid;
  if(!uid || !window._fbDb) return;
  clearTimeout(_bellRefreshT);
  _bellRefreshT = setTimeout(function(){
    if(typeof startBuddyRequestListener==='function') startBuddyRequestListener(uid); // fresh snapshot → badge+bell
    if(typeof startThreadsBellListener==='function') startThreadsBellListener(uid); // re-attach messages unread
    if(typeof startM1LiveListener==='function') startM1LiveListener(uid);           // v26: re-attach live 1vs1
    if(typeof loadOpenGames==='function') loadOpenGames(uid).then(function(){ if(typeof updateNotifBadge==='function') updateNotifBadge(); }).catch(function(){});
  }, 150);
}
document.addEventListener('visibilitychange', function(){
  if(document.visibilityState==='hidden'){ _hiddenSince = Date.now(); return; }
  _refreshLiveOnFocus();
});

async function loadProfileData(uid) {
  // Release 2: profile + users doc in one wait; buddies, teams, requests and notifications
  // in a second wait (they all start together). Results are handled in the original order.
  const _db = window._fbDb;
  _buddiesLoaded = false;   // v25: live buddy_accepted handling waits until the list is in
  const _pP = _db.collection('users').doc(uid).collection('profile').doc('data').get();
  const _pU = _db.collection('users').doc(uid).get();
  const _pB = loadBuddiesData(uid, true);   // starts now, renders after the profile is in
  const _pT = _db.collection('users').doc(uid).collection('teams').get();
  const _pQ = _db.collection('users').doc(uid).collection('buddyRequests').where('status', '==', 'pending').get();
  const _pN = _db.collection('users').doc(uid).collection('notifications').where('type','==','buddy_accepted').get();
  [_pP, _pU, _pT, _pQ, _pN].forEach(p => p.catch(() => {}));   // handled below; avoid unhandled-rejection noise
  // Load profile
  try {
    const snap = await _pP;
    if (snap.exists) { _profile = snap.data(); }
    try { const _u = await _pU; if (_u.exists) { const _ud = _u.data() || {}; _profile = _profile || {}; if (_ud.avatarUrl && !_profile.avatarUrl) _profile.avatarUrl = _ud.avatarUrl; if (_ud.coverUrl && !_profile.coverUrl) _profile.coverUrl = _ud.coverUrl; } } catch(e){}
    if (_profile) { updateUserPill(); prefillFromProfile(); }
  } catch(e) { console.warn('Could not load profile:', e); }

  // Load buddies
  try { await _pB; } catch(e) {}
  if (typeof renderBuddiesList === 'function') renderBuddiesList();   // now that _profile is in

  // Load teams
  try {
    const snap = await _pT;
    _teams = [];
    snap.forEach(doc => _teams.push({ id: doc.id, ...doc.data() }));
    renderTeamsList();
  } catch(e) { console.warn('Could not load teams:', e); }

  // Load pending buddy requests (filter to buddy_request type)
  try {
    const snap = await _pQ;
    _pendingRequests = [];
    snap.forEach(doc => _pendingRequests.push({ id: doc.id, ...doc.data() }));
    updateRequestBadge();
  } catch(e) { console.warn('Could not load requests:', e); }

  // Process buddy_accepted side effects ONCE (add the reverse buddy). We do NOT mark
  // notifications read here — the bell badge surfaces unread items, and read is set only
  // when the user opens the Notifications screen. A separate `processed` flag prevents
  // re-adding the buddy on every sign-in.
  // v25: the same handler also runs live from the notification listener, so an accepted
  // request shows up straight away (no restart needed).
  _buddiesLoaded = true;
  let _nDocs = [];
  try { const snap = await _pN; _nDocs = snap.docs; } catch(e) {}
  await _processBuddyAccepted(uid, _nDocs.concat(_baLatestDocs));
}

// ── v25: BUDDY ACCEPTED, LIVE ─────────────────────────────────
// When someone accepts OUR request we get a buddy_accepted notification. Handle it once:
// write the buddy into our own list, remove our "Pending" entry, update every open screen.
// Runs at sign-in (loadProfileData) and live (startNotifListener). _baBusy stops both
// paths handling the same notification at the same time.
let _buddiesLoaded = false;   // true once the buddy list of this sign-in is in memory
let _baLatestDocs  = [];      // notifications seen by the listener before that moment
const _baBusy = new Set();

function _onBuddyAcceptedSnap(uid, docs) {
  const acc = (docs || []).filter(d => { const n = d.data() || {}; return n.type === 'buddy_accepted' && !n.processed; });
  if (!acc.length) return;
  if (!_buddiesLoaded) { _baLatestDocs = acc; return; }   // loadProfileData picks these up
  _processBuddyAccepted(uid, acc);
}

async function _enrichBuddy(b) {
  try {
    const ps = await window._fbDb.collection('public_profiles').doc(b.uid).get();
    if (ps.exists) { const d = ps.data() || {};
      if (d.avatarUrl) b.avatarUrl = d.avatarUrl;
      if (d.coverUrl)  b.coverUrl  = d.coverUrl;
      if (d.avatarId != null && b.avatarId == null) b.avatarId = d.avatarId;
      if (d.gender && !b.gender) b.gender = d.gender;   // 1vs1: Ladies/Men prefill
      if (d.coverId  != null && b.coverId  == null) b.coverId  = d.coverId;
    }
  } catch(e) {}
  return b;
}

async function _processBuddyAccepted(uid, docs) {
  let changed = false;
  for (const doc of (docs || [])) {
    const n = (doc && doc.data && doc.data()) || {};
    if (n.type !== 'buddy_accepted' || n.processed || !n.byUid || _baBusy.has(doc.id)) continue;
    _baBusy.add(doc.id);
    try {
      await window._fbDb.collection('users').doc(uid).collection('buddies').doc(n.byUid).set({
        name:     n.byName,
        hcp:      n.byHcp ?? null,
        avatarId: n.byAvatar || null,
        addedAt:  n.at || new Date().toISOString(),
      });
      if (n.reqId) {
        try { await window._fbDb.collection('users').doc(uid).collection('sentRequests').doc(n.reqId).delete(); } catch(e) {}
      }
      _sentBuddyRequests = _sentBuddyRequests.filter(r => r.id !== n.reqId && r.toUid !== n.byUid);
      if (!_buddies.find(b => b.uid === n.byUid)) {
        const b = await _enrichBuddy({ uid: n.byUid, name: n.byName, hcp: n.byHcp ?? null, avatarId: n.byAvatar || null, addedAt: n.at || null });
        if (!_buddies.find(x => x.uid === n.byUid)) _buddies.push(b);
      }
      await doc.ref.update({ processed: true });
      changed = true;
    } catch(e) {
      console.warn('Could not write reverse buddy:', e);
      _baBusy.delete(doc.id);   // try again on the next snapshot or sign-in
    }
  }
  _baLatestDocs = [];
  if (changed) _refreshBuddyUI();
}

// Redraw everything that shows buddies or pending requests (only what is on screen).
function _refreshBuddyUI() {
  try { if (typeof renderBuddiesList === 'function') renderBuddiesList(); } catch(e) {}
  try { if (typeof renderSentRequests === 'function') renderSentRequests(); } catch(e) {}
  try {
    const ov = document.getElementById('publicProfileOverlay');
    if (_viewingPublicUid && ov && ov.classList.contains('open')) _updateAddBuddyBtn(_viewingPublicUid);
  } catch(e) {}
  try {
    const q = document.getElementById('buddySearchInput');
    if (q && q.offsetParent !== null && q.value.trim().length >= 2) onBuddySearchInput();
  } catch(e) {}
  try {
    const sh = document.getElementById('m1_sheet'), s1 = document.getElementById('m1_step1');
    if (sh && sh.classList.contains('open') && s1 && s1.style.display !== 'none' && typeof m1RenderList === 'function') m1RenderList();
  } catch(e) {}
  try {
    const bp = document.getElementById('buddyPickerWrap');
    if (bp && bp.offsetParent !== null && typeof renderBuddyPicker === 'function') renderBuddyPicker();
  } catch(e) {}
}


// ═══════════════════════════════════
// NEW-UI: Home screen live data binding
// ═══════════════════════════════════
function renderHomeScreen() {
  const scr = document.getElementById('screen-home'); if (!scr) return;
  // If a round is paused, make sure the banner stays visible on Home (navigation
  // to Home must not hide it).
  if (typeof _pausedRound !== 'undefined' && _pausedRound && typeof showPausedRoundBanner === 'function') {
    showPausedRoundBanner();
  }
  const prof = _profile || {};
  const cu = window._fbAuth && window._fbAuth.currentUser;
  const AV = (typeof AVATARS !== 'undefined') ? AVATARS : {};
  const esc = s => (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const uname = prof.displayName || (cu && cu.displayName) || (((cu && cu.email) || '').split('@')[0]) || 'Player';
  const un = document.getElementById('homeUsername'); if (un) un.textContent = uname;
  const hc = document.getElementById('homeHcp');
  if (hc) hc.textContent = (prof.hcpIndex != null && !isNaN(prof.hcpIndex)) ? Number(prof.hcpIndex).toFixed(1) : '\u2013';

  const avImg = document.getElementById('homeAvatarImg');
  if (avImg) avImg.src = prof.avatarUrl || (prof.avatarId && AV[prof.avatarId]) || 'icons/home-crown.png';
  const cover = document.getElementById('homeCover');
  if (cover) {
    const _covSrc = prof.coverUrl || (prof.coverId && typeof COVERS!=='undefined' && COVERS[prof.coverId]) || null;
    cover.style.backgroundImage = _covSrc ? ("url('" + _covSrc + "')") : '';
  }

  const bc = document.getElementById('homeBuddyCount'); if (bc) bc.textContent = (_buddies ? _buddies.length : 0);

  const all = _savedRounds || [];
  const fmtDate = d => { if(!d) return ''; try { return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); } catch(e){ return ''; } };
  const grossOf = r => (r.scores||[]).reduce((a,b)=>a+(b||0),0) || r.gross || 0;
  const parOf   = r => (r.par||[]).reduce((a,b)=>a+(b||0),0) || r.parTotal || 0;
  const holesOf = r => r.holes || (Array.isArray(r.par)?r.par.length:9);
  const teamOf  = r => r.isMatch ? ((r.teamA&&r.teamA.name)||'') : (r.teamName || (r.team&&r.team.name) || '');
  const tOf     = r => Date.parse(r.playedAt||r.date||0)||0;

  const _solo = r => (typeof soloIsRound === 'function' && soloIsRound(r)) || (typeof m1IsRound === 'function' && m1IsRound(r));   // not a team game
  const rounds = all.filter(r=>!r.isMatch && !_solo(r)).map(r=>{ const g=grossOf(r),p=parOf(r); return Object.assign({_g:g,_vs:g-p,_t:tOf(r)}, r); }).sort((a,b)=>b._t-a._t).slice(0,5);
  const roundsRow = document.getElementById('homeRoundsRow');
  if (roundsRow) roundsRow.innerHTML = rounds.length ? rounds.map(r=>{
      const vsCol = r._vs>0?'#c85a4a':(r._vs<0?'#1a6b3c':'#777');
      return '<div class="hh-card" onclick="showScreen(&quot;matches&quot;)">'
        + '<div class="hh-card-l"><div class="hh-card-date">'+fmtDate(r.playedAt||r.date)+'</div>'
        + '<div class="hh-card-course">'+esc(r.courseName||'Course')+'</div>'
        + '<div class="hh-card-meta">'+esc(r.loopName||'')+' \u00b7 '+holesOf(r)+'H \u00b7 '+esc(teamOf(r))+'</div>'
        + '<div class="hh-card-fmt">'+esc(r.format||'')+'</div></div>'
        + '<div class="hh-card-r"><div class="hh-card-gross">'+(r._g||'\u2013')+'</div><div class="hh-card-lbl">GROSS</div>'
        + '<div class="hh-card-vspar" style="color:'+vsCol+'">'+(r._g?(r._vs>0?'+'+r._vs:r._vs):'\u2013')+'</div><div class="hh-card-lbl">VS PAR</div></div></div>';
    }).join('') : '<div class="hh-empty">No team rounds yet \u2014 play a round to see your best here.</div>';

  if (typeof soloRenderHomeRow === 'function') soloRenderHomeRow(all, fmtDate, esc);   // Solo Rounds | Last 5 (app-solo.js)
  if (typeof m1RenderHomeRow === 'function') m1RenderHomeRow(all, fmtDate, esc);   // 1vs1 Matches | Last 5 (app-match.js)

  const matches = all.filter(r=>r.isMatch).map(m=>{ const a=(m.result&&m.result.teamAWon)||0,b=(m.result&&m.result.teamBWon)||0; return Object.assign({_m:a-b,_t:tOf(m)}, m); }).sort((a,b)=>b._t-a._t).slice(0,5);
  const matchesRow = document.getElementById('homeMatchesRow');
  if (matchesRow) matchesRow.innerHTML = matches.length ? matches.map(m=>{
      const badge = m._m>0?(m._m+'UP'):(m._m<0?(Math.abs(m._m)+'DN'):'AS');
      const cls = m._m>0?'':(m._m<0?'loss':'as');
      return '<div class="hh-card" onclick="showScreen(&quot;matches&quot;)">'
        + '<div class="hh-card-l"><div class="hh-card-date">'+fmtDate(m.playedAt)+'</div>'
        + '<div class="hh-card-course">'+esc(m.courseName||'Course')+'</div>'
        + '<div class="hh-card-meta">'+esc(m.loopName||'')+' \u00b7 '+holesOf(m)+'H \u00b7 vs '+esc((m.teamB&&m.teamB.name)||'Opponent')+'</div>'
        + '<div class="hh-card-fmt">'+esc(m.format||'')+'</div></div>'
        + '<div class="hh-match-badge '+cls+'">'+badge+'</div></div>';
    }).join('') : '<div class="hh-empty">No team matches yet \u2014 play a match to see your best here.</div>';

  // Courses Played (distinct courses, most recent first)
  const coursesRow = document.getElementById('homeCoursesRow');
  if (coursesRow) {
    const cmap = {};
    all.forEach(r=>{ const n=r.courseName||''; if(!n) return; if(!cmap[n]) cmap[n]={name:n,games:0,best:null,_t:0}; cmap[n].games++; const tt=tOf(r); if(tt>cmap[n]._t) cmap[n]._t=tt; if(!r.isMatch && !_solo(r)){ const vs=grossOf(r)-parOf(r); if(cmap[n].best==null||vs<cmap[n].best) cmap[n].best=vs; } });
    const courses = Object.keys(cmap).map(k=>cmap[k]).sort((a,b)=>b._t-a._t).slice(0,5);
    coursesRow.innerHTML = courses.length ? courses.map(c=>{
        const bestStr=(c.best==null)?'\u2013':(c.best>0?'+'+c.best:String(c.best));
        const bestCol=(c.best==null)?'#9aa3a0':(c.best>0?'#c85a4a':'#1a6b3c');
        return '<div class="hh-course-card" onclick="showScreen(&quot;matches&quot;)">'
          + '<div class="hh-course-name">'+esc(c.name)+'</div>'
          + '<div class="hh-course-meta">'+c.games+' '+(c.games===1?'round':'rounds')+'</div>'
          + '<div class="hh-course-best" style="color:'+bestCol+'">'+bestStr+' <span>BEST</span></div></div>';
      }).join('') : '<div class="hh-empty">No courses played yet.</div>';
  }

  const teamsRow = document.getElementById('homeTeamsRow');
  if (teamsRow) {
    const count = (pred) => { const c={}; all.filter(pred).forEach(r=>{ const n=teamOf(r); if(n) c[n]=(c[n]||0)+1; }); let best=null,bn=0; for(const k in c){ if(c[k]>bn){bn=c[k];best=k;} } return best; };
    const topRoundTeam = count(r=>!r.isMatch && !_solo(r));
    const topMatchTeam = count(r=>r.isMatch);
    const teamByName = n => (_savedTeams||[]).filter(t=>t.teamName===n)[0];
    const stats = (name) => {
      const games = all.filter(r=>teamOf(r)===name && !_solo(r)); const rg = games.filter(r=>!r.isMatch);
      const wins = games.filter(r=>r.isMatch && r.result && r.result.teamAWon>r.result.teamBWon).length;
      let best='\u2013'; if(rg.length){ const bv=Math.min.apply(null, rg.map(r=>grossOf(r)-parOf(r))); best=(bv>0?'+':'')+bv; }
      return { rounds: games.length, wins: (games.some(g=>g.isMatch)?wins:'\u2013'), best: best };
    };
    const teamCard = (name, tag) => {
      const t=teamByName(name)||{teamName:name, players:[]};
      const av=(t.players&&t.players[0]&&typeof _avatarFor==='function')?_avatarFor(t.players[0]):((t.players&&t.players[0]&&t.players[0].avatarId&&AV[t.players[0].avatarId])||'icons/home-crown.png');
      const s=stats(name);
      return '<div class="hh-team-card" onclick="showScreen(&quot;myteams&quot;)">'
        + '<div class="hh-team-top"><span class="hh-team-label">SCRAMBLE TEAM</span>'+(tag?'<span class="hh-team-main">'+tag+'</span>':'')+'</div>'
        + '<div class="hh-team-name">'+esc(t.teamName||'Team')+'</div>'
        + '<div class="hh-team-mid"><img src="'+av+'" alt=""><span>'+((t.players||[]).length||1)+' players</span></div>'
        + '<div class="hh-team-stats"><div><b>'+s.rounds+'</b><span>ROUNDS</span></div><div><b>'+s.wins+'</b><span>WINS</span></div><div><b>'+s.best+'</b><span>BEST</span></div></div></div>';
    };
    var _mainT=(_savedTeams||[]).filter(function(t){return t.isMain;})[0];
    var mainName=null, mainTag='\u2605 MAIN';
    if(_mainT){ mainName=_mainT.teamName; }
    else { mainName = topRoundTeam || topMatchTeam || ((_savedTeams||[])[0]&&_savedTeams[0].teamName) || null; mainTag='\u2605 MOST PLAYED'; }
    teamsRow.innerHTML = mainName ? teamCard(mainName, mainTag) : '<div class="hh-empty">No teams yet \u2014 create a team to get started.</div>';
  }
}

// profile image upload (Firebase Storage)
function pickAvatar(){ _homePickImage('avatar'); }
function pickCover(){ _homePickImage('cover'); }
function _homePickImage(kind){
  var inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange=function(){ var f=inp.files&&inp.files[0]; if(f) _homeUpload(kind,f); };
  inp.click();
}
function _downscaleToDataUrl(file, maxDim, quality){
  return new Promise(function(resolve, reject){
    var rd = new FileReader();
    rd.onerror = reject;
    rd.onload = function(ev){
      var img = new Image();
      img.onerror = reject;
      img.onload = function(){
        var w=img.width||1, h=img.height||1;
        var scale = Math.min(1, maxDim / Math.max(w, h));
        var cw = Math.max(1, Math.round(w*scale)), ch = Math.max(1, Math.round(h*scale));
        var c = document.createElement('canvas'); c.width=cw; c.height=ch;
        var ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, cw, ch);
        try { resolve(c.toDataURL('image/jpeg', quality)); } catch(err){ reject(err); }
      };
      img.src = ev.target.result;
    };
    rd.readAsDataURL(file);
  });
}
// Resolves true only if the URL actually loads as an image (Storage rules can hand back
// URLs that 404/403 as a background), so we never store a non-viewable cover/avatar URL.
function _imageLoads(url){
  return new Promise(function(resolve){
    if(!url){ resolve(false); return; }
    if(/^data:/.test(url)){ resolve(true); return; }
    var im=new Image(), done=false;
    var t=setTimeout(function(){ if(!done){ done=true; resolve(false); } }, 6000);
    im.onload=function(){ if(!done){ done=true; clearTimeout(t); resolve((im.naturalWidth||0)>0); } };
    im.onerror=function(){ if(!done){ done=true; clearTimeout(t); resolve(false); } };
    im.src=url;
  });
}
async function _homeUpload(kind, file){
  var uid = window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid;
  if(!uid){ if(typeof showToast==='function') showToast('Sign in to change photos'); return; }
  if(typeof isProUser==='function' && !isProUser()){
    if(typeof showToast==='function') showToast('Custom photos are a Pro feature — pick from the free gallery, or upgrade for your own.', 'error');
    return;
  }
  try {
    if(typeof showToast==='function') showToast('Uploading\u2026');
    var url = null;
    // 1) Preferred: Firebase Storage (keeps the Firestore doc small) — but only adopt the
    //    returned URL if it is actually viewable; Storage rules can yield non-readable URLs.
    if(window._fbStorage){
      try {
        var ref = window._fbStorage.ref('users/'+uid+'/'+kind+'.jpg');
        await ref.put(file);
        var _su = await ref.getDownloadURL();
        if(await _imageLoads(_su)) url = _su;
        else console.warn('storage URL not viewable, using inline fallback');
      } catch(se){ console.warn('storage upload failed, using inline fallback', se); url = null; }
    }
    // 2) Fallback: downscale and store inline in Firestore (works without Storage rules)
    if(!url){ url = await _downscaleToDataUrl(file, kind==='avatar'?256:900, 0.72); }
    _profile = _profile || {}; _profile[kind+'Url'] = url;
    var patch={}; patch[kind+'Url']=url;
    if(window._fbDb) await window._fbDb.collection('users').doc(uid).collection('profile').doc('data').set(patch, {merge:true});
    // Also surface the image on the public profile others see
    if(window._fbDb){ try{ await window._fbDb.collection('public_profiles').doc(uid).set(patch, {merge:true}); }catch(_pe){ console.warn('public_profiles image sync', _pe); } }
    if(typeof renderHomeScreen==='function') renderHomeScreen();
    if(typeof renderProfile==='function'){ var _ps=document.getElementById('screen-profile'); if(_ps) renderProfile(_ps); }
    // refresh Edit Profile previews from the saved url (not just the local preview)
    var bn=document.getElementById('bannerImg'); if(kind==='cover' && bn){ bn.src=url; bn.style.display='block'; }
    var mainAv=document.getElementById('main-avatar'); if(kind==='avatar' && mainAv){ mainAv.src=url; }
    if(typeof showToast==='function') showToast(kind==='avatar'?'Photo updated':'Cover updated');
  } catch(e){ console.warn('upload', e); if(typeof showToast==='function') showToast('Couldn\u2019t save photo'); }
}

// Release 1b: resolve when Home's avatar and cover images are loaded, or after maxMs.
function _waitHomeImages(maxMs) {
  const waits = [];
  const av = document.getElementById('homeAvatarImg');
  if (av && av.getAttribute('src') && !av.complete) {
    waits.push(new Promise(function(r){ av.addEventListener('load', r, {once:true}); av.addEventListener('error', r, {once:true}); }));
  }
  const cov = document.getElementById('homeCover');
  const m = cov && (cov.style.backgroundImage || '').match(/url\(["']?(.*?)["']?\)/);
  if (m && m[1]) {
    waits.push(new Promise(function(r){ const im = new Image(); im.onload = im.onerror = r; im.src = m[1]; }));
  }
  if (!waits.length) return Promise.resolve();
  return Promise.race([Promise.all(waits), new Promise(function(r){ setTimeout(r, maxMs); })]);
}

async function onSignedIn(user) {
  // Re-raise the full-screen auth cover BEFORE any DOM reveal or async load.
  // onSignedOut() may have run first (brief null-user after a Google redirect) and
  // both hidden this overlay and switched the underlying screen to the calculator —
  // without re-showing it here, the calculator flashes during the awaits below.
  const _aloIn = document.getElementById('authLoadingOverlay');
  if (_aloIn) { _aloIn.style.display = 'flex'; _aloIn.style.pointerEvents = 'auto'; }
  // NEW-UI: leave the login screen (keep the auth spinner up until Home is painted)
  const _login = document.getElementById('screen-login');
  if (_login) _login.classList.remove('active');
  const name = user.displayName || ((user.email || '').split('@')[0]) || 'Player';
  document.getElementById('userPillName').textContent = name;
  document.getElementById('userPill').classList.add('visible');
  document.getElementById('lockedHero').style.display  = 'none';
  document.getElementById('appContent').classList.add('unlocked');
  setGameMode('single');
  // Load the data Home needs BEFORE revealing it — prevents the login screen flashing.
  // Release 2: both loaders run at the same time. The teams list needs _savedTeams
  // (loadSavedData) and _teams (loadProfileData), so it is drawn again once both are in.
  // Safety net: on a very slow or no connection, show Home after 8 s and fill it in later.
  _appReady = false;
  const _loads = Promise.allSettled([loadSavedData(user.uid), loadProfileData(user.uid)])
    .then(function(){ if (typeof renderTeamsList === 'function') renderTeamsList(); });
  let _loadTimedOut = false;
  try {
    await Promise.race([_loads, new Promise(function(r){ setTimeout(function(){ _loadTimedOut = true; r(); }, 8000); })]);
  } catch (e) { console.warn('sign-in load', e); }
  if (_loadTimedOut) {
    console.warn('sign-in load slower than 8 s; showing Home and filling in when ready');
    _loads.then(function(){ if (typeof renderHomeScreen === 'function') renderHomeScreen(); });
  }
  startBuddyRequestListener(user.uid);
  startNotifListener(user.uid);
  if (typeof startM1LiveListener === 'function') startM1LiveListener(user.uid);   // v26: live 1vs1 invites + scores
  if(typeof startThreadsBellListener==='function') startThreadsBellListener(user.uid);
  checkForActiveMatch(user.uid);
  if (typeof restorePausedRoundFromCloud === 'function') restorePausedRoundFromCloud(user.uid);
  loadOpenGames(user.uid).then(function(){ if(typeof updateNotifBadge==='function') updateNotifBadge(); }).catch(function(){});
  checkWhatsNew();
  applyLang();
  initSectionState();
  initTeamPlayers();
  // NEW-UI: land on the redesigned Home with data ready
  document.getElementById('bottomTabs').classList.remove('visible');
  renderHomeScreen();
  showScreen('home', { replace: true });
  // Release 1b: let the avatar and cover finish loading first (max 0.8 s), so Home never
  // flashes the placeholder crown and an empty cover.
  try { await _waitHomeImages(800); } catch (_) {}
  // Only now dismiss the full-screen auth spinner — Home is already painted underneath
  const _alo = document.getElementById('authLoadingOverlay');
  if (_alo) { _alo.style.display = 'none'; _alo.style.pointerEvents = 'none'; }
  _appReady = true;   // Release 2: focus/visibility refresh may run from now on
  // v28: remind about a missing name / username / gender (only when the profile really loaded)
  if (!_loadTimedOut && typeof pmProfileNudge === 'function') setTimeout(function(){ pmProfileNudge(user.uid); }, 2500);
  // v33 privacy: email out of the public profile + exact-match email lookup kept current
  if (typeof pmPrivacySync === 'function') setTimeout(function(){ pmPrivacySync(user); }, 4000);
  // QR-invite entry: open the join flow using the URL param OR a code stashed before a
  // sign-in redirect (Google redirect can strip query params). Stash expires after 10 min.
  try {
    var jc = new URLSearchParams(window.location.search).get('join');
    if (!jc) {
      var raw = localStorage.getItem('pmPendingJoin');
      if (raw) { var o = JSON.parse(raw); if (o && o.code && (Date.now() - o.ts) < 600000) jc = o.code; }
    }
    localStorage.removeItem('pmPendingJoin');
    if (jc && typeof openJoinMatch === 'function') {
      try { history.replaceState({}, '', window.location.pathname + '?join=' + encodeURIComponent(jc)); } catch(_){}
      setTimeout(openJoinMatch, 300);
    }
  } catch(e){}
}

function onSignedOut() {
  _appReady = false;
  // NEW-UI: show the redesigned Login screen; hide legacy locked hero
  const _legacyHero = document.getElementById('lockedHero');
  if (_legacyHero) _legacyHero.style.display = 'none';
  showScreen('login', { replace: true });
  document.getElementById('userPill').classList.remove('visible');
  document.getElementById('lockedHero').style.display = '';
  stopBuddyRequestListener();
  stopNotifListener();
  if (typeof stopM1LiveListener === 'function') stopM1LiveListener();   // v26
  if(typeof stopThreadsBellListener==='function') stopThreadsBellListener();
  document.getElementById('appContent').classList.remove('unlocked');
  document.getElementById('bottomTabs').classList.remove('visible');
  _savedCourses = []; _savedTeams = []; _savedRounds = [];
  _profile = null; _teams = []; _buddies = []; _sentBuddyRequests = []; _pendingRequests = [];
  _buddiesLoaded = false; _baLatestDocs = []; _baBusy.clear();   // v25
  // Reset avatar pill
  const imgEl   = document.getElementById('userPillAvatarImg');
  const fallback= document.getElementById('userPillAvatarFallback');
  if (imgEl)    { imgEl.src = ''; imgEl.style.display = 'none'; }
  if (fallback)   fallback.style.display = '';
  updateRequestBadge();
  switchTab('calc');
  const _alo = document.getElementById('authLoadingOverlay');
  if (_alo) { _alo.style.display = 'none'; _alo.style.pointerEvents = 'none'; }
}

// ═══════════════════════════════════
// ROUND VIEW (read-only)
// ═══════════════════════════════════
let _viewingRoundId = null;

function openRoundView(id) {
  const r = _savedRounds.find(x => x.id === id);
  if (!r) return;
  _viewingRoundId = id;

  const par       = r.par       || Array(r.holes).fill(4);
  const scores    = r.scores    || Array(r.holes).fill(0);
  const oppScores = r.oppScores || Array(r.holes).fill(0);
  const isMatch   = !!r.isMatch;

  // Common header
  document.getElementById('rv_courseName').textContent = r.courseName || 'Round';
  const playedStr = r.playedAt
    ? new Date(r.playedAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
    : '';
  document.getElementById('rv_meta').textContent = isMatch
    ? `${r.holes} holes · ${r.teamName || 'My Team'} vs ${r.oppName || 'Opponent'}${playedStr ? ' · ' + playedStr : ''}`
    : `${r.holes} holes · HCP ${r.teamHcp} · ${r.teamName || ''}${playedStr ? ' · ' + playedStr : ''}`;

  // Show correct banner
  document.getElementById('rv_singleBanner').style.display = isMatch ? 'none' : '';
  document.getElementById('rv_matchBanner').style.display  = isMatch ? '' : 'none';

  if (!isMatch) {
    // ── Single mode banner ──
    const vsPar   = r.vsPar ?? (r.gross - r.totalPar);
    const vsClass = vsPar < 0 ? 'under' : vsPar > 0 ? 'over' : 'even';
    const vsLabel = vsPar === 0 ? 'E' : vsPar > 0 ? `+${vsPar}` : `${vsPar}`;
    document.getElementById('rv_gross').textContent = r.gross || '–';
    document.getElementById('rv_par').textContent   = r.totalPar || '–';
    document.getElementById('rv_holes').textContent = `${r.holesPlayed} / ${r.holes}`;
    const vsParEl = document.getElementById('rv_vsPar');
    vsParEl.textContent = vsLabel; vsParEl.className = 'sc-score-val ' + vsClass;

    // Single col header
    document.getElementById('rv_colHeader').innerHTML = `
      <div class="sc-col-label" data-i18n="sc_hole">Hole</div>
      <div class="sc-col-label" style="text-align:center;">Par</div>
      <div class="sc-col-label" style="text-align:center;">Score</div>
      <div class="sc-col-label" style="text-align:right;">Badge</div>`;
    document.getElementById('rv_colHeader').className = 'rv-col-header';

    // Single hole rows
    document.getElementById('rv_holes_list').innerHTML = par.map((p, i) => {
      const score    = scores[i];
      const complete = score > 0;
      const diff     = complete ? score - p : null;
      const scoreClass = complete
        ? score <= p - 2 ? 'eagle' : score === p - 1 ? 'birdie'
        : score === p + 1 ? 'bogey' : score >= p + 2 ? 'double' : '' : 'empty';
      const badgeClass = diff === null ? 'empty' : diff < 0 ? 'under' : diff > 0 ? 'over' : 'even';
      const badgeLabel = diff === null ? '' : diff === 0 ? 'E' : diff > 0 ? `+${diff}` : `${diff}`;
      return `
        <div class="rv-hole-row${complete ? ' complete' : ''}">
          <div class="rv-hole-num">${i + 1}</div>
          <div class="rv-par">${p}</div>
          <div class="rv-score ${scoreClass}">${complete ? score : '–'}</div>
          <div class="rv-badge ${badgeClass}">${badgeLabel}</div>
        </div>`;
    }).join('');

  } else {
    // ── Match mode banner ──
    const hcpDiff = (r.oppHcp || 0) - (r.teamHcp || 0);
    const indexArr = _denseSIRanks(r.index, r.holes);
    let myGross = 0, oppGross = 0, myParPlayed = 0, oppParPlayed = 0;
    let myWins = 0, oppWins = 0, holesPlayed = 0;

    for (let i = 0; i < r.holes; i++) {
      const myS  = scores[i];
      const oppS = oppScores[i];
      if (myS  > 0) { myGross  += myS;  myParPlayed  += par[i]; }
      if (oppS > 0) { oppGross += oppS; oppParPlayed += par[i]; }
      if (myS > 0 && oppS > 0) {
        holesPlayed++;
        const s = strokeOnHoleWithIndex(i, hcpDiff, indexArr, r.holes);
        const myNet  = myS  + (s < 0 ? s : 0);
        const oppNet = oppS + (s > 0 ? -s : 0);
        if      (myNet < oppNet) myWins++;
        else if (myNet > oppNet) oppWins++;
      }
    }

    const myVsPar  = myGross  > 0 ? myGross  - myParPlayed  : null;
    const oppVsPar = oppGross > 0 ? oppGross - oppParPlayed : null;
    const diff     = myWins - oppWins;

    document.getElementById('rv_myTeamName').textContent  = r.teamName   || 'My Team';
    document.getElementById('rv_oppTeamName').textContent = r.oppName    || 'Opponent';
    document.getElementById('rv_myHcpLabel').textContent  = `HCP ${r.teamHcp || 0}`;
    document.getElementById('rv_oppHcpLabel').textContent = `HCP ${r.oppHcp  || 0}`;

    const myVsEl  = document.getElementById('rv_myVsPar');
    const oppVsEl = document.getElementById('rv_oppVsPar');
    myVsEl.textContent  = myVsPar  === null ? '–' : myVsPar  === 0 ? 'E' : myVsPar  > 0 ? `+${myVsPar}`  : `${myVsPar}`;
    oppVsEl.textContent = oppVsPar === null ? '–' : oppVsPar === 0 ? 'E' : oppVsPar > 0 ? `+${oppVsPar}` : `${oppVsPar}`;
    myVsEl.className    = 'sc-match-score' + (myVsPar  === null ? '' : myVsPar  < 0 ? ' under' : myVsPar  > 0 ? ' over' : ' even');
    oppVsEl.className   = 'sc-match-score' + (oppVsPar === null ? '' : oppVsPar < 0 ? ' under' : oppVsPar > 0 ? ' over' : ' even');

    const statusEl = document.getElementById('rv_matchStatus');
    const labelEl  = document.getElementById('rv_statusLabel');
    if (holesPlayed === 0) {
      statusEl.textContent = '–'; statusEl.className = 'sc-match-status-val'; labelEl.textContent = 'Result';
    } else if (diff === 0) {
      statusEl.textContent = 'All Square'; statusEl.className = 'sc-match-status-val square';
      labelEl.textContent  = `${holesPlayed} holes`;
    } else {
      const leader = diff > 0 ? (r.teamName || 'My Team') : (r.oppName || 'Opponent');
      statusEl.textContent = `${Math.abs(diff)} UP`;
      statusEl.className   = 'sc-match-status-val ' + (diff > 0 ? 'leading' : 'trailing');
      labelEl.textContent  = leader.length > 10 ? leader.slice(0, 10) + '…' : leader;
    }

    // Stroke legend
    const rvLegend = hcpDiff !== 0 ? `
      <div style="grid-column:1/-1;font-size:0.6rem;color:var(--muted);padding-top:4px;border-top:1px solid var(--border);margin-top:2px;">
        ${hcpDiff > 0
          ? `<span style="color:var(--red);">+1</span> = stroke to <strong>${esc(r.oppName || 'Opponent')}</strong>`
          : `<span style="color:var(--tee1);">+1</span> = stroke to <strong>${esc(r.teamName || 'My Team')}</strong>`}
      </div>` : '';

    // Match col header
    document.getElementById('rv_colHeader').innerHTML = `
      <div class="sc-col-label" style="font-size:0.48rem;">Hole</div>
      <div class="sc-col-label" style="font-size:0.48rem;">Par</div>
      <div class="sc-col-label dual" style="font-size:0.48rem;">${esc(r.teamName || 'My Team')}</div>
      <div class="sc-col-label dual" style="font-size:0.48rem;">${esc(r.oppName  || 'Opponent')}</div>
      <div class="sc-col-label badge-col" style="font-size:0.48rem;">Result</div>
      ${rvLegend}`;
    document.getElementById('rv_colHeader').className = 'rv-col-header match';

    // Match hole rows
    document.getElementById('rv_holes_list').innerHTML = par.map((p, i) => {
      const myS  = scores[i];
      const oppS = oppScores[i];
      const myDone  = myS  > 0;
      const oppDone = oppS > 0;
      const mySC    = myDone  ? (myS  <= p-2 ? 'eagle' : myS  === p-1 ? 'birdie' : myS  === p+1 ? 'bogey' : myS  >= p+2 ? 'double' : '') : 'empty';
      const oppSC   = oppDone ? (oppS <= p-2 ? 'eagle' : oppS === p-1 ? 'birdie' : oppS === p+1 ? 'bogey' : oppS >= p+2 ? 'double' : '') : 'empty';

      const s = strokeOnHoleWithIndex(i, hcpDiff, indexArr, r.holes);
      let strokeDot = '';
      if (s > 0)      strokeDot = `<span class="sc-stroke-dot opp">+${s}</span>`;
      else if (s < 0) strokeDot = `<span class="sc-stroke-dot my">+${Math.abs(s)}</span>`;

      let resultLabel = '', resultClass = '';
      if (myDone && oppDone) {
        const myNet  = myS  + (s < 0 ? s : 0);
        const oppNet = oppS + (s > 0 ? -s : 0);
        if      (myNet < oppNet) { resultLabel = 'W'; resultClass = 'win'; }
        else if (myNet > oppNet) { resultLabel = 'L'; resultClass = 'loss'; }
        else                     { resultLabel = 'H'; resultClass = 'half'; }
      }

      return `
        <div class="rv-hole-row match${(myDone || oppDone) ? ' complete' : ''}">
          <div class="rv-hole-num" style="display:flex;flex-direction:column;align-items:center;gap:2px;">${i + 1}${strokeDot}</div>
          <div class="rv-par">${p}</div>
          <div class="rv-score ${mySC}">${myDone  ? myS  : '–'}</div>
          <div class="rv-score ${oppSC}">${oppDone ? oppS : '–'}</div>
          <div class="rv-badge ${resultClass || 'empty'}">${resultLabel}</div>
        </div>`;
    }).join('');

    // Totals row
    const myTotal  = scores.reduce((a,b)    => a + (b > 0 ? b : 0), 0);
    const oppTotal = oppScores.reduce((a,b) => a + (b > 0 ? b : 0), 0);
    const totalPar = par.reduce((a,b) => a + b, 0);
    if (myTotal > 0 || oppTotal > 0) {
      document.getElementById('rv_holes_list').innerHTML +=`
        <div class="rv-totals-row">
          <div class="rv-totals-label">Total</div>
          <div class="rv-totals-par">${totalPar}</div>
          <div class="rv-totals-score">${myTotal > 0 ? myTotal : '–'}</div>
          <div class="rv-totals-score">${oppTotal > 0 ? oppTotal : '–'}</div>
          <div></div>
        </div>`;
    }
  }

  document.getElementById('roundViewOverlay').classList.add('open');
  document.getElementById('roundViewOverlay').scrollTop = 0;
}

function closeRoundView() {
  document.getElementById('roundViewOverlay').classList.remove('open');
  _viewingRoundId = null;
}

async function deleteRound() {
  if (!_viewingRoundId) return;
  if (!confirm('Delete this round? This cannot be undone.')) return;
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid) return;
  try {
    await window._fbDb.collection('users').doc(uid).collection('rounds').doc(_viewingRoundId).delete();
    _savedRounds = _savedRounds.filter(r => r.id !== _viewingRoundId);
    closeRoundView();
    renderMyData();
    showToast('Round deleted.', 'success');
  } catch(e) {
    showToast('Could not delete: ' + e.message, 'error');
  }
}

// Delete the scorecard currently open in screen-rounddetail (round OR match)
async function deleteActiveScorecard(){
  var r=window._activeRound||{};
  if(!r.id){ if(typeof showToast==='function') showToast('Nothing to delete'); return; }
  var isMatch=!!r.isMatch;
  if(!confirm('Delete this '+(isMatch?'match':'round')+'? This cannot be undone.')) return;
  var uid=(window._fbAuth&&window._fbAuth.currentUser)?window._fbAuth.currentUser.uid:null;
  try{
    if(uid&&window._fbDb){ await window._fbDb.collection('users').doc(uid).collection('rounds').doc(r.id).delete(); }
    if(typeof _savedRounds!=='undefined'){ _savedRounds=_savedRounds.filter(function(x){return x.id!==r.id;}); }
    window._activeRound=null;
    if(typeof renderHomeScreen==='function') renderHomeScreen();
    var mEl=document.getElementById('screen-matches'); if(mEl&&typeof renderMatches==='function') renderMatches(mEl);
    if(typeof showToast==='function') showToast((isMatch?'Match':'Round')+' deleted','success');
    if(typeof screenBack==='function') screenBack(); else showScreen('matches');
  }catch(e){ console.warn('delete scorecard',e); if(typeof showToast==='function') showToast('Could not delete','error'); }
}
let _sc = {
  holes:        18,
  isMatch:      false,
  isLive:       false,
  isCarousel:   false,  // true when using carousel view
  currentHole:  0,      // current hole index in carousel
  myRole:       null,
  matchId:      null,
  teamName:     '',
  teamHcp:      0,
  oppName:      '',
  oppHcp:       0,
  courseName:   '',
  par:          [],
  index:        [],
  scores:       [],
  oppScores:    [],
};

// Numpad state — track which team we're entering for
let _numpad = { holeIdx: -1, team: 'my', buffer: '' };

function openScorecard() {
  const n = _holes;
  const isMatch = _gameMode === 'match';
  // Starting a fresh round: clear any previously paused round + its banner, and
  // reset the saved flag so this new round is tracked as unsaved.
  _pausedRound = null;
  _scRoundSaved = false;
  if (typeof hidePausedRoundBanner === 'function') hidePausedRoundBanner();
  _sc.holes      = n;
  _sc.isMatch    = isMatch;
  _sc.isCarousel = true;
  _sc.currentHole = 0;
  _sc.teamName   = val('team1_name') || 'My Team';
  _sc.oppName    = val('team2_name') || 'Opponent';
  _sc.courseName = val('course_name') || 'Unnamed Course';

  // Pull HCPs from the rendered result cards (sorted lowest first)
  const hcpNums = document.querySelectorAll('.result-hcp-num');
  _sc.teamHcp = hcpNums[0] ? parseInt(hcpNums[0].textContent) || 0 : 0;
  _sc.oppHcp  = hcpNums[1] ? parseInt(hcpNums[1].textContent) || 0 : 0;

  // Use par per hole from calc course if available, else equal split
  if (_calcParValues && _calcParValues.length === n) {
    _sc.par   = _calcParValues.slice();
    _sc.index = _calcIndexValues && _calcIndexValues.length === n ? _calcIndexValues.slice() : Array.from({length:n},(_,i)=>i+1);
  } else {
    const totalPar = numVal('course_par') || (n === 9 ? 36 : 72);
    const basePar  = Math.floor(totalPar / n);
    _sc.par   = Array(n).fill(basePar);
    _sc.index = Array.from({length:n},(_,i)=>i+1);
  }
  _sc.scores    = Array(n).fill(0);
  _sc.oppScores = Array(n).fill(0);

  // Header
  document.getElementById('sc_courseName').textContent    = _sc.courseName;
  document.getElementById('sc_meta').textContent          =
    `${n} holes · ${isMatch ? _sc.teamName + ' vs ' + _sc.oppName : 'HCP ' + _sc.teamHcp + ' · ' + _sc.teamName}`;
  document.getElementById('sc_holesProgress').textContent = `0 / ${n}`;

  // Show correct banner
  document.getElementById('sc_singleBanner').style.display = isMatch ? 'none' : '';
  document.getElementById('sc_matchBanner').style.display  = isMatch ? '' : 'none';

  if (isMatch) {
    document.getElementById('sc_myTeamName').textContent  = _sc.teamName;
    document.getElementById('sc_oppTeamName').textContent = _sc.oppName;
    document.getElementById('sc_myHcpLabel').textContent  = `HCP ${_sc.teamHcp}`;
    document.getElementById('sc_oppHcpLabel').textContent = `HCP ${_sc.oppHcp}`;
    const hcpDiffR = _sc.oppHcp - _sc.teamHcp;
    const legendR  = hcpDiffR !== 0 ? `
      <div style="grid-column:1/-1;font-size:0.6rem;color:var(--muted);padding-top:4px;border-top:1px solid var(--border);margin-top:2px;">
        ${hcpDiffR > 0
          ? `<span style="color:var(--red);">●</span> = stroke to <strong>${esc(_sc.oppName)}</strong> (${Math.abs(hcpDiffR)} hole${Math.abs(hcpDiffR)>1?'s':''})`
          : `<span style="color:var(--tee1);">●</span> = stroke to <strong>${esc(_sc.teamName)}</strong> (${Math.abs(hcpDiffR)} hole${Math.abs(hcpDiffR)>1?'s':''})`}
      </div>` : '';
    document.getElementById('sc_colHeader').innerHTML = `
      <div class="sc-col-label" style="font-size:0.48rem;">Hole</div>
      <div class="sc-col-label" style="font-size:0.48rem;">Par</div>
      <div class="sc-col-label dual" style="font-size:0.48rem;">${esc(_sc.teamName)}</div>
      <div class="sc-col-label dual" style="font-size:0.48rem;">${esc(_sc.oppName)}</div>
      <div class="sc-col-label badge-col" style="font-size:0.48rem;">Result</div>
      ${legendR}`;
    document.getElementById('sc_colHeader').className = 'sc-col-header match';
  } else {
    document.getElementById('sc_colHeader').innerHTML = `
      <div class="sc-col-label" data-i18n="sc_hole">Hole</div>
      <div class="sc-col-label" data-i18n="sc_par">Par</div>
      <div class="sc-col-label score-col" data-i18n="sc_score_col">Score</div>
      <div class="sc-col-label badge-col" data-i18n="sc_badge_col">Badge</div>`;
    document.getElementById('sc_colHeader').className = 'sc-col-header';
  }

  // Use carousel for single mode
  if (!isMatch) {
    document.getElementById('sc_holes').style.display     = 'none';
    document.getElementById('sc_colHeader').style.display = 'none';
    document.getElementById('sc_carousel').style.display  = '';
    document.getElementById('sc_carouselMyName').textContent  = _sc.teamName;
    document.getElementById('sc_carouselOppName').textContent = _sc.oppName;
    renderCarouselHole(0);
    renderCarouselDots();
  } else {
    document.getElementById('sc_holes').style.display     = '';
    document.getElementById('sc_colHeader').style.display = '';
    document.getElementById('sc_carousel').style.display  = 'none';
    renderScorecardHoles();
  }

  updateScorecardTotals();
  setSaveBtnsState(false);
  document.getElementById('scorecardOverlay').classList.add('open');
  document.getElementById('scorecardOverlay').scrollTop = 0;
}

function closeScorecard() {
  // During live match — minimise instead of closing
  if (_sc.isLive) {
    document.getElementById('scorecardOverlay').classList.remove('open');
    numpadCancel();
    showLiveMatchBanner();
    showToast('Match is live — tap the banner to return.', 'info');
    return;
  }
  document.getElementById('scorecardOverlay').classList.remove('open');
  numpadCancel();

  // TR (single/non-live) round with scores entered but not yet saved:
  // pause it rather than discard, and surface a banner to resume or discard.
  const hasScores = Array.isArray(_sc.scores) && _sc.scores.some(s => s > 0);
  if (!_sc.isLive && hasScores && !_scRoundSaved) {
    _pausedRound = {
      snapshot: JSON.parse(JSON.stringify(_sc)),
      courseName: _sc.courseName,
      holesPlayed: _sc.scores.filter(s => s > 0).length,
      holes: _sc.holes,
      pausedAt: new Date().toISOString(),
    };
    showPausedRoundBanner();
    savePausedRoundToCloud();   // persist so it survives app close / re-login
    showToast('Round paused — tap the banner to resume.', 'info');
    _sc.isCarousel  = false;
    _sc.currentHole = 0;
    restoreScorecardChrome();
    return;
  }

  _sc.isCarousel  = false;
  _sc.currentHole = 0;
  // Clear round data on exit so an unsaved round can never bleed into the next
  // game (previously scores/oppScores persisted in _sc and showed up in a new round).
  _sc.scores      = [];
  _sc.oppScores   = [];
  _sc.isMatch     = false;
  _sc.isLive      = false;
  _sc.matchId     = null;
  _sc.myRole      = null;
  restoreScorecardChrome();
}

// Restore the scorecard's default chrome (buttons/columns) after closing.
function restoreScorecardChrome() {
  const backBtn = document.getElementById('sc_backBtn');
  const endBtn  = document.getElementById('sc_endMatchBtn');
  const codeEl  = document.getElementById('sc_liveCode');
  if (backBtn) backBtn.style.display = '';
  if (endBtn)  endBtn.style.display  = 'none';
  if (codeEl)  codeEl.style.display  = 'none';
  const holesEl = document.getElementById('sc_holes');
  const colEl   = document.getElementById('sc_colHeader');
  const carEl   = document.getElementById('sc_carousel');
  if (holesEl) holesEl.style.display = '';
  if (colEl)   colEl.style.display   = '';
  if (carEl)   carEl.style.display   = 'none';
}

// ── PAUSED (unsaved) TR ROUND — banner, resume, discard ─────────────────
let _pausedRound = null;   // holds a snapshot of an unsaved TR round
let _scRoundSaved = false; // set true when a round is saved, so we don't offer to resume it

function showPausedRoundBanner() {
  if (!_pausedRound) { console.log('[PAUSE] showBanner: no _pausedRound'); return; }
  const banner = document.getElementById('pausedRoundBanner');
  const textEl = document.getElementById('pausedRoundBannerText');
  console.log('[PAUSE] showBanner: bannerEl=', !!banner, 'textEl=', !!textEl);
  if (textEl) {
    textEl.textContent = '⛳ Round in progress · ' + _pausedRound.courseName +
      ' (' + _pausedRound.holesPlayed + '/' + _pausedRound.holes + ') — tap to resume';
  }
  if (banner) {
    // Force-show with explicit styles + very high z-index so no header/overlay can
    // hide it, regardless of the current screen's stacking context.
    banner.style.display    = 'flex';
    banner.style.position   = 'fixed';
    banner.style.top        = '0';
    banner.style.left       = '0';
    banner.style.right      = '0';
    banner.style.zIndex     = '99999';
    banner.style.visibility = 'visible';
    banner.style.opacity    = '1';
  }
  document.querySelectorAll('.page-inner').forEach(el => el.style.paddingTop = '44px');
}

function hidePausedRoundBanner() {
  const banner = document.getElementById('pausedRoundBanner');
  if (banner) banner.style.display = 'none';
  document.querySelectorAll('.page-inner').forEach(el => el.style.paddingTop = '');
}

// Pause the current TR round if it has unsaved scores. Safe to call multiple
// times — it no-ops if already paused or nothing to save.
function maybePauseTrRound() {
  console.log('[PAUSE] maybePauseTrRound called. _pausedRound=', !!_pausedRound,
    '_scRoundSaved=', _scRoundSaved,
    '_trcScores=', JSON.stringify(_trcScores),
    'hasFlow=', !!(_trFlow && _trFlow.course));
  if (_pausedRound) { console.log('[PAUSE] skip: already paused'); return; }
  if (_scRoundSaved) { console.log('[PAUSE] skip: round already saved'); return; }
  const hasScores = Array.isArray(_trcScores) && _trcScores.some(s => s != null);
  if (!hasScores || !_trFlow || !_trFlow.course) { console.log('[PAUSE] skip: no scores or no flow'); return; }
  const c = _trFlow.course;
  _pausedRound = {
    trcScores: _trcScores.slice(),
    trcHole: _trcHole,
    course: JSON.parse(JSON.stringify(c)),
    team: _trFlow.team ? JSON.parse(JSON.stringify(_trFlow.team)) : null,
    courseName: c.name || 'Course',
    holesPlayed: _trcScores.filter(s => s != null).length,
    holes: trcTotal(),
    pausedAt: new Date().toISOString(),
  };
  if (typeof soloPauseSnapshot === 'function') Object.assign(_pausedRound, soloPauseSnapshot());   // keeps Solo mode + setup
  console.log('[PAUSE] paused round created:', _pausedRound.courseName, _pausedRound.holesPlayed + '/' + _pausedRound.holes);
  showPausedRoundBanner();
  savePausedRoundToCloud();
  if (typeof updateNotifBadge === 'function') updateNotifBadge();
  if (typeof showToast === 'function') showToast('Round paused — tap the banner to resume.', 'info');
}

// Called when leaving the TR scorecard via the BACK pill.
function trcLeaveScorecard() {
  maybePauseTrRound();
  showScreen((typeof soloLeaveTarget === 'function' && soloLeaveTarget()) || 'trresult');
}

// Tapping the banner: restore the TR flow + scores and jump back into the scorecard.
function resumePausedRound() {
  if (!_pausedRound) { hidePausedRoundBanner(); return; }
  if (typeof m1ResumePaused === 'function' && m1ResumePaused()) return;   // 1vs1 match (app-match.js)
  if (!_trFlow) _trFlow = {};
  _trFlow.course = JSON.parse(JSON.stringify(_pausedRound.course));
  if (_pausedRound.team) _trFlow.team = JSON.parse(JSON.stringify(_pausedRound.team));
  if (typeof soloPauseRestore === 'function') soloPauseRestore(_pausedRound);   // Solo mode or team round
  _trcScores = _pausedRound.trcScores.slice();
  _trcHole = _pausedRound.trcHole || 0;
  _trcBuf = '';
  _scRoundSaved = false;
  _pausedRound = null;   // cleared so leaving again snapshots the latest scores
  hidePausedRoundBanner();
  showScreen('trscore');
}

// Discard the paused round entirely (with confirmation).
function discardPausedRound() {
  document.getElementById('pausedRoundConfirm').classList.add('visible');
}
function closePausedRoundConfirm() {
  document.getElementById('pausedRoundConfirm').classList.remove('visible');
}
function confirmDiscardPausedRound() {
  closePausedRoundConfirm();
  _pausedRound = null;
  hidePausedRoundBanner();
  if (typeof showToast === 'function') showToast('Round discarded.', 'info');
  clearPausedRoundFromCloud();
  if (typeof updateNotifBadge === 'function') updateNotifBadge();
  var notifScr = document.getElementById('screen-notifications');
  if (notifScr && notifScr.classList.contains('active') && typeof renderNotifList === 'function') renderNotifList();
}

// ── Paused-round cloud persistence (survives app close / re-login) ──────────
// Stored at users/{uid}/state/pausedRound — one per user (at most one paused TR).
function _pausedRoundDocRef() {
  const user = window._fbAuth && window._fbAuth.currentUser;
  if (!user || !window._fbDb) return null;
  return window._fbDb.collection('users').doc(user.uid).collection('state').doc('pausedRound');
}

async function savePausedRoundToCloud() {
  const ref = _pausedRoundDocRef();
  console.log('[PAUSE] savePausedRoundToCloud: ref=', !!ref, 'hasPaused=', !!_pausedRound);
  if (!ref || !_pausedRound) return;
  try { await ref.set(_pausedRound); console.log('[PAUSE] saved to Firestore OK'); }
  catch (e) { console.warn('[PAUSE] Could not save paused round:', e); }
}

async function clearPausedRoundFromCloud() {
  const ref = _pausedRoundDocRef();
  if (!ref) return;
  try { await ref.delete(); }
  catch (e) { console.warn('Could not clear paused round:', e); }
}

// Called at login: if a paused round was left behind, restore it and show the banner.
async function restorePausedRoundFromCloud(uid) {
  console.log('[PAUSE] restorePausedRoundFromCloud called for uid=', uid);
  if (!window._fbDb) { console.log('[PAUSE] no _fbDb'); return; }
  try {
    const snap = await window._fbDb.collection('users').doc(uid).collection('state').doc('pausedRound').get();
    console.log('[PAUSE] restore: doc exists=', snap.exists);
    if (!snap.exists) return;
    const data = snap.data();
    console.log('[PAUSE] restore: trcScores=', JSON.stringify(data && data.trcScores));
    if (!data || !Array.isArray(data.trcScores) || !data.trcScores.some(s => s != null)) {
      console.log('[PAUSE] restore: no valid scores, deleting doc');
      await window._fbDb.collection('users').doc(uid).collection('state').doc('pausedRound').delete().catch(()=>{});
      return;
    }
    _pausedRound = data;
    _scRoundSaved = false;
    console.log('[PAUSE] restore: showing banner');
    if (typeof showPausedRoundBanner === 'function') showPausedRoundBanner();
  } catch (e) {
    console.warn('Could not restore paused round:', e);
  }
}

function forceCloseScorecard() {
  document.getElementById('scorecardOverlay').classList.remove('open');
  numpadCancel();
  if (window._matchUnsubscribe) {
    window._matchUnsubscribe();
    window._matchUnsubscribe = null;
  }
  _sc.isLive      = false;
  _sc.isCarousel  = false;
  _sc.currentHole = 0;
  _sc.myRole      = null;
  _sc.matchId     = null;
  window._activeMatchId   = null;
  window._activeMatchRole = null;
  const backBtn = document.getElementById('sc_backBtn');
  const endBtn  = document.getElementById('sc_endMatchBtn');
  const codeEl  = document.getElementById('sc_liveCode');
  if (backBtn) backBtn.style.display = '';
  if (endBtn)  endBtn.style.display  = 'none';
  if (codeEl)  codeEl.style.display  = 'none';
  // Restore scroll view
  document.getElementById('sc_holes').style.display     = '';
  document.getElementById('sc_colHeader').style.display = '';
  document.getElementById('sc_carousel').style.display  = 'none';
  hideLiveMatchBanner();
  // After a match ends, land on the Play Golf screen — not the leftover "share code"
  // / "waiting for opponent" screen that was sitting under the scorecard overlay.
  if (typeof showScreen === 'function') showScreen('choosegame', { replace: true });
}

// ── LIVE MATCH BANNER ──────────────────────────────────────
function showLiveMatchBanner(label) {
  const banner = document.getElementById('liveMatchBanner');
  const textEl = document.getElementById('liveMatchBannerText');
  if (textEl) textEl.textContent = label || t('banner_live');
  if (banner) banner.style.display = '';
  document.querySelectorAll('.page-inner').forEach(el => el.style.paddingTop = '44px');
}

function hideLiveMatchBanner() {
  const banner = document.getElementById('liveMatchBanner');
  if (banner) banner.style.display = 'none';
  document.querySelectorAll('.page-inner').forEach(el => el.style.paddingTop = '');
}

async function resumeLiveScorecard() {
  if (!window._activeMatchId) return;
  try {
    const snap = await window._fbDb.collection('matches').doc(window._activeMatchId).get();
    if (!snap.exists) {
      showToast('Match no longer exists.', 'error');
      hideLiveMatchBanner();
      window._activeMatchId = null;
      return;
    }
    const data = snap.data();
    if (data.status === 'complete') {
      showToast('This match has already ended.', 'info');
      hideLiveMatchBanner();
      window._activeMatchId = null;
      return;
    }
    hideLiveMatchBanner();
    openLiveScorecard(data, window._activeMatchRole);
  } catch(err) {
    console.error('resumeLiveScorecard error:', err);
    showToast('Could not resume match. Check your connection.', 'error');
  }
}

// ── END MATCH ──────────────────────────────────────────────
function confirmEndMatch() {
  document.getElementById('endMatchModal').style.display = 'flex';
}

function cancelEndMatch() {
  document.getElementById('endMatchModal').style.display = 'none';
}

async function endMatch() {
  cancelEndMatch();
  if (_sc) _sc._ended = true;   // mark initiator so our own listener doesn't double-handle
  const matchId = _sc.matchId;
  try { await saveRound(); } catch(e) { console.warn('saveRound in endMatch:', e); }
  if (matchId) {
    try {
      await window._fbDb.collection('matches').doc(matchId).update({
        status:      'complete',
        completedAt: Date.now()
      });
    } catch(err) {
      console.error('endMatch Firestore error:', err);
    }
  }
  showToast('Match ended — round saved.', 'success');
  forceCloseScorecard();
}

// ── CHECK FOR ACTIVE MATCH ON LOGIN ───────────────────────
async function checkForActiveMatch(uid) {
  if (!uid || !window._fbDb) return;
  const isActive  = d => d.data().status === 'active';
  const isWaiting = d => d.data().status === 'waiting' && !(d.data().teamB && d.data().teamB.uid);
  // Active matches this user already ended (round saved with matchComplete) must never
  // re-prompt — even if the Firestore status update was blocked (e.g. role-B can't write
  // the host's doc). Treat them as done and best-effort clean them up.
  const endedLocally = (matchId) => {
    try {
      const arr = (typeof _savedRounds !== 'undefined' && _savedRounds) || window._savedRounds || [];
      return arr.some(r => r && r.id === ('m_' + matchId) && r.matchComplete);
    } catch (_) { return false; }
  };
  const bestEffortComplete = (matchId) => {
    try { window._fbDb.collection('matches').doc(matchId).update({ status:'complete', completedAt: Date.now() }); } catch (_) {}
  };
  // First active doc for a uid-field that the user hasn't already ended.
  const findLive = async (field, role) => {
    let docs;
    try {
      const s = await window._fbDb.collection('matches').where(field,'==',uid).where('status','==','active').limit(5).get();
      docs = s.docs;
    } catch (err) {
      console.warn('checkForActiveMatch compound query failed, falling back:', err.message);
      const s = await window._fbDb.collection('matches').where(field,'==',uid).limit(15).get();
      docs = s.docs.filter(isActive);
    }
    for (const d of docs) {
      const data = d.data();
      if (endedLocally(data.matchId)) { bestEffortComplete(data.matchId); continue; }
      _onOpenMatchFound(data, role);
      return true;
    }
    return false;
  };
  try {
    if (await findLive('teamA.uid', 'A')) return;
    if (await findLive('teamB.uid', 'B')) return;
    // No active match — surface my own match still waiting for an opponent
    const wA = await window._fbDb.collection('matches').where('teamA.uid','==',uid).limit(15).get();
    const w = wA.docs.find(isWaiting);
    if (w) { _onOpenMatchFound(w.data(), 'A'); return; }
  } catch (err) {
    console.warn('checkForActiveMatch failed:', err.message);
  }
}

// Shared handler when an open match is found on login: persistent banner + prominent modal.
function _onOpenMatchFound(data, role) {
  if (!data || !data.matchId) return;
  window._activeMatchId   = data.matchId;
  window._activeMatchRole = role;
  const _t = (typeof t === 'function') ? t : (k => k);
  const oppName = (role === 'A' ? (data.teamB && data.teamB.teamName) : (data.teamA && data.teamA.teamName)) || _t('rejoin_opp_fallback');
  const waiting = (data.status === 'waiting');
  if (typeof showLiveMatchBanner === 'function') {
    showLiveMatchBanner('\u26a1 ' + (waiting
      ? _t('rejoin_banner_waiting')
      : _t('rejoin_banner_active').replace('{opp}', oppName)));
  }
  // Open/waiting games are now managed in the notification bell (see loadOpenGames);
  // the login modal is intentionally not shown here anymore.
}

// Prominent login modal: Rejoin/Dismiss (active) or Resume/Cancel (waiting).
function showRejoinModal(info) {
  window._rejoinInfo = info;
  const _t = (typeof t === 'function') ? t : (k => k);
  const waiting = (info.status === 'waiting');
  const titleEl = document.getElementById('rejoinModalTitle');
  const bodyEl  = document.getElementById('rejoinModalBody');
  const primEl  = document.getElementById('rejoinModalPrimary');
  const secEl   = document.getElementById('rejoinModalSecondary');
  if (titleEl) titleEl.textContent = '\u26a1 ' + _t('rejoin_title');
  if (bodyEl)  bodyEl.textContent  = waiting
    ? _t('rejoin_body_waiting').replace('{code}', info.code || '\u2014')
    : _t('rejoin_body_active').replace('{opp}', info.oppName || _t('rejoin_opp_fallback'));
  if (primEl) primEl.textContent = waiting ? _t('rejoin_primary_waiting') : _t('rejoin_primary_active');
  if (secEl)  secEl.textContent  = waiting ? _t('rejoin_secondary_waiting') : _t('rejoin_secondary_active');
  const m = document.getElementById('rejoinModal'); if (m) m.style.display = 'flex';
}
function dismissRejoinModal() {
  const m = document.getElementById('rejoinModal'); if (m) m.style.display = 'none';
}
function rejoinModalPrimary() {
  const info = window._rejoinInfo || {};
  dismissRejoinModal();
  if (info.status === 'waiting') {
    window._activeMatchId = info.id; window._activeMatchRole = 'A';
    if (typeof openMatchCode === 'function') openMatchCode(info.code);
  } else {
    if (typeof resumeLiveScorecard === 'function') resumeLiveScorecard();
  }
}
function rejoinModalSecondary() {
  const info = window._rejoinInfo || {};
  if (info.status === 'waiting') {
    if (typeof abandonMatch === 'function') abandonMatch(info.id);
    window._activeMatchId = null; window._activeMatchRole = null;
    if (typeof hideLiveMatchBanner === 'function') hideLiveMatchBanner();
  } else {
    // Active match, user chose not to rejoin. If they've already recorded this match
    // (a saved round exists), flag it done on their own side so it stops re-prompting.
    _markMatchDoneLocally(info.id);
    window._activeMatchId = null; window._activeMatchRole = null;
    if (typeof hideLiveMatchBanner === 'function') hideLiveMatchBanner();
  }
  dismissRejoinModal();
}
// Persist a "done" flag on the user's OWN saved round for a match (never touches the
// shared match doc, so the opponent is unaffected). Only flags an existing round.
async function _markMatchDoneLocally(matchId) {
  try {
    const uid = window._fbAuth?.currentUser?.uid;
    if (!uid || !matchId) return;
    const rid = 'm_' + matchId;
    const arr = (typeof _savedRounds !== 'undefined' && _savedRounds) || [];
    const idx = arr.findIndex(r => r && r.id === rid);
    if (idx < 0) return; // nothing recorded — don't create a phantom round
    arr[idx].matchComplete = true;
    await window._fbDb.collection('users').doc(uid).collection('rounds').doc(rid)
      .update({ matchComplete: true, endedAt: Date.now() });
  } catch (_) {}
}

function openLiveScorecard(matchData, role) {
  const n = matchData.holes;
  const isA = role === 'A';

  _sc.holes      = n;
  _sc.isMatch    = true;
  _sc.isLive     = true;
  _sc.myRole     = role;
  _sc.matchId    = matchData.matchId;
  _sc.teamName   = isA ? matchData.teamA.teamName : matchData.teamB.teamName;
  _sc.teamHcp    = isA ? matchData.teamA.teamHcp  : matchData.teamB.teamHcp;
  _sc.oppName    = isA ? matchData.teamB.teamName : matchData.teamA.teamName;
  _sc.oppHcp     = isA ? matchData.teamB.teamHcp  : matchData.teamA.teamHcp;
  _sc.courseName = matchData.course.name;
  _sc.par        = matchData.par.length === n ? matchData.par.slice() : Array(n).fill(Math.floor((matchData.course.par || (n === 9 ? 36 : 72)) / n));
  _sc.index      = (matchData.index && matchData.index.length === n) ? matchData.index.slice() : Array.from({length: n}, (_, i) => i + 1);
  _sc.siRank     = _denseSIRanks(_sc.index, n);   // ranks for stroke allocation; _sc.index kept raw for display
  _sc.scores     = isA ? matchData.teamA.scores.slice() : matchData.teamB.scores.slice();
  _sc.oppScores  = isA ? matchData.teamB.scores.slice() : matchData.teamA.scores.slice();

  // Header
  document.getElementById('sc_courseName').textContent = _sc.courseName;
  document.getElementById('sc_meta').textContent = `${n} holes · ${_sc.teamName} vs ${_sc.oppName} · LIVE ⚡`;
  document.getElementById('sc_holesProgress').textContent = `0 / ${n}`;

  // Banners
  document.getElementById('sc_singleBanner').style.display = 'none';
  document.getElementById('sc_matchBanner').style.display  = '';
  document.getElementById('sc_myTeamName').textContent     = _sc.teamName;
  document.getElementById('sc_oppTeamName').textContent    = _sc.oppName;
  document.getElementById('sc_myHcpLabel').textContent     = `HCP ${_sc.teamHcp}`;
  document.getElementById('sc_oppHcpLabel').textContent    = `HCP ${_sc.oppHcp}`;
  const hcpDiff = _sc.oppHcp - _sc.teamHcp;
  const strokeLegend = hcpDiff !== 0 ? `
    <div style="grid-column:1/-1;font-size:0.6rem;color:var(--muted);padding-top:4px;border-top:1px solid var(--border);margin-top:2px;">
      ${hcpDiff > 0
        ? `<span style="color:var(--red);">●</span> = stroke to <strong>${esc(_sc.oppName)}</strong> (${Math.abs(hcpDiff)} hole${Math.abs(hcpDiff)>1?'s':''})`
        : `<span style="color:var(--tee1);">●</span> = stroke to <strong>${esc(_sc.teamName)}</strong> (${Math.abs(hcpDiff)} hole${Math.abs(hcpDiff)>1?'s':''})`}
    </div>` : '';

  document.getElementById('sc_colHeader').innerHTML = `
    <div class="sc-col-label" style="font-size:0.48rem;">Hole</div>
    <div class="sc-col-label" style="font-size:0.48rem;">Par</div>
    <div class="sc-col-label dual" style="font-size:0.48rem;">${esc(_sc.teamName)}</div>
    <div class="sc-col-label dual" style="font-size:0.48rem;">${esc(_sc.oppName)}</div>
    <div class="sc-col-label badge-col" style="font-size:0.48rem;">Result</div>
    ${strokeLegend}`;
  document.getElementById('sc_colHeader').className = 'sc-col-header match';

  // Switch to carousel view
  _sc.isCarousel  = true;
  _sc.currentHole = 0;
  document.getElementById('sc_holes').style.display    = 'none';
  document.getElementById('sc_colHeader').style.display = 'none';
  document.getElementById('sc_carousel').style.display  = '';

  // Set up carousel team names
  document.getElementById('sc_carouselMyName').textContent  = _sc.teamName;
  document.getElementById('sc_carouselOppName').textContent = _sc.oppName;

  renderCarouselHole(0);
  renderCarouselDots();
  updateScorecardTotals();
  setSaveBtnsState(false);

  // Swap back → end match button, show code badge
  const backBtn   = document.getElementById('sc_backBtn');
  const endBtn    = document.getElementById('sc_endMatchBtn');
  const codeEl    = document.getElementById('sc_liveCode');
  const codeValEl = document.getElementById('sc_liveCodeVal');
  if (backBtn)   backBtn.style.display  = 'none';
  if (endBtn)    endBtn.style.display   = '';
  if (codeEl)    codeEl.style.display   = '';
  if (codeValEl) codeValEl.textContent  = matchData.matchId;

  document.getElementById('scorecardOverlay').classList.add('open');
  document.getElementById('scorecardOverlay').scrollTop = 0;

  // Start live listener
  listenToMatch(matchData.matchId, (data) => {
    if (!data) return;
    const myScores  = isA ? data.teamA.scores : data.teamB.scores;
    const oppScores = isA ? data.teamB.scores : data.teamA.scores;

    // Update scores and refresh carousel
    for (let i = 0; i < n; i++) {
      _sc.oppScores[i] = oppScores[i] || 0;
      _sc.scores[i]    = myScores[i]  || 0;
    }
    renderCarouselHole(_sc.currentHole);
    renderCarouselDots();
    updateScorecardTotals();

    // Match ended by the other team → end here too: save this team's round and close.
    // _sc._ended guards re-entry and is set by endMatch() on the initiating side.
    if (data.status === 'complete' && _sc.isLive && !_sc._ended) {
      _sc._ended = true;
      showToast('Match ended by opponent — saving your round.', 'info');
      (async () => {
        try { await saveRound(); } catch(e) { console.warn('saveRound on opponent-end:', e); }
        forceCloseScorecard();
      })();
    }
  });
}

function setSaveBtnsState(disabled) {
  ['sc_saveBtnTop','sc_saveBtnBottom'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) { btn.disabled = disabled; btn.textContent = disabled ? '⏳ Saving…' : (id === 'sc_saveBtnTop' ? t('btn_save') : t('sc_save_round')); }
  });
}

function renderScorecardHoles() {
  const container = document.getElementById('sc_holes');
  container.innerHTML = _sc.par.map((p, i) => {
    if (_sc.isMatch) return renderMatchHoleRow(i, p);
    return renderSingleHoleRow(i, p);
  }).join('');
}

function renderSingleHoleRow(i, p) {
  const score    = _sc.scores[i];
  const complete = score > 0;
  const diff     = complete ? score - p : null;
  const scoreClass  = scoreColorClass(score, p, complete);
  const vsParLabel  = diff === null ? '' : diff === 0 ? 'E' : diff > 0 ? `+${diff}` : `${diff}`;
  const vsParClass  = diff === null ? '' : diff < 0 ? 'under' : diff > 0 ? 'over' : '';
  return `
    <div class="sc-hole-row${complete ? ' complete' : ''}" id="sc_row_${i}">
      <div class="sc-hole-num">${i + 1}</div>
      <div class="sc-par-btns">
        ${[3,4,5].map(v => `<button class="sc-par-btn${p===v?' active':''}" onclick="setHolePar(${i},${v})">${v}</button>`).join('')}
      </div>
      <div class="sc-score-tap" id="sc_tap_${i}" onclick="openNumpad(${i},'my')">
        <div class="sc-score-display${scoreClass ? ' '+scoreClass : ''}" id="sc_score_${i}">${complete ? score : '–'}</div>
        ${!complete ? '<div class="sc-score-tap-hint">score</div>' : ''}
      </div>
      <div class="sc-vs-par ${vsParClass}" id="sc_vs_${i}">${vsParLabel}</div>
    </div>`;
}

function renderMatchHoleRow(i, p) {
  const myScore  = _sc.scores[i];
  const oppScore = _sc.oppScores[i];
  const myDone   = myScore > 0;
  const oppDone  = oppScore > 0;
  const complete = myDone || oppDone;
  let resultLabel = '', resultClass = '';

  const hcpDiff = _sc.oppHcp - _sc.teamHcp;
  const s = strokeOnHole(i, hcpDiff);

  if (myDone && oppDone) {
    const myNet  = myScore  + (s < 0 ? s : 0);
    const oppNet = oppScore + (s > 0 ? -s : 0);
    if      (myNet < oppNet) { resultLabel = 'W'; resultClass = 'win'; }
    else if (myNet > oppNet) { resultLabel = 'L'; resultClass = 'loss'; }
    else                     { resultLabel = 'H'; resultClass = 'half'; }
  }

  const mySC  = scoreColorClass(myScore,  p, myDone);
  const oppSC = scoreColorClass(oppScore, p, oppDone);

  // Stroke dot — show who gets the stroke on this hole
  let strokeDot = '';
  if (s > 0) {
    strokeDot = `<span class="sc-stroke-dot opp">+${s}</span>`;
  } else if (s < 0) {
    strokeDot = `<span class="sc-stroke-dot my">+${Math.abs(s)}</span>`;
  }

  return `
    <div class="sc-hole-row match${complete ? ' complete' : ''}" id="sc_row_${i}">
      <div class="sc-hole-num">${i + 1}${strokeDot}</div>
      <div class="sc-par-btns">
        ${[3,4,5].map(v => `<button class="sc-par-btn${p===v?' active':''}" onclick="setHolePar(${i},${v})">${v}</button>`).join('')}
      </div>
      <div class="sc-score-tap my-team" id="sc_tap_my_${i}" onclick="openNumpad(${i},'my')">
        <div class="sc-score-display${mySC ? ' '+mySC : ''}" id="sc_score_my_${i}">${myDone ? myScore : '–'}</div>
        ${!myDone ? '<div class="sc-score-tap-hint">score</div>' : ''}
      </div>
      <div class="sc-score-tap opp-team${_sc.isLive ? ' live-readonly' : ''}" id="sc_tap_opp_${i}" onclick="${_sc.isLive ? 'void(0)' : `openNumpad(${i},'opp')`}">
        <div class="sc-score-display${oppSC ? ' '+oppSC : ''}" id="sc_score_opp_${i}">${oppDone ? oppScore : '–'}</div>
        ${!oppDone && !_sc.isLive ? '<div class="sc-score-tap-hint">score</div>' : ''}
        ${!oppDone && _sc.isLive ? '<div class="sc-score-tap-hint live">⏳</div>' : ''}
      </div>
      <div class="sc-hole-result ${resultClass}" id="sc_result_${i}">${resultLabel}</div>
    </div>`;
}

function scoreColorClass(score, par, complete) {
  if (!complete) return '';
  if (score <= par - 2) return 'eagle';
  if (score === par - 1) return 'birdie';
  if (score === par + 1) return 'bogey';
  if (score >= par + 2)  return 'double';
  return '';
}

// Stroke allocation based on hole SI and handicap difference
// Uses _sc.index for live scorecard
// Rank the holes actually played by stroke index (1 = hardest among them). For 18-hole
// play the SI is already 1..18 so this is identity; for 9-hole play it compresses the
// course's 1..18 indexes into 1..9 so strokes allocate correctly (WHS).
function _denseSIRanks(siArr, n){
  var arr=[];
  for(var i=0;i<n;i++){ arr.push({ i:i, si:(siArr && siArr[i]!=null) ? Number(siArr[i]) : (i+1) }); }
  var sorted=arr.slice().sort(function(a,b){ return a.si-b.si; });
  var out=new Array(n);
  for(var r=0;r<sorted.length;r++){ out[sorted[r].i]=r+1; }
  return out;
}
function strokeOnHole(holeIdx, hcpDiff) {
  return strokeOnHoleWithIndex(holeIdx, hcpDiff, _sc.siRank || _sc.index, _sc.holes);
}

// Standalone version — accepts explicit index array and hole count
// Used by round view where _sc is not available
function strokeOnHoleWithIndex(holeIdx, hcpDiff, indexArr, n) {
  if (hcpDiff === 0) return 0;
  const si  = (indexArr && indexArr[holeIdx]) ? indexArr[holeIdx] : holeIdx + 1;
  const abs = Math.abs(hcpDiff);
  const fullStrokes  = abs >= si ? 1 : 0;
  const extraStrokes = abs > n && (si <= abs - n) ? 1 : 0;
  const total = fullStrokes + extraStrokes;
  return hcpDiff > 0 ? total : -total;
}

function setHolePar(holeIdx, parVal) {
  _sc.par[holeIdx] = parVal;
  const row = document.getElementById(`sc_row_${holeIdx}`);
  if (row) row.querySelectorAll('.sc-par-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.textContent) === parVal);
  });
  updateHoleDisplay(holeIdx);
  updateScorecardTotals();
}

// ─── CAROUSEL ───────────────────────────────────────────────

function renderCarouselHole(i) {
  _sc.currentHole = i;
  const p       = _sc.par[i]       || 4;
  const myScore = _sc.scores[i]    || 0;
  const oppScore= _sc.oppScores[i] || 0;
  const n       = _sc.holes;

  // Navigation
  document.getElementById('sc_carouselHoleNum').textContent = `${t('sc_hole')} ${i + 1} / ${n}`;
  document.getElementById('sc_prevBtn').disabled = i === 0;
  document.getElementById('sc_nextBtn').disabled = i === n - 1;

  // Par + stroke info + SI active display
  const hcpDiff = _sc.oppHcp - _sc.teamHcp;
  const s = strokeOnHole(i, hcpDiff);
  const si = _sc.index && _sc.index[i] ? _sc.index[i] : null;

  let parInfo = `${t('sc_par')} ${p}`;
  if (_sc.isMatch) {
    if (s > 0)      parInfo += `  ·  +${s} ${esc(_sc.oppName)}`;
    else if (s < 0) parInfo += `  ·  +${Math.abs(s)} ${esc(_sc.teamName)}`;
  }
  document.getElementById('sc_carouselParInfo').textContent = parInfo;

  // SI active badge — colour coded by difficulty
  const siContainer = document.getElementById('sc_carouselSiBadge');
  if (siContainer) {
    if (si) {
      const difficulty = si <= 6 ? t('sc_hardest') : si <= 12 ? t('sc_average') : t('sc_easiest');
      siContainer.innerHTML = `<span style="color:#1a6b3c;font-size:0.8rem;font-weight:700;">SI ${si} · ${difficulty}</span>`;
      siContainer.style.display = '';
    } else {
      siContainer.style.display = 'none';
    }
  }

  // Show/hide opponent panel based on mode
  const oppPanel   = document.getElementById('sc_carouselOppScore');
  const oppNameEl  = document.getElementById('sc_carouselOppName');
  const carResEl   = document.getElementById('sc_carouselResult');
  if (!_sc.isMatch) {
    if (oppPanel)  oppPanel.style.display  = 'none';
    if (oppNameEl) oppNameEl.style.display = 'none';
    if (carResEl)  carResEl.style.display  = 'none';
    const myPanel = document.getElementById('sc_carouselMyScore');
    if (myPanel) myPanel.style.gridColumn = '1 / -1';
    const scoresGrid = document.querySelector('.sc-carousel-scores');
    if (scoresGrid) scoresGrid.style.gridTemplateColumns = '1fr';
  } else {
    if (oppPanel)  oppPanel.style.display  = '';
    if (oppNameEl) oppNameEl.style.display = '';
    if (carResEl)  carResEl.style.display  = '';
    const myPanel = document.getElementById('sc_carouselMyScore');
    if (myPanel) myPanel.style.gridColumn = '';
    const scoresGrid = document.querySelector('.sc-carousel-scores');
    if (scoresGrid) scoresGrid.style.gridTemplateColumns = '';
  }

  // My score
  const myDone  = myScore > 0;
  const myClass = myDone ? scoreColorClass(myScore, p, true) : '';
  const myEl    = document.getElementById('sc_carouselMyVal');
  const myHint  = document.getElementById('sc_carouselMyHint');
  const myTap   = document.getElementById('sc_carouselMyScore');
  myEl.textContent = myDone ? myScore : '–';
  myEl.className   = 'sc-carousel-score-val' + (myClass ? ' ' + myClass : '');
  myHint.textContent = myDone ? '' : t('sc_tap_to_score');
  myHint.style.display = myDone ? 'none' : '';
  myTap.classList.toggle('scored', myDone);

  // Opponent score
  const oppDone  = oppScore > 0;
  const oppClass = oppDone ? scoreColorClass(oppScore, p, true) : '';
  const oppEl    = document.getElementById('sc_carouselOppVal');
  const oppHint  = document.getElementById('sc_carouselOppHint');
  const oppTap   = document.getElementById('sc_carouselOppScore');
  oppEl.textContent = oppDone ? oppScore : '–';
  oppEl.className   = 'sc-carousel-score-val' + (oppClass ? ' ' + oppClass : '');
  oppHint.textContent = oppDone ? '' : '⏳';
  oppHint.style.display = oppDone ? 'none' : '';
  oppTap.classList.toggle('scored', oppDone);

  // Hole result
  const resultEl = document.getElementById('sc_carouselResult');
  if (myDone && oppDone) {
    const myNet  = myScore  + (s < 0 ? s : 0);
    const oppNet = oppScore + (s > 0 ? -s : 0);
    if      (myNet < oppNet) { resultEl.textContent = 'W'; resultEl.className = 'sc-carousel-result-badge win'; }
    else if (myNet > oppNet) { resultEl.textContent = 'L'; resultEl.className = 'sc-carousel-result-badge loss'; }
    else                     { resultEl.textContent = 'H'; resultEl.className = 'sc-carousel-result-badge half'; }
  } else {
    resultEl.textContent = 'vs';
    resultEl.className   = 'sc-carousel-result-badge';
    resultEl.style.color = 'var(--muted)';
    resultEl.style.fontSize = '0.75rem';
  }

  // Update dots
  renderCarouselDots();
}

function renderCarouselDots() {
  const dotsEl = document.getElementById('sc_carouselDots');
  if (!dotsEl) return;
  dotsEl.innerHTML = Array.from({length: _sc.holes}, (_, i) => {
    const myDone  = _sc.scores[i]    > 0;
    const oppDone = _sc.oppScores[i] > 0;
    const cls     = myDone && oppDone ? 'both' : myDone ? 'mine' : '';
    const current = i === _sc.currentHole ? 'current' : '';
    return `<div class="sc-carousel-dot ${cls} ${current}" onclick="carouselGoTo(${i})"></div>`;
  }).join('');
}

function carouselNav(dir) {
  const next = _sc.currentHole + dir;
  if (next < 0 || next >= _sc.holes) return;
  renderCarouselHole(next);
}

function carouselGoTo(i) {
  renderCarouselHole(i);
}

function carouselOpenNumpad(team) {
  if (!_sc.isMatch && team === 'opp') return; // no opponent in single mode
  openNumpad(_sc.currentHole, team);
}

function carouselAutoAdvance(holeIdx) {
  // Auto-advance to next hole after 600ms if not on last hole
  if (holeIdx < _sc.holes - 1) {
    setTimeout(() => {
      if (_sc.currentHole === holeIdx) {
        renderCarouselHole(holeIdx + 1);
      }
    }, 600);
  } else {
    // Last hole — show all holes summary
    setTimeout(() => showAllHoles(), 800);
  }
}

function showAllHoles() {
  const overlay = document.getElementById('allHolesOverlay');
  const content = document.getElementById('allHolesContent');
  const hcpDiff = _sc.oppHcp - _sc.teamHcp;
  const isMatch = _sc.isMatch;

  // Header row
  let html = isMatch ? `
    <div style="display:grid;grid-template-columns:26px 28px 24px 1fr 1fr 26px;gap:6px;padding:8px 12px;border-bottom:2px solid var(--border);">
      <div class="sc-col-label" style="text-align:center;">H</div>
      <div class="sc-col-label" style="text-align:center;">Par</div>
      <div class="sc-col-label" style="text-align:center;">SI</div>
      <div class="sc-col-label" style="text-align:center;">${esc(_sc.teamName)}</div>
      <div class="sc-col-label" style="text-align:center;">${esc(_sc.oppName)}</div>
      <div class="sc-col-label" style="text-align:right;">Res</div>
    </div>` : `
    <div style="display:grid;grid-template-columns:28px 32px 1fr 28px;gap:8px;padding:8px 12px;border-bottom:2px solid var(--border);">
      <div class="sc-col-label" style="text-align:center;">H</div>
      <div class="sc-col-label" style="text-align:center;">Par</div>
      <div class="sc-col-label" style="text-align:center;">Score</div>
      <div class="sc-col-label" style="text-align:right;">SI</div>
    </div>`;

  html += Array.from({length: _sc.holes}, (_, i) => {
    const p      = _sc.par[i] || 4;
    const myS    = _sc.scores[i]    || 0;
    const oppS   = _sc.oppScores[i] || 0;
    const myDone = myS  > 0;
    const si     = _sc.index && _sc.index[i] ? _sc.index[i] : null;
    const isCurrent = i === _sc.currentHole ? ' current-hole' : '';

    if (!isMatch) {
      // Single mode row — 4 columns: H, Par, Score, SI
      const mySC = myDone ? scoreColorClass(myS, p, true) : 'empty';
      const siColor = si ? (si <= 6 ? 'var(--red)' : si <= 12 ? '#c87a3a' : 'var(--green)') : 'var(--muted)';
      return `
        <div class="ah-hole-row${isCurrent}" style="grid-template-columns:28px 32px 1fr 28px;" onclick="closeAllHoles();carouselGoTo(${i})">
          <div class="ah-hole-num${myDone ? ' done' : ''}">${i+1}</div>
          <div class="ah-par">${p}</div>
          <div class="ah-score ${mySC}">${myDone ? myS : '–'}</div>
          <div style="text-align:right;font-size:0.72rem;font-weight:700;color:${siColor};">${si || '–'}</div>
        </div>`;
    }

    // Match mode row
    const oppDone = oppS > 0;
    const s = strokeOnHole(i, hcpDiff);
    const strokeDot = s > 0
      ? `<span class="ah-stroke-dot opp">+${s}</span>`
      : s < 0 ? `<span class="ah-stroke-dot my">+${Math.abs(s)}</span>` : '';
    const mySC  = myDone  ? scoreColorClass(myS,  p, true) : 'empty';
    const oppSC = oppDone ? scoreColorClass(oppS, p, true) : 'empty';
    let resultLabel = '', resultClass = '';
    if (myDone && oppDone) {
      const myNet  = myS  + (s < 0 ? s : 0);
      const oppNet = oppS + (s > 0 ? -s : 0);
      if      (myNet < oppNet) { resultLabel = 'W'; resultClass = 'win'; }
      else if (myNet > oppNet) { resultLabel = 'L'; resultClass = 'loss'; }
      else                     { resultLabel = 'H'; resultClass = 'half'; }
    }
    return `
      <div class="ah-hole-row${isCurrent}" style="grid-template-columns:26px 28px 24px 1fr 1fr 26px;gap:6px;" onclick="closeAllHoles();carouselGoTo(${i})">
        <div class="ah-hole-num${myDone || oppDone ? ' done' : ''}">${i+1}${strokeDot}</div>
        <div class="ah-par">${p}</div>
        <div style="text-align:center;font-size:0.72rem;font-weight:700;color:${si ? (si <= 6 ? 'var(--red)' : si <= 12 ? '#c87a3a' : 'var(--green)') : 'var(--muted)'};">${si || '–'}</div>
        <div class="ah-score ${mySC}">${myDone  ? myS  : '–'}</div>
        <div class="ah-score ${oppSC}">${oppDone ? oppS : '–'}</div>
        <div class="ah-result ${resultClass}">${resultLabel}</div>
      </div>`;
  }).join('');

  // Totals row
  const myTotal  = _sc.scores.reduce((a,b)    => a + (b > 0 ? b : 0), 0);
  const oppTotal = _sc.oppScores.reduce((a,b) => a + (b > 0 ? b : 0), 0);
  // Par of PLAYED holes only (not the whole course) so vs-par matches the top
  // banner. Using full-course par here made vs-par wrong until every hole was in.
  const myPar    = _sc.par.reduce((a,b,i) => a + (_sc.scores[i] > 0 ? b : 0), 0);
  if (myTotal > 0) {
    if (isMatch) {
      html += `
        <div style="display:grid;grid-template-columns:26px 28px 24px 1fr 1fr 26px;gap:6px;padding:12px 12px;border-top:2px solid var(--border);background:var(--surface2);">
          <div class="sc-col-label" style="text-align:center;">—</div>
          <div class="sc-col-label" style="text-align:center;">${myPar}</div>
          <div></div>
          <div style="text-align:center;font-size:1rem;font-weight:800;color:#1a2820;">${myTotal > 0 ? myTotal : '–'}</div>
          <div style="text-align:center;font-size:1rem;font-weight:800;color:#1a2820;">${oppTotal > 0 ? oppTotal : '–'}</div>
          <div></div>
        </div>`;
    } else {
      const vsPar = myTotal - myPar;
      const vsLabel = vsPar === 0 ? 'E' : vsPar > 0 ? `+${vsPar}` : `${vsPar}`;
      const vsColor = vsPar < 0 ? 'var(--green)' : vsPar > 0 ? 'var(--red)' : 'var(--muted)';
      html += `
        <div style="display:grid;grid-template-columns:28px 32px 1fr 28px;gap:8px;padding:12px 12px;border-top:2px solid var(--border);background:var(--surface2);">
          <div class="sc-col-label" style="text-align:center;">—</div>
          <div class="sc-col-label" style="text-align:center;">${myPar}</div>
          <div style="text-align:center;font-size:1rem;font-weight:800;color:#1a2820;">${myTotal}</div>
          <div style="text-align:right;font-size:1rem;font-weight:800;color:${vsColor};">${vsLabel}</div>
        </div>`;
    }
  }

  content.innerHTML = html;
  overlay.style.display = '';
  requestAnimationFrame(() => overlay.classList.add('open'));
}

// ── CSV IMPORT (admin only) ──────────────────────────────────

function openCsvImport() {
  const el = document.getElementById('csvImportOverlay');
  el.style.display = '';
  requestAnimationFrame(() => el.classList.add('open'));
  document.getElementById('csvPreviewArea').style.display = 'none';
  document.getElementById('csvImportStatus').textContent = '';
  document.getElementById('csvImportInput').value = '';
}

function closeCsvImport() {
  const el = document.getElementById('csvImportOverlay');
  el.classList.remove('open');
  setTimeout(() => { el.style.display = 'none'; }, 350);
}

function parseCsvRows(raw) {
  const lines = raw.trim().split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('name,'));
  const courseMap = {};

  lines.forEach(line => {
    // Parse CSV fields respecting quotes
    const cols = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    cols.push(cur.trim());

    if (cols.length < 6) return;
    const [name, holesRaw, teeLabel, ratingRaw, slopeRaw, parRaw, ...rest] = cols;
    const holes  = parseInt(holesRaw);
    const rating = parseFloat(ratingRaw);
    const slope  = parseInt(slopeRaw);
    const par    = parseInt(parRaw);
    if (!name || isNaN(holes) || isNaN(rating) || isNaN(slope) || isNaN(par)) return;

    // For a mixed 9/18 CSV, rest has up to 36 columns (18 par + 18 SI)
    // We take exactly `holes` par values then exactly `holes` SI values
    // using positional slice — do NOT filter out empties before slicing
    const parCols = rest.slice(0, holes).map(v => parseInt(v));
    const siCols  = rest.slice(18, 18 + holes).map(v => parseInt(v)); // SI always starts at column 18 in a mixed CSV

    // Fallback: if siCols are all NaN (pure 9-hole CSV without 18-col padding), read SI directly after par
    const siDirect = rest.slice(holes, holes * 2).map(v => parseInt(v));
    const siValues = siCols.every(isNaN) ? siDirect : siCols;

    const parPerHole   = parCols.every(n => !isNaN(n)) && parCols.length === holes ? parCols : Array(holes).fill(4);
    const indexPerHole = siValues.every(n => !isNaN(n)) && siValues.length === holes ? siValues : Array.from({length:holes},(_,i)=>i+1);

    const tee = { label: teeLabel || 'Medal', rating, slope, par };
    const key = name.toLowerCase();

    if (!courseMap[key]) {
      courseMap[key] = { name, holes, parPerHole, indexPerHole, tees: [] };
    } else {
      // Update parPerHole/indexPerHole if current entry still has defaults
      if (parPerHole.length === holes && courseMap[key].parPerHole.every(p => p === 4)) {
        courseMap[key].parPerHole = parPerHole;
      }
      if (indexPerHole.length === holes && courseMap[key].indexPerHole.every((v,i) => v === i+1)) {
        courseMap[key].indexPerHole = indexPerHole;
      }
    }
    if (!courseMap[key].tees.find(t => t.label.toLowerCase() === tee.label.toLowerCase())) {
      courseMap[key].tees.push(tee);
    }
  });

  return Object.values(courseMap).map(c => ({
    ...c,
    rating: c.tees[0]?.rating ?? 0,
    slope:  c.tees[0]?.slope  ?? 113,
    par:    c.tees[0]?.par    ?? (c.holes * 4)
  }));
}

let _csvParsedCourses = [];

function parseCsvPreview() {
  const raw = document.getElementById('csvImportInput').value;
  if (!raw.trim()) { showToast('Please paste CSV data first.', 'error'); return; }

  try {
    _csvParsedCourses = parseCsvRows(raw);
  } catch(e) {
    document.getElementById('csvImportStatus').textContent = 'Parse error: ' + e.message;
    return;
  }

  if (_csvParsedCourses.length === 0) {
    document.getElementById('csvImportStatus').textContent = 'No valid courses found. Check the CSV format.';
    return;
  }

  document.getElementById('csvPreviewCount').textContent = _csvParsedCourses.length;
  document.getElementById('csvPreviewList').innerHTML = _csvParsedCourses.map(c => `
    <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:8px;">
      <div style="font-weight:700;color:var(--white);font-size:0.85rem;">${esc(c.name)}</div>
      <div style="font-size:0.72rem;color:var(--muted);margin-top:2px;">${c.holes} holes · Par ${c.par}</div>
      <div style="font-size:0.72rem;color:var(--muted);margin-top:2px;">
        ${c.tees.map(t => `${esc(t.label)}: ${t.rating}/${t.slope}`).join(' · ')}
      </div>
    </div>`).join('');

  document.getElementById('csvPreviewArea').style.display = '';
  document.getElementById('csvImportStatus').textContent = '';
}

async function confirmCsvImport() {
  const uid = window._fbAuth?.currentUser?.uid;
  if (uid !== ADMIN_UID) { showToast('Admin only.', 'error'); return; }
  if (!_csvParsedCourses.length) return;

  const btn = document.getElementById('csvImportConfirmBtn');
  btn.disabled = true;
  btn.textContent = 'Importing…';
  const status = document.getElementById('csvImportStatus');
  let success = 0, updated = 0, failed = 0;

  for (const course of _csvParsedCourses) {
    try {
      // Check if course already exists in shared DB by name
      const existing = _sharedCourses.find(c => c.name.toLowerCase() === course.name.toLowerCase());
      if (existing) {
        await window._fbDb.collection('courses_shared').doc(existing._docId).update({
          ...course,
          lastEditedBy: uid,
          lastEditedAt: new Date().toISOString()
        });
        const idx = _sharedCourses.findIndex(c => c._docId === existing._docId);
        if (idx >= 0) _sharedCourses[idx] = { ..._sharedCourses[idx], ...course };
        updated++;
      } else {
        const courseId = 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6);
        const docRef = await window._fbDb.collection('courses_shared').add({
          ...course,
          courseId,
          addedBy:      uid,
          lastEditedBy: uid,
          lastEditedAt: new Date().toISOString()
        });
        _sharedCourses.push({ ...course, courseId, _docId: docRef.id, addedBy: uid });
        success++;
      }
      status.innerHTML = `<span style="color:var(--green)">Imported ${success} new, updated ${updated}…</span>`;
      await new Promise(r => setTimeout(r, 100)); // small delay to avoid rate limit
    } catch(e) {
      console.error('Import failed for', course.name, e);
      failed++;
    }
  }

  _sharedCourses.sort((a, b) => a.name.localeCompare(b.name));
  btn.disabled = false;
  btn.textContent = '✅ Import All to Shared DB';
  status.innerHTML = `<span style="color:var(--green)">Done! ${success} added, ${updated} updated${failed ? `, ${failed} failed` : ''}.</span>`;
  _csvParsedCourses = [];
  document.getElementById('csvPreviewArea').style.display = 'none';
  showToast(`Import complete: ${success + updated} courses`, 'success');
}

function closeAllHoles() {
  const overlay = document.getElementById('allHolesOverlay');
  overlay.classList.remove('open');
  setTimeout(() => { overlay.style.display = 'none'; }, 350);
}

// ─── NUMPAD ───
function openNumpad(holeIdx, team) {
  _numpad.holeIdx = holeIdx;
  _numpad.team    = team || 'my';
  const existing  = team === 'opp' ? _sc.oppScores[holeIdx] : _sc.scores[holeIdx];
  _numpad.buffer  = existing > 0 ? String(existing) : '';
  const teamLabel = team === 'opp' ? _sc.oppName : _sc.teamName;
  document.getElementById('numpad_label').textContent =
    `${teamLabel} — Hole ${holeIdx + 1} · Par ${_sc.par[holeIdx]}`;
  updateNumpadDisplay();
  document.getElementById('numpadOverlay').classList.add('open');
  document.querySelectorAll('.sc-score-tap').forEach(el => el.classList.remove('active-input'));
  const tapId = _sc.isMatch ? `sc_tap_${team}_${holeIdx}` : `sc_tap_${holeIdx}`;
  const tap = document.getElementById(tapId);
  if (tap) tap.classList.add('active-input');
}

function numpadCancel() {
  document.getElementById('numpadOverlay').classList.remove('open');
  document.querySelectorAll('.sc-score-tap').forEach(el => el.classList.remove('active-input'));
  _numpad.holeIdx = -1;
  _numpad.buffer  = '';
}

function numpadKey(digit) {
  if (_numpad.buffer.length >= 2) _numpad.buffer = _numpad.buffer.slice(1);
  _numpad.buffer += String(digit);
  updateNumpadDisplay();
}

function numpadDelete() {
  _numpad.buffer = _numpad.buffer.slice(0, -1);
  updateNumpadDisplay();
}

function updateNumpadDisplay() {
  const el = document.getElementById('numpad_display');
  if (!el) return;
  const v = _numpad.buffer;
  el.textContent = v === '' ? '–' : v;
  el.className   = 'numpad-display' + (v ? ' has-val' : '');
}

function numpadConfirm() {
  const v = parseInt(_numpad.buffer);
  if (!isNaN(v) && v >= 1 && v <= 20) {
    const holeIdx = _numpad.holeIdx;
    if (_numpad.team === 'opp') { _sc.oppScores[holeIdx] = v; }
    else                        { _sc.scores[holeIdx]    = v; }

    // Update display
    if (_sc.isCarousel) {
      renderCarouselHole(holeIdx);
      renderCarouselDots();
    } else {
      updateHoleDisplay(holeIdx);
    }
    updateScorecardTotals();

    // Write to Firestore if live match
    if (_sc.isLive && _sc.matchId && _numpad.team !== 'opp') {
      const role     = _sc.myRole;
      const scoreKey = role === 'A' ? 'teamA.scores' : 'teamB.scores';
      const hcpKey   = role === 'A' ? 'teamA.holesComplete' : 'teamB.holesComplete';
      const scores   = _sc.scores.slice();
      const complete = scores.filter(s => s > 0).length;
      window._fbDb.collection('matches').doc(_sc.matchId).update({
        [scoreKey]: scores,
        [hcpKey]:   complete
      }).catch(err => {
        console.error('Live score write failed:', err);
        showToast('Score not synced - check connection.', 'error');
      });
    }

    // Auto-advance carousel:
    // Single mode — advance after any score entry
    // Match mode — advance only when both scores entered
    const singleAdvance = _sc.isCarousel && !_sc.isMatch && _sc.scores[holeIdx] > 0;
    const matchAdvance  = _sc.isCarousel && _sc.isMatch  && _sc.scores[holeIdx] > 0 && _sc.oppScores[holeIdx] > 0;
    if (singleAdvance || matchAdvance) {
      numpadCancel();
      carouselAutoAdvance(holeIdx);
      return;
    }
  }
  numpadCancel();
}

function updateHoleDisplay(holeIdx) {
  if (_sc.isMatch) { updateMatchHoleDisplay(holeIdx); }
  else             { updateSingleHoleDisplay(holeIdx); }
}

function updateSingleHoleDisplay(holeIdx) {
  const score    = _sc.scores[holeIdx];
  const par      = _sc.par[holeIdx] || 4;
  const complete = score > 0;
  const diff     = complete ? score - par : null;
  const scoreEl  = document.getElementById(`sc_score_${holeIdx}`);
  if (scoreEl) {
    scoreEl.textContent = complete ? score : '–';
    scoreEl.className   = 'sc-score-display' + (scoreColorClass(score, par, complete) ? ' ' + scoreColorClass(score, par, complete) : '');
  }
  const tapEl = document.getElementById(`sc_tap_${holeIdx}`);
  if (tapEl) {
    const h = tapEl.querySelector('.sc-score-tap-hint');
    if (complete && h) h.remove();
    else if (!complete && !h) { const nh = document.createElement('div'); nh.className = 'sc-score-tap-hint'; nh.textContent = 'score'; tapEl.appendChild(nh); }
  }
  const vsEl = document.getElementById(`sc_vs_${holeIdx}`);
  if (vsEl) {
    vsEl.textContent = diff === null ? '' : diff === 0 ? 'E' : diff > 0 ? `+${diff}` : `${diff}`;
    vsEl.className   = 'sc-vs-par' + (diff === null ? '' : diff < 0 ? ' under' : diff > 0 ? ' over' : '');
  }
  const row = document.getElementById(`sc_row_${holeIdx}`);
  if (row) row.classList.toggle('complete', complete);
}

function updateMatchHoleDisplay(holeIdx) {
  const par      = _sc.par[holeIdx] || 4;
  const myScore  = _sc.scores[holeIdx];
  const oppScore = _sc.oppScores[holeIdx];
  const myDone   = myScore > 0;
  const oppDone  = oppScore > 0;

  const myEl = document.getElementById(`sc_score_my_${holeIdx}`);
  if (myEl) {
    myEl.textContent = myDone ? myScore : '–';
    myEl.className   = 'sc-score-display' + (myDone && scoreColorClass(myScore, par, true) ? ' ' + scoreColorClass(myScore, par, true) : '');
  }
  const myTap = document.getElementById(`sc_tap_my_${holeIdx}`);
  if (myTap) {
    const h = myTap.querySelector('.sc-score-tap-hint');
    if (myDone && h) h.remove();
    else if (!myDone && !h) { const nh = document.createElement('div'); nh.className = 'sc-score-tap-hint'; nh.textContent = 'score'; myTap.appendChild(nh); }
  }

  const oppEl = document.getElementById(`sc_score_opp_${holeIdx}`);
  if (oppEl) {
    oppEl.textContent = oppDone ? oppScore : '–';
    oppEl.className   = 'sc-score-display' + (oppDone && scoreColorClass(oppScore, par, true) ? ' ' + scoreColorClass(oppScore, par, true) : '');
  }
  const oppTap = document.getElementById(`sc_tap_opp_${holeIdx}`);
  if (oppTap) {
    const h = oppTap.querySelector('.sc-score-tap-hint');
    if (oppDone && h) h.remove();
    else if (!oppDone && !h) { const nh = document.createElement('div'); nh.className = 'sc-score-tap-hint'; nh.textContent = 'score'; oppTap.appendChild(nh); }
  }

  const resultEl = document.getElementById(`sc_result_${holeIdx}`);
  if (resultEl) {
    if (myDone && oppDone) {
      const hcpDiff = _sc.oppHcp - _sc.teamHcp;
      const s = strokeOnHole(holeIdx, hcpDiff);
      const myNet  = myScore  + (s < 0 ? s : 0);
      const oppNet = oppScore + (s > 0 ? -s : 0);
      if      (myNet < oppNet) { resultEl.textContent = 'W'; resultEl.className = 'sc-hole-result win'; }
      else if (myNet > oppNet) { resultEl.textContent = 'L'; resultEl.className = 'sc-hole-result loss'; }
      else                     { resultEl.textContent = 'H'; resultEl.className = 'sc-hole-result half'; }
    } else { resultEl.textContent = ''; resultEl.className = 'sc-hole-result'; }
  }

  const row = document.getElementById(`sc_row_${holeIdx}`);
  if (row) row.classList.toggle('complete', myDone || oppDone);
}

function updateScorecardTotals() {
  if (_sc.isMatch) { updateMatchBanner(); }
  else             { updateSingleBanner(); }
}

function updateSingleBanner() {
  const played   = _sc.scores.filter(s => s > 0);
  const gross    = played.reduce((a,b) => a+b, 0);
  const parSoFar = _sc.par.filter((_,i) => _sc.scores[i] > 0).reduce((a,b) => a+b, 0);
  const diff     = played.length > 0 ? gross - parSoFar : null;
  document.getElementById('sc_gross').textContent    = played.length > 0 ? gross : '–';
  document.getElementById('sc_parTotal').textContent = played.length > 0 ? parSoFar : '–';
  document.getElementById('sc_holesProgress').textContent = `${played.length} / ${_sc.holes}`;
  const vsParEl = document.getElementById('sc_vsPar');
  if (diff === null) { vsParEl.textContent = '–'; vsParEl.className = 'sc-score-val'; }
  else { vsParEl.textContent = diff === 0 ? 'E' : diff > 0 ? `+${diff}` : `${diff}`; vsParEl.className = 'sc-score-val ' + (diff < 0 ? 'under' : diff > 0 ? 'over' : 'even'); }
}

function updateMatchBanner() {
  let myGross = 0, oppGross = 0, myParPlayed = 0, oppParPlayed = 0, holesPlayed = 0;
  let myWins = 0, oppWins = 0;
  const hcpDiff = _sc.oppHcp - _sc.teamHcp;

  for (let i = 0; i < _sc.holes; i++) {
    const myS  = _sc.scores[i];
    const oppS = _sc.oppScores[i];
    if (myS  > 0) { myGross  += myS;  myParPlayed  += _sc.par[i]; }
    if (oppS > 0) { oppGross += oppS; oppParPlayed += _sc.par[i]; }
    if (myS > 0 && oppS > 0) {
      holesPlayed++;
      const s = strokeOnHole(i, hcpDiff);
      const myNet  = myS  + (s < 0 ? s : 0);
      const oppNet = oppS + (s > 0 ? -s : 0);
      if      (myNet < oppNet) myWins++;
      else if (myNet > oppNet) oppWins++;
    }
  }

  const myVsPar  = myGross  > 0 ? myGross  - myParPlayed  : null;
  const oppVsPar = oppGross > 0 ? oppGross - oppParPlayed : null;

  const myEl  = document.getElementById('sc_myVsPar');
  const oppEl = document.getElementById('sc_oppVsPar');
  myEl.textContent  = myVsPar  === null ? '–' : myVsPar  === 0 ? 'E' : myVsPar  > 0 ? `+${myVsPar}`  : `${myVsPar}`;
  oppEl.textContent = oppVsPar === null ? '–' : oppVsPar === 0 ? 'E' : oppVsPar > 0 ? `+${oppVsPar}` : `${oppVsPar}`;
  myEl.className    = 'sc-match-score' + (myVsPar  === null ? '' : myVsPar  < 0 ? ' under' : myVsPar  > 0 ? ' over' : ' even');
  oppEl.className   = 'sc-match-score' + (oppVsPar === null ? '' : oppVsPar < 0 ? ' under' : oppVsPar > 0 ? ' over' : ' even');

  // Total strokes
  const myTotalEl  = document.getElementById('sc_myTotal');
  const oppTotalEl = document.getElementById('sc_oppTotal');
  if (myTotalEl)  myTotalEl.textContent  = myGross  > 0 ? `${myGross} strokes`  : '';
  if (oppTotalEl) oppTotalEl.textContent = oppGross > 0 ? `${oppGross} strokes` : '';

  const statusEl = document.getElementById('sc_matchStatus');
  const labelEl  = document.getElementById('sc_statusLabel');
  const diff     = myWins - oppWins;
  if (holesPlayed === 0) {
    statusEl.textContent = `0 / ${_sc.holes}`; statusEl.className = 'sc-match-status-val'; labelEl.textContent = 'Holes';
  } else if (diff === 0) {
    statusEl.textContent = 'All Square'; statusEl.className = 'sc-match-status-val square'; labelEl.textContent = `${holesPlayed} played`;
  } else {
    const leader = diff > 0 ? _sc.teamName : _sc.oppName;
    statusEl.textContent = `${Math.abs(diff)} UP`;
    statusEl.className   = 'sc-match-status-val ' + (diff > 0 ? 'leading' : 'trailing');
    labelEl.textContent  = leader.length > 10 ? leader.slice(0,10) + '…' : leader;
  }
}

async function saveRound() {
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid) { showToast('Please sign in to save the round.', 'error'); return; }
  const played = _sc.scores.filter(s => s > 0).length;
  if (played === 0) { showToast('Enter at least one hole score before saving.', 'error'); return; }

  const gross     = _sc.scores.reduce((a,b) => a+b, 0);
  const oppGross  = _sc.oppScores.reduce((a,b) => a+b, 0);
  const totalPar  = _sc.par.reduce((a,b) => a+b, 0);
  const parPlayed = _sc.par.filter((_,i) => _sc.scores[i] > 0).reduce((a,b) => a+b, 0);
  const vsPar     = gross - parPlayed;

  // Stable id per match/session so repeated saves (Save Round, then End Round) upsert
  // the SAME document instead of creating duplicates.
  if (!_sc.savedRoundId) _sc.savedRoundId = _sc.matchId ? ('m_' + _sc.matchId) : ('r_' + Date.now());
  const round = {
    id: _sc.savedRoundId,
    courseName: _sc.courseName,
    teamName:   _sc.teamName,  teamHcp:   _sc.teamHcp,
    oppName:    _sc.oppName,   oppHcp:    _sc.oppHcp,
    isMatch:    _sc.isMatch,
    holes: _sc.holes, holesPlayed: played,
    par: _sc.par.slice(), scores: _sc.scores.slice(), oppScores: _sc.oppScores.slice(),
    index: _sc.index && _sc.index.length ? _sc.index.slice() : null,
    si:    _sc.index && _sc.index.length ? _sc.index.slice() : null,
    totalPar, gross, oppGross, vsPar,
    playedAt: new Date().toISOString(),
  };
  // If this save came from END ROUND (endMatch sets _sc._ended first), record that the
  // match is finished from this user's side — even if the Firestore status update is
  // later blocked by rules, the rejoin detector will treat it as done.
  if (_sc && _sc._ended) { round.matchComplete = true; round.endedAt = Date.now(); }

  // For matches, also store nested team objects + the computed result so the history
  // card (which reads teamA/teamB.hcp and result.teamAWon/teamBWon) is correct.
  if (_sc.isMatch) {
    const _diff = Math.abs((_sc.teamHcp||0) - (_sc.oppHcp||0));
    const _teamRecv = (_sc.teamHcp||0) >= (_sc.oppHcp||0);   // higher hcp receives strokes
    const _siArr = (_sc.siRank && _sc.siRank.length) ? _sc.siRank : (_sc.index||[]);
    let _aWon=0,_bWon=0,_drawn=0; const _holeResults=[];
    for (let i=0;i<_sc.holes;i++){
      const a=_sc.scores[i], b=_sc.oppScores[i];
      if (a==null||a===0||b==null||b===0){ _holeResults.push(null); continue; }
      const str = (typeof strokeOnHoleWithIndex==='function') ? strokeOnHoleWithIndex(i,_diff,_siArr,_sc.holes) : 0;
      const na = a-(_teamRecv?str:0), nb = b-(_teamRecv?0:str);
      const res = na<nb?1:(na>nb?-1:0);
      if(res===1)_aWon++; else if(res===-1)_bWon++; else _drawn++;
      _holeResults.push(res);
    }
    round.teamA  = { name:_sc.teamName, hcp:_sc.teamHcp, scores:_sc.scores.slice() };
    round.teamB  = { name:_sc.oppName,  hcp:_sc.oppHcp,  scores:_sc.oppScores.slice() };
    round.result = { teamAWon:_aWon, teamBWon:_bWon, drawn:_drawn, winner:(_aWon>_bWon?_sc.teamName:(_bWon>_aWon?_sc.oppName:'AS')) };
    round.holeResults = _holeResults;
  }
  setSaveBtnsState(true);
  try {
    await window._fbDb.collection('users').doc(uid).collection('rounds').doc(round.id).set(round);
    const _exist = _savedRounds.findIndex(r => r && r.id === round.id);
    if (_exist >= 0) _savedRounds[_exist] = round; else _savedRounds.unshift(round);
    renderMyData();
    ['sc_saveBtnTop','sc_saveBtnBottom'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.textContent = '✓ Saved!';
    });
    showToast(`Round saved — ${vsPar >= 0 ? '+' : ''}${vsPar} vs par`, 'success');
    // Round is now persisted: mark saved and clear any paused-round banner so we
    // don't offer to "resume" a round that's already been saved.
    _scRoundSaved = true;
    _pausedRound = null;
    if (typeof hidePausedRoundBanner === 'function') hidePausedRoundBanner();
    if (typeof clearPausedRoundFromCloud === 'function') clearPausedRoundFromCloud();
    setTimeout(() => setSaveBtnsState(false), 3000);
  } catch(e) {
    setSaveBtnsState(false);
    showToast('Could not save: ' + e.message, 'error');
  }
}

// Device/browser back button: close an open overlay, else go back one screen.
window.addEventListener('popstate', (e) => {
  // 0) Release 3c (H11): Back closes the sign-in sheet (it has its own history step).
  const _am = document.getElementById('authModal');
  if (_am && !_am.classList.contains('hidden')) { closeAuthModal(true); return; }
  // Never send a signed-in user back to the login screen via Back.
  if (e.state && e.state.screen === 'login' && window._fbAuth && window._fbAuth.currentUser) return;
  // 1) If any overlay is open, back closes it and keeps the current screen.
  var overlays = [
    ['roundViewOverlay',   function(){ if(typeof closeRoundView==='function') closeRoundView(); }],
    ['scorecardOverlay',   function(){ if(typeof closeScorecard==='function') closeScorecard(); }],
    ['resultsOverlay',     function(){ if(typeof closeResults==='function') closeResults(); }],
    ['menuOverlay',        function(){ if(typeof closeMenu==='function') closeMenu(); }],
    ['legalOverlay',       function(){ if(typeof closeLegal==='function') closeLegal(); }],
    ['buddySearchOverlay', function(){ if(typeof closeBuddySearch==='function') closeBuddySearch(); }],
    ['joinMatchOverlay',   function(){ if(typeof closeJoinMatch==='function') closeJoinMatch(); }],
  ];
  for (var i = 0; i < overlays.length; i++) {
    var el = document.getElementById(overlays[i][0]);
    var open = el && (el.classList.contains('open') ||
                      (el.parentElement && el.parentElement.classList.contains('open')) ||
                      el.style.display === 'flex' || el.style.display === 'block');
    if (open) {
      try { overlays[i][1](); } catch(_){}
      try { history.pushState({ screen: _activeScreenId() }, ''); } catch(_){}  // stay on current screen
      return;
    }
  }
  // 2) Otherwise navigate back to whatever screen the browser popped to.
  var target = e.state && e.state.screen;
  if (target) {
    _navFromPop = true;
    if (_screenStack.length > 1) _screenStack.pop();
    showScreen(target, { replace: true });
    _navFromPop = false;
  }
  // 3) No prior state → app root → allow the default (exit).
});

// ── LIVE MATCH ─────────────────────────────────────────────

function generateMatchCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function createMatch(matchData) {
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid) { showToast('Please sign in to start a match.', 'error'); return null; }

  const code = generateMatchCode();

  const doc = {
    matchId: code,
    status: 'waiting',
    createdAt: Date.now(),
    startedAt: null,
    completedAt: null,
    holes: matchData.holes,
    format: matchData.format || '35_15',
    tees:   (matchData.tees && matchData.tees.length) ? matchData.tees : (_msCourseTees && _msCourseTees.length ? _msCourseTees : []),
    course: matchData.course,
    par:   matchData.par,
    index: matchData.index || Array.from({length: matchData.holes}, (_, i) => i + 1),
    teamA: {
      uid: uid,
      teamName: matchData.teamA.teamName,
      teamHcp: matchData.teamA.teamHcp,
      teamType: matchData.teamA.teamType || (matchData.teamA.players?.length >= 4 ? '4P' : matchData.teamA.players?.length === 3 ? '3P' : '2P'),
      players: matchData.teamA.players,
      scores: Array(matchData.holes).fill(0),
      holesComplete: 0
    },
    teamB: {
      uid: null,
      teamName: matchData.teamB.teamName,
      teamHcp: matchData.teamB.teamHcp,
      teamType: matchData.teamB.teamType || (matchData.teamB.players?.length >= 4 ? '4P' : matchData.teamB.players?.length === 3 ? '3P' : '2P'),
      players: matchData.teamB.players,
      scores: Array(matchData.holes).fill(0),
      holesComplete: 0
    },
    result: {
      winner: null,
      margin: null,
      status: null
    }
  };

  try {
    await window._fbDb.collection('matches').doc(code).set(doc);
    showToast(`Match created — code: ${code}`, 'success');
    return code;
  } catch (err) {
    console.error('createMatch error:', err);
    showToast('Failed to create match. Please try again.', 'error');
    return null;
  }
}

async function joinMatch(code) {
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid) { showToast('Please sign in to join a match.', 'error'); return null; }

  const ref = window._fbDb.collection('matches').doc(code.toUpperCase());

  try {
    const snap = await ref.get();

    if (!snap.exists) {
      showToast('Match code not found. Please check and try again.', 'error');
      return null;
    }

    const data = snap.data();

    if (data.status !== 'waiting') {
      showToast('This match has already started or is complete.', 'error');
      return null;
    }

    if (data.teamA.uid === uid) {
      showToast('You cannot join your own match as the opponent.', 'error');
      return null;
    }

    if (data.teamB.uid !== null) {
      showToast('This match already has two teams.', 'error');
      return null;
    }

    await ref.update({
      'teamB.uid': uid,
      status: 'active',
      startedAt: Date.now()
    });

    showToast('Joined match successfully!', 'success');
    return data;

  } catch (err) {
    console.error('joinMatch error:', err);
    showToast('Failed to join match. Please try again.', 'error');
    return null;
  }
}

function listenToMatch(matchId, callback) {
  if (window._matchUnsubscribe) {
    window._matchUnsubscribe();
    window._matchUnsubscribe = null;
  }

  const ref = window._fbDb.collection('matches').doc(matchId);

  window._matchUnsubscribe = ref.onSnapshot(snap => {
    if (!snap.exists) {
      console.warn('Match document no longer exists.');
      return;
    }
    callback(snap.data());
  }, err => {
    console.error('listenToMatch error:', err);
    showToast('Lost connection to match. Please rejoin.', 'error');
  });
}

async function abandonMatch(matchId) {
  const uid = window._fbAuth?.currentUser?.uid;
  if (!uid || !matchId) return;

  if (window._matchUnsubscribe) {
    window._matchUnsubscribe();
    window._matchUnsubscribe = null;
  }

  try {
    await window._fbDb.collection('matches').doc(matchId).delete();
  } catch (err) {
    console.error('abandonMatch error:', err);
  }
}




// ─── SERVICE WORKER ───
// Release 1 (Oct 2026): no more surprise reloads.
// clients.claim() in sw.js fires 'controllerchange' even on a FIRST visit (page had no
// worker yet). The old handler reloaded the page then, which showed login twice and could
// wipe a Google sign-in in progress. Now:
//  • first install (page had no controller at load) → never reload; nothing to refresh.
//  • real update → reload only at a safe moment: Login or Home visible, no sign-in sheet,
//    no auth spinner, no open overlay. If not safe now, retry when the app is put in the
//    background; otherwise the next normal launch picks up the new version anyway.
let _swHadController = false;
let _swReloadPending = false;
let _swReloaded = false;
let _authInProgress = false;   // set by doGoogleSignIn() while the Google popup is open
function _swSafeToReload() {
  if (_authInProgress) return false;
  const modal = document.getElementById('authModal');
  if (modal && !modal.classList.contains('hidden')) return false;
  const alo = document.getElementById('authLoadingOverlay');
  if (alo && alo.style.display !== 'none') return false;
  const scr = (typeof _activeScreenId === 'function') ? _activeScreenId() : '';
  if (scr !== 'home' && scr !== 'login') return false;
  const busy = document.querySelector('.menu-overlay.open, .buddy-overlay.open, .profile-overlay.open, .legal-overlay.open, .results-overlay.open, .scorecard-overlay.open, .round-view-overlay.open');
  if (busy) return false;
  const shown = ['matchSetupOverlay','matchCodeOverlay','joinMatchOverlay','matchGateOverlay','rejoinModal','endMatchModal','csvImportOverlay','allHolesOverlay']
    .some(function(id){ const el = document.getElementById(id); return el && el.style.display && el.style.display !== 'none'; });
  return !shown;
}
function _swTryReload() {
  if (!_swReloadPending || _swReloaded) return;
  if (!_swSafeToReload()) return;
  _swReloaded = true;
  window.location.reload();
}
if ('serviceWorker' in navigator) {
  _swHadController = !!navigator.serviceWorker.controller;   // read BEFORE any claim() can change it
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        // Check for an updated SW whenever the app loads.
        reg.update().catch(() => {});
        // When a new SW is found and finishes installing, activate it immediately.
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              nw.postMessage('SKIP_WAITING');
            }
          });
        });
      })
      .catch(err => console.warn('SW failed:', err));
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!_swHadController) { _swHadController = true; return; }   // first install: no reload
      _swReloadPending = true;
      _swTryReload();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') _swTryReload();
    });
  });
}

document.addEventListener('DOMContentLoaded', applyLang);
// BUILD STAMP — check this in the browser console to confirm which version is live.
// If you deploy and don't see this exact string, you're being served a cached/old build.
console.log('%cParmate build: 2026-10-19-r3c-v22', 'color:#1a6b3c;font-weight:bold;font-size:14px;');
