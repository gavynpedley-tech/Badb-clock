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
  { id: "shower", label: "Shower",    emoji: "🚿", phrase: "It's nearly shower time",  done: "Shower time!" },
  { id: "bed",    label: "Bed",       emoji: "🌙", phrase: "It's nearly bed time",     done: "Bed time!" },
  { id: "park",   label: "The park",  emoji: "🌳", phrase: "We're going to the park",  done: "We're at the park!" },
  { id: "shops",  label: "The shops", emoji: "🛒", phrase: "We're going to the shops", done: "We're at the shops!" },
  { id: "walk",   label: "A walk",    emoji: "🚶", phrase: "We're going for a walk",   done: "Walk time!" },
];

/* ---------- her foods, drawn to match the real things ----------
   Shapes matter: the waffles are the square ones, the choco puffs and
   Snax are square, the smoothie is the pink rectangular carton. Each is
   a little 40x40 drawing used on the picker cards, in the countdown
   scene, and held in her hands on the arrival close-up. */

const FOOD_ART = {
  waffles: `
    <rect x="6" y="6" width="28" height="28" rx="5" fill="#e9b662"/>
    <path d="M15.3 8.5 V31.5 M24.6 8.5 V31.5 M8.5 15.3 H31.5 M8.5 24.6 H31.5"
          stroke="#c99340" stroke-width="2.4" stroke-linecap="round"/>`,
  pasta: `
    <ellipse cx="20" cy="28" rx="16" ry="8" fill="#eef2f6"/>
    <ellipse cx="20" cy="26.5" rx="12" ry="5.5" fill="#dde6ee"/>
    <rect x="7" y="14" width="14" height="6" rx="3" fill="#f0d488" stroke="#d9b45e" stroke-width="1" transform="rotate(-14 14 17)"/>
    <rect x="19" y="11" width="14" height="6" rx="3" fill="#f0d488" stroke="#d9b45e" stroke-width="1" transform="rotate(12 26 14)"/>
    <rect x="11" y="21" width="14" height="6" rx="3" fill="#f0d488" stroke="#d9b45e" stroke-width="1" transform="rotate(-4 18 24)"/>
    <rect x="20" y="20" width="14" height="6" rx="3" fill="#f0d488" stroke="#d9b45e" stroke-width="1" transform="rotate(18 27 23)"/>
    <circle cx="12" cy="13" r="1.2" fill="#e5c23c"/><circle cx="24" cy="9.5" r="1.2" fill="#e5c23c"/>
    <circle cx="31" cy="19" r="1.2" fill="#e5c23c"/><circle cx="17" cy="19" r="1.2" fill="#e5c23c"/>
    <circle cx="26" cy="27" r="1.2" fill="#e5c23c"/>`,
  pizza: `
    <path d="M8 12 C 14 7.5, 26 7.5, 32 12 L 20 34 Z" fill="#f2cf6b"/>
    <path d="M8 12 C 14 7.5, 26 7.5, 32 12 L 30.4 15 C 25 11.2, 15 11.2, 9.6 15 Z" fill="#dfa055"/>
    <circle cx="17" cy="19" r="2" fill="#f7e29a"/><circle cx="24" cy="21" r="2" fill="#f7e29a"/>
    <circle cx="20" cy="27" r="1.8" fill="#f7e29a"/>`,
  cereal: `
    <path d="M6 21 L 34 21 L 31 29 C 27.5 33.5, 12.5 33.5, 9 29 Z" fill="#9fc2e0"/>
    <ellipse cx="20" cy="21" rx="14" ry="4.6" fill="#fdf6ec"/>
    <rect x="11" y="17.5" width="4.4" height="4.4" rx="1" fill="#8a5a3b" transform="rotate(-10 13.2 19.7)"/>
    <rect x="17.5" y="16" width="4.4" height="4.4" rx="1" fill="#96633f" transform="rotate(12 19.7 18.2)"/>
    <rect x="24" y="17.5" width="4.4" height="4.4" rx="1" fill="#8a5a3b" transform="rotate(-6 26.2 19.7)"/>
    <rect x="14.5" y="19.5" width="4.4" height="4.4" rx="1" fill="#7c4f33" transform="rotate(8 16.7 21.7)"/>
    <rect x="21.5" y="19.5" width="4.4" height="4.4" rx="1" fill="#8a5a3b" transform="rotate(-14 23.7 21.7)"/>`,
  granola: `
    <path d="M6 21 L 34 21 L 31 29 C 27.5 33.5, 12.5 33.5, 9 29 Z" fill="#f0e6ea"/>
    <ellipse cx="20" cy="21" rx="14" ry="4.6" fill="#f4b8cc"/>
    <circle cx="13" cy="20" r="1.7" fill="#a97c4f"/><circle cx="18" cy="18.6" r="1.7" fill="#96633f"/>
    <circle cx="23" cy="20.5" r="1.7" fill="#a97c4f"/><circle cx="27.5" cy="19" r="1.7" fill="#8a5a3b"/>
    <circle cx="20.5" cy="21.8" r="1.7" fill="#b78a5c"/>`,
  snax: `
    <rect x="7" y="15" width="12" height="12" rx="2.5" fill="#f0cd8a" stroke="#ddb264" stroke-width="1" transform="rotate(-8 13 21)"/>
    <rect x="19" y="12" width="12" height="12" rx="2.5" fill="#f3d494" stroke="#ddb264" stroke-width="1" transform="rotate(7 25 18)"/>
    <rect x="13" y="23" width="12" height="12" rx="2.5" fill="#eec87f" stroke="#ddb264" stroke-width="1" transform="rotate(3 19 29)"/>
    <circle cx="13" cy="20" r="1" fill="#f9e3b8"/><circle cx="25" cy="17" r="1" fill="#f9e3b8"/>
    <circle cx="19" cy="28" r="1" fill="#f9e3b8"/><circle cx="23" cy="30" r="1" fill="#f9e3b8"/>`,
  smoothie: `
    <rect x="12" y="8" width="16" height="26" rx="2" fill="#f2a4c0"/>
    <rect x="12" y="8" width="16" height="5" rx="2" fill="#e88fb0"/>
    <rect x="15.5" y="17" width="9" height="11" rx="2" fill="#fbe3ec"/>
    <circle cx="20" cy="22.5" r="2.6" fill="#d16a8a"/>
    <path d="M25 8 L 28.5 3.5" stroke="#fdf8ef" stroke-width="2.2" stroke-linecap="round"/>`,
  yoghurt: `
    <path d="M12 15 L 28 15 L 26 31.5 C 25 34, 15 34, 14 31.5 Z" fill="#f6c3d5"/>
    <path d="M12.7 20 L 27.3 20 L 26.6 24 L 13.4 24 Z" fill="#fbe3ec"/>
    <ellipse cx="20" cy="14" rx="9.5" ry="3.2" fill="#e3e8ee"/>
    <path d="M28.5 12.2 L 32 10 L 31 14 Z" fill="#cfd7e0"/>`,
  bagel: `
    <path fill-rule="evenodd" fill="#dda15e"
          d="M20 11 a 11 11 0 1 0 0.001 0 Z M20 17.8 a 4.4 4.4 0 1 0 0.001 0 Z M28 9.5 a 4.6 4.6 0 1 0 0.001 0 Z"/>
    <ellipse cx="13" cy="18" rx="1.5" ry="0.9" fill="#f7ead2" transform="rotate(-25 13 18)"/>
    <ellipse cx="18" cy="13.5" rx="1.5" ry="0.9" fill="#f7ead2" transform="rotate(15 18 13.5)"/>
    <ellipse cx="24" cy="30" rx="1.5" ry="0.9" fill="#f7ead2" transform="rotate(-10 24 30)"/>
    <ellipse cx="14" cy="27" rx="1.5" ry="0.9" fill="#f7ead2" transform="rotate(35 14 27)"/>`,
  chocolate: `
    <rect x="9" y="7" width="22" height="26" rx="2.5" fill="#7a4a2c"/>
    <path d="M20 8.5 V31.5 M10.5 15.7 H29.5 M10.5 24.3 H29.5" stroke="#5d3720" stroke-width="1.8"/>
    <rect x="9" y="25" width="22" height="8" rx="2" fill="#e88fb0"/>
    <path d="M9 25 L 12 27 L 15 25 L 18 27 L 21 25 L 24 27 L 27 25 L 31 27 L 31 25 Z" fill="#f2a4c0"/>`,
  icecream: `
    <path d="M20 36 L 13 20 L 27 20 Z" fill="#e0aa66"/>
    <path d="M15 23 L 25 23 M16.5 27 L 23.5 27 M18 31 L 22 31" stroke="#c78d47" stroke-width="1.3"/>
    <circle cx="20" cy="14.5" r="8.5" fill="#f4aec6"/>
    <circle cx="16.5" cy="11.5" r="3.4" fill="#f8c8d8"/>
    <circle cx="20" cy="5.5" r="2" fill="#d16a8a"/>`,
};

