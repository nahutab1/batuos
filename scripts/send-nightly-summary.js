/**
 * Cron job script for nightly summary.
 * Run every evening at e.g. 22:00 via cron/scheduler:
 *
 *   node scripts/send-nightly-summary.js
 *
 * Calls the BatuOS nightly-summary API endpoint.
 *
 * Requires: .env.local with NIGHTLY_SECRET and BatuOS_URL
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env.local') });

const BASE_URL = process.env.BATUOS_URL || 'http://localhost:3000';
const SECRET = process.env.NIGHTLY_SECRET;

if (!SECRET) {
  console.error('❌ NIGHTLY_SECRET not set in .env.local');
  process.exit(1);
}

async function main() {
  console.log(`🌙 Sending nightly summary to ${BASE_URL}...`);

  const res = await fetch(`${BASE_URL}/api/nightly-summary`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SECRET}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json();

  if (res.ok) {
    console.log('✅ Nightly summary sent!');
    console.log('📝', data.summary);
  } else {
    console.error('❌ Failed:', data.error || res.statusText);
    process.exit(1);
  }
}

main().catch(console.error);
