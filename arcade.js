/* Overgame · Web demos: 5 minijuegos originales en canvas (solo la paleta de la marca) */
(() => {
'use strict';
const C = { purple:'#6045F4', mint:'#53E6D4', gray:'#EBEBED', black:'#0F1417' };
const W = 960, H = 600;
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dirKey = k => (k.ArrowRight || k.d ? 1 : 0) - (k.ArrowLeft || k.a ? 1 : 0);

function bg(ctx, t, speed = 0) {
  ctx.shadowBlur = 0; ctx.fillStyle = C.black; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(96,69,244,.17)'; ctx.lineWidth = 1;
  const off = (t * speed) % 40;
  for (let y = off; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
}
function neon(ctx, c, b = 18) { ctx.shadowColor = c; ctx.shadowBlur = b; ctx.fillStyle = c; ctx.strokeStyle = c; }
function burst(parts, x, y, n = 14, c = C.mint) { for (let i = 0; i < n; i++) parts.push({ x, y, vx: rnd(-180, 180), vy: rnd(-180, 180), l: 1, c }); }
function particles(ctx, parts, dt) {
  for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.x += q.vx * dt; q.y += q.vy * dt; q.l -= dt * 1.6; if (q.l <= 0) parts.splice(i, 1); }
  ctx.shadowBlur = 8;
  parts.forEach(q => { ctx.globalAlpha = q.l; ctx.fillStyle = q.c; ctx.shadowColor = q.c; ctx.fillRect(q.x, q.y, 3, 3); });
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}

/* 1 · Neon Drift — esquivar */
function drift() {
  const p = { x: W / 2, y: H - 70, w: 46 }; let blocks = [], orbs = [], parts = [], t = 0, speed = 260;
  const g = { score: 0, over: false };
  g.update = (dt, inp) => {
    t += dt; speed += dt * 9; g.score += dt * 10;
    const d = dirKey(inp.keys);
    if (d) p.x += d * 540 * dt; else if (inp.px != null) p.x += (inp.px - p.x) * Math.min(1, dt * 14);
    p.x = clamp(p.x, p.w / 2, W - p.w / 2);
    if (Math.random() < .045 + t / 5000) blocks.push({ x: rnd(20, W - 140), y: -30, w: rnd(50, 160), h: 18 });
    if (Math.random() < .016) orbs.push({ x: rnd(30, W - 30), y: -20, r: 10 });
    blocks.forEach(b => b.y += speed * dt); orbs.forEach(o => o.y += speed * .85 * dt);
    blocks = blocks.filter(b => b.y < H + 30);
    orbs = orbs.filter(o => { if (Math.hypot(o.x - p.x, o.y - p.y) < o.r + 22) { g.score += 50; burst(parts, o.x, o.y); return false; } return o.y < H + 20; });
    if (blocks.some(b => p.x + p.w / 2 - 8 > b.x && p.x - p.w / 2 + 8 < b.x + b.w && p.y + 12 > b.y && p.y - 18 < b.y + b.h)) { burst(parts, p.x, p.y, 30, C.purple); g.over = true; }
  };
  g.draw = (ctx, dt) => {
    bg(ctx, t, speed * .1);
    neon(ctx, C.purple); blocks.forEach(b => { ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 6); ctx.fill(); });
    neon(ctx, C.mint); orbs.forEach(o => { ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, 7); ctx.fill(); });
    ctx.beginPath(); ctx.moveTo(p.x, p.y - 22); ctx.lineTo(p.x + p.w / 2, p.y + 16); ctx.lineTo(p.x - p.w / 2, p.y + 16); ctx.closePath(); ctx.fill();
    particles(ctx, parts, dt);
  };
  return g;
}

