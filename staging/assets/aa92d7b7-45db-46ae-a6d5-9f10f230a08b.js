// progress.jsx — Progress screen: stats, weekly chart, streak, badges
const { Icon: PIcon, StatTile: PStat, fmt: PFmt } = window;

// ── Sleep tracking ───────────────────────────────────────────
// Jam tidur diisi MANUAL oleh user, disimpan per-akun di localStorage
// (key per tanggal). Dipakai untuk: recap, badge "Well Rested", dan
// menyesuaikan intensitas workout to-do harian (Race Plan).
const SLEEP_TARGET = 7; // jam minimum untuk dianggap "istirahat cukup"
function wSleepKey(email) { return 'uz_sleep_' + ((email || 'anon').toString().toLowerCase()); }
function wDateKey(d) {
  const x = d ? new Date(d) : new Date(); x.setHours(0, 0, 0, 0);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
}
function wLoadSleep(email) { try { return JSON.parse(localStorage.getItem(wSleepKey(email)) || '{}') || {}; } catch (e) { return {}; } }
// Streak = jumlah hari berturut-turut (mundur dari hari ini) yang tidurnya ≥ target.
function wSleepStreak(log) {
  if (!log) return 0; let n = 0; const cur = new Date(); cur.setHours(0, 0, 0, 0);
  while (true) { const v = log[wDateKey(cur)]; if (typeof v === 'number' && v >= SLEEP_TARGET) { n++; cur.setDate(cur.getDate() - 1); } else break; }
  return n;
}
function wSleepWeekAvg(log) {
  if (!log) return 0; let sum = 0, c = 0; const cur = new Date(); cur.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) { const v = log[wDateKey(cur)]; if (typeof v === 'number') { sum += v; c++; } cur.setDate(cur.getDate() - 1); }
  return c ? sum / c : 0;
}
// Dipakai juga oleh app-web (perayaan badge) lewat window.
window.UZSleepStreak = function (email) { return wSleepStreak(wLoadSleep(email)); };

// ── Hydration tracking ───────────────────────────────────────
// Air minum diisi MANUAL (per akun, per tanggal, satuan liter). Target 2L/hari.
const WATER_TARGET = 2; // liter
function wWaterKey(email) { return 'uz_water_' + ((email || 'anon').toString().toLowerCase()); }
function wLoadWater(email) { try { return JSON.parse(localStorage.getItem(wWaterKey(email)) || '{}') || {}; } catch (e) { return {}; } }

