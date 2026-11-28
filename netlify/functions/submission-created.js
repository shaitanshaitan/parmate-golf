// netlify/functions/submission-created.js
//
// Netlify runs this automatically for every verified form submission
// (the function name "submission-created" is a Netlify event trigger).
//
// For the "newsletter" form on parmate.golf it adds the subscriber to
// MailerLite, in the group for the visitor's language:
//   "Parmate newsletter EN"  or  "Parmate newsletter NL"
// The groups are created on first use. Signups without the consent box
// ticked are ignored (the form already requires it).
//
// Double opt-in: decided by the MailerLite account setting. With double
// opt-in switched on, MailerLite sends the confirmation email itself and
// the subscriber stays "unconfirmed" until they click it.
//
// The submission is always kept in Netlify Forms as well, so nothing is
// lost if MailerLite is down or the key is missing.
//
// ── SETUP REQUIRED (Netlify → Site configuration → Environment variables) ──
//   MAILERLITE_API_KEY   MailerLite → Integrations → MailerLite API → Generate new token
//   Scope: Functions. Without it this function does nothing.

const API = 'https://connect.mailerlite.com/api';
const GROUPS = { en: 'Parmate newsletter EN', nl: 'Parmate newsletter NL' };

function ml(path, opts = {}) {
  return fetch(API + path, {
    ...opts,
    headers: {
      Authorization: 'Bearer ' + process.env.MAILERLITE_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
}

async function groupId(name) {
  const r = await ml('/groups?limit=100&filter[name]=' + encodeURIComponent(name));
  if (!r.ok) throw new Error('groups list ' + r.status);
  const found = ((await r.json()).data || []).find((g) => g.name === name);
  if (found) return found.id;
  const c = await ml('/groups', { method: 'POST', body: JSON.stringify({ name }) });
  if (!c.ok) throw new Error('group create ' + c.status);
  return (await c.json()).data.id;
}

function stamp(d) {
  // MailerLite wants "yyyy-MM-dd HH:mm:ss" (UTC)
  return new Date(d || Date.now()).toISOString().slice(0, 19).replace('T', ' ');
}

exports.handler = async (event) => {
  let payload;
  try {
    payload = JSON.parse(event.body).payload;
  } catch (e) {
    return { statusCode: 400, body: 'bad payload' };
  }
  if (!payload || payload.form_name !== 'newsletter') return { statusCode: 200, body: 'not newsletter' };

  const data = payload.data || {};
  const email = String(data.email || '').trim();
  if (!email || !data.consent) return { statusCode: 200, body: 'no email or consent' };
  if (!process.env.MAILERLITE_API_KEY) {
    console.warn('newsletter signup kept in Netlify only: MAILERLITE_API_KEY not set');
    return { statusCode: 200, body: 'no key' };
  }

  const lang = String(data.language || 'en').toLowerCase().startsWith('nl') ? 'nl' : 'en';
  try {
    const gid = await groupId(GROUPS[lang]);
    const body = { email, groups: [gid], opted_in_at: stamp(payload.created_at) };
    if (data.ip) body.optin_ip = data.ip;
    const r = await ml('/subscribers', { method: 'POST', body: JSON.stringify(body) });
    if (!r.ok) throw new Error('subscriber ' + r.status + ' ' + (await r.text()).slice(0, 300));
    console.log('newsletter signup sent to MailerLite, group', GROUPS[lang]);
    return { statusCode: 200, body: 'ok' };
  } catch (e) {
    // Never fail the form: the entry stays in Netlify Forms and can be imported later.
    console.error('MailerLite sync failed:', e.message);
    return { statusCode: 200, body: 'kept in Netlify' };
  }
};
