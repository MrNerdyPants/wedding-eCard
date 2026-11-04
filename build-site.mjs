/* ============================================================
   Run this before every deploy:

       node build-site.mjs

   It does three jobs a static site cannot do for itself.

   1. THE CARDS IN THE ENVELOPE
      The envelope holds a small picture of each card. They are
      photographs of the live cards themselves, taken here:
          site/assets/img/thumb-<event>.jpg / .webp
      so change a time or a name in config.js and the cards in the
      envelope change with it.

   2. FRESH FILES AFTER EVERY DEPLOY
      Every <script>, stylesheet and image an HTML page names gets a
      fingerprint of the file's contents:  assets/js/config.js?v=3f9a2c1d
      Change a file and its fingerprint changes, so phones — including
      the WhatsApp and Instagram in-app browsers, which hold on to things
      — fetch the new one. (netlify.toml also tells browsers to re-check
      images, CSS and JS on every visit.)

   3. LINK PREVIEWS THAT ONLY NAME THE EVENTS A GUEST IS INVITED TO
      WhatsApp and friends never run the page's JavaScript — they read
      the <meta> tags in the HTML as it comes off the server. So a link
      like  /?to=Ali&e=bw  is *served* different HTML, without the link
      itself changing. This:
        - draws a share image per set of events:
              site/assets/img/og-<letters>.jpg
        - writes the preview tags for all three into index.html
        - writes a copy of index.html per set of events, differing only
          in those tags:  site/i/<letters>/index.html
        - writes the Netlify rules that serve that copy whenever the
          address carries ?e=  — in netlify.toml, between the markers

   It needs Microsoft Edge or Google Chrome to draw the pictures.
   ============================================================ */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, 'site');
const IMG = join(SITE, 'assets', 'img');

/* ---------- the wedding, read straight from config.js ---------- */

const sandbox = { window: {}, location: { search: '', hostname: '' }, URLSearchParams, Intl, Date, console };
vm.createContext(sandbox);
vm.runInContext(readFileSync(join(SITE, 'assets', 'js', 'config.js'), 'utf8'), sandbox);
const C = sandbox.window.WEDDING;
const H = C.helpers;
const ORDER = [...H.order];
const SITE_URL = C.siteUrl.replace(/\/?$/, '/');
const CITY = C.city || '';
const inCity = CITY ? `, ${CITY}` : '';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* every non-empty set of events, in envelope order */
const SETS = [];
for (let mask = 1; mask < (1 << ORDER.length); mask++) {
  SETS.push(ORDER.filter((_, i) => mask & (1 << i)));
}
const ALL = ORDER.join('|');
const codeOf = keys => H.code(keys);

function permutations(arr) {
  if (arr.length <= 1) return [arr];
  return arr.flatMap((x, i) => permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map(p => [x, ...p]));
}

/* ---------- the words ------------------------------------------ */

function words(keys) {
  const all = keys.join('|') === ALL;
  const list = keys.map(H.event);
  const names = H.namesOf(keys);
  const dates = H.datesOf(keys);
  const perEvent = list.map(e => {
    const p = H.dateParts(e);
    return `${e.name} · ${p.day} ${p.num} ${p.month}.`;
  }).join(' ');
  return {
    title:       all ? `${C.couple} — our wedding invitation`
                     : `${C.couple} — your invitation to the ${names}`,
    description: `${names} — ${dates}${inCity}.`,
    ogDesc:      `${perEvent}${CITY ? ' ' + CITY + '.' : ''}`,
    url:         all ? SITE_URL : `${SITE_URL}?e=${codeOf(keys)}`,
    /* fingerprinted, so a redrawn image is fetched again rather than
       served from WhatsApp's cache of the old one */
    image:       `${SITE_URL}assets/img/og-${codeOf(keys)}.jpg?v=${fingerprint(`assets/img/og-${codeOf(keys)}.jpg`)}`,
    alt:         `${C.couple} — ${names}, ${dates}${inCity}`,
    /* what the share image says under the couple's names */
    imgEvents:   list.map(e => e.name).join('  ·  '),
    imgDates:    `${dates}${CITY ? '  ·  ' + CITY : ''}`
  };
}

