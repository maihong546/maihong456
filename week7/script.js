// first get access to the audio element so that we can control it from here

const airportAudio = document.querySelector("#airport-audio");
console.log(airportAudio);

//similarly access the play button
const playButton = document.querySelector("#play-button");
console.log(playButton);

playButton.addEventListener("click", playAudio);

function playAudio() {
  // airportAudio.play();
  myVideo.play();
  msg.textContent = "audio is playing";
}

// similarly access the pause button
const pauseButton = document.querySelector("#pause-button");
console.log(pauseButton);

pauseButton.addEventListener("click", pauseAudio);

function pauseAudio() {
  airportAudio.pause();
}
