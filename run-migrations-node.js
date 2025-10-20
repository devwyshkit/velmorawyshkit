#!/usr/bin/env node
/**
 * Run Supabase Migrations via Node.js
 * Uses service_role key to execute SQL directly
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase credentials
const SUPABASE_URL = 'https://usiwuxudinfxttvrcczb.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzaXd1eHVkaW5meHR0dnJjY3piIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQzMTg0MSwiZXhwIjoyMDc2MDA3ODQxfQ.x574GLTuZOfzF1dcqlXFdH3iWjONhFwIJqQ53R9T8HY';

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Migration files in order
const MIGRATIONS = [
  // Phase 1: Core Product Enhancements
  'ADD_BULK_PRICING_COLUMN.sql',
  'ADD_SPONSORED_FIELDS.sql',
  'ADD_SOURCING_LIMITS.sql',
  'ADD_FSSAI_FIELD.sql',
  
  // Phase 2: New Feature Tables
  'ADD_CAMPAIGNS_TABLE.sql',
  'ADD_REVIEWS_TABLES.sql',
  'ADD_DISPUTES_TABLES.sql',
  'ADD_RETURNS_TABLES.sql',
  'ADD_BADGES_TABLES.sql',
  'ADD_REFERRALS_TABLES.sql',
  'ADD_HELP_TABLES.sql',
  'ADD_SOURCING_USAGE_TABLE.sql',
  'ADD_SPONSORED_ANALYTICS_TABLE.sql',
  
  // Test data
  'ADD_TEST_DATA_WITH_IMAGES.sql',
];

async function runMigration(filename) {
  console.log(`\n📝 Running: ${filename}`);
  
  try {
    const filePath = join(__dirname, filename);
    const sql = readFileSync(filePath, 'utf8');
    
    // Execute SQL via Supabase RPC (using raw SQL)
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => {
      // Fallback: try using REST API directly
      return fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql_query: sql }),
      }).then(r => r.json());
    });
    
    if (error) {
      // Check if it's a "column already exists" error (safe to ignore)
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        console.log(`⚠️  Skipped (already exists): ${filename}`);
        return { success: true, skipped: true };
      }
      throw error;
    }
    
    console.log(`✅ Success: ${filename}`);
    return { success: true, skipped: false };
  } catch (err) {
    console.error(`❌ Failed: ${filename}`);
    console.error(`Error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('🚀 Starting Wyshkit Database Migrations\n');
  console.log(`Project: ${SUPABASE_URL}`);
  console.log(`Migrations: ${MIGRATIONS.length} files\n`);
  
  const results = [];
  
  for (const migration of MIGRATIONS) {
    const result = await runMigration(migration);
    results.push({ file: migration, ...result });
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n\n📊 Migration Summary:');
  console.log('═'.repeat(50));
  
  const successful = results.filter(r => r.success && !r.skipped).length;
  const skipped = results.filter(r => r.skipped).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed migrations:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.file}: ${r.error}`);
    });
  }
  
  console.log('\n✨ Migration process complete!');
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

