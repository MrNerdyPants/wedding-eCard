AR is built into this invitation but SWITCHED OFF.

The camera view needs a tracker compiled from the printed card, and two
pictures made for this couple. Until all three exist it stays off, and
ar.html only ever shows "The card tracker isn't installed yet".

To switch it on:

  1. Open  https://hiukim.github.io/mind-ar-js-doc/tools/compile
  2. Upload a straight, well-lit photo or scan of the printed card
  3. Press Start, wait, and download the file it makes (targets.mind)
  4. Rename it  card.mind  and put it in this folder
  5. Make  assets/img/ar-monogram.png  (512 x 512, the couple's initials)
     and   assets/img/ar-meta.png      (1024 x 256, day, date and venue)
  6. In assets/js/config.js set  ar: true  on the event the card is for
  7. node build-site.mjs, then deploy
