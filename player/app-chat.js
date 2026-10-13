// Parmate player app — buddy messaging
// Loaded by index.html with a plain <script src> at its original spot (no defer/async/module).

// ── Buddy messaging: async short DMs (buddies only, 280 chars) ───────────────
let _chatThreadId = null;
let _chatPeer     = null;   // { uid, name, avatar }
let _chatUnsub    = null;
let _bannedWords  = null;   // cached lowercase list from config/moderation

function _chatMyUid(){ return (window._fbAuth && window._fbAuth.currentUser) ? window._fbAuth.currentUser.uid : null; }
function _threadIdFor(a, b){ return (a < b) ? (a + '_' + b) : (b + '_' + a); }

async function _loadBannedWords(){
  if (_bannedWords) return _bannedWords;
  _bannedWords = [];
  try {
    const snap = await window._fbDb.collection('config').doc('moderation').get();
    if (snap.exists){ const w = snap.data().bannedWords; if (Array.isArray(w)) _bannedWords = w.map(function(x){ return String(x).toLowerCase(); }); }
  } catch(e){ /* no list yet -> empty */ }
  return _bannedWords;
}
function _findBanned(text){
  if (!_bannedWords || !_bannedWords.length) return null;
  const low = ' ' + text.toLowerCase().replace(/[^a-z0-9\u00c0-\u024f]+/gi, ' ') + ' ';
  for (let i = 0; i < _bannedWords.length; i++){ const w = _bannedWords[i]; if (w && low.indexOf(' ' + w + ' ') !== -1) return w; }
  return null;
}

function openChatFromBuddyProfile(){
  const b = window._activeBuddy;
  if (!b || !b.uid){ if (typeof showToast === 'function') showToast('No buddy selected.', 'error'); return; }
  const avatar = (typeof _avatarFor === 'function') ? _avatarFor(b) : (b.avatarUrl || null);
  openChatWith({ uid: b.uid, name: (b.name || b.displayName || '\u2014'), avatar: avatar });
}

function openChatWith(peer){
  const me = _chatMyUid();
  if (!me){ if (typeof showToast === 'function') showToast('Please sign in.', 'error'); return; }
  if (!peer || !peer.uid) return;
  _chatPeer = peer;
  _chatThreadId = _threadIdFor(me, peer.uid);
  _loadBannedWords();
  const av = document.getElementById('chatPeerAvatar'); if (av) av.src = peer.avatar || 'icons/home-crown.png';
  const nm = document.getElementById('chatPeerName'); if (nm) nm.textContent = peer.name || '\u2014';
  const inp = document.getElementById('chatInput'); if (inp) inp.value = '';
  const box = document.getElementById('chatMessages');
  if (box){ box.innerHTML = ''; const e = document.createElement('div'); e.className = 'chat-empty'; e.textContent = (typeof t === 'function' ? t('chat_empty') : 'No messages yet.'); box.appendChild(e); }
  showScreen('chat');
  onChatInput();
  _attachChatListener();
  _loadMyBlock(peer.uid).then(_applyChatBlockUI);
}

function _chatTime(ts){
  try {
    let d; if (ts && ts.toDate) d = ts.toDate(); else if (typeof ts === 'number') d = new Date(ts); else return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch(e){ return ''; }
}

function _attachChatListener(){
  if (_chatUnsub){ try { _chatUnsub(); } catch(e){} _chatUnsub = null; }
  if (!_chatThreadId) return;
  const box = document.getElementById('chatMessages');
  _chatUnsub = window._fbDb.collection('threads').doc(_chatThreadId)
    .collection('messages').orderBy('at', 'asc').limit(300)
    .onSnapshot(function(snap){
      if (!box) return;
      box.innerHTML = '';
      if (snap.empty){ const e = document.createElement('div'); e.className = 'chat-empty'; e.textContent = (typeof t === 'function' ? t('chat_empty') : 'No messages yet.'); box.appendChild(e); return; }
      const me = _chatMyUid();
      snap.forEach(function(doc){
        const m = doc.data() || {};
        const wrap = document.createElement('div'); wrap.className = 'cbubble ' + (m.from === me ? 'me' : 'them');
        const ct = document.createElement('span'); ct.className = 'ct'; ct.textContent = m.text || '';
        const mt = document.createElement('span'); mt.className = 'cmeta'; mt.textContent = _chatTime(m.at);
        wrap.appendChild(ct); wrap.appendChild(mt); box.appendChild(wrap);
      });
      box.scrollTop = box.scrollHeight;
      _markThreadRead();
    }, function(err){ console.warn('chat listener', err); });
}

async function _markThreadRead(){
  const me = _chatMyUid(); if (!me || !_chatThreadId) return;
  const patch = {}; patch[me] = 0;
  try { await window._fbDb.collection('threads').doc(_chatThreadId).set({ unread: patch }, { merge: true }); } catch(e){ /* thread may not exist yet */ }
}

function onChatInput(){
  const inp = document.getElementById('chatInput');
  const btn = document.getElementById('chatSendBtn');
  const ctr = document.getElementById('chatCounter');
  if (!inp) return;
  inp.style.height = 'auto'; inp.style.height = Math.min(inp.scrollHeight, 96) + 'px';
  const total = inp.value.length;
  const len = inp.value.trim().length;
  if (ctr){ ctr.textContent = total + ' / 280'; ctr.style.display = total > 0 ? 'block' : 'none'; ctr.className = 'chat-counter' + (total > 280 ? ' over' : ''); }
  if (btn) btn.disabled = !(len > 0 && total <= 280);
}

function chatKeydown(e){
  if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); const btn = document.getElementById('chatSendBtn'); if (btn && !btn.disabled) sendChatMessage(); }
}

