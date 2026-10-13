// Parmate player app — team match flow: shared state + init
// Loaded by index.html with a plain <script src> at its original spot (no defer/async/module).


// ═══════════════════════════════════════════
// TEAM MATCH FLOW — shared state + init dispatch
// Reuses _trFlow for course/your-team/tees (set in TR flow).
// _tmFlow holds the TM-specific opponent team + match data.
// ═══════════════════════════════════════════
if (typeof _tmFlow === 'undefined') var _tmFlow = { opponent: null, holes: 9, matchData: null };
if (typeof _tmInited === 'undefined') var _tmInited = {};

function tmInitStep(id, el) {
  if (id === 'faq' && typeof renderFaq === 'function') renderFaq(el);
  if (id === 'faqtopic' && typeof renderFaqTopic === 'function') renderFaqTopic(el);
  if (id === 'matches' && typeof renderMatches === 'function') renderMatches(el);
  if (id === 'notifications' && typeof renderNotifications === 'function') renderNotifications(el);
  if (id === 'profile' && typeof renderProfile === 'function') renderProfile(el);
  if (id === 'editprofile' && typeof renderEditProfile === 'function') renderEditProfile(el);
  if (id === 'buddyprofile' && typeof renderBuddyProfile === 'function') renderBuddyProfile(el);
  if (id === 'settings' && typeof renderAccountSettings === 'function') renderAccountSettings(el);
  if (id === 'createteam' && typeof renderCreateTeam === 'function') renderCreateTeam(el);
  if (id === 'teamcreated' && typeof renderTeamCreated === 'function') renderTeamCreated(el);
  if (id === 'teamoverview' && typeof renderTeamOverview === 'function') renderTeamOverview(el);
  if (id === 'rounddetail' && typeof renderRoundDetail === 'function') renderRoundDetail(el);
  if (id === 'faqadmin' && typeof window._faqAdminLoad === 'function') window._faqAdminLoad();
  if (id === 'myteams' && typeof renderMyTeams === 'function') renderMyTeams(el);
  if (id === 'tmhcp' && typeof tmRenderHcp === 'function') tmRenderHcp(el);
  if (id === 'tmcode' && typeof tmRenderCode === 'function') tmRenderCode(el);
  if (id === 'tmscore' && typeof tmRenderScore === 'function') tmRenderScore(el);
  if (id === 'tmfull' && typeof tmRenderScore === 'function') tmRenderScore(el);
  if (id === 'tmsummary' && typeof tmRenderSummary === 'function') tmRenderSummary(el);
  const inits = {
    tmopp:  typeof tmInit_tmopp  === 'function' ? tmInit_tmopp  : null,
    tmcode:  typeof tmInit_tmcode  === 'function' ? tmInit_tmcode  : null,
    tmscore: typeof tmInitScorecard === 'function' ? tmInitScorecard : null,
    tmfull:  typeof tmInitScorecard === 'function' ? tmInitScorecard : null,
  };
  if (!inits.hasOwnProperty(id) || !inits[id]) return;
  if (!_tmInited[id]) {
    try { inits[id](el); _tmInited[id] = true; } catch(e){ console.warn('tmInit '+id, e); }
  }
}