function previewBlock(keys) {
  const w = words(keys);
  return [
    '<!-- preview: written by build-site.mjs — edit that, not these lines -->',
    `<meta name="description" content="${esc(w.description)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(C.couple)}">`,
    `<meta property="og:title" content="${esc(w.title)}">`,
    `<meta property="og:description" content="${esc(w.ogDesc)}">`,
    `<meta property="og:image" content="${esc(w.image)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${esc(w.alt)}">`,
    `<meta property="og:url" content="${esc(w.url)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    '<!-- /preview -->'
  ].join('\n');
}

/* ---------- the share image: the card's own paper and sprigs ---- */

const ogTemplate = keys => {
  const w = words(keys);
  const css = pathToFileURL(join(SITE, 'assets', 'css', 'fonts.css')).href;
  const tl = pathToFileURL(join(IMG, 'leaves-tl.png')).href;
  const br = pathToFileURL(join(IMG, 'leaves-br.png')).href;
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${css}">
<style>
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #FFFFFF; color: #161816; }
  .tl { position: absolute; left: 0; top: 0; width: 330px; }
  .br { position: absolute; right: 0; bottom: 0; width: 300px; transform: translateY(150px); }
  .host { position: absolute; left: 0; right: 0; top: 112px; text-align: center;
          font: 700 23px/1 'Bodoni Moda', serif; letter-spacing: .06em; text-transform: uppercase; }
  .names { position: absolute; left: 0; right: 0; top: 178px; text-align: center;
           font: 400 112px/1.25 'Pinyon Script', cursive; }
  .amp { font: italic 400 66px/1 'Bodoni Moda', serif; color: #5A7262; margin: 0 .3em; vertical-align: .12em; }
  .rule { position: absolute; left: 50%; top: 392px; width: 260px; height: 1px; margin-left: -130px;
          background: linear-gradient(90deg, transparent, #A9BDAD, transparent); }
  .events { position: absolute; left: 0; right: 0; top: 418px; text-align: center; white-space: pre;
            font: 700 30px/1 'Bodoni Moda', serif; letter-spacing: .18em; text-indent: .18em;
            text-transform: uppercase; font-variation-settings: 'opsz' 14; }
  .dates { position: absolute; left: 0; right: 0; top: 472px; text-align: center; white-space: pre;
           font: 400 26px/1 'Libre Baskerville', serif; color: #3A3E3A; }
</style></head><body>
<img class="tl" src="${tl}"><img class="br" src="${br}">
<div class="host">${esc(C.hosts)}</div>
<div class="names">${C.couple.split(" & ").map(esc).join('<span class="amp">&amp;</span>')}</div>
<div class="rule"></div>
<div class="events">${esc(w.imgEvents)}</div>
<div class="dates">${esc(w.imgDates)}</div>
</body></html>`;
};

/* ---------- the browser ----------------------------------------- */

const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium'
];
const browser = BROWSERS.find(existsSync);
if (!browser) throw new Error('No Edge or Chrome found to draw the pictures with.');

