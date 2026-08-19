/* Badb Clock — a visual countdown timer for transitions.
   Flow: choose where we're going → choose how long → watch the character
   travel to the destination as the time runs down → gentle chime at the end. */

"use strict";

const APP_VERSION = "20"; // keep in step with the cache version in sw.js

const TRANSITIONS = [
  { id: "car",    label: "The car",   emoji: "🚗", phrase: "We're going to the car",   done: "We're at the car!" },
  { id: "food",   label: "Food",      emoji: "🍽️", phrase: "We're going for food",     done: "Time for food!" },
  { id: "granny", label: "Granny's",  emoji: "👵", phrase: "We're going to Granny's",  done: "We're at Granny's!" },
  { id: "school", label: "School",    emoji: "🏫", phrase: "We're going to school",    done: "We're at school!" },
  { id: "home",   label: "Home",      emoji: "🏠", phrase: "We're going home",         done: "We're home!" },
  { id: "bath",   label: "Bath",      emoji: "🛁", phrase: "It's nearly bath time",    done: "Bath time!" },
  { id: "shower", label: "Shower",    emoji: "🚿", phrase: "It's nearly shower time",  done: "Shower time!" },
  { id: "teeth",  label: "Teeth",     emoji: "🪥", phrase: "Brush, brush, brush!",     done: "Sparkly teeth!", fixedSeconds: 120, activity: "brush" },
  { id: "disco",  label: "Dance party", emoji: "🪩", phrase: "We're going to the dance party", done: "Dance party time!" },
  { id: "bed",    label: "Bed",       emoji: "🌙", phrase: "It's nearly bed time",     done: "Bed time!" },
  { id: "park",   label: "The park",  emoji: "🌳", phrase: "We're going to the park",  done: "We're at the park!" },
  { id: "shops",  label: "The shops", emoji: "🛒", phrase: "We're going to the shops", done: "We're at the shops!" },
  { id: "walk",   label: "A walk",    emoji: "🚶", phrase: "We're going for a walk",   done: "Walk time!" },
  { id: "taxi",   label: "A taxi",    emoji: "🚕", phrase: "We're going in a taxi",    done: "Taxi time!" },
  { id: "airport", label: "The airport", emoji: "🛄", phrase: "We're going to the airport", done: "We're at the airport!" },
  { id: "plane",  label: "The plane", emoji: "✈️", phrase: "We're going on the plane", done: "Time to fly!" },
  { id: "aquarium", label: "The aquarium", emoji: "🦈", phrase: "We're going to the aquarium", done: "We're at the aquarium!" },
  { id: "potty",  label: "Potty",     emoji: "🚽", phrase: "We're going to the potty",  done: "Potty time!" },
];

/* ---------- her foods, drawn to match the real things ----------
   Shapes matter: the waffles are the square ones, the choco puffs and
   Snax are square, the smoothie is the pink rectangular carton. Each is
   a little 40x40 drawing used on the picker cards, in the countdown
   scene, and held in her hands on the arrival close-up. */

