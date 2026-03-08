// ═══════════════════════════════════════════════════
//  FORGE — App Logic
// ═══════════════════════════════════════════════════

// ── Config API (à remplir) ────────────────────────
const ANTHROPIC_API_KEY = 'REMPLACE_PAR_TA_CLE_API'; // sk-ant-...



// ── Storage helpers ──────────────────────────────
const LS = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  del: k => localStorage.removeItem(k),
};

// ── Models ───────────────────────────────────────
const RANKS = [
  { name:'Initié',     minXP:0,     maxXP:500,    roman:'I',    icon:'🌱', unlocks:['Dashboard','5 habitudes','Timer Focus','Sport basique'] },
  { name:'Apprenti',   minXP:500,   maxXP:1500,   roman:'II',   icon:'🔰', unlocks:['Habitudes illimitées','Calendrier complet'] },
  { name:'Forgeron',   minXP:1500,  maxXP:4000,   roman:'III',  icon:'⚒️', unlocks:['Programme sport complet','Stats détaillées'] },
  { name:'Sentinelle', minXP:4000,  maxXP:8000,   roman:'IV',   icon:'🛡️', unlocks:['Cercle actif','Scanner EDT IA','XP ×1.2'] },
  { name:'Vanguard',   minXP:8000,  maxXP:14000,  roman:'V',    icon:'⚔️', unlocks:['Analytics avancés','Mode Défi','Badge Vanguard'] },
  { name:'Architecte', minXP:14000, maxXP:22000,  roman:'VI',   icon:'🏛️', unlocks:['Thèmes custom','Profil public'] },
  { name:'Ascendant',  minXP:22000, maxXP:35000,  roman:'VII',  icon:'🌟', unlocks:['Mentor mode','XP ×1.5 permanent'] },
  { name:'Légion',     minXP:35000, maxXP:999999, roman:'VIII', icon:'👑', unlocks:['Tout débloqué','Badge Légion','Statut fondateur'] },
];

const PASS_REWARDS = [
  { level:5,  icon:'🌙', name:'Thème Minuit',         type:'theme',   value:'minuit',        desc:'Accent indigo profond' },
  { level:10, icon:'⚔️', name:'Badge Acier',           type:'badge',   value:'acier',         desc:'Visible sur ton profil' },
  { level:15, icon:'📖', name:'Guide Forge Your Mind', type:'content', value:'guide_mind',    desc:'Guide exclusif 30 pages' },
  { level:20, icon:'📊', name:'Stats Avancées',         type:'feature', value:'adv_stats',    desc:'Graphiques de progression' },
  { level:25, icon:'🌐', name:'Cercle Actif',           type:'feature', value:'circle_active',desc:'Participe au classement' },
  { level:30, icon:'🔥', name:'Thème Braise',           type:'theme',   value:'braise',        desc:'Accent orange puissant' },
  { level:35, icon:'💪', name:'Programme Elite',        type:'content', value:'elite_prog',    desc:'Programmes de compétiteurs' },
  { level:40, icon:'🎯', name:'Mode Défi',              type:'feature', value:'challenge_mode',desc:'Défis hebdomadaires' },
  { level:45, icon:'⚡', name:'XP ×1.5 Permanent',    type:'feature', value:'xp_boost',      desc:'Multiplicateur permanent' },
  { level:50, icon:'👑', name:'Titre Légion + Badge',  type:'theme',   value:'acier',         desc:'Statut ultime FORGE' },
];

function defaultHabits() {
  return [
    { id:uid(), name:'Réveil 6h00',           emoji:'⏰', xp:50, streak:14, pillar:'discipline', type:'recurring',  done:true  },
    { id:uid(), name:'Entraînement',           emoji:'💪', xp:80, streak:11, pillar:'sport',      type:'recurring',  done:true  },
    { id:uid(), name:'Lecture 30 min',         emoji:'📖', xp:40, streak:7,  pillar:'ambition',   type:'recurring',  done:true  },
    { id:uid(), name:'Méditation',             emoji:'🧘', xp:30, streak:14, pillar:'discipline', type:'recurring',  done:true  },
    { id:uid(), name:'Pas de réseaux le matin',emoji:'📵', xp:60, streak:5,  pillar:'discipline', type:'recurring',  done:true  },
    { id:uid(), name:'Journal de bord',        emoji:'✍️', xp:35, streak:9,  pillar:'ambition',   type:'recurring',  done:true  },
    { id:uid(), name:'Douche froide',          emoji:'❄️', xp:45, streak:3,  pillar:'physique',   type:'recurring',  done:false },
    { id:uid(), name:'Appeler un mentor',      emoji:'📞', xp:70, streak:0,  pillar:'ambition',   type:'occasional', done:false },
  ];
}

function defaultSport() {
  return { gender:'homme', age:'22', level:'intermediaire', weight:78, height:181, targetWeight:85, waist:80, goals:['masse','force'], sports:['musculation'], equipment:['full_gym','barre'], frequency:4, sessionDuration:60, programDuration:8, hasProgramGenerated:true };
}

function defaultCalendar() {
  return [
    { id:uid(), name:'Maths',   day:1, hour:7,  color:'blue'   },
    { id:uid(), name:'Maths',   day:1, hour:8,  color:'blue'   },
    { id:uid(), name:'Sport 💪',day:0, hour:9,  color:'purple' },
    { id:uid(), name:'Physique',day:2, hour:9,  color:'blue'   },
    { id:uid(), name:'Focus',   day:1, hour:13, color:'green'  },
    { id:uid(), name:'Chimie',  day:4, hour:9,  color:'red'    },
  ];
}

function demoUser() {
  const joined = new Date(); joined.setMonth(joined.getMonth() - 2);
  return {
    username:'demo', email:'demo@forge.app',
    firstName:'Demo', lastName:'User', password:'demo123',
    joinedDate: joined.toISOString(),
    xp:4820, streak:14, streakRecord:21, passLevel:23,
    plan:'pro', theme:'default', unlockedThemes:['default','minuit'],
    badges:['acier'], habits: defaultHabits(), sport: defaultSport(),
    calendarEvents: defaultCalendar(),
    lastReset: todayKey(), todayXP:320, focusMinutes:260, onboarded:true,
  };
}

// ── App state ────────────────────────────────────
let user = null;
let currentTab = 'dashboard';
let focusInterval = null;
let focusSecondsLeft = 1500;
let focusRunning = false;
let focusSessions = 0;
let focusEarned = 0;
let focusTotalMin = 0;
let calendarEvents = [];
let habitModalEditing = null;

// ── Helpers ──────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2); }
function todayKey() { return new Date().toISOString().slice(0,10); }
function getAccent() {
  const themes = { default:'#00FF85', minuit:'#6366f1', braise:'#FF6B35', acier:'#94a3b8' };
  return themes[user?.theme || 'default'] || '#00FF85';
}
function getRank(xp) { return [...RANKS].reverse().find(r => xp >= r.minXP) || RANKS[0]; }
function getRankIdx(xp) { return RANKS.findIndex(r => r.name === getRank(xp).name); }
function fmt(n) { return n.toLocaleString('fr-FR'); }
function bmi(u) { return u.sport ? u.sport.weight / Math.pow(u.sport.height / 100, 2) : 22; }

// ── Persistence ──────────────────────────────────
function saveUser() {
  if (!user || user.username === 'demo') return;
  const users = LS.get('forge_users') || {};
  users[user.username] = user;
  LS.set('forge_users', users);
}
function loadUsers() { return LS.get('forge_users') || {}; }

// ── Auth ─────────────────────────────────────────
function login(u, p) {
  if ((u === 'demo' || u === 'demo@forge.app') && p === 'demo123') {
    user = demoUser();
    calendarEvents = user.calendarEvents;
    LS.set('forge_session', 'demo');
    return true;
  }
  const users = loadUsers();
  const found = users[u] || Object.values(users).find(x => x.email === u);
  if (found && found.password === p) {
    user = found;
    calendarEvents = user.calendarEvents || defaultCalendar();
    LS.set('forge_session', user.username);
    checkDailyReset();
    return true;
  }
  return false;
}

function register(firstName, lastName, email, username, password) {
  if (!firstName || !lastName || !email || !username || !password) return 'Remplis tous les champs.';
  if (password.length < 6) return 'Mot de passe trop court (min. 6).';
  if (!email.includes('@')) return 'Email invalide.';
  const users = loadUsers();
  if (users[username]) return 'Nom d\'utilisateur déjà pris.';
  if (Object.values(users).find(x => x.email === email)) return 'Email déjà utilisé.';
  const joined = new Date();
  user = { username, email, firstName, lastName, password, joinedDate: joined.toISOString(), xp:0, streak:0, streakRecord:0, passLevel:1, plan:'free', theme:'default', unlockedThemes:['default'], badges:[], habits:defaultHabits(), sport:null, calendarEvents:defaultCalendar(), lastReset:todayKey(), todayXP:0, focusMinutes:0, onboarded:false };
  calendarEvents = user.calendarEvents;
  users[username] = user;
  LS.set('forge_users', users);
  LS.set('forge_session', username);
  return null;
}

function logout() {
  LS.del('forge_session');
  user = null;
  showAuth();
}

function checkDailyReset() {
  if (!user) return;
  const today = todayKey();
  if (user.lastReset === today) return;
  user.habits.forEach(h => {
    if (h.type === 'occasional') return;
    if (h.done) h.streak++;
    else if (h.streak > 0) h.streak = 0;
    h.done = false;
  });
  user.lastReset = today;
  user.todayXP = 0;
  saveUser();
}

function tryRestoreSession() {
  const sess = LS.get('forge_session');
  if (!sess) return false;
  if (sess === 'demo') { user = demoUser(); calendarEvents = user.calendarEvents; return true; }
  const users = loadUsers();
  if (users[sess]) { user = users[sess]; calendarEvents = user.calendarEvents || defaultCalendar(); checkDailyReset(); return true; }
  return false;
}

