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

    // Refrens API credentials from environment
    const refrensApiKey = Deno.env.get('REFRENS_APP_SECRET') || 'dhfDagwaTH-zXg0xpe3mTgf3'
    const refrensUrlKey = Deno.env.get('REFRENS_URL_KEY') || 'velmora-labs-private-limited'
    const refrensAppId = Deno.env.get('REFRENS_APP_ID') || 'velmora-labs-private-limited-EfzaJ'

    if (!refrensApiKey || !refrensUrlKey) {
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

    // Build items for Refrens API (matches Refrens documentation format)
    const items = cartItems.map((item: any) => ({
      name: item.name || 'Item',
      rate: item.price || 0,
      quantity: item.quantity || 1,
      gstRate: 18, // 18% GST
    }))

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.rate * item.quantity), 0)
    const gstAmount = subtotal * 0.18
    const total = subtotal + gstAmount

    // Get customer address from order
    const deliveryAddress = typeof order.delivery_address === 'object' 
      ? order.delivery_address 
      : JSON.parse(order.delivery_address || '{}')

    // Call Refrens API to create estimate (Bill of Supply for estimates)
    const refrensResponse = await fetch(
      `https://api.refrens.com/businesses/${refrensUrlKey}/invoices`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refrensApiKey}`
        },
        body: JSON.stringify({
          invoiceTitle: 'Estimate',
          invoiceType: 'BOS', // Bill of Supply for estimates
          currency: 'INR',
          billedTo: {
            name: customerInfo?.name || deliveryAddress.name || 'Customer',
            email: customerInfo?.email || '',
            phone: deliveryAddress.phone || '',
            street: deliveryAddress.house || '',
            city: deliveryAddress.city || '',
            pincode: deliveryAddress.pincode || '',
            gstin: gstin || undefined,
            country: 'India',
          },
          billedBy: {
            name: 'Velmora Labs Private Limited',
            street: '123 Business Address',
            city: 'Bangalore',
            pincode: '560001',
            gstin: Deno.env.get('WYSHKIT_GSTIN') || undefined,
            country: 'India',
          },
          items: items,
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        })
      }
    )

    if (!refrensResponse.ok) {
      const errorText = await refrensResponse.text()
      console.error('Refrens API error:', errorText)
      throw new Error(`Refrens API failed: ${refrensResponse.status} - ${errorText}`)
    }

    const refrensData = await refrensResponse.json()
    
    // Refrens returns PDF in share.pdf field
    const pdfUrl = refrensData?.share?.pdf || refrensData?.pdf_url || refrensData?.document_url

    if (!pdfUrl) {
      console.error('Refrens response:', JSON.stringify(refrensData, null, 2))
      throw new Error('No PDF URL returned from Refrens')
    }

    // Store estimate URL in orders table
    await supabaseClient
      .from('orders')
      .update({ 
        estimate_url: pdfUrl,
        invoice_number: refrensData?.invoiceNumber || refrensData?.invoice_number,
        gstin_verified_at: gstin ? new Date().toISOString() : null
      })
      .eq('id', orderId)

    return new Response(
      JSON.stringify({
        pdf_url: pdfUrl,
        estimate_number: refrensData?.invoiceNumber || refrensData?.invoice_number,
        invoice_id: refrensData?._id || refrensData?.id,
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

