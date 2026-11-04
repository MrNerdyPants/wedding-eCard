# Wedding e-card template

A digital wedding invitation that opens like a real one. The guest taps a wax seal, and the
envelope hands them only the cards they are invited to (Mehndi, Barat, Walima, or any
events you like), with their name and seat count on each card. Under the card are a
countdown, Add to Calendar, Directions and Share, plus the RSVP names.

It ships filled in for a made-up couple, **John Doe & Jane Smith**. Everything that
belongs to a real couple lives in one file, `site/assets/js/config.js`. Change the values
there and the whole invitation follows: the envelope, the cards, the link previews, the
calendar entries and the guest-link tool.

## Making a new invitation

1. **Copy this folder** for the new couple. Keep the template itself as John Doe, and
   don't commit a client's details to a public repository.
2. **Fill in `site/assets/js/config.js`.** Every value has a comment beside it. The main ones:

   | Setting | What it is |
   |---|---|
   | `id` | short name for this invitation, e.g. `ali-sara-2027` (calendar files, the guest tool's saved list) |
   | `couple` | `'Ali & Sara'`: the browser tab, link previews, share sheet |
   | `monogram` | `'A & S'`: pressed into the wax seal |
   | `hosts`, `groom`, `bride` | the top line of the card and the names in script |
   | `invite`, `inviteRest`, `inviteGuest` | the invitation line, without and with a guest's name |
   | `kicker`, `blessing` | the line above the envelope and at the foot of the page (`''` for none) |
   | `labels` | the small printed words: *Weds*, *Looking Forward*, *R.S.V.P*, *View location* |
   | `city` | shown on the envelope and in previews; added to addresses that leave it out |
   | `siteUrl` | the address the site is published at |
   | `order`, `events` | the events, in envelope order: name, engraved title, start/end time, programme rows, venue, address, Google Maps pin |
   | `lookingForward` | the left column at the foot of the card (`[]` to leave it off) |
   | `rsvp.people`, `rsvp.others` | the right column; give a person a `whatsapp` number and their name becomes tappable |
   | `credit` | the "Invitation crafted by" line at the foot of the page |
   | `music` | drop an mp3 at `site/assets/audio/wedding.mp3` |

3. **Build it:**

   ```
   node build-site.mjs
   ```

   This photographs the cards for the envelope, draws the link-preview images, writes the
   per-event preview pages and Netlify rules, and fingerprints every file so phones fetch
   fresh copies. It needs Microsoft Edge or Google Chrome, and finds either by itself.
   Run it again after **every** change to `config.js`.

4. **Make the guest-link tool**, with a password of your choice:

   ```
   node build-guests.mjs "a password"
   ```

   This writes an encrypted `site/guests.html`. The password is never stored anywhere, so
   keep it somewhere safe. `.gitignore` keeps `guests.html` out of git.

5. **Deploy:** drag the `site` folder, and only that folder, onto
   [app.netlify.com/drop](https://app.netlify.com/drop). Rename the site in Netlify to
   match `siteUrl`, or put Netlify's address in `siteUrl`, rebuild and upload again. To
   update it later, upload `site` from the site's **Deploys** tab, not from the Drop page
   (which makes a new site).

## Guest links

`<site>/guests.html` makes them: paste your guest list, tick each family's events, set
their seats. Each guest gets one link, plus a QR code. The links look like this:

| Part | Does |
|---|---|
| `?to=The%20Roe%20Family` | puts their name on the envelope and every card |
| `&e=bw` | only these events, by first letter (`m`ehndi, `b`arat, `w`alima) |
| `&p=b2w4` | seats per event (or `p=4` for the same number at each) |
| `&event=w` | this card waits on top of the pile |
| `&open=1` | skips the envelope |

WhatsApp previews name only the guest's events (*"your invitation to the Barat &
Walima"*). That's what the `site/i/` pages and the rules in `netlify.toml` are for.

## The card's look

- **Type**: Bodoni Moda (hosts, titles, dates), Libre Baskerville (text) and Pinyon Script
  (names), self-hosted in `site/assets/fonts`.
- **The engraved titles** (MEHNDI, BARAT, WALIMA) are a heavy Bodoni with lines cut in by an
  SVG filter in `site/assets/js/cards.js` (`title()`), so they stay sharp at any size.
- **The watercolour leaves** are painted by `art/paint-leaves.py`. Change the seeds or the
  sprays at the bottom of that file for different sprigs, then run
  `python art/paint-leaves.py` and `node build-site.mjs`.
- **Colours** are the tokens at the top of `site/assets/css/invite.css`.

## AR

The AR camera view (`site/ar.html`) is included but **switched off**: every event has
`ar: false`, so no button links to it, and the page itself only says the tracker isn't
installed. To switch it on for a couple, follow `site/targets/README.txt`.

## What's in here

```
site/                    drag this to Netlify
  index.html             the envelope, the bundle, the cards
  services.html          the cards you make, and how to order one
  ar.html                AR, switched off
  404.html, i/           written by build-site.mjs: per-event link previews
  netlify.toml           caching and the preview rules
  assets/js/config.js    THE file to edit
  assets/js/cards.js     the card template
  assets/js/invite.js    the envelope, tray and RSVP
  assets/css/invite.css  the look
art/
  paint-leaves.py        paints the watercolour sprigs
  card-render.html       used by build-site.mjs to photograph the cards
build-site.mjs           run after every change
build-guests.mjs         encrypts guests-source.html into site/guests.html
guests-source.html       the guest tool in plain text
```
