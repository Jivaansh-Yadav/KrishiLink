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
    // Per docs: GET https://weather.indianapi.in/india/weather?city=CityName
    // Header: x-api-key: YOUR_API_KEY
    const url = `https://weather.indianapi.in/india/weather?city=${encodeURIComponent(location)}`;
    console.log("Fetching weather from:", url);

    const resp = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Accept": "application/json",
      },
    });

    const text = await resp.text();
    console.log("Weather API response status:", resp.status);
    console.log("Weather API response preview:", text.substring(0, 300));

    if (!resp.ok) {
      console.error("Weather API error:", resp.status, text);
      // Return fallback data for demo purposes
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
        _error: `Weather API returned ${resp.status}`,
      };
      return new Response(JSON.stringify(fallbackData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error("Failed to parse weather response:", parseErr);
      return new Response(JSON.stringify({ 
        error: "Failed to parse weather data",
        location: { name: location, region: "India", country: "India" },
        current: { temp_c: 28, condition: { text: "Clear", icon: "" }, humidity: 60, wind_kph: 10, feelslike_c: 30 },
        _fallback: true,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Transform IndianAPI response format to our expected format
    // IndianAPI response structure per docs:
    // {
    //   "city": "Chennai-meenambakkam",
    //   "weather": {
    //     "current": {
    //       "humidity": { "evening": 64, "morning": 71 },
    //       "rainfall": null,
    //       "temperature": { "max": { "value": 32.1, "departure": -2.3 }, "min": { "value": 26.5, "departure": 1 } }
    //     },
    //     "forecast": [{ "date": "08-Sep-2024", "max_temp": 32, "min_temp": 27, "description": "Generally cloudy sky with moderate rain" }],
    //     "astronomical": { "sunset": "18:15", "moonset": "21:31", "sunrise": "05:58", "moonrise": "09:48" }
    //   }
    // }

    const weather = data?.weather || {};
    const current = weather?.current || {};
    const temp = current?.temperature || {};
    const humidity = current?.humidity || {};

    // Calculate average temperature from max/min
    const maxTemp = temp.max?.value ?? null;
    const minTemp = temp.min?.value ?? null;
    const avgTemp = maxTemp !== null && minTemp !== null 
      ? (maxTemp + minTemp) / 2 
      : maxTemp ?? minTemp ?? 28;

    // Calculate average humidity from morning/evening
    const morningHumidity = humidity.morning ?? null;
    const eveningHumidity = humidity.evening ?? null;
    const avgHumidity = morningHumidity !== null && eveningHumidity !== null
      ? Math.round((morningHumidity + eveningHumidity) / 2)
      : morningHumidity ?? eveningHumidity ?? 60;

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
        wind_kph: 10, // Not provided by IndianAPI, using default
        feelslike_c: Math.round(avgTemp + 2),
      },
      astronomical: weather?.astronomical || null,
      forecast: forecast,
      rainfall: current?.rainfall || null,
    };

    console.log("Returning transformed weather data for:", transformedData.location.name);
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
