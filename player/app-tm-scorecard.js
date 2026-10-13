// Parmate player app — team match: scorecard engine (9H / 18H)
// Loaded by index.html with a plain <script src> at its original spot (no defer/async/module).


// ═══════════════════════════════════════════════════════════
// TEAM MATCH · Scorecard engine (shared by tmscore 9H / tmfull 18H)
// ═══════════════════════════════════════════════════════════
if (typeof _tmScores === 'undefined') var _tmScores = { u: [], o: [] };
if (typeof _tmEdit === 'undefined') var _tmEdit = { cell:null, team:null, hole:null, buf:'', root:null };

function tmHoleCount(){ if(window._tmView) return window._tmView.holes; return (typeof trcTotal==='function') ? trcTotal() : ((_trFlow&&_trFlow.holes)||9); }
function tmPar(i){ if(window._tmView) return (window._tmView.par[i]!=null?window._tmView.par[i]:4); return (typeof trcPar==='function') ? trcPar(i) : 4; }
function tmSI(i){ if(window._tmView) return (window._tmView.si[i]!=null?window._tmView.si[i]:(i+1)); return (typeof trcSI==='function') ? trcSI(i) : (i+1); }

// THCP per side (reuse tmCalcSide); returns {u, o}
function tmSideHcps(){
  if(window._tmView) return window._tmView.hcps;
  const mine = (typeof tmCalcSide==='function') ? tmCalcSide(_trFlow.team ? _trFlow.team.players : []) : null;
  const oppData = (typeof _tmFlow!=='undefined' && _tmFlow.opponent) ? _tmFlow.opponent : null;
  const opp  = (typeof tmCalcSide==='function') ? tmCalcSide(oppData ? oppData.players : []) : null;
  return { u: mine ? mine.teamHcp : 0, o: opp ? opp.teamHcp : 0 };
}

// Allocate match-play strokes to the HIGHER-handicap side, by SI (hardest first)
function tmStrokeMap(){
  const n=tmHoleCount(); const h=tmSideHcps();
  const map={ u:new Array(n).fill(0), o:new Array(n).fill(0) };
  const diff=Math.round(Math.abs(h.u-h.o));
  const recv = h.u>=h.o ? 'u' : 'o';   // higher hcp receives strokes
  const order=[...Array(n).keys()].sort((a,b)=>tmSI(a)-tmSI(b));
  for(let k=0;k<diff;k++){ map[recv][order[k%n]]++; }
  return map;
}

function tmEnsureScores(){
  const n=tmHoleCount();
  ['u','o'].forEach(t=>{ if(!Array.isArray(_tmScores[t])) _tmScores[t]=[]; while(_tmScores[t].length<n) _tmScores[t].push(null); _tmScores[t].length=n; });
}

function tmTeamNames(){
  if(window._tmView) return window._tmView.names;
  return { u: (_trFlow.team && _trFlow.team.name) || 'Your team',
           o: (typeof _tmFlow!=='undefined' && _tmFlow.opponent && _tmFlow.opponent.teamName) || 'Opponent' };
}

// Build the table body for a given perspective (flip=true => opponent on left)
function tmBuildRows(ROOT, flip, lo, hi){
  const n=tmHoleCount(); const sm=tmStrokeMap();
  tmEnsureScores();
  if(lo==null) lo=0; if(hi==null) hi=n;
  const colA = flip ? 'o' : 'u', colB = flip ? 'u' : 'o';
  let rows='';
  for(let i=lo;i<hi;i++){
    const h=i+1, par=tmPar(i);
    const sA=_tmScores[colA][i], sB=_tmScores[colB][i];
    // net for hole result (always from displayed-left vs displayed-right)
    const netA=(sA==null?null:sA - sm[colA][i]);
    const netB=(sB==null?null:sB - sm[colB][i]);
    let ud=0;
    if(netA!=null && netB!=null){ ud = netA<netB ? 1 : (netA>netB ? -1 : 0); }
    const udLabel = (netA==null||netB==null) ? '–' : (ud===1?'+1':ud===-1?'-1':'0');
    const udBg = ud===1?'#e1c245':(ud===-1?'#c85a4a':'transparent');
    const udColor = (ud===0||netA==null||netB==null)?'var(--text-3)':'#fff';
    const star = sm[colB][i]>0 ? ' <span style="color:var(--red);font-weight:700;">*</span>'
               : (sm[colA][i]>0 ? ' <span style="color:var(--green);font-weight:700;">*</span>' : '');
    const cls=(s,p)=> (s==null?'':(s>p?'over-par ':(s<p?'under-par ':'')))+'editable';
    const cellA=(sA==null?'–':sA), cellB=(sB==null?'–':sB);
    rows+='<tr>'+
      '<td>'+h+'</td>'+
      '<td>'+par+star+'</td>'+
      '<td class="'+cls(sA,par)+'" data-team="'+colA+'" data-hole="'+h+'">'+cellA+'</td>'+
      '<td class="'+cls(sB,par)+'" data-team="'+colB+'" data-hole="'+h+'">'+cellB+'</td>'+
      '<td style="background:'+udBg+';font-weight:700;color:'+udColor+';">'+udLabel+'</td>'+
    '</tr>';
  }
  const sumA=_tmScores[colA].slice(lo,hi).reduce((a,b)=>a+(b||0),0);
  const sumB=_tmScores[colB].slice(lo,hi).reduce((a,b)=>a+(b||0),0);
  let totPar=0; for(let i=lo;i<hi;i++) totPar+=tmPar(i);
  rows+='<tr class="totals-row"><td>SCORE</td><td>'+totPar+'</td><td>'+(sumA||'–')+'</td><td>'+(sumB||'–')+'</td><td>-</td></tr>';
  return rows;
}