const FOOD_ART = {
  waffles: `
    <rect x="5" y="6" width="30" height="28" rx="4.5" fill="#ecb35d" stroke="#cf8c3a" stroke-width="1.6"/>
    ${[9.2, 15.1, 21, 26.9]
      .map((x) =>
        [9.6, 15.2, 20.8, 26.4]
          .map((y) => `<rect x="${x}" y="${y}" width="3.9" height="3.9" rx="1.1" fill="#b57c35"/>`)
          .join("")
      )
      .join("")}
    <path d="M8 10 C 8 8, 9.5 7.5, 11 7.8" stroke="#f4cd85" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
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

function foodHTML(food) {
  return food.custom
    ? `<img class="food-photo" src="${food.useCartoon ? food.cartoon : food.photo}" alt="">`
    : foodSVG(food);
}

/* ---------- custom photo foods, stored on the phone in IndexedDB ----------
   Parents (or Badb) can photograph a real food, optionally cartoonify it,
   name it and file it under dinner/dessert. Nothing leaves the device. */

let customFoods = [];
let customVideos = [];
let customCharacters = [];

function foodsDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("badb-clock", 3);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("foods")) db.createObjectStore("foods", { keyPath: "id" });
      if (!db.objectStoreNames.contains("videos")) db.createObjectStore("videos", { keyPath: "id" });
      if (!db.objectStoreNames.contains("characters")) db.createObjectStore("characters", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadCustomCharacters() {
  try {
    const db = await foodsDB();
    customCharacters = await new Promise((resolve, reject) => {
      const req = db.transaction("characters").objectStore("characters").getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (_) {
    customCharacters = [];
  }
}

async function saveCustomCharacter(character) {
  const db = await foodsDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("characters", "readwrite");
    tx.objectStore("characters").put(character);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteCustomCharacter(id) {
  const db = await foodsDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("characters", "readwrite");
    tx.objectStore("characters").delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function loadCustomVideos() {
  try {
    const db = await foodsDB();
    customVideos = await new Promise((resolve, reject) => {
      const req = db.transaction("videos").objectStore("videos").getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (_) {
    customVideos = [];
  }
}

async function saveCustomVideo(video) {
  const db = await foodsDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("videos", "readwrite");
    tx.objectStore("videos").put(video);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteCustomVideo(id) {
  const db = await foodsDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("videos", "readwrite");
    tx.objectStore("videos").delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function loadCustomFoods() {
  try {
    const db = await foodsDB();
    customFoods = await new Promise((resolve, reject) => {
      const req = db.transaction("foods").objectStore("foods").getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (_) {
    customFoods = []; // storage unavailable — built-in foods still work
  }
}

async function saveCustomFood(food) {
  const db = await foodsDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("foods", "readwrite");
    tx.objectStore("foods").put(food);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteCustomFood(id) {
  const db = await foodsDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("foods", "readwrite");
    tx.objectStore("foods").delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

/* ---------- on-phone "make it a cartoon" filter ----------
   Smooth (repeated down/up-scaling), boost saturation, flatten the colours
   into a few levels, then darken strong edges for an outline. All canvas
   work, so it runs instantly and offline. */

function cartoonize(source) {
  const SIZE = 320;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d");

  // smoothing pass: shrink and re-enlarge twice
  const small = document.createElement("canvas");
  small.width = small.height = 80;
  const sctx = small.getContext("2d");
  sctx.drawImage(source, 0, 0, 80, 80);
  ctx.filter = "saturate(1.4)";
  ctx.drawImage(small, 0, 0, SIZE, SIZE);
  ctx.filter = "none";
  sctx.drawImage(canvas, 0, 0, 80, 80);
  ctx.drawImage(small, 0, 0, SIZE, SIZE);

  const img = ctx.getImageData(0, 0, SIZE, SIZE);
  const d = img.data;

  // edge map from the smoothed image (simple gradient magnitude)
  const gray = new Float32Array(SIZE * SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    gray[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  }
  const edge = new Float32Array(SIZE * SIZE);
  for (let y = 1; y < SIZE - 1; y++) {
    for (let x = 1; x < SIZE - 1; x++) {
      const i = y * SIZE + x;
      const gx = gray[i + 1] - gray[i - 1];
      const gy = gray[i + SIZE] - gray[i - SIZE];
      edge[i] = Math.min(1, Math.sqrt(gx * gx + gy * gy) / 60);
    }
  }

  // posterize + outline
  const LEVELS = 5;
  const step = 255 / (LEVELS - 1);
  for (let i = 0; i < SIZE * SIZE; i++) {
    const e = edge[i] > 0.45 ? 0.65 : 0;
    for (let c = 0; c < 3; c++) {
      const q = Math.round(d[i * 4 + c] / step) * step;
      d[i * 4 + c] = q * (1 - e);
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.85);
}

/* read a picked photo, centre-crop it square, return both versions */
function processPhoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      const side = Math.min(im.width, im.height);
      const sx = (im.width - side) / 2;
      const sy = (im.height - side) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 512;
      canvas.getContext("2d").drawImage(im, sx, sy, side, side, 0, 0, 512, 512);
      resolve({ photo: canvas.toDataURL("image/jpeg", 0.85), cartoon: cartoonize(canvas) });
    };
    im.onerror = reject;
    im.src = url;
  });
}

/* Drawn art for transitions where an emoji doesn't match the real thing —
   like the shower, which is a cubicle with a glass door, not a bare head. */
const TRANSITION_ART = {
  shower: `
    <rect x="6" y="4" width="28" height="31" rx="2.5" fill="#e3edf4"/>
    <path d="M6 14 H34 M6 24 H34 M20 4 V35" stroke="#cdddea" stroke-width="1"/>
    <path d="M13 4 V7" stroke="#8fa8c4" stroke-width="2" stroke-linecap="round"/>
    <rect x="9" y="7" width="9" height="3.6" rx="1.8" fill="#8fa8c4"/>
    <circle cx="10.5" cy="14" r="1" fill="#6fa8d4"/><circle cx="13.5" cy="13" r="1" fill="#6fa8d4"/>
    <circle cx="16.5" cy="14" r="1" fill="#6fa8d4"/><circle cx="12" cy="18" r="1" fill="#6fa8d4"/>
    <circle cx="15" cy="17.5" r="1" fill="#6fa8d4"/><circle cx="13.5" cy="22" r="1" fill="#6fa8d4"/>
    <circle cx="11" cy="26" r="1" fill="#6fa8d4"/><circle cx="16" cy="25.5" r="1" fill="#6fa8d4"/>
    <rect x="8" y="6" width="24" height="29" rx="2" fill="#cfe4f2" opacity="0.45" stroke="#9fc2e0" stroke-width="1.4"/>
    <rect x="28.5" y="18" width="2.2" height="7" rx="1.1" fill="#7f9bb8"/>
    <rect x="5" y="34" width="30" height="3.5" rx="1.75" fill="#f6fafc" stroke="#cfd7e0" stroke-width="1"/>`,
  /* the kids disco: her three dancers — two olive-skinned, one taller with
     dark skin — in white shirts and dark pants, bouncing under a disco ball */
  disco: `
    <line x1="20" y1="0" x2="20" y2="3" stroke="#9fb2c1" stroke-width="1"/>
    <circle cx="20" cy="6" r="3.4" fill="#d7e2ec"/>
    <path d="M17 4.8 C 19 4.1, 21 4.1, 23 4.8 M16.6 6 H23.4 M17 7.2 C 19 7.9, 21 7.9, 23 7.2 M20 2.6 V9.4 M18 3.2 C 17.2 5, 17.2 7, 18 8.8 M22 3.2 C 22.8 5, 22.8 7, 22 8.8"
          stroke="#aebfcc" stroke-width="0.7" fill="none"/>
    <path d="M7 7 l0.8 1.6 1.6 0.8 -1.6 0.8 -0.8 1.6 -0.8 -1.6 -1.6 -0.8 1.6 -0.8 Z" fill="#f4c94f">
      <animate attributeName="opacity" values="1;0.3;1" dur="1.3s" repeatCount="indefinite"/>
    </path>
    <path d="M32.5 8.5 l0.7 1.4 1.4 0.7 -1.4 0.7 -0.7 1.4 -0.7 -1.4 -1.4 -0.7 1.4 -0.7 Z" fill="#f2a4c0">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="1.1s" repeatCount="indefinite"/>
    </path>
    <circle cx="8" cy="37.5" r="1.2" fill="#f2a4c0"/><circle cx="14" cy="38" r="1.2" fill="#9fc2e0"/>
    <circle cx="20" cy="37.5" r="1.2" fill="#f4c94f"/><circle cx="26" cy="38" r="1.2" fill="#9fc2e0"/>
    <circle cx="32" cy="37.5" r="1.2" fill="#f2a4c0"/>
    <g>
      <animateTransform attributeName="transform" type="translate" values="0 0; 0 -1.6; 0 0" dur="0.62s" repeatCount="indefinite"/>
      <path d="M8.5 23.5 L5.5 18.5 M12.5 24 L15.8 22" stroke="#d9a06b" stroke-width="1.9" stroke-linecap="round"/>
      <path d="M7.5 21.8 L13.5 21.8 L14.2 29 L6.8 29 Z" fill="#fcfcf9"/>
      <rect x="7.6" y="29" width="2.4" height="6.4" rx="1.2" fill="#2e3440"/>
      <rect x="11" y="29" width="2.4" height="6.4" rx="1.2" fill="#2e3440"/>
      <circle cx="10.5" cy="18.3" r="3.1" fill="#d9a06b"/>
      <path d="M7.4 18 C 7.4 14.9, 13.6 14.9, 13.6 18 C 12.4 16.4, 8.6 16.4, 7.4 18 Z" fill="#4a3527"/>
      <circle cx="10.5" cy="14.4" r="1.7" fill="#4a3527"/>
    </g>
    <g>
      <animateTransform attributeName="transform" type="translate" values="0 0; 0 -2; 0 0" dur="0.7s" begin="0.15s" repeatCount="indefinite"/>
      <circle cx="23.6" cy="15.6" r="1.6" fill="#241a12"/>
      <circle cx="24.3" cy="18.4" r="1.5" fill="#241a12"/>
      <circle cx="24.8" cy="21.1" r="1.4" fill="#241a12"/>
      <circle cx="25.1" cy="23.7" r="1.3" fill="#241a12"/>
      <circle cx="25.3" cy="26.1" r="1.2" fill="#241a12"/>
      <circle cx="25.4" cy="27.9" r="0.9" fill="#241a12"/>
      <circle cx="25.35" cy="26.9" r="0.7" fill="#f2a4c0"/>
      <path d="M17.2 18.5 L14.2 13.5 M22.8 18.5 L25.8 13.5" stroke="#6b4423" stroke-width="1.9" stroke-linecap="round"/>
      <path d="M16.8 16.8 L23.2 16.8 L24 26 L16 26 Z" fill="#fcfcf9"/>
      <rect x="17.2" y="26" width="2.5" height="9.4" rx="1.25" fill="#2e3440"/>
      <rect x="20.4" y="26" width="2.5" height="9.4" rx="1.25" fill="#2e3440"/>
      <circle cx="20" cy="13.2" r="3.2" fill="#6b4423"/>
      <path d="M16.8 12.9 C 16.8 9.7, 23.2 9.7, 23.2 12.9 C 22 11.3, 18 11.3, 16.8 12.9 Z" fill="#241a12"/>
    </g>
    <g>
      <animateTransform attributeName="transform" type="translate" values="0 0; 0 -1.4; 0 0" dur="0.66s" begin="0.3s" repeatCount="indefinite"/>
      <path d="M31.5 23.5 L34.5 18.5 M27.5 24 L24.4 22.4" stroke="#cf9463" stroke-width="1.9" stroke-linecap="round"/>
      <path d="M26.5 21.8 L32.5 21.8 L33.2 29 L25.8 29 Z" fill="#fcfcf9"/>
      <rect x="26.6" y="29" width="2.4" height="6.4" rx="1.2" fill="#2e3440"/>
      <rect x="30" y="29" width="2.4" height="6.4" rx="1.2" fill="#2e3440"/>
      <circle cx="29.5" cy="18.3" r="3.1" fill="#cf9463"/>
      <path d="M26.4 18 C 26.4 14.9, 32.6 14.9, 32.6 18 C 31.4 16.4, 27.6 16.4, 26.4 18 Z" fill="#3d2c20"/>
      <circle cx="29.5" cy="14.4" r="1.7" fill="#3d2c20"/>
    </g>`,
};

TRANSITION_ART.taxi = `
    <rect x="20" y="6.5" width="9" height="4" rx="1.2" fill="#fdfdfd" stroke="#1d242c" stroke-width="0.8"/>
    <text x="24.5" y="9.7" text-anchor="middle" font-size="2.8" font-weight="bold" fill="#1d242c" font-family="sans-serif">TAXI</text>
    <path d="M14.5 19 L17.5 12.5 C 18 11.4, 19 10.8, 20.3 10.8 L 28 10.8 C 29.3 10.8, 30.3 11.4, 30.8 12.5 L 33.5 19 Z" fill="#1d242c"/>
    <rect x="4" y="18" width="32" height="9.5" rx="3" fill="#1d242c"/>
    <rect x="19" y="19" width="7.5" height="8" rx="1.5" fill="#f5c400"/>
    <path d="M20.5 22.5 h2.5" stroke="#1d242c" stroke-width="1" stroke-linecap="round"/>
    <rect x="18.7" y="12.3" width="5.4" height="5.2" rx="1" fill="#cfe4f2"/>
    <rect x="25.5" y="12.3" width="4.6" height="5.2" rx="1" fill="#cfe4f2"/>
    <circle cx="35.5" cy="20.5" r="1.2" fill="#f7d24b"/>
    <circle cx="12" cy="28" r="3.6" fill="#2e3440" stroke="#11151a" stroke-width="1"/>
    <circle cx="12" cy="28" r="1.4" fill="#aebfcc"/>
    <circle cx="29" cy="28" r="3.6" fill="#2e3440" stroke="#11151a" stroke-width="1"/>
    <circle cx="29" cy="28" r="1.4" fill="#aebfcc"/>`;

TRANSITION_ART.airport = `
    <g transform="rotate(-12 11 8)">
      <ellipse cx="11" cy="8" rx="5" ry="1.6" fill="#8fa8c4"/>
      <path d="M10 8 L6.5 4.8 L8.6 8 L6.5 11.2 Z" fill="#8fa8c4"/>
      <path d="M15 7.4 L16.6 5.8 L16.2 8.2 Z" fill="#8fa8c4"/>
    </g>
    <rect x="4" y="21" width="22" height="12" rx="2" fill="#dbe7f0"/>
    <rect x="4" y="26.5" width="22" height="6.5" rx="1.5" fill="#cfe4f2"/>
    <rect x="7" y="23" width="4" height="2.6" rx="0.8" fill="#9fc2e0"/>
    <rect x="13" y="23" width="4" height="2.6" rx="0.8" fill="#9fc2e0"/>
    <rect x="19" y="23" width="4" height="2.6" rx="0.8" fill="#9fc2e0"/>
    <rect x="29" y="16" width="4" height="17" fill="#cfd7e0"/>
    <rect x="27" y="11.5" width="8" height="5" rx="2" fill="#8fa8c4"/>
    <path d="M31 11.5 V8.5" stroke="#8fa8c4" stroke-width="1.2" stroke-linecap="round"/>
    <circle cx="31" cy="7.8" r="1" fill="#e05a8a"/>
    <rect x="2" y="33" width="36" height="2" rx="1" fill="#b8c6d2"/>`;

TRANSITION_ART.aquarium = `
    <defs><clipPath id="aq-water"><rect x="4.5" y="9" width="31" height="21.5" rx="1.5"/></clipPath></defs>
    <rect x="3" y="6" width="34" height="27" rx="2.5" fill="#a5d4ea" stroke="#8fa8c4" stroke-width="1.6"/>
    <rect x="4.5" y="7.5" width="31" height="3" fill="#c3e2f0"/>
    <g clip-path="url(#aq-water)">
      <rect x="4.5" y="27.5" width="31" height="3.5" fill="#e8d9a8"/>
      <circle cx="10" cy="29.5" r="1" fill="#d3c28e"/>
      <circle cx="27" cy="29.8" r="1.2" fill="#d3c28e"/>
      <path d="M8 28 C 7 25, 9 24, 8 21 C 7.5 19, 9 18, 8.5 16" stroke="#79b07a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <path d="M32 28 C 33 25.5, 31 24, 32 21.5 C 32.5 19.5, 31.5 19, 32 17.5" stroke="#8fc98f" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <circle cx="13" cy="24" r="0.8" fill="#dff1f8">
        <animate attributeName="cy" values="26;10" dur="3.2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.9;0" dur="3.2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="30" cy="22" r="0.6" fill="#dff1f8">
        <animate attributeName="cy" values="25;10" dur="2.6s" begin="1s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.9;0" dur="2.6s" begin="1s" repeatCount="indefinite"/>
      </circle>
      <g>
        <animateTransform attributeName="transform" type="translate" values="-20 0; 42 0" dur="7s" repeatCount="indefinite"/>
        <g>
          <animateTransform attributeName="transform" type="translate" values="0 0; 0 -1.2; 0 0" dur="1.8s" repeatCount="indefinite"/>
          <path d="M2 19.5 C 5 15.5, 12 15, 15.5 18 C 17 19.2, 17 20.8, 15.5 21.8 C 12 24.2, 5 23.2, 2 20.5 Z" fill="#7f9bb8"/>
          <path d="M3.5 20.8 C 6.5 22.8, 11.5 23.3, 14.5 21.6 C 11 23.6, 6 23.2, 3.5 20.8 Z" fill="#dbe7f0"/>
          <path d="M8.5 16.2 L10.5 12.5 L12.3 16.4 Z" fill="#7f9bb8"/>
          <path d="M2.6 19.9 L-1.5 16.5 L-0.5 20 L-1.5 23.5 Z" fill="#7f9bb8"/>
          <path d="M9.5 20.8 L11 23.6 L12.6 21.2 Z" fill="#6e89a6"/>
          <circle cx="13.8" cy="18.3" r="0.75" fill="#2e3440"/>
          <path d="M12 20.6 C 12.5 20.1, 13.2 20, 13.8 20.2" stroke="#6e89a6" stroke-width="0.7" fill="none" stroke-linecap="round"/>
          <path d="M10.7 17.6 M10.5 18.4 l1 0 M10.9 19.2 l0.9 0" stroke="#6e89a6" stroke-width="0.6"/>
        </g>
      </g>
    </g>`;

TRANSITION_ART.bed = `
    <path d="M30 5.5 a 4.2 4.2 0 1 0 2.5 7.6 a 5.4 5.4 0 1 1 -2.5 -7.6 Z" fill="#f4c94f"/>
    <path d="M36 11 l0.7 1.4 1.4 0.7 -1.4 0.7 -0.7 1.4 -0.7 -1.4 -1.4 -0.7 1.4 -0.7 Z" fill="#f4c94f"/>
    <rect x="4" y="12" width="5" height="20" rx="2" fill="#c9a678"/>
    <rect x="33" y="19" width="4" height="13" rx="1.8" fill="#c9a678"/>
    <rect x="6" y="21" width="30" height="7" rx="2.5" fill="#fdf8ef"/>
    <ellipse cx="12" cy="20.5" rx="5" ry="2.8" fill="#ffffff" stroke="#e3e8ee" stroke-width="1"/>
    <path d="M16 20 C 22 18.5, 30 18.5, 35 20 L 36 26 C 36 27.5, 35 28, 34 28 L 16.5 28 Z" fill="#fdfdfa"/>
    <!-- her jungle duvet: monkey, spiky-maned lion, leaves, pink flower -->
    <circle cx="20.2" cy="23.8" r="1.9" fill="#8a5a3b"/>
    <circle cx="18.5" cy="23.3" r="0.75" fill="#8a5a3b"/>
    <circle cx="21.9" cy="23.3" r="0.75" fill="#8a5a3b"/>
    <circle cx="20.2" cy="24.4" r="1.1" fill="#c99565"/>
    <circle cx="19.6" cy="23.3" r="0.3" fill="#2e3440"/>
    <circle cx="20.8" cy="23.3" r="0.3" fill="#2e3440"/>
    <g stroke="#e8862f" stroke-width="0.55" stroke-linecap="round">
      <path d="M31 20.4 V19.6 M31 26.8 V27.6 M27.8 23.6 H27 M34.2 23.6 H35
               M28.7 21.3 L28.1 20.7 M33.3 21.3 L33.9 20.7 M28.7 25.9 L28.1 26.5 M33.3 25.9 L33.9 26.5
               M29.6 20.7 L29.3 19.9 M32.4 20.7 L32.7 19.9 M28 24.8 L27.2 25.1 M34 24.8 L34.8 25.1
               M28 22.4 L27.2 22.1 M34 22.4 L34.8 22.1 M29.6 26.5 L29.3 27.3 M32.4 26.5 L32.7 27.3"/>
    </g>
    <circle cx="31" cy="23.6" r="2.7" fill="#e8862f"/>
    <circle cx="31" cy="23.6" r="1.8" fill="#f7d24b"/>
    <circle cx="30.4" cy="23.2" r="0.35" fill="#463829"/>
    <circle cx="31.6" cy="23.2" r="0.35" fill="#463829"/>
    <path d="M30.6 24.4 C 30.9 24.7, 31.1 24.7, 31.4 24.4" stroke="#463829" stroke-width="0.4" fill="none"/>
    <ellipse cx="25.5" cy="21.8" rx="1.4" ry="0.7" fill="#79b07a" transform="rotate(-25 25.5 21.8)"/>
    <ellipse cx="34.2" cy="26.6" rx="1.3" ry="0.65" fill="#8fc98f" transform="rotate(20 34.2 26.6)"/>
    <g fill="#f2a4c0">
      <circle cx="24.6" cy="26.2" r="0.7"/><circle cx="26" cy="26.2" r="0.7"/>
      <circle cx="25.3" cy="25.5" r="0.7"/><circle cx="25.3" cy="26.9" r="0.7"/>
    </g>
    <circle cx="25.3" cy="26.2" r="0.45" fill="#5b6ab8"/>
    <rect x="5" y="30" width="3" height="4.5" rx="1.2" fill="#b08d5f"/>
    <rect x="33.5" y="30" width="3" height="4.5" rx="1.2" fill="#b08d5f"/>`;

TRANSITION_ART.potty = `
    <path d="M9 14 C 9 11.5, 11 10, 13.5 10 L 26.5 10 C 29 10, 31 11.5, 31 14 L 31 17 L 9 17 Z" fill="#9fc2e0"/>
    <ellipse cx="20" cy="17" rx="11" ry="3.6" fill="#ffffff" stroke="#cfd7e0" stroke-width="1"/>
    <ellipse cx="20" cy="17" rx="6.5" ry="2" fill="#7f9bb8"/>
    <path d="M9.5 18 C 9.5 25, 12 29.5, 14 30.5 L 26 30.5 C 28 29.5, 30.5 25, 30.5 18 C 27 20.5, 13 20.5, 9.5 18 Z" fill="#aecdee"/>
    <path d="M12 31 L 28 31 C 28.8 31, 29.5 31.6, 29.5 32.4 C 29.5 33.2, 28.8 33.8, 28 33.8 L 12 33.8 C 11.2 33.8, 10.5 33.2, 10.5 32.4 C 10.5 31.6, 11.2 31, 12 31 Z" fill="#9fc2e0"/>
    <circle cx="20" cy="25.5" r="2" fill="#f7d24b"/>
    <circle cx="20.6" cy="24.9" r="0.4" fill="#463829"/>
    <path d="M22 25.4 L 23.4 25.9 L 22 26.4 Z" fill="#e8862f"/>`;

function transitionIconHTML(t) {
  return TRANSITION_ART[t.id]
    ? `<svg class="food-svg" viewBox="0 0 40 40" aria-hidden="true">${TRANSITION_ART[t.id]}</svg>`
    : t.emoji;
}

const MINUTES = [1, 2, 3, 5, 10, 15, 30, 45, 60];
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
  if (c.photo) return `<img class="char-photo" src="${c.photo}" alt="">`;
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
    card.innerHTML = `<span class="emoji">${transitionIconHTML(t)}</span><span class="label">${t.label}</span>`;
    card.addEventListener("click", () => {
      state.transition = t;
      state.food = null;
      if (t.id === "food") {
        showScreen("screen-food-category");
      } else if (t.fixedSeconds) {
        startTimer(t.fixedSeconds); // activity timers (like teeth) start straight away
      } else {
        $("time-emoji").innerHTML = transitionIconHTML(t);
        $("time-title").textContent = t.phrase;
        showScreen("screen-time");
      }
    });
    grid.appendChild(card);
  });

  buildCharacterPicker();
}

/* The character picker: the drawn avatar, the emoji kids, any photo
   characters the family has added, and a ＋ to add one from a photo of
   their own kid (cropped round, stored on the device). */
function buildCharacterPicker() {
  const picker = $("character-picker");
  picker.innerHTML = "";
  [...CHARACTERS, ...customCharacters].forEach((c) => {
    const opt = document.createElement("button");
    opt.className = "character-option" + (c.id === state.character.id ? " selected" : "");
    opt.innerHTML = characterHTML(c);
    if (c.photo) {
      const remove = document.createElement("span");
      remove.className = "char-remove";
      remove.textContent = "✕";
      remove.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm("Remove this character?")) return;
        try { await deleteCustomCharacter(c.id); } catch (_) { /* remove for the session anyway */ }
        customCharacters = customCharacters.filter((x) => x.id !== c.id);
        if (state.character.id === c.id) {
          state.character = CHARACTERS[0];
          localStorage.setItem("badb-character", state.character.id);
        }
        buildCharacterPicker();
      });
      opt.appendChild(remove);
    }
    opt.addEventListener("click", () => {
      state.character = c;
      localStorage.setItem("badb-character", c.id);
      buildCharacterPicker();
    });
    picker.appendChild(opt);
  });

  const add = document.createElement("label");
  add.className = "character-option add-character";
  add.innerHTML = `＋<input type="file" accept="image/*" hidden>`;
  add.querySelector("input").addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const photo = await squareCropPhoto(file, 256);
      const character = { id: `char-${Date.now()}`, photo };
      await saveCustomCharacter(character).catch(() => {});
      customCharacters.push(character);
      state.character = character;
      localStorage.setItem("badb-character", character.id);
      buildCharacterPicker();
    } catch (_) { /* unreadable image — leave the picker as it was */ }
  });
  picker.appendChild(add);
}

/* centre-crop any image square, used for photo characters */
function squareCropPhoto(file, size) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      const side = Math.min(im.width, im.height);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      canvas.getContext("2d").drawImage(im, (im.width - side) / 2, (im.height - side) / 2, side, side, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    im.onerror = reject;
    im.src = url;
  });
}

/* ---------- screens 1b/1c: dinner-or-dessert, then pick the food ---------- */

function buildFoodGrid(category) {
  state.foodCategory = category;
  const grid = $("food-grid");
  grid.innerHTML = "";
  [...FOODS, ...customFoods]
    .filter((f) => f.cats.includes(category))
    .forEach((f) => {
      const card = document.createElement("button");
      card.className = "transition-card";
      card.innerHTML = `<span class="emoji">${foodHTML(f)}</span><span class="label">${f.label}</span>`;
      card.addEventListener("click", () => {
        state.food = f;
        $("time-emoji").innerHTML = foodHTML(f);
        $("time-title").textContent = f.phrase;
        showScreen("screen-time");
      });
      grid.appendChild(card);
    });
  $("edit-foods-btn").hidden = customFoods.length === 0;
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
  // activity timers (teeth) swap the journey for a do-it-along close-up
  const brushing = state.transition.activity === "brush" && state.character.img;
  $("walker").style.display = brushing ? "none" : "";
  if (brushing) $("destination-emoji").innerHTML = brushingSceneSVG();
  else if (state.food) $("destination-emoji").innerHTML = foodHTML(state.food);
  else $("destination-emoji").innerHTML = transitionIconHTML(state.transition);
  $("destination").classList.toggle("center", brushing);
  // scene-style destinations (brushing, dance party, aquarium) get extra room
  $("destination").classList.toggle(
    "huge",
    brushing || (!state.food && ["disco", "aquarium"].includes(state.transition.id))
  );
  $("walker").classList.add("walking");
  $("destination").classList.remove("nearly");
  $("progress-fill").classList.remove("nearly");
  $("pause-btn").textContent = "⏸ Pause";

  renderTick();
  showScreen("screen-timer");
  requestWakeLock();
  startMusic();

  // Track the real clock rather than counting ticks — browser timers get
  // throttled on long waits, and "finish at 8pm" must actually mean 8pm.
  state.endTime = Date.now() + seconds * 1000;
  clearInterval(state.intervalId);
  state.intervalId = setInterval(() => {
    if (state.paused) return;
    state.remaining = Math.max(0, Math.round((state.endTime - Date.now()) / 1000));
    renderTick();
    if (state.remaining <= 0) finishTimer();
  }, 1000);
}

function renderTick() {
  const h = Math.floor(state.remaining / 3600);
  const m = Math.floor((state.remaining % 3600) / 60);
  const s = state.remaining % 60;
  $("time-left").textContent = h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;

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

  // Teeth done: a sparkly-smile close-up with a cheer.
  if (state.transition.activity === "brush" && state.character.img) {
    $("done-emoji").innerHTML = sparkleSmileSVG();
    $("done-phrase").textContent = state.transition.done;
    showScreen("screen-done");
    playChime();
    setTimeout(playYay, 1400);
    dropConfetti(["✨", "⭐", "💛", "🫧"], 26);
    return;
  }

  // Food arrivals are the celebration: a close-up of her eating the food
  // she picked (with the drawn avatar), a cheer, and extra confetti.
  if (state.food) {
    if (state.character.img) {
      $("done-emoji").innerHTML = eatingSceneSVG(state.food);
    } else {
      $("done-emoji").innerHTML = `${characterHTML(state.character)}${foodHTML(state.food)}`;
    }
    $("done-phrase").textContent = state.food.done;
    showScreen("screen-done");
    playChime();
    setTimeout(playYay, 1400);
    dropConfetti(["⭐", "🎉", "✨", "💛", "🌟"], 26);
    return;
  }

  $("done-emoji").innerHTML = `${characterHTML(state.character)}${transitionIconHTML(state.transition)}`;
  $("done-phrase").textContent = state.transition.done;
  showScreen("screen-done");
  playChime();
  dropConfetti();
}

/* Shared close-up face for the big scenes: hair, happy closed eyes, rosy
   cheeks (FACE_PRE), then fringe and duck clip on top (FACE_POST). Each
   scene supplies its own mouth and props between the two. */
const FACE_PRE = `
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
  <path d="M58 59 C 59 60.5, 61 60.5, 62 59" stroke="#e8b49a" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
const FACE_POST = `
  <path d="M28 46 C 26 18, 42 11, 60 11 C 78 11, 94 18, 92 46 C 89 40, 87 37.5, 84.5 40 C 82 34.5, 77 34, 74 38 C 71 33, 64 33, 61 37 C 58 33, 51 33.5, 48.5 38 C 45 34.5, 41 35.5, 39.5 40 C 36 37.5, 33 40, 28 46 Z" fill="#e8b04b"/>
  <path d="M42 15 C 50 12.5, 70 12.5, 78 15 C 70 17, 50 17, 42 15 Z" fill="#f2c66d" opacity="0.8"/>
  <circle cx="87" cy="17" r="2.2" fill="#e05a8a"/>
  <circle cx="93" cy="14" r="4.4" fill="#f7d24b"/>
  <circle cx="94.7" cy="13" r="0.8" fill="#463829"/>
  <path d="M97.2 14 L 100 15 L 97.2 16.1 Z" fill="#e8862f"/>`;

/* The eating close-up: chewing mouth, holding whatever food was picked.
   Inline SVG with SMIL so the chewing and gentle rocking animate
   everywhere, offline included. */
function eatingSceneSVG(food) {
  return `<svg class="arrival-svg" viewBox="0 0 120 120" aria-hidden="true">
  ${FACE_PRE}
  <ellipse cx="60" cy="70" rx="6" ry="3.5" fill="#a85c55">
    <animate attributeName="ry" values="2;5;2" dur="0.75s" repeatCount="indefinite"/>
    <animate attributeName="cy" values="69;71;69" dur="0.75s" repeatCount="indefinite"/>
  </ellipse>
  ${FACE_POST}
  <g>
    <animateTransform attributeName="transform" type="rotate"
                      values="-3 60 94; 3 60 94; -3 60 94"
                      dur="1.1s" repeatCount="indefinite"/>
    ${food.custom
      ? `<clipPath id="food-clip"><rect x="40" y="72" width="40" height="40" rx="9"/></clipPath>
         <image href="${food.useCartoon ? food.cartoon : food.photo}" x="40" y="72" width="40" height="40"
                preserveAspectRatio="xMidYMid slice" clip-path="url(#food-clip)"/>`
      : `<g transform="translate(40 74)">${FOOD_ART[food.id]}</g>`}
    <circle cx="44" cy="96" r="7.5" fill="#ffdfc9"/>
    <circle cx="76" cy="98" r="7.5" fill="#ffdfc9"/>
  </g>
</svg>`;
}

/* Brush-along scene shown DURING the teeth timer: open smile, and the
   toothbrush scrubs back and forth across the teeth. */
function brushingSceneSVG() {
  return `<svg class="food-svg" viewBox="0 0 120 120" aria-hidden="true">
  ${FACE_PRE}
  <ellipse cx="60" cy="70" rx="11" ry="7.5" fill="#a85c55"/>
  <rect x="51" y="63.5" width="18" height="6" rx="2.5" fill="#ffffff"/>
  <circle cx="46" cy="62" r="2" fill="#eaf6fb"/>
  <circle cx="43.5" cy="66.5" r="1.4" fill="#eaf6fb"/>
  <circle cx="74.5" cy="59.5" r="1.7" fill="#eaf6fb"/>
  <g>
    <animateTransform attributeName="transform" type="translate" values="-5 0; 5 0; -5 0" dur="0.55s" repeatCount="indefinite"/>
    <path d="M64 66 L80 88" stroke="#e05a8a" stroke-width="4.5" stroke-linecap="round"/>
    <rect x="50" y="61" width="14" height="5.5" rx="2.2" fill="#fdfdfd" stroke="#d8dee5" stroke-width="0.8"/>
    <path d="M53.5 61.5 V66 M57.5 61.5 V66 M61 61.5 V66" stroke="#d8dee5" stroke-width="0.8"/>
    <circle cx="80" cy="88" r="6.5" fill="#ffdfc9"/>
  </g>
  ${FACE_POST}
</svg>`;
}

/* Sparkly-teeth arrival after brushing. */
function sparkleSmileSVG() {
  return `<svg class="arrival-svg" viewBox="0 0 120 120" aria-hidden="true">
  ${FACE_PRE}
  <path d="M47 64 C 52 77, 68 77, 73 64 Z" fill="#a85c55"/>
  <path d="M47 64 H73 L71.2 69.5 C 64 72.5, 56 72.5, 48.8 69.5 Z" fill="#ffffff"/>
  <path d="M54 66.5 l0.7 1.4 1.4 0.7 -1.4 0.7 -0.7 1.4 -0.7 -1.4 -1.4 -0.7 1.4 -0.7 Z" fill="#bfe3f2"/>
  <path d="M64 66 l0.6 1.2 1.2 0.6 -1.2 0.6 -0.6 1.2 -0.6 -1.2 -1.2 -0.6 1.2 -0.6 Z" fill="#bfe3f2"/>
  <path d="M40 58 l1 2 2 1 -2 1 -1 2 -1 -2 -2 -1 2 -1 Z" fill="#f4c94f">
    <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite"/>
  </path>
  <path d="M79 56 l1 2 2 1 -2 1 -1 2 -1 -2 -2 -1 2 -1 Z" fill="#f4c94f">
    <animate attributeName="opacity" values="0.3;1;0.3" dur="1.4s" repeatCount="indefinite"/>
  </path>
  <path d="M59 84 l0.9 1.8 1.8 0.9 -1.8 0.9 -0.9 1.8 -0.9 -1.8 -1.8 -0.9 1.8 -0.9 Z" fill="#f4c94f">
    <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite"/>
  </path>
  ${FACE_POST}
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

$("custom-minutes-go").addEventListener("click", () => {
  const m = parseInt($("custom-minutes").value, 10);
  if (m >= 1 && m <= 720) startTimer(m * 60);
});

$("custom-until-go").addEventListener("click", () => {
  const value = $("custom-until").value; // "HH:MM"
  if (!value) return;
  const [hh, mm] = value.split(":").map(Number);
  const target = new Date();
  target.setHours(hh, mm, 0, 0);
  let diff = target.getTime() - Date.now();
  if (diff <= 0) diff += 24 * 3600 * 1000; // that time already passed → tomorrow
  startTimer(Math.round(diff / 1000));
});

$("cancel-timer").addEventListener("click", () => {
  stopTimer();
  showScreen("screen-choose");
});

$("pause-btn").addEventListener("click", () => {
  state.paused = !state.paused;
  $("pause-btn").textContent = state.paused ? "▶ Go" : "⏸ Pause";
  $("walker").classList.toggle("walking", !state.paused);
  if (state.paused) {
    stopMusic();
  } else {
    state.endTime = Date.now() + state.remaining * 1000; // resume from where we paused
    startMusic();
  }
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

/* ---------- add / edit custom foods ---------- */

const addFoodState = { editing: null, photo: null, cartoon: null, useCartoon: true, cat: "both" };

function openAddFood(food) {
  addFoodState.editing = food || null;
  addFoodState.photo = food ? food.photo : null;
  addFoodState.cartoon = food ? food.cartoon : null;
  addFoodState.useCartoon = food ? food.useCartoon : true;
  addFoodState.cat = food
    ? (food.cats.length === 2 ? "both" : food.cats[0])
    : (state.foodCategory || "both");
  $("add-food-title").textContent = food ? "Edit food" : "Add a food";
  $("food-name").value = food ? food.label : "";
  $("photo-drop-hint").textContent = "🖼 Tap to add a photo";
  refreshAddFoodForm();
  showScreen("screen-add-food");
}

function refreshAddFoodForm() {
  const havePhoto = !!addFoodState.photo;
  $("photo-preview").hidden = !havePhoto;
  $("photo-drop-hint").hidden = havePhoto;
  $("cartoon-toggle").hidden = !havePhoto;
  if (havePhoto) {
    $("photo-preview").src = addFoodState.useCartoon ? addFoodState.cartoon : addFoodState.photo;
    $("cartoon-toggle").textContent = addFoodState.useCartoon ? "🎨 Cartoon: on" : "🎨 Cartoon: off";
  }
  document.querySelectorAll(".cat-chip").forEach((chip) =>
    chip.classList.toggle("selected", chip.dataset.cat === addFoodState.cat)
  );
  $("save-food").disabled = !(havePhoto && $("food-name").value.trim());
}

async function handleFoodPhoto(e) {
  const file = e.target.files && e.target.files[0];
  e.target.value = "";
  if (!file) return;
  $("photo-drop-hint").textContent = "…";
  try {
    const { photo, cartoon } = await processPhoto(file);
    addFoodState.photo = photo;
    addFoodState.cartoon = cartoon;
  } catch (_) {
    $("photo-drop-hint").textContent = "🖼 That photo didn't work — try again";
    return;
  }
  refreshAddFoodForm();
}
$("food-photo-input").addEventListener("change", handleFoodPhoto);
$("food-photo-camera").addEventListener("change", handleFoodPhoto);
$("food-photo-gallery").addEventListener("change", handleFoodPhoto);

$("cartoon-toggle").addEventListener("click", () => {
  addFoodState.useCartoon = !addFoodState.useCartoon;
  refreshAddFoodForm();
});

$("food-name").addEventListener("input", refreshAddFoodForm);

document.querySelectorAll(".cat-chip").forEach((chip) =>
  chip.addEventListener("click", () => {
    addFoodState.cat = chip.dataset.cat;
    refreshAddFoodForm();
  })
);

$("save-food").addEventListener("click", async () => {
  const label = $("food-name").value.trim();
  const food = {
    id: addFoodState.editing ? addFoodState.editing.id : `custom-${Date.now()}`,
    custom: true,
    label,
    cats: addFoodState.cat === "both" ? ["dinner", "dessert"] : [addFoodState.cat],
    photo: addFoodState.photo,
    cartoon: addFoodState.cartoon,
    useCartoon: addFoodState.useCartoon,
    phrase: `We're going for ${label}`,
    done: `Yay! ${label} time!`,
  };
  try {
    await saveCustomFood(food);
  } catch (_) { /* keep it for this session even if storage failed */ }
  const idx = customFoods.findIndex((f) => f.id === food.id);
  if (idx >= 0) customFoods[idx] = food;
  else customFoods.push(food);
  buildFoodGrid(state.foodCategory || food.cats[0]);
  showScreen("screen-food");
});

