/* Overgame · Nexus Hub — app de una sola página (vanilla JS) */
(() => {
'use strict';
const CUSTOM = (() => { try { return JSON.parse(localStorage.getItem('og.custom') || '[]'); } catch { return []; } })();
const GAMES = [...CUSTOM, ...(window.OG_GAMES || [])];
const BY_ID = new Map(GAMES.map(g => [g.id, g]));
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const view = $('#view');
const FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = (n, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const DAY = 864e5;
const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const parseDate = s => s ? new Date(s + 'T00:00:00') : null;
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const fmtDate = s => { const d = parseDate(s); return d ? `${d.getDate()} ${MESES[d.getMonth()].slice(0,3).toUpperCase()} ${d.getFullYear()}` : 'Por anunciar'; };
const money = n => n === 0 ? 'Gratis' : n == null ? 'Por anunciar' : 'US$' + n.toFixed(2);
const daysTo = s => Math.round((parseDate(s) - today()) / DAY);

/* ---------- almacenamiento local seguro ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('og.' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('og.' + k, JSON.stringify(v)); } catch {} }
};
const favs = new Set(store.get('favs', []));
const alerts = new Set(store.get('alerts', []));
function toggleSet(set, key, id, msgOn, msgOff) {
  set.has(id) ? set.delete(id) : set.add(id);
  store.set(key, [...set]);
  toast(set.has(id) ? msgOn : msgOff);
  syncBadges();
  $$(`[data-${key === 'favs' ? 'fav' : 'alert'}="${id}"]`).forEach(b => paintToggle(b, set.has(id), key));
}
function paintToggle(b, on, key) {
  b.classList.toggle('on', on);
  b.setAttribute('aria-pressed', on);
  if (key === 'alerts' && b.dataset.label !== undefined) b.querySelector('span').textContent = on ? 'Alerta activa' : 'Activar alerta de precio';
}
function syncBadges() {
  const c = $('#favCount'); c.hidden = !favs.size; c.textContent = favs.size;
  $('#alertDot').hidden = !alerts.size && !favs.size;
}
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }

/* ---------- etiquetas ---------- */
const PLAT = { pc:'PC', ps5:'PS5', xbox:'XSX', switch:'Switch', mobile:'Móvil' };
const PLAT_LONG = { pc:'PC (Windows)', ps5:'PlayStation 5', xbox:'Xbox Series X|S', switch:'Nintendo Switch', mobile:'iOS / Android' };
const MODE = { solo:'Un jugador', coop:'Cooperativo online', comp:'Competitivo online', local:'Pantalla dividida' };
const LEVEL = { 1:'Ligero', 2:'Desafío medio', 3:'Hardcore' };
const MOODS = [
  { k:'adrenalina', icon:'bolt',  t:'Busco adrenalina',       d:'Acción rápida, shooters y roguelikes que no perdonan.' },
  { k:'relax',      icon:'leaf',  t:'Quiero relajarme',       d:'Cozy, puzzles y simulación sin estrés ni cronómetro.' },
  { k:'historia',   icon:'book',  t:'Quiero una gran historia', d:'RPG narrativos y aventuras para perderse horas.' },
  { k:'rapido',     icon:'timer', t:'Tengo 20 minutos libres', d:'Partidas cortas, arcade y móvil: entra y sal.' },
];
const released = g => !g.soon;
const platsHTML = g => `<div class="plats">${g.plats.map(p => `<span>${PLAT[p]}</span>`).join('')}</div>`;
function priceHTML(g) {
  if (g.price === 0) return `<div class="price"><b class="free">Gratis</b></div>`;
  if (g.price == null) return `<div class="price"><b>${g.soon ? 'Precio por anunciar' : '—'}</b></div>`;
  return `<div class="price"><b>${money(g.price)}</b>${g.off ? `<s>${money(g.base)}</s><span class="off">-${g.off}%</span>` : ''}</div>`;
}
function badgesHTML(g) {
  const b = [];
  if (g.soon) b.push(`<span class="tag purple">${fmtDate(g.date).slice(0,6)}</span>`);
  if (g.demo) b.push(`<span class="tag mint">Demo</span>`);
  if (g.price === 0) b.push(`<span class="tag mint">Free</span>`);
  if (g.off && !g.soon) b.push(`<span class="tag outline-mint">-${g.off}%</span>`);
  if (g.soon && g.off) b.push(`<span class="tag outline-mint">Preventa -${g.off}%</span>`);
  return b.join('');
}
const cardHTML = g => `
  <article class="card" data-card="${g.id}" tabindex="0" role="button" aria-label="${esc(g.name)}: ver ficha">
    <div class="card-media"><img src="${g.img}" alt="" loading="lazy"><div class="card-badges">${badgesHTML(g)}</div></div>
    <div class="card-body">
      <div class="card-meta"><span>${esc(g.genres.slice(0,2).join(' / '))}</span>${g.meta ? `<span class="score">★ ${g.meta}</span>` : ''}</div>
      <h3>${esc(g.name)}</h3>
      ${platsHTML(g)}
      ${priceHTML(g)}
    </div>
  </article>`;

/* ---------- tiendas (Steam real; resto referencia simulada) ---------- */
const demoUrl = g => /^https?:/.test(String(g.demo)) ? g.demo : `https://store.steampowered.com/app/${g.demo}`;
const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };
function stores(g) {
  const q = encodeURIComponent(g.name);
  const list = [];
  const base = g.base ?? g.price;
  const sim = (k, n, url, mul = 1) => {
    const r = hash(g.id + k);
    let b = base == null ? null : base === 0 ? 0 : Math.max(0.99, Math.round(base * mul) - 0.01);
    const off = b ? [0,0,0,0,10,15,20,25,33,40][Math.floor(r * 10)] : 0;
    const p = b == null ? null : b === 0 ? 0 : Math.round(b * (100 - off)) / 100;
    list.push({ k, n, url, price: p, base: b, off, real: false });
  };
  if (g.plats.includes('pc')) list.push({ k:'steam', n:'Steam', url:`https://store.steampowered.com/app/${g.id}`, price:g.price, base:g.base, off:g.off, real:true });
  if (g.plats.includes('pc') && hash(g.id + 'epic') > .45) sim('epic', 'Epic Games', `https://store.epicgames.com/es-ES/browse?q=${q}`);
  if (g.plats.includes('ps5')) sim('ps', 'PlayStation Store', `https://store.playstation.com/es-co/search/${q}`, 1.1);
  if (g.plats.includes('xbox')) sim('xbox', 'Xbox Store', `https://www.xbox.com/es-CO/search?q=${q}`, 1.05);
  if (g.plats.includes('switch')) sim('eshop', 'Nintendo eShop', `https://www.nintendo.com/us/search/#q=${q}`, 1.1);
  if (g.plats.includes('mobile')) { sim('ios', 'App Store', `https://apps.apple.com/us/search?term=${q}`, .4); sim('gp', 'Google Play', `https://play.google.com/store/search?q=${q}&c=apps`, .4); }
  if (g.custom) {
    list.length = 0;
    for (const [k, n] of STORE_KEYS) if (g.links?.[k]) list.push({ k, n, url: g.links[k], price: g.price, base: g.base, off: g.off, real: true });
  }
  const priced = list.filter(s => s.price != null);
  const best = priced.length ? priced.reduce((a, b) => b.price < a.price ? b : a) : null;
  if (best && priced.length > 1) best.best = true;
  return { list, best };
}
const STORE_KEYS = [['steam','Steam'],['epic','Epic Games'],['ps','PlayStation Store'],['xbox','Xbox Store'],['eshop','Nintendo eShop'],['ios','App Store'],['gp','Google Play'],['web','Sitio oficial']];
function storesHTML(g, max = 9) {
  const { list } = stores(g);
  return `<div class="stores">${list.slice(0, max).map(s => `
    <a class="store ${s.best ? 'best' : ''}" href="${s.url}" target="_blank" rel="noopener">
      <span class="nm">${s.n}<span class="flags">${s.real ? `<small>${g.custom ? 'LINK DIRECTO' : 'PRECIO REAL'}</small>` : '<small>REF.</small>'}${s.best ? '<span class="ofr">MEJOR PRECIO</span>' : s.off ? `<span class="ofr">-${s.off}%</span>` : ''}</span></span>
      <span class="pr">${s.off && s.base ? `<s>${money(s.base)}</s>` : ''}${money(s.price)}</span>${icon('ext')}
    </a>`).join('')}</div>`;
}
/* ---------- video: microtráiler webm/mp4 o HLS ---------- */
function loadVideo(video, g, { full = false } = {}) {
  unloadVideo(video);
  video.muted = !full ? true : video.muted;
  video.playsInline = true;
  if (g.mt) {
    video.src = full ? g.mp4 : (video.canPlayType('video/webm; codecs="vp9"') || video.canPlayType('video/webm') ? g.mt : g.mp4);
  } else if (g.hls) {
    if (video.canPlayType('application/vnd.apple.mpegurl')) video.src = g.hls;
    else if (window.Hls && Hls.isSupported()) {
      const h = new Hls({ capLevelToPlayerSize: true, startLevel: full ? -1 : 3, maxBufferLength: full ? 30 : 8 });
      h.loadSource(g.hls); h.attachMedia(video); video._hls = h;
    } else return false;
  } else return false;
  const p = video.play(); if (p) p.catch(() => {});
  return true;
}
function unloadVideo(video) { if (video._hls) { video._hls.destroy(); video._hls = null; } video.removeAttribute('src'); try { video.load(); } catch {} }

/* ---------- vista previa flotante: la tarjeta crece desde su sitio y vuelve a él ---------- */
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
let peek = null, peekTimer = 0, peekCloseTimer = 0;
const flip = (r, box) => `translate(${r.left - box.left}px,${r.top - box.top}px) scale(${r.width / box.w})`;
function openPeek(card) {
  const g = BY_ID.get(+card.dataset.card); if (!g) return;
  if (peek && peek._card === card) return;
  closePeek();
  const r = card.getBoundingClientRect();
  const w = Math.min(Math.max(r.width * 1.5, 360), innerWidth - 24);
  const el = document.createElement('div');
  el.className = 'peek';
  el.innerHTML = `
    <div class="peek-media" data-open="${g.id}"><img src="${g.img}" alt=""><video muted loop playsinline preload="none"></video><span class="tag mint badge-live">${icon('play')} Vista previa</span><i class="bar"></i></div>
    <div class="peek-fold"><div class="peek-body">
      <div class="card-meta"><span>${esc(g.genres.join(' / '))}</span>${g.meta ? `<span class="score">★ ${g.meta}</span>` : ''}</div>
      <h3>${esc(g.name)}</h3>
      <p>${esc(g.desc)}</p>
      <div class="chips"><span class="chip">${LEVEL[g.level]}</span>${g.modes.map(m => `<span class="chip">${MODE[m]}</span>`).join('')}</div>
      ${platsHTML(g)}
      <div class="peek-actions">
        ${g.demo ? `<a class="btn btn-mint btn-sm" href="${demoUrl(g)}" target="_blank" rel="noopener">${icon('play')}Probar demo</a>` : ''}
        <button class="btn ${g.demo ? 'btn-ghost' : 'btn-mint'} btn-sm" data-open="${g.id}">Ver ficha${icon('arrow')}</button>
        <button class="btn btn-ghost btn-sm fav-btn ${favs.has(g.id) ? 'on' : ''}" data-fav="${g.id}" aria-label="Guardar en favoritos" aria-pressed="${favs.has(g.id)}">${icon('heart')}</button>
      </div>
    </div></div>`;
  el.classList.add('measure');
  el.style.width = w + 'px';
  el.style.visibility = 'hidden';
  document.body.appendChild(el);
  const h = el.offsetHeight;
  const mediaH = w * 215 / 460, cardMediaH = r.width * 215 / 460;
  let left = Math.max(12, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 12));
  let top = Math.max(76, Math.min(r.top - (mediaH - cardMediaH) / 2, innerHeight - h - 12));
  const box = { left, top, w };
  el.classList.remove('measure');
  Object.assign(el.style, { left: left + 'px', top: top + 'px', transform: REDUCED ? 'none' : flip(r, box), visibility: '' });
  el._card = card; el._box = box;
  card.classList.add('peeking');
  el.offsetHeight;                       // fija el estado inicial antes de animar
  el.classList.add('in'); el.style.transform = 'none';
  const v = $('video', el), bar = $('.bar', el);
  v.addEventListener('playing', () => v.classList.add('ready'), { once: true });
  v.addEventListener('timeupdate', () => { if (v.duration) bar.style.transform = `scaleX(${v.currentTime / v.duration})`; });
  setTimeout(() => { if (el.isConnected && el.classList.contains('in')) loadVideo(v, g); }, 180);
  el.addEventListener('mouseenter', () => clearTimeout(peekCloseTimer));
  el.addEventListener('mouseleave', e => { if (!(e.relatedTarget && card.contains(e.relatedTarget))) closePeek(); });
  peek = el;
}
function closePeek(now) {
  clearTimeout(peekTimer);
  if (!peek) return;
  const el = peek; peek = null;
  const card = el._card; card && card.classList.remove('peeking');
  const v = $('video', el);
  if (now || REDUCED || !card || !card.isConnected) { if (v) unloadVideo(v); return el.remove(); }
  const r = card.getBoundingClientRect();
  el.classList.remove('in');
  el.classList.add('out');
  el.style.transform = flip(r, el._box);
  if (v) v.classList.remove('ready');
  setTimeout(() => { if (v) unloadVideo(v); el.remove(); }, 420);
}
if (FINE) {
  document.addEventListener('mouseover', e => {
    const card = e.target.closest('[data-card]');
    if (!card || card.contains(e.relatedTarget)) return;
    clearTimeout(peekTimer); clearTimeout(peekCloseTimer);
    peekTimer = setTimeout(() => openPeek(card), 320);
  });
  document.addEventListener('mouseout', e => {
    const card = e.target.closest('[data-card]');
    if (!card || card.contains(e.relatedTarget)) return;
    clearTimeout(peekTimer);
    if (peek && !(e.relatedTarget && peek.contains(e.relatedTarget))) peekCloseTimer = setTimeout(() => closePeek(), 90);
  });
  addEventListener('scroll', () => closePeek(), { passive: true });
}

/* ---------- modal de ficha ---------- */
const modal = $('#modal'), panel = $('.modal-panel', modal);
let lastFocus = null;
function openModal(id) {
  const g = BY_ID.get(+id); if (!g) return;
  closePeek(true);
  trackView(g.id);
  lastFocus = document.activeElement;
  const { best } = stores(g);
  panel.innerHTML = `
    <button class="modal-close" data-close aria-label="Cerrar">${icon('x')}</button>
    <div class="modal-media"><video controls playsinline poster="${g.img}"></video></div>
    <div class="modal-body">
      <div>
        <div class="hero-tags">${badgesHTML(g)}<span class="tag">${esc(g.genres.join(' · '))}</span></div>
        <h2 id="modalTitle">${esc(g.name)}</h2>
        <p>${esc(g.desc)}</p>
        <dl class="specs">
          <dt>Estudio</dt><dd>${esc(g.dev)}</dd>
          <dt>Salida</dt><dd>${fmtDate(g.date)}${g.soon ? ` · faltan ${daysTo(g.date)} días` : ''}</dd>
          <dt>Plataformas</dt><dd>${g.plats.map(p => PLAT_LONG[p]).join(', ')}</dd>
          <dt>Modo</dt><dd>${g.modes.map(m => MODE[m]).join(', ')}</dd>
          <dt>Exigencia</dt><dd>${LEVEL[g.level]}</dd>
          ${g.meta ? `<dt>Metacritic</dt><dd>${g.meta}/100</dd>` : ''}
        </dl>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <span class="meta-line">Comparativa de tiendas</span>
        ${storesHTML(g)}
        <p class="note">${g.custom ? 'Juego agregado desde Admin: links directos que cargaste tú.' : 'Steam: precio real (8 nov 2026). “REF.”: precio de referencia del prototipo, sin conexión a esa tienda.'}</p>
        ${g.custom && videoKind(g.video) === 'yt' ? `<a class="btn btn-ghost" href="${esc(g.video)}" target="_blank" rel="noopener">${icon('play')}Ver tráiler en YouTube</a>` : ''}
        ${g.demo ? `<a class="btn btn-mint" href="${demoUrl(g)}" target="_blank" rel="noopener">${icon('play')}${g.custom ? 'Probar demo gratis' : 'Descargar demo gratis en Steam'}</a>`
          : best ? `<a class="btn btn-mint" href="${best.url}" target="_blank" rel="noopener">${icon('store')}${g.soon ? 'Reservar' : 'Comprar'} en ${best.n} · ${money(best.price)}</a>` : ''}
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost ${favs.has(g.id) ? 'on' : ''}" style="flex:1" data-fav="${g.id}" aria-pressed="${favs.has(g.id)}">${icon('heart')}Favorito</button>
          <button class="btn btn-ghost ${alerts.has(g.id) ? 'on' : ''}" style="flex:1" data-alert="${g.id}" aria-pressed="${alerts.has(g.id)}">${icon('bell')}Alerta</button>
        </div>
      </div>
    </div>`;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  const v = $('video', panel);
  v.muted = true; loadVideo(v, g, { full: true });
  $('.modal-close', panel).focus();
}
function closeModal() {
  if (modal.hidden) return;
  const v = $('video', panel); if (v) unloadVideo(v);
  modal.hidden = true; panel.innerHTML = '';
  document.body.style.overflow = '';
  lastFocus && lastFocus.focus && lastFocus.focus();
}

/* ---------- eventos globales ---------- */
document.addEventListener('click', e => {
  const t = e.target;
  const fav = t.closest('[data-fav]'); if (fav) { e.stopPropagation(); return toggleSet(favs, 'favs', +fav.dataset.fav, 'Guardado en tu biblioteca', 'Quitado de favoritos'); }
  const al = t.closest('[data-alert]'); if (al) { e.stopPropagation(); return toggleSet(alerts, 'alerts', +al.dataset.alert, 'Te avisaremos si baja de precio', 'Alerta desactivada'); }
  if (t.closest('[data-close]')) return closeModal();
  const op = t.closest('[data-open]'); if (op && !t.closest('a[href^="http"]')) return openModal(op.dataset.open);
  const card = t.closest('[data-card]'); if (card && !t.closest('a')) return openModal(card.dataset.card);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !intro.el) { closeModal(); closePeek(); }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-card]')) { e.preventDefault(); openModal(e.target.dataset.card); }
  if (e.key === '/' && !intro.el && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); $('#search').focus(); }
  if (e.key === 'Tab' && !modal.hidden) { // trampa de foco
    const f = $$('button,a[href],video[controls]', panel); if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
  }
});

