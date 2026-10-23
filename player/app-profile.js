// Parmate player app — profile cluster (edit profile, avatars, covers, buddies)
// Loaded by index.html with a plain <script src> at its original spot (no defer/async/module).


// ── Profile cluster: Edit Profile (screen-editprofile) ──
(function(){
  var avIds  = function(){ return (typeof AVATARS!=='undefined')?Object.keys(AVATARS):[]; };
  var covIds = function(){ return (typeof COVERS!=='undefined')?Object.keys(COVERS):[]; };
  var pageSize = (typeof PICKER_PAGE_SIZE!=='undefined') ? PICKER_PAGE_SIZE : 10;

  function pageForId(ids, id){
    if(id==null) return 0;
    var idx=-1; for(var i=0;i<ids.length;i++){ if(String(ids[i])===String(id)){ idx=i; break; } }
    return idx<0 ? 0 : Math.floor(idx/pageSize);
  }

  function renderPaginatedGrid(gridId, pagerId, ids, map, selectedId, page, selectFn, pageFn, altPrefix){
    var totalPages = Math.max(1, Math.ceil(ids.length / pageSize));
    if(page>=totalPages) page=totalPages-1; if(page<0) page=0;
    var start = page*pageSize;
    var pageIds = ids.slice(start, start+pageSize);
    var grid = document.getElementById(gridId);
    if(grid){
      grid.innerHTML = pageIds.map(function(id,i){
        var g=start+i; var isSel=(String(id)===String(selectedId));
        return '<div class="av-opt'+(isSel?' selected':'')+'" onclick="'+selectFn+'('+g+')"><img src="'+map[id]+'" alt="'+altPrefix+' '+(g+1)+'"></div>';
      }).join('');
    }
    var pager = document.getElementById(pagerId);
    if(pager){
      if(totalPages<=1){ pager.innerHTML=''; }
      else {
        var dots=''; for(var p=0;p<totalPages;p++){ dots+='<button class="pager-dot'+(p===page?' active':'')+'" onclick="'+pageFn+'('+p+')">'+(p+1)+'</button>'; }
        pager.innerHTML = '<button class="pager-nav" onclick="'+pageFn+'('+(page-1)+')" '+(page===0?'disabled':'')+'>\u2039</button>'+dots+
                           '<button class="pager-nav" onclick="'+pageFn+'('+(page+1)+')" '+(page===totalPages-1?'disabled':'')+'>\u203a</button>';
      }
    }
    return page;
  }

  window.renderEpAvatarGrid = function(){
    window._avatarPage = renderPaginatedGrid('ep-avatarGrid','ep-avatarPager', avIds(), AVATARS, window._editAvatarId, window._avatarPage||0, 'selectAvatar', 'gotoAvatarPage', 'avatar');
  };
  window.renderEpCoverGrid = function(){
    window._coverPage = renderPaginatedGrid('ep-coverGrid','ep-coverPager', covIds(), (typeof COVERS!=='undefined'?COVERS:{}), window._editCoverId, window._coverPage||0, 'selectCover', 'gotoCoverPage', 'cover');
  };
  window.gotoAvatarPage = function(p){ window._avatarPage=p; window.renderEpAvatarGrid(); };
  window.gotoCoverPage  = function(p){ window._coverPage=p; window.renderEpCoverGrid(); };

  window.togglePicker = function(){
    var p=document.getElementById('avatarPicker'); if(!p) return;
    var opening = !p.classList.contains('visible');
    p.classList.toggle('visible');
    if(opening){ window._avatarPage = pageForId(avIds(), window._editAvatarId); window.renderEpAvatarGrid(); }
  };
  window.toggleCoverPicker = function(){
    var p=document.getElementById('coverPicker'); if(!p) return;
    var opening = !p.classList.contains('visible');
    p.classList.toggle('visible');
    if(opening){ window._coverPage = pageForId(covIds(), window._editCoverId); window.renderEpCoverGrid(); }
  };
  window.selectAvatar = function(globalIdx){
    var ids=avIds(); var id=ids[globalIdx]; if(id==null) return;
    window._editAvatarId=id;
    var im=document.getElementById('main-avatar'); if(im) im.src=AVATARS[id];
    window.renderEpAvatarGrid();
    var ub=document.getElementById('uploadBadge'); if(ub) ub.classList.remove('visible');
    var am=document.querySelector('#screen-editprofile .avatar-main'); if(am) am.classList.remove('has-upload');
  };
  window.selectCover = function(globalIdx){
    var ids=covIds(); var id=ids[globalIdx]; if(id==null) return;
    window._editCoverId=id;
    var bn=document.getElementById('bannerImg'); if(bn){ bn.src=COVERS[id]; bn.style.display='block'; }
    window.renderEpCoverGrid();
  };
  window.handleUpload = function(e){
    var f=e.target.files&&e.target.files[0]; if(!f) return; if(f.type.indexOf('image/')!==0) return;
    if(typeof isProUser==='function' && !isProUser()){
      if(typeof showToast==='function') showToast('Custom photos are a Pro feature — pick from the free gallery, or upgrade for your own.', 'error');
      e.target.value=''; return;
    }
    var rd=new FileReader(); rd.onload=function(ev){
      var im=document.getElementById('main-avatar'); if(im) im.src=ev.target.result;
      var am=document.querySelector('#screen-editprofile .avatar-main'); if(am) am.classList.add('has-upload');
      var ub=document.getElementById('uploadBadge'); if(ub) ub.classList.add('visible');
      window._editAvatarId=null;
      if(typeof window.renderEpAvatarGrid==='function') window.renderEpAvatarGrid();
      var ap=document.getElementById('avatarPicker'); if(ap) ap.classList.remove('visible');
    }; rd.readAsDataURL(f);
    if(typeof _homeUpload==='function') _homeUpload('avatar', f);
    e.target.value='';
  };
  window.handleBannerUpload = function(e){
    var f=e.target.files&&e.target.files[0]; if(!f) return; if(f.type.indexOf('image/')!==0) return;
    if(typeof isProUser==='function' && !isProUser()){
      if(typeof showToast==='function') showToast('Custom photos are a Pro feature — pick from the free gallery, or upgrade for your own.', 'error');
      e.target.value=''; return;
    }
    var rd=new FileReader(); rd.onload=function(ev){
      var im=document.getElementById('bannerImg'); if(im){ im.src=ev.target.result; im.style.display='block'; }
      window._editCoverId=null;
      if(typeof window.renderEpCoverGrid==='function') window.renderEpCoverGrid();
      var cp=document.getElementById('coverPicker'); if(cp) cp.classList.remove('visible');
    }; rd.readAsDataURL(f);
    if(typeof _homeUpload==='function') _homeUpload('cover', f);
    e.target.value='';
  };
  window.setGender = function(g){
    window._editGender=g;
    ['g-male','g-female','g-other'].forEach(function(id){ var el=document.getElementById(id); if(el) el.classList.remove('active'); });
    var map={M:'g-male',F:'g-female',O:'g-other'}; var t=document.getElementById(map[g]); if(t) t.classList.add('active');
  };
  window.saveProfile = async function(){
    var v=function(id){ var e=document.getElementById(id); return e?e.value:''; };
    _profile=_profile||{};
    if(v('f-nickname')) _profile.displayName=v('f-nickname');
    _profile.username=(v('f-username')||'').replace(/^@/,'');
    var hcp=parseFloat(v('f-hcp')); if(!isNaN(hcp)) _profile.hcpIndex=hcp;
    if(v('f-homeclub')) _profile.homeCourse=v('f-homeclub');
    if(v('f-lang')) _profile.lang=v('f-lang');
    if(v('f-country')) _profile.country=v('f-country');
    if(window._editGender) _profile.gender=window._editGender;
    if(window._editAvatarId!=null){ _profile.avatarId=window._editAvatarId; _profile.avatarUrl=null; }
    if(window._editCoverId!=null){ _profile.coverId=window._editCoverId; _profile.coverUrl=null; }
    var toast=document.getElementById('saveToast'); if(toast){ toast.style.display='block'; setTimeout(function(){toast.style.display='none';},2000); }
    try{
      var uid=window._fbAuth&&window._fbAuth.currentUser&&window._fbAuth.currentUser.uid;
      if(uid&&window._fbDb){
        var patch={displayName:_profile.displayName, username:_profile.username, hcpIndex:_profile.hcpIndex, homeCourse:_profile.homeCourse};
        if(_profile.lang) patch.lang=_profile.lang; if(_profile.country) patch.country=_profile.country;
        if(_profile.gender) patch.gender=_profile.gender; if(_profile.avatarId!=null) patch.avatarId=_profile.avatarId;
        if(_profile.coverId!=null) patch.coverId=_profile.coverId;
        if(window._editAvatarId!=null) patch.avatarUrl=null; else if(_profile.avatarUrl) patch.avatarUrl=_profile.avatarUrl;
        if(window._editCoverId!=null) patch.coverUrl=null; else if(_profile.coverUrl) patch.coverUrl=_profile.coverUrl;
        await window._fbDb.collection('users').doc(uid).collection('profile').doc('data').set(patch,{merge:true});
        // Mirror public-facing fields (incl. cover/avatar) so others' Public Profile stays current
        try{
          var _pub={ displayName:_profile.displayName||null, hcpIndex:(_profile.hcpIndex!=null?_profile.hcpIndex:null), homeCourse:_profile.homeCourse||null, country:_profile.country||null, gender:_profile.gender||null, avatarId:(_profile.avatarId!=null?_profile.avatarId:null), avatarUrl:_profile.avatarUrl||null, coverId:(_profile.coverId!=null?_profile.coverId:null), coverUrl:_profile.coverUrl||null };
          await window._fbDb.collection('public_profiles').doc(uid).set(_pub,{merge:true});
        }catch(_pe){ console.warn('public_profiles sync', _pe); }
      }
    }catch(err){ console.warn('save profile', err); }
    if(typeof renderHomeScreen==='function') renderHomeScreen();
    if(typeof pmProfileAfterSave==='function') pmProfileAfterSave();   // v28: profile reminder goes silent once complete
    setTimeout(function(){ if(document.getElementById('screen-profile')) showScreen('profile'); else screenBack(); }, 650);
  };
})();

function renderEditProfile(ROOT){
  ROOT=ROOT||document.getElementById('screen-editprofile'); if(!ROOT) return;
  var prof=_profile||{}; var AV=(typeof AVATARS!=='undefined')?AVATARS:{};
  var setv=function(id,val){ var e=document.getElementById(id); if(e&&val!=null) e.value=val; };
  setv('f-nickname', prof.displayName||'');
  setv('f-username', prof.username||((prof.displayName||'').toLowerCase().replace(/\s+/g,'')));
  setv('f-hcp', (prof.hcpIndex!=null)?prof.hcpIndex:'');
  setv('f-homeclub', prof.homeCourse||'');
  if(prof.lang) setv('f-lang', prof.lang);
  if(prof.country) setv('f-country', prof.country);
  if(prof.gender && typeof setGender==='function') setGender(prof.gender);
  else ['g-male','g-female','g-other'].forEach(function(id){ var el=document.getElementById(id); if(el) el.classList.remove('active'); });   // v28: nothing saved = nothing selected
  if(typeof pmProfileMarkMissing==='function') pmProfileMarkMissing();
  var im=document.getElementById('main-avatar'); if(im) im.src = prof.avatarUrl || (prof.avatarId&&AV[prof.avatarId]) || 'icons/home-crown.png';
  var bn=document.getElementById('bannerImg');
  if(bn){
    var coverSrc = prof.coverUrl || (prof.coverId && typeof COVERS!=='undefined' && COVERS[prof.coverId]) || null;
    if(coverSrc){ bn.src=coverSrc; bn.style.display='block'; }
  }
  window._editAvatarId = prof.avatarUrl ? null : ((prof.avatarId!=null)?prof.avatarId:null);
  window._editGender = prof.gender||null;
  window._avatarPage = 0;
  if(typeof window.renderEpAvatarGrid==='function') window.renderEpAvatarGrid();

  window._editCoverId = prof.coverUrl ? null : ((prof.coverId!=null)?prof.coverId:null);
  window._coverPage = 0;
  if(typeof window.renderEpCoverGrid==='function') window.renderEpCoverGrid();
}

// ── Profile cluster: Buddy Profile (screen-buddyprofile) ──
function renderBuddyProfile(ROOT){
  ROOT=ROOT||document.getElementById('screen-buddyprofile'); if(!ROOT) return;
  var b=window._activeBuddy||{}; var AV=(typeof AVATARS!=='undefined')?AVATARS:{};
  var set=function(sel,val){ var e=ROOT.querySelector(sel); if(e) e.textContent=val; };
  var av=ROOT.querySelector('.avatar-wrap img'); if(av) av.src = b.avatarUrl || (b.avatarId&&AV[b.avatarId]) || 'icons/home-crown.png';
  set('.profile-name', b.name||'Buddy');
  var _bun=ROOT.querySelector('.profile-username'); if(_bun){ _bun.textContent=''; _bun.style.display='none'; }
  var metas=ROOT.querySelectorAll('.profile-meta-item');
  var setMeta=function(el,txt){ if(!el) return; var svg=el.querySelector('svg'); el.innerHTML=(svg?svg.outerHTML:'')+' '+txt; };
  if(metas[0]) setMeta(metas[0], b.homeCourse||'\u2014');
  if(metas[1]) setMeta(metas[1], b.addedAt?('Buddy since '+new Date(b.addedAt).toLocaleDateString('en-GB',{month:'short',year:'numeric'})):'Buddy');
  set('.tier-badge', b.tier||'Free');
  set('.hcp-value', (b.hcp!=null&&!isNaN(b.hcp))?Number(b.hcp).toFixed(1):'\u2014');
  set('.hcp-course-name', b.homeCourse||'\u2014');
  ROOT.querySelectorAll('.stats-grid .stat-value').forEach(function(e){ e.textContent='\u2013'; });
  if(b.uid && typeof _loadBuddyStatsInto==='function') _loadBuddyStatsInto(b.uid, ROOT);
  var primary=ROOT.querySelector('.action-btn.primary'); if(primary){ var _bpSvg=primary.querySelector('svg'); primary.innerHTML=(_bpSvg?_bpSvg.outerHTML:'')+' Remove Buddy'; primary.onclick=function(){ if(typeof removeBuddy==='function') removeBuddy(b.uid); if(typeof screenBack==='function') screenBack(); }; }
  var secondary=ROOT.querySelector('.action-btn.secondary'); if(secondary) secondary.onclick=function(){ if(typeof openChatWith==='function' && b.uid){ var _cav=(typeof _avatarFor==='function')?_avatarFor(b):(b.avatarUrl||(b.avatarId&&AV[b.avatarId])||null); openChatWith({ uid:b.uid, name:(b.name||b.displayName||'\u2014'), avatar:_cav }); } else if(typeof showToast==='function'){ showToast('No buddy selected.','error'); } };
}

// Loads the buddy's Rounds/Matches/Wins/Teams/Buddies/Win-rate + Best Result from their
// own subcollections (readable per the public-profile rules) and fills the stats grid.
async function _loadBuddyStatsInto(buddyUid, ROOT){
  if(!buddyUid || !window._fbDb || !ROOT) return;
  var safe=function(p){ return p.catch(function(){ return null; }); };
  try{
    var res=await Promise.all([
      safe(window._fbDb.collection('users').doc(buddyUid).collection('rounds').get()),
      safe(window._fbDb.collection('users').doc(buddyUid).collection('teams').get()),
      safe(window._fbDb.collection('users').doc(buddyUid).collection('buddies').get())
    ]);
    var roundsS=res[0], teamsS=res[1], buddiesS=res[2];
    var all=roundsS?roundsS.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); }):[];
    var _st=pmRoundStats(all, buddyUid), rounds=_st.rounds, matches=_st.matches, wins=_st.wins;
    var teams=teamsS?teamsS.size:0;
    var buddies=buddiesS?buddiesS.size:0;
    var winRate=matches.length? Math.round(wins/matches.length*100)+'%' : '\u2014';
    var vals=[rounds.length, matches.length, wins, teams, buddies, winRate];
    var sv=ROOT.querySelectorAll('.stats-grid .stat-value');
    sv.forEach(function(e,i){ if(vals[i]!=null) e.textContent=vals[i]; });
    // Best result (best round by vs par)
    var bc=ROOT.querySelector('.best-card');
    if(bc){
      var best=pmBestRound(rounds);
      if(best){
        var course=bc.querySelector('.best-course, .best-name'); if(course) course.textContent=best.courseName||'Course';
        var meta=bc.querySelector('.best-meta');
        if(meta){ var hh=best.holes||((best.par||[]).length||9); var parts=[hh+'H']; if(best.format) parts.push(best.format); if(best.teamName) parts.push(best.teamName); if(best.playedAt) parts.push(new Date(best.playedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})); meta.textContent=parts.join(' \u00b7 '); }
        var score=bc.querySelector('.best-score, .best-value, .best-gross'); if(score) score.textContent=(best._vs>0?'+'+best._vs:best._vs);
        bc.style.display='';
      } else { bc.style.display='none'; }
    }
    if(typeof pmRenderBestMatch==='function') pmRenderBestMatch(ROOT, matches, buddyUid);   // v35: Best Result · Match Play
  }catch(e){ console.warn('_loadBuddyStatsInto', e); }
}

