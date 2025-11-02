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

    // Not cached or expired - call IDfy API
    const idfyApiKey = Deno.env.get('IDFY_API_KEY')
    if (!idfyApiKey) {
      return new Response(
        JSON.stringify({ error: 'IDfy API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call IDfy GST verification endpoint
    const idfyResponse = await fetch('https://api.idfy.in/v3/tasks/gst-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idfyApiKey}`
      },
      body: JSON.stringify({
        task_id: crypto.randomUUID(),
        group_id: crypto.randomUUID(),
        data: {
          gstin: gstin.toUpperCase()
        }
      })
    })

    if (!idfyResponse.ok) {
      throw new Error('IDfy API call failed')
    }

    const idfyData = await idfyResponse.json()
    
    // Parse IDfy response
    const verified = idfyData?.result?.status === 'SUCCESS'
    const businessName = idfyData?.result?.data?.business_name || null
    const status = idfyData?.result?.data?.status || null
    const address = idfyData?.result?.data?.address || null

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
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

