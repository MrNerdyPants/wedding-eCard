# Abdullah & Fiza — the wedding invitation

The digital invitation for **Abdullah Janjua & Fiza Khalid**: Mehndi, Barat and Walima,
13–15 November 2026, Faisalabad. Built on the Moiz & Warisha invitation, with the card
redrawn from the printed one (`scan/Abdullah Wedding.jpeg`).

A guest opens a link, taps the sage wax seal, and the envelope hands them only the cards
they are invited to, with their name and seats on each. Under the card: a countdown,
Add to Calendar, Directions (the exact pins from the QR codes on the printed cards) and
Share.

## Deploying

```
node build-site.mjs
```

Run that from this folder before every deploy, then **drag the `site` folder — only that
folder — onto [app.netlify.com/drop](https://app.netlify.com/drop)**.

`build-site.mjs` photographs the three cards for the envelope, draws the link-preview
images, fingerprints every CSS/JS/image link so phones fetch fresh files, and writes the
per-event preview pages (`site/i/`, `site/404.html`, the block in `site/netlify.toml`).
It needs Edge or Chrome, and finds either by itself. Never edit those generated files by
hand.

**Once Netlify gives the site its address**, put it in `site/assets/js/config.js` as
`siteUrl` (it is `https://abdullah-weds-fiza.netlify.app/` for now), run
`node build-site.mjs` again, and re-deploy. Link previews, calendar entries and the guest
links all use it.

## Changing anything

Every name, date, time, venue and map pin is in **`site/assets/js/config.js`**. Edit it,
run `node build-site.mjs`, re-deploy.

- The programme rows (`Rasm-e-Hina … 7PM`) are each event's `schedule`.
- `lookingForward` is the left column at the foot of the card; `rsvp.people` and
  `rsvp.others` are the R.S.V.P column.
- Give an RSVP person a number (`whatsapp: '0300 1234567'`) and their name becomes a
  WhatsApp link on the card and under the countdown. None are set yet.
- Background music: drop an mp3 at `site/assets/audio/wedding.mp3`. The control only
  appears once the file exists.

## Guest links

`site/guests.html` is the guest-link and QR tool, encrypted. Open
`<site>/guests.html` and enter the password you were given. Your list stays in that
browser and is never uploaded.

To change the tool, edit `guests-source.html` (never deployed) and re-encrypt:

```
node build-guests.mjs "your password"
```

The same command with a new password changes the password.

Link format, the same as Moiz & Warisha's: `?to=Name` puts a name on the cards,
`?e=mb` limits the envelope to Mehndi and Barat (`m`, `b`, `w`), `?p=m6b2w4` sets seats per
event, `?event=w` puts that card on top, `?open=1` skips the envelope.

## The card

The printed card is only a small scan, so nothing from it is used directly:

- **Type**: Bodoni Moda (hosts, titles, date), Libre Baskerville (text), Pinyon Script (names),
  all self-hosted in `site/assets/fonts`.
- **MEHNDI / BARAT / WALIMA**: the engraved lines are cut into a heavy Bodoni by an SVG filter
  in `site/assets/js/cards.js` (`title()`). They are sharp at any size.
- **The leaves** are painted in watercolour by `art/paint-leaves.py`
  (`python art/paint-leaves.py`, then `node build-site.mjs`). Change the seeds or sprays at
  the bottom of that file for different sprigs.
- The QR code on the printed card becomes a **View location** button on the screen.

## AR

The AR view from the Moiz & Warisha invitation is included (`site/ar.html`,
`assets/js/ar.js`, `assets/css/ar.css`, the A-Frame and MindAR libraries) but **switched
off**: every event has `ar: false`, so the "View in AR" button never shows, and `ar.html` only
says the tracker isn't installed. Moiz & Warisha's tracker, monogram and date pictures were
deliberately not copied. To switch it on, follow `site/targets/README.txt`.

## What's in here

```
site/                 drag this to Netlify
  index.html          the envelope, the bundle, and the cards
  services.html       the cards Kashan makes, and how to order one
  guests.html         the guest tool, encrypted
  ar.html             AR, switched off
  404.html, i/        written by build-site.mjs: per-event link previews
  netlify.toml        caching and the preview rules
  assets/js/config.js THE file to edit
  assets/js/cards.js  the card template
  assets/js/invite.js the envelope, tray and RSVP
  assets/css/invite.css
art/
  paint-leaves.py     paints the watercolour sprigs
  card-render.html    used by build-site.mjs to photograph the cards
build-site.mjs        run before every deploy
build-guests.mjs      encrypts guests-source.html into site/guests.html
guests-source.html    the guest tool in plain text — edit this one
scan/                 the printed card, for reference
```
