/* ============ ELEMENTS ============ */
const sun = document.querySelector(".sun");
const sunlight = document.querySelector(".sunlight");
const leaf = document.querySelector(".leaf");
const tinyleaf = document.querySelector(".tinyleaf");
const clouds = [
  document.querySelector(".cloudup"),
  document.querySelector(".cloudmiddle"),
  document.querySelector(".cloudbottom"),
];
const human = document.querySelector(".human");
const rod = document.querySelector(".rod");
const line = document.querySelector(".line");
const ponds = document.querySelector(".ponds");

/* ============ MUSIC PLAYER ============ */
const pauseBtn =
  document.getElementById("pauseBtn"); /* play button — triggers audio.play() */
const playBtn =
  document.getElementById(
    "playBtn",
  ); /* pause button — triggers audio.pause() */
const audio = document.getElementById("audio"); /* the actual audio element */
const timeline =
  document.getElementById("timeline"); /* range input for seeking */
const currentTimeText =
  document.getElementById("current-time"); /* displays current time */
const durationText =
  document.getElementById("duration"); /* displays total duration */

/* ============ INITIAL STATE ============ */
pauseBtn.style.display = "block";
playBtn.style.display = "none";

/* ============ SUN ============ */
sun.addEventListener("click", () => {
  /* click to brighten and expand sunlight, auto-returns after 1s */
  sun.classList.add("active");
  sunlight.classList.add("active");

  setTimeout(() => {
    sun.classList.remove("active");
    sunlight.classList.remove("active");
  }, 1000);
});

/* ============ MUSIC PLAYER ============ */
pauseBtn.addEventListener("click", function () {
  audio.play();
  pauseBtn.style.display = "none";
  playBtn.style.display = "block";

  // leaf sways when music plays
  leaf.classList.add("sway");

  // clouds float when music plays
  clouds.forEach((cloud) => cloud.classList.add("float"));

  // tiny leaf falls into the lake 2 seconds after music starts
  setTimeout(() => {
    tinyleaf.classList.remove("sway");
    tinyleaf.classList.add("fall");
  }, 2000);
});

playBtn.addEventListener("click", function () {
  audio.pause();
  playBtn.style.display = "none";
  pauseBtn.style.display = "block";

  // set transform to neutral first so the transition has something to animate toward
  leaf.style.transform = "rotate(0deg)";
  clouds.forEach((cloud) => (cloud.style.transform = "translateY(0)"));

  setTimeout(() => {
    // remove sway and float classes after transition finishes (1.5s)
    // clearing the inline transform lets CSS take back control
    leaf.classList.remove("sway");
    leaf.style.transform = "";

    clouds.forEach((cloud) => {
      cloud.classList.remove("float");
      cloud.style.transform = "";
    });
  }, 1500); // matches the transition duration set in CSS
});

/* ============ TIMELINE ============ */

/* converts seconds into mm:ss format for display */
function formatTime(time) {
  const minutes = Math.floor(time / 60);
  let seconds = Math.floor(time % 60);
  if (seconds < 10) seconds = "0" + seconds;
  return minutes + ":" + seconds;
}

/* once audio is loaded, set the timeline max to the total duration */
audio.addEventListener("loadedmetadata", function () {
  timeline.max = audio.duration;
  timeline.step = "any";
  durationText.textContent = formatTime(audio.duration);
});

/* fills the timeline with color based on how far along the track is */
function updateTrack() {
  const value = Number(timeline.value);
  const max = Number(timeline.max);
  const pct = (value / max) * 100;
  timeline.style.background = `linear-gradient(
    to right,
    rgb(164, 86, 91) 0%,
    rgb(164, 86, 91) ${pct}%,
    #f0ebe0 ${pct}%,
    #f0ebe0 100%
  )`;
}

/* seek — when user drags the timeline, jump to that position */
timeline.addEventListener("input", function () {
  audio.currentTime = Number(timeline.value);
  updateTrack();
});

/* sync — updates the timeline and current time display as the audio plays */
audio.addEventListener("timeupdate", function () {
  timeline.value = audio.currentTime;
  currentTimeText.textContent = formatTime(audio.currentTime);
  updateTrack();
});

/* ============ P1, P2, P3 ============ */
const paragraphs = document.querySelectorAll(".p1, .p2, .p3");

paragraphs.forEach((p) => {
  /* invisible by default, appear on hover */
  p.addEventListener("mouseenter", () => (p.style.opacity = "1"));
  p.addEventListener("mouseleave", () => (p.style.opacity = "0"));
});

/* ============ A BOTTOM BLUE BIRD ============ */
const downbluebirds = document.querySelector(".downbluebirds");
downbluebirds.style.pointerEvents = "all";
downbluebirds.style.cursor = "pointer";

downbluebirds.addEventListener("click", () => {
  downbluebirds.classList.add("fly");
});

/* ============ FISHERMAN ============ */
human.style.pointerEvents = "all";
human.style.cursor = "pointer";

human.addEventListener("click", () => {
  /* click to trigger fish biting animation */
  human.classList.add("tug"); /* human bounces slightly */
  rod.classList.add("bend"); /* rod bends downward like a fish is pulling */
  line.classList.add("tug"); /* line gets tugged down in sync with the rod */
  ponds.classList.add(
    "ripple",
  ); /* pond ripples as the fish moves under the surface */

  setTimeout(() => {
    human.classList.remove("tug");
    rod.classList.remove("bend");
    line.classList.remove("tug");
    ponds.classList.remove("ripple");
  }, 1000); /* all animations reset after 1s */
});