/* 2 · Pulse Serpent — crecer sin chocar */
function serpent() {
  const N = 40, CX = W / N, CY = H / N;
  let s = [{ x: 8, y: 7 }, { x: 7, y: 7 }, { x: 6, y: 7 }], dir = { x: 1, y: 0 }, queue = [], acc = 0, step = .12, parts = [], t = 0;
  const free = () => { let f; do f = { x: Math.floor(rnd(0, CX)), y: Math.floor(rnd(0, CY)) }; while (s.some(q => q.x === f.x && q.y === f.y)); return f; };
  let food = free();
  const D = { ArrowUp:[0,-1], w:[0,-1], up:[0,-1], ArrowDown:[0,1], s:[0,1], down:[0,1], ArrowLeft:[-1,0], a:[-1,0], left:[-1,0], ArrowRight:[1,0], d:[1,0], right:[1,0] };
  const g = { score: 0, over: false, hud: () => `LARGO ${s.length}` };
  const push = v => { const last = queue.at(-1) || [dir.x, dir.y]; if (v && !(v[0] === -last[0] && v[1] === -last[1]) && !(v[0] === last[0] && v[1] === last[1]) && queue.length < 3) queue.push(v); };
  g.update = (dt, inp) => {
    t += dt;
    inp.keyQ.forEach(k => push(D[k])); inp.swipes.forEach(k => push(D[k]));
    inp.taps.forEach(tp => { const hx = s[0].x * N + N / 2, hy = s[0].y * N + N / 2, last = queue.at(-1) || [dir.x, dir.y];
      push(last[0] !== 0 ? [0, tp.y < hy ? -1 : 1] : [tp.x < hx ? -1 : 1, 0]); });
    acc += dt; if (acc < step) return; acc = 0;
    if (queue.length) { const v = queue.shift(); dir = { x: v[0], y: v[1] }; }
    const h = { x: s[0].x + dir.x, y: s[0].y + dir.y };
    if (h.x < 0 || h.y < 0 || h.x >= CX || h.y >= CY || s.some(q => q.x === h.x && q.y === h.y)) { burst(parts, s[0].x * N + 20, s[0].y * N + 20, 30, C.purple); g.over = true; return; }
    s.unshift(h);
    if (h.x === food.x && h.y === food.y) { g.score += 10; step = Math.max(.055, step - .003); burst(parts, h.x * N + 20, h.y * N + 20); food = free(); } else s.pop();
  };
  g.draw = (ctx, dt) => {
    bg(ctx, 0);
    const pulse = 9 + Math.sin(t * 6) * 2.5;
    neon(ctx, C.mint, 26); ctx.beginPath(); ctx.arc(food.x * N + N / 2, food.y * N + N / 2, pulse, 0, 7); ctx.fill();
    s.forEach((q, i) => {
      neon(ctx, i ? C.purple : C.mint, i ? 14 : 22);
      ctx.globalAlpha = i ? Math.max(.45, 1 - i / (s.length + 6)) : 1;
      ctx.beginPath(); ctx.roundRect(q.x * N + 3, q.y * N + 3, N - 6, N - 6, 9); ctx.fill();
    });
    ctx.globalAlpha = 1;
    particles(ctx, parts, dt);
  };
  return g;
}

/* 3 · Prism Break — rompebloques */
function prism() {
  const pad = { x: W / 2, w: 140, y: H - 40 }; let ball, bricks = [], lives = 3, level = 1, parts = [], t = 0;
  const g = { score: 0, over: false, hud: () => `VIDAS ${'◆'.repeat(lives)} · NIVEL ${level}` };
  const build = () => { bricks = []; const cols = 10, rows = 3 + Math.min(level, 3), bw = (W - 80) / cols;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) bricks.push({ x: 40 + c * bw + 3, y: 64 + r * 30, w: bw - 6, h: 22, c: [C.purple, C.mint, C.gray][r % 3] }); };
  const reset = () => { ball = { x: pad.x, y: pad.y - 16, vx: 0, vy: 0, r: 9, stuck: true }; };
  build(); reset();
  g.update = (dt, inp) => {
    t += dt;
    const d = dirKey(inp.keys);
    if (d) pad.x += d * 760 * dt; else if (inp.px != null) pad.x += (inp.px - pad.x) * Math.min(1, dt * 20);
    pad.x = clamp(pad.x, pad.w / 2, W - pad.w / 2);
    if (ball.stuck) {
      ball.x = pad.x; ball.y = pad.y - 16;
      if (inp.taps.length || inp.keyQ.includes(' ') || inp.keyQ.includes('ArrowUp')) { const sp = 400 + level * 35, a = rnd(-.45, .45); ball.vx = Math.sin(a) * sp; ball.vy = -Math.cos(a) * sp; ball.stuck = false; }
      return;
    }
    for (let k = 0; k < 3; k++) {
      const st = dt / 3; ball.x += ball.vx * st; ball.y += ball.vy * st;
      if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
      if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); }
      if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); }
      if (ball.vy > 0 && ball.y + ball.r >= pad.y - 8 && ball.y < pad.y + 10 && Math.abs(ball.x - pad.x) < pad.w / 2 + ball.r) {
        const sp = Math.hypot(ball.vx, ball.vy) * 1.01, a = clamp((ball.x - pad.x) / (pad.w / 2), -1, 1) * 1.05;
        ball.vx = Math.sin(a) * sp; ball.vy = -Math.abs(Math.cos(a) * sp); burst(parts, ball.x, pad.y - 8, 6, C.purple);
      }
      for (let i = 0; i < bricks.length; i++) {
        const b = bricks[i], nx = clamp(ball.x, b.x, b.x + b.w), ny = clamp(ball.y, b.y, b.y + b.h);
        if ((ball.x - nx) ** 2 + (ball.y - ny) ** 2 > ball.r ** 2) continue;
        const ox = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r)), oy = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.r));
        if (ox < oy) ball.vx *= -1; else ball.vy *= -1;
        bricks.splice(i, 1); g.score += 10; burst(parts, b.x + b.w / 2, b.y + b.h / 2, 12, b.c); break;
      }
    }
    if (ball.y > H + 20) { lives--; if (lives <= 0) g.over = true; else reset(); }
    if (!bricks.length) { level++; g.score += 100; build(); reset(); }
  };
  g.draw = (ctx, dt) => {
    bg(ctx, 0);
    bricks.forEach(b => { neon(ctx, b.c, 12); ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 5); ctx.fill(); });
    neon(ctx, C.mint, 22); ctx.beginPath(); ctx.roundRect(pad.x - pad.w / 2, pad.y - 7, pad.w, 14, 7); ctx.fill();
    neon(ctx, C.gray, 24); ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
    if (ball.stuck) { ctx.fillStyle = 'rgba(235,235,237,.6)'; ctx.font = '700 15px "JetBrains Mono",monospace'; ctx.textAlign = 'center'; ctx.fillText('CLIC O ESPACIO PARA LANZAR', W / 2, H / 2 + 60); }
    particles(ctx, parts, dt);
  };
  return g;
}

