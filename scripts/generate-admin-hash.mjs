#!/usr/bin/env node
// Generate ADMIN_PASSWORD_HASH for Vercel ENV (scrypt, strong).
// Usage: node scripts/generate-admin-hash.mjs "YourStrongPassphrase"
//    or: npm run admin:hash -- "YourStrongPassphrase"
// Legacy sha256(salt+pw) hashes are still accepted by api/admin-auth.js
// for migration — use: node scripts/generate-admin-hash.mjs --legacy "pw"
import crypto from 'node:crypto';

const args = process.argv.slice(2).filter((a) => a !== '--legacy');
const legacy = process.argv.includes('--legacy');
const pass = args[0];

if (!pass) {
  console.error('Usage: node scripts/generate-admin-hash.mjs [--legacy] <password>');
  console.error('Example: node scripts/generate-admin-hash.mjs "MyStrongPass123!"');
  process.exit(1);
}
if (pass.length < 12 && !legacy) {
  console.error('Refusing: passphrase must be at least 12 characters (use --legacy to override for migration only).');
  process.exit(1);
}

if (legacy) {
  const salt = process.env.ADMIN_SALT || '(dev-salt-removed)';
  const hash = crypto.createHash('sha256').update(salt + pass, 'utf8').digest('hex');
  console.log('Salt:', salt);
  console.log('Hash (legacy sha256, migrate to scrypt when you can):', hash);
  console.log('');
  console.log('Set in Vercel: ADMIN_PASSWORD_HASH=' + hash);
  console.log('And: ADMIN_SALT=' + salt);
  process.exit(0);
}

// scrypt with embedded random salt — no ADMIN_SALT needed for the password itself
const N = 16384;
const r = 8;
const p = 1;
const saltHex = crypto.randomBytes(16).toString('hex');
const hashHex = crypto.scryptSync(pass, Buffer.from(saltHex, 'hex'), 64, { N, r, p }).toString('hex');
const out = `scrypt$${N}$${r}$${p}$${saltHex}$${hashHex}`;
console.log('Hash (scrypt, recommended):');
console.log(out);
console.log('');
console.log('Set in Vercel: ADMIN_PASSWORD_HASH=' + out);
console.log('Also set (required in production): ADMIN_SALT=<random 32+ chars> and ADMIN_SESSION_SECRET=<random 32+ chars>');
console.log('Never use a VITE_ prefixed variable for secrets — VITE_* is bundled into client JS.');