/* ---------- búsqueda ---------- */
const search = $('#search');
let searchT;
search.addEventListener('input', () => {
  clearTimeout(searchT);
  searchT = setTimeout(() => {
    exp.q = search.value.trim();
    if (route().name !== 'explorar') location.hash = '#/explorar';
    else renderExploreResults();
  }, 160);
});

/* ================= VISTAS ================= */

/* ---- Inicio ---- */
const FEATURED = 1903340;
function viewInicio() {
  const f = BY_ID.get(FEATURED) || GAMES[0];
  const t0 = today();
  const week = GAMES.filter(g => g.soon || (g.date && Math.abs(daysTo(g.date)) <= 7)).filter(g => { const d = daysTo(g.date); return d >= -7 && d <= 10; }).sort((a, b) => a.date.localeCompare(b.date));
  const top = GAMES.filter(released).filter(g => g.meta).sort((a, b) => b.meta - a.meta).slice(0, 8);
  const deals = GAMES.filter(g => released(g) && g.off).sort((a, b) => b.off - a.off).slice(0, 8);
  view.innerHTML = `
  <section class="hero">
    <div class="hero-media"><img src="https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${f.id}/library_hero.jpg" alt="" onerror="this.src='${f.img}'"><video id="heroVideo" muted loop playsinline style="position:absolute;inset:0;opacity:0;transition:opacity 1s"></video></div>
    <div class="hero-body">
      <div class="hero-tags"><span class="tag">${esc(f.genres.join(' · '))}</span>${f.meta ? `<span class="tag purple">Metacritic ${f.meta}</span>` : ''}</div>
      <h1>${esc(f.name.split(':')[0])}${f.name.includes(':') ? `<br><em>${esc(f.name.split(':')[1].trim())}</em>` : ''}</h1>
      <p>${esc(f.desc)}</p>
      <div class="hero-actions">
        <a class="btn btn-mint" href="#/mood">${icon('pulse')}Lanzar Mood Finder</a>
        <button class="btn btn-ghost" data-open="${f.id}">${icon('play')}Ver tráiler y precios</button>
      </div>
    </div>
    <button class="hero-mute" id="heroMute" aria-label="Activar sonido del tráiler">${icon('mute')}</button>
  </section>

  <div class="home-grid"><div class="home-main">

  <section>
    <div class="sec-head"><div><h2 style="margin-top:8px">¿Cómo quieres sentirte hoy?</h2></div><p>Elige y te llevamos directo al paso 2 del Mood Finder.</p></div>
    <div class="moods">${MOODS.map(m => `
      <a class="mood" href="#/mood?m=${m.k}">
        <span class="ico">${icon(m.icon)}</span><span class="n">${GAMES.filter(g => released(g) && g.moods.includes(m.k)).length} juegos</span>
        <h3>${m.t}</h3><p>${m.d}</p><span class="go">Sintonizar ${icon('arrow')}</span>
      </a>`).join('')}</div>
  </section>

  <section>
    <div class="sec-head"><div><h2>Lanzamientos de esta semana</h2><p>Lo que sale (o acaba de salir) en Steam alrededor de hoy.</p></div><a class="link" href="#/calendario">Ver calendario ${icon('arrow')}</a></div>
    <div class="strip">${week.slice(0, 6).map(g => {
      const d = daysTo(g.date);
      return `<div class="mini" data-card="${g.id}" tabindex="0" role="button"><img src="${g.img}" alt="" loading="lazy"><div><small>${d > 0 ? `En ${d} día${d > 1 ? 's' : ''} · ${fmtDate(g.date).slice(0,6)}` : d === 0 ? 'Sale hoy' : 'Ya disponible'}</small><h4>${esc(g.name)}</h4><span>${esc(g.genres.slice(0,2).join(' · '))}${g.demo ? ' · <b style="color:var(--mint)">Demo gratis</b>' : ''}</span></div></div>`; }).join('')}</div>
  </section>

  <section>
    <div class="sec-head"><div><h2>Imprescindibles del catálogo</h2><p>Mejor valorados por la crítica. Pasa el mouse sobre una tarjeta para ver el tráiler.</p></div><a class="link" href="#/explorar">Explorar todo ${icon('arrow')}</a></div>
    <div class="grid">${top.map(cardHTML).join('')}</div>
  </section>

  <section>
    <div class="sec-head"><div><h2 style="margin-top:8px">Descuentos de hoy en Steam</h2></div><a class="link" href="#/demos">Free &amp; Demos ${icon('arrow')}</a></div>
    <div class="grid">${deals.map(cardHTML).join('')}</div>
  </section>
  </div>
  <aside class="home-side">
    <a class="deal-card" href="#/explorar" data-sort="off">
      <svg class="deal-pad" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-pad"/></svg>
      <svg class="deal-ic"><use href="#i-gift"/></svg>
      <h3>Ofertas de la semana</h3>
      <span>Hasta</span><b>-${Math.max(...GAMES.map(g => g.off || 0))}%</b>
      <small>${GAMES.filter(g => g.off).length} juegos con descuento en Steam hoy</small>
    </a>
    <section class="panel squad">
      <div class="d-title"><h3>Amigos en línea <span class="sq-n">(3)</span></h3><span class="tag outline-mint" title="Así se verá cuando conectes tu cuenta">Ejemplo</span></div>
      ${[['NovaX', 'Jugando a', 1145350], ['Kairo', 'En partida de', 1086940], ['Lunara', 'Explorando', 2198150]].map(([n, a, id]) => `
      <div class="friend" data-card="${id}" tabindex="0" role="button"><span class="fr-av">${n[0]}</span><div><b>${n} <i></i></b><small>${a} ${esc(BY_ID.get(id)?.name || '')}</small></div></div>`).join('')}
      <button class="link" type="button" onclick="this.closest('.squad').querySelector('.sq-note').hidden=false">Invitar amigos ${icon('arrow')}</button>
      <p class="sq-note note" hidden>Pronto podrás conectar tu cuenta de Steam o Discord para ver a tu escuadrón real.</p>
    </section>
  </aside>
  </div>`;
  const hv = $('#heroVideo');
  hv.addEventListener('playing', () => hv.style.opacity = 1, { once: true });
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) loadVideo(hv, f);
  $('#heroMute').onclick = e => {
    if (!hv.src && !hv._hls) loadVideo(hv, f);
    if (f.mt && hv.src.includes('microtrailer')) { const t = hv.currentTime; hv.src = f.mp4; hv.currentTime = 0; hv.play().catch(()=>{}); }
    hv.muted = !hv.muted;
    e.currentTarget.innerHTML = icon(hv.muted ? 'mute' : 'volume');
    e.currentTarget.setAttribute('aria-label', hv.muted ? 'Activar sonido del tráiler' : 'Silenciar tráiler');
  };
}

