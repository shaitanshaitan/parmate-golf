// Parmate player app — hamburger menu overlay
// Loaded by index.html with a plain <script src> at its original spot (no defer/async/module).


// ── Hamburger Menu: true overlay over the current screen (blurred behind) ──
function setMenuLang(lang){ if(typeof setLang==='function') setLang(lang); syncMenuLang(); }
function syncMenuLang(){ var cur='en'; try{ cur=_lang||'en'; }catch(e){} var opts=document.querySelectorAll('#menuOverlay .menu-lang-opt'); opts.forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-lang')===cur); }); }
function openMenu(){
  var ov=document.getElementById('menuOverlay'); if(!ov) return;
  renderMenu(ov);
  syncMenuLang();
  // force reflow so the slide/blur transition runs
  ov.style.display='block'; void ov.offsetWidth;
  ov.classList.add('open'); ov.setAttribute('aria-hidden','false');
}
function closeMenu(){
  var ov=document.getElementById('menuOverlay'); if(!ov) return;
  ov.classList.remove('open'); ov.setAttribute('aria-hidden','true');
  setTimeout(function(){ if(!ov.classList.contains('open')) ov.style.display='none'; }, 320);
}
function menuSignOut(){ closeMenu(); if(typeof doSignOut==="function") doSignOut(); else if(window._fbAuth) window._fbAuth.signOut(); }

// ── Edit Courses (Pro only) ──────────────────────────────────────────────
function openEditCourses(){
  closeMenu();
  if (typeof isProUser === 'function' && !isProUser()) {
    if (typeof showToast === 'function') showToast('Editing courses is a Pro feature — upgrade to edit the shared course database.', 'error');
    return;
  }
  showScreen('editcourses');
  renderEditCoursesList();
}

function renderEditCoursesList(filter){
  var listEl = document.getElementById('ec_courseList');
  if (!listEl) return;
  var courses = (typeof _sharedCourses !== 'undefined' && Array.isArray(_sharedCourses)) ? _sharedCourses.slice() : [];
  var f = (filter || '').trim().toLowerCase();
  if (f) courses = courses.filter(function(c){ return (c.name||'').toLowerCase().indexOf(f) >= 0 || (c.city||'').toLowerCase().indexOf(f) >= 0; });
  courses.sort(function(a,b){ return (a.name||'').localeCompare(b.name||''); });
  if (!courses.length) {
    listEl.innerHTML = '<div class="ec-empty">' + (f ? 'No courses match \u201c' + f + '\u201d.' : 'No courses in the database yet.') + '</div>';
    return;
  }
  listEl.innerHTML = courses.map(function(c){
    var loopCount = Array.isArray(c.loops) ? c.loops.length : 1;
    var hasWomen = Array.isArray(c.loops) ? c.loops.some(function(l){ return Array.isArray(l.women) && l.women.length; }) : (Array.isArray(c.women) && c.women.length);
    var meta = [];
    if (c.city) meta.push(c.city);
    meta.push(loopCount + (loopCount === 1 ? ' loop' : ' loops'));
    if (hasWomen) meta.push('women\u2019s tees');
    var safeId = (c._docId || '').replace(/"/g, '');
    return '<div class="ec-course-row" data-docid="' + safeId + '" onclick="ecPickCourse(\'' + safeId + '\')">' +
             '<div class="ec-course-main">' +
               '<div class="ec-course-name">' + (c.name || 'Unnamed course') + '</div>' +
               '<div class="ec-course-meta">' + meta.join(' \u00b7 ') + '</div>' +
             '</div>' +
             '<span class="ec-course-chevron">\u203a</span>' +
           '</div>';
  }).join('');
}

function ecPickCourse(docId){
  var course = (typeof _sharedCourses !== 'undefined')
    ? _sharedCourses.find(function(c){ return c._docId === docId; }) : null;
  if (!course) { if (typeof showToast === 'function') showToast('Course not found.', 'error'); return; }
  if (typeof acStartEdit === 'function') acStartEdit(course);
}
function renderMenu(ov){
  var nm=ov.querySelector('.menu-user-name');
  if(nm) nm.textContent=(typeof _profile!=='undefined' && _profile && _profile.displayName) ? _profile.displayName : 'Your profile';
  var _mav=ov.querySelector('.menu-avatar-wrap img');
  if(_mav){ var _MAV=(typeof AVATARS!=='undefined')?AVATARS:{}; _mav.src=(typeof _profile!=='undefined'&&_profile)?(_profile.avatarUrl||(_profile.avatarId&&_MAV[_profile.avatarId])||'icons/home-crown.png'):'icons/home-crown.png'; }
  var tier=ov.querySelector('.menu-account-tier');
  if(tier) tier.textContent=(typeof _profile!=='undefined' && _profile && _profile.tier) ? _profile.tier : 'Free account';
  var go=function(target){
    if(target==='legal'){ closeMenu(); if(typeof openLegal==='function') openLegal(); else if(typeof showToast==='function') showToast('Coming soon'); return; }
    if(target==='join'){ closeMenu(); if(typeof openJoinMatch==='function') openJoinMatch(); else if(typeof showToast==='function') showToast('Coming soon'); return; }
    if(target==='buddies'){ closeMenu(); if(typeof openBuddySearch==='function') openBuddySearch(); else if(typeof showToast==='function') showToast('Coming soon'); return; }
    if(target==='messages'){ closeMenu(); if(typeof openInbox==='function') openInbox(); return; }
    if(document.getElementById('screen-'+target)){ showScreen(target); closeMenu(); }
    else if(typeof showToast==='function'){ showToast('Coming soon'); }
  };
  // Show + wire the Pro-only "Edit Courses" item by ID (kept out of the
  // index-based `targets` mapping so inserting it doesn't shift the others).
  var editCoursesItem = ov.querySelector('#menuItemEditCourses');
  var isPro = (typeof isProUser === 'function') && isProUser();
  if (editCoursesItem) {
    editCoursesItem.style.display = isPro ? 'flex' : 'none';
    editCoursesItem.onclick = function(){ openEditCourses(); };
  }
  var targets=['profile','editprofile','settings','legal','buddies','messages','join','faq'];
  ov.querySelectorAll('.menu-item:not(#menuItemEditCourses)').forEach(function(it,idx){ it.onclick=function(){ go(targets[idx]); }; });
}