// ── Screen 20: Opponent Team Details ──
function tmInit_tmopp(ROOT) {
  let teamSize = 0;
  const q = sel => ROOT.querySelector(sel);
  const setTeamSize = (size) => {
    teamSize = size;
    q('#tmopp_sizeVal').textContent = size + ' Players';
    q('#tmopp_sizeField').classList.remove('placeholder');
    q('#tmopp_sizeField').classList.add('selected');
    for (let i = 1; i <= 4; i++) q('#tmopp_row'+i).classList.toggle('hidden', i > size);
  };
  const autofillPlayers = (players) => {
    players.forEach((p, i) => {
      const n = q('#tmopp_name'+(i+1)), hc = q('#tmopp_hcp'+(i+1)), g = q('#tmopp_g'+(i+1));
      if (n)  { n.value  = p.name; n.classList.add('autofilled'); }
      if (hc) { hc.value = p.hcp;  hc.classList.add('autofilled'); }
      if (g)  { g.value  = p.gender || 'M'; }
    });
  };
  const clearAutofill = () => {
    for (let i = 1; i <= 4; i++) ['name','hcp'].forEach(t => {
      const e = q('#tmopp_'+t+i); if (e){ e.value=''; e.classList.remove('autofilled'); }
    });
    for (let i = 1; i <= 4; i++) { const g = q('#tmopp_g'+i); if (g) g.value = 'M'; }
  };
  const oppInput = q('#tmopp_oppNameInput');
  const oppChev  = q('#tmopp_oppChev');
  const savedDD  = q('#tmopp_savedDD');
  oppChev.addEventListener('click', e => { e.stopPropagation();
    if (savedDD.style.display === 'block') { savedDD.style.display = 'none'; return; }
    savedDD.style.display = 'block';
    tmoppRenderDD(ROOT, savedDD);
  });
  oppInput.addEventListener('input', clearAutofill);
  oppInput.addEventListener('click', e => e.stopPropagation());
  // Dynamic items — use delegation so freshly-rendered teams are clickable
  savedDD.addEventListener('click', e => {
    const item = e.target.closest('.saved-dd-item');
    if (!item || !item.dataset.players) return;   // skip group headers / placeholders
    e.stopPropagation();
    oppInput.value = item.dataset.name;
    savedDD.style.display = 'none';
    setTeamSize(parseInt(item.dataset.size));
    clearAutofill();
    try { autofillPlayers(JSON.parse(item.dataset.players)); } catch(_){}
  });
  const sizeField = q('#tmopp_sizeField'), sizeDD = q('#tmopp_sizeDD');
  const addBtn = q('#tmopp_addPlayerBtn'), playerDD = q('#tmopp_playerDD');
  if (addBtn && playerDD) {
    addBtn.addEventListener('click', e => { e.stopPropagation();
      if (teamSize === 0) { if (typeof showToast === 'function') showToast('Choose team size first', 'error'); return; }
      if (playerDD.style.display === 'block') { playerDD.style.display = 'none'; return; }
      tmoppRenderPlayerDD(); playerDD.style.display = 'block';
    });
    playerDD.addEventListener('click', e => {
      const it = e.target.closest('.tmopp-pd-item'); if (!it) return;
      e.stopPropagation();
      playerDD.style.display = 'none';
      if (it.dataset.guest) {
        for (let i = 1; i <= 4; i++) { const row = q('#tmopp_row'+i); if (row && !row.classList.contains('hidden')) { const ni = q('#tmopp_name'+i); if (ni && !ni.value.trim()) { ni.focus(); break; } } }
        return;
      }
      const ok = tmoppFillNextRow(it.dataset.name, it.dataset.hcp, it.dataset.gender);
      if (!ok && typeof showToast === 'function') showToast('All player slots are full', 'info');
    });
  }
  sizeField.addEventListener('click', e => { e.stopPropagation();
    sizeDD.style.display = sizeDD.style.display === 'block' ? 'none' : 'block'; });
  ROOT.querySelectorAll('.size-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      setTeamSize(parseInt(opt.dataset.size)); clearAutofill();
      sizeDD.style.display = 'none';
    });
  });
  document.addEventListener('click', () => {
    if (savedDD) savedDD.style.display = 'none';
    if (sizeDD)  sizeDD.style.display  = 'none';
    if (playerDD) playerDD.style.display = 'none';
  });
  const doReset = () => {
    oppInput.value = '';
    q('#tmopp_sizeVal').textContent = 'choose # of players 2/3/4';
    q('#tmopp_sizeField').classList.remove('selected');
    q('#tmopp_sizeField').classList.add('placeholder');
    teamSize = 0; clearAutofill();
    for (let i = 1; i <= 4; i++) q('#tmopp_row'+i).classList.add('hidden');
    const dd = q('#tmopp_savedDD'), pdd = q('#tmopp_playerDD');
    if (dd)  dd.style.display  = 'none';
    if (pdd) pdd.style.display = 'none';
  };
  q('#tmopp_resetBtn').addEventListener('click', doReset);
  ROOT._tmoppReset = doReset;
  // expose collector for SAVE / NEXT
  ROOT._tmoppCollect = () => {
    const name = oppInput.value.trim();
    if (!name || teamSize === 0) return null;
    const players = [];
    for (let i = 1; i <= teamSize; i++) {
      const gEl = q('#tmopp_g'+i);
      players.push({ name: q('#tmopp_name'+i).value.trim(),
                     hcp:  parseFloat(q('#tmopp_hcp'+i).value),
                     gender: (gEl && gEl.value) || 'M' });
    }
    return { teamName: name, size: teamSize, players };
  };
  q('#tmopp_saveBtn').addEventListener('click', async () => {
    const t = ROOT._tmoppCollect();
    if (!t) { if (typeof showToast === 'function') showToast('Enter opponent team name, size and players', 'error'); return; }
    _tmFlow.opponent = t;
    const uid = window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid;
    if (uid && window._fbDb) {
      try {
        const col = window._fbDb.collection('users').doc(uid).collection('saved_opponents');
        const nameKey = (t.teamName || '').trim().toLowerCase();
        const snap = await col.get();
        let targetId = null;
        snap.forEach(d => { const dd = d.data() || {}; if ((dd.teamName || '').trim().toLowerCase() === nameKey && targetId === null) targetId = d.id; });
        const doc = {
          teamName: t.teamName,
          teamType: (t.size === 4 ? '4P' : t.size === 3 ? '3P' : '2P'),
          members: (t.players || []).map(p => ({ name: p.name || '', hcp: (p.hcp != null && !isNaN(p.hcp) ? p.hcp : null) })).filter(m => m.name),
          savedAt: new Date().toISOString()
        };
        if (targetId) await col.doc(targetId).set(doc, { merge: true });
        else await col.doc(Date.now().toString()).set(doc);
        if (typeof showToast === 'function') showToast(targetId ? 'Opponent team updated' : 'Opponent team saved', 'success');
        return;
      } catch (e) { console.warn('tmopp save persist', e); }
    }
    const toast = q('#tmopp_toast');
    if (toast) { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2500); }
  });
}