/* ===== v38 App theme: Green (default) or Black =====
   The choice lives in localStorage 'pmTheme' (read by the inline <head> script before the
   first paint) and in users/{uid}/profile/data.theme (merge), so it follows the account. */
function pmGetTheme(){ return document.documentElement.getAttribute('data-theme')==='black' ? 'black' : 'green'; }
function pmApplyTheme(t){
  t = (t==='black') ? 'black' : 'green';
  if(t==='black') document.documentElement.setAttribute('data-theme','black');
  else document.documentElement.removeAttribute('data-theme');
  var m=document.querySelector('meta[name="theme-color"]'); if(m) m.setAttribute('content', t==='black' ? '#0a0a0a' : '#0a1a10');
  try{ localStorage.setItem('pmTheme', t); }catch(e){}
  pmSyncThemePicker();
  return t;
}
function pmSyncThemePicker(){
  var cur=pmGetTheme();
  document.querySelectorAll('.pm-theme-opt').forEach(function(b){
    var on=(b.getAttribute('data-theme-opt')===cur);
    b.classList.toggle('active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
function pmSetTheme(t){
  t=pmApplyTheme(t);
  if(typeof _profile!=='undefined'){ _profile=_profile||{}; _profile.theme=t; }
  try{
    var u=window._fbAuth&&window._fbAuth.currentUser;
    if(u&&window._fbDb) window._fbDb.collection('users').doc(u.uid).collection('profile').doc('data').set({theme:t},{merge:true}).catch(function(e){ console.warn('theme save failed', e); });
  }catch(e){ console.warn('theme save failed', e); }
}

// -- Profile cluster: Account Settings (screen-settings) --

(function(){
  // ── Toggle inline edit panels ──
  window.toggleEdit = function(field) {
    const nameEdit  = document.getElementById('name-edit');
    const emailEdit = document.getElementById('email-edit');
    if (field === 'name') {
      const open = nameEdit.classList.contains('visible');
      nameEdit.classList.toggle('visible', !open);
      emailEdit.classList.remove('visible');
    } else {
      const open = emailEdit.classList.contains('visible');
      emailEdit.classList.toggle('visible', !open);
      nameEdit.classList.remove('visible');
      if (!open && typeof pmEmailEditPrep === 'function') pmEmailEditPrep();
    }
  };

  window.cancelEdit = function(field) {
    document.getElementById(field + '-edit').classList.remove('visible');
  };

  // ── Save name ──
  window.saveName = function() {
    const first = document.getElementById('input-firstname').value.trim();
    const last  = document.getElementById('input-lastname').value.trim();
    if (!first && !last) return;
    const full = [first, last].filter(Boolean).join(' ');
    document.getElementById('name-display').textContent = full;
    // Also update account header
    document.querySelector('.acct-name').textContent = full;
    document.getElementById('name-edit').classList.remove('visible');
  };

  // ── v32: the old 6-digit "verification" was only on screen (no code was ever sent and any code
  // was accepted). Replaced by pmSendEmailChange() below: a real Firebase confirmation link.
  window.sendVerification = function() { if (typeof pmSendEmailChange === 'function') pmSendEmailChange(); };
  window.onDigit = function() {};
  window.confirmCode = function() { if (typeof window.closeVerify === 'function') window.closeVerify(); };   // never changes anything
  window.resendCode = function() {};

  // ── Close overlay ──
  window.closeVerify = function() {
    var ov = document.getElementById('verifyOverlay'); if (ov) ov.classList.remove('visible');
  };
})();

(function(){ var _o=window.saveName; window.saveName=function(){ if(_o)_o(); var nd=document.getElementById('name-display'); if(nd){ _profile=_profile||{}; _profile.displayName=nd.textContent; try{ var uid=window._fbAuth&&window._fbAuth.currentUser&&window._fbAuth.currentUser.uid; if(uid&&window._fbDb) window._fbDb.collection('users').doc(uid).collection('profile').doc('data').set({displayName:_profile.displayName},{merge:true}); }catch(e){} if(typeof renderHomeScreen==='function') renderHomeScreen(); } }; })();
function renderAccountSettings(ROOT){
  ROOT=ROOT||document.getElementById('screen-settings'); if(!ROOT) return;
  pmSyncThemePicker();   // v38
  var prof=_profile||{}; var AV=(typeof AVATARS!=='undefined')?AVATARS:{}; var cu=window._fbAuth&&window._fbAuth.currentUser;
  var q=function(s){return ROOT.querySelector(s);};
  if(q('.acct-name')) q('.acct-name').textContent=prof.displayName||'Player';
  if(q('.acct-email')) q('.acct-email').textContent=(cu&&cu.email)||prof.email||'';
  if(q('.acct-tier')) q('.acct-tier').textContent=prof.tier||'Free';
  if(q('.acct-avatar img')) q('.acct-avatar img').src=prof.avatarUrl||(prof.avatarId&&AV[prof.avatarId])||'icons/home-crown.png';
  var _ah=q('.account-header');
  if(_ah){ var _covSrc=prof.coverUrl || (prof.coverId && typeof COVERS!=='undefined' && COVERS[prof.coverId]) || null; if(_covSrc){ _ah.style.backgroundImage="linear-gradient(160deg,rgba(var(--pm-brand-rgb),0.82),rgba(var(--pm-brand-dark-rgb),0.92)), url('"+_covSrc+"')"; _ah.style.backgroundSize='cover'; _ah.style.backgroundPosition='center'; } else { _ah.style.backgroundImage=''; } }
  if(q('#name-display')) q('#name-display').textContent=prof.displayName||'Player';
  if(q('#email-display')) q('#email-display').textContent=(cu&&cu.email)||prof.email||'';
  var parts=(prof.displayName||'').split(' ');
  var fn=document.getElementById('input-firstname'); if(fn) fn.value=parts[0]||'';
  var ln=document.getElementById('input-lastname'); if(ln) ln.value=parts.slice(1).join(' ')||'';

  // ── Reflect real state + wire action rows (idempotent) ──
  var providers=(cu&&cu.providerData||[]).map(function(p){return p&&p.providerId;});
  var hasGoogle=providers.indexOf('google.com')>=0;
  var pushOn=(prof.notif&&typeof prof.notif.push==='boolean')?prof.notif.push:true;
  var emailOn=(prof.notif&&typeof prof.notif.email==='boolean')?prof.notif.email:false;
  ROOT.querySelectorAll('.settings-row').forEach(function(row){
    var lblEl=row.querySelector('.row-label')||row.querySelector('.danger-label');
    var lbl=(lblEl?lblEl.textContent:'').trim();
    row.style.cursor='pointer';
    if(lbl==='Change Password'){ row.onclick=pmChangePassword; }
    else if(lbl==='Google Sign-In'){
      row.onclick=pmToggleGoogle;
      var sub=row.querySelector('.row-sublabel'); var badge=row.querySelector('.row-badge');
      var gp=(cu&&cu.providerData||[]).filter(function(p){return p&&p.providerId==='google.com';})[0];
      if(sub) sub.textContent=hasGoogle?((gp&&gp.email)||(cu&&cu.email)||''):'Tap to connect';
      if(badge){ badge.textContent=hasGoogle?'Connected':'Connect'; badge.classList.toggle('connected',hasGoogle); }
    }
    else if(lbl==='Push Notifications'){ row.onclick=function(){ pmToggleNotif('push',row); }; var t1=row.querySelector('.toggle'); if(t1) t1.classList.toggle('on',pushOn); }
    else if(lbl==='Email Notifications'){ row.onclick=function(){ pmToggleNotif('email',row); }; var t2=row.querySelector('.toggle'); if(t2) t2.classList.toggle('on',emailOn); }
    else if(lbl==='Current Plan'){ row.onclick=pmOpenPlan; var pb=row.querySelector('.row-badge'); if(pb) pb.textContent=prof.tier||'Free'; }
    else if(lbl==='Remove Account'){ row.onclick=function(){ if(typeof requestDataDeletion==='function') requestDataDeletion(); }; }
  });
  var so=ROOT.querySelector('.signout-btn'); if(so) so.onclick=function(){ if(typeof doSignOut==='function') doSignOut(); };
}

// ── Account Settings action handlers ──
function pmChangePassword(){
  var cu=window._fbAuth&&window._fbAuth.currentUser;
  if(!cu){ if(typeof showToast==='function') showToast('Please sign in first'); return; }
  var hasPwd=(cu.providerData||[]).some(function(p){return p&&p.providerId==='password';});
  if(!hasPwd){ if(typeof showToast==='function') showToast('You sign in with Google \u2014 no password to change'); return; }
  if(!cu.email){ if(typeof showToast==='function') showToast('No email on file'); return; }
  window._fbAuth.sendPasswordResetEmail(cu.email)
    .then(function(){ if(typeof showToast==='function') showToast('Password reset link sent to '+cu.email); })
    .catch(function(e){ console.warn('pwd reset',e); if(typeof showToast==='function') showToast('Could not send reset email'); });
}
function pmToggleGoogle(){
  var cu=window._fbAuth&&window._fbAuth.currentUser;
  if(!cu){ if(typeof showToast==='function') showToast('Please sign in first'); return; }
  var providers=(cu.providerData||[]).map(function(p){return p&&p.providerId;});
  var hasGoogle=providers.indexOf('google.com')>=0;
  if(hasGoogle){
    if(providers.length<=1){ if(typeof showToast==='function') showToast('Google is your only sign-in \u2014 set a password first'); return; }
    if(!confirm('Disconnect Google sign-in from this account?')) return;
    cu.unlink('google.com')
      .then(function(){ if(typeof showToast==='function') showToast('Google disconnected'); renderAccountSettings(); })
      .catch(function(e){ console.warn(e); if(typeof showToast==='function') showToast('Could not disconnect Google'); });
  } else {
    var prov=window._fbGoogleProvider||new firebase.auth.GoogleAuthProvider();
    cu.linkWithPopup(prov)
      .then(function(){ if(typeof showToast==='function') showToast('Google connected'); renderAccountSettings(); })
      .catch(function(e){ console.warn(e); if(typeof showToast==='function') showToast('Could not connect Google'); });
  }
}
function pmToggleNotif(kind,row){
  var tgl=row.querySelector('.toggle'); if(!tgl) return;
  var turningOn=!tgl.classList.contains('on');
  if(kind==='push' && turningOn && ('Notification' in window)){
    try{ Notification.requestPermission().then(function(perm){ if(perm!=='granted' && typeof showToast==='function') showToast('Enable notifications in your browser settings'); }); }catch(e){}
  }
  tgl.classList.toggle('on',turningOn);
  _profile=_profile||{}; _profile.notif=_profile.notif||{}; _profile.notif[kind]=turningOn;
  try{
    var uid=window._fbAuth&&window._fbAuth.currentUser&&window._fbAuth.currentUser.uid;
    if(uid&&window._fbDb){ var patch={notif:{}}; patch.notif[kind]=turningOn; window._fbDb.collection('users').doc(uid).collection('profile').doc('data').set(patch,{merge:true}); }
  }catch(e){}
}
function pmOpenPlan(){
  showScreen('subscription');
  renderSubscription();
}

function _fmtDate(v){
  if(!v) return null;
  var d = (v && v.toDate) ? v.toDate() : new Date(v);
  if(isNaN(d.getTime())) return null;
  try { return d.toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' }); }
  catch(e){ return d.toISOString().slice(0,10); }
}

function renderSubscription(){
  var root = document.getElementById('screen-subscription');
  if(!root) return;
  var prof = (typeof _profile!=='undefined' && _profile) ? _profile : {};
  var isPro = (typeof isProUser==='function') && isProUser();
  var body = root.querySelector('.body-area');
  if(!body) return;

  if(!isPro){
    // Free user — show upgrade CTA
    body.innerHTML =
      '<div class="sub-card">' +
        '<div class="sub-status-badge free">FREE PLAN</div>' +
        '<div class="sub-title">You\u2019re on the Free plan</div>' +
        '<div class="sub-desc">Upgrade to Pro for unlimited teams, buddies, full match history, course editing, custom photos and in-app messaging.</div>' +
        '<button class="sub-cta" onclick="startProCheckout()">Upgrade to Pro</button>' +
      '</div>';
    return;
  }

  var since = _fmtDate(prof.proSince || prof.proSinceIso);
  var cancelled = !!prof.proCancelled;
  var endsAt = _fmtDate(prof.proEndsAt);
  var source = prof.proSource || '';
  var sourceLabel = source === 'launch' ? 'Launch price' : (source === 'launch-first-50' ? 'Founder (free Pro)' : (source === 'standard' ? 'Standard' : ''));

  var rows = '';
  rows += '<div class="sub-row"><span class="sub-row-label">Status</span><span class="sub-row-val ' + (cancelled?'warn':'ok') + '">' + (cancelled ? 'Cancelled — active until end date' : 'Active') + '</span></div>';
  if(since)  rows += '<div class="sub-row"><span class="sub-row-label">Activated</span><span class="sub-row-val">' + since + '</span></div>';
  if(sourceLabel) rows += '<div class="sub-row"><span class="sub-row-label">Plan</span><span class="sub-row-val">' + sourceLabel + '</span></div>';
  rows += '<div class="sub-row"><span class="sub-row-label">Auto-renew</span><span class="sub-row-val ' + (cancelled?'warn':'ok') + '">' + (cancelled ? 'Off' : 'On') + '</span></div>';
  if(cancelled && endsAt) rows += '<div class="sub-row"><span class="sub-row-label">Pro access until</span><span class="sub-row-val">' + endsAt + '</span></div>';

  var actionArea;
  if(cancelled){
    actionArea =
      '<div class="sub-cancelled-note">' +
        'Your Pro plan is cancelled and will not renew.' + (endsAt ? ' You can keep using all Pro features until <b>' + endsAt + '</b>, after which your account returns to the Free plan.' : '') +
      '</div>';
  } else {
    actionArea = '<button class="sub-cancel-btn" onclick="subConfirmCancel()">Cancel Pro plan</button>';
  }

  body.innerHTML =
    '<div class="sub-card">' +
      '<div class="sub-status-badge pro">PRO PLAN</div>' +
      '<div class="sub-title">Parmate Pro</div>' +
      '<div class="sub-rows">' + rows + '</div>' +
    '</div>' +
    '<div class="sub-action-wrap">' + actionArea + '</div>';
}

// ── Cancel flow: button -> confirm popup (Yes/No) -> call function -> end message ──
function subConfirmCancel(){
  var ov = document.getElementById('subCancelConfirm');
  if(ov) ov.classList.add('visible');
}
function subCloseConfirm(){
  var ov = document.getElementById('subCancelConfirm');
  if(ov) ov.classList.remove('visible');
}
async function subDoCancel(){
  subCloseConfirm();
  var user = window._fbAuth && window._fbAuth.currentUser;
  if(!user){ if(typeof showToast==='function') showToast('Sign in first.', 'error'); return; }
  try{
    if(typeof showToast==='function') showToast('Cancelling…');
    var idToken = await user.getIdToken();
    var res = await fetch('/.netlify/functions/cancel-mollie-subscription', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ idToken: idToken }),
    });
    var data = await res.json();
    if(res.ok && (data.cancelled || data.alreadyCancelled)){
      // reflect locally so the screen updates without a reload
      if(typeof _profile!=='undefined' && _profile){
        _profile.proCancelled = true;
        _profile.proAutoRenew = false;
        if(data.proEndsAt) _profile.proEndsAt = data.proEndsAt;
      }
      var endsStr = _fmtDate(data.proEndsAt);
      subShowEndMessage(endsStr);
      renderSubscription();
    } else {
      if(typeof showToast==='function') showToast((data && data.message) || 'Could not cancel — please try again.', 'error');
    }
  }catch(err){
    console.error('subDoCancel error:', err);
    if(typeof showToast==='function') showToast('Something went wrong — please try again.', 'error');
  }
}
function subShowEndMessage(endsStr){
  var ov = document.getElementById('subEndMessage');
  if(!ov) return;
  var msgEl = document.getElementById('subEndMessageText');
  if(msgEl){
    msgEl.innerHTML = 'Your Pro plan has been cancelled and will not renew.' +
      (endsStr ? '<br><br>You can keep using all Pro features until <b>' + endsStr + '</b>. After that, your account will switch to the Free plan.' : '');
  }
  ov.classList.add('visible');
}
function subCloseEndMessage(){
  var ov = document.getElementById('subEndMessage');
  if(ov) ov.classList.remove('visible');
}

async function startProCheckout() {
  var user = window._fbAuth && window._fbAuth.currentUser;
  if (!user) {
    if (typeof showToast === 'function') showToast('Sign in first to upgrade.', 'error');
    return;
  }
  try {
    if (typeof showToast === 'function') showToast('Opening checkout…');
    var idToken = await user.getIdToken();
    var res = await fetch('/.netlify/functions/create-mollie-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: idToken }),
    });
    var data = await res.json();
    if (data.url) {
      window.location.href = data.url; // redirect to Mollie's hosted checkout
    } else {
      if (typeof showToast === 'function') showToast('Could not start checkout — please try again.', 'error');
    }
  } catch (err) {
    console.error('startProCheckout error:', err);
    if (typeof showToast === 'function') showToast('Something went wrong — please try again.', 'error');
  }
}

// ── Admin FAQ Manager (screen-faqadmin) ──

(function(){
  // ════════════════════════════════════════════════
  //  DEMO DATA — in production this is read from Firestore:
  //    db.collection('faq_articles').orderBy('order').get()
  // ════════════════════════════════════════════════
  const CATEGORIES = {
    whs:     'WHS & Handicaps',
    playing: 'Playing a Round',
    teams:   'Teams & Buddies',
    account: 'Account'
  };

  let articles = [
    {
      id: 'scramble-calc', categoryId: 'whs',
      question_en: 'How does Parmate calculate scramble handicaps?',
      question_nl: 'Hoe berekent Parmate scramble handicaps?',
      readTime: 2, order: 1, isPopular: true,
      body_en: [
        { type:'p', text:'Parmate calculates every team handicap using the official WHS formula, then applies the correct scramble allowances.' },
        { type:'h3', text:'The WHS course handicap formula' },
        { type:'formula', text:'Course HCP = Index × (Slope ÷ 113) + (Rating − Par)' },
        { type:'steps', items:['Lowest course handicap contributes 35%','Second-lowest contributes 15%','Third & fourth contribute 15% each'] },
        { type:'tip', text:'Organisers can adjust allowances in the Event Manager.' }
      ],
      body_nl: []
    },
    {
      id: 'start-round', categoryId: 'playing',
      question_en: 'How do I start a team round?',
      question_nl: 'Hoe start ik een teamronde?',
      readTime: 2, order: 1, isPopular: true,
      body_en: [{ type:'p', text:'Tap PLAY GOLF, choose your course, pick your team and tee, and Parmate builds your scramble scorecard.' }],
      body_nl: []
    },
    {
      id: 'add-guest', categoryId: 'teams',
      question_en: 'How do I add a guest player?',
      question_nl: 'Hoe voeg ik een gastspeler toe?',
      readTime: 1, order: 1, isPopular: true,
      body_en: [{ type:'p', text:'When creating a team, tap the + Guest chip and enter the guest name and WHS handicap index.' }],
      body_nl: []
    },
    {
      id: 'change-email', categoryId: 'account',
      question_en: 'How do I change my email address?',
      question_nl: 'Hoe wijzig ik mijn e-mailadres?',
      readTime: 1, order: 1, isPopular: false,
      body_en: [{ type:'p', text:'Go to Account Settings, tap the edit icon next to your email, and confirm the change with the verification code.' }],
      body_nl: []
    }
  ];

  let editingId = null;   // null = creating new
  let curLang = 'en';
  let workingBlocks = []; // blocks for the language currently shown

  // ───── LIST VIEW ─────
  window.renderList = function() {
    const term = (document.getElementById('listSearch').value || '').trim().toLowerCase();
    const container = document.getElementById('listContent');
    container.innerHTML = '';

    Object.keys(CATEGORIES).forEach(catId => {
      const inCat = articles
        .filter(a => a.categoryId === catId)
        .filter(a => !term || a.question_en.toLowerCase().includes(term))
        .sort((a,b) => a.order - b.order);
      if (!inCat.length) return;

      const block = document.createElement('div');
      block.className = 'cat-block';
      block.innerHTML = '<div class="cat-head">' + CATEGORIES[catId] +
        '<span class="cat-count">' + inCat.length + '</span></div>';

      inCat.forEach(a => {
        const item = document.createElement('div');
        item.className = 'article-item';
        const popHtml = a.isPopular
          ? '<span class="ai-pop"><svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Featured</span>'
          : '';
        item.innerHTML =
          '<div class="ai-main" onclick="editArticle(\'' + a.id + '\')">' +
            '<div class="ai-q">' + a.question_en + '</div>' +
            '<div class="ai-meta">' + a.readTime + ' min read' + (popHtml ? ' · ' : '') + popHtml + '</div>' +
          '</div>' +
          '<div class="ai-actions">' +
            '<button class="ai-btn edit" onclick="editArticle(\'' + a.id + '\')"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
            '<button class="ai-btn del" onclick="deleteArticle(\'' + a.id + '\')"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>' +
          '</div>';
        block.appendChild(item);
      });
      container.appendChild(block);
    });

    if (!container.innerHTML) {
      container.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text-3);font-family:Inter;font-size:14px;">No articles found.</div>';
    }
  };

  window.showList = function() {
    document.getElementById('listView').classList.remove('hidden');
    document.getElementById('editorView').classList.remove('active');
    document.getElementById('subTitle').textContent = 'FAQ Manager';
    document.getElementById('subBtns').innerHTML = '<button class="pill green" onclick="newArticle()">+ New</button>';
    renderList();
  };

  // ───── EDITOR ─────
  function openEditor(title) {
    document.getElementById('listView').classList.add('hidden');
    document.getElementById('editorView').classList.add('active');
    document.getElementById('subTitle').textContent = title;
    document.getElementById('subBtns').innerHTML = '<button class="pill ghost" onclick="showList()">Back</button>';
  }

  window.newArticle = function() {
    editingId = null;
    curLang = 'en';
    document.getElementById('edCategory').value = 'whs';
    document.getElementById('edQuestionEn').value = '';
    document.getElementById('edQuestionNl').value = '';
    document.getElementById('edReadTime').value = 2;
    document.getElementById('edOrder').value = 1;
    document.getElementById('edFeatured').classList.remove('on');
    workingBlocks = { en: [], nl: [] };
    switchLang('en');
    renderBlocks();
    openEditor('New Article');
  };

  window.editArticle = function(id) {
    const a = articles.find(x => x.id === id);
    if (!a) return;
    editingId = id;
    curLang = 'en';
    document.getElementById('edCategory').value = a.categoryId;
    document.getElementById('edQuestionEn').value = a.question_en || '';
    document.getElementById('edQuestionNl').value = a.question_nl || '';
    document.getElementById('edReadTime').value = a.readTime || 2;
    document.getElementById('edOrder').value = a.order || 1;
    document.getElementById('edFeatured').classList.toggle('on', !!a.isPopular);
    // deep-copy blocks per language
    workingBlocks = {
      en: JSON.parse(JSON.stringify(a.body_en || [])),
      nl: JSON.parse(JSON.stringify(a.body_nl || []))
    };
    switchLang('en');
    renderBlocks();
    openEditor('Edit Article');
  };

  window.deleteArticle = function(id) {
    const a = articles.find(x => x.id === id);
    if (!a) return;
    if (!confirm('Delete "' + a.question_en + '"? This cannot be undone.')) return;
    // PRODUCTION: db.collection('faq_articles').doc(id).delete();
    articles = articles.filter(x => x.id !== id); try{ if(window._fbDb) window._fbDb.collection('faq_articles').doc(id).delete(); }catch(e){}
    window._faqLoaded=false;
    renderList();
    toast('Article deleted');
  };

  window.switchLang = function(lang) {
    // persist current textareas into workingBlocks before switching
    syncBlocksFromDOM();
    curLang = lang;
    document.querySelectorAll('.lang-tab').forEach(t => t.classList.toggle('active', t.dataset.lang === lang));
    document.getElementById('edQuestionEn').style.display = lang === 'en' ? 'block' : 'none';
    document.getElementById('edQuestionNl').style.display = lang === 'nl' ? 'block' : 'none';
    document.getElementById('blockLang').textContent = lang.toUpperCase();
    renderBlocks();
  };

  // ───── BLOCK BUILDER ─────
  function renderBlocks() {
    const c = document.getElementById('blocksContainer');
    c.innerHTML = '';
    const blocks = workingBlocks[curLang];
    blocks.forEach((b, i) => c.appendChild(buildBlockEl(b, i)));
  }

  function buildBlockEl(b, i) {
    const el = document.createElement('div');
    el.className = 'block';
    const typeNames = { p:'Paragraph', h3:'Heading', formula:'Formula', steps:'Step list', tip:'Tip' };
    let inner =
      '<div class="block-head">' +
        '<span class="block-type ' + b.type + '">' + typeNames[b.type] + '</span>' +
        '<div class="block-ctrl">' +
          (i>0 ? '<button class="bc-btn" onclick="moveBlock('+i+',-1)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg></button>' : '') +
          '<button class="bc-btn" onclick="moveBlock('+i+',1)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></button>' +
          '<button class="bc-btn del" onclick="removeBlock('+i+')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
        '</div>' +
      '</div>';

    if (b.type === 'steps') {
      inner += '<div class="steps-wrap" data-block="'+i+'">';
      (b.items || []).forEach((s, si) => {
        inner += '<div class="step-input-row">' +
          '<input class="step-input" value="'+escapeAttr(s)+'" oninput="updateStep('+i+','+si+',this.value)">' +
          '<button class="step-del" onclick="removeStep('+i+','+si+')">✕</button></div>';
      });
      inner += '</div><button class="add-step-btn" onclick="addStep('+i+')">+ Add step</button>';
    } else {
      const mono = b.type === 'formula' ? ' mono' : '';
      const ph = { p:'Paragraph text...', h3:'Section heading...', formula:'Course HCP = Index × ...', tip:'Tip text...' }[b.type];
      inner += '<textarea class="block-textarea'+mono+'" placeholder="'+ph+'" oninput="updateBlock('+i+',this.value)">'+escapeHtml(b.text || '')+'</textarea>';
    }
    el.innerHTML = inner;
    return el;
  }

  window.addBlock = function(type) {
    syncBlocksFromDOM();
    const nb = type === 'steps' ? { type, items:[''] } : { type, text:'' };
    workingBlocks[curLang].push(nb);
    renderBlocks();
  };
  window.removeBlock = function(i) {
    syncBlocksFromDOM();
    workingBlocks[curLang].splice(i,1);
    renderBlocks();
  };
  window.moveBlock = function(i, dir) {
    syncBlocksFromDOM();
    const arr = workingBlocks[curLang];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    renderBlocks();
  };
  window.updateBlock = function(i, val) { workingBlocks[curLang][i].text = val; };
  window.addStep = function(i) { syncBlocksFromDOM(); workingBlocks[curLang][i].items.push(''); renderBlocks(); };
  window.removeStep = function(i, si) { syncBlocksFromDOM(); workingBlocks[curLang][i].items.splice(si,1); renderBlocks(); };
  window.updateStep = function(i, si, val) { workingBlocks[curLang][i].items[si] = val; };

  // Read current DOM inputs back into workingBlocks (so nothing is lost on re-render / lang switch)
  function syncBlocksFromDOM() {
    const blocks = workingBlocks[curLang];
    const els = document.querySelectorAll('#blocksContainer .block');
    els.forEach((el, i) => {
      if (!blocks[i]) return;
      if (blocks[i].type === 'steps') {
        const stepInputs = el.querySelectorAll('.step-input');
        blocks[i].items = Array.from(stepInputs).map(s => s.value);
      } else {
        const ta = el.querySelector('.block-textarea');
        if (ta) blocks[i].text = ta.value;
      }
    });
  }

  // ───── SAVE ─────
  window.saveArticle = function() {
    syncBlocksFromDOM();
    const qEn = document.getElementById('edQuestionEn').value.trim();
    if (!qEn) { document.getElementById('edQuestionEn').focus(); document.getElementById('edQuestionEn').style.borderColor = 'var(--red)'; return; }

    const data = {
      categoryId: document.getElementById('edCategory').value,
      question_en: qEn,
      question_nl: document.getElementById('edQuestionNl').value.trim(),
      readTime: parseInt(document.getElementById('edReadTime').value) || 2,
      order: parseInt(document.getElementById('edOrder').value) || 1,
      isPopular: document.getElementById('edFeatured').classList.contains('on'),
      body_en: JSON.parse(JSON.stringify(workingBlocks.en)),
      body_nl: JSON.parse(JSON.stringify(workingBlocks.nl))
    };

    if (editingId) {
      // PRODUCTION: db.collection('faq_articles').doc(editingId).set(data, {merge:true});
      const idx = articles.findIndex(a => a.id === editingId);
      articles[idx] = Object.assign({ id: editingId }, data); try{ if(window._fbDb) window._fbDb.collection('faq_articles').doc(editingId).set(data,{merge:true}); }catch(e){}
    } else {
      // PRODUCTION: db.collection('faq_articles').add(data);  (Firestore auto-id)
      const id = qEn.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,40) || ('faq-' + Date.now());
      articles.push(Object.assign({ id }, data)); try{ if(window._fbDb) window._fbDb.collection('faq_articles').doc(id).set(data); }catch(e){}
    }
    window._faqLoaded=false;
    showList();
    toast(editingId ? 'Article updated' : 'Article created');
  };

  function toast(msg) {
    const t = document.getElementById('faqAdminToast');
    t.textContent = '✓ ' + msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
  }

  function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escapeAttr(s){ return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;'); }

  // init
  window._faqAdminLoad = function(){
    try{ if(window._fbDb){ window._fbDb.collection('faq_articles').orderBy('order').get().then(function(snap){ var arr=[]; snap.forEach(function(d){ arr.push(Object.assign({id:d.id}, d.data())); }); if(arr.length){ articles=arr; renderList(); } }).catch(function(){}); } }catch(e){}
    showList(); renderList();
  };
  renderList();
})();


