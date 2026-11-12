/* SHINRAI: Ecos del Clan — RPG de acción anime roguelite por salas (original de Overgame).
   Interfaz de cartucho: make() → { score, over, hud(), update(dt, inp), draw(ctx, dt) } */
(() => {
'use strict';
const W = 960, H = 600, TAU = Math.PI * 2;
const RW = 1240, RH = 800, BX0 = 52, BX1 = RW - 52, BY0 = 124, BY1 = RH - 52;
const FONT = 'Outfit, system-ui, sans-serif';
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const pick = a => a[Math.floor(Math.random() * a.length)];
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const segDist = (px, py, x1, y1, x2, y2) => { const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy || 1, t = clamp(((px - x1) * dx + (py - y1) * dy) / l, 0, 1); return Math.hypot(px - x1 - dx * t, py - y1 - dy * t); };

/* ───────── Paleta: rampas de los 4 colores de marca + piel y pelo de Aki ───────── */
const PAL = {
  k:'#0F1417', K:'#1d2533', o:'#271c57', P:'#3d2aa8', p:'#6045F4', q:'#8f7bff', Q:'#c3b8ff',
  M:'#2a9e91', m:'#53E6D4', n:'#b6f8f0', h:'#5d6273', G:'#a3a7b5', g:'#EBEBED', w:'#ffffff',
  s:'#f4cfb0', S:'#d29f7f', r:'#1c1830', R:'#3a3466',
};
const OUT = '#06080b';

/* ───────── Pixel art (cada carácter = 1 píxel; '.' = vacío) ───────── */
const AKI_TOP = [
  '....rrrrr.......',
  '..rrRRrrrrr.....',
  '.rrRrrrrrrmr....',
  '.rrrrrrrrrrmm...',
  '.rrrrrsssssrm...',
  '.rrrrssssssr....',
  '..rrsssskwss....',
  '..rrsssskkss....',
  '...rSssssss.....',
  '....mmmmmmm.....',
  '...nmmmmmmmM....',
];
const AKI_BODY = [
  ['...pqppppppss...', '...pqpppppPs....', '...PpppppP......', '....KKKKKK......'],
  ['...pqpppppppss..', '...pqpppppPP....', '...PpppppP......', '....KKKKKK......'],
  ['..spqppppppP....', '..SpqpppppP.....', '...PpppppP......', '....KKKKKK......'],
];
const AKI_LEGS = [
  ['....KK..KK......', '....kh..kh......'],
  ['...KK....KK.....', '...kh....kh.....'],
  ['.....KKKK.......', '.....khkh.......'],
];
const SPR_SRC = {
  kuro: ['..kk....', '.kkkk...', 'kkmkkkk.', '.kkkkkKk', '..kKKk..', '..h..h..'],
  leaf: ['...mn', '..mmn', '.mmM.', 'mmM..', 'M....'],
  leafOff: ['...KK', '..KKh', '.KKh.', 'KKh..', 'h....'],
  lamp: ['..kk..', '.gGGg.', 'gGqqGg', 'gqQQqg', 'gGqqGg', '.gGGg.', '..kk..', '..h...'],
  coin: ['.mm.', 'mnmM', 'mmMM', '.MM.'],
  ronin: ['.....GGGG......', '...GGgggGGG....', '.GGGGGGGGGGGG..', '...hooooooh....', '...oommooom....', '...ooooooo.....', '..oPPoooPPo....', '.oPPoooooPPo...', '.oP.ooooo.Po...', '...oPPPPPo.....', '...oo...oo.....', '...PP...PP.....'],
  archer: ['....PPPP.....', '...PooooP....', '..Poommoo.h..', '..PooooooPh..', '...PoooP..h..', '..oPPPPPo.h..', '.oooPPPoooh..', '..oPPPPPo.h..', '...oo.oo.....', '...PP.PP.....'],
  lantern: ['....kkkk....', '...GgggggG..', '..GgqgggqgG.', '..ggkgggkgg.', '..gggkkgggg.', '..GggggggG..', '...GgggggG..', '....kkkk....', '....m..m....'],
  shield: ['....oooo........', '...ommoo........', '...oooo.hGGGh...', '..oPPPohGggGh...', '.oPPPPohGgmgGh..', '.oPPPPohGggGGh..', '..oPPPohGgggh...', '...oPPPhGGGh....', '...oo..ohh......', '...PP...PP......'],
  shadow: ['....oooo....', '...oooooo...', '..oommoomo..', '..oooooooo..', '...PoooooP..', '..PPooooPPP.', '.PP.oooo..PP', '....PooP....', '.....PP.....'],
  oni: ['..g..................g..', '..gg................gg..', '...gG....oooooo....Gg...', '....gGoooooooooooooGg....', '....oogggggggggggggoo....', '...ooggkkgggggggkkggoo...', '...oggkmmkgggggkmmkggo...', '...ogggkkgggkgggkkgggo...', '...ogggggggkgggggggggo...', '....oggkwkwkwkwkwkggo....', '....ooggggggggggggoo.....', '..ooPPPoooooooooPPPoo....', '.oPPPPPPoqqqqqoPPPPPPo...', 'oPPPoPPPPqqqqqPPPPoPPPo..', 'oPPooPPPPPPPPPPPPPooPPo..', 'oPP.ooPPPPPPPPPPPPo.oPP..', 'ogg..oPPPPPPPPPPPPo..ggo.', '.gg..ooPPPPPPPPPPoo..gg..', '.....oPPPPo..oPPPPo......', '.....oPPPo....oPPPo......', '....ohhhho....ohhhho.....'],
  weaver: ['h.........oooo.........h', '.h.......oggggo.......h.', '..h.....oggkkggo.....h..', '...h....ogmggmgo....h...', '....h...oggggggo...h....', 'h....hhhoqggggqohhh....h', '.hh.....oooPPooo.....hh.', '...hhhhoPPPPPPPPohhhh...', '.......oPPqPPqPPo.......', '...hhhhoPPPPPPPPohhhh...', '.hh....ooPPPPPPoo....hh.', 'h....h...oPPPPo...h....h', '....h.....oooo.....h....', '...h................h...'],
  shogun: ['..m..................m..', '..mm................mm..', '...mm....PPPPPP....mm...', '....mmPPPPqqqqPPPPmm....', '.....PPPPPPPPPPPPPP.....', '....hhhhhhhhhhhhhhhh....', '....hkkkkkkkkkkkkkkh....', '....hkkmmkkkkkkmmkkh....', '....hkkkkkkkkkkkkkkh....', '...hhhGGGGkkkkGGGGhhh...', '.GGGhPPPPPPPPPPPPPPhGGG.', 'GgGGPPqPPPPPPPPPPqPPGGgG', 'GGG.PPPPPhhhhhhPPPPP.GGG', 'hh..PPqPPPPPPPPPPqPP..hh', '....PPPPPhhhhhhPPPPP....', '....oPPPPPPPPPPPPPPo....', '...ooPPPPPPooPPPPPPoo...', '...oPPPPPo....oPPPPPo...', '...ohhhho......ohhhho...'],
};

function bake(rows, sc, remap, solid) {
  const w = Math.max(...rows.map(r => r.length)), h = rows.length; rows = rows.map(r => r.padEnd(w, '.'));
  const c = document.createElement('canvas'); c.width = (w + 2) * sc; c.height = (h + 2) * sc; const x = c.getContext('2d');
  const on = (i, j) => j >= 0 && j < h && i >= 0 && i < w && rows[j][i] !== '.';
  x.fillStyle = solid || OUT;
  for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) if (!on(i, j) && (on(i + 1, j) || on(i - 1, j) || on(i, j + 1) || on(i, j - 1))) x.fillRect((i + 1) * sc, (j + 1) * sc, sc, sc);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const ch = rows[j][i]; if (ch === '.') continue; x.fillStyle = solid || PAL[(remap && remap[ch]) || ch]; x.fillRect((i + 1) * sc, (j + 1) * sc, sc, sc); }
  return c;
}
let S = null;
function sprites() {
  if (S) return S; S = {};
  const AWK = { r: 'M', R: 'n', p: 'q', P: 'p' };
  const frame = (b, l) => [...AKI_TOP, ...AKI_BODY[b], ...AKI_LEGS[l]];
  const frames = { idle: [frame(0, 0), frame(0, 2)], walk: [frame(0, 1), frame(0, 0), frame(0, 2), frame(0, 0)], atk: [frame(1, 0), frame(1, 1), frame(2, 0)] };
  for (const k in frames) { S['aki_' + k] = frames[k].map(f => bake(f, 3)); S['akiA_' + k] = frames[k].map(f => bake(f, 3, AWK)); }
  S.aki_hurt = [bake(frame(0, 0), 3, null, '#ffffff'), bake(frame(0, 0), 3, null, '#8f7bff')];
  S.akiBig = bake(frame(0, 0), 14); S.akiBigA = bake(frame(0, 0), 14, AWK);
  for (const k in SPR_SRC) { const sc = ['oni', 'weaver', 'shogun'].includes(k) ? 4 : 3; S[k] = bake(SPR_SRC[k], sc); S[k + '_w'] = bake(SPR_SRC[k], sc, null, '#ffffff'); }
  S.armor = bake(SPR_SRC.shogun, 3); S.armor_w = bake(SPR_SRC.shogun, 3, null, '#ffffff');
  S.big = { ronin: bake(SPR_SRC.ronin, 9), oni: bake(SPR_SRC.oni, 7), weaver: bake(SPR_SRC.weaver, 7), shogun: bake(SPR_SRC.shogun, 7) };
  return S;
}
function spr(ctx, c, x, y, flip, glitch) {
  const dx = Math.round(x - c.width / 2), dy = Math.round(y - c.height);
  if (!flip) ctx.drawImage(c, dx, dy);
  else { ctx.save(); ctx.translate(Math.round(x), 0); ctx.scale(-1, 1); ctx.drawImage(c, -c.width / 2 | 0, dy); ctx.restore(); }
  if (glitch && Math.random() < .12) { const sy = Math.random() * c.height | 0, sh = 3 + Math.random() * 6 | 0; ctx.globalAlpha = .8; ctx.drawImage(c, 0, sy, c.width, sh, dx + rnd(-7, 7), dy + sy, c.width, sh); ctx.globalAlpha = 1; }
}

/* ───────── Audio sintetizado (WebAudio) ───────── */
let AC = null, master = null, NB = null, muted = false;
try { muted = localStorage.getItem('og.shinrai.mute') === '1'; } catch {}
function audio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = .45; master.connect(AC.destination); NB = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = NB.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } catch { AC = null; } }
  if (AC && AC.state === 'suspended') AC.resume().catch(() => {});
}
function tone(f, d, type = 'square', v = .04, slide = 0, when = 0) {
  if (muted || !AC) return; const t = AC.currentTime + when, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(master); o.start(t); o.stop(t + d + .02);
}
function noise(d, v = .05, hp = 1000) {
  if (muted || !AC) return; const t = AC.currentTime, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = NB; f.type = 'highpass'; f.frequency.value = hp; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * .5, d + .02);
}
const SFX = {
  slash: () => { noise(.09, .05, 2600); tone(900, .07, 'triangle', .025, -500); },
  hit: () => { tone(150, .09, 'square', .045, -90); noise(.06, .05, 1200); },
  dash: () => noise(.16, .04, 4200),
  hurt: () => tone(240, .3, 'sawtooth', .055, -170),
  coin: () => { tone(1320, .06, 'square', .02); tone(1760, .09, 'square', .02, 0, .05); },
  tech: () => { tone(440, .35, 'triangle', .06, 440); noise(.3, .04, 3000); },
  cut: () => { tone(220, .6, 'sawtooth', .05, 660); noise(.6, .05, 2000); },
  kunai: () => tone(1900, .05, 'triangle', .025, -900),
  boom: () => { tone(90, .4, 'square', .06, -50); noise(.35, .08, 300); },
  door: () => tone(330, .14, 'triangle', .04, 110),
  bless: () => [523, 659, 784].forEach((f, i) => tone(f, .18, 'triangle', .035, 0, i * .07)),
};
const PENT = [220, 261.6, 293.7, 329.6, 392, 440, 523.3, 587.3];
const MEL = [5, -1, 4, 5, 7, -1, 5, 4, 2, -1, 4, -1, 5, 4, 2, 0, 5, -1, 4, 5, 7, -1, 6, 7, 5, 4, 2, -1, 4, 2, 0, -1];
const BAS = [0, 0, 3, 3, 4, 4, 2, 2];

