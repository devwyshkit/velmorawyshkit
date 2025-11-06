// Edge Function: Sync Logistics Tracking
// Fetches tracking status from Porter/Delhivery APIs and updates Supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TrackingRequest {
  orderId: string;
  logisticsProvider: 'porter' | 'delhivery';
  trackingNumber: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { orderId, logisticsProvider, trackingNumber }: TrackingRequest = await req.json();

    if (!orderId || !logisticsProvider || !trackingNumber) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let trackingStatus = null;
    let statusText = "";
    let location = "";
    let estimatedDelivery = "";

    // Fetch tracking status from Porter/Delhivery APIs
    if (logisticsProvider === 'porter') {
      // Porter API integration
      const PORTER_API_KEY = Deno.env.get("PORTER_API_KEY");
      const PORTER_API_URL = Deno.env.get("PORTER_API_URL") || "https://api.porter.in/v1/tracking";

      if (PORTER_API_KEY) {
        try {
          const response = await fetch(`${PORTER_API_URL}/${trackingNumber}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${PORTER_API_KEY}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            trackingStatus = data;
            statusText = data.status || data.current_status || "In Transit";
            location = data.current_location || data.location || "";
            estimatedDelivery = data.estimated_delivery || data.eta || "";
          }
        } catch (error) {
          console.error("Porter API error:", error);
        }
      }
    } else if (logisticsProvider === 'delhivery') {
      // Delhivery API integration
      const DELHIVERY_API_KEY = Deno.env.get("DELHIVERY_API_KEY");
      const DELHIVERY_API_URL = Deno.env.get("DELHIVERY_API_URL") || "https://track.delhivery.com/api/v1/packages/json/";

      if (DELHIVERY_API_KEY) {
        try {
          const response = await fetch(`${DELHIVERY_API_URL}?waybill=${trackingNumber}`, {
            method: "GET",
            headers: {
              "Authorization": `Token ${DELHIVERY_API_KEY}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            trackingStatus = data;
            
            // Parse Delhivery response format
            if (data.ShipmentData && data.ShipmentData.length > 0) {
              const shipment = data.ShipmentData[0];
              statusText = shipment.Status || "In Transit";
              location = shipment.Origin || shipment.Destination || "";
              
              if (shipment.ExpectedDeliveryDate) {
                estimatedDelivery = shipment.ExpectedDeliveryDate;
              }
            }
          }
        } catch (error) {
          console.error("Delhivery API error:", error);
        }
      }
    }

    // Update order in Supabase with latest tracking status
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (statusText) {
      // Map logistics status to order status if needed
      if (statusText.toLowerCase().includes('delivered')) {
        updates.status = 'delivered';
      } else if (statusText.toLowerCase().includes('out for delivery') || statusText.toLowerCase().includes('out_for_delivery')) {
        updates.status = 'out_for_delivery';
      } else if (statusText.toLowerCase().includes('picked up') || statusText.toLowerCase().includes('picked_up')) {
        updates.status = 'picked_up';
      }
    }

    if (estimatedDelivery) {
      updates.delivery_eta = estimatedDelivery;
    }

    // Update order in Supabase
    const { error: updateError } = await supabaseClient
      .from("orders")
      .update(updates)
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
    }

    return new Response(
      JSON.stringify({
        status: statusText || "Unknown",
        location: location || "",
        estimatedDelivery: estimatedDelivery || "",
        lastUpdated: new Date().toISOString(),
        trackingStatus,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});









