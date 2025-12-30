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
      console.error("WEATHER_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "WEATHER_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use IndianAPI.in Weather API - /india/weather endpoint
    const url = `https://weather.indianapi.in/india/weather?city=${encodeURIComponent(location)}`;
    console.log("Fetching weather from:", url);

    const resp = await fetch(url, {
      headers: {
        "x-api-key": apiKey,
      },
    });
    const text = await resp.text();
    console.log("Weather API response status:", resp.status);
    console.log("Weather API response:", text.substring(0, 500));

    if (!resp.ok) {
      console.error("Weather API error:", resp.status, text);
      // Return fallback data for demo
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
        _error: `API returned ${resp.status}`,
      };
      return new Response(JSON.stringify(fallbackData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Failed to parse weather response");
      data = {};
    }

    // Transform IndianAPI response format to our expected format
    // IndianAPI returns: { city, weather: { current: { temperature: { max, min }, humidity: { morning, evening } }, forecast, astronomical } }
    const weather = data?.weather || {};
    const current = weather?.current || {};
    const temp = current?.temperature || {};
    const humidity = current?.humidity || {};

    const avgTemp = temp.max?.value && temp.min?.value 
      ? (temp.max.value + temp.min.value) / 2 
      : temp.max?.value || temp.min?.value || 28;

    const avgHumidity = humidity.morning && humidity.evening
      ? Math.round((humidity.morning + humidity.evening) / 2)
      : humidity.morning || humidity.evening || 60;

    // Get forecast for today's description
    const forecast = weather?.forecast || [];
    const todayForecast = forecast[0] || {};

    const transformedData = {
      location: {
        name: data.city || location,
        region: "India",
        country: "India",
      },
      current: {
        temp_c: Math.round(avgTemp),
        condition: {
          text: todayForecast.description || "Clear",
          icon: "",
        },
        humidity: avgHumidity,
        wind_kph: 10,
        feelslike_c: Math.round(avgTemp + 2),
      },
      astronomical: weather?.astronomical || null,
      forecast: forecast,
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
