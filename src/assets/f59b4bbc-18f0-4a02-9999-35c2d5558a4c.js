// store.js — per-account persistence (prototype, localStorage).
// Keyed by EMAIL + NAME so the same person sees the same state on re-login,
// including a persisted Strava connection (no need to reconnect each time).
//
// NOTE: localStorage is per-browser. True cross-browser / cross-device
// persistence is provided by Supabase (tables profiles + app_connections):
// on login from any device the app reads app_connections.connected = true,
// so Strava stays linked. See supabase_schema.sql. This file mirrors that
// behaviour locally for the prototype.
(function () {
  var USERS = 'uobzoe_users_v1';
  var SESSION = 'uobzoe_session_v1';

  function readAll() { try { return JSON.parse(localStorage.getItem(USERS) || '{}'); } catch (e) { return {}; } }
  function writeAll(o) { try { localStorage.setItem(USERS, JSON.stringify(o)); } catch (e) {} }
  function keyFor(email, name) {
    return (email || '').trim().toLowerCase() + '|' + (name || '').trim().toLowerCase();
  }

  function loadUser(email, name) {    var all = readAll();
    // exact email+name match first; fall back to any record with same email
    var exact = all[keyFor(email, name)];
    if (exact) return exact;
    var em = (email || '').trim().toLowerCase();
    for (var k in all) { if (k.split('|')[0] === em) return all[k]; }
    return null;
  }

  function saveUser(email, name, data) {
    var all = readAll();
    var k = keyFor(email, name);
    all[k] = Object.assign({}, all[k] || {}, data, { email: email, name: name, updated: Date.now() });
    writeAll(all);
    return all[k];
  }

  // akun yang paling terakhir dipakai (untuk auto-fill saat login ulang)
  function lastUser() {
    var all = readAll();
    var best = null;
    for (var k in all) {
      var r = all[k];
      if (!best || (r.updated || 0) > (best.updated || 0)) best = r;
    }
    if (!best) return null;
    return {
      email: best.email || (best.profile && best.profile.email) || '',
      name: best.name || (best.profile && best.profile.name) || '',
      phone: best.phone || (best.profile && best.profile.phone) || '',
      kcp: (best.profile && best.profile.kcp) || best.kcp || '',
    };
  }

  function setSession(email, name) { try { localStorage.setItem(SESSION, JSON.stringify({ email: email, name: name })); } catch (e) {} }
  function getSession() { try { return JSON.parse(localStorage.getItem(SESSION) || 'null'); } catch (e) { return null; } }
  function clearSession() { try { localStorage.removeItem(SESSION); } catch (e) {} }

  // ── Identitas terakhir (untuk auto-isi form Login/Sign up) ──
  // Disimpan terpisah & langsung diperbarui begitu user mengisi form,
  // sehingga saat kembali (termasuk di HP) kolom email/nama/no. HP/KCP
  // otomatis terisi tanpa menunggu proses sign-in selesai.
  var IDENTITY = 'uobzoe_lastid_v1';
  function getLastIdentity() {
    try {
      var v = JSON.parse(localStorage.getItem(IDENTITY) || 'null');
      if (v && (v.email || v.name || v.phone || v.kcp)) return v;
    } catch (e) {}
    return lastUser(); // fallback: turunkan dari akun terakhir yang dipakai
  }
  function setLastIdentity(o) {
    try {
      var prev = getLastIdentity() || {};
      localStorage.setItem(IDENTITY, JSON.stringify({
        email: (o && o.email) || prev.email || '',
        name: (o && o.name) || prev.name || '',
        phone: (o && o.phone) || prev.phone || '',
        kcp: (o && o.kcp) || prev.kcp || '',
      }));
    } catch (e) {}
  }

  window.UZStore = { loadUser: loadUser, saveUser: saveUser, lastUser: lastUser, setSession: setSession, getSession: getSession, clearSession: clearSession, getLastIdentity: getLastIdentity, setLastIdentity: setLastIdentity, keyFor: keyFor };
})();
