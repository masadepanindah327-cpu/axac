(function () {
  'use strict';
  var KEY = 'axac:goals:v1';
  var fmt = new Intl.NumberFormat('id-ID'), fmt2 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
  var rp = function (n) { return 'Rp ' + fmt.format(Math.round(n)); };
  var $ = function (s) { return document.querySelector(s); };
  var goals = [], storageOk = true, shown = {}, celebrate = null, keyHandler = null;
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  // Count-up: "Rp 1.000", "10 bulan", "12,5" naik mulus ke angka akhir. Teks lain (tanggal, status) tampil langsung.
  function animateText(node, text, fromPrev) {
    var m = /^(Rp )?(\d[\d.]*)(?:,(\d+))?(\D*)$/.exec(text);
    if (node._raf) cancelAnimationFrame(node._raf);
    if (!m) { node.textContent = text; node._n = null; return; }
    var d = m[3] ? m[3].length : 0, to = parseFloat(m[2].replace(/\./g, '') + (m[3] ? '.' + m[3] : ''));
    var from = fromPrev && node._n != null ? node._n : 0, t0 = null, dur = 750;
    var f = new Intl.NumberFormat('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
    node._n = to;
    if (reduce.matches || from === to) { node.textContent = text; return; }
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur), v = from + (to - from) * (1 - Math.pow(1 - p, 3));
      if (p < 1) { node.textContent = (m[1] || '') + f.format(d ? v : Math.round(v)) + m[4]; node._raf = requestAnimationFrame(step); }
      else node.textContent = text;
    }
    node._raf = requestAnimationFrame(step);
  }
  function ripple(b, x, y) {
    if (reduce.matches) return;
    var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), e = el('span', 'ripple');
    e.setAttribute('aria-hidden', 'true');
    e.style.width = e.style.height = s + 'px';
    e.style.left = ((x == null ? r.left + r.width / 2 : x) - r.left - s / 2) + 'px';
    e.style.top = ((y == null ? r.top + r.height / 2 : y) - r.top - s / 2) + 'px';
    b.append(e); setTimeout(function () { e.remove(); }, 600);
  }
  function burst(anchor) { // confetti kecil dari progress bar
    if (reduce.matches || !anchor.animate) return;
    var r = anchor.getBoundingClientRect(), cols = ['#A78BFA', '#7C5CF0', '#ECE8F5', '#C4B5FD'], i;
    for (i = 0; i < 28; i++) {
      var p = el('span'), dx = (Math.random() - .5) * 360, dy = -60 - Math.random() * 180;
      p.setAttribute('aria-hidden', 'true');
      p.style.cssText = 'position:fixed;pointer-events:none;z-index:30;width:8px;height:12px;border-radius:2px;background:' + cols[i % 4] + ';left:' + (r.left + r.width / 2) + 'px;top:' + (r.top + r.height / 2) + 'px';
      document.body.append(p);
      p.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: 'translate(' + dx * .6 + 'px,' + dy + 'px) rotate(' + dx + 'deg)', opacity: 1, offset: .4 }, { transform: 'translate(' + dx + 'px,' + (dy + 280) + 'px) rotate(' + dx * 2 + 'deg)', opacity: 0 }], { duration: 1000 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = p.remove.bind(p);
    }
  }
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('.btn');
    if (b && !b.disabled) ripple(b, e.clientX, e.clientY);
  });

  function digits(v) { var d = String(v).replace(/\D/g, ''); return d ? parseInt(d, 10) : 0; }
  function dec(v) { var n = parseFloat(String(v).replace(/\./g, '').replace(',', '.')); return isFinite(n) ? n : 0; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function load() {
    try { var r = localStorage.getItem(KEY); goals = r ? JSON.parse(r) : []; if (!Array.isArray(goals)) throw new Error('bad'); }
    catch (e) { goals = []; storageOk = false; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(goals)); } catch (e) { storageOk = false; } }

  /* ---------- Tabungan ---------- */
  function render() {
    var ul = $('#goals'), st = $('#state'), total = 0;
    ul.textContent = ''; var cel = celebrate; celebrate = null;
    goals.forEach(function (g) { total += g.saved; });
    animateText($('#total'), rp(total), true);
    $('#total-note').textContent = goals.length ? 'Dari ' + goals.length + ' target.' : 'Belum ada target.';
    st.className = '';
    if (!storageOk) { st.className = 'bad'; st.textContent = 'Browser ini memblokir penyimpanan. Target hanya bertahan sampai halaman ditutup.'; }
    else st.textContent = goals.length ? '' : 'Belum ada target. Isi nama dan nominal di atas, lalu simpan.';
    goals.forEach(function (g) {
      var pct = Math.min(100, Math.floor(g.saved / g.target * 100));
      var li = el('li', 'goal'), head = el('div', 'goal-head');
      head.append(el('h3', '', g.name), el('span', 'amt', rp(g.saved) + ' dari ' + rp(g.target)));
      var bar = el('div', 'bar'), fill = el('i');
      fill.style.width = (shown[g.id] || 0) + '%';
      requestAnimationFrame(function () { requestAnimationFrame(function () { fill.style.width = pct + '%'; }); });
      shown[g.id] = pct;
      bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-label', 'Progres ' + g.name);
      bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', '100'); bar.setAttribute('aria-valuenow', String(pct));
      bar.append(fill);
      if (g.saved >= g.target) li.classList.add('done');
      if (g.id === cel) { li.classList.add('hit'); setTimeout(function () { burst(bar); }, 700); }
      var meta = el('p', 'muted', g.saved >= g.target ? 'Target tercapai.' : pct + '%, sisa ' + rp(g.target - g.saved));
      var f = el('form', 'tx'), lab = el('label', '', 'Jumlah (Rp)'), inp = el('input');
      inp.setAttribute('inputmode', 'numeric'); inp.setAttribute('autocomplete', 'off'); inp.dataset.money = '';
      lab.append(inp);
      var dep = el('button', 'btn primary', 'Setor'); dep.type = 'submit';
      var wd = el('button', 'btn', 'Tarik'); wd.type = 'button';
      var del = el('button', 'btn', 'Hapus'); del.type = 'button';
      var err = el('p', 'err'); err.setAttribute('role', 'alert');
      f.append(lab, dep, wd, del, err);
      f.addEventListener('submit', function (e) { e.preventDefault(); move(g.id, digits(inp.value), 1, err); });
      wd.addEventListener('click', function () { move(g.id, digits(inp.value), -1, err); });
      del.addEventListener('click', function () {
        if (!confirm('Hapus target "' + g.name + '"?')) return;
        goals = goals.filter(function (x) { return x.id !== g.id; }); save(); render();
      });
      li.append(head, bar, meta, f); ul.append(li);
    });
  }
  function move(id, amt, sign, err) {
    var g = goals.filter(function (x) { return x.id === id; })[0];
    if (!amt) { err.textContent = 'Isi jumlah lebih dari 0.'; return; }
    if (sign < 0 && amt > g.saved) { err.textContent = 'Penarikan melebihi saldo target ini (' + rp(g.saved) + ').'; return; }
    var was = g.saved >= g.target;
    g.saved += sign * amt;
    if (!was && g.saved >= g.target) celebrate = g.id;
    save(); render();
  }
  $('#goal-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#g-name').value.trim(), target = digits($('#g-target').value), err = $('#g-err');
    if (!name) { err.textContent = 'Nama target belum diisi.'; $('#g-name').focus(); return; }
    if (!target) { err.textContent = 'Nominal target harus lebih dari 0.'; $('#g-target').focus(); return; }
    err.textContent = '';
    goals.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: name, target: target, saved: 0 });
    save(); render(); e.target.reset();
  });

  /* ---------- Kalkulator ---------- */
  // field: [id, label, jenis (money|int|pct|dec), placeholder]
  var M = ['target', 'Nominal target (Rp)', 'money', '5.000.000'], S = ['saved', 'Sudah terkumpul (Rp)', 'money', '0'];
  var CALCS = [
    { id: 'basic', name: 'Biasa' },
    { id: 'months', name: 'Berapa bulan', fields: [M, S, ['mon', 'Setoran per bulan (Rp)', 'money', '500.000']], run: function (v) {
      if (!v.target) return { error: 'Isi nominal target.' };
      if (!v.mon) return { error: 'Isi setoran per bulan.' };
      if (v.saved >= v.target) return { rows: [['Status', 'Target sudah tercapai']] };
      var n = Math.ceil((v.target - v.saved) / v.mon), d = new Date(); d.setMonth(d.getMonth() + n);
      return { goal: v.target, rows: [['Butuh', n + ' bulan'], ['Selesai sekitar', d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })], ['Total setoran', rp(n * v.mon)]] };
    } },
    { id: 'monthly', name: 'Setoran per bulan', fields: [M, S, ['n', 'Jumlah bulan', 'int', '12']], run: function (v) {
      if (!v.target) return { error: 'Isi nominal target.' };
      if (!v.n) return { error: 'Isi jumlah bulan (minimal 1).' };
      if (v.saved >= v.target) return { rows: [['Status', 'Target sudah tercapai']] };
      return { goal: v.target, rows: [['Setor per bulan', rp(Math.ceil((v.target - v.saved) / v.n))], ['Selama', v.n + ' bulan']] };
    } },
    { id: 'compound', name: 'Bunga majemuk', fields: [['init', 'Modal awal (Rp)', 'money', '0'], ['mon', 'Setoran per bulan (Rp)', 'money', '500.000'], ['rate', 'Bunga per tahun (%)', 'pct', '5'], ['yrs', 'Lama (tahun)', 'int', '5']], run: function (v) {
      if (!v.yrs) return { error: 'Isi lama dalam tahun (minimal 1).' };
      if (!v.init && !v.mon) return { error: 'Isi modal awal atau setoran per bulan.' };
      var r = v.rate / 1200, bal = v.init, i, dep = v.init + v.mon * v.yrs * 12;
      for (i = 0; i < v.yrs * 12; i++) bal = bal * (1 + r) + v.mon;
      return { goal: Math.round(bal), rows: [['Nilai akhir', rp(bal)], ['Total disetor', rp(dep)], ['Bunga didapat', rp(bal - dep)]], note: 'Asumsi: bunga dihitung per bulan, setoran di akhir bulan, bunga tetap.' };
    } },
    { id: 'loan', name: 'Cicilan', fields: [['p', 'Pokok pinjaman (Rp)', 'money', '10.000.000'], ['rate', 'Bunga per tahun (%)', 'pct', '12'], ['n', 'Tenor (bulan)', 'int', '12']], run: function (v) {
      if (!v.p) return { error: 'Isi pokok pinjaman.' };
      if (!v.n) return { error: 'Isi tenor (minimal 1 bulan).' };
      var r = v.rate / 1200, pay = r ? v.p * r / (1 - Math.pow(1 + r, -v.n)) : v.p / v.n;
      return { rows: [['Cicilan per bulan', rp(pay)], ['Total dibayar', rp(pay * v.n)], ['Total bunga', rp(pay * v.n - v.p)]], note: 'Asumsi: bunga anuitas tetap. Cicilan di lembaga keuangan bisa berbeda karena biaya lain.' };
    } },
    { id: 'percent', name: 'Persentase', fields: [['x', 'Angka', 'dec', '200.000'], ['pc', 'Persen (%)', 'pct', '15']], run: function (v) {
      if (!v.x) return { error: 'Isi angka.' };
      var a = v.x * v.pc / 100;
      return { rows: [[fmt2.format(v.pc) + '% dari angka', fmt2.format(a)], ['Angka dikurangi persen', fmt2.format(v.x - a)], ['Angka ditambah persen', fmt2.format(v.x + a)]] };
    } },
    { id: 'emergency', name: 'Dana darurat', fields: [['exp', 'Pengeluaran per bulan (Rp)', 'money', '3.000.000'], ['n', 'Cadangan (bulan)', 'int', '6']], run: function (v) {
      if (!v.exp) return { error: 'Isi pengeluaran per bulan.' };
      if (!v.n) return { error: 'Isi jumlah bulan cadangan.' };
      return { goal: v.exp * v.n, rows: [['Dana darurat', rp(v.exp * v.n)], ['Setara', v.n + ' bulan pengeluaran']], note: 'Patokan umum: 3 sampai 12 bulan, tergantung stabilitas penghasilan.' };
    } },
    { id: 'split', name: 'Bagi tagihan', fields: [['total', 'Total tagihan (Rp)', 'money', '450.000'], ['n', 'Jumlah orang', 'int', '4'], ['tip', 'Tip (%)', 'pct', '0']], run: function (v) {
      if (!v.total) return { error: 'Isi total tagihan.' };
      if (!v.n) return { error: 'Isi jumlah orang (minimal 1).' };
      var all = v.total * (1 + v.tip / 100);
      return { rows: [['Per orang', rp(Math.ceil(all / v.n))], ['Total dengan tip', rp(all)]], note: 'Per orang dibulatkan ke atas ke rupiah penuh.' };
    } }
  ];

  function picker() {
    var p = $('#picker');
    CALCS.forEach(function (c) {
      var b = el('button', 'btn', c.name); b.type = 'button'; b.dataset.id = c.id;
      b.addEventListener('click', function () { show(c.id); });
      p.append(b);
    });
  }
  function show(id) {
    if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null; }
    var c = CALCS.filter(function (x) { return x.id === id; })[0], panel = $('#panel');
    document.querySelectorAll('#picker .btn').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.id === id)); });
    panel.textContent = '';
    panel.append(id === 'basic' ? basic() : form(c));
  }
  function form(c) {
    var f = el('form', 'form'), ins = {}, err = el('p', 'err'), out = el('div', 'out'), dl, note;
    f.noValidate = true; err.setAttribute('role', 'alert'); out.hidden = true; out.setAttribute('role', 'status');
    c.fields.forEach(function (x) {
      var l = el('label', '', x[1]), i = el('input');
      i.setAttribute('autocomplete', 'off'); i.placeholder = x[3];
      i.setAttribute('inputmode', x[2] === 'money' || x[2] === 'int' ? 'numeric' : 'decimal');
      if (x[2] === 'money') i.dataset.money = '';
      l.append(i); f.append(l); ins[x[0]] = [i, x[2]];
    });
    var go = el('button', 'btn primary', 'Hitung'); go.type = 'submit';
    f.append(go, err);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = {}; c.fields.forEach(function (x) { var i = ins[x[0]]; v[x[0]] = (i[1] === 'money' || i[1] === 'int') ? digits(i[0].value) : dec(i[0].value); });
      var r = c.run(v);
      out.hidden = true; out.textContent = '';
      if (r.error) { err.textContent = r.error; return; }
      err.textContent = '';
      dl = el('dl');
      r.rows.forEach(function (row) {
        var d = el('div'), dd = el('dd'), vis = el('span'), sr = el('span', 'sr', row[1]);
        vis.setAttribute('aria-hidden', 'true'); dd.append(vis, sr); d.append(el('dt', '', row[0]), dd); dl.append(d);
        animateText(vis, row[1], false);
      });
      out.append(dl);
      if (r.note) out.append(el('p', 'note', r.note));
      if (r.goal) {
        var mk = el('button', 'btn', 'Jadikan target tabungan'); mk.type = 'button';
        mk.addEventListener('click', function () { $('#g-target').value = fmt.format(r.goal); $('#g-name').focus(); });
        out.append(mk);
      }
      out.hidden = false;
    });
    var wrap = el('div'); wrap.append(f, out); return wrap;
  }

  function basic() {
    var s, wrap = el('div', 'calc'), disp = el('div', 'disp'), hist = el('div', 'hist'), val = el('output', 'val');
    val.setAttribute('aria-label', 'Layar kalkulator'); disp.append(hist, val);
    var keys = ['C', '⌫', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', ',', '='];
    var grid = el('div', 'keys'), btns = {};
    function reset() { s = { acc: null, op: null, cur: '0', fresh: true }; }
    function num() { return parseFloat(s.cur.replace(',', '.')); }
    function txt(n) { return String(parseFloat(n.toFixed(10))).replace('.', ','); }
    function calc() {
      var a = s.acc, b = num();
      return s.op === '+' ? a + b : s.op === '−' ? a - b : s.op === '×' ? a * b : s.op === '÷' ? (b === 0 ? NaN : a / b) : b;
    }
    function press(k) {
      if (s.cur === 'Error' && k !== 'C') reset();
      if (/^\d$/.test(k)) { s.cur = (s.fresh || s.cur === '0') ? k : s.cur + k; s.fresh = false; }
      else if (k === ',') { if (s.fresh) { s.cur = '0,'; s.fresh = false; } else if (s.cur.indexOf(',') < 0) s.cur += ','; }
      else if (k === 'C') reset();
      else if (k === '⌫') { if (!s.fresh) s.cur = s.cur.length > 1 ? s.cur.slice(0, -1) : '0'; }
      else if (k === '%') { s.cur = txt(num() / 100); s.fresh = false; }
      else if (k === '=') { if (s.op) { var r = calc(); s.cur = isFinite(r) ? txt(r) : 'Error'; s.acc = null; s.op = null; s.fresh = true; } }
      else { // + − × ÷
        if (s.op && !s.fresh) { var q = calc(); if (!isFinite(q)) { reset(); s.cur = 'Error'; draw(); return; } s.acc = q; s.cur = txt(q); } else s.acc = num();
        s.op = k; s.fresh = true;
      }
      draw();
    }
    function draw() { val.textContent = s.cur; hist.textContent = s.op ? txt(s.acc) + ' ' + s.op : ''; }
    keys.forEach(function (k) {
      var b = el('button', 'btn key' + ('÷×−+='.indexOf(k) >= 0 ? ' op' : '') + (k === '0' ? ' wide' : ''), k); b.type = 'button';
      b.setAttribute('aria-label', { 'C': 'Hapus semua', '⌫': 'Hapus satu angka', '÷': 'Bagi', '×': 'Kali', '−': 'Kurang', '+': 'Tambah', '=': 'Sama dengan', ',': 'Koma', '%': 'Persen' }[k] || k);
      b.addEventListener('click', function () { press(k); }); btns[k] = b; grid.append(b);
    });
    wrap.append(disp, grid);
    // Keyboard fisik: aktif selama kalkulator biasa tampil, kecuali saat mengetik di kolom isian
    var map = { '*': '×', '/': '÷', '-': '−', '.': ',', Enter: '=', Backspace: '⌫', Escape: 'C' };
    keyHandler = function (e) {
      var t = e.target, k = map[e.key] || e.key;
      if (e.ctrlKey || e.metaKey || e.altKey || (t.closest && t.closest('input,textarea,select,a'))) return;
      if (t.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;
      if (keys.indexOf(k) < 0) return;
      e.preventDefault(); press(k);
      btns[k].classList.add('press'); ripple(btns[k]);
      setTimeout(function () { btns[k].classList.remove('press'); }, 140);
    };
    document.addEventListener('keydown', keyHandler);
    reset(); draw(); return wrap;
  }

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.matches && t.matches('input[data-money]')) t.value = t.value.trim() === '' ? '' : fmt.format(digits(t.value));
  });

  var tbtn = $('#theme'), root = document.documentElement;
  function theme(t, persist) {
    root.dataset.theme = t; tbtn.setAttribute('aria-pressed', String(t === 'dark'));
    if (persist) { try { localStorage.setItem('axac:theme', t); } catch (e) {} }
  }
  var st0 = null; try { st0 = localStorage.getItem('axac:theme'); } catch (e) {}
  theme(st0 === 'light' ? 'light' : 'dark', false);
  tbtn.addEventListener('click', function () { theme(root.dataset.theme === 'dark' ? 'light' : 'dark', true); });

  load(); render(); picker(); show('basic');
})();