async function sendChatMessage(){
  const inp = document.getElementById('chatInput');
  const me = _chatMyUid();
  if (!inp || !me || !_chatThreadId || !_chatPeer) return;
  const text = inp.value.trim();
  if (!text || text.length > 280) return;
  if (!isProUser()) {
    if (typeof showToast === 'function') showToast('Messaging is a Pro feature — upgrade to chat with your buddies.', 'error');
    return;
  }
  await _loadBannedWords();
  if (_findBanned(text)){ if (typeof showToast === 'function') showToast((typeof t === 'function' ? t('chat_banned') : 'Please remove inappropriate language.'), 'error'); return; }
  const btn = document.getElementById('chatSendBtn'); if (btn) btn.disabled = true;
  const parts = [me, _chatPeer.uid].sort();
  const ref = window._fbDb.collection('threads').doc(_chatThreadId);
  const inc = firebase.firestore.FieldValue.increment(1);
  const unreadPatch = {}; unreadPatch[_chatPeer.uid] = inc;
  try {
    await ref.set({ participants: parts, updatedAt: Date.now(), lastMessage: { text: text, from: me, at: Date.now() }, unread: unreadPatch }, { merge: true });
    await ref.collection('messages').add({ from: me, text: text, at: Date.now() });
    inp.value = ''; onChatInput();
  } catch(e){
    console.warn('send message', e);
    const code = (e && e.code) || '';
    if (code === 'permission-denied'){ if (typeof showToast === 'function') showToast((typeof t === 'function' ? t('chat_blocked') : "This user doesn't accept messages"), 'info'); }
    else { if (typeof showToast === 'function') showToast((typeof t === 'function' ? t('chat_send_failed') : 'Could not send.'), 'error'); }
    if (btn) btn.disabled = false;
  }
}

function closeChat(){
  if (_chatUnsub){ try { _chatUnsub(); } catch(e){} _chatUnsub = null; }
  _chatThreadId = null; _chatPeer = null;
  if (typeof screenBack === 'function') screenBack();
}

// ── Block / unblock ──────────────────────────────────────────────────────────
let _chatPeerBlocked = false;

async function _loadMyBlock(peerUid){
  _chatPeerBlocked = false;
  const me = _chatMyUid(); if (!me || !peerUid) return;
  try { const s = await window._fbDb.collection('users').doc(me).collection('blocks').doc(peerUid).get(); _chatPeerBlocked = !!(s && s.exists); }
  catch(e){ _chatPeerBlocked = false; }
}

function _applyChatBlockUI(){
  const composer = document.querySelector('#screen-chat .chat-composer');
  const counter  = document.getElementById('chatCounter');
  const bar      = document.getElementById('chatBlockedBar');
  const btn      = document.getElementById('chatBlockBtn');
  const tt = (typeof t === 'function') ? t : function(k){ return k; };
  if (_chatPeerBlocked){
    if (composer) composer.style.display = 'none';
    if (counter)  counter.style.display = 'none';
    if (bar)      bar.style.display = 'flex';
    if (btn) btn.classList.add('is-blocked');
    var _lblB = document.getElementById('chatBlockLabel'); if (_lblB) _lblB.textContent = tt('chat_unblock_user');
  } else {
    if (composer) composer.style.display = 'flex';
    if (bar)      bar.style.display = 'none';
    if (btn) btn.classList.remove('is-blocked');
    var _lblU = document.getElementById('chatBlockLabel'); if (_lblU) _lblU.textContent = tt('chat_block_user');
    if (typeof onChatInput === 'function') onChatInput();
  }
}

