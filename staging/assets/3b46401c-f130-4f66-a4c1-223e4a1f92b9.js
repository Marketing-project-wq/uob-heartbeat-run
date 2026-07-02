// raceplan.js — 15-Week Race Plan (5K & 10K)
// 15 weeks × 7 days, each day: Run / Nutrition / Wind-Down.
// Used by progress.jsx (self-check checklist), shown ≤15 weeks before race day.
// Plain JS → window.RACE_PLAN15 (array of 15 weeks; each week an array of 7 days).
(function () {
  var D = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  function wk(days) { return days.map(function (x, i) { return { d: D[i], run: x[0], eat: x[1], wind: x[2] }; }); }

  window.RACE_PLAN15 = [
    // ── BASE PHASE (1–4) ──
    wk([ // W1
      ['Easy run 20 min (Zone 2)', 'Moderate — oats, banana, eggs; rice, protein, vegetables at lunch', 'Stretch 10′ (calf & hip), warm shower, sleep 22.30'],
      ['Rest', 'Recovery — vegetables, protein, plain yoghurt', 'Journal 5′, light foam roll, sleep 22.30'],
      ['Easy run 25 min (Zone 2)', 'Moderate — rice, eggs, vegetables; banana pre-run', 'Stretch 10′ + 4-7-8 breathing, sleep 22.30'],
      ['Rest or 20 min walk', 'Recovery — vegetables & protein, 2.5L water', 'Legs up the wall 10′, shower, sleep 22.30'],
      ['Cross-train 30 min (swim/cycle/yoga)', 'Moderate — do not train hungry', 'Full-body stretch 15′, no scrolling, sleep ≤23.00'],
      ['Active rest — walk & mobility', 'Recovery — whole foods in moderation', 'Relax, no caffeine after midday, sleep ≤23.30'],
      ['Long easy run 30 min', 'High carb — large breakfast; refuel within 45′ post-run', 'Foam roll 15′, long shower, sleep 22.00'],
    ]),
    wk([ // W2
      ['Easy run 25 min', 'Moderate — oats, fruit, protein; rice & side at lunch', 'Hip & hamstring stretch, shower, sleep 22.30'],
      ['Rest', 'Recovery — omega-3: fish/walnuts', 'Rest routine + 5′ quiet time off phone, sleep 22.30'],
      ['Easy run 30 min', 'Moderate — pre-run snack if running in the evening', 'Stretch + light foam roll, sleep 22.30'],
      ['Rest or walk', 'Recovery — hydrate, reduce sugar', 'Legs up the wall 10′, shower, sleep 22.30'],
      ['Cross-train or rest', 'Moderate — keep a consistent routine', 'Avoid screens 30′ before bed'],
      ['Active rest', 'Recovery — eat to appetite', 'Sleep ≤23.30'],
      ['Long easy run 35 min', 'High carb — large breakfast; refuel within 45′ post-run', 'Foam roll 15′, warm shower, sleep 22.00'],
    ]),
    wk([ // W3
      ['Easy run 30 min', 'Moderate — standard meals', 'Standard routine, sleep 22.30'],
      ['Strides 4×100m after a 15 min easy run', 'Moderate-High — adequate breakfast; protein post-run', 'Longer calf & hip stretch, shower, read'],
      ['Rest', 'Recovery — high protein (muscle repair)', 'Legs up the wall, light foam roll, sleep 22.30'],
      ['Easy run 30 min', 'Moderate — standard meals', 'Standard routine'],
      ['Rest', 'Recovery', 'Relax, sleep ≤23.00'],
      ['Active rest', 'Recovery', 'Relax, sleep ≤23.30'],
      ['Long easy run 40 min', 'High carb — large breakfast + refuel within 45′ post-run', 'Foam roll 15′, long shower, sleep 22.00'],
    ]),
    wk([ // W4 deload
      ['Easy run 25 min (very relaxed)', 'Moderate — slightly smaller portions', 'Earlier night, sleep 22.00 (recovery week)'],
      ['Full rest', 'Recovery — anti-inflammatory: berries, fish, nuts', 'Gentle foam roll, sleep 22.00'],
      ['Easy run 25 min', 'Moderate', 'Standard routine'],
      ['Rest', 'Recovery', 'Sleep 22.00'],
      ['Light cross-train 20 min or walk', 'Moderate', 'Relax'],
      ['Full rest', 'Recovery', 'Adequate sleep (ready for Build phase)'],
      ['Long easy run 35 min', 'High carb — pre & post run', 'Foam roll, warm shower, sleep 22.00'],
    ]),
    // ── BUILD PHASE (5–9) ──
    wk([ // W5
      ['Easy run 30 min', 'Moderate', 'Standard routine, sleep 22.30'],
      ['Rest', 'Recovery', 'Prepare mentally for tomorrow\u2019s tempo; do not stay up late'],
      ['Tempo: 5′ wu + 15′ tempo + 5′ cd', 'High carb — rice, eggs, fruit breakfast; refuel within 30′', 'Foam roll 15′ (quads/calf), long shower, sleep 22.00'],
      ['Easy run 30 min (recovery, very relaxed)', 'Recovery-Moderate — high protein', 'Legs up the wall 10′, sleep 22.30'],
      ['Easy run 30 min', 'Moderate', 'Prepare long-run kit, sleep 22.30'],
      ['Active rest', 'Moderate-High — increase carbs at dinner', 'Earlier night, sleep 22.00'],
      ['Long run 45 min', 'High carb — breakfast 1.5–2 hrs before; refuel within 45′', 'Foam roll 20′, legs up the wall, sleep 22.00'],
    ]),
    wk([ // W6
      ['Easy run 30 min', 'Recovery-Moderate — protein-led', 'Light foam roll, sleep 22.30'],
      ['Intervals 6×400m @ 5K pace, 90s recovery', 'High carb — refuel within 30′; extra hydration', 'Foam roll 15–20′, warm shower, sleep 22.00'],
      ['Full rest', 'Recovery — anti-inflammatory, reduce sugar', 'Legs up the wall 15′, sleep 22.00–22.30'],
      ['Easy run 35 min', 'Moderate', 'Standard routine'],
      ['Rest', 'Recovery', 'Ready for Sunday long run, adequate sleep'],
      ['Active rest', 'Moderate-High — increase carbs at dinner', 'Sleep 22.00'],
      ['Long run 50 min', 'High carb — large breakfast + post-run meal', 'Foam roll 20′, long shower, sleep 22.00'],
    ]),
    wk([ // W7
      ['Easy run 35 min', 'Recovery-Moderate', 'Standard routine'],
      ['Rest', 'Recovery', 'Prepare for Wednesday tempo, sleep 22.00'],
      ['Tempo: 5′ wu + 20′ tempo + 5′ cd', 'High carb — large breakfast; refuel within 30′', 'Foam roll 20′, long shower, sleep 22.00'],
      ['Easy run 35 min + 4× strides', 'Moderate', 'Longer calf stretch, standard routine'],
      ['Rest', 'Recovery', 'Relax, sleep before 23.00'],
      ['Active rest', 'Moderate-High — prepare for long run', 'Sleep 22.00'],
      ['Long run 55 min', 'High carb — largest breakfast yet; hydrate from the night before', 'Foam roll 20–25′, legs up the wall 10′, sleep 21.30–22.00'],
    ]),
    wk([ // W8 deload
      ['Easy run 25 min', 'Moderate — reduced portions', 'Earlier night, sleep 22.00'],
      ['Full rest', 'Recovery — anti-inflammatory', 'Sleep 22.00'],
      ['Light intervals 4×400m (relaxed)', 'Moderate', 'Foam roll, sleep 22.00–22.30'],
      ['Rest', 'Recovery', 'Legs up the wall, sleep 22.00'],
      ['Cross-train or rest', 'Moderate', 'Relax'],
      ['Full rest', 'Recovery', 'Sleep before 23.00'],
      ['Long run 40 min (shorter — deload)', 'High carb — pre & post run', 'Foam roll, shower, sleep 22.00'],
    ]),
    wk([ // W9
      ['Easy run 35 min', 'Moderate', 'Standard routine'],
      ['Intervals 8×400m or 4×800m @ 5K pace', 'High carb — refuel within 30′; add electrolytes', 'Full foam roll 20′, hot shower, sleep 21.30–22.00'],
      ['Full rest', 'Recovery — high protein, anti-inflammatory', 'Legs up the wall 15′, sleep 22.00'],
      ['Easy run 40 min', 'Moderate', 'Standard routine'],
      ['Rest', 'Recovery', 'Prepare mentally for the 60 min long run'],
      ['Active rest', 'High carb — increase carbs significantly', 'Prepare kit, sleep 21.30–22.00'],
      ['Long run 60 min — your first! 🎯', 'High carb — largest breakfast yet; carry water/gel; refuel within 45′', 'Full foam roll 25′, legs up the wall 15′, long shower, sleep 21.30'],
    ]),
    // ── PEAK PHASE (10–12) ──
    wk([ // W10
      ['Easy run 35 min', 'Recovery-Moderate', 'Standard routine, sleep 22.00'],
      ['Tempo intervals 3×10′ @ tempo, 2′ recovery', 'High carb — large breakfast; refuel within 30′; electrolytes', 'Foam roll 20′, long shower, sleep 21.30–22.00'],
      ['Full rest', 'Recovery — oily fish, vegetables, fruit', 'Legs up the wall 15′, sleep 22.00'],
      ['Easy run 40 min', 'Moderate', 'Standard routine'],
      ['Rest', 'Recovery', 'Relax, sleep before 23.00'],
      ['Active rest', 'High carb — prepare for long run', 'Sleep 21.30–22.00'],
      ['Long run 65 min', 'High carb — full pre & post-run protocol', 'Full foam roll 25′, legs up the wall 15′, long shower, sleep 21.30'],
    ]),
    wk([ // W11
      ['Easy run 40 min', 'Recovery-Moderate', 'Standard routine'],
      ['Race simulation: 2×2km @ goal 5K pace', 'High carb — eat as on race day (familiar foods)', 'Log pace & feel in journal, foam roll 20′, sleep 21.30'],
      ['Full rest', 'Recovery', 'Sleep 22.00'],
      ['Easy run 40 min', 'Moderate', 'Standard routine'],
      ['Rest', 'Recovery-Moderate — increase carbs at dinner', 'Sleep 22.00'],
      ['Long run 70 min — PEAK (highest point) 🔝', 'Maximum carb — carry gel/dates; full rest afterwards', 'Foam roll 30′, legs up the wall 15′, warm bath, sleep 21.00–21.30'],
      ['Full rest', 'Full recovery — protein, anti-inflammatory, hydration', 'Light foam roll, sleep 22.00'],
    ]),
    wk([ // W12
      ['Easy run 35 min', 'Moderate', 'Standard routine'],
      ['5K time trial (genuine effort)', 'High carb — eat exactly as planned for race day', 'Log time & conditions, foam roll 20′, sleep 21.30'],
      ['Full rest', 'Recovery', 'Legs up the wall, sleep 22.00'],
      ['Easy run 40 min', 'Moderate', 'Standard routine'],
      ['Rest', 'Recovery', 'Relax (taper begins next week)'],
      ['Active rest', 'Moderate-High', 'Sleep 22.00'],
      ['Long run 60 min', 'High carb — full protocol', 'Foam roll, long shower, sleep 21.30'],
    ]),
    // ── TAPER PHASE (13–14) ──
    wk([ // W13
      ['Easy run 30 min', 'Moderate — portions ease down slightly', 'Standard routine'],
      ['Rest', 'Recovery', 'Sleep 22.00'],
      ['Tempo run 10 min + 4× strides', 'Moderate-High — do not under-fuel', 'Light foam roll, sleep 22.00'],
      ['Rest', 'Recovery', 'Sleep 22.00'],
      ['Easy run 25 min', 'Moderate', 'Relax, sleep before 23.00'],
      ['Active rest', 'Moderate', 'Sleep 22.00'],
      ['Long run 45 min (shorter than peak)', 'Moderate-High — pre & post run', 'Foam roll, shower, sleep 22.00'],
    ]),
    wk([ // W14
      ['Easy run 25 min', 'Moderate', 'Standard routine'],
      ['Rest', 'Recovery', 'Sleep 22.00'],
      ['Easy run 20 min + 4× strides', 'Moderate — do not cut carbs', 'Light foam roll, sleep 22.00'],
      ['Rest', 'Recovery-Moderate', 'Sleep 22.00'],
      ['Easy run 15–20 min very relaxed', 'Moderate — increase carbs at dinner (T-3 days)', 'Avoid new activities, sleep 22.00'],
      ['Rest or light walk', 'High carb (carb load T-2) — rice/potato/pasta', 'Prepare all race kit, sleep 21.30'],
      ['Full rest', 'High carb (carb load T-1) — familiar foods, finish by 19.30', 'No scrolling/race results. Stretch 5′, shower, sleep 21.00–21.30'],
    ]),
    // ── RACE WEEK (15) ──
    wk([ // W15
      ['Easy run 15–20 min very relaxed', 'Moderate — familiar foods, no new menu', 'Standard routine, sleep 22.00'],
      ['Rest or walk', 'Moderate-High', 'Sleep 22.00'],
      ['Shakeout run 10–15 min + 3× strides', 'Moderate-High — start increasing carbs', 'Sleep 22.00'],
      ['Full rest (T-2)', 'High carb (carb load) — finish by 19.00', 'The T-2 night matters most. Prepare your kit, sleep 21.00–21.30'],
      ['Full rest (T-1)', 'High carb — light, familiar dinner; no alcohol/spicy/soda', 'Everything is ready. No weather/results checking. Stretch 5′, sleep 21.00'],
      ['RACE DAY — trust the training! 🏁', 'Wake 3 hrs before; familiar breakfast (rice & eggs / oats & banana); 30′ before: 1 date / ½ banana', 'Post-race: recovery meal within 45′ (carbs+protein), hydrate, foam roll, sleep well'],
      ['Recovery — light walk / rest', 'Full recovery — protein, vegetables, hydration', 'Celebrate! Light foam roll, adequate sleep'],
    ]),
  ];
})();