// Load opponent-team options: the host's own saved teams + each buddy's teams.
// Privacy scope: only the user's own teams and their buddies' teams (no global directory).
async function tmoppLoadTeams() {
  const out = [];
  const db  = window._fbDb;
  const sizeOf = (tt, members) => (tt === '4P' ? 4 : tt === '3P' ? 3 : ((members && members.length) || 2));
  const mapMembers = (d) => (d.members || []).map(m => ({ name: m.name || '', hcp: (m.hcp != null ? String(m.hcp) : '') })).filter(m => m.name);
  try {
    const uid = window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid;
    if (db && uid) {
      const snap = await db.collection('users').doc(uid).collection('teams').get().catch(() => null);
      if (snap) snap.forEach(doc => {
        const d = doc.data() || {}; const players = mapMembers(d);
        if (players.length) out.push({ group: 'Your teams', teamName: d.teamName || 'Team', size: sizeOf(d.teamType, players), players });
      });
    }
  } catch (e) { console.warn('tmoppLoadTeams own', e); }
  try {
    const uid = window._fbAuth && window._fbAuth.currentUser && window._fbAuth.currentUser.uid;
    if (db && uid) {
      const snap = await db.collection('users').doc(uid).collection('saved_opponents').get().catch(() => null);
      if (snap) snap.forEach(doc => {
        const d = doc.data() || {}; const players = mapMembers(d);
        if (players.length) out.push({ group: 'Saved opponents', teamName: d.teamName || 'Team', size: sizeOf(d.teamType, players), players });
      });
    }
  } catch (e) { console.warn('tmoppLoadTeams saved_opponents', e); }
  try {
    if (db && Array.isArray(_buddies)) {
      for (const b of _buddies) {
        if (!b || !b.uid) continue;
        const snap = await db.collection('users').doc(b.uid).collection('teams').get().catch(() => null);
        if (snap) snap.forEach(doc => {
          const d = doc.data() || {}; const players = mapMembers(d);
          if (players.length) out.push({ group: (b.name || 'Buddy') + "\u2019s teams", teamName: d.teamName || 'Team', size: sizeOf(d.teamType, players), players });
        });
      }
    }
  } catch (e) { console.warn('tmoppLoadTeams buddies', e); }
  return out;
}