async function chatToggleBlock(){
  const me = _chatMyUid(); if (!me || !_chatPeer) return;
  const tt = (typeof t === 'function') ? t : function(k){ return k; };
  const ref = window._fbDb.collection('users').doc(me).collection('blocks').doc(_chatPeer.uid);
  try {
    if (_chatPeerBlocked){
      await ref.delete(); _chatPeerBlocked = false;
      if (typeof showToast === 'function') showToast(tt('chat_unblocked'), 'info');
    } else {
      if (!confirm(tt('chat_block_confirm').replace('{name}', _chatPeer.name || ''))) return;
      await ref.set({ at: Date.now() }); _chatPeerBlocked = true;
      if (typeof showToast === 'function') showToast(tt('chat_blocked_done'), 'info');
    }
    _applyChatBlockUI();
  } catch(e){ console.warn('toggle block', e); if (typeof showToast === 'function') showToast('Could not update. Please try again.', 'error'); }
}


// ── Inbox (conversation list) + bell unread ──────────────────────────────────
var _msgUnread = 0;
let _inboxUnsub = null;
let _threadsBellUnsub = null;

function _peerInfo(puid){
  const list = (typeof _buddies !== 'undefined' && _buddies) ? _buddies : [];
  const b = list.find(function(x){ return x.uid === puid; });
  if (b){ const av = (typeof _avatarFor === 'function') ? _avatarFor(b) : (b.avatarUrl || null); return { uid: puid, name: (b.name || b.displayName || 'Buddy'), avatar: av }; }
  return { uid: puid, name: 'Buddy', avatar: null };
}

function openInbox(){
  const me = _chatMyUid(); if (!me) return;
  showScreen('inbox');
  const list = document.getElementById('inboxList');
  if (list) list.innerHTML = '<div class="inbox-empty">' + (typeof t === 'function' ? t('inbox_loading') : 'Loading\u2026') + '</div>';
  if (_inboxUnsub){ try { _inboxUnsub(); } catch(e){} _inboxUnsub = null; }
  _inboxUnsub = window._fbDb.collection('threads').where('participants', 'array-contains', me)
    .onSnapshot(function(snap){ _renderInbox(snap, me); }, function(err){ console.warn('inbox', err); });
}

function _renderInbox(snap, me){
  const list = document.getElementById('inboxList'); if (!list) return;
  const rows = [];
  snap.forEach(function(d){ const td = d.data() || {}; td._id = d.id; rows.push(td); });
  rows.sort(function(a, b){ return (b.updatedAt || 0) - (a.updatedAt || 0); });
  if (!rows.length){ list.innerHTML = '<div class="inbox-empty">' + (typeof t === 'function' ? t('inbox_empty') : 'No conversations yet.') + '</div>'; return; }
  list.innerHTML = '';
  rows.forEach(function(th){
    const peerUid = (th.participants || []).filter(function(u){ return u !== me; })[0];
    if (!peerUid) return;
    const info = _peerInfo(peerUid);
    const unread = (th.unread && th.unread[me]) || 0;
    const row = document.createElement('div'); row.className = 'ibx-row' + (unread > 0 ? ' unread' : '');
    const img = document.createElement('img'); img.src = info.avatar || 'icons/home-crown.png'; img.alt = '';
    const main = document.createElement('div'); main.className = 'ibx-main';
    const top = document.createElement('div'); top.className = 'ibx-top';
    const nm = document.createElement('span'); nm.className = 'ibx-name'; nm.textContent = info.name;
    const tm = document.createElement('span'); tm.className = 'ibx-time'; tm.textContent = _chatTime(th.updatedAt);
    top.appendChild(nm); top.appendChild(tm);
    const prev = document.createElement('div'); prev.className = 'ibx-prev'; prev.textContent = (th.lastMessage && th.lastMessage.text) ? th.lastMessage.text : '';
    main.appendChild(top); main.appendChild(prev);
    row.appendChild(img); row.appendChild(main);
    if (unread > 0){ const bdg = document.createElement('span'); bdg.className = 'ibx-badge'; bdg.textContent = unread > 9 ? '9+' : String(unread); row.appendChild(bdg); }
    row.onclick = function(){ openChatWith({ uid: peerUid, name: info.name, avatar: info.avatar }); };
    list.appendChild(row);
  });
}

function startThreadsBellListener(uid){
  if (!uid || !window._fbDb) return;
  stopThreadsBellListener();
  try {
    _threadsBellUnsub = window._fbDb.collection('threads').where('participants', 'array-contains', uid)
      .onSnapshot(function(snap){
        let tot = 0; snap.forEach(function(d){ const td = d.data() || {}; tot += (td.unread && td.unread[uid]) || 0; });
        _msgUnread = tot;
        if (typeof updateNotifBadge === 'function') updateNotifBadge();
        var _ns = document.getElementById('screen-notifications'); if (_ns && _ns.classList.contains('active') && typeof renderNotifList === 'function') renderNotifList(_ns);
      }, function(err){ console.warn('threads bell', err); });
  } catch(e){ console.warn('startThreadsBellListener', e); }
}
function stopThreadsBellListener(){ if (_threadsBellUnsub){ try { _threadsBellUnsub(); } catch(e){} _threadsBellUnsub = null; } _msgUnread = 0; if (typeof updateNotifBadge === 'function') updateNotifBadge(); }
