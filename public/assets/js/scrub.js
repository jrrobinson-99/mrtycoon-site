// Hero orbit scrub. Primary path: a pre-extracted JPG frame sequence drawn to a canvas.
// Fallback: scrub the mp4's currentTime if the frames are missing.

const TOTAL_FRAMES = 340; // set by extract-frames.sh (21s stage clip at 16fps)
const FRAME_PATH = 'assets/frames/orbit/orbit_';

export function initScrub({ canvas, video, onProgress }) {
  const context = canvas.getContext('2d', { alpha: false });
  // Phones load every second frame: half the download, and the easing hides the gaps.
  const frameStep = innerWidth < 960 ? 2 : 1;
  const frames = [];
  let loadedCount = 0;
  let useFrames = false;
  let currentIndex = -1;

  function coverRect(sourceWidth, sourceHeight) {
    const scale = Math.max(canvas.width / sourceWidth, canvas.height / sourceHeight);
    return [
      (canvas.width - sourceWidth * scale) / 2,
      (canvas.height - sourceHeight * scale) / 2,
      sourceWidth * scale,
      sourceHeight * scale,
    ];
  }

  function draw(index, force) {
    if (!force && index === currentIndex) return;
    if (useFrames) {
      // walk back to the nearest frame that has finished loading
      let image = frames[index];
      for (let back = index; back >= 0 && !(image && image.complete && image.naturalWidth); back--) {
        image = frames[back];
      }
      if (!image || !image.naturalWidth) return;
      currentIndex = index;
      context.drawImage(image, ...coverRect(image.naturalWidth, image.naturalHeight));
    } else if (video.readyState >= 2) {
      currentIndex = index;
      context.drawImage(video, ...coverRect(video.videoWidth, video.videoHeight));
    }
  }

  function resize() {
    const pixelRatio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * pixelRatio;
    canvas.height = innerHeight * pixelRatio;
    draw(Math.max(0, currentIndex), true);
  }

  function loadFrames() {
    useFrames = true;
    const frameCount = Math.ceil(TOTAL_FRAMES / frameStep);
    for (let i = 0; i < frameCount; i++) {
      const image = new Image();
      image.onload = image.onerror = () => {
        loadedCount++;
        if (loadedCount === 1) draw(0, true);
        onProgress(loadedCount / frameCount);
      };
      image.src = FRAME_PATH + String(i * frameStep + 1).padStart(4, '0') + '.jpg';
      frames.push(image);
    }
  }

  function loadVideoFallback() {
    video.src = video.dataset.src;
    video.addEventListener('loadeddata', () => { draw(0, true); onProgress(1); });
    video.addEventListener('error', () => onProgress(1));
    video.load();
  }

  const probe = new Image();
  probe.onload = loadFrames;
  probe.onerror = loadVideoFallback;
  probe.src = FRAME_PATH + '0001.jpg';

  addEventListener('resize', resize);
  resize();

  return {
    // progress is 0..1 through the hero
    setProgress(progress) {
      if (useFrames) {
        draw(Math.round(progress * (frames.length - 1)));
      } else if (video.duration) {
        const time = progress * (video.duration - 0.05);
        if (Math.abs(video.currentTime - time) > 0.016) video.currentTime = time;
        draw(0, true);
      }
    },
  };
}