// ── Round Detail (screen-rounddetail) ──
function renderRoundDetail(ROOT){
  ROOT=ROOT||document.getElementById('screen-rounddetail'); if(!ROOT) return;
  var r=window._activeRound||{};
  if(r.isMatch){ renderMatchDetail(ROOT, r); return; }
  if(typeof m1DetailHook==='function' && m1DetailHook(ROOT, r)) return;   // 1vs1 match (app-match.js)
  if(typeof soloIsRound==='function' && soloIsRound(r)){ soloRenderDetail(ROOT, r); return; }   // Solo Round (app-solo.js)
  // restore round chrome (a match view may have changed these)
  var _sub=ROOT.querySelector('.sub-header .title'); if(_sub) _sub.textContent='Round Detail';
  var _th=ROOT.querySelector('.sc-table thead tr'); if(_th) _th.innerHTML='<th>Hole</th><th>Par</th><th>Score</th><th>SI</th>';
  var _rlbl=ROOT.querySelectorAll('.stats-bar .stat-label'); var _rlt=['Gross','Par Played','vs Par','Holes']; _rlbl.forEach(function(e,i){ if(_rlt[i]) e.textContent=_rlt[i]; });
  var scores=r.scores||[]; var par=r.par||[]; var si=r.si||r.index||[];
  var n=Math.max(scores.length, par.length, (r.holes||0));
  var gross=scores.reduce(function(a,b){return a+(b||0);},0) || r.gross || 0;
  var parTot=par.reduce(function(a,b){return a+(b||0);},0) || r.parTotal || 0;
  var vs=gross-parTot;
  var fmtDate=function(d){ try{ return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }catch(e){ return ''; } };
  var set=function(sel,val){ var e=ROOT.querySelector(sel); if(e) e.textContent=val; };
  set('.meta-date', fmtDate(r.playedAt||r.date));
  set('.meta-course', r.courseName||'Course');
  var rows=ROOT.querySelectorAll('.round-meta-header .meta-row');
  if(rows[0]) rows[0].textContent=(r.loopName||'')+' \u00b7 '+(n||9)+' holes'+(r.tee?(' \u00b7 '+r.tee+' tee'):'');
  if(rows[1]) rows[1].textContent='Team: '+((r.teamName)||(r.team&&r.team.name)||'\u2014')+' \u00b7 Format: '+(r.format||'\u2014');
  set('.meta-thcp', (r.thcp!=null||((r.team&&r.team.hcp)!=null)) ? ('THCP '+((r.thcp!=null)?r.thcp:r.team.hcp)) : '');
  // stats bar
  var sc=ROOT.querySelectorAll('.stats-bar .stat-value');
  if(sc[0]) sc[0].textContent=gross||'\u2013';
  if(sc[1]) sc[1].textContent=parTot||'\u2013';
  if(sc[2]){ sc[2].textContent=gross?(vs>0?'+'+vs:vs):'\u2013'; sc[2].className='stat-value '+(vs>0?'neg':(vs<0?'pos':'')); }
  if(sc[3]) sc[3].textContent=(scores.filter(function(x){return x!=null;}).length)+'/'+(n||9);
  // scorecard tbody
  var tb=ROOT.querySelector('.sc-table tbody');
  if(tb && n){
    var html='';
    for(var i=0;i<n;i++){
      var pv=par[i], sv=scores[i], sival=si[i];
      var overCls=(sv!=null&&pv!=null&&sv>pv)?'over-par':'';
      var siCls=(sival!=null)?(sival<=6?'si-hard':(sival<=12?'si-avg':'si-easy')):'si-avg';
      html+='<tr><td>'+(i+1)+'</td><td>'+(pv!=null?pv:'\u2013')+'</td><td class="'+overCls+'">'+(sv!=null?sv:'\u2013')+'</td><td>'+(sival!=null?('<span class="si-badge '+siCls+'">'+sival+'</span>'):'\u2013')+'</td></tr>';
    }
    tb.innerHTML=html;
  }
}

