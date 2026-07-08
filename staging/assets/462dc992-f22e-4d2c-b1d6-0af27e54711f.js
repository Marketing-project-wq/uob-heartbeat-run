// auth.jsx — Welcome + Auth + Onboarding gate for the web app
const { Icon: AuIcon, PulseLine: AuPulse } = window;
const LOGO_20FIT = 'https://media.20fit.id/wp-content/uploads/2026/05/Logo-20fti-hitam-putih.jpg';
// Offline-safe fallback: if the CDN logo can't load (e.g. no internet), swap to a self-contained "20FIT" wordmark.
const _zfSvg = (fill) => 'data:image/svg+xml,' + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='90' height='28' viewBox='0 0 90 28'><text x='0' y='22' font-family='Archivo,Segoe UI,Arial,sans-serif' font-weight='800' font-size='25' letter-spacing='-0.5' fill='" + fill + "'>20FIT</text></svg>");
window.ZF_FB_DARK = window.ZF_FB_DARK || _zfSvg('#0E2138');
window.ZF_FB_LIGHT = window.ZF_FB_LIGHT || _zfSvg('#ffffff');
window.zfErr = window.zfErr || function (e, light) { const t = e.currentTarget; if (t.dataset.fb) return; t.dataset.fb = '1'; t.src = light ? window.ZF_FB_LIGHT : window.ZF_FB_DARK; };

// Tanpa data dummy: tidak ada akun contoh. Pengenalan "sudah terdaftar"
// ditentukan oleh sesi Supabase / data tersimpan, bukan daftar mock.
const DB_20FIT = {};
function deriveName(email) {
  const local = (email.split('@')[0] || 'Runner').replace(/[._-]+/g, ' ');
  return local.split(' ').filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ') || 'New Runner';
}

// ── Provider mark ───────────────────────────────────────────
function ProviderBtn({ provider, onClick }) {
  const cfg = {
    Google: { letter: 'G', color: '#4285F4', label: 'Continue with Google' },
    Yahoo: { letter: 'Y!', color: '#6001D2', label: 'Continue with Yahoo' },
    Outlook: { letter: 'O', color: '#0A6ED1', label: 'Continue with Outlook' },
  }[provider];
  return (
    <button onClick={onClick} style={{
      width: '100%', cursor: 'pointer', border: '1px solid var(--line)', background: 'var(--card)', borderRadius: 14,
      padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ width: 24, height: 24, borderRadius: 7, background: cfg.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{cfg.letter}</span>
      <span style={{ flex: 1, textAlign: 'left', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{cfg.label}</span>
    </button>
  );
}

const AUTH_CARD = { width: '100%', maxWidth: 432, background: 'var(--card)', borderRadius: 28, border: '1px solid var(--line)', padding: 26, boxShadow: '0 24px 60px -28px rgba(2,32,71,0.3)' };
const AUTH_BG = {
  position: 'relative', isolation: 'isolate', overflow: 'hidden',
  minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 22px',
  background: 'var(--blue-deep)',
};

// Full-bleed brand key visual behind the auth cards — landscape on desktop,
// portrait on mobile — so the background always covers the whole viewport
// (fixes the half-empty / washed-out area). Sits at z-index -1 so all the
// in-flow card content paints above it without needing extra z-index.
function AuthBgLayer() {
  return (
    <React.Fragment>
      <picture>
        <source media="(min-width: 900px)" srcSet={window.asset('loginBgWide', 'assets/login-bg-wide.png')} />
        <img src={window.asset('loginBg', 'assets/login-bg.png')} alt="" aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', zIndex: -1 }} />
      </picture>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: -1, background: 'linear-gradient(180deg, rgba(244,247,252,0.12), rgba(244,247,252,0.34))' }} />
    </React.Fragment>
  );
}

function MiniLogo({ light }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, justifyContent: 'center' }}>
      <img src={window.asset('logoUOB', 'assets/uob-heartbeat-logo-trans.png')} alt="UOB Heartbeat" style={{ height: 26, width: 'auto', display: 'block' }} />
      <img src={window.asset('logo20fit', 'assets/logo-20fit.png')} alt="20FIT" style={{ height: 15, width: 'auto', display: 'block', borderLeft: `1px solid ${light ? 'rgba(255,255,255,0.3)' : 'var(--line)'}`, paddingLeft: 11 }} />
    </div>
  );
}

