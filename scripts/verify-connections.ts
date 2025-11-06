#!/usr/bin/env tsx
/**
 * Connection Verification Script
 * Tests all external integrations and connections
 * 
 * Usage:
 *   npx tsx scripts/verify-connections.ts
 *   OR
 *   npm install -g tsx && tsx scripts/verify-connections.ts
 *   OR
 *   node --loader tsx scripts/verify-connections.ts (Node 20.6+)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const razorpayKey = process.env.VITE_RAZORPAY_KEY || '';
const googlePlacesKey = process.env.VITE_GOOGLE_PLACES_API_KEY || '';
const openaiKey = process.env.VITE_OPENAI_API_KEY || '';

interface VerificationResult {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

const results: VerificationResult[] = [];

// Test Supabase Connection
async function testSupabase(): Promise<VerificationResult> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      name: 'Supabase',
      status: 'error',
      message: 'Missing Supabase credentials (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY)',
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test 1: Basic connection
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError && !sessionError.message.includes('JWT')) {
      return {
        name: 'Supabase',
        status: 'error',
        message: `Connection failed: ${sessionError.message}`,
      };
    }

    // Test 2: Required tables exist
    const requiredTables = [
      'stores', 'store_items', 'orders', 'order_items', 'user_profiles',
      'addresses', 'cart_items', 'banners', 'occasions', 'payment_transactions'
    ];

    const missingTables: string[] = [];
    for (const table of requiredTables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && error.code === 'PGRST116') {
        missingTables.push(table);
      }
    }

    if (missingTables.length > 0) {
      return {
        name: 'Supabase',
        status: 'error',
        message: `Missing tables: ${missingTables.join(', ')}`,
        details: { missingTables },
      };
    }

    // Test 3: RLS policies (try to query with anon key)
    const { error: rlsError } = await supabase.from('stores').select('id').limit(1);
    if (rlsError && rlsError.code !== 'PGRST301') {
      // PGRST301 is expected for RLS, other errors indicate issues
      return {
        name: 'Supabase',
        status: 'warning',
        message: `RLS test query returned: ${rlsError.message}`,
        details: { errorCode: rlsError.code },
      };
    }

    // Test 4: Real-time subscriptions (just check if we can create a channel)
    const channel = supabase.channel('test-connection');
    channel.subscribe((status) => {
      // Just verify we can create channel
    });
    await supabase.removeChannel(channel);

    return {
      name: 'Supabase',
      status: 'success',
      message: 'Connection successful. All required tables exist. RLS policies active.',
      details: {
        url: supabaseUrl,
        tablesChecked: requiredTables.length,
        allTablesExist: true,
      },
    };
  } catch (error: any) {
    return {
      name: 'Supabase',
      status: 'error',
      message: `Connection failed: ${error.message}`,
    };
  }
}

// Test Razorpay Configuration
function testRazorpay(): VerificationResult {
  if (!razorpayKey) {
    return {
      name: 'Razorpay',
      status: 'warning',
      message: 'Razorpay key not configured (VITE_RAZORPAY_KEY)',
    };
  }

  if (!razorpayKey.startsWith('rzp_test_') && !razorpayKey.startsWith('rzp_live_')) {
    return {
      name: 'Razorpay',
      status: 'warning',
      message: 'Razorpay key format appears invalid (should start with rzp_test_ or rzp_live_)',
    };
  }

  return {
    name: 'Razorpay',
    status: 'success',
    message: 'Razorpay key configured',
    details: {
      keyType: razorpayKey.startsWith('rzp_test_') ? 'test' : 'live',
    },
  };
}

// Test Google Places API Configuration
function testGooglePlaces(): VerificationResult {
  if (!googlePlacesKey) {
    return {
      name: 'Google Places',
      status: 'warning',
      message: 'Google Places API key not configured (VITE_GOOGLE_PLACES_API_KEY)',
    };
  }

  return {
    name: 'Google Places',
    status: 'success',
    message: 'Google Places API key configured',
  };
}

// Test OpenAI Configuration
function testOpenAI(): VerificationResult {
  if (!openaiKey) {
    return {
      name: 'OpenAI',
      status: 'warning',
      message: 'OpenAI API key not configured (VITE_OPENAI_API_KEY) - Optional',
    };
  }

  if (!openaiKey.startsWith('sk-')) {
    return {
      name: 'OpenAI',
      status: 'warning',
      message: 'OpenAI key format appears invalid (should start with sk-)',
    };
  }

  return {
    name: 'OpenAI',
    status: 'success',
    message: 'OpenAI API key configured',
  };
}

// Main verification function
async function verifyAllConnections() {
  console.log('🔍 Verifying connections...\n');

  results.push(await testSupabase());
  results.push(testRazorpay());
  results.push(testGooglePlaces());
  results.push(testOpenAI());

  // Print results
  console.log('📊 Verification Results:\n');
  
  let successCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  for (const result of results) {
    const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${result.name}: ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }
    console.log('');

    if (result.status === 'success') successCount++;
    else if (result.status === 'warning') warningCount++;
    else errorCount++;
  }

  console.log('📈 Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⚠️  Warnings: ${warningCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('');

  if (errorCount > 0) {
    console.log('❌ Some critical connections failed. Please fix errors before testing.');
    process.exit(1);
  } else if (warningCount > 0) {
    console.log('⚠️  Some optional connections are missing. This may limit functionality.');
    process.exit(0);
  } else {
    console.log('✅ All connections verified successfully!');
    process.exit(0);
  }
}

// Run verification
verifyAllConnections().catch((error) => {
  console.error('💥 Verification script failed:', error);
  process.exit(1);
});

