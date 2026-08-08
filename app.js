/* Badb Clock — a visual countdown timer for transitions.
   Flow: choose where we're going → choose how long → watch the character
   travel to the destination as the time runs down → gentle chime at the end. */

"use strict";

const TRANSITIONS = [
  { id: "car",    label: "The car",   emoji: "🚗", phrase: "We're going to the car",   done: "We're at the car!" },
  { id: "food",   label: "Food",      emoji: "🍽️", phrase: "We're going for food",     done: "Time for food!", arrival: "bagel" },
  { id: "granny", label: "Granny's",  emoji: "👵", phrase: "We're going to Granny's",  done: "We're at Granny's!" },
  { id: "school", label: "School",    emoji: "🏫", phrase: "We're going to school",    done: "We're at school!" },
  { id: "home",   label: "Home",      emoji: "🏠", phrase: "We're going home",         done: "We're home!" },
  { id: "bath",   label: "Bath",      emoji: "🛁", phrase: "It's nearly bath time",    done: "Bath time!" },
  { id: "bed",    label: "Bed",       emoji: "🌙", phrase: "It's nearly bed time",     done: "Bed time!" },
  { id: "park",   label: "The park",  emoji: "🌳", phrase: "We're going to the park",  done: "We're at the park!" },
  { id: "shops",  label: "The shops", emoji: "🛒", phrase: "We're going to the shops", done: "We're at the shops!" },
  { id: "walk",   label: "A walk",    emoji: "🚶", phrase: "We're going for a walk",   done: "Walk time!" },
];

const MINUTES = [1, 2, 3, 5, 10, 15];
const CHARACTERS = [
  { id: "badb", img: "avatar.svg" },
  { id: "kid", emoji: "🧒" },
  { id: "girl", emoji: "👧" },
  { id: "boy", emoji: "👦" },
  { id: "kid-light", emoji: "🧒🏻" },
  { id: "kid-medium", emoji: "🧒🏽" },
  { id: "kid-dark", emoji: "🧒🏿" },
];
const NEARLY_SECONDS = 10;

const $ = (id) => document.getElementById(id);

const savedCharacter = localStorage.getItem("badb-character");
const state = {
  transition: null,
  totalSeconds: 0,
  remaining: 0,
  intervalId: null,
  paused: false,
  wakeLock: null,
  character:
    CHARACTERS.find((c) => c.id === savedCharacter || c.emoji === savedCharacter) ||
    CHARACTERS[0],
};

function characterHTML(c) {
  return c.img ? `<img class="char-img" src="${c.img}" alt="">` : c.emoji;
}

/* ---------- screen switching ---------- */

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(id).classList.add("active");
}

/* ---------- screen 1: transitions + character picker ---------- */

function buildChooseScreen() {
  const grid = $("transition-grid");
  TRANSITIONS.forEach((t) => {
    const card = document.createElement("button");
    card.className = "transition-card";
    card.innerHTML = `<span class="emoji">${t.emoji}</span><span class="label">${t.label}</span>`;
    card.addEventListener("click", () => {
      state.transition = t;
      $("time-emoji").textContent = t.emoji;
      $("time-title").textContent = t.phrase;
      showScreen("screen-time");
    });
    grid.appendChild(card);
  });

  const picker = $("character-picker");
  CHARACTERS.forEach((c) => {
    const opt = document.createElement("button");
    opt.className = "character-option" + (c === state.character ? " selected" : "");
    opt.innerHTML = characterHTML(c);
    opt.addEventListener("click", () => {
      state.character = c;
      localStorage.setItem("badb-character", c.id);
      picker.querySelectorAll(".character-option").forEach((o) => o.classList.remove("selected"));
      opt.classList.add("selected");
    });
    picker.appendChild(opt);
  });
}

/* ---------- screen 2: time buttons ---------- */

function buildTimeScreen() {
  const grid = $("time-grid");
  MINUTES.forEach((m) => {
    const btn = document.createElement("button");
    btn.className = "time-btn";
    btn.textContent = m === 1 ? "1 minute" : `${m} minutes`;
    btn.addEventListener("click", () => startTimer(m * 60));
    grid.appendChild(btn);
  });
}

/* ---------- screen 3: the countdown ---------- */