/* ───────── Contenido ───────── */
const TECHS = {
  vendaval: { t: 'Corte del Vendaval', d: 'Avanzas en línea recta cortando todo a tu paso.' },
  hojas: { t: 'Danza de Hojas Afiladas', d: 'Un remolino de hojas te rodea durante 3 segundos.' },
  cuervo: { t: 'Sello del Cuervo', d: 'Kuro se divide en 6 cuervos que persiguen Ecos.' },
};
const BLESS = [
  { t: 'Filo del alba', d: '+25 % de daño con la katana', r: 0, f: p => p.dmg *= 1.25 },
  { t: 'Paso ligero', d: '+15 % de velocidad', r: 0, f: p => p.spd *= 1.15 },
  { t: 'Corazón de hoja', d: '+1 corazón y curación completa', r: 0, f: p => { p.maxHp++; p.hp = p.maxHp; } },
  { t: 'Bolsa de kunai', d: '+3 kunai y recarga más rápida', r: 0, f: p => { p.kMax += 3; p.kRate *= .7; } },
  { t: 'Corte crítico', d: '15 % de golpes críticos (×2)', r: 0, f: p => p.crit += .15 },
  { t: 'Sombra veloz', d: 'El dash recarga el doble de rápido', r: 0, f: p => p.dashCdMax *= .5 },
  { t: 'Monedas de luz', d: 'Los Ecos sueltan el doble de monedas', r: 0, f: p => p.coinMul = 2 },
  { t: 'Cuarto corte', d: '+1 golpe al combo', r: 1, f: p => p.comboMax = Math.min(5, p.comboMax + 1) },
  { t: 'Estela cortante', d: 'El dash corta a quien atraviesas', r: 1, f: p => p.dashCut += 18 },
  { t: 'Kunai rebotadores', d: 'Los kunai rebotan 2 veces en las paredes', r: 1, f: p => p.bounce += 2 },
  { t: 'Viento interior', d: 'El Ki se llena 40 % más rápido', r: 1, f: p => p.kiMul *= 1.4 },
  { t: 'Ojos del cuervo', d: 'Kuro dispara una pluma cada 2 s', r: 1, f: p => p.kuroShot = 1 },
  { t: 'Hoja sedienta', d: 'Cada Eco tiene 10 % de curarte medio corazón', r: 1, f: p => p.steal += .1 },
  { t: 'Furia del clan', d: 'El último golpe del combo lanza una onda', r: 2, f: p => p.wave = 1 },
  { t: 'Bendición del santuario', d: 'Al limpiar una sala recuperas 1 corazón', r: 2, f: p => p.roomHeal = 1 },
  { t: 'Último aliento', d: 'Una vez por piso sobrevives con medio corazón', r: 2, f: p => p.lastBreath = 1 },
];
const RARE = [{ n: 'COMÚN', c: PAL.G }, { n: 'RARA', c: PAL.m }, { n: 'LEGENDARIA', c: PAL.q }];
const FLOORS = [
  { n: 'Templo de las Linternas', a: '#1a1530', b: '#221b40', l: '#2f2659', boss: 'oni', bn: 'Oni de la Estática' },
  { n: 'Jardín de los Hilos', a: '#0f2226', b: '#13292e', l: '#1d3d42', boss: 'weaver', bn: 'La Tejedora de Hilos' },
  { n: 'Salón del Shōgun', a: '#171a22', b: '#1d212b', l: '#2c3140', boss: 'shogun', bn: 'Shōgun Sin Rostro' },
];
const STORY = [
  { t: 'La Isla de Shinrai protegía cuatro santuarios de luz.', s: 'akiBig' },
  { t: 'La Estática convirtió a sus guardianes en Ecos: sombras con fallas de píxel.', s: 'ronin' },
  { t: 'Aki, la última aprendiz del Clan del Viento Menta, baja al Santuario Hundido con Kuro.', s: 'akiBig' },
];
const TIPS = { start: 'WASD mover · J katana · K dash · I kunai · L técnica · U sonido', shrine: 'Un altar del clan. Acércate y pulsa J.', boss: '' };