/* ---- Mood Finder ---- */
const finder = { step: 1, mood: null, plat: null, company: null, level: null };
const PLAT_OPTS = [
  { k:'pc', icon:'pc', t:'PC', d:'Windows, Mac o Linux' },
  { k:'consola', icon:'pad', t:'Consola', d:'PS5, Xbox Series o Switch' },
  { k:'movil', icon:'phone', t:'Móvil', d:'iOS o Android' },
];
const COMP_OPTS = [
  { k:'solo', icon:'user', t:'Solo', d:'Yo y el juego' },
  { k:'online', icon:'globe', t:'Amigos en línea', d:'Cooperativo o competitivo' },
  { k:'local', icon:'split', t:'Pantalla dividida', d:'En el mismo sofá' },
];
const LVL_OPTS = [
  { k:1, t:'Ligero', d:'Controles sencillos, ideal para desconectar.' },
  { k:2, t:'Desafío medio', d:'Requiere atención y estrategia básica.' },
  { k:3, t:'Hardcore / Retador', d:'Mecánicas complejas, alta dificultad o competitivo.' },
];
function platOk(g, p) { return !p || (p === 'pc' ? g.plats.includes('pc') : p === 'consola' ? g.plats.some(x => ['ps5','xbox','switch'].includes(x)) : g.plats.includes('mobile')); }
function compOk(g, c) { return c === 'solo' ? g.modes.includes('solo') : c === 'online' ? g.modes.some(m => m === 'coop' || m === 'comp') : g.modes.includes('local'); }
function affinity(g, a) {
  if (!released(g) || !platOk(g, a.plat)) return null;
  let s = 0, max = 0;
  if (a.mood) { max += 40; const i = g.moods.indexOf(a.mood); s += i === 0 ? 40 : i > 0 ? 28 : 0; }
  if (a.company) { max += 25; s += compOk(g, a.company) ? 25 : 4; }
  if (a.level) { max += 25; s += Math.max(0, 25 - 11 * Math.abs(g.level - a.level)); }
  max += 10; s += (g.meta ? Math.max(0, (g.meta - 75) / 2) : 4) + (g.demo ? 2 : 0) + (g.off ? 2 : 0);
  return Math.min(99, Math.round(s / max * 100));
}
function ranked(a = finder) {
  return GAMES.map(g => ({ g, s: affinity(g, a) })).filter(x => x.s != null).sort((x, y) => y.s - x.s || (y.g.meta || 0) - (x.g.meta || 0));
}
function whyText(g) {
  const w = [];
  const m = MOODS.find(x => x.k === finder.mood);
  if (m && g.moods.includes(finder.mood)) w.push(`encaja con <b>${m.t.toLowerCase()}</b>`);
  if (finder.company && compOk(g, finder.company)) w.push(`se juega <b>${COMP_OPTS.find(c => c.k === finder.company).t.toLowerCase()}</b>`);
  if (finder.level) w.push(g.level === finder.level ? `nivel <b>${LEVEL[g.level].toLowerCase()}</b>, justo lo que pediste` : `nivel ${LEVEL[g.level].toLowerCase()}`);
  return w.length ? 'Porque ' + w.join(', ') + '.' : '';
}
function viewMood(params) {
  if (params.get('m') && MOODS.some(m => m.k === params.get('m'))) { finder.mood = params.get('m'); finder.step = 2; history.replaceState(null, '', '#/mood'); }
  const names = ['Ánimo','Contexto','Desafío','Resultado'];
  const s = finder.step;
  view.innerHTML = `
  <div class="finder-head stage">${stageBg(MOOD_STAGE[finder.mood] || 1145350)}<span class="stage-word" aria-hidden="true">Mood</span>
    <div><h1 class="page-title" style="margin-top:10px">Sintonizador de experiencias: <em>paso ${s} de 4</em></h1><p class="lede">Cuatro preguntas rápidas y te damos tres juegos que puedes empezar hoy.</p></div>
    <div class="steps" aria-label="Progreso">${names.map((n, i) => `${i ? `<i class="step-line ${i < s ? 'done' : ''}"></i>` : ''}<div class="step ${i + 1 === s ? 'on' : i + 1 < s ? 'done' : ''}"><b>${i + 1 < s ? icon('check') : '0' + (i + 1)}</b><em style="font-style:normal">${n}</em></div>`).join('')}</div>
  </div>
  <div class="finder ${s === 4 ? "solo" : ""}">
    <div id="stepBody">${s === 4 ? resultsHTML() : stepHTML(s)}</div>
    ${s < 4 ? `<aside class="panel side" id="live">${liveHTML()}</aside>` : ''}
  </div>`;
  view.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => {
    const [k, v] = b.dataset.pick.split(':');
    finder[k] = k === 'level' ? +v : v;
    $$(`[data-pick^="${k}:"]`).forEach(x => x.setAttribute('aria-pressed', x === b));
    $('#live').innerHTML = liveHTML();
    const nx = $('#next'); if (nx) nx.disabled = !stepReady();
    if (s === 1 || s === 3) setTimeout(() => go(1), 260);
    else if (finder.plat && finder.company && k === 'company') setTimeout(() => go(1), 260);
  }));
  const nx = $('#next'); if (nx) nx.onclick = () => go(1);
  const bk = $('#back'); if (bk) bk.onclick = () => go(-1);
  const sk = $('#skip'); if (sk) sk.onclick = () => { finder.step = 4; stats.moods++; saveStats(); viewMood(new URLSearchParams()); };
  const rs = $('#restart'); if (rs) rs.onclick = () => { Object.assign(finder, { step: 1, mood: null, plat: null, company: null, level: null }); viewMood(new URLSearchParams()); };
  $$('.result video').forEach(v => { const g = BY_ID.get(+v.dataset.g); v.addEventListener('playing', () => v.style.opacity = 1, { once: true }); loadVideo(v, g); });
}
function stepReady() { return finder.step === 1 ? !!finder.mood : finder.step === 2 ? !!(finder.plat && finder.company) : !!finder.level; }
function go(d) { if (d > 0 && !stepReady()) return; finder.step = Math.min(4, Math.max(1, finder.step + d)); if (finder.step === 4 && d > 0) { stats.moods++; saveStats(); } viewMood(new URLSearchParams()); scrollTo({ top: 0, behavior: 'smooth' }); }
const pressed = (k, v) => `aria-pressed="${finder[k] === v}"`;
function stepHTML(s) {
  let body = '';
  if (s === 1) body = `<div class="q"><h2 class="q-title">${icon('pulse')} ¿Qué te pide el cuerpo ahora?</h2>
    <div class="moods">${MOODS.map(m => `<button class="mood ${finder.mood === m.k ? 'sel' : ''}" data-pick="mood:${m.k}" ${pressed('mood', m.k)}><span class="ico">${icon(m.icon)}</span><span class="n">${GAMES.filter(g => released(g) && g.moods.includes(m.k)).length} juegos</span><h3>${m.t}</h3><p>${m.d}</p></button>`).join('')}</div></div>`;
  if (s === 2) body = `<div class="q"><h2 class="q-title">¿Dónde vas a jugar ahora mismo?</h2>
    <div class="opts">${PLAT_OPTS.map(o => `<button class="opt" data-pick="plat:${o.k}" ${pressed('plat', o.k)}>${icon(o.icon)}<b>${o.t}</b><span>${o.d}</span></button>`).join('')}</div>
    <h2 class="q-title" style="margin-top:14px">¿Con quién?</h2>
    <div class="opts">${COMP_OPTS.map(o => `<button class="opt" data-pick="company:${o.k}" ${pressed('company', o.k)}>${icon(o.icon)}<b>${o.t}</b><span>${o.d}</span></button>`).join('')}</div></div>`;
  if (s === 3) body = `<div class="q"><h2 class="q-title">¿Cuánto reto quieres?</h2>
    <div class="opts">${LVL_OPTS.map(o => `<button class="opt" data-pick="level:${o.k}" ${pressed('level', o.k)}><span class="lvl">${[1,2,3].map(i => `<i class="${i <= o.k ? 'on' : ''}"></i>`).join('')}</span><b>${o.t}</b><span>${o.d}</span></button>`).join('')}</div></div>`;
  return `${body}<div class="q-nav" style="margin-top:22px">
    ${s > 1 ? `<button class="btn btn-ghost" id="back">${icon('back')}Atrás</button>` : '<span></span>'}
    <button class="btn btn-mint" id="next" ${stepReady() ? '' : 'disabled style="opacity:.45;cursor:not-allowed"'}>${s === 3 ? 'Ver mis 3 juegos' : 'Continuar'} ${icon('arrow')}</button></div>`;
}
function liveHTML() {
  const r = ranked();
  const top = r[0];
  const row = (l, v) => `<div><span>${l}</span><b>${v || '—'}</b></div>`;
  return `<h3>Así va tu búsqueda</h3>
    ${top && finder.mood ? `<div class="cand"><img src="${top.g.img}" alt=""><div><small>${top.s}% afinidad</small><b>${esc(top.g.name)}</b></div></div><div class="meter"><i style="width:${top.s}%"></i></div>` : `<p class="note" style="font-size:13.5px">Elige un estado de ánimo y aquí verás tu mejor candidato en vivo.</p>`}
    <div class="summary">
      ${row('Ánimo', MOODS.find(m => m.k === finder.mood)?.t)}
      ${row('Plataforma', PLAT_OPTS.find(o => o.k === finder.plat)?.t)}
      ${row('Compañía', COMP_OPTS.find(o => o.k === finder.company)?.t)}
      ${row('Desafío', LEVEL[finder.level])}
    </div>
    <p class="pool"><b>${r.length}</b> juegos compatibles con tu plataforma</p>
    <button class="btn btn-ghost btn-sm" id="skip" ${finder.mood ? '' : 'disabled style="opacity:.45"'}>Saltar y ver recomendaciones ${icon('arrow')}</button>`;
}
function resultsHTML() {
  const r = ranked().slice(0, 3);
  if (!r.length) return `<div class="empty"><h3>No encontramos juegos con esa combinación</h3><p>Prueba otra plataforma o compañía.</p><button class="btn btn-mint" id="restart">Empezar de nuevo</button></div>`;
  return `<div class="sec-head"><div><h2>Tus 3 juegos para hoy</h2><p>${esc(MOODS.find(m => m.k === finder.mood)?.t || 'Selección')} · ${PLAT_OPTS.find(o => o.k === finder.plat)?.t || 'Cualquier plataforma'} · ${COMP_OPTS.find(o => o.k === finder.company)?.t || 'Cualquier compañía'} · ${LEVEL[finder.level] || 'Cualquier reto'}</p></div>
    <div style="display:flex;gap:8px"><button class="btn btn-ghost btn-sm" id="back">${icon('back')}Ajustar</button><button class="btn btn-ghost btn-sm" id="restart">Empezar de nuevo</button></div></div>
    <div class="results">${r.map(({ g, s }, i) => `
      <article class="result ${i === 0 ? 'top' : ''}">
        <div class="card-media" data-open="${g.id}"><img src="${g.img}" alt=""><video muted loop playsinline data-g="${g.id}" style="opacity:0;transition:opacity .6s"></video>
          <div class="card-badges">${i === 0 ? '<span class="tag mint">Mejor match</span>' : ''}${badgesHTML(g)}</div>
          <div class="aff"><b>${s}%</b><span>AFINIDAD</span></div></div>
        <div class="result-body">
          <div class="card-meta"><span>${esc(g.genres.join(' / '))}</span>${g.meta ? `<span class="score">★ ${g.meta}</span>` : ''}</div>
          <h3>${esc(g.name)}</h3>
          <p class="why">${whyText(g)}</p>
          ${storesHTML(g, 3)}
          <div class="result-actions">
            ${g.demo ? `<a class="btn btn-mint btn-sm" href="${demoUrl(g)}" target="_blank" rel="noopener">${icon('play')}Demo gratis</a>` : `<button class="btn btn-mint btn-sm" data-open="${g.id}">Ver ficha ${icon('arrow')}</button>`}
            <button class="btn btn-ghost btn-sm fav-btn ${favs.has(g.id) ? 'on' : ''}" data-fav="${g.id}" aria-label="Guardar ${esc(g.name)}" aria-pressed="${favs.has(g.id)}">${icon('heart')}</button>
          </div>
        </div>
      </article>`).join('')}</div>
    <p class="note" style="margin-top:14px">La afinidad pondera ánimo (40%), compañía (25%), desafío (25%) y valoración/demo/oferta (10%).</p>`;
}

