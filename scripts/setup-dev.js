// Development setup utility
// Run: node scripts/setup-dev.js

require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GEMINI_API_KEY',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_WEBHOOK_SECRET'
];

console.log('Checking .env.local...\n');

const missing = [];

for (const key of requiredVars) {
  if (!process.env[key]) {
    missing.push(key);
  } else {
    console.log(`✓ ${key} is set`);
  }
}

if (missing.length > 0) {
  console.log('\n⚠️ Missing required environment variables:');
  missing.forEach(key => console.log(`  - ${key}`));
  console.log('\nPlease copy .env.example to .env.local and fill in the values.');
  process.exit(1);
}

console.log('\n✅ Environment check passed!');

// Create placeholder files if they don't exist
const placeholderFiles = [
  'src/modules/tasks/index.ts',
  'src/modules/notes/index.ts',
  'src/modules/memory/index.ts',
  'src/modules/goals/index.ts',
  'src/modules/calendar/index.ts'
];

placeholderFiles.forEach(file => {
  const fullPath = path.join(__dirname, '../', file);
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, '// Module placeholder\n');
    console.log(`Created placeholder: ${file}`);
  }
});

console.log('\nSetup complete. Run "npm run dev" to start.');
