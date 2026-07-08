// ============================================================
//  Edge Function: uob-signup
//  Road to UOB Heartbeat Run × 20FIT
//  ------------------------------------------------------------
//  Membuat akun UOB Heartbeat Run TANPA mengirim email APA PUN dan
//  TANPA harus mematikan "Confirm email" di level project.
//
//  KENAPA: project Supabase ini ("20FIT ALL DATA") dipakai BERSAMA
//  beberapa produk. Mematikan "Confirm email" akan mempengaruhi SEMUA
//  produk itu. Maka akun UOB dibuat lewat admin API dengan
//  email_confirm:true → user langsung terkonfirmasi, tidak ada email
//  konfirmasi terkirim, dan sesi bisa langsung dibuat lewat password
//  turunan. Produk lain di project ini TIDAK terpengaruh.
//
//  Password turunan dihitung dengan rumus yang SAMA PERSIS dengan
//  client (UZSupa._derivePw) supaya signInPassword() setelahnya cocok.
//
//  Request  (POST, JSON): { email, name?, phone?, nik?, gender? }
//  Response (JSON):       { ok: boolean, error?: string }
//
//  Tidak butuh secret tambahan — SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY
//  otomatis tersedia di runtime Edge Function.
//
//  Deploy:
//    supabase functions deploy uob-signup
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// HARUS identik dengan UZSupa._derivePw di client:
//   'UOBhb!' + btoa(unescape(encodeURIComponent(email.trim().toLowerCase()))) + '20fit'
function derivePw(email: string): string {
  const e = (email ?? "").trim().toLowerCase();
  const bytes = new TextEncoder().encode(e); // UTF-8 bytes
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return "UOBhb!" + btoa(bin) + "20fit";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  let payload: { email?: string; name?: string; phone?: string; nik?: string; gender?: string };
  try { payload = await req.json(); } catch { return json({ ok: false, error: "bad_json" }, 400); }

  const email = (payload?.email || "").trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return json({ ok: false, error: "invalid_email" }, 400);

  const url = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !serviceKey) return json({ ok: false, error: "missing_service_config" }, 500);

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const meta: Record<string, unknown> = {};
  if (payload.name) meta.full_name = payload.name;
  if (payload.phone) meta.phone = payload.phone;
  if (payload.nik != null) meta.nik = payload.nik;
  if (payload.gender != null) meta.gender = payload.gender;

  const { error } = await admin.auth.admin.createUser({
    email,
    password: derivePw(email),
    email_confirm: true, // pre-konfirmasi → TIDAK ada email terkirim, sesi bisa langsung dibuat
    user_metadata: meta,
  });

  // Sudah terdaftar → anggap sukses; client tinggal signInPassword pakai password turunan.
  if (error && !/already|exist|registered|duplicate/i.test(error.message || "")) {
    console.error("createUser_error", error.message);
    return json({ ok: false, error: "create_failed" });
  }

  return json({ ok: true });
});