/* ---- Explorar ---- */
const exp = { p: new Set(), g: new Set(), m: new Set(), q: '', sort: 'meta' };
const GENRES = [...new Set(GAMES.flatMap(g => g.genres))].sort((a, b) => a.localeCompare(b, 'es'));
function viewExplorar(params) {
  if (params.get('p')) { exp.p = new Set([params.get('p')]); history.replaceState(null, '', '#/explorar'); }
  const grp = (key, label, items) => `<div class="f-row"><span>${label}</span><div class="f-opts">${items.map(([k, t]) => `<button class="fchip" data-f="${key}:${k}" aria-pressed="${exp[key].has(k)}">${t}</button>`).join('')}</div></div>`;
  view.innerHTML = `
  <section class="stage">${stageBg(1245620)}<span class="stage-word" aria-hidden="true">Explorar</span><div class="stage-body"><h1 class="page-title" style="margin-top:10px">Explora el <em>catálogo</em></h1><p class="lede">Combina dispositivo, género y modo de juego. Pasa el mouse sobre una tarjeta para ver el tráiler.</p></div></section>
  <div class="panel filters">
    ${grp('p', 'Dispositivo', Object.entries(PLAT))}
    ${grp('g', 'Género', GENRES.map(g => [g, g]))}
    ${grp('m', 'Modo', Object.entries(MODE))}
  </div>
  <div style="display:flex;flex-direction:column;gap:16px">
    <div class="result-count"><span id="count"></span><span style="display:flex;gap:8px;align-items:center"><button class="btn btn-ghost btn-sm" id="clearF">Limpiar filtros</button>
      <select class="sort" id="sort" aria-label="Ordenar"><option value="meta">Mejor valorados</option><option value="price">Precio: menor a mayor</option><option value="off">Mayor descuento</option><option value="date">Más recientes</option></select></span></div>
    <div class="grid" id="results"></div>
  </div>`;
  $('#sort').value = exp.sort;
  $('#sort').onchange = e => { exp.sort = e.target.value; renderExploreResults(); };
  $('#clearF').onclick = () => { exp.p.clear(); exp.g.clear(); exp.m.clear(); exp.q = ''; search.value = ''; viewExplorar(new URLSearchParams()); };
  $$('[data-f]').forEach(b => b.onclick = () => {
    const [k, v] = b.dataset.f.split(':'); exp[k].has(v) ? exp[k].delete(v) : exp[k].add(v);
    b.setAttribute('aria-pressed', exp[k].has(v)); renderExploreResults();
  });
  renderExploreResults();
}
function renderExploreResults() {
  const box = $('#results'); if (!box) return;
  const q = exp.q.toLowerCase();
  let list = GAMES.filter(g =>
    (!exp.p.size || g.plats.some(p => exp.p.has(p))) &&
    (!exp.g.size || g.genres.some(x => exp.g.has(x))) &&
    (!exp.m.size || g.modes.some(x => exp.m.has(x))) &&
    (!q || (g.name + ' ' + g.genres.join(' ') + ' ' + g.dev + ' ' + g.moods.join(' ')).toLowerCase().includes(q)));
  const by = { meta: (a, b) => (b.meta || 0) - (a.meta || 0), price: (a, b) => (a.price ?? 999) - (b.price ?? 999), off: (a, b) => b.off - a.off, date: (a, b) => (b.date || '').localeCompare(a.date || '') };
  list.sort(by[exp.sort]);
  $('#count').innerHTML = `<b>${list.length}</b> juego${list.length === 1 ? '' : 's'}${q ? ` para “${esc(exp.q)}”` : ''}`;
  box.innerHTML = list.length ? list.map(cardHTML).join('') : `<div class="empty" style="grid-column:1/-1"><h3>Nada con esa combinación</h3><p>Quita algún filtro o prueba otra búsqueda.</p></div>`;
}

/* ---- Centro de demos ---- */
function viewDemos(params) {
  const demos = GAMES.filter(g => g.demo);
  const free = GAMES.filter(g => g.price === 0);
  view.innerHTML = `
  <section class="stage">${stageBg(1145360)}<span class="stage-word" aria-hidden="true">Demos</span><div class="stage-body"><h1 class="page-title" style="margin-top:10px">Pruébalo <em>gratis</em> antes de comprar</h1><p class="lede">Tres formas de probar: jugar en el navegador, bajar la demo oficial de la tienda o (próximamente) en la nube.</p></div></section>
  <section class="demo-hero">
    <div class="arcade" id="arcade">
      <canvas id="cv" width="960" height="600" aria-label="Demo jugable en el navegador"></canvas>
      <div class="arcade-hud" hidden><span>PUNTOS <b data-score>0</b></span><span data-mid></span><span>RÉCORD <b data-hi>0</b></span></div>
      <div class="arcade-ui"></div>
    </div>
    <div class="panel carts-panel">
      
      <h2>Elige un cartucho</h2>
      <p>${window.OGArcade ? window.OGArcade.list.length : 0} juegos originales que corren aquí mismo: cero descargas, cero espera. Tu récord se guarda en este navegador.</p>
      <div class="carts" id="carts"></div>
    </div>
  </section>

  ${telemetryHTML()}

  <section>
    <div class="sec-head"><div><h2>Demos oficiales en Steam</h2><p>${demos.length} juegos con demo gratuita activa hoy. El botón abre la demo en la tienda.</p></div></div>
    <div class="grid">${demos.map(cardHTML).join('')}${free.map(cardHTML).join('')}</div>
  </section>

  <section>
    <div class="sec-head"><div><h2>Cómo funcionan las demos en Overgame</h2></div></div>
    <div class="strat">
      <div class="panel"><span class="ico">${icon('globe')}</span><span class="chip">Activo</span><h3>Web demos HTML5</h3><p>Juegos indie y prototipos exportados en WebGL/WebAssembly corren directo aquí. Carga instantánea, sin descargas ni costo de servidor.</p></div>
      <div class="panel"><span class="ico">${icon('store')}</span><span class="chip">Activo</span><h3>Enlaces a tiendas</h3><p>Botón directo a “Descargar demo” en Steam, PS Store o eShop. Respeta la licencia de cada estudio sin alojar archivos pesados.</p></div>
      <div class="panel"><span class="ico">${icon('cloud')}</span><span class="chip">Próximamente</span><h3>Demos en la nube</h3><p>Pruebas de 10 minutos de juegos AAA vía streaming, sin requisitos de hardware. Requiere acuerdo con un proveedor de cloud gaming.</p><button class="btn btn-purple btn-sm" style="align-self:flex-start" id="cloudBtn">${icon('bell')}Avisarme cuando esté</button></div>
    </div>
  </section>`;
  $('#cloudBtn').onclick = () => toast('Listo: te avisaremos cuando abran las demos en la nube');
  if (window.OGArcade) arcadeStop = OGArcade.mount($('#arcade'), $('#carts'), store, { initial: params && params.get('g'), onEnd: trackPlay });
  runTelemetry(); $('#tRun').onclick = runTelemetry;
}

let arcadeStop = null;

