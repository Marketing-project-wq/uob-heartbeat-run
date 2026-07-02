// logrun.jsx — Log a run: choose method, sync from watch, manual entry, success
const { Icon: LIcon, fmt: LFmt, ProgressRing: LRing, PulseLine } = window;

function Stepper({ onDown, onUp }) {
  const btn = {
    width: 44, height: 44, borderRadius: 13, border: '1px solid var(--line)', background: 'var(--card)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)', flexShrink: 0,
  };
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button style={btn} onClick={onDown}><span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginTop: -2 }}>−</span></button>
      <button style={btn} onClick={onUp}><LIcon name="plus" size={20} stroke={2.8} color="var(--blue)" /></button>
    </div>
  );
}

function SheetHandle({ onClose, title }) {
  return (
    <div style={{ padding: '10px 0 6px', position: 'relative' }}>
      <div style={{ width: 40, height: 5, borderRadius: 5, background: 'rgba(2,32,71,0.18)', margin: '0 auto 12px' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 21, color: 'var(--ink)', letterSpacing: -0.4 }}>{title}</span>
        <button onClick={onClose} style={{ border: 'none', background: 'rgba(2,32,71,0.06)', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LIcon name="close" size={17} color="var(--muted)" stroke={2.4} />
        </button>
      </div>
    </div>
  );
}

function MethodChoice({ connected, brand, onManual, onWatch }) {
  const card = (icon, iconColor, iconBg, title, sub, onClick, badge) => (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer', border: '1px solid var(--line)', background: 'var(--card)',
      borderRadius: 20, padding: 18, display: 'flex', alignItems: 'center', gap: 14, position: 'relative',
    }}>
      <div style={{ width: 52, height: 52, borderRadius: 15, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <LIcon name={icon} size={27} color={iconColor} stroke={2} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16.5, color: 'var(--ink)' }}>{title}</div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>
      </div>
      {badge && <span style={{ position: 'absolute', top: 14, right: 14, fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 10, color: '#0E7A52', background: 'rgba(14,159,110,0.12)', padding: '3px 8px', borderRadius: 7 }}>{badge}</span>}
      <LIcon name="chevron" size={19} color="var(--muted)" stroke={2.2} />
    </button>
  );
  return (
    <div style={{ padding: '18px 20px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {card('watch', '#FC4C02', 'rgba(252,76,2,0.12)', 'Sync from Strava', connected ? `${brand} · auto-import your runs` : 'Import your runs from Strava', onWatch, connected ? 'CONNECTED' : null)}
      {card('plus', 'var(--red)', 'rgba(244,37,60,0.1)', 'Manual entry', 'Enter your distance manually', onManual)}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 6, padding: '0 4px' }}>
        <LIcon name="bolt" size={16} color="var(--red)" />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>Strava sync automatically records the distance and time of each training session on the road to race day.</span>
      </div>
    </div>
  );
}

const SOURCES = [
  { id: 'strava', name: 'Strava', color: '#FC4C02' },
];

// ── Strava OAuth (real authorization flow) ──────────────────
// Setup: daftarkan app di https://www.strava.com/settings/api,
// set "Authorization Callback Domain" = domain halaman ini, lalu
// isi Client ID di bawah (atau lewat prompt saat menekan Hubungkan).
// Token exchange (code → access_token) butuh client_secret, jadi
// WAJIB di server/Edge Function — jangan taruh secret di sini.
const STRAVA_CLIENT_ID = ''; // ← isi Client ID Strava (opsional, bisa via prompt)
const STRAVA_SCOPE = 'activity:read_all';

function getStravaClientId() {
  try {
    if (window.STRAVA_CONFIG && window.STRAVA_CONFIG.clientId) return String(window.STRAVA_CONFIG.clientId).trim();
    return STRAVA_CLIENT_ID || localStorage.getItem('strava_client_id') || '';
  } catch (e) { return STRAVA_CLIENT_ID; }
}
function stravaRedirectUri() { return window.location.origin + window.location.pathname; }