function tmScoreView(ROOT, flip){
  ROOT._flip=flip;
  const nm=tmTeamNames();
  const q=s=>ROOT.querySelector(s);
  const leftName  = flip ? nm.o : nm.u, rightName = flip ? nm.u : nm.o;
  const nH=tmHoleCount(), smap=tmStrokeMap();
  const cL = flip ? 'o' : 'u', cR = flip ? 'u' : 'o';
  // stroke-note for a hole range [lo,hi): which holes each side receives a stroke on
  const strokeNote=(lo,hi)=>{
    const lh=[], rh=[];
    for(let i=lo;i<hi;i++){ if((smap[cL][i]||0)>0) lh.push(i+1); if((smap[cR][i]||0)>0) rh.push(i+1); }
    if(!lh.length && !rh.length) return 'No strokes given on these holes.';
    let s='';
    if(lh.length) s+='<span style="color:var(--green);font-weight:700;">★</span> '+leftName+': '+lh.join(', ');
    if(rh.length) s+=(s?'&nbsp;&nbsp;·&nbsp;&nbsp;':'')+'<span style="color:var(--red);font-weight:700;">★</span> '+rightName+': '+rh.join(', ');
    return s;
  };
  const fb=ROOT.querySelector('#tmfl_frontBody'), bb=ROOT.querySelector('#tmfl_backBody');
  if(fb && bb){
    // 18-hole split view: Front 9 + Back 9, each its own table + note
    fb.innerHTML=tmBuildRows(ROOT, flip, 0, Math.min(9,nH));
    bb.innerHTML=tmBuildRows(ROOT, flip, 9, nH);
    const setH=(id,name)=>{ const e=ROOT.querySelector('#'+id); if(e) e.innerHTML='SCORE<br><small>'+name+'</small>'; };
    setH('tmfl_f1h',leftName); setH('tmfl_f2h',rightName); setH('tmfl_b1h',leftName); setH('tmfl_b2h',rightName);
    const fn=ROOT.querySelector('#tmfl_frontNote'); if(fn) fn.innerHTML=strokeNote(0,Math.min(9,nH));
    const bn=ROOT.querySelector('#tmfl_backNote'); if(bn) bn.innerHTML=strokeNote(9,nH);
  } else {
    // single-table view (9 holes)
    const tb=ROOT.querySelector('.sc-table tbody'); if(tb) tb.innerHTML=tmBuildRows(ROOT, flip, 0, nH);
    const heads=ROOT.querySelectorAll('.sc-table thead th');
    if(heads[2]) heads[2].innerHTML='SCORE<br><small>'+leftName+'</small>';
    if(heads[3]) heads[3].innerHTML='SCORE<br><small>'+rightName+'</small>';
    const sn=ROOT.querySelector('.stroke-note'); if(sn) sn.innerHTML=strokeNote(0,nH);
  }
  // perspective buttons
  const pbtns=ROOT.querySelectorAll('.persp-btn'); const bUser=pbtns[0], bOpp=pbtns[1];
  if(bUser){ bUser.textContent=nm.u+' view'; bUser.classList.toggle('active',!flip); bUser.onclick=function(){ tmScoreView(ROOT,false); }; }
  if(bOpp){ bOpp.textContent=nm.o+' view'; bOpp.classList.toggle('active',flip); bOpp.onclick=function(){ tmScoreView(ROOT,true); }; }
  // result (holes won/lost/drawn from current perspective)
  const n=tmHoleCount(), sm=tmStrokeMap();
  let lw=0, rw=0, dr=0;
  const L=flip?'o':'u', R=flip?'u':'o';
  for(let i=0;i<n;i++){
    const a=_tmScores[L][i], b=_tmScores[R][i];
    if(a==null||b==null) continue;
    const na=a-sm[L][i], nb=b-sm[R][i];
    if(na<nb) lw++; else if(na>nb) rw++; else dr++;
  }
  if(q('.result-team')) q('.result-team').textContent=leftName;
  if(q('.result-breakdown')) q('.result-breakdown').textContent=lw+' won | '+dr+' equal | '+rw+' loss';
  const rs=q('.result-score'); if(rs) rs.className='result-score '+(lw>rw?'won':lw<rw?'lost':'draw');
  if(rs) rs.textContent=(lw>rw?'WON':lw<rw?'LOST':'AS');
  // stats bar (left/active team)
  const played=_tmScores[L].filter(s=>s!=null);
  const gross=played.reduce((a,b)=>a+b,0);
  let parPlayed=0; _tmScores[L].forEach((s,i)=>{ if(s!=null) parPlayed+=tmPar(i); });
  const vs=gross-parPlayed;
  const sb=ROOT.querySelectorAll('.stats-bar .stat-value');
  if(sb&&sb.length>=4){
    sb[0].textContent=gross||'–';
    sb[1].textContent=parPlayed||'–';
    sb[2].textContent=(played.length? (vs>0?'+'+vs:vs) : '–'); sb[2].className='stat-value '+(vs>0?'pos':vs<0?'neg':'');
    sb[3].textContent=played.length+' / '+n;
  }
  // course header
  const c=(_trFlow && _trFlow.course) || {};
  const courseName=(window._tmView && window._tmView.courseName) || c.name || 'Course';
  if(ROOT.querySelector('.course-name')) ROOT.querySelector('.course-name').textContent=courseName;
  const hh=tmSideHcps();
  const cm=ROOT.querySelector('.course-meta'); if(cm) cm.innerHTML=n+' HOLES · HCP '+hh.u+' vs '+hh.o+' · '+nm.u+' vs '+nm.o;
  // best score = lowest gross of the two teams
  const grU=(_tmScores.u||[]).reduce((a,b)=>a+(b||0),0), grO=(_tmScores.o||[]).reduce((a,b)=>a+(b||0),0);
  const bestNm=(grU>0&&grO>0)?(grU<grO?nm.u:(grU>grO?nm.o:'Even')):(grU>0?nm.u:(grO>0?nm.o:'–'));
  if(q('.best-score-label span')) q('.best-score-label span').textContent=bestNm;
  // chrome: read-only saved view vs live/flow scoring
  const _np=ROOT.querySelector('.play-btn'); if(_np) _np.style.display = (window._tmView ? 'none' : '');
  if(ROOT&&ROOT.classList) ROOT.classList.toggle('tmview', !!window._tmView);
  const _bp=ROOT.querySelector('.sub-header .back-pill');
  if(_bp) _bp.onclick = function(){ if(window._tmView){ window._tmView=null; showScreen('matches'); } else { showScreen('tmcode'); } };
  const _ti=ROOT.querySelector('.sub-header .title');
  if(_ti) _ti.textContent = window._tmView ? 'Match Detail' : (ROOT.id==='screen-tmfull' ? 'Full Scorecard' : 'Scorecard');
  var _shb=ROOT.querySelector('.sub-header .tmf-share'); if(_shb) _shb.style.display = window._tmView ? '' : 'none';
  // read-only saved view: offer a Delete button (below the result card)
  var _del=ROOT.querySelector('.tm-delete-btn');
  if(window._tmView){
    if(!_del){
      _del=document.createElement('button');
      _del.className='tm-delete-btn'; _del.type='button';
      _del.textContent='🗑 '+((typeof t==='function')?t('btn_delete'):'Delete');
      _del.style.cssText='display:block;width:calc(100% - 32px);margin:14px 16px 8px;padding:13px;background:#fff;border:1.5px solid #c0392b;color:#c0392b;border-radius:24px;font-weight:700;font-size:0.95rem;cursor:pointer;';
      _del.onclick=function(){ if(typeof deleteActiveScorecard==='function') deleteActiveScorecard(); };
      var _rc=ROOT.querySelector('.result-card');
      if(_rc && _rc.parentNode) _rc.parentNode.insertBefore(_del, _rc.nextSibling);
      else { var _ba=ROOT.querySelector('.body-area'); if(_ba) _ba.appendChild(_del); }
    }
    _del.style.display='block';
  } else if(_del){ _del.style.display='none'; }
  if(!(window._tmView && window._tmView.readonly)) tmAttachEdit(ROOT);
}