/* ---- Calendario & preventas ---- */
const cal = { month: null, plat: 'all', sel: null };
let cdTimer = 0;
function viewCalendario() {
  const upcoming = GAMES.filter(g => g.date && g.date >= '2026-09-01').sort((a, b) => a.date.localeCompare(b.date));
  const months = [...new Set(upcoming.map(g => g.date.slice(0, 7)))];
  const now = today(); const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (!cal.month || !months.includes(cal.month)) cal.month = months.includes(cur) ? cur : months.at(-1);
  const list = upcoming.filter(g => g.date.startsWith(cal.month) && (cal.plat === 'all' || g.plats.includes(cal.plat)));
  if (!list.some(g => g.id === cal.sel)) cal.sel = (list.find(g => daysTo(g.date) >= 0) || list[0])?.id;
  const mName = m => { const [y, mm] = m.split('-'); const s = MESES[+mm - 1]; return s[0].toUpperCase() + s.slice(1) + ' ' + y; };
  view.innerHTML = `
  <section class="stage">${stageBg(3768760)}<span class="stage-word" aria-hidden="true">Agenda</span><div class="stage-body"><h1 class="page-title" style="margin-top:10px">Línea de tiempo de <em>salidas</em></h1><p class="lede">Fechas reales de Steam. Elige un juego para ver cuánto falta, comparar tiendas y activar una alerta de precio.</p></div></section>
  <div style="display:flex;flex-direction:column;gap:12px">
    <div class="tabs" role="tablist">${months.map(m => `<button class="tab" role="tab" data-month="${m}" aria-selected="${m === cal.month}">${mName(m)}</button>`).join('')}</div>
    <div class="f-opts">${[['all','Todas'], ...Object.entries(PLAT)].map(([k, t]) => `<button class="fchip" data-cp="${k}" aria-pressed="${cal.plat === k}">${t}</button>`).join('')}</div>
  </div>
  <div class="cal">
    <div class="timeline">${list.length ? list.map(g => {
      const d = daysTo(g.date);
      return `<button class="tl" data-sel="${g.id}" aria-current="${g.id === cal.sel}">
        <div class="tl-top"><span class="d">${fmtDate(g.date)}</span><span class="c">${d > 0 ? `${d} días` : d === 0 ? 'Hoy' : 'Disponible'}</span></div>
        <div class="tl-main"><img src="${g.img}" alt="" loading="lazy"><div><b>${esc(g.name)}</b><small>${esc(g.dev)} · ${esc(g.genres[0])}</small>${priceHTML(g)}</div></div>
      </button>`; }).join('') : `<div class="empty">No hay salidas en esta plataforma este mes.</div>`}</div>
    <div id="detail">${cal.sel ? detailHTML(BY_ID.get(cal.sel)) : ''}</div>
  </div>`;
  $$('[data-month]').forEach(b => b.onclick = () => { cal.month = b.dataset.month; cal.sel = null; viewCalendario(); });
  $$('[data-cp]').forEach(b => b.onclick = () => { cal.plat = b.dataset.cp; viewCalendario(); });
  $$('[data-sel]').forEach(b => b.onclick = () => {
    cal.sel = +b.dataset.sel; $$('[data-sel]').forEach(x => x.setAttribute('aria-current', x === b));
    $('#detail').innerHTML = detailHTML(BY_ID.get(cal.sel)); wireDetail();
    if (innerWidth < 980) $('#detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  wireDetail();
}
function detailHTML(g) {
  if (!g) return '';
  const d = daysTo(g.date);
  const { best } = stores(g);
  return `<article class="panel detail">
    <div class="detail-media"><img src="${g.img}" alt=""><video muted loop playsinline style="opacity:0;transition:opacity .8s"></video>
      <div class="tags"><span class="tag mint">${d > 0 ? 'Preventa' : 'Ya disponible'}</span>${g.demo ? '<span class="tag purple">Demo disponible</span>' : ''}</div></div>
    <div class="detail-body">
      <div><span class="meta-line">${esc(g.genres.join(' · '))}</span><h2 style="margin-top:6px">${esc(g.name)}</h2><p style="color:var(--muted);margin-top:8px">${esc(g.desc)}</p></div>
      <div class="facts">
        <div><span>Fecha oficial</span><b>${fmtDate(g.date)}</b></div>
        <div><span>Cuenta regresiva</span><b class="hl">${d > 0 ? `Faltan ${d} días` : d === 0 ? '¡Sale hoy!' : 'Disponible'}</b></div>
        <div><span>Mejor precio</span><b class="hl">${best ? money(best.price) : 'Por anunciar'}</b></div>
      </div>
      ${d > 0 ? `<div class="cd" id="cd" data-date="${g.date}"></div>` : ''}
      <div><div class="sec-head" style="margin-bottom:10px"><h3 style="font-size:18px">Comparativa de tiendas oficiales</h3></div>${storesHTML(g)}
      <p class="note" style="margin-top:8px">Steam: precio real (8 nov 2026). “REF.”: referencia del prototipo. Bonos de reserva: se muestran en la página de cada tienda.</p></div>
      <div class="detail-actions">
        ${g.demo ? `<a class="btn btn-mint" href="${demoUrl(g)}" target="_blank" rel="noopener">${icon('play')}Probar la demo gratis</a>` : ''}
        ${best && best.price != null ? `<a class="btn ${g.demo ? 'btn-ghost' : 'btn-mint'}" href="${best.url}" target="_blank" rel="noopener">${icon('store')}${d > 0 ? 'Pre-ordenar' : 'Comprar'} en ${best.n} (${money(best.price)})</a>`
          : `<a class="btn ${g.demo ? 'btn-ghost' : 'btn-mint'}" href="https://store.steampowered.com/app/${g.id}" target="_blank" rel="noopener">${icon('store')}Añadir a deseados en Steam</a>`}
        <button class="btn btn-purple ${alerts.has(g.id) ? 'on' : ''}" data-alert="${g.id}" data-label aria-pressed="${alerts.has(g.id)}">${icon('bell')}<span>${alerts.has(g.id) ? 'Alerta activa' : 'Activar alerta de precio'}</span></button>
        <button class="btn btn-ghost fav-btn ${favs.has(g.id) ? 'on' : ''}" style="width:46px;height:46px" data-fav="${g.id}" aria-label="Favorito" aria-pressed="${favs.has(g.id)}">${icon('heart')}</button>
      </div>
    </div>
  </article>`;
}
function wireDetail() {
  const g = BY_ID.get(cal.sel); if (!g) return;
  const v = $('#detail video');
  if (v) { v.addEventListener('playing', () => v.style.opacity = 1, { once: true }); loadVideo(v, g); }
  clearInterval(cdTimer);
  const cd = $('#cd'); if (!cd) return;
  const tick = () => {
    const ms = Math.max(0, parseDate(cd.dataset.date) - Date.now());
    const u = [['Días', ms / DAY], ['Horas', ms / 36e5 % 24], ['Min', ms / 6e4 % 60], ['Seg', ms / 1e3 % 60]];
    cd.innerHTML = u.map(([l, n]) => `<div><b>${String(Math.floor(n)).padStart(2, '0')}</b><span>${l}</span></div>`).join('');
  };
  tick(); cdTimer = setInterval(tick, 1000);
}

/* ---- Biblioteca ---- */
function viewBiblioteca() {
  const fl = [...favs].map(id => BY_ID.get(id)).filter(Boolean);
  const al = [...alerts].map(id => BY_ID.get(id)).filter(Boolean);
  const save = fl.reduce((s, g) => s + (g.off && g.base ? g.base - g.price : 0), 0);
  view.innerHTML = `
  <section class="stage">${stageBg(2001120)}<span class="stage-word" aria-hidden="true">Tuyo</span><div class="stage-body"><h1 class="page-title" style="margin-top:10px">Favoritos y <em>alertas</em></h1><p class="lede">Se guarda en este navegador. Toca el corazón en cualquier juego para traerlo aquí.</p></div></section>
  <div class="lib-stats">
    <div class="panel"><span>Favoritos</span><b>${fl.length}</b></div>
    <div class="panel"><span>Alertas de precio</span><b>${al.length}</b></div>
    <div class="panel"><span>Ahorro hoy</span><b>${money(save || 0).replace('Gratis', 'US$0')}</b></div>
  </div>
  <section><div class="sec-head"><h2>Favoritos</h2></div>
    ${fl.length ? `<div class="grid">${fl.map(cardHTML).join('')}</div>` : `<div class="empty"><h3>Todavía no guardas nada</h3><p>Haz el test y guarda lo que te guste.</p><a class="btn btn-mint" href="#/mood">${icon('pulse')}Lanzar Mood Finder</a></div>`}
  </section>
  <section><div class="sec-head"><h2>Alertas de precio</h2></div>
    ${al.length ? `<div class="strip">${al.map(g => `<div class="mini" data-card="${g.id}" tabindex="0" role="button"><img src="${g.img}" alt=""><div><small>${g.off ? `Oferta activa · -${g.off}%` : 'Vigilando precio'}</small><h4>${esc(g.name)}</h4><span>${money(g.price)}</span></div><button class="btn btn-ghost btn-sm on" data-alert="${g.id}" aria-label="Quitar alerta">${icon('bell')}</button></div>`).join('')}</div>`
      : `<div class="empty"><h3>Sin alertas</h3><p>Activa una desde el calendario o la ficha de un juego.</p><a class="btn btn-ghost" href="#/calendario">${icon('cal')}Ir al calendario</a></div>`}
  </section>`;
}

/* ---------- menú de inicio inmersivo ---------- */
const MENU = [
  { r:'panel',      t:'Mi panel',    d:'Tu nivel, desafíos, logros y lo que dejaste a medias.',        g:1145360 },
  { r:'inicio',     t:'Descubrir',   d:'Lo destacado, lo que sale esta semana y las ofertas de hoy.', g:1903340 },
  { r:'mood',       t:'Mood Finder', d:'Cuatro preguntas y tres juegos para cómo te sientes hoy.',    g:1145350 },
  { r:'explorar',   t:'Explorar',    d:'Todo el catálogo, con filtros por dispositivo, género y modo.', g:1245620 },
  { r:'demos',      t:'Demos',       d:'Juega en el navegador o baja la demo oficial gratis.',        g:2198150 },
  { r:'calendario', t:'Calendario',  d:'Fechas de salida, cuenta regresiva y preventas.',             g:3768760 },
  { r:'biblioteca', t:'Biblioteca',  d:'Tus favoritos y alertas de precio.',                          g:2001120 },
];
const intro = { el: null, i: 0, t: 0, front: 0 };
function showIntro() {
  if (intro.el) return;
  closePeek(true); closeModal();
  const cur = route().name;
  intro.i = Math.max(0, MENU.findIndex(m => m.r === cur));
  const nDemos = GAMES.filter(g => g.demo).length;
  const now = today(); const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const nMonth = GAMES.filter(g => g.date && g.date.startsWith(ym)).length;
  const el = document.createElement('div');
  el.className = 'intro';
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Menú principal de Overgame');
  el.innerHTML = `
    <div class="intro-bg"><img alt=""><img alt=""><video muted loop playsinline></video><video muted loop playsinline></video></div>
    <div class="intro-shade"></div>
    <header class="intro-top" style="--i:0">
      <span class="brand"><span class="brand-mark"><img src="assets/og-mark.png" alt="" width="597" height="284"></span><span class="brand-text"><img class="brand-word" src="assets/og-word.png" alt="Overgame · Juega, descubre, compra"></span></span>
      <button class="intro-skip" data-go="${MENU[intro.i].r}">Entrar ${icon('arrow')}</button>
    </header>
    <div class="intro-main">
            <h1 class="intro-slogan" style="--i:2">Encuentra qué jugar <em>según cómo te sientes.</em></h1>
      <nav class="intro-menu" aria-label="Secciones">
        <i class="intro-bar" aria-hidden="true"></i>
        ${MENU.map((m, k) => `<button class="im" data-go="${m.r}" data-k="${k}" style="--i:${k + 3}"><span class="im-t">${m.t}</span><span class="im-d"><span>${m.d}</span></span></button>`).join('')}
      </nav>
    </div>
    <aside class="intro-card" style="--i:9"><img alt=""><div><small>En pantalla</small><b></b><span></span></div></aside>
    <footer class="intro-foot" style="--i:10">
      <span><b>${GAMES.length}</b> juegos · <b>${nDemos}</b> demos gratis · <b>${nMonth}</b> salidas este mes</span>
      <span class="intro-keys"><kbd>↑</kbd><kbd>↓</kbd> navegar · <kbd>Enter</kbd> entrar</span>
    </footer>`;
  document.body.appendChild(el);
  document.body.style.overflow = 'hidden';
  intro.el = el; intro.front = 0;
  $$('.im', el).forEach(b => {
    b.addEventListener('mouseenter', () => { b.focus({ preventScroll: true }); setIntro(+b.dataset.k); });
    b.addEventListener('focus', () => setIntro(+b.dataset.k));
  });
  el.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) leaveIntro(b.dataset.go); });
  setIntro(intro.i, true);
  requestAnimationFrame(() => el.classList.add('enter'));
  setTimeout(() => $$('.im', el)[intro.i]?.focus({ preventScroll: true }), 50);
}
function setIntro(k, first) {
  const el = intro.el; if (!el) return;
  const changed = k !== intro.i;
  intro.i = k;
  const items = $$('.im', el);
  items.forEach((b, j) => b.classList.toggle('on', j === k));
  const on = items[k];
  const bar = $('.intro-bar', el);
  const place = () => { const t = on.querySelector('.im-t'); bar.style.transform = `translateY(${t.offsetTop}px)`; bar.style.height = t.offsetHeight + 'px'; };
  place(); clearTimeout(intro.bt); intro.bt = setTimeout(place, 600);
  $('.intro-skip', el).dataset.go = MENU[k].r;
  if (!changed && !first) return;
  clearTimeout(intro.t);
  intro.t = setTimeout(() => swapIntroBg(BY_ID.get(MENU[k].g)), first ? 0 : 160);
}
function swapIntroBg(g) {
  const el = intro.el; if (!el || !g) return;
  const imgs = $$('.intro-bg img', el), vids = $$('.intro-bg video', el);
  const n = intro.front ^ 1; intro.front = n;
  const img = imgs[n], v = vids[n];
  img.src = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${g.id}/library_hero.jpg`;
  img.onerror = () => { img.onerror = null; img.src = g.img; };
  imgs.forEach((x, j) => x.classList.toggle('show', j === n));
  vids.forEach((x, j) => { if (j !== n) { x.classList.remove('show'); setTimeout(() => { if (!x.classList.contains('show')) unloadVideo(x); }, 900); } });
  v.onplaying = () => { if (intro.front === n) v.classList.add('show'); };
  if (!REDUCED) loadVideo(v, g);
  const c = $('.intro-card', el);
  c.classList.remove('swap'); c.offsetWidth; c.classList.add('swap');
  $('img', c).src = g.img; $('b', c).textContent = g.name; $('span', c).textContent = g.genres.join(' · ');
}
function leaveIntro(r) {
  const el = intro.el; if (!el || el.classList.contains('leave')) return;
  el.classList.add('leave');
  const target = '#/' + r;
  if (location.hash === target) render(); else location.hash = target;
  setTimeout(() => {
    $$('video', el).forEach(unloadVideo);
    el.remove(); intro.el = null;
    document.body.style.overflow = '';
    $('#view').focus({ preventScroll: true });
  }, REDUCED ? 0 : 700);
}
document.addEventListener('keydown', e => {
  if (!intro.el) { if (e.key.toLowerCase() === 'm' && document.activeElement.id !== 'cv' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !e.metaKey && !e.ctrlKey && modal.hidden) showIntro(); return; }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const k = (intro.i + (e.key === 'ArrowDown' ? 1 : -1) + MENU.length) % MENU.length;
    $$('.im', intro.el)[k].focus();
  } else if (e.key === 'Escape') leaveIntro(MENU[intro.i].r);
}, true);
$$('[data-menu]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); showIntro(); }));

/* menú lateral: barra de íconos que se abre solo cuando tú quieras */
/* dos versiones del menú lateral: integrado (empuja el contenido) o flotante (encima de la página) */
let menuMode = new URLSearchParams(location.search).get('menu') === 'flotante' ? 'float' : 'dock';
function setMenuMode(m) {
  menuMode = m === 'float' ? 'float' : 'dock';
  document.body.classList.toggle('menu-dock', menuMode === 'dock'); document.body.classList.toggle('menu-float', menuMode === 'float');
  $$('[data-menu-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.menuMode === menuMode));
  setTimeout(() => { moveNavIndicator(); dispatchEvent(new Event('resize')); }, 560);
}
setMenuMode(menuMode);
function setSide(open) {
  document.body.classList.toggle('side-open', open);
  $$('[data-side-toggle]').forEach(b => { b.setAttribute('aria-expanded', open); b.setAttribute('aria-label', open ? 'Cerrar menú lateral' : 'Abrir menú lateral'); });
  if (open) setTimeout(() => $('.nav a.active, .nav a')?.focus({ preventScroll: true }), 60);
  moveNavIndicator(); setTimeout(moveNavIndicator, 120); setTimeout(moveNavIndicator, 560);
  setTimeout(() => dispatchEvent(new Event('resize')), 560);
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-side-toggle]')) return setSide(!document.body.classList.contains('side-open'));
  if (e.target.closest('[data-side-close]') || (e.target.closest('.sidebar a') && document.body.classList.contains('side-open') && (matchMedia('(max-width:860px)').matches || menuMode === 'float'))) setSide(false);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('side-open')) setSide(false); });

/* menú cerrado: al pasar el cursor (o con Tab) por un ícono, un globo dice a dónde lleva */
const RAIL_TIPS = {
  panel: ['Mi panel', 'Tu nivel, desafíos, logros y lo que dejaste a medias'],
  inicio: ['Inicio / Descubrir', 'Lo destacado, lo que sale esta semana y las ofertas'],
  mood: ['Game Mood Finder', 'Cuatro preguntas y tres juegos para cómo te sientes'],
  explorar: ['Explorar catálogo', 'Todo el catálogo con filtros por dispositivo, género y modo'],
  demos: ['Centro de Demos', 'Juega en el navegador o baja la demo oficial gratis'],
  calendario: ['Calendario & Preventas', 'Fechas de salida, cuenta regresiva y precios por tienda'],
  biblioteca: ['Biblioteca / Favoritos', 'Tus favoritos y alertas de precio'],
  admin: ['Admin', 'Agrega juegos con su tráiler y links de tiendas'],
};
const railTip = document.createElement('div');
railTip.className = 'rail-tip'; railTip.setAttribute('role', 'tooltip'); railTip.id = 'railTip';
document.body.appendChild(railTip);
function tipFor(el) {
  if (el.matches('.menu-btn')) return ['Menú principal', 'Pantalla de bienvenida con todas las secciones (tecla M)'];
  if (el.matches('.side-toggle')) return ['Abrir menú', 'Muestra los nombres de cada sección'];
  if (el.matches('.brand')) return ['Overgame', 'Volver al menú principal'];
  return RAIL_TIPS[el.dataset.route] || null;
}
function showRailTip(el) {
  if (document.body.classList.contains('side-open') || matchMedia('(max-width:860px)').matches) return hideRailTip();
  const t = tipFor(el); if (!t) return hideRailTip();
  railTip.innerHTML = `<b>${esc(t[0])}</b><span>${esc(t[1])}</span>`;
  const r = el.getBoundingClientRect();
  railTip.style.top = Math.round(r.top + r.height / 2) + 'px';
  railTip.classList.add('show'); el.setAttribute('aria-describedby', 'railTip');
}
function hideRailTip() { railTip.classList.remove('show'); }
const railSel = '.sidebar .nav a, .sidebar .admin-link, .sidebar .menu-btn, .sidebar .side-toggle, .sidebar .brand';
document.addEventListener('mouseover', e => { const el = e.target.closest(railSel); if (el) showRailTip(el); });
document.addEventListener('mouseout', e => { const el = e.target.closest(railSel); if (el && !el.contains(e.relatedTarget)) hideRailTip(); });
document.addEventListener('focusin', e => { const el = e.target.closest(railSel); el && el.matches(':focus-visible') ? showRailTip(el) : hideRailTip(); });
document.addEventListener('click', hideRailTip, true);
$('.side-body')?.addEventListener('scroll', hideRailTip, { passive: true });

/* indicador deslizante del menú lateral */
function moveNavIndicator() {
  const ind = $('.nav-ind'), a = $('.nav a.active');
  if (!ind) return;
  if (!a) { ind.style.opacity = 0; return; }
  ind.style.opacity = 1;
  ind.style.transform = `translateY(${a.offsetTop}px)`;
  ind.style.height = a.offsetHeight + 'px';
}

/* ---------- estadísticas reales del jugador (en este navegador) ---------- */
const stats = Object.assign({ views: 0, viewed: [], moods: 0, plays: {}, time: 0, last: null, tag: 'Jugador' }, store.get('stats', {}));
const saveStats = () => store.set('stats', stats);
function trackView(id) { stats.views++; stats.viewed = [id, ...stats.viewed.filter(x => x !== id)].slice(0, 12); saveStats(); }
function trackPlay(id, score, secs) { stats.plays[id] = (stats.plays[id] || 0) + 1; stats.time += secs; stats.last = id; saveStats(); }
const ACH = [
  { k:'look',   t:'Primera mirada',    d:'Abre la ficha de un juego',          ic:'play',    ok: () => stats.views >= 1 },
  { k:'tuned',  t:'Sintonizado',       d:'Completa el Mood Finder',            ic:'pulse',   ok: () => stats.moods >= 1 },
  { k:'coll',   t:'Coleccionista',     d:'Guarda 5 favoritos',                 ic:'heart',   ok: () => favs.size >= 5 },
  { k:'arcade', t:'Rata de arcade',    d:'Juega los 5 cartuchos web',          ic:'pad',     ok: () => Object.keys(stats.plays).length >= 5 },
  { k:'neon',   t:'Reflejos de neón',  d:'Pasa 500 puntos en Neon Drift',      ic:'bolt',    ok: () => store.get('hi.drift', 0) >= 500 },
  { k:'watch',  t:'Vigía de precios',  d:'Activa 3 alertas de precio',         ic:'bell',    ok: () => alerts.size >= 3 },
];
function profile() {
  const plays = Object.values(stats.plays).reduce((a, b) => a + b, 0);
  const got = ACH.filter(a => a.ok()).length;
  const xp = stats.views * 10 + stats.moods * 50 + plays * 20 + favs.size * 15 + alerts.size * 10 + got * 100;
  const best = Math.max(0, ...((window.OGArcade?.list || []).map(g => store.get('hi.' + g.id, 0))));
  return { plays, got, xp, level: 1 + Math.floor(xp / 300), into: xp % 300, best };
}
const fmtTime = s => s < 60 ? `${Math.round(s)}s` : s < 3600 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${Math.floor(s / 3600)}h ${Math.floor(s % 3600 / 60)}m`;

/* ---- Mi panel ---- */
function viewPanel() {
  const P = profile();
  const cont = BY_ID.get(stats.viewed[0]) || BY_ID.get(FEATURED);
  const coll = [...favs].map(id => BY_ID.get(id)).filter(Boolean);
  const collList = (coll.length ? coll : GAMES.filter(released).sort((a, b) => (b.meta || 0) - (a.meta || 0)).slice(0, 4)).slice(0, 4);
  const lastDemo = window.OGArcade?.list.find(g => g.id === stats.last);
  const pct = Math.round(P.got / ACH.length * 100);
  const CH = [
    { t:'Explorador',    d:'Abre 10 fichas de juegos', ic:'compass', v: stats.views, n: 10 },
    { t:'Sintonizador',  d:'Completa 3 Mood Finder',   ic:'pulse',   v: stats.moods, n: 3 },
    { t:'Arcade total',  d:'Juega los 5 cartuchos',    ic:'pad',     v: Object.keys(stats.plays).length, n: 5 },
    { t:'Coleccionista', d:'Guarda 5 favoritos',       ic:'heart',   v: favs.size, n: 5 },
  ];
  const ini = (stats.tag || 'J').trim().slice(0, 2).toUpperCase();
  view.innerHTML = `
  <section class="stage dash-head">${stageBg(cont.id)}<span class="stage-word" aria-hidden="true">Panel</span>
    <div class="stage-body">
      
      <h1 class="page-title" style="margin-top:10px"><span class="tag-edit" contenteditable="true" spellcheck="false" id="gtag" aria-label="Tu nombre de jugador">${esc(stats.tag)}</span> <em class="lvl-badge">Nivel ${P.level}</em></h1>
      <div class="xp"><div class="meter"><i style="width:${P.into / 3}%"></i></div><span>${P.into} / 300 XP para el nivel ${P.level + 1}</span></div>
    </div>
  </section>

  <div class="dash">
    <article class="panel d-hero" data-open="${cont.id}">
      <div class="d-hero-media"><img src="https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${cont.id}/library_hero.jpg" alt="" onerror="this.onerror=null;this.src='${cont.img}'"></div>
      <div class="d-hero-body">
        <span class="tag mint">${stats.viewed.length ? 'Continúa donde ibas' : 'Destacado'}</span>
        <h2>${esc(cont.name)}</h2>
        <p>${esc(cont.genres.join(' · '))} · ${cont.plats.map(p => PLAT[p]).join(' / ')}</p>
        <div class="hero-actions">
          ${cont.demo ? `<a class="btn btn-mint btn-sm" href="https://store.steampowered.com/app/${cont.demo}" target="_blank" rel="noopener">${icon('play')}Probar demo</a>` : `<button class="btn btn-mint btn-sm" data-open="${cont.id}">${icon('play')}Ver tráiler</button>`}
          <button class="btn btn-ghost btn-sm fav-btn ${favs.has(cont.id) ? 'on' : ''}" data-fav="${cont.id}" aria-label="Favorito" aria-pressed="${favs.has(cont.id)}">${icon('heart')}</button>
        </div>
      </div>
    </article>

    <article class="panel d-ring">
      <span class="meta-line">Progreso de temporada</span>
      <div class="ring-wrap"><div class="ring" style="--p:${pct}"></div><b class="ringv">${pct}%</b></div>
      <div class="ring-meta"><div><span>Logros</span><b>${P.got} / ${ACH.length}</b></div><div><span>Tiempo en demos</span><b>${fmtTime(stats.time)}</b></div></div>
    </article>

    <article class="panel d-coll">
      <div class="d-title"><h3>${coll.length ? 'Mi colección' : 'Empieza tu colección'}</h3><a class="link" href="#/biblioteca">Ver todo ${icon('arrow')}</a></div>
      ${collList.map(g => `<div class="coll-row" data-card="${g.id}" tabindex="0" role="button"><img src="${g.img}" alt=""><div><b>${esc(g.name)}</b><small>${g.soon ? `Sale en ${daysTo(g.date)} días` : g.off ? `En oferta · -${g.off}%` : g.demo ? 'Demo disponible' : esc(g.genres[0])}</small><div class="meter"><i style="width:${g.meta || 60}%"></i></div></div><span class="coll-sc">${g.meta ? '★ ' + g.meta : ''}</span></div>`).join('')}
      ${coll.length ? '' : '<p class="note">Toca el corazón en cualquier juego para traerlo aquí.</p>'}
    </article>

    <article class="panel d-chal">
      <div class="d-title"><h3>Desafíos activos</h3><span class="note">Se actualizan con lo que haces</span></div>
      <div class="chal-grid">${CH.map(c => { const done = c.v >= c.n; return `
        <div class="chal ${done ? 'done' : ''}"><span class="hex">${icon(c.ic)}</span><b>${c.t}</b><small>${c.d}</small>
          <div class="meter"><i style="width:${Math.min(100, c.v / c.n * 100)}%"></i></div><span class="chal-n">${Math.min(c.v, c.n)} / ${c.n}${done ? ' · listo' : ''}</span></div>`; }).join('')}</div>
    </article>

    <article class="panel d-prof">
      <div class="d-title"><h3>Perfil de jugador</h3><span class="tag outline-mint">Esta sesión y anteriores</span></div>
      <div class="prof">
        <div class="avatar"><span>${esc(ini)}</span></div>
        <div><b class="prof-name">${esc(stats.tag)}</b><small>Nivel ${P.level} · ${P.xp} XP</small></div>
      </div>
      <div class="prof-stats">
        <div><b>${fmtTime(stats.time)}</b><span>Jugado</span></div>
        <div><b>${P.plays}</b><span>Partidas</span></div>
        <div><b>${stats.views}</b><span>Fichas vistas</span></div>
        <div><b>${P.best}</b><span>Mejor puntaje</span></div>
      </div>
    </article>

    <article class="panel d-play">
      <div class="d-title"><h3>Sigue jugando</h3><a class="link" href="#/demos">Centro de demos ${icon('arrow')}</a></div>
      ${lastDemo ? `<div class="cont-play"><span class="hex big">${icon('pad')}</span><div><b>${lastDemo.t}</b><small>${lastDemo.k}</small><div class="meter"><i style="width:${Math.min(100, store.get('hi.' + lastDemo.id, 0) / 10)}%"></i></div><small>Récord ${store.get('hi.' + lastDemo.id, 0)} · ${stats.plays[lastDemo.id]} partida${stats.plays[lastDemo.id] > 1 ? 's' : ''}</small></div><a class="btn btn-mint btn-sm" href="#/demos?g=${lastDemo.id}">${icon('play')}Jugar</a></div>`
        : `<div class="cont-play"><span class="hex big">${icon('pad')}</span><div><b>Aún no juegas ninguna demo web</b><small>5 juegos originales te esperan, sin descargas.</small></div><a class="btn btn-mint btn-sm" href="#/demos">${icon('play')}Empezar</a></div>`}
    </article>

    <article class="panel d-ach">
      <div class="d-title"><h3>Logros</h3><span class="note">${P.got} desbloqueados</span></div>
      <div class="ach-grid">${ACH.map(a => `<div class="ach ${a.ok() ? 'on' : ''}" title="${a.d}"><span class="hex">${icon(a.ic)}</span><b>${a.t}</b><small>${a.ok() ? 'Desbloqueado' : a.d}</small></div>`).join('')}</div>
    </article>
  </div>`;
  const tag = $('#gtag');
  tag.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); tag.blur(); } });
  tag.addEventListener('blur', () => { stats.tag = tag.textContent.trim().slice(0, 18) || 'Jugador'; saveStats(); tag.textContent = stats.tag; $('.prof-name').textContent = stats.tag; $('.avatar span').textContent = stats.tag.slice(0, 2).toUpperCase(); });
}

