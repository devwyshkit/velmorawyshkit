/**
 * Reset Admin User Password in Supabase Auth
 * Run with: node reset-admin-password.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://usiwuxudinfxttvrcczb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzaXd1eHVkaW5meHR0dnJjY3piIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQzMTg0MSwiZXhwIjoyMDc2MDA3ODQxfQ.x574GLTuZOfzF1dcqlXFdH3iWjONhFwIJqQ53R9T8HY';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetAdminPassword() {
  try {
    console.log('🔍 Finding admin user by email...');
    
    // List all users to find admin
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ List error:', listError.message);
      return;
    }

    const adminUser = users.find(u => u.email === 'admin@wyshkit.com');
    
    if (!adminUser) {
      console.error('❌ Admin user not found!');
      return;
    }

    console.log('✅ Found admin user:', adminUser.id);
    console.log('📧 Email:', adminUser.email);
    
    // Reset password
    console.log('🔐 Resetting password...');
    const { data, error } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      { password: 'AdminWysh@2024' }
    );

    if (error) {
      console.error('❌ Update error:', error.message);
      return;
    }

    console.log('✅ Password reset successfully!');
    console.log('\n🔑 Admin Credentials:');
    console.log('📧 Email: admin@wyshkit.com');
    console.log('🔑 Password: AdminWysh@2024');
    console.log('🆔 UUID:', adminUser.id);
    console.log('\n✅ You can now login to the admin panel!');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

resetAdminPassword();

