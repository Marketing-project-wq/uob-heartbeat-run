// home.jsx — Beranda screen
const { Icon: HIcon, ProgressRing: HRing, PulseLine: HPulse, Avatar: HAvatar, DayStrip: HDayStrip, fmt: HFmt } = window;

function BrandHeader({ onProfile, userName, onBell, notifCount, avatarUrl }) {
  return (
    <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src={window.asset('logoUOB', 'assets/uob-heartbeat-logo-trans.png')} alt="UOB Heartbeat" style={{ height: 30, width: 'auto', display: 'block' }} />
        <img src={window.asset('logo20fit', 'assets/logo-20fit.png')} alt="20FIT" style={{ height: 16, width: 'auto', display: 'block', borderLeft: '1px solid var(--line)', paddingLeft: 12 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBell || onProfile} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', position: 'relative' }}>
          <HIcon name="bell" size={22} color="var(--ink)" stroke={2} />
          {notifCount > 0 && <span style={{ position: 'absolute', top: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', border: '1.5px solid var(--bg)' }} />}
        </button>
        <button onClick={onProfile} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
          <HAvatar name={userName || 'Runner'} size={36} src={avatarUrl} />
        </button>
      </div>
    </div>
  );
}

function CountdownHero({ daysLeft, raceName, raceDate }) {
  return (
    <div className="hb-ribbon" style={{
      margin: '0 20px', borderRadius: 26, padding: '18px 20px 0', overflow: 'hidden',
      boxShadow: '0 16px 34px -12px rgba(10,60,140,0.5)',
    }}>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11, letterSpacing: 1.5, color: 'rgba(255,255,255,0.82)', textShadow: '0 1px 8px rgba(4,20,60,0.4)' }}>ROAD TO RACE DAY</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
          <span style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 52, lineHeight: 1, color: '#fff', letterSpacing: -2, textShadow: '0 2px 14px rgba(4,20,60,0.42)' }}>{daysLeft}</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 16, color: 'rgba(255,255,255,0.92)', paddingBottom: 4 }}>days left</span>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5, color: '#fff', letterSpacing: -0.2, marginTop: 6, textShadow: '0 1px 10px rgba(4,20,60,0.45)' }}>{raceName}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end', marginTop: 3, color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 8px rgba(4,20,60,0.4)' }}>
          <HIcon name="calendar" size={13} stroke={2.2} />
          <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 12.5 }}>{raceDate}</span>
        </div>
      </div>
      <div className="hero-pulse" style={{ marginTop: 8, marginLeft: -20, marginRight: -20 }}>
        <HPulse width={402} height={36} color="rgba(255,255,255,0.92)" strokeWidth={2.6} animated dotColor="#fff" />
      </div>
    </div>
  );
}

function ProgressCard({ total, target, weekKm, paceNote, onEditGoal }) {
  const remaining = Math.max(0, target - total);
  const pct = Math.round((total / target) * 100);
  return (
    <div data-tour="goals" style={{ margin: '16px 20px 0', background: 'var(--card)', borderRadius: 26, border: '1px solid var(--line)', padding: 22, display: 'flex', alignItems: 'center', gap: 18 }}>
      <HRing value={total} max={target} size={132} stroke={13}>
        <span style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 28, color: 'var(--ink)', letterSpacing: -1, lineHeight: 1 }}>{HFmt.km0(total)}</span>
        <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>/ {target} km</span>
      </HRing>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: 'var(--blue)', letterSpacing: 0.3 }}>TRAINING TARGET</div>
          <button onClick={onEditGoal} style={{ border: 'none', background: 'rgba(0,96,192,0.08)', cursor: 'pointer', borderRadius: 8, padding: '4px 9px', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11.5, color: 'var(--blue)' }}>
            <HIcon name="target" size={13} stroke={2.4} /> Edit
          </button>
        </div>
        <div style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 22, color: 'var(--ink)', letterSpacing: -0.5, marginTop: 2 }}>{pct}% complete</div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--muted)', marginTop: 6, lineHeight: 1.45 }}>
          Remaining <b style={{ color: 'var(--ink)' }}>{HFmt.km(remaining)} km</b> until race-day readiness.
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, background: 'rgba(14,159,110,0.1)', color: '#0E7A52', padding: '5px 10px', borderRadius: 9 }}>
          <HIcon name="check" size={13} stroke={2.6} />
          <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11.5 }}>{paceNote}</span>
        </div>
      </div>
    </div>
  );
}

