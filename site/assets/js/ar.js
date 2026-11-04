/* ============================================================
   Abdullah & Fiza — AR view (switched off: see README)
   Settings live in config.js. This file only drives the scene.
   ============================================================ */

(function () {
  'use strict';

  const CONFIG = window.WALIMA;
  const H = CONFIG.helpers;
  const $ = (id) => document.getElementById(id);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const guest = H.guest();
  if (guest) {
    $('guestChip').textContent = guest;
    $('guestChip').hidden = false;
  }

  /* ---------- action bar ------------------------------------- */

  $('arMap').href = H.mapUrl();
  $('arCal').addEventListener('click', H.downloadIcs);

  const rsvpHref = H.rsvpHref(guest);
  if (rsvpHref) {
    $('arRsvp').href = rsvpHref;
    $('arRsvp').hidden = false;
  }

  /* ---------- lazy-load the AR libraries -----------------------
     A-Frame must finish loading BEFORE any <a-scene> exists in the
     DOM: registerSystem() initialises systems against a scene that
     is already present, before that scene has built its renderer,
     and the whole library then fails to define AFRAME. Keeping the
     scene in a <template> and fetching the libraries here avoids
     that — and saves ~3 MB for anyone who never starts AR.        */

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = resolve;
      s.onerror = () => reject(new Error('load failed: ' + src));
      document.head.appendChild(s);
    });
  }

  let libsReady = null;
  function loadLibraries() {
    if (!libsReady) {
      libsReady = (async () => {
        await loadScript('assets/vendor/aframe.min.js');
        if (!window.AFRAME) throw new Error('AFRAME unavailable');
        await loadScript('assets/vendor/mindar-image-aframe.prod.js');
        if (!AFRAME.components['mindar-image']) throw new Error('MindAR unavailable');
      })().catch(err => { libsReady = null; throw err; });
    }
    return libsReady;
  }

  /* ---------- gold motes ------------------------------------- */

  function buildMotes(n) {
    const holder = $('motes');
    if (!holder || holder.childElementCount) return;

    for (let i = 0; i < n; i++) {
      const x  = (Math.random() - .5) * 1.15;
      const y0 = -0.85 + Math.random() * 0.35;
      const y1 = y0 + 1.5 + Math.random() * 0.7;
      const z  = 0.05 + Math.random() * 0.34;
      const s  = 0.022 + Math.random() * 0.05;
      const dur   = 5200 + Math.random() * 4600;
      const delay = Math.random() * 4200;
      const drift = (Math.random() - .5) * 0.2;

      const m = document.createElement('a-plane');
      m.setAttribute('src', '#imgMote');
      m.setAttribute('width', s.toFixed(3));
      m.setAttribute('height', s.toFixed(3));
      m.setAttribute('position', `${x.toFixed(3)} ${y0.toFixed(3)} ${z.toFixed(3)}`);
      m.setAttribute('material',
        'shader: flat; transparent: true; blending: additive; depthTest: false; opacity: 0');

      if (!reduced) {
        m.setAttribute('animation__rise',
          `property: position; from: ${x.toFixed(3)} ${y0.toFixed(3)} ${z.toFixed(3)};` +
          ` to: ${(x + drift).toFixed(3)} ${y1.toFixed(3)} ${z.toFixed(3)};` +
          ` dur: ${Math.round(dur)}; delay: ${Math.round(delay)}; loop: true; easing: linear`);
        m.setAttribute('animation__fade',
          `property: material.opacity; from: 0; to: 0.9;` +
          ` dur: ${Math.round(dur * 0.45)}; delay: ${Math.round(delay)};` +
          ` dir: alternate; loop: true; easing: easeInOutSine`);
      } else {
        m.setAttribute('material', 'shader: flat; transparent: true; blending: additive; depthTest: false; opacity: 0.5');
      }

      holder.appendChild(m);
    }
  }

  /* ---------- falling petals --------------------------------- */

  const PETAL_TEX = ['#imgPetA', '#imgPetB', '#imgPetC'];

  function makePetal(x, y, z, size, dur, delay, toX, toY, spin) {
    const el = document.createElement('a-plane');
    el.setAttribute('src', PETAL_TEX[Math.floor(Math.random() * 3)]);
    el.setAttribute('width', size.toFixed(3));
    el.setAttribute('height', size.toFixed(3));
    el.setAttribute('position', x.toFixed(3) + ' ' + y.toFixed(3) + ' ' + z.toFixed(3));
    el.setAttribute('material',
      'shader: flat; transparent: true; opacity: 0.96; side: double; depthWrite: false');
    el.setAttribute('animation__fall',
      'property: position; from: ' + x.toFixed(3) + ' ' + y.toFixed(3) + ' ' + z.toFixed(3) +
      '; to: ' + toX.toFixed(3) + ' ' + toY.toFixed(3) + ' ' + z.toFixed(3) +
      '; dur: ' + Math.round(dur) + '; delay: ' + Math.round(delay) +
      (spin ? '; loop: true' : '') + '; easing: linear');
    el.setAttribute('animation__tumble',
      'property: rotation; from: 0 0 ' + Math.round(Math.random() * 360) +
      '; to: ' + Math.round(120 + Math.random() * 300) + ' ' +
      Math.round(240 + Math.random() * 360) + ' ' + Math.round(Math.random() * 360) +
      '; dur: ' + Math.round(dur * 0.75) + '; delay: ' + Math.round(delay) +
      (spin ? '; loop: true' : '') + '; easing: linear');
    return el;
  }

  function buildPetals(n) {
    const holder = $('petals');
    if (!holder || holder.childElementCount) return;
    for (let i = 0; i < n; i++) {
      const x = (Math.random() - 0.5) * 1.25;
      const y = 0.95 + Math.random() * 0.55;
      const z = 0.10 + Math.random() * 0.30;
      const size = 0.035 + Math.random() * 0.05;
      const dur = 9000 + Math.random() * 7000;
      holder.appendChild(makePetal(
        x, y, z, size, dur, Math.random() * 9000,
        x + (Math.random() - 0.5) * 0.4, -1.05 - Math.random() * 0.3, true));
    }
  }

  /* a shower of petals when the medallion is tapped */
  function petalBurst() {
    const holder = $('petals');
    if (!holder) return;
    const born = [];
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2 + Math.random() * 0.4;
      const r = 0.12 + Math.random() * 0.1;
      const el = makePetal(
        Math.cos(ang) * r, 0.97 + Math.sin(ang) * r * 0.6, 0.24 + Math.random() * 0.12,
        0.04 + Math.random() * 0.045, 3400 + Math.random() * 2200, 0,
        Math.cos(ang) * (0.5 + Math.random() * 0.5),
        -0.4 - Math.random() * 0.8, false);
      holder.appendChild(el);
      born.push(el);
    }
    setTimeout(() => born.forEach(e => e.parentNode && e.parentNode.removeChild(e)), 6200);
  }

  /* entrance animations key off a `reveal` event so the whole sequence
     replays every time the card is re-found, not just on first load */
  function fireReveal() {
    const t = $('target');
    if (!t) return;
    if (t.emit) t.emit('reveal');
    t.querySelectorAll('*').forEach(el => { if (el.emit) el.emit('reveal'); });
  }

  function wireTap() {
    const m = document.querySelector('#mono .tappable');
    if (m) m.addEventListener('click', petalBurst);
  }

  /* ---------- optional couple video inside the arch ----------- */

  let videoEl = null;

  function buildVideo() {
    if (!CONFIG.arVideo) return;

    videoEl = document.createElement('video');
    videoEl.id = 'coupleVid';
    videoEl.setAttribute('src', CONFIG.arVideo);
    videoEl.setAttribute('loop', '');
    videoEl.setAttribute('playsinline', '');
    videoEl.setAttribute('webkit-playsinline', '');
    videoEl.setAttribute('preload', 'auto');
    videoEl.muted = true;
    videoEl.addEventListener('error', () => {
      const p = $('videoHolder').firstElementChild;
      if (p) p.remove();
      videoEl = null;
    });
    document.querySelector('a-assets').appendChild(videoEl);

    const plane = document.createElement('a-video');
    plane.setAttribute('src', '#coupleVid');
    plane.setAttribute('position', '0 0.17 0.03');
    plane.setAttribute('width', '0.72');
    plane.setAttribute('height', '0.405');
    plane.setAttribute('material', 'transparent: true; opacity: 0');
    plane.setAttribute('animation__in',
      'property: material.opacity; from: 0; to: 1; dur: 900; delay: 600; easing: easeOutSine');
    $('videoHolder').appendChild(plane);
  }

  /* ---------- target found / lost ----------------------------- */

  function wireTarget() {
    const target  = $('target');
    const scan    = $('scan');
    const actions = $('hudActions');

    target.addEventListener('targetFound', () => {
      fireReveal();
      scan.classList.add('is-hidden');
      actions.hidden = false;
      requestAnimationFrame(() => actions.classList.add('is-in'));
      if (videoEl) videoEl.play().catch(() => {});
    });

    target.addEventListener('targetLost', () => {
      scan.classList.remove('is-hidden');
      actions.classList.remove('is-in');
      if (videoEl) videoEl.pause();
    });
  }

  /* ---------- startup ----------------------------------------- */

  async function hasTarget() {
    try {
      const r = await fetch('targets/card.mind', { method: 'HEAD', cache: 'no-store' });
      return r.ok;
    } catch (_) {
      return false;
    }
  }

  function showPanel(id) {
    ['gate', 'setup', 'denied'].forEach(p => { $(p).hidden = (p !== id); });
  }

  function explainCameraError(err) {
    const name = err && err.name ? err.name : '';
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      $('deniedTitle').textContent = 'Camera permission was declined';
      $('deniedBody').textContent =
        'Allow camera access for this page and try again. If you opened this from ' +
        'WhatsApp or Instagram, tap the ⋯ menu and choose “Open in Safari” or “Open in Chrome”.';
    } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
      $('deniedTitle').textContent = 'No camera found';
      $('deniedBody').textContent =
        'This device doesn’t seem to have a camera available to the browser. ' +
        'The full invitation still works beautifully without it.';
    } else if (!window.isSecureContext) {
      $('deniedTitle').textContent = 'This page needs a secure connection';
      $('deniedBody').textContent =
        'Cameras only work over https. Open the invitation using its https link and try again.';
    } else {
      $('deniedTitle').textContent = 'We couldn’t open the camera';
      $('deniedBody').textContent =
        'Something blocked the camera on this device. The full invitation still works without it.';
    }
    showPanel('denied');
  }

  let started = false;

  async function start() {
    if (started) return;

    if (!(await hasTarget())) { showPanel('setup'); return; }

    /* ask for the camera ourselves so we can explain any refusal
       in plain language rather than showing a blank screen */
    try {
      const probe = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      probe.getTracks().forEach(t => t.stop());
    } catch (err) {
      explainCameraError(err);
      return;
    }

    const btn = $('startBtn');
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Preparing…';

    try {
      await loadLibraries();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = label;
      $('deniedTitle').textContent = 'The AR view could not load';
      $('deniedBody').textContent =
        'Check your connection and try again — it is about 3 MB. ' +
        'The full invitation works beautifully without it.';
      showPanel('denied');
      return;
    }

    started = true;
    btn.textContent = label;
    showPanel(null);
    $('stage').hidden = false;
    document.body.classList.add('is-live');

    /* the scene only enters the DOM now that A-Frame is ready */
    const stage = $('stage');
    stage.insertBefore(document.importNode($('sceneTpl').content, true), stage.firstChild);

    buildMotes(reduced ? 8 : 20);
    buildPetals(reduced ? 5 : 16);
    buildVideo();
    wireTarget();
    wireTap();

    const scene = stage.querySelector('a-scene');
    const go = () => {
      const sys = scene.systems && scene.systems['mindar-image-system'];
      if (sys) sys.start();
    };
    if (scene.hasLoaded) go();
    else scene.addEventListener('loaded', go);

    /* nudge A-Frame and MindAR to re-measure once the stage is laid out,
       so the camera feed is sized to cover rather than letterboxed */
    setTimeout(() => window.dispatchEvent(new Event('resize')), 350);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 1200);

    /* Some browsers hand back a camera that never produces frames.
       Rather than leave a guest staring at a black scan screen,
       say so after a fair wait. */
    let ticks = 0;
    const health = setInterval(() => {
      const v = document.querySelector('video');
      if (v && v.videoWidth > 0) { clearInterval(health); return; }
      if (++ticks < 24) return;                     /* 12 seconds */
      clearInterval(health);
      stage.hidden = true;
      document.body.classList.remove('is-live');
      started = false;
      $('deniedTitle').textContent = 'The camera didn’t send a picture';
      $('deniedBody').textContent =
        'Your browser opened the camera but no image came through. Close any other app ' +
        'that might be using it and try again — or just view the invitation instead.';
      showPanel('denied');
    }, 500);
  }

  $('startBtn').addEventListener('click', start);
  $('retryBtn').addEventListener('click', () => { showPanel('gate'); });

})();
