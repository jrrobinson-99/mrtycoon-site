// Everything that moves outside the hero and the machine scene: reveals, word splits,
// count-ups, glass highlights, tilt, magnetic buttons, dust, the gallery drift, the photo
// deck, the timeline fill, the mentor slider and the lazy background videos.

const canHover = matchMedia('(hover: hover)').matches;

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

/* ---------- word splitting ---------- */

function wrapWords(textNode, nextIndex, innerClass) {
  const fragment = document.createDocumentFragment();
  textNode.textContent.split(/(\s+)/).forEach((part) => {
    if (!part) return;
    if (/^\s+$/.test(part)) { fragment.append(' '); return; }
    const outer = document.createElement('span');
    const inner = document.createElement('span');
    outer.className = 'w';
    inner.className = innerClass;
    inner.style.setProperty('--i', nextIndex());
    inner.textContent = part;
    outer.append(inner);
    fragment.append(outer);
  });
  textNode.replaceWith(fragment);
}

function splitHeading(heading) {
  let wordIndex = 0;
  const nextIndex = () => wordIndex++;
  [...heading.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      wrapWords(node, nextIndex, 'wi');
    } else if (node.nodeName === 'EM') {
      // The platinum fill has to live on the moving word itself: a clipped-text background
      // on the parent goes invisible once its children are translated.
      node.classList.add('is-split');
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) wrapWords(child, nextIndex, 'wi metal');
      });
    }
  });
}

/* ---------- count-up ---------- */

function countUp(element, reducedMotion) {
  const end = Number(element.dataset.count);
  // The real figure is already in the HTML. With motion reduced, leave it alone — a price
  // should never be caught mid-count.
  if (reducedMotion) return;
  const startTime = performance.now();
  const duration = 1600;
  function step(now) {
    const progress = clamp01((now - startTime) / duration);
    element.textContent = Math.round(end * easeOutCubic(progress)).toLocaleString('en-US');
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ---------- dust ---------- */

function initDust(canvas, onFrame) {
  const context = canvas.getContext('2d');
  const particleCount = innerWidth < 960 ? 26 : 64;
  let width = 0;
  let height = 0;

  function resize() {
    const pixelRatio = Math.min(devicePixelRatio || 1, 2);
    width = innerWidth;
    height = innerHeight;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

  const particles = Array.from({ length: particleCount }, () => ({
    x: Math.random(),
    y: Math.random(),
    radius: 0.4 + Math.random() * 1.4,
    speed: 0.00012 + Math.random() * 0.00035,
    sway: Math.random() * Math.PI * 2,
    depth: 0.2 + Math.random() * 0.8,
  }));

  onFrame(({ scrollY }) => {
    context.clearRect(0, 0, width, height);
    particles.forEach((particle) => {
      particle.y -= particle.speed;
      particle.sway += 0.004;
      if (particle.y < -0.02) { particle.y = 1.02; particle.x = Math.random(); }
      const x = (particle.x + Math.sin(particle.sway) * 0.012) * width;
      // deeper particles slide further against the scroll, which reads as depth
      const y = (((particle.y * height - scrollY * particle.depth * 0.12) % height) + height) % height;
      context.globalAlpha = 0.12 + particle.depth * 0.4;
      context.fillStyle = '#E7EBF1';
      context.beginPath();
      context.arc(x, y, particle.radius, 0, Math.PI * 2);
      context.fill();
    });
  });
}

/* ---------- pointer effects ---------- */

function initPointerEffects() {
  document.querySelectorAll('.glass').forEach((panel) => {
    const tilts = panel.hasAttribute('data-tilt');
    panel.addEventListener('pointermove', (event) => {
      const rect = panel.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      panel.style.setProperty('--mx', `${x}px`);
      panel.style.setProperty('--my', `${y}px`);
      if (tilts) {
        panel.style.setProperty('--rx', `${(0.5 - y / rect.height) * 7}deg`);
        panel.style.setProperty('--ry', `${(x / rect.width - 0.5) * 7}deg`);
      }
    });
    panel.addEventListener('pointerleave', () => {
      panel.style.setProperty('--rx', '0deg');
      panel.style.setProperty('--ry', '0deg');
    });
  });

  document.querySelectorAll('[data-magnetic]').forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      const rect = button.getBoundingClientRect();
      const offsetX = (event.clientX - rect.left - rect.width / 2) * 0.28;
      const offsetY = (event.clientY - rect.top - rect.height / 2) * 0.4;
      button.style.translate = `${offsetX}px ${offsetY}px`;
    });
    button.addEventListener('pointerleave', () => { button.style.translate = ''; });
  });

  const glow = document.getElementById('cursorGlow');
  addEventListener('pointermove', (event) => {
    glow.style.opacity = 1;
    glow.style.translate = `${event.clientX}px ${event.clientY}px`;
  }, { passive: true });
}

/* ---------- mentor slider ---------- */

