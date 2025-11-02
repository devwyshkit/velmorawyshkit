import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as crypto from "https://deno.land/std@0.168.0/crypto/mod.ts"

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
    const { orderId, amount } = await req.json()

    // Validate input
    if (!orderId || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid input: orderId and amount required' }),
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
      .select('*, customer_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Razorpay order
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!razorpayKeyId || !razorpayKeySecret) {
      // Mock response for development
      const mockOrderId = `mock_rzp_${Date.now()}`
      
      // Store in payment_transactions
      await supabaseClient
        .from('payment_transactions')
        .insert({
          order_id: orderId,
          gateway: 'razorpay',
          gateway_transaction_id: mockOrderId,
          gateway_order_id: mockOrderId,
          amount,
          currency: 'INR',
          status: 'pending'
        })

      return new Response(
        JSON.stringify({
          razorpay_order_id: mockOrderId,
          key_id: 'mock_key',
          message: 'Mock payment order created (Razorpay not configured)'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate Razorpay order
    const razorpayOrderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        receipt: order.order_number || orderId,
        notes: {
          order_id: orderId,
          order_number: order.order_number
        }
      })
    })

    if (!razorpayOrderResponse.ok) {
      const errorData = await razorpayOrderResponse.json()
      throw new Error(`Razorpay error: ${errorData.error?.description || 'Unknown error'}`)
    }

    const razorpayOrder = await razorpayOrderResponse.json()

    // Store in payment_transactions
    await supabaseClient
      .from('payment_transactions')
      .insert({
        order_id: orderId,
        gateway: 'razorpay',
        gateway_transaction_id: razorpayOrder.id,
        gateway_order_id: razorpayOrder.id,
        amount,
        currency: 'INR',
        status: 'pending'
      })

    return new Response(
      JSON.stringify({
        razorpay_order_id: razorpayOrder.id,
        key_id: razorpayKeyId,
        amount: razorpayOrder.amount / 100,
        currency: 'INR'
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