// ── Notification ─────────────────────────────────
let notifTimer;
function notify(icon, text, xp = '') {
  const b = document.getElementById('notif-banner');
  b.innerHTML = `<span style="font-size:16px">${icon}</span><span style="font-size:13px;color:#fff">${text}</span><span style="flex:1"></span>${xp ? `<span class="notif-xp">${xp}</span>` : ''}`;
  b.style.setProperty('--accent-color', getAccent());
  b.classList.add('show');
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => b.classList.remove('show'), 3500);
}

// ── Navigation ────────────────────────────────────
function goTo(tab) {
  currentTab = tab;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn,.mobile-nav-btn').forEach(b => b.classList.remove('active'));
  const view = document.getElementById('view-' + tab);
  if (view) { view.classList.add('active'); renderView(tab); }
  document.querySelectorAll(`[data-tab="${tab}"]`).forEach(b => b.classList.add('active'));
  document.getElementById('main').scrollTo(0, 0);
}

function renderView(tab) {
  const fns = { dashboard:renderDashboard, habits:renderHabits, focus:renderFocus, sport:renderSport, calendar:renderCalendar, scanner:renderScanner, pass:renderPass, circle:renderCircle, ranks:renderRanks, subscription:renderSubscription };
  if (fns[tab]) fns[tab]();
}

// ── Show / Hide screens ───────────────────────────
function showAuth() {
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('app-screen').style.display = 'none';
}
function showApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'flex';
  document.getElementById('sidebar-avatar').textContent = initials();
  applyAccent();
  if (!user.onboarded) { goTo('onboarding'); }
  else { goTo('dashboard'); }
}
function initials() {
  const f = user.firstName?.[0] || '';
  const l = user.lastName?.[0] || '';
  return (f+l).toUpperCase() || user.username.slice(0,2).toUpperCase();
}
function applyAccent() {
  document.documentElement.style.setProperty('--accent', getAccent());
}

// ── Dashboard ─────────────────────────────────────
function renderDashboard() {
  const xp = user.xp, rank = getRank(xp), rIdx = getRankIdx(xp);
  const nextRank = RANKS[rIdx+1];
  const pct = rank.maxXP < 999999 ? (xp - rank.minXP) / (rank.maxXP - rank.minXP) : 1;
  const accent = getAccent();
  const done = user.habits.filter(h=>h.done);
  const habTotal = user.habits.length;

  document.getElementById('view-dashboard').innerHTML = `
    <div class="dash-grid">
      <!-- Header -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between">
        <div>
          <div class="label" style="margin-bottom:6px">Système actif</div>
          <button onclick="goTo('ranks')" style="display:flex;align-items:center;gap:8px;padding:6px 12px;background:linear-gradient(135deg,#1a1a1a,#242424);border-radius:7px;border:1px solid ${accent}66">
            <span>🔥</span>
            <span style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:13px;letter-spacing:2px;color:${accent}">${rank.name.toUpperCase()}</span>
            <span class="label">RANG ${rank.roman}</span>
          </button>
        </div>
        <div style="text-align:right">
          <div class="label" style="margin-bottom:2px">FORGE v3.0</div>
          <div id="dash-clock" style="font-family:'JetBrains Mono',monospace;font-size:11px;color:${accent}"></div>
        </div>
      </div>

      <!-- XP + Streak row -->
      <div style="display:grid;grid-template-columns:1fr 130px;gap:13px">
        <div class="card" style="border-color:${accent}33">
          <div class="xp-main">
            <div>
              <div class="label" style="margin-bottom:4px">XP Totale</div>
              <div style="display:flex;align-items:baseline;gap:4px">
                <span class="xp-number" style="color:${accent}">${fmt(xp)}</span>
                <span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--dim)">XP</span>
              </div>
            </div>
            <div style="text-align:right">
              <div class="label" style="margin-bottom:2px">Prochain rang</div>
              <div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--dim)">${nextRank?.name || 'MAX'}</div>
              ${nextRank ? `<div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted);margin-top:2px">${fmt(nextRank.minXP - xp)} XP restants</div>` : ''}
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;margin:8px 0 4px">
            <span class="label">${rank.name} · ${fmt(rank.minXP)} XP</span>
            <span style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:${accent}">${fmt(xp)} / ${nextRank ? fmt(nextRank.maxXP) : 'MAX'}</span>
          </div>
          <div class="progress-wrap"><div class="progress-fill" id="xp-bar" style="width:0%;background:${accent};color:${accent}"></div></div>
          <div style="margin-top:8px;display:flex;align-items:center;gap:6px">
            <span class="xp-dot" style="background:${accent};box-shadow:0 0 6px ${accent}"></span>
            <span class="label">+${user.todayXP} XP aujourd'hui</span>
          </div>
        </div>
        <div class="card" style="display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center">
          <div style="font-family:'JetBrains Mono',monospace;font-size:36px;font-weight:700;color:${accent};text-shadow:0 0 16px ${accent}66">🔥 ${user.streak}</div>
          <div class="label">JOURS DE STREAK</div>
          <div class="label">Record : ${user.streakRecord}j</div>
          <div class="progress-wrap" style="width:100%">
            <div class="progress-fill" id="streak-bar" style="width:0%;background:var(--gold);color:var(--gold)"></div>
          </div>
        </div>
      </div>

      <!-- Pillars + Score row -->
      <div style="display:grid;grid-template-columns:1fr 130px;gap:13px">
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <span style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:11px;letter-spacing:3px;color:var(--dim)">PILIERS</span>
            <span class="tag tag-green">Actif</span>
          </div>
          <div class="pillars-list">
            ${pillarRow('⚔️','Discipline',0.78,accent,'rgba(0,255,133,.12)','rgba(0,255,133,.2)')}
            ${pillarRow('💪','Physique',0.65,'var(--blue)','rgba(77,144,254,.12)','rgba(77,144,254,.2)')}
            ${pillarRow('🎯','Ambition',0.82,'var(--gold)','rgba(255,184,0,.12)','rgba(255,184,0,.2)')}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div class="card" style="display:flex;flex-direction:column;align-items:center;gap:6px">
            <div class="label">Discipline Score</div>
            <svg class="circular-svg" width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="38" fill="none" stroke="#1a1a1a" stroke-width="6"/>
              <circle cx="45" cy="45" r="38" fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round"
                stroke-dasharray="${2*Math.PI*38}" stroke-dashoffset="${2*Math.PI*38*(1-0.74)}"
                style="transition:stroke-dashoffset 1.5s ease;filter:drop-shadow(0 0 6px ${accent}88)"/>
            </svg>
            <div style="font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:${accent};margin-top:-60px;position:relative;z-index:1">74%</div>
            <div class="label" style="margin-top:32px">SCORE</div>
          </div>
          <button class="btn-primary" style="padding:11px" onclick="goTo('focus')">▶ Focus</button>
        </div>
      </div>

      <!-- Bottom mini stats -->
      <div class="mini-stats">
        <div class="mini-stat"><div class="mini-stat-icon">✅</div><div><div style="font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700">${done.length}/${habTotal}</div><div class="label">Habitudes</div></div></div>
        <div class="mini-stat"><div class="mini-stat-icon">⏱</div><div><div style="font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700">${user.focusMinutes} min</div><div class="label">Focus semaine</div></div></div>
        <div class="mini-stat"><div class="mini-stat-icon">🏋️</div><div><div style="font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700">${user.sport?.sports?.[0] ? capitalize(user.sport.sports[0]) : '—'}</div><div class="label">Programme</div></div></div>
      </div>
    </div>`;

  // Animate bars
  requestAnimationFrame(() => {
    setTimeout(() => {
      const xpBar = document.getElementById('xp-bar');
      const streakBar = document.getElementById('streak-bar');
      if (xpBar) xpBar.style.width = (pct*100)+'%';
      if (streakBar) streakBar.style.width = (user.streak/Math.max(1,user.streakRecord)*100)+'%';
      document.querySelectorAll('.pbar-fill').forEach(b => {
        b.style.width = b.dataset.pct + '%';
      });
    }, 100);
  });

  // Clock
  function tick() {
    const el = document.getElementById('dash-clock');
    if (el) el.textContent = new Date().toLocaleTimeString('fr-FR');
  }
  tick();
  clearInterval(window._clockInterval);
  window._clockInterval = setInterval(tick, 1000);
}

function pillarRow(icon, name, pct, color, iconBg, iconBorder) {
  return `<div class="pillar-row">
    <div class="pillar-icon" style="background:${iconBg};border:1px solid ${iconBorder}">${icon}</div>
    <div class="pillar-bars">
      <div class="pillar-header">
        <span style="font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:2px;color:var(--dim)">${name.toUpperCase()}</span>
        <span style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:${color}">${Math.round(pct*100)}%</span>
      </div>
      <div class="progress-wrap"><div class="progress-fill pbar-fill" data-pct="${pct*100}" style="width:0%;background:${color};color:${color}"></div></div>
    </div>
  </div>`;
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── Habits ────────────────────────────────────────
function renderHabits() {
  const accent = getAccent();
  const recurring = user.habits.filter(h => h.type === 'recurring');
  const occasional = user.habits.filter(h => h.type === 'occasional');
  const done = user.habits.filter(h => h.done);
  const canAdd = user.plan !== 'free' || user.habits.length < 5;

  const xpToday = done.reduce((s,h) => s+h.xp, 0);

  document.getElementById('view-habits').innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px">
      <div class="page-title">HABITUDES</div>
      <div style="text-align:right">
        <div class="label" style="margin-bottom:4px">${new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</div>
        <span class="tag tag-green">${done.length} / ${user.habits.length}</span>
      </div>
    </div>

    <div class="stats-row stats-row-4" style="margin-bottom:18px">
      ${statCard('+'+xpToday,'XP aujourd\'hui',accent)}
      ${statCard('🔥 '+user.streak,'Streak global','var(--gold)')}
      ${statCard(done.length+'/'+user.habits.length,'Complétées','var(--blue)')}
      ${statCard(user.habits.length ? Math.round(done.length/user.habits.length*100)+'%' : '—','Taux du jour','var(--dim)')}
    </div>

    ${!canAdd ? `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(255,184,0,.07);border:1px solid rgba(255,184,0,.2);border-radius:var(--radius);margin-bottom:14px">
      <span style="font-size:12px;color:var(--gold)">🔒 Limite de 5 habitudes atteinte.</span>
      <button onclick="goTo('subscription')" style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#000;background:var(--gold);padding:5px 13px;border-radius:6px">Passer Pro</button>
    </div>` : ''}

    ${recurring.length ? `<div class="section-title"><span>🔄 Récurrentes — reset quotidien</span></div>
    <div id="habits-recurring" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
      ${recurring.map(h => habitRowHTML(h)).join('')}
    </div>` : ''}

    ${occasional.length ? `<div class="section-title"><span>⚡ Occasionnelles — ponctuelles</span></div>
    <div id="habits-occasional" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
      ${occasional.map(h => habitRowHTML(h)).join('')}
    </div>` : ''}

    <button onclick="${canAdd ? 'openHabitModal(null)' : ''}" style="width:100%;padding:14px;border-radius:var(--radius);border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;gap:8px;color:${canAdd ? 'var(--muted)' : 'var(--border)'};font-family:'Rajdhani',sans-serif;font-weight:700;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin-top:4px;cursor:${canAdd ? 'pointer' : 'not-allowed'}">
      ＋ AJOUTER UNE HABITUDE
    </button>`;
}