// ── Step 1: Welcome (pre-login) — full-bleed immersive ──────
function WelcomeScreen({ onStart }) {
  const last = (window.UZStore && window.UZStore.lastUser && window.UZStore.lastUser()) || null;
  const returning = !!(last && last.email);
  // Undangan tim dari link (?team=KODE) — tampilkan sebelum login.
  const [inviteTeam, setInviteTeam] = React.useState(null);
  React.useEffect(() => {
    let code = null; try { code = localStorage.getItem('uz_team_invite'); } catch (e) {}
    if (!code || !window.UZSupa || !window.UZSupa.teamByCode) return;
    let alive = true;
    window.UZSupa.teamByCode(code).then((t) => { if (alive && t) setInviteTeam(t.name); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', overflowX: 'hidden', background: 'var(--blue-deep)' }}>
      {/* full-bleed brand key visual — portrait (mobile) / landscape (desktop) */}
      <picture>
        <source media="(min-width: 900px)" srcSet={window.asset('loginBgWide', 'assets/login-bg-wide.png')} />
        <img src={window.asset('loginBg', 'assets/login-bg.png')} alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
      </picture>
      {/* legibility scrim: clear middle, dim top, strong bottom */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(6,28,66,0.42) 0%, rgba(6,28,66,0.04) 26%, rgba(6,28,66,0.10) 52%, rgba(6,28,66,0.74) 82%, rgba(5,22,54,0.92) 100%)' }} />

      {/* content */}
      <div className="wlc-root" style={{ position: 'relative', zIndex: 2, minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 'clamp(26px, 5vw, 52px)' }}>
        {/* top: frosted logo lockup */}
        <div className="wlc-logo" style={{ display: 'flex' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderRadius: 16,
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 10px 30px -12px rgba(4,20,52,0.5)',
          }}>
            <img src={window.asset('logoUOB', 'assets/uob-heartbeat-logo-trans.png')} alt="UOB Heartbeat" style={{ height: 26, width: 'auto', display: 'block' }} />
            <span style={{ width: 1, height: 22, background: 'var(--line)' }} />
            <img src={window.asset('logo20fit', 'assets/logo-20fit.png')} alt="20FIT" style={{ height: 15, width: 'auto', display: 'block' }} />
          </div>
        </div>

        {inviteTeam && (
          <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 10, alignSelf: 'flex-start', background: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: '11px 15px', boxShadow: '0 10px 30px -12px rgba(4,20,52,0.5)' }}>
            <AuIcon name="trophy" size={18} color="var(--blue)" stroke={2.2} />
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>You’re invited to join <b>{inviteTeam}</b> — sign in to accept</span>
          </div>
        )}
        <div style={{ flex: 1 }} />

        {/* bottom: hero copy + CTA */}
        <div className="wlc-cta" style={{ maxWidth: 620 }}>
          <div className="wlc-cta-label" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 12, letterSpacing: 2, color: 'rgba(255,255,255,0.92)', whiteSpace: 'nowrap' }}>ROAD TO RACE DAY</span>
            <span style={{ width: 'min(120px, 24vw)', height: 1, background: 'rgba(255,255,255,0.35)' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-hero)', fontWeight: 400, fontSize: 'clamp(40px, 7.4vw, 70px)', lineHeight: 1.0, letterSpacing: 0.5, color: '#fff', margin: 0, textShadow: '0 2px 24px rgba(4,18,48,0.45)' }}>Ready to train<br />for a better life</h1>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'clamp(15px, 1.8vw, 18px)', lineHeight: 1.55, color: 'rgba(255,255,255,0.88)', margin: '18px 0 0', maxWidth: 520, textShadow: '0 1px 12px rgba(4,18,48,0.4)' }}>Train alongside fellow UOB runners toward race day. Log every kilometre, climb the leaderboard, and celebrate your progress.</p>
          <div style={{ margin: '22px 0 2px', opacity: 0.95 }}><AuPulse width={460} height={32} color="var(--red)" strokeWidth={2.8} /></div>
          <button onClick={onStart} style={{
            width: '100%', maxWidth: 480, marginTop: 22, border: 'none', cursor: 'pointer', borderRadius: 18, padding: '19px 0',
            background: '#fff', color: 'var(--blue-rich)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, letterSpacing: -0.2,
            boxShadow: '0 18px 44px -14px rgba(2,14,40,0.55)', transition: 'transform .15s, box-shadow .15s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 24px 52px -14px rgba(2,14,40,0.6)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 18px 44px -14px rgba(2,14,40,0.55)'; }}
          >{returning ? 'Get Started' : 'Get Started'}</button>
          {/* Tombol Login SELALU tersedia untuk semua user — masuk pakai email
              yang sama → data lama (run log) otomatis kembali, tidak hilang. */}
          <button onClick={onStart} style={{
            width: '100%', maxWidth: 480, marginTop: 12, cursor: 'pointer', borderRadius: 18, padding: '17px 0',
            background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.55)',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16.5, letterSpacing: -0.2, backdropFilter: 'blur(4px)',
          }}>{returning ? 'Log In' : 'Already have an account? Log In'}</button>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'rgba(255,255,255,0.62)', marginTop: 16, maxWidth: 480, textAlign: 'center' }}>For UOB employees</div>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Daftar/Masuk dengan email, nama, no. telepon ────
function EmailScreen({ onSubmit, onBack }) {
  // Auto-isi dari identitas terakhir di perangkat ini (returning user).
  // User benar-benar baru → null → kolom tetap kosong.
  const last = (window.UZStore && window.UZStore.getLastIdentity && window.UZStore.getLastIdentity())
    || (window.UZStore && window.UZStore.lastUser && window.UZStore.lastUser()) || null;
  const [email, setEmail] = React.useState(last ? (last.email || '') : '');
  const returning = !!(last && last.email);
  const emailOk = /\S+@\S+\.\S+/.test(email);
  const valid = emailOk;
  // Nama diturunkan dari email (akun baru). Akun lama → nama asli diambil
  // dari profil Supabase saat sign-in, jadi tak perlu diketik lagi.
  const name = (last && last.name) || deriveName(email);
  const phone = (last && last.phone) || '';
  const labelStyle = { fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: 'var(--muted)', letterSpacing: 0.3, display: 'block', marginBottom: 6 };
  const field = { width: '100%', boxSizing: 'border-box', border: '1.5px solid var(--line)', borderRadius: 14, padding: '14px 16px', fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--ink)', outline: 'none', background: 'var(--bg)' };
  const submit = () => {
    if (!valid) return;
    const payload = { email: email.trim(), name: name.trim(), phone: phone.trim(), kcp: (last && last.kcp) || '' };
    // ingat identitas ini supaya kunjungan berikutnya auto-terisi
    if (window.UZStore && window.UZStore.setLastIdentity) window.UZStore.setLastIdentity(payload);
    onSubmit(payload);
  };
  const onFormSubmit = (e) => { e.preventDefault(); submit(); };
  return (
    <div style={AUTH_BG}><AuthBgLayer />
      <form onSubmit={onFormSubmit} autoComplete="on" style={AUTH_CARD}>
        <MiniLogo />
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--ink)', letterSpacing: -0.5, textAlign: 'center', margin: '20px 0 4px' }}>{returning ? 'Welcome Back' : 'Sign In or Register'}</h2>      <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, color: 'var(--muted)', textAlign: 'center', margin: '0 0 24px' }}>{returning ? `Continue as ${last.name || last.email}` : 'Just your email to begin.'}</p>

        <label htmlFor="uz-email" style={labelStyle}>EMAIL</label>
        <input
          id="uz-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="your@email.com" value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ ...field, marginBottom: 4 }}
        />

        <button type="submit" disabled={!valid} style={{
          width: '100%', marginTop: 18, border: 'none', cursor: valid ? 'pointer' : 'not-allowed', borderRadius: 14, padding: '15px 0',
          background: valid ? 'var(--blue)' : 'rgba(2,32,71,0.12)', color: valid ? '#fff' : 'var(--muted)',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5, transition: 'background .2s',
        }}>{returning ? 'Sign In' : 'Continue'}</button>
      </form>
      <button onClick={onBack} style={{ marginTop: 18, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13.5, color: 'var(--muted)' }}>← Back</button>
    </div>
  );
}

