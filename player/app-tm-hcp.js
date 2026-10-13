// Parmate player app — team match: team handicap screen (2v2 WHS)
// Loaded by index.html with a plain <script src> at its original spot (no defer/async/module).


// ── Screen 27: Team Handicap (2v2 WHS result) ──
// Reuses getCH + trTeeByKey + FORMATS. Computes both sides from _trFlow/_tmFlow.
function tmCalcSide(players) {
  const f = (typeof _trFlow !== 'undefined') ? _trFlow : null;
  if (!f) return null;
  const list = (players || []).filter(p => p && p.hcp != null && !isNaN(parseFloat(p.hcp)));
  if (!list.length) return null;
  list.forEach(p => {
    const tee = (typeof trTeeByKey === 'function') ? trTeeByKey(p.teeKey || 'medal', p.gender || 'M') : null;
    const rating = tee ? Number(tee.rating) : 0;
    const slope  = tee ? Number(tee.slope)  : 113;
    const par    = tee ? Number(tee.par)    : ((f.course && f.course.par) || 72);
    p.courseHcp = getCH(whsPlayIndex(p.hcp, f.course), slope, rating, par);
    p.chRounded = Math.round(p.courseHcp);
    p.teeLabel  = tee ? tee.label : '—';
  });
  const sorted = list.slice().sort((a,b) => a.courseHcp - b.courseHcp);
  const pcts = (f.format === 'custom' && Array.isArray(f.customPcts) && f.customPcts.length)
    ? f.customPcts
    : ((typeof FORMATS !== 'undefined' && FORMATS[f.format]) ? FORMATS[f.format] : [0.35, 0.15]);
  let total = 0;
  sorted.forEach((p,i) => { p.pct = pcts[Math.min(i, pcts.length-1)] || 0; total += p.courseHcp * p.pct; });
  return { players: sorted, teamHcp: Math.round(total) };
}

function tmTeeDotClass(label){
  const l=(label||'').toLowerCase();
  if (l.includes('champ'))  return 'champion';
  if (l.includes('senior')) return 'senior';
  if (l.includes('forward'))return 'forward';
  return 'medal';
}

function tmSideBlock(rank, teamName, res) {
  if (!res) return '<div class="thcp-card"><div class="thcp-left"><span class="thcp-rank">'+rank+
      '</span><span class="thcp-name">'+(teamName||'—')+'</span></div>'+
      '<div class="thcp-right"><div class="thcp-value">—</div><div class="thcp-label">THCP</div></div></div>';
  const rows = res.players.map(p =>
    '<div class="breakdown-row">'+
      '<div class="b-left"><span class="p-label">player</span><span class="tee-dot '+tmTeeDotClass(p.teeLabel)+'"></span><span class="p-name">'+(p.name||'?')+'</span></div>'+
      '<div class="b-right"><span class="p-hcp">CH '+p.chRounded+'</span><span class="p-pct">'+Math.round(p.pct*100)+'%</span></div>'+
    '</div>').join('');
  return '<div class="thcp-card"><div class="thcp-left"><span class="thcp-rank">'+rank+
      '</span><span class="thcp-name">'+(teamName||'—')+'</span></div>'+
      '<div class="thcp-right"><div class="thcp-value">'+res.teamHcp+'</div><div class="thcp-label">THCP</div></div></div>'+
    '<div class="breakdown-card">'+rows+
      '<div class="strokes-info">+<strong>'+res.teamHcp+'</strong> strokes of scratch</div></div>';
}

function tmRenderHcp(ROOT) {
  if (typeof _trFlow === 'undefined' || !_trFlow) return;
  const c = _trFlow.course || {};
  const myName  = (_trFlow.team && _trFlow.team.name) || 'My Team';
  const oppData = (typeof _tmFlow !== 'undefined' && _tmFlow.opponent) ? _tmFlow.opponent : null;
  const oppName = oppData ? (oppData.teamName || 'Opponent') : 'Opponent';

  const mine = tmCalcSide(_trFlow.team ? _trFlow.team.players : []);
  const opp  = tmCalcSide(oppData ? oppData.players : []);

  // Course header
  const hdr = ROOT.querySelector('#tmhcp_courseHdr');
  if (hdr) {
    const medal = (typeof trTeeByKey === 'function') ? (trTeeByKey('medal') || {}) : {};
    const fmt = (typeof trFormatLabel === 'function') ? trFormatLabel() : '35%/15%';
    hdr.innerHTML =
      '<div class="course-name">'+(c.name || '—')+'</div>'+
      '<div class="course-meta"><span>'+(c.holes||18)+' holes</span> | <span>Rating '+
        (medal.rating!=null?medal.rating:(c.rating!=null?c.rating:'—'))+'</span> | <span>Slope '+
        (medal.slope!=null?medal.slope:(c.slope!=null?c.slope:'—'))+'</span> | <span>Par '+
        (c.par!=null?c.par:'—')+'</span></div>'+
      '<div class="course-meta"><span>'+(c._playedLoopName||c.name||'')+'</span> | <span>'+fmt+' allowance</span></div>';
  }
  const t1 = ROOT.querySelector('#tmhcp_team1'); if (t1) t1.innerHTML = tmSideBlock(1, myName,  mine);
  const t2 = ROOT.querySelector('#tmhcp_team2'); if (t2) t2.innerHTML = tmSideBlock(2, oppName, opp);
}

function tmHcpNext() { showScreen('tmcode'); }

// Format screen BACK is shared: opponent screen in match mode, tee screen in round mode
function trFormatBack() {
  if (typeof _gameMode !== 'undefined' && _gameMode === 'match') {
    if (typeof _trFlow!=='undefined' && _trFlow) _trFlow._teeTarget = 'opp';
    showScreen('trtee');
  } else showScreen('trtee');
}
function trTeeBack() {
  if (typeof _trFlow!=='undefined' && _trFlow && _trFlow._teeTarget === 'opp') showScreen('tmopp');
  else showScreen('trteam');
}
function tmoppBack() {
  if (typeof _trFlow!=='undefined' && _trFlow) _trFlow._teeTarget = 'team';
  showScreen('trtee');
}

