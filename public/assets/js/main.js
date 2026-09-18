import { initScrub } from './scrub.js';
import { initMotion } from './motion.js';
import { initMachine } from './machine.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* One shared animation loop. Modules register a callback instead of each running their own. */
const frameCallbacks = [];
function onFrame(callback) {
  frameCallbacks.push(callback);
}
function runFrame() {
  const frameState = { scrollY: window.scrollY, viewportHeight: innerHeight };
  frameCallbacks.forEach((callback) => callback(frameState));
  requestAnimationFrame(runFrame);
}

/* ---------- preloader ---------- */

const MINIMUM_PRELOAD_MS = 1900; // long enough for the king to finish drawing
const MAXIMUM_PRELOAD_MS = 7000; // never trap a visitor on a slow connection
const READY_AT = 0.3;            // the first third of the orbit is enough to start

const preloader = document.getElementById('preloader');
const preloaderFill = document.getElementById('preloaderFill');
const bootTime = performance.now();
let hasStarted = false;

function start() {
  if (hasStarted) return;
  hasStarted = true;
  preloader.classList.add('is-done');
  document.body.classList.remove('is-loading');
  document.getElementById('nav').classList.add('is-in');
  playHeroIntro();
}

function onLoadProgress(fraction) {
  preloaderFill.style.width = `${Math.min(100, (fraction / READY_AT) * 100)}%`;
  if (fraction >= READY_AT) {
    setTimeout(start, Math.max(0, MINIMUM_PRELOAD_MS - (performance.now() - bootTime)));
  }
}
setTimeout(start, MAXIMUM_PRELOAD_MS);

/* ---------- hero ---------- */

const hero = document.getElementById('hero');
const heroCopy = document.getElementById('heroCopy');
const heroName = document.getElementById('heroName');
const heroSub = document.getElementById('heroSub');
const heroEyebrow = heroCopy.querySelector('.eyebrow');
const heroCta = document.getElementById('heroCta');
const scrollHint = document.getElementById('scrollHint');
const taglineLines = [...document.querySelectorAll('#tagline p')];

const heroLetters = heroName.textContent.split('').map((character) => {
  const letter = document.createElement('span');
  letter.textContent = character === ' ' ? ' ' : character;
  letter.setAttribute('aria-hidden', 'true');
  return letter;
});
heroName.textContent = '';
heroName.append(...heroLetters);

let introDone = false;
function playHeroIntro() {
  const letterDelay = reducedMotion ? 0 : 70;
  heroLetters.forEach((letter, index) => setTimeout(() => letter.classList.add('in'), 500 + index * letterDelay));
  const afterLetters = 500 + heroLetters.length * letterDelay;
  setTimeout(() => heroEyebrow.classList.add('in'), afterLetters);
  setTimeout(() => heroSub.classList.add('in'), afterLetters + 250);
  setTimeout(() => { introDone = true; }, afterLetters + 600);
}

const scrub = initScrub({
  canvas: document.getElementById('orbit'),
  video: document.getElementById('orbitVideo'),
  onProgress: onLoadProgress,
});

if (!reducedMotion) {
  let easedProgress = 0;
  onFrame(({ viewportHeight }) => {
    const rect = hero.getBoundingClientRect();
    const target = Math.min(1, Math.max(0, -rect.top / (hero.offsetHeight - viewportHeight)));
    // inertia: ease toward the true scroll position so the orbit feels weighted
    easedProgress += (target - easedProgress) * 0.14;
    if (Math.abs(target - easedProgress) < 0.0005) easedProgress = target;
    const progress = easedProgress;

    scrub.setProgress(progress);

    // name hands off to his printed line, one clause at a time
    heroCopy.style.opacity = progress > 0.36 ? 0 : '';
    taglineLines[0].classList.toggle('in', progress > 0.46 && progress < 0.97);
    taglineLines[1].classList.toggle('in', progress > 0.6 && progress < 0.97);
    heroCta.classList.toggle('in', introDone && (progress < 0.3 || progress > 0.78));
    scrollHint.style.opacity = progress > 0.05 ? 0 : '';
  });
}

initMotion({ onFrame, reducedMotion });
initMachine({ onFrame, reducedMotion });
requestAnimationFrame(runFrame);
