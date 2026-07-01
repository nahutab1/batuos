// Database schema check utility
// Run: node scripts/check-db.js
// Verifies that the required tables exist in Supabase

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const requiredTables = [
  'tasks',
  'notes',
  'memories',
  'goals',
  'events'
];

async function checkTables() {
  console.log('Checking Supabase tables...\n');

  let allPresent = true;

  for (const table of requiredTables) {
    const { data, error } = await supabase
      .from(`information_schema.tables`)
      .select('table_name')
      .eq('table_name', table)
      .eq('table_schema', 'public');

    if (error) {
      console.error(`❌ Error checking ${table}: ${error.message}`);
      allPresent = false;
    } else if (data && data.length > 0) {
      console.log(`✓ Table ${table} exists`);
    } else {
      console.log(`✗ Table ${table} MISSING`);
      allPresent = false;
    }
  }

  if (allPresent) {
    console.log('\n✅ All required tables are present.');
  } else {
    console.log('\n❌ Some tables are missing. Run the schema.sql in Supabase SQL Editor.');
    process.exit(1);
  }
}

checkTables();