function buildEditFoodList() {
  const list = $("edit-food-list");
  list.innerHTML = "";
  customFoods.forEach((f) => {
    const row = document.createElement("div");
    row.className = "edit-food-row";
    const catLabel = f.cats.length === 2 ? "Dinner + dessert" : f.cats[0] === "dinner" ? "Dinner" : "Dessert";
    row.innerHTML = `
      ${foodHTML(f)}
      <div class="info"><span class="name">${f.label}</span><span class="cats">${catLabel}</span></div>
      <button class="row-btn edit" aria-label="Edit ${f.label}">✎</button>
      <button class="row-btn delete" aria-label="Delete ${f.label}">🗑</button>`;
    row.querySelector(".edit").addEventListener("click", () => openAddFood(f));
    row.querySelector(".delete").addEventListener("click", async () => {
      if (!confirm(`Remove ${f.label}?`)) return;
      try {
        await deleteCustomFood(f.id);
      } catch (_) { /* still remove from the session */ }
      customFoods = customFoods.filter((x) => x.id !== f.id);
      if (customFoods.length === 0) {
        buildFoodGrid(state.foodCategory || "dinner");
        showScreen("screen-food");
      } else {
        buildEditFoodList();
      }
    });
    list.appendChild(row);
  });
}

/* ---------- instant videos: import once, play in one tap ----------
   Videos are stored whole in IndexedDB, so playback starts instantly
   from local storage — no network, no buffering, no adverts. */

