/* ============================================================
   Abdullah & Fiza — the invitation bundle
   Opens the envelope, hands over the cards, and keeps the tray
   pointed at whichever card is showing.
   All event settings live in config.js, loaded before this file.
   ============================================================ */

(function () {
  'use strict';

  var C = window.WEDDING;
  var H = C.helpers;
  var $ = function (id) { return document.getElementById(id); };
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var T = reduced ? 0.06 : 1;            /* one knob for the whole sequence */

  var guest  = H.guest();
  var seats  = H.pax();
  var keys   = H.invited();
  var events = keys.map(H.event);
  var single = events.length === 1;

  var openScreen = $('openScreen');
  var envScene   = $('envScene');
  var bundle     = $('bundle');
  var cardsBox   = $('cards');
  var switcher   = $('switcher');
  var tray       = $('tray');

  var built   = {};       /* key -> card element */
  var current = null;     /* the event showing now */

  /* ================= the envelope ========================= */

  if (guest) {
    $('envAddrName').textContent = guest;
    $('envAddr').hidden = false;
  }

  /* the line that greets them once the cards are out: only the
     events this envelope actually holds */
  $('invitedEvents').textContent = 'the ' + H.namesOf(keys);
  $('invitedDates').textContent = H.datesOf(keys) + (C.city ? ' · ' + C.city : '');

  /* one thumbnail of the printed card per event they are invited to */
  events.forEach(function (ev, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'bcard';
    b.dataset.event = ev.key;
    b.style.setProperty('--i', i);
    b.setAttribute('aria-label', 'Open the ' + ev.name + ' card');

    var paper = document.createElement('span');
    paper.className = 'bcard-paper';

    var pic = document.createElement('picture');
    var src = document.createElement('source');
    src.srcset = window.Cards.asset(ev.thumb + '.webp');
    src.type = 'image/webp';
    var img = document.createElement('img');
    img.src = window.Cards.asset(ev.thumb + '.jpg');
    img.alt = '';
    img.width = 300; img.height = 800;     /* the card is 3 : 8 */
    img.decoding = 'async';
    pic.append(src, img);

    var tag = document.createElement('span');
    tag.className = 'bcard-tag';
    tag.textContent = ev.name;

    paper.append(pic, tag);
    b.appendChild(paper);
    b.addEventListener('click', function () { pick(ev.key); });
    bundle.appendChild(b);
  });

  /* fan geometry: it depends on how many cards there are, and on
     the order they end up in, so it is recomputed after any reorder */
  function fanVars() {
    var n = bundle.children.length;
    Array.prototype.forEach.call(bundle.children, function (b, i) {
      var off = i - (n - 1) / 2;
      b.style.setProperty('--rot', (off * (n > 2 ? 11 : 8)) + 'deg');
      b.style.setProperty('--tx', (off * (n > 2 ? 41 : 52)) + '%');
      b.style.setProperty('--ty', (Math.abs(off) * 4) + '%');
      /* the label hugs the slice of the card that stays uncovered */
      b.style.setProperty('--tag-al', i === n - 1 ? 'center' : 'left');
    });
    bundle.dataset.n = n;
  }
  fanVars();

  var opened = false;

  function openEnvelope() {
    if (opened) return;
    opened = true;

    /* the tap that opens the seal is also the gesture mobile
       browsers require before any audio may play */
    if (window.WalimaMusic) window.WalimaMusic.start();

    /* the wax lets go, then the flap it was holding swings back */
    envScene.classList.add('is-cracking');
    setTimeout(function () { envScene.classList.add('is-open'); },   400 * T);
    setTimeout(function () { envScene.classList.add('is-out'); },   1200 * T);
    setTimeout(function () { envScene.classList.add('is-away'); },  1900 * T);
    setTimeout(function () {
      envScene.classList.add('is-fanned');
      $('openHint').textContent = single ? 'Tap the card to open it' : 'Choose a card to open it';
    }, 2100 * T);

    /* a single card opens by itself — after a moment to read which
       event the envelope holds */
    if (single) setTimeout(function () {
      /* unless they have already tapped it open */
      if (envScene.classList.contains('is-picked') || openScreen.classList.contains('is-gone')) return;
      pick(events[0].key);
    }, 4000 * T);
  }

  $('sealBtn').addEventListener('click', openEnvelope);

  /* ================= building a card ====================== */

  function cardFor(key) {
    if (built[key]) return built[key];
    var node = window.Cards.build(H.event(key), { guest: guest, seats: seats });
    cardsBox.appendChild(node);
    built[key] = node;
    window.Cards.layout(node);
    return node;
  }

  function sizeStage() {
    var a = current && built[current.key];
    if (a) cardsBox.style.height = a.offsetHeight + 'px';
  }

  /* ================= the switcher ========================= */

  if (!single) {
    events.forEach(function (ev) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sw';
      b.dataset.event = ev.key;
      b.appendChild(Object.assign(document.createElement('span'),
        { className: 'sw-name', textContent: ev.name }));
      b.appendChild(Object.assign(document.createElement('span'),
        { className: 'sw-date', textContent: H.dateParts(ev).num + ' ' + H.dateParts(ev).month.slice(0, 3) }));
      b.addEventListener('click', function () { show(ev.key); });
      switcher.appendChild(b);
    });
  }

  /* ================= showing a card ======================= */

  function show(key, first) {
    var ev = H.event(key);
    if (current && current.key === key && !first) return;

    var node = cardFor(key);
    Object.keys(built).forEach(function (k) {
      built[k].classList.toggle('is-active', k === key);
    });
    Array.prototype.forEach.call(switcher.children, function (b) {
      var on = b.dataset.event === key;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-current', on ? 'true' : 'false');
    });

    current = ev;
    document.body.dataset.event = key;

    window.Cards.layout(node);
    node.classList.add('is-open');
    sizeStage();

    wireTray(ev);
    document.title = ev.name + ' — ' + C.couple;
  }

  /* ================= picking from the bundle ============== */

  function pick(key) {
    Array.prototype.forEach.call(bundle.children, function (b) {
      b.classList.toggle('is-chosen', b.dataset.event === key);
      b.classList.toggle('is-let-go', b.dataset.event !== key);
    });
    envScene.classList.add('is-picked');
    document.body.classList.remove('is-locked');

    setTimeout(function () {
      openScreen.classList.add('is-gone');
      openScreen.classList.remove('is-picker');
      if (!single) switcher.hidden = false;
      show(key, true);
    }, 430 * T);

    setTimeout(function () {
      tray.classList.add('is-in');
      $('rsvp').classList.add('is-in');
    }, 1200 * T);
    setTimeout(function () {
      /* park the bundle ready for a second look */
      envScene.classList.remove('is-picked');
      Array.prototype.forEach.call(bundle.children, function (b) {
        b.classList.remove('is-chosen', 'is-let-go');
      });
    }, 1400 * T);
  }

  /* re-open the bundle later, without the envelope this time */
  function showPicker() {
    openScreen.classList.remove('is-gone');
    openScreen.classList.add('is-picker');
    envScene.classList.add('is-open', 'is-out', 'is-away', 'is-fanned');
    $('openKicker').textContent = 'Your invitations';
    $('openHint').textContent = 'Choose a card to open it';
    $('pickerClose').hidden = false;
    document.body.classList.add('is-locked');
  }

  $('pickerClose').addEventListener('click', function () {
    openScreen.classList.add('is-gone');
    openScreen.classList.remove('is-picker');
    document.body.classList.remove('is-locked');
  });

  /* ================= the tray ============================= */

  var cdTimer = null;

  function wireTray(ev) {
    var pad = function (n) { return String(n).padStart(2, '0'); };

    $('btnMap').href  = H.mapUrl(ev);
    $('btnGcal').href = H.gcalUrl(ev);

    $('btnCal').onclick = function () { H.downloadIcs(ev); };

    var ar = $('btnAr');
    if (ev.ar) {
      ar.hidden = false;
      ar.href = 'ar.html' + (guest ? '?to=' + encodeURIComponent(guest) : '');
    } else {
      ar.hidden = true;
    }

    var rsvp = H.rsvpHref(guest, ev);
    $('btnRsvp').hidden = !rsvp;
    if (rsvp) $('btnRsvp').href = rsvp;

    var forLine = $('trayFor');
    forLine.hidden = false;
    forLine.textContent = ev.name + ' · ' + H.longDate(ev);

    refreshRsvp(ev);

    /* countdown, restarted against whichever card is showing */
    if (cdTimer) clearInterval(cdTimer);
    function tick() {
      var now = Date.now();
      var diff = ev.start.getTime() - now;
      var msg = $('cdMsg');
      if (diff <= 0) {
        $('countdown').hidden = true;
        msg.hidden = false;
        msg.textContent = now < ev.end.getTime()
          ? 'Today is the day — we are so glad you are here'
          : 'Thank you for celebrating with us';
        return;
      }
      $('countdown').hidden = false;
      msg.hidden = true;
      var s = Math.floor(diff / 1000);
      $('cdD').textContent = Math.floor(s / 86400);
      $('cdH').textContent = pad(Math.floor(s / 3600) % 24);
      $('cdM').textContent = pad(Math.floor(s / 60) % 60);
      $('cdS').textContent = pad(s % 60);
    }
    tick();
    cdTimer = setInterval(tick, 1000);
  }

  if (!single) {
    $('btnCalAll').hidden = false;
    $('subDot1').hidden = false;
    $('btnBundle').hidden = false;
    $('subDot2').hidden = false;
    $('btnCalAll').addEventListener('click', function () { H.downloadIcs(events); });
    $('btnBundle').addEventListener('click', showPicker);
  }

  /* ================= RSVP ================================= */

  (function rsvp() {
    var people = (C.rsvp && C.rsvp.people) || [];
    if (!people.length) return;

    var list = $('rsvpPeople');
    people.forEach(function (p) {
      if (!p || !p.name) return;
      var li = document.createElement('li');
      var href = H.personHref(p, guest, current);
      if (href) {
        var a = document.createElement('a');
        a.href = href;
        a.textContent = p.name;
        if (href.indexOf('http') === 0) { a.target = '_blank'; a.rel = 'noopener'; }
        a.dataset.person = '1';
        li.appendChild(a);
      } else {
        li.textContent = p.name;
      }
      list.appendChild(li);
    });

    /* "All Family Member & Friends", as the card closes its column */
    if (C.rsvp.others) {
      var o = document.createElement('li');
      o.className = 'rsvp-others';
      o.textContent = C.rsvp.others;
      list.appendChild(o);
    }

    if (C.rsvp.note) {
      $('rsvpNote').textContent = C.rsvp.note;
      $('rsvpNote').hidden = false;
    }
    $('rsvp').hidden = false;
  })();

  /* keep the reply message pointed at whichever card is showing */
  function refreshRsvp(ev) {
    var people = (C.rsvp && C.rsvp.people) || [];
    var links = $('rsvpPeople').querySelectorAll('a[data-person]');
    var i = 0;
    people.forEach(function (p) {
      if (!p || !p.name) return;
      var href = H.personHref(p, guest, ev);
      if (href && links[i]) links[i].href = href;
      if (href) i++;
    });
  }

  /* ================= the imprint ========================== */

  (function credit() {
    var c = C.credit;
    if (!c || !c.name) return;
    $('creditLine').textContent = (c.line ? c.line + ' ' : '') + c.name;

    var wa = $('creditWa');
    if (c.whatsapp) {
      /* written the way it is dialled at home: 0332 4423632 */
      var d = String(c.whatsapp).replace(/\D/g, '');
      var shown = d.indexOf('92') === 0 && d.length === 12
        ? '0' + d.slice(2, 5) + ' ' + d.slice(5)
        : c.whatsapp;
      wa.href = H.waLink(c.whatsapp, c.message);
      wa.textContent = 'WhatsApp ' + shown;
      wa.setAttribute('aria-label', 'Message ' + c.name + ' on WhatsApp, ' + shown);
    } else {
      wa.previousElementSibling.remove();
      wa.remove();
    }

    var more = $('creditMore');
    if (c.more) more.href = c.more;
    else { more.previousElementSibling.remove(); more.remove(); }

    $('credit').hidden = false;
  })();

  if (navigator.share) {
    var sh = $('btnShare');
    sh.hidden = false;
    sh.addEventListener('click', function () {
      var ev = current || events[0];
      navigator.share({
        title: H.titleOf(ev),
        text: 'You are invited to the ' + ev.name + ' of ' + C.couple +
              ' — ' + H.longDate(ev) + '.',
        url: C.siteUrl
      }).catch(function () { /* the user dismissed the sheet */ });
    });
  }

  /* ================= start ================================ */

  if (window.WalimaMusic) window.WalimaMusic.init();

  /* build the cards up front: at most three, and it means the
     frames can be measured before anything is on screen */
  events.forEach(function (ev) { cardFor(ev.key); });

  var wanted = H.wanted();
  if (wanted && keys.indexOf(wanted) === -1) wanted = '';

  var fonts = document.fonts
    ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1600); })])
    : Promise.resolve();

  fonts.then(function () {
    document.body.classList.add('fonts-ready');
    events.forEach(function (ev) { window.Cards.layout(built[ev.key]); });
  });

  /* ?open=1 walks straight past the envelope */
  if (new URLSearchParams(location.search).get('open') === '1') {
    openScreen.style.transition = 'none';
    requestAnimationFrame(function () { pick(wanted || keys[0]); });
  } else if (wanted) {
    /* a link aimed at one card still gets the envelope, but that card
       is the one waiting on top of the pile. Last in the list is the
       top of the stack and the front of the fan, so it goes there —
       and the fan geometry has to be worked out again afterwards. */
    var b = bundle.querySelector('[data-event="' + wanted + '"]');
    if (b && b !== bundle.lastChild) {
      bundle.appendChild(b);
      fanVars();
    }
  }

  var rt;
  addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      Object.keys(built).forEach(function (k) { window.Cards.layout(built[k]); });
      sizeStage();
    }, 140);
  });

  /* a small handle so the page can be driven from a test page */
  window.Invite = { show: show, pick: pick, picker: showPicker, events: events };

  /* ================= ambient dust, in the sage of the leaves = */

  (function dust() {
    var c = $('dust');
    if (!c) return;
    var ctx = c.getContext('2d');
    var w = 0, h = 0, dpr = 1, motes = [], raf = null;

    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      c.width = w * dpr; c.height = h * dpr;
      c.style.width = w + 'px'; c.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      var n = Math.round(Math.min(46, Math.max(18, w * h / 26000)));
      motes = [];
      for (var i = 0; i < n; i++) {
        motes.push({
          x: Math.random() * w, y: Math.random() * h,
          r: 0.6 + Math.random() * 1.9,
          a: 0.10 + Math.random() * 0.30,
          vy: 0.06 + Math.random() * 0.16,
          ph: Math.random() * Math.PI * 2,
          sw: 0.25 + Math.random() * 0.55
        });
      }
    }

    function paint(t) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        var x = m.x + Math.sin(t / 2600 + m.ph) * 14 * m.sw;
        var g = ctx.createRadialGradient(x, m.y, 0, x, m.y, m.r * 3.4);
        g.addColorStop(0, 'rgba(132,160,140,' + m.a + ')');
        g.addColorStop(1, 'rgba(132,160,140,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, m.y, m.r * 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop(t) {
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.y -= m.vy;
        if (m.y < -8) { m.y = h + 8; m.x = Math.random() * w; }
      }
      paint(t);
      raf = requestAnimationFrame(loop);
    }

    resize(); seed();

    if (reduced) {
      paint(0);
    } else {
      raf = requestAnimationFrame(loop);
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
        else if (!raf) raf = requestAnimationFrame(loop);
      });
    }

    var dt;
    addEventListener('resize', function () {
      clearTimeout(dt);
      dt = setTimeout(function () { resize(); seed(); if (reduced) paint(0); }, 200);
    });
  })();

})();
