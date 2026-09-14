/**
 * Shared auth helpers for Vercel serverless admin endpoints.
 * - Password verify: scrypt (strong) + legacy sha256(salt+pw) for migration.
 * - Session tokens: HMAC-SHA256 signed, expiry enforced, no server state.
 * - Rate limiting: in-memory L1 (per isolate) + Supabase L2 (persistent
 *   across Vercel cold starts / concurrent instances).
 */
import crypto from 'node:crypto';

export const WINDOW_MS = 15 * 60 * 1000;
export const MAX_FAILS = 5;
// Exponential lockout: 15m, 30m, 1h, 2h (capped)
export const BASE_LOCKOUT_MS = 15 * 60 * 1000;
export const MAX_LOCKOUT_MS = 2 * 60 * 60 * 1000;

const memFails = new Map(); // key(ipHash) -> {count, firstAt, lastAt, lockedUntil, lockouts}

export function sha256hex(s) {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

export function safeEqualStr(a, b) {
  const ba = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function getClientIp(req) {
  const fwd = req.headers?.['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim().slice(0, 80);
  const real = req.headers?.['x-real-ip'];
  if (typeof real === 'string' && real.length) return real.trim().slice(0, 80);
  return req.socket?.remoteAddress || 'unknown';
}

export function isProduction() {
  return process.env.VERCEL_ENV === 'production';
}

export function isLocalHost(req) {
  const host = String(req.headers?.host || req.headers?.['x-forwarded-host'] || '').toLowerCase();
  return (
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1') ||
    host.startsWith('[::1]') ||
    host.startsWith('192.168.') ||
    host.startsWith('10.')
  );
}

/** Salt must be secret in production — never the public default. */
export function getSalt() {
  const s = process.env.ADMIN_SALT || '';
  if (s && s.length >= 16) return s;
  if (isProduction()) return null; // fail closed — operator must set ADMIN_SALT
  return '(dev-salt-removed)'; // local dev only
}

export function getSessionSecret() {
  const s = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SALT || '';
  if (s && s.length >= 16) return s;
  if (isProduction()) return null; // fail closed
  return '(dev-secret-removed)';
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64url(s) {
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

/** Issue a signed session token. remember=true -> 30d, else 12h. */
export function signToken(remember) {
  const secret = getSessionSecret();
  const now = Date.now();
  const exp = now + (remember ? 30 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000);
  const payload = JSON.stringify({ v: 1, exp, n: crypto.randomBytes(12).toString('hex') });
  const p = b64url(payload);
  const sig = b64url(crypto.createHmac('sha256', secret).update(p).digest());
  return { token: `${p}.${sig}`, expiresAt: exp };
}

/** Verify token. Returns {ok, expiresAt} — never throws. */
export function verifyToken(token) {
  try {
    const secret = getSessionSecret();
    if (!secret || typeof token !== 'string') return { ok: false };
    const parts = token.split('.');
    if (parts.length !== 2) return { ok: false };
    const [p, sig] = parts;
    if (!p || !sig || p.length > 2000 || sig.length > 200) return { ok: false };
    const expect = b64url(crypto.createHmac('sha256', secret).update(p).digest());
    if (!safeEqualStr(sig, expect)) return { ok: false };
    const payload = JSON.parse(unb64url(p).toString('utf8'));
    if (!payload || payload.v !== 1 || typeof payload.exp !== 'number') return { ok: false };
    if (Date.now() > payload.exp) return { ok: false, expired: true };
    return { ok: true, expiresAt: payload.exp };
  } catch {
    return { ok: false };
  }
}

/**
 * Verify admin password against ENV.
 * Returns {ok:true, mode} or {ok:false, reason:'misconfigured'}.
 * NEVER falls back to a hardcoded hash in production.
 */
export function verifyPassword(password) {
  const salt = getSalt();
  if (!salt) return { ok: false, reason: 'misconfigured' };

  const envHash = (process.env.ADMIN_PASSWORD_HASH || '').trim();
  const envPass = (process.env.ADMIN_PASSWORD || '').trim();

  if (envHash) {
    // Strong format: scrypt$N$r$p$saltHex$hashHex
    if (envHash.startsWith('scrypt$')) {
      try {
        const [, Ns, rs, ps, saltHex, hashHex] = envHash.split('$');
        const N = parseInt(Ns, 10);
        const r = parseInt(rs, 10);
        const p = parseInt(ps, 10);
        if (!N || !r || !p || !saltHex || !hashHex) return { ok: false };
        const derived = crypto.scryptSync(String(password), Buffer.from(saltHex, 'hex'), 64, { N, r, p });
        const ok = safeEqualStr(derived.toString('hex'), hashHex.toLowerCase());
        return ok ? { ok: true, mode: 'scrypt' } : { ok: false };
      } catch {
        return { ok: false };
      }
    }
    // Legacy: 64-hex sha256(salt + password) — accepted for migration
    if (/^[a-f0-9]{64}$/i.test(envHash)) {
      const ok = safeEqualStr(sha256hex(salt + password), envHash.toLowerCase());
      return ok ? { ok: true, mode: 'legacy-sha256' } : { ok: false };
    }
    return { ok: false, reason: 'misconfigured' };
  }

  if (envPass) {
    // Plaintext compare via double-hash to avoid length-timing leak
    if (/^[a-f0-9]{64}$/i.test(envPass)) {
      const ok = safeEqualStr(sha256hex(salt + password), envPass.toLowerCase());
      return ok ? { ok: true, mode: 'legacy-sha256' } : { ok: false };
    }
    const ok = safeEqualStr(sha256hex('pw:' + password), sha256hex('pw:' + envPass));
    return ok ? { ok: true, mode: 'plaintext-env' } : { ok: false };
  }

  return { ok: false, reason: 'misconfigured' };
}

/** Dev-only fallback (localhost, non-production): lets `npm run dev` work with no ENV. */
export function verifyDevFallback(password, req) {
  if (isProduction() || !isLocalHost(req)) return { ok: false };
  const salt = '(dev-salt-removed)';
  const fallbackHash = 'd8929aaa33eb1eb986bb0ebee05c57fe2a4d16e37f7aa1b9a507affc41c798af';
  const ok = safeEqualStr(sha256hex(salt + password), fallbackHash);
  return ok ? { ok: true, mode: 'fallback-dev' } : { ok: false };
}

// ---------- Persistent rate limiting (memory L1 + Supabase L2) ----------

function lockoutFor(lockouts) {
  const n = Math.min(Math.max(lockouts, 0), 3);
  return Math.min(BASE_LOCKOUT_MS * 2 ** n, MAX_LOCKOUT_MS);
}

function supaEnv() {
  const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) return null;
  return { url, key };
}

async function fetchWithTimeout(url, opts, ms = 2500) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: c.signal });
  } finally {
    clearTimeout(t);
  }
}

