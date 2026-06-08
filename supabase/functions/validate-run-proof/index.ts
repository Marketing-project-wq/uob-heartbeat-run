// ============================================================
//  Edge Function: validate-run-proof
//  Road to UOB Heartbeat Run × 20FIT
//  ------------------------------------------------------------
//  Menerima foto bukti lari, mengirim ke Claude (vision), dan
//  memutuskan VALID/INVALID:
//    VALID  = foto jam digital / smartwatch ATAU screenshot
//             aplikasi lari/health yang JELAS menampilkan jarak
//             lari dalam kilometer (km).
//    INVALID= selfie / wajah / foto acak / screenshot non-lari /
//             tidak ada jarak km yang terlihat.
//
//  Request  (POST, JSON): { image: "data:image/...;base64,....", km?: number }
//  Response (JSON):       { valid: boolean, reason: string }
//
//  SECRET yang dibutuhkan (set sekali):
//    supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
//  Deploy:
//    supabase functions deploy validate-run-proof
// ============================================================

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const MODEL = Deno.env.get("ANTHROPIC_MODEL") || "claude-haiku-4-5-20251001";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  if (!ANTHROPIC_API_KEY) return json({ error: "missing_api_key" }, 500);

  let payload: { image?: string; km?: number };
  try { payload = await req.json(); } catch { return json({ error: "bad_json" }, 400); }

  const image = (payload?.image || "").trim();
  const km = payload?.km;
  if (!image.startsWith("data:image/")) return json({ error: "no_image" }, 400);

  // Pisah media type + base64 dari data URL.
  const m = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) return json({ error: "bad_image" }, 400);
  let mediaType = m[1];
  const b64 = m[2];
  // Anthropic mendukung png/jpeg/webp/gif.
  if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(mediaType)) {
    mediaType = "image/jpeg";
  }

  const prompt =
    "You verify 'run proof' photos for a running challenge. " +
    "A photo is VALID only if BOTH are true: (1) it is a photo of a digital watch / " +
    "smartwatch / fitness-watch screen, OR a screenshot from a running/health app " +
    "(Strava, Apple Health/Fitness, Google Fit, Garmin, Nike Run, etc.); AND (2) it " +
    "clearly shows a running or walking DISTANCE in kilometers (km). " +
    "It is INVALID if it is a selfie, a person's face, a random photo, a non-fitness " +
    "screenshot, or if no running distance in km is visible. " +
    (typeof km === "number" ? ("The user typed " + km + " km. ") : "") +
    "Respond with ONLY minified JSON, no markdown, exactly: " +
    '{"valid": true|false, "reason": "<one short sentence in English describing what you see>"}.';

  let aiText = "";
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
            { type: "text", text: prompt },
          ],
        }],
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("anthropic_error", r.status, t);
      return json({ error: "ai_error" }, 502);
    }
    const data = await r.json();
    aiText = (data?.content?.[0]?.text || "").trim();
  } catch (e) {
    console.error("fetch_error", String(e));
    return json({ error: "ai_unreachable" }, 502);
  }

  // Ambil JSON dari jawaban model (kalau ada teks tambahan).
  let parsed: { valid?: boolean; reason?: string } = {};
  try {
    const jstart = aiText.indexOf("{");
    const jend = aiText.lastIndexOf("}");
    parsed = JSON.parse(jstart >= 0 ? aiText.slice(jstart, jend + 1) : aiText);
  } catch {
    // Fallback konservatif: kalau tak bisa di-parse → anggap tak valid dengan alasan netral.
    return json({ valid: false, reason: "Could not read the photo clearly. Please upload a clear watch photo or health-app screenshot showing your distance in km." });
  }

  return json({
    valid: !!parsed.valid,
    reason: parsed.reason || (parsed.valid ? "" : "This photo doesn't look like a digital watch or a health-app screenshot showing your running distance."),
  });
});