/* ---- Diagnóstico real del navegador y la red ---- */
function telemetryHTML() {
  return `<section class="panel telem" id="telem">
    <div class="telem-info">
      
      <h2>Speed &amp; Streaming Test del sistema</h2>
      <p>Revisa si tu navegador soporta las tecnologías de las demos web y si tu conexión aguanta streaming en la nube a 1080p. Se mide de verdad contra los servidores de video de Steam.</p>
      <div class="feats" id="feats"><span class="feat">Revisando…</span></div>
    </div>
    <div class="telem-card">
      <div class="d-title"><h3>Overgame Telemetry Hook</h3><span class="tag outline-mint" id="tState">Midiendo</span></div>
      <div class="kv">
        <div><span>Latencia ping</span><b id="tPing">—</b><small id="tJit">&nbsp;</small></div>
        <div><span>Ancho de banda</span><b id="tBw" style="color:var(--gray)">—</b><small id="tVer" style="color:var(--purple)">&nbsp;</small></div>
      </div>
      <svg class="spark" id="tSpark" viewBox="0 0 300 60" preserveAspectRatio="none" aria-label="Gráfica de latencia"><polyline points="" /></svg>
      <button class="btn btn-ghost" id="tRun">${icon('pulse')}Volver a calibrar latencia</button>
    </div>
  </section>`;
}
async function runTelemetry() {
  const st = $('#tState'); if (!st) return;
  const btn = $('#tRun'); btn.disabled = true; st.textContent = 'Midiendo';
  // capacidades
  const simd = (() => { try { return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11])); } catch { return false; } })();
  let rtc = false; try { const pc = new RTCPeerConnection(); pc.createDataChannel('og'); pc.close(); rtc = true; } catch {}
  let gpu = false; try { gpu = !!(navigator.gpu && await navigator.gpu.requestAdapter()); } catch {}
  const thr = typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated;
  const f = (n, ok, on = 'Activo', off = 'No disponible', purple) => `<span class="feat ${ok ? '' : 'off'} ${purple ? 'p' : ''}"><i></i>${n}: <b>${ok ? on : off}</b></span>`;
  const feats = $('#feats');
  if (feats) feats.innerHTML = f('WebAssembly SIMD', simd, 'Habilitado') + f('WebRTC DataChannels', rtc, 'OK') + f('WebGPU', gpu, 'Activo', 'No disponible', true) + f('WASM Threads', thr, 'Activo', 'Requiere aislamiento');
  // latencia y ancho de banda (CORS abierto en el CDN de video de Steam)
  const g = BY_ID.get(4115450) || GAMES.find(x => x.hls);
  const base = g.hls.split('?')[0].replace(/[^/]+$/, '');
  const samples = [];
  const spark = () => { const pl = $('#tSpark polyline'); if (!pl || !samples.length) return; const mx = Math.max(...samples) * 1.2, mn = Math.min(...samples) * .8;
    pl.setAttribute('points', samples.map((v, i) => `${(i / Math.max(1, samples.length - 1)) * 300},${55 - (v - mn) / (mx - mn || 1) * 50}`).join(' ')); };
  try {
    for (let i = 0; i < 9; i++) {
      const t0 = performance.now();
      await fetch(base + 'hls_264_2_video.m3u8?og=' + Math.random(), { cache: 'no-store', mode: 'cors' }).then(r => r.text());
      const ms = performance.now() - t0; if (i) { samples.push(ms); spark(); }
      if (!$('#tPing')) return;
    }
    const sorted = [...samples].sort((a, b) => a - b), med = sorted[Math.floor(sorted.length / 2)];
    const jit = samples.slice(1).reduce((s, v, i) => s + Math.abs(v - samples[i]), 0) / (samples.length - 1);
    $('#tPing').innerHTML = `${Math.round(med)}<small> ms</small>`; $('#tJit').textContent = `± ${jit.toFixed(1)} ms de jitter`;
    let bytes = 0; const t0 = performance.now();
    for (let i = 1; i <= 3; i++) { const r = await fetch(`${base}dash_h264/chunk-stream0-0000${i}.m4s?og=${Math.random()}`, { cache: 'no-store', mode: 'cors' }); bytes += (await r.arrayBuffer()).byteLength; }
    const mbps = bytes * 8 / ((performance.now() - t0) / 1000) / 1e6;
    if (!$('#tBw')) return;
    $('#tBw').innerHTML = `${mbps >= 100 ? Math.round(mbps) : mbps.toFixed(1)}<small> Mbps</small>`;
    $('#tVer').textContent = mbps >= 25 ? 'Soporta 4K HDR' : mbps >= 8 ? 'Soporta 1080p fluido' : mbps >= 4 ? 'Alcanza para 720p' : 'Conexión justa para streaming';
    st.textContent = 'Listo';
  } catch { st.textContent = 'Sin conexión'; $('#tPing') && ($('#tPing').textContent = '—'); }
  btn.disabled = false;
}

