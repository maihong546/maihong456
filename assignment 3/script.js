/* =====================================================================
   SKY DESCENT — script.js
   ---------------------------------------------------------------------
   CONTEXT AND MOTIVATION

   I designed this piece around the experience of standing outside at
   dusk and watching the sky transition from warm twilight into deep
   night — a moment that is meditative, slow, and non-interactive in
   real life. I wanted the digital version to preserve that quality:
   one continuous transformation, no buttons, no menus, just a single
   gesture (scroll) that the viewer controls at their own pace.

   I chose scroll specifically because it is the only browser input
   that is both continuous and analog. A click is binary; a hover is
   positional but not accumulative; scroll is a dial — it has direction,
   speed, and a position that persists. This made it the natural mapping
   for a scene that needs to feel like travel through space rather than
   navigation through pages. This approach was influenced by the NYT
   "Snow Fall" (2012) project, which established scroll as a storytelling
   tool, and the Firewatch website (Campo Santo, 2016), which showed that
   scroll-driven parallax can feel cinematic without hijacking native
   scroll behaviour.

   HOW I MODIFIED THE ORIGINAL DESIGN TO FIT THIS CONTEXT

   The original reference codebase (provided as course material) used a
   data-driven engine where layers read speed and fade values from HTML
   data attributes, and a single requestAnimationFrame loop handled
   everything including snow drawn on a <canvas> element. I simplified
   this significantly to match my context and skill level:

   1. I removed the canvas snow system and replaced it with a PNG layer
      (snow-near.png) animated by translating its position each frame.
      This is simpler to reason about and easier to tune visually.

   2. I replaced the data-attribute engine with explicit variables for
      each layer, so the relationship between scroll position and each
      layer's opacity is immediately readable in the code rather than
      computed from a generic loop.

   3. I kept the aurora drift logic from the reference but extracted it
      into a named config array (auroraConfig) so the two curtains are
      defined as data rather than hardcoded separately, which is cleaner
      and easier to extend.

   4. I added background music triggered on first scroll, which was not
      in the original. Music pauses when the viewer scrolls back up and
      resumes when they scroll down again, so the audio always matches
      the direction of travel through the scene.

   ACKNOWLEDGEMENT
   Portions of this code were developed with assistance from Claude
   (Anthropic, 2024), an AI assistant. Specifically, I consulted Claude
   to debug the snow animation and aurora drift logic after
   my original implementations were not functioning correctly and I was
   unable to resolve the issues independently. Claude helped restructure
   the animateStars loop so that snow falls continuously between frames
   rather than being tied to scroll events, and rewrote the aurora config
   array with opposite drift directions and incommensurate frequencies to
   achieve the flowing curtain effect. All other code — the scroll handler,
   opacity transitions, parallax multipliers, and music logic — was written
   by me.

   ARROW FUNCTIONS AND MODERN JS
   I used arrow functions (=>) throughout this file for short utility
   functions like ramp and sstep. Arrow functions are a modern ES6
   feature that provides a shorter syntax for functions that do not
   need their own `this` binding. For example:
     const ramp = (x, a, b) => Math.max(0, Math.min(1, (x-a)/(b-a)));
   is equivalent to:
     function ramp(x, a, b) { return Math.max(0, Math.min(1, (x-a)/(b-a))); }
   I chose arrow functions here because these are pure utility functions
   with no side effects and no need for `this`, making the shorter syntax
   appropriate and consistent with modern JavaScript style guides.

   I used const for all variables that are never reassigned (DOM references,
   config objects, utility functions) and let only for values that change
   over time (musicStarted, lastScrollY, snowOffsetY, prevP, vel). This
   distinction makes the code's intent clearer: const signals "this never
   changes", let signals "this is state that updates".

   CHALLENGES AND BENEFITS
   One challenge I foresee in scaling this to a broader project is
   performance on lower-end mobile devices. Animating seven simultaneous
   layers risks dropped frames on older hardware. I mitigated this by
   animating only transform and opacity — the two properties browsers
   can composite on the GPU without triggering layout recalculation
   (MDN, 2024) — and by marking the scroll listener as passive: true,
   which tells the browser it can scroll without waiting for the listener
   to finish executing.

   A second challenge is that hand-tuning the opacity windows (e.g.
   progress 0.04–0.18 for dusk) is slow and imprecise. A tool like GSAP
   ScrollTrigger (GreenSock, 2023) would provide a visual timeline and
   reduce this iteration time significantly at larger scale.

   The main benefit of this architecture is reusability. The core pattern
   — scroll position p ∈ [0,1] drives all visual state — is a shell that
   could be reskinned for onboarding flows, product stories, or data
   scrollytelling with minimal structural changes.

   SOURCES
   - NYT Snow Fall (2012): scroll as narrative precedent
   - Firewatch site, Campo Santo (2016): no-hijack scroll, via Creative Bloq
     https://www.creativebloq.com/web-design/firewatch-site
   - MDN Web Docs (2024): will-change, autoplay policy, passive listeners
     https://developer.mozilla.org/
   - GreenSock GSAP ScrollTrigger (2023): https://gsap.com/docs/v3/Plugins/ScrollTrigger/
   - Original Sky Descent engine: provided as course reference material
   - Claude, Anthropic (2024): AI assistant used during development
     https://claude.ai
   ===================================================================== */

