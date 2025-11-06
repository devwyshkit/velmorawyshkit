#!/usr/bin/env tsx
/**
 * Test Data Seeding Script
 * Runs user creation script first, then all seed files in the correct order
 * 
 * Usage:
 *   npx tsx scripts/seed-test-data.ts
 *   OR
 *   npm install -g tsx && tsx scripts/seed-test-data.ts
 *   OR
 *   Use Supabase Dashboard SQL Editor to run seed files manually
 * 
 * Note: Test users are created via Admin API (scripts/create-test-users.ts)
 * SQL-based user creation (test-users.sql) is deprecated and skipped
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Step 1: Create test users via Admin API (2025 pattern)
const userCreationScript = 'scripts/create-test-users.ts';

// Step 2: Run SQL seed files (excluding deprecated test-users.sql)
const seedFiles = [
  // 'supabase/seed/test-users.sql', // DEPRECATED - Use Admin API script instead
  'supabase/seed/test-stores-items.sql',
  'supabase/seed/test-customer-flow.sql',
  'supabase/seed/test-partner-portal.sql',
  'supabase/seed/test-admin-portal.sql',
];

interface SeedResult {
  file: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  error?: string;
}

const results: SeedResult[] = [];

function runSeedFile(filePath: string): SeedResult {
  const fullPath = path.resolve(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    return {
      file: filePath,
      status: 'skipped',
      message: 'File does not exist',
    };
  }

  try {
    // Use Supabase CLI to run SQL file
    // Note: This requires Supabase CLI to be installed and configured
    const command = `supabase db execute --file "${fullPath}"`;
    
    try {
      execSync(command, { 
        stdio: 'pipe',
        encoding: 'utf-8',
      });
      
      return {
        file: filePath,
        status: 'success',
        message: 'Seeded successfully',
      };
    } catch (error: any) {
      // If Supabase CLI is not available, provide instructions
      if (error.message.includes('supabase: command not found')) {
        return {
          file: filePath,
          status: 'error',
          message: 'Supabase CLI not found. Install it with: npm install -g supabase',
          error: error.message,
        };
      }

      // Check if it's a SQL error (file exists but has errors)
      if (error.stdout || error.stderr) {
        const output = error.stdout || error.stderr;
        // Some errors are expected (ON CONFLICT DO NOTHING)
        if (output.includes('already exists') || output.includes('duplicate')) {
          return {
            file: filePath,
            status: 'success',
            message: 'Seeded (some data may already exist)',
          };
        }
      }

      return {
        file: filePath,
        status: 'error',
        message: 'SQL execution failed',
        error: error.message,
      };
    }
  } catch (error: any) {
    return {
      file: filePath,
      status: 'error',
      message: 'Failed to execute seed file',
      error: error.message,
    };
  }
}

function runUserCreationScript(): SeedResult {
  const fullPath = path.resolve(process.cwd(), userCreationScript);
  
  if (!fs.existsSync(fullPath)) {
    return {
      file: userCreationScript,
      status: 'skipped',
      message: 'User creation script does not exist',
    };
  }

  try {
    execSync(`npx tsx "${fullPath}"`, { 
      stdio: 'inherit',
      encoding: 'utf-8',
    });
    
    return {
      file: userCreationScript,
      status: 'success',
      message: 'Test users created successfully',
    };
  } catch (error: any) {
    return {
      file: userCreationScript,
      status: 'error',
      message: 'User creation failed',
      error: error.message,
    };
  }
}

function seedAllData() {
  console.log('🌱 Seeding test data...\n');
  
  // Step 1: Create test users via Admin API
  console.log('👤 Step 1: Creating test users via Admin API...\n');
  const userResult = runUserCreationScript();
  results.push(userResult);
  
  if (userResult.status === 'success') {
    console.log(`   ✅ ${userResult.message}\n`);
  } else if (userResult.status === 'skipped') {
    console.log(`   ⏭️  ${userResult.message}\n`);
  } else {
    console.log(`   ❌ ${userResult.message}`);
    if (userResult.error) {
      console.log(`   Error: ${userResult.error}\n`);
    }
  }
  
  // Step 2: Run SQL seed files
  console.log(`📄 Step 2: Running ${seedFiles.length} SQL seed files...\n`);

  for (const file of seedFiles) {
    console.log(`📄 Processing: ${file}...`);
    const result = runSeedFile(file);
    results.push(result);
    
    if (result.status === 'success') {
      console.log(`   ✅ ${result.message}\n`);
    } else if (result.status === 'skipped') {
      console.log(`   ⏭️  ${result.message}\n`);
    } else {
      console.log(`   ❌ ${result.message}`);
      if (result.error) {
        console.log(`   Error: ${result.error}\n`);
      }
    }
  }

  // Print summary
  console.log('\n📊 Seeding Summary:\n');
  
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;

  for (const result of results) {
    const icon = result.status === 'success' ? '✅' : result.status === 'skipped' ? '⏭️' : '❌';
    console.log(`${icon} ${result.file}: ${result.message}`);
  }

  console.log('\n📈 Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('');

  // Check if user creation failed (critical)
  const userCreationFailed = results.find(r => r.file === userCreationScript && r.status === 'error');
  
  if (userCreationFailed) {
    console.log('❌ User creation failed. This is critical - test users cannot login without this.');
    console.log('   Please fix the user creation script before proceeding.');
    process.exit(1);
  }

  if (errorCount > 0) {
    console.log('❌ Some seed files failed. Please check errors above.');
    console.log('\n💡 Alternative: Run seed files manually via Supabase Dashboard:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Copy and paste each seed file content');
    console.log('   3. Execute each file in order');
    process.exit(1);
  } else {
    console.log('✅ All test data seeded successfully!');
    console.log('\n📝 Test credentials available in: TEST_CREDENTIALS.md');
    console.log('💡 Note: Test users are created via Admin API (2025 pattern)');
    process.exit(0);
  }
}

// Run seeding
seedAllData();