/* 4 · Orbit Shift — un botón, dos órbitas */
function orbit() {
  const cx = W / 2, cy = H / 2 + 6, R = [120, 205], pa = -Math.PI / 2;
  let lane = 1, lr = R[1], obs = [], t = 0, sp = 1.15, spawn = .6, parts = [], trail = [];
  const g = { score: 0, over: false, hud: () => `ÓRBITA ${lane ? 'EXTERNA' : 'INTERNA'}` };
  g.update = (dt, inp) => {
    t += dt; sp += dt * .035;
    if (inp.taps.length || inp.keyQ.some(k => [' ', 'ArrowUp', 'ArrowDown', 'w', 's', 'Enter'].includes(k))) { lane ^= 1; burst(parts, cx + Math.cos(pa) * lr, cy + Math.sin(pa) * lr, 8, C.mint); }
    lr += (R[lane] - lr) * Math.min(1, dt * 18);
    spawn -= dt;
    if (spawn <= 0) { spawn = rnd(.5, .95) * 1.15 / sp; obs.push({ a: pa + Math.PI * 1.15, lane: Math.random() < .5 ? 0 : 1, len: rnd(.2, .42), done: false }); }
    obs.forEach(o => {
      o.a -= sp * dt;
      if (!o.done && o.a + o.len < pa - .1) { o.done = true; g.score += 10; }
      if (o.lane === lane && Math.abs(lr - R[o.lane]) < 30 && pa > o.a - .07 && pa < o.a + o.len + .07) { g.over = true; burst(parts, cx + Math.cos(pa) * lr, cy + Math.sin(pa) * lr, 30, C.purple); }
    });
    obs = obs.filter(o => o.a + o.len > pa - 1.2);
    trail.unshift({ x: cx + Math.cos(pa) * lr, y: cy + Math.sin(pa) * lr }); trail.length = Math.min(trail.length, 14);
  };
  g.draw = (ctx, dt) => {
    bg(ctx, t, 10);
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(235,235,237,.14)'; ctx.shadowBlur = 0;
    R.forEach(r => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke(); });
    ctx.lineCap = 'round'; ctx.lineWidth = 20;
    obs.forEach(o => { neon(ctx, C.purple, 18); ctx.beginPath(); ctx.arc(cx, cy, R[o.lane], o.a, o.a + o.len); ctx.stroke(); });
    ctx.lineCap = 'butt';
    const core = 46 + Math.sin(t * 3) * 4;
    neon(ctx, C.purple, 40); ctx.globalAlpha = .35; ctx.beginPath(); ctx.arc(cx, cy, core, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    ctx.shadowBlur = 0; ctx.fillStyle = C.gray; ctx.font = '800 34px Outfit,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(Math.floor(g.score), cx, cy); ctx.textBaseline = 'alphabetic';
    trail.forEach((q, i) => { ctx.globalAlpha = (1 - i / 14) * .5; neon(ctx, C.mint, 10); ctx.beginPath(); ctx.arc(q.x - i * 2.2, q.y, 12 - i * .6, 0, 7); ctx.fill(); });
    ctx.globalAlpha = 1; neon(ctx, C.mint, 28); ctx.beginPath(); ctx.arc(trail[0]?.x ?? cx, trail[0]?.y ?? cy - lr, 13, 0, 7); ctx.fill();
    particles(ctx, parts, dt);
  };
  return g;
}