function initMentorSlider() {
  const split = document.getElementById('split');
  const range = document.getElementById('splitRange');
  // Side-by-side needs width. On a phone the slider is a wipe between two full-width quotes.
  const isNarrow = innerWidth < 960;
  const REST_DRILL = 90;
  const REST_ZEN = 10;
  let userHasDragged = false;

  const apply = (value) => split.style.setProperty('--split', `${value}%`);
  range.addEventListener('input', () => { userHasDragged = true; apply(range.value); });

  if (isNarrow) {
    range.value = REST_DRILL;
    apply(REST_DRILL);
    // let go anywhere and it settles on the nearer side, so a quote is never left half cut
    range.addEventListener('change', () => {
      const settled = Number(range.value) >= 50 ? REST_DRILL : REST_ZEN;
      range.value = settled;
      split.classList.add('is-settling');
      apply(settled);
      setTimeout(() => split.classList.remove('is-settling'), 600);
    });
  }

  // One sway when it first appears, so it reads as draggable.
  return function hint() {
    const startTime = performance.now();
    function step(now) {
      if (userHasDragged) return;
      const progress = clamp01((now - startTime) / (isNarrow ? 3400 : 2200));
      // phone: sweep across to the zen side and back. desktop: a small sway around the middle.
      const value = isNarrow
        ? REST_DRILL - (REST_DRILL - REST_ZEN) * Math.pow(Math.sin(progress * Math.PI), 2)
        : 50 + Math.sin(progress * Math.PI * 2) * 17 * (1 - progress * 0.4);
      range.value = value;
      apply(value);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };
}

/* ---------- lazy background videos ---------- */

function initBackgroundVideos() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target: video, isIntersecting }) => {
      if (isIntersecting) {
        if (!video.src) video.src = video.dataset.src;
        // Low Power Mode refuses autoplay; the poster covers that case.
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { rootMargin: '40% 0px' });
  document.querySelectorAll('.bg-video').forEach((video) => observer.observe(video));
}

/* ---------- boot ---------- */

export function initMotion({ onFrame, reducedMotion }) {
  document.querySelectorAll('[data-split]').forEach(splitHeading);

  const playText = document.getElementById('playText');
  playText.innerHTML = playText.textContent.trim().split(/\s+/)
    .map((word) => `<span class="pw">${word}</span>`).join(' ');
  const playWords = [...playText.children];

  const mentorHint = initMentorSlider();
  initBackgroundVideos();

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      target.classList.add('is-in');
      target.querySelectorAll('[data-count]').forEach((element) => countUp(element, reducedMotion));
      if (target.id === 'split' && !reducedMotion) mentorHint();
      revealObserver.unobserve(target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal],[data-split]').forEach((element) => revealObserver.observe(element));

  if (reducedMotion) return;

  if (canHover) initPointerEffects();
  initDust(document.getElementById('dust'), onFrame);

  const playSection = document.getElementById('play');
  const drift = document.getElementById('drift');
  const driftRows = [...drift.querySelectorAll('.drift-row')];
  const deck = document.getElementById('deck');
  const deckCards = [...deck.children];
  // matches the resting scatter in site.css
  const deckFan = [[-104, -50, -6], [0, -56, 2], [104, -48, 6], [-54, 52, 4], [54, 50, -4]];
  const timeline = document.getElementById('timeline');
  const navLinks = [...document.querySelectorAll('.nav-links a')];
  const navTargets = navLinks.map((link) => document.querySelector(link.getAttribute('href')));

  let lastScrollY = -1;

  onFrame(({ scrollY, viewportHeight }) => {
    if (scrollY === lastScrollY) return;
    lastScrollY = scrollY;

    // The Play: words light up as the section crosses the screen
    const playRect = playSection.getBoundingClientRect();
    const playProgress = clamp01((viewportHeight * 0.8 - playRect.top) / (playRect.height * 0.75));
    const litCount = Math.round(playProgress * playWords.length);
    playWords.forEach((word, index) => word.classList.toggle('on', index < litCount));

    // The Room: two rows drifting opposite ways
    const driftRect = drift.getBoundingClientRect();
    const driftProgress = clamp01((viewportHeight - driftRect.top) / (viewportHeight + driftRect.height));
    driftRows.forEach((row) => {
      row.style.setProperty('--x', `${Number(row.dataset.dir) * driftProgress * 34}vw`);
    });

    // The Reason: the photo deck fans out from a single stack
    const deckRect = deck.getBoundingClientRect();
    const deckProgress = easeOutCubic(clamp01((viewportHeight - deckRect.top) / (viewportHeight * 0.85)));
    deckCards.forEach((card, index) => {
      const [dx, dy, rotation] = deckFan[index];
      card.style.setProperty('--dx', dx * deckProgress);
      card.style.setProperty('--dy', dy * deckProgress);
      card.style.setProperty('--rot', rotation * deckProgress);
    });

    // The Long Game: the line fills as you read down it
    const timelineRect = timeline.getBoundingClientRect();
    timeline.style.setProperty('--tl', clamp01((viewportHeight * 0.7 - timelineRect.top) / timelineRect.height).toFixed(4));

    // nav: mark the section currently under the top third of the screen
    let activeIndex = -1;
    navTargets.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= viewportHeight * 0.35) activeIndex = index;
    });
    navLinks.forEach((link, index) => link.classList.toggle('is-active', index === activeIndex));
  });
}
