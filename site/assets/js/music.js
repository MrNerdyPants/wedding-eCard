/* ============================================================
   The e-card — background music
   ------------------------------------------------------------
   Settings live in config.js (window.WALIMA.music).

   Three things this has to get right:

   1. Mobile browsers refuse to play audio until the user has
      interacted, so nothing starts until the wax seal is tapped —
      which is the right dramatic moment anyway.

   2. MP3 encoders pad the start and end of a file, so a plain
      <audio loop> clicks audibly every cycle. We decode through
      the Web Audio API instead, which loops sample-accurately.
      A plain <audio> element is kept as a fallback.

   3. Nobody should be ambushed by sound. The mute control is
      always one tap away and the choice is remembered.
   ============================================================ */

window.WalimaMusic = (function () {
  'use strict';

  const CFG = (window.WALIMA && window.WALIMA.music) || null;
  const KEY = 'walima.music.muted';

  let btn = null;
  let available = false;
  let muted = false;
  let started = false;
  let wanted = false;          // the card has been opened
  let probed = false;

  let ctx = null, gain = null, source = null, buffer = null;
  let audioEl = null;                 // fallback path
  let loading = null;

  try { muted = localStorage.getItem(KEY) === '1'; } catch (_) { muted = false; }

  /* ---------- the control ---------- */

  const ICON_ON =
    '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>';
  const ICON_OFF =
    '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="m17 9.5 5 5M22 9.5l-5 5"/>';

  function paint() {
    if (!btn) return;
    const svg = btn.querySelector('svg');
    if (svg) svg.innerHTML = muted ? ICON_OFF : ICON_ON;
    btn.setAttribute('aria-pressed', String(!muted));
    btn.setAttribute('aria-label', muted ? 'Turn music on' : 'Turn music off');
    btn.title = muted ? 'Turn music on' : 'Turn music off';
    btn.classList.toggle('is-muted', muted);
  }

  function show() {
    if (!btn || !available) return;
    btn.hidden = false;
    requestAnimationFrame(() => btn.classList.add('is-in'));
  }

  /* ---------- loading ---------- */

  function load() {
    if (loading) return loading;

    loading = fetch(CFG.src, { cache: 'force-cache' })
      .then(r => {
        if (!r.ok) throw new Error('missing');
        return r.arrayBuffer();
      })
      .then(buf => new Promise((res, rej) => {
        // callback form: older Safari doesn't return a promise
        const done = (b) => { buffer = b; res(b); };
        const fail = (e) => rej(e || new Error('decode'));
        const p = ctx.decodeAudioData(buf, done, fail);
        if (p && p.then) p.then(done, fail);
      }));

    return loading;
  }

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    return ctx;
  }

  function fadeTo(target, seconds) {
    if (!ctx || !gain) return;
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(target, now + seconds);
  }

  function playBuffer() {
    if (!buffer || source) return;
    source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    if (CFG.loopStart) source.loopStart = CFG.loopStart;
    if (CFG.loopEnd)   source.loopEnd   = CFG.loopEnd;
    source.connect(gain);
    source.start(0);
    fadeTo(CFG.volume, CFG.fadeIn);
  }

  function stopBuffer() {
    fadeTo(0, 0.6);
    const s = source;
    source = null;
    if (s) setTimeout(() => { try { s.stop(); } catch (_) {} }, 700);
  }

  /* ---------- fallback for browsers without usable Web Audio ---------- */

  function playElement() {
    if (!audioEl) {
      audioEl = new Audio(CFG.src);
      audioEl.loop = true;
      audioEl.preload = 'auto';
    }
    audioEl.volume = CFG.volume;
    audioEl.play().catch(() => {});
  }

  /* ---------- public ---------- */

  function start() {
    wanted = true;
    if (!CFG) return;
    if (!probed) return;                 // HEAD still in flight; resolve() retries
    show();
    if (!available || started || muted) return;
    started = true;

    if (!ensureCtx()) { playElement(); return; }
    if (ctx.state === 'suspended') ctx.resume();

    load().then(playBuffer).catch(() => {
      /* decoding failed on this device — try the plain element */
      playElement();
    });
  }

  function toggle() {
    muted = !muted;
    try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch (_) {}
    paint();

    if (muted) {
      if (source) stopBuffer();
      if (audioEl) audioEl.pause();
      return;
    }

    if (!started) { start(); return; }
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      if (!source) { load().then(playBuffer).catch(playElement); }
      else fadeTo(CFG.volume, 1.2);
    } else if (audioEl) {
      playElement();
    }
  }

  function init() {
    if (!CFG || !CFG.src) return;

    btn = document.getElementById('musicBtn');
    if (!btn) return;
    btn.addEventListener('click', toggle);
    paint();

    /* only offer the control if the file is actually there, so a
       project without an audio file shows no dead button */
    fetch(CFG.src, { method: 'HEAD' })
      .then(r => { available = r.ok; })
      .catch(() => { available = false; })
      .then(() => { probed = true; if (wanted) start(); });

    document.addEventListener('visibilitychange', () => {
      if (!available || muted) return;
      if (document.hidden) {
        if (ctx && source) fadeTo(0, 0.4);
        if (audioEl) audioEl.pause();
      } else {
        if (ctx && source) { if (ctx.state === 'suspended') ctx.resume(); fadeTo(CFG.volume, 1.2); }
        else if (audioEl) playElement();
      }
    });
  }

  return { init, start, toggle, isMuted: () => muted };
})();
