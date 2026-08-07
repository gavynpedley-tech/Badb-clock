/* Badb Clock — a visual countdown timer for transitions.
   Flow: choose where we're going → choose how long → watch the character
   travel to the destination as the time runs down → gentle chime at the end. */

"use strict";

const TRANSITIONS = [
  { id: "car",    label: "The car",   emoji: "🚗", phrase: "We're going to the car",   done: "We're at the car!" },
  { id: "food",   label: "Food",      emoji: "🍽️", phrase: "We're going for food",     done: "Time for food!" },
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

  $("done-emoji").innerHTML = `${characterHTML(state.character)}${state.transition.emoji}`;
  $("done-phrase").textContent = state.transition.done;
  showScreen("screen-done");
  playChime();
  dropConfetti();
}

function stopTimer() {
  clearInterval(state.intervalId);
  state.intervalId = null;
  releaseWakeLock();
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

function dropConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = $("confetti");
  box.innerHTML = "";
  const pieces = ["⭐", "✨", "🎈", "💛"];
  for (let i = 0; i < 18; i++) {
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
});

$("again-btn").addEventListener("click", () => startTimer(state.totalSeconds));

$("home-btn").addEventListener("click", () => showScreen("screen-choose"));

buildChooseScreen();
buildTimeScreen();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
