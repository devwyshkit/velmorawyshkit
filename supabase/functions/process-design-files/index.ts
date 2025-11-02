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
    const { orderItemId, fileUrls } = await req.json()

    // Validate input
    if (!orderItemId || !fileUrls || !Array.isArray(fileUrls)) {
      return new Response(
        JSON.stringify({ error: 'Invalid input: orderItemId and fileUrls array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get order item details
    const { data: orderItem, error: orderItemError } = await supabaseClient
      .from('order_items')
      .select('*, order_id (*, store_id)')
      .eq('id', orderItemId)
      .single()

    if (orderItemError || !orderItem) {
      return new Response(
        JSON.stringify({ error: 'Order item not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update order_items.design_files with uploaded file URLs
    await supabaseClient
      .from('order_items')
      .update({ 
        design_files: fileUrls,
        preview_status: 'awaiting_preview'
      })
      .eq('id', orderItemId)

    // Create notification for vendor
    const { data: store, error: storeError } = await supabaseClient
      .from('stores')
      .select('owner_id')
      .eq('id', orderItem.order_id.store_id)
      .single()

    if (!storeError && store?.owner_id) {
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: store.owner_id,
          type: 'preview_files_uploaded',
          title: 'Design Files Uploaded',
          message: `Customer has uploaded design files for order #${orderItem.order_id.order_number}`,
          data: {
            order_id: orderItem.order_id.id,
            order_item_id: orderItemId,
            file_count: fileUrls.length
          },
          read: false
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Files processed and notification sent'
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

