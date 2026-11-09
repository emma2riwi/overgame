/* Senda del Viento — RPG de acción ninja de estilo anime (original de Overgame) */
(() => {
'use strict';
const C = { purple:'#6045F4', mint:'#53E6D4', gray:'#EBEBED', black:'#0F1417' };
const W = 960, H = 600, TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const FIELD = { x0: 30, x1: W - 30, y0: 150, y1: H - 30 };

const UPGRADES = [
  { k:'dmg',   t:'Filo afilado',        d:'+30% de daño con la espada',        f: p => p.dmg *= 1.3 },
  { k:'spd',   t:'Pies de viento',      d:'+15% velocidad, esquiva más seguido', f: p => { p.spd *= 1.15; p.dashCdMax *= .8; } },
  { k:'hp',    t:'Vitalidad',           d:'+25 de vida máxima y curación total', f: p => { p.maxHp += 25; p.hp = p.maxHp; } },
  { k:'star',  t:'Lluvia de shurikens', d:'Lanzas 2 shurikens más por tiro',     f: p => p.stars += 2 },
  { k:'wind',  t:'Espiral mayor',       d:'La técnica especial es más grande y fuerte', f: p => { p.windR *= 1.3; p.windDmg *= 1.35; } },
  { k:'aura',  t:'Aura serena',         d:'El aura se recarga 50% más rápido',   f: p => p.auraRegen *= 1.5 },
  { k:'flash', t:'Paso relámpago',      d:'La esquiva corta a quien atraviesas', f: p => p.dashHit += 25 },
  { k:'vamp',  t:'Hoja sedienta',       d:'Cada golpe te cura 2 de vida',        f: p => p.vamp += 2 },
];
const STORY = [
  'La luna roja volvió a salir sobre el bosque de bambú.',
  'Los ninjas de la Sombra Sin Nombre quemaron tu aldea.',
  'Solo quedas tú, tu espada y el viento.',
];

function senda() {
  const p = { x: W / 2, y: 420, face: 0, hp: 100, maxHp: 100, aura: 40, maxAura: 100, spd: 250, dmg: 22, lvl: 1, xp: 0, next: 60,
    inv: 0, dashT: 0, dashCd: 0, dashCdMax: .85, atkT: 0, combo: 0, comboT: 0, stars: 1, windR: 170, windDmg: 70, auraRegen: 5, dashHit: 0, vamp: 0, walk: 0,
    scarf: Array.from({ length: 9 }, () => ({ x: W / 2, y: 400 })) };
  let foes = [], shots = [], fx = [], texts = [], parts = [], t = 0, wave = 0, state = 'story', storyI = 0, storyT = 0;
  let shake = 0, freeze = 0, cut = null, banner = null, choices = [], bossDead = false, mouse = null;
  const g = { score: 0, over: false, hud: () => `NIVEL ${p.lvl} · OLEADA ${wave}` };

  function spawnWave() {
    wave++;
    const boss = wave % 5 === 0;
    banner = { t: 1.6, s: boss ? 'JEFE: ONI DE LA NIEBLA' : `OLEADA ${wave}` };
    const n = boss ? 3 : 3 + wave * 2, thr = boss ? 2 : Math.max(0, wave - 1);
    for (let i = 0; i < n; i++) foes.push(mk('grunt'));
    for (let i = 0; i < thr; i++) foes.push(mk('thrower'));
    if (boss) foes.push(mk('oni'));
  }
  function mk(type) {
    const side = Math.random() < .5 ? -1 : 1, s = 1 + wave * .12;
    const base = { type, x: side < 0 ? rnd(-60, -20) : rnd(W + 20, W + 60), y: rnd(FIELD.y0 + 20, FIELD.y1 - 20), vx: 0, vy: 0, hit: 0, cd: rnd(.5, 1.5), ph: rnd(0, TAU) };
    if (type === 'grunt') return { ...base, hp: 34 * s, max: 34 * s, spd: rnd(95, 125), r: 17, atk: 9 * s, xp: 12 };
    if (type === 'thrower') return { ...base, hp: 26 * s, max: 26 * s, spd: 90, r: 16, atk: 8 * s, xp: 16 };
    return { ...base, x: W / 2, y: FIELD.y0 - 60, hp: 650 * s, max: 650 * s, spd: 70, r: 42, atk: 22 * s, xp: 200, slam: 0, charge: 0 };
  }
  const say = (x, y, s, c = C.gray, big) => texts.push({ x, y, s: String(s), c, l: 1, big });
  function burst(x, y, n, c, sp = 220) { for (let i = 0; i < n; i++) { const a = rnd(0, TAU), v = rnd(40, sp); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: rnd(.5, 1), c }); } }
  function hurtFoe(f, d, kb, ang) {
    d = Math.round(d * rnd(.9, 1.1)); f.hp -= d; f.hit = .12;
    if (f.type !== 'oni' || kb > 300) { f.vx += Math.cos(ang) * kb; f.vy += Math.sin(ang) * kb; }
    say(f.x, f.y - f.r - 8, d, d > 40 ? C.mint : C.gray, d > 40);
    burst(f.x, f.y, 8, C.purple);
    if (p.vamp) p.hp = Math.min(p.maxHp, p.hp + p.vamp);
    p.aura = Math.min(p.maxAura, p.aura + 3);
    freeze = Math.max(freeze, .035); shake = Math.max(shake, 4);
  }
  function hurtPlayer(d) {
    if (p.inv > 0 || p.dashT > 0) return;
    p.hp -= d; p.inv = .7; shake = 10; freeze = .06; say(p.x, p.y - 40, '-' + Math.round(d), C.purple, true); burst(p.x, p.y, 16, C.gray);
    if (p.hp <= 0) { p.hp = 0; state = 'dead'; setTimeout(() => g.over = true, 1200); }
  }
  function gainXp(n) {
    p.xp += n; g.score += n;
    while (p.xp >= p.next) {
      p.xp -= p.next; p.lvl++; p.next = Math.round(p.next * 1.35);
      const pool = UPGRADES.slice().sort(() => Math.random() - .5); choices = pool.slice(0, 3);
      state = 'level'; cut = null; p.hp = Math.min(p.maxHp, p.hp + 20);
    }
  }
  function slash(tx, ty) {
    if (p.atkT > 0) return;
    if (tx != null) p.face = Math.atan2(ty - p.y, tx - p.x);
    p.combo = p.comboT > 0 ? (p.combo % 3) + 1 : 1; p.comboT = .55; p.atkT = p.combo === 3 ? .38 : .24;
    const big = p.combo === 3, R = big ? 96 : 78, arc = big ? 2.4 : 1.9;
    fx.push({ k: 'slash', x: p.x, y: p.y, a: p.face, R, arc, l: .2, max: .2, big, flip: p.combo === 2 });
    p.x += Math.cos(p.face) * 10; p.y += Math.sin(p.face) * 10;
    foes.forEach(f => { const d = dist(p, f); if (d < R + f.r && Math.abs(angDiff(Math.atan2(f.y - p.y, f.x - p.x), p.face)) < arc / 2 + .3) hurtFoe(f, p.dmg * (big ? 1.8 : 1), big ? 420 : 160, Math.atan2(f.y - p.y, f.x - p.x)); });
  }
  function dash(dx, dy) {
    if (p.dashCd > 0) return;
    const m = Math.hypot(dx, dy); const a = m ? Math.atan2(dy, dx) : p.face; p.face = a;
    p.dashT = .17; p.dashCd = p.dashCdMax; p.dashA = a; p.dashed = new Set();
    burst(p.x, p.y, 10, C.mint, 120);
  }
  function throwStars() {
    if (p.aura < 10) return say(p.x, p.y - 50, 'Sin aura', C.purple);
    p.aura -= 10;
    for (let i = 0; i < p.stars; i++) { const a = p.face + (i - (p.stars - 1) / 2) * .18; shots.push({ x: p.x, y: p.y, vx: Math.cos(a) * 640, vy: Math.sin(a) * 640, mine: true, l: .9, rot: 0 }); }
  }
  function special() {
    if (p.aura < 50) return say(p.x, p.y - 50, 'Aura insuficiente', C.purple);
    p.aura -= 50; cut = { t: .9, s: '¡ESPIRAL DE VIENTO!' }; freeze = .5;
    fx.push({ k: 'wind', x: p.x, y: p.y, l: .7, max: .7, R: p.windR });
    setTimeout(() => { foes.forEach(f => { if (dist(p, f) < p.windR + f.r) hurtFoe(f, p.windDmg, 520, Math.atan2(f.y - p.y, f.x - p.x)); }); shake = 16; }, 480);
  }

  /* ---- controles táctiles dibujados ---- */
  const BTN = [
    { k: 'atk',  x: W - 92,  y: H - 92,  r: 52, t: 'ESPADA' },
    { k: 'dash', x: W - 210, y: H - 64,  r: 36, t: 'ESQUIVA' },
    { k: 'star', x: W - 66,  y: H - 214, r: 36, t: 'SHURIKEN' },
    { k: 'wind', x: W - 196, y: H - 178, r: 40, t: 'ESPIRAL' },
  ];
  let touchUI = false;

  g.update = (dt, inp) => {
    if (inp.pointers && inp.pointers.some(q => q.touch)) touchUI = true;
    t += dt; storyT += dt;
    if (inp.px != null && !touchUI) mouse = { x: inp.px, y: inp.py };
    const anyKey = inp.keyQ.length || inp.taps.length;

    if (state === 'story') { if (anyKey && storyT > .35) { storyI++; storyT = 0; if (storyI >= STORY.length) { state = 'play'; spawnWave(); } } return; }
    if (state === 'level') {
      const pick = i => { if (!choices[i]) return; choices[i].f(p); say(p.x, p.y - 60, choices[i].t, C.mint, true); state = 'play'; burst(p.x, p.y, 30, C.mint); };
      inp.keyQ.forEach(k => { if (k === '1' || k === '2' || k === '3') pick(+k - 1); });
      inp.taps.forEach(tp => { const i = Math.floor((tp.x - (W / 2 - 330)) / 220); if (tp.y > 200 && tp.y < 470 && i >= 0 && i < 3) pick(i); });
      return;
    }
    if (state === 'dead') { parts.forEach(q => { q.x += q.vx * dt; q.y += q.vy * dt; q.l -= dt; }); return; }
    if (cut) { cut.t -= dt; if (cut.t <= 0) cut = null; }
    if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
    if (freeze > 0) { freeze -= dt; return; }

    // entrada
    let mx = (inp.keys.ArrowRight || inp.keys.d ? 1 : 0) - (inp.keys.ArrowLeft || inp.keys.a ? 1 : 0);
    let my = (inp.keys.ArrowDown || inp.keys.s ? 1 : 0) - (inp.keys.ArrowUp || inp.keys.w ? 1 : 0);
    const stick = (inp.pointers || []).find(q => q.touch && q.sx < W * .5);
    if (stick) { const dx = stick.x - stick.sx, dy = stick.y - stick.sy, m = Math.hypot(dx, dy); if (m > 8) { mx = dx / Math.max(m, 60); my = dy / Math.max(m, 60); } }
    inp.keyQ.forEach(k => {
      if (k === 'j' || k === 'z') slash(mouse?.x, mouse?.y);
      if (k === 'k' || k === ' ' || k === 'Shift' || k === 'x') dash(mx, my);
      if (k === 'i' || k === 'c') throwStars();
      if (k === 'l' || k === 'v') special();
    });
    inp.taps.forEach(tp => {
      const b = touchUI && BTN.find(b => Math.hypot(tp.x - b.x, tp.y - b.y) < b.r + 10);
      if (b) { if (b.k === 'atk') slash(); if (b.k === 'dash') dash(mx, my); if (b.k === 'star') throwStars(); if (b.k === 'wind') special(); }
      else if (!touchUI || tp.x > W * .5) slash(tp.x, tp.y);
    });
    // jugador
    p.inv -= dt; p.atkT -= dt; p.comboT -= dt; p.dashCd -= dt;
    p.aura = Math.min(p.maxAura, p.aura + p.auraRegen * dt);
    const m = Math.hypot(mx, my);
    if (p.dashT > 0) {
      p.dashT -= dt; p.x += Math.cos(p.dashA) * 900 * dt; p.y += Math.sin(p.dashA) * 900 * dt;
      parts.push({ x: p.x, y: p.y - 10, vx: 0, vy: 0, l: .35, c: C.mint });
      if (p.dashHit) foes.forEach(f => { if (!p.dashed.has(f) && dist(p, f) < f.r + 20) { p.dashed.add(f); hurtFoe(f, p.dashHit, 120, p.dashA); } });
    } else if (m) {
      const sp = p.atkT > 0 ? p.spd * .35 : p.spd;
      p.x += mx / Math.max(1, m) * sp * dt; p.y += my / Math.max(1, m) * sp * dt; p.walk += dt * 12;
      if (p.atkT <= 0 && !(mouse && !touchUI)) p.face = Math.atan2(my, mx);
    }
    if (mouse && !touchUI && p.atkT <= 0 && p.dashT <= 0) p.face = Math.atan2(mouse.y - p.y, mouse.x - p.x);
    p.x = clamp(p.x, FIELD.x0, FIELD.x1); p.y = clamp(p.y, FIELD.y0, FIELD.y1);
    // bufanda (cadena con inercia)
    p.scarf[0].x = p.x - Math.cos(p.face) * 6; p.scarf[0].y = p.y - 30;
    for (let i = 1; i < p.scarf.length; i++) { const a = p.scarf[i - 1], b = p.scarf[i]; b.y += 18 * dt; const d = Math.hypot(b.x - a.x, b.y - a.y) || 1, L = 8; b.x = a.x + (b.x - a.x) / d * L + Math.sin(t * 6 + i) * .6; b.y = a.y + (b.y - a.y) / d * L; }
    // enemigos
    foes.forEach(f => {
      f.hit -= dt; f.cd -= dt; f.vx *= .86; f.vy *= .86;
      const a = Math.atan2(p.y - f.y, p.x - f.x), d = dist(p, f);
      if (f.type === 'grunt') {
        if (d > f.r + 24) { f.x += Math.cos(a) * f.spd * dt; f.y += Math.sin(a) * f.spd * dt; }
        else if (f.cd <= 0) { f.cd = 1.1; fx.push({ k: 'claw', x: f.x, y: f.y, a, l: .15, max: .15 }); hurtPlayer(f.atk); }
      } else if (f.type === 'thrower') {
        const want = d < 220 ? -1 : d > 320 ? 1 : 0;
        f.x += Math.cos(a) * f.spd * want * dt + Math.cos(a + 1.57) * Math.sin(t + f.ph) * 40 * dt; f.y += Math.sin(a) * f.spd * want * dt;
        if (f.cd <= 0 && f.x > 0 && f.x < W) { f.cd = rnd(1.4, 2.2); shots.push({ x: f.x, y: f.y, vx: Math.cos(a) * 330, vy: Math.sin(a) * 330, mine: false, l: 2.5, dmg: f.atk }); }
      } else {
        if (f.y < FIELD.y0 + 40) f.y += 60 * dt;
        if (f.slam > 0) { f.slam -= dt; if (f.slam <= 0) { fx.push({ k: 'quake', x: f.sx, y: f.sy, l: .4, max: .4 }); shake = 18; if (Math.hypot(p.x - f.sx, p.y - f.sy) < 120) hurtPlayer(f.atk * 1.4); } }
        else if (f.charge > 0) { f.charge -= dt; f.x += Math.cos(f.ca) * 520 * dt; f.y += Math.sin(f.ca) * 520 * dt; if (d < f.r + 18) hurtPlayer(f.atk); }
        else { f.x += Math.cos(a) * f.spd * dt; f.y += Math.sin(a) * f.spd * dt;
          if (f.cd <= 0) { f.cd = rnd(2, 3); if (Math.random() < .55) { f.slam = .9; f.sx = p.x; f.sy = p.y; } else { f.charge = .55; f.ca = a; banner = { t: .5, s: '¡CUIDADO!' }; } } }
      }
      f.x += f.vx * dt; f.y += f.vy * dt; f.y = clamp(f.y, FIELD.y0 - 80, FIELD.y1);
    });
    foes = foes.filter(f => { if (f.hp > 0) return true; burst(f.x, f.y, f.type === 'oni' ? 80 : 22, f.type === 'oni' ? C.mint : C.purple, f.type === 'oni' ? 400 : 240); gainXp(f.xp); if (f.type === 'oni') { bossDead = true; cut = { t: 1.2, s: '¡ONI DERROTADO!' }; g.score += 500; } return false; });
    // proyectiles
    shots.forEach(s => { s.x += s.vx * dt; s.y += s.vy * dt; s.l -= dt; s.rot = (s.rot || 0) + dt * 20;
      if (s.mine) foes.forEach(f => { if (s.l > 0 && dist(s, f) < f.r + 6) { hurtFoe(f, p.dmg * .7, 90, Math.atan2(s.vy, s.vx)); s.l = 0; } });
      else if (dist(s, p) < 18) { hurtPlayer(s.dmg); s.l = 0; } });
    shots = shots.filter(s => s.l > 0 && s.x > -40 && s.x < W + 40 && s.y > -40 && s.y < H + 40);
    fx.forEach(e => e.l -= dt); fx = fx.filter(e => e.l > 0);
    texts.forEach(x => { x.y -= 40 * dt; x.l -= dt * 1.2; }); texts = texts.filter(x => x.l > 0);
    parts.forEach(q => { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .94; q.vy *= .94; q.l -= dt * 1.4; }); parts = parts.filter(q => q.l > 0);
    shake = Math.max(0, shake - dt * 40);
    if (!foes.length && state === 'play' && !banner) spawnWave();
  };

  /* ---------------- dibujo ---------------- */
  function scene(ctx) {
    ctx.fillStyle = C.black; ctx.fillRect(0, 0, W, H);
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, 'rgba(96,69,244,.35)'); sky.addColorStop(.55, 'rgba(15,20,23,0)'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.shadowColor = C.gray; ctx.shadowBlur = 60; ctx.fillStyle = 'rgba(235,235,237,.92)'; ctx.beginPath(); ctx.arc(760, 92, 54, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(96,69,244,.22)'; ctx.beginPath(); ctx.arc(778, 84, 50, 0, TAU); ctx.fill();
    // bambú en dos capas (parallax según el jugador)
    for (let layer = 0; layer < 2; layer++) {
      const off = (p.x - W / 2) * (layer ? .06 : .02), col = layer ? 'rgba(83,230,212,.16)' : 'rgba(96,69,244,.28)', w = layer ? 9 : 6;
      for (let i = 0; i < 16; i++) { const x = ((i * 67 + layer * 31) % W) - off; ctx.fillStyle = col; ctx.fillRect(x, 0, w, FIELD.y0 + 10 + layer * 20);
        for (let y = 30 + (i % 3) * 14; y < FIELD.y0; y += 46) ctx.fillRect(x - 1, y, w + 2, 2); }
    }
    // suelo
    const gr = ctx.createLinearGradient(0, FIELD.y0 - 20, 0, H); gr.addColorStop(0, 'rgba(96,69,244,.18)'); gr.addColorStop(1, 'rgba(15,20,23,1)');
    ctx.fillStyle = gr; ctx.fillRect(0, FIELD.y0 - 20, W, H);
    ctx.strokeStyle = 'rgba(83,230,212,.08)'; ctx.lineWidth = 1;
    for (let y = FIELD.y0; y < H; y += 34) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // pétalos
    for (let i = 0; i < 26; i++) { const x = (i * 137 + t * 28) % (W + 40) - 20, y = (i * 89 + t * (30 + i % 5 * 8)) % H; ctx.fillStyle = i % 2 ? 'rgba(235,235,237,.5)' : 'rgba(83,230,212,.45)'; ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2 + i); ctx.fillRect(-3, -1.5, 6, 3); ctx.restore(); }
  }
  function ninja(ctx) {
    const blink = p.inv > 0 && Math.floor(t * 20) % 2;
    if (blink) return;
    const x = p.x, y = p.y, bob = Math.sin(p.walk) * 2, fx = Math.cos(p.face) >= 0 ? 1 : -1;
    ctx.fillStyle = 'rgba(15,20,23,.6)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 20, 7, 0, 0, TAU); ctx.fill();
    // bufanda
    ctx.shadowColor = C.purple; ctx.shadowBlur = 14; ctx.strokeStyle = C.purple; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); p.scarf.forEach((q, i) => i ? ctx.lineTo(q.x, q.y + bob) : ctx.moveTo(q.x, q.y + bob)); ctx.stroke();
    // cuerpo
    ctx.shadowBlur = 0; ctx.fillStyle = '#1b2228'; ctx.strokeStyle = C.gray; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x - 13, y - 30 + bob, 26, 30, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.purple; ctx.fillRect(x - 13, y - 14 + bob, 26, 5);
    // cabeza y pelo en punta
    ctx.fillStyle = C.gray; ctx.beginPath(); ctx.arc(x, y - 42 + bob, 13, 0, TAU); ctx.fill();
    ctx.fillStyle = C.black; for (let i = 0; i < 5; i++) { const a = -2.6 + i * .5; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 9, y - 46 + bob + Math.sin(a) * 9); ctx.lineTo(x + Math.cos(a) * 25 - fx * 4, y - 46 + bob + Math.sin(a) * 25); ctx.lineTo(x + Math.cos(a + .35) * 9, y - 46 + bob + Math.sin(a + .35) * 9); ctx.fill(); }
    ctx.beginPath(); ctx.arc(x, y - 47 + bob, 12, Math.PI, TAU); ctx.fill();
    // bandana
    ctx.shadowColor = C.mint; ctx.shadowBlur = 12; ctx.fillStyle = C.mint; ctx.fillRect(x - 13, y - 49 + bob, 26, 6);
    ctx.shadowBlur = 0; ctx.fillStyle = C.black; ctx.fillRect(x + fx * 3 - 4, y - 48 + bob, 8, 4);
    ctx.fillStyle = C.mint; ctx.fillRect(x + fx * 5, y - 41 + bob, 3, 3);
    // espada en la espalda o en la mano
    ctx.save(); ctx.translate(x, y - 20 + bob); ctx.rotate(p.atkT > 0 ? p.face : -fx * 2.3);
    ctx.shadowColor = C.mint; ctx.shadowBlur = p.atkT > 0 ? 20 : 6; ctx.fillStyle = C.gray; ctx.fillRect(4, -2, 40, 4); ctx.fillStyle = C.purple; ctx.fillRect(-4, -3, 9, 6); ctx.restore();
    ctx.shadowBlur = 0;
  }
  function foe(ctx, f) {
    const x = f.x, y = f.y, bob = Math.sin(t * 8 + f.ph) * 2;
    ctx.fillStyle = 'rgba(15,20,23,.6)'; ctx.beginPath(); ctx.ellipse(x, y + 4, f.r, f.r * .35, 0, 0, TAU); ctx.fill();
    if (f.type === 'oni') {
      if (f.slam > 0) { ctx.strokeStyle = `rgba(96,69,244,${.4 + Math.sin(t * 30) * .3})`; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.arc(f.sx, f.sy, 120, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = 'rgba(96,69,244,.15)'; ctx.fill(); }
      ctx.shadowColor = C.purple; ctx.shadowBlur = 30; ctx.fillStyle = f.hit > 0 ? C.gray : '#2a1f6e';
      ctx.beginPath(); ctx.roundRect(x - 38, y - 86 + bob, 76, 86, 22); ctx.fill();
      ctx.fillStyle = C.gray; [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(x + s * 18, y - 80 + bob); ctx.lineTo(x + s * 34, y - 118 + bob); ctx.lineTo(x + s * 30, y - 78 + bob); ctx.fill(); });
      ctx.shadowColor = C.mint; ctx.shadowBlur = 18; ctx.fillStyle = C.mint; ctx.fillRect(x - 20, y - 64 + bob, 12, 6); ctx.fillRect(x + 8, y - 64 + bob, 12, 6);
      ctx.fillStyle = C.gray; ctx.fillRect(x - 16, y - 44 + bob, 32, 4);
    } else {
      ctx.shadowColor = C.purple; ctx.shadowBlur = 16; ctx.fillStyle = f.hit > 0 ? C.gray : '#231a5c';
      ctx.beginPath(); ctx.roundRect(x - 12, y - 30 + bob, 24, 30, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y - 40 + bob, 11, 0, TAU); ctx.fill();
      ctx.shadowColor = C.mint; ctx.shadowBlur = 10; ctx.fillStyle = f.type === 'thrower' ? C.gray : C.mint;
      const ex = Math.cos(Math.atan2(p.y - y, p.x - x)) * 3; ctx.fillRect(x - 6 + ex, y - 43 + bob, 4, 3); ctx.fillRect(x + 2 + ex, y - 43 + bob, 4, 3);
    }
    ctx.shadowBlur = 0;
    if (f.hp < f.max && f.type !== 'oni') { ctx.fillStyle = 'rgba(235,235,237,.15)'; ctx.fillRect(x - 18, y - 60, 36, 4); ctx.fillStyle = C.purple; ctx.fillRect(x - 18, y - 60, 36 * f.hp / f.max, 4); }
  }
  function bars(ctx) {
    const bar = (x, y, w, v, c, label) => { ctx.fillStyle = 'rgba(15,20,23,.7)'; ctx.beginPath(); ctx.roundRect(x - 2, y - 2, w + 4, 14, 7); ctx.fill(); ctx.shadowColor = c; ctx.shadowBlur = 12; ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(x, y, Math.max(0, w * v), 10, 5); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = C.gray; ctx.font = '700 11px Outfit,sans-serif'; ctx.textAlign = 'left'; ctx.fillText(label, x, y - 6); };
    bar(22, 50, 220, p.hp / p.maxHp, C.mint, `VIDA ${Math.ceil(p.hp)}/${p.maxHp}`);
    bar(22, 84, 160, p.aura / p.maxAura, C.purple, `AURA ${Math.floor(p.aura)}`);
    ctx.fillStyle = 'rgba(235,235,237,.12)'; ctx.fillRect(22, 104, 160, 3); ctx.fillStyle = C.gray; ctx.fillRect(22, 104, 160 * p.xp / p.next, 3);
    const boss = foes.find(f => f.type === 'oni');
    if (boss) { ctx.fillStyle = C.gray; ctx.font = '800 14px Outfit,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ONI DE LA NIEBLA', W / 2, 40); ctx.fillStyle = 'rgba(15,20,23,.8)'; ctx.fillRect(W / 2 - 220, 48, 440, 10); ctx.shadowColor = C.purple; ctx.shadowBlur = 14; ctx.fillStyle = C.purple; ctx.fillRect(W / 2 - 220, 48, 440 * boss.hp / boss.max, 10); ctx.shadowBlur = 0; }
  }
  function controls(ctx) {
    if (!touchUI) { ctx.fillStyle = 'rgba(235,235,237,.4)'; ctx.font = '600 12px Outfit,sans-serif'; ctx.textAlign = 'right'; ctx.fillText('WASD mover · J o clic espada · K esquiva · I shuriken · L espiral', W - 20, H - 14); return; }
    BTN.forEach(b => { const ready = b.k === 'wind' ? p.aura >= 50 : b.k === 'star' ? p.aura >= 10 : b.k === 'dash' ? p.dashCd <= 0 : true;
      ctx.globalAlpha = ready ? .9 : .35; ctx.strokeStyle = b.k === 'atk' ? C.mint : C.purple; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 12; ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(15,20,23,.55)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.fillStyle = C.gray; ctx.font = `800 ${b.r > 45 ? 14 : 11}px Outfit,sans-serif`; ctx.textAlign = 'center'; ctx.fillText(b.t, b.x, b.y + 4); ctx.globalAlpha = 1; });
  }
  g.draw = (ctx, dt) => {
    ctx.save();
    if (shake) ctx.translate(rnd(-shake, shake), rnd(-shake, shake));
    scene(ctx);
    const ents = [...foes.map(f => ({ y: f.y, d: () => foe(ctx, f) })), { y: p.y, d: () => ninja(ctx) }].sort((a, b) => a.y - b.y);
    fx.filter(e => e.k === 'quake' || e.k === 'wind').forEach(e => {
      const k = 1 - e.l / e.max;
      if (e.k === 'wind') { for (let i = 0; i < 3; i++) { ctx.strokeStyle = i % 2 ? C.purple : C.mint; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 30; ctx.lineWidth = 10 - i * 3; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(e.x, e.y - 20, e.R * k * (1 - i * .15), t * 8 + i, t * 8 + i + 5); ctx.stroke(); } }
      else { ctx.strokeStyle = C.purple; ctx.shadowColor = C.purple; ctx.shadowBlur = 24; ctx.lineWidth = 8; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(e.x, e.y, 120 * k + 20, 0, TAU); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    });
    ents.forEach(e => e.d());
    shots.forEach(s => { ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot || Math.atan2(s.vy, s.vx)); ctx.shadowBlur = 12;
      if (s.mine) { ctx.shadowColor = C.mint; ctx.fillStyle = C.gray; for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(9, -2); ctx.lineTo(0, -9); ctx.fill(); } }
      else { ctx.shadowColor = C.purple; ctx.fillStyle = C.purple; ctx.fillRect(-10, -2, 20, 4); }
      ctx.restore(); });
    fx.filter(e => e.k === 'slash' || e.k === 'claw').forEach(e => {
      const k = e.l / e.max;
      if (e.k === 'claw') { ctx.strokeStyle = C.purple; ctx.lineWidth = 3; ctx.globalAlpha = k; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(e.x + Math.cos(e.a) * 10 + i * 6, e.y - 20 + Math.sin(e.a) * 10); ctx.lineTo(e.x + Math.cos(e.a) * 34 + i * 6, e.y - 20 + Math.sin(e.a) * 34); ctx.stroke(); } ctx.globalAlpha = 1; return; }
      const s = e.flip ? -1 : 1, a0 = e.a - s * e.arc / 2, sweep = (1 - k) * e.arc;
      ctx.shadowColor = C.mint; ctx.shadowBlur = 26; ctx.globalAlpha = k;
      ctx.fillStyle = e.big ? C.mint : 'rgba(235,235,237,.9)';
      ctx.beginPath(); ctx.arc(e.x, e.y - 20, e.R, a0, a0 + s * Math.max(.2, sweep + .5), s < 0); ctx.arc(e.x, e.y - 20, e.R * .62, a0 + s * Math.max(.2, sweep + .5), a0, s > 0); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    });
    parts.forEach(q => { ctx.globalAlpha = Math.max(0, q.l); ctx.fillStyle = q.c; ctx.fillRect(q.x, q.y, 3, 3); }); ctx.globalAlpha = 1;
    texts.forEach(x => { ctx.globalAlpha = Math.min(1, x.l * 2); ctx.fillStyle = x.c; ctx.shadowColor = x.c; ctx.shadowBlur = 10; ctx.font = `800 ${x.big ? 22 : 16}px Outfit,sans-serif`; ctx.textAlign = 'center'; ctx.fillText(x.s, x.x, x.y); }); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    ctx.restore();
    bars(ctx); controls(ctx);
    if (banner) { const k = Math.min(1, banner.t * 2); ctx.globalAlpha = k; ctx.fillStyle = 'rgba(15,20,23,.75)'; ctx.fillRect(0, H / 2 - 40, W, 80); ctx.fillStyle = C.gray; ctx.shadowColor = C.purple; ctx.shadowBlur = 24; ctx.font = '800 40px Outfit,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(banner.s, W / 2, H / 2 + 14); ctx.shadowBlur = 0; ctx.globalAlpha = 1; }
    if (cut) {
      const k = cut.t; ctx.save(); ctx.globalAlpha = Math.min(1, k * 3);
      ctx.fillStyle = C.purple; ctx.beginPath(); ctx.moveTo(0, 200); ctx.lineTo(W, 150); ctx.lineTo(W, 330); ctx.lineTo(0, 380); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(235,235,237,.35)'; ctx.lineWidth = 2; for (let i = 0; i < 40; i++) { const y = 170 + (i * 37) % 190, x = (i * 173 + t * 2400) % (W + 300) - 300; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 160, y - 8); ctx.stroke(); }
      ctx.fillStyle = C.black; ctx.beginPath(); ctx.arc(170, 268, 64, 0, TAU); ctx.fill(); ctx.fillStyle = C.mint; ctx.fillRect(122, 248, 96, 12); ctx.fillStyle = C.gray; ctx.fillRect(176, 272, 18, 6);
      ctx.shadowColor = C.mint; ctx.shadowBlur = 30; ctx.fillStyle = C.gray; ctx.font = 'italic 900 54px Outfit,sans-serif'; ctx.textAlign = 'left'; ctx.fillText(cut.s, 270, 285);
      ctx.restore();
    }
    if (state === 'story') {
      ctx.fillStyle = 'rgba(15,20,23,.82)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.mint; ctx.font = '800 15px Outfit,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('SENDA DEL VIENTO', W / 2, 200);
      const s = STORY[Math.min(storyI, STORY.length - 1)], n = Math.floor(storyT * 45);
      ctx.fillStyle = C.gray; ctx.font = '700 28px Outfit,sans-serif'; ctx.fillText(s.slice(0, n), W / 2, 290);
      ctx.fillStyle = 'rgba(235,235,237,.5)'; ctx.font = '600 14px Outfit,sans-serif'; ctx.fillText(`${storyI + 1}/${STORY.length} · toca o pulsa cualquier tecla`, W / 2, 380);
    }
    if (state === 'level') {
      ctx.fillStyle = 'rgba(15,20,23,.85)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.mint; ctx.shadowColor = C.mint; ctx.shadowBlur = 20; ctx.font = '900 44px Outfit,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`¡NIVEL ${p.lvl}!`, W / 2, 150); ctx.shadowBlur = 0;
      ctx.fillStyle = C.gray; ctx.font = '600 16px Outfit,sans-serif'; ctx.fillText('Elige una mejora (clic o teclas 1, 2, 3)', W / 2, 182);
      choices.forEach((u, i) => { const x = W / 2 - 330 + i * 220; ctx.fillStyle = 'rgba(96,69,244,.22)'; ctx.strokeStyle = i === 1 ? C.mint : C.purple; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 16; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x, 210, 200, 250, 18); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.fillStyle = C.mint; ctx.font = '900 40px Outfit,sans-serif'; ctx.fillText(i + 1, x + 100, 268);
        ctx.fillStyle = C.gray; ctx.font = '800 20px Outfit,sans-serif'; ctx.fillText(u.t, x + 100, 320);
        ctx.fillStyle = 'rgba(235,235,237,.7)'; ctx.font = '500 14px Outfit,sans-serif'; wrap(ctx, u.d, x + 100, 352, 170, 19); });
    }
    if (state === 'dead') { ctx.fillStyle = 'rgba(15,20,23,.6)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = C.gray; ctx.shadowColor = C.purple; ctx.shadowBlur = 30; ctx.font = 'italic 900 56px Outfit,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('CAÍSTE EN COMBATE', W / 2, H / 2); ctx.shadowBlur = 0; }
  };
  function wrap(ctx, s, x, y, w, lh) { let line = ''; s.split(' ').forEach(word => { if (ctx.measureText(line + word).width > w) { ctx.fillText(line, x, y); line = ''; y += lh; } line += word + ' '; }); ctx.fillText(line, x, y); }
  return g;
}
window.OG_RPG = { id:'senda', t:'Senda del Viento', k:'RPG de acción · Anime', d:'Un ninja, una espada y oleadas de sombras. Sube de nivel, elige mejoras y vence al Oni de la Niebla.', c:'WASD mover · J/clic espada · K esquiva · I shuriken · L espiral', make: senda, featured: true };
})();
