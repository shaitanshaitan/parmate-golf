/* Parmate player app — Dutch translation engine (same method as Brigvanti).
   The app is written in English. lang-nl.js holds window.PM_STRINGS_NL = { "English text": "Dutch text" }.
   When the language is NL this engine replaces English text after it is drawn, including text that
   scripts add later (MutationObserver), placeholders/titles/aria-labels/alt and alert/confirm/prompt.
   Switching back to EN restores the original English in place, without a reload.
   {0}, {1} in a key match any value ("{0} holes" -> "{0} holes" -> "{0} holes").
   Elements (and their children) with data-no-i18n are never touched (use for user content).
   Debug: open the app with ?i18n=debug in NL -> untranslated English is collected in window.__i18nMiss
          (console: copy([...__i18nMiss].join('\n')) and paste into a text file for the tool).
   Loaded by index.html with a plain <script src> after lang-nl.js, before app-main.js. */
(function(){
var D=window.PM_STRINGS_NL||{},EX={},PAT=[],
    INL={B:1,STRONG:1,I:1,EM:1,BR:1},
    SKIP={SCRIPT:1,STYLE:1,TEXTAREA:1,INPUT:1,CODE:1,PRE:1,NOSCRIPT:1,svg:1,SVG:1},
    ATTR=['placeholder','aria-label','title','alt'],
    Q=location.search,DEBUG=/i18n=debug/.test(Q),HARVEST=/i18n=harvest/.test(Q);
window.__i18nMiss=new Set(); window.__i18nAll=new Set();
var active=false,changed=new Set(),obs=null,busy=false;

function norm(t){return String(t).replace(/\s+/g,' ').trim();}
function rx(t){return t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
Object.keys(D).forEach(function(k){var v=D[k],nk=norm(k);if(!v)return;
  if(/\{\d+\}/.test(nk)){var order=[],re='^'+nk.split(/(\{\d+\})/).map(function(p){var m=p.match(/^\{(\d+)\}$/);
    if(m){order.push(+m[1]);return '(.*?)';}return rx(p);}).join('')+'$';
    PAT.push({re:new RegExp(re),order:order,v:v,len:nk.replace(/\{\d+\}/g,'').length});}
  else EX[nk]=v;});
/* "✓ Code copied!" -> "✓ Code gekopieerd!" also serves "Code copied!" (same text without the icon). */
Object.keys(EX).forEach(function(k){var m=k.match(/^([^A-Za-z0-9{<]+)(.+)$/);if(!m)return;var v=EX[k];
  var b=m[2],vb=v.indexOf(m[1])===0?norm(v.slice(m[1].length)):null;
  if(vb&&!Object.prototype.hasOwnProperty.call(EX,b))EX[b]=vb;});
PAT.sort(function(a,b){return b.len-a.len;});

function tr(s){var n=norm(s);if(!n)return null;if(HARVEST)window.__i18nAll.add(n);
  if(Object.prototype.hasOwnProperty.call(EX,n))return EX[n];
  for(var i=0;i<PAT.length;i++){var m=n.match(PAT[i].re);if(m){var val={};PAT[i].order.forEach(function(ix,j){var c=m[j+1];
    val[ix]=Object.prototype.hasOwnProperty.call(EX,norm(c))?EX[norm(c)]:c;});
    return PAT[i].v.replace(/\{(\d+)\}/g,function(x,d){return d in val?val[d]:x;});}}
  return null;}
function esc(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function sig(el){var out='',txt=false,tags=false;for(var c=el.firstChild;c;c=c.nextSibling){
  if(c.nodeType===3){out+=c.nodeValue;if(/\S/.test(c.nodeValue))txt=true;}
  else if(c.nodeType===1){if(!INL[c.tagName])return null;tags=true;var t=c.tagName.toLowerCase();
    if(t==='br'){out+='<br>';continue;}var s=sig(c);if(!s)return null;out+='<'+t+'>'+s.s+'</'+t+'>';if(s.txt)txt=true;}
  else if(c.nodeType!==8)return null;}
  return {s:out,txt:txt,tags:tags};}
function build(v,el){var q={};el.querySelectorAll('b,strong,i,em').forEach(function(e){var t=e.tagName.toLowerCase();
  (q[t]=q[t]||[]).push(e.outerHTML.slice(0,e.outerHTML.indexOf('>')+1));});
  return v.split(/(<\/?(?:b|strong|i|em)>|<br>)/).map(function(p,i){if(i%2===0)return esc(p);
    var m=p.match(/^<(b|strong|i|em)>$/);return m&&q[m[1]]&&q[m[1]].length?q[m[1]].shift():p;}).join('');}
function miss(t){if(DEBUG&&/[A-Za-z]{3,}/.test(t))window.__i18nMiss.add(norm(t));}
/* Fallback for text the app glues together: keep a leading symbol such as ← or ★,
   and translate the parts around " · " or " | " one by one. */
function trText(v){var t=tr(v);if(t!==null)return t;var n=norm(v),m=n.match(/^([^A-Za-z0-9{]+)(.+)$/);
  if(m){var r=trText(m[2]);if(r!==null)return m[1]+r;}
  var sep=n.indexOf(' · ')>0?' · ':(n.indexOf(' | ')>0?' | ':null);
  if(sep){var ps=n.split(sep),hit=false;ps=ps.map(function(p){var x=trText(p);if(x!==null){hit=true;return x;}return p;});
    if(hit)return ps.join(sep);}
  return null;}

function attrs(el){if(!el.getAttribute)return;ATTR.forEach(function(a){var v=el.getAttribute(a);if(!v)return;
  if(a==='placeholder'&&(el.hasAttribute('data-i18n-ph')||el.hasAttribute('data-i18n')))return;
  if(!active){if(HARVEST)tr(v);return;}
  var t=tr(v);if(t&&t!==v){(el.__pmEnAttr=el.__pmEnAttr||{})[a]=v;(el.__pmNlAttr=el.__pmNlAttr||{})[a]=t;el.setAttribute(a,t);changed.add(el);}
  else if(!t)miss(v);});}
function text(n){var v=n.nodeValue;if(!/\S/.test(v))return;
  if(!active){if(HARVEST)trText(v);return;}
  var t=trText(v);
  if(t){var nv=v.match(/^\s*/)[0]+t+v.match(/\s*$/)[0];if(nv!==v){n.__pmEn=v;n.__pmNl=nv;n.nodeValue=nv;changed.add(n);}}
  else miss(v);}
/* Text owned by the older key system (data-i18n, set by applyLang from lang.js) is left alone. */
function skipped(el){return el.closest&&el.closest('[data-no-i18n],[data-i18n],[data-i18n-html]');}
function visit(n){
  if(n.nodeType===3){var p=n.parentNode;if(p&&p.nodeType===1&&!SKIP[p.tagName]&&!skipped(p))text(n);return;}
  if(n.nodeType!==1||n.hasAttribute('data-no-i18n'))return;
  if(SKIP[n.tagName]){if(n.tagName==='INPUT'||n.tagName==='TEXTAREA')attrs(n);return;}   /* placeholders of inputs */
  if(n.hasAttribute('data-i18n')||n.hasAttribute('data-i18n-html'))return;
  attrs(n);
  var s=sig(n);
  if(s&&s.txt&&s.tags){
    if(!active){if(HARVEST)tr(s.s);return;}
    var t=tr(s.s);if(t){var en=n.innerHTML;n.innerHTML=build(t,n);n.__pmEnHTML=en;n.__pmNlHTML=n.innerHTML;changed.add(n);return;}}
  for(var c=n.firstChild;c;){var nx=c.nextSibling;visit(c);c=nx;}}

function restore(){changed.forEach(function(x){
  if(!x.isConnected)return;
  if(x.nodeType===3){if(x.nodeValue===x.__pmNl)x.nodeValue=x.__pmEn;}
  else{
    if(x.__pmEnHTML!==undefined&&x.innerHTML===x.__pmNlHTML)x.innerHTML=x.__pmEnHTML;
    if(x.__pmEnAttr)Object.keys(x.__pmEnAttr).forEach(function(a){if(x.getAttribute(a)===x.__pmNlAttr[a])x.setAttribute(a,x.__pmEnAttr[a]);});
    x.__pmEnHTML=undefined;x.__pmEnAttr=undefined;}});
  changed=new Set();}

function onMut(ms){if(busy||(!active&&!HARVEST)){return;}busy=true;try{ms.forEach(function(m){
    if(m.type==='childList')m.addedNodes.forEach(visit);else if(m.type==='characterData')visit(m.target);
    else if(m.type==='attributes')attrs(m.target);});}finally{if(obs)obs.takeRecords();busy=false;}}
function startObs(){if(obs||!document.body)return;obs=new MutationObserver(onMut);
  obs.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTR});}
function run(){if(!document.body)return;busy=true;try{visit(document.body);}finally{if(obs)obs.takeRecords();busy=false;}}

function want(){var l='en';try{l=localStorage.getItem('parmate_lang')||((navigator.language||'').toLowerCase().indexOf('nl')===0?'nl':'en');}catch(e){}return l;}
function setLang(l){
  var on=(l==='nl');document.documentElement.lang=on?'nl':'en';
  if(on===active){if(on)run();return;}
  if(on){active=true;run();}
  else{active=false;busy=true;try{restore();}finally{if(obs)obs.takeRecords();busy=false;}}
}
/* Native dialogs are not part of the page, so translate their message directly. */
['alert','confirm','prompt'].forEach(function(fn){var orig=window[fn];if(typeof orig!=='function')return;
  window[fn]=function(msg){var a=[].slice.call(arguments);if(active&&typeof msg==='string'){var t=trText(msg);if(t)a[0]=t;else miss(msg);}
    else if(HARVEST&&typeof msg==='string')trText(msg);return orig.apply(window,a);};});

window.pmI18n={tr:function(s){var t=trText(s);return t===null?s:t;},setLang:setLang,isNl:function(){return active;},
  rescan:run,keys:function(){return Object.keys(EX).length+PAT.length;}};

function init(){startObs();active=(want()==='nl');document.documentElement.lang=active?'nl':'en';run();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