const sleep = ms => new Promise(r => setTimeout(r, ms));
/* a throwaway browser profile next to this script, removed afterwards */
mkdirSync(join(HERE, '.tmp'), { recursive: true });
const prof = mkdtempSync(join(HERE, '.tmp', 'browser-'));
const port = 9400 + Math.floor(Math.random() * 400);
const proc = spawn(browser, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`,
  '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });

try {
  let page;
  for (let i = 0; i < 60 && !page; i++) {
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch {}
    if (!page) await sleep(200);
  }
  if (!page) throw new Error('the browser did not start');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = {};
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; } };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable');

  /* 1. the cards in the envelope: 300 css px wide, drawn at 1.5x */
  await send('Emulation.setDeviceMetricsOverride', { width: 300, height: 800, deviceScaleFactor: 1.5, mobile: false });
  const render = pathToFileURL(join(HERE, 'art', 'card-render.html')).href;
  for (const key of ORDER) {
    await send('Page.navigate', { url: `${render}?event=${key}` });
    let ready = false;
    for (let i = 0; i < 80 && !ready; i++) {
      const r = await send('Runtime.evaluate', { expression: 'document.body && document.body.dataset.ready', returnByValue: true });
      ready = r.result?.result?.value === '1';
      if (!ready) await sleep(150);
    }
    if (!ready) throw new Error(`the ${key} card did not finish drawing`);
    await sleep(250);
    const clip = { x: 0, y: 0, width: 300, height: 800, scale: 1 };
    const jpg = await send('Page.captureScreenshot', { format: 'jpeg', quality: 76, clip });
    writeFileSync(join(IMG, `thumb-${key}.jpg`), Buffer.from(jpg.result.data, 'base64'));
    const webp = await send('Page.captureScreenshot', { format: 'webp', quality: 68, clip });
    writeFileSync(join(IMG, `thumb-${key}.webp`), Buffer.from(webp.result.data, 'base64'));
    console.log(`thumb-${key}`.padEnd(15), 'the card in the envelope');
  }

  /* 3a. the share images */
  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
  const tmp = join(HERE, '.tmp', 'og-render.html');
  for (const keys of SETS) {
    writeFileSync(tmp, ogTemplate(keys));
    await send('Page.navigate', { url: pathToFileURL(tmp).href });
    await sleep(400);
    await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => 1)', awaitPromise: true });
    await sleep(150);
    const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 86 });
    writeFileSync(join(IMG, `og-${codeOf(keys)}.jpg`), Buffer.from(shot.result.data, 'base64'));
    console.log(`og-${codeOf(keys)}.jpg`.padEnd(15), words(keys).imgEvents.replace(/\s+·\s+/g, ' · '));
  }
  rmSync(tmp, { force: true });
  ws.close();
} finally {
  proc.kill();
  await sleep(800);
  try { rmSync(prof, { recursive: true, force: true }); } catch {}
}

/* ---------- 2. fingerprints -------------------------------------- */

/* The leaves and the cards in the envelope are put on the page by the
   scripts, so their fingerprints go into the page for the scripts to
   use (cards.js: asset()). Then every image address is versioned, and
   netlify.toml can let phones keep images for good. */
function versions() {
  const dir = join(SITE, 'assets', 'img');
  const map = {};
  for (const f of readdirSync(dir).sort()) {
    if (/^(leaves|thumb)-.*\.(webp|png|jpg)$/.test(f)) map[`assets/img/${f}`] = fingerprint(`assets/img/${f}`);
  }
  return '<!-- versions: written by build-site.mjs -->\n' +
         `<script>window.ASSET_V = ${JSON.stringify(map)};</script>\n` +
         '<!-- /versions -->';
}

function fingerprint(rel) {
  const file = join(SITE, rel);
  if (!existsSync(file)) return null;
  return createHash('sha1').update(readFileSync(file)).digest('hex').slice(0, 8);
}

/* assets/css/invite.css  ->  assets/css/invite.css?v=1a2b3c4d */
function stamp(html) {
  return html.replace(/(\s(?:src|href)=")(assets\/(?:css|js|img|audio)\/[^"?#]+)(?:\?v=[0-9a-f]*)?"/g,
    (m, pre, rel) => {
      const v = fingerprint(rel);
      return v ? `${pre}${rel}?v=${v}"` : m;
    });
}