function connectStrava(onConnect) {
  let cid = getStravaClientId();
  if (!cid) {
    cid = window.prompt('Masukkan Strava Client ID\n(dari https://www.strava.com/settings/api):', '');
    if (!cid) return;
    cid = cid.trim();
    try { localStorage.setItem('strava_client_id', cid); } catch (e) {}
  }
  const params = new URLSearchParams({
    client_id: cid, redirect_uri: stravaRedirectUri(), response_type: 'code',
    approval_prompt: 'auto', scope: STRAVA_SCOPE,
  });
  const url = 'https://www.strava.com/oauth/authorize?' + params.toString();
  const w = 520, h = 660;
  const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);
  const popup = window.open(url, 'strava_oauth', `width=${w},height=${h},left=${left},top=${top}`);
  if (!popup) { // popup diblokir → fallback redirect penuh
    try { localStorage.setItem('strava_pending', '1'); } catch (e) {}
    window.location.href = url;
    return;
  }
  function handler(ev) {
    if (ev.origin !== window.location.origin) return;
    if (ev.data && ev.data.type === 'strava_oauth') {
      window.removeEventListener('message', handler);
      if (ev.data.code) {
        try { localStorage.setItem('strava_connected', '1'); } catch (e) {}
        // Online: tukar code → token & tarik aktivitas. Demo: cukup tandai terhubung.
        if (window.UZSupaEnabled && window.UZSupa) {
          window.UZSupa.exchangeStravaCode(ev.data.code).then(function (ok) {
            onConnect('Strava');
          }).catch(function () { onConnect('Strava'); });
        } else {
          onConnect('Strava');
        }
      }
    }
  }
  window.addEventListener('message', handler);
}

function StravaGate({ onConnect, onManual }) {
  return (
    <div style={{ padding: '20px 20px 28px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: '#FC4C02', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 26px -10px rgba(252,76,2,0.7)' }}>
          <LIcon name="watch" size={34} color="#fff" stroke={2} />
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 21, color: 'var(--ink)', letterSpacing: -0.5, margin: '16px 0 0' }}>Connect Strava first</h3>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.55, margin: '8px 0 0', maxWidth: 320 }}>
          Connect your Strava account to record runs automatically. Every run will sync here instantly.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, margin: '22px 0 0' }}>
        {['Import distance & time for every run automatically', 'No more manual entry', 'Race-day progress always up to date'].map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(252,76,2,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LIcon name="check" size={13} color="#FC4C02" stroke={3} />
            </span>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--ink)' }}>{t}</span>
          </div>
        ))}
      </div>

      <button onClick={() => connectStrava(onConnect)} style={{
        width: '100%', marginTop: 22, border: 'none', cursor: 'pointer', borderRadius: 16, padding: '16px 0',
        background: '#FC4C02', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: '0 12px 26px -10px rgba(252,76,2,0.6)',
      }}>
        <LIcon name="watch" size={20} stroke={2.4} /> Connect Strava
      </button>
      <button onClick={onManual} style={{
        width: '100%', marginTop: 10, border: 'none', background: 'none', cursor: 'pointer', padding: '6px 0',
        fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13.5, color: 'var(--muted)',
      }}>Log manually instead</button>
    </div>
  );
}

