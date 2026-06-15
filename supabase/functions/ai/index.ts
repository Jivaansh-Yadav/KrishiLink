import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ChatMsg = { role: "user" | "assistant"; content: string };

type AiRequest =
  | { mode: "chat"; messages: ChatMsg[] }
  | { mode: "disease"; symptoms?: string; imageBase64?: string; mimeType?: string }
  | { mode: "weather-summary"; weather: any; location?: string };

const CHAT_SYSTEM_PROMPT = `You are KrishiBot, an AI assistant for KrishiLink - an agricultural marketplace platform in India.
Help farmers and buyers with practical, actionable advice. Keep answers concise and clear.
Provide responses in Hindi unless another language is explicitly requested.
You can use internet information for the latest agricultural updates and weather insights.
Do not use markdown formatting such as **, backticks, ##, or code blocks.
You can answer questions about:
- Crop prices and MSP (Minimum Support Price)
- Farming techniques and best practices
- Weather and seasonal advice
- Crop diseases and treatments
- Government schemes for farmers
- Market trends and buyer connections`;

// Use Gemini 2.5 Flash Lite model - correct model name per docs
const GEMINI_MODEL = "gemini-2.5-flash-lite";

function geminiEndpoint(apiKey: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as AiRequest;
    console.log("AI request mode:", body.mode);

    let requestBody: any;

    if (body.mode === "chat") {
      const messages = body.messages || [];
      // Build conversation with system prompt as first user message
      const contents = [
        { role: "user", parts: [{ text: CHAT_SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Namaste! I am KrishiBot, your agricultural assistant. I'm here to help you with farming advice, crop information, MSP rates, disease management, and government schemes. How can I help you today?" }] },
        ...messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      ];
      requestBody = { contents };
    } else if (body.mode === "disease") {
      const symptoms = body.symptoms?.trim();
      const prompt = `You are an expert agricultural scientist specializing in crop diseases in India.

${symptoms ? `The farmer describes these symptoms: ${symptoms}` : "Analyze the provided image of a crop/plant."}

Provide a detailed diagnosis in Hindi unless another language is explicitly requested. If you cannot identify a specific disease, provide general advice.

You MUST respond with valid JSON in this exact format (no markdown, no code blocks, just pure JSON):
{
  "disease": "Name of the disease or 'Healthy' if no disease detected",
  "confidence": "High" or "Medium" or "Low",
  "description": "Brief description of the condition",
  "symptoms": ["symptom 1", "symptom 2"],
  "treatment": ["treatment step 1", "treatment step 2"],
  "prevention": ["prevention tip 1", "prevention tip 2"]
}`;

      const parts: any[] = [];
      if (body.imageBase64) {
        parts.push({
          inline_data: {
            mime_type: body.mimeType || "image/jpeg",
            data: body.imageBase64,
          },
        });
      }
      parts.push({ text: prompt });

      requestBody = { contents: [{ parts }] };
    } else if (body.mode === "weather-summary") {
      const prompt = `You are an agricultural weather advisor for Indian farmers.
Weather JSON for ${body.location || "the farm"} (Open-Meteo): ${JSON.stringify(body.weather).substring(0, 6000)}

Respond in Hindi unless another language is explicitly requested. Be concise and practical.

Return ONLY valid JSON (no markdown) in this EXACT shape:
{
  "severity": "green" | "yellow" | "red",
  "headline": "max 8 words status",
  "summary": "1 short sentence (max 22 words) about today's impact on farming",
  "categories": {
    "immediate": { "title": "Immediate / Daily Use", "points": ["temperature note", "rainfall amount + probability note", "humidity note", "wind/spraying note", "UV note"] },
    "crop_field": { "title": "Crop & Field Decisions", "points": ["7-14 day rainfall + irrigation tip", "soil temperature + germination", "evapotranspiration + soil moisture", "dry-spell + harvest window"] },
    "pest_disease": { "title": "Pest & Disease Risk", "points": ["dew point + leaf-wetness risk", "consecutive rainy days + waterlogging/fungal risk"] },
    "seasonal": { "title": "Seasonal Planning", "points": ["monsoon onset hint", "frost / rabi planning hint"] }
  },
  "do": ["short do tip 1", "short do tip 2", "short do tip 3"],
  "dont": ["short don't tip 1", "short don't tip 2", "short don't tip 3"]
}
Severity rules: green = safe; yellow = caution (heat, light rain, wind, humidity, UV); red = danger (heavy rain, storm, extreme heat/cold, frost, strong winds). Keep every point under 16 words.`;
      requestBody = { contents: [{ parts: [{ text: prompt }] }] };
    } else {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Calling Gemini API with model:", GEMINI_MODEL);
    const resp = await fetch(geminiEndpoint(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const raw = await resp.text();
    console.log("Gemini response status:", resp.status);

    if (!resp.ok) {
      console.error("Gemini API error:", resp.status, raw);
      return new Response(JSON.stringify({ 
        error: "AI provider error", 
        status: resp.status, 
        details: raw.substring(0, 500) 
      }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = JSON.parse(raw);
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    console.log("AI response received, length:", content.length);

    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("ai function error:", e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