// ── Sign Up page (email belum terdaftar → wajib daftar dulu) ──
function SignUpScreen({ email, kcp, error, onCreate, onBack }) {
  const [name, setName] = React.useState('');
  const [nik, setNik] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const nameOk = name.trim().length >= 2;
  const nikOk = nik.replace(/[^0-9]/g, '').length >= 4;
  const genderOk = gender === 'Male' || gender === 'Female';
  const phoneDigits = phone.replace(/[^0-9]/g, '');
  const phoneOk = phoneDigits.length === 0 || phoneDigits.length >= 9; // opsional
  const valid = nameOk && nikOk && genderOk && phoneOk;
  const labelStyle = { fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: 'var(--muted)', letterSpacing: 0.3, display: 'block', marginBottom: 6 };
  const field = { width: '100%', boxSizing: 'border-box', border: '1.5px solid var(--line)', borderRadius: 14, padding: '10px 14px', fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--ink)', outline: 'none', background: 'var(--bg)' };
  const ro = { ...field, background: 'rgba(2,32,71,0.04)', color: 'var(--muted)', marginBottom: 10 };
  const submit = (e) => { e.preventDefault(); if (valid) onCreate({ name: name.trim(), phone: phone.trim(), nik: nik.trim(), gender: gender }); };
  return (
    <div style={AUTH_BG}><AuthBgLayer />
      <form onSubmit={submit} autoComplete="on" style={{ ...AUTH_CARD, padding: 18 }}>
        <MiniLogo />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(244,37,60,0.1)', color: 'var(--red)', padding: '5px 11px', borderRadius: 9, margin: '10px auto 0', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11.5 }}>New here — create your account</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--ink)', letterSpacing: -0.5, textAlign: 'center', margin: '6px 0 3px' }}>Sign Up</h2>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--muted)', textAlign: 'center', margin: '0 0 14px' }}>This email isn’t registered yet. Fill in your details to create an account.</p>

        <label style={labelStyle}>EMAIL</label>
        <input value={email} readOnly style={ro} />

        <label htmlFor="su-name" style={labelStyle}>FULL NAME</label>
        <input id="su-name" name="name" type="text" autoComplete="name" placeholder="Full name as per ID" value={name} onChange={(e) => setName(e.target.value)} style={{ ...field, marginBottom: 10 }} />

        <label htmlFor="su-nik" style={labelStyle}>EMPLOYEE NIK</label>
        <input id="su-nik" name="nik" type="text" inputMode="numeric" placeholder="Your employee NIK" value={nik} onChange={(e) => setNik(e.target.value.replace(/[^0-9A-Za-z]/g, ''))} style={{ ...field, marginBottom: 10 }} />

        <label style={labelStyle}>GENDER</label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          {['Male', 'Female'].map((g) => (
            <button type="button" key={g} onClick={() => setGender(g)} style={{
              flex: 1, cursor: 'pointer', borderRadius: 14, padding: '10px 0', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14,
              border: gender === g ? '1.5px solid var(--blue)' : '1.5px solid var(--line)',
              background: gender === g ? 'rgba(0,96,192,0.08)' : 'var(--bg)', color: gender === g ? 'var(--blue)' : 'var(--muted)',
            }}>{g}</button>
          ))}
        </div>

        <label htmlFor="su-phone" style={labelStyle}>PHONE NUMBER <span style={{ fontWeight: 600, textTransform: 'none' }}>(optional)</span></label>
        <input id="su-phone" name="tel" type="tel" inputMode="tel" autoComplete="tel" placeholder="0812 3456 7890" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9+\s-]/g, ''))} style={{ ...field, marginBottom: 4 }} />

        {error && (
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 12.5, color: 'var(--red)', textAlign: 'center', margin: '10px 0 0', lineHeight: 1.45 }}>{error}</div>
        )}

        <button type="submit" disabled={!valid} style={{
          width: '100%', marginTop: 12, border: 'none', cursor: valid ? 'pointer' : 'not-allowed', borderRadius: 14, padding: '12px 0',
          background: valid ? 'var(--red)' : 'rgba(2,32,71,0.12)', color: valid ? '#fff' : 'var(--muted)',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5, boxShadow: valid ? '0 10px 22px -8px rgba(244,37,60,0.5)' : 'none', transition: 'background .2s',
        }}>Create account</button>
      </form>
      <button onClick={onBack} style={{ marginTop: 18, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13.5, color: 'var(--muted)' }}>← Use a different email</button>
    </div>
  );
}

// ── Step 3a: Sign up (new account) ──────────────────────────
const TEAMS = ['20FIT Senopati', '20FIT Kemang', 'UOB Privilege', 'UOB Cards'];
const CATS = ['5K', '10K'];
function SignupScreen({ email, onCreate, onBack }) {
  const [name, setName] = React.useState(deriveName(email));
  const [team, setTeam] = React.useState(TEAMS[0]);
  const [cat, setCat] = React.useState('10K');
  const field = { width: '100%', boxSizing: 'border-box', border: '1.5px solid var(--line)', borderRadius: 14, padding: '13px 15px', fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--ink)', outline: 'none', background: 'var(--bg)' };
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 22px' }}>
      <div style={AUTH_CARD}>
        <MiniLogo />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(244,37,60,0.1)', color: 'var(--red)', padding: '5px 11px', borderRadius: 9, margin: '18px auto 0', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11.5 }}>New account · {email}</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 23, color: 'var(--ink)', letterSpacing: -0.5, textAlign: 'center', margin: '10px 0 20px' }}>Complete your profile</h2>
        <label style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: 'var(--muted)', letterSpacing: 0.3 }}>FULL NAME</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ ...field, marginTop: 6, marginBottom: 14 }} />
        <label style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: 'var(--muted)', letterSpacing: 0.3 }}>TEAM</label>
        <select value={team} onChange={(e) => setTeam(e.target.value)} style={{ ...field, marginTop: 6, marginBottom: 14, appearance: 'none' }}>
          {TEAMS.map((tm) => <option key={tm}>{tm}</option>)}
        </select>
        <label style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: 'var(--muted)', letterSpacing: 0.3 }}>RACE CATEGORY</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} style={{ flex: 1, cursor: 'pointer', borderRadius: 12, padding: '11px 0', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, border: cat === c ? '1.5px solid var(--blue)' : '1px solid var(--line)', background: cat === c ? 'rgba(0,96,192,0.08)' : 'transparent', color: cat === c ? 'var(--blue)' : 'var(--muted)' }}>{c}</button>
          ))}
        </div>
        <button onClick={() => onCreate({ name, team, cat })} style={{ width: '100%', marginTop: 22, border: 'none', cursor: 'pointer', borderRadius: 14, padding: '15px 0', background: 'var(--red)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5, boxShadow: '0 10px 22px -8px rgba(244,37,60,0.6)' }}>Create Account & Continue</button>
      </div>
      <button onClick={onBack} style={{ marginTop: 18, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13.5, color: 'var(--muted)' }}>← Change email</button>
    </div>
  );
}

