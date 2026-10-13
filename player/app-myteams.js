// Parmate player app — menu: My Teams
// Loaded by index.html with a plain <script src> at its original spot (no defer/async/module).


// ── Menu cluster: My Teams ──
function _mtAvatars(players, cls){
  return (players||[]).slice(0,4).map(function(p){
    var src = (typeof _avatarFor==='function') ? _avatarFor(p) : (function(){ var id=p&&(p.avatarId||p.avatar); return (id&&typeof AVATARS!=='undefined'&&AVATARS[id])?AVATARS[id]:'icons/home-crown.png'; })();
    return '<div class="'+cls+'"><img src="'+src+'" alt="" onerror="this.onerror=null;this.src=\'icons/home-crown.png\'"></div>';
  }).join('');
}
function renderMyTeams(ROOT){
  var teams = (typeof _savedTeams!=='undefined' && Array.isArray(_savedTeams)) ? _savedTeams : [];
  var body = ROOT.querySelector('.body-area');
  // main team card
  var mainCard = ROOT.querySelector('.main-team-card');
  if(!teams.length){
    if(mainCard) mainCard.style.display='none';
    // strip extra team cards
    ROOT.querySelectorAll('.team-card').forEach(function(c){ c.remove(); });
    ROOT.querySelectorAll('.section-title').forEach(function(s,i){ if(i>0) s.style.display='none'; });
    var empty=ROOT.querySelector('.mt-empty');
    if(!empty){ empty=document.createElement('div'); empty.className='mt-empty';
      empty.style.cssText='text-align:center;color:var(--text-3);font-family:Inter,sans-serif;font-size:14px;padding:24px 0;';
      empty.textContent='No teams yet — create your first scramble team.';
      var st=ROOT.querySelector('.section-title'); if(st&&st.parentNode) st.parentNode.insertBefore(empty, st.nextSibling); }
  } else {
    var mainIdx = teams.findIndex(function(t){ return t.isMain; });
    if(mainIdx < 0) mainIdx = 0;          // fallback: first team if none flagged
    var m = teams[mainIdx];
    var others = teams.filter(function(t,i){ return i !== mainIdx; });
    if(mainCard){
      mainCard.style.display='';
      var nm=mainCard.querySelector('.mt-name'); if(nm) nm.textContent=m.teamName||'My Team';
      var mem=mainCard.querySelector('.mt-members');
      if(mem){ var size=mem.querySelector('.mt-size');
        mem.innerHTML=_mtAvatars(m.players,'mt-avatar')+'<span class="mt-size">'+((m.players||[]).length)+' players</span>'; }
      mainCard.onclick=function(){ _tmOpenTeam(m); };
      // per-team history not tracked yet — show neutral placeholders instead of demo values
      var sv=mainCard.querySelectorAll('.mt-stat-val'); if(sv && sv.length>=3){ sv[0].textContent='\u2013'; sv[1].textContent='\u2013'; sv[2].textContent='\u2013'; }
    }
    // other teams: remove existing demo cards, rebuild
    ROOT.querySelectorAll('.team-card').forEach(function(c){ c.remove(); });
    var sections=ROOT.querySelectorAll('.section-title');
    var otherTitle=sections[1];
    if(others.length){
      if(otherTitle) otherTitle.style.display='';
      var frag=document.createDocumentFragment();
      others.forEach(function(t){
        var card=document.createElement('div'); card.className='team-card';
        card.innerHTML='<div class="team-avatars">'+_mtAvatars(t.players,'ta')+'</div>'+
          '<div class="team-info"><div class="team-name">'+(t.teamName||'Team')+'</div>'+
          '<div class="team-meta">'+((t.players||[]).length)+' players</div></div>'+
          '<div class="team-chevron">\u203a</div>';
        card.onclick=function(){ _tmOpenTeam(t); };
        frag.appendChild(card);
      });
      // insert after the "Other Teams" title
      if(otherTitle && otherTitle.parentNode){ otherTitle.parentNode.insertBefore(frag, otherTitle.nextSibling); }
      else body.appendChild(frag);
    } else if(otherTitle){ otherTitle.style.display='none'; }
  }
  // create-team button
  var ct=ROOT.querySelector('.create-team-btn');
  if(ct) ct.onclick=function(){ if(document.getElementById('screen-createteam')) showScreen('createteam'); else if(typeof showToast==='function') showToast('Coming soon'); };
}
function _tmOpenTeam(team){
  window._activeTeam=team;
  if(document.getElementById('screen-teamoverview')) showScreen('teamoverview');
  else if(typeof showToast==='function') showToast('Coming soon');
}

