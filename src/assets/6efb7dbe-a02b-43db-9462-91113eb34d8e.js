// leaderboard.jsx — Papan Peringkat
const { Icon: LBIcon, Avatar: LBAvatar, SegTabs: LBTabs, fmt: LBFmt } = window;

// Tidak ada data dummy — papan peringkat hanya menampilkan pelari NYATA
// dari Supabase. Saat offline / belum ada pelari lain, hanya diri sendiri
// yang tampil. `kcp` tiap pelari dipakai untuk papan "My KCP".
const TAB_TODAY = 'Today';
const TAB_BEST = 'Best of Best';
const TAB_KCP = 'My Team';   // tab "My Team": hanya anggota tim yang join

// Normalisasi KCP → "key" padat: lowercase, buang aksen, tanda baca, kata
// pengisi (KCP/Cabang/Branch/…), dan SEMUA spasi. Jadi "KCP Senopati",
// "senopati", "Senopati Branch", "Kc. Senopati", "seno pati" → "senopati".
function normKcp(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[.,/\\()\-_'"]+/g, ' ')
    .replace(/\b(kantor cabang pembantu|kantor cabang|kantor|cabang pembantu|cabang|pembantu|branch|kcp|kcu|kk|kc|cab)\b/g, ' ')
    .replace(/\s+/g, '')
    .trim();
}
// Jarak edit (Levenshtein) untuk toleransi TYPO.
function wLev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}
// Apakah dua KCP cabang yang SAMA? sama persis (setelah normalisasi) ATAU
// beda sedikit karena typo (toleransi tergantung panjang).
function sameKcp(a, b) {
  const x = normKcp(a), y = normKcp(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.length >= 4 && y.length >= 4 && (x.indexOf(y) >= 0 || y.indexOf(x) >= 0)) return true;
  const tol = Math.max(x.length, y.length) >= 8 ? 2 : 1;
  return wLev(x, y) <= tol;
}

// Bagikan link app ke WhatsApp / share sheet HP untuk mengajak rekan.
function shareInvite(meKcp) {
  const url = (typeof window !== 'undefined' && window.location && window.location.origin) || 'https://uob-heartbeat-run.20fit.id';
  const text = `Join me on Road to UOB Heartbeat Run 🏃 — log your runs & climb the leaderboard${meKcp ? ' with ' + meKcp : ''}! ${url}`;
  try { if (navigator.share) { navigator.share({ title: 'Road to UOB Heartbeat Run', text: text, url: url }).catch(function () {}); return; } } catch (e) {}
  try { window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank'); } catch (e) {}
}
function InviteButton({ meKcp }) {
  return (
    <button onClick={() => shareInvite(meKcp)} style={{
      width: '100%', cursor: 'pointer', border: 'none', borderRadius: 16, padding: '14px 0',
      background: '#25D366', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: '0 10px 22px -10px rgba(37,211,102,0.55)',
    }}>
      <LBIcon name="share" size={18} stroke={2.4} /> Invite friends via WhatsApp
    </button>
  );
}

function Podium({ top, meName, meAvatar }) {
  // order: 2nd, 1st, 3rd
  const order = [top[1], top[0], top[2]];
  const heights = [70, 96, 56];
  const medals = ['#B9C2CC', '#F0B429', '#C97B3B'];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, padding: '8px 0 4px' }}>
      {order.map((p, i) => {
        const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
        if (!p) return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, opacity: 0.4 }}>
            <div style={{ width: i === 1 ? 60 : 48, height: i === 1 ? 60 : 48, borderRadius: '50%', background: 'rgba(2,32,71,0.08)', marginBottom: 8 }} />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5, color: 'var(--muted)' }}>—</div>
            <div style={{ width: '100%', maxWidth: 78, height: heights[i], marginTop: 8, borderRadius: '12px 12px 0 0', background: 'rgba(0,96,192,0.08)' }} />
          </div>
        );
        const dispName = (p.me && meName) ? meName : p.name;
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <LBAvatar name={dispName} size={i === 1 ? 60 : 48} ring={medals[i]} src={(p.me ? meAvatar : p.avatar) || p.avatar} />
              <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 22, height: 22, borderRadius: '50%', background: medals[i], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, border: '2px solid var(--bg)' }}>{rank}</div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5, color: 'var(--ink)', textAlign: 'center', lineHeight: 1.1, maxWidth: 90, marginTop: 4 }}>{dispName.split(' ')[0]}</div>
            <div style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 14, color: 'var(--blue)', whiteSpace: 'nowrap' }}>{LBFmt.km0(p.km)} km</div>
            <div style={{ width: '100%', maxWidth: 78, height: heights[i], marginTop: 8, borderRadius: '12px 12px 0 0', background: i === 1 ? 'linear-gradient(var(--blue), var(--blue-deep))' : 'rgba(0,96,192,0.13)' }} />
          </div>
        );
      })}
    </div>
  );
}