/* 5 · Glyph Match — memoria tranquila */
function glyph() {
  const SH = ['circle', 'tri', 'square', 'diamond', 'cross', 'ring', 'star', 'hex'];
  const deck = [...SH, ...SH].sort(() => Math.random() - .5);
  const cw = 150, ch = 112, gap = 16, ox = (W - (cw * 4 + gap * 3)) / 2, oy = (H - (ch * 4 + gap * 3)) / 2 + 8;
  const cards = deck.map((s, i) => ({ s, x: ox + (i % 4) * (cw + gap), y: oy + Math.floor(i / 4) * (ch + gap), up: false, done: false, f: 0 }));
  let sel = [], lock = 0, moves = 0, t = 0, cur = 0, parts = [], finished = 0;
  const g = { score: 0, over: false, hud: () => `PARES ${cards.filter(c => c.done).length / 2}/8 · ${moves} JUGADAS · ${Math.floor(t)}s` };
  const flip = i => { const c = cards[i]; if (!c || c.up || c.done || lock > 0 || sel.length >= 2) return; c.up = true; sel.push(c);
    if (sel.length === 2) { moves++; if (sel[0].s === sel[1].s) { sel.forEach(x => { x.done = true; burst(parts, x.x + cw / 2, x.y + ch / 2, 16); }); sel = []; } else lock = .75; } };
  g.update = (dt, inp) => {
    if (!finished) t += dt;
    inp.taps.forEach(tp => { const i = cards.findIndex(c => tp.x > c.x && tp.x < c.x + cw && tp.y > c.y && tp.y < c.y + ch); if (i >= 0) { cur = i; flip(i); } });
    inp.keyQ.forEach(k => { if (k === 'ArrowRight') cur = (cur + 1) % 16; if (k === 'ArrowLeft') cur = (cur + 15) % 16; if (k === 'ArrowDown') cur = (cur + 4) % 16; if (k === 'ArrowUp') cur = (cur + 12) % 16; if (k === ' ' || k === 'Enter') flip(cur); });
    if (lock > 0) { lock -= dt; if (lock <= 0) { sel.forEach(x => x.up = false); sel = []; } }
    cards.forEach(c => c.f += ((c.up || c.done ? 1 : 0) - c.f) * Math.min(1, dt * 12));
    g.score = Math.max(0, Math.round(1200 - t * 8 - moves * 20));
    if (!finished && cards.every(c => c.done)) finished = t;
    if (finished) { g._w = (g._w || 0) + dt; if (g._w > .9) g.over = true; }
  };
  const shape = (ctx, s, x, y, r) => {
    ctx.beginPath();
    if (s === 'circle') { ctx.arc(x, y, r, 0, 7); ctx.fill(); return; }
    if (s === 'ring') { ctx.lineWidth = 7; ctx.arc(x, y, r - 4, 0, 7); ctx.stroke(); return; }
    if (s === 'square') { ctx.roundRect(x - r, y - r, r * 2, r * 2, 6); ctx.fill(); return; }
    if (s === 'cross') { ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r); ctx.stroke(); ctx.lineCap = 'butt'; return; }
    const pts = s === 'tri' ? 3 : s === 'diamond' ? 4 : s === 'hex' ? 6 : 10;
    for (let i = 0; i < pts; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / pts, rr = s === 'star' && i % 2 ? r * .45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  };
  g.draw = (ctx, dt) => {
    bg(ctx, 0);
    cards.forEach((c, i) => {
      const sx = Math.abs(Math.cos(c.f * Math.PI)), face = c.f > .5, mx = c.x + cw / 2, my = c.y + ch / 2;
      ctx.save(); ctx.translate(mx, my); ctx.scale(Math.max(.02, sx), 1); ctx.translate(-mx, -my);
      if (face) { ctx.shadowBlur = c.done ? 24 : 10; ctx.shadowColor = c.done ? C.mint : C.purple; ctx.fillStyle = C.black; ctx.strokeStyle = c.done ? C.mint : C.gray; }
      else { ctx.shadowBlur = 12; ctx.shadowColor = C.purple; ctx.fillStyle = 'rgba(96,69,244,.28)'; ctx.strokeStyle = C.purple; }
      ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(c.x, c.y, cw, ch, 14); ctx.fill(); ctx.stroke();
      if (face) { neon(ctx, c.done ? C.mint : C.gray, 16); shape(ctx, c.s, mx, my, 26); }
      else { ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(83,230,212,.5)'; ctx.font = '800 22px Outfit,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('OG', mx, my); ctx.textBaseline = 'alphabetic'; }
      ctx.restore();
      if (i === cur && document.activeElement && document.activeElement.id === 'cv') { ctx.shadowBlur = 0; ctx.strokeStyle = C.mint; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.strokeRect(c.x - 6, c.y - 6, cw + 12, ch + 12); ctx.setLineDash([]); }
    });
    particles(ctx, parts, dt);
  };
  return g;
}