let removingVideos = false;
let renamingVideos = false;

/* Downloaded films arrive named like "Some.Film.1967.1080p.BluRay.x264-GROUP".
   Strip the release gibberish so tiles start with a sensible name. */
function cleanVideoName(filename) {
  let name = filename.replace(/\.[^.]+$/, "").replace(/[._]+/g, " ");
  const cut = name.search(
    /\b((19|20)\d{2}|2160p|1080p|720p|480p|4k|x264|x265|h ?264|h ?265|hevc|webrip|web ?dl|bluray|brrip|hdrip|dvdrip|remux|proper|repack|extended|remastered)\b/i
  );
  if (cut > 0) name = name.slice(0, cut);
  name = name.replace(/[[\](){}-]+/g, " ").replace(/\s+/g, " ").trim();
  return name || filename.replace(/\.[^.]+$/, "");
}

/* Probe whether this phone can actually decode the file, and grab a
   thumbnail while we're in there. Torrented films are often HEVC/x265 or
   AC3 inside an .mp4/.mkv — containers this browser opens but codecs it
   can't decode — and silently importing those gives a "playing" black
   screen. Better to say so at import time. */
function probeVideo(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    const done = (result) => { URL.revokeObjectURL(url); resolve(result); };
    // Big files on slow storage can be sluggish — assume OK on timeout.
    const timeout = setTimeout(() => done({ playable: true, thumb: null }), 8000);
    v.muted = true;
    v.preload = "auto";
    v.onloadeddata = () => {
      if (!v.videoWidth) {
        // container opened but the video track can't be decoded
        clearTimeout(timeout);
        done({ playable: false, thumb: null });
        return;
      }
      v.currentTime = Math.min(1, (v.duration || 2) / 2);
    };
    v.onseeked = () => {
      clearTimeout(timeout);
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 180;
      const scale = Math.max(320 / v.videoWidth, 180 / v.videoHeight);
      const w = v.videoWidth * scale;
      const h = v.videoHeight * scale;
      canvas.getContext("2d").drawImage(v, (320 - w) / 2, (180 - h) / 2, w, h);
      done({ playable: true, thumb: canvas.toDataURL("image/jpeg", 0.8) });
    };
    v.onerror = () => { clearTimeout(timeout); done({ playable: false, thumb: null }); };
    v.src = url;
  });
}

