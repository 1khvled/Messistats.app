import crypto from 'node:crypto';

// Simple in-memory rate limit: 5 fails per IP per 15 min
const fails = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;
const LOCKOUT_MS = 30 * 1000;

function getSalt() {
  return process.env.ADMIN_SALT || '(dev-salt-removed)';
}

function sha256(s) {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

function safeEqual(a, b) {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function isRateLimited(ip) {
  const rec = fails.get(ip);
  if (!rec) return { limited: false };
  const now = Date.now();
  // cleanup old
  if (now - rec.firstAt > WINDOW_MS) {
    fails.delete(ip);
    return { limited: false };
  }
  if (rec.count >= MAX_FAILS) {
    const until = rec.lastAt + LOCKOUT_MS;
    if (now < until) return { limited: true, retryAfter: Math.ceil((until - now)/1000) };
    // lockout expired but still within window -> keep count but allow
    if (now - rec.lastAt > LOCKOUT_MS) return { limited: false };
  }
  return { limited: false };
}

function recordFail(ip) {
  const now = Date.now();
  const rec = fails.get(ip);
  if (!rec || now - rec.firstAt > WINDOW_MS) {
    fails.set(ip, { count: 1, firstAt: now, lastAt: now });
  } else {
    rec.count++; rec.lastAt = now;
  }
}

function clearFails(ip) {
  fails.delete(ip);
}

export default async function handler(req, res) {
  // CORS + security headers
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const ip = (req.headers['x-forwarded-for']?.split(',')[0]?.trim()) || req.socket?.remoteAddress || 'unknown';
  const rl = isRateLimited(ip);
  if (rl.limited) {
    return res.status(429).json({ ok: false, error: 'Too many attempts. Retry in ' + rl.retryAfter + 's', retryAfter: rl.retryAfter });
  }

  let body = req.body;
  // Vercel may give string
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const password = (body && body.password != null ? String(body.password) : '').trim();
  if (!password) {
    return res.status(400).json({ ok: false, error: 'Missing password' });
  }
  if (password.length > 256) {
    return res.status(400).json({ ok: false, error: 'Password too long' });
  }

  const salt = getSalt();
  const inputHash = sha256(salt + password);

  const envHash = process.env.ADMIN_PASSWORD_HASH ? String(process.env.ADMIN_PASSWORD_HASH).trim().toLowerCase() : '';
  const envPass = process.env.ADMIN_PASSWORD ? String(process.env.ADMIN_PASSWORD).trim() : '';
  // Also support VITE_ prefix if user mistakenly sets VITE_ADMIN_*
  const viteHash = process.env.VITE_ADMIN_PASSWORD_HASH ? String(process.env.VITE_ADMIN_PASSWORD_HASH).trim().toLowerCase() : '';
  const vitePass = process.env.VITE_ADMIN_PASSWORD ? String(process.env.VITE_ADMIN_PASSWORD).trim() : '';

  const targetHash = envHash || viteHash || '';
  const targetPass = envPass || vitePass || '';

  let ok = false;

  if (targetHash) {
    // compare hashes constant-time
    ok = safeEqual(inputHash, targetHash.toLowerCase());
  } else if (targetPass) {
    // if target looks like hash (64 hex) compare hashes, else plaintext
    if (/^[a-f0-9]{64}$/i.test(targetPass)) {
      ok = safeEqual(inputHash, targetPass.toLowerCase());
    } else {
      // plaintext compare constant-time as well
      ok = safeEqual(password, targetPass);
    }
  } else {
    // No env set — local dev fallback: allow default hash (so dev works) but warn
    const fallbackHash = 'd8929aaa33eb1eb986bb0ebee05c57fe2a4d16e37f7aa1b9a507affc41c798af';
    ok = safeEqual(inputHash, fallbackHash);
    if (ok) {
      // add header to hint env missing
      res.setHeader('X-Admin-Auth-Mode', 'fallback-dev');
    }
  }

  if (ok) {
    clearFails(ip);
    return res.status(200).json({ ok: true });
  } else {
    recordFail(ip);
    const rec = fails.get(ip);
    const remaining = rec ? Math.max(0, MAX_FAILS - rec.count) : 4;
    return res.status(401).json({ ok: false, error: remaining > 0 ? 'Incorrect passphrase. ' + remaining + ' attempts remaining' : 'Too many failed attempts. Lockout 30s', remaining });
  }
}
