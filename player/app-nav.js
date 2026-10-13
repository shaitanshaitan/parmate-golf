// Parmate player app — global nav router (dock tabs + header icons)
// Loaded by index.html with a plain <script src> at its original spot (no defer/async/module).

// ═══════════════════════════════════════════════════════════
// GLOBAL NAV ROUTER — delegated handling for dock tabs + header icons.
// Works on every screen (present & future) without per-button wiring.
// Elements that carry their own onclick self-handle; the rest route by
// position. Missing destinations fall back to a "coming soon" toast.
// ═══════════════════════════════════════════════════════════
(function(){
  var TAB_TARGETS  = ['home','myteams','matches','faq'];          // Home, Teams, Matches, Info
  var ICON_TARGETS = ['buddies','notifications','menu'];          // add-buddy, bell, hamburger
  function go(target){
    if(!target) return;
    if(target==='menu'){ if(typeof openMenu==='function') openMenu(); return; }
    if(target==='buddies'){ if(typeof openBuddySearch==='function') openBuddySearch(); else if(typeof showToast==='function') showToast('Coming soon'); return; }
    if(document.getElementById('screen-'+target)){
      try { showScreen(target); } catch(_){}
    } else if (typeof showToast === 'function') {
      showToast('Coming soon');
    }
  }
  function tabTarget(tab){
    var al=(tab.getAttribute('aria-label')||'').toLowerCase();
    var byAria={'home':'home','teams':'myteams','matches':'matches','scramble info':'faq','info':'faq'}[al];
    if(byAria) return byAria;
    var nav=tab.closest('.bottom-nav'); if(!nav) return null;
    var tabs=[].slice.call(nav.querySelectorAll('.nav-tab'));
    return TAB_TARGETS[tabs.indexOf(tab)] || null;
  }
  function iconTarget(icon){
    var al=(icon.getAttribute('aria-label')||'').toLowerCase();
    var byAria={'add buddy':'buddies','notifications':'notifications','menu':'menu'}[al];
    if(byAria) return byAria;
    var hdr=icon.closest('.header-icons')||icon.closest('.app-header'); if(!hdr) return null;
    var icons=[].slice.call(hdr.querySelectorAll('.icon-btn'));
    return ICON_TARGETS[icons.indexOf(icon)] || null;
  }
  document.addEventListener('click', function(e){
    var tab=e.target.closest && e.target.closest('.nav-tab');
    if(tab && !tab.getAttribute('onclick')){ go(tabTarget(tab)); return; }
    var icon=e.target.closest && e.target.closest('.icon-btn');
    if(icon && !icon.getAttribute('onclick')){ go(iconTarget(icon)); return; }
  }, false);
})();