function RankRow({ p, rank, meName, meAvatar, meKcp, meTeam }) {
  const deltaColor = p.delta > 0 ? '#0E9F6E' : p.delta < 0 ? 'var(--red)' : 'var(--muted)';
  const dispName = (p.me && meName) ? meName : p.name;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16,
      background: p.me ? 'rgba(0,96,192,0.07)' : 'var(--card)',
      border: p.me ? '1.5px solid var(--blue)' : '1px solid var(--line)',
    }}>
      <span style={{ width: 22, textAlign: 'center', fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 14, color: p.me ? 'var(--blue)' : 'var(--muted)' }}>{rank}</span>
      <LBAvatar name={dispName} size={40} src={(p.me ? meAvatar : p.avatar) || p.avatar} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {dispName}{p.me && <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 9.5, color: '#fff', background: 'var(--blue)', padding: '2px 6px', borderRadius: 6 }}>YOU</span>}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{LBFmt.km(p.km)}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, color: deltaColor }}>
          {p.delta !== 0 && <LBIcon name="arrowUp" size={11} stroke={2.6} style={{ transform: p.delta < 0 ? 'rotate(180deg)' : 'none' }} />}
          <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 10.5 }}>{p.delta === 0 ? '—' : Math.abs(p.delta)}</span>
        </div>
      </div>
    </div>
  );
}

function BestBanner() {
  return (
    <div style={{ margin: '0 20px 16px', borderRadius: 22, padding: '16px 18px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(120deg, #B8860B 0%, #E8B339 45%, #F4D77E 100%)', display: 'flex', alignItems: 'center', gap: 14 }}>
      <LBIcon name="trophy" size={120} color="rgba(255,255,255,0.18)" stroke={2} style={{ position: 'absolute', right: -16, top: -14 }} />
      <div style={{ width: 50, height: 50, borderRadius: 15, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <LBIcon name="trophy" size={28} color="#fff" stroke={2.2} />
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: -0.3, textShadow: '0 1px 8px rgba(120,80,0,0.35)' }}>Best of Best</div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'rgba(255,255,255,0.92)', marginTop: 2 }}>The season’s top runners · highest total distance</div>
      </div>
    </div>
  );
}

function TeamMenu({ team, meIsOwner, onRename, onDelete, onLeave }) {
  const [open, setOpen] = React.useState(false);
  const item = (label, color, onClick) => (
    <button onClick={onClick} style={{ display: 'block', width: '100%', textAlign: 'center', border: 'none', borderTop: '1px solid var(--line)', background: 'none', cursor: 'pointer', padding: '16px 0', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 15, color: color }}>{label}</button>
  );
  return (
    <React.Fragment>
      <button onClick={() => setOpen(true)} style={{ border: 'none', background: 'rgba(2,32,71,0.06)', cursor: 'pointer', borderRadius: 9, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--muted)', fontSize: 19, lineHeight: 1, flexShrink: 0 }}>⋯</button>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(2,16,40,0.45)', backdropFilter: 'blur(2px)', animation: 'fadeIn .2s ease' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg)', borderRadius: '24px 24px 0 0', padding: '8px 0 18px', animation: 'sheetUp .3s cubic-bezier(.22,1,.36,1)', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 40, height: 5, borderRadius: 5, background: 'rgba(2,32,71,0.18)', margin: '10px auto 6px' }} />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)', textAlign: 'center', padding: '6px 20px 8px' }}>{team.name}</div>
            {meIsOwner && item('✏️  Edit team name', 'var(--ink)', () => { setOpen(false); const n = window.prompt('New team name', team.name); if (n && n.trim().length >= 2) onRename(n.trim()); })}
            {meIsOwner && item('🗑️  Delete team', 'var(--red)', () => { setOpen(false); if (window.confirm('Delete team "' + team.name + '"? This cannot be undone.')) onDelete(); })}
            {!meIsOwner && item('🚪  Leave team', 'var(--red)', () => { setOpen(false); if (window.confirm('Leave team "' + team.name + '"?')) onLeave(); })}
            {item('Cancel', 'var(--muted)', () => setOpen(false))}
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