// ── DOM references ──
// I declare all element references at the top using const because these
// values are assigned once and never reassigned. Grouping them here makes
// it easy to see every element this script touches without reading the
// whole file.
const overlay = document.getElementById("overlay");
const intro = document.querySelector(".intro");
const layerDusk = document.getElementById("layer-dusk");
const layerNight = document.getElementById("layer-night");
const layerStarsFar = document.getElementById("layer-stars-far");
const layerSnowNear = document.getElementById("layer-snow-near");
const layerAuroraA = document.getElementById("layer-aurora-a");
const layerAuroraB = document.getElementById("layer-aurora-b");
const layerMountains = document.getElementById("layer-mountains");
const bgMusic = document.getElementById("bg-music");

// ── Music state ──
// I use let here because both values change over time.
// musicStarted ensures startMusic() only runs once.
// lastScrollY tracks the previous scroll position so I can detect
// whether the viewer is scrolling up or down on each scroll event.
let musicStarted = false;
let lastScrollY = 0;

const startMusic = () => {
  if (musicStarted) return;
  musicStarted = true;
  bgMusic.volume = 0;
  bgMusic.play().catch(() => {}); // .catch silences the console error if
  // the browser still blocks playback
  let vol = 0;
  const fadeIn = setInterval(() => {
    vol = Math.min(0.6, vol + 0.02);
    bgMusic.volume = vol;
    if (vol >= 0.6) clearInterval(fadeIn);
  }, 100);
};

// Overlay hides after 3s. I use setTimeout rather than a scroll listener
// for this because the instruction should disappear on a timer regardless
// of whether the viewer has scrolled yet.
setTimeout(() => overlay.classList.add("hidden"), 3000);

// ── Utility functions ──
// ramp: maps x from the range [a, b] to [0, 1], clamped flat outside.
// I use this for all standard opacity transitions. It is a pure function
// (no side effects, same input always gives same output), which is why
// an arrow function is appropriate here.
const ramp = (x, a, b) => Math.max(0, Math.min(1, (x - a) / (b - a)));

