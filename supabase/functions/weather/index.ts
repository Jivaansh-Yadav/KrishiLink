import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const location = (body?.location as string | undefined) || "Delhi";

    const apiKey = Deno.env.get("WEATHER_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "WEATHER_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use IndianAPI.in Weather API
    const url = `https://weather.indianapi.in/india/weather?city=${encodeURIComponent(location)}`;
    console.log("Fetching weather from:", url);
    
    const resp = await fetch(url, {
      headers: {
        "X-Api-Key": apiKey,
      },
    });
    const text = await resp.text();

    if (!resp.ok) {
      console.error("Weather API error:", resp.status, text);
      // Fallback response with mock data for demo purposes
      const fallbackData = {
        location: { name: location, region: "India", country: "India" },
        current: {
          temp_c: 28,
          condition: { text: "Partly cloudy", icon: "" },
          humidity: 65,
          wind_kph: 12,
          feelslike_c: 30,
        },
        _fallback: true,
      };
      return new Response(JSON.stringify(fallbackData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and transform the response to match expected format
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }

    // Transform IndianAPI response to our expected format
    const transformedData = {
      location: {
        name: data.city_name || location,
        region: data.state || "India",
        country: "India",
      },
      current: {
        temp_c: data.temperature || data.temp_c || 28,
        condition: {
          text: data.weather_description || data.condition || "Clear",
          icon: "",
        },
        humidity: data.humidity || 60,
        wind_kph: data.wind_speed || data.wind_kph || 10,
        feelslike_c: data.feels_like || data.temperature || 28,
      },
    };

    return new Response(JSON.stringify(transformedData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("weather function error:", e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
