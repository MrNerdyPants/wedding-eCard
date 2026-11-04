/* ============================================================
   The e-card — every word on it lives here
   ------------------------------------------------------------
   THIS IS THE ONLY FILE YOU NEED TO EDIT for a new invitation.
   Fill in the values below, then run  node build-site.mjs  and
   deploy the site/ folder. The envelope, the cards, the link
   previews, the calendar entries and the guest-link tool all read
   from here.

   The values shipped with the template are placeholders for a
   made-up couple, John Doe and Jane Smith. Replace every one.

   Events live in `events`. Add, remove or reorder them in `order`
   and every page follows — the bundle inside the envelope, the
   guest checkboxes, the switcher, the calendar.
   ============================================================ */

window.WEDDING = {

  /* --- this invitation --------------------------------------
     A short name for it: lowercase letters, numbers and dashes.
     Used in calendar entries, downloaded file names and the guest
     tool's saved list, so each invitation keeps its own.          */
  id: 'john-jane-2027',

  /* --- the people ------------------------------------------- */
  couple:   'John & Jane',             /* tab title, link previews, share sheet */
  monogram: 'J & J',                   /* pressed into the wax seal */
  hosts:    'Mr. & Mrs. Richard Doe',  /* top line of every card, set in capitals */
  groom:    'John Doe',
  bride:    'Jane Smith',

  /* the invitation line. Without a guest's name it reads as the two
     lines below; with one it reads "<inviteGuest[0]> / name /
     <inviteGuest[1]>" */
  invite:      'Cordially invite You to the Wedding',
  inviteRest:  'Ceremony of their Beloved Son',
  inviteGuest: ['Cordially invite', 'to the Wedding Ceremony of their Beloved Son'],

  /* above the envelope, and at the very foot of the page. '' for none */
  kicker:   'Bismillah',
  blessing: 'Barakallahu lakuma wa baraka alaikuma',

  /* the small words printed on the card */
  labels: {
    weds:           'Weds',
    lookingForward: 'Looking Forward',
    rsvp:           'R.S.V.P',
    location:       'View location'
  },

  /* where it all happens: shown on the envelope and in link previews,
     and added to any address below that leaves it out */
  city: 'Springfield',

  /* The address the site is published at. Used in calendar entries,
     share sheets, link previews and guest links. Change it to the
     address Netlify gives the site (or a custom domain), then run
     node build-site.mjs  again. */
  siteUrl: 'https://your-invitation.netlify.app/',

  /* Every time below is Pakistan Standard Time (UTC+5, no DST).
     The day and date printed on each card are derived from these
     in this time zone, so a guest abroad still reads the local date. */
  timeZone: 'Asia/Karachi',

  /* The order the cards sit in the envelope, first one on top.
     Each key's first letter becomes its letter in guest links
     (?e=mb), so keep those distinct where you can. */
  order: ['mehndi', 'barat', 'walima'],

  events: {

    /* ------------------------------------------------------ */
    mehndi: {
      name:     'Mehndi',                 /* in tabs, previews and the calendar */
      title:    'MEHNDI',                 /* the engraved title on the card */
      startISO: '2027-02-12T19:00:00+05:00',
      endISO:   '2027-02-12T23:00:00+05:00',
      /* the programme: one row per line, [what, when] */
      schedule: [
        ['Rasm-e-Hina', '7PM'],
        ['Dinner',      '9PM']
      ],
      venue:    'The Rose Garden',
      venueCaps: false,                   /* true sets the venue in capitals */
      address:  '12 Main Street',
      /* a Google Maps pin link for the venue (share → copy link in
         Google Maps). Leave '' and the button searches for the venue. */
      map:      '',
      thumb:    'assets/img/thumb-mehndi',
      /* AR is built in but switched off: see the README before turning it on */
      ar:       false
    },

    /* ------------------------------------------------------ */
    barat: {
      name:     'Barat',
      title:    'BARAT',
      startISO: '2027-02-13T18:00:00+05:00',
      endISO:   '2027-02-13T23:00:00+05:00',
      schedule: [
        ['Sehra Bandi',        '6PM'],
        ['Departure of Barat', '7PM']
      ],
      venue:    'Grand Marquee',
      venueCaps: true,
      address:  'Canal Road, Springfield',
      map:      '',
      thumb:    'assets/img/thumb-barat',
      ar:       false
    },

    /* ------------------------------------------------------ */
    walima: {
      name:     'Walima',
      title:    'WALIMA',
      startISO: '2027-02-14T19:00:00+05:00',
      endISO:   '2027-02-14T23:00:00+05:00',
      schedule: [
        ['Reception', '7PM'],
        ['Dinner',    '8PM']
      ],
      venue:    'Pearl Banquet Hall',
      venueCaps: true,
      address:  'Mall Road, Springfield',
      map:      '',
      thumb:    'assets/img/thumb-walima',
      ar:       false
    }
  },

  /* --- printed at the foot of every card ---------------------
     The left column, under labels.lookingForward. [] to leave it off. */
  lookingForward: [
    'Richard Doe',
    'Robert Doe',
    'Mary Doe',
    'James Roe',
    'Jane Roe'
  ],

  /* --- RSVP -------------------------------------------------
     `people` are the family taking replies. They are printed in the
     right column of the card and again under the countdown.

     Give someone a number and their name becomes tappable:
       whatsapp : any format, e.g. '+92 300 1234567' or '0300 1234567'
       phone    : anything dialable, e.g. '+92 300 1234567'
     Leave both out and the name is simply printed.

     `others` closes the R.S.V.P column on the card. '' for none.

     The three below are optional and quite separate: fill in ONE of
     them and an RSVP button joins the row of actions as well — for a
     Google Form, or a single number the whole family shares.     */
  rsvp: {
    people: [
      { name: 'Richard Doe' },
      { name: 'Mary Doe' }
    ],
    others: 'All Family Members & Friends',
    note: '',
    whatsapp: '', email: '', url: ''
  },

  /* --- who made the invitation ------------------------------
     A small imprint at the very foot of the page, under the blessing.
       name     : as it should read; swap in a studio name any time
       whatsapp : any format — only the digits are used
       message  : what WhatsApp opens with when someone taps the number
       more     : the page about your services
     Set credit to null to take it off the invitation entirely.   */
  credit: {
    line:     'Invitation crafted by',
    name:     'Kashan Asim',
    whatsapp: '+92 332 4423632',
    message:  'Assalamu alaikum Kashan! I saw an invitation you made and would like a card made for my event.',
    more:     'services.html'
  },

  /* --- background music -------------------------------------
     Drop an .mp3 at assets/audio/wedding.mp3 and it fades in as the
     envelope opens. The control only appears if the file actually
     exists, so leaving it out breaks nothing.
       volume : 0.0-1.0. 0.30 sits under the page, not over it.
       fadeIn : seconds
       loopStart / loopEnd : optional, in seconds.
     Set music to null to switch the feature off entirely.        */
  music: {
    src: 'assets/audio/wedding.mp3',
    volume: 0.30,
    fadeIn: 2.6,
    loopStart: 0,
    loopEnd: null
  },

  /* --- optional couple video shown in AR ---------------------
     Only used once AR is switched on (see the README).          */
  arVideo: null
};

