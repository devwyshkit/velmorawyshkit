/**
 * Run Admin Tables Migration
 * Run with: node run-admin-migration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://usiwuxudinfxttvrcczb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzaXd1eHVkaW5meHR0dnJjY3piIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQzMTg0MSwiZXhwIjoyMDc2MDA3ODQxfQ.x574GLTuZOfzF1dcqlXFdH3iWjONhFwIJqQ53R9T8HY';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runAdminMigration() {
  try {
    console.log('📄 Reading migration file...');
    const sql = readFileSync('ADD_ADMIN_TABLES.sql', 'utf8');
    
    console.log('🔄 Running migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct query execution for each statement
      console.log('⚠️  RPC failed, trying direct execution...');
      
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));
      
      for (const statement of statements) {
        if (statement.includes('CREATE TABLE') || statement.includes('CREATE INDEX') || statement.includes('INSERT INTO')) {
          console.log(`  Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase.rpc('exec', { query: statement });
          if (stmtError) {
            console.warn(`    ⚠️  ${stmtError.message}`);
          } else {
            console.log('    ✅ Success');
          }
        }
      }
      
      console.log('\n✅ Migration completed (with possible warnings)');
      console.log('ℹ️  Note: You may need to run this SQL in Supabase SQL Editor directly');
      console.log('   Copy content from ADD_ADMIN_TABLES.sql');
      return;
    }

    console.log('✅ Migration ran successfully!');
    console.log('📋 Result:', data);
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    console.log('\n📝 SOLUTION: Run ADD_ADMIN_TABLES.sql in Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/usiwuxudinfxttvrcczb/editor');
  }
}

runAdminMigration();