function WeeklyChart({ weeks, target }) {
  const maxV = Math.max(target, ...weeks.map((w) => w.km)) * 1.1 || 1;
  const [sel, setSel] = React.useState(weeks.length - 1);
  const selWeek = weeks[sel] || weeks[weeks.length - 1];
  return (
    <div style={{ background: 'var(--card)', borderRadius: 22, border: '1px solid var(--line)', padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>Weekly Distance</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 11.5, color: 'var(--muted)' }}>
          <span style={{ width: 14, height: 0, borderTop: '2px dashed var(--red)' }} /> target {target} km
        </span>
      </div>
      {/* selected week readout */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 23, color: 'var(--blue)', letterSpacing: -0.5 }}>{PFmt.km(selWeek.km)} km</span>
        <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5, color: 'var(--muted)' }}>· {selWeek.label}{selWeek.km >= target ? ' · target reached ✓' : ` · ${PFmt.km(Math.max(0, target - selWeek.km))} km to target`}</span>
      </div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 9, height: 130 }}>
        {/* target line */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${(target / maxV) * 100}%`, borderTop: '2px dashed rgba(244,37,60,0.45)', zIndex: 1 }} />
        {weeks.map((w, i) => {
          const h = (w.km / maxV) * 100;
          const on = i === sel;
          return (
            <button key={i} onClick={() => setSel(i)} title={`${w.label}: ${PFmt.km(w.km)} km`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <span style={{ fontFamily: 'var(--font-num)', fontWeight: 500, fontSize: 10.5, color: on ? 'var(--blue)' : 'var(--muted)', marginBottom: 4 }}>{PFmt.km0(w.km)}</span>
              <div style={{
                width: '100%', maxWidth: 26, height: `${h}%`, borderRadius: 7, transition: 'background .15s',
                background: on ? 'linear-gradient(var(--blue-bright), var(--blue))' : 'rgba(0,96,192,0.16)',
                outline: on ? '2px solid var(--blue)' : 'none', outlineOffset: 2,
              }} />
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 9, marginTop: 8 }}>
        {weeks.map((w, i) => (
          <span key={i} onClick={() => setSel(i)} style={{ flex: 1, textAlign: 'center', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: i === sel ? 800 : 600, fontSize: 10.5, color: i === sel ? 'var(--blue)' : 'var(--muted)' }}>{w.label}</span>
        ))}
      </div>
    </div>
  );
}

// Badge definitions — `got` dihitung dari data NYATA milik user
// (bukan di-hardcode), supaya user baru mulai dari 0/6 dan badge
// hanya menyala saat benar-benar tercapai dari aktivitas yang ia input.
const BADGE_DEFS = [
  { icon: 'bolt', name: 'First Run', sub: 'Your first run', test: (s) => s.runs >= 1 },
  { icon: 'flame', name: 'Streak 7', sub: '7 day streak', test: (s) => s.streak >= 7 },
  { icon: 'medal', name: '50 KM', sub: '50 km cumulative', test: (s) => s.totalKm >= 50 },
  { icon: 'moon', name: 'Well Rested', sub: '7h+ sleep · 7-day streak', test: (s) => (s.sleepStreak || 0) >= 7 },
  { icon: 'target', name: '100 KM', sub: '100 km cumulative', test: (s) => s.totalKm >= 100 },
  { icon: 'trophy', name: 'Race Ready', sub: 'Reach your target', test: (s) => s.target > 0 && s.totalKm >= s.target },
];

// Tier lanjutan: terbuka HANYA setelah 6 badge dasar lengkap, supaya user
// selalu punya target baru sambil menunggu race day tiba.
const BONUS_BADGE_DEFS = [
  { icon: 'medal', name: 'Double Century', sub: '200 km cumulative', test: (s) => s.totalKm >= 200 },
  { icon: 'run', name: 'Long Hauler', sub: 'A single 15 km run', test: (s) => s.longest >= 15 },
  { icon: 'flame', name: 'Iron Streak', sub: '14 day streak', test: (s) => s.streak >= 14 },
  { icon: 'bolt', name: 'Half Marathon', sub: 'A single 21 km run', test: (s) => s.longest >= 21 },
  { icon: 'target', name: 'Triple Century', sub: '300 km cumulative', test: (s) => s.totalKm >= 300 },
  { icon: 'trophy', name: 'Unstoppable', sub: '30 day streak', test: (s) => s.streak >= 30 },
];

// Target jarak yang selalu bergulir: kelipatan 50 km berikutnya di atas total
// saat ini (minimal 150, karena 100 km sudah jadi badge dasar). Begitu tercapai,
// otomatis maju ke milestone berikutnya — jadi target tidak pernah habis.
function nextDistanceGoal(totalKm) {
  return Math.max(150, (Math.floor((Number(totalKm) || 0) / 50) + 1) * 50);
}

// Hitung status badge dari stats user (runs/streak/totalKm/target/sleepStreak).
function computeBadges(metrics) {
  return BADGE_DEFS.map((b) => ({ ...b, got: !!b.test(metrics) }));
}

function Badges({ badges }) {
  const BADGES = badges || BADGE_DEFS.map((b) => ({ ...b, got: false }));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
      {BADGES.map((b, i) => (
        <div key={i} style={{
          background: 'var(--card)', borderRadius: 18, border: '1px solid var(--line)', padding: '16px 8px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: b.got ? 1 : 0.5,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: b.got ? 'linear-gradient(135deg, var(--blue), var(--red))' : 'rgba(2,32,71,0.07)',
          }}>
            <PIcon name={b.icon} size={24} color={b.got ? '#fff' : 'var(--muted)'} stroke={2} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5, color: 'var(--ink)', textAlign: 'center' }}>{b.name}</div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.3 }}>{b.sub}</div>
        </div>
      ))}
    </div>
  );
}

// Rencana latihan mingguan menuju goal (4K / 10K). Tiap minggu punya
// target km + fokus; status dihitung dari akumulasi jarak nyata.
const WEEKLY_PLANS = {
  '5K': { dist: '5 KM', weeks: [
    { km: 9, focus: 'Adaptasi — lari–jalan 3x seminggu' },
    { km: 11, focus: 'Tambah durasi, tetap santai' },
    { km: 13, focus: 'Lari kontinu 3 km tanpa berhenti' },
    { km: 15, focus: 'Lari kontinu 4 km' },
    { km: 17, focus: 'Long run puncak 6 km' },
    { km: 10, focus: 'Taper ringan + race day 5 km 🏁' },
  ] },
  '10K': { dist: '10 KM', weeks: [
    { km: 14, focus: 'Base — lari 4–5 km, 3x seminggu' },
    { km: 16, focus: 'Base + tambah 1 sesi' },
    { km: 18, focus: 'Long run 6 km' },
    { km: 20, focus: 'Long run 7 km' },
    { km: 22, focus: 'Long run 8 km' },
    { km: 24, focus: 'Long run 9 km + sesi tempo' },
    { km: 24, focus: 'Long run 11 km + tempo' },
    { km: 12, focus: 'Taper + race day 10 km 🏁' },
  ] },
};

// ── Rencana balapan 15 minggu (data: window.RACE_PLAN15) ─────
// Muncul hanya ≤ 15 minggu sebelum race. Tiap hari punya
// Run / Makan / Wind-Down yang bisa dicentang sendiri.
const PHASE_OF = (wk) => wk <= 4 ? { name: 'Base', sleep: '7–8 hrs', color: '#0E9F6E' }
  : wk <= 9 ? { name: 'Build', sleep: '8–9 hrs', color: '#0060C0' }
  : wk <= 12 ? { name: 'Peak', sleep: '8–9 hrs', color: '#F4253C' }
  : wk <= 14 ? { name: 'Taper', sleep: '7–8 hrs', color: '#9333EA' }
  : { name: 'Race Week', sleep: '7–8 hrs', color: '#E8B339' };
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PLAN_CATS = [
  { id: 'run', emoji: '🏃', cat: 'Run', key: 'run' },
  { id: 'water', emoji: '💧', cat: 'Hydration', key: 'water' },
  { id: 'eat', emoji: '🥗', cat: 'Nutrition', key: 'eat' },
  { id: 'wind', emoji: '🌙', cat: 'Wind-Down', key: 'wind' },
];

// Kotak input tidur manual + recap 7 hari. Memengaruhi badge & workout to-do.
function SleepCard({ sleepLog, onLog, restTarget }) {
  const todayKey = wDateKey();
  const logged = sleepLog[todayKey];
  const [val, setVal] = React.useState(typeof logged === 'number' ? String(logged) : '7.5');
  const [editing, setEditing] = React.useState(typeof logged !== 'number');
  const hrs = Math.max(0, Math.min(24, parseFloat(String(val).replace(',', '.')) || 0));
  const streak = wSleepStreak(sleepLog);
  const avg = wSleepWeekAvg(sleepLog);
  const target = restTarget || SLEEP_TARGET;

  const days = [];
  const cur = new Date(); cur.setHours(0, 0, 0, 0);
  for (let i = 6; i >= 0; i--) { const d = new Date(cur); d.setDate(d.getDate() - i); days.push({ label: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()], v: sleepLog[wDateKey(d)] }); }
  const maxBar = Math.max(9, ...days.map((d) => d.v || 0));
  const save = () => { if (hrs <= 0) return; onLog(hrs); setEditing(false); };

  return (
    <div style={{ background: 'var(--card)', borderRadius: 22, border: '1px solid var(--line)', padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(147,51,234,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PIcon name="moon" size={17} color="#9333EA" stroke={2.2} />
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>Sleep</span>
        </span>
        {streak > 0 && <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: '#9333EA' }}>🔥 {streak}-day streak</span>}
      </div>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.45 }}>Log last night’s sleep — your workout plan adapts to your rest. Target {target}h+.</div>

      {editing ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <input value={val} inputMode="decimal" aria-label="Hours slept"
              onChange={(e) => setVal(e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '').slice(0, 4))}
              onFocus={(e) => e.target.select()}
              style={{ width: '2.6em', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38, color: 'var(--ink)', letterSpacing: -1, border: 'none', borderBottom: '2px solid #9333EA', background: 'transparent', outline: 'none', padding: '0 0 3px' }} />
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 15, color: 'var(--muted)' }}>hours last night</span>
          </div>
          <div style={{ display: 'flex', gap: 7, marginTop: 12 }}>
            {[5, 6, 7, 8, 9].map((q) => (
              <button key={q} onClick={() => setVal(String(q))} style={{ flex: 1, cursor: 'pointer', borderRadius: 10, padding: '7px 0', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5, border: hrs === q ? '1.5px solid #9333EA' : '1px solid var(--line)', background: hrs === q ? 'rgba(147,51,234,0.07)' : 'transparent', color: hrs === q ? '#9333EA' : 'var(--muted)' }}>{q}h</button>
            ))}
          </div>
          <button onClick={save} disabled={hrs <= 0} style={{ width: '100%', marginTop: 12, border: 'none', cursor: hrs > 0 ? 'pointer' : 'not-allowed', borderRadius: 14, padding: '13px 0', background: hrs > 0 ? '#9333EA' : 'rgba(2,32,71,0.12)', color: hrs > 0 ? '#fff' : 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15 }}>Save sleep</button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: logged >= target ? 'rgba(14,159,110,0.08)' : 'rgba(244,37,60,0.06)', borderRadius: 14, padding: '13px 15px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11, color: 'var(--muted)', letterSpacing: 0.3 }}>LAST NIGHT</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 2 }}>
              <span style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 24, color: 'var(--ink)' }}>{logged}</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, color: 'var(--muted)' }}>h</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: logged >= target ? '#0E7A52' : '#C81030', marginLeft: 6 }}>{logged >= target ? 'Well rested ✓' : 'Below target'}</span>
            </div>
          </div>
          <button onClick={() => { setVal(String(logged)); setEditing(true); }} style={{ cursor: 'pointer', border: '1px solid var(--line)', background: 'var(--card)', borderRadius: 10, padding: '8px 14px', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5, color: 'var(--blue)' }}>Edit</button>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11.5, color: 'var(--muted)', letterSpacing: 0.3 }}>LAST 7 DAYS</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: 'var(--muted)' }}>avg {avg ? avg.toFixed(1) : '—'}h</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 56 }}>
          {days.map((d, i) => {
            const has = typeof d.v === 'number';
            const h = has ? Math.max(8, Math.round((d.v / maxBar) * 48)) : 4;
            const ok = has && d.v >= target;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontFamily: 'var(--font-num)', fontSize: 9, color: 'var(--muted)' }}>{has ? d.v : ''}</span>
                <div style={{ width: '100%', maxWidth: 22, height: h, borderRadius: 6, background: has ? (ok ? '#9333EA' : 'rgba(147,51,234,0.35)') : 'rgba(2,32,71,0.08)' }} />
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9.5, fontWeight: 600, color: 'var(--muted)' }}>{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Tombol kontrol air.
function waterBtn(ghost) {
  return { flex: 1, cursor: 'pointer', borderRadius: 12, padding: '10px 0', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5,
    border: ghost ? '1px solid var(--line)' : 'none', background: ghost ? 'transparent' : 'var(--blue)', color: ghost ? 'var(--muted)' : '#fff' };
}
// Meter air beranimasi (gelombang bergerak) + input manual. Target 2L/hari.
function WaterCard({ liters, onSet, target }) {
  const tgt = target || WATER_TARGET;
  const L = Math.max(0, Math.round((liters || 0) * 100) / 100);
  const pct = Math.max(0, Math.min(1, L / tgt));
  const done = L >= tgt;
  const add = (ml) => onSet(Math.max(0, Math.round((L + ml / 1000) * 100) / 100));
  const surf = 154 - pct * 148; // y permukaan air dalam viewBox 0..160

  return (
    <div style={{ background: 'var(--card)', borderRadius: 22, border: '1px solid var(--line)', padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(0,96,192,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💧</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>Hydration</span>
        </span>
        <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: done ? '#0E7A52' : 'var(--muted)' }}>{done ? 'Goal reached ✓' : Math.round(pct * 100) + '%'}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.45 }}>Tap to log your water — aim for {tgt} L a day. 💪</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        {/* meter air beranimasi */}
        <div style={{ width: 92, height: 150, position: 'relative', flexShrink: 0 }}>
          <svg viewBox="0 0 100 160" width="92" height="150" style={{ display: 'block' }}>
            <defs>
              <clipPath id="uzWaterCyl"><rect x="3" y="3" width="94" height="154" rx="22" /></clipPath>
              <linearGradient id="uzWaterFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#3B82F6" /><stop offset="1" stopColor="#0A56AE" />
              </linearGradient>
            </defs>
            <rect x="3" y="3" width="94" height="154" rx="22" fill="rgba(0,96,192,0.06)" stroke="var(--line)" />
            {L > 0 && (
              <g clipPath="url(#uzWaterCyl)">
                <g transform={'translate(0 ' + surf + ')'}>
                  <path d="M0,8 q25,-8 50,0 t50,0 t50,0 t50,0 L200,170 L0,170 Z" fill="url(#uzWaterFill)">
                    <animateTransform attributeName="transform" type="translate" from="0 0" to="-100 0" dur="2.4s" repeatCount="indefinite" />
                  </path>
                  <path d="M0,8 q25,-8 50,0 t50,0 t50,0 t50,0 L200,170 L0,170 Z" fill="#5B9BF6" opacity="0.5">
                    <animateTransform attributeName="transform" type="translate" from="-100 0" to="0 0" dur="3.2s" repeatCount="indefinite" />
                  </path>
                </g>
              </g>
            )}
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: pct > 0.5 ? '#fff' : 'var(--ink)', textShadow: pct > 0.5 ? '0 1px 3px rgba(0,0,0,0.25)' : 'none' }}>{L}L</span>
          </div>
        </div>

        {/* kontrol manual */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 26, color: 'var(--blue)', letterSpacing: -0.5 }}>{L}</span>
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, color: 'var(--muted)' }}>/ {tgt} L</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button onClick={() => add(250)} style={waterBtn(false)}>+250 ml</button>
            <button onClick={() => add(500)} style={waterBtn(false)}>+500 ml</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => add(-250)} style={waterBtn(true)}>− 250 ml</button>
            <button onClick={() => onSet(0)} style={waterBtn(true)}>Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeeklyPlan({ data, sleep }) {
  const daysLeft = data.daysLeft;
  const weeksLeft = Math.ceil(daysLeft / 7);
  const currentWeek = 16 - weeksLeft;              // 1..15
  const STORE = 'uob_raceplan_v2';
  const plan = window.RACE_PLAN15 || [];

  // sebelum jendela 15 minggu → belum tampil
  if (currentWeek < 1) {
    const startInDays = daysLeft - 15 * 7;
    return (
      <div style={{ background: 'var(--card)', borderRadius: 22, border: '1px solid var(--line)', padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(0,96,192,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PIcon name="calendar" size={18} color="var(--blue)" stroke={2.2} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5, color: 'var(--ink)' }}>15-Week Race Plan</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>Your training checklist unlocks in {startInDays} days (15 weeks before race day).</div>
          </div>
        </div>
      </div>
    );
  }

  const wk = Math.min(15, currentWeek);
  const idx = wk - 1;
  const phase = PHASE_OF(wk);
  const weekDays = plan[idx] || [];
  const todayDow = (new Date().getDay() + 6) % 7;  // 0 = Senin … 6 = Minggu

  const [sel, setSel] = React.useState(Math.min(6, Math.max(0, todayDow)));
  const day = weekDays[sel] || { run: '—', eat: '—', wind: '—' };

  // Penyesuaian intensitas workout dari tidur tadi malam (Race Plan adaptif).
  const restTarget = parseInt(phase.sleep, 10) || SLEEP_TARGET;
  const sleptToday = (sleep && typeof sleep.today === 'number') ? sleep.today
    : (function () { const v = wLoadSleep(data.email)[wDateKey()]; return typeof v === 'number' ? v : null; })();
  let sleepAdj = null, runText = day.run;
  if (sel === todayDow) {
    if (sleptToday == null) sleepAdj = { tone: 'info', text: 'Log last night’s sleep to tailor today’s session.' };
    else if (sleptToday >= restTarget) sleepAdj = { tone: 'good', text: 'Well rested (' + sleptToday + 'h) — go for the full session 💪' };
    else if (sleptToday >= restTarget - 1.5) { sleepAdj = { tone: 'warn', text: 'A bit short on sleep (' + sleptToday + 'h) — keep it easy & aim for ' + restTarget + 'h+ tonight.' }; runText = day.run + ' · dial back the intensity'; }
    else { sleepAdj = { tone: 'bad', text: 'Low on rest (' + sleptToday + 'h) — recover today, prioritise ' + restTarget + 'h+ tonight.' }; runText = 'Easy recovery jog 20–30 min or rest — you’re low on sleep'; }
  }
  // Hidrasi hari ini (liter) untuk to-do "Drink 2L of water".
  const waterToday = (function () { const v = wLoadWater(data.email)[wDateKey()]; return typeof v === 'number' ? v : 0; })();

  const [checks, setChecks] = React.useState(() => {
    try { return (JSON.parse(localStorage.getItem(STORE) || '{}')['w' + wk]) || {}; } catch (e) { return {}; }
  });
  const dayChecks = checks[sel] || {};
  const toggle = (catId) => setChecks((prev) => {
    const d = { ...(prev[sel] || {}), [catId]: !(prev[sel] || {})[catId] };
    const next = { ...prev, [sel]: d };
    try { const all = JSON.parse(localStorage.getItem(STORE) || '{}'); all['w' + wk] = next; localStorage.setItem(STORE, JSON.stringify(all)); } catch (e) {}
    return next;
  });
  // Water to-do auto-tercentang saat sudah minum ≥ 2L (dari water meter).
  const catOn = (c) => c.id === 'water' ? (!!dayChecks[c.id] || (sel === todayDow && waterToday >= WATER_TARGET)) : !!dayChecks[c.id];
  const catText = (c) => c.id === 'run' ? runText
    : c.id === 'water' ? ('Drink at least 2 L of water' + (sel === todayDow ? '  ·  ' + (Math.round(waterToday * 100) / 100) + ' / 2 L' : ''))
    : day[c.key];
  const dayDone = PLAN_CATS.filter((c) => catOn(c)).length;

  return (
    <div style={{ background: 'var(--card)', borderRadius: 22, border: '1px solid var(--line)', padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>Race Plan · Week {wk}/15</span>
        <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, color: 'var(--blue)' }}>{dayDone}/{PLAN_CATS.length}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '2px 0 12px' }}>
        <span style={{ padding: '2px 9px', borderRadius: 999, background: phase.color, color: '#fff', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 10, letterSpacing: 0.4, textTransform: 'uppercase' }}>{phase.name}</span>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--muted)' }}>Sleep target {phase.sleep}</span>
      </div>

      {/* strip 15 minggu */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
        {Array.from({ length: 15 }).map((_, i) => {
          const done = i < idx; const isCur = i === idx; const ph = PHASE_OF(i + 1);
          return <div key={i} style={{ flex: 1, height: 6, borderRadius: 4, background: (done || isCur) ? ph.color : 'rgba(2,32,71,0.1)', opacity: done ? 0.4 : 1 }} />;
        })}
      </div>

      {/* pemilih hari */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
        {weekDays.map((d, i) => {
          const on = i === sel; const isToday = i === todayDow;
          return (
            <button key={i} onClick={() => setSel(i)} style={{
              flex: 1, cursor: 'pointer', borderRadius: 11, padding: '8px 0 6px', position: 'relative',
              border: on ? '1.5px solid var(--blue)' : '1px solid var(--line)',
              background: on ? 'var(--blue)' : 'var(--card)',
              fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11.5, color: on ? '#fff' : 'var(--muted)',
            }}>
              {d.d}
              {isToday && <span style={{ position: 'absolute', top: 4, right: 5, width: 5, height: 5, borderRadius: '50%', background: on ? '#fff' : 'var(--red)' }} />}
            </button>
          );
        })}
      </div>
      <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
        {DAY_FULL[sel]}{sel === todayDow ? ' · today' : ''}
      </div>

      {/* banner penyesuaian dari tidur */}
      {sleepAdj && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 12, marginBottom: 10,
          background: sleepAdj.tone === 'good' ? 'rgba(14,159,110,0.09)' : sleepAdj.tone === 'warn' ? 'rgba(232,179,57,0.13)' : sleepAdj.tone === 'bad' ? 'rgba(244,37,60,0.08)' : 'rgba(0,96,192,0.06)' }}>
          <span style={{ fontSize: 15, lineHeight: 1.2 }}>{sleepAdj.tone === 'good' ? '😴' : sleepAdj.tone === 'bad' ? '🛌' : sleepAdj.tone === 'warn' ? '⚠️' : '🌙'}</span>
          <span style={{ flex: 1, fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 12, color: 'var(--ink)', lineHeight: 1.45 }}>{sleepAdj.text}</span>
        </div>
      )}

      {/* checklist Run / Hydration / Nutrition / Wind-down */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PLAN_CATS.map((c) => {
          const on = catOn(c);
          return (
            <button key={c.id} onClick={() => toggle(c.id)} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start', textAlign: 'left', cursor: 'pointer', width: '100%',
              padding: '11px 12px', borderRadius: 14,
              border: on ? '1px solid rgba(0,96,192,0.25)' : '1px solid var(--line)',
              background: on ? 'rgba(0,96,192,0.05)' : 'var(--card)', transition: 'all .15s',
            }}>
              <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.2, filter: on ? 'none' : 'grayscale(0.4)' }}>{c.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11, color: c.id === 'run' ? 'var(--blue)' : c.id === 'water' ? '#0060C0' : 'var(--muted)', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 2 }}>{c.cat}</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 13, color: 'var(--ink)', textDecoration: on ? 'line-through' : 'none', opacity: on ? 0.6 : 1, lineHeight: 1.4 }}>{catText(c)}</div>
              </div>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: on ? 'var(--blue)' : 'transparent', border: on ? 'none' : '2px solid rgba(2,32,71,0.2)',
              }}>
                {on && <PIcon name="check" size={14} color="#fff" stroke={3} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Gabungan kartu Hydration + Sleep (dipakai di Home & Progress).
function WellnessCards({ sleepLog, waterLog, onLogSleep, onSetWater, daysLeft }) {
  const weeksLeft = Math.ceil((daysLeft || 0) / 7);
  const restTarget = parseInt(PHASE_OF(Math.min(15, Math.max(1, 16 - weeksLeft))).sleep, 10) || SLEEP_TARGET;
  const todayWater = (waterLog || {})[wDateKey()] || 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <WaterCard liters={todayWater} onSet={onSetWater} target={WATER_TARGET} />
      <SleepCard sleepLog={sleepLog || {}} onLog={onLogSleep} restTarget={restTarget} />
    </div>
  );
}

function ProgressScreen({ data }) {
  const stats = data.stats;
  const sleepEmail = data.email || '';
  // State tidur & hidrasi dikelola di app-web (sinkron Home/Progress + perayaan).
  // Fallback baca localStorage kalau belum disuplai.
  const sleepLog = data.sleepLog || wLoadSleep(sleepEmail);
  const waterLog = data.waterLog || wLoadWater(sleepEmail);
  const logSleep = data.onLogSleep || (() => {});
  const setWater = data.onSetWater || (() => {});
  const sleepStreak = wSleepStreak(sleepLog);
  const todaySleep = sleepLog[wDateKey()];

  // metrics nyata → status badge & jumlah achievement (user baru = 0/6)
  const badges = computeBadges({ runs: stats.runs, streak: data.streak, totalKm: stats.totalKm, target: data.targetKm, sleepStreak });
  const earned = badges.filter((b) => b.got).length;
  // Semua badge dasar lengkap → buka tier bonus + target jarak bergulir baru.
  const allBaseEarned = earned === badges.length;
  const bonusMetrics = { runs: stats.runs, streak: data.streak, totalKm: stats.totalKm, longest: stats.longest || 0 };
  const bonus = allBaseEarned ? BONUS_BADGE_DEFS.map((b) => ({ ...b, got: !!b.test(bonusMetrics) })) : [];
  const bonusEarned = bonus.filter((b) => b.got).length;
  const nextGoal = nextDistanceGoal(stats.totalKm);
  const nextGoalLeft = Math.max(0, nextGoal - (stats.totalKm || 0));
  const nextGoalPct = Math.min(100, Math.round(((stats.totalKm || 0) / nextGoal) * 100));
  return (
    <div style={{ paddingTop: 64, paddingBottom: 112 }}>
      <div style={{ padding: '0 20px', marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color: 'var(--ink)', letterSpacing: -0.8, margin: 0 }}>Progress</h1>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, color: 'var(--muted)', margin: '4px 0 0' }}>Your training journey to race day</p>
      </div>

      {/* streak banner */}
      <div style={{ margin: '0 20px 16px', background: 'linear-gradient(120deg, var(--red), #C81030)', borderRadius: 22, padding: 18, display: 'flex', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden' }}>
        <PIcon name="flame" size={120} color="rgba(255,255,255,0.13)" stroke={2} style={{ position: 'absolute', right: -18, top: -16 }} />
        <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <PIcon name="flame" size={30} color="#fff" stroke={2} />
        </div>
        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, whiteSpace: 'nowrap' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: '#fff', letterSpacing: -1, lineHeight: 1 }}>{data.streak}</span>
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 15, color: '#fff' }}>day streak</span>
          </div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 6, whiteSpace: 'nowrap' }}>Keep the momentum going! 💪</div>
        </div>
      </div>

      {/* daily + weekly highlight */}
      <div style={{ margin: '0 20px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: 'linear-gradient(135deg, var(--blue), var(--blue-deep))', borderRadius: 18, padding: '15px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.78)' }}>
            <PIcon name="run" size={15} stroke={2.4} />
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11, letterSpacing: 0.3 }}>TODAY</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
            <span style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 24, color: '#fff', letterSpacing: -0.5 }}>{PFmt.km(data.myTodayKm)}</span>
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>km</span>
          </div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, padding: '15px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--blue)' }}>
            <PIcon name="calendar" size={15} stroke={2.4} />
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11, color: 'var(--muted)', letterSpacing: 0.3 }}>THIS WEEK</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
            <span style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 24, color: 'var(--ink)', letterSpacing: -0.5 }}>{PFmt.km(data.weekKm)}</span>
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: 'var(--muted)' }}>km</span>
          </div>
        </div>
      </div>

      {/* cumulative stat row */}
      <div style={{ margin: '0 20px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <PStat icon="map" value={PFmt.km(stats.totalKm)} unit="km" label="TOTAL DISTANCE" accent="var(--blue)" />
        <PStat icon="run" value={stats.runs} unit="sessions" label="RUN SESSIONS" accent="var(--blue)" />
        <PStat icon="bolt" value={PFmt.km(stats.longest)} unit="km" label="LONGEST" accent="var(--red)" />
      </div>

      <div style={{ margin: '0 20px 16px' }}>
        <WeeklyChart weeks={data.weeks} target={data.weeklyTarget} />
      </div>

      <div style={{ margin: '0 20px 16px' }} data-tour="wellness">
        <WellnessCards sleepLog={sleepLog} waterLog={waterLog} onLogSleep={logSleep} onSetWater={setWater} daysLeft={data.daysLeft} />
      </div>

      <div style={{ margin: '0 20px 16px' }}>
        <WeeklyPlan data={data} sleep={{ today: typeof todaySleep === 'number' ? todaySleep : null }} />
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>Achievements</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, color: 'var(--muted)' }}>{earned} / {badges.length}</span>
        </div>
        <Badges badges={badges} />

        {allBaseEarned && (
          <div style={{ marginTop: 24 }}>
            {/* Target baru otomatis muncul setelah semua badge dasar lengkap */}
            <div style={{ borderRadius: 18, padding: 16, marginBottom: 16, background: 'linear-gradient(135deg, var(--blue-rich, #0A56AE), var(--red))', color: '#fff', boxShadow: '0 14px 30px -14px rgba(10,86,174,0.6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                <PIcon name="target" size={18} color="#fff" stroke={2.4} />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14 }}>New Goal · next milestone</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                <span style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 27, letterSpacing: -0.5 }}>{PFmt.km0(stats.totalKm)}</span>
                <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13.5, opacity: 0.85 }}>/ {nextGoal} km</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.25)', marginTop: 11, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: nextGoalPct + '%', background: '#fff', borderRadius: 999, transition: 'width .3s' }} />
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, opacity: 0.92, marginTop: 9, lineHeight: 1.45 }}>You’ve cleared every base achievement 🎉 — {PFmt.km0(nextGoalLeft)} km to your next milestone. New targets keep coming until race day. 🏁</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>Bonus Challenges</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, color: 'var(--muted)' }}>{bonusEarned} / {bonus.length}</span>
            </div>
            <Badges badges={bonus} />
          </div>
        )}
      </div>
    </div>
  );
}

window.ProgressScreen = ProgressScreen;
window.WeeklyPlan = WeeklyPlan;
window.WellnessCards = WellnessCards;
window.UZBadgeDefs = BADGE_DEFS;
window.computeBadges = computeBadges;