/* ============================================================
   Derived values shared by every page. Nothing below needs
   editing for an ordinary change of names, dates or venues.
   ============================================================ */

window.WEDDING.helpers = (function (C) {
  'use strict';

  var ORDER = C.order.slice();

  /* one stable letter per event, so a guest link stays short */
  var LETTER = {}, BY_LETTER = {};
  ORDER.forEach(function (k) {
    var l = k.charAt(0);
    while (BY_LETTER[l]) l = String.fromCharCode(l.charCodeAt(0) + 1);
    LETTER[k] = l;
    BY_LETTER[l] = k;
  });

  /* fill in the derived half of every event once, up front */
  ORDER.forEach(function (k) {
    var e = C.events[k];
    e.key    = k;
    e.letter = LETTER[k];
    e.start  = new Date(e.startISO);
    e.end    = new Date(e.endISO);
    /* the calendar and the map search want the city too, even where the
       card leaves it off ('12 Main Street') */
    e.where  = e.venue + ', ' + e.address +
               (C.city && e.address.indexOf(C.city) === -1 ? ', ' + C.city : '');
    e.title  = e.title || e.name;
  });

  function fmt(date, opts) {
    var o = {}, p;
    for (p in opts) o[p] = opts[p];
    try {
      o.timeZone = C.timeZone;
      return new Intl.DateTimeFormat('en-GB', o).format(date);
    } catch (_) {
      /* unknown zone on an old engine: fall back to the local one */
      delete o.timeZone;
      return new Intl.DateTimeFormat('en-GB', o).format(date);
    }
  }

  /* Friday / 23 / October, always as they fall in Pakistan */
  function dateParts(e) {
    return {
      day:   fmt(e.start, { weekday: 'long' }),
      num:   fmt(e.start, { day: 'numeric' }),
      month: fmt(e.start, { month: 'long' }),
      year:  fmt(e.start, { year: 'numeric' })
    };
  }

  function longDate(e) {
    var p = dateParts(e);
    return p.day + ', ' + p.num + ' ' + p.month + ' ' + p.year;
  }

  function event(key) {
    return C.events[key] || C.events[ORDER[0]];
  }

  /* 'nikkah, Barat & Walima' */
  function andList(words) {
    if (words.length < 2) return words.join('');
    return words.slice(0, -1).join(', ') + ' & ' + words[words.length - 1];
  }

  /* what a set of events is called, in envelope order */
  function namesOf(keys) {
    return andList(ORDER.filter(function (k) { return keys.indexOf(k) !== -1; })
                        .map(function (k) { return event(k).name; }));
  }

  /* 'Sunday, 25 October 2026' for one event, '24 & 25 October 2026'
     for several — days grouped under their month, as written by hand */
  function datesOf(keys) {
    var list = ORDER.filter(function (k) { return keys.indexOf(k) !== -1; }).map(event);
    if (list.length === 1) return longDate(list[0]);
    var groups = [];
    list.forEach(function (e) {
      var p = dateParts(e), last = groups[groups.length - 1];
      if (last && last.month === p.month && last.year === p.year) last.days.push(p.num);
      else groups.push({ month: p.month, year: p.year, days: [p.num] });
    });
    return groups.map(function (g, i) {
      var sameYear = i < groups.length - 1 && groups[i + 1].year === g.year;
      return andList(g.days) + ' ' + g.month + (sameYear ? '' : ' ' + g.year);
    }).join(', ');
  }

  var q = new URLSearchParams(location.search);

  /* ---------- who this link was made for -------------------- */

  function clean(s) {
    return String(s == null ? '' : s)
      .replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
  }

  function guest() {
    return clean(q.get('to') || q.get('guest') || q.get('g') || q.get('n') || '');
  }

  /* ?e=bw -> ['barat','walima']. Missing or unrecognised means every
     event, so older links and hand-typed ones still open properly. */
  function invited() {
    var raw = (q.get('e') || q.get('events') || '').toLowerCase();
    if (!raw) return ORDER.slice();
    var picked = ORDER.filter(function (k) { return raw.indexOf(LETTER[k]) !== -1; });
    return picked.length ? picked : ORDER.slice();
  }

  function code(keys) {
    return ORDER.filter(function (k) { return keys.indexOf(k) !== -1; })
                .map(function (k) { return LETTER[k]; }).join('');
  }

  /* Seats are held per event, because a family often gets more places
     at the nikkah than at the Walima.
       ?p=4        four seats at every event they are invited to
       ?p=m6b2w4   six at the nikkah, two at the Barat, four at the Walima
     Anything missing or unreadable simply says nothing at all. */
  function pax() {
    var raw = String(q.get('p') || q.get('pax') || '').toLowerCase();
    var out = {};
    if (!raw) return out;

    if (/^\d{1,2}$/.test(raw)) {
      var n = parseInt(raw, 10);
      if (n > 0 && n < 100) ORDER.forEach(function (k) { out[k] = n; });
      return out;
    }

    var re = /([a-z])(\d{1,2})/g, m;
    while ((m = re.exec(raw))) {
      var k = BY_LETTER[m[1]];
      var v = parseInt(m[2], 10);
      if (k && v > 0 && v < 100) out[k] = v;
    }
    return out;
  }

  /* the shortest honest way to write a seats map back into a link */
  function paxCode(seats, keys) {
    var invited = keys || ORDER;
    var held = invited.filter(function (k) { return seats[k] > 0; });
    if (!held.length) return '';
    var first = seats[held[0]];
    var same = held.every(function (k) { return seats[k] === first; });
    /* one bare number only when it covers every event they are invited to */
    if (same && held.length === invited.length) return String(first);
    return held.map(function (k) { return LETTER[k] + seats[k]; }).join('');
  }

  /* which card should already be showing when the bundle opens */
  function wanted() {
    var raw = (q.get('event') || q.get('ev') || '').toLowerCase();
    if (C.events[raw]) return raw;
    if (raw.length === 1 && BY_LETTER[raw]) return BY_LETTER[raw];
    return '';
  }

  function link(base, name, keys, seats, ev) {
    var u = [];
    if (name) u.push('to=' + encodeURIComponent(name));
    if (keys && keys.length && keys.length < ORDER.length) u.push('e=' + code(keys));
    if (seats) {
      var p = (typeof seats === 'object') ? paxCode(seats, keys) : String(seats || '');
      if (p) u.push('p=' + p);
    }
    if (ev) u.push('event=' + ev);
    return base + (u.length ? '?' + u.join('&') : '');
  }

  /* ---------- maps, calendars, rsvp ------------------------- */

  function mapUrl(e) {
    e = e || event('walima');
    /* an event can carry its own dropped pin; otherwise search the name */
    return e.map ||
      'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(e.where);
  }

  function titleOf(e) { return e.name + ' — ' + C.couple; }

  function utc(d) {
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  function gcalUrl(e) {
    e = e || event('walima');
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text='     + encodeURIComponent(titleOf(e)) +
      '&dates='    + utc(e.start) + '/' + utc(e.end) +
      '&location=' + encodeURIComponent(e.where) +
      '&details='  + encodeURIComponent('With love from ' + C.couple + '. ' + C.siteUrl);
  }

  function icsText(list) {
    var out = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//' + C.couple.replace(/&/g, 'and') + '//Invitation//EN',
      'CALSCALE:GREGORIAN'
    ];
    list.forEach(function (e) {
      out.push(
        'BEGIN:VEVENT',
        /* this id must never change: a calendar that already has the
           event matches on it, and a new one would duplicate the entry.
           It is an identifier, not the site address — leave it alone
           even if the site is renamed. */
        'UID:' + e.key + '-' + (C.id || 'invitation') + '@' + (location.hostname || 'invitation'),
        'DTSTAMP:' + utc(new Date()),
        'DTSTART:' + utc(e.start),
        'DTEND:'   + utc(e.end),
        'SUMMARY:' + titleOf(e),
        'LOCATION:' + e.where,
        'DESCRIPTION:With love from ' + C.couple + '. ' + C.siteUrl,
        'URL:' + C.siteUrl,
        'END:VEVENT'
      );
    });
    out.push('END:VCALENDAR');
    return out.join('\r\n');
  }

  /* one event, or the whole bundle in a single file */
  function downloadIcs(e) {
    var list = Array.isArray(e) ? e : [e || event('walima')];
    var name = list.length > 1
      ? (C.id || 'invitation') + '.ics'
      : list[0].key + '-' + (C.id || 'invitation') + '.ics';
    var url = URL.createObjectURL(
      new Blob([icsText(list)], { type: 'text/calendar;charset=utf-8' }));
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  /* wa.me wants bare digits, country code first: '+92 332 4423632'
     and '0332 4423632' both become '923324423632' */
  function waNumber(n) {
    var d = String(n || '').replace(/\D/g, '');
    if (d.indexOf('00') === 0) d = d.slice(2);
    else if (d.charAt(0) === '0') d = '92' + d.slice(1);
    return d;
  }

  function waLink(n, msg) {
    return 'https://wa.me/' + waNumber(n) + (msg ? '?text=' + encodeURIComponent(msg) : '');
  }

  /* how to reach one of the people taking replies, if at all */
  function personHref(p, guestName, e) {
    var which = e ? e.name : 'the wedding';
    var msg = 'Assalamu alaikum' + (p.name ? ' ' + p.name.split(' ')[0] : '') + '! ' +
              (guestName ? 'This is ' + guestName + '. ' : '') +
              'Replying about ' + which + ' for ' + C.couple + '.';
    if (p.whatsapp) return waLink(p.whatsapp, msg);
    if (p.phone)    return 'tel:' + String(p.phone).replace(/[^\d+]/g, '');
    return '';
  }

  function rsvpHref(name, e) {
    var r = C.rsvp || {};
    var which = e
      ? e.name + ' on ' + dateParts(e).num + ' ' + dateParts(e).month
      : 'the wedding of ' + C.couple;
    var msg = 'Assalamu alaikum! ' + (name ? name + ' — ' : '') +
              'regarding ' + which + ':';
    if (r.whatsapp) return waLink(r.whatsapp, msg);
    if (r.email)    return 'mailto:' + r.email +
                           '?subject=' + encodeURIComponent('RSVP — ' + C.couple) +
                           '&body=' + encodeURIComponent(msg);
    if (r.url)      return r.url;
    return '';
  }

  return {
    order: ORDER, letter: LETTER, byLetter: BY_LETTER,
    event: event,
    list: function () { return ORDER.map(event); },
    dateParts: dateParts, longDate: longDate, titleOf: titleOf,
    andList: andList, namesOf: namesOf, datesOf: datesOf,
    guest: guest, invited: invited, pax: pax, wanted: wanted,
    code: code, link: link, clean: clean, paxCode: paxCode,
    mapUrl: mapUrl, gcalUrl: gcalUrl, downloadIcs: downloadIcs, icsText: icsText,
    rsvpHref: rsvpHref, personHref: personHref, waLink: waLink,

    /* kept as they were so ar.js and music.js need no changes */
    get start() { return event('walima').start; },
    get end()   { return event('walima').end; },
    get title() { return titleOf(event('walima')); },
    get where() { return event('walima').where; }
  };
})(window.WEDDING);

/* The AR page and the music module were written against WALIMA.
   Same object, older name. */
window.WALIMA = window.WEDDING;
window.WEDDING.occasion = window.WEDDING.events.walima.name;
window.WEDDING.venue    = window.WEDDING.events.walima.venue;
window.WEDDING.address  = window.WEDDING.events.walima.address;
