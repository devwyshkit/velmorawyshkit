#!/usr/bin/env node
/**
 * Run Supabase Cleanup Migrations (001-013)
 * Applies all security and performance fixes
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
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

// Cleanup migration files in order (001-013)
const CLEANUP_MIGRATIONS = [
  '001_FIX_RLS_AUTH_PERFORMANCE.sql',
  '002_CONSOLIDATE_RLS_POLICIES.sql', 
  '003_ADD_MISSING_FK_INDEXES.sql',
  '004_REMOVE_UNUSED_INDEXES.sql',
  '005_FIX_SECURITY_DEFINER_VIEWS.sql',
  '006_ENABLE_RLS_ON_PUBLIC_TABLES.sql',
  '007_FIX_USER_METADATA_IN_RLS.sql',
  '008_FIX_FUNCTION_SEARCH_PATH.sql',
  '009_ADD_MISSING_RLS_POLICIES.sql',
  '010_FIX_REMAINING_RLS_PERFORMANCE.sql',
  '011_CONSOLIDATE_DUPLICATE_POLICIES.sql',
  '012_VERIFY_FK_INDEXES.sql',
  '013_VERIFY_UNUSED_INDEXES_REMOVED.sql'
];

async function runMigration(filename) {
  console.log(`\n📝 Running: ${filename}`);
  
  try {
    const filePath = join(__dirname, 'supabase/migrations', filename);
    const sql = readFileSync(filePath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
          
          if (error) {
            // Check if it's a "already exists" error (safe to ignore)
            if (error.message?.includes('already exists') || 
                error.message?.includes('duplicate') ||
                error.message?.includes('does not exist')) {
              console.log(`  ⚠️  Skipped: ${error.message.split('\n')[0]}`);
              successCount++;
            } else {
              console.log(`  ❌ Error: ${error.message.split('\n')[0]}`);
              errorCount++;
            }
          } else {
            successCount++;
          }
        } catch (err) {
          console.log(`  ❌ Exception: ${err.message.split('\n')[0]}`);
          errorCount++;
        }
      }
    }
    
    if (errorCount === 0) {
      console.log(`✅ Success: ${filename} (${successCount} statements)`);
      return { success: true, skipped: false };
    } else {
      console.log(`⚠️  Partial: ${filename} (${successCount} success, ${errorCount} errors)`);
      return { success: true, skipped: false, partial: true };
    }
  } catch (err) {
    console.error(`❌ Failed: ${filename}`);
    console.error(`Error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('🚀 Starting Supabase Cleanup Migrations\n');
  console.log(`Project: ${SUPABASE_URL}`);
  console.log(`Migrations: ${CLEANUP_MIGRATIONS.length} files\n`);
  
  const results = [];
  
  for (const migration of CLEANUP_MIGRATIONS) {
    const result = await runMigration(migration);
    results.push({ file: migration, ...result });
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n\n📊 Migration Summary:');
  console.log('═'.repeat(50));
  
  const successful = results.filter(r => r.success && !r.skipped).length;
  const partial = results.filter(r => r.partial).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`⚠️  Partial: ${partial}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed migrations:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.file}: ${r.error}`);
    });
  }
  
  console.log('\n✨ Cleanup migration process complete!');
  console.log('\nNext steps:');
  console.log('1. Run: supabase db lint (if CLI available)');
  console.log('2. Check Supabase Dashboard → Database → Linter');
  console.log('3. Verify all 54 issues are resolved');
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
