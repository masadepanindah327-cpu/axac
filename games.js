(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rnd(0, i), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function buzz(n) { try { if (navigator.vibrate) navigator.vibrate(n); } catch (e) {} }
  var KEY = 'axac:best:v1', best = {}, stop = null, cur = null;
  try { best = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  function report(id, v, low) { // true kalau rekor baru
    var o = best[id], nb = o == null || (low ? v < o : v > o);
    if (nb) { best[id] = v; try { localStorage.setItem(KEY, JSON.stringify(best)); } catch (e) {} }
    bestLine(); return nb;
  }
  function bestLine() { $('#gbest').textContent = cur ? (best[cur.id] == null ? 'Belum ada rekor. Ayo pecahkan yang pertama.' : (cur.low ? 'Gerakan terbaik: ' : 'Skor terbaik: ') + best[cur.id]) : ''; }

  /* 1. Tangkap Koin: geser keranjang, koin emas bernilai 5, bom mengurangi nyawa, kombo melipatgandakan skor */
  function coin(area) {
    var W = 360, H = 480, cv = el('canvas', 'cv'), ctx = cv.getContext && cv.getContext('2d');
    cv.width = W; cv.height = H; cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', 'Game tangkap koin. Geser jari atau tombol panah untuk menggerakkan keranjang. Hindari bom.');
    area.append(cv);
    if (!ctx) { area.append(el('p', 'err', 'Browser ini tidak mendukung game kanvas.')); return null; }
    var bx = W / 2, s, raf, last = 0, keys = {}, cs = getComputedStyle(document.documentElement);
    function init() { s = { on: false, over: false, nb: false, score: 0, lives: 3, combo: 0, items: [], fx: [], spawn: 0, shake: 0 }; }
    function pop(x, y, c) { for (var i = 0; i < 9; i++) s.fx.push({ x: x, y: y, vx: rnd(-140, 140), vy: rnd(-260, -60), l: .5, c: c }); }
    function end() { s.on = false; s.over = true; s.nb = report('coin', s.score); buzz([60, 40, 60]); }
    function step(dt) {
      s.spawn -= dt;
      if (s.spawn <= 0) {
        var r = Math.random(), k = r < .18 + Math.min(.2, s.score / 500) ? 'bomb' : r < .27 ? 'gold' : 'coin';
        s.items.push({ k: k, x: rnd(24, W - 24), y: -20, v: (130 + Math.min(280, s.score * 2.5)) * (.8 + Math.random() * .5) });
        s.spawn = Math.max(.28, .8 - s.score / 220);
      }
      if (keys.ArrowLeft) bx -= 440 * dt; if (keys.ArrowRight) bx += 440 * dt;
      bx = Math.max(38, Math.min(W - 38, bx));
      s.items = s.items.filter(function (i) {
        i.y += i.v * dt;
        if (i.y > H - 56 && i.y < H - 18 && Math.abs(i.x - bx) < 46) {
          if (i.k === 'bomb') { s.lives--; s.combo = 0; s.shake = .3; buzz(90); pop(i.x, i.y, '#FF5C5C'); if (s.lives <= 0) end(); }
          else { s.combo++; s.score += (i.k === 'gold' ? 5 : 1) * (1 + Math.floor(s.combo / 5)); pop(i.x, i.y, i.k === 'gold' ? '#A78BFA' : '#FFC53D'); }
          return false;
        }
        if (i.y > H + 20) { if (i.k !== 'bomb') s.combo = 0; return false; }
        return true;
      });
      s.fx.forEach(function (f) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 520 * dt; f.l -= dt; });
      s.fx = s.fx.filter(function (f) { return f.l > 0; });
      s.shake = Math.max(0, s.shake - dt);
    }
    function circle(x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
    function draw() {
      var ink = cs.getPropertyValue('--ink').trim() || '#fff';
      ctx.setTransform(1, 0, 0, 1, s.shake ? rnd(-5, 5) : 0, s.shake ? rnd(-5, 5) : 0);
      ctx.fillStyle = cs.getPropertyValue('--surface').trim() || '#14111C'; ctx.fillRect(-10, -10, W + 20, H + 20);
      s.items.forEach(function (i) {
        if (i.k === 'bomb') { circle(i.x, i.y, 15, '#222'); ctx.strokeStyle = '#FF5C5C'; ctx.lineWidth = 3; ctx.stroke(); circle(i.x + 8, i.y - 14, 3, '#FF5C5C'); }
        else { circle(i.x, i.y, i.k === 'gold' ? 17 : 13, i.k === 'gold' ? '#A78BFA' : '#FFC53D'); circle(i.x, i.y, i.k === 'gold' ? 8 : 6, 'rgba(255,255,255,.55)'); }
      });
      s.fx.forEach(function (f) { ctx.globalAlpha = Math.max(0, f.l * 2); ctx.fillStyle = f.c; ctx.fillRect(f.x, f.y, 5, 5); }); ctx.globalAlpha = 1;
      ctx.fillStyle = ink; ctx.fillRect(bx - 38, H - 38, 76, 18); ctx.fillRect(bx - 44, H - 46, 8, 26); ctx.fillRect(bx + 36, H - 46, 8, 26);
      ctx.fillStyle = ink; ctx.font = '700 20px Georgia,serif'; ctx.textAlign = 'left'; ctx.fillText('Skor ' + s.score, 12, 28);
      ctx.textAlign = 'right'; ctx.fillText('♥'.repeat(Math.max(0, s.lives)), W - 12, 28);
      if (s.combo >= 5) { ctx.textAlign = 'center'; ctx.fillStyle = '#A78BFA'; ctx.fillText('Kombo x' + (1 + Math.floor(s.combo / 5)), W / 2, 28); }
      if (!s.on) {
        ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.font = '700 26px Georgia,serif';
        if (s.over) { ctx.fillText('Selesai! Skor ' + s.score, W / 2, H / 2 - 30); ctx.font = '700 18px Georgia,serif'; ctx.fillText(s.nb ? 'Rekor baru!' : 'Rekor ' + best.coin, W / 2, H / 2 + 2); }
        else { ctx.fillText('Tangkap Koin', W / 2, H / 2 - 30); ctx.font = '16px Arial'; ctx.fillText('Koin emas = 5. Hindari bom. Kombo = skor berlipat.', W / 2, H / 2 + 2); }
        ctx.font = '700 18px Arial'; ctx.fillStyle = '#A78BFA'; ctx.fillText('Ketuk untuk ' + (s.over ? 'main lagi' : 'mulai'), W / 2, H / 2 + 44);
      }
    }
    function loop(t) { var dt = Math.min(.05, (t - last) / 1000 || 0); last = t; if (s.on) step(dt); draw(); raf = requestAnimationFrame(loop); }
    function move(e) { var r = cv.getBoundingClientRect(); bx = (e.clientX - r.left) * W / r.width; }
    function start() { if (!s.on) { init(); s.on = true; } }
    cv.addEventListener('pointerdown', function (e) { move(e); start(); });
    cv.addEventListener('pointermove', move);
    function kd(e) { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { keys[e.key] = true; if (s.on) e.preventDefault(); } if (e.key === 'Enter' && e.target === cv) start(); }
    function ku(e) { keys[e.key] = false; }
    cv.tabIndex = 0; document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
    init(); raf = requestAnimationFrame(loop);
    return function () { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); };
  }

  /* 2. Pukul Koin: 30 detik, koin muncul makin cepat, bom memotong skor, kombo melipatgandakan */
  function whack(area) {
    var hud = el('p', 'hud'), grid = el('div', 'wgrid'), go = el('button', 'btn primary', 'Mulai (30 detik)'), cells = [], T = [], s = null;
    go.type = 'button'; area.append(hud, grid, go);
    function later(f, ms) { T.push(setTimeout(f, ms)); }
    function draw() { hud.textContent = s ? 'Waktu ' + s.left + ' | Skor ' + s.score + (s.combo >= 4 ? ' | Kombo x' + (1 + Math.floor(s.combo / 4)) : '') : 'Ketuk koin secepat mungkin. Jangan ketuk bom.'; }
    for (var i = 0; i < 9; i++) (function (n) {
      var b = el('button', 'hole'); b.type = 'button'; b.setAttribute('aria-label', 'Lubang ' + (n + 1));
      b.addEventListener('click', function () {
        if (!s || !s.on || !b.dataset.k) return;
        if (b.dataset.k === 'bomb') { s.score = Math.max(0, s.score - 3); s.combo = 0; buzz(80); }
        else { s.combo++; s.score += 1 + Math.floor(s.combo / 4); buzz(15); }
        b.removeAttribute('data-k'); b.textContent = ''; draw();
      });
      cells.push(b); grid.append(b);
    })(i);
    function spawn() {
      if (!s.on) return;
      var free = cells.filter(function (c) { return !c.dataset.k; }), c = free[rnd(0, free.length - 1)];
      if (c) {
        var bomb = Math.random() < .2; c.dataset.k = bomb ? 'bomb' : 'coin'; c.textContent = bomb ? '✕' : '●';
        later(function () { if (c.dataset.k === 'coin') s.combo = 0; c.removeAttribute('data-k'); c.textContent = ''; }, Math.max(420, 950 - s.score * 9));
      }
      later(spawn, Math.max(230, 720 - s.score * 7));
    }
    function tick() {
      if (!s.on) return; s.left--; draw();
      if (s.left <= 0) { s.on = false; var nb = report('whack', s.score); hud.textContent = 'Selesai! Skor ' + s.score + (nb ? '. Rekor baru!' : '.'); go.textContent = 'Main lagi'; go.hidden = false; buzz([60, 40, 60]); return; }
      later(tick, 1000);
    }
    go.addEventListener('click', function () { s = { on: true, left: 30, score: 0, combo: 0 }; go.hidden = true; draw(); spawn(); later(tick, 1000); });
    draw();
    return function () { T.forEach(clearTimeout); if (s) s.on = false; };
  }

  /* 3. Memori: cocokkan 6 pasang bentuk dengan gerakan sesedikit mungkin */
  function memory(area) {
    var sym = ['●', '■', '▲', '◆', '★', '✚'], col = ['#FFC53D', '#A78BFA', '#FF7A7A', '#4DD4AC', '#6CB6FF', '#F78DD2'];
    var hud = el('p', 'hud'), grid = el('div', 'mgrid'), again = el('button', 'btn', 'Acak ulang'), first, lock, moves, found, T = [];
    again.type = 'button'; area.append(hud, grid, again);
    function build() {
      grid.textContent = ''; first = null; lock = false; moves = 0; found = 0; upd();
      shuffle([0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5]).forEach(function (v, n) {
        var b = el('button', 'card', sym[v]); b.type = 'button'; b.style.setProperty('--c', col[v]); b.setAttribute('aria-label', 'Kartu ' + (n + 1) + ', tertutup');
        b.addEventListener('click', function () {
          if (lock || b.classList.contains('open') || b.classList.contains('ok')) return;
          b.classList.add('open'); b.setAttribute('aria-label', 'Kartu ' + (n + 1) + ', ' + sym[v]); buzz(10);
          if (!first) { first = b; return; }
          moves++;
          if (first.textContent === b.textContent) {
            first.classList.add('ok'); b.classList.add('ok'); first = null; found++; buzz(30);
            if (found === 6) { var nb = report('memory', moves, true); hud.textContent = 'Selesai dalam ' + moves + ' gerakan' + (nb ? '. Rekor baru!' : '.'); return; }
          } else {
            lock = true; var a = first; first = null;
            T.push(setTimeout(function () { [a, b].forEach(function (c) { c.classList.remove('open'); c.setAttribute('aria-label', 'Kartu, tertutup'); }); lock = false; }, 700));
          }
          upd();
        });
        grid.append(b);
      });
    }
    function upd() { hud.textContent = 'Gerakan ' + moves + ' | Pasangan ' + found + '/6'; }
    again.addEventListener('click', build); build();
    return function () { T.forEach(clearTimeout); };
  }

  /* 4. Hitung Kilat: 30 detik, benar menambah kombo, salah memotong waktu */
  function math(area) {
    var hud = el('p', 'hud'), q = el('p', 'q', '?'), opts = el('div', 'opts'), go = el('button', 'btn primary', 'Mulai'), s = null, T = null;
    go.type = 'button'; area.append(hud, q, opts, go);
    function draw() { hud.textContent = s ? 'Waktu ' + Math.ceil(s.left) + ' | Skor ' + s.score + (s.combo >= 3 ? ' | Kombo ' + s.combo : '') : 'Pilih jawaban yang benar secepat mungkin. Salah = waktu berkurang 3 detik.'; }
    function next() {
      var a = rnd(2, 12), b = rnd(2, 12), op = ['+', '−', '×'][rnd(0, 2)], ans = op === '+' ? a + b : op === '−' ? a - b : a * b, set = [ans];
      while (set.length < 4) { var w = ans + rnd(-6, 6); if (w !== ans && set.indexOf(w) < 0) set.push(w); }
      q.textContent = a + ' ' + op + ' ' + b + ' = ?'; opts.textContent = '';
      shuffle(set).forEach(function (v) {
        var b2 = el('button', 'btn', String(v)); b2.type = 'button';
        b2.addEventListener('click', function () {
          if (!s || !s.on) return;
          if (v === ans) { s.score += 1 + Math.floor(s.combo / 3); s.combo++; buzz(15); } else { s.left -= 3; s.combo = 0; buzz(80); }
          draw(); if (s.on) next();
        });
        opts.append(b2);
      });
    }
    function tick() {
      if (!s.on) return; s.left -= .25; draw();
      if (s.left <= 0) { s.on = false; opts.textContent = ''; var nb = report('math', s.score); q.textContent = 'Selesai!'; hud.textContent = 'Skor ' + s.score + (nb ? '. Rekor baru!' : '.'); go.textContent = 'Main lagi'; go.hidden = false; buzz([60, 40, 60]); }
    }
    go.addEventListener('click', function () { s = { on: true, left: 30, score: 0, combo: 0 }; go.hidden = true; draw(); next(); T = setInterval(tick, 250); });
    draw();
    return function () { clearInterval(T); if (s) s.on = false; };
  }

  var GAMES = [{ id: 'coin', name: 'Tangkap Koin', run: coin }, { id: 'whack', name: 'Pukul Koin', run: whack }, { id: 'memory', name: 'Memori', run: memory, low: true }, { id: 'math', name: 'Hitung Kilat', run: math }];
  function show(g) {
    if (stop) { stop(); stop = null; }
    cur = g; $('#garea').textContent = '';
    document.querySelectorAll('#gpick .btn').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.id === g.id)); });
    bestLine(); stop = g.run($('#garea'));
  }
  GAMES.forEach(function (g) {
    var b = el('button', 'btn', g.name); b.type = 'button'; b.dataset.id = g.id;
    b.addEventListener('click', function () { show(g); }); $('#gpick').append(b);
  });
  show(GAMES[0]);
})();
