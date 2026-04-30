const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const checks = [
  { file: 'src/Modules/auth/auth.service.js', mustInclude: 'Admin.findOne({ email })', name: 'register checks admin email conflicts' },
  { file: 'src/Modules/auth/auth.service.js', mustInclude: 'findOneAndUpdate(', name: 'OTP attempts are atomic' },
  { file: 'src/middleware/auth.js', mustInclude: 'passwordChangedAt', name: 'JWT invalidated after password reset' },
  { file: 'src/middleware/security.js', mustInclude: 'RateLimit.findOneAndUpdate', name: 'rate limiter persists in MongoDB' },
  { file: 'src/middleware/security.js', mustInclude: 'csrfProtection', name: 'CSRF protection middleware exists' },
  { file: 'src/middleware/upload.js', mustInclude: 'detectMimeFromMagicBytes', name: 'upload magic-byte validation exists' },
  { file: 'src/Modules/notifications/notifications.service.js', mustNotInclude: 'mona@adwety.app', name: 'notifications do not fallback to demo user' },
  { file: 'src/Modules/profile/profile.service.js', mustNotInclude: 'mona@adwety.app', name: 'profile does not fallback to demo user' },
];

let failed = 0;
for (const check of checks) {
  const content = fs.readFileSync(path.join(root, check.file), 'utf8');
  const okInclude = !check.mustInclude || content.includes(check.mustInclude);
  const okExclude = !check.mustNotInclude || !content.includes(check.mustNotInclude);
  const ok = okInclude && okExclude;
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${check.name}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
console.log('Security static checks passed.');
