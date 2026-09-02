# Mr. Tycoon — Going Pro University

Cinematic scroll site. Ink-black, gold, cream. Everything drives to the strategy call
for the 60-Day Sprint.

## Run it locally

Double-click **`start.command`**, or:

```
cd public && python3 -m http.server 8080
```

Then open <http://localhost:8080>. It must be served over http — opening
`index.html` as a `file://` URL breaks the canvas and blocks the media.

## Layout

```
public/                       <- this folder is what deploys
  index.html                  the whole site, self-contained
  _headers                    Cloudflare cache rules
  assets/video/*.v2.mp4       three H.264 clips
  assets/frames/orbit/        193 JPGs driving the hero scrub
  assets/frames/*-poster.v2.jpg
media-src/                    NOT deployed
  hevc-originals/             untouched Higgsfield masters (HEVC Main 10)
  superseded/                 older encodes, kept for reference
  codec-check.html            browser media diagnostic
extract-frames.sh             regenerates the orbit frames
start.command                 double-click local server
```

## Deploying to Cloudflare Pages

**Build output directory: `public`.** Leave the build command empty — nothing compiles.

Direct upload, no git required:

```
npx wrangler pages deploy public --project-name=mrtycoon
```

Or connect the GitHub repo in the Cloudflare dashboard and set the output directory
to `public`.

## If you change the hero clip

```
./extract-frames.sh
```

It re-slices `public/assets/video/hero-orbit.v2.mp4` at 24fps. If the frame count
changes, it tells you the new number — put it in `TOTAL_FRAMES` in `public/index.html`.

## Media notes

Higgsfield exports **HEVC Main 10, 10-bit**, which Chrome on macOS will not decode.
Everything in `public/assets/video/` has been transcoded to H.264 High 8-bit
(`yuv420p`, faststart). If you add a new clip, transcode it the same way:

```
ffmpeg -i in.mp4 -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 22 -an -movflags +faststart out.mp4
```

The clips are dark by design (mean luma 74/255 and 37/255). The section scrim darkens
them once — don't add an `opacity` on top of it or they go black.

## Before this goes live

- [ ] **Wire the form to GoHighLevel.** It currently captures nothing.
- [ ] **Two named student testimonials** with real numbers, replacing the placeholder
      in The Students card.
- [ ] **Confirm the remaining balance terms** on the Sprint (marked in an HTML comment).
- [ ] **The New York Times claim** is deliberately absent — it's on the YouTube banner
      but could not be verified anywhere. Get the link or leave it off.
- [ ] Real social URLs — YouTube, Facebook and LinkedIn are `#` placeholders.
- [ ] Confirm the hero name still fits on one line once Archivo Black loads. If it's
      tight, drop `11vw` to `10vw`.

## Notes on the build

**Scroll scrub.** The hero is 520vh of scroll driving a sticky 100vh canvas. The frame
index is eased toward the true scroll position (0.14 lerp) so it feels weighted rather
than twitchy. One rAF loop, idle when caught up. It probes for the frame sequence and
falls back to scrubbing the mp4 if the frames are missing.

**Text hand-off.** The name tracks in letter-by-letter over the first 35%, holds, then
dissolves at 62% as the tagline assembles clause by clause.

**Motion safety.** `prefers-reduced-motion` kills the tagline and pins everything
visible. Mobile drops the hero to 300vh.

**Numbers.** All four stats come from Mr. Tycoon's own words on camera — 30+ years,
$2,000/hr, 40% of acquisitions from probate and distress, 60 days. Nothing invented.

**Diagnostics.** `public/index.html` carries a small video-error badge script that only
runs on localhost. It reports the exact media failure if a clip won't play.