function buildVideoGrid() {
  const grid = $("video-grid");
  grid.innerHTML = "";
  grid.classList.toggle("removing", removingVideos);
  customVideos.forEach((v) => {
    const tile = document.createElement("button");
    tile.className = "video-tile";
    tile.innerHTML = `
      ${v.thumb ? `<img src="${v.thumb}" alt="">` : `<span class="placeholder">🎬</span>`}
      <span class="play-badge">▶️</span>
      <span class="name">${v.label}</span>`;
    tile.addEventListener("click", async () => {
      if (renamingVideos) {
        const name = prompt("What should this be called?", v.label);
        if (name === null) return;
        v.label = name.trim() || v.label;
        try { await saveCustomVideo(v); } catch (_) { /* keep the new name for the session */ }
        buildVideoGrid();
      } else if (removingVideos) {
        if (!confirm(`Remove ${v.label}?`)) return;
        try { await deleteCustomVideo(v.id); } catch (_) { /* remove for the session anyway */ }
        customVideos = customVideos.filter((x) => x.id !== v.id);
        removingVideos = customVideos.length > 0 && removingVideos;
        buildVideoGrid();
      } else {
        openVideo(v);
      }
    });
    grid.appendChild(tile);
  });
  grid.classList.toggle("renaming", renamingVideos);
  $("video-remove-btn").hidden = customVideos.length === 0;
  $("video-remove-btn").textContent = removingVideos ? "✓ Done" : "🗑 Remove";
  $("video-rename-btn").hidden = customVideos.length === 0;
  $("video-rename-btn").textContent = renamingVideos ? "✓ Done" : "✎ Rename";
  $("video-hint").textContent = customVideos.length === 0
    ? "Add favourite videos here in a quiet moment — after that they play instantly, even offline."
    : "";
}

