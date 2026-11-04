/* ============================================================
   Encrypt the guest tool into site/guests.html
   ------------------------------------------------------------
     node build-guests.mjs            asks for the password
     node build-guests.mjs "secret"   takes it as an argument

   The site is static, so there is no server to check a password
   against — a login screen in front of a page whose source anyone
   can read is theatre. So the page itself is encrypted: the file
   that gets deployed holds nothing but ciphertext, and the only
   thing that can turn it back into the tool is the password, which
   is typed in and never stored anywhere in the project.

   Change the tool by editing guests-source.html and running this
   again. Nothing else reads guests-source.html, and it is outside
   site/, so it never gets deployed.
   ============================================================ */

import { readFileSync, writeFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(HERE, 'guests-source.html');
const OUT = join(HERE, 'site', 'guests.html');
/* PBKDF2_ITER is only lowered when testing the page locally */
const ITERATIONS = Number(process.env.PBKDF2_ITER || 310000);

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(question, (a) => { rl.close(); res(a); }));
}

const password = (process.argv[2] ?? await ask('Password for the guest page: ')).trim();
if (password.length < 8) {
  console.error('That password is too short to be worth encrypting with.');
  process.exit(1);
}

const src = readFileSync(SOURCE, 'utf8');
const a = src.indexOf('<!--PAYLOAD-START-->');
const b = src.indexOf('<!--PAYLOAD-END-->');
if (a < 0 || b < 0) {
  console.error('guests-source.html is missing its PAYLOAD markers.');
  process.exit(1);
}
const payload = src.slice(a + '<!--PAYLOAD-START-->'.length, b).trim();

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));

const base = await crypto.subtle.importKey(
  'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
  base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);

const cipher = new Uint8Array(await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv }, key, new TextEncoder().encode(payload)));

const b64 = (u8) => Buffer.from(u8).toString('base64');

const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Guest Links</title>
<meta name="robots" content="noindex, nofollow">
<link rel="stylesheet" href="assets/css/fonts.css">
<style>
:root{--paper:#F2F4EF;--paper-hi:#FFFFFF;--ink:#1B1E1B;--ink-soft:#454C46;
  --ink-mute:#737C75;--gold:#7C9581;--gold-ink:#5A7262;--gold-hair:#C6D3C8;--line:#D8DFD6}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;min-height:100svh;background:var(--paper);color:var(--ink);
  font-family:'Cormorant Garamond',Georgia,serif;-webkit-font-smoothing:antialiased}
#lock{min-height:100svh;display:grid;place-items:center;padding:1.5rem}
.box{width:min(100%,23rem);text-align:center}
.kick{margin:0 0 .3rem;font-family:'Jost',sans-serif;font-weight:300;font-size:.64rem;
  letter-spacing:.4em;text-indent:.4em;text-transform:uppercase;color:var(--gold-ink)}
h1{margin:.2rem 0 .1rem;font-size:1.7rem;font-weight:500}
.sub{margin:.2rem 0 1.6rem;font-size:1rem;font-weight:300;color:var(--ink-mute)}
.rule{width:5rem;height:1px;margin:0 auto 1.6rem;
  background:linear-gradient(90deg,transparent,var(--gold-hair),transparent)}
form{display:flex;flex-direction:column;gap:.6rem}
input{width:100%;padding:.8rem .9rem;border:1px solid var(--line);border-radius:3px;
  background:var(--paper-hi);color:var(--ink);font-family:'Jost',sans-serif;
  font-size:.95rem;letter-spacing:.06em;text-align:center}
input:focus{outline:2px solid var(--gold-ink);outline-offset:1px;border-color:transparent}
button{padding:.8rem 1rem;border:1px solid var(--ink);border-radius:2px;background:var(--ink);
  color:var(--paper-hi);font-family:'Jost',sans-serif;font-size:.72rem;letter-spacing:.18em;
  text-transform:uppercase;cursor:pointer}
button:disabled{opacity:.5;cursor:progress}
.msg{min-height:1.2rem;margin:.6rem 0 0;font-family:'Jost',sans-serif;font-size:.68rem;
  letter-spacing:.12em;text-transform:uppercase;color:#8A3A20}
.note{margin:1.6rem 0 0;font-size:.9rem;font-weight:300;line-height:1.6;color:var(--ink-mute)}
</style>
</head>
<body>

<div id="lock">
  <div class="box">
    <p class="kick">${'Abdullah &amp; Fiza'}</p>
    <h1>Guest links</h1>
    <p class="sub">for the family only</p>
    <div class="rule"></div>
    <form id="f">
      <input id="pw" type="password" autocomplete="current-password"
             placeholder="Password" autofocus spellcheck="false">
      <button id="go" type="submit">Unlock</button>
    </form>
    <p class="msg" id="msg"></p>
    <p class="note">This page builds the personal invitation links. It is kept behind a
    password so nobody can mint an invitation for themselves.</p>
  </div>
</div>

<div id="app"></div>

<script src="assets/vendor/qrcode-generator.min.js"></script>
<script src="assets/js/config.js"></script>
<script>
/* The tool is not hidden behind this screen — it IS this screen's
   ciphertext. Without the password there is nothing here to read. */
(function () {
  'use strict';
  var SALT = "${b64(salt)}";
  var IV   = "${b64(iv)}";
  var DATA = "${b64(cipher)}";
  var ITER = ${ITERATIONS};
  var KEEP = 'mw.guests.k';

  var $ = function (id) { return document.getElementById(id); };

  function bytes(b64) {
    var s = atob(b64), u = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return u;
  }

  function open(html) {
    var app = $('app');
    app.innerHTML = html;
    /* innerHTML never runs a script tag, so hand each one to the parser */
    Array.prototype.forEach.call(app.querySelectorAll('script'), function (old) {
      var s = document.createElement('script');
      if (old.src) s.src = old.src; else s.textContent = old.textContent;
      document.body.appendChild(s);
      old.remove();
    });
    $('lock').remove();
    document.title = 'Guest Links & QR Codes';
  }

  function unlock(pw, quiet) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey'])
      .then(function (base) {
        return crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: bytes(SALT), iterations: ITER, hash: 'SHA-256' },
          base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
      })
      .then(function (key) {
        return crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(IV) }, key, bytes(DATA));
      })
      .then(function (buf) {
        try { sessionStorage.setItem(KEEP, pw); } catch (e) {}
        open(new TextDecoder().decode(buf));
      })
      .catch(function () {
        if (quiet) { try { sessionStorage.removeItem(KEEP); } catch (e) {} return; }
        $('msg').textContent = 'That is not the password';
        $('go').disabled = false;
        $('pw').select();
      });
  }

  $('f').addEventListener('submit', function (e) {
    e.preventDefault();
    var pw = $('pw').value;
    if (!pw) return;
    $('msg').textContent = '';
    $('go').disabled = true;
    $('go').textContent = 'Unlocking';
    setTimeout(function () { unlock(pw, false).then(function () {
      /* once unlocked, the form is gone */
      if ($('go')) $('go').textContent = 'Unlock';
    }); }, 20);
  });

  /* stays unlocked for this tab only */
  try {
    var kept = sessionStorage.getItem(KEEP);
    if (kept) unlock(kept, true);
  } catch (e) {}
})();
</script>
</body>
</html>
`;

writeFileSync(OUT, page, 'utf8');
console.log('wrote', OUT);
console.log('payload', payload.length, 'chars ->', cipher.length, 'bytes of ciphertext');
console.log('PBKDF2-SHA256', ITERATIONS, 'iterations, AES-GCM-256');