// ── Step 3: OTP verification ────────────────────────────────
//  live+verifyLive : kode dari EMAIL, diverifikasi ke server Supabase.
//  screenCode       : kode DITAMPILKAN di layar (bukan email), dicek lokal, lalu
//                     akun asli dibuat lewat derived password (onVerify). Dipakai
//                     saat SIGN UP supaya user tetap bisa lanjut walau email diblokir.
function OtpScreen({ email, code, existing, onVerify, onResend, onBack, live, verifyLive, screenCode }) {
  const LEN = 6;
  const [digits, setDigits] = React.useState(Array(LEN).fill(''));
  const [error, setError] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [secs, setSecs] = React.useState(30);
  const [resendMsg, setResendMsg] = React.useState('');
  const refs = React.useRef([]);

  React.useEffect(() => { refs.current[0] && refs.current[0].focus(); }, []);
  React.useEffect(() => {
    if (secs <= 0) return;
    const id = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secs]);

  const entered = digits.join('');
  const full = entered.length === LEN;

  const doVerify = async (val) => {
    if (screenCode) {
      // Kode tampil di layar → cek LOKAL. Kalau cocok, onVerify() membuat akun asli
      // (derived password) dan mengembalikan {ok:false,message} bila gagal (mis.
      // "Confirm email" masih ON di Supabase).
      if (val !== code) { setError(true); return; }
      setVerifying(true); setError(false); setResendMsg('');
      try { const r = await onVerify(); if (r && r.ok === false) setResendMsg(r.message || 'Gagal masuk. Coba lagi.'); }
      catch (e) { setResendMsg('Gagal masuk. Coba lagi.'); }
      finally { setVerifying(false); }
      return;
    }
    if (live) {
      setVerifying(true); setError(false);
      try { const ok = await verifyLive(val); if (ok) onVerify(); else setError(true); }
      catch (e) { setError(true); }
      finally { setVerifying(false); }
    } else {
      if (val === code) onVerify(); else setError(true);
    }
  };

  const commit = (arr) => {
    setDigits(arr);
    setError(false);
    if (arr.join('').length === LEN) { doVerify(arr.join('')); }
  };
  const setAt = (i, val) => {
    const v = val.replace(/[^0-9]/g, '');
    if (!v) { const next = [...digits]; next[i] = ''; commit(next); return; }
    const chars = v.split('');
    const next = [...digits];
    let idx = i;
    for (const ch of chars) { if (idx < LEN) { next[idx] = ch; idx++; } }
    commit(next);
    const focusTo = Math.min(idx, LEN - 1);
    refs.current[focusTo] && refs.current[focusTo].focus();
  };
  const onKey = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) { const n = [...digits]; n[i] = ''; commit(n); }
      else if (i > 0) { refs.current[i - 1] && refs.current[i - 1].focus(); const n = [...digits]; n[i - 1] = ''; commit(n); }
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1].focus();
    else if (e.key === 'ArrowRight' && i < LEN - 1) refs.current[i + 1].focus();
  };
  const resend = async () => {
    setResendMsg(''); setDigits(Array(LEN).fill('')); setError(false); setSecs(30);
    refs.current[0] && refs.current[0].focus();
    try { const r = await onResend(); if (r && r.ok === false && r.message) setResendMsg(r.message); }
    catch (e) { setResendMsg('Gagal mengirim ulang kode. Coba lagi.'); }
  };

  return (
    <div style={AUTH_BG}><AuthBgLayer />
      <div style={AUTH_CARD}>
        <MiniLogo />
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,96,192,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '18px auto 0' }}>
          <AuIcon name="bell" size={26} color="var(--blue)" stroke={2.2} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 23, color: 'var(--ink)', letterSpacing: -0.5, textAlign: 'center', margin: '14px 0 4px' }}>{screenCode ? 'Verify your account' : 'Check your email'}</h2>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, color: 'var(--muted)', textAlign: 'center', margin: '0 0 6px', lineHeight: 1.5 }}>
          {screenCode
            ? <>Enter the 6-digit code shown below to activate your account for<br /><b style={{ color: 'var(--ink)' }}>{email}</b></>
            : <>A 6-digit verification code has been sent to<br /><b style={{ color: 'var(--ink)' }}>{email}</b></>}
        </p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '20px 0 4px' }}>
          {digits.map((d, i) => (
            <input
              key={i} ref={(el) => (refs.current[i] = el)} value={d}
              inputMode="numeric" maxLength={1} aria-label={`Digit ${i + 1}`}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              onFocus={(e) => e.target.select()}
              style={{
                width: 46, height: 56, textAlign: 'center', boxSizing: 'border-box',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--ink)',
                border: `1.5px solid ${error ? 'var(--red)' : d ? 'var(--blue)' : 'var(--line)'}`,
                borderRadius: 13, outline: 'none', background: 'var(--bg)', transition: 'border-color .15s',
              }}
            />
          ))}
        </div>

        {error && (
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 12.5, color: 'var(--red)', textAlign: 'center', marginTop: 8 }}>Incorrect code. Please try again or resend.</div>
        )}

        {/* Kode di layar: mode SIGN UP (screenCode) atau mode demo (tanpa backend email) */}
        {(screenCode || !live) && (
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--muted)', textAlign: 'center', marginTop: error ? 8 : 14, background: 'rgba(0,96,192,0.05)', borderRadius: 10, padding: '8px 12px' }}>
            {screenCode ? 'Your code' : 'Demo · your code'}: <b style={{ color: 'var(--blue)', letterSpacing: 2, fontSize: 14 }}>{code}</b>
          </div>
        )}

        <button onClick={() => full && !verifying && doVerify(entered)} disabled={!full || verifying} style={{
          width: '100%', marginTop: 16, border: 'none', cursor: full && !verifying ? 'pointer' : 'not-allowed', borderRadius: 14, padding: '15px 0',
          background: full && !verifying ? 'var(--blue)' : 'rgba(2,32,71,0.12)', color: full && !verifying ? '#fff' : 'var(--muted)',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5, transition: 'background .2s',
        }}>{verifying ? 'Verifying…' : 'Verify'}</button>

        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--muted)', textAlign: 'center', marginTop: 14 }}>
          {secs > 0 ? (
            <span>Resend code in <b style={{ color: 'var(--ink)' }}>0:{String(secs).padStart(2, '0')}</b></span>
          ) : (
            <button onClick={resend} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5, color: 'var(--blue)' }}>Resend code</button>
          )}
        </div>

        {resendMsg && (
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 8, lineHeight: 1.45 }}>{resendMsg}</div>
        )}
      </div>
      <button onClick={onBack} style={{ marginTop: 18, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13.5, color: 'var(--muted)' }}>← Change details</button>
    </div>
  );
}