function startTimer(seconds) {
  state.totalSeconds = seconds;
  state.remaining = seconds;
  state.paused = false;

  $("timer-phrase").textContent = state.transition.phrase;
  $("walker-emoji").innerHTML = characterHTML(state.character);
  $("destination-emoji").textContent = state.transition.emoji;
  $("walker").classList.add("walking");
  $("destination").classList.remove("nearly");
  $("progress-fill").classList.remove("nearly");
  $("pause-btn").textContent = "⏸ Pause";

  renderTick();
  showScreen("screen-timer");
  requestWakeLock();
  startMusic();

  clearInterval(state.intervalId);
  state.intervalId = setInterval(() => {
    if (state.paused) return;
    state.remaining -= 1;
    renderTick();
    if (state.remaining <= 0) finishTimer();
  }, 1000);
}

function renderTick() {
  const m = Math.floor(state.remaining / 60);
  const s = state.remaining % 60;
  $("time-left").textContent = `${m}:${String(s).padStart(2, "0")}`;

  const progress = 1 - state.remaining / state.totalSeconds;
  // Walker travels from 4% to ~78% so it stops beside the destination.
  $("walker").style.left = `${4 + progress * 74}%`;
  $("progress-fill").style.width = `${(1 - progress) * 100}%`;

  if (state.remaining <= NEARLY_SECONDS && state.remaining > 0) {
    $("destination").classList.add("nearly");
    $("progress-fill").classList.add("nearly");
    $("timer-phrase").textContent = "Nearly there!";
  }
}

function finishTimer() {
  clearInterval(state.intervalId);
  state.intervalId = null;
  releaseWakeLock();
  stopMusic();

  // Special arrival scenes (only with the drawn avatar, so the close-up
  // always matches the character who made the journey).
  if (state.transition.arrival === "bagel" && state.character.img) {
    $("done-emoji").innerHTML = `<img class="arrival-img" src="avatar-eating.svg" alt="">`;
    $("done-phrase").textContent = "Yay! Bagel time!";
    showScreen("screen-done");
    playChime();
    setTimeout(playYay, 1400);
    dropConfetti(["🥯", "⭐", "🎉", "✨", "💛"], 26);
    return;
  }

  $("done-emoji").innerHTML = `${characterHTML(state.character)}${state.transition.emoji}`;
  $("done-phrase").textContent = state.transition.done;
  showScreen("screen-done");
  playChime();
  dropConfetti();
}

/* A little cheer: a spoken "Yay!" where speech synthesis exists, plus a
   quick sparkly run-up so there's always something joyful to hear. */
function playYay() {
  try {
    if ("speechSynthesis" in window) {
      const yay = new SpeechSynthesisUtterance("Yay!");
      yay.pitch = 1.8;
      yay.rate = 1.1;
      speechSynthesis.speak(yay);
    }
  } catch (_) { /* fine without it */ }
  try {
    const notes = [659.25, 783.99, 987.77, 1318.5]; // E5 G5 B5 E6
    notes.forEach((freq, i) => {
      const t = audioCtx.currentTime + i * 0.09;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.16, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.7);
    });
  } catch (_) { /* fine without it */ }
}

function stopTimer() {
  clearInterval(state.intervalId);
  state.intervalId = null;
  releaseWakeLock();
  stopMusic();
}

/* ---------- gentle looping background music ----------
   A tiny music box waltzing through C – Am – F – G, generated with the
   Web Audio API so there are no audio files and it works offline. It sits
   quietly under the countdown and stops before the arrival chime. */

const MUSIC_TEMPO = 68;           // beats per minute — a calm walking pace
const MUSIC_LOOP_BEATS = 32;      // 8 bars of 4 beats
const MUSIC_EVENTS = (() => {
  const events = [];
  // soft bass note at the start of each bar: C C Am Am F F G G
  [48, 48, 45, 45, 53, 53, 55, 55].forEach((midi, bar) => {
    events.push({ beat: bar * 4, midi, beats: 3.6, gain: 0.07 });
  });
  // music-box arpeggio, one plink per beat
  const arps = [
    [64, 67, 72, 67], [64, 67, 72, 67],   // C:  E4 G4 C5 G4
    [64, 69, 72, 69], [64, 69, 72, 69],   // Am: E4 A4 C5 A4
    [65, 69, 72, 69], [65, 69, 72, 69],   // F:  F4 A4 C5 A4
    [62, 67, 71, 67], [62, 67, 71, 67],   // G:  D4 G4 B4 G4
  ];
  arps.forEach((bar, b) => bar.forEach((midi, i) => {
    events.push({ beat: b * 4 + i, midi, beats: 1.3, gain: 0.045 });
  }));
  // a sparse, singable melody floating on top
  [
    [0, 76, 1], [1, 79, 1], [2, 72, 2],
    [8, 69, 1], [9, 72, 1], [10, 76, 2],
    [16, 77, 1], [17, 76, 1], [18, 72, 2],
    [24, 74, 1], [25, 71, 1], [26, 74, 2],
  ].forEach(([beat, midi, beats]) => events.push({ beat, midi, beats, gain: 0.085 }));
  return events;
})();

