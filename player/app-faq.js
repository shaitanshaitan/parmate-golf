// Parmate player app — FAQ screens (data is in faq-data.js)
// Loaded by index.html with a plain <script src> at its original spot (no defer/async/module).


// FAQ data (_FAQ_CATEGORIES, _FAQ_CAT_ORDER, _FAQ_ARTICLES) lives in faq-data.js
var _faqLang = 'en';
function _faqQ(a){ return (_faqLang==='nl' && a.question_nl) ? a.question_nl : a.question_en; }
function _faqCatName(id){ var c=_FAQ_CATEGORIES[id]; return c ? (c[_faqLang]||c.en) : id; }
function _faqBodyBlocks(a){ return (_faqLang==='nl' && a.body_nl && a.body_nl.length) ? a.body_nl : (a.body_en||[]); }
function _faqEsc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function openTopic(id){ window._faqArticleId=id; if(document.getElementById('screen-faqtopic')) showScreen('faqtopic'); }

// ── FAQ: live data from Firestore + admin gate ──
window.PARMATE_ADMINS = window.PARMATE_ADMINS || [];  // fill with your admin uid(s) or email(s)
function _isAdmin(){
  if (typeof _profile !== 'undefined' && _profile && _profile.isAdmin) return true;
  var cu = window._fbAuth && window._fbAuth.currentUser;
  if (cu) { if (window.PARMATE_ADMINS.indexOf(cu.uid) >= 0) return true; if (cu.email && window.PARMATE_ADMINS.indexOf(cu.email) >= 0) return true; }
  return false;
}
function _faqLoadFromFirestore(){
  if (window._faqLoaded || !window._fbDb) return;
  window._faqLoaded = true;
  window._fbDb.collection('faq_articles').orderBy('order').get().then(function(snap){
    var arr = []; snap.forEach(function(d){ arr.push(Object.assign({ id: d.id }, d.data())); });
    if (arr.length) { _FAQ_ARTICLES = arr; var R = document.getElementById('screen-faq'); if (R && typeof renderFaq === 'function') renderFaq(R); }
  }).catch(function(){ window._faqLoaded = false; });
}
function renderFaq(ROOT){
  _faqLoadFromFirestore();
  var articles=_FAQ_ARTICLES;
  // admin entry (gated)
  var _ba=ROOT.querySelector('.body-area'); var _ab=ROOT.querySelector('#faqAdminEntry');
  if(_isAdmin()){
    if(!_ab && _ba){ _ab=document.createElement('button'); _ab.id='faqAdminEntry'; _ab.className='faq-admin-entry'; _ab.type='button'; _ab.textContent='\u2699 Manage FAQ (admin)'; _ab.onclick=function(){ showScreen('faqadmin'); }; _ba.insertBefore(_ab, _ba.firstChild); }
    if(_ab) _ab.style.display='';
  } else if(_ab){ _ab.style.display='none'; }
  // Most asked
  var wrap=ROOT.querySelector('#mostAskedList'); var most=ROOT.querySelector('#mostAsked');
  if(wrap){ wrap.innerHTML='';
    var pop=articles.filter(function(a){return a.isPopular;}).sort(function(a,b){return a.order-b.order;});
    if(!pop.length && most){ most.style.display='none'; } else if(most){ most.style.display='block'; }
    pop.forEach(function(a){
      var el=document.createElement('div'); el.className='faq-pop'; el.setAttribute('data-q',_faqQ(a).toLowerCase());
      el.onclick=function(){ openTopic(a.id); };
      el.innerHTML='<div class="fp-icon">?</div><div class="fp-q">'+_faqEsc(_faqQ(a))+'</div><div class="fp-chevron">\u203a</div>';
      wrap.appendChild(el);
    });
  }
  // Categories
  var cw=ROOT.querySelector('#faqCats'); if(cw){ cw.innerHTML='';
    _FAQ_CAT_ORDER.forEach(function(catId){
      var inCat=articles.filter(function(a){return a.categoryId===catId;}).sort(function(a,b){return a.order-b.order;});
      if(!inCat.length) return;
      var t=document.createElement('div'); t.className='faq-cat-title'; t.textContent=_faqCatName(catId); cw.appendChild(t);
      var g=document.createElement('div'); g.className='faq-group';
      inCat.forEach(function(a){
        var row=document.createElement('div'); row.className='faq-row'; row.setAttribute('data-q',_faqQ(a).toLowerCase());
        row.onclick=function(){ openTopic(a.id); };
        row.innerHTML='<div class="fr-q">'+_faqEsc(_faqQ(a))+'</div><div class="fr-chevron">\u203a</div>';
        g.appendChild(row);
      });
      cw.appendChild(g);
    });
  }
  var nr=ROOT.querySelector('#noResults'); if(nr) nr.style.display='none';
  var inp=ROOT.querySelector('#faqSearch'); if(inp) inp.value='';
}
window.filterFaq=function(){
  var ROOT=document.getElementById('screen-faq'); if(!ROOT) return;
  var term=((ROOT.querySelector('#faqSearch')||{}).value||'').trim().toLowerCase();
  var rows=ROOT.querySelectorAll('.faq-row'), groups=ROOT.querySelectorAll('.faq-group'), titles=ROOT.querySelectorAll('.faq-cat-title');
  var most=ROOT.querySelector('#mostAsked'), nr=ROOT.querySelector('#noResults');
  if(!term){ rows.forEach(function(r){r.style.display='flex';}); groups.forEach(function(g){g.style.display='block';});
    titles.forEach(function(c){c.style.display='block';}); if(most)most.style.display='block'; if(nr)nr.style.display='none'; return; }
  if(most)most.style.display='none'; var any=false;
  groups.forEach(function(group,gi){ var gr=group.querySelectorAll('.faq-row'); var has=false;
    gr.forEach(function(r){ var mt=(r.dataset.q||'').includes(term); r.style.display=mt?'flex':'none'; if(mt){has=true;any=true;} });
    group.style.display=has?'block':'none'; if(titles[gi]) titles[gi].style.display=has?'block':'none'; });
  if(nr){ nr.style.display=any?'none':'block'; if(!any){ var st=ROOT.querySelector('#searchTerm'); if(st) st.textContent=term; } }
};

