<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:04120a,55:0d3520,100:16a34a&height=235&section=header&text=KrishiLink&fontSize=46&fontColor=ecfdf3&fontAlignY=40&desc=Farmer%20to%20buyer%2C%20with%20nothing%20in%20between&descSize=17&descAlignY=62&animation=twinkling" alt="KrishiLink" width="100%">

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=500&size=19&duration=3200&pause=900&color=4ade80&center=true&vCenter=true&width=680&lines=A%20marketplace%20where%20the%20farmer%20sets%20the%20price;Krishibot%20reads%20a%20leaf%20and%20answers%20in%20Hindi;Weather%20as%20advice%2C%20not%20as%20numbers" alt="Typing animation" />

<br />

<a href="https://krishilink.pages.dev/"><img src="https://img.shields.io/badge/%E2%96%B6%20Open%20KrishiLink-16a34a?style=for-the-badge&labelColor=04120a&logo=cloudflarepages&logoColor=4ade80" alt="Open KrishiLink" /></a>

</div>

<div align="center">

<img src="https://img.shields.io/badge/React-18-4ade80?style=flat-square&labelColor=04120a" alt="React 18" />
<img src="https://img.shields.io/badge/Backend-Supabase%20%2B%20Edge%20Functions-3ecf8e?style=flat-square&labelColor=04120a" alt="Supabase" />
<img src="https://img.shields.io/badge/AI-Gemini%202.5%20Flash%20Lite-22c55e?style=flat-square&labelColor=04120a" alt="Gemini 2.5 Flash Lite" />
<img src="https://img.shields.io/badge/Weather-Open--Meteo-86efac?style=flat-square&labelColor=04120a" alt="Open-Meteo" />
<img src="https://img.shields.io/badge/Licence-MIT-16a34a?style=flat-square&labelColor=04120a" alt="MIT" />

</div>

<br />

<div align="center">

### <a href="https://krishilink.pages.dev/">krishilink.pages.dev</a>

<sub>Two account types, one marketplace. Built with <a href="https://github.com/an-Aetheria">an-Aetheria</a> and scaffolded in Lovable.</sub>

</div>

---

<div align="center">

## What it is

</div>

A direct market for Indian farmers. A farmer lists what they have — crop, quantity, price, district — and a buyer finds it and contacts them. There is no dealer in the middle, which is the entire thesis: the platform is only worth building if the price the farmer sets is the price the buyer pays.

Around that core sit three things a farmer actually needs on the same screen: **what the government says the crop is worth** (MSP), **what the weather is about to do**, and **someone to ask when the leaves look wrong**.

<div align="center">

<sub>Interface language is Hindi-first. The AI assistant answers in Hindi unless told otherwise, because the person reading it is standing in a field, not in a lab.</sub>

</div>

---

<div align="center">

## The two sides

</div>

<ul>
<li><b>Farmer dashboard.</b> Add crops, edit them, see what is listed, and find buyers who have posted requirements. Prices are entered by the farmer — the platform never suggests one, except to show the MSP floor.</li>
<li><b>Buyer dashboard.</b> Browse listings by crop and location, and reach the farmer directly. No cart, no escrow, no commission — the transaction happens off-platform and the platform's job is the introduction.</li>
<li><b>Profiles and auth.</b> Supabase auth with a role per account, a register/login flow, and an auth callback route.</li>
<li><b>District and state data</b> — the location pickers are India-specific: states, districts, and a crop list with Hindi names alongside English.</li>
</ul>

<div align="center">

## What is inside

</div>

<ul>
<li><b>KrishiBot</b> — a chat assistant with an agricultural system prompt: farming advice, crop information, MSP rates, disease management, government schemes.</li>
<li><b>Crop disease diagnosis from a photo</b> — attach an image or describe symptoms, and get back a structured diagnosis with a confidence level.</li>
<li><b>Weather as a decision</b> — the Open-Meteo card is paired with a summary that returns a <b>green / yellow / red</b> severity instead of a wall of numbers.</li>
<li><b>MSP reference</b> — the full Kharif, Rabi and commercial MSP table with Hindi crop names, sourced and dated in the code rather than scraped at runtime.</li>
<li><b>Charts</b> — Recharts for the price and listing views, so a farmer can see their own range against the reference.</li>
<li><b>Bilingual crop names</b> — <i>Paddy (Common) / धान (सामान्य)</i> everywhere, so a label cannot be the barrier.</li>
</ul>

---

<div align="center">

## Stack

</div>

<ul>
<li><b>React 18 + TypeScript + Vite</b> — SPA, React Router, TanStack Query for the server state.</li>
<li><b>Supabase</b> — auth, Postgres with row-level security, and Edge Functions for everything that must not run in a browser.</li>
<li><b>Gemini 2.5 Flash Lite</b> — called from an Edge Function; the API key never reaches the client.</li>
<li><b>Open-Meteo</b> — through a second Edge Function, so the weather call is cached and keyless.</li>
<li><b>shadcn/ui + Tailwind</b> — the components; Recharts for graphs; React Hook Form + Zod for forms.</li>
</ul>

