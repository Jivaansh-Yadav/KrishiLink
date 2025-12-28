import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ChatMsg = { role: "user" | "assistant"; content: string };

type AiRequest =
  | { mode: "translate"; text: string; targetLanguage: string }
  | { mode: "chat"; messages: ChatMsg[] }
  | { mode: "disease"; symptoms?: string; imageBase64?: string; mimeType?: string };

const CHAT_SYSTEM_PROMPT = `You are KrishiBot, an AI assistant for KrishiLink - an agricultural marketplace platform in India.
Help farmers and buyers with practical, actionable advice. Keep answers concise and clear.`;

function geminiEndpoint(apiKey: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as AiRequest;

    let requestBody: any;

    if (body.mode === "translate") {
      const prompt = `Translate the following text to ${body.targetLanguage}. Only return the translated text, nothing else.\n\n${body.text}`;
      requestBody = { contents: [{ parts: [{ text: prompt }] }] };
    } else if (body.mode === "chat") {
      const messages = body.messages || [];
      requestBody = {
        contents: [
          { role: "user", parts: [{ text: CHAT_SYSTEM_PROMPT }] },
          ...messages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
        ],
      };
    } else if (body.mode === "disease") {
      const symptoms = body.symptoms?.trim();
      const prompt = `You are an expert agricultural scientist specializing in crop diseases.\n\n${symptoms ? `Symptoms described: ${symptoms}\n\n` : ""}Provide a detailed diagnosis.\n\nRespond in JSON with:\n{\n  \"disease\": \"...\",\n  \"confidence\": \"High/Medium/Low\",\n  \"description\": \"...\",\n  \"symptoms\": [\"...\"],\n  \"treatment\": [\"...\"],\n  \"prevention\": [\"...\"]\n}`;

      const parts: any[] = [];
      if (body.imageBase64) {
        parts.push({
          inline_data: {
            mime_type: body.mimeType || "image/jpeg",
            data: body.imageBase64,
          },
        });
      }
      parts.push({ text: body.imageBase64 ? `Analyze this crop/plant image. ${prompt}` : prompt });

      requestBody = { contents: [{ parts }] };
    } else {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch(geminiEndpoint(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const raw = await resp.text();
    if (!resp.ok) {
      console.error("gemini error:", resp.status, raw);
      return new Response(JSON.stringify({ error: "AI provider error", status: resp.status, details: raw }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = JSON.parse(raw);
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

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