/* ---------- inmersión: escenario por página, luz ambiental, revelado ---------- */
const MOOD_STAGE = { adrenalina:782330, relax:2198150, historia:1086940, rapido:2379780 };
const stageBg = id => `<div class="stage-bg" data-g="${id}"><img src="https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/library_hero.jpg" alt="" onerror="this.onerror=null;this.src='${BY_ID.get(id)?.img || ''}'"><video muted loop playsinline></video></div>`;
let lastStage = null;
function initStages() {
  const ph = $('.stage-bg', view); if (!ph || ph === lastStage) return;
  if (lastStage && !lastStage.isConnected && lastStage.dataset.g === ph.dataset.g) {
    ph.replaceWith(lastStage);
    const v = $('video', lastStage);
    if (!v.src && !v._hls) { v.classList.remove('show'); v.addEventListener('playing', () => v.classList.add('show'), { once: true }); loadVideo(v, BY_ID.get(+lastStage.dataset.g)); }
    else v.play().catch(() => {});
    return;
  }
  if (lastStage && !lastStage.isConnected) unloadVideo($('video', lastStage));
  lastStage = ph;
  const g = BY_ID.get(+ph.dataset.g); setAmbient(g);
  const v = $('video', ph);
  v.addEventListener('playing', () => v.classList.add('show'), { once: true });
  if (!REDUCED && g) loadVideo(v, g);
}
const amb = document.createElement('div'); amb.className = 'ambient'; amb.setAttribute('aria-hidden', 'true');
amb.innerHTML = '<img alt=""><img alt="">'; document.body.prepend(amb);
let ambFront = 0, ambId = 0, ambT = 0;
function setAmbient(g) {
  if (!g || g.id === ambId) return; ambId = g.id;
  const n = ambFront ^= 1, imgs = amb.children, im = imgs[n];
  im.onload = () => { if (ambFront === n) { im.classList.add('show'); imgs[n ^ 1].classList.remove('show'); } };
  im.src = g.img;
}
document.addEventListener('mouseover', e => { const c = e.target.closest('[data-card]'); if (!c) return; clearTimeout(ambT); ambT = setTimeout(() => setAmbient(BY_ID.get(+c.dataset.card)), 220); });
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; const el = e.target; el.style.setProperty('--rd', (el._rd || 0) + 'ms'); el.classList.add('rv-in'); io.unobserve(el);
}), { rootMargin: '0px 0px -5% 0px' }) : null;
function prepReveal() {
  if (REDUCED || !io) return;
  $$('.card,.mini,.tl,.strat .panel,.lib-stats .panel,.cart', view).forEach(el => {
    if (el._rv) return; el._rv = 1;
    el._rd = ([...el.parentElement.children].indexOf(el) % 4) * 70;
    el.classList.add('rv'); io.observe(el);
  });
}
new MutationObserver(() => { initStages(); prepReveal(); }).observe(view, { childList: true, subtree: true });
if (FINE) document.addEventListener('pointermove', e => {
  const el = e.target.closest && e.target.closest('.card,.panel,.tl,.result,.mood,.opt'); if (!el) return;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
}, { passive: true });