// sstep (smootherstep): the same range mapping but eased at both ends
// using a degree-5 polynomial: 6t^5 - 15t^4 + 10t^3.
// I use this only for the aurora so it brightens the way a real light
// source does — gradually accelerating then decelerating — rather than
// switching on at a fixed scroll threshold the way ramp would.
const sstep = (x, a, b) => {
  const t = ramp(x, a, b);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

// scrollMax returns the maximum scrollable distance in pixels.
// I wrap this in a function because the value can change if the window
// is resized after page load.
const scrollMax = () =>
  document.documentElement.scrollHeight - window.innerHeight;

// ── Aurora configuration ──
// I define both aurora curtains as objects in an array so the render
// loop can process them with a single for...of loop rather than
// duplicating code for aurora-a and aurora-b separately.
// The critical design decision is opposite driftAmp signs: aurora-a
// drifts right (+34px amplitude), aurora-b drifts left (-46px).
// Because they also oscillate at slightly different frequencies
// (driftW: 0.000110 vs 0.000082), their overlap pattern shifts
// continuously — this is what makes the aurora appear to flow and
// morph rather than slide as one rigid piece.
const auroraConfig = [
  {
    el: layerAuroraA,
    driftAmp: 34, // positive = drifts rightward
    driftW: 0.00011, // horizontal oscillation frequency
    swayW: 0.00026, // vertical breathing frequency
    scaleW: 0.00015, // scale pulse frequency
    phase: 0, // phase offset (radians)
  },
  {
    el: layerAuroraB,
    driftAmp: -46, // negative = drifts leftward, opposite to aurora-a
    driftW: 0.000082, // slower frequency creates ever-shifting overlap
    swayW: 0.00019,
    scaleW: 0.000115,
    phase: 1.9, // offset by ~half a cycle so curtains are never in sync
  },
];

// ── Stars twinkle + Snow drift loop ──
// I keep snow and stars in their own requestAnimationFrame loop,
// separate from the aurora loop, so snow continues falling even when
// the viewer stops scrolling. If snow were purely scroll-driven, it
// would freeze the moment the viewer paused — breaking the illusion
// of an atmospheric environment.
let starTime = null;
let snowOffsetY = 0; // accumulates each frame to drive continuous downward fall

const animateStars = (t) => {
  if (!starTime) starTime = t;
  const elapsed = t - starTime;

  // A slow sine wave on brightness creates a gentle pulse so stars feel
  // alive rather than static. The frequency (0.0008) is slow enough to
  // be subliminal — the viewer senses atmosphere, not an obvious flicker.
  const twinkle = 0.85 + 0.15 * Math.sin(elapsed * 0.0008);

  if (parseFloat(layerStarsFar.style.opacity) > 0) {
    layerStarsFar.style.filter = `brightness(${twinkle.toFixed(3)})`;
  }

  // Snow falls continuously. I increment snowOffsetY every frame and
  // reset it to 0 when it exceeds the viewport height, creating a
  // seamless loop. A horizontal sine adds gentle organic sway.
  const snowOpacity = parseFloat(layerSnowNear.style.opacity) || 0;
  if (snowOpacity > 0) {
    snowOffsetY += 0.12; // fall speed: slow and calm, matching the mood
    if (snowOffsetY > window.innerHeight) snowOffsetY = 0;

    const snowSway = Math.sin(elapsed * 0.00045) * 8;
    layerSnowNear.style.transform = `translate(${snowSway}px, ${snowOffsetY}px)`;
    layerSnowNear.style.filter = `brightness(${(1 - twinkle * 0.1).toFixed(3)})`;
  }

  requestAnimationFrame(animateStars);
};
requestAnimationFrame(animateStars);

// ── Main render loop (aurora + velocity) ──
// This loop runs every frame via requestAnimationFrame. It handles the
// aurora separately from the scroll handler because the aurora needs to
// animate continuously (drift, sway, pulse) even when the viewer is not
// scrolling. I also track scroll velocity here — how fast p is changing —
// so the aurora can react to the energy of the scroll gesture, not just
// its position. Fast scrolling = vivid shimmer. Slow scrolling = calm glow.
let prevP = 0;
let vel = 0;

const render = (t) => {
  const p = scrollMax() > 0 ? window.scrollY / scrollMax() : 0;

  // Velocity: I take the absolute change in p per frame, scale it up (×26)
  // to make small changes visible, then ease it toward the current value
  // with a 0.12 lerp. The lerp smooths out sudden spikes so the aurora
  // does not flash abruptly when the viewer starts or stops scrolling.
  vel += (Math.min(Math.abs(p - prevP) * 26, 1) - vel) * 0.12;
  prevP = p;

  // Aurora emergence: I use sstep (smootherstep) over the range 0.65–0.85
  // so the curtains brighten gradually at both ends. A linear ramp would
  // make the aurora feel like it switches on at a fixed threshold.
  const aFade = sstep(p, 0.65, 0.85);

  // Organic brightness pulse: two sine waves at incommensurate frequencies
  // (0.00110 and 0.00041) ensure the pattern never repeats on an obvious
  // beat. Velocity is added on top so the viewer's own scroll energy is
  // reflected in the aurora's intensity.
  const pulse =
    0.9 + 0.085 * Math.sin(t * 0.0011) + 0.055 * Math.sin(t * 0.00041 + 1.3);

  for (const A of auroraConfig) {
    const driftX = Math.sin(t * A.driftW + A.phase) * A.driftAmp;
    const sway = Math.sin(t * A.swayW + A.phase * 1.6) * 7;
    const rise = (1 - aFade) * 26;
    const scale = 1.05 + 0.02 * Math.sin(t * A.scaleW + A.phase);

    A.el.style.transform = `translate3d(${driftX.toFixed(2)}px, ${(sway + rise).toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
    A.el.style.opacity = (aFade * 0.92).toFixed(3);
    A.el.style.filter = `brightness(${(pulse + vel * 0.4).toFixed(3)}) saturate(${(1 + vel * 0.45).toFixed(3)})`;
  }

  requestAnimationFrame(render);
};
requestAnimationFrame(render);

// ── Scroll handler ──
// All opacity and parallax values are pure functions of scroll position
// p ∈ [0,1]. This means the scene is fully reversible: scroll up always
// undoes scroll down. There are no one-way transitions or states that
// cannot be returned to, which keeps the piece explorable and playful.
// passive: true tells the browser this listener will never call
// preventDefault(), so it does not need to wait for the listener to
// finish before scrolling — this prevents any input lag.
window.addEventListener(
  "scroll",
  () => {
    startMusic();

    // Music follows direction of travel: pause when scrolling up,
    // resume when scrolling down. This keeps the audio in sync with
    // the viewer's movement through the scene.
    if (window.scrollY < lastScrollY) {
      bgMusic.pause();
    } else if (musicStarted) {
      bgMusic.play().catch(() => {});
    }
    lastScrollY = window.scrollY;

    const scrollable =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = window.scrollY / scrollable; // normalised position 0 → 1
    const scrollY = window.scrollY;

    // Title fades out in the first 8% of scroll. I chose 8% because it is
    // fast enough to feel immediate but slow enough to not jar the viewer.
    intro.style.opacity = Math.max(0, 1 - progress / 0.08);

    // ── PARALLAX ──
    // I assigned each layer a speed multiplier that reflects its perceived
    // depth in the scene. Far objects move slowly; close objects move fast.

    // sky-dusk and sky-night: speed 0 (fixed). These represent the infinite
    // sky, which should not appear to shift as the viewer descends.
    layerDusk.style.transform = `translateY(${scrollY * 0.0}px)`;
    layerNight.style.transform = `translateY(${scrollY * 0.0}px)`;

    // stars-far: speed 0.08. Distant stars move very slowly relative to
    // the viewer, consistent with how parallax depth works in real life.
    layerStarsFar.style.transform = `translateY(${scrollY * 0.08}px)`;

    // mountains: speed 0.15 + a progressive sink past the halfway point.
    // The extra sink reinforces the sensation of descending into the
    // landscape — the mountains appear to recede below the viewer.
    const mountainSink = Math.max(0, (progress - 0.5) / 0.5) * 60;
    layerMountains.style.transform = `translateY(${scrollY * 0.15 + mountainSink}px)`;

    // ── OPACITY TRANSITIONS ──
    // I staggered each layer's fade window so only one or two layers are
    // transitioning at any given scroll position. This keeps the narrative
    // legible: the viewer can follow each addition to the scene clearly
    // rather than experiencing everything changing at once.

    // sky-dusk fades in first (4%–18%) to establish the warm starting mood
    layerDusk.style.opacity = Math.min(
      1,
      Math.max(0, (progress - 0.04) / 0.14),
    );

    // sky-night overlays dusk at 25%–45%, shifting the palette to deep blue
    layerNight.style.opacity = Math.min(
      1,
      Math.max(0, (progress - 0.25) / 0.2),
    );

    // mountains appear at 20%–45%, emerging as the sky darkens around them
    layerMountains.style.opacity = Math.min(
      1,
      Math.max(0, (progress - 0.2) / 0.25),
    );

    // stars-far fades in at 40%–60%, once the night sky is fully established
    layerStarsFar.style.opacity = Math.min(
      1,
      Math.max(0, (progress - 0.4) / 0.2),
    );

    // snow-near fades in at 55%–75%, adding foreground atmosphere before
    // the aurora arrives — building anticipation for the final reveal
    layerSnowNear.style.opacity = Math.min(
      1,
      Math.max(0, (progress - 0.55) / 0.2),
    );

    // aurora opacity is handled in render() via sstep for smoother easing
  },
  { passive: true },
);