// ── Match-play closeout notation from per-hole sequence (+1 A / -1 B / 0 / null) ──
function tmMatchPlayText(seq, n){
  var run=0;
  for(var i=0;i<seq.length;i++){
    if(seq[i]==null) continue;
    run+=seq[i];
    var remaining=n-(i+1);
    if(Math.abs(run)>remaining){
      var toPlay=remaining;
      return { winner: run>0?'A':'B', text: toPlay>0 ? (Math.abs(run)+'&'+toPlay) : (Math.abs(run)+' up') };
    }
  }
  if(run===0) return { winner:'AS', text:'All square' };
  return { winner: run>0?'A':'B', text: Math.abs(run)+' up' };
}

function renderMatchDetail(ROOT, r){
  ROOT=ROOT||document.getElementById('screen-rounddetail'); if(!ROOT) return;
  var A=r.teamA||{}, B=r.teamB||{};
  var par=r.par||[], si=r.si||[], sA=A.scores||[], sB=B.scores||[];
  var n=r.holes||Math.max(par.length, sA.length, sB.length)||9;
  var hA=(A.hcp!=null)?A.hcp:0, hB=(B.hcp!=null)?B.hcp:0;
  var esc2=(typeof esc==='function')?esc:function(x){return x;};
  var fmtDate=function(d){ try{ return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }catch(e){ return ''; } };
  var set=function(sel,val){ var e=ROOT.querySelector(sel); if(e) e.textContent=val; };

  var sub=ROOT.querySelector('.sub-header .title'); if(sub) sub.textContent='Match Detail';
  set('.meta-date', fmtDate(r.playedAt||r.date));
  set('.meta-course', r.courseName||'Course');
  var mrows=ROOT.querySelectorAll('.round-meta-header .meta-row');
  if(mrows[0]) mrows[0].textContent=(r.loopName||'')+' \u00b7 '+n+' holes \u00b7 Match';
  if(mrows[1]) mrows[1].textContent='vs '+(B.name||'Opponent')+' \u00b7 Format: '+(r.format||'\u2014');
  set('.meta-thcp', 'THCP '+(hA!=null?hA:'\u2013')+' vs '+(hB!=null?hB:'\u2013'));

  // stroke allocation to higher-hcp side, by SI (hardest first)
  var smA=new Array(n).fill(0), smB=new Array(n).fill(0);
  var diff=Math.round(Math.abs(hA-hB));
  var haveSI=si.length>=n && si.some(function(x){return x!=null;});
  if(haveSI && diff>0){
    var order=[]; for(var k=0;k<n;k++) order.push(k);
    order.sort(function(a,b){ return ((si[a]!=null?si[a]:99))-((si[b]!=null?si[b]:99)); });
    var recvA=(hA>=hB);
    for(var k=0;k<diff;k++){ var idx=order[k%n]; if(recvA) smA[idx]++; else smB[idx]++; }
  }

  var hr=Array.isArray(r.holeResults)?r.holeResults:null;
  var aWon=0,bWon=0,played=0, seq=[], rowHtml='';
  for(var i=0;i<n;i++){
    var pv=par[i];
    var x=(sA[i]!=null)?sA[i]:null, y=(sB[i]!=null)?sB[i]:null;
    var res=null;
    if(hr && hr[i]!=null){ res=hr[i]; }
    else if(x!=null && y!=null){ var na=x-smA[i], nb=y-smB[i]; res=(na<nb?1:(na>nb?-1:0)); }
    if(x!=null&&y!=null) played++;
    if(res===1) aWon++; else if(res===-1) bWon++;
    seq.push((x!=null&&y!=null)?(res||0):null);
    var starA=smA[i]>0?'<span style="color:#1a6b3c;font-weight:700;">*</span>':'';
    var starB=smB[i]>0?'<span style="color:#c85a4a;font-weight:700;">*</span>':'';
    var rcell,rbg,rcol;
    if(res===1){ rcell='\u25B2'; rbg='#1a6b3c'; rcol='#fff'; }
    else if(res===-1){ rcell='\u25BC'; rbg='#c85a4a'; rcol='#fff'; }
    else if(res===0 && x!=null&&y!=null){ rcell='='; rbg='#e9ece9'; rcol='#555'; }
    else { rcell='\u2013'; rbg='transparent'; rcol='var(--muted)'; }
    rowHtml+='<tr><td>'+(i+1)+'</td><td>'+(pv!=null?pv:'\u2013')+'</td>'
      +'<td>'+(x!=null?(x+starA):'\u2013')+'</td>'
      +'<td>'+(y!=null?(y+starB):'\u2013')+'</td>'
      +'<td style="background:'+rbg+';color:'+rcol+';font-weight:700;">'+rcell+'</td></tr>';
  }
  var sumA=sA.reduce(function(a,b){return a+(b||0);},0), sumB=sB.reduce(function(a,b){return a+(b||0);},0);
  rowHtml+='<tr class="totals-row"><td>SCORE</td><td></td><td>'+(sumA||'\u2013')+'</td><td>'+(sumB||'\u2013')+'</td><td></td></tr>';

  // headline: prefer saved result totals (ground truth) for the score line
  var rA=(r.result&&r.result.teamAWon!=null)?r.result.teamAWon:aWon;
  var rB=(r.result&&r.result.teamBWon!=null)?r.result.teamBWon:bWon;
  var won=(rA>rB), lost=(rA<rB);
  var mp=tmMatchPlayText(seq, n);

  var labels=ROOT.querySelectorAll('.stats-bar .stat-label');
  var vals=ROOT.querySelectorAll('.stats-bar .stat-value');
  if(labels[0]) labels[0].textContent='Result';
  if(vals[0]){ vals[0].textContent=rA+'\u2013'+rB; vals[0].className='stat-value'; }
  if(labels[1]) labels[1].textContent='Outcome';
  if(vals[1]){ vals[1].textContent=won?'WIN':(lost?'LOSS':'AS'); vals[1].className='stat-value '+(won?'pos':(lost?'neg':'')); }
  if(labels[2]) labels[2].textContent='Margin';
  if(vals[2]){ vals[2].textContent=(mp.winner==='AS')?'AS':mp.text; vals[2].className='stat-value'; }
  if(labels[3]) labels[3].textContent='Holes';
  if(vals[3]){ vals[3].textContent=played+'/'+n; vals[3].className='stat-value'; }

  var thead=ROOT.querySelector('.sc-table thead tr');
  if(thead) thead.innerHTML='<th>Hole</th><th>Par</th><th>'+esc2(A.name||'You')+'</th><th>'+esc2(B.name||'Opp')+'</th><th>Res</th>';
  var tb=ROOT.querySelector('.sc-table tbody'); if(tb) tb.innerHTML=rowHtml;
}

// ── Team flow: Team Overview (screen-teamoverview) ──

(function(){
  let isMain = true;  // this demo team is already the main team
  window.setAsMain = function() {
    var t=window._activeTeam; if(!t) return;
    if(typeof _savedTeams!=='undefined' && Array.isArray(_savedTeams)){
      _savedTeams.forEach(function(x){ x.isMain = !!(t.id!=null && x.id===t.id); });
    }
    t.isMain=true;  // live reference into _savedTeams
    var btn=document.getElementById('mainBtn'); if(btn) btn.classList.add('is-main');
    var bt=document.getElementById('mainBtnText'); if(bt) bt.textContent='Main Team';
    try{
      var uid=window._fbAuth&&window._fbAuth.currentUser&&window._fbAuth.currentUser.uid;
      if(uid && typeof persistTeams==='function') persistTeams(uid);  // saves the whole list (incl. isMain) to saved/teams_v2
    }catch(e){}
    if(typeof showToast==='function') showToast('"'+(t.teamName||'Team')+'" is now your main team.', 'success');
    if(typeof renderHomeScreen==='function') renderHomeScreen();
  };
  window.deleteActiveTeam = function(){
    var t=window._activeTeam;
    if(!t || t.id==null){ if(typeof showToast==='function') showToast('No team selected.','error'); return; }
    if(typeof deleteTeamWithConfirm==='function') deleteTeamWithConfirm(t.id);
  };
  window.editActiveTeam = function(){
    var t=window._activeTeam;
    if(!t){ if(typeof showToast==='function') showToast('No team selected.','error'); return; }
    window._ctPendingEdit = t;
    if(document.getElementById('screen-createteam')) showScreen('createteam');
    else if(typeof showToast==='function') showToast('Coming soon');
  };
})();


// Resolves the best avatar image for a person object: uploaded photo first (direct, or
// looked up by uid from _profile/self or _buddies), then built-in avatarId, then default.
function _avatarFor(p){
  p = p || {};
  var AV=(typeof AVATARS!=='undefined')?AVATARS:{};
  var me=window._fbAuth&&window._fbAuth.currentUser; var uid=p.uid||p.id;
  if(p.avatarUrl) return p.avatarUrl;
  if(p.you||p.isMe||(me&&uid&&uid===me.uid)){ if(typeof _profile!=='undefined'&&_profile&&_profile.avatarUrl) return _profile.avatarUrl; }
  if(uid&&typeof _buddies!=='undefined'&&_buddies){ var b=_buddies.find(function(x){return x.uid===uid;}); if(b&&b.avatarUrl) return b.avatarUrl; }
  if(p.avatarId!=null&&AV[p.avatarId]) return AV[p.avatarId];
  return 'icons/home-crown.png';
}

function renderTeamOverview(ROOT){
  ROOT=ROOT||document.getElementById('screen-teamoverview'); if(!ROOT) return;
  var t=window._activeTeam||{}; var AV=(typeof AVATARS!=='undefined')?AVATARS:{};
  var players=t.players||[]; var size=t.size||players.length||2;
  var lab=ROOT.querySelector('.th-label'); if(lab) lab.textContent='Scramble Team \u00b7 '+size+' Players';
  var nm=ROOT.querySelector('.th-name'); if(nm) nm.textContent=t.teamName||'Team';
  var mc=ROOT.querySelector('.th-members');
  if(mc){ mc.innerHTML=players.map(function(p,i){
    var av=_avatarFor(p);
    var role=p.you?'You \u00b7 Captain':(p.guest?'Guest':('@'+((p.name||'').toLowerCase().replace(/\s+/g,''))));
    var hcp=(p.hcp!=null&&!isNaN(p.hcp))?Number(p.hcp).toFixed(1):'\u2014';
    return '<div class="th-member"><div class="thm-avatar"><img src="'+av+'"></div><div class="thm-info"><div class="thm-name">'+(p.name||'Player')+'</div><div class="thm-role">'+role+'</div></div><div class="thm-hcp"><div class="thm-hcp-val">'+hcp+'</div><div class="thm-hcp-lbl">HCP</div></div></div>';
  }).join(''); }
  // stats from _savedRounds for this team
  var all=(typeof _savedRounds!=='undefined'?_savedRounds:[]);
  var games=all.filter(function(r){ return (r.isMatch?((r.teamA&&r.teamA.name)):(r.teamName||(r.team&&r.team.name)))===t.teamName; });
  var wins=games.filter(function(r){ return r.isMatch && r.result && r.result.teamAWon>r.result.teamBWon; }).length;
  var sv=ROOT.querySelectorAll('.stat-box-val');
  if(sv[0]) sv[0].textContent=games.length;
  if(sv[1]) sv[1].textContent=(games.some(function(g){return g.isMatch;})?wins:'\u2013');
  if(sv[2]){ var mp=games.filter(function(g){return g.isMatch;}); sv[2].textContent = mp.length ? Math.round(wins/mp.length*100)+'%' : '\u2013'; }
  // best result card
  var rg2=games.filter(function(r){return !r.isMatch;});
  var bc=ROOT.querySelector('.best-card');
  if(bc){
    var best=pmBestRound(rg2.filter(function(r){ return r.mode!=='match1v1'; }));
    if(best){
      var bcc=bc.querySelector('.best-course'); if(bcc) bcc.textContent=best.courseName||'Course';
      var bcm=bc.querySelector('.best-meta'); if(bcm){ var hh=best.holes||((best.par||[]).length||9); bcm.textContent=hh+'H \u00b7 '+(best.format||'')+(best.playedAt?(' \u00b7 '+new Date(best.playedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})):''); }
      var bcs=bc.querySelector('.best-score'); if(bcs) bcs.textContent=(best._vs>0?'+'+best._vs:best._vs);
      bc.style.display='';
    } else { bc.style.display='none'; }
  }
  // main button state
  var btn=document.getElementById('mainBtn'); var bt=document.getElementById('mainBtnText');
  if(btn){ btn.classList.toggle('is-main', !!t.isMain); }
  if(bt){ bt.textContent = t.isMain ? 'Main Team' : 'Set as Main'; }
}

