/**
 * FleetCommand backend setup helper.
 * Run: node backend/scripts/setup-env.js
 *
 * This generates a backend/.env with a strong JWT secret and
 * helps you generate PLATFORM_PASSWORD_HASH from a plaintext password.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envPath = path.join(__dirname, '..', '.env');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password || '').digest('hex');
}

function generateJwtSecret() {
  return crypto.randomBytes(48).toString('hex');
}

async function prompt(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('\n--- FleetCommand Backend Setup ---\n');

  if (fs.existsSync(envPath)) {
    const overwrite = await prompt(rl, 'backend/.env already exists. Overwrite? (y/N): ');
    if (overwrite.trim().toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  const mongoUri = await prompt(rl, 'MongoDB URI (e.g. mongodb+srv://...): ');
  const port = await prompt(rl, 'Port [4000]: ');
  const corsOrigin = await prompt(rl, 'CORS origin [http://localhost:8084]: ');
  const platformPassword = await prompt(rl, 'Platform password to hash (leave blank to skip): ');
  const jwtExpiresIn = await prompt(rl, 'JWT expiry [7d]: ');

  rl.close();

  const jwtSecret = generateJwtSecret();
  const platformHash = platformPassword.trim() ? hashPassword(platformPassword.trim()) : '';

  const content = [
    `MONGODB_URI=${mongoUri.trim()}`,
    `PORT=${(port.trim() || '4000')}`,
    `CORS_ORIGIN=${(corsOrigin.trim() || 'http://localhost:8084')}`,
    `JWT_SECRET=${jwtSecret}`,
    `JWT_EXPIRES_IN=${(jwtExpiresIn.trim() || '7d')}`,
    `PLATFORM_PASSWORD_HASH=${platformHash}`,
    `REQUIRE_AUTH_FOR_SYNC=false`
  ].join('\n');

  fs.writeFileSync(envPath, content, 'utf8');

  console.log('\n✓ backend/.env created.');
  if (platformHash) {
    console.log(`✓ Platform password hashed: ${platformHash}`);
  } else {
    console.log('! No platform password set. You can add PLATFORM_PASSWORD_HASH manually later.');
  }
  console.log('\nRun: npm run backend:dev\n');
}

main().catch((error) => {
  console.error('Setup error:', error.message);
  process.exit(1);
});