let playingURL = null;

function openVideo(v) {
  playingURL = URL.createObjectURL(v.blob);
  const el = $("video-el");
  el.src = playingURL;
  $("video-player").hidden = false;
  el.play().catch(() => {});
}

function closeVideo() {
  const el = $("video-el");
  el.pause();
  el.removeAttribute("src");
  el.load();
  if (playingURL) URL.revokeObjectURL(playingURL);
  playingURL = null;
  $("video-player").hidden = true;
}

$("videos-btn").addEventListener("click", () => {
  removingVideos = false;
  buildVideoGrid();
  showScreen("screen-videos");
});
$("back-videos").addEventListener("click", () => showScreen("screen-choose"));
$("video-close").addEventListener("click", closeVideo);

/* "📺 TV": ask the phone to beam this video to a cast device (works on
   some Android/Chromecast combinations even for local files); when it
   can't, explain the screen-mirroring route that always works. */
function castHelp() {
  alert(
    "To put this on the TV:\n\n" +
      "1. Swipe down from the top of the phone and tap \"Screen Cast\" " +
      "(on Samsung it's called Smart View).\n" +
      "2. Pick your TV — the phone's screen appears on it.\n" +
      "3. Come back here and press play.\n\n" +
      "Works with Chromecast, Google TV and most smart TVs. " +
      "Plug the phone in for long films."
  );
}

