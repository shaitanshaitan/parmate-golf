/* parmate.golf shared script. Generated pages load this with defer.
   Photos: Unsplash (free licence). To use your own, put a file in /assets/photos/ and change the path here. */
(function(){
  var NL = (document.documentElement.lang || 'en').slice(0,2) === 'nl';

  var PHOTOS = {
    hero: 'https://images.unsplash.com/photo-1629673120178-53a664eec9e8?auto=format&fit=crop&w=2000&q=70',
    why:  'https://images.unsplash.com/photo-1629928515074-0a76b71e9954?auto=format&fit=crop&w=1100&q=75',
    p1:   'https://images.unsplash.com/photo-1775326424702-4eca92f63cef?auto=format&fit=crop&w=1200&q=72',
    p2:   'https://images.unsplash.com/photo-1626298022400-84e2c187be08?auto=format&fit=crop&w=900&q=72'
  };
  document.querySelectorAll('[data-photo]').forEach(function(el){
    var u = PHOTOS[el.getAttribute('data-photo')]; if (u) el.style.backgroundImage = "url('" + u + "')";
  });
  var yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* Team handicap calculator: the same formula as the app (trCalcTeam).
     Course handicap = index x slope / 113 + (rating - par), unrounded; players sorted low to high;
     WHS scramble allowances applied; total rounded once. */
  var rows = document.getElementById('rows');
  if (rows){
    var ALLOW = {2:[.35,.15],3:[.30,.20,.10],4:[.25,.20,.15,.10]};
    var DEF = [8.2,14.5,21.3,28.0], NAMES = ['Jan','Robbie','Sanne','Mo'];
    var size = 2, idx = DEF.slice(), out = document.getElementById('thcp');
    var parse = function(x){ var v = parseFloat(String(x).replace(',', '.')); return isNaN(v) ? null : v; };
    var num = function(id){ return parse(document.getElementById(id).value); };
    var show = function(n){ return NL ? String(n).replace('.', ',') : String(n); };
    var fmt = function(n){ return (Math.round(n*10)/10).toFixed(NL ? 1 : 1).replace('.', NL ? ',' : '.'); };
    var calc = function(){
      var cr=num('cr'), sl=num('sl'), par=num('par'), ps=[];
      for (var i=0;i<size;i++){
        var ch = (idx[i]==null||cr==null||sl==null||par==null) ? null : idx[i]*sl/113 + (cr-par);
        ps.push({i:i,ch:ch,pct:null,ct:null});
      }
      var ok = ps.filter(function(p){return p.ch!=null;}).sort(function(a,b){return a.ch-b.ch;});
      var pc = ALLOW[size], total = 0;
      ok.forEach(function(p,k){ p.pct = pc[Math.min(k,pc.length-1)]; p.ct = p.ch*p.pct; total += p.ct; });
      ps.forEach(function(p){
        rows.querySelector('[data-ch="'+p.i+'"]').textContent = p.ch==null?'':fmt(p.ch);
        rows.querySelector('[data-pc="'+p.i+'"]').textContent = p.pct==null?'':Math.round(p.pct*100)+'%';
        rows.querySelector('[data-ct="'+p.i+'"]').textContent = p.ct==null?'':fmt(p.ct);
      });
      out.textContent = ok.length ? Math.round(total) : '';
    };
    var build = function(){
      var h = '', lab = NL ? 'Handicap index van ' : 'Handicap index ';
      for (var i=0;i<size;i++){
        h += '<tr><td class="who">'+NAMES[i]+'</td>'
           + '<td><input type="text" inputmode="decimal" data-i="'+i+'" value="'+(idx[i]==null?'':show(idx[i]))+'" aria-label="'+lab+NAMES[i]+'"></td>'
           + '<td class="hide-s" data-ch="'+i+'"></td><td data-pc="'+i+'"></td><td data-ct="'+i+'"></td></tr>';
      }
      rows.innerHTML = h;
      rows.querySelectorAll('input').forEach(function(inp){
        inp.addEventListener('input', function(){ idx[+inp.dataset.i] = parse(inp.value); calc(); });
      });
      calc();
    };
    ['cr','sl','par'].forEach(function(id){ document.getElementById(id).addEventListener('input', calc); });
    document.querySelectorAll('[data-size]').forEach(function(b){
      b.addEventListener('click', function(){
        size = +b.dataset.size;
        document.querySelectorAll('[data-size]').forEach(function(x){ x.setAttribute('aria-pressed', x===b?'true':'false'); });
        build();
      });
    });
    build();
  }

  /* Forms (Netlify Forms): course requests and the newsletter. Each form sends from the page
     and swaps to its thank you panel. Required fields carry data-required. */
  document.querySelectorAll('form[data-netlify]').forEach(function(f){
    var fields = f.querySelector('.form-fields'), sent = f.querySelector('.sent'), err = f.querySelector('.form-err');
    var btn = f.querySelector('button[type="submit"]'), label = btn ? btn.textContent : '';
    var subject = f.querySelector('input[name="subject"]');
    var show = function(){ fields.hidden = true; sent.classList.add('show'); sent.focus(); };
    if (new RegExp('[?&]sent=' + f.getAttribute('name') + '(&|$)').test(location.search)) show();
    f.addEventListener('submit', function(e){
      e.preventDefault();
      if (err) err.classList.remove('show');
      var first = null;
      f.querySelectorAll('[data-required]').forEach(function(el){
        var wrap = el.closest('.field') || el.parentNode;
        var bad = el.type === 'checkbox' ? !el.checked : !el.value.trim();
        if (!bad && el.type === 'email') bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
        wrap.classList.toggle('bad', bad);
        if (bad && !first) first = el;
      });
      if (first){ first.focus(); return; }
      if (subject && subject.dataset.prefix){
        var c = f.querySelector('[name="course"]'), p = f.querySelector('[name="place"]');
        subject.value = subject.dataset.prefix + (c ? c.value.trim() : '') + (p && p.value.trim() ? ' (' + p.value.trim() + ')' : '');
      }
      var named = sent.querySelector('[data-echo]');
      if (named){ var src = f.querySelector('[name="' + named.dataset.echo + '"]'); if (src && src.value.trim()) named.textContent = src.value.trim(); }
      btn.disabled = true; btn.textContent = NL ? 'Versturen...' : 'Sending...';
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                   body: new URLSearchParams(new FormData(f)).toString() })
        .then(function(r){ if (!r.ok) throw new Error(r.status); f.reset(); show(); })
        .catch(function(){ if (err) err.classList.add('show'); })
        .then(function(){ btn.disabled = false; btn.textContent = label; });
    });
    var again = f.querySelector('.again');
    if (again) again.addEventListener('click', function(){
      sent.classList.remove('show'); fields.hidden = false; var x = f.querySelector('input:not([type=hidden]),textarea'); if (x) x.focus();
    });
  });
})();
