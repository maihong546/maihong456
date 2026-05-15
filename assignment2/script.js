const playBtn = document.getElementById("playBtn");

const pauseBtn = document.getElementById("pauseBtn");

const audio = document.getElementById("audio");

const timeline = document.getElementById("timeline");

const currentTimeText = document.getElementById("current-time");

const durationText = document.getElementById("duration");

/* hide pause button initially /
pauseBtn.style.display = "none";

/ format time /
function formatTime(time) {
  const minutes = Math.floor(time / 60);

  let seconds = Math.floor(time % 60);

  if (seconds < 10) {
    seconds = "0" + seconds;
  }

  return minutes + ":" + seconds;
}

/ play audio /
playBtn.addEventListener("click", function () {
  audio.play();

  playBtn.style.display = "none";

  pauseBtn.style.display = "block";
});

/ pause audio /
pauseBtn.addEventListener("click", function () {
  audio.pause();

  pauseBtn.style.display = "none";

  playBtn.style.display = "block";
});

/ get song duration /
audio.addEventListener(
  "loadedmetadata",
  function () {
    timeline.max = audio.duration;

    durationText.textContent = formatTime(
      audio.duration
    );
  }
);

/ update timeline /
audio.addEventListener("timeupdate", function () {
  timeline.value = audio.currentTime;

  currentTimeText.textContent = formatTime(
    audio.currentTime
  );
});

/ drag timeline /
timeline.addEventListener("input", function () {
  audio.currentTime = timeline.value;
});

/ reset after song ends */
audio.addEventListener("ended", function () {
  playBtn.style.display = "block";

  pauseBtn.style.display = "none";

  timeline.value = 0;

  currentTimeText.textContent = "0:00";
});