// ── Team flow: Team Created (screen-teamcreated) ──
function renderTeamCreated(ROOT){
  ROOT=ROOT||document.getElementById('screen-teamcreated'); if(!ROOT) return;
  var t=window._activeTeam||{}; var AV=(typeof AVATARS!=='undefined')?AVATARS:{};
  var nm=ROOT.querySelector('.tc-name'); if(nm) nm.textContent=t.teamName||'Your Team';
  var mem=ROOT.querySelector('.tc-members');
  if(mem){ mem.innerHTML=(t.players||[]).slice(0,4).map(function(p){ var av=(typeof _avatarFor==='function')?_avatarFor(p):(p.avatarUrl||(p.avatarId&&AV[p.avatarId])||'icons/home-crown.png'); return '<div class="tc-avatar"><img src="'+av+'"></div>'; }).join(''); }
  var vals=ROOT.querySelectorAll('.tc-meta-val');
  if(vals[0]) vals[0].textContent=(t.players||[]).length||t.size||2;
  if(vals[1]) vals[1].textContent='35%';
  if(vals[2]) vals[2].textContent='15%';
}

// ── Team flow: Create Team (screen-createteam) ──

(function(){
  let teamSize = 2;          // total players incl. you
  let selected = new Set();  // selected buddy indices
  let guests = [];           // [{name, hcp}]
  let guestSeq = 0;
  let editId = null;         // when set, createTeam() updates this saved team instead of creating a new one

  function needed() { return teamSize - 1; }          // teammates required (you = player 1)
  function filled() { return selected.size + guests.length; }
  function isFull()  { return filled() >= needed(); }

  window.setSize = function(n) {
    teamSize = n;
    document.querySelectorAll('.size-pill').forEach(p => {
      p.classList.toggle('active', parseInt(p.dataset.size) === n);
    });
    // Trim if too many for the new (smaller) size — remove guests first, then buddies
    while (filled() > needed()) {
      if (guests.length) {
        const g = guests.pop();
        const el = document.querySelector('.buddy-chip[data-guest="'+g.id+'"]');
        if (el) el.remove();
      } else {
        const last = Array.from(selected).pop();
        selected.delete(last);
        document.querySelector('.buddy-chip[data-idx="'+last+'"]').classList.remove('selected');
      }
    }
    refresh();
  };

  window.toggleBuddy = function(idx) {
    const chip = document.querySelector('.buddy-chip[data-idx="'+idx+'"]');
    if (selected.has(idx)) {
      selected.delete(idx);
      chip.classList.remove('selected');
    } else {
      if (isFull()) return;
      selected.add(idx);
      chip.classList.add('selected');
    }
    refresh();
  };

  // ── Guest modal ──
  let _ctGuestGender = 'M';
  window.ctSetGuestGender = function(g) {
    _ctGuestGender = g;
    document.querySelectorAll('.ct-guest-gender-opt').forEach(function(btn){
      const sel = btn.getAttribute('data-gender') === g;
      btn.classList.toggle('selected', sel);
      btn.style.background = sel ? 'var(--green)' : '#fff';
      btn.style.color = sel ? '#fff' : 'var(--text)';
      btn.style.borderColor = sel ? 'var(--green)' : 'rgba(0,0,0,0.15)';
    });
  };
  window.openGuestModal = function() {
    if (isFull()) return;  // no room
    document.getElementById('guestName').value = '';
    document.getElementById('guestHcp').value = '';
    document.getElementById('guestName').classList.remove('error');
    document.getElementById('guestHcp').classList.remove('error');
    ctSetGuestGender('M');
    document.getElementById('guestOverlay').classList.add('visible');
  };
  window.closeGuestModal = function() {
    document.getElementById('guestOverlay').classList.remove('visible');
  };
  window.addGuest = function() {
    const nameEl = document.getElementById('guestName');
    const hcpEl  = document.getElementById('guestHcp');
    const name = nameEl.value.trim();
    const hcp  = hcpEl.value.trim();
    let ok = true;
    if (!name) { nameEl.classList.add('error'); ok = false; } else nameEl.classList.remove('error');
    if (hcp === '' || isNaN(parseFloat(hcp))) { hcpEl.classList.add('error'); ok = false; } else hcpEl.classList.remove('error');
    if (!ok) return;
    addGuestChip(name, parseFloat(hcp).toFixed(1), _ctGuestGender || 'M');
    closeGuestModal();
    refresh();
  };
  // Build a guest object + carousel chip (shared by addGuest and edit-mode loading)
  function addGuestChip(name, hcp, gender) {
    const id = ++guestSeq;
    const hcpF = parseFloat(hcp);
    guests.push({ id, name, hcp: (isNaN(hcpF) ? '0.0' : hcpF.toFixed(1)), gender: gender || 'M' });
    const carousel = document.getElementById('carousel');
    const addChip = carousel.querySelector('.add-guest-chip');
    const initial = name.charAt(0).toUpperCase();
    const chip = document.createElement('div');
    chip.className = 'buddy-chip guest selected';
    chip.setAttribute('data-guest', id);
    chip.onclick = function(){ removeGuest(id); };
    chip.innerHTML =
      '<div class="bc-avatar"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
        '<circle cx="50" cy="50" r="50" fill="#c9a820"/>' +
        '<circle cx="50" cy="38" r="20" fill="#f4e2a0" opacity="0.9"/>' +
        '<ellipse cx="50" cy="80" rx="30" ry="20" fill="#c9a820"/>' +
        '<circle cx="50" cy="38" r="16" fill="#f4e2a0"/>' +
        '<text x="50" y="44" text-anchor="middle" dominant-baseline="middle" font-family="Inter,sans-serif" font-weight="900" font-size="22" fill="#8a6d00">' + initial + '</text>' +
      '</svg></div>' +
      '<div class="bc-name">' + name.split(" ")[0] + '</div>' +
      '<div class="bc-hcp"><span>HCP</span> ' + (isNaN(hcpF) ? '0.0' : hcpF.toFixed(1)) + '</div>' +
      '<div class="guest-tag">Guest</div>' +
      '<div class="bc-check"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>';
    carousel.insertBefore(chip, addChip);
    return id;
  }
  window.removeGuest = function(id) {
    guests = guests.filter(g => g.id !== id);
    const el = document.querySelector('.buddy-chip[data-guest="'+id+'"]');
    if (el) el.remove();
    refresh();
  };

  // Load an existing saved team into the screen for editing (called after the carousel is built)
  window._ctLoadTeam = function(team) {
    if (!team) return;
    editId = team.id || null;
    var players = team.players || [];
    teamSize = team.size || players.length || 2;
    document.querySelectorAll('.size-pill').forEach(function(p){ p.classList.toggle('active', parseInt(p.dataset.size) === teamSize); });
    selected.clear();
    guests = []; guestSeq = 0;
    document.querySelectorAll('.buddy-chip.guest').forEach(function(el){ el.remove(); });
    document.querySelectorAll('.buddy-chip[data-idx]').forEach(function(el){ el.classList.remove('selected'); });
    var tn = document.getElementById('teamName'); if (tn) { tn.value = team.teamName || ''; tn.classList.remove('error'); }
    var ne = document.getElementById('nameError'); if (ne) ne.classList.remove('visible');
    var bs = (typeof _buddies !== 'undefined' ? _buddies : []);
    players.forEach(function(p){
      if (p.you) return;  // captain is always P1, not a carousel selection
      if (p.uid != null && !p.guest) {
        var idx = -1;
        for (var i = 0; i < bs.length; i++) { if (bs[i].uid === p.uid) { idx = i; break; } }
        if (idx >= 0) {
          selected.add(idx);
          var chip = document.querySelector('.buddy-chip[data-idx="'+idx+'"]');
          if (chip) chip.classList.add('selected');
          return;
        }
      }
      // guest, or a buddy no longer in the list → preserve the roster as a guest chip
      addGuestChip(p.name || 'Guest', (p.hcp != null ? p.hcp : 0), p.gender || 'M');
    });
    var titleEl = document.querySelector('#screen-createteam .sub-header .title'); if (titleEl) titleEl.textContent = 'Edit Team';
    var cb = document.getElementById('createBtn'); if (cb) cb.textContent = 'Save Changes';
    refresh();
  };

  function refresh() {
    document.getElementById('selCount').textContent = filled();
    document.getElementById('needCount').textContent = needed();
    const counter = document.getElementById('counter');
    const full = isFull();
    counter.classList.toggle('full', full);
    // Disable unselected buddy chips + the add-guest chip when full
    document.querySelectorAll('.buddy-chip[data-idx]').forEach(chip => {
      const i = parseInt(chip.dataset.idx);
      chip.classList.toggle('disabled', full && !selected.has(i));
    });
    const addChip = document.querySelector('.add-guest-chip');
    if (addChip) addChip.style.opacity = full ? '0.4' : '1';
    if (addChip) addChip.style.pointerEvents = full ? 'none' : 'auto';
    validateAll();
  }

  window.validateName = function() {
    const input = document.getElementById('teamName');
    if (input.value.trim()) {
      input.classList.remove('error');
      document.getElementById('nameError').classList.remove('visible');
    }
    validateAll();
  };

  function validateAll() {
    const nameOk = document.getElementById('teamName').value.trim().length > 0;
    const sizeOk = filled() === needed();
    document.getElementById('createBtn').disabled = !(nameOk && sizeOk);
  }

  window.createTeam = function() {
    const name = document.getElementById('teamName').value.trim();
    if (!name) { document.getElementById('teamName').classList.add('error'); document.getElementById('nameError').classList.add('visible'); return; }
    if (filled() !== needed()) return;
    var prof=(typeof _profile!=='undefined'&&_profile)||{};
    var players=[{ name:(prof.displayName||'You'), hcp:(prof.hcpIndex!=null?prof.hcpIndex:null), avatarId:prof.avatarId, gender:prof.gender||'M', you:true }];
    selected.forEach(function(idx){ var b=(typeof _buddies!=='undefined'?_buddies:[])[idx]; if(b) players.push({name:b.name, hcp:b.hcp, avatarId:b.avatarId, gender:b.gender||'M', uid:b.uid}); });
    guests.forEach(function(g){ players.push({name:g.name, hcp:parseFloat(g.hcp), gender:g.gender||'M', guest:true}); });
    var uid=window._fbAuth&&window._fbAuth.currentUser&&window._fbAuth.currentUser.uid;

    if (editId != null && typeof _savedTeams!=='undefined') {
      // ── EDIT: update the existing team in place (preserve id, isMain, stats) ──
      var ex=null; for(var i=0;i<_savedTeams.length;i++){ if(_savedTeams[i].id===editId){ ex=_savedTeams[i]; break; } }
      if(ex){ ex.teamName=name; ex.players=players; ex.size=teamSize; window._activeTeam=ex; }
      editId=null;
      try{ if(uid && typeof persistTeams==='function') persistTeams(uid); }catch(e){}
      if(typeof showToast==='function') showToast('Team updated.', 'success');
      if(typeof renderHomeScreen==='function') renderHomeScreen();
      if(document.getElementById('screen-teamoverview')) showScreen('teamoverview', { replace:true });
      else if(document.getElementById('screen-myteams')) showScreen('myteams', { replace:true });
      return;
    }

    // ── CREATE: brand-new team ──
    var team={ id: Date.now().toString(), teamName:name, players:players, size:teamSize, createdAt:Date.now() };
    if(typeof _savedTeams!=='undefined'){ if(!_savedTeams.length) team.isMain=true; _savedTeams.push(team); }
    try{ if(uid && typeof persistTeams==='function') persistTeams(uid); }catch(e){}
    window._activeTeam=team;
    if(typeof renderHomeScreen==='function') renderHomeScreen();
    if(document.getElementById('screen-teamcreated')) showScreen('teamcreated'); else if(document.getElementById('screen-myteams')) showScreen('myteams');
  };

  window._ctResetState = function(){
    editId=null;
    selected.clear(); guests=[]; guestSeq=0; teamSize=2;
    document.querySelectorAll('.size-pill').forEach(function(p){ p.classList.toggle('active', parseInt(p.dataset.size)===2); });
    document.querySelectorAll('.buddy-chip.guest').forEach(function(el){ el.remove(); });
    var titleEl=document.querySelector('#screen-createteam .sub-header .title'); if(titleEl) titleEl.textContent='Create Team';
    var cb=document.getElementById('createBtn'); if(cb) cb.textContent='Create Team';
    refresh();
  };
  refresh();
})();


function renderCreateTeam(ROOT){
  ROOT=ROOT||document.getElementById('screen-createteam'); if(!ROOT) return;
  var AV=(typeof AVATARS!=='undefined')?AVATARS:{}; var prof=(typeof _profile!=='undefined'&&_profile)||{};
  var tn=document.getElementById('teamName'); if(tn){ tn.value=''; tn.classList.remove('error'); }
  var ne=document.getElementById('nameError'); if(ne) ne.classList.remove('visible');
  var car=document.getElementById('carousel'); if(car){
    var youAv=prof.avatarUrl||(prof.avatarId&&AV[prof.avatarId])||'icons/home-crown.png';
    var youHcp=(prof.hcpIndex!=null)?Number(prof.hcpIndex).toFixed(1):'\u2014';
    var html='<div class="buddy-chip you-chip"><div class="bc-avatar"><img src="'+youAv+'"></div><div class="bc-name">You</div><div class="bc-hcp"><span>HCP</span> '+youHcp+'</div><div class="bc-badge">P1</div></div>';
    (typeof _buddies!=='undefined'?_buddies:[]).forEach(function(b,i){
      var av=b.avatarUrl||(b.avatarId&&AV[b.avatarId])||'icons/home-crown.png';
      var hcp=(b.hcp!=null)?Number(b.hcp).toFixed(1):'\u2014';
      html+='<div class="buddy-chip" data-idx="'+i+'" onclick="toggleBuddy('+i+')"><div class="bc-avatar"><img src="'+av+'"></div><div class="bc-name">'+((b.name||'Buddy').split(' ')[0])+'</div><div class="bc-hcp"><span>HCP</span> '+hcp+'</div><div class="bc-check"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg></div></div>';
    });
    html+='<div class="add-guest-chip" onclick="openGuestModal()"><div class="ag-circle"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div><div class="bc-name">Add Guest</div></div>';
    car.innerHTML=html;
  }
  if(typeof window._ctResetState==='function') window._ctResetState();
  if(window._ctPendingEdit && typeof window._ctLoadTeam==='function'){ var _et=window._ctPendingEdit; window._ctPendingEdit=null; window._ctLoadTeam(_et); }
}

