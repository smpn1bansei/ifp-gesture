/*
 * KUIS GERAK – logika permainan + deteksi gesture tangan (MediaPipe Hand Landmarker)
 */
(() => {
  'use strict';

  // ------------------------------------------------------------------
  // KONFIGURASI
  // ------------------------------------------------------------------
  const CONFIG = {
    questionsPerGame: 10,      // jumlah soal per permainan (maks = jumlah soal di bank)
    pointsCorrect: 10,         // poin untuk jawaban benar
    lockWrongTeam: true,       // tim yang salah tidak bisa menjawab lagi di soal yang sama
    introSeconds: 2.2,         // lama tampilan "Soal ke-n" sebelum bola turun
    revealSeconds: 3,          // lama tampilan hasil sebelum soal berikutnya
    numHands: 4,               // maksimal tangan yang dideteksi sekaligus
    mpVersion: '0.10.14',
    modelUrl: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
    // Area kamera yang dipetakan ke layar (dipotong sedikit agar tepi layar mudah dijangkau)
    camCrop: { x0: 0.08, x1: 0.92, y0: 0.06, y1: 0.86 },
    showCamera: 0.32           // transparansi video kamera di latar (0 = tidak tampil)
  };
  const TIMES = [30, 45, 60, 90, 120];
  const LETTERS = 'ABCDEF';
  const ANSWER_COLORS = [
    ['#fde047', '#ca8a04'], ['#4ade80', '#15803d'], ['#c084fc', '#7e22ce'],
    ['#f472b6', '#be185d'], ['#2dd4bf', '#0f766e'], ['#fb923c', '#c2410c']
  ];
  const TEAMS = [
    { id: 'A', name: 'Tim A', light: '#fca5a5', main: '#ef4444', dark: '#991b1b' },
    { id: 'B', name: 'Tim B', light: '#93c5fd', main: '#3b82f6', dark: '#1e40af' }
  ];
  const HAND_LINKS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],
    [9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];

  const $ = id => document.getElementById(id);
  const bank = window.QUESTION_BANK;
  const app = { subject: null, time: 60, screen: 'menu' };

  // ------------------------------------------------------------------
  // SUARA (WebAudio, tanpa file)
  // ------------------------------------------------------------------
  const sfx = (() => {
    let ctx = null;
    const ac = () => {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    };
    function tone(freq, dur, type = 'sine', vol = 0.2, when = 0, slideTo) {
      try {
        const c = ac(), t = c.currentTime + when;
        const o = c.createOscillator(), g = c.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, t);
        if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(c.destination);
        o.start(t); o.stop(t + dur + 0.02);
      } catch (e) { /* audio tidak tersedia */ }
    }
    return {
      unlock: () => { try { ac(); } catch (e) {} },
      click: () => tone(700, 0.07, 'triangle', 0.15),
      grab: () => tone(520, 0.08, 'sine', 0.15, 0, 780),
      tick: () => tone(1100, 0.05, 'square', 0.06),
      pop: () => { tone(1200, 0.12, 'square', 0.12, 0, 200); tone(300, 0.15, 'triangle', 0.15, 0.02, 80); },
      wrong: () => { tone(220, 0.3, 'sawtooth', 0.14); tone(165, 0.4, 'sawtooth', 0.12, 0.15); },
      correct: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, 'triangle', 0.22, i * 0.09)),
      timeup: () => { tone(440, 0.2, 'square', 0.1); tone(330, 0.35, 'square', 0.1, 0.2); },
      start: () => [392, 523].forEach((f, i) => tone(f, 0.18, 'triangle', 0.18, i * 0.12)),
      win: () => [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', 0.2, i * 0.13))
    };
  })();

  // ------------------------------------------------------------------
  // MENU
  // ------------------------------------------------------------------
  function buildMenu() {
    const subWrap = $('subjects');
    Object.entries(bank).forEach(([key, s]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'subject';
      b.style.setProperty('--c', s.color);
      b.innerHTML = `<span class="ico">${s.icon}</span><span class="nm">${s.name}</span><small>${s.questions.length} soal</small>`;
      b.addEventListener('click', () => {
        app.subject = key;
        [...subWrap.children].forEach(c => c.classList.toggle('sel', c === b));
        $('btnStart').disabled = false;
        sfx.click();
      });
      subWrap.appendChild(b);
    });

    const timeWrap = $('times');
    TIMES.forEach(t => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (t === app.time ? ' sel' : '');
      b.innerHTML = `${t}<small>dtk</small>`;
      b.addEventListener('click', () => {
        app.time = t;
        [...timeWrap.children].forEach(c => c.classList.toggle('sel', c === b));
        sfx.click();
      });
      timeWrap.appendChild(b);
    });
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
      (el.requestFullscreen || el.webkitRequestFullscreen).call(el).catch?.(() => {});
    } else {
      (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    }
  }
  function updateFullBtn() {
    const on = !!(document.fullscreenElement || document.webkitFullscreenElement);
    $('btnFull').textContent = on ? '🗗 Keluar Layar Penuh' : '⛶ Layar Penuh';
    setTimeout(resize, 100);
  }

  // ------------------------------------------------------------------
  // KAMERA + DETEKSI TANGAN
  // ------------------------------------------------------------------
  const tracker = { video: $('cam'), landmarker: null, ready: false, failed: false, loading: null, lastVideoTime: -1, error: '' };

  function initTracking() {
    if (tracker.loading) return tracker.loading;
    tracker.loading = (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Browser tidak mendukung akses kamera (gunakan https / localhost).');
        setLoading('Meminta izin kamera…');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false
        });
        tracker.video.srcObject = stream;
        await tracker.video.play();

        setLoading('Memuat model pendeteksi tangan…');
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
        tracker.ready = true;
      } catch (err) {
        console.error(err);
        tracker.failed = true;
        tracker.error = err?.name === 'NotAllowedError' ? 'Izin kamera ditolak' : (err?.message || String(err));
      }
    })();
    return tracker.loading;
  }

  function setLoading(text) { $('loadingText').textContent = text; }

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
    if (!tracker.ready) return;
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

      // cocokkan dengan tangan pada frame sebelumnya (tracking sederhana)
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
    // tangan yang hilang sesaat tetap dipertahankan beberapa frame agar bola tidak terlepas
    for (const h of prev) {
      if (!used.has(h)) { h.missing = (h.missing || 0) + 1; if (h.missing <= 6) out.push(h); }
    }
    G.hands = out;
  }

  // Pointer sentuh/mouse sebagai cadangan (layar IFP juga layar sentuh)
  const touchPointers = new Map();
  function setupPointer() {
    const cv = $('stage');
    const pos = e => ({ x: e.clientX, y: e.clientY });
    cv.addEventListener('pointerdown', e => {
      sfx.unlock();
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* abaikan */ }
      touchPointers.set(e.pointerId, { key: 'p' + e.pointerId, ...pos(e), open: true });
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
  let W = innerWidth, H = innerHeight, DPR = 1, playTop = 200;

  const G = {
    questions: [], index: 0, scores: [0, 0],
    phase: 'idle', phaseT: 0, timeLeft: 0, lastTick: 0,
    paused: false, t: 0,
    teamBalls: [], answers: [], particles: [], hands: [],
    lockedTeams: [false, false]
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
    const hud = $('hud').getBoundingClientRect();
    playTop = hud.bottom + 8;

    const tr = teamRadius();
    G.teamBalls.forEach((t, i) => {
      t.r = tr;
      t.homeX = W * (i === 0 ? 0.2 : 0.8);
      t.homeY = H - tr - Math.max(16, H * 0.03);
      clampBall(t);
    });
    layoutAnswers();
    resizeConfetti();
  }

  const teamRadius = () => Math.max(38, Math.min(110, Math.min(W, H) * 0.075));

  function answerRadius(n) {
    return Math.max(50, Math.min(W / n * 0.36, (H - playTop) * 0.19, 170));
  }

  function layoutAnswers() {
    const n = G.answers.length;
    if (!n) return;
    const r = answerRadius(n);
    const margin = W * 0.04;
    const span = W - margin * 2;
    G.answers.forEach((a, i) => {
      a.r = r;
      a.baseX = margin + span * (i + 0.5) / n;
      a.floorY = playTop + r + (H - playTop - r) * 0.28;
      a.layout = null;
    });
  }

  // ------------------------------------------------------------------
  // ALUR KUIS
  // ------------------------------------------------------------------
  async function startQuiz() {
    sfx.unlock();
    showScreen('quiz');
    G.paused = false;
    $('pauseOverlay').classList.add('hidden');

    if (!tracker.ready && !tracker.failed && !G.skipCam) {
      $('loading').classList.remove('hidden');
      $('btnSkipCam').classList.add('hidden');
      const skipTimer = setTimeout(() => $('btnSkipCam').classList.remove('hidden'), 2500);
      await Promise.race([initTracking(), new Promise(r => (G.skipResolve = r))]);
      clearTimeout(skipTimer);
      $('loading').classList.add('hidden');
    }
    if (app.screen !== 'quiz') return;
    newGame();
  }

  function newGame() {
    const s = bank[app.subject];
    const qs = shuffle(s.questions.slice()).slice(0, Math.min(CONFIG.questionsPerGame, s.questions.length));
    G.questions = qs.map(q => ({
      q: q.q,
      options: shuffle(q.options.map((text, i) => ({ text, correct: i === q.answer })))
    }));
    G.index = 0;
    G.scores = [0, 0];
    G.particles = [];
    G.teamBalls = TEAMS.map((team, i) => ({ team, idx: i, x: 0, y: 0, vx: 0, vy: 0, r: 60, holder: null, homeX: 0, homeY: 0 }));
    resize();
    G.teamBalls.forEach(t => { t.x = t.homeX; t.y = t.homeY; });
    $('qsubject').textContent = `${s.icon} ${s.name}`;
    updateScores();
    sfx.start();
    beginQuestion();
  }

  function beginQuestion() {
    const q = G.questions[G.index];
    G.answers = [];
    G.lockedTeams = [false, false];
    G.teamBalls.forEach(t => { t.holder = null; t.vx = t.vy = 0; });
    $('qnum').textContent = `Soal ${G.index + 1}/${G.questions.length}`;
    $('qtext').textContent = q.q;
    $('qtext').classList.toggle('long', q.q.length > 70);
    $('boxA').classList.remove('out'); $('boxB').classList.remove('out');
    G.timeLeft = app.time;
    G.lastTick = Math.ceil(app.time);
    updateTimerUI();
    G.phase = 'intro';
    G.phaseT = CONFIG.introSeconds;
    showBanner(`Soal ${G.index + 1}<small>Bersiap!</small>`, 'info', CONFIG.introSeconds * 1000 - 200);
  }

  function spawnAnswers() {
    const q = G.questions[G.index];
    const n = q.options.length;
    const fallTime = Math.max(5, Math.min(12, app.time * 0.3));
    G.answers = q.options.map((o, i) => ({
      text: o.text, correct: o.correct, letter: LETTERS[i],
      colors: ANSWER_COLORS[i % ANSWER_COLORS.length],
      x: 0, y: 0, baseX: 0, floorY: 0, r: 60,
      alive: true, state: 'normal',
      delay: i * 0.35 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
      fallTime, layout: null
    }));
    layoutAnswers();
    G.answers.forEach(a => { a.x = a.baseX; a.y = playTop - a.r * 2.2; a.startY = a.y; a.age = 0; });
    G.phase = 'play';
  }

  function onHit(team, ball, ans) {
    if (ans.correct) {
      G.scores[team.idx] += CONFIG.pointsCorrect;
      ans.state = 'win';
      updateScores(team.idx);
      burst(ans.x, ans.y, [team.team.main, '#facc15', '#ffffff', ans.colors[0]], 90, ans.r * 0.03);
      sfx.correct();
      showBanner(`${team.team.name} BENAR! 🎉<small>+${CONFIG.pointsCorrect} poin</small>`, 'good ' + (team.idx ? 'blue' : 'red'), CONFIG.revealSeconds * 1000 - 300);
      ball.holder = null;
      G.answers.forEach(a => { if (a !== ans && a.alive) a.state = 'fade'; });
      endQuestion();
    } else {
      // jawaban salah: bola jawaban pecah
      ans.alive = false;
      burst(ans.x, ans.y, ans.colors.concat('#ffffff'), 50, ans.r * 0.025);
      sfx.pop(); sfx.wrong();
      ball.holder = null;
      const away = Math.atan2(ball.y - ans.y, ball.x - ans.x);
      ball.vx = Math.cos(away) * 900; ball.vy = Math.sin(away) * 900;

      const other = 1 - team.idx;
      if (CONFIG.lockWrongTeam) {
        G.lockedTeams[team.idx] = true;
        $(team.idx ? 'boxB' : 'boxA').classList.add('out');
      }
      const remaining = G.answers.filter(a => a.alive);
      if (G.lockedTeams[0] && G.lockedTeams[1]) {
        revealCorrect(`Kedua tim salah 😅`);
      } else if (remaining.length === 1 && remaining[0].correct && CONFIG.lockWrongTeam && G.lockedTeams[other]) {
        revealCorrect(`${team.team.name} salah`);
      } else {
        const nextTeam = CONFIG.lockWrongTeam ? TEAMS[other].name : 'Tim lain';
        showBanner(`${team.team.name} salah! ❌<small>${nextTeam}, ayo cari jawaban yang benar!</small>`, 'bad', 1800);
      }
    }
  }

  function revealCorrect(title) {
    const ans = G.answers.find(a => a.correct);
    G.answers.forEach(a => { if (a.alive) a.state = a.correct ? 'reveal' : 'fade'; });
    G.teamBalls.forEach(t => (t.holder = null));
    showBanner(`${title}<small>Jawaban benar: ${ans ? ans.letter + '. ' + ans.text : '-'}</small>`, 'bad', CONFIG.revealSeconds * 1000 - 300);
    endQuestion();
  }

  function timeUp() {
    sfx.timeup();
    revealCorrect('⏰ Waktu habis!');
  }

  function endQuestion() {
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
    hideBanner();
    const [a, b] = G.scores;
    $('finalA').textContent = a;
    $('finalB').textContent = b;
    document.querySelector('.final.red').classList.toggle('win', a > b);
    document.querySelector('.final.blue').classList.toggle('win', b > a);
    $('winnerText').textContent = a > b ? 'Tim A Menang! 🎉' : b > a ? 'Tim B Menang! 🎉' : 'Hasil Seri! 🤝';
    $('winnerText').style.color = a > b ? '#f87171' : b > a ? '#60a5fa' : '#facc15';
    $('trophy').textContent = a === b ? '🤝' : '🏆';
    const s = bank[app.subject];
    $('resultSubject').textContent = `${s.icon} ${s.name} · ${G.questions.length} soal · ${app.time} detik/soal`;
    showScreen('result');
    sfx.win();
    startConfetti(a === b ? ['#facc15', '#ffffff'] : a > b ? ['#ef4444', '#fca5a5', '#facc15'] : ['#3b82f6', '#93c5fd', '#facc15']);
  }

  function updateScores(bumpIdx) {
    $('scoreA').textContent = G.scores[0];
    $('scoreB').textContent = G.scores[1];
    if (bumpIdx !== undefined) {
      const el = $(bumpIdx ? 'boxB' : 'boxA');
      el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    }
  }

  function updateTimerUI() {
    const t = Math.max(0, G.timeLeft);
    $('timeNum').textContent = Math.ceil(t);
    $('timefill').style.width = (t / app.time * 100) + '%';
    const warn = t <= 5 && G.phase === 'play';
    $('timebar').classList.toggle('warn', warn);
    document.querySelector('.timenum').classList.toggle('warn', warn);
  }

  let bannerTimer = 0;
  function showBanner(html, cls, ms) {
    const b = $('banner');
    b.innerHTML = html;
    b.className = 'banner show ' + (cls || '');
    clearTimeout(bannerTimer);
    if (ms) bannerTimer = setTimeout(hideBanner, ms);
  }
  function hideBanner() { $('banner').classList.remove('show'); }

  // ------------------------------------------------------------------
  // UPDATE (fisika & logika per frame)
  // ------------------------------------------------------------------
  function clampBall(t) {
    t.x = Math.max(t.r, Math.min(W - t.r, t.x));
    t.y = Math.max(playTop * 0.5 + t.r * 0.5, Math.min(H - t.r, t.y));
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

    // lepas bola bila pointer pemegang hilang / tangan mengepal
    for (const t of balls) {
      if (t.holder && (!canPlay || G.lockedTeams[t.idx] || !ptrs.some(p => p.key === t.holder))) t.holder = null;
    }
    // ambil bola: telapak terbuka di dekat bola
    const taken = new Set(balls.map(t => t.holder).filter(Boolean));
    if (canPlay) {
      for (const t of balls) {
        if (t.holder || G.lockedTeams[t.idx]) continue;
        let best = null, bd = Infinity;
        for (const p of ptrs) {
          if (taken.has(p.key)) continue;
          const d = Math.hypot(p.x - t.x, p.y - t.y);
          if (d < t.r * 1.9 && d < bd) { bd = d; best = p; }
        }
        if (best) { t.holder = best.key; taken.add(best.key); sfx.grab(); }
      }
    }

    for (const t of balls) {
      const p = t.holder && ptrs.find(q => q.key === t.holder);
      if (p) {
        const k = Math.min(1, dt * 20);
        const nx = t.x + (p.x - t.x) * k, ny = t.y + (p.y - t.y) * k;
        t.vx = (nx - t.x) / dt; t.vy = (ny - t.y) / dt;
        t.x = nx; t.y = ny;
      } else if (G.lockedTeams[t.idx] || G.phase === 'intro' || G.phase === 'reveal') {
        // kembali ke posisi awal
        const k = Math.min(1, dt * 3);
        t.x += (t.homeX - t.x) * k; t.y += (t.homeY - t.y) * k;
        t.vx = t.vy = 0;
      } else {
        const fr = Math.pow(0.04, dt);
        t.vx *= fr; t.vy *= fr;
        t.x += t.vx * dt; t.y += t.vy * dt;
        if (t.x < t.r || t.x > W - t.r) t.vx *= -0.6;
        if (t.y < playTop * 0.5 + t.r * 0.5 || t.y > H - t.r) t.vy *= -0.6;
      }
      clampBall(t);
    }

    // tabrakan bola merah vs biru (saling dorong)
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
      const ease = 1 - Math.pow(1 - t, 2);
      const targetY = a.startY + (a.floorY - a.startY) * ease;
      const bob = t >= 1 ? Math.sin(G.t * 1.6 + a.phase) * a.r * 0.08 : 0;
      a.y = targetY + bob;
      a.x = a.baseX + Math.sin(G.t * 0.9 + a.phase) * a.r * 0.18;
    }
  }

  function checkHits() {
    for (const t of G.teamBalls) {
      if (G.lockedTeams[t.idx]) continue;
      for (const a of G.answers) {
        if (!a.alive || a.state !== 'normal' || a.age < a.delay) continue;
        if (Math.hypot(t.x - a.x, t.y - a.y) < t.r + a.r * 0.92) {
          onHit(t, t, a);
          return;
        }
      }
    }
  }

  // ------------------------------------------------------------------
  // PARTIKEL
  // ------------------------------------------------------------------
  function burst(x, y, colors, n, speed) {
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = (200 + Math.random() * 600) * Math.max(0.6, speed);
      G.particles.push({
        x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 200,
        life: 1, decay: 0.6 + Math.random() * 0.6,
        size: 5 + Math.random() * 10,
        color: colors[i % colors.length],
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12,
        rect: Math.random() < 0.5
      });
    }
  }
  function updateParticles(dt) {
    for (const p of G.particles) {
      p.vy += 1400 * dt; p.vx *= Math.pow(0.4, dt);
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.rot += p.vr * dt; p.life -= p.decay * dt;
    }
    G.particles = G.particles.filter(p => p.life > 0 && p.y < H + 50);
  }

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  const FONT = '"Baloo 2", system-ui, "Segoe UI", sans-serif';

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    G.answers.forEach(drawAnswer);
    G.teamBalls.forEach(drawTeamBall);
    drawParticles();
    drawHands();
    updateCamStatus();
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#111a44'); g.addColorStop(1, '#070b1d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    const v = tracker.video;
    if (CONFIG.showCamera > 0 && tracker.ready && v.readyState >= 2 && v.videoWidth) {
      const c = CONFIG.camCrop, vw = v.videoWidth, vh = v.videoHeight;
      ctx.save();
      ctx.globalAlpha = CONFIG.showCamera;
      ctx.translate(W, 0); ctx.scale(-1, 1);
      ctx.drawImage(v, (1 - c.x1) * vw, c.y0 * vh, (c.x1 - c.x0) * vw, (c.y1 - c.y0) * vh, 0, 0, W, H);
      ctx.restore();
    }

    // zona awal tim
    for (const t of G.teamBalls) {
      ctx.save();
      ctx.setLineDash([12, 10]);
      ctx.lineWidth = 4;
      ctx.strokeStyle = t.team.main + '88';
      ctx.beginPath(); ctx.arc(t.homeX, t.homeY, t.r + 10, 0, Math.PI * 2); ctx.stroke();
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
    const maxW = r * 1.5, maxH = r * 1.05;
    let size = Math.round(r * 0.46), lines = [text];
    for (; size >= 12; size -= 2) {
      ctx.font = `800 ${size}px ${FONT}`;
      lines = wrapLines(text, maxW);
      if (lines.length * size * 1.05 <= maxH && lines.every(l => ctx.measureText(l).width <= maxW)) break;
    }
    return { size, lines, r };
  }

  function glossyBall(x, y, r, light, dark) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, light); g.addColorStop(1, dark);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    // kilau
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.5, r * 0.32, r * 0.18, -0.6, 0, Math.PI * 2); ctx.fill();
  }

  function drawAnswer(a) {
    if (!a.alive || a.age < a.delay) return;
    const { x, y, r } = a;
    ctx.save();
    if (a.state === 'fade') ctx.globalAlpha = 0.25;

    if (a.state === 'win' || a.state === 'reveal') {
      const pulse = 1 + Math.sin(G.t * 8) * 0.06;
      ctx.shadowColor = a.state === 'win' ? '#facc15' : '#22c55e';
      ctx.shadowBlur = 50;
      ctx.lineWidth = 12;
      ctx.strokeStyle = ctx.shadowColor;
      ctx.beginPath(); ctx.arc(x, y, r * pulse + 10, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
    glossyBall(x, y, r, a.colors[0], a.colors[1]);
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = Math.max(4, r * 0.05);
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();

    // huruf pilihan
    const br = r * 0.24, bx = x, by = y - r * 0.82;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = a.colors[1]; ctx.stroke();
    ctx.fillStyle = a.colors[1];
    ctx.font = `800 ${Math.round(br * 1.3)}px ${FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(a.letter, bx, by + br * 0.08);

    // teks jawaban
    if (!a.layout || a.layout.r !== r) a.layout = layoutText(a.text, r);
    const L = a.layout;
    ctx.font = `800 ${L.size}px ${FONT}`;
    const lh = L.size * 1.05;
    const startY = y + r * 0.08 - (L.lines.length - 1) * lh / 2;
    ctx.lineJoin = 'round';
    L.lines.forEach((line, i) => {
      ctx.lineWidth = Math.max(3, L.size * 0.16);
      ctx.strokeStyle = 'rgba(0,0,0,.35)';
      ctx.strokeText(line, x, startY + i * lh);
      ctx.fillStyle = '#fff';
      ctx.fillText(line, x, startY + i * lh);
    });
    ctx.restore();
  }

  function drawTeamBall(t) {
    const locked = G.lockedTeams[t.idx];
    ctx.save();
    if (locked) ctx.globalAlpha = 0.35;

    if (t.holder) {
      ctx.shadowColor = t.team.light; ctx.shadowBlur = 40;
      ctx.lineWidth = 8; ctx.strokeStyle = '#fff';
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r + 10 + Math.sin(G.t * 10) * 3, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8;
    glossyBall(t.x, t.y, t.r, t.team.light, t.team.dark);
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = Math.max(4, t.r * 0.07); ctx.strokeStyle = '#fff';
    ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.round(t.r * 0.32)}px ${FONT}`;
    ctx.fillText('TIM', t.x, t.y - t.r * 0.32);
    ctx.font = `800 ${Math.round(t.r * 0.8)}px ${FONT}`;
    ctx.fillText(t.team.id, t.x, t.y + t.r * 0.18);
    ctx.restore();

    if (locked) {
      ctx.save();
      ctx.font = `800 ${Math.round(t.r * 1.1)}px ${FONT}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('❌', t.x, t.y);
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
      const col = holderColor['h' + h.id] || (h.open ? '#22c55e' : '#ffffff');
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath();
      for (const [a, b] of HAND_LINKS) { ctx.moveTo(h.pts[a].x, h.pts[a].y); ctx.lineTo(h.pts[b].x, h.pts[b].y); }
      ctx.stroke();
      ctx.fillStyle = col;
      for (const i of [4, 8, 12, 16, 20]) { ctx.beginPath(); ctx.arc(h.pts[i].x, h.pts[i].y, 7, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();

      // kursor telapak
      ctx.save();
      const rr = Math.max(22, Math.min(W, H) * 0.028);
      ctx.lineWidth = 6; ctx.strokeStyle = col;
      ctx.fillStyle = h.open ? col + '55' : 'rgba(255,255,255,.12)';
      ctx.beginPath(); ctx.arc(h.x, h.y, rr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.font = `${Math.round(rr * 1.1)}px ${FONT}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(h.open ? '🖐️' : '✊', h.x, h.y + 2);
      ctx.restore();
    }

    for (const p of touchPointers.values()) {
      ctx.save();
      ctx.lineWidth = 4; ctx.strokeStyle = holderColor[p.key] || '#fff';
      ctx.beginPath(); ctx.arc(p.x, p.y, 26, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  }

  let lastStatus = '';
  function updateCamStatus() {
    let s;
    if (tracker.ready) {
      const n = G.hands.filter(h => !h.missing).length;
      const open = G.hands.filter(h => !h.missing && h.open).length;
      s = `📷 Kamera aktif · ${n} tangan terdeteksi · ${open} 🖐️ terbuka`;
    } else if (tracker.failed) {
      s = `⚠️ Kamera tidak tersedia (${tracker.error}) · gunakan sentuhan layar`;
    } else if (tracker.loading) {
      s = '⏳ Memuat kamera… sementara gunakan sentuhan layar';
    } else {
      s = '👆 Mode sentuh';
    }
    if (s !== lastStatus) { $('camStatus').textContent = s; lastStatus = s; }
  }

  // ------------------------------------------------------------------
  // CONFETTI HALAMAN HASIL
  // ------------------------------------------------------------------
  const cf = { canvas: $('confetti'), parts: [], until: 0 };
  const cctx = cf.canvas.getContext('2d');
  function resizeConfetti() { cf.canvas.width = innerWidth; cf.canvas.height = innerHeight; }
  function startConfetti(colors) {
    resizeConfetti();
    cf.parts = Array.from({ length: 220 }, () => ({
      x: Math.random() * innerWidth, y: -Math.random() * innerHeight,
      vy: 120 + Math.random() * 220, vx: (Math.random() - 0.5) * 80,
      s: 8 + Math.random() * 10, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 8,
      c: colors[Math.floor(Math.random() * colors.length)]
    }));
    cf.until = performance.now() + 7000;
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
  }

  // ------------------------------------------------------------------
  // LOOP UTAMA
  // ------------------------------------------------------------------
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (app.screen === 'quiz') {
      // tinggi HUD bisa berubah (soal 1–3 baris) → atur ulang area main
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
    if (G.phase === 'idle' && p) return;
    G.paused = p;
    $('pauseOverlay').classList.toggle('hidden', !p);
    touchPointers.clear();
  }
  function goMenu() {
    G.phase = 'idle';
    G.paused = false;
    G.answers = [];
    hideBanner();
    $('pauseOverlay').classList.add('hidden');
    $('loading').classList.add('hidden');
    G.skipResolve?.();
    showScreen('menu');
  }

  function bindUI() {
    $('btnStart').addEventListener('click', () => { if (app.subject) startQuiz(); });
    $('btnFull').addEventListener('click', toggleFullscreen);
    $('btnFull2').addEventListener('click', toggleFullscreen);
    $('btnPause').addEventListener('click', () => { sfx.click(); setPaused(!G.paused); });
    $('btnResume').addEventListener('click', () => { sfx.click(); setPaused(false); });
    $('btnQuit').addEventListener('click', () => { sfx.click(); goMenu(); });
    $('btnExit').addEventListener('click', () => { sfx.click(); setPaused(true); });
    $('btnAgain').addEventListener('click', () => { cf.parts = []; startQuiz(); });
    $('btnHome').addEventListener('click', () => { cf.parts = []; sfx.click(); goMenu(); });
    $('btnSkipCam').addEventListener('click', () => { G.skipCam = true; G.skipResolve?.(); });
    document.addEventListener('fullscreenchange', updateFullBtn);
    document.addEventListener('webkitfullscreenchange', updateFullBtn);
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', e => {
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (app.screen === 'quiz' && (e.key === ' ' || e.key === 'Escape' || e.key === 'p')) {
        if (e.key === 'Escape' && document.fullscreenElement) return;
        e.preventDefault(); setPaused(!G.paused);
      }
    });
    document.fonts?.ready.then(() => G.answers.forEach(a => (a.layout = null)));
  }

  window.KuisGerak = { G, CONFIG, tracker }; // untuk debugging lewat konsol

  buildMenu();
  bindUI();
  setupPointer();
  requestAnimationFrame(loop);
})();