function WatchSync({ connected, brand, onConnect, onImport, onBack }) {
  if (!connected) {
    return (
      <div style={{ padding: '12px 20px 28px' }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>Connect Strava to sync your runs automatically.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SOURCES.map((s) => (
            <button key={s.id} onClick={() => (s.id === 'strava' ? connectStrava(onConnect) : onConnect(s.name))} style={{
              width: '100%', cursor: 'pointer', border: '1px solid var(--line)', background: 'var(--card)', borderRadius: 16,
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 13,
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <LIcon name="watch" size={20} color="#fff" stroke={2.2} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{s.name}</span>
                {s.id === 'strava' && <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>Sign in & grant activity access</div>}
              </div>
              <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5, color: s.id === 'strava' ? '#FC4C02' : 'var(--blue)' }}>Connect</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding: '12px 20px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14, color: '#0E7A52' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0E9F6E' }} />
        <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5 }}>{brand} connected</span>
      </div>
      <div style={{ border: '1.5px solid var(--blue)', background: 'rgba(0,96,192,0.04)', borderRadius: 20, padding: 18, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <LIcon name="watch" size={24} color="#fff" stroke={2} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5, color: 'var(--ink)' }}>Auto-sync is on</div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>Every run you record on Strava syncs here automatically and adds to your total distance. No manual entry needed.</div>
        </div>
      </div>
      <button onClick={onBack} style={{
        width: '100%', marginTop: 16, border: 'none', cursor: 'pointer', borderRadius: 16, padding: '16px 0',
        background: 'var(--blue)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <LIcon name="check" size={20} stroke={2.8} /> Done
      </button>
    </div>
  );
}

// Baca File → data URL base64 (untuk dikirim ke validator AI).
function fileToDataURL(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
}

// Bukti lari WAJIB + divalidasi otomatis (AI vision di Supabase Edge Function):
// hanya menerima FOTO JAM DIGITAL atau SCREENSHOT HEALTH APP yang menampilkan
// jarak lari (km). Selfie / foto tak relevan ditolak dengan alasan.
function RunProof({ photo, vstatus, vreason, onPick }) {
  const camRef = React.useRef(null);
  const fileRef = React.useRef(null);
  const pick = (e) => { const f = e.target.files && e.target.files[0]; if (f) onPick(f); e.target.value = ''; };
  const checking = vstatus === 'checking';
  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(0,96,192,0.06), rgba(252,76,2,0.07))', border: '1px solid var(--line)', borderRadius: 20, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: '#FC4C02', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <LIcon name="watch" size={17} color="#fff" stroke={2.2} />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5, color: 'var(--ink)' }}>Run proof <span style={{ color: 'var(--red)' }}>*</span></span>
      </div>
      <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.55, margin: '0 0 12px' }}>
        Attach a <b style={{ color: 'var(--ink)' }}>photo of your digital watch</b> or a <b style={{ color: 'var(--ink)' }}>screenshot from a health/running app</b> clearly showing the <b style={{ color: 'var(--ink)' }}>kilometers</b>. Selfies and other photos are not accepted.
      </p>
      <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={pick} style={{ display: 'none' }} />
      <input ref={fileRef} type="file" accept="image/*" onChange={pick} style={{ display: 'none' }} />
      {photo ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <img src={photo} alt="" style={{ width: 46, height: 46, borderRadius: 12, objectFit: 'cover', flexShrink: 0, opacity: vstatus === 'invalid' ? 0.5 : 1 }} />
            <div style={{ flex: 1 }}>
              {checking && <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--blue)' }}><LIcon name="watch" size={13} stroke={2.4} /><span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5 }}>Checking your photo…</span></div>}
              {vstatus === 'valid' && <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#0E7A52' }}><LIcon name="check" size={14} stroke={3} /><span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5 }}>Verified — running distance detected</span></div>}
              {vstatus === 'invalid' && <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--red)' }}><LIcon name="close" size={14} stroke={3} /><span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5 }}>Photo rejected</span></div>}
              {vstatus === 'error' && <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#B7791F' }}><LIcon name="check" size={14} stroke={2.6} /><span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5 }}>Couldn’t auto-verify — team will review</span></div>}
              {!checking && <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--muted)', marginTop: 1 }}>{vstatus === 'valid' ? 'Make sure the km matches what you typed.' : 'Tap Replace to choose another photo.'}</div>}
            </div>
            <button onClick={() => fileRef.current && fileRef.current.click()} disabled={checking} style={{ border: 'none', background: 'rgba(2,32,71,0.06)', cursor: checking ? 'wait' : 'pointer', borderRadius: 10, padding: '7px 11px', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: 'var(--blue)' }}>Replace</button>
          </div>
          {vstatus === 'invalid' && vreason && (
            <div style={{ marginTop: 10, background: 'rgba(244,37,60,0.07)', border: '1px solid rgba(244,37,60,0.2)', borderRadius: 12, padding: '10px 12px', fontFamily: 'var(--font-ui)', fontSize: 11.5, color: '#B42318', lineHeight: 1.5 }}>
              <b>Why it was rejected:</b> {vreason} Please upload a photo of your digital watch or a health-app screenshot that clearly shows the running distance in km.
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 9 }}>
          <button onClick={() => camRef.current && camRef.current.click()} style={{ flex: 1, cursor: 'pointer', border: '1.5px solid var(--blue)', background: 'rgba(0,96,192,0.06)', borderRadius: 14, padding: '12px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <LIcon name="watch" size={17} color="var(--blue)" stroke={2.4} />
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5, color: 'var(--blue)' }}>Take a photo</span>
          </button>
          <button onClick={() => fileRef.current && fileRef.current.click()} style={{ flex: 1, cursor: 'pointer', border: '1.5px dashed var(--line)', background: 'var(--card)', borderRadius: 14, padding: '12px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <LIcon name="plus" size={16} color="var(--blue)" stroke={2.6} />
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5, color: 'var(--blue)' }}>Upload screenshot</span>
          </button>
        </div>
      )}
    </div>
  );
}

function ManualEntry({ onSave }) {
  const [kmStr, setKmStr] = React.useState('5.0');
  const [photo, setPhoto] = React.useState(null);
  const [photoFile, setPhotoFile] = React.useState(null);
  const [vstatus, setVstatus] = React.useState('idle'); // idle|checking|valid|invalid|error
  const [vreason, setVreason] = React.useState('');
  // Terima koma & titik (beberapa keyboard, mis. iOS locale ID, keluar koma).
  const km = Math.max(0, parseFloat(String(kmStr).replace(',', '.')) || 0);
  const setKm = (v) => setKmStr(String(Math.round(Math.max(0, v) * 10) / 10));
  const reqIdRef = React.useRef(0);

  const onPick = async (file) => {
    const id = ++reqIdRef.current;
    const url = URL.createObjectURL(file);
    setPhoto(url); setPhotoFile(file); setVreason('');
    // Offline / Supabase mati → tak bisa validasi otomatis, terima (review manual).
    if (!window.UZSupaEnabled || !window.UZSupa || !window.UZSupa.validateRunProof) { setVstatus('error'); return; }
    setVstatus('checking');
    try {
      const dataUrl = await fileToDataURL(file);
      const res = await window.UZSupa.validateRunProof(dataUrl, km);
      if (id !== reqIdRef.current) return; // sudah diganti foto lain
      if (res && res.valid) { setVstatus('valid'); }
      else if (res && res.serviceError) { setVstatus('error'); }
      else { setVstatus('invalid'); setVreason((res && res.reason) || 'This photo doesn’t look like a digital watch or a health-app screenshot showing your running distance.'); }
    } catch (e) {
      if (id !== reqIdRef.current) return;
      setVstatus('error'); // fail-open: jangan blokir kalau layanan error
    }
  };

  const canSave = km > 0 && photo && (vstatus === 'valid' || vstatus === 'error');
  const saveLabel = !photo ? 'Attach run proof to continue'
    : vstatus === 'checking' ? 'Checking photo…'
    : vstatus === 'invalid' ? 'Replace the rejected photo'
    : 'Save Run';
  return (
    <div style={{ padding: '14px 20px 28px' }}>
      <RunProof photo={photo} vstatus={vstatus} vreason={vreason} onPick={onPick} />
      {/* distance — hanya kilometer */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 20, padding: 18, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11.5, color: 'var(--muted)', letterSpacing: 0.4 }}>DISTANCE · type the number</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <input
                value={kmStr} inputMode="decimal" aria-label="Distance in km"
                onChange={(e) => setKmStr(e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '').slice(0, 5))}
                onFocus={(e) => e.target.select()}
                onBlur={() => setKmStr(String(km))}
                style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, color: 'var(--ink)', letterSpacing: -1.5, lineHeight: 1, width: '2.5em', border: 'none', borderBottom: '2px solid var(--blue)', background: 'transparent', outline: 'none', padding: '0 0 3px' }}
              />
              <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 16, color: 'var(--muted)' }}>km</span>
            </div>
          </div>
          <Stepper onDown={() => setKm(km - 0.5)} onUp={() => setKm(km + 0.5)} />
        </div>
        <input type="range" min="1" max="25" step="0.5" value={km} onChange={(e) => setKm(parseFloat(e.target.value))}
          style={{ width: '100%', marginTop: 14, accentColor: 'var(--blue)' }} />
        <div style={{ display: 'flex', gap: 7, marginTop: 8 }}>
          {[3, 5, 8, 10, 12].map((q) => (
            <button key={q} onClick={() => setKm(q)} style={{
              flex: 1, cursor: 'pointer', borderRadius: 10, padding: '7px 0', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5,
              border: km === q ? '1.5px solid var(--blue)' : '1px solid var(--line)',
              background: km === q ? 'rgba(0,96,192,0.07)' : 'transparent', color: km === q ? 'var(--blue)' : 'var(--muted)',
            }}>{q}</button>
          ))}
        </div>
      </div>

      <button onClick={() => canSave && onSave({ km, mins: null, source: 'manual', photo, photoFile, proofValid: vstatus === 'valid', when: 'Today' })} disabled={!canSave} style={{
        width: '100%', marginTop: 4, border: 'none', cursor: canSave ? 'pointer' : 'not-allowed', borderRadius: 16, padding: '16px 0',
        background: canSave ? 'var(--red)' : 'rgba(2,32,71,0.12)', color: canSave ? '#fff' : 'var(--muted)',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, transition: 'background .2s',
        boxShadow: canSave ? '0 10px 22px -8px rgba(244,37,60,0.6)' : 'none',
      }}>{saveLabel}</button>
      {/* disclaimer validasi data */}
      <p style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--muted)', lineHeight: 1.5, margin: '12px 4px 0', textAlign: 'center' }}>
        Your proof photo is auto-checked and reviewed by the team to validate your distance. Only digital-watch photos or health-app screenshots showing km are accepted; submitting false or edited proof may disqualify your entry.
      </p>
    </div>
  );
}