// ── Profile cluster: Public Profile (screen-profile) ──
function renderProfile(ROOT){
  ROOT = ROOT || document.getElementById('screen-profile'); if(!ROOT) return;
  var prof=_profile||{}; var AV=(typeof AVATARS!=='undefined')?AVATARS:{};
  var _myUid=(window._fbAuth&&window._fbAuth.currentUser)?window._fbAuth.currentUser.uid:null; var all=_savedRounds||[]; var _st=pmRoundStats(all, _myUid), rounds=_st.rounds, matches=_st.matches, wins=_st.wins;
  var set=function(sel,val){ var e=ROOT.querySelector(sel); if(e) e.textContent=val; };
  var av=ROOT.querySelector('.avatar-wrap img'); if(av) av.src = prof.avatarUrl || (prof.avatarId&&AV[prof.avatarId]) || 'icons/home-crown.png';
  var hero=ROOT.querySelector('.profile-hero');
  if(hero){ var _covSrc=prof.coverUrl || (prof.coverId && typeof COVERS!=='undefined' && COVERS[prof.coverId]) || null; if(_covSrc){ hero.style.backgroundImage="linear-gradient(180deg,rgba(var(--pm-brand-dark-rgb),0.30),rgba(var(--pm-brand-dark-rgb),0.72)), url('"+_covSrc+"')"; hero.style.backgroundSize='cover'; hero.style.backgroundPosition='center'; } else { hero.style.backgroundImage=''; } }
  set('.profile-name', prof.displayName||'Player');
  var _un=ROOT.querySelector('.profile-username'); if(_un){ _un.textContent=''; _un.style.display='none'; }
  var metas=ROOT.querySelectorAll('.profile-meta-item');
  var setMeta=function(el,txt){ if(!el) return; var svg=el.querySelector('svg'); el.innerHTML=(svg?svg.outerHTML:'')+' '+txt; };
  if(metas[0]) setMeta(metas[0], prof.homeCourse||'\u2014');
  if(metas[1]) setMeta(metas[1], (_buddies?_buddies.length:0)+' Buddies');
  set('.tier-badge', prof.tier||'Free');
  set('.hcp-value', (prof.hcpIndex!=null&&!isNaN(prof.hcpIndex))?Number(prof.hcpIndex).toFixed(1):'\u2014');
  set('.hcp-course-name', prof.homeCourse||'\u2014');
  var sv=ROOT.querySelectorAll('.stats-grid .stat-value');
  var winRate = matches.length? Math.round(wins/matches.length*100)+'%' : '\u2014';
  var vals=[rounds.length, matches.length, wins, (_savedTeams?_savedTeams.length:0), (_buddies?_buddies.length:0), winRate];
  sv.forEach(function(e,i){ if(vals[i]!=null) e.textContent=vals[i]; });
  // best result card (best round by vs par) — tap to open Round Detail
  var bc=ROOT.querySelector('.best-card');
  if(bc){
    var best=pmBestRound(rounds);
    if(best){
      var course=bc.querySelector('.best-course, .best-name'); if(course) course.textContent=best.courseName||'Course';
      var meta=bc.querySelector('.best-meta');
      if(meta){ var hh=best.holes||((best.par||[]).length||9); var parts=[hh+'H']; if(best.format) parts.push(best.format); if(best.teamName) parts.push(best.teamName); if(best.playedAt) parts.push(new Date(best.playedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})); meta.textContent=parts.join(' \u00b7 '); }
      var score=bc.querySelector('.best-score, .best-value, .best-gross'); if(score) score.textContent=(best._vs>0?'+'+best._vs:best._vs);
      bc.style.cursor='pointer';
      bc.onclick=function(){ window._activeRound=best; if(document.getElementById('screen-rounddetail')) showScreen('rounddetail'); };
      bc.style.display='';
    } else { bc.style.display='none'; }
  }
  if(typeof pmRenderBestMatch==='function') pmRenderBestMatch(ROOT, matches, _myUid);   // v35: Best Result · Match Play
  var editBtn=ROOT.querySelector('.action-btn.primary'); if(editBtn) editBtn.onclick=function(){ if(document.getElementById('screen-editprofile')) showScreen('editprofile'); else if(typeof showToast==='function') showToast('Coming soon'); };
  var shareBtn=ROOT.querySelector('.action-btn.secondary'); if(shareBtn) shareBtn.onclick=function(){
    var nm=prof.displayName||'My'; var hcp=(prof.hcpIndex!=null&&!isNaN(prof.hcpIndex))?Number(prof.hcpIndex).toFixed(1):null;
    var txt=nm+"'s scramble profile on Parmate"+(hcp?(' \u00b7 WHS '+hcp):''); var url='https://play.parmate.golf';
    if(navigator.share){ navigator.share({title:'Parmate',text:txt,url:url}).catch(function(){}); }
    else if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(txt+' '+url).then(function(){ if(typeof showToast==='function') showToast('Link copied','success'); }).catch(function(){ if(typeof showToast==='function') showToast(url); }); }
    else if(typeof showToast==='function'){ showToast(url); }
  };
}

// ── Menu cluster: Game History (screen-matches) — TR rounds + TM matches ──
function _mDate(iso){ try{ return new Date(iso).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); }catch(e){ return ''; } }
// Backfill nested team objects + computed result from flat fields, for matches
// saved before these were stored. Mutates and returns the record.
function _ensureMatchFields(m){
  if(!m) return m;
  if(!m.teamA) m.teamA={ name:m.teamName||'Your team', hcp:(m.teamHcp!=null?m.teamHcp:null), scores:m.scores||[] };
  if(!m.teamB) m.teamB={ name:m.oppName ||'Opponent',  hcp:(m.oppHcp!=null ?m.oppHcp :null), scores:m.oppScores||[] };
  if(!m.result || m.result.teamAWon==null){
    var n=m.holes||(Array.isArray(m.par)?m.par.length:9);
    var si=m.si||m.index||[];
    var ranks=(typeof _denseSIRanks==='function')?_denseSIRanks(si,n):si;
    var sa=m.teamA.scores||[], sb=m.teamB.scores||[];
    var diff=Math.abs((m.teamA.hcp||0)-(m.teamB.hcp||0));
    var aRecv=(m.teamA.hcp||0)>=(m.teamB.hcp||0);
    var aw=0,bw=0,dr=0;
    for(var i=0;i<n;i++){ var a=sa[i],b=sb[i]; if(a==null||a===0||b==null||b===0) continue;
      var str=(typeof strokeOnHoleWithIndex==='function')?strokeOnHoleWithIndex(i,diff,ranks,n):0;
      var na=a-(aRecv?str:0), nb=b-(aRecv?0:str);
      if(na<nb)aw++; else if(na>nb)bw++; else dr++; }
    m.result={ teamAWon:aw, teamBWon:bw, drawn:dr, winner:(aw>bw?m.teamA.name:(bw>aw?m.teamB.name:'AS')) };
  }
  return m;
}
function _matchOutcome(m){ var r=m.result||{}; var a=r.teamAWon||0,b=r.teamBWon||0; return a>b?'Win':(a<b?'Loss':'Draw'); }
function _ghHoles(r){ return r.holes || (Array.isArray(r.par)?r.par.length:9); }
function _ghPassFilter(r, f){
  var now=new Date(); var dt=new Date(r.playedAt||r.date||Date.now());
  if(f==='9 holes') return _ghHoles(r)<18;
  if(f==='18 holes') return _ghHoles(r)>=18;
  if(f==='This month') return dt.getMonth()===now.getMonth() && dt.getFullYear()===now.getFullYear();
  if(f==='This year') return dt.getFullYear()===now.getFullYear();
  return true;
}
// ── Notifications (live) ──
let _notifications = [];
let _notifUnread = 0;
let _notifUnsub = null;
function _notifTs(n){ var t=n.createdAt||n.ts||n.time; if(!t) return 0; if(t.seconds) return t.seconds*1000; var p=Date.parse(t); return isNaN(p)?0:p; }
function notifMeta(n){
  var m={ icon:'\uD83D\uDD14', title:'Notification', sub:'' };
  if(n.type==='buddy_accepted'){ m.icon='\uD83E\uDD1D'; m.title=(n.byName||'Someone')+' accepted your buddy request'; }
  else if(n.type==='added_to_team'){ m.icon='\uD83C\uDFCC\uFE0F'; m.title=(n.byName||'Someone')+' added you to a team'; m.sub=n.teamName?('"'+n.teamName+'"'):''; }
  else if(n.type==='team_removed'){ m.icon='\uD83D\uDDD1'; m.title=(n.teamName?('"'+n.teamName+'"'):'A team')+' was removed'; m.sub=n.removedBy?('by '+n.removedBy):''; }
  else if(n.type==='buddy_request'){ m.icon='\uD83D\uDC4B'; m.title=(n.fromName||'Someone')+' sent you a buddy request'; }
  return m;
}
function renderNotifRow(n){
  var m=notifMeta(n); var unread=!n.read;
  var esc2=(typeof esc==='function')?esc:function(x){return x;};
  return '<div class="notif-item'+(unread?' unread':'')+'">'
    +'<div class="notif-ic">'+m.icon+'</div>'
    +'<div class="notif-body"><div class="notif-title">'+esc2(m.title)+'</div>'
    +(m.sub?'<div class="notif-sub">'+esc2(m.sub)+'</div>':'')+'</div>'
    +(unread?'<span class="notif-dot"></span>':'')
    +'<button class="notif-del" title="Delete" onclick="deleteNotif(\''+n._id+'\',event)">\u2715</button>'
    +'</div>';
}
function renderBellRequest(r){
  var _t=(typeof t==='function')?t:function(k){return k;};
  var esc2=(typeof esc==='function')?esc:function(x){return x;};
  var isBuddy = r.type==='buddy_request';
  var sub = isBuddy
    ? (_t('bell_wants_buddy')+(r.fromHcp!=null?(' \u00b7 HCP '+r.fromHcp):''))
    : (_t('bell_team_invite')+': '+esc2(r.teamName||'\u2014'));
  return '<div class="bell-req-card">'
    +'<div class="bell-req-info"><div class="bell-req-name">'+esc2(r.fromName||'\u2014')+'</div><div class="bell-req-sub">'+sub+'</div></div>'
    +'<div class="bell-req-actions">'
      +'<button class="bell-req-accept" title="Accept" onclick="acceptBuddyRequest(\''+r.id+'\')">\u2713</button>'
      +'<button class="bell-req-decline" title="Decline" onclick="declineBuddyRequest(\''+r.id+'\')">\u2715</button>'
    +'</div></div>';
}
function renderNotifList(ROOT){
  ROOT=ROOT||document.getElementById('screen-notifications'); if(!ROOT) return;
  var list=ROOT.querySelector('#notifList'); if(!list) return;
  var _t=(typeof t==='function')?t:function(k){return k;};
  var reqs=(typeof _pendingRequests!=='undefined'&&_pendingRequests)||[];
  var og=(window._openGames||[]);
  // TR paused round (single-player) — surface it in the same notifications list
  // as TM open games, with Resume / Discard actions.
  var pausedHtml = '';
  if (typeof _pausedRound !== 'undefined' && _pausedRound) {
    var pr = _pausedRound;
    var prBits = [];
    if (pr.courseName) prBits.push(pr.courseName);
    prBits.push((pr.holesPlayed||0) + '/' + (pr.holes||'?') + ' holes');
    pausedHtml = '<div class="og-section-label">Round in progress</div>' +
      '<div class="open-game-card">' +
        '<div class="og-btns">' +
          '<button class="og-btn og-cancel" onclick="discardPausedRound()">\u2715 Discard</button>' +
          '<button class="og-btn og-continue" onclick="resumePausedRound()">\u25B6 Resume</button>' +
        '</div>' +
        '<div class="og-info">' +
          '<span class="og-badge active">'+(pr.mode==='match1v1'?'1VS1 MATCH':(pr.mode==='solo'?'SOLO ROUND':'TEAM ROUND'))+'</span>' +
          '<div class="og-title">Resume your round</div>' +
          '<div class="og-sub">' + prBits.join(' \u00b7 ') + '</div>' +
        '</div>' +
      '</div>';
  }
  var m1Html = (typeof m1LiveBellHtml === 'function') ? m1LiveBellHtml() : '';   // v26: live 1vs1 invites / matches
  var reqHtml = reqs.length ? ('<div class="og-section-label">'+_t('bell_requests')+'</div>'+reqs.map(renderBellRequest).join('')) : '';
  var ogHtml = og.length ? ('<div class="og-section-label">'+_t('og_section')+'</div>'+og.map(renderOpenGameCard).join('')) : '';
  var notifHtml = _notifications.length ? _notifications.map(renderNotifRow).join('') : ((reqs.length||og.length||pausedHtml||m1Html||(typeof _msgUnread!=='undefined'&&_msgUnread>0)) ? '' : '<div class="notif-empty">No notifications yet.</div>');
  var msgHtml='';
  if(typeof _msgUnread!=='undefined' && _msgUnread>0){
    msgHtml='<div class="og-section-label">'+_t('inbox_title')+'</div>'+
      '<div class="bell-req-card" style="cursor:pointer;" onclick="if(typeof openInbox===\'function\')openInbox()">'+
        '<div style="width:38px;height:38px;border-radius:50%;background:var(--pm-brand);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;flex:0 0 38px;">\uD83D\uDCAC</div>'+
        '<div style="flex:1 1 auto;min-width:0;">'+
          '<div style="font-weight:700;color:var(--pm-brand);font-size:0.92rem;">'+_msgUnread+' '+_t('bell_new_messages')+'</div>'+
          '<div style="font-size:0.8rem;color:#444;">'+_t('bell_tap_open')+'</div>'+
        '</div>'+
        '<span style="color:var(--pm-brand);font-weight:700;font-size:18px;">\u203a</span>'+
      '</div>';
  }
  list.innerHTML = pausedHtml + m1Html + msgHtml + reqHtml + ogHtml + notifHtml;
}
async function renderNotifications(ROOT){
  ROOT=ROOT||document.getElementById('screen-notifications'); if(!ROOT) return;
  var list=ROOT.querySelector('#notifList'); if(!list) return;
  var uid=(window._fbAuth&&window._fbAuth.currentUser)?window._fbAuth.currentUser.uid:null;
  if(!uid||!window._fbDb){ list.innerHTML='<div class="notif-empty">Sign in to see notifications.</div>'; return; }
  try{ await loadOpenGames(uid); }catch(_){}
  if(typeof updateNotifBadge==='function') updateNotifBadge();
  if(_notifUnsub){ renderNotifList(ROOT); markNotifsReadSilently(uid); return; }   // listener keeps cache fresh
  list.innerHTML='<div class="notif-empty">Loading\u2026</div>';
  try{
    var snap=await window._fbDb.collection('users').doc(uid).collection('notifications').get();
    _notifications=[]; snap.forEach(function(d){ _notifications.push(Object.assign({_id:d.id}, d.data())); });
    _notifications.sort(function(a,b){ return _notifTs(b)-_notifTs(a); });
    renderNotifList(ROOT); markNotifsReadSilently(uid);
  }catch(e){ console.warn('renderNotifications',e); list.innerHTML='<div class="notif-empty">Could not load notifications.</div>'; }
}
function markNotifsReadSilently(uid){
  uid=uid||((window._fbAuth&&window._fbAuth.currentUser)?window._fbAuth.currentUser.uid:null);
  if(!uid||!window._fbDb) return;
  window._fbDb.collection('users').doc(uid).collection('notifications').where('read','==',false).get()
    .then(function(snap){ if(snap.empty) return; var batch=window._fbDb.batch(); snap.forEach(function(d){ batch.update(d.ref,{read:true}); }); return batch.commit(); })
    .catch(function(e){ console.warn('markNotifsReadSilently',e); });
}
function updateNotifBadge(){
  var n=(_notifUnread||0)+((window._openGames&&window._openGames.length)||0)+((typeof _pendingRequests!=='undefined'&&_pendingRequests)?_pendingRequests.length:0)+((typeof _msgUnread!=='undefined'&&_msgUnread)?_msgUnread:0)+((typeof _pausedRound!=='undefined'&&_pausedRound)?1:0)+((typeof m1LiveBadgeCount==='function')?m1LiveBadgeCount():0);
  document.querySelectorAll('.header-icons').forEach(function(hdr){
    var icons=hdr.querySelectorAll('.icon-btn'); var bell=icons[1]; if(!bell) return;
    bell.style.position='relative';
    var dot=bell.querySelector('.notif-badge');
    if(n>0){ if(!dot){ dot=document.createElement('span'); dot.className='notif-badge'; bell.appendChild(dot); } dot.textContent=n>9?'9+':String(n); }
    else if(dot){ dot.remove(); }
  });
}
function startNotifListener(uid){
  if(!uid||!window._fbDb) return;
  stopNotifListener();
  var first=true;
  try{
    _notifUnsub=window._fbDb.collection('users').doc(uid).collection('notifications')
      .onSnapshot(function(snap){
        var prevIds=(_notifications||[]).map(function(x){return x._id;});
        _notifications=[]; var unread=0;
        snap.forEach(function(d){ var n=Object.assign({_id:d.id}, d.data()); _notifications.push(n); if(!n.read) unread++; });
        _notifications.sort(function(a,b){ return _notifTs(b)-_notifTs(a); });
        _notifUnread=unread;
        if(!first){
          _notifications.forEach(function(n){
            if(prevIds.indexOf(n._id)<0 && !n.read && typeof showToast==='function'){ var m=notifMeta(n); showToast(m.icon+' '+m.title,'info'); }
          });
        }
        first=false;
        // v25: someone accepted our buddy request -> add them now, no restart needed
        try{ if(typeof _onBuddyAcceptedSnap==='function') _onBuddyAcceptedSnap(uid, snap.docs); }catch(e){}
        updateNotifBadge();
        var scr=document.getElementById('screen-notifications');
        if(scr && scr.classList.contains('active')) renderNotifList(scr);
      }, function(err){ console.warn('notif listener',err); });
  }catch(e){ console.warn('startNotifListener',e); }
}
function stopNotifListener(){ if(_notifUnsub){ try{_notifUnsub();}catch(e){} _notifUnsub=null; } _notifUnread=0; _notifications=[]; updateNotifBadge(); }
// Delete a single notification.
async function deleteNotif(id, ev){
  if(ev && ev.stopPropagation) ev.stopPropagation();
  var uid=(window._fbAuth&&window._fbAuth.currentUser)?window._fbAuth.currentUser.uid:null;
  if(!uid||!window._fbDb||!id) return;
  try{
    await window._fbDb.collection('users').doc(uid).collection('notifications').doc(id).delete();
    _notifications=_notifications.filter(function(n){return n._id!==id;});
    _notifUnread=_notifications.filter(function(n){return !n.read;}).length;
    renderNotifList(document.getElementById('screen-notifications'));
    if(typeof updateNotifBadge==='function') updateNotifBadge();
  }catch(e){ console.warn('deleteNotif',e); if(typeof showToast==='function') showToast('Could not delete','error'); }
}
// Delete every notification (does not touch open-game cards, which come from matches).
async function clearAllNotifs(){
  var _t=(typeof t==='function')?t:function(k){return k;};
  var uid=(window._fbAuth&&window._fbAuth.currentUser)?window._fbAuth.currentUser.uid:null;
  if(!uid||!window._fbDb) return;
  if(!_notifications.length){ if(typeof showToast==='function') showToast(_t('notif_none'),'info'); return; }
  if(typeof confirm==='function' && !confirm(_t('notif_clear_confirm'))) return;
  try{
    var snap=await window._fbDb.collection('users').doc(uid).collection('notifications').get();
    if(!snap.empty){ var batch=window._fbDb.batch(); snap.forEach(function(d){ batch.delete(d.ref); }); await batch.commit(); }
    _notifications=[]; _notifUnread=0;
    renderNotifList(document.getElementById('screen-notifications'));
    if(typeof updateNotifBadge==='function') updateNotifBadge();
    if(typeof showToast==='function') showToast(_t('notif_cleared'),'success');
  }catch(e){ console.warn('clearAllNotifs',e); if(typeof showToast==='function') showToast('Could not clear','error'); }
}
async function markAllNotifsRead(){
  var uid=(window._fbAuth&&window._fbAuth.currentUser)?window._fbAuth.currentUser.uid:null;
  if(!uid||!window._fbDb) return;
  try{
    var snap=await window._fbDb.collection('users').doc(uid).collection('notifications').where('read','==',false).get();
    if(snap.empty){ if(typeof showToast==='function') showToast('All caught up','success'); return; }
    var batch=window._fbDb.batch();
    snap.forEach(function(d){ batch.update(d.ref,{read:true}); });
    await batch.commit();
    if(typeof showToast==='function') showToast('All caught up','success');
    // listener will refresh cache + badge; fallback if no listener
    if(!_notifUnsub) renderNotifications();
  }catch(e){ console.warn('markAllNotifsRead',e); if(typeof showToast==='function') showToast('Could not update','error'); }
}

