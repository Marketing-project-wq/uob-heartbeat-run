// ui.jsx — shared primitives for Road to UOB Heartbeat
// Brand: UOB blue #0060C0, heartbeat red #F4253C
// Exports to window: fmt, Icon, ProgressRing, PulseLine, Avatar, DayStrip, StatTile, SegTabs, asset

// asset(id, path): use the bundled blob URL (window.__resources[id]) when present
// (standalone/offline build), otherwise fall back to the real file path (live preview).
function asset(id, path) { return (window.__resources && window.__resources[id]) || path; }

const fmt = {
  km: (n) => (Math.round(n * 10) / 10).toFixed(1),
  km0: (n) => Math.round(n).toString(),
  pace: (minPerKm) => {
    const m = Math.floor(minPerKm);
    const s = Math.round((minPerKm - m) * 60);
    return `${m}'${String(s).padStart(2, '0')}"`;
  },
  dur: (mins) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:00` : `${m}:00`;
  },
};

// ── Icon set (stroke-based, sporty) ─────────────────────────
function Icon({ name, size = 24, color = 'currentColor', stroke = 2.2, fill = 'none', style }) {
  const common = {
    width: size, height: size, viewBox: '0 0 24 24', fill,
    stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round', style,
  };
  const paths = {
    home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>,
    chart: <><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></>,
    trophy: <><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M17 5h3v2a3 3 0 0 1-3 3" /><path d="M7 5H4v2a3 3 0 0 0 3 3" /><path d="M9 18h6" /><path d="M12 14v4" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    watch: <><rect x="6" y="7" width="12" height="10" rx="3" /><path d="M9 7 9.5 3h5L15 7" /><path d="M9 17l.5 4h5l.5-4" /><path d="M12 11v2l1.5 1" /></>,
    bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill={color} stroke="none" />,
    flame: <path d="M12 2c1.5 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.2.4-2 1-2.8C8 9 8 11 8 11c-1.5-1-2-3 0-6 .5 2 2 2.5 2 4 .8-1 2-2.5 2-7Z" />,
    check: <path d="M5 12.5 10 17.5 19 6.5" />,
    chevron: <path d="M9 6l6 6-6 6" />,
    chevronL: <path d="M15 6l-6 6 6 6" />,
    close: <><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
    run: <><circle cx="13" cy="4.5" r="1.8" fill={color} stroke="none" /><path d="M9 21l2.5-5 .5-3-3 1.5L7 17" /><path d="M12 13.5 14.5 11l2.5 1.5 2 .5" /><path d="M12 13.5l-3.5-2 2-3.5 3 2 2.5-.5" /></>,
    map: <><path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Z" /><path d="M9 4v13" /><path d="M15 6.5v13" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18" /><path d="M8 3v4M16 3v4" /></>,
    medal: <><circle cx="12" cy="14" r="6" /><path d="M9 8.5 6.5 3h11L15 8.5" /><path d="M12 12.5l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2L9 14.6l2-.3.9-1.8Z" fill={color} stroke="none" /></>,
    target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill={color} stroke="none" /></>,
    share: <><circle cx="18" cy="6" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.2 10.8 15.8 7.2M8.2 13.2 15.8 16.8" /></>,
    arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
    bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 19a2 2 0 0 0 4 0" /></>,
    moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z" />,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

// ── Progress ring ───────────────────────────────────────────
function ProgressRing({ value, max, size = 220, stroke = 18, children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const dash = circ * pct;
  const gid = React.useMemo(() => 'rg' + Math.random().toString(36).slice(2, 8), []);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--blue)" />
            <stop offset="100%" stopColor="var(--blue-bright)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ring-track, rgba(2,32,71,0.08))" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gid})`}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  );
}