// Render the opponent dropdown from real teams (grouped by source).
async function tmoppRenderDD(ROOT, dd) {
  dd = dd || (ROOT && ROOT.querySelector('#tmopp_savedDD')) || document.getElementById('tmopp_savedDD');
  if (!dd) return;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  dd.innerHTML = '<div class="saved-dd-item" style="cursor:default;color:#777;">Loading teams\u2026</div>';
  let teams = [];
  try { teams = await tmoppLoadTeams(); } catch (_) {}
  if (dd.style.display === 'none') return;   // closed while loading
  if (!teams.length) {
    dd.innerHTML = '<div class="saved-dd-item" style="cursor:default;color:#777;">No saved or buddy teams yet \u2014 enter players below.</div>';
    return;
  }
  let html = '', lastGroup = null;
  teams.forEach(tm => {
    if (tm.group !== lastGroup) {
      html += '<div class="saved-dd-item" style="cursor:default;background:#f0f9f4;color:#1a6b3c;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.05em;">' + esc(tm.group) + '</div>';
      lastGroup = tm.group;
    }
    const meta = tm.size + ' players \u00b7 ' + tm.players.map(p => p.name).filter(Boolean).join(', ');
    html += '<div class="saved-dd-item" data-name="' + esc(tm.teamName) + '" data-size="' + tm.size + '" data-players=\'' + esc(JSON.stringify(tm.players)) + '\'>' +
            '<div class="team-name-dd">' + esc(tm.teamName) + '</div><div class="team-meta-dd">' + esc(meta) + '</div></div>';
  });
  dd.innerHTML = html;
}

// Fill the next empty (visible) opponent row with a looked-up player / guest.
function tmoppFillNextRow(name, hcp, gender) {
  for (let i = 1; i <= 4; i++) {
    const row = document.getElementById('tmopp_row' + i);
    if (!row || row.classList.contains('hidden')) continue;
    const ni = document.getElementById('tmopp_name' + i);
    if (ni && !ni.value.trim()) {
      ni.value = name; ni.classList.add('autofilled');
      const hi = document.getElementById('tmopp_hcp' + i);
      if (hi && hcp != null && hcp !== '') { hi.value = hcp; hi.classList.add('autofilled'); }
      const gi = document.getElementById('tmopp_g' + i);
      if (gi && gender) gi.value = gender;
      return true;
    }
  }
  return false;
}

// Render the opponent player picker: your buddies (player lookup) + a guest option.
function tmoppRenderPlayerDD() {
  const dd = document.getElementById('tmopp_playerDD'); if (!dd) return;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  let html = '';
  const buds = Array.isArray(_buddies) ? _buddies : [];
  if (buds.length) {
    html += '<div style="padding:10px 14px;background:#f0f9f4;color:#1a6b3c;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.05em;">Your buddies</div>';
    buds.forEach(b => {
      html += '<div class="tmopp-pd-item" data-name="' + esc(b.name || '') + '" data-hcp="' + (b.hcp != null ? esc(b.hcp) : '') + '" data-gender="' + esc(b.gender || 'M') + '" style="padding:11px 14px;border-bottom:1px solid #eee;cursor:pointer;font-family:Inter,sans-serif;font-size:13px;"><b>' + esc(b.name || 'Buddy') + '</b>' + (b.hcp != null ? ' \u00b7 HCP ' + esc(b.hcp) : '') + '</div>';
    });
  } else {
    html += '<div style="padding:11px 14px;color:#777;font-size:12px;">No buddies yet \u2014 add a guest below.</div>';
  }
  html += '<div class="tmopp-pd-item" data-guest="1" style="padding:11px 14px;cursor:pointer;font-family:Inter,sans-serif;font-size:13px;color:#1a6b3c;font-weight:600;">\uFF0B Guest \u2014 enter manually</div>';
  dd.innerHTML = html;
}

// Advance from Opponent Team Details to Team Handicap
function tmoppNext() {
  const ROOT = document.getElementById('screen-tmopp');
  const t = ROOT && ROOT._tmoppCollect ? ROOT._tmoppCollect() : null;
  if (!t) { if (typeof showToast==='function') showToast('Enter opponent team name and size','error'); return; }
  _tmFlow.opponent = t;
  if (typeof _trFlow !== 'undefined' && _trFlow) _trFlow._teeTarget = 'opp';
  showScreen('trtee');
}

