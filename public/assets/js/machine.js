// The pinned 60-day scene. Scroll progress lights the pipeline node by node, runs the day
// counter, hands the spotlight to the one human node, then swaps to the who-does-what lanes.
//
// The day counter is a visual device only. No source describes what happens on which day,
// so nothing here assigns content to a specific day.

const HUMAN_AT = 0.64;
const LANES_AT = 0.84;

// [scene progress, rail fill]. Node centres sit at 10/30/50/70/90% of the rail, so the
// light reaches each node at the moment it switches on.
const RAIL_STOPS = [[0, 0], [0.08, 0.1], [0.22, 0.3], [0.36, 0.5], [0.5, 0.7], [HUMAN_AT, 0.9], [0.74, 1]];

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function railFill(progress) {
  for (let i = 1; i < RAIL_STOPS.length; i++) {
    const [fromProgress, fromFill] = RAIL_STOPS[i - 1];
    const [toProgress, toFill] = RAIL_STOPS[i];
    if (progress <= toProgress) {
      return fromFill + ((progress - fromProgress) / (toProgress - fromProgress)) * (toFill - fromFill);
    }
  }
  return 1;
}

export function initMachine({ onFrame, reducedMotion }) {
  const section = document.getElementById('machine');
  const body = section.querySelector('.machine-body');
  const pipe = document.getElementById('pipe');
  const nodes = [...section.querySelectorAll('.node')];
  const dayNumber = document.getElementById('dayNum');
  const dayRing = document.getElementById('dayRing');

  if (reducedMotion) {
    nodes.forEach((node) => node.classList.add('is-on'));
    dayNumber.textContent = '60';
    dayRing.style.strokeDashoffset = 0;
    return;
  }

  let easedProgress = 0;
  let lastDay = 0;

  onFrame(() => {
    const rect = section.getBoundingClientRect();
    const target = clamp01(-rect.top / (section.offsetHeight - innerHeight));
    easedProgress += (target - easedProgress) * 0.12;
    if (Math.abs(target - easedProgress) < 0.0004) easedProgress = target;
    const progress = easedProgress;

    pipe.style.setProperty('--p', railFill(progress).toFixed(4));

    let currentNode = null;
    nodes.forEach((node) => {
      const isOn = progress >= Number(node.dataset.at);
      node.classList.toggle('is-on', isOn);
      if (isOn) currentNode = node;
    });
    nodes.forEach((node) => node.classList.toggle('is-current', node === currentNode));

    pipe.classList.toggle('has-human', progress >= HUMAN_AT);
    body.classList.toggle('show-lanes', progress >= LANES_AT);
    // also on the section, so short-phone CSS can move the headline out of the lanes' way
    section.classList.toggle('show-lanes', progress >= LANES_AT);

    const sprintProgress = clamp01(progress / LANES_AT);
    const day = 1 + Math.round(59 * sprintProgress);
    if (day !== lastDay) {
      lastDay = day;
      dayNumber.textContent = String(day).padStart(2, '0');
    }
    dayRing.style.strokeDashoffset = (1 - sprintProgress).toFixed(4);
  });
}
