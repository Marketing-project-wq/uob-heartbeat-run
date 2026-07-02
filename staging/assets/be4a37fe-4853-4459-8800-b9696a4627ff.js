// app-web.jsx — Road to UOB Heartbeat Run, responsive WEB shell (desktop + mobile)
const { Icon: WIcon, Avatar: WAvatar, fmt: WFmt } = window;
const { HomeScreen, ProgressScreen, LeaderboardScreen, LogSheet, OnboardingGate } = window;
const { useTweaks, TweaksPanel, TweakSection, TweakColor, TweakText, TweakNumber, TweakRadio, TweakToggle } = window;

const W_DEFAULTS = /*EDITMODE-BEGIN*/{
  "raceName": "UOB Heartbeat Run",
  "raceISO": "2026-08-29",
  "targetKm": 120,
  "red": "#F4253C",
  "blue": "#0060C0",
  "fontPair": "Archivo + Hanken"
}/*EDITMODE-END*/;

const W_FONTS = {
  'Archivo + Hanken': { display: "'Barlow Condensed', sans-serif", ui: "'Inter', sans-serif" },
  'Space Grotesk': { display: "'Barlow Condensed', sans-serif", ui: "'Inter', sans-serif" },
  'Sora + Inter': { display: "'Barlow Condensed', sans-serif", ui: "'Inter', sans-serif" },
};
const W_BLUE_DEEP = { '#0060C0': '#00305f', '#0B3D91': '#061f4d', '#1466B8': '#0a345e' };
const W_BLUE_BRIGHT = { '#0060C0': '#2E8BE6', '#0B3D91': '#2f64c4', '#1466B8': '#3a93e0' };