const FOODS = [
  { id: "waffles",   label: "Waffles",   cats: ["dinner"],            phrase: "We're going for waffles",    done: "Yay! Waffle time!" },
  { id: "pasta",     label: "Pasta",     cats: ["dinner"],            phrase: "We're going for pasta",      done: "Yay! Pasta time!" },
  { id: "pizza",     label: "Pizza",     cats: ["dinner"],            phrase: "We're going for pizza",      done: "Yay! Pizza time!" },
  { id: "cereal",    label: "Cereal",    cats: ["dinner"],            phrase: "We're going for cereal",     done: "Yay! Cereal time!" },
  { id: "granola",   label: "Granola",   cats: ["dinner"],            phrase: "We're going for granola",    done: "Yay! Granola time!" },
  { id: "snax",      label: "Snax",      cats: ["dinner"],            phrase: "We're going for Snax",       done: "Yay! Snax time!" },
  { id: "bagel",     label: "Bagel",     cats: ["dinner"],            phrase: "We're going for a bagel",    done: "Yay! Bagel time!" },
  { id: "smoothie",  label: "Smoothie",  cats: ["dinner", "dessert"], phrase: "We're going for a smoothie", done: "Yay! Smoothie time!" },
  { id: "yoghurt",   label: "Yoghurt",   cats: ["dinner", "dessert"], phrase: "We're going for yoghurt",    done: "Yay! Yoghurt time!" },
  { id: "chocolate", label: "Chocolate", cats: ["dessert"],           phrase: "We're going for chocolate",  done: "Yay! Chocolate time!" },
  { id: "icecream",  label: "Ice cream", cats: ["dessert"],           phrase: "We're going for ice cream",  done: "Yay! Ice cream time!" },
];