function SuccessView({ run, newTotal, target, streak, onDone, onShareStory }) {
  const [photo, setPhoto] = React.useState(null);
  const fileRef = React.useRef(null);
  const pick = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) setPhoto(URL.createObjectURL(f));
  };
  return (
    <div style={{ padding: '8px 24px 32px', textAlign: 'center' }}>
      <div style={{ position: 'relative', display: 'inline-block', margin: '6px 0 4px' }}>
        <LRing value={newTotal} max={target} size={168} stroke={15}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38, color: 'var(--ink)', letterSpacing: -1.5, lineHeight: 1 }}>+{LFmt.km(run.km)}</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>km logged</span>
        </LRing>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--ink)', letterSpacing: -0.5, marginTop: 8 }}>Great work — keep it up! 🔥</div>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
        Total training is now <b style={{ color: 'var(--ink)' }}>{LFmt.km(newTotal)} km</b> of {target} km.
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <div style={{ flex: 1, background: 'rgba(244,37,60,0.08)', borderRadius: 16, padding: '14px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <LIcon name="flame" size={20} color="var(--red)" stroke={2} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--red)' }}>{streak}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>DAY STREAK</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(0,96,192,0.08)', borderRadius: 16, padding: '14px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <LIcon name="arrowUp" size={18} color="var(--blue)" stroke={2.4} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--blue)' }}>+3</span>
          </div>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>RANK UP</div>
        </div>
      </div>
      {/* Photo */}
      <div style={{ marginTop: 18, textAlign: 'left' }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11.5, color: 'var(--muted)', letterSpacing: 0.4, marginBottom: 8 }}>RUN PHOTO (OPTIONAL)</div>
        <input ref={fileRef} type="file" accept="image/*" onChange={pick} style={{ display: 'none' }} />
        {photo ? (
          <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', height: 150 }}>
            <img src={photo} alt="Run photo" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <button onClick={() => fileRef.current && fileRef.current.click()} style={{ position: 'absolute', bottom: 10, right: 10, border: 'none', cursor: 'pointer', background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 10, padding: '7px 12px', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <LIcon name="plus" size={14} stroke={2.6} /> Replace
            </button>
          </div>
        ) : (
          <button onClick={() => fileRef.current && fileRef.current.click()} style={{ width: '100%', cursor: 'pointer', border: '1.5px dashed var(--line)', background: 'rgba(2,32,71,0.02)', borderRadius: 18, padding: '22px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,96,192,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LIcon name="map" size={21} color="var(--blue)" stroke={2} />
            </div>
            <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>Add a photo of your run</span>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--muted)' }}>Show off today’s progress</span>
          </button>
        )}
      </div>

      <button onClick={() => onShareStory(photo)} style={{
        width: '100%', marginTop: 14, border: 'none', cursor: 'pointer', borderRadius: 16, padding: '16px 0',
        background: 'var(--red)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: '0 10px 22px -8px rgba(244,37,60,0.55)',
      }}>
        <LIcon name="share" size={19} stroke={2.2} /> Share to Story
      </button>
      <button onClick={onDone} style={{
        width: '100%', marginTop: 10, border: 'none', cursor: 'pointer', borderRadius: 16, padding: '14px 0',
        background: 'transparent', color: 'var(--muted)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15,
      }}>Maybe later</button>
    </div>
  );
}

function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
function loadImageSafe(src) { return loadImage(src).catch(() => null); }
// Pastikan font yang dipakai canvas sudah benar-benar termuat sebelum menggambar,
// kalau tidak teks bisa pakai font fallback → lebar berubah → tumpang tindih.
async function ensureStoryFonts() {
  if (!document || !document.fonts) return;
  const need = [
    "800 300px 'Barlow Condensed'", "800 96px 'Barlow Condensed'",
    "800 76px 'Barlow Condensed'", "700 34px 'Inter'", "600 36px 'Inter'",
  ];
  try { await Promise.all(need.map((f) => document.fonts.load(f))); await document.fonts.ready; } catch (e) {}
}
// Logo chip putih (UOB Heartbeat × 20FIT) — sama seperti preview.
function drawLogoChip(ctx, x, y, logoUOB, logo20) {
  const pad = 24, h = 56, gap = 26;
  const uw = logoUOB ? logoUOB.width / logoUOB.height * h : 0;
  const h2 = h * 0.62; // 20fit sedikit lebih kecil
  const tw = logo20 ? logo20.width / logo20.height * h2 : 0;
  const divW = (logoUOB && logo20) ? 2 : 0;
  const innerW = uw + (logoUOB && logo20 ? gap + divW + gap : 0) + tw;
  const chipW = innerW + pad * 2, chipH = h + pad * 2, r = 26;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + chipW, y, x + chipW, y + chipH, r);
  ctx.arcTo(x + chipW, y + chipH, x, y + chipH, r); ctx.arcTo(x, y + chipH, x, y, r);
  ctx.arcTo(x, y, x + chipW, y, r); ctx.closePath();
  ctx.shadowColor = 'rgba(4,20,52,0.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; ctx.fill();
  ctx.restore();
  let cx = x + pad; const cy = y + pad;
  if (logoUOB) { ctx.drawImage(logoUOB, cx, cy, uw, h); cx += uw; }
  if (logoUOB && logo20) { cx += gap; ctx.fillStyle = 'rgba(2,32,71,0.18)'; ctx.fillRect(cx, cy + 4, divW, h - 8); cx += divW + gap; }
  if (logo20) { ctx.drawImage(logo20, cx, cy + (h - h2) / 2, tw, h2); }
}
// Burn the story (distance + branding) into a 1080×1920 PNG for Instagram Story.
// `photo` ada → background foto user; null → background poster UOB Heartbeat.
async function buildStoryBlob({ photo, run, durLabel, dateLabel }) {
  await ensureStoryFonts();
  const W = 1080, H = 1920;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const poster = !photo;
  const [bg, logoUOB, logo20] = await Promise.all([
    loadImageSafe(photo || window.asset('ribbon', 'assets/heartbeat-ribbon.png')),
    loadImageSafe(window.asset('logoUOB', 'assets/uob-heartbeat-logo-trans.png')),
    loadImageSafe(window.asset('logo20fit', 'assets/logo-20fit.png')),
  ]);
  if (bg) {
    const r = Math.max(W / bg.width, H / bg.height);
    const w = bg.width * r, h = bg.height * r;
    ctx.drawImage(bg, (W - w) / 2, (H - h) / 2, w, h);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#0A56AE'); g.addColorStop(0.62, '#00305f'); g.addColorStop(1, '#06203f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (poster) { ctx.fillStyle = 'rgba(6,26,62,0.46)'; ctx.fillRect(0, 0, W, H); }
  // scrims
  const top = ctx.createLinearGradient(0, 0, 0, 360); top.addColorStop(0, 'rgba(0,0,0,0.38)'); top.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = top; ctx.fillRect(0, 0, W, 360);
  const bot = ctx.createLinearGradient(0, H * 0.5, 0, H); bot.addColorStop(0, 'rgba(0,0,0,0)'); bot.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = bot; ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';
  // brand: logo chip (sama seperti preview, bukan teks lagi)
  drawLogoChip(ctx, 64, 64, logoUOB, logo20);

  const drawPulse = (py) => {
    ctx.strokeStyle = '#F4253C'; ctx.lineWidth = 9; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const x0 = 72, x1 = W - 72, w = x1 - x0;
    const X = (f) => x0 + w * f;
    ctx.beginPath(); ctx.moveTo(x0, py);
    ctx.lineTo(X(0.09), py);
    ctx.lineTo(X(0.115), py - 60); ctx.lineTo(X(0.14), py + 36); ctx.lineTo(X(0.165), py);
    ctx.lineTo(X(0.215), py); ctx.lineTo(X(0.24), py - 80); ctx.lineTo(X(0.265), py);
    ctx.lineTo(X(0.31), py);
    ctx.lineTo(X(0.35), py - 150); ctx.lineTo(X(0.39), py + 150); ctx.lineTo(X(0.415), py - 60); ctx.lineTo(X(0.44), py);
    ctx.lineTo(x1, py); ctx.stroke();
  };
  const kmStr = LFmt.km(run.km);
  const DISP = "'Barlow Condensed', system-ui, sans-serif";
  const UI = "'Inter', system-ui, sans-serif";

  if (poster) {
    // ── CENTERED layout (poster UOB, tanpa foto) ──
    const cx = W / 2;
    drawPulse(H * 0.42);
    ctx.fillStyle = '#fff';
    ctx.font = "800 300px " + DISP; const numW = ctx.measureText(kmStr).width;
    ctx.font = "800 96px " + DISP; const unitW = ctx.measureText(' km').width;
    const startX = cx - (numW + unitW) / 2;
    ctx.textAlign = 'left';
    ctx.font = "800 300px " + DISP; ctx.fillText(kmStr, startX, H * 0.56);
    ctx.font = "800 96px " + DISP; ctx.fillText(' km', startX + numW, H * 0.56);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff'; ctx.font = "800 76px " + DISP;
    ctx.fillText(durLabel, cx, H * 0.56 + 112);
    ctx.fillStyle = 'rgba(255,255,255,0.72)'; ctx.font = "700 34px " + UI;
    ctx.fillText('RUN TIME', cx, H * 0.56 + 162);
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.font = "600 36px " + UI;
    ctx.fillText('#RoadToUOBHeartbeat · ' + dateLabel, cx, H - 90);
    ctx.textAlign = 'left';
  } else {
    // ── BOTTOM-LEFT layout (foto pribadi) ──
    drawPulse(H - 560);
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
    ctx.font = "800 280px " + DISP; ctx.fillText(kmStr, 66, H - 300);
    const kmW = ctx.measureText(kmStr).width;
    ctx.font = "800 88px " + DISP; ctx.fillText('km', 86 + kmW, H - 300);
    ctx.fillStyle = 'rgba(255,255,255,0.72)'; ctx.font = "700 32px " + UI;
    ctx.fillText('RUN TIME', 72, H - 206);
    ctx.fillStyle = '#fff'; ctx.font = "800 64px " + DISP;
    ctx.fillText(durLabel, 72, H - 150);
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = "600 36px " + UI;
    ctx.fillText('#RoadToUOBHeartbeat · ' + dateLabel, 72, H - 64);
  }
  return await new Promise((res) => c.toBlob(res, 'image/png', 0.95));
}

function StoryComposer({ photo, run, onClose }) {
  const [posted, setPosted] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [bgPhoto, setBgPhoto] = React.useState(photo || null); // null = background UOB
  const fileRef = React.useRef(null);
  const durLabel = run.mins ? LFmt.dur(run.mins) : (run.when || 'Today');
  const dateLabel = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const pickPhoto = (e) => { const f = e.target.files && e.target.files[0]; if (f) setBgPhoto(URL.createObjectURL(f)); };

  const share = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await buildStoryBlob({ photo: bgPhoto, run, durLabel, dateLabel });
      const file = new File([blob], 'uob-heartbeat-story.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Road to UOB Heartbeat', text: '#RoadToUOBHeartbeat' });
        setNote('In the share menu, tap Instagram → Stories. Your image is already attached.');
      } else {
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'uob-heartbeat-story.png'; a.click();
        try { window.open('https://www.instagram.com/', '_blank'); } catch (e) {}
        setNote('Image saved to your device — open Instagram and add it to your Story.');
      }
      setPosted(true); setTimeout(onClose, 1800);
    } catch (e) {
      if (e && e.name === 'AbortError') { setBusy(false); return; } // user cancelled share sheet
      setNote('Cannot open the share menu here. Open on your device to share to your Instagram Story.');
      setBusy(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,10,22,0.82)', backdropFilter: 'blur(6px)', animation: 'fadeIn .2s ease', padding: 16 }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.15)', width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LIcon name="close" size={20} color="#fff" stroke={2.4} />
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} style={{ display: 'none' }} />
      {/* Story card 9:16 (live preview of the shared image) */}
      <div style={{ position: 'relative', aspectRatio: '9 / 16', height: 'min(60vh, 520px)', maxWidth: '92vw', borderRadius: 26, overflow: 'hidden', boxShadow: '0 30px 70px -20px rgba(0,0,0,0.6)', background: bgPhoto ? '#000' : '#06203f' }}>
        <img src={bgPhoto || window.asset('ribbon', 'assets/heartbeat-ribbon.png')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        {!bgPhoto && <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,26,62,0.46)' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)' }} />
        {/* brand chip */}
        <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '7px 11px' }}>
          <img src={window.asset('logoUOB', 'assets/uob-heartbeat-logo-trans.png')} alt="UOB Heartbeat" style={{ height: 18, width: 'auto', display: 'block' }} />
          <img src={window.asset('logo20fit', 'assets/logo-20fit.png')} alt="20FIT" style={{ height: 12, width: 'auto', display: 'block', borderLeft: '1px solid rgba(0,0,0,0.12)', paddingLeft: 8 }} />
        </div>

        {bgPhoto ? (
          /* ── personal photo → bottom-left stat ── */
          <div style={{ position: 'absolute', left: 20, right: 20, bottom: 22 }}>
            <PulseLine width={300} height={26} color="var(--red)" strokeWidth={3} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 64, color: '#fff', letterSpacing: -3, lineHeight: 0.9 }}>{LFmt.km(run.km)}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#fff' }}>km</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#fff' }}>{durLabel}</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.4 }}>RUN TIME</div>
            </div>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 12 }}>#RoadToUOBHeartbeat · {dateLabel}</div>
          </div>
        ) : (
          /* ── UOB poster (no photo) → distance CENTERED + waktu ── */
          <React.Fragment>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
              <PulseLine width={220} height={26} color="var(--red)" strokeWidth={3} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 80, color: '#fff', letterSpacing: -3, lineHeight: 0.9, textShadow: '0 2px 18px rgba(4,16,44,0.5)' }}>{LFmt.km(run.km)}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color: '#fff' }}>km</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: '#fff' }}>{durLabel}</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.72)', letterSpacing: 0.5, marginTop: 2 }}>RUN TIME</div>
              </div>
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 22, textAlign: 'center', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>#RoadToUOBHeartbeat · {dateLabel}</div>
          </React.Fragment>
        )}
        {posted && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,10,22,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, animation: 'fadeIn .25s ease', padding: 24, textAlign: 'center' }}>
            <div style={{ width: 76, height: 76, borderRadius: '50%', background: '#0E9F6E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LIcon name="check" size={40} color="#fff" stroke={3} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#fff' }}>Ready to share!</div>
            {note && <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>{note}</div>}
          </div>
        )}
      </div>
      {/* 2 kolom: pilih background — foto kamu ATAU background UOB */}
      {!posted && (
        <div style={{ display: 'flex', gap: 10, marginTop: 14, width: 'min(92vw, 360px)' }}>
          {[
            { id: 'mine', title: 'Your Photo', sub: 'Use your own photo', on: !!bgPhoto, onClick: () => fileRef.current && fileRef.current.click() },
            { id: 'poster', title: 'UOB Background', sub: 'Use the official poster', on: !bgPhoto, onClick: () => setBgPhoto(null) },
          ].map((o) => (
            <button key={o.id} onClick={o.onClick} style={{
              flex: 1, cursor: 'pointer', textAlign: 'left', borderRadius: 16, padding: '12px 13px',
              border: o.on ? '2px solid #fff' : '1.5px solid rgba(255,255,255,0.28)',
              background: o.on ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: o.on ? 'none' : '2px solid rgba(255,255,255,0.5)', background: o.on ? '#0E9F6E' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {o.on && <LIcon name="check" size={11} color="#fff" stroke={3} />}
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13.5, color: '#fff' }}>{o.title}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 5, paddingLeft: 25 }}>{o.sub}</div>
            </button>
          ))}
        </div>
      )}
      {/* action */}
      {!posted ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 14 }}>
          <button onClick={share} disabled={busy} style={{ border: 'none', cursor: busy ? 'wait' : 'pointer', borderRadius: 14, padding: '15px 40px', background: 'var(--red)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 9, boxShadow: '0 12px 26px -8px rgba(244,37,60,0.7)', opacity: busy ? 0.7 : 1 }}>
            <LIcon name="share" size={19} stroke={2.2} /> {busy ? 'Preparing…' : 'Share to Instagram Story'}
          </button>
          <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>{bgPhoto ? 'Your photo becomes the background; stats added automatically' : 'UOB poster background; stats added automatically'}</span>
          {note && <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 12, color: '#FFD0D6', textAlign: 'center', maxWidth: 320, lineHeight: 1.4 }}>{note}</span>}
        </div>
      ) : (
        <div style={{ marginTop: 18, fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>Closing…</div>
      )}
    </div>
  );
}