// ── Step 4: Personalized welcome (post sign-in/up) ──────────
function WelcomeBack({ account, onContinue }) {
  const first = account.name.split(' ')[0];
  // returning = akun 20FIT terdaftar ATAU pernah dipakai di app ini (ada state tersimpan)
  const returning = !!(account.existing || account.saved);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 24px', background: 'radial-gradient(125% 95% at 50% 38%, rgba(12,64,142,0.18) 0%, rgba(9,42,98,0.74) 62%, rgba(7,34,82,0.88) 100%), var(--grad-heartbeat)' }}>
      <div style={{ maxWidth: 520 }}>
        <div style={{ width: 92, height: 92, borderRadius: '50%', background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px', animation: 'popIn .4s cubic-bezier(.22,1,.36,1)' }}>
          <svg width="48" height="44" viewBox="0 0 24 22"><path d="M12 21C5 16 2 12 2 7.5 2 4.4 4.4 2 7.5 2c1.9 0 3.6 1 4.5 2.5C12.9 3 14.6 2 16.5 2 19.6 2 22 4.4 22 7.5 22 12 19 16 12 21Z" fill="#fff" /></svg>
        </div>
        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, letterSpacing: 1, color: 'rgba(255,255,255,0.75)' }}>{returning ? 'WELCOME BACK' : 'ACCOUNT CREATED'}</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(30px, 5vw, 44px)', letterSpacing: -1, color: '#fff', margin: '10px 0 0' }}>{returning ? `Welcome back, ${first}! 👋` : `Hi, ${first}! 👋`}</h1>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 17, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)', margin: '16px auto 0', maxWidth: 400 }}>{returning ? 'Great to have you back. Continue your training progress toward race day.' : 'Ready to train for a better life. Log every kilometre on the road to race day.'}</p>
        <button onClick={onContinue} style={{ marginTop: 30, border: 'none', cursor: 'pointer', borderRadius: 16, padding: '16px 42px', background: '#fff', color: 'var(--blue)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16.5, boxShadow: '0 16px 36px -12px rgba(0,0,0,0.4)' }}>Continue</button>
      </div>
    </div>
  );
}

// ── Step 5: Connect apps ────────────────────────────────────
const CONNECTABLE = [
  { id: 'strava', name: 'Strava', color: '#FC4C02', desc: 'Import your runs automatically' },
];
function ConnectScreen({ onDone }) {
  const [connected, setConnected] = React.useState({});
  const anyConnected = Object.values(connected).some(Boolean);
  const toggle = (id) => setConnected((c) => ({ ...c, [id]: !c[id] }));
  const finish = () => {
    const first = CONNECTABLE.find((a) => connected[a.id]);
    const brandMap = { strava: 'Strava', apple: 'Apple Watch', garmin: 'Garmin' };
    onDone({ connected: anyConnected, watchBrand: first ? brandMap[first.id] : 'Strava' });
  };
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 22px' }}>
      <div style={AUTH_CARD}>
        <MiniLogo />
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 23, color: 'var(--ink)', letterSpacing: -0.5, textAlign: 'center', margin: '20px 0 4px' }}>Connect your apps</h2>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, color: 'var(--muted)', textAlign: 'center', margin: '0 0 22px' }}>Your runs are recorded and imported automatically</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {CONNECTABLE.map((a) => {
            const on = !!connected[a.id];
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px', border: on ? '1.5px solid #0E9F6E' : '1px solid var(--line)', background: on ? 'rgba(14,159,110,0.05)' : 'var(--card)', borderRadius: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AuIcon name="watch" size={21} color="#fff" stroke={2.2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{a.name}</div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{a.desc}</div>
                </div>
                <button onClick={() => toggle(a.id)} style={{ border: 'none', cursor: 'pointer', borderRadius: 10, padding: '8px 14px', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5, background: on ? '#0E9F6E' : 'rgba(0,96,192,0.1)', color: on ? '#fff' : 'var(--blue)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {on ? <><AuIcon name="check" size={14} stroke={3} /> Connected</> : 'Connect'}
                </button>
              </div>
            );
          })}
        </div>
        <button onClick={finish} style={{ width: '100%', marginTop: 22, border: 'none', cursor: 'pointer', borderRadius: 14, padding: '15px 0', background: 'var(--blue)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5 }}>{anyConnected ? 'Continue to Home' : 'Skip for now'}</button>
      </div>
    </div>
  );
}

// ── Step 4.5: Goal setup — pilih jarak race, plan otomatis ──
// Dua jarak UOB Heartbeat Run. Dari pilihan ini, plan latihan
// (durasi program, target/minggu, total km, sesi/minggu) disusun
// otomatis — user cukup memilih jaraknya.
const RACE_CATS = ['5K', '10K'];
const RACE_PLANS = {
  '5K': {
    dist: '5 KM', tag: 'Fun Run', accent: '#0E9F6E',
    blurb: 'Ideal for beginners. Build a relaxed running habit — focus on consistency, not speed.',
    weeks: 6, perWeek: 13, total: 75, sessions: 3, peakLong: 6,
    plan: [
      { wk: 'Weeks 1–2', d: 'Run-walk 2–3 km, 3× a week' },
      { wk: 'Weeks 3–4', d: 'Continuous run 3–4 km' },
      { wk: 'Week 5', d: 'Peak long run 6 km' },
      { wk: 'Week 6', d: 'Light taper & race day 5 km 🏁' },
    ],
  },
  '10K': {
    dist: '10 KM', tag: 'Challenge', accent: '#0060C0',
    blurb: 'Requires a running base. Build endurance gradually to complete the 10K with confidence.',
    weeks: 8, perWeek: 22, total: 150, sessions: 4, peakLong: 11,
    plan: [
      { wk: 'Weeks 1–2', d: 'Base runs 4–5 km, 3–4× a week' },
      { wk: 'Weeks 3–5', d: 'Build long run 6 → 8 km' },
      { wk: 'Weeks 6–7', d: 'Long run 9–11 km + tempo session' },
      { wk: 'Week 8', d: 'Taper & race day 10 km 🏁' },
    ],
  },
};

function PlanStat({ value, unit, label }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '11px 4px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--ink)', letterSpacing: -0.6, lineHeight: 1 }}>{value}<span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', marginLeft: 2 }}>{unit}</span></div>
      <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 10.5, color: 'var(--muted)', letterSpacing: 0.3, marginTop: 5, textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

