/**
 * Nightly task summary cron script.
 * Run at midnight (or whenever):
 *   node scripts/send-nightly-summary.js
 *
 * Calls BatuOS nightly-summary API → sends priority-sorted task list to Telegram.
 *
 * Setup Windows Task Scheduler for daily 00:00:
 *   1. Open Task Scheduler
 *   2. Create Task → Trigger: Daily at 00:00
 *   3. Action: Start a program → node → script path
 *   4. Start in: C:\Users\USER\batuos
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
    console.log(`📊 ${data.stats.done} done, ${data.stats.pending} pending, ${data.stats.notes} notes, ${data.stats.calories} kcal`);
  } else {
    console.error('❌ Failed:', data.error || res.statusText);
    process.exit(1);
  }
}

main().catch(console.error);
