// ============================================================
//  SUPABASE CLIENT  —  Road to UOB Heartbeat × 20FIT  (skema uob_)
//  ------------------------------------------------------------
//  Membungkus @supabase/supabase-js menjadi API ringkas:
//    window.UZSupa.*   +   window.UZSupaEnabled (bool)
//
//  Aktif HANYA bila:
//    1. supabase-config.js terisi (url + anonKey), DAN
//    2. library @supabase/supabase-js berhasil dimuat (online).
//  Bila tidak → UZSupaEnabled = false → app pakai mode demo
//  (localStorage). File offline tetap berfungsi.
//
//  Login: EMAIL OTP. Tabel: uob_users / uob_activities /
//  uob_stories / uob_leaderboard_daily|season (view).
// ============================================================
(function () {
  var cfg = window.SUPABASE_CONFIG || {};
  var lib = window.supabase; // global UMD dari CDN @supabase/supabase-js
  var enabled = !!(cfg.url && cfg.anonKey && lib && lib.createClient);
  window.UZSupaEnabled = enabled;

  // Alat diagnosa cepat — buka Console browser, ketik:  await UZDiag()
  window.UZDiag = async function () {
    var r = { enabled: !!enabled, hasConfig: !!(cfg.url && cfg.anonKey), hasLib: !!(lib && lib.createClient), url: cfg.url || null };
    try { if (window.UZSupa) { var u = await window.UZSupa.getUser(); r.signedInAs = u ? (u.email || u.id) : null; } } catch (e) { r.userErr = String((e && e.message) || e); }
    try {
      if (window.UZSupaClient) {
        var t = await window.UZSupaClient.from('uob_activities').select('id', { count: 'exact', head: true });
        r.canReadActivities = !t.error; if (t.error) r.readErr = t.error.message;
      }
    } catch (e) { r.readErr = String((e && e.message) || e); }
    console.log('UZDiag', r); return r;
  };

  if (!enabled) { window.UZSupa = null; return; }

  var sb = lib.createClient(cfg.url, cfg.anonKey, {
    auth: {
      persistSession: true, autoRefreshToken: true, detectSessionInUrl: true,
      storage: (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : undefined,
      storageKey: 'uobhb-auth',
    },
  });
  window.UZSupaClient = sb;

  async function currentUser() {
    var r = await sb.auth.getUser();
    return (r && r.data && r.data.user) || null;
  }

  window.UZSupa = {
    // ── Auth (email OTP) ──────────────────────────────────
    // Kirim kode 6 digit ke email. `meta` (nama, telp) ikut
    // tersimpan ke user_metadata → dipakai trigger isi uob_users.
    async sendOtp(email, meta) {
      var data = {};
      if (meta && meta.name) data.full_name = meta.name;
      if (meta && meta.phone) data.phone = meta.phone;
      if (meta && meta.nik != null) data.nik = meta.nik;
      if (meta && meta.gender != null) data.gender = meta.gender;
      var r = await sb.auth.signInWithOtp({
        email: email,
        options: { shouldCreateUser: true, data: data },
      });
      if (r.error) throw r.error;
      return true;
    },
    async verifyOtp(email, token) {
      var r = await sb.auth.verifyOtp({ email: email, token: token, type: 'email' });
      if (r.error) throw r.error;
      return r.data;
    },
    async signOut() { try { await sb.auth.signOut(); } catch (e) {} },
    async getUser() { return currentUser(); },

    // Pastikan ada SESI Supabase aktif sebelum baca/tulis. Kalau belum ada
    // (mis. sesi kedaluwarsa) tapi kita tahu email-nya → sign-in ulang via
    // password turunan supaya data BENAR-BENAR tersimpan ke Supabase.
    async ensureSession(email) {
      try { var u = await currentUser(); if (u) return true; } catch (e) {}
      if (!email) return false;
      try { var r = await this.signInPassword(email); return !!(r && r.ok); } catch (e) { return false; }
    },

    // ── Login TANPA OTP (deteksi akun via password turunan) ────
    // Password deterministik dari email (UX tanpa OTP). Bukan rahasia
    // kuat — disengaja agar user tak perlu mengetik/mengingat password.
    _derivePw(email) {
      var e = (email || '').trim().toLowerCase();
      var b = (typeof btoa === 'function') ? btoa(unescape(encodeURIComponent(e))) : e;
      return 'UOBhb!' + b + '20fit';
    },
    // Coba MASUK. ok=true → akun sudah ada & langsung login (sesi aktif).
    async signInPassword(email) {
      var r = await sb.auth.signInWithPassword({ email: (email || '').trim(), password: this._derivePw(email) });
      return { ok: !r.error, error: r.error || null, data: r.data || null };
    },
    // Kirim OTP HANYA kalau email SUDAH terdaftar (shouldCreateUser:false → tak
    // membuat user baru). Dipakai untuk AKUN LAMA yang belum punya password
    // turunan: mereka cukup LOGIN via OTP sekali (lalu password turunan di-set →
    // login berikutnya tanpa OTP), TIDAK perlu daftar ulang.
    // return: 'sent' (terdaftar, OTP terkirim) | 'notfound' (belum terdaftar).
    async sendOtpIfRegistered(email) {
      try {
        var r = await sb.auth.signInWithOtp({ email: (email || '').trim(), options: { shouldCreateUser: false } });
        return r.error ? 'notfound' : 'sent';
      } catch (e) { return 'notfound'; }
    },
    // DAFTAR akun baru TANPA OTP (langsung login). Dipakai untuk sign-up
    // tanpa friction. needsConfirm=true → "Confirm email" masih ON di Supabase
    // (tak ada sesi) → app jatuh ke OTP sebagai gantinya.
    async signUpPassword(email, meta) {
      var data = {};
      if (meta && meta.name) data.full_name = meta.name;
      if (meta && meta.phone) data.phone = meta.phone;
      if (meta && meta.nik != null) data.nik = meta.nik;
      if (meta && meta.gender != null) data.gender = meta.gender;
      var em = (email || '').trim();
      var r = await sb.auth.signUp({ email: em, password: this._derivePw(em), options: { data: data } });
      if (r.error) {
        // sudah terdaftar → coba sign in biasa
        var si = await sb.auth.signInWithPassword({ email: em, password: this._derivePw(em) });
        if (!si.error && si.data && si.data.session) return { ok: true, needsConfirm: false, data: si.data };
        return { ok: false, needsConfirm: false, error: r.error, data: null };
      }
      if (r.data && r.data.session) return { ok: true, needsConfirm: false, data: r.data };
      // tak ada sesi → confirmation ON
      return { ok: false, needsConfirm: true, data: null };
    },

    // Set password turunan SETELAH verifikasi OTP saat sign up, supaya
    // login berikutnya cukup signInPassword() — TANPA OTP lagi.
    async setDerivedPassword(email) {
      try { await sb.auth.updateUser({ password: this._derivePw(email) }); return true; }
      catch (e) { return false; }
    },

    // ── Profil + Goal (uob_users) ─────────────────────────
    async getProfile() {
      var u = await currentUser(); if (!u) return null;
      var r = await sb.from('uob_users').select('*').eq('id', u.id).maybeSingle();
      return r.data || null;
    },
    async saveProfileBasic(p) {
      var u = await currentUser(); if (!u) return;
      // UPSERT: buat baris uob_users kalau belum ada → user PASTI muncul di
      // leaderboard walau baru daftar (0 km).
      var patch = { id: u.id, updated_at: new Date().toISOString() };
      if (u.email) patch.email = u.email;
      if (p.name != null) patch.full_name = p.name;
      if (p.phone != null) patch.phone = p.phone;
      if (p.team != null) patch.team = p.team;
      if (p.kcp != null) patch.department = p.kcp;   // KCP disimpan di kolom department
      if (p.nik != null) patch.nik = p.nik;          // NIK karyawan
      if (p.gender != null) patch.gender = p.gender; // gender
      var r = await sb.from('uob_users').upsert(patch, { onConflict: 'id' });
      if (r.error) {           // fallback (mis. kolom belum ada) → update baris yang ada
        // Keep nik/gender (and email/full_name) on the fallback UPDATE. ON CONFLICT does
        // not catch NOT NULL violations, so the upsert can fail even when the row exists;
        // dropping nik/gender here is what left profiles perpetually incomplete.
        delete patch.id;
        try { await sb.from('uob_users').update(patch).eq('id', u.id); } catch (e) {}
      }
    },
    async saveGoals(g) {
      var u = await currentUser(); if (!u) return;
      await sb.from('uob_users').update({
        category: g.cat,
        target_km: g.targetKm,
        weekly_target_km: g.weeklyTarget,
        goals_set: true,
        updated_at: new Date().toISOString(),
      }).eq('id', u.id);
    },
    async completeOnboarding() {
      var u = await currentUser(); if (!u) return;
      await sb.from('uob_users').update({ onboarding_completed: true }).eq('id', u.id);
    },

    // ── Koneksi alat (Strava / watch) ─────────────────────
    async setConnection(provider, connected, athleteId) {
      var u = await currentUser(); if (!u) return;
      var patch = { updated_at: new Date().toISOString() };
      if (provider === 'strava') {
        patch.strava_connected = !!connected;
        if (athleteId) patch.strava_athlete_id = String(athleteId);
        if (connected) patch.strava_connected_at = new Date().toISOString();
      } else if (provider === 'garmin') {
        patch.garmin_connected = !!connected;
      }
      await sb.from('uob_users').update(patch).eq('id', u.id);
    },

    // ── Strava OAuth: tukar code → token (lewat Edge Function) ──
    //   Menyimpan token ke uob_users, lalu menarik aktivitas awal.
    async exchangeStravaCode(code) {
      var u = await currentUser(); if (!u) return false;
      var s = await sb.auth.getSession();
      var jwt = s && s.data && s.data.session && s.data.session.access_token;
      var res = await fetch(cfg.url + '/functions/v1/strava-token-exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt, 'apikey': cfg.anonKey },
        body: JSON.stringify({ code: code }),
      });
      var token = await res.json();
      if (!token || !token.access_token) { console.warn('strava exchange', token); return false; }
      await sb.from('uob_users').update({
        strava_athlete_id: token.athlete ? String(token.athlete.id) : null,
        strava_access_token: token.access_token,
        strava_refresh_token: token.refresh_token,
        strava_token_expires_at: token.expires_at,
        strava_connected: true,
        strava_connected_at: new Date().toISOString(),
      }).eq('id', u.id);
      try { await this.syncStravaActivities(token.access_token); } catch (e) {}
      return true;
    },

    // Ambil access token valid; refresh otomatis bila kedaluwarsa.
    async getValidStravaToken() {
      var u = await currentUser(); if (!u) return null;
      var r = await sb.from('uob_users')
        .select('strava_access_token, strava_refresh_token, strava_token_expires_at')
        .eq('id', u.id).maybeSingle();
      var p = r.data; if (!p || !p.strava_access_token) return null;
      if (Date.now() / 1000 < (p.strava_token_expires_at || 0) - 300) return p.strava_access_token;
      // refresh
      var s = await sb.auth.getSession();
      var jwt = s && s.data && s.data.session && s.data.session.access_token;
      var res = await fetch(cfg.url + '/functions/v1/strava-token-exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt, 'apikey': cfg.anonKey },
        body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: p.strava_refresh_token }),
      });
      var nt = await res.json();
      if (!nt || !nt.access_token) return null;
      await sb.from('uob_users').update({
        strava_access_token: nt.access_token,
        strava_refresh_token: nt.refresh_token,
        strava_token_expires_at: nt.expires_at,
      }).eq('id', u.id);
      return nt.access_token;
    },

    // Tarik 30 lari terakhir dari Strava → uob_activities (upsert anti-dobel),
    // lalu hitung ulang total mingguan. Mengembalikan jumlah lari tersinkron.
    async syncStravaActivities(accessToken) {
      var u = await currentUser(); if (!u) return 0;
      var token = accessToken || await this.getValidStravaToken();
      if (!token) return 0;
      var res = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=30&page=1', {
        headers: { Authorization: 'Bearer ' + token },
      });
      var acts = await res.json();
      if (!Array.isArray(acts)) return 0;
      var runs = acts.filter(function (a) { return a.type === 'Run' || a.sport_type === 'Run'; });
      if (!runs.length) return 0;
      var rows = runs.map(function (a) {
        return {
          user_id: u.id,
          external_id: 'strava_' + a.id,
          source: 'strava',
          distance_km: parseFloat((a.distance / 1000).toFixed(2)),
          duration_seconds: a.moving_time || null,
          pace_per_km: a.average_speed > 0 ? parseFloat((1000 / a.average_speed).toFixed(2)) : null,
          heart_rate_avg: a.average_heartrate ? Math.round(a.average_heartrate) : null,
          calories: a.calories || null,
          elevation_gain_m: a.total_elevation_gain || null,
          recorded_at: a.start_date,
        };
      });
      var up = await sb.from('uob_activities').upsert(rows, { onConflict: 'external_id' });
      if (up.error) { console.warn('strava upsert', up.error.message); }
      try { await this.recalcWeeklyTotal(); } catch (e) {}
      return runs.length;
    },

    // Hitung ulang total km minggu ini ke uob_leaderboard (snapshot).
    async recalcWeeklyTotal() {
      var u = await currentUser(); if (!u) return;
      var now = new Date();
      var monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); monday.setHours(0, 0, 0, 0);
      var sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); sunday.setHours(23, 59, 59, 999);
      var r = await sb.from('uob_activities').select('distance_km')
        .eq('user_id', u.id).gte('recorded_at', monday.toISOString()).lte('recorded_at', sunday.toISOString());
      var rows = r.data || [];
      var totalKm = rows.reduce(function (s, a) { return s + Number(a.distance_km); }, 0);
      await sb.from('uob_leaderboard').upsert({
        user_id: u.id,
        week_start: monday.toISOString().split('T')[0],
        week_end: sunday.toISOString().split('T')[0],
        total_km: parseFloat(totalKm.toFixed(2)),
        total_runs: rows.length,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,week_start' });
    },

    // Background sync diam-diam, maksimum 1x per jam (gate via localStorage).
    async silentStravaSync() {
      var u = await currentUser(); if (!u) return 0;
      try {
        var key = 'lastStravaSync_' + u.id;
        var last = parseInt(localStorage.getItem(key) || '0', 10);
        if (Date.now() - last < 60 * 60 * 1000) return 0; // belum 1 jam
        var n = await this.syncStravaActivities();
        try { localStorage.setItem(key, String(Date.now())); } catch (e) {}
        return n;
      } catch (e) { return 0; }
    },

    // ── Catat lari (uob_activities) ───────────────────────
    //   run: { distance_km, duration_seconds?, source?, photo_url? }
    // Upload foto bukti ke Storage (bucket "run-proofs") → kembalikan URL publik.
    async uploadProof(file) {
      var u = await currentUser(); if (!u || !file) return null;
      try {
        var ext = (file.name && file.name.indexOf('.') >= 0) ? file.name.split('.').pop() : (file.type && file.type.split('/')[1]) || 'jpg';
        var path = u.id + '/' + Date.now() + '.' + ext;
        var up = await sb.storage.from('run-proofs').upload(path, file, { upsert: false, contentType: file.type || 'image/jpeg' });
        if (up.error) { console.warn('proof upload', up.error.message); return null; }
        var pub = sb.storage.from('run-proofs').getPublicUrl(path);
        return (pub && pub.data && pub.data.publicUrl) || null;
      } catch (e) { console.warn('proof upload', e && e.message); return null; }
    },

    async insertRun(run) {
      var u = await currentUser(); if (!u) return null;
      var dist = Number(run.distance_km) || 0;
      var dur = run.duration_seconds != null ? Number(run.duration_seconds) : 0;
      var pace = (dur && dist > 0) ? (dur / dist) : null; // disimpan, tak ditampilkan
      var extId = run.external_id || ((run.source || 'manual') + '_' + u.id + '_' + Date.now());
      // UPSERT (anti-dobel via external_id) → sinkron lintas device aman.
      var r = await sb.from('uob_activities').upsert({
        user_id: u.id,
        source: run.source || 'manual',
        distance_km: dist,
        duration_seconds: dur,
        pace_per_km: pace,
        photo_url: run.photo_url || null,
        recorded_at: run.recorded_at || new Date().toISOString(),
        external_id: extId,
      }, { onConflict: 'external_id' }).select().single();
      if (r.error) throw r.error;
      if (r.data && r.data.id && run.proof_valid != null) {
        try {
          await sb.from('uob_activities').update({
            proof_valid: !!run.proof_valid,
            proof_status: run.proof_valid ? 'auto_verified' : 'needs_review',
          }).eq('id', r.data.id);
        } catch (e) {}
      }
      try { await this.recalcWeeklyTotal(); } catch (e) {}
      return r.data;
    },

    // Dorong lari yang hanya ada di LOKAL (mis. penulisan ke Supabase sempat
    // gagal) ke Supabase via upsert — anti-dobel. Dipakai saat rekonsiliasi
    // supaya semua device melihat data yang SAMA (sumber kebenaran = Supabase).
    async pushRuns(localRuns) {
      var u = await currentUser(); if (!u || !localRuns || !localRuns.length) return 0;
      var rows = localRuns.filter(function (x) { return x && x.external_id; }).map(function (x) {
        var dist = Number(x.km) || 0; var dur = x.mins ? Math.round(x.mins * 60) : 0;
        return {
          user_id: u.id, source: x.source || 'manual', distance_km: dist, duration_seconds: dur,
          pace_per_km: (dur && dist > 0) ? (dur / dist) : null, photo_url: x.photo_url || null,
          recorded_at: x.recordedAt || new Date().toISOString(), external_id: x.external_id,
        };
      });
      if (!rows.length) return 0;
      var up = await sb.from('uob_activities').upsert(rows, { onConflict: 'external_id' });
      if (up.error) { console.warn('pushRuns', up.error.message); return 0; }
      try { await this.recalcWeeklyTotal(); } catch (e) {}
      return rows.length;
    },
    // ── Validasi bukti lari (AI vision via Edge Function) ─────
    //   Mengirim foto → diklasifikasi: jam digital / screenshot health
    //   app berisi km = valid; selfie/lainnya = invalid (+alasan).
    //   serviceError=true → layanan error (app fail-open: terima, review manual).
    async validateRunProof(imageDataUrl, km) {
      try {
        var s = await sb.auth.getSession();
        var jwt = s && s.data && s.data.session && s.data.session.access_token;
        var res = await fetch(cfg.url + '/functions/v1/validate-run-proof', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (jwt || cfg.anonKey), 'apikey': cfg.anonKey },
          body: JSON.stringify({ image: imageDataUrl, km: km }),
        });
        if (!res.ok) return { valid: false, serviceError: true, reason: '' };
        var j = await res.json();
        if (j && j.error) return { valid: false, serviceError: true, reason: '' };
        return { valid: !!(j && j.valid), reason: (j && j.reason) || '' };
      } catch (e) { return { valid: false, serviceError: true, reason: '' }; }
    },

    async myRuns(limit) {
      var u = await currentUser(); if (!u) return [];
      var r = await sb.from('uob_activities').select('*')
        .eq('user_id', u.id).order('recorded_at', { ascending: false }).limit(limit || 30);
      if (r.error) throw r.error;   // baca GAGAL → lempar (beda dari "kosong tapi sukses")
      return r.data || [];
    },

    // ── Story (uob_stories) ───────────────────────────────
    async insertStory(s) {
      var u = await currentUser(); if (!u) return null;
      var r = await sb.from('uob_stories').insert({
        user_id: u.id,
        activity_id: s.activity_id || null,
        photo_url: s.photo_url || null,
        caption: s.caption || null,
      }).select().single();
      if (r.error) throw r.error;
      if (s.activity_id) {
        await sb.from('uob_activities').update({ added_to_story: true, story_caption: s.caption || null }).eq('id', s.activity_id);
      }
      return r.data;
    },
    async getStories(limit) {
      var r = await sb.from('uob_stories')
        .select('id, photo_url, caption, reaction_count, created_at, expires_at, uob_users ( full_name, avatar_url, team ), uob_activities ( distance_km, duration_seconds )')
        .eq('is_active', true).gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false }).limit(limit || 20);
      return r.data || [];
    },
    async reactToStory(storyId, emoji) {
      var u = await currentUser(); if (!u) return;
      await sb.from('uob_story_reactions').upsert(
        { story_id: storyId, user_id: u.id, emoji: emoji || '❤️' },
        { onConflict: 'story_id,user_id' }
      );
      try { await sb.rpc('increment_reaction_count', { story_id: storyId }); } catch (e) {}
    },

    // ── Race event (hari menuju race day) ─────────────────
    async activeEvent() {
      var r = await sb.from('uob_race_events').select('*').eq('is_active', true)
        .order('race_date', { ascending: true }).limit(1).maybeSingle();
      return r.data || null;
    },

    // ── Leaderboard (view) ────────────────────────────────
    // Diurutkan dari jarak terbesar (bukan kolom rank view yang bisa salah),
    // supaya limit 100 mengambil pelari teratas yang benar.
    // Daftar KCP yang sudah ada (untuk saran/autocomplete saat ketik KCP),
    // supaya orang memilih ejaan yang konsisten. Pakai RPC publik (bisa
    // diakses sebelum login); fallback ke tabel kalau sudah login.
    async listKcps() {
      try {
        var r = await sb.rpc('uob_kcp_list');
        if (!r.error && Array.isArray(r.data)) {
          var out = r.data.map(function (x) { return (x && (x.kcp || x.department)) || x; }).filter(Boolean);
          if (out.length) return Array.from(new Set(out));
        }
      } catch (e) {}
      try {
        var u = await sb.from('uob_users').select('department').not('department', 'is', null).limit(1000);
        if (!u.error) return Array.from(new Set((u.data || []).map(function (x) { return x.department; }).filter(Boolean)));
      } catch (e) {}
      return [];
    },

    async leaderboardDaily() {
      var r = await sb.from('uob_leaderboard_daily').select('*').order('km_today', { ascending: false }).limit(100);
      if (r.error) { r = await sb.from('uob_leaderboard_daily').select('*').limit(100); }
      return r.data || [];
    },
    async leaderboardSeason() {
      var r = await sb.from('uob_leaderboard_season').select('*').order('total_km', { ascending: false }).limit(100);
      if (r.error) { r = await sb.from('uob_leaderboard_season').select('*').limit(100); }
      return r.data || [];
    },
    // Peta gender per user_id → buat filter leaderboard per gender.
    async genderMap() {
      var r = await sb.from('uob_users').select('id, gender').limit(5000);
      var m = {};
      (r.data || []).forEach(function (x) { if (x && x.id) m[x.id] = x.gender || ''; });
      return m;
    },
    async nikMap() {
      var r = await sb.from('uob_users').select('id, nik').limit(5000);
      var m = {};
      (r.data || []).forEach(function (x) { if (x && x.id) m[x.id] = x.nik || ''; });
      return m;
    },

    // ── TEAM (boleh ikut BANYAK tim) ──────────────────────────
    async createTeam(name) {
      var u = await currentUser(); if (!u || !name) return null;
      var code = (String(name).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'team') + Math.random().toString(36).slice(2, 6);
      var r = await sb.from('uob_teams').insert({ name: String(name).trim(), owner_id: u.id, invite_code: code }).select().single();
      if (r.error) { console.warn('createTeam', r.error.message); return null; }
      await sb.from('uob_team_members').upsert({ team_id: r.data.id, user_id: u.id, status: 'joined' }, { onConflict: 'team_id,user_id' });
      return r.data; // { id, name, invite_code, owner_id }
    },
    // SEMUA tim yang saya ikuti (boleh lebih dari satu).
    async myTeams() {
      var u = await currentUser(); if (!u) return [];
      var r = await sb.from('uob_team_members').select('uob_teams ( id, name, invite_code, owner_id )').eq('user_id', u.id).eq('status', 'joined');
      return (r.data || []).map(function (x) { return x.uob_teams; }).filter(Boolean);
    },
    async teamByCode(code) {
      if (!code) return null;
      try { var r = await sb.rpc('uob_team_by_code', { p_code: code }); if (!r.error && r.data && r.data.length) return r.data[0]; } catch (e) {}
      var d = await sb.from('uob_teams').select('id, name').eq('invite_code', code).maybeSingle();
      return d.data || null;
    },
    async joinTeamByCode(code) {
      var u = await currentUser(); if (!u) return null;
      var t = await this.teamByCode(code); if (!t) return null;
      var up = await sb.from('uob_team_members').upsert({ team_id: t.id, user_id: u.id, status: 'joined' }, { onConflict: 'team_id,user_id' });
      if (up.error) { console.warn('joinTeam', up.error.message); return null; }
      return t;
    },
    // user_id anggota suatu tim TERTENTU (untuk leaderboard My Team).
    async teamMemberIds(teamId) {
      if (!teamId) return [];
      var r = await sb.from('uob_team_members').select('user_id').eq('team_id', teamId).eq('status', 'joined');
      return (r.data || []).map(function (x) { return x.user_id; });
    },
    async renameTeam(teamId, name) {
      var r = await sb.from('uob_teams').update({ name: String(name).trim() }).eq('id', teamId).select();
      return { ok: !r.error && r.data && r.data.length > 0, error: r.error && r.error.message };
    },
    async deleteTeam(teamId) {
      var r = await sb.from('uob_teams').delete().eq('id', teamId).select();
      return { ok: !r.error && r.data && r.data.length > 0, error: r.error && r.error.message };
    },
    async leaveTeam(teamId) {
      var u = await currentUser(); if (!u) return { ok: false };
      var r = await sb.from('uob_team_members').delete().eq('team_id', teamId).eq('user_id', u.id).select();
      return { ok: !r.error };
    },
    // Upload foto profil → bucket "avatars" → simpan avatar_url di uob_users.
    async uploadAvatar(file) {
      var u = await currentUser(); if (!u || !file) return null;
      try {
        var ext = (file.name && file.name.indexOf('.') >= 0) ? file.name.split('.').pop() : (file.type && file.type.split('/')[1]) || 'jpg';
        var path = u.id + '/' + Date.now() + '.' + ext;
        var up = await sb.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
        if (up.error) { console.warn('avatar', up.error.message); return null; }
        var pub = sb.storage.from('avatars').getPublicUrl(path);
        var url = (pub && pub.data && pub.data.publicUrl) || null;
        if (url) { try { await sb.from('uob_users').update({ avatar_url: url }).eq('id', u.id); } catch (e) {} }
        return url;
      } catch (e) { console.warn('avatar', e && e.message); return null; }
    },
  };
})();