/* 6 · Neon Defender — nave que dispara sola */
function defender() {
  const p = { x: W / 2, y: H - 60 }; let shots = [], foes = [], parts = [], t = 0, cd = 0, wave = 0, lives = 3, inv = 0;
  const g = { score: 0, over: false, hud: () => `VIDAS ${'◆'.repeat(lives)} · OLEADA ${wave}` };
  const spawnWave = () => { wave++; const n = 6 + wave * 2; for (let i = 0; i < n; i++) foes.push({ x: 80 + (i % 8) * 110 + rnd(-20, 20), y: -40 - Math.floor(i / 8) * 70, ph: rnd(0, 6), sp: 40 + wave * 9, hp: wave > 3 && Math.random() < .3 ? 2 : 1 }); };
  spawnWave();
  g.update = (dt, inp) => {
    t += dt; inv = Math.max(0, inv - dt);
    const d = dirKey(inp.keys);
    if (d) p.x += d * 560 * dt; else if (inp.px != null) p.x += (inp.px - p.x) * Math.min(1, dt * 14);
    p.x = clamp(p.x, 30, W - 30);
    cd -= dt; if (cd <= 0) { cd = .16; shots.push({ x: p.x, y: p.y - 24 }); }
    shots.forEach(s => s.y -= 760 * dt); shots = shots.filter(s => s.y > -20);
    foes.forEach(f => { f.y += f.sp * dt; f.x += Math.sin(t * 2 + f.ph) * 60 * dt; });
    foes = foes.filter(f => {
      const hit = shots.findIndex(s => Math.abs(s.x - f.x) < 20 && Math.abs(s.y - f.y) < 20);
      if (hit >= 0) { shots.splice(hit, 1); if (--f.hp <= 0) { g.score += 15; burst(parts, f.x, f.y, 14, f.hp < 0 ? C.mint : C.purple); return false; } }
      if (f.y > H + 30) { if (!inv) { lives--; inv = 1; } return false; }
      if (!inv && Math.abs(f.x - p.x) < 30 && Math.abs(f.y - p.y) < 26) { lives--; inv = 1.2; burst(parts, p.x, p.y, 24, C.gray); return false; }
      return true;
    });
    if (lives <= 0) g.over = true;
    if (!foes.length) { g.score += 50; spawnWave(); }
  };
  g.draw = (ctx, dt) => {
    bg(ctx, t, 60);
    neon(ctx, C.mint, 14); shots.forEach(s => ctx.fillRect(s.x - 2, s.y - 10, 4, 14));
    foes.forEach(f => { neon(ctx, f.hp > 1 ? C.gray : C.purple, 18); ctx.beginPath(); ctx.moveTo(f.x, f.y - 16); ctx.lineTo(f.x + 16, f.y); ctx.lineTo(f.x, f.y + 16); ctx.lineTo(f.x - 16, f.y); ctx.closePath(); ctx.fill(); });
    if (!inv || Math.floor(t * 12) % 2) { neon(ctx, C.mint, 24); ctx.beginPath(); ctx.moveTo(p.x, p.y - 24); ctx.lineTo(p.x + 22, p.y + 16); ctx.lineTo(p.x, p.y + 8); ctx.lineTo(p.x - 22, p.y + 16); ctx.closePath(); ctx.fill(); }
    particles(ctx, parts, dt);
  };
  return g;
}