function LeaderboardScreen({ myTodayKm, meName, meAvatar, meKcp, meTeam, meTotalKm, meGender, meNik, meId, teams, team, teamMemberIds, meIsOwner, onSelectTeam, onCreateTeam, onShareTeam, onRenameTeam, onDeleteTeam, onLeaveTeam }) {
  const [tab, setTab] = React.useState(TAB_BEST);   // Best of Best tampil duluan
  const [live, setLive] = React.useState(null);   // { today:[], season:[] } bila online
  const [query, setQuery] = React.useState('');
  const [shown, setShown] = React.useState(10);   // tampil top 10, sisanya "Load more"
  const isToday = tab === TAB_TODAY;
  const isKcp = tab === TAB_KCP;
  React.useEffect(() => { setShown(10); }, [tab, query]);

  React.useEffect(() => {
    if (!window.UZSupaEnabled || !window.UZSupa) return;
    let alive = true;
    Promise.all([
      window.UZSupa.leaderboardDaily(),
      window.UZSupa.leaderboardSeason(),
      window.UZSupa.genderMap ? window.UZSupa.genderMap() : Promise.resolve({}),
      window.UZSupa.nikMap ? window.UZSupa.nikMap() : Promise.resolve({}),
    ]).then(([d, s, gmap, nikmap]) => {
      if (!alive) return;
      const map = (rows, kmKey) => (rows || []).map((r) => {
        const id = r.user_id || r.id || null;
        return {
          name: r.full_name, km: Number(r[kmKey]) || 0, team: r.team,
          kcp: r.kcp || r.department || r.branch || '', id: id, avatar: r.avatar_url || null, delta: 0,
          gender: r.gender || (id && gmap[id]) || '',
          nik: r.nik || (id && nikmap[id]) || '',
          me: (meId && id === meId) || (!meId && meName && r.full_name === meName),
        };
      });
      setLive({ today: map(d, 'km_today'), season: map(s, 'total_km') });
    }).catch((e) => console.warn('leaderboard', e && e.message));
    return () => { alive = false; };
  }, [meName]);

  const online = !!window.UZSupaEnabled;
  // Metrik per-tab: Today = jarak hari ini; Best & My KCP = total musim.
  const meRow = { name: meName || 'You', km: (isToday ? (myTodayKm || 0) : (meTotalKm || 0)), team: meTeam || '', kcp: meKcp || '', nik: meNik || '', id: meId || null, avatar: meAvatar || null, delta: 0, me: true };
  const liveList = live && (isToday ? live.today : live.season);
  // Hanya data nyata: pakai daftar dari Supabase; kalau kosong → cuma diri sendiri.
  let list = (liveList && liveList.length) ? liveList.slice() : [meRow];
  // Pastikan baris "me" selalu ada & memakai angka terbaru milikku.
  if (!list.some((p) => p.me)) list = [meRow, ...list];
  else list = list.map((p) => p.me ? { ...p, km: meRow.km, kcp: meRow.kcp || p.kcp } : p);
  // URUTKAN berdasarkan jarak (terbesar dulu) — view Supabase bisa mengembalikan
  // rank yang belum benar, jadi ranking dihitung ulang di sini dari km.
  list = list.slice().sort((a, b) => (Number(b.km) || 0) - (Number(a.km) || 0));
  // Filter per GENDER: di Today & Best of Best, hanya tampilkan pelari dengan
  // gender yang sama dengan kita (cewek lihat cewek, cowok lihat cowok).
  // Diri sendiri selalu ikut tampil. My Team tetap berbasis tim (tidak difilter gender).
  // Gender efektif: dari profil; kalau kosong, ambil dari baris "me" di data server.
  const myLiveRow = (liveList || []).find((p) => p.me);
  const meGenderEff = meGender || (myLiveRow && myLiveRow.gender) || '';
  if (!isKcp && meGenderEff) {
    const g = String(meGenderEff).toLowerCase();
    list = list.filter((p) => p.me || String(p.gender || '').toLowerCase() === g);
  }
  // Tab "My Team": HANYA anggota tim yang sudah join (by user_id). Diri sendiri selalu masuk.
  if (isKcp) {
    const ids = teamMemberIds || [];
    list = list.filter((p) => p.me || (p.id && ids.indexOf(p.id) >= 0));
    if (!list.some((p) => p.me)) list = [meRow, ...list];
    list = list.slice().sort((a, b) => b.km - a.km);
  }
  const rest = list.slice(3, shown);          // baris #4..#shown (default sampai #10)
  const hasMore = list.length > shown;        // masih ada di bawah → tombol Load more
  const ranked = list.map((p, i) => ({ ...p, _rank: i + 1 }));
  // Cari berdasarkan NAMA atau NIK pegawai
  const q = query.trim().toLowerCase();
  const matchStr = (p) => {
    const nm = (p.me && meName ? meName : p.name) || '';
    const id = (p.me ? (meNik || '') : (p.nik || '')) || '';
    return (nm + ' ' + id).toLowerCase();
  };
  const filtered = q ? ranked.filter((p) => matchStr(p).includes(q)) : null;
  const subtitle = isToday ? 'Distance run today · resets at midnight'
    : isKcp ? ('Team standings' + (team ? ' · ' + team.name : '') + ' · season total')
    : 'Total training distance this season';
  return (
    <div style={{ paddingTop: 64, paddingBottom: 112 }}>
      <div style={{ padding: '0 20px', marginBottom: 16 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color: 'var(--ink)', letterSpacing: -0.8, margin: 0 }}>Leaderboard</h1>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13.5, color: 'var(--muted)', margin: '4px 0 0' }}>{subtitle}</p>
      </div>
      <div style={{ padding: '0 20px', marginBottom: 14 }}>
        <LBTabs tabs={[TAB_TODAY, TAB_BEST, TAB_KCP]} value={tab} onChange={setTab} />
      </div>
      {/* search */}
      <div style={{ padding: '0 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14, padding: '11px 14px' }}>
          <LBIcon name="search" size={17} color="var(--muted)" stroke={2.2} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or NIK…" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--ink)' }} />
          {query && <button onClick={() => setQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, color: 'var(--muted)' }}>✕</button>}
        </div>
      </div>
      {filtered ? (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 9 }}>
          {filtered.length ? filtered.map((p) => <RankRow key={p._rank} p={p} rank={p._rank} meName={meName} meAvatar={meAvatar} meKcp={meKcp} meTeam={meTeam} />)
            : <div style={{ textAlign: 'center', padding: '30px 0', fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--muted)' }}>No runner found for “{query}”.</div>}
        </div>
      ) : (
        <React.Fragment>
          {tab === TAB_BEST && <BestBanner />}
          {isKcp && (teams && teams.length > 1) && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 20px 12px', WebkitOverflowScrolling: 'touch' }}>
              {teams.map((tm) => {
                const on = team && tm.id === team.id;
                return (
                  <button key={tm.id} onClick={() => onSelectTeam && onSelectTeam(tm.id)} style={{
                    flex: '0 0 auto', maxWidth: 180, cursor: 'pointer', borderRadius: 999, padding: '8px 14px',
                    fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5, lineHeight: 1.2,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    border: on ? '1.5px solid var(--blue)' : '1px solid var(--line)',
                    background: on ? 'var(--blue)' : 'var(--card)', color: on ? '#fff' : 'var(--muted)',
                  }}>{tm.name}</button>
                );
              })}
              <button onClick={onCreateTeam} style={{ flex: '0 0 auto', cursor: 'pointer', borderRadius: 999, padding: '8px 13px', whiteSpace: 'nowrap', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12.5, border: '1px dashed var(--line)', background: 'transparent', color: 'var(--blue)' }}>+ New</button>
            </div>
          )}
          {isKcp && (
            <div style={{ margin: '0 20px 14px', display: 'flex', alignItems: 'center', gap: 11, background: 'rgba(0,96,192,0.06)', border: '1px solid rgba(0,96,192,0.18)', borderRadius: 18, padding: '13px 15px' }}>
              <LBIcon name="trophy" size={20} color="var(--blue)" stroke={2.2} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5, color: 'var(--ink)' }}>{team ? team.name : 'You’re not in a team yet'}</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{team ? 'Progress of your team members' : 'Create a team and invite your mates'}</div>
              </div>
              {team && <TeamMenu team={team} meIsOwner={meIsOwner} onRename={onRenameTeam} onDelete={onDeleteTeam} onLeave={onLeaveTeam} />}
            </div>
          )}
          {isKcp && (
            <div style={{ margin: '0 20px 16px' }}>
              {team
                ? <button onClick={onShareTeam} style={{ width: '100%', cursor: 'pointer', border: 'none', borderRadius: 16, padding: '14px 0', background: '#25D366', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: '0 10px 22px -10px rgba(37,211,102,0.55)' }}><LBIcon name="share" size={18} stroke={2.4} /> Invite team via WhatsApp</button>
                : <button onClick={onCreateTeam} style={{ width: '100%', cursor: 'pointer', border: 'none', borderRadius: 16, padding: '14px 0', background: 'var(--blue)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}><LBIcon name="plus" size={18} stroke={2.6} /> Create a team</button>}
            </div>
          )}
          {isKcp && list.length <= 1 ? (
            <div style={{ textAlign: 'center', padding: '8px 30px 4px', fontFamily: 'var(--font-ui)', fontSize: 13.5, color: 'var(--muted)' }}>{team ? 'No teammates have joined yet. Tap the button above to invite your mates! 🏃' : 'Create a team, then invite your mates via WhatsApp to train together. 🏃'}</div>
          ) : (
            <React.Fragment>
              <div style={{ margin: '0 20px 18px', background: 'var(--card)', borderRadius: 24, border: '1px solid var(--line)', padding: '16px 12px 14px' }}>
                <Podium top={list.slice(0, 3)} meName={meName} meAvatar={meAvatar} />
              </div>
              <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {rest.map((p, i) => <RankRow key={i} p={p} rank={i + 4} meName={meName} meAvatar={meAvatar} meKcp={meKcp} meTeam={meTeam} />)}
              </div>
              {hasMore && (
                <div style={{ padding: '12px 20px 0', textAlign: 'center' }}>
                  <button onClick={() => setShown((s) => s + 10)} style={{ cursor: 'pointer', border: '1px solid var(--line)', background: 'var(--card)', borderRadius: 14, padding: '12px 22px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--blue)' }}>
                    Load more ({list.length - shown} more)
                  </button>
                </div>
              )}
            </React.Fragment>
          )}
        </React.Fragment>
      )}

      {/* Disclaimer validasi (English) */}
      <div style={{ margin: '22px 20px 0', background: 'rgba(0,96,192,0.05)', border: '1px solid rgba(0,96,192,0.18)', borderRadius: 16, padding: '13px 15px', display: 'flex', gap: 10 }}>
        <LBIcon name="bell" size={16} color="var(--blue)" stroke={2.2} style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.55 }}>
          The proof photos you submit with each run will be used to verify your distances. These standings are provisional — after the leaderboard closes, the team reviews the photos from your run logs to validate accuracy, and final rankings may be adjusted accordingly.
        </p>
      </div>
    </div>
  );
}

