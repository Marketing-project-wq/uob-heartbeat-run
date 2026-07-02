// ============================================================
//  KONFIGURASI SUPABASE  —  Road to UOB Heartbeat × 20FIT
//  ------------------------------------------------------------
//  Isi `url` dan `anonKey` dari project Supabase kamu untuk
//  MENGAKTIFKAN mode online (auth email OTP + simpan data).
//
//  Biarkan KOSONG  →  app berjalan dalam MODE DEMO
//  (data di localStorage, tanpa backend — cocok untuk file
//   offline / standalone).
//
//  Cara dapat nilainya:
//    Supabase Dashboard → Project Settings → API
//      • Project URL      → url
//      • Project API keys → anon public → anonKey
// ============================================================
window.SUPABASE_CONFIG = {
  url: 'https://cpvzwqptzcxnwzfzgrmt.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwdnp3cXB0emN4bnd6Znpncm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzE0MzksImV4cCI6MjA5MTIwNzQzOX0.DIP-tTFxa3GHMhT6b1Tq-Zz0a24P-vbU9ixEtITbqpI',
};

// ============================================================
//  KONFIGURASI STRAVA  —  satu Client ID untuk SEMUA user.
//  ------------------------------------------------------------
//  clientId = "Client ID" dari aplikasi Strava-mu
//    (strava.com/settings/api). Ini ID APLIKASI, bukan akun
//    pribadi — tiap user nanti login ke Strava masing-masing
//    lewat ID ini, tokennya disimpan per akun.
//
//  Di Strava API settings, set "Authorization Callback Domain"
//  ke domain Railway-mu (mis. heartbeat-run.up.railway.app) —
//  TANPA https:// dan tanpa path.
//
//  Token-exchange (code → token) butuh client_secret → simpan
//  di Supabase Edge Function (lihat STRAVA_SETUP.md), JANGAN
//  di sini.
// ============================================================
window.STRAVA_CONFIG = {
  clientId: '255595',
};