// Open a SAVED match in the full-scorecard screens (read-only), reusing tmScoreView.
// Handles both save schemas: live _sc (scores/oppScores/teamName/oppName) and
// local-flow (teamA/teamB objects).
function tmOpenSaved(round){
  if(!round){ if(typeof showToast==='function') showToast('Round not found.'); return; }
  const A=round.teamA||{}, B=round.teamB||{};
  const n = round.holes || (round.par ? round.par.length : 9) || 9;
  const teamScores = (round.scores || A.scores || []).slice();
  const oppScores  = (round.oppScores || B.scores || []).slice();
  window._tmView = {
    holes: n,
    courseName: round.courseName || A.courseName || B.courseName || 'Course',
    par: (round.par||[]).slice(),
    si:  (round.index||round.si||[]).slice(),
    names: { u: round.teamName || A.name || 'Your team', o: round.oppName || B.name || 'Opponent' },
    hcps:  { u: (round.teamHcp!=null?round.teamHcp:(A.hcp!=null?A.hcp:0)),
             o: (round.oppHcp!=null ?round.oppHcp :(B.hcp!=null?B.hcp:0)) },
    readonly: true
  };
  _tmScores = { u: teamScores, o: oppScores };
  ['u','o'].forEach(function(t){ while(_tmScores[t].length<n) _tmScores[t].push(null); _tmScores[t].length=n; });
  showScreen(n>=18 ? 'tmfull' : 'tmscore');
}

