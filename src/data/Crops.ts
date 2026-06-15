// Minimum Support Price (MSP) — ₹ per quintal
// Source: DESAGRI, Govt. of India (As on 01.10.2025)
// Kharif: KMS 2025-26 | Rabi: RMS 2026-27 | Commercial: 2025

export const mspRates = [
  // ── Kharif Crops (KMS 2025-26) ──────────────────────────────────────────
  { crop: 'Paddy (Common) / धान (सामान्य)',       msp: 2369,  category: 'Kharif (2025-26)' },
  { crop: 'Paddy (Grade A) / धान (ग्रेड ए)',      msp: 2389,  category: 'Kharif (2025-26)' },
  { crop: 'Jowar (Hybrid) / ज्वार (हाइब्रिड)',    msp: 3699,  category: 'Kharif (2025-26)' },
  { crop: 'Jowar (Maldandi) / ज्वार (मालदंडी)',   msp: 3749,  category: 'Kharif (2025-26)' },
  { crop: 'Bajra / बाजरा',                         msp: 2775,  category: 'Kharif (2025-26)' },
  { crop: 'Ragi / रागी',                           msp: 4886,  category: 'Kharif (2025-26)' },
  { crop: 'Maize / मक्का',                         msp: 2400,  category: 'Kharif (2025-26)' },
  { crop: 'Tur (Arhar) / तुअर (अरहर)',             msp: 8000,  category: 'Kharif (2025-26)' },
  { crop: 'Moong / मूंग',                          msp: 8768,  category: 'Kharif (2025-26)' },
  { crop: 'Urad / उड़द',                           msp: 7800,  category: 'Kharif (2025-26)' },
  { crop: 'Groundnut / मूंगफली',                   msp: 7263,  category: 'Kharif (2025-26)' },
  { crop: 'Sunflower Seed / सूरजमुखी बीज',         msp: 7721,  category: 'Kharif (2025-26)' },
  { crop: 'Soyabean (Yellow) / सोयाबीन (पीला)',   msp: 5328,  category: 'Kharif (2025-26)' },
  { crop: 'Sesamum / तिल',                         msp: 9846,  category: 'Kharif (2025-26)' },
  { crop: 'Nigerseed / रामतिल',                    msp: 9537,  category: 'Kharif (2025-26)' },
  { crop: 'Cotton (Medium) / कपास (मध्यम रेशा)',  msp: 7710,  category: 'Kharif (2025-26)' },
  { crop: 'Cotton (Long) / कपास (लंबा रेशा)',     msp: 8110,  category: 'Kharif (2025-26)' },

  // ── Rabi Crops (RMS 2026-27) ─────────────────────────────────────────────
  { crop: 'Wheat / गेहूं',                         msp: 2585,  category: 'Rabi (2026-27)' },
  { crop: 'Barley / जौ',                           msp: 2150,  category: 'Rabi (2026-27)' },
  { crop: 'Gram / चना',                            msp: 5875,  category: 'Rabi (2026-27)' },
  { crop: 'Masur (Lentil) / मसूर',                 msp: 7000,  category: 'Rabi (2026-27)' },
  { crop: 'Rapeseed & Mustard / सरसों व तोरिया',  msp: 6200,  category: 'Rabi (2026-27)' },
  { crop: 'Safflower / कुसुम',                     msp: 6540,  category: 'Rabi (2026-27)' },

  // ── Commercial Crops (2025) ──────────────────────────────────────────────
  { crop: 'Copra (Milling) / खोपरा (मिलिंग)',     msp: 11582, category: 'Commercial (2025)' },
  { crop: 'Copra (Ball) / खोपरा (बॉल)',           msp: 12100, category: 'Commercial (2025)' },
  { crop: 'Jute / जूट',                            msp: 5650,  category: 'Commercial (2025)' },
  { crop: 'Sugarcane / गन्ना',                     msp: 3400,  category: 'Commercial (2025)' }, // FRP 2025-26

  // ── Vegetables — Market Intervention Scheme (MIS) ────────────────────────
  { crop: 'Tomato / टमाटर',                        msp: 600,   category: 'Vegetable (MIS)' },
  { crop: 'Onion / प्याज',                         msp: 800,   category: 'Vegetable (MIS)' },
  { crop: 'Potato / आलू',                          msp: 500,   category: 'Vegetable (MIS)' },
];

export const cropTypes = [
  'Cereals',
  'Pulses',
  'Oilseeds',
  'Vegetables',
  'Fruits',
  'Spices',
  'Commercial Crops',
  'Fibers',
  'Other',
];