// ── ECG / heartbeat pulse line ──────────────────────────────
function PulseLine({ width = 360, height = 48, color = 'var(--red)', opacity = 1, strokeWidth = 2.4, animated = false, dotColor }) {
  const mid = height / 2;
  const x = (f) => +(width * f).toFixed(2);
  // Garis statis (non-animasi): satu beat ECG penuh, tak terpotong.
  const dStatic = `M0 ${mid} L${x(0.09)} ${mid}`
    + ` L${x(0.115)} ${mid - height * 0.20} L${x(0.14)} ${mid + height * 0.12} L${x(0.165)} ${mid}`
    + ` L${x(0.215)} ${mid} L${x(0.24)} ${mid - height * 0.27} L${x(0.265)} ${mid}`
    + ` L${x(0.31)} ${mid}`
    + ` L${x(0.35)} ${height * 0.12} L${x(0.39)} ${height * 0.88} L${x(0.415)} ${mid - height * 0.20} L${x(0.44)} ${mid}`
    + ` L${width} ${mid}`;
  if (!animated) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', opacity }} preserveAspectRatio="none">
        <path d={dStatic} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  // ── Animasi MENGALIR (EKG monitor): waveform di-scroll terus ke kiri,
  //    dengan beat yang BERVARIASI (amplitudo beda-beda), loop mulus. ──
  const W = width;
  const beat = (x0, w, amp) => {
    const up = mid - (mid - height * 0.12) * amp;   // puncak spike (skala)
    const dn = mid + (height * 0.88 - mid) * amp;   // lembah spike
    const bu = mid - height * 0.16 * amp;           // bump kecil
    const re = mid - height * 0.12 * amp;           // rebound kecil
    const X = (f) => +(x0 + w * f).toFixed(2);
    return ` L${X(0.18)} ${mid} L${X(0.26)} ${bu} L${X(0.31)} ${mid}`
      + ` L${X(0.46)} ${mid} L${X(0.52)} ${up} L${X(0.58)} ${dn} L${X(0.63)} ${re} L${X(0.68)} ${mid}`
      + ` L${X(1)} ${mid}`;
  };
  // satu periode (lebar W) = 3 beat beda tinggi; digandakan untuk loop mulus.
  const amps = [1, 0.55, 0.82];
  const period = (x0) => beat(x0, W * 0.34, amps[0]) + beat(x0 + W * 0.34, W * 0.33, amps[1]) + beat(x0 + W * 0.67, W * 0.33, amps[2]);
  const d = `M0 ${mid}` + period(0) + ` L${W} ${mid}` + period(W);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', opacity }} preserveAspectRatio="none">
      <g>
        <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        <animateTransform attributeName="transform" type="translate" from="0 0" to={`${-W} 0`} dur="5s" repeatCount="indefinite" calcMode="linear" />
      </g>
    </svg>
  );
}

// ── Avatar (initials, deterministic tint) ───────────────────
function Avatar({ name, size = 40, src, ring }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const hues = ['#0060C0', '#F4253C', '#0E9F6E', '#7A5AE0', '#E8820C', '#1E88A8'];
  const tint = hues[name.length % hues.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: src ? `center/cover url(${src})` : tint,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.36, fontFamily: 'var(--font-ui)',
      boxShadow: ring ? `0 0 0 3px var(--card), 0 0 0 5px ${ring}` : 'none',
    }}>{!src && initials}</div>
  );
}

// ── Week day strip ──────────────────────────────────────────
function DayStrip({ days }) {
  // days: [{label, km, done, today}]
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
      {days.map((d, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, flex: 1 }}>
          <div style={{
            width: '100%', height: 60, borderRadius: 13, position: 'relative', overflow: 'hidden',
            background: d.done ? 'var(--blue)' : 'rgba(2,32,71,0.05)',
            border: d.today ? '2px solid var(--red)' : '2px solid transparent',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}>
            {d.done && (
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${Math.min(100, (d.km / 12) * 100)}%`, background: 'var(--blue-bright)' }} />
            )}
            <span style={{
              position: 'relative', zIndex: 1, fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 13, paddingBottom: 6, color: d.done ? '#fff' : 'var(--muted)',
            }}>{d.done ? fmt.km(d.km) : '·'}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: d.today ? 'var(--red)' : 'var(--muted)', fontFamily: 'var(--font-ui)' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Stat tile ───────────────────────────────────────────────
function StatTile({ icon, value, unit, label, accent }) {
  return (
    <div style={{
      background: 'var(--card)', borderRadius: 18, padding: '15px 16px',
      border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: accent || 'var(--muted)' }}>
        <Icon name={icon} size={17} stroke={2.4} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', fontFamily: 'var(--font-ui)', letterSpacing: 0.2 }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 24, color: 'var(--ink)', letterSpacing: -0.5 }}>{value}</span>
        {unit && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', fontFamily: 'var(--font-ui)' }}>{unit}</span>}
      </div>
    </div>
  );
}

// ── Segmented tabs ──────────────────────────────────────────
function SegTabs({ tabs, value, onChange }) {
  return (
    <div style={{ display: 'flex', background: 'rgba(2,32,71,0.06)', borderRadius: 13, padding: 4, gap: 4 }}>
      {tabs.map((t) => (
        <button key={t} onClick={() => onChange(t)} style={{
          flex: 1, border: 'none', cursor: 'pointer', borderRadius: 10, padding: '9px 0', whiteSpace: 'nowrap',
          fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13.5,
          background: value === t ? 'var(--card)' : 'transparent',
          color: value === t ? 'var(--ink)' : 'var(--muted)',
          boxShadow: value === t ? '0 1px 4px rgba(2,32,71,0.12)' : 'none',
          transition: 'all .18s ease',
        }}>{t}</button>
      ))}
    </div>
  );
}

Object.assign(window, { fmt, Icon, ProgressRing, PulseLine, Avatar, DayStrip, StatTile, SegTabs, asset });
