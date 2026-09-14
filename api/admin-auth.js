/**
 * POST /api/admin-auth — admin login. Fail-closed, persistently rate-limited.
 *
 * Body: { password: string, remember?: boolean }
 * Success: 200 { ok:true, token, expiresAt } (HMAC-signed, 12h or 30d).
 * Failure: 401 { ok:false, error } with generic message (no oracle).
 * Locked:  429 { ok:false, error, retryAfter } + Retry-After header.
 *
 * Rate limit: 5 fails / 15min window -> exponential lockout
 * (15m, 30m, 1h, 2h cap), stored in-memory AND in Supabase
 * (messi_admin_rate_limits) so Vercel cold starts / concurrent
 * isolates cannot reset it. Requires SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY for the persistent layer (else the
 * X-RateLimit-Store header reports memory-single-instance).
 */
import {
  WINDOW_MS,
  MAX_FAILS,
  getClientIp,
  verifyPassword,
  verifyDevFallback,
  signToken,
  checkRateLimit,
  recordFail,
  clearFails,
  rateLimitStore,
  sleep,
} from './_auth-shared.js';

function setSecurityHeaders(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
}

function rateHeaders(res, remaining) {
  res.setHeader('RateLimit-Limit', String(MAX_FAILS));
  res.setHeader('RateLimit-Remaining', String(Math.max(0, remaining ?? 0)));
  res.setHeader('RateLimit-Window', `${Math.round(WINDOW_MS / 1000)}s`);
  res.setHeader('X-RateLimit-Store', rateLimitStore());
}

/** Same-origin (or dev) only — blocks evil-site CSRF brute force. */
function originAllowed(req) {
  const origin = String(req.headers?.origin || '').toLowerCase();
  const referer = String(req.headers?.referer || '').toLowerCase();
  const probe = origin || referer;
  if (!probe) return true; // curl / same-origin navigations without Origin
  try {
    const host = new URL(probe).hostname.toLowerCase();
    return (
      host === 'messistat.com' ||
      host.endsWith('.messistat.com') ||
      host.endsWith('.vercel.app') ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '[::1]'
    );
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  setSecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (!originAllowed(req)) {
    return res.status(403).json({ ok: false, error: 'Forbidden origin' });
  }

  const ip = getClientIp(req);

  // Persistent rate-limit check (survives refresh, cold starts, multi-instance)
  const rl = await checkRateLimit(ip);
  rateHeaders(res, rl.remaining);
  if (rl.limited) {
    res.setHeader('Retry-After', String(rl.retryAfterSec));
    return res.status(429).json({
      ok: false,
      error: `Too many attempts. Locked for ${Math.ceil(rl.retryAfterSec / 60)} minute(s).`,
      retryAfter: rl.retryAfterSec,
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    if (body.length > 4096) return res.status(413).json({ ok: false, error: 'Payload too large' });
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  if (body == null || typeof body !== 'object') body = {};
  const password = body.password != null ? String(body.password) : '';
  const remember = body.remember === true;
  if (!password) {
    return res.status(400).json({ ok: false, error: 'Missing password' });
  }
  if (password.length > 256) {
    return res.status(400).json({ ok: false, error: 'Password too long' });
  }

  let verdict = verifyPassword(password);
  let mode = verdict.mode;
  if (!verdict.ok && verdict.reason !== 'misconfigured') {
    // Local-dev convenience only: localhost + non-production, never in prod
    const dev = verifyDevFallback(password, req);
    if (dev.ok) {
      verdict = dev;
      mode = dev.mode;
    }
  }

  if (verdict.reason === 'misconfigured') {
    // Fail closed — never fall back to a hardcoded hash in production
    return res.status(503).json({
      ok: false,
      error: 'Admin auth is not configured (set ADMIN_PASSWORD_HASH + ADMIN_SALT in Vercel ENV)',
    });
  }

  if (verdict.ok) {
    await clearFails(ip, rl.key);
    const { token, expiresAt } = signToken(remember);
    rateHeaders(res, MAX_FAILS);
    if (mode && mode !== 'scrypt') res.setHeader('X-Auth-Mode', mode);
    return res.status(200).json({ ok: true, token, expiresAt });
  }

  // Failure: tarpit (slows online brute force) + count + exponential lockout
  const fail = await recordFail(ip, rl);
  await sleep(Math.min(1000, 250 * Math.max(1, MAX_FAILS - (rl.remaining ?? MAX_FAILS) + 1)));
  rateHeaders(res, 0);
  if (fail.locked) {
    res.setHeader('Retry-After', String(fail.retryAfterSec));
    return res.status(429).json({
      ok: false,
      error: `Too many attempts. Locked for ${Math.ceil(fail.retryAfterSec / 60)} minute(s).`,
      retryAfter: fail.retryAfterSec,
    });
  }
  return res.status(401).json({ ok: false, error: 'Incorrect passphrase.' });
}
