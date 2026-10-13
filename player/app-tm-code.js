// Parmate player app — team match: match code / QR screen
// Loaded by index.html with a plain <script src> at its original spot (no defer/async/module).


// ── Screen 15: Match Code (share / QR / skip) ──
function tmGenCode(){ const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<5;i++) s+=A[Math.floor(Math.random()*A.length)]; return s; }
function tmRenderQR(ROOT, code){
  try {
    const wrap=ROOT.querySelector('.qr-wrap');
    if(wrap && typeof qrcode==='function'){
      const url=location.origin+'/?join='+encodeURIComponent(code);
      const qr=qrcode(0,'M'); qr.addData(url); qr.make();
      const svgStr=qr.createSvgTag({cellSize:4, margin:1, scalable:true});
      const old=wrap.querySelector('svg'); if(old) old.remove();
      const holder=document.createElement('div'); holder.innerHTML=svgStr;
      const node=holder.firstElementChild;
      if(node){ node.setAttribute('width','150'); node.setAttribute('height','150'); node.style.display='block'; wrap.appendChild(node); }
    }
  } catch(e){ console.warn('QR render failed', e); }
}
// Build a live-match document from the new team-match flow's state (_trFlow + _tmFlow).
// teamHcp is computed with the flow's own WHS-correct tmCalcSide so scramble math is preserved.
function tmBuildMatchData(){
  if(typeof _trFlow==='undefined' || !_trFlow || !_trFlow.course) return null;
  if(typeof _tmFlow==='undefined' || !_tmFlow || !_tmFlow.opponent) return null;
  var meSide  = (typeof tmCalcSide==='function') ? tmCalcSide(((_trFlow.team&&_trFlow.team.players)||[]).slice()) : null;
  var oppSide = (typeof tmCalcSide==='function') ? tmCalcSide((_tmFlow.opponent.players||[]).slice()) : null;
  var par = (_trFlow.parByHole||[]).slice();
  var idx = (_trFlow.siByHole||[]).slice();
  var holes = _trFlow.holes || par.length || 9;
  var totalPar = par.reduce(function(a,b){ return a+(b||0); }, 0);
  return {
    holes: holes,
    course: { name:(_trFlow.course.name||'Course'), par: totalPar },
    par: par,
    index: idx,
    format: _trFlow.format || '35_15',
    tees: (_trFlow.course.tees)||[],
    teamA: { teamName:(_trFlow.team&&_trFlow.team.name)||'My Team', teamHcp: meSide?meSide.teamHcp:0, players:(_trFlow.team&&_trFlow.team.players)||[] },
    teamB: { teamName:_tmFlow.opponent.teamName||'Opponent', teamHcp: oppSide?oppSide.teamHcp:0, players:_tmFlow.opponent.players||[] }
  };
}
// Register the match in Firestore so the code is joinable, then wait for the opponent.
async function tmHostMatch(ROOT){
  const el=ROOT.querySelector('#tmcode_matchCode');
  let code;
  try {
    var md = tmBuildMatchData();
    if(md && typeof createMatch==='function'){
      code = await createMatch(md);   // writes matches/{code} with status 'waiting'
    }
  } catch(e){ console.warn('tmHostMatch createMatch failed', e); }
  if(!code){
    // Could not host (offline / not signed in / missing data) — fall back to a local-only code
    code = tmGenCode();
    _tmFlow.matchData = Object.assign({}, _tmFlow.matchData, { code, hosted:false });
    if(el) el.textContent=code;
    tmRenderQR(ROOT, code);
    return;
  }
  _tmFlow.matchData = Object.assign({}, _tmFlow.matchData, { code, hosted:true });
  window._activeMatchId = code; window._activeMatchRole = 'A';
  if(el) el.textContent=code;
  tmRenderQR(ROOT, code);
  // When the opponent joins, jump both players into the live, synced scorecard.
  if(typeof listenToMatch==='function'){
    listenToMatch(code, function(data){
      if(data && data.status==='active' && data.teamB && data.teamB.uid){
        if(typeof showToast==='function') showToast((data.teamB.teamName||'Opponent')+' joined — starting match!', 'success');
        setTimeout(function(){ if(typeof openLiveScorecard==='function') openLiveScorecard(data, 'A'); }, 800);
      }
    });
  }
}
function tmRenderCode(ROOT){
  const el=ROOT.querySelector('#tmcode_matchCode');
  // Already hosted (e.g. screen re-render) — just show the existing code + QR
  if(_tmFlow.matchData && _tmFlow.matchData.code){
    if(el) el.textContent=_tmFlow.matchData.code;
    tmRenderQR(ROOT, _tmFlow.matchData.code);
    return;
  }
  if(el) el.textContent='\u00b7\u00b7\u00b7\u00b7\u00b7';
  tmHostMatch(ROOT);
}
function tmInit_tmcode(ROOT){
  const code=()=>ROOT.querySelector('#tmcode_matchCode').textContent;
  const toast=ROOT.querySelector('#tmcode_toast');
  const flash=(msg)=>{ if(!toast)return; if(msg)toast.textContent=msg; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),2000); };
  ROOT.querySelector('#tmcode_matchCode').addEventListener('click',()=>{ navigator.clipboard&&navigator.clipboard.writeText(code()).catch(()=>{}); flash('✓ Code copied!'); });
  ROOT.querySelector('#tmcode_shareBtn').addEventListener('click',()=>{
    if(navigator.share){ navigator.share({title:'Parmate Match Code',text:'Join my Parmate match! Code: '+code()}).catch(()=>{}); }
    else { navigator.clipboard&&navigator.clipboard.writeText(code()).catch(()=>{}); flash('✓ Code copied!'); }
  });
  ROOT.querySelector('#tmcode_skipLink').addEventListener('click',(e)=>{ e.preventDefault(); tmCodeContinue(); });
}
// Continue into live scoring — 9H -> tmscore, 18H -> tmfull
function tmCodeContinue(){
  const holes=(typeof _trFlow!=='undefined'&&_trFlow.holes)?_trFlow.holes:9;
  const target=(holes>=18)?'tmfull':'tmscore';
  if(document.getElementById('screen-'+target)) showScreen(target);
  else if(typeof showToast==='function') showToast('Scorecard coming soon');
}