const W_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const wFmtDate = (iso) => { const d = new Date(iso + 'T00:00:00'); return `${d.getDate()} ${W_MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const wDays = (iso) => { const d0 = new Date(); d0.setHours(0,0,0,0); return Math.max(0, Math.round((new Date(iso + 'T00:00:00') - d0) / 86400000)); };

const W_SEED_RUNS = [];   // tidak ada data contoh — tiap user mulai dari nol

// Sleep & hydration helpers — key & format HARUS sama dengan progress.jsx,
// supaya data yang sama dibaca di kedua file. Keyed per tanggal → otomatis
// reset tiap ganti hari (user mulai dari 0 lagi).
const wzDateKey = (d) => { const x = d ? new Date(d) : new Date(); x.setHours(0, 0, 0, 0); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
const wzSleepKey = (e) => 'uz_sleep_' + ((e || 'anon').toString().toLowerCase());
const wzWaterKey = (e) => 'uz_water_' + ((e || 'anon').toString().toLowerCase());
const wzLoad = (k) => { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } };

// Tangkap kode undangan tim dari URL (?team=KODE) lalu simpan & bersihkan URL.
(function () {
  try {
    var p = new URLSearchParams(location.search);
    var code = p.get('team') || ((location.hash.match(/team=([a-z0-9]+)/i) || [])[1]);
    if (code) {
      localStorage.setItem('uz_team_invite', code);
      history.replaceState({}, '', location.origin + location.pathname);
    }
  } catch (e) {}
})();
function wTeamLink(code) { return (location.origin + location.pathname) + '?team=' + code; }
function wShareTeam(team) {
  var url = wTeamLink(team.invite_code);
  var text = 'Join my team "' + team.name + '" on Road to UOB Heartbeat Run 🏃 — log runs & climb the leaderboard together! ' + url;
  try { if (navigator.share) { navigator.share({ title: 'Join ' + team.name, text: text, url: url }).catch(function () {}); return; } } catch (e) {}
  try { window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank'); } catch (e) {}
}

// Modal undangan tim (muncul saat buka link invite).
function TeamInviteModal({ invite, onJoin, onDeny }) {
  if (!invite) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,10,22,0.72)', backdropFilter: 'blur(6px)', animation: 'fadeIn .2s ease', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 360, background: 'var(--card)', borderRadius: 26, padding: '28px 24px', textAlign: 'center', boxShadow: '0 30px 70px -20px rgba(0,0,0,0.5)', animation: 'popIn .4s cubic-bezier(.22,1,.36,1)' }}>
        <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <WIcon name="trophy" size={34} color="#fff" stroke={2.2} />
        </div>
        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 12, letterSpacing: 1, color: 'var(--blue)' }}>TEAM INVITE</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--ink)', margin: '6px 0 4px' }}>Join “{invite.name}”?</h2>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, color: 'var(--muted)', margin: '0 0 20px', lineHeight: 1.5 }}>You’ve been invited to join this team. Members train together and see each other’s progress.</p>
        <button onClick={onJoin} style={{ width: '100%', border: 'none', cursor: 'pointer', borderRadius: 14, padding: '15px 0', background: 'var(--blue)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>Join team</button>
        <button onClick={onDeny} style={{ width: '100%', marginTop: 10, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', borderRadius: 14, padding: '13px 0', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--muted)' }}>Deny invite</button>
      </div>
    </div>
  );
}

// Panel notifikasi (undangan tim yang belum direspons).
function NotifPanel({ open, invite, onClose, onOpenInvite }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 94, background: 'rgba(4,10,22,0.4)', animation: 'fadeIn .15s ease' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 64, right: 16, left: 16, maxWidth: 380, marginLeft: 'auto', background: 'var(--card)', borderRadius: 20, border: '1px solid var(--line)', boxShadow: '0 24px 60px -20px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>Notifications</div>
        {invite ? (
          <button onClick={onOpenInvite} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', gap: 12, padding: '14px 18px', alignItems: 'center' }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(0,96,192,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><WIcon name="trophy" size={19} color="var(--blue)" stroke={2.2} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>Team invite: {invite.name}</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>Tap to join or deny</div>
            </div>
            <WIcon name="chevron" size={17} color="var(--muted)" stroke={2.2} />
          </button>
        ) : (
          <div style={{ padding: '26px 18px', textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--muted)' }}>No new notifications.</div>
        )}
      </div>
    </div>
  );
}

// Modal buat tim baru.
function CreateTeamModal({ open, onClose, onCreate }) {
  const [name, setName] = React.useState('');
  React.useEffect(() => { if (open) setName(''); }, [open]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,10,22,0.7)', backdropFilter: 'blur(6px)', animation: 'fadeIn .2s ease', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 360, background: 'var(--card)', borderRadius: 26, padding: '26px 24px', boxShadow: '0 30px 70px -20px rgba(0,0,0,0.5)', animation: 'popIn .35s cubic-bezier(.22,1,.36,1)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 21, color: 'var(--ink)', margin: '0 0 4px' }}>Create a team</h2>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--muted)', margin: '0 0 16px' }}>Give your team a name, then invite mates via WhatsApp.</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Senopati Squad" autoFocus style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid var(--line)', borderRadius: 14, padding: '13px 15px', fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--ink)', outline: 'none', background: 'var(--bg)', marginBottom: 16 }} />
        <button onClick={() => name.trim().length >= 2 && onCreate(name.trim())} disabled={name.trim().length < 2} style={{ width: '100%', border: 'none', cursor: name.trim().length >= 2 ? 'pointer' : 'not-allowed', borderRadius: 14, padding: '14px 0', background: name.trim().length >= 2 ? 'var(--blue)' : 'rgba(2,32,71,0.12)', color: name.trim().length >= 2 ? '#fff' : 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5 }}>Create team</button>
      </div>
    </div>
  );
}

// ── Hidrasi state dari Supabase ─────────────────────────────
// Sumber kebenaran data lari ada di Supabase (uob_activities), bukan
// localStorage. Jadi user yang login di perangkat MANA PUN tetap melihat
// seluruh riwayat larinya — tidak hilang & tidak perlu mulai dari nol.
function wBuildExtraFromRuns(rows) {
  const runs = (rows || []).map((a) => ({
    km: Number(a.distance_km) || 0,
    mins: a.duration_seconds ? Math.round(a.duration_seconds / 60) : null,
    source: a.source || 'manual',
    when: a.recorded_at ? new Date(a.recorded_at).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Today',
    recordedAt: a.recorded_at,
    external_id: a.external_id || null,
  }));
  const km = runs.reduce((s, r) => s + r.km, 0);
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const todayKm = runs.filter((r) => r.recordedAt && new Date(r.recordedAt) >= startOfToday).reduce((s, r) => s + r.km, 0);
  // streak: jumlah hari berturut-turut (mundur dari hari ini) yang ada larinya
  const daySet = new Set(runs.filter((r) => r.recordedAt).map((r) => { const d = new Date(r.recordedAt); d.setHours(0, 0, 0, 0); return d.getTime(); }));
  let streakBonus = 0; const cur = new Date(); cur.setHours(0, 0, 0, 0);
  while (daySet.has(cur.getTime())) { streakBonus++; cur.setDate(cur.getDate() - 1); }
  return { km, runs, todayKm, streakBonus };
}
async function wLoadSupabaseState() {
  if (!window.UZSupaEnabled || !window.UZSupa) return null;
  let u = null; try { u = await window.UZSupa.getUser(); } catch (e) {}
  if (!u) return null; // tidak ada sesi aktif
  let prof = null, runs = [];
  try { prof = await window.UZSupa.getProfile(); } catch (e) {}
  try { runs = await window.UZSupa.myRuns(200); } catch (e) {}
  const email = (u && u.email) || (prof && prof.email) || '';
  const profile = prof ? {
    name: prof.full_name || (email ? email.split('@')[0] : 'Runner'),
    email, phone: prof.phone || '', kcp: prof.department || prof.kcp || '',
    team: prof.team || '', cat: prof.category || prof.cat || '10K',
    targetKm: prof.target_km || null, weeklyTarget: prof.weekly_target_km || null,
    avatarUrl: prof.avatar_url || null, gender: prof.gender || '', nik: prof.nik || '',
    existing: true, goalsSet: !!prof.goals_set,
  } : { name: email ? email.split('@')[0] : 'Runner', email, kcp: '', team: '', cat: '10K', goalsSet: false, existing: true };
  return {
    profile,
    extra: wBuildExtraFromRuns(runs),
    watchConnected: !!(prof && prof.strava_connected),
    watchBrand: 'Strava',
  };
}

// Cadangan lari lokal (UZStore) untuk profil ini — dipakai agar data tidak
// hilang saat refresh kalau penulisan ke Supabase sempat gagal.
function wLocalExtra(profile) {
  try {
    if (!window.UZStore || !profile || !profile.email) return null;
    const saved = window.UZStore.loadUser(profile.email, profile.name);
    return (saved && saved.extra) || null;
  } catch (e) { return null; }
}
// Pilih kumpulan data yang lebih lengkap (lari terbanyak). Default ke `a`.
function wMergeExtra(a, b) {
  const na = (a && a.runs && a.runs.length) || 0;
  const nb = (b && b.runs && b.runs.length) || 0;
  if (nb > na) return b;
  return a || b || { km: 0, runs: [], todayKm: 0, streakBonus: 0 };
}

// Beri external_id ke lari LAMA (sebelum fitur sync) supaya ikut terdorong
// ke Supabase. ID berbasis isi+posisi → stabil di device yang sama (anti-dobel).
function wEnsureRunIds(extra) {
  if (!extra || !extra.runs || !extra.runs.length) return extra;
  let changed = false;
  const runs = extra.runs.map((r, i) => {
    if (r && r.external_id) return r;
    changed = true;
    return Object.assign({}, r, { external_id: 'legacy_' + (r && (r.recordedAt || r.when) || 'x') + '_' + ((r && Number(r.km)) || 0) + '_' + i });
  });
  return changed ? Object.assign({}, extra, { runs: runs }) : extra;
}

// ── Sinkronisasi — Supabase = SATU-SATUNYA sumber kebenaran ──
// Tampilkan PERSIS data Supabase. Cache lokal HANYA dipakai sebagai cadangan
// tampilan kalau pembacaan Supabase GAGAL (mis. offline) — TIDAK pernah
// "didorong" naik, supaya data akun lain tak pernah bocor & user baru = 0 km.
async function wReconcile(localExtra) {
  if (!window.UZSupaEnabled || !window.UZSupa) return localExtra || null;
  let db;
  try { db = await window.UZSupa.myRuns(500); }
  catch (e) { return localExtra || null; } // baca gagal → pertahankan cadangan lokal
  return wBuildExtraFromRuns(db);          // sukses (termasuk KOSONG) → pakai data Supabase
}

// ── Notifikasi & perayaan (achievement + streak) ───────────
function wNotify(title, body) {
  try { if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body: body, icon: window.asset && window.asset('logoUOB', '') || undefined }); } catch (e) {}
}
function wRequestNotify() {
  try { if ('Notification' in window && Notification.permission === 'default') { var p = Notification.requestPermission(); if (p && p.catch) p.catch(function () {}); } } catch (e) {}
}
// ── Tur perkenalan fitur (sekali, di main page setelah onboarding) ──
const W_TOUR = [
  { sel: '[data-tour="log"]', title: 'Log your run', body: 'Tap “Today’s Run” (or the + button) to log a run with a photo proof — your distance is verified and added to your total.' },
  { sel: '[data-tour="goals"]', title: 'Set your goal', body: 'This is your Training Target. Tap Edit here to set the goal you want — pick a ready-made challenge (5K / 10K) or your own km target, and your plan is built automatically.' },
  { sel: '[data-tour="wellness"]', title: 'Sleep & hydration', body: 'Log last night’s sleep and tap to track your water (aim for 2 L a day). Your daily workout adapts to how well-rested you are, and you’ll earn badges for staying consistent.' },
  { sel: '[data-tour="daily"]', title: 'Daily tasks', body: 'Follow your daily Race Plan — Run, Hydration, Nutrition and Wind-down. Pick a day and tick each one off as you go.' },
  { sel: '[data-tour="nav-Leaderboard"]', title: 'Team & leaderboard', body: 'Climb the rankings on Today / Best of Best. Under “My Team” you can create a team and invite friends via WhatsApp.' },
  { sel: '[data-tour="nav-Profile"]', title: 'Profile', body: 'Change your name and photo, edit your target, and manage your teams here.' },
];
function FeatureTour({ steps, onDone }) {
  const [i, setI] = React.useState(0);
  const [rect, setRect] = React.useState(null);
  const step = steps[i];
  // Pilih elemen yang TERLIHAT (mobile tabbar vs desktop sidebar punya
  // data-tour yang sama; di desktop yang mobile disembunyikan).
  const pick = () => {
    const els = document.querySelectorAll(step.sel);
    for (let k = 0; k < els.length; k++) { const r = els[k].getBoundingClientRect(); if (r.width > 0 && r.height > 0) return els[k]; }
    return els[0] || null;
  };
  React.useEffect(() => {
    let alive = true;
    const el = pick();
    if (el && el.scrollIntoView) { try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { try { el.scrollIntoView(); } catch (e2) {} } }
    const measure = () => { if (!alive) return; const e2 = pick(); setRect(e2 ? e2.getBoundingClientRect() : null); };
    const t1 = setTimeout(measure, 60);
    const t2 = setTimeout(measure, 380);  // setelah scroll selesai
    window.addEventListener('resize', measure);
    return () => { alive = false; clearTimeout(t1); clearTimeout(t2); window.removeEventListener('resize', measure); };
  }, [i, step.sel]);
  const pad = 8;
  const hole = rect ? { left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 } : null;
  const below = rect ? (rect.top < window.innerHeight * 0.5) : true;
  const next = () => { if (i < steps.length - 1) setI(i + 1); else onDone(); };
  const tipStyle = { position: 'fixed', left: 16, right: 16, maxWidth: 380, margin: '0 auto', background: 'var(--card)', borderRadius: 18, padding: '16px 18px', boxShadow: '0 20px 50px -16px rgba(0,0,0,0.5)', zIndex: 98 };
  if (rect) { if (below) tipStyle.top = Math.min(rect.bottom + 16, window.innerHeight - 180); else tipStyle.bottom = (window.innerHeight - rect.top) + 16; }
  else { tipStyle.top = '50%'; tipStyle.transform = 'translateY(-50%)'; }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 97 }}>
      {hole
        ? <div style={{ position: 'fixed', left: hole.left, top: hole.top, width: hole.width, height: hole.height, borderRadius: 14, boxShadow: '0 0 0 9999px rgba(4,10,22,0.74)', border: '2px solid #fff', pointerEvents: 'none' }} />
        : <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,10,22,0.74)' }} />}
      <div style={tipStyle}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--ink)' }}>{step.title}</div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, color: 'var(--muted)', marginTop: 5, lineHeight: 1.5 }}>{step.body}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          <button onClick={onDone} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, color: 'var(--muted)' }}>Skip</button>
          <div style={{ display: 'flex', gap: 6 }}>{steps.map((_, k) => <span key={k} style={{ width: k === i ? 16 : 7, height: 7, borderRadius: 7, background: k === i ? 'var(--blue)' : 'rgba(2,32,71,0.18)' }} />)}</div>
          <button onClick={next} style={{ border: 'none', cursor: 'pointer', borderRadius: 10, padding: '9px 18px', background: 'var(--blue)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14 }}>{i < steps.length - 1 ? 'Next' : 'Got it'}</button>
        </div>
      </div>
    </div>
  );
}

const W_ICON_FALLBACK = { medal: 'trophy', clock: 'watch' };
function Celebration({ item, onClose }) {
  if (!item) return null;
  const isStreak = item.type === 'streak';
  const accent = item.accent || (isStreak ? 'var(--red)' : '#E8B339');
  const kicker = item.kicker || (isStreak ? 'STREAK!' : 'ACHIEVEMENT UNLOCKED');
  const icon = W_ICON_FALLBACK[item.icon] || item.icon || 'trophy';
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 95, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,10,22,0.72)', backdropFilter: 'blur(6px)', animation: 'fadeIn .2s ease', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 360, background: 'var(--card)', borderRadius: 26, padding: '30px 24px', textAlign: 'center', boxShadow: '0 30px 70px -20px rgba(0,0,0,0.5)', animation: 'popIn .4s cubic-bezier(.22,1,.36,1)' }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 12, letterSpacing: 1.5, color: accent }}>{kicker}</div>
        <div style={{ width: 92, height: 92, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '16px auto', boxShadow: `0 16px 34px -12px ${accent}` }}>
          {item.emoji ? <span style={{ fontSize: 46, lineHeight: 1 }}>{item.emoji}</span> : <WIcon name={icon} size={46} color="#fff" stroke={2.2} />}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 23, color: 'var(--ink)', letterSpacing: -0.5 }}>{item.title}</div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>{item.body}</div>
        <button onClick={onClose} style={{ marginTop: 22, width: '100%', border: 'none', cursor: 'pointer', borderRadius: 14, padding: '15px 0', background: 'var(--blue-rich)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>Nice! 🎉</button>
      </div>
    </div>
  );
}

const W_NAV = [
  { id: 'Home', label: 'Home', icon: 'home' },
  { id: 'Progress', label: 'Progress', icon: 'chart' },
  { id: 'Leaderboard', label: 'Leaderboard', icon: 'trophy' },
  { id: 'Profile', label: 'Profile', icon: 'user' },
];

// ── Desktop sidebar ─────────────────────────────────────────
function Sidebar({ active, goTo, onLog, name, sub, avatarUrl }) {
  return (
    <aside className="sidebar desktop-only">
      <div className="sidebar-brand">
        <img src={window.asset('logoUOB', 'assets/uob-heartbeat-logo-trans.png')} alt="UOB Heartbeat" />
        <span className="sidebar-x">×</span>
        <img className="sidebar-20fit" src={window.asset('logo20fit', 'assets/logo-20fit.png')} alt="20FIT" />
      </div>
      <div className="sidebar-tag">Road to Race Day</div>
      <nav className="sidebar-nav">
        {W_NAV.map((n) => (
          <button key={n.id} data-tour={'nav-' + n.id} onClick={() => goTo(n.id)} className={'side-link' + (active === n.id ? ' is-active' : '')}>
            <WIcon name={n.icon} size={21} stroke={active === n.id ? 2.6 : 2} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
      <button onClick={onLog} className="side-cta">
        <WIcon name="plus" size={20} stroke={2.8} /> Log Run
      </button>
      <button onClick={() => goTo('Profile')} className="side-user">
        <WAvatar name={name} size={38} src={avatarUrl} />
        <div>
          <div className="side-user-name">{name}</div>
          <div className="side-user-sub">{sub}</div>
        </div>
      </button>
    </aside>
  );
}

// ── Mobile bottom tab bar ───────────────────────────────────
function TabBar({ active, goTo, onLog }) {
  const left = W_NAV.slice(0, 2), right = W_NAV.slice(2);
  const item = (n) => (
    <button key={n.id} data-tour={'nav-' + n.id} onClick={() => goTo(n.id)} className="tab-link" style={{ color: active === n.id ? 'var(--blue)' : 'var(--muted)' }}>
      <WIcon name={n.icon} size={23} stroke={active === n.id ? 2.6 : 2} />
      <span style={{ fontWeight: active === n.id ? 800 : 600 }}>{n.label}</span>
    </button>
  );
  return (
    <nav className="tabbar mobile-only">
      <div className="tab-group">{left.map(item)}</div>
      <div className="tab-fab-slot">
        <button data-tour="fab" onClick={onLog} className="tab-fab"><WIcon name="plus" size={28} color="#fff" stroke={3} /></button>
      </div>
      <div className="tab-group">{right.map(item)}</div>
    </nav>
  );
}

// ── Goal editor (ubah target lari dari dalam app) ───────────
const W_RACE_CATS = ['5K', '10K'];
const W_PLANS = {
  '5K': { dist: '5 KM', tag: 'Fun Run', accent: '#0E9F6E', weeks: 6, perWeek: 13, total: 75, blurb: 'Great for beginners. Focus on consistency, not speed.' },
  '10K': { dist: '10 KM', tag: 'Challenge', accent: '#0060C0', weeks: 8, perWeek: 22, total: 150, blurb: 'Needs a running base. Build endurance gradually for the 10K.' },
};
function GoalEditSheet({ open, initial, onClose, onSave }) {
  const def = W_PLANS[initial.cat] ? initial.cat : (initial.cat === 'Custom' ? 'Custom' : '10K');
  const [cat, setCat] = React.useState(def);
  const [customKm, setCustomKm] = React.useState(String(initial.targetKm || 50));
  React.useEffect(() => { if (open) { setCat(W_PLANS[initial.cat] ? initial.cat : (initial.cat === 'Custom' ? 'Custom' : '10K')); setCustomKm(String(initial.targetKm || 50)); } }, [open]);
  if (!open) return null;
  const weeksLeft = Math.max(1, Math.ceil((initial.daysLeft || 56) / 7));
  const ckm = Math.max(1, Math.round(parseFloat(String(customKm).replace(',', '.')) || 0));
  // Plan custom dihitung otomatis dari target & sisa waktu menuju race day.
  const customPlan = { dist: ckm + ' KM', tag: 'Custom', accent: '#9333EA', weeks: weeksLeft, perWeek: Math.max(1, Math.round(ckm / weeksLeft)), total: ckm, blurb: 'Your own target — we spread it evenly across the weeks left until race day so the plan fits you.' };
  const isCustom = cat === 'Custom';
  const p = isCustom ? customPlan : W_PLANS[cat];
  const stat = (v, u, l) => (
    <div style={{ flex: 1, textAlign: 'center', padding: '11px 4px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--ink)', letterSpacing: -0.6, lineHeight: 1 }}>{v}<span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', marginLeft: 2 }}>{u}</span></div>
      <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 10.5, color: 'var(--muted)', letterSpacing: 0.3, marginTop: 5, textTransform: 'uppercase' }}>{l}</div>
    </div>
  );
  const label = { fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: 'var(--muted)', letterSpacing: 0.3, marginBottom: 9 };
  return (
    <div className="logsheet-root" style={{ position: 'fixed', inset: 0, zIndex: 85, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(2,16,40,0.45)', backdropFilter: 'blur(2px)', animation: 'fadeIn .2s ease' }} />
      <div className="logsheet-card" style={{ position: 'relative', background: 'var(--bg)', borderRadius: '28px 28px 0 0', maxHeight: '92%', overflow: 'auto', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)', animation: 'sheetUp .32s cubic-bezier(.22,1,.36,1)', paddingBottom: 24 }}>
        <div style={{ padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 5, borderRadius: 5, background: 'rgba(2,32,71,0.18)', margin: '0 auto 14px' }} />
        </div>
        <div style={{ padding: '0 22px 8px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 21, color: 'var(--ink)', letterSpacing: -0.4, margin: 0 }}>How do you want to challenge yourself?</h2>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--muted)', margin: '4px 0 18px' }}>Pick a ready-made challenge or set your own km goal — your training plan is built automatically.</p>

          <div style={{ display: 'flex', gap: 9, marginBottom: 18 }}>
            {[...W_RACE_CATS, 'Custom'].map((c) => {
              const rp = c === 'Custom' ? customPlan : W_PLANS[c]; const on = cat === c;
              return (
                <button key={c} onClick={() => setCat(c)} style={{
                  flex: 1, cursor: 'pointer', borderRadius: 18, padding: '15px 8px', textAlign: 'left', transition: 'all .15s',
                  border: on ? `2px solid ${rp.accent}` : '1.5px solid var(--line)',
                  background: on ? `${rp.accent}0F` : 'var(--card)',
                  boxShadow: on ? `0 10px 22px -10px ${rp.accent}80` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: c === 'Custom' ? 19 : 26, letterSpacing: -1, color: on ? rp.accent : 'var(--ink)', lineHeight: 1 }}>{c === 'Custom' ? 'Own' : c.replace('K', '')}</span>
                    {c !== 'Custom' && <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: on ? rp.accent : 'var(--muted)' }}>KM</span>}
                  </div>
                  <div style={{ display: 'inline-block', marginTop: 8, padding: '3px 8px', borderRadius: 999, background: on ? rp.accent : 'rgba(2,32,71,0.08)', color: on ? '#fff' : 'var(--muted)', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 10 }}>{rp.tag}</div>
                </button>
              );
            })}
          </div>

          {isCustom && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: 16, marginBottom: 14 }}>
              <div style={label}>YOUR TOTAL TARGET (KM)</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <input value={customKm} inputMode="numeric" onChange={(e) => setCustomKm(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} onFocus={(e) => e.target.select()}
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38, color: 'var(--ink)', letterSpacing: -1.2, width: '3.2em', border: 'none', borderBottom: '2px solid #9333EA', background: 'transparent', outline: 'none', padding: '0 0 2px' }} />
                <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 15, color: 'var(--muted)' }}>km total</span>
              </div>
              <div style={{ display: 'flex', gap: 7, marginTop: 12 }}>
                {[30, 50, 75, 100, 150].map((q) => (
                  <button key={q} onClick={() => setCustomKm(String(q))} style={{ flex: 1, cursor: 'pointer', borderRadius: 10, padding: '7px 0', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5, border: ckm === q ? '1.5px solid #9333EA' : '1px solid var(--line)', background: ckm === q ? 'rgba(147,51,234,0.08)' : 'transparent', color: ckm === q ? '#9333EA' : 'var(--muted)' }}>{q}</button>
                ))}
              </div>
            </div>
          )}

          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, lineHeight: 1.55, color: 'var(--ink)', margin: '0 0 12px' }}>{p.blurb}</p>
          <div style={label}>{isCustom ? 'YOUR PLAN' : 'RECOMMENDED PLAN'}</div>
          <div style={{ display: 'flex', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, marginBottom: 22, overflow: 'hidden' }}>
            {stat(p.weeks, 'wk', 'Program')}
            <div style={{ width: 1, background: 'var(--line)' }} />
            {stat(p.perWeek, 'km', 'Per week')}
            <div style={{ width: 1, background: 'var(--line)' }} />
            {stat(p.total, 'km', 'Total')}
          </div>

          <button onClick={() => onSave({ cat, targetKm: p.total, weeklyTarget: p.perWeek, planWeeks: p.weeks })} style={{ width: '100%', border: 'none', cursor: 'pointer', borderRadius: 16, padding: '16px 0', background: 'var(--blue-rich)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, boxShadow: '0 12px 26px -10px rgba(10,86,174,0.5)' }}>Save Plan</button>
        </div>
      </div>
    </div>
  );
}

// ── Virtual Race (race-day only) ────────────────────────────
// Tombol terkunci sampai 29 Agustus 2026, 06:00–09:00 WIB. Waktu
// diverifikasi dari SERVER (header Date Supabase) supaya tidak bisa
// diakali dengan mengubah jam perangkat. Penegakan sebenarnya juga ada
// di halaman virtual-run.html (gerbang waktu yang sama).
const VR_START = Date.UTC(2026, 7, 28, 23, 0, 0); // 06:00 WIB 29 Aug
const VR_END = Date.UTC(2026, 7, 29, 2, 0, 0);    // 09:00 WIB 29 Aug
const VR_URL = '/virtualrun/';
// Tombol Virtual Race di Profile DIKUNCI ke jendela 29 Agt 06:00–09:00 WIB.
// (Halaman /virtualrun sendiri tetap terbuka — diatur di virtualrun/index.html.)
const VR_FORCE_OPEN = false;
function wVRServerNow() {
  const cfg = window.SUPABASE_CONFIG || {};
  if (!cfg.url) return Promise.resolve(Date.now());
  return fetch(cfg.url + '/rest/v1/', { method: 'HEAD', headers: { apikey: cfg.anonKey || '' } })
    .then((r) => { const d = r.headers.get('date'); const t = d ? Date.parse(d) : NaN; return isNaN(t) ? Date.now() : t; })
    .catch(() => Date.now());
}
function wVRfmt(ms) {
  if (ms < 0) ms = 0; let s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400); s -= d * 86400; const h = Math.floor(s / 3600); s -= h * 3600; const m = Math.floor(s / 60); s -= m * 60;
  return (d > 0 ? d + 'd ' : '') + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}
function VirtualRaceCard() {
  const [offset, setOffset] = React.useState(null);
  const [, force] = React.useState(0);
  // Mode preview (testing): aktif lewat ?vrpreview=1 atau flag tersimpan.
  const preview = (function () { try { localStorage.removeItem('uob_vr_preview'); } catch (e) {} return false; })();
  React.useEffect(() => {
    let alive = true;
    wVRServerNow().then((t) => { if (alive) setOffset(t - Date.now()); });
    const iv = setInterval(() => { if (alive) force((x) => x + 1); }, 1000);
    return () => { alive = false; clearInterval(iv); };
  }, []);
  if (offset === null) return null;
  const now = Date.now() + offset;
  const inWindow = now >= VR_START && now <= VR_END;
  const open = VR_FORCE_OPEN || preview || inWindow;
  const closed = !VR_FORCE_OPEN && !preview && now > VR_END;
  const enter = () => { window.location.href = preview ? (VR_URL + '?preview=1') : VR_URL; };
  return (
    <div style={{ margin: '14px 20px 0' }}>
      {open ? (
        <button onClick={enter} style={{ width: '100%', border: 'none', cursor: 'pointer', borderRadius: 20, padding: '17px 18px', textAlign: 'left', background: 'linear-gradient(120deg, var(--red), #C81030)', color: '#fff', boxShadow: '0 14px 30px -12px rgba(244,37,60,0.6)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><WIcon name="run" size={26} color="#fff" stroke={2.2} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 10.5, letterSpacing: 1, opacity: 0.92 }}>{inWindow ? '🔴 LIVE NOW · CLOSES IN ' + wVRfmt(VR_END - now) : preview ? '🧪 PREVIEW · TESTING MODE' : '🟢 OPEN NOW'}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, marginTop: 2 }}>Enter Virtual Run</div>
          </div>
          <WIcon name="chevron" size={20} color="#fff" stroke={2.4} />
        </button>
      ) : closed ? (
        <button onClick={enter} style={{ width: '100%', border: '1px solid var(--line)', cursor: 'pointer', borderRadius: 20, padding: '16px 18px', textAlign: 'left', background: 'var(--card)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(2,32,71,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><WIcon name="trophy" size={22} color="var(--muted)" stroke={2.2} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5, color: 'var(--ink)' }}>Virtual Run has ended</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>View the final leaderboard</div>
          </div>
          <WIcon name="chevron" size={18} color="var(--muted)" stroke={2.2} />
        </button>
      ) : (
        <div style={{ borderRadius: 20, padding: '17px 18px', background: 'linear-gradient(120deg, #052B63, #0A56AE)', color: '#fff', boxShadow: '0 14px 30px -14px rgba(10,86,174,0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>🔒</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 10.5, letterSpacing: 1.2, opacity: 0.85 }}>VIRTUAL RACE</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, marginTop: 1 }}>Unlocks on race day</div>
            </div>
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.18)' }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, opacity: 0.85 }}>Available on <b style={{ opacity: 1 }}>29 Aug 2026</b> · 06:00–09:00 WIB</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, opacity: 0.95, marginTop: 3 }}>Opens in {wVRfmt(VR_START - now)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Profile (web copy) ──────────────────────────────────────
function WebProfile({ data, onConnect, onLogout, onEditGoal, onSaveProfile, team, teams, onCreateTeam, onShareTeam, onUploadAvatar, onShareRun }) {
  const [editing, setEditing] = React.useState(false);
  const [showCount, setShowCount] = React.useState(5);
  const sortedRuns = React.useMemo(() => (data.runs || []).slice().sort((a, b) => new Date(b.recordedAt || 0) - new Date(a.recordedAt || 0)), [data.runs]);
  React.useEffect(() => { setShowCount(5); }, [data.runs && data.runs.length]);
  const [pName, setPName] = React.useState(data.userName);
  const [pKcp, setPKcp] = React.useState(data.kcp || '');
  const avatarRef = React.useRef(null);
  React.useEffect(() => { setPName(data.userName); setPKcp(data.kcp || ''); }, [data.userName, data.kcp]);
  const Av = ({ size }) => data.avatarUrl
    ? <img src={data.avatarUrl} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
    : <WAvatar name={pName || data.userName} size={size} />;
  const efield = { width: '100%', boxSizing: 'border-box', border: '1.5px solid var(--line)', borderRadius: 12, padding: '11px 13px', fontFamily: 'var(--font-ui)', fontSize: 14.5, color: 'var(--ink)', outline: 'none', background: 'var(--bg)' };
  const saveEdit = () => { if (pName.trim().length < 2) return; if (onSaveProfile) onSaveProfile({ name: pName.trim(), kcp: pKcp.trim() }); setEditing(false); };
  const row = (icon, title, detail, color) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0', borderTop: '1px solid var(--line)' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: (color || 'var(--blue)') + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <WIcon name={icon} size={18} color={color || 'var(--blue)'} stroke={2.2} />
      </div>
      <span style={{ flex: 1, fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>{title}</span>
      <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 13, color: 'var(--muted)' }}>{detail}</span>
      <WIcon name="chevron" size={17} color="var(--muted)" stroke={2.2} />
    </div>
  );
  return (
    <div className="wprofile" style={{ paddingTop: 8, paddingBottom: 40 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color: 'var(--ink)', letterSpacing: -0.8, margin: '0 0 4px', padding: '0 20px' }}>Profile</h1>
      <div style={{ margin: '12px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Av size={66} />
            <input ref={avatarRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f && onUploadAvatar) onUploadAvatar(f); e.target.value = ''; }} style={{ display: 'none' }} />
            <button onClick={() => avatarRef.current && avatarRef.current.click()} aria-label="Change photo" style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', border: '2px solid var(--bg)', background: 'var(--blue)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
              <WIcon name="plus" size={14} stroke={2.8} />
            </button>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--ink)' }}>{data.userName}</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{data.team || ''}</div>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} style={{ border: 'none', background: 'rgba(0,96,192,0.08)', cursor: 'pointer', borderRadius: 10, padding: '8px 13px', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5, color: 'var(--blue)' }}>
              <WIcon name="user" size={14} stroke={2.4} /> Edit
            </button>
          )}
        </div>
        {editing && (
          <div style={{ marginTop: 14, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: 16 }}>
            <label style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11.5, color: 'var(--muted)', letterSpacing: 0.3 }}>FULL NAME</label>
            <input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Your name" style={{ ...efield, margin: '6px 0 12px' }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setEditing(false); setPName(data.userName); setPKcp(data.kcp || ''); }} style={{ flex: 1, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', borderRadius: 12, padding: '12px 0', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--muted)' }}>Cancel</button>
              <button onClick={saveEdit} style={{ flex: 1, border: 'none', cursor: 'pointer', borderRadius: 12, padding: '12px 0', background: 'var(--blue)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14 }}>Save</button>
            </div>
          </div>
        )}
      </div>
      <div style={{ margin: '18px 20px 0', display: 'flex', gap: 10 }}>
        {[['Total', `${WFmt.km0(data.totalKm)} km`], ['Sessions', data.stats.runs], ['Streak', `${data.streak} days`]].map(([l, v], i) => (
          <div key={i} style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '14px 0', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 18, color: 'var(--ink)', letterSpacing: -0.4 }}>{v}</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 10.5, color: 'var(--muted)', marginTop: 3, letterSpacing: 0.3 }}>{l.toUpperCase()}</div>
          </div>
        ))}
      </div>
      <div style={{ margin: '20px 20px 0', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 20, padding: '2px 16px' }}>
        <button onClick={onEditGoal} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--red)' + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WIcon name="target" size={18} color="var(--red)" stroke={2.2} />
          </div>
          <span style={{ flex: 1, fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>Training target</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, color: 'var(--blue)' }}>{data.targetKm} km · {data.cat}</span>
          <WIcon name="chevron" size={17} color="var(--muted)" stroke={2.2} />
        </button>
        {row('calendar', 'Race day', data.raceDate, 'var(--blue)')}
      </div>
      {/* Team */}
      <div style={{ margin: '14px 20px 0', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 20, padding: '4px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0' }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(0,96,192,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WIcon name="trophy" size={18} color="var(--blue)" stroke={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>{team ? team.name : 'My team'}</span>
            {team && <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--muted)', marginTop: 1 }}>You’re part of this team</div>}
          </div>
          {team
            ? <button onClick={onShareTeam} style={{ border: 'none', background: 'rgba(37,211,102,0.12)', cursor: 'pointer', borderRadius: 10, padding: '8px 12px', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5, color: '#0E7A52', display: 'flex', alignItems: 'center', gap: 5 }}><WIcon name="share" size={14} stroke={2.4} /> Invite</button>
            : <button onClick={onCreateTeam} style={{ border: 'none', background: 'rgba(0,96,192,0.1)', cursor: 'pointer', borderRadius: 10, padding: '8px 12px', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5, color: 'var(--blue)' }}>Create</button>}
        </div>
      </div>

      {/* Virtual Race — terkunci sampai 29 Aug 06:00–09:00 WIB */}
      <VirtualRaceCard />

      {/* Run History — riwayat lari + share story ulang */}
      {data.runs && data.runs.length > 0 && (
        <div style={{ margin: '20px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>Run History</span>
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5, color: 'var(--muted)' }}>{data.runs.length} {data.runs.length === 1 ? 'run' : 'runs'}</span>
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, padding: '2px 14px' }}>
            {sortedRuns.slice(0, showCount).map((r, i) => (
              <div key={r.external_id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i ? '1px solid var(--line)' : 'none' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, rgba(0,96,192,0.12), rgba(244,37,60,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <WIcon name="run" size={22} color="var(--blue)" stroke={2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>{WFmt.km(r.km)} km</span>
                    {r.mins ? <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--muted)' }}>· {WFmt.dur(r.mins)}</span> : null}
                  </div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--muted)', marginTop: 1 }}>{r.when || 'Today'}</div>
                </div>
                {onShareRun && (
                  <button onClick={() => onShareRun(r)} style={{ border: 'none', background: 'rgba(0,96,192,0.08)', cursor: 'pointer', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: 'var(--blue)', flexShrink: 0 }}>
                    <WIcon name="share" size={14} stroke={2.4} /> Share
                  </button>
                )}
              </div>
            ))}
          </div>
          {data.runs.length > showCount && (
            <button onClick={() => setShowCount((c) => c + 5)} style={{ width: '100%', marginTop: 10, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', borderRadius: 14, padding: '13px 0', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13.5, color: 'var(--blue)' }}>
              Load more ({data.runs.length - showCount} more)
            </button>
          )}
        </div>
      )}

      <div style={{ margin: '14px 20px 0' }}>
        <button onClick={onLogout} style={{ width: '100%', border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', borderRadius: 14, padding: '14px 0', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5, color: 'var(--red)' }}>Sign Out</button>
      </div>
    </div>
  );
}

function CompleteProfileGate({ profile, email, onSave }) {
  const [nik, setNik] = React.useState((profile && profile.nik) || '');
  const [gender, setGender] = React.useState((profile && (profile.gender === 'Male' || profile.gender === 'Female')) ? profile.gender : '');
  const [saving, setSaving] = React.useState(false);
  const nikOk = nik.replace(/[^0-9A-Za-z]/g, '').length >= 4;
  const genderOk = gender === 'Male' || gender === 'Female';
  const valid = nikOk && genderOk;
  const label = { fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: 'var(--muted)', letterSpacing: 0.3, display: 'block', marginBottom: 6 };
  const field = { width: '100%', boxSizing: 'border-box', border: '1.5px solid var(--line)', borderRadius: 14, padding: '14px 16px', fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--ink)', outline: 'none', background: 'var(--bg)' };
  const ro = { ...field, background: 'rgba(2,32,71,0.04)', color: 'var(--muted)', marginBottom: 16 };
  const submit = (e) => { e.preventDefault(); if (!valid || saving) return; setSaving(true); Promise.resolve(onSave({ nik: nik.trim(), gender: gender })).catch(function () {}).then(function () { setSaving(false); }); };
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 22px', background: 'radial-gradient(125% 95% at 50% 38%, rgba(12,64,142,0.16) 0%, rgba(9,42,98,0.70) 62%, rgba(7,34,82,0.86) 100%), var(--blue-deep)' }}>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 420, background: 'var(--card)', borderRadius: 24, padding: '28px 24px', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.45)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(244,37,60,0.1)', color: 'var(--red)', padding: '5px 11px', borderRadius: 9, fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11.5 }}>Complete your profile</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 23, color: 'var(--ink)', letterSpacing: -0.5, margin: '12px 0 4px' }}>One more step</h2>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, color: 'var(--muted)', margin: '0 0 22px' }}>Please fill in your NIK and gender to continue — these are required for the gender-based leaderboard.</p>
        <label style={label}>EMAIL</label>
        <input value={email} readOnly style={ro} />
        <label htmlFor="cp-nik" style={label}>EMPLOYEE NIK</label>
        <input id="cp-nik" type="text" inputMode="numeric" placeholder="Your employee NIK" value={nik} onChange={(e) => setNik(e.target.value.replace(/[^0-9A-Za-z]/g, ''))} style={{ ...field, marginBottom: 16 }} />
        <label style={label}>GENDER</label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
          {['Male', 'Female'].map((g) => (
            <button type="button" key={g} onClick={() => setGender(g)} style={{
              flex: 1, cursor: 'pointer', borderRadius: 14, padding: '13px 0', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14,
              border: gender === g ? '1.5px solid var(--blue)' : '1.5px solid var(--line)',
              background: gender === g ? 'rgba(0,96,192,0.08)' : 'var(--bg)', color: gender === g ? 'var(--blue)' : 'var(--muted)',
            }}>{g}</button>
          ))}
        </div>
        <button type="submit" disabled={!valid || saving} style={{
          width: '100%', marginTop: 20, border: 'none', cursor: (valid && !saving) ? 'pointer' : 'not-allowed', borderRadius: 14, padding: '15px 0',
          background: (valid && !saving) ? 'var(--blue)' : 'rgba(2,32,71,0.12)', color: (valid && !saving) ? '#fff' : 'var(--muted)',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5,
        }}>{saving ? 'Saving…' : 'Save & continue'}</button>
      </form>
    </div>
  );
}

function WebApp() {
  const [t, setTweak] = useTweaks(W_DEFAULTS);
  const [screen, setScreen] = React.useState('Home');
  const [authed, setAuthed] = React.useState(false);
  const [profile, setProfile] = React.useState(null);
  const [logOpen, setLogOpen] = React.useState(false);
  const [logStep, setLogStep] = React.useState('manual');
  const [watchConnected, setWatchConnected] = React.useState(false);
  const [watchBrand, setWatchBrand] = React.useState('Strava');
  const [extra, setExtra] = React.useState({ km: 0, runs: [], todayKm: 0, streakBonus: 0 });
  const [lastRun, setLastRun] = React.useState(null);
  const [goalEdit, setGoalEdit] = React.useState(false);
  const [celebQueue, setCelebQueue] = React.useState([]);
  const justLoggedRef = React.useRef(false);
  const [teams, setTeams] = React.useState([]);          // SEMUA tim yang saya ikuti
  const [selTeamId, setSelTeamId] = React.useState(null); // tim yang sedang dilihat
  const [teamMemberIds, setTeamMemberIds] = React.useState([]);
  const [invite, setInvite] = React.useState(null);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [createTeamOpen, setCreateTeamOpen] = React.useState(false);
  const [meUserId, setMeUserId] = React.useState(null);
  const [tourOpen, setTourOpen] = React.useState(false);
  const [sleepLog, setSleepLog] = React.useState({});  // {YYYY-MM-DD: jam}
  const [shareRun, setShareRun] = React.useState(null); // run yang sedang dibagikan ke Story
  const [waterLog, setWaterLog] = React.useState({});  // {YYYY-MM-DD: liter}
  const selectedTeam = teams.find((t) => t.id === selTeamId) || teams[0] || null;

  const fonts = W_FONTS[t.fontPair] || W_FONTS['Archivo + Hanken'];
  React.useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--blue', t.blue);
    r.setProperty('--blue-deep', W_BLUE_DEEP[t.blue] || '#00305f');
    r.setProperty('--blue-bright', W_BLUE_BRIGHT[t.blue] || '#2E8BE6');
    r.setProperty('--red', t.red);
    r.setProperty('--font-display', fonts.display);
    r.setProperty('--font-ui', fonts.ui);
    r.setProperty('--font-hero', "'Anton', sans-serif");
    r.setProperty('--font-num', "'JetBrains Mono', ui-monospace, monospace");
  }, [t.blue, t.red, t.fontPair]);

  const baseTotal = 0;
  const totalKm = baseTotal + extra.km;
  const targetKm = (profile && profile.targetKm) || Number(t.targetKm) || 120;
  const streak = extra.streakBonus;

  const wToday = (new Date().getDay() + 6) % 7;   // 0=Sen … 6=Min
  // Awal minggu ini (Senin 00:00 lokal) → hitung km TIAP hari dari semua lari.
  const wWeekStart = new Date(); wWeekStart.setHours(0, 0, 0, 0); wWeekStart.setDate(wWeekStart.getDate() - wToday);
  const wDayKm = [0, 0, 0, 0, 0, 0, 0];
  (extra.runs || []).forEach((r) => {
    if (!r || !r.recordedAt) return;
    const d = new Date(r.recordedAt); d.setHours(0, 0, 0, 0);
    const diff = Math.round((d - wWeekStart) / 86400000);
    if (diff >= 0 && diff < 7) wDayKm[diff] += (Number(r.km) || 0);
  });
  const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, i) => ({
    label,
    km: wDayKm[i],
    done: wDayKm[i] > 0,
    today: i === wToday,
  }));
  const weekKm = week.reduce((s, d) => s + d.km, 0);
  const userName = (profile && profile.name) || 'Runner';

  // ── Sleep & hydration (manual, per-akun, per-tanggal → reset harian) ──
  const sleepEmail = (profile && profile.email) || '';
  React.useEffect(() => {
    if (!authed) return;
    setSleepLog(wzLoad(wzSleepKey(sleepEmail)));
    setWaterLog(wzLoad(wzWaterKey(sleepEmail)));
  }, [authed, sleepEmail]);
  const handleLogSleep = (hours) => setSleepLog((prev) => {
    const next = { ...prev, [wzDateKey()]: hours };
    try { localStorage.setItem(wzSleepKey(sleepEmail), JSON.stringify(next)); } catch (e) {}
    return next;
  });
  const handleSetWater = (liters) => {
    const before = waterLog[wzDateKey()] || 0;
    setWaterLog((prev) => {
      const next = { ...prev, [wzDateKey()]: liters };
      try { localStorage.setItem(wzWaterKey(sleepEmail), JSON.stringify(next)); } catch (e) {}
      return next;
    });
    // Lewati ambang 2L hari ini → perayaan (sekali per hari).
    const seenKey = 'uz_water_celebrated_' + String(sleepEmail).toLowerCase() + '_' + wzDateKey();
    let seen = false; try { seen = localStorage.getItem(seenKey) === '1'; } catch (e) {}
    if (before < 2 && liters >= 2 && !seen) {
      try { localStorage.setItem(seenKey, '1'); } catch (e) {}
      setCelebQueue((q) => [...q, { type: 'hydration', emoji: '💧', accent: 'var(--blue)', kicker: 'HYDRATION GOAL', title: '2 L done! 💧', body: 'You hit your daily water goal — great job staying hydrated! 🎉' }]);
      wNotify('💧 Hydration goal reached!', 'You drank 2 L of water today — nice work!');
    }
  };

  const data = {
    daysLeft: wDays(t.raceISO), raceName: t.raceName, raceDate: wFmtDate(t.raceISO),
    totalKm, targetKm, weekKm, paceNote: 'On track with your plan',
    watchConnected, watchBrand, week,
    userName, avatarUrl: (profile && profile.avatarUrl) || null, team: (profile && profile.team) || '', cat: (profile && profile.cat) || '10K',
    kcp: (profile && profile.kcp) || '', email: (profile && profile.email) || '', gender: (profile && profile.gender) || '', nik: (profile && profile.nik) || '', meId: meUserId,
    sleepLog, waterLog, onLogSleep: handleLogSleep, onSetWater: handleSetWater,
    myTodayKm: extra.todayKm,
    runs: [...extra.runs, ...W_SEED_RUNS],
    streak,
    stats: { totalKm, runs: extra.runs.length, avgPace: 0, longest: extra.runs.reduce((m, r) => Math.max(m, r.km || 0), 0) },
    weeks: (function () {
      return ['5 wks ago', '4 wks', '3 wks', '2 wks', 'Last wk', 'This'].map((label, idx) => {
        const start = new Date(wWeekStart); start.setDate(start.getDate() - (5 - idx) * 7);
        const end = new Date(start); end.setDate(end.getDate() + 7);
        const km = (extra.runs || []).reduce((sum, r) => {
          if (!r || !r.recordedAt) return sum;
          const d = new Date(r.recordedAt);
          return (d >= start && d < end) ? sum + (Number(r.km) || 0) : sum;
        }, 0);
        return { label, km: Math.round(km * 10) / 10 };
      });
    })(),
    weeklyTarget: (profile && profile.weeklyTarget) || 30,
  };

  const handleSaveGoal = (g) => {
    setProfile((p) => ({ ...(p || {}), ...g, goalsSet: true }));
    setGoalEdit(false);
    if (window.UZSupaEnabled && window.UZSupa) window.UZSupa.saveGoals(g).catch((e) => console.warn('saveGoals', e && e.message));
  };
  // Tur perkenalan fitur — sekali PER AKUN (bukan per-device), di Home.
  const tourKey = () => 'uz_tour_done_' + ((profile && profile.email) ? String(profile.email).toLowerCase() : 'anon');
  React.useEffect(() => {
    if (!authed || !profile || !profile.email) return;
    let done = false; try { done = localStorage.getItem(tourKey()) === '1'; } catch (e) {}
    if (done) return;
    const t = setTimeout(() => { setScreen('Home'); setTourOpen(true); }, 1000);
    return () => clearTimeout(t);
  }, [authed, profile && profile.email]);
  const finishTour = () => { setTourOpen(false); try { localStorage.setItem(tourKey(), '1'); } catch (e) {} };

  // Ingat halaman terakhir → setelah refresh user tetap di page yang sama.
  React.useEffect(() => { if (!authed) return; try { localStorage.setItem('uz_screen', screen); } catch (e) {} }, [screen, authed]);
  const W_SCREENS = ['Home', 'Progress', 'Leaderboard', 'Profile'];
  const restoreScreen = () => { try { const s = localStorage.getItem('uz_screen'); if (s && W_SCREENS.indexOf(s) >= 0) setScreen(s); } catch (e) {} };

  // ── Team: muat SEMUA tim saya + undangan dari URL ──
  const loadTeams = async (preferId) => {
    let list = [];
    try { list = await window.UZSupa.myTeams(); } catch (e) { list = []; }
    setTeams(list);
    setSelTeamId((cur) => preferId || cur || (list[0] && list[0].id) || null);
    return list;
  };
  React.useEffect(() => {
    if (!authed || !window.UZSupaEnabled || !window.UZSupa || !window.UZSupa.myTeams) return;
    let alive = true;
    (async () => {
      try { if (window.UZSupa.ensureSession) await window.UZSupa.ensureSession(profile && profile.email); } catch (e) {}
      try { const u = await window.UZSupa.getUser(); if (alive && u) setMeUserId(u.id); } catch (e) {}
      let list = [];
      try { list = await window.UZSupa.myTeams(); } catch (e) {}
      if (!alive) return;
      setTeams(list);
      if (list.length) setSelTeamId((cur) => cur || list[0].id);
      // Undangan dari URL — tampil kalau saya BELUM anggota tim itu (boleh punya tim lain).
      let code = null; try { code = localStorage.getItem('uz_team_invite'); } catch (e) {}
      if (!code) return;
      try {
        const info = await window.UZSupa.teamByCode(code);
        if (!alive || !info) return;
        const already = list.some((t) => t.id === info.id);
        if (already) { try { localStorage.removeItem('uz_team_invite'); } catch (e) {} }
        else setInvite({ code, name: info.name });
      } catch (e) {}
    })();
    return () => { alive = false; };
  }, [authed, profile && profile.email]);

  // Muat anggota tim yang sedang dipilih.
  React.useEffect(() => {
    if (!authed || !selTeamId || !window.UZSupa || !window.UZSupa.teamMemberIds) { setTeamMemberIds([]); return; }
    let alive = true;
    window.UZSupa.teamMemberIds(selTeamId).then((ids) => { if (alive) setTeamMemberIds(ids || []); }).catch(() => {});
    return () => { alive = false; };
  }, [authed, selTeamId, teams]);

  const acceptInvite = async () => {
    if (!invite || !window.UZSupa) return;
    try { if (window.UZSupa.ensureSession) await window.UZSupa.ensureSession(profile && profile.email); } catch (e) {}
    const t = await window.UZSupa.joinTeamByCode(invite.code);
    try { localStorage.removeItem('uz_team_invite'); } catch (e) {}
    setInvite(null); setNotifOpen(false);
    if (t) { await loadTeams(t.id); setScreen('Leaderboard'); }
    else alert('Could not join the team. Make sure supabase-teams.sql has been run in Supabase.');
  };
  const denyInvite = () => { try { localStorage.removeItem('uz_team_invite'); } catch (e) {} setInvite(null); setNotifOpen(false); };
  const createTeam = async (name) => {
    if (!window.UZSupa) return;
    try { if (window.UZSupa.ensureSession) await window.UZSupa.ensureSession(profile && profile.email); } catch (e) {}
    const t = await window.UZSupa.createTeam(name);
    setCreateTeamOpen(false);
    if (t) { await loadTeams(t.id); wShareTeam(t); }
    else alert('Could not create the team. Make sure supabase-teams.sql has been run in Supabase.');
  };
  const renameTeam = async (name) => {
    if (!selectedTeam || !window.UZSupa) return;
    const res = await window.UZSupa.renameTeam(selectedTeam.id, name);
    if (res && res.ok) await loadTeams(selectedTeam.id);
    else alert('Could not edit the team name. Make sure the team permissions SQL (supabase-teams-multi.sql) has been run and that you are the team owner.');
  };
  const deleteTeam = async () => {
    if (!selectedTeam || !window.UZSupa) return;
    const res = await window.UZSupa.deleteTeam(selectedTeam.id);
    if (res && res.ok) await loadTeams(null);
    else alert('Could not delete the team. Make sure the team permissions SQL has been run and that you are the owner.');
  };
  const leaveTeam = async () => { if (selectedTeam && window.UZSupa) { await window.UZSupa.leaveTeam(selectedTeam.id); await loadTeams(null); } };
  const handleUploadAvatar = async (file) => {
    if (!file || !window.UZSupa || !window.UZSupa.uploadAvatar) return;
    const url = await window.UZSupa.uploadAvatar(file);
    if (url) setProfile((p) => ({ ...(p || {}), avatarUrl: url }));
    else alert('Could not upload the photo. Make sure the "avatars" storage bucket is set up in Supabase (supabase-avatars.sql).');
  };
  const handleSaveProfile = (pp) => {
    setProfile((p) => ({ ...(p || {}), name: pp.name || (p && p.name), kcp: (pp.kcp != null ? pp.kcp : (p && p.kcp)) }));
    if (window.UZSupaEnabled && window.UZSupa) window.UZSupa.saveProfileBasic({ name: pp.name, kcp: pp.kcp }).catch((e) => console.warn('saveProfile', e && e.message));
  };
  // Lengkapi profil wajib (NIK + gender) untuk user lama yang datanya kosong.
  const handleCompleteProfile = (p) => {
    setProfile((prev) => ({ ...(prev || {}), nik: p.nik, gender: p.gender }));
    if (window.UZSupaEnabled && window.UZSupa) return window.UZSupa.saveProfileBasic({ nik: p.nik, gender: p.gender });
    return Promise.resolve();
  };

  const openLog = () => { setLogStep('manual'); setLogOpen(true); };
  const handleConnect = (brand) => {
    setWatchConnected(true);
    const b = brand ? (brand.includes('Apple') ? 'Apple Watch' : brand) : 'Strava';
    if (brand) setWatchBrand(b);
    // persist Strava/device link to this account so re-login won't ask again
    if (profile && window.UZStore) window.UZStore.saveUser(profile.email, profile.name, { stravaConnected: true, watchBrand: b });
    if (window.UZSupaEnabled && window.UZSupa) window.UZSupa.setConnection('strava', true).catch(() => {});
  };
  const handleSave = (run) => {
    justLoggedRef.current = true;   // izinkan perayaan setelah log run ini
    wRequestNotify();               // minta izin notifikasi (gesture user)
    // ID stabil → anti-dobel & sinkron lintas device (Supabase = sumber kebenaran).
    const extId = (run.source || 'manual') + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const nowIso = new Date().toISOString();
    const localRun = { ...run, when: run.when || 'Today', external_id: extId, recordedAt: nowIso };
    setExtra((e) => {
      const next = { km: e.km + run.km, runs: [localRun, ...e.runs], todayKm: e.todayKm + run.km, streakBonus: Math.max(1, e.streakBonus || 0) };
      // simpan langsung ke cadangan lokal supaya tidak hilang (refresh/logout)
      try { if (window.UZStore && profile && profile.email) window.UZStore.saveUser(profile.email, profile.name, { extra: next }); } catch (x) {}
      return next;
    });
    // Simpan ke Supabase (untuk validasi akhir tim): upload foto bukti dulu →
    // simpan jarak + photo_url + status validasi ke tabel uob_activities.
    if (window.UZSupaEnabled && window.UZSupa) {
      (async () => {
        // Pastikan sesi Supabase aktif dulu → data benar-benar tersimpan.
        try { if (window.UZSupa.ensureSession) await window.UZSupa.ensureSession(profile && profile.email); } catch (e) {}
        // Upload foto bukti dengan retry — pastikan SETIAP lari punya foto di
        // Supabase untuk validasi. Kalau tetap gagal, lari ditandai perlu ditinjau.
        let photoUrl = null;
        if (run.photoFile && window.UZSupa.uploadProof) {
          for (let attempt = 0; attempt < 3 && !photoUrl; attempt++) {
            try { photoUrl = await window.UZSupa.uploadProof(run.photoFile); } catch (e) {}
            if (!photoUrl && attempt < 2) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
          }
        }
        try {
          await window.UZSupa.insertRun({
            external_id: extId, recorded_at: nowIso,
            distance_km: run.km,
            duration_seconds: run.mins ? Math.round(run.mins * 60) : null,
            source: run.source || 'manual',
            photo_url: photoUrl,
            // Jangan tandai terverifikasi kalau fotonya gagal tersimpan → tim tinjau.
            proof_valid: photoUrl ? !!run.proofValid : false,
          });
        } catch (e) { console.warn('insertRun', e && e.message); }
      })();
    }
    setLastRun(run);
    setLogStep('success');
  };
  const handleComplete = (p) => {
    const saved = (window.UZStore && window.UZStore.loadUser(p.email, p.name)) || null;
    const stravaOn = !!p.connected || !!(saved && saved.stravaConnected);
    const brand = p.watchBrand || (saved && saved.watchBrand) || 'Strava';
    setProfile(p);
    setWatchConnected(stravaOn);
    setWatchBrand(brand);
    // Akun BARU (bukan existing/returning) → mulai BERSIH dari 0, jangan
    // mewarisi data lokal dari akun lain di perangkat ini.
    if (!p.existing && !p.returning) setExtra({ km: 0, runs: [], todayKm: 0, streakBonus: 0 });
    else if (saved && saved.extra) setExtra(saved.extra);
    // Returning/existing account → jangan munculkan tur fitur ("walkthrough").
    // Hanya akun baru yang belum pernah lihat yang mendapatkannya.
    if (p.existing || p.returning) { try { localStorage.setItem('uz_tour_done_' + String(p.email || '').toLowerCase(), '1'); } catch (e) {} }
    setAuthed(true);
    if (window.UZSupaEnabled && window.UZSupa) {
      window.UZSupa.saveProfileBasic({ name: p.name, phone: p.phone, team: p.team, kcp: p.kcp, nik: p.nik, gender: p.gender }).catch(() => {});
      if (p.goalsSet && p.targetKm) window.UZSupa.saveGoals({ cat: p.cat, targetKm: p.targetKm, weeklyTarget: p.weeklyTarget }).catch(() => {});
      // Tampilkan data Supabase (sumber kebenaran). Cadangan lokal hanya dipakai
      // kalau pembacaan Supabase gagal — tidak pernah didorong naik.
      wReconcile((saved && saved.extra) || null).then((rec) => { if (rec) setExtra(rec); }).catch(() => {});
    }
    if (window.UZStore) {
      window.UZStore.setSession(p.email, p.name);
      window.UZStore.saveUser(p.email, p.name, {
        profile: { name: p.name, email: p.email, phone: p.phone, kcp: p.kcp, team: p.team, cat: p.cat, targetKm: p.targetKm, weeklyTarget: p.weeklyTarget, existing: p.existing },
        goalsSet: !!(p.goalsSet || (saved && saved.goalsSet)),
        stravaConnected: stravaOn, watchBrand: brand,
        extra: (saved && saved.extra) || { km: 0, runs: [], todayKm: 0, streakBonus: 0 },
      });
    }
  };
  const handleLogout = () => {
    // Flush data terbaru ke cadangan lokal SEBELUM keluar — clearSession hanya
    // menghapus penanda sesi, BUKAN data lari. Jadi login ulang → data kembali.
    try { if (window.UZStore && profile && profile.email) window.UZStore.saveUser(profile.email, profile.name, { extra, stravaConnected: watchConnected, watchBrand }); } catch (e) {}
    if (window.UZStore) window.UZStore.clearSession();
    if (window.UZSupaEnabled && window.UZSupa) window.UZSupa.signOut();
    setAuthed(false); setProfile(null); setWatchConnected(false);
    setExtra({ km: 0, runs: [], todayKm: 0, streakBonus: 0 }); setScreen('Home');
  };

  // persist live state (runs logged, strava, goals) to this account
  React.useEffect(() => {
    if (!authed || !profile || !profile.email || !window.UZStore) return;
    window.UZStore.saveUser(profile.email, profile.name, {
      profile: { name: profile.name, email: profile.email, phone: profile.phone, kcp: profile.kcp, team: profile.team, cat: profile.cat, targetKm: profile.targetKm, weeklyTarget: profile.weeklyTarget, existing: profile.existing },
      goalsSet: true, stravaConnected: watchConnected, watchBrand, extra,
    });
  }, [authed, watchConnected, watchBrand, extra, profile]);

  // ── Perayaan + notifikasi achievement & streak ──────────────
  // Saat user log run dan meraih badge baru / milestone streak → tampilkan
  // congratulations di halaman + kirim notifikasi browser. Saat load awal,
  // status disinkron diam-diam (tanpa spam perayaan lama).
  React.useEffect(() => {
    if (!authed || !profile || !profile.email) return;
    const email = String(profile.email).toLowerCase();
    const metrics = {
      runs: extra.runs.length, streak, totalKm, target: targetKm,
      sleepStreak: window.UZSleepStreak ? window.UZSleepStreak(email) : 0,
    };
    const badges = window.computeBadges ? window.computeBadges(metrics) : [];
    const gotNames = badges.filter((b) => b.got).map((b) => b.name);
    const aKey = 'uz_ach_seen_' + email, sKey = 'uz_streak_seen_' + email;
    let seen = [], sSeen = 0;
    try { seen = JSON.parse(localStorage.getItem(aKey) || '[]'); } catch (e) {}
    try { sSeen = parseInt(localStorage.getItem(sKey) || '0', 10) || 0; } catch (e) {}
    const MILES = [3, 7, 14, 21, 30, 50, 100];
    const newStreak = MILES.filter((m) => streak >= m && m > sSeen);

    if (justLoggedRef.current) {
      const q = [];
      gotNames.filter((n) => !seen.includes(n)).forEach((n) => {
        const b = badges.find((x) => x.name === n);
        q.push({ type: 'achievement', icon: b.icon, title: b.name, body: (b.sub || 'New achievement') + ' 🎉' });
        wNotify('🏅 Achievement unlocked: ' + b.name, b.sub || '');
      });
      if (newStreak.length) {
        const top = Math.max.apply(null, newStreak);
        q.push({ type: 'streak', icon: 'flame', title: top + '-day streak!', body: "You're on fire — keep the momentum going! 🔥" });
        wNotify('🔥 ' + top + '-day streak!', 'Keep the momentum going!');
      }
      if (q.length) setCelebQueue((prev) => [...prev, ...q]);
      justLoggedRef.current = false;
    }
    // sinkron status (diam-diam saat load; mencegah perayaan ulang)
    try { localStorage.setItem(aKey, JSON.stringify(Array.from(new Set(seen.concat(gotNames))))); } catch (e) {}
    if (streak > sSeen) { try { localStorage.setItem(sKey, String(streak)); } catch (e) {} }
  }, [authed, extra, streak, totalKm, targetKm, profile]);

  // ── Pastikan sesi Supabase aktif setelah login (self-heal) ──
  // Kalau user "login" secara lokal tapi sesi Supabase belum/aktif lagi,
  // sign-in ulang via password turunan → lalu rekonsiliasi data supaya
  // BENAR-BENAR tersimpan & sinkron ke Supabase.
  React.useEffect(() => {
    if (!authed || !window.UZSupaEnabled || !window.UZSupa || !profile || !profile.email) return;
    let alive = true;
    (async () => {
      try {
        const ok = window.UZSupa.ensureSession ? await window.UZSupa.ensureSession(profile.email) : true;
        if (ok && alive) {
          const local = wEnsureRunIds(wLocalExtra(profile));
          const rec = await wReconcile(local);
          if (alive && rec) setExtra(rec);
        }
      } catch (e) {}
    })();
    return () => { alive = false; };
  }, [authed, profile && profile.email]);
  // Strava real-sync (online): tukar pending code (full-redirect) lalu
  // background sync diam-diam maks 1x/jam. Demo mode tidak melakukan apa-apa.
  React.useEffect(() => {
    if (!authed) return;
    // Demo / offline (tanpa Supabase): kalau baru kembali dari OAuth Strava
    // (full-redirect) tandai terhubung supaya koneksi langsung tercermin.
    if (!window.UZSupaEnabled || !window.UZSupa) {
      try {
        const pending = localStorage.getItem('strava_pending_code');
        const flag = localStorage.getItem('strava_connected');
        if (pending || flag === '1') {
          localStorage.removeItem('strava_pending_code');
          handleConnect('Strava');
        }
      } catch (e) {}
      return;
    }
    let alive = true;
    (async () => {
      try {
        let pending = null;
        try { pending = localStorage.getItem('strava_pending_code'); } catch (e) {}
        if (pending) {
          try { localStorage.removeItem('strava_pending_code'); } catch (e) {}
          await window.UZSupa.exchangeStravaCode(pending);
          if (alive) { setWatchConnected(true); setWatchBrand('Strava'); }
        } else if (watchConnected) {
          await window.UZSupa.silentStravaSync();
        }
      } catch (e) { /* silent */ }
    })();
    return () => { alive = false; };
  }, [authed]);

  React.useEffect(() => {
    if (t.skipAuth && !authed) { setProfile({ name: 'Demo User', team: '', cat: '10K', kcp: '', targetKm: 150, weeklyTarget: 22, existing: true, goalsSet: true }); setAuthed(true); }
  }, [t.skipAuth]);

  // Restore session on refresh — jangan langsung sign out kalau reload.
  // 1) Coba sesi Supabase (berlaku LINTAS PERANGKAT setelah verifikasi sekali):
  //    selama token masih ada, user tetap login tanpa sign-in ulang, dan
  //    seluruh riwayat lari ditarik langsung dari Supabase.
  // 2) Fallback: sesi lokal (UZStore) untuk mode demo / offline.
  React.useEffect(() => {
    if (authed) return;
    let alive = true;
    (async () => {
      try {
        const st = await wLoadSupabaseState();
        if (!alive) return;
        if (st && st.profile) {
          setProfile(st.profile);
          setWatchConnected(!!st.watchConnected);
          setWatchBrand(st.watchBrand || 'Strava');
          // Tampilkan cepat dulu, lalu REKONSILIASI ke Supabase (sumber kebenaran)
          // sambil mendorong naik lari yang hanya ada di lokal → konsisten di semua device.
          const localExtra0 = wLocalExtra(st.profile);
          setExtra(st.extra || localExtra0 || { km: 0, runs: [], todayKm: 0, streakBonus: 0 });
          wReconcile(localExtra0).then((rec) => { if (alive && rec) setExtra(rec); }).catch(() => {});
          setAuthed(true);
          restoreScreen();   // refresh → kembali ke halaman terakhir
          if (window.UZStore && st.profile.email) window.UZStore.setSession(st.profile.email, st.profile.name);
          return;
        }
      } catch (e) {}
      if (!alive) return;
      // Fallback lokal (demo/offline)
      try {
        var sess = window.UZStore && window.UZStore.getSession && window.UZStore.getSession();
        if (!sess || !sess.email) return;
        var saved = window.UZStore.loadUser(sess.email, sess.name);
        if (!saved || !saved.profile) return;
        var pr = saved.profile;
        setProfile({ name: pr.name, email: pr.email, phone: pr.phone, kcp: pr.kcp, team: pr.team, cat: pr.cat, targetKm: pr.targetKm, weeklyTarget: pr.weeklyTarget, existing: pr.existing, goalsSet: !!saved.goalsSet });
        if (saved.stravaConnected) { setWatchConnected(true); setWatchBrand(saved.watchBrand || 'Strava'); }
        if (saved.extra) setExtra(saved.extra);
        setAuthed(true);
        restoreScreen();   // refresh → kembali ke halaman terakhir
      } catch (e) {}
    })();
    return () => { alive = false; };
  }, []);
  // ?demo=1 → land straight on the dashboard (used by the responsive showcase mockup)
  React.useEffect(() => {
    try {
      if ((new URLSearchParams(location.search).get('demo') === '1' || location.hash.indexOf('demo') !== -1) && !authed) {
        setProfile({ name: 'Demo User', team: '', cat: '10K', kcp: '', targetKm: 150, weeklyTarget: 22, existing: true, goalsSet: true });
        setWatchConnected(true); setWatchBrand('Strava'); setAuthed(true);
      }
    } catch (e) {}
  }, []);

  const tweaksPanel = (
    <TweaksPanel>
      <TweakSection label="Onboarding" />
      <TweakToggle label="Skip to home" value={!!t.skipAuth} onChange={(v) => setTweak('skipAuth', v)} />
      <TweakSection label="Event" />
      <TweakText label="Event name" value={t.raceName} onChange={(v) => setTweak('raceName', v)} />
      <TweakText label="Date (YYYY-MM-DD)" value={t.raceISO} onChange={(v) => setTweak('raceISO', v)} />
      <TweakNumber label="Training target (km)" value={t.targetKm} min={20} max={400} step={10} onChange={(v) => setTweak('targetKm', v)} />
      <TweakSection label="Color" />
      <TweakColor label="Heartbeat accent" value={t.red} options={['#F4253C', '#E2231A', '#FF5A1F', '#EC4899']} onChange={(v) => setTweak('red', v)} />
      <TweakColor label="UOB blue" value={t.blue} options={['#0060C0', '#0B3D91', '#1466B8']} onChange={(v) => setTweak('blue', v)} />
      <TweakSection label="Typography" />
      <TweakRadio label="Font" value={t.fontPair} options={Object.keys(W_FONTS)} onChange={(v) => setTweak('fontPair', v)} />
    </TweaksPanel>
  );

  if (!authed) {
    return (<React.Fragment><OnboardingGate onComplete={handleComplete} />{tweaksPanel}</React.Fragment>);
  }

  // Profile completion gate removed: NIK & gender are already collected during
  // sign-up onboarding, so returning users are no longer asked to fill them
  // again here — they go straight into the app after login.

  return (
    <div className="app-web">
      <Sidebar active={screen} goTo={setScreen} onLog={openLog} name={userName} sub={(data.team ? data.team + ' · ' : '') + data.cat} avatarUrl={data.avatarUrl} />
      <main className="main">
        <div className={'content content--' + screen} key={screen}>
          {screen === 'Home' && <HomeScreen data={data} onLog={openLog} onConnect={() => setScreen('Profile')} onProfile={() => setScreen('Profile')} goTo={setScreen} onEditGoal={() => setGoalEdit(true)} onBell={() => setNotifOpen(true)} notifCount={invite ? 1 : 0} />}
          {screen === 'Progress' && <ProgressScreen data={data} />}
          {screen === 'Leaderboard' && <LeaderboardScreen myTodayKm={data.myTodayKm} meName={userName} meAvatar={data.avatarUrl} meKcp={data.kcp} meTeam={data.team} meTotalKm={data.totalKm} meGender={data.gender} meNik={data.nik} meId={meUserId} teams={teams} team={selectedTeam} teamMemberIds={teamMemberIds} meIsOwner={!!(selectedTeam && meUserId && selectedTeam.owner_id === meUserId)} onSelectTeam={setSelTeamId} onCreateTeam={() => setCreateTeamOpen(true)} onShareTeam={() => selectedTeam && wShareTeam(selectedTeam)} onRenameTeam={renameTeam} onDeleteTeam={deleteTeam} onLeaveTeam={leaveTeam} />}
          {screen === 'Profile' && <WebProfile data={data} onConnect={openLog} onLogout={handleLogout} onEditGoal={() => setGoalEdit(true)} onSaveProfile={handleSaveProfile} team={selectedTeam} teams={teams} onCreateTeam={() => setCreateTeamOpen(true)} onShareTeam={() => selectedTeam && wShareTeam(selectedTeam)} onUploadAvatar={handleUploadAvatar} onShareRun={(r) => setShareRun(r)} />}
        </div>
      </main>
      <TabBar active={screen} goTo={setScreen} onLog={openLog} />
      <LogSheet
        open={logOpen} step={logStep} setStep={setLogStep}
        connected={watchConnected} brand={watchBrand} onConnect={handleConnect}
        onSave={handleSave} lastRun={lastRun} totalKm={totalKm} targetKm={targetKm} streak={streak}
        onClose={() => setLogOpen(false)}
      />
      {tweaksPanel}
      <GoalEditSheet open={goalEdit} initial={{ cat: data.cat, targetKm: data.targetKm, weeklyTarget: data.weeklyTarget, daysLeft: data.daysLeft }} onClose={() => setGoalEdit(false)} onSave={handleSaveGoal} />
      {celebQueue.length > 0 && <Celebration item={celebQueue[0]} onClose={() => setCelebQueue((q) => q.slice(1))} />}
      <NotifPanel open={notifOpen} invite={invite} onClose={() => setNotifOpen(false)} onOpenInvite={() => setNotifOpen(false)} />
      <TeamInviteModal invite={invite} onJoin={acceptInvite} onDeny={denyInvite} />
      <CreateTeamModal open={createTeamOpen} onClose={() => setCreateTeamOpen(false)} onCreate={createTeam} />
      {tourOpen && <FeatureTour steps={W_TOUR} onDone={finishTour} />}
      {shareRun && window.StoryComposer && <window.StoryComposer run={shareRun} photo={shareRun.photo || null} onClose={() => setShareRun(null)} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<WebApp />);