function LogSheet({ open, step, setStep, connected, brand, onConnect, onSave, lastRun, totalKm, targetKm, streak, onClose }) {
  const [story, setStory] = React.useState(null);
  if (!open) return null;
  const titles = { choose: 'Log Run', watch: 'Log Run', manual: 'Log Run', success: 'Logged!' };
  return (
    <div className="logsheet-root" style={{ position: 'absolute', inset: 0, zIndex: 80, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div className="logsheet-backdrop" onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(2,16,40,0.45)', backdropFilter: 'blur(2px)', animation: 'fadeIn .2s ease' }} />
      <div className="logsheet-card" style={{
        position: 'relative', background: 'var(--bg)', borderRadius: '28px 28px 0 0', maxHeight: '92%', overflow: 'auto',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.2)', animation: 'sheetUp .32s cubic-bezier(.22,1,.36,1)', paddingBottom: 24,
      }}>
        <SheetHandle title={titles[step]} onClose={onClose} />
        {step !== 'success' && <ManualEntry onSave={onSave} />}
        {step === 'success' && lastRun && <SuccessView run={lastRun} newTotal={totalKm} target={targetKm} streak={streak} onDone={onClose} onShareStory={(photo) => setStory({ photo, run: lastRun })} />}
      </div>
      {story && <StoryComposer photo={story.photo} run={story.run} onClose={() => { setStory(null); onClose(); }} />}
    </div>
  );
}

window.LogSheet = LogSheet;
window.StoryComposer = StoryComposer;
