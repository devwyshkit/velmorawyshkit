#!/usr/bin/env tsx
/**
 * Test User Creation Script
 * Creates test users using Supabase Admin API (2025 pattern)
 * 
 * Usage:
 *   npx tsx scripts/create-test-users.ts
 *   OR
 *   npm install -g tsx && tsx scripts/create-test-users.ts
 * 
 * Requires:
 *   - VITE_SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable (for Admin API)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n💡 Get SUPABASE_SERVICE_ROLE_KEY from: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

// Create Supabase Admin Client (uses service_role key for admin operations)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface TestUser {
  id: string;
  email: string;
  password: string;
  phone: string;
  name: string;
  role: 'customer' | 'seller' | 'admin';
  userProfileData?: {
    avatar_url?: string;
    is_email_verified: boolean;
    is_phone_verified: boolean;
  };
}

const testUsers: TestUser[] = [
  // Customer 1
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test@wyshkit.com',
    password: 'TestUser123!',
    phone: '+919876543210',
    name: 'Test User',
    role: 'customer',
    userProfileData: {
      is_email_verified: true,
      is_phone_verified: true,
    },
  },
  // Customer 2
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'priya.sharma@example.com',
    password: 'TestUser123!',
    phone: '+919876543220',
    name: 'Priya Sharma',
    role: 'customer',
    userProfileData: {
      is_email_verified: true,
      is_phone_verified: true,
    },
  },
  // Customer 3
  {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'rahul.kumar@example.com',
    password: 'TestUser123!',
    phone: '+919876543230',
    name: 'Rahul Kumar',
    role: 'customer',
    userProfileData: {
      is_email_verified: true,
      is_phone_verified: true,
    },
  },
  // Partner 1
  {
    id: '00000000-0000-0000-0000-000000000101',
    email: 'partner1@premiumgifts.co',
    password: 'TestUser123!',
    phone: '+919876543211',
    name: 'Premium Gifts Owner',
    role: 'seller',
    userProfileData: {
      is_email_verified: true,
      is_phone_verified: true,
    },
  },
  // Partner 2
  {
    id: '00000000-0000-0000-0000-000000000102',
    email: 'partner2@gourmetdelights.in',
    password: 'TestUser123!',
    phone: '+919876543212',
    name: 'Gourmet Delights Owner',
    role: 'seller',
    userProfileData: {
      is_email_verified: true,
      is_phone_verified: true,
    },
  },
  // Admin
  {
    id: '00000000-0000-0000-0000-000000000999',
    email: 'admin@wyshkit.com',
    password: 'Admin123!',
    phone: '+919876543999',
    name: 'Admin User',
    role: 'admin',
    userProfileData: {
      is_email_verified: true,
      is_phone_verified: true,
    },
  },
];

interface CreationResult {
  user: TestUser;
  status: 'success' | 'error' | 'exists';
  message: string;
  error?: string;
}

const results: CreationResult[] = [];

async function createTestUser(user: TestUser): Promise<CreationResult> {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
    
    if (existingUser.user) {
      // Update existing user password if needed
      try {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          password: user.password,
          email: user.email,
          phone: user.phone,
          user_metadata: {
            full_name: user.name,
            phone: user.phone,
          },
          app_metadata: {
            role: user.role,
          },
        });
        
        return {
          user,
          status: 'exists',
          message: 'User already exists, password updated',
        };
      } catch (updateError: any) {
        return {
          user,
          status: 'exists',
          message: 'User already exists (could not update)',
        };
      }
    }

    // Create new user using Admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: user.password,
      phone: user.phone,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        full_name: user.name,
        phone: user.phone,
      },
      app_metadata: {
        role: user.role,
      },
    });

    if (createError) {
      return {
        user,
        status: 'error',
        message: `Failed to create user: ${createError.message}`,
        error: createError.message,
      };
    }

    // Create user_profile entry
    if (newUser.user && user.userProfileData) {
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .upsert({
          id: newUser.user.id,
          role: user.role,
          name: user.name,
          phone: user.phone,
          avatar_url: user.userProfileData.avatar_url || null,
          is_email_verified: user.userProfileData.is_email_verified,
          is_phone_verified: user.userProfileData.is_phone_verified,
        }, {
          onConflict: 'id',
        });

      if (profileError) {
        return {
          user,
          status: 'error',
          message: `User created but profile failed: ${profileError.message}`,
          error: profileError.message,
        };
      }
    }

    return {
      user,
      status: 'success',
      message: 'User and profile created successfully',
    };
  } catch (error: any) {
    return {
      user,
      status: 'error',
      message: `Unexpected error: ${error.message}`,
      error: error.message,
    };
  }
}

async function createAllTestUsers() {
  console.log('👤 Creating test users via Supabase Admin API...\n');
  console.log(`Found ${testUsers.length} test users to create\n`);

  for (const user of testUsers) {
    console.log(`📝 Creating ${user.role}: ${user.email}...`);
    const result = await createTestUser(user);
    results.push(result);

    if (result.status === 'success') {
      console.log(`   ✅ ${result.message}\n`);
    } else if (result.status === 'exists') {
      console.log(`   ⚠️  ${result.message}\n`);
    } else {
      console.log(`   ❌ ${result.message}`);
      if (result.error) {
        console.log(`   Error: ${result.error}\n`);
      }
    }
  }

  // Print summary
  console.log('\n📊 Creation Summary:\n');

  const successCount = results.filter(r => r.status === 'success').length;
  const existsCount = results.filter(r => r.status === 'exists').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  for (const result of results) {
    const icon = result.status === 'success' ? '✅' : result.status === 'exists' ? '⚠️' : '❌';
    console.log(`${icon} ${result.user.email} (${result.user.role}): ${result.message}`);
  }

  console.log('\n📈 Summary:');
  console.log(`   ✅ Created: ${successCount}`);
  console.log(`   ⚠️  Exists: ${existsCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('');

  if (errorCount > 0) {
    console.log('❌ Some users failed to create. Please check errors above.');
    process.exit(1);
  } else {
    console.log('✅ All test users ready!');
    console.log('\n📝 Test credentials available in: TEST_CREDENTIALS.md');
    console.log('\n💡 Note: Users created via Admin API can login immediately.');
    process.exit(0);
  }
}

// Run user creation
createAllTestUsers().catch((error) => {
  console.error('💥 User creation script failed:', error);
  process.exit(1);
});