function foodSVG(food) {
  return `<svg class="food-svg" viewBox="0 0 40 40" aria-hidden="true">${FOOD_ART[food.id]}</svg>`;
}

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
  food: null,
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
      state.food = null;
      if (t.id === "food") {
        showScreen("screen-food-category");
      } else {
        $("time-emoji").textContent = t.emoji;
        $("time-title").textContent = t.phrase;
        showScreen("screen-time");
      }
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

/* ---------- screens 1b/1c: dinner-or-dessert, then pick the food ---------- */

function buildFoodGrid(category) {
  const grid = $("food-grid");
  grid.innerHTML = "";
  FOODS.filter((f) => f.cats.includes(category)).forEach((f) => {
    const card = document.createElement("button");
    card.className = "transition-card";
    card.innerHTML = `<span class="emoji">${foodSVG(f)}</span><span class="label">${f.label}</span>`;
    card.addEventListener("click", () => {
      state.food = f;
      $("time-emoji").innerHTML = foodSVG(f);
      $("time-title").textContent = f.phrase;
      showScreen("screen-time");
    });
    grid.appendChild(card);
  });
}

$("cat-dinner").addEventListener("click", () => {
  buildFoodGrid("dinner");
  showScreen("screen-food");
});
$("cat-dessert").addEventListener("click", () => {
  buildFoodGrid("dessert");
  showScreen("screen-food");
});
$("back-category").addEventListener("click", () => showScreen("screen-choose"));
$("back-food").addEventListener("click", () => showScreen("screen-food-category"));

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

  $("timer-phrase").textContent = state.food ? state.food.phrase : state.transition.phrase;
  $("walker-emoji").innerHTML = characterHTML(state.character);
  if (state.food) $("destination-emoji").innerHTML = foodSVG(state.food);
  else $("destination-emoji").textContent = state.transition.emoji;
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

  // Food arrivals are the celebration: a close-up of her eating the food
  // she picked (with the drawn avatar), a cheer, and extra confetti.
  if (state.food) {
    if (state.character.img) {
      $("done-emoji").innerHTML = eatingSceneSVG(state.food);
    } else {
      $("done-emoji").innerHTML = `${characterHTML(state.character)}${foodSVG(state.food)}`;
    }
    $("done-phrase").textContent = state.food.done;
    showScreen("screen-done");
    playChime();
    setTimeout(playYay, 1400);
    dropConfetti(["⭐", "🎉", "✨", "💛", "🌟"], 26);
    return;
  }

  $("done-emoji").innerHTML = `${characterHTML(state.character)}${state.transition.emoji}`;
  $("done-phrase").textContent = state.transition.done;
  showScreen("screen-done");
  playChime();
  dropConfetti();
}