function WatchChip({ connected, brand, onConnect }) {
  return (
    <button onClick={onConnect} style={{
      width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px',
      background: 'var(--card)', borderRadius: 16, border: '1px solid var(--line)',
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 11, background: connected ? 'rgba(0,96,192,0.1)' : 'rgba(2,32,71,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <HIcon name="watch" size={20} color={connected ? 'var(--blue)' : 'var(--muted)'} stroke={2} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{connected ? brand : 'Connect Strava'}</div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: connected ? '#0E7A52' : 'var(--muted)', fontWeight: 600, marginTop: 1 }}>
          {connected ? '● Auto-sync active' : 'Import your runs automatically'}
        </div>
      </div>
      <HIcon name="chevron" size={18} color="var(--muted)" stroke={2.2} />
    </button>
  );
}

function RunRow({ run, first }) {
  const srcColor = { watch: 'var(--blue)', manual: 'var(--muted)', strava: '#FC4C02' }[run.source] || 'var(--muted)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 0', borderTop: first ? 'none' : '1px solid var(--line)' }}>
      <div style={{ width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg, rgba(0,96,192,0.12), rgba(244,37,60,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <HIcon name="run" size={24} color="var(--blue)" stroke={2} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 17, color: 'var(--ink)', letterSpacing: -0.4 }}>{HFmt.km(run.km)} km</span>
          {run.mins ? <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 12, color: 'var(--muted)' }}>· {HFmt.dur(run.mins)}</span> : null}
        </div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{run.when}</div>
      </div>
      <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 10.5, color: srcColor, textTransform: 'uppercase', letterSpacing: 0.4, display: 'flex', alignItems: 'center', gap: 4 }}>
        {run.source === 'watch' && <HIcon name="watch" size={13} stroke={2.2} />}
        {run.source === 'watch' ? 'Watch' : 'Manual'}
      </span>
    </div>
  );
}

function HomeScreen({ data, onLog, onConnect, onProfile, goTo, onEditGoal, onBell, notifCount }) {
  return (
    <div style={{ paddingTop: 58, paddingBottom: 112 }}>
      <BrandHeader onProfile={onProfile} userName={data.userName} onBell={onBell} notifCount={notifCount} avatarUrl={data.avatarUrl} />
      <CountdownHero daysLeft={data.daysLeft} raceName={data.raceName} raceDate={data.raceDate} />
      <ProgressCard total={data.totalKm} target={data.targetKm} weekKm={data.weekKm} paceNote={data.paceNote} onEditGoal={onEditGoal} />

      {/* CTA */}
      <div style={{ margin: '16px 20px 0' }} data-tour="log">
        <button onClick={onLog} style={{
          width: '100%', border: 'none', cursor: 'pointer', borderRadius: 18, padding: '17px 0',
          background: 'linear-gradient(135deg, #FF5168 0%, #ED1846 58%, #C9123C 100%)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 17, letterSpacing: -0.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
          boxShadow: '0 12px 24px -8px rgba(237,24,70,0.55)',
        }}>
          <HIcon name="plus" size={21} stroke={2.8} />
          Today’s Run
        </button>
      </div>

      {/* Today's ranking */}
      {window.HomeLeaderboard && <window.HomeLeaderboard goTo={goTo} myTodayKm={data.myTodayKm} meName={data.userName} meAvatar={data.avatarUrl} meGender={data.gender} meId={data.meId} />}

      {/* Daily checklist / Race Plan (same as on Progress) */}
      {window.WeeklyPlan && (
        <div style={{ margin: '20px 20px 0' }} data-tour="daily">
          <window.WeeklyPlan data={data} />
        </div>
      )}

      {/* Sleep & hydration — manual, resets each day */}
      {window.WellnessCards && (
        <div style={{ margin: '20px 20px 0' }} data-tour="wellness">
          <window.WellnessCards sleepLog={data.sleepLog} waterLog={data.waterLog} onLogSleep={data.onLogSleep} onSetWater={data.onSetWater} daysLeft={data.daysLeft} />
        </div>
      )}

      {/* Week — bisa diklik untuk lihat progres tiap minggu di halaman Progress */}
      <button onClick={() => goTo('Progress')} style={{
        display: 'block', textAlign: 'left', cursor: 'pointer',
        margin: '20px 20px 0', width: 'calc(100% - 40px)', background: 'var(--card)', borderRadius: 26, border: '1px solid var(--line)', padding: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>This Week</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 13, color: 'var(--blue)' }}>{HFmt.km(data.weekKm)} km</span>
            <HIcon name="chevron" size={18} color="var(--muted)" stroke={2.2} />
          </span>
        </div>
        <HDayStrip days={data.week} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 12, color: 'var(--blue)' }}>
          <HIcon name="chart" size={14} stroke={2.4} />
          <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12 }}>See weekly progress</span>
        </div>
      </button>

      {/* Recent */}
      <div style={{ margin: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>Recent Runs</span>
          <button onClick={() => goTo('Profile')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, color: 'var(--blue)' }}>See all</button>
        </div>
        <div style={{ background: 'var(--card)', borderRadius: 20, border: '1px solid var(--line)', padding: '4px 16px' }}>
          {data.runs.slice(0, 3).map((r, i) => <RunRow key={i} run={r} first={i === 0} />)}
        </div>
      </div>
    </div>
  );
}

window.HomeScreen = HomeScreen;
