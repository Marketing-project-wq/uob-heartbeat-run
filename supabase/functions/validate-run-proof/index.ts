// ============================================================
//  Edge Function: validate-run-proof  (v2 — OCR + cocokkan KM)
//  Road to UOB Heartbeat Run × 20FIT
//  ------------------------------------------------------------
//  Menerima foto bukti lari + KM yang DIINPUT user, lalu memakai
//  Claude (vision) untuk MEMBACA angka jarak (km) dari foto dan
//  MENCOCOKKAN dengan input. Keputusan otomatis:
//
//    valid         = foto memang bukti lari (jam/smartwatch/app
//                    lari) DAN angka km terbaca DAN selisih dengan
//                    input <= toleransi (default 0.5 km).
//    invalid       = bukan foto bukti lari, ATAU angka km terbaca
//                    tapi selisihnya di luar toleransi (mismatch).
//    needs_review  = foto bukti lari tapi angka km TIDAK terbaca
//                    jelas (blur/terpotong) → fail-safe, ditahan
//                    untuk ditinjau, TIDAK langsung ditolak.
//
//  Request  (POST, JSON): { image: "data:image/...;base64,....", km: number }
//  Response (JSON):
//    {
//      valid: boolean,                 // true hanya jika status === 'valid'
//      status: 'valid'|'invalid'|'needs_review',
//      km_detected: number|null,       // angka km yang dibaca AI (null = tak terbaca)
//      delta: number|null,             // |km_detected - km_input|
//      tolerance: number,              // toleransi km yang dipakai
//      reason: string                  // penjelasan singkat (EN)
//    }
//  Bila AI error / tak terjangkau → HTTP 5xx / { error } → app
//  fail-open (terima, tandai needs_review).
//
//  SECRET yang dibutuhkan (set sekali):
//    supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//    (opsional) supabase secrets set VALIDATE_TOLERANCE_KM=0.5
//    (opsional) supabase secrets set ANTHROPIC_MODEL=claude-haiku-4-5-20251001
//
//  Deploy:
//    supabase functions deploy validate-run-proof
// ============================================================

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const MODEL = Deno.env.get("ANTHROPIC_MODEL") || "claude-haiku-4-5-20251001";
const TOLERANCE_KM = (() => {
  const v = parseFloat(Deno.env.get("VALIDATE_TOLERANCE_KM") || "0.5");
  return Number.isFinite(v) && v >= 0 ? v : 0.5;
})();

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
  const kmInput = typeof payload?.km === "number" && isFinite(payload.km) ? payload.km : null;
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
    "You verify 'run proof' photos for a running challenge and you READ the distance shown. " +
    "A valid proof is a photo of a digital watch / smartwatch / fitness-watch screen, OR a " +
    "screenshot from a running/health app (Strava, Apple Health/Fitness, Google Fit, Garmin, " +
    "Nike Run, etc.) that shows a running or walking DISTANCE. " +
    (kmInput !== null ? ("The user typed " + kmInput + " km for this run. ") : "") +
    "Look carefully at the photo and extract the total distance value that is displayed. " +
    "If the distance is shown in miles, convert it to kilometers (1 mile = 1.60934 km). " +
    "Respond with ONLY minified JSON, no markdown, exactly this shape: " +
    '{"is_run_proof": true|false, "km_detected": <number or null>, "reason": "<one short sentence in English describing what you see and the distance you read>"}. ' +
    "Rules: set is_run_proof=false for selfies, faces, random photos, or non-fitness screenshots. " +
    "Set km_detected to the numeric distance in km you can clearly read (e.g. 5.2). " +
    "Set km_detected to null ONLY if you truly cannot read any distance number (blurry/cropped).";

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
        max_tokens: 250,
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
  let parsed: { is_run_proof?: boolean; km_detected?: number | null; reason?: string } = {};
  try {
    const jstart = aiText.indexOf("{");
    const jend = aiText.lastIndexOf("}");
    parsed = JSON.parse(jstart >= 0 ? aiText.slice(jstart, jend + 1) : aiText);
  } catch {
    // Tak bisa di-parse → tahan untuk ditinjau (jangan tolak user jujur).
    return json({
      valid: false,
      status: "needs_review",
      km_detected: null,
      delta: null,
      tolerance: TOLERANCE_KM,
      reason: "Could not read the photo clearly. It will be reviewed. Please upload a sharp watch photo or health-app screenshot showing your distance in km.",
    });
  }

  const isProof = !!parsed.is_run_proof;
  const kmDetected =
    typeof parsed.km_detected === "number" && isFinite(parsed.km_detected)
      ? Math.round(parsed.km_detected * 100) / 100
      : null;

  // Bukan bukti lari sama sekali → invalid.
  if (!isProof) {
    return json({
      valid: false,
      status: "invalid",
      km_detected: kmDetected,
      delta: null,
      tolerance: TOLERANCE_KM,
      reason: parsed.reason ||
        "This photo doesn't look like a digital watch or a health-app screenshot showing your running distance.",
    });
  }

  // Bukti lari tapi angka tak terbaca → tahan untuk ditinjau (fail-safe).
  if (kmDetected === null) {
    return json({
      valid: false,
      status: "needs_review",
      km_detected: null,
      delta: null,
      tolerance: TOLERANCE_KM,
      reason: parsed.reason ||
        "Looks like a run proof, but the distance number wasn't readable. It will be reviewed.",
    });
  }

  // Tak ada input km untuk dibandingkan → tahan untuk ditinjau.
  if (kmInput === null) {
    return json({
      valid: false,
      status: "needs_review",
      km_detected: kmDetected,
      delta: null,
      tolerance: TOLERANCE_KM,
      reason: parsed.reason || ("Detected " + kmDetected + " km from the photo."),
    });
  }

  // Bandingkan angka foto vs input dengan toleransi.
  const delta = Math.round(Math.abs(kmDetected - kmInput) * 100) / 100;
  const within = delta <= TOLERANCE_KM;

  return json({
    valid: within,
    status: within ? "valid" : "invalid",
    km_detected: kmDetected,
    delta: delta,
    tolerance: TOLERANCE_KM,
    reason: within
      ? ("Photo shows " + kmDetected + " km, matches your " + kmInput + " km.")
      : ("Photo shows " + kmDetected + " km but you typed " + kmInput + " km (off by " + delta + " km)."),
  });
});
