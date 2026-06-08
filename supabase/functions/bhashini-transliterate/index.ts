import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CONFIG_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline";
// Bhashini Dhruva default pipeline ID
const PIPELINE_ID = "64392f96daac500b55c543cd";

// Simple in-memory cache for service/callback config (per source-target pair)
const configCache = new Map<string, { serviceId: string; callbackUrl: string; authName: string; authValue: string; expiresAt: number }>();

async function getConfig(sourceLanguage: string, targetLanguage: string) {
  const key = `${sourceLanguage}->${targetLanguage}`;
  const cached = configCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached;

  const userID = Deno.env.get("BHASHINI_UDYAT_KEY");
  const ulcaApiKey = Deno.env.get("BHASHINI_INFERENCE_API_KEY");
  if (!userID || !ulcaApiKey) throw new Error("Bhashini secrets not configured");

  const res = await fetch(CONFIG_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      userID,
      ulcaApiKey,
    },
    body: JSON.stringify({
      pipelineTasks: [
        {
          taskType: "transliteration",
          config: { language: { sourceLanguage, targetLanguage } },
        },
      ],
      pipelineRequestConfig: { pipelineId: PIPELINE_ID },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Config call failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const task = (data.pipelineResponseConfig || []).find((t: any) => t.taskType === "transliteration");
  const serviceId = task?.config?.[0]?.serviceId;
  const callbackUrl = data.pipelineInferenceAPIEndPoint?.callbackUrl;
  const authName = data.pipelineInferenceAPIEndPoint?.inferenceApiKey?.name;
  const authValue = data.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value;

  if (!serviceId || !callbackUrl) throw new Error("Invalid config response from Bhashini");

  const entry = { serviceId, callbackUrl, authName, authValue, expiresAt: Date.now() + 30 * 60 * 1000 };
  configCache.set(key, entry);
  return entry;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const text: string = body.text || "";
    const sourceLanguage: string = body.sourceLanguage || "en";
    const targetLanguage: string = body.targetLanguage || "hi";
    const isSentence: boolean = body.isSentence ?? true;
    const numSuggestions: number = body.numSuggestions ?? 1;

    if (!text.trim()) {
      return new Response(JSON.stringify({ output: text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (sourceLanguage === targetLanguage) {
      return new Response(JSON.stringify({ output: text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cfg = await getConfig(sourceLanguage, targetLanguage);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (cfg.authName && cfg.authValue) headers[cfg.authName] = cfg.authValue;

    const compute = await fetch(cfg.callbackUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: "transliteration",
            config: {
              language: { sourceLanguage, targetLanguage },
              serviceId: cfg.serviceId,
              isSentence,
              numSuggestions,
            },
          },
        ],
        inputData: { input: [{ source: text }] },
      }),
    });

    if (!compute.ok) {
      const errText = await compute.text();
      console.error("Compute failed", compute.status, errText);
      return new Response(JSON.stringify({ output: text, error: errText }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await compute.json();
    const out = result?.pipelineResponse?.[0]?.output?.[0];
    const transliterated = out?.target || (out?.targets?.[0] ?? text);

    return new Response(JSON.stringify({ output: transliterated, suggestions: out?.targets || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("bhashini-transliterate error", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});