/** Read persistent record. Null = none or store unavailable. */
async function readPersistent(key) {
  const env = supaEnv();
  if (!env) return null;
  try {
    const res = await fetchWithTimeout(
      `${env.url}/rest/v1/messi_admin_rate_limits?ip_hash=eq.${encodeURIComponent(key)}&select=count,first_at,last_at,locked_until,lockouts`,
      { headers: { apikey: env.key, Authorization: 'Bearer ' + env.key } }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) return null;
    const r = rows[0];
    return {
      count: Number(r.count) || 0,
      firstAt: Date.parse(r.first_at) || 0,
      lastAt: Date.parse(r.last_at) || 0,
      lockedUntil: Date.parse(r.locked_until) || 0,
      lockouts: Number(r.lockouts) || 0,
    };
  } catch {
    return null;
  }
}

async function writePersistent(key, rec) {
  const env = supaEnv();
  if (!env) return;
  try {
    const body = {
      ip_hash: key,
      count: rec.count,
      first_at: new Date(rec.firstAt).toISOString(),
      last_at: new Date(rec.lastAt).toISOString(),
      locked_until: rec.lockedUntil ? new Date(rec.lockedUntil).toISOString() : null,
      lockouts: rec.lockouts || 0,
    };
    await fetchWithTimeout(`${env.url}/rest/v1/messi_admin_rate_limits`, {
      method: 'POST',
      headers: {
        apikey: env.key,
        Authorization: 'Bearer ' + env.key,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(body),
    });
  } catch {
    /* rate-limit store is best-effort — memory L1 still applies */
  }
}

async function deletePersistent(key) {
  const env = supaEnv();
  if (!env) return;
  try {
    await fetchWithTimeout(
      `${env.url}/rest/v1/messi_admin_rate_limits?ip_hash=eq.${encodeURIComponent(key)}`,
      { method: 'DELETE', headers: { apikey: env.key, Authorization: 'Bearer ' + env.key } }
    );
  } catch {
    /* ignore */
  }
}

export function rateLimitStore() {
  return supaEnv() ? 'supabase' : 'memory-single-instance';
}

/** Check limit. Returns {limited, retryAfterSec, remaining}. Merges L1+L2 (strictest wins). */
export async function checkRateLimit(ip) {
  const now = Date.now();
  const key = 'rl:' + sha256hex('messi-admin-rl:' + ip).slice(0, 48);
  const mem = memFails.get(key);
  const per = await readPersistent(key);

  const merged = { count: 0, firstAt: now, lockouts: 0, lockedUntil: 0 };
  for (const r of [mem, per]) {
    if (!r) continue;
    if (r.firstAt && now - r.firstAt > WINDOW_MS && !(r.lockedUntil && now < r.lockedUntil)) continue; // window expired
    merged.count = Math.max(merged.count, r.count || 0);
    merged.firstAt = Math.min(merged.firstAt || now, r.firstAt || now);
    merged.lockouts = Math.max(merged.lockouts, r.lockouts || 0);
    merged.lockedUntil = Math.max(merged.lockedUntil || 0, r.lockedUntil || 0);
  }

  if (merged.lockedUntil && now < merged.lockedUntil) {
    return { limited: true, retryAfterSec: Math.ceil((merged.lockedUntil - now) / 1000), remaining: 0, key };
  }
  if (merged.count >= MAX_FAILS) {
    // Window reached without a recorded lockout (e.g. store race) — lock now
    const lockedUntil = now + lockoutFor(merged.lockouts);
    const rec = { count: merged.count, firstAt: merged.firstAt, lastAt: now, lockedUntil, lockouts: merged.lockouts };
    memFails.set(key, rec);
    await writePersistent(key, rec);
    return { limited: true, retryAfterSec: Math.ceil((lockedUntil - now) / 1000), remaining: 0, key };
  }
  return { limited: false, remaining: Math.max(0, MAX_FAILS - merged.count), key, merged };
}

/** Record a failed attempt. Returns {locked, retryAfterSec}. */
export async function recordFail(ip, prev) {
  const now = Date.now();
  const key = prev?.key || 'rl:' + sha256hex('messi-admin-rl:' + ip).slice(0, 48);
  const base = prev?.merged || memFails.get(key) || (await readPersistent(key)) || { count: 0, firstAt: now, lockouts: 0 };
  let { count = 0, firstAt = now, lockouts = 0 } = base;
  if (now - firstAt > WINDOW_MS) {
    count = 0;
    firstAt = now;
  }
  count += 1;
  let lockedUntil = 0;
  let locked = false;
  if (count >= MAX_FAILS) {
    lockedUntil = now + lockoutFor(lockouts);
    lockouts += 1;
    locked = true;
  }
  const rec = { count, firstAt, lastAt: now, lockedUntil, lockouts };
  memFails.set(key, rec);
  await writePersistent(key, rec);
  return { locked, retryAfterSec: locked ? Math.ceil((lockedUntil - now) / 1000) : 0 };
}

/** Clear on successful login. */
export async function clearFails(ip, keyHint) {
  const key = keyHint || 'rl:' + sha256hex('messi-admin-rl:' + ip).slice(0, 48);
  memFails.delete(key);
  await deletePersistent(key);
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