/* 7 · Pulse Runner — corre y salta */
function runner() {
  const GY = 470; const p = { x: 190, y: GY, vy: 0, jumps: 0 }; let obs = [], parts = [], t = 0, sp = 380, next = 1.1, rot = 0;
  const g = { score: 0, over: false, hud: () => `${Math.floor(g.score / 10)} M` };
  const jump = () => { if (p.jumps < 2) { p.vy = p.jumps ? -620 : -760; p.jumps++; burst(parts, p.x, p.y, 8, C.mint); } };
  g.update = (dt, inp) => {
    t += dt; sp += dt * 12; g.score += sp * dt / 4;
    if (inp.taps.length || inp.keyQ.some(k => [' ', 'ArrowUp', 'w', 'Enter'].includes(k)) || inp.swipes.includes('up')) jump();
    p.vy += 2100 * dt; p.y += p.vy * dt; rot += dt * 7;
    if (p.y >= GY) { p.y = GY; p.vy = 0; p.jumps = 0; }
    next -= dt; if (next <= 0) { const tall = Math.random() < .35; obs.push({ x: W + 40, w: tall ? 34 : rnd(30, 70), h: tall ? rnd(80, 110) : rnd(36, 60), fly: !tall && Math.random() < .25 }); next = rnd(.75, 1.5) * 380 / sp; }
    obs.forEach(o => o.x -= sp * dt); obs = obs.filter(o => o.x > -100);
    for (const o of obs) { const top = o.fly ? GY - 130 : GY - o.h, bot = o.fly ? GY - 130 + 26 : GY;
      if (p.x + 16 > o.x && p.x - 16 < o.x + o.w && p.y > top && p.y - 32 < bot) { burst(parts, p.x, p.y - 16, 30, C.purple); g.over = true; } }
  };
  g.draw = (ctx, dt) => {
    bg(ctx, t, sp * .05);
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(83,230,212,.5)'; ctx.lineWidth = 2;
    neon(ctx, C.mint, 14); ctx.fillRect(0, GY, W, 3);
    ctx.strokeStyle = 'rgba(96,69,244,.35)'; ctx.lineWidth = 1; ctx.shadowBlur = 0;
    for (let x = -((t * sp) % 80); x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, GY + 3); ctx.lineTo(x - 60, H); ctx.stroke(); }
    obs.forEach(o => { neon(ctx, C.purple, 18); ctx.beginPath(); ctx.roundRect(o.x, o.fly ? GY - 130 : GY - o.h, o.w, o.fly ? 26 : o.h, 5); ctx.fill(); });
    ctx.save(); ctx.translate(p.x, p.y - 16); ctx.rotate(p.y < GY ? rot : 0); neon(ctx, C.mint, 26); ctx.beginPath(); ctx.roundRect(-16, -16, 32, 32, 6); ctx.fill(); ctx.restore();
    particles(ctx, parts, dt);
  };
  return g;
}

/* 8 · Beat Lanes — ritmo en 4 carriles */
let AC = null;
const beep = (f, d = .07) => { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), gn = AC.createGain(); o.type = 'triangle'; o.frequency.value = f; gn.gain.setValueAtTime(.12, AC.currentTime); gn.gain.exponentialRampToValueAtTime(.001, AC.currentTime + d); o.connect(gn).connect(AC.destination); o.start(); o.stop(AC.currentTime + d); } catch {} };
function beat() {
  const L = 4, lw = 130, ox = (W - L * lw) / 2, HY = 500, KEYS = ['d', 'f', 'j', 'k'], NOTE = [262, 330, 392, 523];
  let notes = [], parts = [], t = 0, bt = 0, combo = 0, miss = 0, flash = [0, 0, 0, 0], sp = 330, msg = '', msgT = 0;
  const g = { score: 0, over: false, hud: () => `COMBO x${combo} · FALLOS ${miss}/8` };
  const hit = l => {
    flash[l] = 1;
    const n = notes.filter(x => x.l === l && !x.done).sort((a, b) => Math.abs(a.y - HY) - Math.abs(b.y - HY))[0];
    if (n && Math.abs(n.y - HY) < 55) { const perfect = Math.abs(n.y - HY) < 24; n.done = true; combo++; g.score += (perfect ? 100 : 50) * (1 + Math.floor(combo / 10)); msg = perfect ? 'PERFECTO' : 'BIEN'; msgT = .5; beep(NOTE[l]); burst(parts, ox + l * lw + lw / 2, HY, 12, perfect ? C.mint : C.gray); }
    else { combo = 0; }
  };
  g.update = (dt, inp) => {
    t += dt; sp += dt * 2.5; msgT -= dt;
    bt -= dt; if (bt <= 0) { bt = Math.max(.24, .5 - t / 300); const l = Math.floor(rnd(0, L)); notes.push({ l, y: -20 }); if (t > 20 && Math.random() < .2) notes.push({ l: (l + 2) % L, y: -20 }); }
    inp.keyQ.forEach(k => { const i = KEYS.indexOf(k); if (i >= 0) hit(i); });
    inp.taps.forEach(tp => { const i = Math.floor((tp.x - ox) / lw); if (i >= 0 && i < L) hit(i); });
    notes.forEach(n => n.y += sp * dt);
    notes = notes.filter(n => { if (!n.done && n.y > HY + 60) { miss++; combo = 0; msg = 'FALLO'; msgT = .4; return false; } return !n.done && n.y < H + 30; });
    flash = flash.map(f => Math.max(0, f - dt * 5));
    if (miss >= 8) g.over = true;
  };
  g.draw = (ctx, dt) => {
    bg(ctx, 0);
    for (let l = 0; l < L; l++) {
      const x = ox + l * lw;
      ctx.shadowBlur = 0; ctx.fillStyle = `rgba(96,69,244,${.08 + flash[l] * .3})`; ctx.fillRect(x + 4, 0, lw - 8, H);
      neon(ctx, flash[l] > .2 ? C.mint : C.purple, 16); ctx.globalAlpha = .5 + flash[l] * .5; ctx.beginPath(); ctx.roundRect(x + 10, HY - 14, lw - 20, 28, 10); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(235,235,237,.55)'; ctx.font = '700 16px Outfit,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(KEYS[l].toUpperCase(), x + lw / 2, HY + 50);
    }
    notes.forEach(n => { neon(ctx, n.l % 2 ? C.mint : C.gray, 20); ctx.beginPath(); ctx.roundRect(ox + n.l * lw + 18, n.y - 10, lw - 36, 20, 10); ctx.fill(); });
    if (msgT > 0) { ctx.shadowBlur = 20; ctx.shadowColor = C.mint; ctx.fillStyle = msg === 'FALLO' ? C.purple : C.mint; ctx.font = '800 38px Outfit,sans-serif'; ctx.textAlign = 'center'; ctx.globalAlpha = Math.min(1, msgT * 3); ctx.fillText(msg, W / 2, 230); ctx.globalAlpha = 1; }
    particles(ctx, parts, dt);
  };
  return g;
}

