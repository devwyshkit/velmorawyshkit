/**
 * Fix Admin User Role in Supabase Auth
 * Run with: node fix-admin-role.mjs
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

async function fixAdminRole() {
  try {
    console.log('🔍 Finding admin user...');
    
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
    console.log('📧 Current metadata:', JSON.stringify(adminUser.user_metadata, null, 2));
    
    // Update user metadata with admin role
    console.log('🔐 Setting admin role...');
    const { data, error } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      { 
        user_metadata: {
          role: 'admin',
          name: 'Platform Administrator'
        }
      }
    );

    if (error) {
      console.error('❌ Update error:', error.message);
      return;
    }

    console.log('✅ Admin role set successfully!');
    console.log('📧 New metadata:', JSON.stringify(data.user.user_metadata, null, 2));
    console.log('\n✅ You can now login to the admin panel!');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

fixAdminRole();

