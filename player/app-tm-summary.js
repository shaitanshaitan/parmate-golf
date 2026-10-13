// Parmate player app — team match: game summary
// Loaded by index.html with a plain <script src> at its original spot (no defer/async/module).


// ── Screen 26: Game Summary (final match result) ──
function tmSummaryResult(){
  const n=tmHoleCount(), sm=(typeof tmStrokeMap==='function')?tmStrokeMap():{u:[],o:[]};
  let uw=0, ow=0, dr=0, played=0;
  for(let i=0;i<n;i++){
    const a=(_tmScores.u||[])[i], b=(_tmScores.o||[])[i];
    if(a==null||b==null) continue; played++;
    const na=a-(sm.u[i]||0), nb=b-(sm.o[i]||0);
    if(na<nb) uw++; else if(na>nb) ow++; else dr++;
  }
  return { uw, ow, dr, played, n };
}
function tmRenderSummary(ROOT){
  const nm=tmTeamNames(); const c=_trFlow.course||{};
  const r=tmSummaryResult();
  const fmt=(typeof trFormatLabel==='function')?trFormatLabel():'';
  // team rows: show only the two teams in the match
  const setRow=(id,label,value,cls)=>{ const row=ROOT.querySelector('#'+id); if(!row) return;
    row.style.display='flex';
    const l=row.querySelector('.row-label'), v=row.querySelector('.row-value');
    if(l) l.textContent=label; if(v) v.textContent=value;
    row.classList.toggle('team-dim', cls==='dim'); row.classList.toggle('team-active', cls!=='dim'); };
  const uRes = r.uw+' won · '+r.ow+' lost · '+r.dr+' AS';
  const oRes = r.ow+' won · '+r.uw+' lost · '+r.dr+' AS';
  const uWin = r.uw>r.ow, oWin = r.ow>r.uw;
  setRow('tmsm_teamRow1', (uWin?'🏆 ':'')+nm.u, uRes, uWin?'active':(oWin?'dim':'active'));
  setRow('tmsm_teamRow2', (oWin?'🏆 ':'')+nm.o, oRes, oWin?'active':(uWin?'dim':'active'));
  const r3=ROOT.querySelector('#tmsm_teamRow3'), r4=ROOT.querySelector('#tmsm_teamRow4');
  if(r3) r3.style.display='none'; if(r4) r4.style.display='none';
  // course detail rows — fill by matching the row label text
  const map={ 'course name':c.name||'–', 'loop name':c._playedLoopName||c.name||'–',
              'par':(c.par!=null?c.par:'–'), 'rating':(c.rating!=null?c.rating:'–'),
              'slope':(c.slope!=null?c.slope:'–'), 'scramble format':fmt||'–' };
  ROOT.querySelectorAll('.summary-row').forEach(row=>{
    const l=row.querySelector('.row-label'), v=row.querySelector('.row-value');
    if(!l||!v) return; const key=(l.textContent||'').trim().toLowerCase();
    if(map.hasOwnProperty(key)) v.textContent=map[key];
  });
}
function tmSummaryBack(){ const holes=(_trFlow&&_trFlow.holes)||9; showScreen(holes>=18?'tmfull':'tmscore'); }
async function tmSummaryFinish(){
  // Persist the match (best-effort) then return Home
  const c=_trFlow.course||{}; const nm=tmTeamNames(); const r=tmSummaryResult();
  const uid = window._fbAuth && window._fbAuth.currentUser ? window._fbAuth.currentUser.uid : null;
  const mine=(typeof tmCalcSide==='function')?tmCalcSide(_trFlow.team?_trFlow.team.players:[]):null;
  const opp =(typeof tmCalcSide==='function')?tmCalcSide(_tmFlow.opponent?_tmFlow.opponent.players:[]):null;
  // per-hole match results (engine-consistent), captured before state reset
  const _smF=(typeof tmStrokeMap==='function')?tmStrokeMap():{u:[],o:[]};
  const _nF=tmHoleCount(); const _holeResults=[];
  for(let i=0;i<_nF;i++){ const a=_tmScores.u[i], b=_tmScores.o[i]; if(a==null||b==null){_holeResults.push(null);continue;} const na=a-((_smF.u&&_smF.u[i])||0), nb=b-((_smF.o&&_smF.o[i])||0); _holeResults.push(na<nb?1:(na>nb?-1:0)); }
  const match={ id:Date.now().toString(), isMatch:true,
    courseName:c.name||'', loopName:c._playedLoopName||c.name||'',
    holes:tmHoleCount(), format:(typeof trFormatLabel==='function')?trFormatLabel():'',
    rating:c.rating||null, slope:c.slope||null, par:(c.parPerHole||[]).slice(), si:(c.indexPerHole||[]).slice(), holeResults:_holeResults,
    code:(_tmFlow.matchData&&_tmFlow.matchData.code)||null,
    teamA:{ name:nm.u, hcp:mine?mine.teamHcp:null, players:(_trFlow.team&&_trFlow.team.players)||[], scores:(_tmScores.u||[]).slice() },
    teamB:{ name:nm.o, hcp:opp?opp.teamHcp:null, players:(_tmFlow.opponent&&_tmFlow.opponent.players)||[], scores:(_tmScores.o||[]).slice() },
    result:{ teamAWon:r.uw, teamBWon:r.ow, drawn:r.dr, winner: r.uw>r.ow?nm.u:(r.ow>r.uw?nm.o:'AS') },
    playedAt:new Date().toISOString() };
  try {
    if(uid && typeof persistMatch==='function'){ await persistMatch(uid, match); }
    else if(uid && window._fbDb){ await window._fbDb.collection('users').doc(uid).collection('rounds').doc(match.id).set(match); }
    if(typeof showToast==='function') showToast('Match saved!','success');
  } catch(e){ console.warn('finish match', e); if(typeof showToast==='function') showToast('Saved locally'); }
  // reset match state and go home
  if(typeof _tmFlow!=='undefined'){ _tmFlow.opponent=null; _tmFlow.matchData=null; }
  if(typeof _tmScores!=='undefined'){ _tmScores={u:[],o:[]}; }
  _gameMode='single';
  if(typeof renderHomeScreen==='function') renderHomeScreen();
  showScreen('home');
}