// ── numpad editing ──
function tmOpenNumpad(ROOT, cell, team, hole){
  _tmEdit={ cell, team, hole, buf:(cell.textContent||'').replace(/[^0-9]/g,''), root:ROOT };
  const disp=ROOT.querySelector('.numpad-display'); if(disp) disp.textContent=_tmEdit.buf||'–';
  const ctx=ROOT.querySelector('.numpad-context');
  const nm=tmTeamNames();
  if(ctx) ctx.textContent='Hole '+hole+' · '+(team==='u'?nm.u:nm.o)+' score';
  const np=ROOT.querySelector('.numpad-overlay'); if(np) np.classList.add('open');
  cell.classList.add('editing');
}
function tmCloseNumpad(ROOT){
  const np=ROOT.querySelector('.numpad-overlay'); if(np) np.classList.remove('open');
  if(_tmEdit.cell) _tmEdit.cell.classList.remove('editing');
  _tmEdit={ cell:null, team:null, hole:null, buf:'', root:null };
}
function tmAttachEdit(ROOT){
  ROOT.querySelectorAll('.sc-table td.editable').forEach(td=>{
    td.onclick=(e)=>{ e.stopPropagation(); tmOpenNumpad(ROOT, td, td.dataset.team, parseInt(td.dataset.hole)); };
  });
}
function tmInitScorecard(ROOT){
  // numpad digit buttons
  ROOT.querySelectorAll('.num-btn[data-val]').forEach(btn=>{
    btn.addEventListener('click',(e)=>{ e.stopPropagation(); if(!_tmEdit.cell) return;
      const next=(_tmEdit.buf+btn.dataset.val).slice(-2);
      if(parseInt(next)>20) return; _tmEdit.buf=next;
      const d=ROOT.querySelector('.numpad-display'); if(d) d.textContent=_tmEdit.buf; });
  });
  const del=ROOT.querySelector('.num-btn.del');
  if(del) del.addEventListener('click',(e)=>{ e.stopPropagation(); _tmEdit.buf=_tmEdit.buf.slice(0,-1);
    const d=ROOT.querySelector('.numpad-display'); if(d) d.textContent=_tmEdit.buf||'–'; });
  const ok=ROOT.querySelector('.numpad-overlay .numpad-ok') || ROOT.querySelector('.numpad-ok');
  if(ok) ok.addEventListener('click',(e)=>{ e.stopPropagation();
    if(_tmEdit.cell && _tmEdit.team){ const v=parseInt(_tmEdit.buf); _tmScores[_tmEdit.team][_tmEdit.hole-1]=isNaN(v)?null:v; }
    tmCloseNumpad(ROOT); tmScoreView(ROOT, !!ROOT._flip); });
  // perspective toggle
  const _pb=ROOT.querySelectorAll('.persp-btn'); const bu=_pb[0], bo=_pb[1];
  if(bu) bu.addEventListener('click',()=>tmScoreView(ROOT,false));
  if(bo) bo.addEventListener('click',()=>tmScoreView(ROOT,true));
}
function tmRenderScore(ROOT){ tmEnsureScores(); tmScoreView(ROOT, !!ROOT._flip); }
function tmScoreNext(){ if(document.getElementById('screen-tmsummary')) showScreen('tmsummary'); else if(typeof showToast==='function') showToast('Summary coming soon'); }

