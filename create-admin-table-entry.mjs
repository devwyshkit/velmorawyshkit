/**
 * Create Admin User Entry in admin_users Table
 * Run with: node create-admin-table-entry.mjs
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

async function createAdminTableEntry() {
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

    console.log('✅ Found admin auth user:', adminUser.id);
    
    // Insert into admin_users table
    console.log('📝 Creating admin_users entry...');
    const { data, error } = await supabase
      .from('admin_users')
      .upsert({
        id: adminUser.id,
        email: 'admin@wyshkit.com',
        name: 'Platform Administrator',
        role: 'super_admin',
        is_active: true,
        created_at: new Date().toISOString(),
        last_login: null
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Insert error:', error.message);
      return;
    }

    console.log('✅ Admin user entry created successfully!');
    console.log('📋 Entry:', JSON.stringify(data, null, 2));
    console.log('\n🎉 Admin login should now work!');
    console.log('\n🔑 Credentials:');
    console.log('📧 Email: admin@wyshkit.com');
    console.log('🔑 Password: AdminWysh@2024');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

createAdminTableEntry();