$("video-cast").addEventListener("click", async () => {
  const el = $("video-el");
  if (el.remote && el.remote.prompt) {
    try {
      await el.remote.prompt();
    } catch (_) {
      castHelp();
    }
  } else {
    castHelp();
  }
});
$("video-remove-btn").addEventListener("click", () => {
  removingVideos = !removingVideos;
  renamingVideos = false;
  buildVideoGrid();
});

$("video-rename-btn").addEventListener("click", () => {
  renamingVideos = !renamingVideos;
  removingVideos = false;
  buildVideoGrid();
});

async function handleVideoImport(e) {
  const file = e.target.files && e.target.files[0];
  e.target.value = "";
  if (!file) return;
  $("video-hint").textContent = "Adding… (big films take a minute)";
  const { playable, thumb } = await probeVideo(file);
  if (!playable) {
    $("video-hint").textContent = "";
    alert(
      `This phone can't play "${file.name}".\n\n` +
        "It's usually the codecs inside the file (often HEVC/x265 video or AC3 audio), " +
        "even when the file is an .mp4. A version using H.264/x264 video with AAC audio " +
        "will work — converting on a computer with the free HandBrake app " +
        '("Fast 1080p30" preset) fixes it.'
    );
    buildVideoGrid();
    return;
  }
  const video = {
    id: `video-${Date.now()}`,
    label: cleanVideoName(file.name),
    blob: file,
    thumb,
  };
  try {
    await saveCustomVideo(video);
  } catch (_) {
    $("video-hint").textContent = "Couldn't store that video (not enough space?) — it will play until the app closes.";
  }
  customVideos.push(video);
  buildVideoGrid();
}
$("video-input").addEventListener("change", handleVideoImport);
$("video-input-files").addEventListener("change", handleVideoImport);

$("add-food-btn").addEventListener("click", () => openAddFood(null));
$("edit-foods-btn").addEventListener("click", () => {
  buildEditFoodList();
  showScreen("screen-edit-foods");
});
$("back-add-food").addEventListener("click", () => showScreen("screen-food"));
$("back-edit-foods").addEventListener("click", () => {
  buildFoodGrid(state.foodCategory || "dinner");
  showScreen("screen-food");
});

buildChooseScreen();
buildTimeScreen();
loadCustomFoods();
loadCustomVideos();
loadCustomCharacters().then(() => {
  // a saved photo character can only be resolved once they're loaded
  const saved = customCharacters.find((c) => c.id === savedCharacter);
  if (saved) state.character = saved;
  buildCharacterPicker();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
  // When an update finishes installing, switch to it right away instead of
  // waiting for the next launch — but never mid-countdown or mid-video.
  let reloadedForUpdate = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadedForUpdate) return;
    const idle =
      !state.intervalId &&
      $("screen-choose").classList.contains("active") &&
      $("video-player").hidden;
    if (idle) {
      reloadedForUpdate = true;
      location.reload();
    }
  });
}
$("version-tag").textContent = `v${APP_VERSION}`;
