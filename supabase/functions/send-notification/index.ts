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
    const { 
      userId, 
      type, 
      title, 
      message, 
      data,
      priority = 'normal'
    } = await req.json()

    // Validate input
    if (!userId || !type || !title || !message) {
      return new Response(
        JSON.stringify({ error: 'Invalid input: userId, type, title, message required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Insert notification
    const { data: notification, error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data: data || {},
        priority,
        read: false
      })
      .select()
      .single()

    if (notificationError) {
      throw notificationError
    }

    // TODO: Send push notification via FCM if user has registered
    // const fcmToken = await getFCMToken(userId)
    // if (fcmToken) {
    //   await sendFCMPushNotification(fcmToken, title, message, data)
    // }

    // TODO: Send email if configured
    // await sendEmail(userId, title, message)

    return new Response(
      JSON.stringify({
        success: true,
        notification_id: notification.id
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