const LIST = [
  ...(window.OG_RPG ? [window.OG_RPG] : []),
  { id:'drift',   t:'Neon Drift',    k:'Esquivar · Adrenalina', d:'Esquiva los bloques morados y atrapa orbes menta. Cada segundo es más rápido.', c:'← → o A D · en el celular, arrastra', make: drift },
  { id:'serpent', t:'Pulse Serpent', k:'Arcade · 20 minutos',   d:'Come pulsos de energía para crecer sin chocar con los muros ni contigo.',  c:'Flechas o WASD · en el celular, desliza', make: serpent },
  { id:'prism',   t:'Prism Break',   k:'Rompebloques · Rápido', d:'Rebota la esfera con la barra y rompe todos los prismas. Tres vidas.',      c:'Mouse o ← → · clic o espacio para lanzar', make: prism },
  { id:'orbit',   t:'Orbit Shift',   k:'Reflejos · Un botón',   d:'Salta entre dos órbitas para esquivar los arcos que giran hacia ti.',      c:'Clic, toque o espacio', make: orbit },
  { id:'defender', t:'Neon Defender', k:'Disparos · Adrenalina', d:'Tu nave dispara sola: muévete y limpia cada oleada antes de que llegue abajo.', c:'Mouse o ← → · en el celular, arrastra', make: defender },
  { id:'runner',  t:'Pulse Runner',  k:'Corredor · Reflejos',   d:'Corre sin parar y salta los bloques. Puedes hacer doble salto.',              c:'Clic, toque o espacio para saltar', make: runner },
  { id:'beat',    t:'Beat Lanes',    k:'Ritmo · Con sonido',    d:'Pulsa cada nota justo cuando cruce la línea. Ocho fallos y se acaba.',        c:'Teclas D F J K · en el celular, toca el carril', make: beat },
  { id:'glyph',   t:'Glyph Match',   k:'Memoria · Relajarme',   d:'Voltea las cartas y encuentra las 8 parejas de glifos. Sin prisa.',        c:'Clic o toque · flechas + Enter', make: glyph },
];