// Sisa minggu menuju race day (2026-08-29) → untuk plan custom.
const RACE_ISO = '2026-08-29';
const wzWeeksToRace = (function () {
  const d0 = new Date(); d0.setHours(0, 0, 0, 0);
  const days = Math.max(0, Math.round((new Date(RACE_ISO + 'T00:00:00') - d0) / 86400000));
  return Math.max(1, Math.ceil(days / 7));
})();

function GoalSetup({ account, onDone }) {
  const initial = RACE_PLANS[account.cat] ? account.cat : null;
  const [cat, setCat] = React.useState(initial);
  const [customKm, setCustomKm] = React.useState(String(account.targetKm || 50));
  const first = account.name.split(' ')[0];
  const label = { fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: 'var(--muted)', letterSpacing: 0.3, marginBottom: 10 };
  const ckm = Math.max(1, Math.round(parseFloat(String(customKm).replace(',', '.')) || 0));
  const customPlan = { dist: ckm + ' KM', tag: 'Custom', accent: '#9333EA', weeks: wzWeeksToRace, perWeek: Math.max(1, Math.round(ckm / wzWeeksToRace)), total: ckm, blurb: 'Your own goal — we spread it evenly across the weeks left until race day so the plan fits you.', plan: null };
  const isCustom = cat === 'Custom';
  const p = isCustom ? customPlan : (cat ? RACE_PLANS[cat] : null);
  const OPTS = [
    { id: '5K', big: '5', km: true, tag: 'Fun Run', accent: '#0E9F6E' },
    { id: '10K', big: '10', km: true, tag: 'Challenge', accent: '#0060C0' },
    { id: 'Custom', big: 'Own', km: false, tag: 'Custom', accent: '#9333EA' },
  ];
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 22px', background: 'var(--grad-soft)' }}>
      <div style={{ ...AUTH_CARD, maxWidth: 470 }}>
        <MiniLogo />
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--ink)', letterSpacing: -0.5, textAlign: 'center', margin: '18px 0 2px' }}>How do you want to challenge yourself?</h2>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, color: 'var(--muted)', textAlign: 'center', margin: '0 0 20px' }}>{first}, pick a ready-made challenge (5K or 10K) or set your own km goal — your training plan is built automatically.</p>

        {/* challenge cards */}
        <div style={{ display: 'flex', gap: 10, marginBottom: p ? 18 : 8 }}>
          {OPTS.map((o) => {
            const on = cat === o.id;
            return (
              <button key={o.id} onClick={() => setCat(o.id)} style={{
                flex: 1, cursor: 'pointer', borderRadius: 18, padding: '16px 10px', textAlign: 'left', transition: 'all .15s',
                border: on ? `2px solid ${o.accent}` : '1.5px solid var(--line)',
                background: on ? `${o.accent}0F` : 'var(--card)',
                boxShadow: on ? `0 10px 22px -10px ${o.accent}80` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, letterSpacing: -1.1, color: on ? o.accent : 'var(--ink)', lineHeight: 1 }}>{o.big}</span>
                  {o.km && <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: on ? o.accent : 'var(--muted)' }}>KM</span>}
                </div>
                <div style={{ display: 'inline-block', marginTop: 8, padding: '3px 8px', borderRadius: 999, background: on ? o.accent : 'rgba(2,32,71,0.08)', color: on ? '#fff' : 'var(--muted)', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 10, letterSpacing: 0.2 }}>{o.tag}</div>
              </button>
            );
          })}
        </div>

        {/* custom km input — type your own goal */}
        {isCustom && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: 16, marginBottom: 16, animation: 'fadeIn .2s ease' }}>
            <div style={label}>YOUR TOTAL GOAL (KM)</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <input value={customKm} inputMode="decimal" aria-label="Your goal in km"
                onChange={(e) => setCustomKm(e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '').slice(0, 4))}
                onFocus={(e) => e.target.select()}
                style={{ width: '2.6em', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38, color: 'var(--ink)', letterSpacing: -1, border: 'none', borderBottom: '2px solid #9333EA', background: 'transparent', outline: 'none', padding: '0 0 3px' }} />
              <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 15, color: 'var(--muted)' }}>km total</span>
            </div>
            <div style={{ display: 'flex', gap: 7, marginTop: 12 }}>
              {[30, 50, 75, 100, 150].map((q) => (
                <button key={q} onClick={() => setCustomKm(String(q))} style={{ flex: 1, cursor: 'pointer', borderRadius: 10, padding: '7px 0', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5, border: ckm === q ? '1.5px solid #9333EA' : '1px solid var(--line)', background: ckm === q ? 'rgba(147,51,234,0.07)' : 'transparent', color: ckm === q ? '#9333EA' : 'var(--muted)' }}>{q}</button>
              ))}
            </div>
          </div>
        )}

        {/* auto-generated plan */}
        {p && (
          <div style={{ animation: 'fadeIn .25s ease' }}>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, lineHeight: 1.55, color: 'var(--ink)', margin: '0 0 14px' }}>{p.blurb}</p>

            <div style={{ display: 'flex', gap: 11, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: p.accent, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AuIcon name="target" size={17} color="#fff" stroke={2.3} />
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5, color: 'var(--ink)', letterSpacing: -0.3 }}>Your training plan</div>
            </div>

            <div style={{ display: 'flex', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, marginBottom: 14, overflow: 'hidden' }}>
              <PlanStat value={p.weeks} unit="wk" label="Program" />
              <div style={{ width: 1, background: 'var(--line)' }} />
              <PlanStat value={p.perWeek} unit="km" label="Per week" />
              <div style={{ width: 1, background: 'var(--line)' }} />
              <PlanStat value={p.total} unit="km" label="Total" />
            </div>

            {p.plan && (
              <React.Fragment>
                <div style={label}>TRAINING SCHEDULE</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 22, border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>
                  {p.plan.map((row, k) => (
                    <div key={k} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', borderTop: k ? '1px solid var(--line)' : 'none', background: 'var(--card)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${p.accent}1A`, color: p.accent, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13 }}>{k + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: p.accent, marginBottom: 1 }}>{row.wk}</div>
                        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.4 }}>{row.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </React.Fragment>
            )}
          </div>
        )}

        <button onClick={() => p && onDone({ cat, targetKm: p.total, weeklyTarget: p.perWeek, planWeeks: p.weeks })} disabled={!p} style={{
          width: '100%', border: 'none', cursor: p ? 'pointer' : 'not-allowed', borderRadius: 16, padding: '17px 0', marginTop: isCustom && !p.plan ? 4 : 0,
          background: p ? 'var(--blue-rich)' : 'rgba(2,32,71,0.12)', color: p ? '#fff' : 'var(--muted)',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16.5,
          boxShadow: p ? '0 14px 30px -12px rgba(10,86,174,0.6)' : 'none', transition: 'background .2s',
        }}>{p ? 'Start my challenge 🏃' : 'Choose a challenge first'}</button>
      </div>
    </div>
  );
}

// ── Step 4.7: Feature introduction (kenalan fitur) ──────────
const INTRO_SLIDES = [
  { icon: 'run', accent: '#0060C0', title: 'Welcome to UOB Heartbeat Run', body: 'Your training companion on the road to race day. Train alongside fellow UOB runners, log every kilometre, and celebrate your progress together.' },
  { icon: 'plus', accent: '#F4253C', title: 'Log every run', body: 'Enter your distance and attach a quick photo proof — a watch photo or a health-app screenshot. Every kilometre is verified and added to your total.' },
  { icon: 'calendar', accent: '#0E9F6E', title: 'Daily plan, sleep & water', body: 'Follow your daily Race Plan, and log last night’s sleep and your water intake (2 L a day). Your workout even adapts to how well-rested you are.' },
  { icon: 'chart', accent: '#9333EA', title: 'Track progress & earn badges', body: 'Watch your weekly distance, totals and streak grow, and unlock achievements as you go — from First Run to Well Rested.' },
  { icon: 'trophy', accent: '#E8B339', title: 'Compete & team up', body: 'Climb the daily leaderboard and the Best of Best, create a team and invite friends via WhatsApp, and share any run as an Instagram Story.' },
  { icon: 'medal', accent: '#0A56AE', title: 'Race day: Virtual Run', body: 'On 29 August (06:00–09:00 WIB) the Virtual Run unlocks in your Profile — submit your race result and watch the final standings live.' },
];

function FeatureIntro({ onDone }) {
  const [i, setI] = React.useState(0);
  const last = i === INTRO_SLIDES.length - 1;
  const s = INTRO_SLIDES[i];
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 22px', background: 'var(--grad-soft)' }}>
      <div style={{ ...AUTH_CARD, maxWidth: 460, textAlign: 'center', paddingTop: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <MiniLogo />
          <button onClick={onDone} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, color: 'var(--muted)' }}>Skip</button>
        </div>
        <div style={{ width: 92, height: 92, borderRadius: 26, background: s.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '22px auto 0', boxShadow: `0 16px 34px -12px ${s.accent}99`, transition: 'background .25s' }}>
          <AuIcon name={s.icon} size={46} color="#fff" stroke={2.2} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 25, color: 'var(--ink)', letterSpacing: -0.5, margin: '22px 0 0' }}>{s.title}</h2>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 14.5, lineHeight: 1.6, color: 'var(--muted)', margin: '12px auto 0', maxWidth: 360, minHeight: 70 }}>{s.body}</p>

        {/* dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 7, margin: '24px 0 22px' }}>
          {INTRO_SLIDES.map((_, k) => (
            <span key={k} onClick={() => setI(k)} style={{ width: k === i ? 22 : 8, height: 8, borderRadius: 8, background: k === i ? 'var(--blue)' : 'rgba(2,32,71,0.16)', cursor: 'pointer', transition: 'all .2s' }} />
          ))}
        </div>

        <button onClick={() => last ? onDone() : setI(i + 1)} style={{
          width: '100%', border: 'none', cursor: 'pointer', borderRadius: 16, padding: '16px 0',
          background: 'var(--blue-rich)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16,
          boxShadow: '0 14px 30px -12px rgba(10,86,174,0.55)',
        }}>{last ? 'Get started 🏃' : 'Continue'}</button>
      </div>
    </div>
  );
}

// ── Gate orchestrator ───────────────────────────────────────
function OnboardingGate({ onComplete }) {
  const [step, setStep] = React.useState('welcome');
  const [email, setEmail] = React.useState('');
  const [account, setAccount] = React.useState(null);
  const [otp, setOtp] = React.useState('');
  const [pendingGoals, setPendingGoals] = React.useState(null);
  const [signupErr, setSignupErr] = React.useState('');
  // screenCode=true → layar OTP menampilkan kode di layar & verifikasi lokal (SIGN UP).
  const [screenCode, setScreenCode] = React.useState(false);
  const live = !!window.UZSupaEnabled;
  const genOtp = () => String(Math.floor(100000 + Math.random() * 900000));

  // Ubah error kirim OTP jadi pesan yang bisa dibaca user (bukan gagal diam-diam).
  const otpErrMsg = (e) => {
    const m = (e && (e.message || e.error_description || e.msg)) || '';
    if (/60 seconds|only request|rate limit|too many|after \d+ sec/i.test(m)) return 'Kode baru saja dikirim — cek email kamu (termasuk Spam/Promotions). Bisa minta ulang dalam 1 menit.';
    if (/smtp|sending.*email|error sending|confirmation email/i.test(m)) return 'Sistem gagal mengirim email kode. Coba lagi beberapa saat lagi.';
    return m ? ('Gagal mengirim kode: ' + m) : 'Gagal mengirim kode verifikasi. Coba lagi.';
  };
  // Kirim TEPAT SATU email OTP (membuat akun bila perlu). Kembalikan {ok, message}
  // supaya kegagalan bisa DITAMPILKAN, bukan ditelan .catch(()=>{}) seperti sebelumnya.
  const sendCode = async (em, meta) => {
    if (!(live && window.UZSupa)) return { ok: true };
    try { await window.UZSupa.sendOtp(em, meta); return { ok: true }; }
    catch (e) { return { ok: false, message: otpErrMsg(e) }; }
  };

  const handleSubmit = async ({ email: em, name, phone, kcp }) => {
    setEmail(em);
    setScreenCode(false);   // default: jalur LOGIN/legacy pakai OTP email biasa
    const baseAcc = { name, phone, kcp, email: em, team: '', cat: null };
    // ── MODE ONLINE ──
    //  • LOGIN (akun sudah pernah pakai app): TANPA kode — langsung masuk.
    //  • SIGN UP (selain itu): kode DITAMPILKAN di layar (bukan email) → tetap jalan
    //    walau email korporat memblokir. (Lihat handleCreate + OtpScreen `screenCode`.)
    if (live && window.UZSupa) {
      try {
        // 1) Coba MASUK pakai password turunan. Berhasil → akun ADA → langsung login.
        const inRes = await window.UZSupa.signInPassword(em);
        if (inRes.ok) {
          let prof = null; try { prof = await window.UZSupa.getProfile(); } catch (e) {}
          if (prof && prof.goals_set) {
            onComplete({ name: prof.full_name || name, email: em, phone: prof.phone || phone, kcp: prof.department || kcp, team: prof.team || '', cat: prof.category || '10K', targetKm: prof.target_km, weeklyTarget: prof.weekly_target_km, connected: !!prof.strava_connected, goalsSet: true, existing: true, returning: true });
            return;
          }
          setAccount({ ...baseAcc, name: (prof && prof.full_name) || name, existing: true, saved: null });
          setStep('welcomeback'); return;
        }
        // 2) Tak bisa login → arahkan ke SIGN UP (kode di layar). Akun BARU dibuat di
        //    sana lewat password turunan; akun lama yang sudah pernah pakai app sudah
        //    login di langkah 1. Tidak lagi bergantung pada email OTP.
        setAccount({ ...baseAcc, existing: false, saved: null });
        setStep('signup'); return;
      } catch (e) { setAccount({ ...baseAcc, existing: false, saved: null }); setStep('signup'); return; }
    }

    // ── MODE OFFLINE (demo) ──
    const saved = (window.UZStore && window.UZStore.loadUser(em, name)) || null;
    setAccount({ ...baseAcc, existing: !!saved, saved });
    setStep(saved ? 'welcomeback' : 'signup');
  };

  // Buat akun dari halaman Sign Up (akun baru). OTP hanya kalau Supabase
  // masih memaksa konfirmasi email.
  const handleCreate = async ({ name: nm, phone: ph, nik, gender }) => {
    const em = (account && account.email) || email;
    const kcp = (account && account.kcp) || '';
    setSignupErr('');
    setAccount((a) => ({ ...(a || {}), name: nm, phone: ph, nik: nik, gender: gender, existing: false }));
    if (window.UZStore && window.UZStore.setLastIdentity) window.UZStore.setLastIdentity({ email: em, name: nm, phone: ph, kcp });
    if (live && window.UZSupa) {
      // SIGN UP: tampilkan kode DI LAYAR (bukan email) → user tetap bisa lanjut walau
      // email korporat memblokir. Kode dibuat & dicek lokal; akun ASLI dibuat saat
      // verifikasi lewat derived password (lihat onVerify di render). Butuh setting
      // Supabase "Confirm email" = OFF agar akun langsung dapat sesi.
      setScreenCode(true);
      setOtp(genOtp());
      setStep('otp');
      return;
    }
    setStep('welcomeback');
  };

  // Returning/existing account → langsung ke beranda, LEWATI walkthrough (intro).
  // Walkthrough (FeatureIntro) hanya untuk akun BARU yang baru sign up.
  const afterWelcome = () => {
    const s = account && account.saved;
    if ((account && account.existing) || (s && s.goalsSet)) {
      onComplete({ ...account, ...(s || {}), connected: !!(s && s.stravaConnected), returning: true, goalsSet: true });
    } else {
      setStep('intro');
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {step === 'welcome' && <WelcomeScreen onStart={() => setStep('email')} />}
      {step === 'email' && <EmailScreen onSubmit={handleSubmit} onBack={() => setStep('welcome')} />}
      {step === 'signup' && account && <SignUpScreen email={account.email} kcp={account.kcp} error={signupErr} onCreate={handleCreate} onBack={() => { setSignupErr(''); setStep('email'); }} />}
      {step === 'otp' && account && <OtpScreen email={email} code={otp} existing={account.existing} live={live} screenCode={screenCode} verifyLive={(c) => window.UZSupa.verifyOtp(email, c).then(() => true).catch(() => false)} onVerify={async () => {
        // Setelah verifikasi: kalau profil Supabase sudah pernah set goal,
        // langsung masuk (riwayat lari otomatis kembali) tanpa onboarding ulang.
        if (live && window.UZSupa) {
          if (screenCode) {
            // Kode diverifikasi LOKAL (tampil di layar) → belum ada sesi. Buat akun
            // pre-konfirmasi via Edge Function `uob-signup` (TANPA email & TANPA ubah
            // "Confirm email" — project ini dipakai bersama produk lain), lalu login
            // pakai password turunan untuk dapat sesi asli.
            let ok = false;
            try {
              const made = await window.UZSupa.createUobAccount(email, { name: account.name, phone: account.phone, nik: account.nik, gender: account.gender });
              if (made) { const si = await window.UZSupa.signInPassword(email); ok = !!(si && si.ok); }
            } catch (e) {}
            if (!ok) {
              return { ok: false, message: 'Gagal membuat akun. Pastikan Edge Function "uob-signup" sudah di-deploy di Supabase, lalu coba lagi.' };
            }
          } else {
            // Set password turunan sekarang (sesi aktif) → login lain kali TANPA OTP.
            try { await window.UZSupa.setDerivedPassword(email); } catch (e) {}
          }
          try {
            const prof = await window.UZSupa.getProfile();
            if (prof && prof.goals_set) {
              onComplete({
                name: prof.full_name || account.name, email, phone: prof.phone || account.phone,
                kcp: prof.department || account.kcp, team: prof.team || account.team,
                cat: prof.category || account.cat || '10K',
                targetKm: prof.target_km, weeklyTarget: prof.weekly_target_km,
                connected: !!prof.strava_connected, goalsSet: true, existing: true, returning: true,
              });
              return;
            }
          } catch (e) {}
        }
        setStep('welcomeback');
      }} onResend={async () => {
        setOtp(genOtp());
        // SIGN UP (screenCode): cukup regenerasi kode di layar, tak perlu email.
        if (screenCode) return { ok: true };
        // Jalur email (login/legacy): kirim ulang OTP + kembalikan hasilnya supaya
        // OtpScreen bisa MENAMPILKAN error (bukan gagal diam-diam).
        const meta = account ? { name: account.name, phone: account.phone, nik: account.nik, gender: account.gender } : undefined;
        return await sendCode(email, meta);
      }} onBack={() => setStep('email')} />}
      {step === 'welcomeback' && account && <WelcomeBack account={account} onContinue={afterWelcome} />}
      {/* Tidak ada pilih challenge di awal — user set Training Target lewat tombol Edit
          di beranda (dijelaskan di walkthrough). Pakai target default dulu. */}
      {step === 'intro' && account && <FeatureIntro onDone={() => onComplete({ ...account, cat: account.cat || '10K', targetKm: account.targetKm || 120, weeklyTarget: account.weeklyTarget || 20, connected: false, goalsSet: true })} />}
      {step === 'goals' && account && <GoalSetup account={account} onDone={(goals) => onComplete({ ...account, ...goals, connected: false, goalsSet: true })} />}
    </div>
  );
}

window.OnboardingGate = OnboardingGate;
