#!/usr/bin/env node
// Generate ADMIN_PASSWORD_HASH for Vercel ENV
// Usage: node scripts/generate-admin-hash.mjs yourpassword
//    or: npm run admin:hash -- yourpassword
import crypto from 'node:crypto';
const salt = process.env.ADMIN_SALT || '(dev-salt-removed)';
const pass = process.argv[2];
if (!pass) {
  console.error('Usage: node scripts/generate-admin-hash.mjs <password>');
  console.error('Example: node scripts/generate-admin-hash.mjs "MyStrongPass123!"');
  process.exit(1);
}
const hash = crypto.createHash('sha256').update(salt + pass, 'utf8').digest('hex');
console.log('Salt:', salt);
console.log('Password:', pass);
console.log('Hash:', hash);
console.log('');
console.log('Set in Vercel: ADMIN_PASSWORD_HASH=' + hash);
console.log('Or set plaintext: ADMIN_PASSWORD=' + pass);
