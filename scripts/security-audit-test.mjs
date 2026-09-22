/**
 * Automated security suite verifying stack hardening and vulnerability mitigations.
 * Run: node scripts/security-audit-test.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  isOriginAllowed,
  signToken,
  verifyToken,
  verifyPassword,
  checkRateLimit,
  recordFail,
  clearFails,
  MAX_FAILS,
} from '../api/_auth-shared.js';

console.log('[1/7] Testing Origin Validation & CSRF Protection...');
{
  // Allowed origins
  assert.equal(isOriginAllowed({ headers: { origin: 'https://messistat.com' } }), true);
  assert.equal(isOriginAllowed({ headers: { origin: 'https://www.messistat.com' } }), true);
  assert.equal(isOriginAllowed({ headers: { referer: 'https://messistat.com/admin' } }), true);
  assert.equal(isOriginAllowed({ headers: { origin: 'https://messi-stats.vercel.app' } }), true);
  assert.equal(isOriginAllowed({ headers: { origin: 'https://messi-stats-git-dev.vercel.app' } }), true);

  // Malicious / unauthorized origins (MUST BE BLOCKED)
  assert.equal(isOriginAllowed({ headers: { origin: 'https://evil.com' } }), false);
  assert.equal(isOriginAllowed({ headers: { origin: 'https://evilhacker.com' } }), false);
  assert.equal(isOriginAllowed({ headers: { origin: 'https://attacker.vercel.app' } }), false);
  assert.equal(isOriginAllowed({ headers: { origin: 'https://notmessistat.com' } }), false);
  assert.equal(isOriginAllowed({ headers: { origin: 'https://messistat.com.evil.com' } }), false);
  assert.equal(isOriginAllowed({ headers: { referer: 'https://evil.com/phishing' } }), false);

  console.log('  -> Origin validation passed! (Arbitrary vercel.app & 3rd party origins blocked)');
}

console.log('[2/7] Testing Token Fail-Closed Security...');
{
  // Test in simulated production environment with no secret
  const origEnv = process.env.VERCEL_ENV;
  const origSecret = process.env.ADMIN_SESSION_SECRET;
  const origSalt = process.env.ADMIN_SALT;
  const origHash = process.env.ADMIN_PASSWORD_HASH;
  const origPass = process.env.ADMIN_PASSWORD;

  try {
    process.env.VERCEL_ENV = 'production';
    delete process.env.ADMIN_SESSION_SECRET;
    delete process.env.VITE_ADMIN_SESSION_SECRET;
    delete process.env.ADMIN_SALT;
    delete process.env.VITE_ADMIN_SALT;
    delete process.env.ADMIN_PASSWORD_HASH;
    delete process.env.VITE_ADMIN_PASSWORD_HASH;
    delete process.env.ADMIN_PASSWORD;
    delete process.env.VITE_ADMIN_PASSWORD;

    // In production with no secrets, signToken must throw (fail closed)
    let threw = false;
    try {
      signToken(false);
    } catch (err) {
      threw = true;
      assert.match(err.message, /Admin session secret is not configured/);
    }
    assert.equal(threw, true, 'signToken should throw when unconfigured in production');

    // In production with no secrets, verifyToken must return ok: false
    const verdict = verifyToken('dummy.token');
    assert.equal(verdict.ok, false);

    // Now configure a strong session secret and test valid flow
    process.env.ADMIN_SESSION_SECRET = '(test-secret-removed)';
    const { token, expiresAt } = signToken(false);
    assert.ok(token);
    assert.ok(expiresAt > Date.now());

    // Verify token
    const v1 = verifyToken(token);
    assert.equal(v1.ok, true);

    // Tampered signature must fail
    const tampered = token.slice(0, -4) + 'abcd';
    const v2 = verifyToken(tampered);
    assert.equal(v2.ok, false);

    // Tampered payload must fail
    const parts = token.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ v: 1, exp: Date.now() + 100000 })).toString('base64url');
    const v3 = verifyToken(`${tamperedPayload}.${parts[1]}`);
    assert.equal(v3.ok, false);
  } finally {
    process.env.VERCEL_ENV = origEnv;
    if (origSecret) process.env.ADMIN_SESSION_SECRET = origSecret;
    if (origSalt) process.env.ADMIN_SALT = origSalt;
    if (origHash) process.env.ADMIN_PASSWORD_HASH = origHash;
    if (origPass) process.env.ADMIN_PASSWORD = origPass;
  }
  console.log('  -> Token fail-closed security passed!');
}

console.log('[3/7] Testing Password Verification & Rate Limiting...');
{
  const testSalt = 'testsalt12345';
  const testPw = 'StrongTestPassword2026!';
  const saltBuf = Buffer.from(testSalt, 'utf8');
  const derived = crypto.scryptSync(testPw, saltBuf, 64, { N: 16384, r: 8, p: 1 });
  const scryptHash = `scrypt$16384$8$1$${saltBuf.toString('hex')}$${derived.toString('hex')}`;

  const origHash = process.env.ADMIN_PASSWORD_HASH;
  try {
    process.env.ADMIN_PASSWORD_HASH = scryptHash;
    const okVerdict = verifyPassword(testPw);
    assert.equal(okVerdict.ok, true);
    assert.equal(okVerdict.mode, 'scrypt');

    const badVerdict = verifyPassword('WrongPassword123');
    assert.equal(badVerdict.ok, false);
  } finally {
    if (origHash) process.env.ADMIN_PASSWORD_HASH = origHash;
    else delete process.env.ADMIN_PASSWORD_HASH;
  }

  // Test rate limiting
  const testIp = '198.51.100.42';
  await clearFails(testIp);
  let rl = await checkRateLimit(testIp);
  assert.equal(rl.limited, false);
  assert.equal(rl.remaining, MAX_FAILS);

  // Trigger fails up to limit
  for (let i = 1; i <= MAX_FAILS; i++) {
    rl = await checkRateLimit(testIp);
    const res = await recordFail(testIp, rl);
    if (i === MAX_FAILS) {
      assert.equal(res.locked, true);
      assert.ok(res.retryAfterSec > 0);
    }
  }

  rl = await checkRateLimit(testIp);
  assert.equal(rl.limited, true);
  assert.equal(rl.remaining, 0);

  // Clear fails on success
  await clearFails(testIp);
  rl = await checkRateLimit(testIp);
  assert.equal(rl.limited, false);
  assert.equal(rl.remaining, MAX_FAILS);

  console.log('  -> Password & rate limit checks passed!');
}

console.log('[4/7] Testing Security Headers & CSP in vercel.json...');
{
  const vercelJson = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  const allRoute = vercelJson.headers.find((h) => h.source === '/(.*)');
  assert.ok(allRoute, 'Must have root header configuration');

  const headers = Object.fromEntries(allRoute.headers.map((h) => [h.key, h.value]));
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['X-Frame-Options'], 'SAMEORIGIN');
  assert.match(headers['Strict-Transport-Security'], /max-age=63072000/);

  // CSP assertions
  const csp = headers['Content-Security-Policy'];
  assert.ok(csp, 'CSP must be present');
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /frame-ancestors 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /base-uri 'self'/);
  assert.match(csp, /form-action 'self'/);

  console.log('  -> vercel.json headers & CSP passed!');
}

console.log('[5/7] Testing HTML Structure & Script Tags...');
{
  const adminHtml = fs.readFileSync('admin.html', 'utf8');
  assert.equal((adminHtml.match(/<html/g) || []).length, 1, 'admin.html must have exactly one <html> tag');
  assert.equal((adminHtml.match(/<!DOCTYPE html>/gi) || []).length, 1, 'admin.html must have exactly one DOCTYPE');
  
  // Verify no unclosed script tag
  const scriptOpens = (adminHtml.match(/<script\b[^>]*>/gi) || []).length;
  const scriptCloses = (adminHtml.match(/<\/script>/gi) || []).length;
  assert.equal(scriptOpens, scriptCloses, `Script tags must be balanced in admin.html (${scriptOpens} vs ${scriptCloses})`);

  console.log('  -> HTML head integrity passed!');
}

console.log('[6/7] Testing Vite Configuration for Source Maps...');
{
  const viteConfig = fs.readFileSync('vite.config.js', 'utf8');
  assert.match(viteConfig, /sourcemap:\s*false/, 'vite.config.js must explicitly set sourcemap: false');
  console.log('  -> Vite sourcemap: false verified!');
}

console.log('[7/7] Testing Data Integrity Checksums...');
{
  const data = JSON.parse(fs.readFileSync('public/data/messi-data.json', 'utf8'));
  const sum = (arr) => arr.reduce((acc, r) => acc + (r.goals || 0), 0);
  const ySum = sum(data.calendarYears);
  const cSum = sum(data.byCompetition);
  const bSum = sum(data.byBodyPart);
  const totalGoals = data.totals?.combined?.goals;

  assert.equal(ySum, totalGoals);
  assert.equal(cSum, totalGoals);
  assert.equal(bSum, totalGoals);
  assert.ok(typeof totalGoals === 'number' && totalGoals >= 929, 'totalGoals must be >= 929');
  console.log(`  -> Data checksums invariant verified: ${totalGoals} goals across all slices!`);
}

console.log('\n=== ALL SECURITY AUDIT TESTS PASSED WITH 0 DEFECTS ===\n');
