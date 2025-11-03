/**
 * GSTIN Verification Edge Function
 * Uses IDfy Production API for GSTIN verification
 * 
 * Production Credentials:
 * - Account ID: 1a3dfae3d9a0/20fba821-ee50-46db-9e7e-6c1716da6cbb
 * - API Key: a7cccddc-cd3c-4431-bd21-2d3f7694b955
 * 
 * Environment Variables (optional, falls back to production defaults):
 * - IDFY_ACCOUNT_ID: IDfy account ID
 * - IDFY_API_KEY: IDfy API key
 * 
 * Endpoint: https://eve.idfy.com/v3/tasks/async/ind_gst_with_nil_return/sync
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { gstin } = await req.json()

    // Validate input
    if (!gstin || gstin.length !== 15) {
      return new Response(
        JSON.stringify({ error: 'Invalid GSTIN format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check cache first
    const { data: cachedResult } = await supabaseClient
      .from('gstin_verification_cache')
      .select('*')
      .eq('gstin', gstin.toUpperCase())
      .gt('expires_at', new Date().toISOString())
      .single()

    // If cached and not expired, return cached result
    if (cachedResult) {
      return new Response(
        JSON.stringify({
          verified: cachedResult.verified,
          business_name: cachedResult.business_name,
          status: cachedResult.status,
          address: cachedResult.address,
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Not cached or expired - call IDfy API with production credentials
    const idfyAccountId = Deno.env.get('IDFY_ACCOUNT_ID') || '1a3dfae3d9a0/20fba821-ee50-46db-9e7e-6c1716da6cbb'
    const idfyApiKey = Deno.env.get('IDFY_API_KEY') || 'a7cccddc-cd3c-4431-bd21-2d3f7694b955'
    
    if (!idfyAccountId || !idfyApiKey) {
      return new Response(
        JSON.stringify({ error: 'IDfy credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call IDfy GST verification endpoint (Production: ind_gst_with_nil_return)
    // Endpoint: https://eve.idfy.com/v3/tasks/async/ind_gst_with_nil_return/sync
    const idfyResponse = await fetch('https://eve.idfy.com/v3/tasks/async/ind_gst_with_nil_return/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'account-id': idfyAccountId,
        'api-key': idfyApiKey,
      },
      body: JSON.stringify({
        task_id: `gst_${Date.now()}_${gstin.toUpperCase()}`,
        group_id: 'gstin_verification',
        data: {
          gstin: gstin.toUpperCase(),
        },
      }),
    })

    if (!idfyResponse.ok) {
      const errorText = await idfyResponse.text().catch(() => 'Unknown error')
      console.error('IDfy API error:', errorText)
      throw new Error(`IDfy API call failed: ${idfyResponse.status} - ${errorText}`)
    }

    const idfyData = await idfyResponse.json()
    
    // Parse IDfy response (matches idfy-real.ts pattern)
    // Response structure: { request_id, status, result: { source_output: { ... } } }
    const sourceOutput = idfyData?.result?.source_output || {}
    const verified = idfyData?.status === 'completed' && sourceOutput?.status === 'Active'
    const businessName = sourceOutput?.legal_name || null
    const status = sourceOutput?.status || null
    const address = sourceOutput?.principal_place_of_business_address || null

    // Store in cache
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days TTL

    await supabaseClient
      .from('gstin_verification_cache')
      .upsert({
        gstin: gstin.toUpperCase(),
        verified,
        business_name: businessName,
        status,
        address,
        raw_response: idfyData,
        verified_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      })

    return new Response(
      JSON.stringify({
        verified,
        business_name: businessName,
        status,
        address,
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    // Swiggy 2025: Silent error handling - return verified: false instead of throwing
    console.error('GSTIN verification error:', error.message || error)
    return new Response(
      JSON.stringify({
        verified: false,
        business_name: null,
        status: null,
        address: null,
        cached: false,
        error: 'Verification temporarily unavailable'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

