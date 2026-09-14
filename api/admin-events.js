/**
 * GET /api/admin-events — admin analytics proxy. Requires Bearer session
 * token from POST /api/admin-auth. Reads Supabase with the SERVICE_ROLE
 * key (server-side only) so the anon key can be INSERT-only and the
 * client bundle never holds read access to the analytics table.
 */
import { getClientIp, verifyToken, cleanEnv } from './_auth-shared.js';

// Light per-IP throttle for the proxy itself (per isolate, best-effort)
const hits = new Map();
const PROXY_WINDOW_MS = 60 * 1000;
const PROXY_MAX = 120;

function proxyAllowed(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.start > PROXY_WINDOW_MS) {
    hits.set(ip, { count: 1, start: now });
    return true;
  }
  rec.count += 1;
  return rec.count <= PROXY_MAX;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const auth = String(req.headers?.authorization || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const v = verifyToken(token);
  if (!v.ok) {
    return res.status(v.expired ? 401 : 401).json({
      ok: false,
      error: v.expired ? 'Session expired. Log in again.' : 'Unauthorized.',
    });
  }

  const ip = getClientIp(req);
  if (!proxyAllowed(ip)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ ok: false, error: 'Too many requests. Slow down.' });
  }

  const url = cleanEnv(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL).replace(/\/$/, '');
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) {
    return res.status(503).json({
      ok: false,
      error: 'Admin events proxy is not configured (set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)',
    });
  }

  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 8000);
    let upstream;
    try {
      upstream = await fetch(
        `${url}/rest/v1/messi_page_events?order=created_at.desc&limit=5000&select=id,client_id,session_id,event,path,referrer,user_agent,country_code,device_type,meta,created_at`,
        { headers: { apikey: key, Authorization: 'Bearer ' + key }, signal: c.signal }
      );
    } finally {
      clearTimeout(t);
    }
    if (!upstream.ok) {
      return res.status(502).json({ ok: false, error: `Upstream error (${upstream.status})` });
    }
    const data = await upstream.json();
    const events = (Array.isArray(data) ? data : []).filter((e) => e && e.event !== 'admin_auth_config');
    return res.status(200).json({ ok: true, events, fetchedAt: new Date().toISOString() });
  } catch {
    return res.status(502).json({ ok: false, error: 'Upstream request failed' });
  }
}