function _faqRenderBody(blocks){
  return (blocks||[]).map(function(b){
    if(b.type==='p') return '<p>'+_faqEsc(b.text)+'</p>';
    if(b.type==='h3') return '<h3>'+_faqEsc(b.text)+'</h3>';
    if(b.type==='formula') return '<div class="formula-box">'+_faqEsc(b.text)+'</div>';
    if(b.type==='tip') return '<div class="tip-box"><span class="tip-icon">\ud83d\udca1</span><p>'+_faqEsc(b.text)+'</p></div>';
    if(b.type==='steps') return '<ol class="step-list">'+(b.items||[]).map(function(it){return '<li>'+_faqEsc(it)+'</li>';}).join('')+'</ol>';
    return '';
  }).join('');
}
function renderFaqTopic(ROOT){
  var id=window._faqArticleId; var a=_FAQ_ARTICLES.filter(function(x){return x.id===id;})[0] || _FAQ_ARTICLES[0];
  if(!a) return;
  var bc=ROOT.querySelector('#bcCat'); if(bc) bc.textContent=_faqCatName(a.categoryId);
  var ti=ROOT.querySelector('#articleTitle'); if(ti) ti.textContent=_faqQ(a);
  var rt=ROOT.querySelector('#readTime'); if(rt) rt.textContent=(a.readTime||1)+' min read';
  var ab=ROOT.querySelector('#articleBody'); if(ab) ab.innerHTML=_faqRenderBody(_faqBodyBlocks(a));
  // related
  var rel=_FAQ_ARTICLES.filter(function(x){return x.categoryId===a.categoryId && x.id!==a.id;}).slice(0,3);
  if(!rel.length) rel=_FAQ_ARTICLES.filter(function(x){return x.id!==a.id;}).slice(0,3);
  var rw=ROOT.querySelector('#relatedList'); if(rw){ rw.innerHTML='';
    rel.forEach(function(r){ var row=document.createElement('div'); row.className='related-row';
      row.onclick=function(){ openTopic(r.id); };
      row.innerHTML='<div class="rr-q">'+_faqEsc(_faqQ(r))+'</div><div class="rr-chevron">\u203a</div>'; rw.appendChild(row); });
  }
  ROOT.querySelectorAll('.fb-btn').forEach(function(b){ b.classList.remove('selected'); });
  var th=ROOT.querySelector('#fbThanks'); if(th) th.classList.remove('visible');
  var ba=ROOT.querySelector('.body-area'); if(ba) ba.scrollTop=0;
}
window.rate=function(val){
  var ROOT=document.getElementById('screen-faqtopic'); if(!ROOT) return;
  ROOT.querySelectorAll('.fb-btn').forEach(function(b){ b.classList.remove('selected'); });
  var btn=ROOT.querySelector('.fb-btn.'+val); if(btn) btn.classList.add('selected');
  var th=ROOT.querySelector('#fbThanks'); if(th) th.classList.add('visible');
};