function habitRowHTML(h) {
  const accent = getAccent();
  const pillarColors = { discipline:accent, physique:'var(--blue)', ambition:'var(--gold)', sport:'var(--purple)' };
  const pc = pillarColors[h.pillar] || accent;
  return `<div class="habit-row ${h.done?'done':''}" id="habit-${h.id}" style="${h.done ? `border-left-color:${accent};background:rgba(0,255,133,.04);border-color:${accent}40` : `border-left-color:transparent`}">
    <div class="habit-check ${h.done?'done':''}" onclick="toggleHabit('${h.id}')" style="${h.done ? `background:${accent};border-color:${accent};box-shadow:0 0 10px ${accent}66` : ''}">
      ${h.done ? '<svg width="11" height="9" viewBox="0 0 11 9"><polyline points="1,4.5 4,8 10,1" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
    </div>
    <div class="habit-emoji">${h.emoji}</div>
    <div class="habit-info">
      <div class="habit-name" style="color:${h.done ? 'var(--muted)' : 'var(--white)'}${h.done ? ';text-decoration:line-through' : ''}">${h.name}</div>
      <div class="habit-meta">
        ${h.type !== 'occasional' ? `<span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:${accent}">🔥 ${h.streak}j</span>` : `<span class="tag" style="color:var(--gold);background:rgba(255,184,0,.1);border-color:rgba(255,184,0,.3);font-size:7px;padding:2px 6px">Occasionnelle</span>`}
        <span style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted)">+${h.xp} XP</span>
        <span style="font-family:'JetBrains Mono',monospace;font-size:7px;color:${pc};background:${pc}1a;border:1px solid ${pc}40;padding:2px 6px;border-radius:4px;letter-spacing:1.5px">${h.pillar.toUpperCase()}</span>
      </div>
    </div>
    <div class="habit-actions">
      <button class="habit-action-btn" onclick="openHabitModal('${h.id}')">✏️</button>
      <button class="habit-action-btn del" onclick="deleteHabit('${h.id}')">🗑</button>
    </div>
  </div>`;
}

function toggleHabit(id) {
  const h = user.habits.find(x => x.id === id);
  if (!h) return;
  const was = h.done;
  h.done = !was;
  if (!was) {
    user.xp += h.xp; user.todayXP += h.xp;
    checkPassLevel();
    notify('⚡', h.name, '+'+h.xp+' XP');
  } else {
    user.xp = Math.max(0, user.xp - h.xp);
    user.todayXP = Math.max(0, user.todayXP - h.xp);
  }
  checkStreak();
  saveUser();
  renderHabits();
  updateSidebarAvatar();
}

function deleteHabit(id) {
  if (!confirm('Supprimer cette habitude ?')) return;
  user.habits = user.habits.filter(h => h.id !== id);
  saveUser();
  renderHabits();
  notify('🗑️', 'Habitude supprimée');
}

function checkStreak() {
  const rec = user.habits.filter(h => h.type !== 'occasional');
  if (rec.length && rec.every(h => h.done)) {
    user.streak++;
    if (user.streak > user.streakRecord) user.streakRecord = user.streak;
  }
}

function checkPassLevel() {
  const newLevel = Math.min(50, Math.max(1, Math.floor(user.xp / 200) + 1));
  if (newLevel > user.passLevel) {
    user.passLevel = newLevel;
    const reward = PASS_REWARDS.find(r => r.level === newLevel);
    if (reward) notify('🎁', 'Débloqué : '+reward.name);
  }
}

// Habit Modal
function openHabitModal(idOrNull) {
  const editing = idOrNull ? user.habits.find(h => h.id === idOrNull) : null;
  habitModalEditing = editing;
  const pillars = ['discipline','physique','ambition','sport'];
  const pillarLabels = { discipline:'⚔️ Discipline', physique:'💪 Physique', ambition:'🎯 Ambition', sport:'🏋️ Sport' };
  document.getElementById('habit-modal-body').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div class="page-title" style="font-size:18px">${editing ? 'MODIFIER' : 'NOUVELLE HABITUDE'}</div>
      <button onclick="closeHabitModal()" style="color:var(--muted);font-size:18px;padding:8px">✕</button>
    </div>
    <div class="form-field" style="margin-bottom:14px">
      <label class="label">Nom de l'habitude</label>
      <input id="hm-name" class="input" placeholder="Ex: Réveil 6h00, Méditation..." value="${editing?.name||''}">
    </div>
    <div class="form-row" style="margin-bottom:14px">
      <div class="form-field">
        <label class="label">Emoji</label>
        <input id="hm-emoji" class="input" placeholder="🔥" value="${editing?.emoji||'📌'}" style="width:80px">
      </div>
      <div class="form-field">
        <label class="label">XP par complétion</label>
        <div class="slider-wrap">
          <input type="range" id="hm-xp" min="10" max="100" step="5" value="${editing?.xp||40}" oninput="document.getElementById('hm-xp-val').textContent=this.value+' XP'">
          <span id="hm-xp-val" class="slider-val">${editing?.xp||40} XP</span>
        </div>
      </div>
    </div>
    <div class="form-field" style="margin-bottom:14px">
      <label class="label">Pilier</label>
      <div class="chips">
        ${pillars.map(p => `<button class="chip ${(editing?.pillar||'discipline')===p?'on':''}" onclick="selectPillar(this,'${p}')" data-pillar="${p}">${pillarLabels[p]}</button>`).join('')}
      </div>
    </div>
    <div class="form-field" style="margin-bottom:20px">
      <label class="label">Type</label>
      <div style="display:flex;background:#111;border-radius:9px;padding:3px">
        <button class="sport-tab ${(editing?.type||'recurring')==='recurring'?'active':''}" onclick="selectHabitType(this,'recurring')" style="flex:1;border-radius:7px">🔄 Récurrente</button>
        <button class="sport-tab ${editing?.type==='occasional'?'active':''}" onclick="selectHabitType(this,'occasional')" style="flex:1;border-radius:7px">⚡ Occasionnelle</button>
      </div>
    </div>
    <button class="btn-primary" onclick="saveHabit()">✓ Enregistrer</button>`;
  showModal('habit-modal');
}