// ── Compact leaderboard card for the home page ──────────────
function HomeLeaderboard({ goTo, myTodayKm, meName, meAvatar, meGender, meId }) {
  // Ambil papan HARI INI yang nyata dari Supabase → peringkat benar (bukan selalu #1).
  const [live, setLive] = React.useState(null);
  const [meGenderSrv, setMeGenderSrv] = React.useState('');
  React.useEffect(() => {
    if (!window.UZSupaEnabled || !window.UZSupa || !window.UZSupa.leaderboardDaily) return;
    let alive = true;
    Promise.all([
      window.UZSupa.leaderboardDaily(),
      window.UZSupa.genderMap ? window.UZSupa.genderMap() : Promise.resolve({}),
    ]).then(([d, gmap]) => {
      if (!alive) return;
      if (meId && gmap && gmap[meId]) setMeGenderSrv(gmap[meId]);
      setLive((d || []).map((r) => {
        const id = r.user_id || r.id || null;
        return { name: r.full_name, km: Number(r.km_today) || 0, avatar: r.avatar_url || null, id: id,
          gender: r.gender || (id && gmap[id]) || '',
          me: (meId && id === meId) || (!meId && meName && r.full_name === meName) };
      }));
    }).catch(function () {});
    return () => { alive = false; };
  }, [meName, meId]);
  // Gabungkan diri sendiri (pakai km hari ini terbaru) + filter gender + urutkan.
  let list = (live || []).slice();
  if (!list.some((p) => p.me)) list = [{ name: meName || 'You', km: myTodayKm || 0, avatar: meAvatar || null, gender: meGender || '', id: meId || null, me: true }, ...list];
  else list = list.map((p) => p.me ? { ...p, km: myTodayKm || 0 } : p);
  // Gender efektif: dari profil; kalau kosong, ambil dari baris "me" di data server.
  const _myRow = (live || []).find((p) => p.me);
  const _g = String(meGender || meGenderSrv || (_myRow && _myRow.gender) || '').toLowerCase();
  if (_g) list = list.filter((p) => p.me || String(p.gender || '').toLowerCase() === _g);
  list = list.slice().sort((a, b) => (Number(b.km) || 0) - (Number(a.km) || 0));
  const myRank = list.findIndex((p) => p.me) + 1;
  const me = list[myRank - 1] || { km: myTodayKm || 0, me: true };
  const hasRun = me && me.km > 0;     // belum lari → jangan dianggap juara
  const medals = ['#F0B429', '#B9C2CC', '#C97B3B'];
  return (
    <div style={{ margin: '20px 20px 0', background: 'var(--card)', borderRadius: 26, border: '1px solid var(--line)', padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LBIcon name="trophy" size={18} color="var(--red)" stroke={2.2} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>Today’s Ranking</span>
        </div>
        <button onClick={() => goTo('Leaderboard')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, color: 'var(--blue)' }}>See all</button>
      </div>
      {/* my rank banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0 14px', padding: 14, borderRadius: 18, background: 'linear-gradient(120deg, var(--blue), var(--blue-deep))' }}>
        <div style={{ textAlign: 'center', minWidth: 46 }}>
          <div style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 26, color: '#fff', lineHeight: 1 }}>{hasRun ? '#' + myRank : '—'}</div>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 9.5, color: 'rgba(255,255,255,0.7)', marginTop: 3, letterSpacing: 0.4 }}>MY RANK</div>
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.2)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Distance today</div>
          <div style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 21, color: '#fff', letterSpacing: -0.5 }}>{LBFmt.km(me.km)} km</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 11.5, color: 'rgba(255,255,255,0.8)' }}>{!hasRun ? 'Log your first run!' : (myRank > 1 ? `${LBFmt.km(list[myRank - 2].km - me.km)} km to #${myRank - 1}` : 'At the top! 🏆')}</div>
        </div>
      </div>
      {/* top 3 — only once there are real runs */}
      {hasRun ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.slice(0, 3).map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: medals[i], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10.5, flexShrink: 0 }}>{i + 1}</span>
              <LBAvatar name={(p.me && meName) ? meName : p.name} size={30} src={(p.me ? meAvatar : p.avatar) || p.avatar} />
              <span style={{ flex: 1, fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13.5, color: p.me ? 'var(--blue)' : 'var(--ink)' }}>{(p.me && meName) ? meName : p.name}{p.me && ' (you)'}</span>
              <span style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{LBFmt.km(p.km)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '6px 0 2px', fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--muted)' }}>No runs logged yet today — be the first! 🏃</div>
      )}
    </div>
  );
}

window.LeaderboardScreen = LeaderboardScreen;
window.HomeLeaderboard = HomeLeaderboard;
