// ============================================================
//  Edge Function: revalidate-run-proofs  (BACKFILL, sekali pakai)
//  Road to UOB Heartbeat Run × 20FIT
//  ------------------------------------------------------------
//  Memvalidasi ulang foto bukti lari LAMA yang belum terverifikasi
//  (proof_status null / 'needs_review') memakai Claude vision:
//  baca angka km dari foto → cocokkan dengan distance_km → set
//  proof_valid/proof_status + tulis jejak ke uob_run_validations
//  (method 'ai_batch'). TIDAK mengubah distance_km / photo_url.
//
//  Dipanggil berulang oleh pg_cron (chunk kecil/panggilan) sampai
//  habis. Dilindungi JOB_TOKEN (fungsi ini verify_jwt=false).
//
//  Body (POST JSON): { token, limit?, debug? }
//  Response: { ok, processed, valid, invalid, review, remaining, ... }
//
//  Env: ANTHROPIC_API_KEY (wajib), ANTHROPIC_MODEL, VALIDATE_TOLERANCE_KM,
//       SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY (otomatis).
//  Hapus fungsi ini setelah backfill selesai.
// ============================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const MODEL = Deno.env.get("ANTHROPIC_MODEL") || "claude-haiku-4-5-20251001";
const TOLERANCE_KM = (() => {
  const v = parseFloat(Deno.env.get("VALIDATE_TOLERANCE_KM") || "0.5");
  return Number.isFinite(v) && v >= 0 ? v : 0.5;
})();

