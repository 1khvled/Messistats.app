/**
 * POST /api/track — public analytics insert proxy. Hides Supabase URL +
 * anon key from the client bundle entirely.
 *
 * Body: { client_id, session_id, event, path, referrer, user_agent,
 *         country_code, device_type, meta, created_at }
 * Validates same rules as the RLS WITH CHECK policy, throttles per IP,
 * then inserts via SERVICE_ROLE (server-side only).
 */
import { getClientIp } from './_auth-shared.js';

const ALLOWED_EVENTS = new Set(['view', 'ping', 'birthday_search', 'video_play', 'share']);

// Per-IP throttle: best-effort memory (per isolate) + never blocks legitimate traffic hard
const hits = new Map(); // ip -> {count, start}
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 30; // 30 inserts/min/IP is plenty for 45s heartbeat + views
const MAX_BODY = 6000;

function allowedByThrottle(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.start > WINDOW_MS) {
    hits.set(ip, { count: 1, start: now });
    return true;
  }
  rec.count += 1;
  // soft: still allow but delay; hard cap at 120/min to block floods
  return rec.count <= 120;
}

function originAllowed(req) {
  const probe = String(req.headers?.origin || req.headers?.referer || '').toLowerCase();
  if (!probe) return true; // direct navigation / beacon without Origin is ok for analytics
  try {
    const host = new URL(probe).hostname.toLowerCase();
    return (
      host === 'messistat.com' ||
      host.endsWith('.messistat.com') ||
      host.endsWith('.vercel.app') ||
      host === 'localhost' ||
      host === '127.0.0.1'
    );
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  // Admin traffic is never tracked — drop it server-side too
  const refPath = String(req.headers?.referer || '');
  if (refPath.includes('/admin')) return res.status(204).end();
  if (!originAllowed(req)) return res.status(403).json({ ok: false, error: 'Forbidden origin' });

  const ip = getClientIp(req);
  if (!allowedByThrottle(ip)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ ok: false, error: 'Too many requests' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    if (body.length > MAX_BODY) return res.status(413).json({ ok: false, error: 'Payload too large' });
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid JSON' });
    }
  }
  if (!body || typeof body !== 'object') return res.status(400).json({ ok: false, error: 'Invalid payload' });

  // ---- Validation (mirrors RLS WITH CHECK) ----
  const event = typeof body.event === 'string' ? body.event.trim().slice(0, 20) : '';
  if (!ALLOWED_EVENTS.has(event)) return res.status(400).json({ ok: false, error: 'Invalid event' });

  const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : v == null ? null : String(v).slice(0, max));
  const client_id = str(body.client_id, 80);
  const session_id = body.session_id == null ? null : str(body.session_id, 80);
  const path = str(body.path, 200);
  const referrer = body.referrer == null ? null : str(body.referrer, 200);
  const user_agent = body.user_agent == null ? null : str(body.user_agent, 300);
  const country_code = body.country_code == null ? null : str(body.country_code, 8);
  const device_type = body.device_type == null ? null : str(body.device_type, 16);
  let meta = body.meta;
  if (meta == null) meta = {};
  if (typeof meta !== 'object' || Array.isArray(meta)) return res.status(400).json({ ok: false, error: 'Invalid meta' });
  try {
    if (JSON.stringify(meta).length > 4000) return res.status(400).json({ ok: false, error: 'Meta too large' });
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid meta' });
  }
  if (!client_id || client_id.length < 1) return res.status(400).json({ ok: false, error: 'Missing client_id' });
  if (!path || path.length < 1) return res.status(400).json({ ok: false, error: 'Missing path' });

  const row = {
    client_id,
    session_id,
    event,
    path,
    referrer,
    user_agent,
    country_code,
    device_type,
    meta,
  };

  const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) return res.status(503).json({ ok: false, error: 'Tracking proxy not configured' });

  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 4000);
    let upstream;
    try {
      upstream = await fetch(`${url}/rest/v1/messi_page_events`, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: 'Bearer ' + key,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(row),
        signal: c.signal,
      });
    } finally {
      clearTimeout(t);
    }
    if (!upstream.ok) {
      const txt = await upstream.text().catch(() => '');
      // Don't leak upstream details to client
      return res.status(502).json({ ok: false, error: 'Upstream insert failed' });
    }
    return res.status(204).end();
  } catch {
    return res.status(502).json({ ok: false, error: 'Upstream error' });
  }
}