// ── OPEN GAMES IN NOTIFICATION BELL ──────────────────────
// Loads every active + waiting game for the user (skipping ones already ended locally)
// so they can be listed in the bell with Cancel / Continue actions.
async function loadOpenGames(uid){
  uid = uid || (window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid);
  window._openGames = [];
  if(!uid || !window._fbDb) return [];
  var _t = (typeof t==='function')?t:function(k){return k;};
  function endedLocally(matchId){
    try{ var arr=(typeof _savedRounds!=='undefined'&&_savedRounds)||[]; return arr.some(function(r){return r&&r.id===('m_'+matchId)&&r.matchComplete;}); }catch(_){ return false; }
  }
  var seen={}, out=[];
  async function gather(field){
    var docs=[];
    try{ var s=await window._fbDb.collection('matches').where(field,'==',uid).limit(30).get(); docs=s.docs; }catch(e){ return; }
    docs.forEach(function(d){
      var data=d.data(); var st=data.status;
      if(st!=='active' && st!=='waiting') return;
      if(!data.matchId || seen[data.matchId]) return;
      if(st==='active' && endedLocally(data.matchId)) return;
      var role=(data.teamA && data.teamA.uid===uid)?'A':'B';
      if(st==='waiting'){
        if(role!=='A') return;                          // only the host owns a waiting game
        if(data.teamB && data.teamB.uid) return;        // slot already filled
      }
      seen[data.matchId]=1;
      out.push({
        id:data.matchId, code:data.matchId, role:role, status:st,
        oppName:(role==='A'?(data.teamB&&data.teamB.teamName):(data.teamA&&data.teamA.teamName))||_t('rejoin_opp_fallback'),
        courseName:(data.course&&data.course.name)||'', holes:data.holes||''
      });
    });
  }
  await gather('teamA.uid');
  await gather('teamB.uid');
  out.sort(function(a,b){ return (a.status==='active'?0:1)-(b.status==='active'?0:1); });
  window._openGames = out;
  return out;
}
function renderOpenGameCard(g){
  var _t=(typeof t==='function')?t:function(k){return k;};
  var esc2=(typeof esc==='function')?esc:function(x){return x;};
  var waiting=(g.status==='waiting');
  var title = waiting ? _t('og_title_waiting') : _t('og_title_active').replace('{opp}', g.oppName);
  var bits=[]; if(g.courseName) bits.push(g.courseName); if(g.holes) bits.push(g.holes+'H'); bits.push(_t('og_code')+' '+g.code);
  var badge = waiting
    ? '<span class="og-badge waiting">'+_t('og_badge_waiting')+'</span>'
    : '<span class="og-badge active">'+_t('og_badge_active')+'</span>';
  return '<div class="open-game-card">'
    +'<div class="og-btns">'
      +'<button class="og-btn og-cancel" onclick="openGameCancel(\''+g.id+'\',\''+g.status+'\')">\u2715 '+_t('og_cancel')+'</button>'
      +'<button class="og-btn og-continue" onclick="openGameContinue(\''+g.id+'\',\''+g.role+'\',\''+g.status+'\',\''+g.code+'\')">\u25B6 '+_t('og_continue')+'</button>'
    +'</div>'
    +'<div class="og-info">'+badge
      +'<div class="og-title">'+esc2(title)+'</div>'
      +'<div class="og-sub">'+esc2(bits.join(' \u00b7 '))+'</div>'
    +'</div></div>';
}
function openGameContinue(id, role, status, code){
  window._activeMatchId=id; window._activeMatchRole=role||'A';
  if(status==='waiting'){ if(typeof openMatchCode==='function') openMatchCode(code); }
  else { if(typeof resumeLiveScorecard==='function') resumeLiveScorecard(); }
}
async function openGameCancel(id, status){
  var _t=(typeof t==='function')?t:function(k){return k;};
  var msg = (status==='waiting') ? _t('og_cancel_confirm_waiting') : _t('og_cancel_confirm_active');
  if(typeof confirm==='function' && !confirm(msg)) return;
  try{
    if(status==='waiting'){
      if(typeof abandonMatch==='function') await abandonMatch(id);   // deletes the waiting doc
    } else {
      try{ await window._fbDb.collection('matches').doc(id).update({ status:'complete', completedAt:Date.now() }); }catch(e){}
      if(typeof _markMatchDoneLocally==='function') await _markMatchDoneLocally(id);  // leaves my list even if write blocked
    }
  }catch(e){ console.warn('openGameCancel',e); }
  if(window._activeMatchId===id){ window._activeMatchId=null; window._activeMatchRole=null; if(typeof hideLiveMatchBanner==='function') hideLiveMatchBanner(); }
  await loadOpenGames();
  if(typeof updateNotifBadge==='function') updateNotifBadge();
  renderNotifList(document.getElementById('screen-notifications'));
  if(typeof showToast==='function') showToast(_t('og_cancelled'),'success');
}

function renderMatches(ROOT){
  var all=(typeof _savedRounds!=='undefined'?_savedRounds:[]);
  var isSolo=function(r){ return typeof soloIsRound==='function' && soloIsRound(r); };
  var isM1=function(r){ return typeof m1IsRound==='function' && m1IsRound(r); };
  var rounds=all.filter(function(r){return r && !r.isMatch && !isSolo(r) && !isM1(r);});
  var solos=all.filter(function(r){return r && isSolo(r);});
  var matches=all.filter(function(r){return r && r.isMatch;});
  ROOT._ghType = ROOT._ghType || 'TR';
  ROOT._ghFilter = ROOT._ghFilter || 'All';
  var bTR=ROOT.querySelector('#btnTR'), bTM=ROOT.querySelector('#btnTM');
  if(bTR){ bTR.onclick=function(){ ROOT._ghType='TR'; renderMatches(ROOT); }; bTR.classList.toggle('active',ROOT._ghType==='TR'); }
  if(bTM){ bTM.onclick=function(){ ROOT._ghType='TM'; renderMatches(ROOT); }; bTM.classList.toggle('active',ROOT._ghType==='TM'); }
  var bSO=ROOT.querySelector('#btnSO');
  if(bSO){ bSO.onclick=function(){ ROOT._ghType='SO'; renderMatches(ROOT); }; bSO.classList.toggle('active',ROOT._ghType==='SO'); }
  ROOT.querySelectorAll('.filter-pill').forEach(function(pill){
    var lbl=(pill.textContent||'').trim();
    pill.classList.toggle('active', lbl===ROOT._ghFilter);
    pill.onclick=function(){ ROOT._ghFilter=lbl; renderMatches(ROOT); };
  });
  var trWrap=ROOT.querySelector('#trCards'), tmWrap=ROOT.querySelector('#tmCards');
  var showTR = ROOT._ghType==='TR', showSO = ROOT._ghType==='SO';
  var soWrap=ROOT.querySelector('#soCards');
  if(!soWrap && trWrap){ soWrap=document.createElement('div'); soWrap.id='soCards'; trWrap.parentNode.insertBefore(soWrap, trWrap.nextSibling); }
  if(trWrap) trWrap.style.display=showTR?'block':'none';
  if(tmWrap) tmWrap.style.display=(ROOT._ghType==='TM')?'block':'none';
  if(soWrap) soWrap.style.display=showSO?'block':'none';
  var f=ROOT._ghFilter;
  if(trWrap){ trWrap.innerHTML='';
    var trList=rounds.filter(function(r){return _ghPassFilter(r,f);});
    if(!trList.length){ trWrap.innerHTML='<div style="text-align:center;color:var(--text-3);font-family:Inter,sans-serif;font-size:14px;padding:32px 0;">'+(rounds.length?'No rounds in this filter.':'No team rounds yet.')+'</div>'; }
    trList.forEach(function(r){
      var gross=(r.scores||[]).reduce(function(a,b){return a+(b||0);},0) || r.gross || 0;
      var par=(r.par||[]).reduce(function(a,b){return a+(b||0);},0) || r.parTotal || 0;
      var vs=gross-par; var vsCol=vs>0?'var(--red)':(vs<0?'var(--green)':'var(--text-3)');
      var card=document.createElement('div'); card.className='round-card';
      card.innerHTML='<div class="round-left"><div class="round-date">'+_mDate(r.playedAt||r.date)+'</div>'+
        '<div class="round-course">'+(r.courseName||'Course')+'</div>'+
        '<div class="round-meta">'+(r.loopName||'')+' \u00b7 '+_ghHoles(r)+'H \u00b7 '+((r.team&&r.team.name)||r.teamName||'')+'</div>'+
        '<div class="round-format">'+(r.format||'')+'</div></div>'+
        '<div class="round-right"><div class="round-gross">'+(gross||'\u2013')+'</div><div class="round-par-label">Gross</div>'+
        '<div class="round-vspar" style="color:'+vsCol+';">'+(gross?(vs>0?'+'+vs:vs):'\u2013')+'</div><div class="round-vspar-label">vs Par</div></div>'+
        '<div class="round-chevron">\u203a</div>';
      card.onclick=function(){ window._activeRound=r; if(r.isMatch){ tmOpenSaved(r); } else if(document.getElementById('screen-rounddetail')) showScreen('rounddetail'); else if(typeof showToast==='function') showToast('Coming soon'); };
      trWrap.appendChild(card);
    });
  }
  if(soWrap){ soWrap.innerHTML='';
    var soList=solos.filter(function(r){return _ghPassFilter(r,f);});
    if(!soList.length){ soWrap.innerHTML='<div style="text-align:center;color:var(--text-3);font-family:Inter,sans-serif;font-size:14px;padding:32px 0;">'+(solos.length?'No rounds in this filter.':'No solo rounds yet.')+'</div>'; }
    soList.forEach(function(r){ soWrap.appendChild(soloHistoryCard(r)); });
  }
  if(typeof m1RenderHistory==='function') m1RenderHistory(ROOT, all, f);   // 1vs1 tab (app-match.js)
  if(tmWrap){ tmWrap.innerHTML='';
    var tmList=matches.filter(function(r){return _ghPassFilter(r,f);});
    if(!tmList.length){ tmWrap.innerHTML='<div style="text-align:center;color:var(--text-3);font-family:Inter,sans-serif;font-size:14px;padding:32px 0;">'+(matches.length?'No matches in this filter.':'No team matches yet.')+'</div>'; }
    var OC={Win:'var(--green)',Loss:'var(--red)',Draw:'var(--gold)'};
    tmList.forEach(function(m){
      var r=(_ensureMatchFields(m).result)||{}; var a=r.teamAWon||0,b=r.teamBWon||0; var o=_matchOutcome(m); var col=OC[o];
      var card=document.createElement('div'); card.className='round-card';
      card.innerHTML='<div class="round-left"><div class="round-date">'+_mDate(m.playedAt)+'</div>'+
        '<div class="round-course">'+(m.courseName||'Course')+'</div>'+
        '<div class="round-meta">'+(m.loopName||'')+' \u00b7 '+_ghHoles(m)+'H \u00b7 vs '+((m.teamB&&m.teamB.name)||'Opponent')+'</div>'+
        '<div class="round-format">'+(m.format||'')+' \u00b7 THCP '+((m.teamA&&m.teamA.hcp!=null)?m.teamA.hcp:'\u2013')+' vs '+((m.teamB&&m.teamB.hcp!=null)?m.teamB.hcp:'\u2013')+'</div></div>'+
        '<div class="round-right"><div class="round-gross" style="color:'+col+';">'+a+'\u2013'+b+'</div><div class="round-par-label">Result</div>'+
        '<div class="round-vspar" style="color:'+col+';">'+o+'</div><div class="round-vspar-label">Outcome</div></div>'+
        '<div class="round-chevron">\u203a</div>';
      card.onclick=function(){ window._activeRound=m; tmOpenSaved(m); };
      tmWrap.appendChild(card);
    });
  }
}
window.switchType=function(t){ var R=document.getElementById('screen-matches'); if(R){ R._ghType=t; renderMatches(R); } };