let musicOn = localStorage.getItem("badb-music") !== "off";
const music = { master: null, schedulerId: null, startTime: 0, nextBeat: 0 };

function startMusic() {
  if (!musicOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    stopMusic(true);

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2600;
    music.master = audioCtx.createGain();
    music.master.gain.value = 1;
    music.master.connect(filter).connect(audioCtx.destination);

    const spb = 60 / MUSIC_TEMPO;
    music.startTime = audioCtx.currentTime + 0.15;
    music.nextBeat = 0;
    music.schedulerId = setInterval(() => {
      // schedule everything due in the next half-second
      while (music.startTime + music.nextBeat * spb < audioCtx.currentTime + 0.55) {
        const loopBeat = music.nextBeat % MUSIC_LOOP_BEATS;
        const t = music.startTime + music.nextBeat * spb;
        MUSIC_EVENTS.forEach((ev) => {
          if (ev.beat === loopBeat) playMusicNote(t, ev.midi, ev.beats * spb, ev.gain);
        });
        music.nextBeat += 1;
      }
    }, 150);
  } catch (_) {
    /* no audio — the timer is fully usable in silence */
  }
}

function playMusicNote(t, midi, dur, peak) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);
  osc.connect(gain).connect(music.master);
  osc.start(t);
  osc.stop(t + dur + 0.6);
}

function stopMusic(immediate) {
  clearInterval(music.schedulerId);
  music.schedulerId = null;
  if (music.master) {
    const m = music.master;
    music.master = null;
    if (immediate) {
      m.disconnect();
    } else {
      m.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.1);
      setTimeout(() => m.disconnect(), 600);
    }
  }
}

/* ---------- gentle chime (Web Audio, no audio files needed) ---------- */

let audioCtx = null;

function playChime() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    // A soft rising arpeggio, played twice. Triangle waves with a slow
    // release keep it cheerful without being startling.
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    [0, 1].forEach((round) => {
      notes.forEach((freq, i) => {
        const t = audioCtx.currentTime + round * 1.4 + i * 0.22;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.25, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 1);
      });
    });
  } catch (_) {
    /* no audio available — the visual arrival still tells the story */
  }
}

/* ---------- calm confetti ---------- */

function dropConfetti(pieces = ["⭐", "✨", "🎈", "💛"], count = 18) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = $("confetti");
  box.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const span = document.createElement("span");
    span.textContent = pieces[i % pieces.length];
    span.style.left = `${(i * 137) % 100}%`;
    span.style.animationDuration = `${3 + (i % 5) * 0.6}s`;
    span.style.animationDelay = `${(i % 7) * 0.25}s`;
    box.appendChild(span);
  }
}

/* ---------- keep the screen awake during a countdown ---------- */

async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      state.wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch (_) {
    /* not supported or not allowed — fine */
  }
}

function releaseWakeLock() {
  if (state.wakeLock) {
    state.wakeLock.release().catch(() => {});
    state.wakeLock = null;
  }
}

/* ---------- wiring ---------- */

$("back-to-choose").addEventListener("click", () => showScreen("screen-choose"));

$("cancel-timer").addEventListener("click", () => {
  stopTimer();
  showScreen("screen-choose");
});

$("pause-btn").addEventListener("click", () => {
  state.paused = !state.paused;
  $("pause-btn").textContent = state.paused ? "▶ Go" : "⏸ Pause";
  $("walker").classList.toggle("walking", !state.paused);
  if (state.paused) stopMusic();
  else startMusic();
});

function updateMusicBtn() {
  $("music-btn").textContent = musicOn ? "🎵 Music on" : "🎵 Music off";
}

$("music-btn").addEventListener("click", () => {
  musicOn = !musicOn;
  localStorage.setItem("badb-music", musicOn ? "on" : "off");
  updateMusicBtn();
  if (!musicOn) stopMusic();
  else if (state.intervalId && !state.paused) startMusic();
});
updateMusicBtn();

$("again-btn").addEventListener("click", () => startTimer(state.totalSeconds));

$("home-btn").addEventListener("click", () => showScreen("screen-choose"));

buildChooseScreen();
buildTimeScreen();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