// Token bersama (fungsi ini tak publik-terbaca). Ganti kalau perlu.
const JOB_TOKEN = "uob-revalidate-6Kp2sV9wQ4bT1nZ";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function toBase64(buf: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

async function rest(path: string, init: RequestInit = {}) {
  const r = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: "Bearer " + SERVICE_KEY,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  return r;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: { token?: string; limit?: number; debug?: boolean };
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  if (body?.token !== JOB_TOKEN) return json({ error: "unauthorized" }, 401);
  if (!ANTHROPIC_API_KEY) return json({ error: "missing_api_key" }, 500);
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "missing_service_env" }, 500);

  const limit = Math.min(Math.max(parseInt(String(body?.limit ?? 15), 10) || 15, 1), 40);
  const debug = !!body?.debug;
  const t0 = Date.now();

  // Ambil rows yang belum tervalidasi (punya foto, status null/needs_review).
  const sel = await rest(
    "uob_activities?select=id,user_id,distance_km,photo_url" +
    "&photo_url=not.is.null&or=(proof_status.is.null,proof_status.eq.needs_review)" +
    "&order=recorded_at.desc&limit=" + limit,
  );
  if (!sel.ok) return json({ error: "select_failed", detail: (await sel.text()).slice(0, 300) }, 500);
  const rows: Array<{ id: string; user_id: string; distance_km: number; photo_url: string }> = await sel.json();

  let processed = 0, valid = 0, invalid = 0, review = 0;

  for (const row of rows) {
    const kmInput = Number(row.distance_km) || 0;

    // 1) Tarik foto → base64.
    let mediaType = "image/jpeg"; let b64 = "";
    try {
      const img = await fetch(row.photo_url);
      if (!img.ok) throw new Error("img_" + img.status);
      const ct = img.headers.get("content-type") || "";
      if (["image/png", "image/jpeg", "image/webp", "image/gif"].includes(ct)) mediaType = ct;
      b64 = toBase64(new Uint8Array(await img.arrayBuffer()));
    } catch (_e) {
      // Foto tak bisa diambil → tandai review manual (terminal) supaya tak diulang.
      await mark(row, false, "review_manual", null, null, "Batch: proof photo could not be fetched.");
      processed++; review++; continue;
    }

    // 2) Panggil Claude vision.
    const prompt =
      "You verify 'run proof' photos for a running challenge and you READ the distance shown. " +
      "A valid proof is a photo of a digital watch / smartwatch / fitness-watch screen, OR a " +
      "screenshot from a running/health app (Strava, Apple Health/Fitness, Google Fit, Garmin, " +
      "Nike Run, etc.) that shows a running or walking DISTANCE. " +
      "The user typed " + kmInput + " km for this run. " +
      "Look carefully and extract the total distance displayed. If shown in miles, convert to km " +
      "(1 mile = 1.60934 km). Respond with ONLY minified JSON, no markdown, exactly: " +
      '{"is_run_proof": true|false, "km_detected": <number or null>, "reason": "<one short sentence>"}. ' +
      "is_run_proof=false for selfies/faces/random/non-fitness screenshots. km_detected=null only if truly unreadable.";

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
        // Kegagalan AI kemungkinan sistemik (key/model/limit) → ABORT batch,
        // laporkan detail supaya bisa didiagnosa TANPA logs. Baris ini tak ditandai.
        const detail = (await r.text()).slice(0, 400);
        return json({
          ok: false, error: "ai_error", anthropic_status: r.status, anthropic_detail: detail,
          model: MODEL, processed, valid, invalid, review,
        }, 200);
      }
      const data = await r.json();
      aiText = (data?.content?.[0]?.text || "").trim();
    } catch (e) {
      return json({ ok: false, error: "ai_unreachable", detail: String(e), processed, valid, invalid, review }, 200);
    }

    // 3) Parse + putuskan.
    let parsed: { is_run_proof?: boolean; km_detected?: number | null; reason?: string } = {};
    try {
      const a = aiText.indexOf("{"), b = aiText.lastIndexOf("}");
      parsed = JSON.parse(a >= 0 ? aiText.slice(a, b + 1) : aiText);
    } catch {
      await mark(row, false, "review_manual", null, null, "Batch: AI response unreadable.");
      processed++; review++; continue;
    }

    const isProof = !!parsed.is_run_proof;
    const kmDet = (typeof parsed.km_detected === "number" && isFinite(parsed.km_detected))
      ? Math.round(parsed.km_detected * 100) / 100 : null;

    if (!isProof) {
      await mark(row, false, "invalid", kmDet, null, parsed.reason || "Not a run-proof photo.");
      processed++; invalid++; continue;
    }
    if (kmDet === null) {
      await mark(row, false, "review_manual", null, null, parsed.reason || "Run proof but distance unreadable.");
      processed++; review++; continue;
    }
    const delta = Math.round(Math.abs(kmDet - kmInput) * 100) / 100;
    if (delta <= TOLERANCE_KM) {
      await mark(row, true, "auto_verified", kmDet, delta, "Batch: photo " + kmDet + " km matches " + kmInput + " km.");
      processed++; valid++;
    } else {
      await mark(row, false, "invalid", kmDet, delta, "Batch: photo " + kmDet + " km vs typed " + kmInput + " km (off " + delta + ").");
      processed++; invalid++;
    }
  }

  // Sisa yang belum tervalidasi.
  let remaining: number | null = null;
  try {
    const c = await rest(
      "uob_activities?select=id&photo_url=not.is.null&or=(proof_status.is.null,proof_status.eq.needs_review)",
      { method: "HEAD", headers: { Prefer: "count=exact" } },
    );
    const cr = c.headers.get("content-range") || "";
    const total = cr.split("/")[1];
    remaining = total ? parseInt(total, 10) : null;
  } catch (_e) { /* ignore */ }

  return json({ ok: true, processed, valid, invalid, review, remaining, took_ms: Date.now() - t0, debug });

  // Helper: update status terkini + tulis jejak audit (tak menimpa input asli).
  async function mark(
    row: { id: string; user_id: string; distance_km: number },
    proofValid: boolean, status: string,
    kmDet: number | null, delta: number | null, reason: string,
  ) {
    try {
      await rest("uob_activities?id=eq." + row.id, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ proof_valid: proofValid, proof_status: status, updated_at: new Date().toISOString() }),
      });
      // status jejak: valid/invalid/needs_review (review_manual dicatat sbg needs_review di audit)
      const auditStatus = proofValid ? "valid" : (status === "invalid" ? "invalid" : "needs_review");
      await rest("uob_run_validations", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          activity_id: row.id, user_id: row.user_id,
          km_input: row.distance_km, km_detected: kmDet, delta_km: delta,
          tolerance_km: TOLERANCE_KM, status: auditStatus, method: "ai_batch",
          reason: reason, validated_by: "ai_batch",
        }),
      });
    } catch (_e) { /* per-row best effort */ }
  }
});
