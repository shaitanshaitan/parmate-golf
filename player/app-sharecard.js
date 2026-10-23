// Parmate player app — scorecard social share card
// Loaded by index.html with a plain <script src> at its original spot (no defer/async/module).

// Scorecard social sharing — branded 9:16 story card (canvas, dependency-free)
var _scCrown=null,_scCrownTried=false,_scLastCanvas=null;
function _scEnsureCrown(cb){
  if(_scCrown||_scCrownTried){ cb(); return; }
  try{ var img=new Image(); img.onload=function(){_scCrown=img;cb();}; img.onerror=function(){_scCrownTried=true;cb();}; img.src='icons/home-crown.png'; }
  catch(e){ _scCrownTried=true; cb(); }
}
function _scCurrentRound(){ return window._activeRound || null; }

function _scDerive(r){
  r=r||{};
  var isMatch=!!r.isMatch;
  var par=r.par||[];
  var parTot=par.reduce(function(a,b){return a+(b||0);},0)||r.totalPar||r.parTotal||0;
  var holes=r.holes||Math.max(par.length,(r.scores||[]).length)||9;
  var courseName=(r.courseName||r.loopName||'Round');
  var playedAt=(r.playedAt||r.date);
  if(r.mode==='match1v1' && typeof m1ShareDerive==='function') return m1ShareDerive(r, { courseName:courseName, holes:holes, playedAt:playedAt });   // 1vs1 (app-match.js)
  if(isMatch){
    var A=r.teamA||{},B=r.teamB||{};
    var aScores=r.scores||A.scores||[], bScores=r.oppScores||B.scores||[];
    var aName=r.teamName||A.name||'My Team', bName=r.oppName||B.name||'Opponent';
    var aHcp=(r.teamHcp!=null?r.teamHcp:(A.hcp!=null?A.hcp:0)), bHcp=(r.oppHcp!=null?r.oppHcp:(B.hcp!=null?B.hcp:0));
    var aPlayers=A.players||r.teamPlayers||r.players||[], bPlayers=B.players||r.oppPlayers||[];
    var si=r.si||r.index||[];
    var ranks=(typeof _denseSIRanks==='function')?_denseSIRanks(si,holes):si;
    var diff=Math.abs((aHcp||0)-(bHcp||0)), aRecv=(aHcp||0)>=(bHcp||0);
    var win=0,loss=0,sq=0,seq=[];
    for(var k=0;k<holes;k++){
      var av=aScores[k], bv=bScores[k];
      if(av==null||av===0||bv==null||bv===0){ seq.push(null); continue; }
      var str=(typeof strokeOnHoleWithIndex==='function')?strokeOnHoleWithIndex(k,diff,ranks,holes):0;
      var na=av-(aRecv?str:0), nb=bv-(aRecv?0:str);
      if(na<nb){win++;seq.push(1);} else if(na>nb){loss++;seq.push(-1);} else {sq++;seq.push(0);}
    }
    var resultText=(win+'&'+loss);
    try{ if(typeof tmMatchPlayText==='function'){ var mp=tmMatchPlayText(seq,holes); if(mp&&mp.text) resultText=(mp.text==='All square'?'A/S':mp.text).toUpperCase(); } }catch(e){}
    var aC=(aPlayers&&aPlayers.length)||2,bC=(bPlayers&&bPlayers.length)||2;
    return { isMatch:true, courseName:courseName, holes:holes, playedAt:playedAt,
      teamLine:(aName+' VS '+bName), result:resultText, win:win, loss:loss, square:sq, playersLabel:(aC+'VS'+bC) };
  }
  var scores=r.scores||[];
  var gross=(r.gross!=null)?r.gross:scores.reduce(function(a,b){return a+(b||0);},0);
  var vsPar=(gross&&parTot)?(gross-parTot):(r.vsPar!=null?r.vsPar:0);
  var thcp=(r.teamHcp!=null)?r.teamHcp:((r.thcp!=null)?r.thcp:((r.team&&r.team.hcp!=null)?r.team.hcp:null));
  var players=r.players||(r.team&&r.team.players)||[];
  var vsLabel=(vsPar===0?'E':(vsPar>0?('+'+vsPar):(''+vsPar)));
  if(r.mode==='solo' && typeof soloShareDerive==='function'){
    return soloShareDerive(r, { isMatch:false, courseName:courseName, holes:holes, playedAt:playedAt, gross:gross, parTot:parTot });
  }
  return { isMatch:false, courseName:courseName, holes:holes, playedAt:playedAt,
    teamLine:(r.teamName||(r.team&&r.team.name)||'My Team'),
    result:(vsLabel+' VS PAR'), gross:gross, parTot:parTot, thcp:thcp, playersCount:(players.length||0) };
}