function mount(root, cartsEl, store, opts = {}) {
  const cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
  const ui = root.querySelector('.arcade-ui'), hud = root.querySelector('.arcade-hud');
  const sc = hud.querySelector('[data-score]'), mid = hud.querySelector('[data-mid]'), hi = hud.querySelector('[data-hi]');
  const inp = { keys: {}, keyQ: [], taps: [], swipes: [], px: null, py: null, pointers: [] }; const PT = new Map(); const syncP = () => inp.pointers = [...PT.values()];
  let sel = LIST.find(g => g.id === opts.initial) || LIST[0], game = sel.make(), running = false, raf = 0, last = 0, t0 = 0;
  const best = id => store.get('hi.' + id, 0);
  cv.tabIndex = 0;

  function paintCarts() {
    cartsEl.innerHTML = LIST.map((g, i) => `<button class="cart" data-cart="${g.id}" aria-pressed="${g.id === sel.id}"><span class="cn"><svg aria-hidden="true"><use href="#i-${({drift:'bolt',serpent:'pulse',prism:'grid',orbit:'globe',senda:'bolt',defender:'pad',runner:'arrow',beat:'volume',glyph:'book'})[g.id]}"/></svg></span><span><b>${g.t}</b><small>${g.k}</small></span><span class="hs"><span>RÉCORD</span>${best(g.id)}</span></button>`).join('');
  }
  function intro(over) {
    ui.hidden = false; hud.hidden = true;
    const b = best(sel.id);
    ui.innerHTML = over == null
      ? `<span class="tag purple">HTML5 · sin descargas</span><h3>${sel.t.split(' ')[0].toUpperCase()} <em>${sel.t.split(' ').slice(1).join(' ').toUpperCase()}</em></h3><p>${sel.d}</p><span class="ctrl">${sel.c}</span><button class="btn btn-mint" data-play>▶ Jugar ahora</button>`
      : `<span class="tag mint">Fin de la partida</span><h3>${over} <em>puntos</em></h3><p>${over >= b && over > 0 ? '¡Nuevo récord!' : `Tu récord: ${b}`}</p><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button class="btn btn-mint" data-play>▶ Otra vez</button><button class="btn btn-ghost" data-next>Siguiente juego</button></div>`;
  }
  function select(id) {
    sel = LIST.find(g => g.id === id) || LIST[0]; running = false; game = sel.make(); paintCarts(); intro();
  }
  function start() { game = sel.make(); running = true; ui.hidden = true; hud.hidden = false; Object.keys(inp.keys).forEach(k => inp.keys[k] = false); cv.focus({ preventScroll: true }); t0 = performance.now(); }
  function end() {
    running = false; const s = Math.floor(game.score);
    if (opts.onEnd) opts.onEnd(sel.id, s, (performance.now() - t0) / 1000);
    if (s > best(sel.id)) store.set('hi.' + sel.id, s);
    paintCarts(); intro(s);
  }
  function loop(ts) {
    const dt = Math.min(.033, (ts - last) / 1000 || 0); last = ts;
    if (running) {
      game.update(dt, inp);
      sc.textContent = Math.floor(game.score); mid.textContent = game.hud ? game.hud() : ''; hi.textContent = best(sel.id);
      if (game.over) end();
    }
    inp.keyQ.length = 0; inp.taps.length = 0; inp.swipes.length = 0;
    game.draw(ctx, running ? dt : dt * .3);
    raf = requestAnimationFrame(loop);
  }

  const norm = k => k.length === 1 ? k.toLowerCase() : k;
  const kd = e => {
    if (!running) return;
    const k = norm(e.key);
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter','a','d','w','s','f','j','k','i','l','Shift','z','x','c','v'].includes(k)) { e.preventDefault(); e.stopPropagation(); }
    if (!e.repeat) inp.keyQ.push(k); inp.keys[k] = true;
  };
  const ku = e => { inp.keys[norm(e.key)] = false; };
  addEventListener('keydown', kd, true); addEventListener('keyup', ku);
  const pt = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; };
  let down = null;
  cv.addEventListener('pointerdown', e => { const p = pt(e); PT.set(e.pointerId, { sx: p.x, sy: p.y, x: p.x, y: p.y, touch: e.pointerType !== 'mouse' }); syncP(); down = p; inp.px = p.x; inp.py = p.y; try { cv.setPointerCapture(e.pointerId); } catch {} });
  cv.addEventListener('pointermove', e => { const q = PT.get(e.pointerId); if (q) { const pp = pt(e); q.x = pp.x; q.y = pp.y; } if (e.pointerType === 'mouse' || down) { const p = pt(e); inp.px = p.x; inp.py = p.y; } });
  ['pointercancel'].forEach(ev => cv.addEventListener(ev, e => { PT.delete(e.pointerId); syncP(); }));
  cv.addEventListener('pointerup', e => {
    const q = PT.get(e.pointerId); PT.delete(e.pointerId); syncP();
    if (q && q.touch && q.sx < W * .5 && Math.hypot(q.x - q.sx, q.y - q.sy) > 28) { down = null; return; }
    if (!down) return; const p = pt(e), dx = p.x - down.x, dy = p.y - down.y; down = null;
    if (Math.hypot(dx, dy) < 28) inp.taps.push(p); else inp.swipes.push(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  root.addEventListener('click', e => {
    if (e.target.closest('[data-play]')) start();
    else if (e.target.closest('[data-next]')) { select(LIST[(LIST.indexOf(sel) + 1) % LIST.length].id); }
  });
  cartsEl.addEventListener('click', e => { const b = e.target.closest('[data-cart]'); if (b) { select(b.dataset.cart); root.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } });

  paintCarts(); intro();
  raf = requestAnimationFrame(loop);
  return () => { cancelAnimationFrame(raf); removeEventListener('keydown', kd, true); removeEventListener('keyup', ku); };
}

window.OGArcade = { list: LIST, mount };
})();
