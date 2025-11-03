-- Test User Seed Data
-- For development and testing purposes
-- Run this after migrations are applied

-- Test Customer User
-- Email: test@wyshkit.com
-- Password: TestUser123!
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'test@wyshkit.com',
  crypt('TestUser123!', gen_salt('bf')), -- Password encrypted
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"full_name": "Test User", "phone": "+919876543210"}'::jsonb,
  false,
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Test Customer Profile
INSERT INTO user_profiles (
  id,
  role,
  name,
  phone,
  avatar_url,
  is_email_verified,
  is_phone_verified
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'customer',
  'Test User',
  '+919876543210',
  NULL,
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  is_email_verified = EXCLUDED.is_email_verified,
  is_phone_verified = EXCLUDED.is_phone_verified;

-- Test Address for Test User
INSERT INTO addresses (
  id,
  user_id,
  type,
  name,
  phone,
  address_line1,
  address_line2,
  landmark,
  city,
  state,
  pincode,
  is_default
) VALUES (
  '00000000-0000-0000-0000-000000000010'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'home',
  'Test User',
  '+919876543210',
  '123 Test Street',
  'Test Building',
  'Near Test Mall',
  'Mumbai',
  'Maharashtra',
  '400001',
  true
)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE addresses IS 'Test address seeded for test user';



