#!/usr/bin/env tsx
/**
 * Reset Test User Password
 * Uses Supabase Admin API to reset password for test user
 * 
 * Usage:
 *   npx tsx scripts/reset-test-user-password.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables - try multiple methods
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Also try loading from process.env directly (in case dotenv already loaded)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// If still missing, try reading .env file directly
if (!supabaseServiceKey) {
  try {
    const fs = require('fs');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const keyMatch = envContent.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m);
    if (keyMatch) {
      supabaseServiceKey = keyMatch[1].trim();
    }
  } catch (e) {
    // Ignore
  }
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n💡 Get SUPABASE_SERVICE_ROLE_KEY from: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

// Create Supabase Admin Client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetTestUserPassword() {
  const userId = '00000000-0000-0000-0000-000000000001';
  const newPassword = 'TestUser123!';
  
  console.log('🔐 Resetting password for test user...\n');
  
  try {
    // Update user password
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
      email_confirm: true,
    });
    
    if (error) {
      console.error('❌ Failed to reset password:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Password reset successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('   Email: test@wyshkit.com');
    console.log('   Password: TestUser123!');
    console.log('\n💡 You can now login with these credentials.');
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

resetTestUserPassword();

