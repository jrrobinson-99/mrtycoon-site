# Mr. Tycoon — The 60-Day Sprint

Scroll site built around one idea: **the machine does the grind, you get him.**
Midnight navy, pinstripes, platinum. Everything drives to the strategy call.

> **Palette rule: silver or platinum, never gold.** Navy and pinstripe navy.

## Run it locally

Double-click **`start.command`**, or:

```
cd public && python3 -m http.server 8080
```

Then open <http://localhost:8080>. It must be served over http — opening
`index.html` as a `file://` URL breaks the canvas, the JS modules and the media.

## Layout

```
public/                       <- this folder is what deploys
  index.html                  the page and all its copy
  _headers                    Cloudflare cache rules
  assets/css/site.css         every style: colours, glass, layout, phone rules
  assets/js/main.js           boot, preloader, hero choreography, shared frame loop
  assets/js/scrub.js          hero orbit scroll-scrub (TOTAL_FRAMES lives here)
  assets/js/machine.js        the pinned 60-day scene
  assets/js/motion.js         reveals, tilt, dust, gallery, photo deck, mentor slider
  assets/img/                 web-size photos
  assets/video/*.v2.mp4       three H.264 clips
  assets/frames/orbit/        340 JPGs driving the hero scrub
  assets/frames/*-poster.v2.jpg
media-src/                    NOT deployed
extract-frames.sh             regenerates the orbit frames
start.command                 double-click local server
```

No build step, no packages, nothing to install.

Photo originals, design specs and launch notes are kept locally and are git-ignored —
this repository holds only the files that build the site.

## Editing copy

Quotes on the page are verbatim. Don't paraphrase, tidy the grammar, or add a quote
without a source. The day counter in the Machine scene is a visual device — it never
assigns content to a specific day.

**Prices** live in the Investment section of `index.html`. The real figure is written in the
HTML and the script only animates it, so a failed script can never show "$0". If a price
changes, update both the visible number and its `data-count`. The Machine scene and the
Machine price card describe the same package — change one, change the other.

## Before this goes live

- [x] **GoHighLevel calendar embedded** in the close section (`.ghl-frame` in `index.html`).
      Bookings land in GHL. No custom form — capture always goes through GHL.
      Don't add `loading="lazy"` to that iframe: GHL's script keeps the frame off-screen
      until it loads, so a lazy frame never loads and the panel stays empty.
      The calendar's look (white card, see-through at rest, solid on hover or focus) lives on
      the `.ghl-wrap` div around it, because GHL's script overwrites styles set on the iframe
      itself. To change how see-through it is, edit the `opacity` on `.ghl-wrap` in `site.css`.
- [ ] Work through the local launch checklist (`LAUNCH-NOTES.md`, not in this repo).

## Deploying to Cloudflare Pages

**Build output directory: `public`.** Leave the build command empty — nothing compiles.

```
npx wrangler pages deploy public --project-name=mrtycoon
```

Or connect the GitHub repo in the Cloudflare dashboard and set the output directory
to `public`.

## If you change the hero clip

```
./extract-frames.sh
```

It re-slices `public/assets/video/hero-orbit.v2.mp4` at 16fps, 1280 wide. If the frame count
changes, it tells you the new number — put it in `TOTAL_FRAMES` at the top of
`public/assets/js/scrub.js`. `FPS`, `WIDTH` and `QUALITY` can be overridden as environment
variables.

ffmpeg is not installed on this Mac. The script uses the copy bundled with Remotion in
`dev/Video Agent` (it needs its own folder on the dylib path, which the script sets). That
build has no `fps` filter, so the rate is set with `-r`. Point `FFMPEG_DIR` elsewhere if
that folder moves.

The current clip is three Higgsfield renders stitched end to end: the orbit from behind him
to his face, the mic drop, and the fall that lands as the chess king. The three originals are
in `media-src/` and the old studio orbit is in `media-src/superseded/`.

## Media notes

Higgsfield exports **HEVC Main 10, 10-bit**, which Chrome on macOS will not decode.
Everything in `public/assets/video/` has been transcoded to H.264 High 8-bit
(`yuv420p`, faststart). If you add a new clip, transcode it the same way:

```
ffmpeg -i in.mp4 -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 22 -an -movflags +faststart out.mp4
```

**The clips were rendered with warm lighting.** They are pulled to navy in CSS, not
re-rendered: a `grayscale` filter on the canvas/video plus a `.regrade` layer using
`mix-blend-mode: color`. If a new clip looks wrong, tune those two — don't re-export.

To add a photo, make a web-size copy of the original:

```
sips -s format jpeg -s formatOptions 74 -Z 1600 "IN.jpeg" --out public/assets/img/OUT.jpg
```

## Notes on the build

**One animation loop.** `main.js` runs a single `requestAnimationFrame` loop; the other
modules register a callback with `onFrame()` rather than each running their own.

**Hero.** 520vh of scroll (320vh on phones) driving a sticky canvas. The frame index eases
toward the true scroll position so the orbit feels weighted. Phones load every second
frame. Falls back to scrubbing the mp4 if the frames are missing. The name animates in on
load, then hands off to the tagline.

**The Machine.** 540vh of scroll driving a pinned stage. Progress lights the five nodes,
fills the rail, runs the day counter 01→60, spotlights the one human node, then swaps to
the who-does-what lanes. All thresholds are constants at the top of `machine.js`.

**Reveals use `translate`, tilt uses `transform`** — deliberately different properties so
the two effects never fight on the same glass panel.

**Phones.** The Machine rail turns vertical. The mentor slider stops being side-by-side
(too narrow) and becomes a wipe that snaps to either quote. On short phones (under 720px
tall) the Machine headline fades out so the three lanes fit.

**Motion safety.** With `prefers-reduced-motion`, the hero is one screen, the Machine
unpins and shows every node and lane at once, and nothing is left hidden.

**Tested 2026-09-18** at 1440×900, 390×844 and 375×667, plus reduced motion. Console clean.