/* The eating close-up: Badb's face with happy closed eyes and a chewing
   mouth, holding whatever food was picked. Inline SVG with SMIL so the
   chewing and gentle rocking animate everywhere, offline included. */
function eatingSceneSVG(food) {
  return `<svg class="arrival-svg" viewBox="0 0 120 120" aria-hidden="true">
  <path d="M18 28 L 20 33 L 25 35 L 20 37 L 18 42 L 16 37 L 11 35 L 16 33 Z" fill="#f4c94f"/>
  <path d="M103 34 L 104.5 38 L 108 39.5 L 104.5 41 L 103 45 L 101.5 41 L 98 39.5 L 101.5 38 Z" fill="#f4c94f"/>
  <path d="M60 8 C 34 8, 22 26, 24 44 C 24.5 54, 20 60, 21 70 C 22 80, 30 83, 36 79 L 36 58 L 84 58 L 84 79 C 90 83, 98 80, 99 70 C 100 60, 95.5 54, 96 44 C 98 26, 86 8, 60 8 Z" fill="#e2a94e"/>
  <path d="M26 46 C 24 54, 22 58, 23.5 68 C 25 74, 30 75, 33 72 C 29 64, 30 54, 28 48 Z" fill="#f0be66"/>
  <path d="M94 46 C 96 54, 98 58, 96.5 68 C 95 74, 90 75, 87 72 C 91 64, 90 54, 92 48 Z" fill="#f0be66"/>
  <circle cx="60" cy="50" r="32" fill="#ffdfc9"/>
  <ellipse cx="41" cy="60" rx="7" ry="4.5" fill="#f59f96" opacity="0.6"/>
  <ellipse cx="79" cy="60" rx="7" ry="4.5" fill="#f59f96" opacity="0.6"/>
  <path d="M40 49 Q 46 42.5, 52 49" stroke="#463829" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M68 49 Q 74 42.5, 80 49" stroke="#463829" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M58 59 C 59 60.5, 61 60.5, 62 59" stroke="#e8b49a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <ellipse cx="60" cy="70" rx="6" ry="3.5" fill="#a85c55">
    <animate attributeName="ry" values="2;5;2" dur="0.75s" repeatCount="indefinite"/>
    <animate attributeName="cy" values="69;71;69" dur="0.75s" repeatCount="indefinite"/>
  </ellipse>
  <path d="M28 46 C 26 18, 42 11, 60 11 C 78 11, 94 18, 92 46 C 89 40, 87 37.5, 84.5 40 C 82 34.5, 77 34, 74 38 C 71 33, 64 33, 61 37 C 58 33, 51 33.5, 48.5 38 C 45 34.5, 41 35.5, 39.5 40 C 36 37.5, 33 40, 28 46 Z" fill="#e8b04b"/>
  <path d="M42 15 C 50 12.5, 70 12.5, 78 15 C 70 17, 50 17, 42 15 Z" fill="#f2c66d" opacity="0.8"/>
  <circle cx="87" cy="17" r="2.2" fill="#e05a8a"/>
  <circle cx="93" cy="14" r="4.4" fill="#f7d24b"/>
  <circle cx="94.7" cy="13" r="0.8" fill="#463829"/>
  <path d="M97.2 14 L 100 15 L 97.2 16.1 Z" fill="#e8862f"/>
  <g>
    <animateTransform attributeName="transform" type="rotate"
                      values="-3 60 94; 3 60 94; -3 60 94"
                      dur="1.1s" repeatCount="indefinite"/>
    <g transform="translate(40 74)">${FOOD_ART[food.id]}</g>
    <circle cx="44" cy="96" r="7.5" fill="#ffdfc9"/>
    <circle cx="76" cy="98" r="7.5" fill="#ffdfc9"/>
  </g>
</svg>`;
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

$("back-to-choose").addEventListener("click", () =>
  showScreen(state.food ? "screen-food" : "screen-choose")
);

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