<div align="center">

<img src="https://skillicons.dev/icons?i=react,ts,vite,supabase,tailwind,cloudflare,git" alt="React, TypeScript, Vite, Supabase, Tailwind, Cloudflare, Git" />

</div>

---

<div align="center">

## Under the hood

</div>

<details>
<summary><b>One Edge Function, three modes</b></summary>

<br />

<p>The AI function is switched on <code>body.mode</code> rather than being three endpoints:</p>

<ul>
<li><b><code>chat</code></b> — the conversation is mapped to Gemini's <code>user</code>/<code>model</code> roles, with the system prompt sent as the first turn and a fixed greeting from KrishiBot as the first model reply.</li>
<li><b><code>disease</code></b> — the image is sent as <code>inline_data</code> with its MIME type, alongside a prompt demanding a specific JSON object.</li>
<li><b><code>weather-summary</code></b> — the Open-Meteo JSON (trimmed to 6,000 characters) plus the location, asking for severity and per-category advice.</li>
</ul>

<p>Three modes, one key, one place to enforce the model name — <code>gemini-2.5-flash-lite</code> is defined once as <code>GEMINI_MODEL</code>.</p>

</details>

<details>
<summary><b>Prompts that return JSON, not prose</b></summary>

<br />

<p>A diagnosis has to render as cards, so it cannot come back as a paragraph. The prompt fixes the shape and forbids markdown:</p>

<pre><code>{
  "disease": "…", "confidence": "High" | "Medium" | "Low",
  "description": "…",
  "symptoms":   ["…"],
  "treatment":  ["…"],
  "prevention": ["…"]
}</code></pre>

<p>The weather summary gets the same treatment, with an explicit severity rubric so <i>red</i> means something consistent: green = safe, yellow = caution (heat, light rain, wind, humidity, UV), red = danger (heavy rain, storm, extreme heat or cold, frost, strong winds). Every point is capped at 16 words — a farmer reading on a phone in the sun does not scroll.</p>

</details>

<details>
<summary><b>MSP data is committed, with its source and date</b></summary>

<br />

<p>The MSP table is a TypeScript array, not a fetch:</p>

<pre><code>// Source: DESAGRI, Govt. of India (As on 01.10.2025)
// Kharif: KMS 2025-26 | Rabi: RMS 2026-27 | Commercial: 2025
{ crop: 'Paddy (Common) / धान (सामान्य)', msp: 2369, category: 'Kharif (2025-26)' }</code></pre>

<p>Prices are announced a few times a year, and a farmer checking a number that turns out to be two seasons old is worse than no number. Committing the table with its provenance and effective season makes staleness visible in the source instead of invisible in a cache.</p>

</details>

<details>
<summary><b>Why the AI lives in an Edge Function</b></summary>

<br />

<p>Every AI call needs a key. Putting it in the SPA would publish it. So the client calls a Supabase Edge Function with the user's session, and the function holds the Gemini key, the Open-Meteo URL building, and the CORS headers.</p>

<p>It also means the prompts are server-side: a prompt is a product decision, and a product decision that ships in a bundle is one that can be edited by whoever opens devtools.</p>

</details>

---

<div align="center">

## Project structure

</div>

<pre><code>KrishiLink/
├── src/pages/            # Index · FarmerDashboard · BuyerDashboard · Profile · AuthCallback
├── src/components/       # AIChatModal · CropCard · Header · Footer · auth modals
├── src/data/             # Crops (MSP) · districts · indianStates
├── src/contexts/AuthContext.tsx
├── src/integrations/supabase/
└── supabase/
    ├── functions/ai/      # chat · disease · weather-summary  (Gemini)
    ├── functions/weather/ # Open-Meteo proxy
    └── migrations/        # schema + row-level security</code></pre>

---

<div align="center">

## Run it

</div>

<pre><code>git clone https://github.com/Jivaansh-Yadav/KrishiLink.git
cd KrishiLink
npm install
npm run dev</code></pre>

<p>Needs a Supabase project with the migrations applied and both Edge Functions deployed, plus a <code>GEMINI_API_KEY</code> set as a function secret. Without them the marketplace still browses from local data; only KrishiBot and the weather summary go quiet.</p>

<div align="center">

<sub>Made with <a href="https://github.com/an-Aetheria">an-Aetheria</a>. <b>KrishiLink-old</b> in the same account is the static prototype this grew out of.</sub>

</div>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:04120a,55:0d3520,100:16a34a&height=110&section=footer&reversal=true" alt="" width="100%">