/* ---------- router ---------- */
/* ---------- admin: agregar juegos propios (se guardan en este navegador) ---------- */
const ADM_PLATS = [['pc','PC'],['ps5','PS5'],['xbox','Xbox'],['switch','Switch'],['mobile','Móvil']];
const ADM_MOODS = [['adrenalina','Adrenalina'],['historia','Historia'],['relax','Relajarme'],['rapido','Ratos cortos']];
let admEdit = null, admDel = null;
function saveCustom() { store.set('custom', CUSTOM); }
function videoKind(u) {
  if (!u) return null;
  if (/youtu\.?be/.test(u)) return 'yt';
  if (/\.m3u8(\?|$)/i.test(u)) return 'hls';
  return 'file';
}
function applyVideo(g, u) {
  delete g.mt; delete g.mp4; delete g.hls; g.video = u || '';
  const k = videoKind(u);
  if (k === 'hls') g.hls = u; else if (k === 'file') { g.mt = u; g.mp4 = u; }
}
function viewAdmin() {
  const g = admEdit ? CUSTOM.find(x => x.id === admEdit) : null;
  const v = (k, d = '') => esc(g ? (g[k] ?? d) : d);
  const has = (k, x) => g ? g[k].includes(x) : false;
  const box = (name, opts, key, def) => opts.map(([k, t]) => `<label class="adm-chk"><input type="checkbox" name="${name}" value="${esc(k)}" ${(g ? has(key, k) : def === k) ? 'checked' : ''}><span>${esc(t)}</span></label>`).join('');
  view.innerHTML = `
  <section class="adm">
    <div class="sec-head"><div><h1 class="adm-h">Admin · Catálogo</h1><p>Agrega juegos con su tráiler y los links de cada tienda. Se guardan en este navegador; usa Exportar para pasarlos a otro equipo.</p></div>
      <div class="adm-io"><button class="btn btn-ghost btn-sm" id="admExport">Exportar JSON</button><label class="btn btn-ghost btn-sm">Importar<input type="file" id="admImport" accept="application/json" hidden></label></div></div>
    <div class="adm-grid">
      <form class="adm-form" id="admForm" novalidate>
        <fieldset><legend>${g ? 'Editando: ' + esc(g.name) : 'Juego nuevo'}</legend>
          <label class="f">Nombre *<input name="name" required maxlength="80" value="${v('name')}"></label>
          <label class="f">Estudio<input name="dev" maxlength="60" value="${v('dev')}"></label>
          <label class="f full">Descripción<textarea name="desc" rows="3" maxlength="600">${v('desc')}</textarea></label>
          <label class="f full">Imagen de portada (URL) *<input name="img" type="url" required placeholder="https://…/portada.jpg" value="${v('img')}"></label>
          <label class="f full">Video / tráiler (URL)<input name="video" type="url" placeholder=".mp4, .webm, .m3u8 o YouTube" value="${v('video')}"><small class="hint" id="vidHint"></small></label>
          <label class="f">Fecha de lanzamiento<input name="date" type="date" value="${v('date')}"></label>
          <label class="f">Precio US$ <small>(vacío = por anunciar · 0 = gratis)</small><input name="base" type="number" min="0" step="0.01" value="${g && g.base != null ? g.base : ''}"></label>
          <label class="f">Descuento %<input name="off" type="number" min="0" max="100" value="${v('off', 0)}"></label>
          <label class="f">Metacritic<input name="meta" type="number" min="0" max="100" value="${g && g.meta ? g.meta : ''}"></label>
          <label class="f">Exigencia<select name="level">${[1,2,3].map(n => `<option value="${n}" ${(g ? g.level : 2) === n ? 'selected' : ''}>${LEVEL[n]}</option>`).join('')}</select></label>
          <label class="f">Géneros <small>(separados por coma)</small><input name="genres" list="admGenres" value="${g ? esc(g.genres.join(', ')) : ''}" placeholder="RPG, Acción"><datalist id="admGenres">${GENRES.map(x => `<option value="${esc(x)}">`).join('')}</datalist></label>
        </fieldset>
        <fieldset><legend>Plataformas</legend><div class="adm-chks">${box('plats', ADM_PLATS, 'plats', 'pc')}</div></fieldset>
        <fieldset><legend>Modo de juego</legend><div class="adm-chks">${box('modes', Object.entries(MODE), 'modes', 'solo')}</div></fieldset>
        <fieldset><legend>Ánimo (Mood Finder)</legend><div class="adm-chks">${box('moods', ADM_MOODS, 'moods', 'adrenalina')}</div></fieldset>
        <fieldset><legend>Links</legend>
          ${STORE_KEYS.map(([k, n]) => `<label class="f">${esc(n)}<input name="l_${k}" type="url" placeholder="https://" value="${esc(g?.links?.[k] || '')}"></label>`).join('')}
          <label class="f full">Demo jugable / descarga de demo<input name="demo" type="url" placeholder="https://" value="${esc(g && /^http/.test(String(g.demo)) ? g.demo : '')}"></label>
        </fieldset>
        <p class="adm-err" id="admErr" role="alert"></p>
        <div class="adm-actions"><button class="btn btn-mint" type="submit">${icon('check')}${g ? 'Guardar cambios' : 'Agregar al catálogo'}</button>${g ? '<button class="btn btn-ghost" type="button" id="admCancel">Cancelar</button>' : ''}</div>
      </form>
      <aside class="adm-side">
        <div class="adm-prev"><div class="adm-media"><img id="pvImg" alt="" src="${v('img')}"><video id="pvVid" muted loop playsinline></video></div>
          <div class="adm-prev-b"><b id="pvName">${v('name') || 'Vista previa'}</b><small id="pvMeta">${g ? esc(g.genres.join(' · ')) : 'Así se verá la tarjeta'}</small></div></div>
        <h3 class="adm-sub">Tus juegos (${CUSTOM.length})</h3>
        <div class="adm-list">${CUSTOM.length ? CUSTOM.map(x => `
          <div class="adm-row ${x.id === admEdit ? 'on' : ''}"><img src="${esc(x.img)}" alt="" loading="lazy"><div><b>${esc(x.name)}</b><small>${esc(x.genres.join(' · ') || 'Sin género')} · ${fmtDate(x.date)}</small></div>
            <button class="icon-btn" data-adm-open="${x.id}" title="Ver ficha" aria-label="Ver ficha de ${esc(x.name)}">${icon('arrow')}</button>
            <button class="icon-btn" data-adm-edit="${x.id}" title="Editar" aria-label="Editar ${esc(x.name)}">${icon('edit')}</button>
            <button class="icon-btn ${admDel === x.id ? 'danger' : ''}" data-adm-del="${x.id}" title="${admDel === x.id ? 'Toca otra vez para borrar' : 'Borrar'}" aria-label="Borrar ${esc(x.name)}">${admDel === x.id ? '¿Sí?' : icon('x')}</button></div>`).join('')
          : '<p class="adm-empty">Todavía no has agregado juegos. Lo que agregues aparece en Inicio, Explorar, Mood Finder, Calendario y Demos.</p>'}</div>
      </aside>
    </div>
  </section>`;
  const f = $('#admForm'), pv = $('#pvVid'), hint = $('#vidHint');
  const preview = () => {
    $('#pvImg').src = f.img.value || ''; $('#pvName').textContent = f.name.value || 'Vista previa';
    $('#pvMeta').textContent = f.genres.value || 'Así se verá la tarjeta';
    const u = f.video.value.trim(), k = videoKind(u);
    hint.textContent = k === 'yt' ? 'YouTube no se puede reproducir al pasar el mouse: se mostrará como botón "Ver tráiler". Para el efecto hover usa un .mp4, .webm o .m3u8.' : '';
    const tmp = {}; applyVideo(tmp, u);
    if (pv.dataset.u !== u) { pv.dataset.u = u; pv.classList.remove('show'); if (k && k !== 'yt') { pv.addEventListener('playing', () => pv.classList.add('show'), { once: true }); loadVideo(pv, tmp); } else unloadVideo(pv); }
  };
  f.addEventListener('input', () => { clearTimeout(f._t); f._t = setTimeout(preview, 350); });
  preview();
  f.addEventListener('submit', e => {
    e.preventDefault(); clearTimeout(f._t);
    const fd = new FormData(f), err = $('#admErr');
    const name = fd.get('name').trim(), img = fd.get('img').trim();
    const plats = fd.getAll('plats'), modes = fd.getAll('modes'), moods = fd.getAll('moods');
    const bad = !name ? 'Falta el nombre.' : !/^https?:\/\//.test(img) ? 'La portada debe ser un link que empiece por https://' : !plats.length ? 'Elige al menos una plataforma.' : !modes.length ? 'Elige al menos un modo de juego.' : !moods.length ? 'Elige al menos un ánimo.' : '';
    err.textContent = bad; if (bad) return;
    const base = fd.get('base') === '' ? null : Math.max(0, +fd.get('base'));
    const off = Math.min(100, Math.max(0, +fd.get('off') || 0));
    const date = fd.get('date') || null;
    const links = {}; STORE_KEYS.forEach(([k]) => { const u = fd.get('l_' + k).trim(); if (/^https?:\/\//.test(u)) links[k] = u; });
    const x = g || { id: Date.now(), custom: true };
    Object.assign(x, { name, img, dev: fd.get('dev').trim() || 'Independiente', desc: fd.get('desc').trim(), date,
      soon: !!date && daysTo(date) > 0, base, off: base ? off : 0, price: base == null ? null : Math.round(base * (100 - (base ? off : 0))) / 100,
      meta: +fd.get('meta') || null, level: +fd.get('level') || 2, plats, modes, moods,
      genres: fd.get('genres').split(',').map(t => t.trim()).filter(Boolean).slice(0, 4), links, demo: /^https?:\/\//.test(fd.get('demo').trim()) ? fd.get('demo').trim() : null });
    applyVideo(x, /^https?:\/\//.test(fd.get('video').trim()) ? fd.get('video').trim() : '');
    if (!g) { CUSTOM.unshift(x); GAMES.unshift(x); BY_ID.set(x.id, x); }
    saveCustom(); admEdit = null; admDel = null;
    toast(g ? 'Cambios guardados' : `${name} ya está en el catálogo`);
    viewAdmin(); scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('#admCancel')?.addEventListener('click', () => clearTimeout(f._t));
  $('#admCancel')?.addEventListener('click', () => { admEdit = null; viewAdmin(); });
  view.querySelectorAll('[data-adm-edit]').forEach(b => b.onclick = () => { admEdit = +b.dataset.admEdit; admDel = null; viewAdmin(); scrollTo({ top: 0, behavior: 'smooth' }); });
  view.querySelectorAll('[data-adm-open]').forEach(b => b.onclick = () => openModal(+b.dataset.admOpen));
  view.querySelectorAll('[data-adm-del]').forEach(b => b.onclick = () => {
    const id = +b.dataset.admDel;
    if (admDel !== id) { admDel = id; viewAdmin(); return; }
    const i = CUSTOM.findIndex(x => x.id === id), gi = GAMES.findIndex(x => x.id === id);
    const nm = CUSTOM[i]?.name;
    if (i > -1) CUSTOM.splice(i, 1); if (gi > -1) GAMES.splice(gi, 1); BY_ID.delete(id);
    favs.delete(id); alerts.delete(id); store.set('favs', [...favs]); store.set('alerts', [...alerts]);
    if (admEdit === id) admEdit = null; admDel = null; saveCustom(); syncBadges(); toast(`${nm} borrado`); viewAdmin();
  });
  $('#admExport').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(CUSTOM, null, 2)], { type: 'application/json' }));
    a.download = 'overgame-juegos.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('#admImport').onchange = async e => {
    try {
      const arr = JSON.parse(await e.target.files[0].text()); if (!Array.isArray(arr)) throw 0;
      let n = 0;
      const ok = u => typeof u === 'string' && /^https?:\/\//.test(u);
      for (const x of arr) if (x && x.name && ok(x.img) && Array.isArray(x.plats) && Array.isArray(x.modes) && Array.isArray(x.moods) && Array.isArray(x.genres) && !BY_ID.has(x.id)) {
        x.custom = true; x.links = Object.fromEntries(Object.entries(x.links || {}).filter(([, u]) => ok(u))); if (!ok(x.demo)) x.demo = null; applyVideo(x, ok(x.video) ? x.video : ''); x.id = +x.id || Date.now() + n; CUSTOM.push(x); GAMES.unshift(x); BY_ID.set(x.id, x); n++; }
      saveCustom(); toast(`${n} juego${n === 1 ? '' : 's'} importado${n === 1 ? '' : 's'}`); viewAdmin();
    } catch { toast('Ese archivo no es un JSON de Overgame'); }
  };
}
const VIEWS = { admin: viewAdmin, panel: viewPanel, inicio: viewInicio, mood: viewMood, explorar: viewExplorar, demos: viewDemos, calendario: viewCalendario, biblioteca: viewBiblioteca };
function route() {
  const [path, qs] = location.hash.replace(/^#\/?/, '').split('?');
  return { name: VIEWS[path] ? path : 'inicio', params: new URLSearchParams(qs || '') };
}
let rTimer = 0, booted = false;
function render() {
  if (booted && !REDUCED && !intro.el) { view.classList.add('leaving'); clearTimeout(rTimer); rTimer = setTimeout(doRender, 200); }
  else doRender();
  booted = true;
}
function doRender() {
  view.classList.remove('leaving');
  const { name, params } = route();
  closePeek(true); closeModal();
  if (arcadeStop) { arcadeStop(); arcadeStop = null; }
  clearInterval(cdTimer);
  $$('video', view).forEach(unloadVideo);
  $$('[data-route]').forEach(a => a.classList.toggle('active', a.dataset.route === name));
  $$('[data-route]').forEach(a => a.dataset.route === name ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  VIEWS[name](params);
  if (name === 'inicio') setAmbient(BY_ID.get(FEATURED));
  moveNavIndicator();
  if (name !== 'explorar' && document.activeElement !== search) scrollTo(0, 0);
  document.title = { panel:'Mi panel · Overgame', inicio:'Overgame · Nexus Hub', mood:'Game Mood Finder · Overgame', explorar:'Explorar · Overgame', demos:'Centro de Demos · Overgame', calendario:'Calendario & Preventas · Overgame', biblioteca:'Biblioteca · Overgame', admin:'Admin · Overgame' }[name];
}
addEventListener('hashchange', render);
syncBadges();
render();
addEventListener('resize', moveNavIndicator);
if (!/^#\/?[a-z]/.test(location.hash) || route().name === 'inicio') showIntro();
})();