// ── v28 · Profile reminder ─────────────────────────────────────────────
// After sign-in: a pop-up when name, username or gender is missing in the profile, or the public
// profile (what buddies see and search) does not exist yet. "Later" snoozes it for a day on this
// device. As soon as everything is filled in and saved it never shows again (the check simply passes).
// When the profile is opened from the pop-up, the missing fields are outlined.
var _pmNudge = { shownFor: null, fromNudge: false, missing: [] };
function _pmTrim(v){ return String(v == null ? '' : v).trim(); }
async function pmProfileMissing(uid){
  var p = (typeof _profile !== 'undefined' && _profile) || {}, miss = [];
  if (!_pmTrim(p.displayName)) miss.push('name');
  if (!_pmTrim(p.username).replace(/^@/, '')) miss.push('username');
  if (['M', 'F', 'O'].indexOf(p.gender) < 0) miss.push('gender');
  if (!miss.length && uid && window._fbDb) {
    try {
      var s = await window._fbDb.collection('public_profiles').doc(uid).get();
      var d = s.exists ? (s.data() || {}) : null;
      if (!d || !_pmTrim(d.displayName) || !d.gender) miss.push('public');
    } catch (e) { /* offline or blocked: say nothing rather than nag wrongly */ }
  }
  return miss;
}
function _pmSnoozeKey(uid){ return 'pm_profile_nudge_' + uid; }
async function pmProfileNudge(uid){
  uid = uid || (window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid);
  if (!uid || _pmNudge.shownFor === uid) return;
  try { var until = parseInt(localStorage.getItem(_pmSnoozeKey(uid)) || '0', 10); if (until && Date.now() < until) return; } catch (e) {}
  var miss = await pmProfileMissing(uid);
  _pmNudge.missing = miss;
  if (!miss.length) { try { localStorage.removeItem(_pmSnoozeKey(uid)); } catch (e) {} return; }
  // never on top of another pop-up, the sign-in sheet or a scorecard: try again a little later
  var busy = document.getElementById('m1lPrompt') || document.getElementById('pmNudge') ||
             (function(){ var a = document.getElementById('authModal'); return a && a.style.display && a.style.display !== 'none'; })() ||
             /^screen-(trscore|m1score|soloscore|tmscore)$/.test(((document.querySelector('.screen.active') || {}).id) || '');
  if (busy) { setTimeout(function(){ pmProfileNudge(uid); }, 8000); return; }
  _pmNudge.shownFor = uid;
  var label = { name: 'Your name', username: 'A username', gender: 'Your gender, so the right tee ratings are used',
                public: 'Your public profile, so buddies can find you' };
  var ov = document.createElement('div');
  ov.className = 'm1l-prompt'; ov.id = 'pmNudge';
  ov.innerHTML = '<div class="m1l-card">' +
    '<div class="m1l-ic">\uD83D\uDC64</div>' +
    '<div class="m1l-title">Complete your profile</div>' +
    '<div class="m1l-txt">Buddies find you and play against you with these details. Still missing:</div>' +
    '<ul class="pm-miss">' + miss.map(function(k){ return '<li>' + label[k] + '</li>'; }).join('') + '</ul>' +
    '<div class="m1l-btns">' +
      '<button class="m1l-btn primary" type="button" data-act="go">Complete profile</button>' +
      '<button class="m1l-btn link" type="button" data-act="later">Later</button>' +
    '</div></div>';
  ov.addEventListener('click', function(ev){
    var b = ev.target.closest('[data-act]');
    if (!b) { if (ev.target === ov) b = { getAttribute: function(){ return 'later'; } }; else return; }
    var act = b.getAttribute('data-act');
    if (ov.parentNode) ov.parentNode.removeChild(ov);
    if (act === 'go') {
      _pmNudge.fromNudge = true;
      if (document.getElementById('screen-editprofile') && typeof showScreen === 'function') showScreen('editprofile');
    } else {
      try { localStorage.setItem(_pmSnoozeKey(uid), String(Date.now() + 24 * 3600 * 1000)); } catch (e) {}
    }
  });
  document.body.appendChild(ov);
  requestAnimationFrame(function(){ ov.classList.add('open'); });
}
// Outline what is still missing on the Edit Profile screen (only when opened from the pop-up).
function pmProfileMarkMissing(){
  var on = _pmNudge.fromNudge ? _pmNudge.missing : [];
  var mark = function(el, yes){ if (el) el.classList.toggle('pm-missing', !!yes); };
  mark(document.getElementById('f-nickname'), on.indexOf('name') >= 0);
  mark(document.getElementById('f-username'), on.indexOf('username') >= 0);
  var g = document.getElementById('g-female'); mark(g && g.parentNode, on.indexOf('gender') >= 0);
  if (!document._pmMarkWired) {
    document.addEventListener('input', function(e){ if (e.target && e.target.classList && e.target.classList.contains('pm-missing') && _pmTrim(e.target.value)) e.target.classList.remove('pm-missing'); });
    document.addEventListener('click', function(e){ var p = e.target && e.target.closest && e.target.closest('.gender-pills.pm-missing'); if (p) p.classList.remove('pm-missing'); });
    document._pmMarkWired = true;
  }
}
async function pmProfileAfterSave(){
  var uid = window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid;
  if (!uid) return;
  var was = _pmNudge.fromNudge;
  _pmNudge.fromNudge = false;
  var miss = await pmProfileMissing(uid);
  _pmNudge.missing = miss;
  if (!miss.length) {
    try { localStorage.removeItem(_pmSnoozeKey(uid)); } catch (e) {}
    if (was && typeof showToast === 'function') showToast('Profile complete. Thanks!', 'success');
  } else if (was && typeof showToast === 'function') {
    showToast('Saved, but some details are still missing.', 'info');
  }
}


// ── v32 · Change email address (secure) ────────────────────────────────
// 1. Password accounts re-enter their current password every time (re-authentication), even when
//    they signed in a minute ago.
// 2. Firebase sends a confirmation link to the NEW address (verifyBeforeUpdateEmail). The address only
//    changes when that link is clicked, so a typo or someone else's address can never take over the account.
// 3. After the change Firebase emails the OLD address with a link to undo it (Firebase template
//    "Email address change").
// Google-only accounts: the address belongs to the Google account, so the app explains instead.
// Errors are shown in general terms (no hint whether an address is already registered).
var _pmEmailBusy = false;
function _pmProviders(cu){ return ((cu && cu.providerData) || []).map(function(p){ return p && p.providerId; }); }
function _pmEmailMsg(txt, kind){
  var m = document.getElementById('email-edit-msg'); if (!m) return;
  m.textContent = txt || ''; m.className = 'email-edit-msg' + (kind ? ' ' + kind : '');
}
function pmEmailEditPrep(){
  var cu = window._fbAuth && window._fbAuth.currentUser;
  var hasPwd = _pmProviders(cu).indexOf('password') >= 0;
  var form = document.getElementById('email-form'), g = document.getElementById('email-google-note'), btn = document.getElementById('email-send-btn');
  if (form) form.style.display = hasPwd ? '' : 'none';
  if (g) g.style.display = hasPwd ? 'none' : '';
  if (btn) { btn.style.display = hasPwd ? '' : 'none'; btn.disabled = false; }
  var e = document.getElementById('input-email'), p = document.getElementById('input-email-pwd');
  if (e) e.value = ''; if (p) p.value = '';
  _pmEmailMsg('');
  if (hasPwd && e) setTimeout(function(){ e.focus(); }, 50);
}
function _pmEmailOk(v){ return v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
async function pmSendEmailChange(){
  if (_pmEmailBusy) return;
  var cu = window._fbAuth && window._fbAuth.currentUser;
  if (!cu) { _pmEmailMsg('Please sign in first.', 'err'); return; }
  if (_pmProviders(cu).indexOf('password') < 0) { pmEmailEditPrep(); return; }
  var eEl = document.getElementById('input-email'), pEl = document.getElementById('input-email-pwd'), btn = document.getElementById('email-send-btn');
  var email = (eEl && eEl.value || '').trim().toLowerCase(), pwd = (pEl && pEl.value) || '';
  if (!_pmEmailOk(email)) { _pmEmailMsg('Enter a valid email address.', 'err'); if (eEl) eEl.focus(); return; }
  if (cu.email && email === String(cu.email).toLowerCase()) { _pmEmailMsg('This is already your email address.', 'err'); return; }
  if (!pwd) { _pmEmailMsg('Enter your current password to confirm it is you.', 'err'); if (pEl) pEl.focus(); return; }
  _pmEmailBusy = true; if (btn) btn.disabled = true;
  _pmEmailMsg('Sending…');
  try {
    var cred = firebase.auth.EmailAuthProvider.credential(cu.email, pwd);
    await cu.reauthenticateWithCredential(cred);
    await cu.verifyBeforeUpdateEmail(email);
    if (eEl) eEl.value = '';
    _pmEmailMsg('Check your inbox at ' + email + ' and click the link to confirm. Until then your current address stays active. Afterwards you may need to sign in again with the new address.', 'ok');
  } catch (e) {
    var c = (e && e.code) || '';
    var txt = (c === 'auth/wrong-password' || c === 'auth/invalid-credential' || c === 'auth/invalid-login-credentials') ? 'That password is not correct.'
            : (c === 'auth/too-many-requests') ? 'Too many attempts. Please try again later.'
            : (c === 'auth/invalid-email' || c === 'auth/invalid-new-email') ? 'Enter a valid email address.'
            : (c === 'auth/network-request-failed') ? 'No connection. Please try again.'
            : (c === 'auth/email-already-in-use') ? 'This address cannot be used. Please try another one.'
            : 'Could not send the link. Please try again later, or email support@theninthtee.eu.';
    console.warn('email change', c);
    _pmEmailMsg(txt, 'err');
  } finally {
    if (pEl) pEl.value = '';      // never keep the password on screen
    _pmEmailBusy = false; if (btn) btn.disabled = false;
  }
}

/* ── v33 PRIVACY: email addresses never in public profiles ──────────────────
   1. pmPrivacySync(user) runs after every sign-in:
      - removes a leftover `email` field from the user's own public_profiles doc
        (older app versions wrote it there, readable by every signed-in user);
      - keeps a private lookup entry email_index/{sha256(lowercase email)} = {uid}
        so buddies can find this player by typing the FULL email address.
        The rules only allow reading one entry by its exact hash (no listing), and
        only the owner of that email (per their sign-in token) can write it.
   2. pmFindUidByEmail(email) does that exact lookup for the buddy search.        */
async function pmEmailHash(email){
  try{
    var e = String(email||'').trim().toLowerCase();
    if (!e || !window.crypto || !crypto.subtle || typeof TextEncoder==='undefined') return null;
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(e));
    return Array.prototype.map.call(new Uint8Array(buf), function(b){ return ('0'+b.toString(16)).slice(-2); }).join('');
  }catch(_){ return null; }
}
async function pmPrivacySync(user){
  if (!user || !user.uid || !window._fbDb || typeof firebase==='undefined') return;
  var db = window._fbDb, uid = user.uid, del = firebase.firestore.FieldValue.delete();
  // 1. Strip the email from the public profile (only when it is actually there)
  try{
    var pub = await db.collection('public_profiles').doc(uid).get();
    if (pub.exists && pub.data() && ('email' in pub.data())) await db.collection('public_profiles').doc(uid).update({ email: del });
  }catch(e){ console.warn('privacy: public profile cleanup', e && e.code); }
  // 2. Keep the exact-match email lookup current (old entry removed after an email change)
  try{
    var h = await pmEmailHash(user.email);
    // Private bookkeeping (owner-only): which lookup entry belongs to this account
    var prRef = db.collection('users').doc(uid).collection('private').doc('emailIndex');
    var pr = await prRef.get();
    var prev = pr.exists && pr.data() ? pr.data().hash : null;
    if (prev === h) return;
    if (prev){ try{ await db.collection('email_index').doc(prev).delete(); }catch(_){} }
    if (h){
      await db.collection('email_index').doc(h).set({ uid: uid });
      await prRef.set({ hash: h });
    } else if (prev){
      await prRef.delete();
    }
  }catch(e){ console.warn('privacy: email lookup', e && e.code); }
}
async function pmFindUidByEmail(email){
  var h = await pmEmailHash(email);
  if (!h || !window._fbDb) return null;
  var s = await window._fbDb.collection('email_index').doc(h).get();
  return (s.exists && s.data() && s.data().uid) ? s.data().uid : null;
}


/* ── v34 Profile stats: 1vs1 matches count as matches, never as a "best round" ──
   A 1vs1 is saved with isMatch:false + mode:'match1v1' and has no team `scores`,
   so it used to land in Rounds and show as e.g. -34 (0 strokes minus par 34). */
function pmIs1v1(r){ return !!r && r.mode === 'match1v1'; }
/* Which side of a 1vs1 copy is the owner? Normally 'A' (the app stores each player's copy
   from their own side), but older copies may still be from the opponent's side, so go by uid. */
function pmM1Side(m, uid){
  var A = m.playerA || {}, B = m.playerB || {};
  if (uid){ if (A.uid === uid) return 'A'; if (B.uid === uid) return 'B'; }
  return (B.isMe && !A.isMe) ? 'B' : 'A';
}
function pmRoundStats(all, uid){
  all = all || [];
  var rounds = all.filter(function(r){ return !r.isMatch && !pmIs1v1(r); });
  var matches = all.filter(function(r){ return r.isMatch || pmIs1v1(r); });
  var wins = matches.filter(function(m){
    if (pmIs1v1(m)) return !!(m.result && m.result.winner && m.result.winner === pmM1Side(m, uid));
    var mm = (typeof _ensureMatchFields === 'function') ? _ensureMatchFields(m) : m;
    return !!(mm && mm.result && mm.result.teamAWon > mm.result.teamBWon);
  }).length;
  return { rounds: rounds, matches: matches, wins: wins };
}
/* Best stroke round by score vs par, over the holes actually played (score > 0).
   Rounds without any hole score are skipped. Returns null when there is nothing to show. */
function pmBestRound(rounds){
  var list = (rounds || []).filter(function(r){ return r && !r.isMatch && !pmIs1v1(r); }).map(function(r){
    var sc = r.scores || [], par = r.par || [], g = 0, pp = 0, n = 0;
    for (var i = 0; i < sc.length; i++){ var v = Number(sc[i]); if (v > 0 && par[i] != null){ g += v; pp += Number(par[i]) || 0; n++; } }
    if (!n) return null;
    return Object.assign({ _g: g, _vs: g - pp }, r);
  }).filter(Boolean);
  if (!list.length) return null;
  list.sort(function(a, b){ return a._vs - b._vs; });
  return list[0];
}

/* ── v35 Best Result · Match Play ──
   Biggest win over 1vs1 matches and team matches. A 1vs1 closed out earlier ranks higher
   (5&4 > 3&2 > 2 up > 1 up); a win on an extra hole ranks lowest. Team matches rank by holes won
   minus holes lost. Ties: the most recent. Hidden when there is no win. Also hides the
   Stroke Play section when its card is hidden. */
function pmBestMatchWin(matches, uid){
  var best = null;
  (matches || []).forEach(function(m){
    var key, big, opp, fmt;
    var n = m.holes || ((m.par || []).length) || 9;
    if (pmIs1v1(m)){
      var r = m.result || {};
      var side = pmM1Side(m, uid);
      if (!r.winner || r.winner !== side) return;
      if (r.extraHoles > 0){ key = 0; big = (r.text || '').replace(/^at the\s+/i, ''); }
      else {
        var up = Math.abs(Number(r.up) || 0), rem = r.decidedAt ? Math.max(0, n - Number(r.decidedAt)) : 0;
        key = up * 100 + rem; big = r.text || (up + ' up');
      }
      var o = side === 'A' ? m.playerB : m.playerA; opp = o && o.name; fmt = '1vs1';
    } else {
      var mm = (typeof _ensureMatchFields === 'function') ? _ensureMatchFields(m) : m;
      var res = (mm && mm.result) || {};
      var diff = (res.teamAWon || 0) - (res.teamBWon || 0);
      if (diff <= 0) return;
      key = diff * 100; big = diff + ' up';
      opp = mm.teamB && mm.teamB.name; fmt = 'Team Match';
    }
    var t = new Date(m.playedAt || m.date || 0).getTime() || 0;
    if (!best || key > best.key || (key === best.key && t > best.t)) best = { m: m, key: key, big: big, opp: opp, fmt: fmt, t: t, n: n };
  });
  return best;
}
function pmRenderBestMatch(ROOT, matches, uid){
  if (!ROOT) return;
  var ss = ROOT.querySelector('.pm-best-stroke-sec'), sc = ss && ss.querySelector('.best-card');
  if (ss) ss.style.display = (sc && sc.style.display === 'none') ? 'none' : '';
  var sec = ROOT.querySelector('.pm-best-match-sec'); if (!sec) return;
  var b = pmBestMatchWin(matches, uid);
  if (!b){ sec.style.display = 'none'; return; }
  var set = function(sel, v){ var e = sec.querySelector(sel); if (e) e.textContent = v; };
  set('.best-course', b.m.courseName || 'Course');
  var parts = [b.n + 'H', b.fmt];
  if (b.opp) parts.push('vs ' + b.opp);
  if (b.t) parts.push(new Date(b.t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
  set('.best-meta', parts.join(' \u00b7 '));
  set('.best-score', String(b.big || '').toUpperCase());
  sec.style.display = '';
}
