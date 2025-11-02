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
    const { orderId, cartItems, gstin, customerInfo } = await req.json()

    // Validate input
    if (!orderId || !cartItems || !Array.isArray(cartItems)) {
      return new Response(
        JSON.stringify({ error: 'Invalid input: orderId and cartItems required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare Refrens API payload
    const refrensApiKey = Deno.env.get('REFRENS_API_KEY')
    const refrensCompanyId = Deno.env.get('REFRENS_COMPANY_ID')

    if (!refrensApiKey || !refrensCompanyId) {
      // Mock response for development
      const mockPdfUrl = `https://storage.example.com/estimates/${orderId}.pdf`
      
      // Store mock URL in orders table
      await supabaseClient
        .from('orders')
        .update({ estimate_url: mockPdfUrl })
        .eq('id', orderId)

      return new Response(
        JSON.stringify({
          pdf_url: mockPdfUrl,
          message: 'Mock estimate generated (Refrens not configured)'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build line items for Refrens
    const lineItems = cartItems.map((item: any) => ({
      description: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      tax_rate: 18, // GST rate
    }))

    // Call Refrens API to create estimate
    const refrensResponse = await fetch(`https://api.refrens.com/v1/estimates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refrensApiKey}`
      },
      body: JSON.stringify({
        company_id: refrensCompanyId,
        customer: {
          name: customerInfo?.name || 'Customer',
          email: customerInfo?.email || '',
          gstin: gstin || null,
        },
        line_items: lineItems,
        subtotal: order.subtotal,
        tax_amount: order.tax_amount,
        total: order.total_amount,
        currency: 'INR',
        metadata: {
          order_id: orderId,
          order_number: order.order_number
        }
      })
    })

    if (!refrensResponse.ok) {
      throw new Error('Refrens API call failed')
    }

    const refrensData = await refrensResponse.json()
    const pdfUrl = refrensData?.pdf_url || refrensData?.document_url

    if (!pdfUrl) {
      throw new Error('No PDF URL returned from Refrens')
    }

    // Store estimate URL in orders table
    await supabaseClient
      .from('orders')
      .update({ 
        estimate_url: pdfUrl,
        invoice_number: refrensData?.estimate_number,
        gstin_verified_at: gstin ? new Date().toISOString() : null
      })
      .eq('id', orderId)

    return new Response(
      JSON.stringify({
        pdf_url: pdfUrl,
        estimate_number: refrensData?.estimate_number
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