function _scLS(ctx,t,x,y,font,color,ls,align){ ctx.save(); if('letterSpacing' in ctx) ctx.letterSpacing=(ls||0)+'px'; ctx.font=font; ctx.fillStyle=color; ctx.textAlign=align||'center'; ctx.textBaseline='alphabetic'; ctx.fillText(t,x,y); ctx.restore(); }
function _scGold(ctx,y0,y1){ var g=ctx.createLinearGradient(0,y0,0,y1); g.addColorStop(0,'#F4D684'); g.addColorStop(1,'#D49A2C'); return g; }
function _scPx(font){ var m=font.match(/(\d+)px/); return m?parseInt(m[1],10):40; }
function _scFitSize(ctx,t,weight,maxSize,maxW,fam){ var sz=maxSize; ctx.save(); do{ ctx.font=weight+' '+sz+'px '+fam; if(ctx.measureText(t).width<=maxW) break; sz-=4; }while(sz>24); ctx.restore(); return sz; }
function _scWrap(ctx,t,font,maxW,maxLines){ ctx.font=font; var words=String(t).split(' '),lines=[],cur=''; for(var i=0;i<words.length;i++){ var test=cur?cur+' '+words[i]:words[i]; if(ctx.measureText(test).width>maxW&&cur){ lines.push(cur); cur=words[i]; } else cur=test; } if(cur) lines.push(cur); if(lines.length>maxLines) lines=lines.slice(0,maxLines); return lines; }
function _scFlanked(ctx,t,cx,y,font,color,lineColor,gap,lineLen){ ctx.font=font; ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillStyle=color; var w=ctx.measureText(t).width; ctx.fillText(t,cx,y); var ly=y-Math.round(_scPx(font)*0.30); ctx.strokeStyle=lineColor; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx-w/2-gap-lineLen,ly); ctx.lineTo(cx-w/2-gap,ly); ctx.moveTo(cx+w/2+gap,ly); ctx.lineTo(cx+w/2+gap+lineLen,ly); ctx.stroke(); }
function _scCrownDraw(ctx,cx,topY,targetW){ if(!_scCrown) return topY+targetW*0.7; var ratio=(_scCrown.height/_scCrown.width)||0.72; var w=targetW,h=w*ratio; try{ ctx.drawImage(_scCrown,cx-w/2,topY,w,h); }catch(e){} return topY+h; }

