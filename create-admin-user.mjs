/**
 * Create Admin User in Supabase Auth
 * Run with: node create-admin-user.mjs
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

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...');
    
    // Create admin user in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@wyshkit.com',
      password: 'AdminWysh@2024',
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        name: 'Platform Administrator'
      }
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@wyshkit.com');
    console.log('🔑 Password: AdminWysh@2024');
    console.log('🆔 UUID:', authData.user.id);
    console.log('\n✅ You can now login to the admin panel!');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

createAdminUser();

