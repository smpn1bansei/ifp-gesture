/*
 * KUIS GERAK – logika permainan, mode Gesture (MediaPipe Hand Landmarker) & mode Sentuh
 */
(() => {
  'use strict';

  // ------------------------------------------------------------------
  // KONFIGURASI
  // ------------------------------------------------------------------
  const CONFIG = {
    pointsCorrect: 10,         // poin dasar jawaban benar
    speedBonusMax: 10,         // bonus maksimal bila "Bonus kecepatan" aktif
    introSeconds: 2,           // lama tampilan "Soal ke-n" sebelum bola turun
    revealSeconds: 2.8,        // lama tampilan hasil sebelum soal berikutnya
    numHands: 4,               // maksimal tangan yang dideteksi sekaligus
    mpVersion: '0.10.14',
    modelUrl: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
    camCrop: { x0: 0.08, x1: 0.92, y0: 0.06, y1: 0.86 }, // area kamera yang dipetakan ke layar
    showCamera: 1,             // opasitas video kamera di latar (0 = sembunyikan, 1 = penuh)
    warmFilter: ['rgba(40, 28, 0, 0.42)', 'rgba(255, 190, 70, 0.16)'] // lapisan filter redup kekuningan
  };
  const TIMES = [30, 45, 60, 90, 120];
  const COUNTS = [5, 10, 15, 0]; // 0 = semua
  const LETTERS = 'ABCDEF';
  const ANSWER_COLORS = [
    ['#fde68a', '#f59e0b', '#b45309'], ['#86efac', '#10b981', '#047857'], ['#d8b4fe', '#a855f7', '#6b21a8'],
    ['#f9a8d4', '#ec4899', '#9d174d'], ['#67e8f9', '#06b6d4', '#0e7490'], ['#fdba74', '#f97316', '#9a3412']
  ];
  const TEAMS = [
    { id: 'A', name: 'Tim A', light: '#fda4af', main: '#f43f5e', dark: '#9f1239' },
    { id: 'B', name: 'Tim B', light: '#93c5fd', main: '#3b82f6', dark: '#1e3a8a' }
  ];
  const HAND_LINKS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],
    [9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];

  // Ikon (gaya Lucide, stroke)
  const ICONS = {
    hand: '<path d="M18 11V6a2 2 0 0 0-4 0"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
    pointer: '<path d="M22 14a8 8 0 0 1-8 8"/><path d="M18 11v-1a2 2 0 0 0-4 0"/><path d="M14 10V9a2 2 0 0 0-4 0v1"/><path d="M10 9.5V4a2 2 0 0 0-4 0v10"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    skip: '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
    minimize: '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    volumeOff: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    list: '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    rotate: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
    sparkle: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
    settings: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
    sunDim: '<circle cx="12" cy="12" r="4"/><path d="M12 4h.01"/><path d="M20 12h.01"/><path d="M12 20h.01"/><path d="M4 12h.01"/><path d="M17.66 6.34h.01"/><path d="M17.66 17.66h.01"/><path d="M6.34 17.66h.01"/><path d="M6.34 6.34h.01"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    cameraOff: '<line x1="2" x2="22" y1="2" y2="22"/><path d="M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16"/><path d="M9.5 4h5L17 7h3a2 2 0 0 1 2 2v7.5"/><path d="M14.12 15.12A3 3 0 1 1 9.88 10.88"/>'
  };
  const icon = name => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
  const renderIcons = (root = document) => root.querySelectorAll('i[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  const setIcon = (el, name) => { const i = el.querySelector('i[data-icon]'); if (i) { i.dataset.icon = name; i.innerHTML = icon(name); } };

  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const bank = window.QUESTION_BANK;

  // ------------------------------------------------------------------
  // PENYIMPANAN (pengaturan & soal buatan guru)
  // ------------------------------------------------------------------
  const store = {
    get(key, def) { try { const v = localStorage.getItem('kuisgerak.' + key); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
    set(key, val) { try { localStorage.setItem('kuisgerak.' + key, JSON.stringify(val)); } catch (e) { /* abaikan */ } }
  };
  const settings = Object.assign({
    subject: null, mode: 'gesture', time: 60, count: 10,
    nameA: 'Tim A', nameB: 'Tim B', bonus: false, lock: true, sound: true, filter: false
  }, store.get('settings', {}));
  if (settings.subject && !bank[settings.subject]) settings.subject = null;
  const saveSettings = () => store.set('settings', settings);

  const custom = store.get('custom', {});       // { IPA: [{q, options, answer}], ... }
  const useDefault = store.get('useDefault', {}); // { IPA: false, ... }
  const saveBank = () => { store.set('custom', custom); store.set('useDefault', useDefault); };

  function questionsFor(key) {
    const base = useDefault[key] === false ? [] : bank[key].questions;
    return base.concat(custom[key] || []);
  }

  // ------------------------------------------------------------------
  // SUARA
  // ------------------------------------------------------------------
  const sfx = (() => {
    let ctx = null;
    const ac = () => {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    };
    function tone(freq, dur, type = 'sine', vol = 0.2, when = 0, slideTo) {
      if (!settings.sound) return;
      try {
        const c = ac(), t = c.currentTime + when;
        const o = c.createOscillator(), g = c.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, t);
        if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(c.destination);
        o.start(t); o.stop(t + dur + 0.02);
      } catch (e) { /* audio tidak tersedia */ }
    }
    return {
      unlock: () => { try { ac(); } catch (e) {} },
      click: () => tone(880, 0.06, 'sine', 0.12),
      grab: () => tone(520, 0.08, 'sine', 0.13, 0, 780),
      tick: () => tone(1100, 0.05, 'square', 0.05),
      pop: () => { tone(1200, 0.12, 'square', 0.1, 0, 200); tone(300, 0.15, 'triangle', 0.14, 0.02, 80); },
      wrong: () => { tone(220, 0.28, 'sawtooth', 0.1); tone(165, 0.38, 'sawtooth', 0.09, 0.14); },
      correct: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.26, 'triangle', 0.2, i * 0.08)),
      timeup: () => { tone(440, 0.2, 'square', 0.08); tone(330, 0.35, 'square', 0.08, 0.2); },
      start: () => [392, 523, 659].forEach((f, i) => tone(f, 0.16, 'triangle', 0.16, i * 0.1)),
      win: () => [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, 'triangle', 0.18, i * 0.12))
    };
  })();

  // ------------------------------------------------------------------
  // MENU
  // ------------------------------------------------------------------
  const app = { screen: 'menu' };

  function renderSubjects() {
    const wrap = $('subjects');
    wrap.innerHTML = '';
    Object.entries(bank).forEach(([key, s]) => {
      const n = questionsFor(key).length;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'subject' + (settings.subject === key ? ' sel' : '');
      b.disabled = n === 0;
      b.style.setProperty('--c', s.color);
      b.innerHTML = `<span class="s-ico">${s.icon}</span><span class="s-txt"><b>${esc(s.name)}</b><small>${n} soal</small></span>`;
      b.addEventListener('click', () => { settings.subject = key; sfx.click(); renderSubjects(); updateSummary(); });
      wrap.appendChild(b);
    });
    if (settings.subject && questionsFor(settings.subject).length === 0) settings.subject = null;
  }

  function buildSeg(id, values, current, label, onPick) {
    const wrap = $(id);
    wrap.innerHTML = '';
    values.forEach(v => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = v === current() ? 'sel' : '';
      b.innerHTML = label(v);
      b.addEventListener('click', () => {
        onPick(v); sfx.click();
        [...wrap.children].forEach(c => c.classList.toggle('sel', c === b));
        updateSummary();
      });
      wrap.appendChild(b);
    });
  }

  function buildMenu() {
    renderSubjects();
    buildSeg('times', TIMES, () => settings.time, v => `${v}<small>s</small>`, v => (settings.time = v));
    buildSeg('counts', COUNTS, () => settings.count, v => (v ? v : 'Semua'), v => (settings.count = v));

    document.querySelectorAll('.mode').forEach(b => {
      b.classList.toggle('sel', b.dataset.mode === settings.mode);
      b.addEventListener('click', () => {
        settings.mode = b.dataset.mode; sfx.click();
        document.querySelectorAll('.mode').forEach(m => m.classList.toggle('sel', m === b));
        updateSummary();
      });
    });

    $('nameA').value = settings.nameA;
    $('nameB').value = settings.nameB;
    $('nameA').addEventListener('input', e => { settings.nameA = e.target.value; saveSettings(); });
    $('nameB').addEventListener('input', e => { settings.nameB = e.target.value; saveSettings(); });

    $('optBonus').checked = settings.bonus;
    $('optLock').checked = settings.lock;
    $('optBonus').addEventListener('change', e => { settings.bonus = e.target.checked; sfx.click(); saveSettings(); });
    $('optLock').addEventListener('change', e => { settings.lock = e.target.checked; sfx.click(); saveSettings(); });

    updateSoundBtn();
    updateFilterBtn();
    updateSummary();
  }

  function updateSummary() {
    const s = settings.subject && bank[settings.subject];
    $('btnStart').disabled = !s;
    const hint = $('subjectHint');
    if (!s) {
      $('startSummary').textContent = 'Pilih mata pelajaran terlebih dahulu';
      hint.textContent = 'Pilih satu'; hint.classList.remove('ok');
    } else {
      const total = questionsFor(settings.subject).length;
      const n = settings.count ? Math.min(settings.count, total) : total;
      $('startSummary').textContent = `${s.name} · ${settings.mode === 'gesture' ? 'Gesture' : 'Sentuh'} · ${settings.time} detik · ${n} soal`;
      hint.textContent = '✓ ' + s.name; hint.classList.add('ok');
    }
    saveSettings();
  }

  function updateFilterBtn() {
    const b = $('btnFilter');
    b.classList.toggle('on', settings.filter);
    b.title = settings.filter ? 'Filter redup: aktif' : 'Filter redup: mati';
  }

  function updateSoundBtn() {
    const b = $('btnSound');
    setIcon(b, settings.sound ? 'volume' : 'volumeOff');
    b.classList.toggle('off', !settings.sound);
    b.title = settings.sound ? 'Suara: aktif' : 'Suara: mati';
  }

  function showScreen(name) {
    ['menu', 'quiz', 'result'].forEach(s => $(s).classList.toggle('active', s === name));
    app.screen = name;
    if (name === 'quiz') resize();
  }

  // Layar penuh
  function toggleFullscreen() {
    sfx.click();
    const d = document;
    if (!d.fullscreenElement && !d.webkitFullscreenElement) {
      const el = d.documentElement;
      const p = (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
      p?.catch?.(() => {});
    } else {
      (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    }
  }
  function updateFullBtn() {
    const on = !!(document.fullscreenElement || document.webkitFullscreenElement);
    [$('btnFull'), $('btnFull2')].forEach(b => setIcon(b, on ? 'minimize' : 'maximize'));
    setTimeout(resize, 120);
  }

  // ------------------------------------------------------------------
  // KELOLA SOAL
  // ------------------------------------------------------------------
  let bankTab = null;

  function openBank() {
    bankTab = settings.subject || Object.keys(bank)[0];
    buildBankForm();
    renderBank();
    $('bankModal').classList.remove('hidden');
  }
  function closeBank() {
    $('bankModal').classList.add('hidden');
    renderSubjects(); updateSummary();
  }

  function buildBankForm() {
    const wrap = $('fOpts');
    if (wrap.children.length) return;
    for (let i = 0; i < 4; i++) {
      const row = document.createElement('label');
      row.className = 'opt';
      row.innerHTML = `<input type="radio" name="fAns" value="${i}" ${i === 0 ? 'checked' : ''}><span class="L">${LETTERS[i]}</span><input type="text" placeholder="Pilihan ${LETTERS[i]}${i < 2 ? '' : ' (opsional)'}" maxlength="60">`;
      wrap.appendChild(row);
    }
  }

  function renderBank() {
    const tabs = $('bankTabs');
    tabs.innerHTML = '';
    Object.entries(bank).forEach(([key, s]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = key === bankTab ? 'sel' : '';
      b.innerHTML = `<span>${s.icon}</span>${esc(s.name)}`;
      b.addEventListener('click', () => { bankTab = key; renderBank(); });
      tabs.appendChild(b);
    });

    const useDef = useDefault[bankTab] !== false;
    $('bankUseDefault').checked = useDef;
    const mine = custom[bankTab] || [];
    const defs = bank[bankTab].questions;
    const list = $('bankList');
    list.innerHTML = '';
    const item = (q, isMine, idx) => {
      const li = document.createElement('li');
      if (!isMine && !useDef) li.className = 'muted-item';
      li.innerHTML = `<div class="bq"><p>${esc(q.q)}</p><small>Jawaban: <b>${esc(q.options[q.answer])}</b> · ${q.options.length} pilihan</small></div>` +
        (isMine ? `<button class="del" type="button" title="Hapus">${icon('trash')}</button>` : `<span class="tag">Bawaan</span>`);
      if (isMine) li.querySelector('.del').addEventListener('click', () => {
        mine.splice(idx, 1); custom[bankTab] = mine; saveBank(); renderBank(); sfx.pop();
      });
      return li;
    };
    mine.forEach((q, i) => { const li = item(q, true, i); li.querySelector('.bq').insertAdjacentHTML('afterend', '<span class="tag mine">Buatan saya</span>'); list.appendChild(li); });
    defs.forEach(q => list.appendChild(item(q, false)));
    if (!mine.length && !defs.length) list.innerHTML = '<li class="bank-empty">Belum ada soal.</li>';
    $('bankCount').textContent = `${questionsFor(bankTab).length} soal aktif`;
  }

  function addQuestion(e) {
    e.preventDefault();
    const msg = $('fMsg');
    const q = $('fQ').value.trim();
    const rows = [...$('fOpts').children];
    const ansIdx = rows.findIndex(r => r.querySelector('input[type=radio]').checked);
    const opts = [];
    let answer = -1;
    rows.forEach((r, i) => {
      const v = r.querySelector('input[type=text]').value.trim();
      if (v) { if (i === ansIdx) answer = opts.length; opts.push(v); }
    });
    if (!q) return showMsg(msg, 'Pertanyaan belum diisi.', 'err');
    if (opts.length < 2) return showMsg(msg, 'Isi minimal 2 pilihan jawaban.', 'err');
    if (answer < 0) return showMsg(msg, 'Jawaban benar yang dipilih masih kosong.', 'err');
    (custom[bankTab] = custom[bankTab] || []).unshift({ q, options: opts, answer });
    saveBank();
    $('fQ').value = '';
    rows.forEach((r, i) => { r.querySelector('input[type=text]').value = ''; r.querySelector('input[type=radio]').checked = i === 0; });
    showMsg(msg, '✓ Soal ditambahkan ke ' + bank[bankTab].name, 'ok');
    sfx.correct();
    renderBank();
  }
  function showMsg(el, text, cls) { el.textContent = text; el.className = 'form-msg ' + cls; }

  function exportBank() {
    const data = JSON.stringify({ app: 'kuis-gerak', version: 1, custom, useDefault }, null, 2);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.download = 'soal-kuis-gerak.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function importBank(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const src = data.custom || data;
        let n = 0;
        for (const key of Object.keys(bank)) {
          const arr = Array.isArray(src[key]) ? src[key] : [];
          const valid = arr.filter(q => q && typeof q.q === 'string' && Array.isArray(q.options) &&
            q.options.length >= 2 && q.options.length <= 6 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length)
            .map(q => ({ q: q.q, options: q.options.map(String), answer: q.answer }));
          if (valid.length) { custom[key] = (custom[key] || []).concat(valid); n += valid.length; }
        }
        if (data.useDefault) Object.assign(useDefault, data.useDefault);
        saveBank(); renderBank();
        showMsg($('fMsg'), `✓ ${n} soal berhasil diimpor.`, 'ok');
      } catch (err) {
        showMsg($('fMsg'), 'File tidak valid.', 'err');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  // ------------------------------------------------------------------
  // KAMERA + DETEKSI TANGAN
  // ------------------------------------------------------------------
  const tracker = {
    video: $('cam'), landmarker: null, stream: null,
    wanted: false, camStarting: null, modelLoading: null,
    lastVideoTime: -1, error: '', state: 'off' // off | starting | on | error
  };

  function loadModel() {
    if (tracker.landmarker) return Promise.resolve();
    if (tracker.modelLoading) return tracker.modelLoading;
    tracker.modelLoading = (async () => {
      const base = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${CONFIG.mpVersion}`;
      const vision = await import(`${base}/vision_bundle.mjs`);
      const fileset = await vision.FilesetResolver.forVisionTasks(`${base}/wasm`);
      const opts = delegate => ({
        baseOptions: { modelAssetPath: CONFIG.modelUrl, delegate },
        runningMode: 'VIDEO',
        numHands: CONFIG.numHands,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      try {
        tracker.landmarker = await vision.HandLandmarker.createFromOptions(fileset, opts('GPU'));
      } catch (e) {
        tracker.landmarker = await vision.HandLandmarker.createFromOptions(fileset, opts('CPU'));
      }
    })().catch(err => { tracker.modelLoading = null; throw err; });
    return tracker.modelLoading;
  }

  function startCamera() {
    tracker.wanted = true;
    if (tracker.stream) return Promise.resolve();
    if (tracker.camStarting) return tracker.camStarting;
    tracker.state = 'starting';
    tracker.camStarting = (async () => {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Browser tidak mendukung kamera (gunakan https / localhost)');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false
      });
      if (!tracker.wanted) { stream.getTracks().forEach(t => t.stop()); return; } // dibatalkan (mis. dijeda)
      tracker.stream = stream;
      tracker.video.srcObject = stream;
      await tracker.video.play();
    })().finally(() => { tracker.camStarting = null; });
    return tracker.camStarting;
  }

  function stopCamera() {
    tracker.wanted = false;
    if (tracker.stream) tracker.stream.getTracks().forEach(t => t.stop());
    tracker.stream = null;
    tracker.video.pause();
    tracker.video.srcObject = null;
    tracker.lastVideoTime = -1;
    if (tracker.state !== 'error') tracker.state = 'off';
    G.hands = [];
  }

  async function enableGesture(onProgress) {
    try {
      onProgress?.('Meminta izin kamera…');
      await startCamera();
      if (!tracker.wanted) return;
      onProgress?.('Memuat model pendeteksi tangan…');
      await loadModel();
      if (tracker.wanted && tracker.stream) { tracker.state = 'on'; tracker.error = ''; }
    } catch (err) {
      console.error(err);
      tracker.state = 'error';
      tracker.error = err?.name === 'NotAllowedError' ? 'izin kamera ditolak'
        : err?.name === 'NotFoundError' ? 'kamera tidak ditemukan' : (err?.message || String(err));
    }
  }

  const gestureOn = () => settings.mode === 'gesture' && tracker.state === 'on' && tracker.landmarker && tracker.stream;

  // Telapak tangan terbuka = 5 jari lurus
  function isOpenPalm(lm) {
    const d = (a, b) => Math.hypot(lm[a].x - lm[b].x, lm[a].y - lm[b].y);
    const palm = d(0, 9);
    let ext = 0;
    for (const [tip, pip] of [[8, 6], [12, 10], [16, 14], [20, 18]]) {
      if (d(tip, 0) > d(pip, 0) * 1.12) ext++;
    }
    const thumb = d(4, 17) > d(2, 17) * 1.05 && d(4, 5) > palm * 0.3;
    return ext === 4 && thumb;
  }

  function mapPoint(p) {
    const c = CONFIG.camCrop;
    return { x: ((1 - p.x) - c.x0) / (c.x1 - c.x0) * W, y: (p.y - c.y0) / (c.y1 - c.y0) * H };
  }

  let nextHandId = 1;
  function updateHands(now) {
    if (!gestureOn() || G.paused) return;
    const v = tracker.video;
    if (v.readyState < 2 || v.currentTime === tracker.lastVideoTime) return;
    tracker.lastVideoTime = v.currentTime;
    let res;
    try { res = tracker.landmarker.detectForVideo(v, now); } catch (e) { return; }
    const lms = res.landmarks || [];

    const prev = G.hands, used = new Set(), out = [];
    for (const lm of lms) {
      const pts = lm.map(mapPoint);
      const palmIdx = [0, 5, 9, 13, 17];
      const px = palmIdx.reduce((s, i) => s + pts[i].x, 0) / 5;
      const py = palmIdx.reduce((s, i) => s + pts[i].y, 0) / 5;
      const open = isOpenPalm(lm);

      let best = null, bd = Infinity;
      for (const h of prev) {
        if (used.has(h)) continue;
        const dd = Math.hypot(h.x - px, h.y - py);
        if (dd < bd) { bd = dd; best = h; }
      }
      let h;
      if (best && bd < Math.max(W, H) * 0.18) {
        used.add(best); h = best;
        h.x += (px - h.x) * 0.65; h.y += (py - h.y) * 0.65;
      } else {
        h = { id: nextHandId++, x: px, y: py, open: false, openCnt: 0, closeCnt: 0 };
      }
      if (open) { h.openCnt++; h.closeCnt = 0; } else { h.closeCnt++; h.openCnt = 0; }
      if (!h.open && h.openCnt >= 2) h.open = true;
      if (h.open && h.closeCnt >= 3) h.open = false;
      h.pts = pts; h.missing = 0;
      out.push(h);
    }
    for (const h of prev) {
      if (!used.has(h)) { h.missing = (h.missing || 0) + 1; if (h.missing <= 6) out.push(h); }
    }
    G.hands = out;
  }

  // Sentuhan / mouse (mode Sentuh, juga cadangan di mode Gesture)
  const touchPointers = new Map();
  function setupPointer() {
    const cv = $('stage');
    const pos = e => ({ x: e.clientX, y: e.clientY });
    cv.addEventListener('pointerdown', e => {
      sfx.unlock();
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* abaikan */ }
      touchPointers.set(e.pointerId, { key: 'p' + e.pointerId, ...pos(e), touch: true });
    });
    cv.addEventListener('pointermove', e => {
      const p = touchPointers.get(e.pointerId);
      if (p) Object.assign(p, pos(e));
    });
    const up = e => touchPointers.delete(e.pointerId);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('lostpointercapture', up);
  }

  function activePointers() {
    const list = [];
    for (const h of G.hands) if (h.open) list.push({ key: 'h' + h.id, x: h.x, y: h.y });
    for (const p of touchPointers.values()) list.push(p);
    return list;
  }

  // ------------------------------------------------------------------
  // STATE PERMAINAN
  // ------------------------------------------------------------------
  const canvas = $('stage');
  const ctx = canvas.getContext('2d');
  let W = innerWidth, H = innerHeight, DPR = 1, playTop = 160;
  let bgCache = null;

  const G = {
    questions: [], index: 0, scores: [0, 0],
    phase: 'idle', phaseT: 0, timeLeft: 0, lastTick: 0,
    paused: false, t: 0,
    teamBalls: [], answers: [], particles: [], hands: [], rings: [],
    lockedTeams: [false, false], wrongs: [],
    log: []
  };

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function resize() {
    W = innerWidth; H = innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    playTop = $('hud').getBoundingClientRect().bottom + 8;
    bgCache = null;

    const tr = teamRadius();
    G.teamBalls.forEach((t, i) => {
      t.r = tr;
      t.homeX = W * (i === 0 ? 0.14 : 0.86);
      t.homeY = H - tr - Math.max(64, H * 0.09); // beri ruang untuk label & bilah bawah
      clampBall(t);
    });
    layoutAnswers();
    resizeConfetti();
  }

  const teamRadius = () => Math.max(30, Math.min(58, Math.min(W, H) * 0.046));
  const answerRadius = n => Math.max(40, Math.min(W / n * 0.22, (H - playTop) * 0.115, 86));

  function layoutAnswers() {
    const n = G.answers.length;
    if (!n) return;
    const r = answerRadius(n);
    const margin = W * 0.1;
    const span = W - margin * 2;
    G.answers.forEach((a, i) => {
      a.r = r;
      a.baseX = margin + span * (i + 0.5) / n;
      a.floorY = playTop + r + (H - playTop - r) * 0.3 + (i % 2 ? r * 0.35 : 0);
      a.layout = null;
    });
  }

  // ------------------------------------------------------------------
  // ALUR KUIS
  // ------------------------------------------------------------------
  let startToken = 0;
  async function startQuiz() {
    sfx.unlock();
    const token = ++startToken;
    showScreen('quiz');
    G.paused = false;
    G.phase = 'idle';
    G.answers = []; G.teamBalls = []; G.particles = []; G.rings = [];
    $('pauseOverlay').classList.add('hidden');
    hideToast();

    if (settings.mode === 'gesture') {
      if (tracker.state !== 'on') {
        $('loading').classList.remove('hidden');
        $('btnSkipCam').classList.add('hidden');
        const skipTimer = setTimeout(() => $('btnSkipCam').classList.remove('hidden'), 3000);
        await Promise.race([
          enableGesture(t => ($('loadingText').textContent = t)),
          new Promise(r => (G.skipResolve = r))
        ]);
        clearTimeout(skipTimer);
        $('loading').classList.add('hidden');
      } else {
        startCamera().catch(() => {});
      }
    } else {
      stopCamera();
    }
    if (token !== startToken || app.screen !== 'quiz') return;
    newGame();
  }

  function newGame() {
    const s = bank[settings.subject];
    const all = questionsFor(settings.subject);
    const n = settings.count ? Math.min(settings.count, all.length) : all.length;
    G.questions = shuffle(all.slice()).slice(0, n).map(q => ({
      q: q.q,
      options: shuffle(q.options.map((text, i) => ({ text, correct: i === q.answer })))
    }));
    TEAMS[0].name = settings.nameA.trim() || 'Tim A';
    TEAMS[1].name = settings.nameB.trim() || 'Tim B';
    $('labelA').textContent = TEAMS[0].name;
    $('labelB').textContent = TEAMS[1].name;
    G.index = 0;
    G.scores = [0, 0];
    G.log = [];
    G.particles = []; G.rings = [];
    G.teamBalls = TEAMS.map((team, i) => ({ team, idx: i, x: 0, y: 0, vx: 0, vy: 0, r: 50, holder: null, homeX: 0, homeY: 0 }));
    $('qsubject').textContent = `${s.icon} ${s.name}`;
    $('qdots').innerHTML = G.questions.map(() => '<span></span>').join('');
    resize();
    G.teamBalls.forEach(t => { t.x = t.homeX; t.y = t.homeY; });
    updateScores();
    sfx.start();
    beginQuestion();
  }

  function beginQuestion() {
    const q = G.questions[G.index];
    G.answers = [];
    G.lockedTeams = [false, false];
    G.wrongs = [];
    G.teamBalls.forEach(t => { t.holder = null; t.vx = t.vy = 0; });
    $('qnum').textContent = `Soal ${G.index + 1} / ${G.questions.length}`;
    const qt = $('qtext');
    qt.textContent = q.q;
    qt.classList.toggle('long', q.q.length > 90);
    qt.classList.remove('enter'); void qt.offsetWidth; qt.classList.add('enter');
    [...$('qdots').children].forEach((d, i) => d.classList.toggle('cur', i === G.index));
    $('boxA').classList.remove('out'); $('boxB').classList.remove('out');
    G.timeLeft = settings.time;
    G.lastTick = Math.ceil(settings.time);
    G.phase = 'intro';
    G.phaseT = CONFIG.introSeconds;
    updateTimerUI();
    showToast('📖', `Soal ${G.index + 1}`, 'Baca soalnya, bersiap!', 'info', CONFIG.introSeconds * 1000 - 200);
  }

  function spawnAnswers() {
    const q = G.questions[G.index];
    const fallTime = Math.max(4, Math.min(10, settings.time * 0.25));
    G.answers = q.options.map((o, i) => ({
      text: o.text, correct: o.correct, letter: LETTERS[i],
      colors: ANSWER_COLORS[i % ANSWER_COLORS.length],
      x: 0, y: 0, baseX: 0, floorY: 0, r: 50,
      alive: true, state: 'normal',
      delay: i * 0.3 + Math.random() * 0.15,
      phase: Math.random() * Math.PI * 2,
      fallTime, layout: null, age: 0
    }));
    layoutAnswers();
    G.answers.forEach(a => { a.x = a.baseX; a.y = playTop - a.r * 2.4; a.startY = a.y; });
    G.phase = 'play';
  }

  function onHit(t, ans) {
    const team = t.team;
    if (ans.correct) {
      const bonus = settings.bonus ? Math.round(CONFIG.speedBonusMax * Math.max(0, G.timeLeft) / settings.time) : 0;
      const pts = CONFIG.pointsCorrect + bonus;
      G.scores[t.idx] += pts;
      ans.state = 'win';
      updateScores(t.idx);
      burst(ans.x, ans.y, [team.main, '#facc15', '#ffffff', ans.colors[1]], 80);
      ring(ans.x, ans.y, '#facc15');
      sfx.correct();
      showToast('🎉', `${team.name} benar!`, `+${pts} poin${bonus ? ` (bonus kecepatan +${bonus})` : ''}`, 'good', CONFIG.revealSeconds * 1000 - 300);
      t.holder = null;
      G.answers.forEach(a => { if (a !== ans && a.alive) a.state = 'fade'; });
      endQuestion(t.idx);
    } else {
      ans.alive = false;
      burst(ans.x, ans.y, ans.colors.concat('#ffffff'), 46);
      ring(ans.x, ans.y, '#ef4444');
      sfx.pop(); sfx.wrong();
      t.holder = null;
      const away = Math.atan2(t.y - ans.y, t.x - ans.x);
      t.vx = Math.cos(away) * 800; t.vy = Math.sin(away) * 800;
      G.wrongs.push(t.idx);

      const other = 1 - t.idx;
      if (settings.lock) {
        G.lockedTeams[t.idx] = true;
        $(t.idx ? 'boxB' : 'boxA').classList.add('out');
      }
      if (G.lockedTeams[0] && G.lockedTeams[1]) {
        revealCorrect('😅', 'Kedua tim salah');
      } else {
        const sub = settings.lock ? `Giliran ${TEAMS[other].name} mencari jawaban yang benar!` : 'Ayo coba jawaban yang lain!';
        showToast('💥', `${team.name} salah!`, sub, 'bad', 1800);
      }
    }
  }

  function revealCorrect(ico, title) {
    const ans = G.answers.find(a => a.correct);
    G.answers.forEach(a => { if (a.alive) a.state = a.correct ? 'reveal' : 'fade'; });
    G.teamBalls.forEach(t => (t.holder = null));
    showToast(ico, title, `Jawaban benar: ${ans ? ans.letter + '. ' + ans.text : correctText()}`, 'warn', CONFIG.revealSeconds * 1000 - 300);
    endQuestion(-1);
  }
  const correctText = () => (G.questions[G.index].options.find(o => o.correct) || {}).text || '-';

  function timeUp() { sfx.timeup(); revealCorrect('⏰', 'Waktu habis!'); }

  function skipQuestion() {
    if (G.phase === 'intro' && !G.answers.length) spawnAnswers();
    if (G.phase !== 'play') return;
    revealCorrect('⏭️', 'Soal dilewati');
  }

  function endQuestion(winner) {
    const q = G.questions[G.index];
    G.log.push({ q: q.q, answer: correctText(), winner, wrongs: G.wrongs.slice() });
    const dot = $('qdots').children[G.index];
    if (dot) dot.classList.add(winner === 0 ? 'a' : winner === 1 ? 'b' : 'n');
    G.phase = 'reveal';
    G.phaseT = CONFIG.revealSeconds;
  }

  function nextQuestion() {
    G.index++;
    if (G.index >= G.questions.length) finishGame();
    else beginQuestion();
  }

  function finishGame() {
    G.phase = 'idle';
    hideToast();
    stopCamera();
    const [a, b] = G.scores;
    const [nA, nB] = [TEAMS[0].name, TEAMS[1].name];
    $('finalA').textContent = a; $('finalB').textContent = b;
    $('finalNameA').textContent = nA; $('finalNameB').textContent = nB;
    $('finalBoxA').classList.toggle('win', a > b);
    $('finalBoxB').classList.toggle('win', b > a);
    $('winnerText').innerHTML = a > b ? `<span style="color:#fb7185">${esc(nA)}</span> menang!` :
      b > a ? `<span style="color:#60a5fa">${esc(nB)}</span> menang!` : 'Hasil seri!';
    $('trophy').textContent = a === b ? '🤝' : '🏆';
    const s = bank[settings.subject];
    $('resultSubject').textContent = `${s.icon} ${s.name} · ${G.questions.length} soal · ${settings.time} detik/soal`;

    const cA = G.log.filter(l => l.winner === 0).length;
    const cB = G.log.filter(l => l.winner === 1).length;
    const none = G.log.filter(l => l.winner === -1).length;
    $('stats').innerHTML = `<span>✅ ${esc(nA)} benar <b>${cA}</b></span><span>✅ ${esc(nB)} benar <b>${cB}</b></span><span>⏭️ Tidak terjawab <b>${none}</b></span>`;

    $('recapList').innerHTML = G.log.map((l, i) => {
      const w = l.winner === 0 ? `<span class="rw a">${esc(nA)}</span>` : l.winner === 1 ? `<span class="rw b">${esc(nB)}</span>` : '<span class="rw n">—</span>';
      return `<li><span class="rn">${i + 1}</span><div class="rq"><p>${esc(l.q)}</p><small>Jawaban: <b>${esc(l.answer)}</b></small></div>${w}</li>`;
    }).join('');

    showScreen('result');
    sfx.win();
    startConfetti(a === b ? ['#facc15', '#ffffff', '#a78bfa'] : a > b ? ['#f43f5e', '#fda4af', '#facc15', '#fff'] : ['#3b82f6', '#93c5fd', '#facc15', '#fff']);
  }

  function updateScores(bumpIdx) {
    $('scoreA').textContent = G.scores[0];
    $('scoreB').textContent = G.scores[1];
    if (bumpIdx !== undefined) {
      const el = $(bumpIdx ? 'boxB' : 'boxA');
      el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    }
  }

  const RING_LEN = 2 * Math.PI * 20;
  function updateTimerUI() {
    const t = Math.max(0, G.timeLeft);
    $('timeNum').textContent = Math.ceil(t);
    $('timerProg').style.strokeDashoffset = RING_LEN * (1 - t / settings.time);
    $('timerRing').classList.toggle('warn', t <= 5 && G.phase === 'play');
  }

  let toastTimer = 0;
  function showToast(ico, title, sub, cls, ms) {
    const el = $('toast');
    el.innerHTML = `<div class="t-ico">${ico}</div><div><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
    el.className = 'toast show ' + (cls || '');
    clearTimeout(toastTimer);
    if (ms) toastTimer = setTimeout(hideToast, ms);
  }
  function hideToast() { $('toast').classList.remove('show'); }

  // ------------------------------------------------------------------
  // UPDATE PER FRAME
  // ------------------------------------------------------------------
  function clampBall(t) {
    t.x = Math.max(t.r, Math.min(W - t.r, t.x));
    t.y = Math.max(playTop * 0.6 + t.r * 0.4, Math.min(H - t.r, t.y));
  }

  function update(dt) {
    G.t += dt;
    updateTeamBalls(dt);
    updateAnswers(dt);
    updateParticles(dt);

    if (G.phase === 'intro') {
      G.phaseT -= dt;
      if (G.phaseT <= 0) spawnAnswers();
    } else if (G.phase === 'play') {
      G.timeLeft -= dt;
      const sec = Math.ceil(G.timeLeft);
      if (sec < G.lastTick) { G.lastTick = sec; if (sec <= 5 && sec > 0) sfx.tick(); }
      checkHits();
      if (G.phase === 'play' && G.timeLeft <= 0) { G.timeLeft = 0; timeUp(); }
      updateTimerUI();
    } else if (G.phase === 'reveal') {
      G.phaseT -= dt;
      if (G.phaseT <= 0) nextQuestion();
    }
  }

  function updateTeamBalls(dt) {
    const ptrs = activePointers();
    const balls = G.teamBalls;
    const canPlay = G.phase === 'play' || G.phase === 'intro';

    for (const t of balls) {
      if (t.holder && (!canPlay || G.lockedTeams[t.idx] || !ptrs.some(p => p.key === t.holder))) t.holder = null;
    }
    const taken = new Set(balls.map(t => t.holder).filter(Boolean));
    if (canPlay) {
      for (const t of balls) {
        if (t.holder || G.lockedTeams[t.idx]) continue;
        let best = null, bd = Infinity;
        for (const p of ptrs) {
          if (taken.has(p.key)) continue;
          const d = Math.hypot(p.x - t.x, p.y - t.y);
          const reach = p.touch ? t.r * 1.5 : t.r * 2.1;
          if (d < reach && d < bd) { bd = d; best = p; }
        }
        if (best) { t.holder = best.key; taken.add(best.key); sfx.grab(); }
      }
    }

    for (const t of balls) {
      const p = t.holder && ptrs.find(q => q.key === t.holder);
      if (p) {
        const k = Math.min(1, dt * (p.touch ? 30 : 20));
        const nx = t.x + (p.x - t.x) * k, ny = t.y + (p.y - t.y) * k;
        t.vx = (nx - t.x) / dt; t.vy = (ny - t.y) / dt;
        t.x = nx; t.y = ny;
      } else if (G.lockedTeams[t.idx] || G.phase === 'intro' || G.phase === 'reveal') {
        const k = Math.min(1, dt * 3);
        t.x += (t.homeX - t.x) * k; t.y += (t.homeY - t.y) * k;
        t.vx = t.vy = 0;
      } else {
        const fr = Math.pow(0.04, dt);
        t.vx *= fr; t.vy *= fr;
        t.x += t.vx * dt; t.y += t.vy * dt;
        if (t.x < t.r || t.x > W - t.r) t.vx *= -0.6;
        if (t.y > H - t.r) t.vy *= -0.6;
      }
      clampBall(t);
    }

    const [a, b] = balls;
    if (a && b) {
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, min = a.r + b.r;
      if (d < min) {
        const push = (min - d), nx = dx / d, ny = dy / d;
        const wa = a.holder && !b.holder ? 0 : b.holder && !a.holder ? 1 : 0.5;
        a.x -= nx * push * wa; a.y -= ny * push * wa;
        b.x += nx * push * (1 - wa); b.y += ny * push * (1 - wa);
        clampBall(a); clampBall(b);
      }
    }
  }

  function updateAnswers(dt) {
    for (const a of G.answers) {
      a.age += dt;
      if (a.age < a.delay) continue;
      const t = Math.min(1, (a.age - a.delay) / a.fallTime);
      const ease = 1 - Math.pow(1 - t, 3);
      const y = a.startY + (a.floorY - a.startY) * ease;
      const bob = Math.sin(G.t * 1.5 + a.phase) * a.r * 0.08 * t;
      a.y = y + bob;
      a.x = a.baseX + Math.sin(G.t * 0.8 + a.phase) * a.r * 0.2;
      a.spawnScale = Math.min(1, (a.age - a.delay) * 3);
    }
  }

  function checkHits() {
    for (const t of G.teamBalls) {
      if (G.lockedTeams[t.idx]) continue;
      for (const a of G.answers) {
        if (!a.alive || a.state !== 'normal' || a.age < a.delay + 0.3) continue;
        if (Math.hypot(t.x - a.x, t.y - a.y) < t.r + a.r * 0.92) { onHit(t, a); return; }
      }
    }
  }

  // ------------------------------------------------------------------
  // PARTIKEL
  // ------------------------------------------------------------------
  function burst(x, y, colors, n) {
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 150 + Math.random() * 520;
      G.particles.push({
        x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 160,
        life: 1, decay: 0.7 + Math.random() * 0.6,
        size: 4 + Math.random() * 8,
        color: colors[i % colors.length],
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12,
        rect: Math.random() < 0.5
      });
    }
  }
  function ring(x, y, color) { G.rings.push({ x, y, color, life: 1 }); }
  function updateParticles(dt) {
    for (const p of G.particles) {
      p.vy += 1300 * dt; p.vx *= Math.pow(0.4, dt);
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.rot += p.vr * dt; p.life -= p.decay * dt;
    }
    G.particles = G.particles.filter(p => p.life > 0 && p.y < H + 50);
    for (const r of G.rings) r.life -= dt * 1.6;
    G.rings = G.rings.filter(r => r.life > 0);
  }

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  const FONT = '"Fredoka", "Plus Jakarta Sans", system-ui, sans-serif';

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    G.answers.forEach(drawAnswer);
    G.teamBalls.forEach(drawTeamBall);
    drawRings();
    drawParticles();
    drawHands();
    updateCamStatus();
  }

  function buildBg() {
    const c = document.createElement('canvas');
    c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
    const g = c.getContext('2d');
    g.scale(DPR, DPR);
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0c1230'); grad.addColorStop(1, '#04060e');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    // cahaya lembut
    const glow = (x, y, r, col) => { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, col); rg.addColorStop(1, 'transparent'); g.fillStyle = rg; g.fillRect(0, 0, W, H); };
    glow(W * 0.5, H * 0.35, Math.max(W, H) * 0.55, 'rgba(124,92,255,.14)');
    glow(0, H, W * 0.45, 'rgba(244,63,94,.16)');
    glow(W, H, W * 0.45, 'rgba(59,130,246,.16)');
    // grid titik
    g.fillStyle = 'rgba(255,255,255,.06)';
    const step = 32;
    for (let y = step; y < H; y += step) for (let x = step; x < W; x += step) { g.beginPath(); g.arc(x, y, 1.1, 0, Math.PI * 2); g.fill(); }
    return c;
  }

  function drawBackground() {
    if (!bgCache) bgCache = buildBg();
    ctx.drawImage(bgCache, 0, 0, W, H);

    const v = tracker.video;
    if (CONFIG.showCamera > 0 && gestureOn() && v.readyState >= 2 && v.videoWidth) {
      const c = CONFIG.camCrop, vw = v.videoWidth, vh = v.videoHeight;
      ctx.save();
      ctx.globalAlpha = CONFIG.showCamera;
      ctx.translate(W, 0); ctx.scale(-1, 1);
      ctx.drawImage(v, (1 - c.x1) * vw, c.y0 * vh, (c.x1 - c.x0) * vw, (c.y1 - c.y0) * vh, 0, 0, W, H);
      ctx.restore();
      if (settings.filter) {
        // filter redup kekuningan agar layar tidak terlalu terang
        for (const col of CONFIG.warmFilter) { ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); }
      }
    }

    // zona awal tim
    for (const t of G.teamBalls) {
      ctx.save();
      ctx.setLineDash([6, 8]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = t.team.main + '80';
      ctx.beginPath(); ctx.arc(t.homeX, t.homeY, t.r + 12, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `600 ${Math.round(Math.max(12, t.r * 0.3))}px ${FONT}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillStyle = t.team.light + 'cc';
      ctx.fillText(t.team.name, t.homeX, t.homeY + t.r + 18);
      ctx.restore();
    }
  }

  function wrapLines(text, maxW) {
    const words = text.split(/\s+/), lines = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (!cur || ctx.measureText(t).width <= maxW) cur = t; else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function layoutText(text, r) {
    const maxW = r * 1.5, maxH = r * 1.0;
    let size = Math.round(r * 0.42), lines = [text];
    for (; size >= 11; size -= 1) {
      ctx.font = `600 ${size}px ${FONT}`;
      lines = wrapLines(text, maxW);
      if (lines.length * size * 1.08 <= maxH && lines.every(l => ctx.measureText(l).width <= maxW)) break;
    }
    return { size, lines, r };
  }

  function sphere(x, y, r, c1, c2, c3) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r * 1.05);
    g.addColorStop(0, c1); g.addColorStop(0.55, c2); g.addColorStop(1, c3);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    // pantulan atas
    const hl = ctx.createLinearGradient(x, y - r, x, y);
    hl.addColorStop(0, 'rgba(255,255,255,.45)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl;
    ctx.beginPath(); ctx.ellipse(x, y - r * 0.45, r * 0.62, r * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    // garis tepi
    ctx.lineWidth = Math.max(1.5, r * 0.03);
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.arc(x, y, r - ctx.lineWidth / 2, 0, Math.PI * 2); ctx.stroke();
  }

  function drawAnswer(a) {
    if (!a.alive || a.age < a.delay) return;
    const r = a.r * (0.6 + 0.4 * (a.spawnScale ?? 1));
    const { x, y } = a;
    ctx.save();
    if (a.state === 'fade') ctx.globalAlpha = 0.22;

    if (a.state === 'win' || a.state === 'reveal') {
      const col = a.state === 'win' ? '#facc15' : '#22c55e';
      const pulse = Math.sin(G.t * 7) * 4;
      ctx.shadowColor = col; ctx.shadowBlur = 36;
      ctx.lineWidth = 5; ctx.strokeStyle = col;
      ctx.beginPath(); ctx.arc(x, y, r + 10 + pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // bayangan
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(x, y + r * 1.08, r * 0.7, r * 0.12, 0, 0, Math.PI * 2); ctx.fill();

    sphere(x, y, r, a.colors[0], a.colors[1], a.colors[2]);

    // label huruf
    const br = Math.max(11, r * 0.2), bx = x, by = y - r * 0.66;
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = a.colors[2];
    ctx.font = `700 ${Math.round(br * 1.2)}px ${FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(a.letter, bx, by + 1);

    // teks
    if (!a.layout || a.layout.r !== a.r) a.layout = layoutText(a.text, a.r);
    const L = a.layout, s = r / a.r;
    const size = L.size * s, lh = size * 1.08;
    ctx.font = `600 ${size}px ${FONT}`;
    const startY = y + r * 0.12 - (L.lines.length - 1) * lh / 2;
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 1;
    ctx.fillStyle = '#fff';
    L.lines.forEach((line, i) => ctx.fillText(line, x, startY + i * lh));
    ctx.restore();
  }

  function drawTeamBall(t) {
    const locked = G.lockedTeams[t.idx];
    ctx.save();
    if (locked) ctx.globalAlpha = 0.3;

    if (t.holder) {
      ctx.shadowColor = t.team.main; ctx.shadowBlur = 30;
      ctx.lineWidth = 3; ctx.strokeStyle = t.team.light;
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r + 8 + Math.sin(G.t * 10) * 2, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (!locked && (G.phase === 'play' || G.phase === 'intro')) {
      // ajakan "ambil aku"
      const p = (G.t * 0.8 + t.idx * 0.5) % 1;
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(255,255,255,${0.35 * (1 - p)})`;
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r + 4 + p * t.r * 0.6, 0, Math.PI * 2); ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(t.x, t.y + t.r * 1.05, t.r * 0.7, t.r * 0.13, 0, 0, Math.PI * 2); ctx.fill();
    sphere(t.x, t.y, t.r, t.team.light, t.team.main, t.team.dark);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 6;
    ctx.font = `700 ${Math.round(t.r * 0.85)}px ${FONT}`;
    ctx.fillText(t.team.id, t.x, t.y + t.r * 0.05);
    ctx.restore();

    if (locked) {
      ctx.save();
      ctx.font = `${Math.round(t.r * 0.8)}px ${FONT}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🔒', t.x, t.y);
      ctx.restore();
    }
  }

  function drawRings() {
    for (const r of G.rings) {
      ctx.save();
      ctx.globalAlpha = r.life;
      ctx.lineWidth = 4 * r.life;
      ctx.strokeStyle = r.color;
      ctx.beginPath(); ctx.arc(r.x, r.y, 30 + (1 - r.life) * 160, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const p of G.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      if (p.rect) ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
  }

  function drawHands() {
    const holderColor = {};
    G.teamBalls.forEach(t => { if (t.holder) holderColor[t.holder] = t.team.main; });

    for (const h of G.hands) {
      if (h.missing > 0 || !h.pts) continue;
      const col = holderColor['h' + h.id] || (h.open ? '#22d3ee' : '#ffffff');
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath();
      for (const [a, b] of HAND_LINKS) { ctx.moveTo(h.pts[a].x, h.pts[a].y); ctx.lineTo(h.pts[b].x, h.pts[b].y); }
      ctx.stroke();
      ctx.fillStyle = col;
      for (const i of [4, 8, 12, 16, 20]) { ctx.beginPath(); ctx.arc(h.pts[i].x, h.pts[i].y, 4.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();

      ctx.save();
      const rr = Math.max(16, Math.min(W, H) * 0.02);
      ctx.lineWidth = 3; ctx.strokeStyle = col;
      ctx.fillStyle = h.open ? col + '40' : 'rgba(255,255,255,.08)';
      ctx.beginPath(); ctx.arc(h.x, h.y, rr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (!h.open) { ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(h.x, h.y, rr * 0.5, 0, Math.PI * 2); ctx.stroke(); }
      else { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(h.x, h.y, 4, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }

    for (const p of touchPointers.values()) {
      ctx.save();
      const col = holderColor[p.key] || '#ffffff';
      ctx.lineWidth = 2.5; ctx.strokeStyle = col;
      ctx.fillStyle = col + '22';
      ctx.beginPath(); ctx.arc(p.x, p.y, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }

  let lastStatus = '';
  function updateCamStatus() {
    let led, text;
    if (settings.mode === 'touch') {
      led = 'on'; text = 'Mode sentuh · sentuh & seret bola tim';
    } else if (G.paused) {
      led = ''; text = 'Kamera dinonaktifkan (jeda)';
    } else if (gestureOn()) {
      const n = G.hands.filter(h => !h.missing).length;
      const open = G.hands.filter(h => !h.missing && h.open).length;
      led = 'on'; text = `Kamera aktif · ${n} tangan · ${open} terbuka`;
    } else if (tracker.state === 'error') {
      led = 'err'; text = `Kamera tidak tersedia (${tracker.error}) · gunakan sentuhan`;
    } else {
      led = 'wait'; text = 'Mengaktifkan kamera…';
    }
    const s = led + text;
    if (s !== lastStatus) {
      $('camStatus').innerHTML = `<span class="led ${led}"></span>${esc(text)}`;
      lastStatus = s;
    }
  }

  // ------------------------------------------------------------------
  // CONFETTI
  // ------------------------------------------------------------------
  const cf = { canvas: $('confetti'), parts: [], until: 0 };
  const cctx = cf.canvas.getContext('2d');
  function resizeConfetti() { cf.canvas.width = innerWidth; cf.canvas.height = innerHeight; }
  function startConfetti(colors) {
    resizeConfetti();
    cf.parts = Array.from({ length: 180 }, () => ({
      x: Math.random() * innerWidth, y: -Math.random() * innerHeight,
      vy: 110 + Math.random() * 200, vx: (Math.random() - 0.5) * 80,
      s: 6 + Math.random() * 9, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 8,
      c: colors[Math.floor(Math.random() * colors.length)]
    }));
    cf.until = performance.now() + 6000;
  }
  function drawConfetti(dt, now) {
    if (!cf.parts.length) return;
    cctx.clearRect(0, 0, cf.canvas.width, cf.canvas.height);
    for (const p of cf.parts) {
      p.y += p.vy * dt; p.x += p.vx * dt; p.rot += p.vr * dt;
      if (p.y > cf.canvas.height + 20 && now < cf.until) { p.y = -20; p.x = Math.random() * cf.canvas.width; }
      cctx.save(); cctx.translate(p.x, p.y); cctx.rotate(p.rot);
      cctx.fillStyle = p.c; cctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      cctx.restore();
    }
    cf.parts = cf.parts.filter(p => p.y < cf.canvas.height + 30);
    if (!cf.parts.length) cctx.clearRect(0, 0, cf.canvas.width, cf.canvas.height);
  }

  // ------------------------------------------------------------------
  // LOOP UTAMA
  // ------------------------------------------------------------------
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (app.screen === 'quiz') {
      const hb = $('hud').getBoundingClientRect().bottom + 8;
      if (Math.abs(hb - playTop) > 1) resize();
      updateHands(now);
      if (!G.paused && G.phase !== 'idle') update(dt);
      render();
    } else if (app.screen === 'result') {
      drawConfetti(dt, now);
    }
    requestAnimationFrame(loop);
  }

  // ------------------------------------------------------------------
  // KONTROL
  // ------------------------------------------------------------------
  function setPaused(p) {
    if (app.screen !== 'quiz' || G.phase === 'idle' || p === G.paused) return;
    G.paused = p;
    $('pauseOverlay').classList.toggle('hidden', !p);
    setIcon($('btnPause'), p ? 'play' : 'pause');
    touchPointers.clear();
    G.teamBalls.forEach(t => (t.holder = null));
    if (settings.mode === 'gesture') {
      if (p) {
        stopCamera();
        $('pauseNote').textContent = 'Kamera dinonaktifkan sementara dan akan aktif lagi saat dilanjutkan.';
      } else {
        enableGesture();
      }
    } else {
      $('pauseNote').textContent = 'Tekan Lanjutkan untuk bermain lagi.';
    }
  }

  function goMenu() {
    startToken++;
    G.phase = 'idle';
    G.paused = false;
    G.answers = []; G.teamBalls = [];
    hideToast();
    stopCamera();
    $('pauseOverlay').classList.add('hidden');
    $('loading').classList.add('hidden');
    setIcon($('btnPause'), 'pause');
    G.skipResolve?.();
    cf.parts = [];
    renderSubjects(); updateSummary();
    showScreen('menu');
  }

  function bindUI() {
    $('btnStart').addEventListener('click', () => { if (settings.subject) startQuiz(); });
    $('btnFull').addEventListener('click', toggleFullscreen);
    $('btnFull2').addEventListener('click', toggleFullscreen);
    $('btnSound').addEventListener('click', () => { settings.sound = !settings.sound; saveSettings(); updateSoundBtn(); sfx.click(); });
    $('btnBank').addEventListener('click', () => { sfx.click(); openBank(); });
    $('bankClose').addEventListener('click', closeBank);
    $('bankModal').addEventListener('click', e => { if (e.target === $('bankModal')) closeBank(); });
    $('bankUseDefault').addEventListener('change', e => { useDefault[bankTab] = e.target.checked; saveBank(); renderBank(); });
    $('bankForm').addEventListener('submit', addQuestion);
    $('bankExport').addEventListener('click', exportBank);
    $('bankImport').addEventListener('change', importBank);

    $('btnPause').addEventListener('click', () => { sfx.click(); setPaused(!G.paused); });
    $('btnResume').addEventListener('click', () => { sfx.click(); setPaused(false); });
    $('btnRestart').addEventListener('click', () => { sfx.click(); $('pauseOverlay').classList.add('hidden'); G.paused = false; setIcon($('btnPause'), 'pause'); startQuiz(); });
    $('btnQuit').addEventListener('click', () => { sfx.click(); goMenu(); });
    $('btnExit').addEventListener('click', () => { sfx.click(); setPaused(true); });
    $('btnFilter').addEventListener('click', () => { settings.filter = !settings.filter; saveSettings(); updateFilterBtn(); sfx.click(); });
    $('btnSkip').addEventListener('click', () => { sfx.click(); if (!G.paused) skipQuestion(); });
    $('btnAgain').addEventListener('click', () => { cf.parts = []; startQuiz(); });
    $('btnHome').addEventListener('click', () => { sfx.click(); goMenu(); });
    $('btnSkipCam').addEventListener('click', () => {
      settings.mode = 'touch'; tracker.wanted = false; stopCamera();
      document.querySelectorAll('.mode').forEach(m => m.classList.toggle('sel', m.dataset.mode === 'touch'));
      updateSummary();
      G.skipResolve?.();
    });

    document.addEventListener('fullscreenchange', updateFullBtn);
    document.addEventListener('webkitfullscreenchange', updateFullBtn);
    document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', e => {
      if (e.target.matches('input, textarea')) return;
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'Escape' && !$('bankModal').classList.contains('hidden')) closeBank();
      if (app.screen === 'quiz' && (e.key === ' ' || e.key === 'p' || e.key === 'P')) { e.preventDefault(); setPaused(!G.paused); }
      if (app.screen === 'quiz' && (e.key === 'n' || e.key === 'N') && !G.paused) skipQuestion();
    });
    document.fonts?.ready.then(() => G.answers.forEach(a => (a.layout = null)));
  }

  // untuk debugging lewat konsol
  window.KuisGerak = { G, CONFIG, tracker, settings, step: (dt = 1 / 60) => { update(dt); render(); } };

  renderIcons();
  buildMenu();
  bindUI();
  setupPointer();
  requestAnimationFrame(loop);
})();