function selectPillar(btn, p) {
  btn.closest('.chips').querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
  btn.classList.add('on');
  btn.dataset.pillar = p;
}
function selectHabitType(btn, t) {
  btn.closest('div').querySelectorAll('.sport-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  btn.dataset.type = t;
}
function saveHabit() {
  const name = document.getElementById('hm-name').value.trim();
  if (!name) return;
  const emoji = document.getElementById('hm-emoji').value || '📌';
  const xp = parseInt(document.getElementById('hm-xp').value);
  const pillarBtn = document.querySelector('#habit-modal-body .chip.on');
  const pillar = pillarBtn ? pillarBtn.dataset.pillar : 'discipline';
  const typeBtn = document.querySelector('#habit-modal-body .sport-tab.active');
  const type = typeBtn ? (typeBtn.textContent.includes('Occasion') ? 'occasional' : 'recurring') : 'recurring';

  if (habitModalEditing) {
    Object.assign(habitModalEditing, { name, emoji, xp, pillar, type });
  } else {
    user.habits.push({ id:uid(), name, emoji, xp, streak:0, pillar, type, done:false });
  }
  saveUser();
  closeHabitModal();
  renderHabits();
  notify('✅', 'Habitude sauvegardée');
}
function closeHabitModal() { hideModal('habit-modal'); }

// ── Focus ──────────────────────────────────────────
function renderFocus() {
  const accent = getAccent();
  const pct = 1 - focusSecondsLeft / 1500;
  const r = 110, circ = 2 * Math.PI * r;
  const mins = String(Math.floor(focusSecondsLeft/60)).padStart(2,'0');
  const secs = String(focusSecondsLeft%60).padStart(2,'0');

  document.getElementById('view-focus').innerHTML = `
    <div class="focus-wrap">
      <div class="label" style="letter-spacing:5px;margin-bottom:36px">MODE FOCUS — POMODORO</div>
      <div class="focus-ring-wrap" style="margin-bottom:36px">
        <svg class="focus-ring-svg" width="240" height="240" viewBox="0 0 240 240">
          <circle cx="120" cy="120" r="${r}" fill="none" stroke="#1a1a1a" stroke-width="4"/>
          <circle id="focus-ring-circle" cx="120" cy="120" r="${r}" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round"
            stroke-dasharray="${circ}" stroke-dashoffset="${circ*(1-pct)}"
            style="transition:stroke-dashoffset .5s linear;filter:drop-shadow(0 0 8px ${accent}88)"/>
        </svg>
        <div class="focus-time-inner">
          <div class="focus-time" id="focus-display">${mins}:${secs}</div>
          <div class="focus-session">SESSION ${focusSessions+1}/4</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;padding:6px 14px;background:${accent}14;border:1px solid ${accent}33;border-radius:20px;margin-bottom:26px">
        <div style="width:5px;height:5px;border-radius:50%;background:${accent};box-shadow:0 0 8px ${accent}"></div>
        <span style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1px;color:${accent}">XP BOOST · ×1.5</span>
      </div>
      <div class="focus-controls">
        <button class="focus-play" id="focus-play-btn" onclick="toggleFocus()">${focusRunning ? 'PAUSE' : (focusSessions>0 ? 'REPRENDRE' : 'START')}</button>
        <button class="focus-reset" onclick="resetFocus()">↺</button>
      </div>
      <div class="focus-stats">
        <div class="focus-stat"><div class="value">${focusSessions}</div><div class="label">Sessions</div></div>
        <div class="focus-stat"><div class="value" style="color:${accent}">${focusEarned}</div><div class="label">XP Gagnés</div></div>
        <div class="focus-stat"><div class="value">${focusTotalMin + user.focusMinutes} min</div><div class="label">Total focus</div></div>
      </div>
    </div>`;
}

function toggleFocus() {
  if (focusRunning) {
    focusRunning = false;
    clearInterval(focusInterval);
  } else {
    focusRunning = true;
    focusInterval = setInterval(() => {
      focusSecondsLeft--;
      if (focusSecondsLeft <= 0) {
        clearInterval(focusInterval);
        focusRunning = false;
        focusSessions++;
        focusEarned += 150;
        focusTotalMin += 25;
        focusSecondsLeft = 1500;
        user.xp += 150; user.todayXP += 150;
        user.focusMinutes += 25;
        checkPassLevel(); saveUser();
        notify('🎯', 'Session terminée !', '+150 XP');
      }
      if (currentTab === 'focus') updateFocusUI();
    }, 1000);
  }
  if (currentTab === 'focus') updateFocusUI();
}

function resetFocus() {
  clearInterval(focusInterval);
  focusRunning = false;
  focusSecondsLeft = 1500;
  if (currentTab === 'focus') renderFocus();
}

function updateFocusUI() {
  const mins = String(Math.floor(focusSecondsLeft/60)).padStart(2,'0');
  const secs = String(focusSecondsLeft%60).padStart(2,'0');
  const disp = document.getElementById('focus-display');
  if (disp) disp.textContent = mins+':'+secs;
  const pct = 1 - focusSecondsLeft / 1500;
  const r = 110, circ = 2 * Math.PI * r;
  const circle = document.getElementById('focus-ring-circle');
  if (circle) circle.setAttribute('stroke-dashoffset', circ*(1-pct));
  const btn = document.getElementById('focus-play-btn');
  if (btn) btn.textContent = focusRunning ? 'PAUSE' : (focusSessions>0 ? 'REPRENDRE' : 'START');
}

// ── Sport ──────────────────────────────────────────
function renderSport() {
  const accent = getAccent();
  document.getElementById('view-sport').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <div class="page-title">SPORT</div>
      <span class="tag tag-green">Programme actif</span>
    </div>
    <div class="sport-tabs">
      <button class="sport-tab active" onclick="switchSportTab('profile',this)">PROFIL PHYSIQUE</button>
      <button class="sport-tab" onclick="switchSportTab('program',this)">MON PROGRAMME</button>
      <button class="sport-tab" onclick="switchSportTab('generated',this)">PROGRAMME GÉNÉRÉ</button>
    </div>
    <div id="sport-profile" class="sport-tab-panel active">${renderSportProfile()}</div>
    <div id="sport-program" class="sport-tab-panel">${renderSportProgram()}</div>
    <div id="sport-generated" class="sport-tab-panel">${renderSportGenerated()}</div>`;
}

function switchSportTab(t, btn) {
  document.querySelectorAll('#view-sport .sport-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#view-sport .sport-tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('sport-'+t).classList.add('active');
}

function renderSportProfile() {
  const s = user.sport || defaultSport();
  const b = bmi(user);
  const accent = getAccent();
  const imcPct = Math.min(1, Math.max(0, (b - 15) / 25)) * 100;
  return `
    <div class="stats-row stats-row-4" style="margin-bottom:18px">
      ${statCard(Math.round(s.weight)+' kg','Poids',accent)}
      ${statCard(Math.round(s.height)+' cm','Taille','var(--blue)')}
      ${statCard(b.toFixed(1),'IMC','var(--gold)')}
      ${statCard(s.age+' ans','Âge','var(--purple)')}
    </div>
    <div class="card" style="margin-bottom:18px">
      <div class="label" style="margin-bottom:8px">IMC — Indice de Masse Corporelle</div>
      <div class="imc-bar"><div class="imc-cursor" style="left:${imcPct}%"></div></div>
      <div style="display:flex;justify-content:space-between;margin-top:4px">
        <span style="font-size:8px;font-family:'JetBrains Mono',monospace;color:var(--blue)">Maigre</span>
        <span style="font-size:8px;font-family:'JetBrains Mono',monospace;color:var(--forge)">Normal</span>
        <span style="font-size:8px;font-family:'JetBrains Mono',monospace;color:var(--gold)">Surpoids</span>
        <span style="font-size:8px;font-family:'JetBrains Mono',monospace;color:var(--red)">Obésité</span>
      </div>
      <div style="margin-top:8px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--dim)">IMC ${b.toFixed(1)} — ${imcCat(b)}</div>
    </div>
    <div class="section-title"><span>Informations</span></div>
    <div class="form-field" style="margin-bottom:12px">
      <label class="label">Poids (kg)</label>
      <div class="slider-wrap"><input type="range" id="sport-weight" min="40" max="160" value="${s.weight}" oninput="document.getElementById('sport-weight-val').textContent=this.value+' kg'"><span id="sport-weight-val" class="slider-val">${Math.round(s.weight)} kg</span></div>
    </div>
    <div class="form-field" style="margin-bottom:12px">
      <label class="label">Taille (cm)</label>
      <div class="slider-wrap"><input type="range" id="sport-height" min="140" max="220" value="${s.height}" oninput="document.getElementById('sport-height-val').textContent=this.value+' cm'"><span id="sport-height-val" class="slider-val">${Math.round(s.height)} cm</span></div>
    </div>
    <div class="section-title"><span>Objectifs</span></div>
    <div class="chips" style="margin-bottom:18px">
      ${[['masse','💪 Masse'],['seche','🔥 Sèche'],['force','🏆 Force'],['endurance','🏃 Endurance'],['sante','❤️ Santé']].map(([v,l]) =>
        `<button class="chip ${(s.goals||[]).includes(v)?'on':''}" onclick="this.classList.toggle('on')" data-goal="${v}">${l}</button>`).join('')}
    </div>
    <button class="btn-primary" onclick="saveSportProfile()">💾 Sauvegarder</button>`;
}

function imcCat(b) {
  if (b < 18.5) return 'Insuffisance pondérale';
  if (b < 25) return 'Poids normal';
  if (b < 30) return 'Surpoids modéré';
  return 'Obésité';
}

function saveSportProfile() {
  if (!user.sport) user.sport = defaultSport();
  const w = document.getElementById('sport-weight');
  const h = document.getElementById('sport-height');
  if (w) user.sport.weight = parseFloat(w.value);
  if (h) user.sport.height = parseFloat(h.value);
  const goals = [...document.querySelectorAll('[data-goal].on')].map(b => b.dataset.goal);
  if (goals.length) user.sport.goals = goals;
  saveUser();
  notify('💾', 'Profil physique sauvegardé');
  renderSport();
}

function renderSportProgram() {
  const s = user.sport || defaultSport();
  return `
    <div class="section-title"><span>Sport(s) pratiqué(s)</span></div>
    <div class="chips" style="margin-bottom:18px">
      ${[['musculation','🏋️ Musculation'],['calisthenics','🤸 Callisthénie'],['running','🏃 Running'],['crossfit','🔄 CrossFit'],['yoga','🧘 Yoga'],['boxe','🥊 Boxe']].map(([v,l]) =>
        `<button class="chip ${(s.sports||[]).includes(v)?'on':''}" onclick="this.classList.toggle('on')" data-sport="${v}">${l}</button>`).join('')}
    </div>
    <div class="form-field" style="margin-bottom:12px">
      <label class="label">Séances / semaine</label>
      <div class="slider-wrap"><input type="range" id="sport-freq" min="1" max="7" step="1" value="${s.frequency}" oninput="document.getElementById('sport-freq-val').textContent=this.value+' séances'"><span id="sport-freq-val" class="slider-val">${s.frequency} séances</span></div>
    </div>
    <div class="form-field" style="margin-bottom:18px">
      <label class="label">Durée séance (min)</label>
      <div class="slider-wrap"><input type="range" id="sport-dur" min="20" max="120" step="5" value="${s.sessionDuration}" oninput="document.getElementById('sport-dur-val').textContent=this.value+' min'"><span id="sport-dur-val" class="slider-val">${s.sessionDuration} min</span></div>
    </div>
    <button class="btn-primary" onclick="generateProgram()">⚡ Générer mon programme</button>`;
}

function generateProgram() {
  const sports = [...document.querySelectorAll('[data-sport].on')].map(b => b.dataset.sport);
  if (!user.sport) user.sport = defaultSport();
  if (sports.length) user.sport.sports = sports;
  const freqEl = document.getElementById('sport-freq');
  const durEl = document.getElementById('sport-dur');
  if (freqEl) user.sport.frequency = parseInt(freqEl.value);
  if (durEl) user.sport.sessionDuration = parseInt(durEl.value);
  user.sport.hasProgramGenerated = true;
  user.xp += 100; checkPassLevel(); saveUser();
  notify('⚡', 'Programme généré !', '+100 XP');
  renderSport();
  setTimeout(() => {
    document.querySelectorAll('#view-sport .sport-tab')[2].click();
  }, 200);
}

function renderSportGenerated() {
  const s = user.sport;
  if (!s?.hasProgramGenerated) return `<div style="text-align:center;padding:60px 20px"><div style="font-size:48px;margin-bottom:14px">🏋️</div><div class="page-title" style="font-size:16px;margin-bottom:8px">Aucun programme</div><div style="color:var(--dim);font-size:13px">Remplis "Mon Programme" et clique sur Générer.</div></div>`;
  const sport = s.sports?.[0] || 'musculation';
  const goal = s.goals?.[0] || 'masse';
  const prog = getProgram(sport, goal);
  const accent = getAccent();
  return `
    <div style="padding:18px;background:var(--card);border:1px solid ${accent}33;border-radius:var(--radius);margin-bottom:16px">
      <div style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:18px;letter-spacing:2px;margin-bottom:4px">${prog.name.toUpperCase()}</div>
      <div style="font-size:12px;color:var(--dim);margin-bottom:10px">${prog.desc}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <span class="tag tag-green">${s.frequency}x / semaine</span>
        <span class="tag tag-green">${s.sessionDuration} min</span>
        <span class="tag tag-muted">${s.programDuration} semaines</span>
      </div>
    </div>
    ${prog.days.map((d,i) => `
    <div class="workout-day">
      <div class="workout-day-header" onclick="toggleWorkoutDay(${i})">
        <div>
          <div style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:13px;letter-spacing:2px">${d.day.toUpperCase()}</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1px;color:${accent};margin-top:2px">${d.focus}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted)">${d.exercises.length} exercices</span>
          <span id="chevron-${i}" style="color:var(--muted)">▾</span>
        </div>
      </div>
      <div class="workout-exercises" id="workout-exercises-${i}">
        ${d.exercises.map((ex,j) => `
        <div class="exercise-row">
          <span class="exercise-num">${String(j+1).padStart(2,'0')}</span>
          <div style="flex:1"><div style="font-size:13px;font-weight:500">${ex.name}</div><div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;margin-top:2px">${ex.muscle} · Repos : ${ex.rest}</div></div>
          <span class="exercise-sets">${ex.sets}</span>
        </div>`).join('')}
      </div>
    </div>`).join('')}
    <div class="card" style="margin-top:12px">
      <div style="font-family:'JetBrainsMono',monospace;font-size:9px;letter-spacing:2px;color:var(--forge);margin-bottom:7px">💡 CONSEIL FORGE</div>
      <div style="font-size:12px;color:var(--dim);line-height:1.6">Progressive overload — augmente les charges chaque semaine, même de 1 kg. La discipline forge l'identité.</div>
    </div>`;
}

function toggleWorkoutDay(i) {
  const ex = document.getElementById('workout-exercises-'+i);
  const ch = document.getElementById('chevron-'+i);
  if (ex) ex.classList.toggle('open');
  if (ch) ch.textContent = ex.classList.contains('open') ? '▴' : '▾';
}

function getProgram(sport, goal) {
  if (sport === 'musculation' && goal === 'masse') return {
    name:'Hypertrophie — Prise de masse', desc:'Volume élevé, progression de charge.',
    days:[
      { day:'Lundi', focus:'Pectoraux + Triceps', exercises:[
        { name:'Développé couché',        muscle:'Pectoraux',     sets:'4×8-10',  rest:'2 min' },
        { name:'Développé incliné halt.', muscle:'Pectoraux haut',sets:'3×10-12', rest:'90s'   },
        { name:'Écarté câble',            muscle:'Isolation',     sets:'3×12-15', rest:'60s'   },
        { name:'Dips lestés',             muscle:'Triceps',       sets:'3×10',    rest:'90s'   },
        { name:'Extension poulie',        muscle:'Triceps',       sets:'3×12',    rest:'60s'   },
      ]},
      { day:'Mercredi', focus:'Dos + Biceps', exercises:[
        { name:'Soulevé de terre',  muscle:'Chaîne post.', sets:'4×5-6',   rest:'3 min' },
        { name:'Tirage vertical',   muscle:'Grand dorsal', sets:'4×8-10',  rest:'90s'   },
        { name:'Rowing barre',      muscle:'Dos épaisseur',sets:'3×8-10',  rest:'2 min' },
        { name:'Curl barre',        muscle:'Biceps',       sets:'3×10-12', rest:'60s'   },
      ]},
      { day:'Vendredi', focus:'Épaules + Jambes', exercises:[
        { name:'Squat barre',          muscle:'Quadriceps',  sets:'4×8-10',  rest:'2-3 min' },
        { name:'Presse à cuisse',      muscle:'Quadriceps',  sets:'3×10-12', rest:'90s'     },
        { name:'Développé militaire',  muscle:'Épaules',     sets:'4×8-10',  rest:'2 min'   },
        { name:'Élévations latérales', muscle:'Épaules lat.',sets:'3×12-15', rest:'60s'     },
      ]},
    ]
  };
  return {
    name:'Programme Personnalisé', desc:'Adapté à tes objectifs.',
    days:[
      { day:'Lundi', focus:'Full body A', exercises:[{ name:'Squat', muscle:'Jambes', sets:'4×10', rest:'90s' },{ name:'Pompes', muscle:'Pectoraux', sets:'3×15', rest:'60s' },{ name:'Gainage', muscle:'Core', sets:'3×45s', rest:'30s' }]},
      { day:'Jeudi', focus:'Full body B', exercises:[{ name:'Fentes', muscle:'Jambes', sets:'3×12', rest:'60s' },{ name:'Tractions', muscle:'Dos', sets:'3×max', rest:'90s' },{ name:'Planche', muscle:'Core', sets:'3×60s', rest:'30s' }]},
    ]
  };
}

// ── Calendar ───────────────────────────────────────
function renderCalendar() {
  const accent = getAccent();
  const days = ['LUN','MAR','MER','JEU','VEN','SAM','DIM'];
  const hours = Array.from({length:14}, (_,i) => i+7);
  const todayDow = (new Date().getDay() + 6) % 7;
  const evColors = { green:'#00FF85', blue:'#4d90fe', gold:'#FFB800', red:'#FF4D4D', purple:'#a78bfa' };

  const dayHeaders = days.map((d,i) => {
    const isToday = i === todayDow;
    const date = new Date(); date.setDate(date.getDate() - todayDow + i);
    return `<div class="cal-day-head ${isToday?'today':''}" style="${isToday?`background:${accent}14;border:1px solid ${accent}40;`:''}">
      <div style="font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:2px;color:${isToday?accent:'var(--muted)'}">${d}</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;color:${isToday?accent:'var(--white)'}">${date.getDate()}</div>
    </div>`;
  }).join('');

  const rows = hours.map(hour => {
    const cells = days.map((_,i) => {
      const ev = calendarEvents.find(e => e.day === i && e.hour === hour);
      const isToday = i === todayDow;
      return `<div class="cal-cell ${isToday?'today-col':''}">${ev ? `<div class="cal-event" style="background:${evColors[ev.color]||'#00FF85'}">${ev.name}</div>` : ''}</div>`;
    }).join('');
    return `<div class="cal-row"><div class="cal-time">${hour}h</div>${cells}</div>`;
  }).join('');

  document.getElementById('view-calendar').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:0 0 12px">
      <div class="page-title">CALENDRIER</div>
      <div style="display:flex;gap:8px">
        <button onclick="goTo('scanner')" style="display:flex;align-items:center;gap:6px;padding:8px 14px;background:var(--card);border:1px solid var(--border);border-radius:7px;color:var(--dim);font-size:12px;font-weight:500">📷 Scanner EDT</button>
        <span class="tag tag-muted">Semaine actuelle</span>
      </div>
    </div>
    <div class="cal-header-row"><div class="cal-time-col"></div>${dayHeaders}</div>
    <div class="cal-grid">${rows}</div>`;
}

// ── Scanner ────────────────────────────────────────
function renderScanner() {
  const accent = getAccent();
  if (user.plan === 'free') {
    document.getElementById('view-scanner').innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div class="page-title">SCANNER EDT</div>
        <span class="tag tag-green">IA Vision · Claude</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;padding:40px 20px;text-align:center">
        <div style="font-size:44px;margin-bottom:14px">📷</div>
        <div style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:18px;letter-spacing:2px;margin-bottom:8px">SCANNER EDT IA</div>
        <div style="font-size:13px;color:var(--dim);max-width:320px;line-height:1.6;margin-bottom:20px">Analyse tes emplois du temps en photo avec Claude Vision. Disponible en Pro et Elite.</div>
        <button class="btn-primary" style="max-width:200px" onclick="goTo('subscription')">Voir les plans →</button>
        <div style="font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-top:12px">Sans engagement · Annulation à tout moment</div>
      </div>`;
    return;
  }

  document.getElementById('view-scanner').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div class="page-title">SCANNER EDT</div>
      <span class="tag tag-green">IA Vision · Claude</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div style="display:flex;flex-direction:column;gap:14px">
        <label id="scan-upload-zone" style="display:flex;align-items:center;justify-content:center;height:220px;border:2px dashed var(--border);border-radius:var(--radius);cursor:pointer;flex-direction:column;gap:14px;padding:30px;text-align:center;transition:border-color .2s">
          <div id="scan-zone-content">
            <div style="font-size:42px;opacity:.4">📷</div>
            <div style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:12px;letter-spacing:2px;color:var(--muted);margin-top:10px">CLIQUER POUR SÉLECTIONNER</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted);opacity:.5;margin-top:6px">JPG · PNG · Max 10 MB</div>
          </div>
          <input type="file" accept="image/*" style="display:none" id="scan-file-input" onchange="handleScanFile(this)">
        </label>
        <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--card);border:1px solid var(--border);border-radius:8px">
          <div style="width:6px;height:6px;border-radius:50%;background:${accent};box-shadow:0 0 8px ${accent};flex-shrink:0"></div>
          <div>
            <div style="font-size:11px;font-weight:500">FORGE Vision — Claude Sonnet</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;margin-top:2px">Analyse automatique des emplois du temps</div>
          </div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="label" id="scan-result-title">En attente d'un fichier...</div>
        <div id="scan-results" style="flex:1;overflow-y:auto;max-height:280px;display:flex;flex-direction:column;gap:6px"></div>
        <button id="scan-import-btn" onclick="importScanResults()" disabled style="opacity:.5;padding:13px;border-radius:9px;background:var(--border);color:var(--muted);font-family:'Rajdhani',sans-serif;font-weight:700;font-size:13px;letter-spacing:3px;text-transform:uppercase">Importer dans le calendrier</button>
      </div>
    </div>`;

  document.getElementById('scan-upload-zone').addEventListener('click', () => {
    document.getElementById('scan-file-input').click();
  });
}

let scanSlots = [];
async function handleScanFile(input) {
  const file = input.files[0];
  if (!file) return;
  const zone = document.getElementById('scan-zone-content');
  zone.innerHTML = `<div style="font-size:20px;margin-bottom:10px">⏳</div><div style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:12px;letter-spacing:2px;color:var(--muted)">Analyse IA en cours...</div>`;
  document.getElementById('scan-result-title').textContent = 'Traitement...';

  const reader = new FileReader();
  reader.onload = async e => {
    const base64 = e.target.result.split(',')[1];
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:1000,
          messages:[{ role:'user', content:[
            { type:'image', source:{ type:'base64', media_type:file.type||'image/jpeg', data:base64 }},
            { type:'text', text:'Tu es un expert en emplois du temps. Analyse cette image et extrais TOUS les créneaux. Réponds UNIQUEMENT en JSON valide (sans markdown) : {"slots":[{"day":"Lundi","start":"08h00","end":"10h00","name":"Mathématiques","room":"Salle 204"}]}. Si pas d\'emploi du temps : {"slots":[],"error":"Aucun emploi du temps détecté"}.'}
          ]}]
        })
      });
      const data = await resp.json();
      const text = data.content?.map(c=>c.text||'').join('').replace(/```json|```/g,'').trim();
      const parsed = JSON.parse(text);
      scanSlots = parsed.slots || [];
      renderScanResults();
    } catch(err) {
      zone.innerHTML = `<div style="font-size:32px">⚠️</div><div style="color:var(--red);font-size:11px;margin-top:8px">${err.message}</div>`;
      document.getElementById('scan-result-title').textContent = 'Analyse échouée';
    }
  };
  reader.readAsDataURL(file);
}

