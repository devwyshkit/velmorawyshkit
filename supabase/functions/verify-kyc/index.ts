/**
 * Supabase Edge Function: KYC Verification Proxy
 * 
 * Proxies IDfy API calls to avoid CORS issues
 * Keeps API keys secure on server-side
 * 
 * Deploy: supabase functions deploy verify-kyc
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const IDFY_BASE_URL = 'https://eve.idfy.com/v3';
const IDFY_API_KEY = Deno.env.get('IDFY_API_KEY') || 'a7cccddc-cd3c-4431-bd21-2d3f7694b955';
const IDFY_ACCOUNT_ID = Deno.env.get('IDFY_ACCOUNT_ID') || '1a3dfae3d9a0/20fba821-ee50-46db-9e7e-6c1716da6cbb';

// CORS headers for localhost + production
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();

    // Determine IDfy endpoint based on verification type
    const endpoints = {
      pan: 'tasks/sync/ind_pan',
      gst: 'tasks/sync/ind_gst',
      bank: 'tasks/sync/ind_bank_account_verification',
    };

    const endpoint = endpoints[type as keyof typeof endpoints];
    if (!endpoint) {
      throw new Error(`Invalid verification type: ${type}`);
    }

    // Call IDfy API
    const response = await fetch(`${IDFY_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'api-key': IDFY_API_KEY,
        'account-id': IDFY_ACCOUNT_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task_id: `${type}_${Date.now()}`,
        group_id: 'partner_kyc',
        data,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`IDfy API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('KYC verification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

