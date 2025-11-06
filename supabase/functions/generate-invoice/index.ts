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
    const { orderId } = await req.json()

    // Validate input
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Invalid input: orderId required' }),
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
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get customer profile
    const { data: customerProfile } = await supabaseClient
      .from('user_profiles')
      .select('full_name, email, phone')
      .eq('id', order.customer_id)
      .single()

    // Refrens API credentials
    const refrensApiKey = Deno.env.get('REFRENS_APP_SECRET') || 'dhfDagwaTH-zXg0xpe3mTgf3'
    const refrensUrlKey = Deno.env.get('REFRENS_URL_KEY') || 'velmora-labs-private-limited'

    if (!refrensApiKey || !refrensUrlKey) {
      return new Response(
        JSON.stringify({ error: 'Refrens API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build items from order_items
    const items = (order.order_items || []).map((item: any) => ({
      name: item.item_name || 'Item',
      rate: item.unit_price || 0,
      quantity: item.quantity || 1,
      gstRate: 18, // 18% GST
    }))

    // Get delivery address
    const deliveryAddress = typeof order.delivery_address === 'object' 
      ? order.delivery_address 
      : JSON.parse(order.delivery_address || '{}')

    // Generate invoice number if not exists
    const invoiceNumber = order.invoice_number || `INV-${order.order_number}`

    // Call Refrens API to create invoice
    const refrensResponse = await fetch(
      `https://api.refrens.com/businesses/${refrensUrlKey}/invoices`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refrensApiKey}`
        },
        body: JSON.stringify({
          invoiceTitle: 'Invoice',
          invoiceType: order.is_business_order ? 'INVOICE' : 'BOS',
          currency: 'INR',
          invoiceNumber: invoiceNumber,
          billedTo: {
            name: customerProfile?.full_name || deliveryAddress.name || 'Customer',
            email: customerProfile?.email || '',
            phone: customerProfile?.phone || deliveryAddress.phone || '',
            street: deliveryAddress.house || '',
            city: deliveryAddress.city || '',
            pincode: deliveryAddress.pincode || '',
            gstin: order.gstin || undefined,
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
          invoiceDate: new Date(order.created_at).toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from order
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

    // Store invoice URL in orders table
    await supabaseClient
      .from('orders')
      .update({ 
        invoice_url: pdfUrl,
        invoice_number: refrensData?.invoiceNumber || refrensData?.invoice_number || invoiceNumber,
      })
      .eq('id', orderId)

    return new Response(
      JSON.stringify({
        pdf_url: pdfUrl,
        invoice_number: refrensData?.invoiceNumber || refrensData?.invoice_number || invoiceNumber,
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










