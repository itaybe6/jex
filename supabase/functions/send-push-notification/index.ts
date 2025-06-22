import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define CORS headers for preflight requests and responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  id: string
  user_id: string
  type: string
  data: {
    message: string
    [key: string]: any
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // The Edge Function is called by a trusted server-side RPC,
    // so we can initialize the Supabase client with the service role key.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // The RPC function sends the full notification record in the 'record' field.
    const { record: notification } = await req.json() as { record: NotificationPayload };

    if (!notification || !notification.user_id) {
      console.warn('Received invalid notification payload:', notification);
      return new Response(
        JSON.stringify({ error: 'Missing user_id or notification record' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the user's push token from the profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('push_token')
      .eq('id', notification.user_id)
      .single()

    if (profileError || !profile) {
      console.error(`Error fetching profile for user ${notification.user_id}:`, profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!profile.push_token) {
      console.log(`No push token for user ${notification.user_id}. Skipping notification.`)
      return new Response(
        JSON.stringify({ message: 'User does not have a push token.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare and send the push notification
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: profile.push_token,
        sound: 'default',
        priority: 'high',
        title: getNotificationTitle(notification.type),
        body: notification.data?.message || 'You have a new notification.',
        data: {
          notificationId: notification.id,
          ...notification.data
        },
      }),
    })

    if (!expoResponse.ok) {
        const errorData = await expoResponse.json();
        console.error('Expo API error:', errorData);
        throw new Error('Failed to send push notification via Expo.');
    }

    return new Response(
      JSON.stringify({ message: 'Push notification sent successfully to user: ' + notification.user_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error in Edge Function:', error.message)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function getNotificationTitle(type: string): string {
  switch (type) {
    case 'transaction_offer':
      return 'New Deal Offer'
    case 'deal_completed':
      return 'Deal Completed'
    case 'deal_rejected':
      return 'Deal Rejected'
    case 'hold_request':
      return 'Hold Request'
    case 'hold_request_approved':
      return 'Hold Request Approved'
    case 'hold_request_rejected':
      return 'Hold Request Rejected'
    case 'waiting_seller_approval':
      return 'Waiting for Approval'
    default:
      return 'New Notification'
  }
}

interface ExpoPushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, any>
  sound?: string
  priority?: 'default' | 'normal' | 'high'
  badge?: number
}

interface ExpoPushResponse {
  status: 'ok' | 'error'
  message?: string
  details?: any
}

async function sendExpoPushNotification(message: ExpoPushMessage): Promise<ExpoPushResponse> {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    const result = await response.json()

    if (response.ok) {
      return { status: 'ok' }
    } else {
      return { 
        status: 'error', 
        message: result.errors?.[0]?.message || 'Unknown error',
        details: result
      }
    }
  } catch (error) {
    return { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Network error'
    }
  }
} 