for (const page of ['index.html', 'ar.html', 'services.html']) {
  const file = join(SITE, page);
  if (!existsSync(file)) continue;
  const before = readFileSync(file, 'utf8');
  let after = stamp(before.replace(/<!-- versions:[\s\S]*?<!-- \/versions -->/, versions()));
  /* the services page shares with this site's own picture */
  if (page === 'services.html') {
    const og = `assets/img/og-${codeOf(ORDER)}.jpg`;
    after = after.replace(/<meta property="og:image" content="[^"]*">/,
      `<meta property="og:image" content="${SITE_URL}${og}?v=${fingerprint(og)}">`);
  }
  if (after !== before) writeFileSync(file, after);
  const n = (after.match(/\?v=[0-9a-f]{8}"/g) || []).length;
  console.log(page.padEnd(15), `${n} files fingerprinted`);
}

/* ---------- 3b. index.html --------------------------------------- */

const indexPath = join(SITE, 'index.html');
let index = readFileSync(indexPath, 'utf8');
const BLOCK = /<!-- preview:[\s\S]*?<!-- \/preview -->/;
if (!BLOCK.test(index)) throw new Error('index.html: the <!-- preview --> markers are missing');

index = index.replace(BLOCK, previewBlock(ORDER));
writeFileSync(indexPath, index);
console.log('index.html     preview tags for', H.namesOf(ORDER));

/* ---------- 3c. a copy per set of events ------------------------- */

const VARIANTS = join(SITE, 'i');
rmSync(VARIANTS, { recursive: true, force: true });
let copies = 0;
for (const keys of SETS) {
  const html = index.replace(BLOCK, previewBlock(keys))
    /* and only the cards this envelope holds are fetched ahead of time */
    .replace(/<link rel="preload" as="image" type="image\/webp" href="assets\/img\/thumb-([\w-]+)\.webp[^"]*">\r?\n/g,
      (line, key) => keys.includes(key) ? line : '')
    .replace('<html lang="en">',
      '<html lang="en">\n<!-- generated by build-site.mjs from index.html: do not edit, re-run it -->');
  for (const perm of permutations(keys)) {
    const dir = join(VARIANTS, perm.map(k => H.letter[k]).join(''));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), html);
    copies++;
  }
}
console.log(`i/             ${copies} copies, one per ordering of every set of events`);

/* Anything else in ?e= (a typo, a capital letter) finds no copy. The
   404 page is the invitation itself, so even then the guest gets their
   cards: the page reads ?e= for itself and falls back to all three.
   <base> keeps its assets loading from any depth. */
const notFound = index.replace('<head>', '<head>\n<base href="/">')
  .replace('<html lang="en">',
    '<html lang="en">\n<!-- generated by build-site.mjs from index.html: do not edit, re-run it -->');
writeFileSync(join(SITE, '404.html'), notFound);
console.log('404.html       the invitation, for any address that matches nothing');

/* ---------- 3d. the Netlify rules -------------------------------- */

/* Netlify matches a rule only when the address has exactly the
   parameters the rule lists — no more. So there is one rule for each
   combination of the parameters a guest link can carry alongside e=. */
const OPTIONAL = ['to', 'p', 'event', 'open'];
const rules = [];
for (let mask = 0; mask < (1 << OPTIONAL.length); mask++) {
  const extra = OPTIONAL.filter((_, i) => mask & (1 << i));
  const q = ['e = ":e"', ...extra.map(k => `${k} = ":${k}"`)].join(', ');
  rules.push([
    '[[redirects]]',
    '  from = "/"',
    '  to = "/i/:e/"',
    '  status = 200',
    '  force = true',
    `  query = { ${q} }`
  ].join('\n'));
}

const tomlPath = join(SITE, 'netlify.toml');
let toml = readFileSync(tomlPath, 'utf8');
const RULES = /# >>> previews[\s\S]*?# <<< previews\n?/;
const ruleBlock =
  '# >>> previews — written by build-site.mjs, do not edit by hand\n' +
  '# A link carrying ?e= is served the copy of index.html whose preview\n' +
  '# names only those events. The address in the guest\'s browser, and\n' +
  '# the page itself, are unchanged.\n' +
  rules.join('\n\n') + '\n' +
  '# <<< previews\n';
toml = RULES.test(toml) ? toml.replace(RULES, ruleBlock) : toml.replace(/\s*$/, '\n\n' + ruleBlock);
writeFileSync(tomlPath, toml);
console.log(`netlify.toml   ${rules.length} rules`);
