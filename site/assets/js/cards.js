/* ============================================================
   The e-card — the card template
   ------------------------------------------------------------
   The printed card, set live: white stock, a watercolour sprig in
   two corners, the couple in script, the event in engraved capitals,
   and the programme with its dotted leaders. Everything that differs
   between the three comes out of config.js.
   ============================================================ */

window.Cards = (function () {
  'use strict';

  var C = window.WEDDING;
  var H = C.helpers;
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------- small DOM helpers ----------------------------- */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function svg(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* the small printed words, from config.js labels */
  function label(key, fallback) {
    var l = C.labels || {};
    return l[key] != null ? l[key] : fallback;
  }

  /* ---------- versioned addresses -------------------------------
     build-site.mjs writes a fingerprint for every image into the page
     (window.ASSET_V). Asking for 'assets/img/x.webp?v=<fingerprint>'
     means the copy the page preloaded is the one that gets used, and a
     phone can keep it for good: a changed image gets a new address. */

  function asset(path) {
    var v = window.ASSET_V && window.ASSET_V[path];
    return v ? path + '?v=' + v : path;
  }

  /* ---------- the watercolour sprigs ------------------------- */

  function sprig(name) {
    var p = el('picture', 'leaf leaf-' + name);
    var s = document.createElement('source');
    s.srcset = asset('assets/img/leaves-' + name + '.webp');
    s.type = 'image/webp';
    var i = document.createElement('img');
    i.src = asset('assets/img/leaves-' + name + '.png');
    i.alt = '';
    i.decoding = 'async';
    p.setAttribute('aria-hidden', 'true');
    p.append(s, i);
    return p;
  }

  /* ---------- the engraved title ----------------------------
     The printed card sets MEHNDI / BARAT / WALIMA in an engraved
     face: heavy capitals with fine white lines running inside the
     thick strokes. No web font does that, so it is drawn: a heavy
     Bodoni, and a filter that cuts two lines into every stroke wide
     enough to hold them, following its outline the way an engraver's
     tool would. Thin strokes are left solid, as they are in print. */

  var engraveSeq = 0;

  function title(text) {
    var id = 'engrave-' + (++engraveSeq);
    var s = svg('svg', {
      class: 'title', viewBox: '0 0 640 124', role: 'img', 'aria-label': text
    });
    var f = svg('filter', {
      id: id, x: '-4%', y: '-12%', width: '108%', height: '124%',
      'color-interpolation-filters': 'sRGB'
    });
    [['SourceAlpha', 3.6, 'a'], ['SourceAlpha', 4.8, 'b'],
     ['SourceAlpha', 8.0, 'c'], ['SourceAlpha', 9.2, 'd']].forEach(function (m) {
      f.appendChild(svg('feMorphology', { in: m[0], operator: 'erode', radius: m[1], result: m[2] }));
    });
    f.appendChild(svg('feComposite', { in: 'a', in2: 'b', operator: 'out', result: 'r1' }));
    f.appendChild(svg('feComposite', { in: 'c', in2: 'd', operator: 'out', result: 'r2' }));
    var merge = svg('feMerge', { result: 'lines' });
    merge.appendChild(svg('feMergeNode', { in: 'r1' }));
    merge.appendChild(svg('feMergeNode', { in: 'r2' }));
    f.appendChild(merge);
    f.appendChild(svg('feFlood', { 'flood-color': '#FFFFFF', result: 'paper' }));
    f.appendChild(svg('feComposite', { in: 'paper', in2: 'lines', operator: 'in', result: 'cut' }));
    var out = svg('feMerge', {});
    out.appendChild(svg('feMergeNode', { in: 'SourceGraphic' }));
    out.appendChild(svg('feMergeNode', { in: 'cut' }));
    f.appendChild(out);
    var defs = svg('defs', {});
    defs.appendChild(f);
    s.appendChild(defs);

    var t = svg('text', {
      x: '320', y: '104', 'text-anchor': 'middle', filter: 'url(#' + id + ')'
    });
    t.textContent = text;
    s.appendChild(t);
    return s;
  }

  /* ---------- the date: 13th NOVEMBER / FRIDAY, 2026 --------- */

  function ordinal(n) {
    n = +n;
    var t = n % 100;
    if (t >= 11 && t <= 13) return 'th';
    return ['th', 'st', 'nd', 'rd'][n % 10] || 'th';
  }

  function dateBlock(ev) {
    var p = H.dateParts(ev);
    var d = el('div', 'date');
    d.setAttribute('aria-label', H.longDate(ev));
    d.appendChild(el('span', 'd-num', p.num));
    var r = el('span', 'd-side');
    var top = el('span', 'd-top');
    top.appendChild(el('span', 'd-th', ordinal(p.num)));
    top.appendChild(el('span', 'd-month', p.month));
    r.appendChild(top);
    r.appendChild(el('span', 'd-day', p.day + ', ' + p.year));
    d.appendChild(r);
    return d;
  }

  /* ---------- the programme, with dotted leaders ------------- */

  function schedule(ev) {
    var ul = el('ul', 'sched');
    (ev.schedule || []).forEach(function (row) {
      var li = el('li');
      li.appendChild(el('span', 's-what', row[0]));
      li.appendChild(el('span', 's-dots'));
      li.appendChild(el('span', 's-when', row[1]));
      ul.appendChild(li);
    });
    return ul;
  }

  /* ---------- the double rule with its lozenge --------------- */

  function divider() {
    var s = svg('svg', { class: 'divider', viewBox: '0 0 240 12', 'aria-hidden': 'true' });
    var g = svg('g', { fill: 'none', stroke: 'currentColor', 'stroke-width': '1' });
    g.appendChild(svg('path', { d: 'M8 4.6H110M8 7.4H110M130 4.6H232M130 7.4H232' }));
    g.appendChild(svg('path', { d: 'M120 1.2L125.2 6L120 10.8L114.8 6Z' }));
    g.appendChild(svg('circle', { cx: '5', cy: '6', r: '2.6' }));
    g.appendChild(svg('circle', { cx: '235', cy: '6', r: '2.6' }));
    s.appendChild(g);
    return s;
  }

  var PIN = 'M12 2C8.3 2 5.3 5 5.3 8.7c0 5 6.7 12.6 6.7 12.6s6.7-7.6 6.7-12.6C18.7 5 15.7 2 12 2zm0 9.2a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z';

  function icon(d, cls) {
    var s = svg('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', class: cls || '' });
    s.appendChild(svg('path', { d: d }));
    return s;
  }

  function personIcon() {
    var s = svg('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true' });
    s.appendChild(svg('circle', { cx: 12, cy: 7.5, r: 3.4 }));
    s.appendChild(svg('path', { d: 'M4.8 20.4c0-3.9 3.2-6.4 7.2-6.4s7.2 2.5 7.2 6.4' }));
    return s;
  }

  /* ---------- the card -------------------------------------- */

  function build(ev, ctx) {
    ctx = ctx || {};
    var guest = ctx.guest || '';
    var seats = (ctx.seats || {})[ev.key] || 0;

    var card = el('article', 'card card-' + ev.key);
    card.dataset.event = ev.key;
    card.setAttribute('aria-label', ev.name + ' invitation');

    card.appendChild(sprig('tl'));
    card.appendChild(sprig('br'));

    var c = el('div', 'content');

    var d = 0.1;
    function rise(node, gap) {
      d += (gap == null ? 0.1 : gap);
      node.classList.add('reveal');
      node.style.setProperty('--d', d.toFixed(2) + 's');
      return node;
    }

    /* — who is inviting, and whom — */
    var head = el('div', 'c-grp c-head');
    head.appendChild(rise(el('p', 'hosts', C.hosts), 0));
    if (guest) {
      head.appendChild(rise(el('p', 'invite', C.inviteGuest[0]), 0.1));
      var g = el('div', 'guest');
      g.appendChild(el('span', 'guest-rule'));
      g.appendChild(el('p', 'guest-name', guest));
      g.appendChild(el('span', 'guest-rule'));
      head.appendChild(rise(g, 0.12));
      head.appendChild(rise(el('p', 'invite', C.inviteGuest[1]), 0.1));
    } else {
      var inv = el('p', 'invite');
      inv.appendChild(document.createTextNode(C.invite));
      inv.appendChild(el('br'));
      inv.appendChild(document.createTextNode(C.inviteRest));
      head.appendChild(rise(inv, 0.1));
    }
    c.appendChild(head);

    /* — the couple — */
    var couple = el('div', 'c-grp c-couple');
    couple.appendChild(rise(el('p', 'name', C.groom), 0.14));
    couple.appendChild(rise(el('p', 'weds', label('weds', 'Weds')), 0.3));
    couple.appendChild(rise(el('p', 'name', C.bride), 0.18));
    c.appendChild(couple);

    /* — the occasion and its date — */
    var when = el('div', 'c-grp c-when');
    when.appendChild(rise(title(ev.title || ev.name.toUpperCase()), 0.3));
    when.appendChild(rise(dateBlock(ev), 0.12));
    c.appendChild(when);

    /* — the programme and the place — */
    var where = el('div', 'c-grp c-where');
    where.appendChild(rise(schedule(ev), 0.12));
    var v = el('div', 'venue');
    v.appendChild(el('p', 'v-name' + (ev.venueCaps ? ' v-caps' : ''), ev.venue));
    v.appendChild(el('p', 'v-addr', ev.address));
    where.appendChild(rise(v, 0.08));

    /* the printed card carries a QR to the venue here; on a phone the
       pin itself is one tap away */
    var loc = el('a', 'loc');
    loc.href = H.mapUrl(ev);
    loc.target = '_blank';
    loc.rel = 'noopener';
    loc.appendChild(icon(PIN, 'solid'));
    loc.appendChild(el('span', '', label('location', 'View location')));
    loc.setAttribute('aria-label', 'Open the ' + ev.name + ' venue in Maps');
    where.appendChild(rise(loc, 0.08));

    /* how many seats are held for this event: quiet, never a rule */
    if (seats) {
      var pax = el('div', 'pax');
      pax.appendChild(personIcon());
      pax.appendChild(el('span', 'pax-n', String(seats)));
      pax.title = seats + (seats === 1 ? ' seat is' : ' seats are') +
                  ' reserved for you at the ' + ev.name;
      pax.setAttribute('aria-label', pax.title);
      where.appendChild(rise(pax, 0.1));
    }
    c.appendChild(where);

    /* — the rule, and the families at the foot — */
    var foot = el('div', 'c-grp c-foot');
    foot.appendChild(rise(divider(), 0.1));
    var cols = el('div', 'cols');

    var lf = C.lookingForward || [];
    if (lf.length) {
      var a = el('div', 'col col-lf');
      a.appendChild(el('p', 'col-h', label('lookingForward', 'Looking Forward')));
      var ul = el('ul');
      lf.forEach(function (n) { ul.appendChild(el('li', '', n)); });
      a.appendChild(ul);
      cols.appendChild(a);
    }

    var r = C.rsvp || {};
    var people = (r.people || []).filter(function (p) { return p && p.name; });
    if (people.length || r.others) {
      var b = el('div', 'col col-rsvp');
      b.appendChild(el('p', 'col-h', label('rsvp', 'R.S.V.P')));
      var ul2 = el('ul');
      people.forEach(function (p) {
        var li = el('li');
        var href = H.personHref(p, guest, ev);
        if (href) {
          var link = el('a', '', p.name);
          link.href = href;
          if (href.indexOf('http') === 0) { link.target = '_blank'; link.rel = 'noopener'; }
          li.appendChild(link);
        } else {
          li.textContent = p.name;
        }
        ul2.appendChild(li);
      });
      if (r.others) ul2.appendChild(el('li', 'others', r.others));
      b.appendChild(ul2);
      cols.appendChild(b);
    }
    /* one column alone sits in the middle */
    if (cols.children.length === 1) cols.classList.add('cols-one');
    foot.appendChild(rise(cols, 0.12));
    c.appendChild(foot);

    card.appendChild(c);
    return card;
  }

  /* container-query units drive the type; this is the fallback */
  var supportsCq = window.CSS && CSS.supports && CSS.supports('width', '1cqw');

  /* A long family name adds two lines to a card that has a fixed run of
     paper to sit on. Rather than let it push the families off the foot
     of the card, measure what is needed and ease the column to fit. */
  function layout(card) {
    var c = card.querySelector('.content');
    if (!c) return;
    if (!supportsCq) {
      var w = card.clientWidth;
      if (w) c.style.setProperty('--base', (w / 100) + 'px');
    }
    c.style.setProperty('--fit', '1');
    var avail = c.clientHeight;
    if (!avail) return;
    var need = 0;
    Array.prototype.forEach.call(c.children, function (g) { need += g.offsetHeight; });
    if (need > avail) {
      c.style.setProperty('--fit', Math.max(0.7, avail / need).toFixed(3));
    }
  }

  return { build: build, layout: layout, asset: asset };
})();