function _renderScorecardCanvas(rRaw){
  var d=_scDerive(rRaw);
  var W=1080,H=1920,cx=W/2;
  var cv=document.createElement('canvas'); cv.width=W; cv.height=H;
  var ctx=cv.getContext('2d');
  var _blk=(document.documentElement.getAttribute('data-theme')==='black');   // v38: black theme = black card
  var g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,_blk?'#1c1c1c':'#17492c'); g.addColorStop(0.5,_blk?'#121212':'#103a23'); g.addColorStop(1,_blk?'#070707':'#0a2c1a');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  var rg=ctx.createRadialGradient(cx,H*0.16,60,cx,H*0.16,W*0.85); rg.addColorStop(0,_blk?'rgba(150,150,150,0.20)':'rgba(70,140,92,0.30)'); rg.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(212,165,75,0.30)'; ctx.lineWidth=2; ctx.strokeRect(30,30,W-60,H-60);

  var cream='#F3ECCF',muted=_blk?'#9a9a9a':'#8FA694',gold='#E3B454',lineL='rgba(255,255,255,0.14)',vlineL='rgba(243,236,207,0.28)';

  _scCrownDraw(ctx,cx,108,150);
  _scLS(ctx,'PARMATE',cx,318,'800 92px Inter, sans-serif',_scGold(ctx,250,330),14);
  _scLS(ctx,(d.subtitle||'SCRAMBLE'),cx,384,'600 40px Inter, sans-serif',gold,18);
  _scLS(ctx,'SCORECARD',cx,468,'800 80px Inter, sans-serif',_scGold(ctx,408,478),10);
  var ruleY=512;
  if(d.isMatch){ _scLS(ctx,'MATCHPLAY',cx,552,'800 60px Inter, sans-serif',_scGold(ctx,508,560),8); ruleY=598; }
  ctx.strokeStyle='rgba(212,165,75,0.55)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(150,ruleY); ctx.lineTo(W-150,ruleY); ctx.stroke();

  var rs=_scFitSize(ctx,d.result,'800',158,W-200,'Inter, sans-serif');
  _scLS(ctx,d.result,cx,820,'800 '+rs+'px Inter, sans-serif',cream,2);

  var cLines=_scWrap(ctx,(d.courseName||'').toUpperCase(),'600 48px Inter, sans-serif',W-260,2);
  var cy=(cLines.length>1)?928:958;
  cLines.forEach(function(ln){ _scLS(ctx,ln,cx,cy,'600 48px Inter, sans-serif',muted,2); cy+=60; });
  _scLS(ctx,d.holes+' HOLES',cx,cy+8,'500 44px Inter, sans-serif',muted,3);

  ctx.strokeStyle='rgba(212,165,75,0.45)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx-70,1110); ctx.lineTo(cx+70,1110); ctx.stroke();

  var tLine=(d.teamLine||'').toUpperCase();
  var tSize=_scFitSize(ctx,tLine,'700',54,W-360,'Inter, sans-serif');
  _scFlanked(ctx,tLine,cx,1182,'700 '+tSize+'px Inter, sans-serif',gold,'rgba(212,165,75,0.55)',26,90);

  var rows;
  if(d.rows){
    rows=d.rows;
  } else if(d.isMatch){
    rows=[['WIN',String(d.win),''],['LOSS',String(d.loss),''],['SQUARE',String(d.square),''],['PLAYERS',d.playersLabel,''],['DATE','','']];
  } else {
    rows=[['GROSS',(d.gross!=null?String(d.gross):'\u2013'),''],
          ['TEAM HCP',(d.thcp!=null?((d.thcp>0?'+':'')+d.thcp):'\u2013'),''],
          ['PAR',(d.parTot?String(d.parTot):'\u2013'),''],
          ['PLAYERS',String(d.playersCount||'\u2013'),''],
          ['DATE','','']];
  }
  // Date as 14-10-2026 (the spelled-out month was cut off on narrow cards)
  var dateStr='';
  if(d.playedAt){ try{ var dt=new Date(d.playedAt); if(!isNaN(dt)) dateStr=('0'+dt.getDate()).slice(-2)+'-'+('0'+(dt.getMonth()+1)).slice(-2)+'-'+dt.getFullYear(); }catch(e){} }
  rows[rows.length-1][1]=dateStr; rows[rows.length-1][2]='';

  var tLeft=180,tRight=W-180,vline=600,rowH=66,topY=1232;
  ctx.lineWidth=1.5; ctx.strokeStyle=lineL;
  for(var i=0;i<=rows.length;i++){ var ly=topY+i*rowH; ctx.beginPath(); ctx.moveTo(tLeft,ly); ctx.lineTo(tRight,ly); ctx.stroke(); }
  ctx.strokeStyle=vlineL; ctx.beginPath(); ctx.moveTo(vline,topY); ctx.lineTo(vline,topY+rows.length*rowH); ctx.stroke();
  for(var r2=0;r2<rows.length;r2++){
    var base=topY+r2*rowH+rowH/2+13;
    _scLS(ctx,rows[r2][0],vline-36,base,'600 36px Inter, sans-serif',muted,1,'right');
    if(rows[r2][1]) _scLS(ctx,rows[r2][1],vline+40,base,'700 40px Inter, sans-serif','#E7D9A8',1,'left');
    if(rows[r2][2]) _scLS(ctx,rows[r2][2],vline+220,base,'500 34px Inter, sans-serif',muted,1,'left');
  }

  _scCrownDraw(ctx,cx,1660,92);
  _scLS(ctx,'play.parmate.golf',cx,1800,'700 44px Inter, sans-serif',cream,1);
  _scFlanked(ctx,'SCRAMBLE',cx,1858,'500 34px Inter, sans-serif',muted,'rgba(212,165,75,0.5)',22,80);

  return cv;
}

function _scRenderPreview(){
  var r=_scCurrentRound(); if(!r) return;
  _scEnsureCrown(function(){
    try{ var cv=_renderScorecardCanvas(r); _scLastCanvas=cv; var img=document.getElementById('scSharePreview'); if(img) img.src=cv.toDataURL('image/png'); }
    catch(e){ console.warn('scorecard render',e); }
  });
}
function shareScorecard(){
  var r=_scCurrentRound();
  if(!r){ if(typeof showToast==='function') showToast('Round not found.','error'); return; }
  _scRenderPreview();
  var ov=document.getElementById('scShareOverlay'); if(ov) ov.style.display='flex';
}
function scCloseShare(){ var ov=document.getElementById('scShareOverlay'); if(ov) ov.style.display='none'; }
function _scBlob(cb){ if(!_scLastCanvas){ cb(null); return; } _scLastCanvas.toBlob(function(b){ cb(b); },'image/png'); }
function scDoShare(){
  _scBlob(function(blob){
    if(!blob){ if(typeof showToast==='function') showToast('Could not create image.','error'); return; }
    var file=new File([blob],'parmate-scorecard.png',{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[file]})){ navigator.share({files:[file],title:'Parmate Scorecard',text:'My scramble round on Parmate \u26f3'}).catch(function(){}); }
    else { scDownload(); if(typeof showToast==='function') showToast('Sharing not supported here \u2014 image downloaded.','info'); }
  });
}
function scDownload(){
  _scBlob(function(blob){ if(!blob) return; var url=URL.createObjectURL(blob); var a=document.createElement('a'); a.href=url; a.download='parmate-scorecard.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(url); },2000); });
}
