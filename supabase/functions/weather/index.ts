import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const lat = Number(body?.lat);
    const lon = Number(body?.lon);
    const name = (body?.name as string) || "Location";

    if (!isFinite(lat) || !isFinite(lon)) {
      return new Response(JSON.stringify({ error: "lat/lon required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      timezone: "auto",
      forecast_days: "14",
      current:
        "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_gusts_10m,uv_index,is_day",
      hourly:
        "temperature_2m,precipitation_probability,precipitation,relative_humidity_2m,dew_point_2m,soil_temperature_0cm,soil_temperature_6cm,et0_fao_evapotranspiration",
      daily:
        "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,precipitation_hours,rain_sum,wind_speed_10m_max,uv_index_max,sunrise,sunset,et0_fao_evapotranspiration,weather_code",
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    console.log("Open-Meteo fetch:", url);
    const resp = await fetch(url);
    if (!resp.ok) {
      const text = await resp.text();
      console.error("Open-Meteo error", resp.status, text);
      return new Response(JSON.stringify({ error: "weather provider error", details: text }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await resp.json();

    const codeText = (c: number | undefined) => {
      const map: Record<number, string> = {
        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Fog", 48: "Depositing rime fog",
        51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
        61: "Light rain", 63: "Rain", 65: "Heavy rain",
        71: "Light snow", 73: "Snow", 75: "Heavy snow",
        80: "Light showers", 81: "Showers", 82: "Violent showers",
        95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Severe thunderstorm",
      };
      return c != null ? (map[c] || "Unknown") : "Unknown";
    };

    const cur = data.current || {};
    const daily = data.daily || {};
    const hourly = data.hourly || {};

    // Build daily forecast array
    const forecast = (daily.time || []).map((d: string, i: number) => ({
      date: d,
      max_temp: daily.temperature_2m_max?.[i],
      min_temp: daily.temperature_2m_min?.[i],
      precip_mm: daily.precipitation_sum?.[i],
      precip_prob: daily.precipitation_probability_max?.[i],
      precip_hours: daily.precipitation_hours?.[i],
      uv_max: daily.uv_index_max?.[i],
      wind_max: daily.wind_speed_10m_max?.[i],
      et0: daily.et0_fao_evapotranspiration?.[i],
      sunrise: daily.sunrise?.[i],
      sunset: daily.sunset?.[i],
      description: codeText(daily.weather_code?.[i]),
    }));

    // Dew point: take next 24h average from hourly
    const dewPoints: number[] = (hourly.dew_point_2m || []).slice(0, 24).filter((v: any) => v != null);
    const dew_point_avg = dewPoints.length ? dewPoints.reduce((a, b) => a + b, 0) / dewPoints.length : null;

    const soil = hourly.soil_temperature_0cm?.[0] ?? null;

    // Consecutive dry spell + rainy days from forecast
    let maxDry = 0, curDry = 0, maxRain = 0, curRain = 0;
    for (const f of forecast) {
      if ((f.precip_mm ?? 0) < 1) { curDry++; maxDry = Math.max(maxDry, curDry); curRain = 0; }
      else { curRain++; maxRain = Math.max(maxRain, curRain); curDry = 0; }
    }

    // 14d rainfall total
    const rainTotal14d = (daily.precipitation_sum || []).reduce((a: number, b: number) => a + (b || 0), 0);

    const transformed = {
      location: { name, region: "India", country: "India", lat, lon },
      current: {
        temp_c: cur.temperature_2m,
        condition: { text: codeText(cur.weather_code), icon: "" },
        humidity: cur.relative_humidity_2m,
        wind_kph: cur.wind_speed_10m,
        wind_gust_kph: cur.wind_gusts_10m,
        feelslike_c: cur.apparent_temperature,
        uv: cur.uv_index,
        precip_mm: cur.precipitation,
        is_day: cur.is_day,
      },
      astronomical: {
        sunrise: daily.sunrise?.[0]?.split("T")[1] || null,
        sunset: daily.sunset?.[0]?.split("T")[1] || null,
      },
      forecast,
      agronomy: {
        dew_point_c: dew_point_avg,
        soil_temp_c: soil,
        et0_today: daily.et0_fao_evapotranspiration?.[0] ?? null,
        max_dry_spell_days: maxDry,
        max_rainy_spell_days: maxRain,
        rain_14d_mm: Math.round(rainTotal14d * 10) / 10,
        uv_index_today: daily.uv_index_max?.[0] ?? null,
        precip_prob_today: daily.precipitation_probability_max?.[0] ?? null,
      },
      rainfall: { today_mm: daily.precipitation_sum?.[0] ?? 0, prob_pct: daily.precipitation_probability_max?.[0] ?? 0 },
    };

    return new Response(JSON.stringify(transformed), {
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