/* ───────── Juego ───────── */
function shinrai() {
  const SP = sprites(); audio();
  const G = { score: 0, over: false };
  let I = null, floor = 0, rooms, cur, cam = { x: 0, y: 0 }, shake = 0, stop = 0, slow = 1, time = 0;
  let enemies = [], shots = [], hazards = [], fx = [], parts = [], nums = [], coins = [], petals = [];
  let choice = null, cut = null, banner = null, trans = null, story = { i: 0, t: 0 }, dead = 0, won = 0, portal = null;
  let kills = 0, roomsDone = 0, blessCount = 0, musT = 0, musS = 0, floorCanvas = null, touchUI = false, kuroT = 0, warnAny = false;
  const seen = new WeakSet(); let stickPtr = null, holdAtk = null, mouse = null;
  const p = { x: RW / 2, y: RH / 2 + 60, face: 1, aim: 0, hp: 6, maxHp: 6, spd: 235, dmg: 20, ki: 0, kiMul: 1, chain: 0, tech: 'vendaval',
    kunai: 5, kMax: 5, kT: 0, kRate: .8, dashT: 0, dashCd: 0, dashCdMax: .55, dvx: 0, dvy: 0, inv: 0, atkT: 0, combo: -1, comboT: 0, comboMax: 3,
    crit: 0, coinMul: 1, dashCut: 0, bounce: 0, kuroShot: 0, steal: 0, wave: 0, roomHeal: 0, lastBreath: 0, breathUsed: 0,
    techT: 0, leaves: 0, leafTick: 0, awk: 0, walk: 0, moving: false, coins: 0, hurtT: 0 };
  const scarf = Array.from({ length: 7 }, () => ({ x: p.x, y: p.y - 30 }));
  const kuro = { x: p.x - 30, y: p.y - 60, t: 0 };

  /* — Piso — */
  function genFloor() {
    const key = (x, y) => x + ',' + y, map = new Map(), D = [[0, -1, 'n', 's'], [0, 1, 's', 'n'], [1, 0, 'e', 'w'], [-1, 0, 'w', 'e']];
    const s = { gx: ri(0, 3), gy: ri(0, 3) }; map.set(key(s.gx, s.gy), s); const list = [s];
    while (list.length < 6) { const b = pick(list), d = pick(D), nx = b.gx + d[0], ny = b.gy + d[1]; if (nx < 0 || ny < 0 || nx > 3 || ny > 3 || map.has(key(nx, ny))) continue; const r = { gx: nx, gy: ny }; map.set(key(nx, ny), r); list.push(r); }
    list.forEach(r => { r.doors = {}; D.forEach(d => { const n = map.get(key(r.gx + d[0], r.gy + d[1])); if (n) r.doors[d[2]] = n; }); r.type = 'combat'; r.cleared = false; r.seen = false; });
    const dist = new Map([[s, 0]]), q = [s]; while (q.length) { const r = q.shift(); Object.values(r.doors).forEach(n => { if (!dist.has(n)) { dist.set(n, dist.get(r) + 1); q.push(n); } }); }
    const far = list.slice(1).sort((a, b) => dist.get(b) - dist.get(a));
    s.type = 'start'; s.cleared = true; far[0].type = 'boss'; pick(far.slice(1)).type = 'shrine';
    rooms = list; floorCanvas = paintFloor(FLOORS[floor]); enter(s, null);
  }
  function paintFloor(F) {
    const c = document.createElement('canvas'); c.width = RW; c.height = RH; const x = c.getContext('2d');
    x.fillStyle = F.a; x.fillRect(0, 0, RW, RH);
    for (let y = BY0, row = 0; y < BY1; y += 34, row++) for (let px = BX0 - (row % 2) * 70; px < BX1; px += 140) {
      x.fillStyle = (row + px / 140) % 3 < 1 ? F.b : F.a; x.fillRect(px, y, 138, 32);
      x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(px, y + 32, 140, 2); x.fillRect(px + 138, y, 2, 34);
      x.fillStyle = 'rgba(255,255,255,.03)'; for (let i = 0; i < 3; i++) x.fillRect(px + rnd(6, 120), y + rnd(6, 26), rnd(10, 40), 1);
    }
    x.fillStyle = PAL.k; x.fillRect(0, 0, RW, BY0); x.fillRect(0, BY1, RW, RH - BY1); x.fillRect(0, 0, BX0, RH); x.fillRect(BX1, 0, RW - BX1, RH);
    for (let px = BX0; px < BX1; px += 92) { x.fillStyle = F.l; x.fillRect(px + 4, 22, 84, BY0 - 30); x.fillStyle = 'rgba(235,235,237,.08)'; x.fillRect(px + 8, 26, 76, BY0 - 38); x.strokeStyle = F.a; x.lineWidth = 3; x.beginPath(); x.moveTo(px + 46, 26); x.lineTo(px + 46, BY0 - 12); x.moveTo(px + 8, 26 + (BY0 - 38) / 2); x.lineTo(px + 84, 26 + (BY0 - 38) / 2); x.stroke(); }
    x.fillStyle = PAL.P; x.fillRect(BX0, BY0 - 8, BX1 - BX0, 8); x.fillStyle = PAL.m; x.globalAlpha = .5; x.fillRect(BX0, BY0 - 2, BX1 - BX0, 2); x.globalAlpha = 1;
    x.strokeStyle = 'rgba(83,230,212,.22)'; x.lineWidth = 2; x.strokeRect(BX0 - 1, BY0 - 1, BX1 - BX0 + 2, BY1 - BY0 + 2);
    return c;
  }
  const DOORS = { n: () => ({ x: RW / 2, y: BY0 }), s: () => ({ x: RW / 2, y: BY1 }), w: () => ({ x: BX0, y: (BY0 + BY1) / 2 }), e: () => ({ x: BX1, y: (BY0 + BY1) / 2 }) };
  function enter(r, from) {
    cur = r; r.seen = true; enemies = []; shots = []; hazards = []; coins = []; fx = []; portal = null;
    const OPP = { n: 's', s: 'n', e: 'w', w: 'e' }, side = from ? OPP[from] : null;
    if (side === 's') { p.x = RW / 2; p.y = BY1 - 30; } else if (side === 'n') { p.x = RW / 2; p.y = BY0 + 50; } else if (side === 'w') { p.x = BX0 + 40; p.y = (BY0 + BY1) / 2 + 20; } else if (side === 'e') { p.x = BX1 - 40; p.y = (BY0 + BY1) / 2 + 20; } else { p.x = RW / 2; p.y = (BY0 + BY1) / 2 + 40; }
    scarf.forEach(s => { s.x = p.x; s.y = p.y - 30; }); kuro.x = p.x - 30; kuro.y = p.y - 60;
    cam.x = clamp(p.x - W / 2, 0, RW - W); cam.y = clamp(p.y - H / 2, 0, RH - H);
    r.locked = false; r.wave = 0;
    if (r.type === 'combat' && !r.cleared) { r.locked = true; spawnWave(r); SFX.door(); }
    if (r.type === 'boss' && !r.cleared) { r.locked = true; spawnBoss(); }
    if (r.type === 'shrine' && !r.used) banner = { t: 'Altar del clan', s: TIPS.shrine, life: 2.4 };
    if (r.type === 'start' && floor === 0 && !r.told) { r.told = 1; banner = { t: FLOORS[floor].n, s: TIPS.start, life: 4 }; }
    else if (r.type === 'start') banner = { t: 'Piso ' + (floor + 1) + ' · ' + FLOORS[floor].n, s: '', life: 2.6 };
  }
  function spawnPos(minD = 230) { for (let i = 0; i < 40; i++) { const x = rnd(BX0 + 60, BX1 - 60), y = rnd(BY0 + 60, BY1 - 40); if (Math.hypot(x - p.x, y - p.y) > minD) return { x, y }; } return { x: BX0 + 80, y: BY0 + 80 }; }
  function spawnWave(r) {
    r.wave++; const n = 3 + floor + ri(0, 2) + (r.wave > 1 ? 1 : 0);
    const pool = floor === 0 ? ['ronin', 'ronin', 'archer', 'lantern'] : floor === 1 ? ['ronin', 'archer', 'lantern', 'shield', 'shadow'] : ['ronin', 'archer', 'shield', 'shadow', 'shadow', 'lantern'];
    for (let i = 0; i < n; i++) { const s = spawnPos(); addEnemy(pick(pool), s.x, s.y, .55 + i * .12); }
  }
  function addEnemy(type, x, y, spawn = .5) {
    const f = 1 + floor * .45, B = { ronin: [55, 110, 18], archer: [40, 95, 16], lantern: [30, 70, 16], shield: [80, 80, 20], shadow: [45, 120, 16] }[type];
    enemies.push({ type, x, y, hp: B[0] * f, max: B[0] * f, spd: B[1] * (1 + floor * .08), r: B[2], st: 'move', wt: 0, cd: rnd(.4, 1.4), aa: 0, face: 1, flash: 0, kx: 0, ky: 0, spawn, t: rnd(0, 9), guard: type === 'shield', fa: 0 });
  }
  function spawnBoss() {
    const F = FLOORS[floor], hp = [900, 1150, 1450][floor];
    enemies.push({ type: F.boss, boss: 1, x: RW / 2, y: BY0 + 170, hp, max: hp, spd: [95, 0, 85][floor], r: F.boss === 'weaver' ? 46 : 42, st: 'idle', wt: 1.4, cd: 1.6, aa: 0, face: 1, flash: 0, kx: 0, ky: 0, spawn: 0, t: 0, phase: 1, atk: 0 });
    cut = { kind: 'boss', t: 0, d: 1.6, name: F.bn, spr: F.boss }; SFX.cut();
  }

  /* — Utilidades de juego — */
  function part(x, y, n, col, sp = 160, life = .5, sz = 4) { for (let i = 0; i < n && parts.length < 150; i++) { const a = rnd(0, TAU), v = rnd(sp * .3, sp); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: rnd(life * .5, life), max: life, col, sz: ri(2, sz) }); } }
  function num(x, y, v, crit) { nums.push({ x: x + rnd(-8, 8), y, v: Math.round(v), t: .8, crit }); }
  function shakeIt(v) { shake = Math.max(shake, v); }
  function nearest(maxD) { let b = null, bd = maxD; enemies.forEach(e => { if (e.spawn > 0 || e.hp <= 0) return; const d = Math.hypot(e.x - p.x, e.y - p.y) - e.r; if (d < bd) { bd = d; b = e; } }); return b; }
  function hurt(n = 1) {
    if (p.inv > 0 || p.dashT > 0 || p.techT > 0 || dead || won) return;
    p.hp -= n; p.inv = 1.1; p.hurtT = .25; p.chain = 0; shakeIt(12); stop = .08; SFX.hurt(); part(p.x, p.y - 26, 14, PAL.q, 200);
    if (p.hp <= 0 && p.lastBreath && !p.breathUsed) { p.breathUsed = 1; p.hp = .5; banner = { t: 'Último aliento', s: 'El viento te sostiene una vez más', life: 2 }; }
    if (p.hp <= 0) { p.hp = 0; dead = .001; banner = null; }
  }
  function hitEnemy(e, d, ang, kb = 120, src = 'blade') {
    if (e.hp <= 0 || e.spawn > 0) return false;
    if (e.guard && src !== 'tech' && Math.abs(angDiff(ang + Math.PI, e.fa)) < 1.1) { part(e.x + Math.cos(e.fa) * 18, e.y - 20 + Math.sin(e.fa) * 10, 6, PAL.g, 220, .25, 3); tone(1200, .05, 'square', .02); e.kx += Math.cos(ang) * 60; e.ky += Math.sin(ang) * 60; return false; }
    const cr = Math.random() < p.crit; if (cr) d *= 2; if (p.awk > 0) d *= 1.8;
    e.hp -= d; e.flash = .09; if (!e.boss) { e.kx += Math.cos(ang) * kb; e.ky += Math.sin(ang) * kb; }
    num(e.x, e.y - (e.boss ? 90 : 46), d, cr); part(e.x, e.y - 20, 6, cr ? PAL.q : PAL.m, 220, .35);
    if (src !== 'leaf') p.ki = Math.min(100, p.ki + (src === 'kunai' ? 3 : 6) * p.kiMul);
    if (e.hp <= 0) killEnemy(e); return true;
  }
  function killEnemy(e) {
    kills++; G.score += e.boss ? 0 : 25; part(e.x, e.y - 20, e.boss ? 60 : 18, PAL.p, 260, .7, 5); part(e.x, e.y - 20, e.boss ? 40 : 10, PAL.m, 200, .6);
    const n = (e.boss ? 0 : ri(1, 3)) * p.coinMul; for (let i = 0; i < n; i++) coins.push({ x: e.x + rnd(-14, 14), y: e.y + rnd(-10, 10), vx: rnd(-90, 90), vy: rnd(-90, 90), t: 0 });
    if (e.type === 'lantern') hazards.push({ k: 'circle', x: e.x, y: e.y, r: 82, warn: .45, act: .12 });
    if (!e.boss && p.steal && Math.random() < p.steal && p.hp < p.maxHp) { p.hp = Math.min(p.maxHp, p.hp + .5); num(p.x, p.y - 70, 0, false); }
    if (e.boss && !enemies.some(o => o !== e && o.boss && o.hp > 0)) bossDown();
  }
  function bossDown() {
    shakeIt(20); stop = .35; SFX.boom(); hazards = []; shots = shots.filter(s => s.mine);
    enemies.forEach(e => { if (!e.boss && e.hp > 0) { e.hp = 0; part(e.x, e.y - 20, 10, PAL.p); } });
    G.score += 1000; cur.cleared = true; cur.locked = false; roomsDone++;
    if (floor < 2) { portal = { x: RW / 2, y: (BY0 + BY1) / 2, t: 0 }; banner = { t: 'Santuario purificado', s: 'Entra al portal para bajar al siguiente piso', life: 3.4 }; }
    else { won = .001; G.score += 1500 + Math.round(p.hp * 200); }
  }
  function roomClear() {
    cur.cleared = true; cur.locked = false; roomsDone++; G.score += 150; SFX.door();
    if (p.roomHeal) p.hp = Math.min(p.maxHp, p.hp + 1);
    offerBless();
  }
  function offerBless() {
    const pool = BLESS.filter(b => !(b.t === 'Ojos del cuervo' && p.kuroShot) && !(b.t === 'Furia del clan' && p.wave) && !(b.t === 'Último aliento' && p.lastBreath) && !(b.t === 'Bendición del santuario' && p.roomHeal));
    const cards = []; while (cards.length < 3) { const roll = Math.random(), r = roll < .1 ? 2 : roll < .4 ? 1 : 0; const opts = pool.filter(b => b.r === r && !cards.includes(b)); const b = pick(opts.length ? opts : pool.filter(x => !cards.includes(x))); cards.push(b); }
    choice = { title: 'Elige una bendición', cards: cards.map(b => ({ t: b.t, d: b.d, r: b.r, f: () => { b.f(p); blessCount++; } })), sel: 1, t: 0 };
  }
  function offerShrine() {
    const cards = Object.keys(TECHS).filter(k => k !== p.tech).map(k => ({ t: TECHS[k].t, d: TECHS[k].d + ' (técnica con L)', r: 1, f: () => { p.tech = k; } }));
    cards.push({ t: 'Agua del santuario', d: 'Recuperas todos tus corazones', r: 0, f: () => { p.hp = p.maxHp; } });
    choice = { title: 'Altar del Clan del Viento Menta', cards, sel: 1, t: 0 }; cur.used = true;
  }

  /* — Acciones de Aki — */
  function aimAt(tx, ty) { p.aim = Math.atan2(ty - p.y + 22, tx - p.x); p.face = Math.cos(p.aim) >= 0 ? 1 : -1; }
  function autoAim() { const e = nearest(260); if (e) aimAt(e.x, e.y - 18); else if (mouse && !touchUI) aimAt(mouse.x + cam.x, mouse.y + cam.y); }
  function attack(manual) {
    if (p.atkT > 0 || p.dashT > 0 || p.techT > 0) return;
    if (manual) aimAt(manual.x, manual.y); else autoAim();
    p.combo = p.comboT > 0 ? (p.combo + 1) % p.comboMax : 0; p.comboT = .55;
    const fin = p.combo === p.comboMax - 1; p.atkT = fin ? .3 : .19;
    p.x += Math.cos(p.aim) * (fin ? 26 : 12); p.y += Math.sin(p.aim) * (fin ? 18 : 8);
    const R = fin ? 98 : 82, cx = p.x, cy = p.y - 22;
    fx.push({ k: 'slash', x: cx, y: cy, a: p.aim, r: R, t: 0, d: .16, fin, flip: p.combo % 2 });
    SFX.slash(); let any = false;
    enemies.forEach(e => { const ex = e.x - cx, ey = e.y - (e.boss ? 40 : 18) - cy, d = Math.hypot(ex, ey); if (d < R + e.r && Math.abs(angDiff(Math.atan2(ey, ex), p.aim)) < 1.15) { if (hitEnemy(e, p.dmg * (fin ? 1.8 : 1), p.aim, fin ? 260 : 110)) any = true; } });
    if (fin && p.wave) shots.push({ mine: 1, k: 'wave', x: cx, y: cy, vx: Math.cos(p.aim) * 560, vy: Math.sin(p.aim) * 560, life: .55, dmg: p.dmg * 1.2, hit: new Set(), r: 26 });
    if (any) { SFX.hit(); stop = Math.max(stop, fin ? .12 : .05); shakeIt(fin ? 9 : 4); }
  }
  function dash(mx, my) {
    if (p.dashCd > 0 || p.dashT > 0) return;
    if (!mx && !my) { mx = p.face; my = 0; } const l = Math.hypot(mx, my); p.dvx = mx / l; p.dvy = my / l;
    p.dashT = .18; p.dashCd = p.dashCdMax; p.inv = Math.max(p.inv, .25); p.dashHit = new Set(); SFX.dash(); part(p.x, p.y - 10, 8, PAL.m, 120, .3, 3);
  }
  function throwKunai(manual) {
    if (p.kunai < 1) return; p.kunai--; if (manual) aimAt(manual.x, manual.y); else autoAim(); SFX.kunai();
    shots.push({ mine: 1, k: 'kunai', x: p.x, y: p.y - 24, vx: Math.cos(p.aim) * 720, vy: Math.sin(p.aim) * 720, life: 1.2, dmg: p.dmg * .7, r: 8, bounce: p.bounce });
  }
  function technique() {
    if (p.ki < 100 || p.techT > 0) return;
    if (p.chain >= 3) { p.ki = 0; p.chain = 0; cut = { kind: 'awaken', t: 0, d: 1 }; SFX.cut(); return; }
    p.ki = 0; p.chain++; SFX.tech(); autoAim(); shakeIt(8);
    if (p.tech === 'vendaval') { p.techT = .28; p.dvx = Math.cos(p.aim); p.dvy = Math.sin(p.aim); p.dashHit = new Set(); fx.push({ k: 'lines', t: 0, d: .35 }); }
    if (p.tech === 'hojas') { p.leaves = 3; p.leafTick = 0; }
    if (p.tech === 'cuervo') for (let i = 0; i < 6; i++) { const a = p.aim + (i - 2.5) * .5; shots.push({ mine: 1, k: 'crow', x: kuro.x, y: kuro.y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, life: 2.6, dmg: p.dmg * 1.4, r: 12 }); }
    banner = { t: TECHS[p.tech].t, s: p.chain >= 3 ? 'Despertar listo: llena el Ki otra vez' : '', life: 1.4, small: 1 };
  }

  /* — Entrada — */
  function readInput() {
    let mx = (I.keys.d || I.keys.ArrowRight ? 1 : 0) - (I.keys.a || I.keys.ArrowLeft ? 1 : 0), my = (I.keys.s || I.keys.ArrowDown ? 1 : 0) - (I.keys.w || I.keys.ArrowUp ? 1 : 0);
    const acts = { atk: 0, dash: 0, tech: 0, kunai: 0, at: null };
    I.keyQ.forEach(k => { if (k === 'j' || k === ' ') acts.atk = 1; if (k === 'k' || k === 'Shift') acts.dash = 1; if (k === 'l') acts.tech = 1; if (k === 'i') acts.kunai = 1; if (k === 'u') { muted = !muted; try { localStorage.setItem('og.shinrai.mute', muted ? '1' : '0'); } catch {} } });
    if (I.px != null) mouse = { x: I.px, y: I.py };
    const ptrs = I.pointers || []; if (ptrs.some(q => q.touch)) touchUI = true;
    stickPtr = ptrs.find(q => q.touch && q.sx < W * .5) || null;
    if (stickPtr) { const dx = stickPtr.x - stickPtr.sx, dy = stickPtr.y - stickPtr.sy, l = Math.hypot(dx, dy); if (l > 8) { mx = dx / Math.max(l, 55); my = dy / Math.max(l, 55); } }
    holdAtk = null;
    ptrs.forEach(q => {
      const fresh = !seen.has(q); seen.add(q);
      if (!q.touch) { if (fresh && !choice) { acts.atk = 1; acts.at = { x: q.x + cam.x, y: q.y + cam.y }; } return; }
      if (q.sx < W * .5) return;
      const b = BTN.find(b => Math.hypot(q.sx - b.x, q.sy - b.y) < b.r + 14);
      if (b && b.id === 'atk') holdAtk = q;
      if (fresh && b) acts[b.id] = 1;
    });
    if (holdAtk) acts.atk = 1;
    const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
    return { mx, my, ...acts };
  }
  const BTN = [{ id: 'atk', x: W - 100, y: H - 100, r: 50, t: 'KATANA' }, { id: 'dash', x: W - 215, y: H - 62, r: 34, t: 'DASH' }, { id: 'tech', x: W - 225, y: H - 168, r: 34, t: 'TÉCNICA' }, { id: 'kunai', x: W - 108, y: H - 220, r: 30, t: 'KUNAI' }];

  function choiceInput() {
    const n = choice.cards.length; let pickI = -1;
    I.keyQ.forEach(k => { if (k === 'ArrowLeft' || k === 'a') choice.sel = (choice.sel + n - 1) % n; if (k === 'ArrowRight' || k === 'd') choice.sel = (choice.sel + 1) % n; if (k === 'j' || k === 'Enter' || k === ' ') pickI = choice.sel; const d = +k; if (d >= 1 && d <= n) pickI = d - 1; });
    I.taps.forEach(t => { cardRects().forEach((r, i) => { if (t.x > r.x && t.x < r.x + r.w && t.y > r.y && t.y < r.y + r.h) pickI = i; }); });
    if (mouse && !touchUI) cardRects().forEach((r, i) => { if (mouse.x > r.x && mouse.x < r.x + r.w && mouse.y > r.y && mouse.y < r.y + r.h) choice.sel = i; });
    (I.pointers || []).forEach(q => seen.add(q));
    if (pickI >= 0 && choice.t > .35) { choice.cards[pickI].f(); SFX.bless(); part(p.x, p.y - 30, 24, PAL.m, 220); choice = null; }
  }
  function cardRects() { const n = choice.cards.length, w = 230, gap = 22, x0 = (W - (n * w + (n - 1) * gap)) / 2; return choice.cards.map((c, i) => ({ x: x0 + i * (w + gap), y: 200, w, h: 250 })); }

  /* — Update — */
  G.update = (dt, inp) => {
    I = inp; time += dt;
    if (AC && !muted) { musT -= dt; if (musT <= 0) { musT += .21; const s = musS++ % 32; if (MEL[s] >= 0) tone(PENT[MEL[s]], .2, 'triangle', .016); if (s % 4 === 0) tone(PENT[BAS[(s >> 2) % 8]] / 2, .42, 'square', .01); } }
    if (story) {
      story.t += dt; const skip = inp.keyQ.length || inp.taps.length || (inp.pointers || []).some(q => !seen.has(q) && seen.add(q));
      if (inp.keyQ.includes('Enter') || inp.keyQ.includes('Escape')) story.i = 99;
      else if (skip && story.t > .3 || story.t > 4) { story.i++; story.t = 0; }
      if (story.i >= STORY.length) { story = null; genFloor(); }
      return;
    }
    if (dead) { dead += dt; if (dead > 3.2) G.over = true; tickFx(dt * .4); return; }
    if (won) { won += dt; tickFx(dt); if (won > 5) G.over = true; return; }
    if (choice) { choice.t += dt; choiceInput(); tickFx(dt * .3); return; }
    if (cut) { cut.t += dt; tickFx(dt * .15); if (cut.t >= cut.d || (cut.kind === 'boss' && cut.t > .5 && (inp.keyQ.length || inp.taps.length))) { if (cut.kind === 'awaken') { p.awk = 6; part(p.x, p.y - 30, 40, PAL.m, 300, .8); } cut = null; } return; }
    if (trans) { trans.t += dt; if (!trans.done && trans.t >= .3) { trans.done = 1; trans.fn(); } if (trans.t >= .6) trans = null; return; }
    if (stop > 0) { stop -= dt; readInput(); return; }
    const sdt = dt * slow;
    const a = readInput();
    updPlayer(sdt, a);
    enemies.forEach(e => e.boss ? updBoss(e, sdt) : updEnemy(e, sdt));
    enemies = enemies.filter(e => e.hp > 0);
    separate();
    updShots(sdt); updHazards(sdt); updCoins(sdt); tickFx(sdt);
    if (cur.locked && cur.type === 'combat' && enemies.length === 0) { if (cur.wave < 2) spawnWave(cur); else roomClear(); }
    if (portal) { portal.t += dt; if (Math.hypot(p.x - portal.x, p.y - portal.y) < 40) { portal = null; trans = { t: 0, fn: () => { floor++; p.breathUsed = 0; genFloor(); } }; } }
    if (banner) { banner.life -= dt; if (banner.life <= 0) banner = null; }
    const lx = p.x - W / 2 + (p.moving ? p.face * 20 : 0), ly = p.y - H / 2 - 20;
    cam.x = lerp(cam.x, clamp(lx, 0, RW - W), .12); cam.y = lerp(cam.y, clamp(ly, 0, RH - H), .12);
    shake = Math.max(0, shake - dt * 40);
  };

  function updPlayer(dt, a) {
    p.inv -= dt; p.hurtT -= dt; p.dashCd -= dt; p.atkT -= dt; p.comboT -= dt; p.awk = Math.max(0, p.awk - dt);
    if (p.kunai < p.kMax) { p.kT += dt; if (p.kT >= p.kRate) { p.kT = 0; p.kunai++; } }
    const spd = p.spd * (p.awk > 0 ? 1.6 : 1);
    if (a.dash) dash(a.mx, a.my); if (a.tech) technique(); if (a.kunai) throwKunai(a.at); if (a.atk) attack(a.at);
    p.moving = false;
    if (p.techT > 0) { p.techT -= dt; p.x += p.dvx * 1150 * dt; p.y += p.dvy * 1150 * dt; sweepHit(p.dmg * 2.2, 'tech'); if (Math.random() < .7) parts.length < 150 && parts.push({ x: p.x, y: p.y - 20, vx: 0, vy: 0, life: .25, max: .25, col: PAL.m, sz: 5 }); }
    else if (p.dashT > 0) { p.dashT -= dt; p.x += p.dvx * 900 * dt; p.y += p.dvy * 900 * dt; if (p.dashCut) sweepHit(p.dashCut + p.dmg * .5, 'dash'); fx.push({ k: 'ghost', x: p.x, y: p.y, f: p.face, t: 0, d: .2 }); }
    else if (a.mx || a.my) { const sl = p.atkT > 0 ? .35 : 1; p.x += a.mx * spd * sl * dt; p.y += a.my * spd * sl * dt; p.moving = true; p.walk += dt * 10; if (p.atkT <= 0 && a.mx) p.face = a.mx > 0 ? 1 : -1; }
    if (p.awk > 0 && p.moving && Math.random() < .5) fx.push({ k: 'ghost', x: p.x, y: p.y, f: p.face, t: 0, d: .25 });
    if (p.leaves > 0) { p.leaves -= dt; p.leafTick -= dt; if (p.leafTick <= 0) { p.leafTick = .2; enemies.forEach(e => { if (Math.hypot(e.x - p.x, e.y - p.y) < 125 + e.r) hitEnemy(e, p.dmg * .55, Math.atan2(e.y - p.y, e.x - p.x), 40, 'leaf'); }); } }
    // puertas
    const dx = Math.abs(p.x - RW / 2) < 56, dy = Math.abs(p.y - (BY0 + BY1) / 2 - 20) < 56;
    if (!cur.locked) {
      const go = s => { trans = { t: 0, fn: () => enter(cur.doors[s], s) }; SFX.door(); };
      if (cur.doors.n && dx && p.y < BY0 + 22 && a.my < 0) return go('n');
      if (cur.doors.s && dx && p.y > BY1 - 6 && a.my > 0) return go('s');
      if (cur.doors.w && dy && p.x < BX0 + 18 && a.mx < 0) return go('w');
      if (cur.doors.e && dy && p.x > BX1 - 18 && a.mx > 0) return go('e');
    }
    p.x = clamp(p.x, BX0 + 16, BX1 - 16); p.y = clamp(p.y, BY0 + 20, BY1 - 4);
    if (cur.type === 'shrine' && !cur.used && Math.hypot(p.x - RW / 2, p.y - (BY0 + BY1) / 2) < 80 && a.atk) offerShrine();
    // bufanda y Kuro
    scarf[0].x = p.x - p.face * 5; scarf[0].y = p.y - 31;
    for (let i = 1; i < scarf.length; i++) { const s = scarf[i], q = scarf[i - 1], tx = q.x - p.face * 6 - (p.moving ? p.face * 2 : 0), ty = q.y + 1.2 + Math.sin(time * 9 + i) * 1.4; s.x = lerp(s.x, tx, .45); s.y = lerp(s.y, ty, .45); }
    kuro.t += dt; const kx = p.x - p.face * 44, ky = p.y - 70 + Math.sin(kuro.t * 4) * 6; kuro.x = lerp(kuro.x, kx, .08); kuro.y = lerp(kuro.y, ky, .08);
    if (p.kuroShot) { kuroT -= dt; const e = nearest(380); if (kuroT <= 0 && e) { kuroT = 2; const a2 = Math.atan2(e.y - 20 - kuro.y, e.x - kuro.x); shots.push({ mine: 1, k: 'feather', x: kuro.x, y: kuro.y, vx: Math.cos(a2) * 520, vy: Math.sin(a2) * 520, life: 1, dmg: p.dmg * .8, r: 8 }); } }
  }
  function sweepHit(d, src) { enemies.forEach(e => { if (!p.dashHit.has(e) && Math.hypot(e.x - p.x, e.y - 18 - (p.y - 18)) < e.r + 34) { p.dashHit.add(e); if (hitEnemy(e, d, Math.atan2(e.y - p.y, e.x - p.x), 160, src)) { SFX.hit(); stop = .05; shakeIt(6); } } }); }

  function separate() {
    for (let i = 0; i < enemies.length; i++) for (let j = i + 1; j < enemies.length; j++) { const a = enemies[i], b = enemies[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, m = a.r + b.r; if (d < m) { const o = (m - d) / 2, ux = dx / d, uy = dy / d; if (!a.boss) { a.x -= ux * o; a.y -= uy * o; } if (!b.boss) { b.x += ux * o; b.y += uy * o; } } }
    enemies.forEach(e => { e.x = clamp(e.x, BX0 + e.r, BX1 - e.r); e.y = clamp(e.y, BY0 + e.r, BY1 - 4); });
  }
  function moveTo(e, a, s, dt) { e.x += Math.cos(a) * s * dt; e.y += Math.sin(a) * s * dt; }
  function updEnemy(e, dt) {
    e.t += dt; e.flash -= dt; e.x += e.kx * dt; e.y += e.ky * dt; e.kx *= .86; e.ky *= .86;
    if (e.spawn > 0) { e.spawn -= dt; return; }
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx); e.face = dx > 0 ? 1 : -1; e.cd -= dt;
    const strike = (range, arc) => { fx.push({ k: 'eslash', x: e.x, y: e.y - 18, a: e.aa, r: range, t: 0, d: .16 }); if (d < range + 14 && Math.abs(angDiff(a, e.aa)) < arc) hurt(); };
    switch (e.type) {
      case 'ronin': case 'shield':
        if (e.guard) e.fa += clamp(angDiff(a, e.fa), -2.2 * dt, 2.2 * dt);
        if (e.st === 'move') { if (d > 60) moveTo(e, a, e.spd * (e.guard ? .7 : 1), dt); if (d < 88 && e.cd <= 0) { e.st = 'warn'; e.wt = e.guard ? .6 : .5; e.aa = a; } }
        else if ((e.wt -= dt) <= 0) { strike(e.guard ? 80 : 92, 1.05); e.st = 'move'; e.cd = rnd(1, 1.5); }
        break;
      case 'archer':
        if (e.st === 'move') { const want = d < 220 ? a + Math.PI : d > 330 ? a : a + Math.PI / 2 * Math.sign(Math.sin(e.t)); moveTo(e, want, e.spd, dt); if (e.cd <= 0) { e.st = 'warn'; e.wt = .65; e.aa = a; } }
        else { e.aa = lerp(e.aa, e.aa + angDiff(a, e.aa), .05); if ((e.wt -= dt) <= 0) { for (let i = -1; i <= 1; i++) shots.push({ k: 'arrow', x: e.x, y: e.y - 22, vx: Math.cos(e.aa + i * .22) * 340, vy: Math.sin(e.aa + i * .22) * 340, life: 2.2, r: 7 }); tone(700, .06, 'triangle', .02, -300); e.st = 'move'; e.cd = rnd(1.6, 2.2); } }
        break;
      case 'lantern':
        moveTo(e, a + Math.sin(e.t * 2) * .6, e.spd, dt); if (d < 46) e.hp = 0, killEnemy(e);
        break;
      case 'shadow':
        if (e.st === 'move') { if (d > 70) moveTo(e, a, e.spd * .5, dt); if (e.cd <= 0) { e.st = 'tele'; e.wt = .55; e.tx = clamp(p.x - p.face * 66, BX0 + 30, BX1 - 30); e.ty = clamp(p.y + rnd(-10, 10), BY0 + 30, BY1 - 10); } }
        else if (e.st === 'tele') { if ((e.wt -= dt) <= 0) { part(e.x, e.y - 20, 10, PAL.P, 140); e.x = e.tx; e.y = e.ty; part(e.x, e.y - 20, 10, PAL.P, 140); e.st = 'warn'; e.wt = .38; e.aa = Math.atan2(p.y - e.y, p.x - e.x); } }
        else if ((e.wt -= dt) <= 0) { strike(86, 1.1); e.st = 'move'; e.cd = rnd(2.4, 3.2); }
        break;
    }
  }

  /* — Jefes — */
  function updBoss(e, dt) {
    e.t += dt; e.flash -= dt; if (e.spawn > 0) { e.spawn -= dt; return; }
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx); e.face = dx > 0 ? 1 : -1;
    const group = enemies.filter(o => o.boss), tot = group.reduce((s, o) => s + Math.max(0, o.hp), 0), mx = group.reduce((s, o) => s + o.max, 0);
    if (e.phase === 1 && e.type !== 'armor' && e.hp < e.max * .5) { e.phase = 2; phase2(e); if (e.hp <= 0) return; }
    const f2 = e.phase === 2 ? 1.3 : 1;
    if (e.type === 'oni') {
      if (e.st === 'idle') { moveTo(e, a, e.spd * f2, dt); if ((e.wt -= dt) <= 0) { if (d > 220 || Math.random() < .45) { e.st = 'cwarn'; e.wt = .65; e.aa = a; hazards.push({ k: 'line', x1: e.x, y1: e.y, x2: e.x + Math.cos(a) * 900, y2: e.y + Math.sin(a) * 900, w: 70, warn: .65, act: 0, owner: e }); } else { e.st = 'swarn'; e.wt = .55; hazards.push({ k: 'circle', x: e.x, y: e.y, r: 120, warn: .55, act: .1 }); } } }
      else if (e.st === 'cwarn') { if ((e.wt -= dt) <= 0) { e.st = 'charge'; e.wt = .6; } }
      else if (e.st === 'charge') { moveTo(e, e.aa, 720 * f2, dt); if (d < e.r + 16) hurt(); part(e.x, e.y, 2, PAL.P, 60, .3); if ((e.wt -= dt) <= 0 || e.x < BX0 + e.r + 2 || e.x > BX1 - e.r - 2 || e.y < BY0 + e.r + 2 || e.y > BY1 - 6) { shakeIt(14); SFX.boom(); e.st = 'idle'; e.wt = rnd(.9, 1.4) / f2; } }
      else if (e.st === 'swarn') { if ((e.wt -= dt) <= 0) { shakeIt(16); SFX.boom(); const n = e.phase === 2 ? 3 : 1; for (let i = 0; i < n; i++) hazards.push({ k: 'ring', x: e.x, y: e.y, r: 20 - i * 110, spd: 330, w: 24, max: 620 }); e.st = 'idle'; e.wt = rnd(1, 1.5) / f2; } }
    } else if (e.type === 'weaver') {
      e.x = RW / 2 + Math.sin(e.t * .5) * 330; e.y = BY0 + 150 + Math.sin(e.t * .9) * 30;
      if ((e.wt -= dt) <= 0) {
        e.atk = (e.atk + 1) % 3; e.wt = (e.atk === 1 ? 2.4 : 2) / f2;
        if (e.atk === 0) { const n = e.phase === 2 ? 4 : 3; for (let i = 0; i < n; i++) { if (e.phase === 2) { const hz = i % 2 === 0, v = hz ? p.y + (i - 1.5) * 90 : p.x + (i - 1.5) * 120; hazards.push(hz ? { k: 'line', x1: BX0, y1: v, x2: BX1, y2: v, w: 14, warn: .85 + i * .12, act: .35 } : { k: 'line', x1: v, y1: BY0, x2: v, y2: BY1, w: 14, warn: .85 + i * .12, act: .35 }); } else { const an = rnd(0, Math.PI), cx = p.x + rnd(-60, 60), cy = p.y + rnd(-40, 40); hazards.push({ k: 'line', x1: cx - Math.cos(an) * 900, y1: cy - Math.sin(an) * 900, x2: cx + Math.cos(an) * 900, y2: cy + Math.sin(an) * 900, w: 14, warn: .85 + i * .2, act: .35 }); } } }
        if (e.atk === 1) for (let b = 0; b < 3; b++) for (let i = 0; i < 12; i++) { const an = i / 12 * TAU + b * .26; shots.push({ k: 'orb', x: e.x, y: e.y - 40, vx: Math.cos(an) * 190 * f2, vy: Math.sin(an) * 190 * f2, life: 4, r: 9, delay: b * .35 }); }
        if (e.atk === 2) { for (let i = 0; i < (e.phase === 2 ? 3 : 2); i++) { const s = spawnPos(160); addEnemy('shadow', s.x, s.y, .6); } }
      }
    } else { // shogun / armor
      if (e.st === 'idle') { if (d > 95) moveTo(e, a, e.spd * (e.type === 'armor' ? 1.15 : 1), dt); if ((e.wt -= dt) <= 0) { if (d < 210 || Math.random() < .5) { e.st = 'warn'; e.wt = e.type === 'armor' ? .55 : .65; e.aa = a; hazards.push({ k: 'cone', x: e.x, y: e.y - 20, a, r: e.type === 'armor' ? 150 : 185, arc: 1.25, warn: e.wt, act: .1 }); } else { e.st = 'idle'; e.wt = 1.3; for (let i = -2; i <= 2; i++) shots.push({ k: 'orb', x: e.x, y: e.y - 40, vx: Math.cos(a + i * .2) * 260, vy: Math.sin(a + i * .2) * 260, life: 3, r: 10 }); tone(300, .2, 'sawtooth', .03, -100); } } }
      else if ((e.wt -= dt) <= 0) { shakeIt(10); SFX.slash(); e.st = 'idle'; e.wt = rnd(1, 1.6) * (e.type === 'armor' ? 1.4 : 1); fx.push({ k: 'eslash', x: e.x, y: e.y - 20, a: e.aa, r: e.type === 'armor' ? 150 : 185, t: 0, d: .2, big: 1 }); }
    }
    void tot; void mx;
  }
  function phase2(e) {
    shakeIt(14); stop = .25; SFX.cut(); part(e.x, e.y - 50, 40, PAL.g, 260, .6);
    if (e.type === 'oni') { banner = { t: '¡La máscara se rompe!', s: 'El Oni se enfurece', life: 2 }; for (let i = 0; i < 2; i++) { const s = spawnPos(160); addEnemy('ronin', s.x, s.y, .7); } }
    if (e.type === 'weaver') banner = { t: 'Los hilos se tensan', s: 'La Tejedora teje en cuadrícula', life: 2 };
    if (e.type === 'shogun') {
      banner = { t: 'El Shōgun se divide', s: 'Tres armaduras vacías te rodean', life: 2.2 };
      const hp = e.hp / 3; e.hp = 0;
      for (let i = 0; i < 3; i++) { const an = i / 3 * TAU; enemies.push({ type: 'armor', boss: 1, x: clamp(e.x + Math.cos(an) * 140, BX0 + 60, BX1 - 60), y: clamp(e.y + Math.sin(an) * 110, BY0 + 60, BY1 - 20), hp, max: hp, spd: 110, r: 32, st: 'idle', wt: .8 + i * .5, cd: 0, aa: 0, face: 1, flash: 0, kx: 0, ky: 0, spawn: .5, t: 0, phase: 2 }); }
    }
  }

  function updShots(dt) {
    for (const s of shots) {
      if (s.delay > 0) { s.delay -= dt; continue; }
      s.life -= dt;
      if (s.k === 'crow') { const e = enemies.reduce((b, o) => (o.spawn <= 0 && (!b || Math.hypot(o.x - s.x, o.y - s.y) < Math.hypot(b.x - s.x, b.y - s.y))) ? o : b, null); if (e) { const a = Math.atan2(e.y - 20 - s.y, e.x - s.x), cur2 = Math.atan2(s.vy, s.vx), na = cur2 + clamp(angDiff(a, cur2), -6 * dt, 6 * dt); s.vx = Math.cos(na) * 430; s.vy = Math.sin(na) * 430; } }
      s.x += s.vx * dt; s.y += s.vy * dt;
      const out = s.x < BX0 || s.x > BX1 || s.y < BY0 - 30 || s.y > BY1;
      if (out) { if (s.bounce > 0) { s.bounce--; if (s.x < BX0 || s.x > BX1) s.vx *= -1; else s.vy *= -1; s.x = clamp(s.x, BX0, BX1); s.y = clamp(s.y, BY0 - 30, BY1); } else s.life = 0; }
      if (s.mine) { for (const e of enemies) { if (e.spawn > 0 || e.hp <= 0) continue; if (s.hit && s.hit.has(e)) continue; if (Math.hypot(e.x - s.x, e.y - (e.boss ? 40 : 20) - s.y) < e.r + s.r) { if (hitEnemy(e, s.dmg, Math.atan2(s.vy, s.vx), 80, s.k === 'kunai' || s.k === 'feather' ? 'kunai' : 'tech')) SFX.hit(); if (s.hit) s.hit.add(e); else { s.life = 0; break; } } } }
      else if (Math.hypot(p.x - s.x, p.y - 22 - s.y) < s.r + 12) { hurt(); s.life = 0; }
    }
    shots = shots.filter(s => s.life > 0);
  }
  function updHazards(dt) {
    warnAny = false;
    for (const h of hazards) {
      if (h.k === 'ring') { h.r += h.spd * dt; if (h.r > 0 && Math.abs(Math.hypot(p.x - h.x, p.y - h.y) - h.r) < h.w / 2) hurt(); if (h.r > h.max) h.dead = 1; continue; }
      if (h.warn > 0) { h.warn -= dt; warnAny = true; if (h.warn <= 0) { h.firing = true; if (h.k !== 'line' || h.act) SFX.boom(); shakeIt(6); } continue; }
      if (h.k === 'line' && !h.act) { h.dead = 1; continue; }
      const hitP = h.k === 'circle' ? Math.hypot(p.x - h.x, p.y - h.y) < h.r : h.k === 'line' ? segDist(p.x, p.y - 14, h.x1, h.y1, h.x2, h.y2) < h.w / 2 : (Math.hypot(p.x - h.x, p.y - 20 - h.y) < h.r && Math.abs(angDiff(Math.atan2(p.y - 20 - h.y, p.x - h.x), h.a)) < h.arc / 2);
      if (hitP) hurt();
      h.act -= dt; if (h.act <= 0) h.dead = 1;
    }
    hazards = hazards.filter(h => !h.dead);
  }
  function updCoins(dt) {
    for (const c of coins) { c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vx *= .9; c.vy *= .9; const d = Math.hypot(p.x - c.x, p.y - 10 - c.y), R = 150; if (d < R && c.t > .3) { const a = Math.atan2(p.y - 10 - c.y, p.x - c.x); c.x += Math.cos(a) * (R - d + 200) * dt * 2; c.y += Math.sin(a) * (R - d + 200) * dt * 2; } if (d < 20) { c.got = 1; p.coins++; G.score += 5; SFX.coin(); } }
    coins = coins.filter(c => !c.got);
  }
  function tickFx(dt) {
    fx.forEach(f => f.t += dt); fx = fx.filter(f => f.t < f.d);
    parts.forEach(q => { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .92; q.vy = q.vy * .92 + 160 * dt; q.life -= dt; }); parts = parts.filter(q => q.life > 0);
    nums.forEach(n => { n.y -= 50 * dt; n.t -= dt; }); nums = nums.filter(n => n.t > 0);
    while (petals.length < 22) petals.push({ x: rnd(0, W), y: rnd(-H, 0), vx: rnd(-30, -10), vy: rnd(25, 55), a: rnd(0, TAU), c: Math.random() < .5 ? PAL.q : PAL.n });
    petals.forEach(q => { q.x += q.vx * dt; q.y += q.vy * dt; q.a += dt * 2; if (q.y > H + 10) { q.y = -10; q.x = rnd(0, W + 100); } });
  }

  /* — Dibujo — */
  G.draw = (ctx, dt) => {
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.textBaseline = 'alphabetic';
    if (story) { drawStory(ctx); ctx.restore(); return; }
    if (!cur) { ctx.fillStyle = PAL.k; ctx.fillRect(0, 0, W, H); ctx.restore(); return; }
    const sx = rnd(-shake, shake), sy = rnd(-shake, shake);
    ctx.fillStyle = PAL.k; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(Math.round(-cam.x + sx), Math.round(-cam.y + sy));
    ctx.drawImage(floorCanvas, 0, 0);
    drawDoors(ctx); drawLamps(ctx);
    if (cur.type === 'shrine') drawShrine(ctx);
    if (portal) { const t = portal.t; for (let i = 0; i < 3; i++) { ctx.strokeStyle = i % 2 ? PAL.m : PAL.q; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(portal.x, portal.y, 46 - i * 12 + Math.sin(t * 4 + i) * 4, 22 - i * 6, 0, 0, TAU); ctx.stroke(); } }
    drawHazards(ctx);
    coins.forEach(c => spr(ctx, SP.coin, c.x, c.y + Math.sin(c.t * 8) * 2));
    // sombras + entidades ordenadas por y
    const ents = enemies.map(e => ({ y: e.y, e })); ents.push({ y: p.y, me: 1 });
    ents.sort((a, b) => a.y - b.y);
    ents.forEach(o => o.me ? drawAki(ctx) : drawEnemy(ctx, o.e));
    drawKuro(ctx);
    shots.forEach(s => drawShot(ctx, s));
    fx.forEach(f => drawFx(ctx, f));
    parts.forEach(q => { ctx.globalAlpha = clamp(q.life / q.max, 0, 1); ctx.fillStyle = q.col; ctx.fillRect(q.x | 0, q.y | 0, q.sz, q.sz); }); ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    nums.forEach(n => { ctx.globalAlpha = clamp(n.t * 2, 0, 1); ctx.font = `800 ${n.crit ? 22 : 16}px ${FONT}`; ctx.lineWidth = 4; ctx.strokeStyle = OUT; const tx = n.v ? n.v + (n.crit ? '!' : '') : '+½'; ctx.strokeText(tx, n.x, n.y); ctx.fillStyle = n.v ? (n.crit ? PAL.q : PAL.g) : PAL.m; ctx.fillText(tx, n.x, n.y); }); ctx.globalAlpha = 1;
    ctx.restore();
    // ambiente en pantalla
    petals.forEach(q => { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a); ctx.fillStyle = q.c; ctx.globalAlpha = .55; ctx.fillRect(-3, -1.5, 6, 3); ctx.restore(); }); ctx.globalAlpha = 1;
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .85); vg.addColorStop(0, 'rgba(15,20,23,0)'); vg.addColorStop(1, p.hurtT > 0 ? 'rgba(96,69,244,.55)' : 'rgba(39,28,87,.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (p.awk > 0) { ctx.strokeStyle = `rgba(83,230,212,${.25 + Math.sin(time * 10) * .1})`; ctx.lineWidth = 10; ctx.strokeRect(5, 5, W - 10, H - 10); }
    if (fx.some(f => f.k === 'lines')) speedLines(ctx, .5);
    drawHUD(ctx);
    if (touchUI && !choice && !dead && !won) drawTouch(ctx);
    if (banner) drawBanner(ctx);
    if (choice) drawChoice(ctx);
    if (cut) drawCut(ctx);
    if (trans) { ctx.fillStyle = `rgba(15,20,23,${1 - Math.abs(trans.t - .3) / .3})`; ctx.fillRect(0, 0, W, H); }
    if (dead) drawEnd(ctx, 'Los Ecos te alcanzaron', dead);
    if (won) drawEnd(ctx, 'La isla recupera su luz', won);
    ctx.restore();
  };
  function drawStory(ctx) {
    const s = STORY[Math.min(story.i, STORY.length - 1)], k = Math.min(1, story.t * 2);
    ctx.fillStyle = PAL.k; ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, 'rgba(96,69,244,.35)'); g.addColorStop(1, 'rgba(83,230,212,.08)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = k; const img = s.s === 'akiBig' ? SP.akiBig : SP.big.ronin; spr(ctx, img, W * .72 + (1 - k) * 40, H - 30, s.s !== 'akiBig', s.s !== 'akiBig');
    ctx.textAlign = 'left'; ctx.fillStyle = PAL.m; ctx.font = `800 13px ${FONT}`; ctx.fillText(`SHINRAI · ${story.i + 1}/3`, 60, 120);
    ctx.fillStyle = PAL.g; ctx.font = `800 34px ${FONT}`; wrap(ctx, s.t, 60, 180, 480, 44);
    ctx.globalAlpha = .6; ctx.font = `600 13px ${FONT}`; ctx.fillText('Toca o pulsa una tecla para seguir · Enter para saltar', 60, H - 40); ctx.globalAlpha = 1;
  }
  function wrap(ctx, t, x, y, mw, lh) { let line = ''; t.split(' ').forEach(w => { if (ctx.measureText(line + w).width > mw && line) { ctx.fillText(line, x, y); y += lh; line = ''; } line += w + ' '; }); ctx.fillText(line, x, y); }
  function drawDoors(ctx) {
    for (const s in cur.doors) {
      const d = DOORS[s](), hz = s === 'n' || s === 's', open = !cur.locked;
      ctx.fillStyle = open ? '#0a0d10' : PAL.o;
      if (hz) ctx.fillRect(d.x - 56, s === 'n' ? d.y - 40 : d.y - 2, 112, 44); else ctx.fillRect(s === 'w' ? d.x - 44 : d.x - 2, d.y - 56, 46, 112);
      if (!open) { ctx.strokeStyle = PAL.m; ctx.lineWidth = 2; ctx.globalAlpha = .6 + Math.sin(time * 6) * .3; ctx.beginPath(); ctx.arc(d.x + (hz ? 0 : s === 'w' ? -20 : 20), d.y + (hz ? (s === 'n' ? -18 : 20) : 0), 14, 0, TAU); ctx.moveTo(d.x - 8 + (hz ? 0 : s === 'w' ? -20 : 20), d.y + (hz ? (s === 'n' ? -18 : 20) : 0)); ctx.lineTo(d.x + 8 + (hz ? 0 : s === 'w' ? -20 : 20), d.y + (hz ? (s === 'n' ? -18 : 20) : 0)); ctx.stroke(); ctx.globalAlpha = 1; }
      else { ctx.fillStyle = 'rgba(83,230,212,.25)'; if (hz) ctx.fillRect(d.x - 56, s === 'n' ? d.y - 3 : d.y - 2, 112, 3); else ctx.fillRect(d.x - 2, d.y - 56, 3, 112); }
    }
  }
  function drawLamps(ctx) {
    [[BX0 + 34, BY0 + 30], [BX1 - 34, BY0 + 30], [BX0 + 34, BY1 - 10], [BX1 - 34, BY1 - 10]].forEach(([x, y], i) => {
      const fl = .55 + Math.sin(time * 7 + i * 2) * .1 + Math.random() * .06, g = ctx.createRadialGradient(x, y - 14, 4, x, y - 14, 90);
      g.addColorStop(0, `rgba(143,123,255,${fl * .45})`); g.addColorStop(1, 'rgba(143,123,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - 90, y - 104, 180, 180); spr(ctx, SP.lamp, x, y);
    });
  }
  function drawShrine(ctx) {
    const x = RW / 2, y = (BY0 + BY1) / 2; ctx.fillStyle = cur.used ? PAL.K : PAL.P; ctx.fillRect(x - 40, y - 10, 80, 20); ctx.fillStyle = PAL.k; ctx.fillRect(x - 46, y - 64, 8, 60); ctx.fillRect(x + 38, y - 64, 8, 60); ctx.fillStyle = cur.used ? PAL.h : PAL.m; ctx.fillRect(x - 56, y - 72, 112, 8); ctx.fillRect(x - 48, y - 58, 96, 5);
    if (!cur.used) { ctx.globalAlpha = .4 + Math.sin(time * 3) * .2; ctx.fillStyle = PAL.m; ctx.beginPath(); ctx.arc(x, y - 30, 12, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; if (Math.hypot(p.x - x, p.y - y) < 80) { ctx.fillStyle = PAL.g; ctx.font = `800 13px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(touchUI ? 'KATANA: orar' : 'J: orar', x, y - 86); } }
  }
  function drawHazards(ctx) {
    hazards.forEach(h => {
      const warn = h.warn > 0, al = warn ? .18 + (Math.sin(time * 30) + 1) * .08 : .75;
      ctx.fillStyle = warn ? `rgba(143,123,255,${al})` : `rgba(83,230,212,${al})`; ctx.strokeStyle = warn ? PAL.q : PAL.n; ctx.lineWidth = 2;
      if (h.k === 'ring') { if (h.r > 0) { ctx.strokeStyle = PAL.q; ctx.lineWidth = h.w; ctx.globalAlpha = .55; ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * .8, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; ctx.lineWidth = 2; ctx.strokeStyle = PAL.n; ctx.stroke(); } return; }
      if (h.k === 'circle') { ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * .8, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
      if (h.k === 'line') { ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = warn ? 3 : h.w; ctx.strokeStyle = warn ? `rgba(143,123,255,${.4 + al})` : PAL.n; if (warn && h.owner) { ctx.lineWidth = h.w; ctx.strokeStyle = `rgba(143,123,255,${al})`; } ctx.beginPath(); ctx.moveTo(h.x1, h.y1); ctx.lineTo(h.x2, h.y2); ctx.stroke(); ctx.restore(); }
      if (h.k === 'cone') { ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.arc(h.x, h.y, h.r, h.a - h.arc / 2, h.a + h.arc / 2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    });
  }
  function shadow(ctx, x, y, r) { ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(x, y, r, r * .35, 0, 0, TAU); ctx.fill(); }
  function drawAki(ctx) {
    const A = p.awk > 0, pre = A ? 'akiA_' : 'aki_';
    shadow(ctx, p.x, p.y, 18);
    if (A) { const g = ctx.createRadialGradient(p.x, p.y - 26, 4, p.x, p.y - 26, 60); g.addColorStop(0, 'rgba(83,230,212,.35)'); g.addColorStop(1, 'rgba(83,230,212,0)'); ctx.fillStyle = g; ctx.fillRect(p.x - 60, p.y - 86, 120, 120); }
    if (p.leaves > 0) for (let i = 0; i < 10; i++) { const a = time * 7 + i / 10 * TAU, r = 95 + Math.sin(time * 5 + i) * 18; spr(ctx, SP.leaf, p.x + Math.cos(a) * r, p.y - 20 + Math.sin(a) * r * .55, i % 2); }
    // bufanda (detrás)
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [[9, OUT], [6, A ? PAL.n : PAL.m]].forEach(([w, c]) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(scarf[0].x, scarf[0].y); scarf.forEach(s => ctx.lineTo(s.x, s.y)); ctx.stroke(); });
    if (p.inv > 0 && p.dashT <= 0 && p.techT <= 0 && Math.floor(time * 20) % 2) ctx.globalAlpha = .45;
    let img;
    if (p.hurtT > 0) img = SP.aki_hurt[Math.floor(time * 20) % 2];
    else if (p.atkT > 0) img = SP[pre + 'atk'][p.combo === p.comboMax - 1 ? 2 : p.combo % 2];
    else if (p.moving) img = SP[pre + 'walk'][Math.floor(p.walk) % 4];
    else img = SP[pre + 'idle'][Math.floor(time * 2) % 2];
    spr(ctx, img, p.x, p.y + 2, p.face < 0); ctx.globalAlpha = 1;
    // katana
    const sw = p.atkT > 0 ? p.aim + (p.combo % 2 ? -1 : 1) * (p.atkT / .2 - .5) * 1.6 : (p.face > 0 ? -.7 : Math.PI + .7);
    const hx = p.x + p.face * 12, hy = p.y - 22, L = 34;
    ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + Math.cos(sw) * L, hy + Math.sin(sw) * L); ctx.stroke();
    ctx.strokeStyle = A ? PAL.n : PAL.g; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = PAL.P; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + Math.cos(sw) * 8, hy + Math.sin(sw) * 8); ctx.stroke();
  }
  function drawKuro(ctx) {
    spr(ctx, SP.kuro, kuro.x, kuro.y + Math.sin(kuro.t * 12) * 1.5, kuro.x > p.x);
    if (warnAny) { ctx.fillStyle = PAL.m; ctx.font = `900 18px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('!', kuro.x, kuro.y - 24 + Math.sin(time * 14) * 2); }
  }
  function drawEnemy(ctx, e) {
    const isB = e.boss, key = e.type;
    if (e.spawn > 0) { const k = clamp(1 - e.spawn / .6, 0, 1); ctx.strokeStyle = PAL.q; ctx.lineWidth = 2; ctx.globalAlpha = .8; ctx.beginPath(); ctx.ellipse(e.x, e.y, 26 * k + 4, 9 * k + 2, 0, 0, TAU); ctx.stroke(); for (let i = 0; i < 3; i++) { ctx.fillStyle = i % 2 ? PAL.m : PAL.q; ctx.fillRect(e.x + rnd(-16, 16), e.y - rnd(0, 40) * k, rnd(4, 14), 2); } ctx.globalAlpha = 1; return; }
    shadow(ctx, e.x, e.y, e.r * (isB ? 1.1 : 1));
    if (e.type === 'lantern') { const g = ctx.createRadialGradient(e.x, e.y - 20, 2, e.x, e.y - 20, 50); g.addColorStop(0, 'rgba(143,123,255,.35)'); g.addColorStop(1, 'rgba(143,123,255,0)'); ctx.fillStyle = g; ctx.fillRect(e.x - 50, e.y - 70, 100, 100); }
    const bob = e.type === 'lantern' || e.type === 'weaver' ? Math.sin(e.t * 4) * 4 - 10 : (e.st === 'move' || e.st === 'idle') ? -Math.abs(Math.sin(e.t * 9)) * 3 : 0;
    const warnS = (e.st === 'warn' || e.st === 'cwarn' || e.st === 'swarn') ? Math.sin(time * 40) * 2 : 0;
    spr(ctx, e.flash > 0 ? SP[key + '_w'] : SP[key], e.x + warnS, e.y + bob, e.face < 0, !isB || e.phase === 2);
    if (e.st === 'warn' || e.st === 'tele') { ctx.fillStyle = PAL.q; ctx.font = `900 20px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('!', e.x, e.y - (isB ? 110 : 52)); }
    if (e.type === 'archer' && e.st === 'warn') { ctx.strokeStyle = 'rgba(143,123,255,.5)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(e.x, e.y - 22); ctx.lineTo(e.x + Math.cos(e.aa) * 300, e.y - 22 + Math.sin(e.aa) * 300); ctx.stroke(); ctx.setLineDash([]); }
    if (e.st === 'tele') { ctx.fillStyle = 'rgba(61,42,168,.5)'; ctx.beginPath(); ctx.ellipse(e.tx, e.ty, 20, 7, 0, 0, TAU); ctx.fill(); }
    if (e.guard) { ctx.strokeStyle = 'rgba(235,235,237,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, e.y - 18, 28, e.fa - .9, e.fa + .9); ctx.stroke(); }
    if (!isB && e.hp < e.max) { ctx.fillStyle = OUT; ctx.fillRect(e.x - 16, e.y + 6, 32, 4); ctx.fillStyle = PAL.q; ctx.fillRect(e.x - 16, e.y + 6, 32 * e.hp / e.max, 4); }
  }
  function drawShot(ctx, s) {
    if (s.delay > 0) return; const a = Math.atan2(s.vy, s.vx);
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(a);
    if (s.k === 'kunai' || s.k === 'feather') { ctx.fillStyle = OUT; ctx.fillRect(-11, -3, 22, 6); ctx.fillStyle = s.k === 'kunai' ? PAL.g : PAL.k; ctx.fillRect(-9, -1.5, 14, 3); ctx.fillStyle = PAL.m; ctx.fillRect(5, -2, 5, 4); }
    else if (s.k === 'arrow') { ctx.fillStyle = OUT; ctx.fillRect(-12, -2.5, 24, 5); ctx.fillStyle = PAL.q; ctx.fillRect(-10, -1, 18, 2); ctx.fillStyle = PAL.Q; ctx.fillRect(6, -2, 5, 4); }
    else if (s.k === 'orb') { ctx.fillStyle = 'rgba(143,123,255,.35)'; ctx.beginPath(); ctx.arc(0, 0, s.r + 5, 0, TAU); ctx.fill(); ctx.fillStyle = PAL.q; ctx.beginPath(); ctx.arc(0, 0, s.r, 0, TAU); ctx.fill(); ctx.fillStyle = PAL.Q; ctx.fillRect(-2, -4, 4, 4); }
    else if (s.k === 'crow') { ctx.rotate(-a); spr(ctx, SP.kuro, 0, 8, s.vx < 0); }
    else if (s.k === 'wave') { ctx.strokeStyle = PAL.n; ctx.lineWidth = 5; ctx.globalAlpha = s.life / .55; ctx.beginPath(); ctx.arc(-10, 0, 28, -1, 1); ctx.stroke(); }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  function drawFx(ctx, f) {
    const k = f.t / f.d;
    if (f.k === 'slash' || f.k === 'eslash') {
      const dir = f.flip ? -1 : 1, a0 = f.a - 1.15 * dir, a1 = a0 + 2.3 * dir * Math.min(1, k * 2.2);
      ctx.save(); ctx.globalAlpha = 1 - k; ctx.lineCap = 'round';
      ctx.strokeStyle = f.k === 'slash' ? (p.awk > 0 ? PAL.n : PAL.m) : PAL.q; ctx.lineWidth = f.fin || f.big ? 14 : 9;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r * .82, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke();
      ctx.strokeStyle = PAL.w; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * .82, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke(); ctx.restore();
    }
    if (f.k === 'ghost') { ctx.globalAlpha = .35 * (1 - k); spr(ctx, (p.awk > 0 ? SP.akiA_idle : SP.aki_idle)[0], f.x, f.y + 2, f.f < 0); ctx.globalAlpha = 1; }
  }
  function speedLines(ctx, al) { ctx.strokeStyle = `rgba(235,235,237,${al})`; ctx.lineWidth = 2; for (let i = 0; i < 26; i++) { const a = rnd(0, TAU), r0 = rnd(220, 320); ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0); ctx.lineTo(W / 2 + Math.cos(a) * 700, H / 2 + Math.sin(a) * 700); ctx.stroke(); } }
  function drawHUD(ctx) {
    for (let i = 0; i < p.maxHp; i++) { const full = p.hp >= i + 1, half = !full && p.hp > i; ctx.globalAlpha = 1; spr(ctx, full || half ? SP.leaf : SP.leafOff, 30 + i * 24, 42); if (half) { ctx.fillStyle = PAL.k; ctx.globalAlpha = .7; ctx.fillRect(30 + i * 24, 22, 12, 22); ctx.globalAlpha = 1; } }
    const kx = 20, ky = 54; ctx.fillStyle = OUT; ctx.fillRect(kx, ky, 184, 12); const kg = ctx.createLinearGradient(kx, 0, kx + 184, 0); kg.addColorStop(0, PAL.p); kg.addColorStop(1, PAL.m); ctx.fillStyle = kg; ctx.fillRect(kx + 2, ky + 2, 180 * p.ki / 100, 8);
    if (p.ki >= 100) { ctx.strokeStyle = PAL.n; ctx.lineWidth = 2; ctx.globalAlpha = .6 + Math.sin(time * 10) * .4; ctx.strokeRect(kx - 1, ky - 1, 186, 14); ctx.globalAlpha = 1; }
    ctx.textAlign = 'left'; ctx.font = `800 11px ${FONT}`; ctx.fillStyle = PAL.g;
    ctx.fillText(`KI · ${TECHS[p.tech].t.toUpperCase()}${p.chain >= 3 ? ' · DESPERTAR LISTO' : ''}`, kx, ky + 26);
    ctx.fillStyle = PAL.G; ctx.fillText(`KUNAI ${p.kunai}/${p.kMax}   ·   MONEDAS ${p.coins}   ·   ${'◆'.repeat(p.chain)}${'◇'.repeat(Math.max(0, 3 - p.chain))}`, kx, ky + 42);
    if (muted) { ctx.fillStyle = PAL.h; ctx.fillText('SONIDO APAGADO (U)', kx, ky + 58); }
    // minimapa
    const cs = 16, ox = W - 20 - 4 * (cs + 4), oy = 18;
    ctx.fillStyle = 'rgba(15,20,23,.7)'; ctx.fillRect(ox - 8, oy - 8, 4 * (cs + 4) + 12, 4 * (cs + 4) + 12);
    rooms.forEach(r => { const vis = r.seen || Object.values(r.doors).some(n => n.seen); if (!vis) return; ctx.fillStyle = r === cur ? PAL.m : r.seen ? (r.cleared ? PAL.P : PAL.o) : PAL.K; ctx.fillRect(ox + r.gx * (cs + 4), oy + r.gy * (cs + 4), cs, cs); if (r.type === 'boss') { ctx.fillStyle = PAL.q; ctx.fillRect(ox + r.gx * (cs + 4) + 5, oy + r.gy * (cs + 4) + 5, 6, 6); } if (r.type === 'shrine') { ctx.fillStyle = PAL.n; ctx.fillRect(ox + r.gx * (cs + 4) + 6, oy + r.gy * (cs + 4) + 4, 4, 8); } });
    ctx.textAlign = 'right'; ctx.fillStyle = PAL.G; ctx.font = `700 11px ${FONT}`; ctx.fillText(`PISO ${floor + 1}/3`, W - 20, oy + 4 * (cs + 4) + 18);
    // jefe
    const bs = enemies.filter(e => e.boss); if (bs.length) { const hp = bs.reduce((s, e) => s + Math.max(0, e.hp), 0), mx = bs[0].type === 'armor' ? bs.reduce((s, e) => s + e.max, 0) * 2 : bs[0].max, bw = 520, bx = (W - bw) / 2, by = H - 44;
      ctx.fillStyle = OUT; ctx.fillRect(bx - 3, by - 3, bw + 6, 16); ctx.fillStyle = PAL.o; ctx.fillRect(bx, by, bw, 10); ctx.fillStyle = PAL.q; ctx.fillRect(bx, by, bw * clamp(hp / mx, 0, 1), 10); ctx.fillStyle = PAL.g; ctx.textAlign = 'center'; ctx.font = `800 13px ${FONT}`; ctx.fillText(FLOORS[floor].bn.toUpperCase() + (bs[0].phase === 2 ? ' · FASE 2' : ''), W / 2, by - 8); }
  }
  function drawTouch(ctx) {
    if (stickPtr) { ctx.globalAlpha = .35; ctx.strokeStyle = PAL.g; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(stickPtr.sx, stickPtr.sy, 55, 0, TAU); ctx.stroke(); ctx.fillStyle = PAL.m; ctx.beginPath(); const dx = stickPtr.x - stickPtr.sx, dy = stickPtr.y - stickPtr.sy, l = Math.min(55, Math.hypot(dx, dy)), a = Math.atan2(dy, dx); ctx.arc(stickPtr.sx + Math.cos(a) * l, stickPtr.sy + Math.sin(a) * l, 24, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    else { ctx.globalAlpha = .25; ctx.fillStyle = PAL.g; ctx.textAlign = 'center'; ctx.font = `700 12px ${FONT}`; ctx.fillText('arrastra aquí para moverte', 150, H - 40); ctx.globalAlpha = 1; }
    BTN.forEach(b => { const rdy = b.id === 'tech' ? p.ki >= 100 : b.id === 'dash' ? p.dashCd <= 0 : b.id === 'kunai' ? p.kunai > 0 : true; ctx.globalAlpha = rdy ? .55 : .25; ctx.fillStyle = b.id === 'atk' ? PAL.p : PAL.o; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill(); ctx.strokeStyle = b.id === 'tech' && rdy ? PAL.n : PAL.m; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1; ctx.fillStyle = PAL.g; ctx.font = `800 ${b.r > 40 ? 13 : 10}px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(b.t, b.x, b.y + 4); });
  }
  function drawBanner(ctx) {
    const k = clamp(banner.life * 2, 0, 1), y = banner.small ? 130 : 150; ctx.globalAlpha = k; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(15,20,23,.75)'; ctx.fillRect(0, y - 34, W, banner.s ? 62 : 44);
    ctx.fillStyle = PAL.m; ctx.fillRect(0, y - 34, W, 2);
    ctx.fillStyle = PAL.g; ctx.font = `800 ${banner.small ? 20 : 26}px ${FONT}`; ctx.fillText(banner.t, W / 2, y);
    if (banner.s) { ctx.fillStyle = PAL.G; ctx.font = `600 13px ${FONT}`; ctx.fillText(banner.s, W / 2, y + 20); } ctx.globalAlpha = 1;
  }
  function drawChoice(ctx) {
    ctx.fillStyle = 'rgba(15,20,23,.82)'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.fillStyle = PAL.g; ctx.font = `800 30px ${FONT}`; ctx.fillText(choice.title, W / 2, 140);
    ctx.fillStyle = PAL.G; ctx.font = `600 13px ${FONT}`; ctx.fillText(touchUI ? 'Toca una carta' : '← → y J, o 1 · 2 · 3, o clic', W / 2, 166);
    cardRects().forEach((r, i) => {
      const c = choice.cards[i], R = RARE[c.r], on = i === choice.sel, lift = on ? -8 : 0, k = clamp(choice.t * 4 - i * .4, 0, 1);
      ctx.globalAlpha = k; ctx.fillStyle = PAL.K; ctx.fillRect(r.x, r.y + lift + (1 - k) * 30, r.w, r.h);
      ctx.strokeStyle = R.c; ctx.lineWidth = on ? 4 : 2; ctx.strokeRect(r.x, r.y + lift + (1 - k) * 30, r.w, r.h);
      if (c.r === 2) { ctx.fillStyle = 'rgba(96,69,244,.18)'; ctx.fillRect(r.x, r.y + lift, r.w, r.h); }
      const y = r.y + lift + (1 - k) * 30; ctx.fillStyle = R.c; ctx.font = `800 11px ${FONT}`; ctx.fillText(R.n, r.x + r.w / 2, y + 30);
      spr(ctx, SP.leaf, r.x + r.w / 2, y + 84); ctx.fillStyle = PAL.g; ctx.font = `800 19px ${FONT}`; wrapC(ctx, c.t, r.x + r.w / 2, y + 120, r.w - 30, 23);
      ctx.fillStyle = PAL.G; ctx.font = `600 13px ${FONT}`; wrapC(ctx, c.d, r.x + r.w / 2, y + 178, r.w - 34, 18);
      if (!touchUI) { ctx.fillStyle = PAL.h; ctx.font = `800 12px ${FONT}`; ctx.fillText(String(i + 1), r.x + r.w / 2, y + r.h - 14); }
    }); ctx.globalAlpha = 1;
  }
  function wrapC(ctx, t, x, y, mw, lh) { let line = '', lines = []; t.split(' ').forEach(w => { if (ctx.measureText(line + w).width > mw && line) { lines.push(line); line = ''; } line += w + ' '; }); lines.push(line); lines.forEach((l, i) => ctx.fillText(l.trim(), x, y + i * lh)); }
  function drawCut(ctx) {
    const k = cut.t / cut.d, inK = clamp(cut.t * 6, 0, 1), outK = clamp((cut.d - cut.t) * 6, 0, 1), al = Math.min(inK, outK);
    ctx.fillStyle = `rgba(15,20,23,${.6 * al})`; ctx.fillRect(0, 0, W, H);
    speedLines(ctx, .35 * al);
    ctx.save(); ctx.globalAlpha = al; ctx.beginPath(); ctx.moveTo(0, 170); ctx.lineTo(W, 110); ctx.lineTo(W, 430); ctx.lineTo(0, 490); ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, cut.kind === 'awaken' ? PAL.P : PAL.o); g.addColorStop(1, cut.kind === 'awaken' ? PAL.M : PAL.P); ctx.fillStyle = g; ctx.fill(); ctx.clip();
    for (let i = 0; i < 18; i++) { ctx.fillStyle = 'rgba(235,235,237,.12)'; ctx.fillRect(((i * 97 + cut.t * 2400) % (W + 200)) - 200, 120 + i * 20, 160, 3); }
    const off = (1 - inK) * 300 - k * 40;
    if (cut.kind === 'awaken') { const img = SP.akiBigA; ctx.drawImage(img, 0, 0, img.width, img.height * .62, W * .52 + off, 92, img.width * 1.15, img.height * .62 * 1.15); }
    else { const img = SP.big[cut.spr]; ctx.drawImage(img, W * .56 + off, 140, img.width * .9, img.height * .9); }
    ctx.restore();
    ctx.globalAlpha = al; ctx.textAlign = 'left'; ctx.lineWidth = 8; ctx.strokeStyle = OUT; ctx.font = `900 ${cut.kind === 'awaken' ? 86 : 56}px ${FONT}`;
    const T = cut.kind === 'awaken' ? 'DESPERTAR' : cut.name.toUpperCase(), tx = 60 - off * .5;
    ctx.strokeText(T, tx, 330); ctx.fillStyle = cut.kind === 'awaken' ? PAL.n : PAL.g; ctx.fillText(T, tx, 330);
    ctx.font = `800 16px ${FONT}`; ctx.fillStyle = PAL.g; ctx.fillText(cut.kind === 'awaken' ? 'El viento del clan despierta en Aki' : 'Guardián del piso ' + (floor + 1) + ' · corrompido por la Estática', tx, 366);
    ctx.globalAlpha = 1;
  }
  function drawEnd(ctx, t, k) {
    const a = clamp(k, 0, 1); ctx.fillStyle = `rgba(15,20,23,${.85 * a})`; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = a; ctx.textAlign = 'center';
    ctx.fillStyle = won ? PAL.m : PAL.q; ctx.font = `900 46px ${FONT}`; ctx.fillText(t, W / 2, 230);
    ctx.fillStyle = PAL.g; ctx.font = `700 16px ${FONT}`;
    [`Piso ${floor + 1} · ${roomsDone} salas purificadas`, `${kills} Ecos derrotados · ${blessCount} bendiciones`, `Puntaje ${Math.floor(G.score)}`].forEach((l, i) => ctx.fillText(l, W / 2, 285 + i * 28));
    ctx.globalAlpha = 1;
  }

  if (/shinraidebug/.test(location.search)) window.__sh = { G, p, go: t => { const r = rooms.find(x => x.type === t); if (r) enter(r, null); }, floor: n => { floor = n; genFloor(); }, bless: offerBless, awaken: () => { cut = { kind: 'awaken', t: 0, d: 1 }; }, get enemies() { return enemies; } };
  G.hud = () => story ? 'Historia' : `Piso ${floor + 1} · ${FLOORS[floor].n}`;
  return G;
}

window.OG_SHINRAI = { id: 'shinrai', t: 'SHINRAI: Ecos del Clan', k: 'RPG de acción · Anime', d: 'Aki y su cuervo Kuro bajan al Santuario Hundido. Salas, bendiciones, técnicas con cut-in y tres jefes con dos fases.', c: 'WASD mover · J katana · K dash · I kunai · L técnica · U sonido', make: shinrai, featured: true };
})();