function renderScanResults() {
  const zone = document.getElementById('scan-zone-content');
  zone.innerHTML = `<div style="font-size:32px">✅</div><div style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:13px;letter-spacing:2px;color:var(--forge);margin-top:8px">Analysé !</div>`;
  document.getElementById('scan-result-title').textContent = scanSlots.length + ' créneaux détectés';
  const container = document.getElementById('scan-results');
  container.innerHTML = scanSlots.map(s => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--card);border:1px solid var(--border);border-radius:7px">
      <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--forge);width:90px">${s.start}–${s.end}</span>
      <div style="flex:1"><div style="font-size:11px">${s.name}</div>${s.room?`<div style="font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:1px">${s.room}</div>`:''}</div>
      <span style="font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--muted)">${s.day}</span>
    </div>`).join('');
  const btn = document.getElementById('scan-import-btn');
  if (btn && scanSlots.length) {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.background = 'var(--forge)';
    btn.style.color = '#000';
  }
}

function importScanResults() {
  const dayMap = { lundi:0,mardi:1,mercredi:2,jeudi:3,vendredi:4,samedi:5,dimanche:6 };
  const colors = ['blue','green','red','gold','purple'];
  scanSlots.forEach(s => {
    const dayIdx = dayMap[s.day.toLowerCase()];
    if (dayIdx === undefined) return;
    const hour = parseInt(s.start) || 8;
    calendarEvents.push({ id:uid(), name:s.name.slice(0,15), day:dayIdx, hour, color:colors[Math.abs(s.name.charCodeAt(0))%5] });
  });
  user.calendarEvents = calendarEvents;
  saveUser();
  notify('✅', scanSlots.length + ' créneaux importés');
  goTo('calendar');
}

// ── Forge Pass ────────────────────────────────────
function renderPass() {
  const accent = getAccent();
  const level = user.passLevel;
  const xpInLevel = user.xp % 200;
  const isPro = user.plan !== 'free';
  const nextReward = PASS_REWARDS.find(r => r.level > level);

  document.getElementById('view-pass').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div class="page-title">FORGE PASS</div>
      <span class="tag tag-gold">Saison I · Actif</span>
    </div>
    <div class="card" style="margin-bottom:20px">
      <div style="display:flex;gap:20px;align-items:center">
        <div style="font-family:'JetBrains Mono',monospace;font-size:44px;font-weight:700;color:${accent};text-shadow:0 0 20px ${accent}66">${level}</div>
        <div style="flex:1">
          <div style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:15px;letter-spacing:2px;margin-bottom:8px">NIVEAU ${level}</div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span class="label">Vers niveau suivant</span>
            <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:${accent}">${xpInLevel} / 200</span>
          </div>
          <div class="progress-wrap"><div class="progress-fill" style="width:${xpInLevel/2}%;background:${accent};color:${accent}"></div></div>
          ${nextReward ? `<div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted);margin-top:6px;letter-spacing:1px">Prochain palier : Niveau ${nextReward.level} — ${nextReward.name}</div>` : ''}
        </div>
        <div style="text-align:right">
          <div style="font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;color:var(--gold)">${50-level}</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:7px;letter-spacing:2px;color:var(--muted)">NIVEAUX RESTANTS</div>
        </div>
      </div>
    </div>
    <div class="label" style="margin-bottom:10px">RÉCOMPENSES DISPONIBLES</div>
    <div class="pass-grid">
      ${PASS_REWARDS.map(r => {
        const unlocked = r.level <= level && isPro;
        return `<div class="pass-reward ${unlocked?'unlocked':''}">
          <div style="font-size:20px;margin-bottom:5px">${unlocked ? r.icon : '🔒'}</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:7px;letter-spacing:1.5px;color:var(--muted);margin-bottom:4px">Niv. ${r.level}</div>
          <div style="font-size:9px;color:${unlocked?'var(--white)':'var(--muted)'};line-height:1.3">${unlocked ? r.name : '???'}</div>
        </div>`;
      }).join('')}
    </div>
    ${!isPro ? `<button class="btn-primary" style="margin-top:20px" onclick="goTo('subscription')">Passer Pro pour débloquer tout →</button>` : ''}`;
}

// ── Circle ────────────────────────────────────────
function renderCircle() {
  const accent = getAccent();
  const xp = user.xp;
  const myScore = Math.max(10, Math.floor(xp/8));
  const players = [
    { name: user.firstName || user.username, score:myScore, disc:78, phys:65, ambi:82, isMe:true },
    { name:'Léo',  score:612, disc:88, phys:75, ambi:92, isMe:false },
    { name:'Enzo', score:584, disc:74, phys:82, ambi:78, isMe:false },
    { name:'Hugo', score:541, disc:70, phys:65, ambi:80, isMe:false },
  ].sort((a,b) => b.score - a.score);
  const rankEmoji = ['🥇','🥈','🥉'];
  const isSentinelle = xp >= 4000;

  document.getElementById('view-circle').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">
      <div>
        <div class="page-title">INDICE FORGE</div>
        <div style="font-size:10px;color:var(--muted);margin-top:3px">Ton classement dans le cercle</div>
      </div>
      <span class="tag tag-muted">Mis à jour il y a 2h</span>
    </div>
    <div style="padding:12px;background:#111;border:1px solid var(--border);border-radius:9px;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--muted);margin-bottom:20px;overflow-x:auto;white-space:nowrap">
      Indice FORGE = (<span style="color:${accent}">Discipline</span> × 0.4) + (<span style="color:${accent}">Physique</span> × 0.3) + (<span style="color:${accent}">Ambition</span> × 0.3)
    </div>
    ${players.map((p,i) => `
    <div class="lb-row ${p.isMe?'me':''}">
      <div class="lb-rank" style="color:${i===0?'var(--gold)':'var(--white)'}">${rankEmoji[i]||'#'+(i+1)}</div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px">
          <span style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:16px;letter-spacing:1px">${p.name.toUpperCase()}</span>
          ${p.isMe ? `<span style="font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:2px;color:${accent}">(toi)</span>` : ''}
        </div>
        <div class="lb-bars">
          <div class="lb-bar" style="height:${p.disc*0.2}px;background:${accent}"></div>
          <div class="lb-bar" style="height:${p.phys*0.2}px;background:var(--blue)"></div>
          <div class="lb-bar" style="height:${p.ambi*0.2}px;background:var(--gold)"></div>
          <span style="font-family:'JetBrains Mono',monospace;font-size:6px;color:var(--muted);margin-left:4px">DIS PHY AMB</span>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:700">${p.score}</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:7px;letter-spacing:2px;color:var(--muted)">INDICE</div>
      </div>
    </div>`).join('')}
    ${!isSentinelle ? `<div style="position:relative;margin-top:8px"><div class="card" style="opacity:.4;height:60px"></div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--muted)">🔒 Débloqué au rang Sentinelle (Rang IV)</div></div>` : ''}`;
}

// ── Ranks ─────────────────────────────────────────
function renderRanks() {
  const accent = getAccent();
  const xp = user.xp;
  const currentRank = getRank(xp);
  const currentIdx = getRankIdx(xp);

  document.getElementById('view-ranks').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div class="page-title">RANGS</div>
      <span class="tag tag-green">Rang actuel : ${currentRank.roman} — ${currentRank.name}</span>
    </div>
    <div class="card glow" style="margin-bottom:22px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div>
          <div class="label" style="margin-bottom:4px">Progression globale vers le rang suprême</div>
          <div style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase">${currentRank.name} → Légion</div>
        </div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;color:${accent}">${fmt(xp)} XP</div>
      </div>
      <div class="progress-wrap"><div class="progress-fill" style="width:${Math.min(100,xp/35000*100)}%;background:${accent};color:${accent}"></div></div>
      <div style="display:flex;justify-content:space-between;margin-top:6px">
        <span class="label">Initié · 0 XP</span>
        <span style="font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--gold)">Légion · 35 000 XP</span>
      </div>
    </div>
    <div class="rank-timeline">
      ${RANKS.map((r,i) => {
        const isDone = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isLocked = i > currentIdx;
        const pct = r.maxXP < 999999 ? Math.max(0,Math.min(1,(xp-r.minXP)/(r.maxXP-r.minXP))) : 1;
        return `<div class="rank-item">
          <div class="rank-left">
            <div class="rank-circle ${isCurrent?'current':isDone?'done':''}" style="${isCurrent?`border-color:${accent};box-shadow:0 0 24px ${accent}66;background:${accent}1a`:isDone?`border-color:${accent}66`:''}">
              <span style="font-size:14px">${r.icon}</span>
              <span style="font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:1px;color:${isCurrent?'#000':isDone?accent:'var(--muted)'}">${r.roman}</span>
            </div>
            ${i < RANKS.length-1 ? `<div class="rank-line ${isDone?'done':''}" style="${isDone?`background:${accent}4d`:''}"></div>` : ''}
          </div>
          <div class="rank-right ${isLocked?'locked':''}">
            ${isCurrent ? `<div style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px;background:${accent}1a;border:1px solid ${accent}4d;border-radius:5px;margin-bottom:6px"><span>📍</span><span style="font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:1.5px;color:${accent}">RANG ACTUEL</span></div>` : ''}
            <div style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:18px;letter-spacing:2px;color:${isCurrent?accent:isDone?accent:'var(--white)'};${isCurrent?`text-shadow:0 0 12px ${accent}66`:''}">${r.name.toUpperCase()}</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px;margin:4px 0">${fmt(r.minXP)} — ${r.maxXP >= 999999 ? '∞' : fmt(r.maxXP)} XP</div>
            ${isCurrent ? `<div class="progress-wrap" style="margin-bottom:4px"><div class="progress-fill" style="width:${pct*100}%;background:${accent}"></div></div><div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted)">${Math.round(pct*100)}% · ${r.maxXP<999999?fmt(r.maxXP-xp)+' XP pour passer':'Maximum'}</div>` : `<div style="height:2px;background:${isDone?accent+'40':'var(--border)'};border-radius:1px;margin-bottom:4px"></div>`}
            <div class="rank-unlocks">
              ${r.unlocks.map(u => `<span class="rank-unlock-tag ${isDone||isCurrent?'active':''}" style="${isDone||isCurrent?`color:${accent};background:${accent}0f;border-color:${accent}40`:''}">${isDone?'✓ ':isCurrent?'→ ':''}${u}</span>`).join('')}
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

// ── Subscription ──────────────────────────────────
function renderSubscription() {
  const accent = getAccent();
  const plan = user.plan;
  const planColors = { free:'var(--muted)', pro:accent, elite:'var(--gold)' };
  const planNames = { free:'Gratuit', pro:'Pro', elite:'Elite' };
  const planDescs = { free:'Accès de base · 5 habitudes max', pro:'Habitudes illimitées · Scanner IA · Stats avancées', elite:'Tout Pro + Coach IA · Vidéos · Défis communautaires' };

  document.getElementById('view-subscription').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
      <div class="page-title">ABONNEMENT</div>
      <span class="tag ${plan==='elite'?'tag-gold':'tag-green'}">Plan ${planNames[plan]}</span>
    </div>
    <div class="card" style="margin-bottom:24px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div class="label" style="margin-bottom:4px">Ton plan actuel</div>
        <div style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:20px;letter-spacing:2px;color:${planColors[plan]}">${planNames[plan].toUpperCase()}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:3px">${planDescs[plan]}</div>
      </div>
      <span style="font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:2px;padding:4px 11px;border-radius:20px;color:${planColors[plan]};background:${planColors[plan]}1a;border:1px solid ${planColors[plan]}40">● Actif</span>
    </div>
    <div class="plans-grid">
      ${planCard('Gratuit','0€','Pour toujours','free',plan,accent,['Dashboard & XP','5 habitudes max','Timer Focus','1 programme sport','Rangs I à III'],['Scanner EDT IA','Stats avancées','Forge Pass'])}
      ${planCard('Pro','4,99€','par mois','pro',plan,accent,['Habitudes illimitées','Scanner EDT IA','Programmes avancés','Forge Pass 1-50','Stats & analytics','Rangs I à VI'],['Coach IA','Vidéos HD'])}
      ${planCard('Elite','9,99€','par mois','elite',plan,accent,['Tout le plan Pro','Coach IA personnalisé','Vidéos HD','Défis communautaires','Badge Elite','Tous les 8 rangs'],[])}
    </div>
    <div style="text-align:center;margin-top:16px;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--muted)">Sans engagement · Annulation à tout moment · forge-app.support@gmail.com</div>`;
}

function planCard(name, price, period, planKey, currentPlan, accent, features, locked) {
  const isCurrent = currentPlan === planKey;
  const c = planKey==='elite'?'var(--gold)':planKey==='pro'?accent:'var(--muted)';
  return `<div class="plan-card ${isCurrent?'current':''}" style="${isCurrent?`border-color:${c}4d;box-shadow:0 0 30px ${c}1a`:''}">
    ${isCurrent ? `<div style="text-align:center;margin-bottom:10px"><span style="font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:2px;padding:3px 12px;border-radius:20px;background:${c};color:#000">✓ Plan actuel</span></div>` : ''}
    <div style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:22px;letter-spacing:3px;color:${c};margin-bottom:3px">${name.toUpperCase()}</div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:36px;font-weight:700;color:${c}">${price}</div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1px;color:var(--muted);margin-bottom:16px">${period}</div>
    <hr style="border:none;border-top:1px solid ${c}33;margin-bottom:16px">
    <div class="plan-features">
      ${features.map(f => `<div class="feature-line"><div class="feature-check yes">✓</div><span style="font-size:12px;color:var(--dim)">${f}</span></div>`).join('')}
      ${locked.map(f => `<div class="feature-line"><div class="feature-check no" style="border:1px solid var(--border)">✗</div><span style="font-size:12px;color:var(--muted)">${f}</span></div>`).join('')}
    </div>
    <button onclick="setPlan('${planKey}')" ${isCurrent?'disabled':''} style="width:100%;padding:11px;border-radius:8px;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:12px;letter-spacing:2px;text-transform:uppercase;border:1px solid ${isCurrent||planKey==='free'?'var(--border)':'transparent'};background:${isCurrent||planKey==='free'?'transparent':c};color:${isCurrent?'var(--muted)':planKey==='free'?'var(--dim)':'#000'};cursor:${isCurrent?'default':'pointer'}">
      ${isCurrent ? 'Plan actuel ✓' : planKey==='free' ? 'Garder gratuit' : `Passer ${name} →`}
    </button>
  </div>`;
}

function setPlan(plan) {
  if (plan === 'free') {
    user.plan = 'free'; saveUser();
    notify('🔓', 'Plan Gratuit activé.');
    renderSubscription(); return;
  }
  const link = STRIPE_LINKS[plan];
  if (!link || link.includes('https://buy.stripe.com/00w5kvdQC39e1Dn7Sp1B600')) {
    notify('⚠️', 'Configure ton lien Stripe dans app.js ligne ~1215');
    return;
  }
  const successUrl = encodeURIComponent(window.location.href + '?forge_plan=' + plan + '&forge_user=' + user.username);
  window.location.href = link + '?success_url=' + successUrl;
}

// ── Profile modal ─────────────────────────────────
function openProfileModal() {
  const accent = getAccent();
  const rank = getRank(user.xp);
  const themes = { default:'#00FF85', minuit:'#6366f1', braise:'#FF6B35', acier:'#94a3b8' };
  document.getElementById('profile-modal-body').innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:4px">
      <button onclick="hideModal('profile-modal')" style="color:var(--muted);font-size:18px;padding:8px">✕</button>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:14px">
      <div style="width:72px;height:72px;border-radius:50%;background:${accent}1e;border:2px solid ${accent}66;display:flex;align-items:center;justify-content:center;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:28px;color:${accent};box-shadow:0 0 24px ${accent}4d">${initials()}</div>
      <div style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:18px;letter-spacing:2px;text-transform:uppercase">${user.firstName} ${user.lastName}</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--muted)">${user.email}</div>
      <div>
        <div style="text-align:center;margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:2px;color:var(--muted)">THÈME ACTIF — ${user.theme.toUpperCase()}</div>
        <div style="display:flex;gap:10px;justify-content:center">
          ${Object.entries(themes).map(([t,c]) => {
            const unlocked = user.unlockedThemes.includes(t);
            return `<button onclick="${unlocked?`applyTheme('${t}')`:'notify(\'🔒\',\'Thème verrouillé\')'}" style="width:26px;height:26px;border-radius:50%;background:${c};border:2px solid ${user.theme===t?'#fff':'transparent'};opacity:${unlocked?1:.3};box-shadow:${user.theme===t?`0 0 12px ${c}88`:'none'};transition:all .2s"></button>`;
          }).join('')}
        </div>
      </div>
      <div style="display:flex;width:100%;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">
        ${[['XP',fmt(user.xp),accent],['Streak',user.streak+'j','var(--gold)'],['Rang',rank.roman,'var(--white)']].map(([l,v,c],i) => `
        <div style="flex:1;text-align:center;padding:14px${i>0?';border-left:1px solid var(--border)':''}">
          <div style="font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:${c}">${v}</div>
          <div class="label">${l}</div>
        </div>`).join('')}
      </div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1.5px">Membre depuis le ${new Date(user.joinedDate).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
      ${user.badges.length ? `<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">${user.badges.map(b => `<span style="padding:5px 10px;background:var(--card);border:1px solid var(--border);border-radius:6px;font-size:11px">${b==='acier'?'⚔️':b==='elite'?'💎':'🏅'} ${capitalize(b)}</span>`).join('')}</div>` : ''}
      <button onclick="logout()" style="width:100%;padding:12px;border-radius:9px;background:rgba(255,77,77,.07);border:1px solid rgba(255,77,77,.2);color:var(--red);font-family:'Rajdhani',sans-serif;font-weight:700;font-size:13px;letter-spacing:2px;text-transform:uppercase">Déconnecter</button>
    </div>`;
  showModal('profile-modal');
}

function applyTheme(theme) {
  user.theme = theme;
  if (!user.unlockedThemes.includes(theme)) user.unlockedThemes.push(theme);
  saveUser(); applyAccent(); updateSidebarAvatar();
  openProfileModal();
  notify('🎨', 'Thème '+theme+' appliqué');
}
function updateSidebarAvatar() { document.getElementById('sidebar-avatar').textContent = initials(); }

// ── Onboarding ────────────────────────────────────
function renderOnboarding() {
  document.getElementById('view-onboarding').innerHTML = `
    <div style="max-width:480px;margin:0 auto;padding:40px 0">
      <div id="ob-dots" style="display:flex;gap:8px;margin-bottom:22px"></div>
      <div id="ob-content"></div>
      <div id="ob-nav" style="display:flex;gap:12px;margin-top:24px"></div>
    </div>`;
  window._obStep = 0;
  window._obData = {};
  renderObStep();
}

function renderObStep() {
  const s = window._obStep;
  const dots = document.getElementById('ob-dots');
  if (dots) dots.innerHTML = [0,1,2,3].map(i => `<div style="height:3px;border-radius:2px;background:${i<=s?'var(--accent)':'var(--border)'};width:${i===s?28:18}px;transition:all .2s ease"></div>`).join('');
  const steps = [obStep0, obStep1, obStep2, obStep3];
  const content = document.getElementById('ob-content');
  if (content && steps[s]) content.innerHTML = steps[s]();
  const nav = document.getElementById('ob-nav');
  if (nav) nav.innerHTML = `
    ${s>0 ? `<button class="btn-outline" onclick="obPrev()">← Retour</button>` : ''}
    <button class="btn-primary" onclick="obNext()">${s<3 ? 'Continuer →' : 'Lancer FORGE ⚡'}</button>`;
}

function obStep0() {
  return `<div style="margin-bottom:20px"><div class="page-title" style="font-size:26px;margin-bottom:6px">Profil physique</div><div style="font-size:13px;color:var(--dim)">Ces infos calibrent ton programme et tes objectifs.</div></div>
    <div class="form-row" style="margin-bottom:14px">
      <div class="form-field"><label class="label">Genre</label><select id="ob-gender" class="input"><option value="homme">Homme</option><option value="femme">Femme</option></select></div>
      <div class="form-field"><label class="label">Âge</label><input id="ob-age" class="input" placeholder="20" type="number" value="20"></div>
    </div>
    <div class="form-field" style="margin-bottom:12px"><label class="label">Poids (kg)</label><div class="slider-wrap"><input type="range" id="ob-weight" min="40" max="160" value="75" oninput="document.getElementById('ob-weight-val').textContent=this.value+' kg'"><span id="ob-weight-val" class="slider-val">75 kg</span></div></div>
    <div class="form-field" style="margin-bottom:12px"><label class="label">Taille (cm)</label><div class="slider-wrap"><input type="range" id="ob-height" min="140" max="220" value="178" oninput="document.getElementById('ob-height-val').textContent=this.value+' cm'"><span id="ob-height-val" class="slider-val">178 cm</span></div></div>
    <div class="form-field"><label class="label">Niveau d'expérience</label><div class="chips">${[['debutant','🌱 Débutant'],['intermediaire','💪 Intermédiaire'],['avance','🔥 Avancé'],['elite','⚡ Elite']].map(([v,l])=>`<button class="chip ${v==='intermediaire'?'on':''}" onclick="selectOnlyChip(this)" data-ob="level" data-val="${v}">${l}</button>`).join('')}</div></div>`;
}
function obStep1() {
  return `<div style="margin-bottom:20px"><div class="page-title" style="font-size:26px;margin-bottom:6px">Ta discipline</div><div style="font-size:13px;color:var(--dim)">Choisis ton ou tes sports.</div></div>
    <div class="chips" style="margin-bottom:18px">${[['musculation','🏋️ Musculation'],['calisthenics','🤸 Callisthénie'],['running','🏃 Running'],['cyclisme','🚴 Cyclisme'],['natation','🏊 Natation'],['boxe','🥊 Boxe / MMA'],['crossfit','🔄 CrossFit'],['yoga','🧘 Yoga']].map(([v,l])=>`<button class="chip" onclick="this.classList.toggle('on')" data-ob="sport" data-val="${v}">${l}</button>`).join('')}</div>
    <div class="form-field"><label class="label">Séances / semaine</label><div class="slider-wrap"><input type="range" id="ob-freq" min="1" max="7" step="1" value="4" oninput="document.getElementById('ob-freq-val').textContent=this.value+' séances'"><span id="ob-freq-val" class="slider-val">4 séances</span></div></div>`;
}
function obStep2() {
  return `<div style="margin-bottom:20px"><div class="page-title" style="font-size:26px;margin-bottom:6px">Matériel disponible</div><div style="font-size:13px;color:var(--dim)">Ton programme sera adapté.</div></div>
    <div class="chips">${[['full_gym','🏢 Salle complète'],['halteres','🏋️ Haltères'],['barre','📊 Barre + disques'],['traction','🔝 Barre traction'],['anneaux','⭕ Anneaux'],['kettlebell','🔔 Kettlebell'],['elastiques','🎗️ Élastiques'],['rien','🏠 Poids de corps']].map(([v,l])=>`<button class="chip" onclick="this.classList.toggle('on')" data-ob="equip" data-val="${v}">${l}</button>`).join('')}</div>`;
}
function obStep3() {
  return `<div style="margin-bottom:20px"><div class="page-title" style="font-size:26px;margin-bottom:6px">Tes objectifs</div><div style="font-size:13px;color:var(--dim)">FORGE te tient responsable.</div></div>
    <div class="chips" style="margin-bottom:18px">${[['masse','💪 Prise de masse'],['seche','🔥 Sèche'],['force','🏆 Force'],['endurance','🏃 Endurance'],['athletisme','⚡ Athlétisme'],['sante','❤️ Santé']].map(([v,l])=>`<button class="chip" onclick="this.classList.toggle('on')" data-ob="goal" data-val="${v}">${l}</button>`).join('')}</div>
    <div class="form-field" style="margin-bottom:12px"><label class="label">Poids objectif (kg)</label><div class="slider-wrap"><input type="range" id="ob-targetw" min="40" max="160" value="80" oninput="document.getElementById('ob-targetw-val').textContent=this.value+' kg'"><span id="ob-targetw-val" class="slider-val">80 kg</span></div></div>`;
}

function selectOnlyChip(btn) {
  const group = btn.dataset.ob;
  document.querySelectorAll(`[data-ob="${group}"]`).forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
}

function obCollect() {
  const d = window._obData;
  const s = window._obStep;
  if (s === 0) {
    d.gender = document.getElementById('ob-gender')?.value || 'homme';
    d.age = document.getElementById('ob-age')?.value || '20';
    d.weight = parseFloat(document.getElementById('ob-weight')?.value || 75);
    d.height = parseFloat(document.getElementById('ob-height')?.value || 178);
    d.level = document.querySelector('[data-ob="level"].on')?.dataset.val || 'intermediaire';
  } else if (s === 1) {
    d.sports = [...document.querySelectorAll('[data-ob="sport"].on')].map(b => b.dataset.val);
    d.frequency = parseInt(document.getElementById('ob-freq')?.value || 4);
  } else if (s === 2) {
    d.equipment = [...document.querySelectorAll('[data-ob="equip"].on')].map(b => b.dataset.val);
  } else if (s === 3) {
    d.goals = [...document.querySelectorAll('[data-ob="goal"].on')].map(b => b.dataset.val);
    d.targetWeight = parseFloat(document.getElementById('ob-targetw')?.value || 80);
  }
}

function obNext() {
  obCollect();
  if (window._obStep < 3) { window._obStep++; renderObStep(); }
  else { finishOnboarding(); }
}
function obPrev() { window._obStep--; renderObStep(); }

function finishOnboarding() {
  const d = window._obData;
  user.sport = { ...defaultSport(), ...d };
  user.onboarded = true;
  saveUser();
  goTo('dashboard');
}

// ── Modal helpers ─────────────────────────────────
function showModal(id) { document.getElementById(id).classList.add('show'); document.body.style.overflow='hidden'; }
function hideModal(id) { document.getElementById(id).classList.remove('show'); document.body.style.overflow=''; }

function statCard(val, label, color) {
  return `<div class="stat-card"><div class="label">${label}</div><div class="value" style="color:${color}">${val}</div></div>`;
}

// ── Auth form handlers ────────────────────────────
function setupAuthForms() {
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('login-form').style.display = tab.dataset.tab==='login' ? 'block' : 'none';
      document.getElementById('register-form').style.display = tab.dataset.tab==='register' ? 'block' : 'none';
    });
  });

  document.getElementById('login-btn').addEventListener('click', () => {
    const u = document.getElementById('login-user').value.trim();
    const p = document.getElementById('login-pass').value;
    const err = document.getElementById('login-error');
    if (!login(u, p)) { err.textContent = 'Identifiants incorrects.'; err.style.display='block'; return; }
    err.style.display='none';
    showApp();
  });

  document.getElementById('register-btn').addEventListener('click', () => {
    const vals = ['reg-first','reg-last','reg-email','reg-user','reg-pass'].map(id => document.getElementById(id).value.trim());
    const err = document.getElementById('register-error');
    const msg = register(...vals);
    if (msg) { err.textContent = msg; err.style.display='block'; return; }
    err.style.display='none';
    showApp();
  });

  // Enter key
  ['login-user','login-pass'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => { if (e.key==='Enter') document.getElementById('login-btn').click(); });
  });
}

// ── Init ──────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  setupAuthForms();
  if (tryRestoreSession()) { showApp(); checkStripeReturn(); }
  else showAuth();
});

// ── Stripe Payment Links ──────────────────────────
// 👉 Remplace ces URLs par tes vrais liens Stripe
const STRIPE_LINKS = {
  pro:   'https://buy.stripe.com/REMPLACE_PAR_TON_LIEN_PRO',
  elite: 'https://buy.stripe.com/REMPLACE_PAR_TON_LIEN_ELITE',
};

function checkStripeReturn() {
  const params = new URLSearchParams(window.location.search);
  const plan = params.get('forge_plan');
  const username = params.get('forge_user');
  if (!plan || !username) return;
  window.history.replaceState({}, '', window.location.pathname + (window.location.hash || ''));
  if (user && user.username === username) {
    user.plan = plan;
    if (plan === 'elite' && !user.badges.includes('elite')) user.badges.push('elite');
    saveUser();
    notify(plan==='pro'?'⚡':'👑', plan==='pro'?'Plan Pro activé 🎉':'Plan Elite activé 👑');
    setTimeout(() => goTo('subscription'), 800);
  }
}
