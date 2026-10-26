// =============================================================
//  BARANGAY GERALD — a tiny top-down RPG about Gerald Mandaue
//  Plain HTML + CSS + vanilla JavaScript. No libraries.
// =============================================================

// ----- Easy settings: fill these in if you want -----
const PHOTO = "photo.jfif";       // path/URL to Gerald's photo (shown in the HUD)
const PLAYER_IMG = "";  // path/URL to an image to use for the player
const MUSIC_FILE = "song.mp3";  // path/URL to an audio file to use instead of the generated music

// ----- ALL DIALOGUE LIVES HERE (easy to edit) -----
// x, y = tile position of the NPC on the map s 
const DIALOGUE = [  
  {
    id: "nena", name: "Aling Nena", x: 28, y: 11, look: "nena",
    lines: [
      "Oy, welcome sa barangay! Ikaw ba yung hinihintay ni Gerald?",
      "Gerald Mandaue ang buong pangalan niya, pero Gerald lang daw ang itawag sa kanya. Wag mo na daw lagyan ng kung anu-ano.",
      "Marami kang makikilala dito, kaya libot ka lang. Bawat isa may kwento tungkol sa kanya.",
    ],
    repeat: "Bili ka na ng kendi habang naglalakad.",
  },
  {
    id: "boy", name: "Kuya Boy", x: 10, y: 6, look: "boy",  
    lines: [
      "Pre, kung Valorant ang usapan, Chamber main yan si Gerald.",
      "Gusto niya yung kalmado lang, tapos pag tumira, sure shot. Ganun daw dapat ang Chamber.",
      "Online games yung pahinga niya after a long day. Kahit ako, hindi ko siya matalo sa ganun, kaya sa basketball na lang ako lumalaban.",
    ],
    repeat: "Isang laro pa, game?",
  },
  {
    id: "cion", name: "Lola Cion", x: 32, y: 22, look: "cion",
    lines: [
      "Alam mo ba, fried chicken ang paboritong pagkain ni Gerald? Sabi niya, best food ever, no debate.",
      "Hindi raw yun ordinaryong ulam. Para sa kanya, yun na yung pinakamataas na level ng pagkain.",
      "Sige na, kain ka muna. Joke lang, wala akong bakanteng upuan ngayon.",
    ],
    repeat: "Wala nang ulam, ubos na yung manok.",
  },
  {
    id: "tonyo", name: "Mang Tonyo", x: 24, y: 19, look: "tonyo",
    lines: [
      "Pasok ka, pero kwento muna. Alam mo ba, Lord of the Rings ang paboritong movie or series ni Gerald?",
      "Yung tipong mahaba ang byahe, marami kang kasama, at may singsing na kailangan itapon. Para sa kanya, yun na yung pinakamagandang kwento.",
      "Hindi pa niya sinasabi kung hobbit o elf siya. Ikaw na magtanong sa kanya.",
    ],
    repeat: "Libre ang sakay, basta sa kwento lang.",
  },
  {
    id: "junjun", name: "Jun-Jun", x: 10, y: 16, look: "junjun",
    lines: [
      "Kuya, nagbabasa ka ba ng manhwa? Yung The Legend of the Northern Blade ang favorite ni Gerald.",
      "Sabi niya, 'one more chapter' daw ang pinakamalaking kasinungalingan niya. Tapos inaabot na siya ng madaling araw.",
      "Hindi pa ako tapos magbasa, kaya wag mo kong i-spoil ha!",
    ],
    repeat: "Saglit lang, malapit na ako sa climax.",
  },
  {
    id: "ador", name: "Manong Ador", x: 35, y: 25, look: "ador",
    lines: [
      "Si Gerald, mahilig yan sa mga misteryo ng universe. Yung mga bagay na hanggang ngayon hindi pa kayang ipaliwanag.",
      "Favorite niya yung theory of everything. Yung idea na may isang paliwanag para sa lahat ng bagay. Ang lalim, noh?",
      "At favorite niyang lugar? Kahit saan basta hindi masikip. Kaya nandito ako sa bench, tahimik.",
    ],
    repeat: "Shhh, ine-enjoy ko yung katahimikan.",
  },
];

// ----- Game constants -----
const TILE = 16;            // pixels per tile
const MAP_W = 40, MAP_H = 28;
const SPEED = 4 * TILE;     // 4 tiles per second
const TALK_RANGE = 3.2;     // tiles
const SPAWN = { x: 20, y: 14 };
const SIGN = { x: 24, y: 12 };
const VIDEOKE = { x: 31, y: 6 };
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Warm afternoon palette
const C = {
  grass: "#7fae4a", grass2: "#6c9a3e", grass3: "#93c057",
  road: "#6b6366", road2: "#5d5658", line: "#e8d27a",
  walk: "#c9b38f", walk2: "#b59d78",
  court: "#c76b3c", court2: "#b45c31", courtLine: "#fff1d6",
  dirt: "#b88b5a",
  wood: "#8a5a2b", wood2: "#6b4220", woodLight: "#b07a3e",
  tin: "#9aa3a8", tin2: "#7b8489", rust: "#a8633a",
  wall: "#e7d3a8", wall2: "#d4bb8a", wallBlue: "#8fb8c9", wallPink: "#e6a3a0",
  dark: "#2a1a24", white: "#fff6e0", yellow: "#f7c948", red: "#d9493a",
  blue: "#3f6fb5", green: "#3f9a55", glass: "#5d8aa0", black: "#1b1418",
};

// =============================================================
//  CANVAS + SCALING
// =============================================================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
let scale = 3, viewW = 320, viewH = 240;

function resize() {
  // pick a whole-number scale so pixels stay crisp
  const w = window.innerWidth, h = window.innerHeight;
  scale = Math.max(2, Math.floor(Math.min(w / 300, h / 210)));
  viewW = Math.ceil(w / scale);
  viewH = Math.ceil(h / scale);
  canvas.width = viewW;
  canvas.height = viewH;
  canvas.style.width = viewW * scale + "px";
  canvas.style.height = viewH * scale + "px";
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener("resize", resize);
resize();

// =============================================================
//  MAP: ground tiles + solid (blocked) tiles
// =============================================================
// ground: 0 grass, 1 road, 2 sidewalk, 3 court, 4 dirt
const ground = [];
const solid = [];
for (let y = 0; y < MAP_H; y++) {
  ground.push(new Array(MAP_W).fill(0));
  solid.push(new Array(MAP_W).fill(false));
}
function fillGround(x, y, w, h, t) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) ground[j][i] = t;
}
function block(x, y, w = 1, h = 1) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) solid[j][i] = true;
}

fillGround(0, 12, MAP_W, 1, 2);   // north sidewalk
fillGround(0, 13, MAP_W, 3, 1);   // main street (3 tiles wide)
fillGround(0, 16, MAP_W, 1, 2);   // south sidewalk
fillGround(19, 0, 3, MAP_H, 1);   // cross street
fillGround(3, 2, 12, 8, 3);       // basketball court
fillGround(26, 10, 6, 2, 4);      // dirt in front of store
fillGround(26, 22, 8, 2, 4);      // dirt in front of karinderya
fillGround(33, 23, 6, 4, 4);      // bench corner

// ----- Static objects. Each has a solid area and a draw function -----
const objects = [];
function addObj(x, y, w, h, draw, solidRect = [x, y, w, h]) {
  objects.push({ x, y, w, h, draw });
  if (solidRect) block(...solidRect);
}

// Sari-sari store
addObj(26, 6, 6, 4, drawStore);
addObj(27, 10, 4, 1, drawCounter);
// Videoke house + speaker + mic
addObj(32, 2, 6, 4, (o) => drawHouse(o, C.wallPink, true));
addObj(31, 5, 1, 1, drawSpeaker);
addObj(33, 6, 1, 1, drawMic);
// Small houses with tin roofs
addObj(24, 2, 4, 3, (o) => drawHouse(o, C.wallBlue));
addObj(2, 19, 5, 4, (o) => drawHouse(o, C.wall));
addObj(12, 22, 5, 3, (o) => drawHouse(o, C.wallBlue));
addObj(2, 24, 4, 3, (o) => drawHouse(o, C.wallPink));
// Karinderya
addObj(26, 18, 6, 4, drawKarinderya);
addObj(27, 22, 4, 1, drawFoodDisplay);
// Basketball hoop
addObj(8, 2, 1, 1, drawHoop);
// Tricycle
addObj(22, 19, 2, 2, drawTricycle);
// Jeepney (decoration, parked east)
addObj(33, 15, 5, 2, drawJeepney);
// Bench + street post
addObj(35, 25, 2, 1, drawBench);
addObj(38, 24, 1, 1, drawPost);
addObj(16, 12, 1, 1, drawPost);
addObj(33, 12, 1, 1, drawPost);
// Skills signboard
addObj(SIGN.x, SIGN.y, 1, 1, drawSign);
// Plants in cans
[[14, 11], [22, 11], [25, 11], [17, 17], [7, 18], [23, 5], [38, 7], [25, 23], [11, 21], [17, 21]].forEach(
  ([x, y]) => addObj(x, y, 1, 1, drawPlant)
);
// NPCs are solid too
DIALOGUE.forEach((n) => block(n.x, n.y));

// =============================================================
//  PIXEL SPRITES (drawn from small text arrays)
// =============================================================
// Player: bald, chubby, round face, thick brows, serious look, jersey "00"
const P_DOWN = [
  ".....kkkkkk.....",
  "....kssssssk....",
  "...kssssssssk...",
  "...kbbbssbbbk...",
  "...ksksssskskk..".slice(0, 16),
  "..kssssSSssssk..",
  "...ksssmmsssk...",
  "....kSSSSSSk....",
  "..kJJjjjjjjJJk..",
  ".kJJjjwwjwwjJJk.",
  ".ksjjjwjjwjjjsk.",
  ".ksjjjwwjwwjjsk.",
  "..kjjjjjjjjjjk..",
  "...khhhhhhhhk...",
  "....kssk.kssk...",
  "....kffk.kffk...",
];
P_DOWN[4] = "...ksksssskskk..".slice(0, 13) + "...";
const P_UP = P_DOWN.slice();
P_UP[3] = "...kssssssssk...";
P_UP[4] = "...kssssssssk...";
P_UP[5] = "..kssssssssssk..";
P_UP[6] = "...kssssssssk...";
P_UP[9] = ".kJJjjwwjwwjJJk.";
const P_SIDE = P_DOWN.slice();
P_SIDE[3] = "...ksssssbbbk...";
P_SIDE[4] = "...kssssssksk...";
P_SIDE[5] = "..ksssssssSSsk..";
P_SIDE[6] = "...ksssssmmsk...";
P_SIDE[9] = ".kJJjjjjjjjjJk..";
P_SIDE[10] = ".kJjjjjjjjjjsk..";
P_SIDE[11] = ".kjjjjjjjjjjsk..";
const P_PAL = {
  k: C.dark, s: "#c98d5e", S: "#a96f45", b: "#1b1418", m: "#7a3b2e",
  j: "#d9493a", J: "#f7c948", w: C.white, h: "#3f6fb5", f: "#2fa86b",
};
// walking legs (two frames)
const LEGS_A = ["....kssk.kffk...", "....kffk........"];
const LEGS_B = ["....kffk.kssk...", ".........kffk..."];

// NPC base template (H hair, s skin, C shirt, P pants)
const NPC_T = [
  "................",
  ".....HHHHHH.....",
  "....HHHHHHHH....",
  "....HssssssH....",
  "....skssssks....",
  "....ssssssss....",
  ".....sskkss.....",
  "......ssss......",
  "....CCCCCCCC....",
  "...CCCCCCCCCC...",
  "...sCCCCCCCCs...",
  "...sCCCCCCCCs...",
  "....PPPPPPPP....",
  "....PPP..PPP....",
  "....sss..sss....",
  "....kkk..kkk....",
];
const NPC_LOOKS = {
  nena: { H: "#3a2418", s: "#d9a06e", C: "#e6739a", P: "#6b4a8a", k: C.dark },
  boy: { H: "#1b1418", s: "#b97a4a", C: "#2f7fd1", P: "#e8e0d0", k: C.dark },
  cion: { H: "#d8d4cc", s: "#c98d5e", C: "#f2e6c8", P: "#7a3b2e", k: C.dark },
  tonyo: { H: "#2a1a10", s: "#a96f45", C: "#5e8c3a", P: "#4a4a5a", k: C.dark },
  junjun: { H: "#1b1418", s: "#c98d5e", C: "#f7c948", P: "#3f6fb5", k: C.dark },
  ador: { H: "#9a9a9a", s: "#b97a4a", C: "#a8633a", P: "#3a3a4a", k: C.dark },
};

// Cache each sprite in a small offscreen canvas so drawing is fast
const spriteCache = {};
function makeSprite(rows, pal, flip = false) {
  const key = rows.join("") + JSON.stringify(pal) + flip;
  if (spriteCache[key]) return spriteCache[key];
  const c = document.createElement("canvas");
  c.width = 16; c.height = rows.length;
  const g = c.getContext("2d");
  rows.forEach((row, y) => {
    for (let x = 0; x < 16; x++) {
      const ch = row[x];
      if (!ch || ch === "." || !pal[ch]) continue;
      g.fillStyle = pal[ch];
      g.fillRect(flip ? 15 - x : x, y, 1, 1);
    }
  });
  spriteCache[key] = c;
  return c;
}

// Optional images from the settings at the top
let playerImg = null;
if (PLAYER_IMG) { playerImg = new Image(); playerImg.src = PLAYER_IMG; }
if (PHOTO) {
  document.getElementById("photo-box").innerHTML = `<img src="${PHOTO}" alt="Gerald" />`;
}

// =============================================================
//  GAME STATE
// =============================================================
const player = {
  x: (SPAWN.x + 0.5) * TILE, y: (SPAWN.y + 0.7) * TILE, // x,y = feet
  dir: "down", moving: false, anim: 0,
};
const cam = { x: 0, y: 0 };
const keys = { up: false, down: false, left: false, right: false };
const talked = {};
let questCount = 0;
let dialog = null; // { npc, lines, index, shown, blipTimer }
let completeShown = false;
let time = 0;

// =============================================================
//  INPUT
// =============================================================
const KEYMAP = {
  ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
};
window.addEventListener("keydown", (e) => {
  startAudio();
  if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = true; e.preventDefault(); }
  if (["KeyE", "Space", "Enter"].includes(e.code)) {
    if (document.activeElement && document.activeElement.tagName === "BUTTON" && e.code !== "KeyE") return;
    e.preventDefault();
    if (!e.repeat) action();
  }
});
window.addEventListener("keyup", (e) => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; });
window.addEventListener("blur", () => { for (const k in keys) keys[k] = false; });
window.addEventListener("pointerdown", startAudio);

// Touch controls on phones/tablets
const isTouch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
if (isTouch) document.body.classList.add("touch");
document.querySelectorAll("#dpad .tbtn").forEach((b) => {
  const k = b.dataset.key;
  const on = (e) => { e.preventDefault(); startAudio(); keys[k] = true; b.classList.add("down"); };
  const off = (e) => { e.preventDefault(); keys[k] = false; b.classList.remove("down"); };
  b.addEventListener("pointerdown", on);
  b.addEventListener("pointerup", off);
  b.addEventListener("pointerleave", off);
  b.addEventListener("pointercancel", off);
});
const abtn = document.getElementById("abtn");
abtn.addEventListener("pointerdown", (e) => { e.preventDefault(); startAudio(); abtn.classList.add("down"); action(); });
abtn.addEventListener("pointerup", () => abtn.classList.remove("down"));
abtn.addEventListener("pointerleave", () => abtn.classList.remove("down"));

// =============================================================
//  MOVEMENT + COLLISION
// =============================================================
function isSolidTile(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
  return solid[ty][tx];
}
// player hitbox around the feet
function hits(x, y) {
  const l = x - 5, r = x + 5, t = y - 5, b = y - 1;
  return (
    isSolidTile(Math.floor(l / TILE), Math.floor(t / TILE)) ||
    isSolidTile(Math.floor(r / TILE), Math.floor(t / TILE)) ||
    isSolidTile(Math.floor(l / TILE), Math.floor(b / TILE)) ||
    isSolidTile(Math.floor(r / TILE), Math.floor(b / TILE))
  );
}
// Safety net: if the player is ever inside something, move them to the nearest free tile
function unstick() {
  if (!hits(player.x, player.y)) return;
  const sx = Math.floor(player.x / TILE), sy = Math.floor(player.y / TILE);
  for (let r = 1; r < 20; r++) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const tx = sx + dx, ty = sy + dy;
      if (!isSolidTile(tx, ty)) {
        const nx = (tx + 0.5) * TILE, ny = (ty + 0.7) * TILE;
        if (!hits(nx, ny)) { player.x = nx; player.y = ny; return; }
      }
    }
  }
}

function updatePlayer(dt) {
  let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  let dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  player.moving = dx !== 0 || dy !== 0;
  if (player.moving) {
    if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
    if (Math.abs(dx) > Math.abs(dy)) player.dir = dx > 0 ? "right" : "left";
    else player.dir = dy > 0 ? "down" : "up";
    const nx = player.x + dx * SPEED * dt;
    const ny = player.y + dy * SPEED * dt;
    // move each axis on its own so we slide along walls
    if (!hits(nx, player.y)) player.x = nx;
    if (!hits(player.x, ny)) player.y = ny;
    player.anim += dt;
  } else {
    player.anim = 0;
  }
  unstick();
}

function updateCamera() {
  const mw = MAP_W * TILE, mh = MAP_H * TILE;
  cam.x = Math.round(player.x - viewW / 2);
  cam.y = Math.round(player.y - 8 - viewH / 2);
  cam.x = mw <= viewW ? Math.round((mw - viewW) / 2) : Math.max(0, Math.min(mw - viewW, cam.x));
  cam.y = mh <= viewH ? Math.round((mh - viewH) / 2) : Math.max(0, Math.min(mh - viewH, cam.y));
}

function distTiles(tx, ty) {
  const px = player.x / TILE, py = player.y / TILE - 0.2;
  return Math.hypot(px - (tx + 0.5), py - (ty + 0.5));
}
function nearestNPC() {
  let best = null, bd = TALK_RANGE;
  for (const n of DIALOGUE) {
    const d = distTiles(n.x, n.y);
    if (d < bd) { bd = d; best = n; }
  }
  return best;
}

// =============================================================
//  DIALOGUE + QUEST
// =============================================================
const el = (id) => document.getElementById(id);
const dlgBox = el("dialogue"), dlgName = el("dlg-name"), dlgText = el("dlg-text"), dlgNext = el("dlg-next");

function action() {
  if (completeShown) return;
  if (dialog) {
    const line = dialog.lines[dialog.index];
    if (dialog.shown < line.length) { dialog.shown = line.length; return; } // finish typing
    dialog.index++;
    if (dialog.index >= dialog.lines.length) closeDialog();
    else dialog.shown = 0;
    return;
  }
  const npc = nearestNPC();
  if (npc) openDialog(npc);
}

function openDialog(npc) {
  const first = !talked[npc.id];
  dialog = { npc, lines: first ? npc.lines : [npc.repeat], index: 0, shown: 0, blip: 0 };
  dlgName.textContent = npc.name;
  dlgBox.style.display = "block";
  if (first) {
    talked[npc.id] = true;
    questCount++;
    el("quest-count").textContent = questCount + "/6";
    const q = el("quest");
    q.classList.add("flash");
    setTimeout(() => q.classList.remove("flash"), 300);
    const p = el("plus-one");
    p.classList.remove("show"); void p.offsetWidth; p.classList.add("show");
    playChime();
  }
}

function closeDialog() {
  dialog = null;
  dlgBox.style.display = "none";
  if (questCount >= 6 && !completeShown) showComplete();
}

function updateDialog(dt) {
  if (!dialog) return;
  // walking away closes the box
  if (distTiles(dialog.npc.x, dialog.npc.y) > TALK_RANGE + 1.2) { closeDialog(); return; }
  const line = dialog.lines[dialog.index];
  if (dialog.shown < line.length) {
    const before = Math.floor(dialog.shown);
    dialog.shown = Math.min(line.length, dialog.shown + dt * 45);
    if (Math.floor(dialog.shown / 3) !== Math.floor(before / 3)) playBlip();
  }
  dlgText.textContent = line.slice(0, Math.floor(dialog.shown));
  dlgNext.style.visibility = dialog.shown >= line.length ? "visible" : "hidden";
}

function showComplete() {
  completeShown = true;
  el("complete").classList.add("show");
  el("again").focus();
  playChime(); setTimeout(playChime, 250);
  const box = el("confetti");
  const colors = [C.yellow, C.red, "#7ee0ff", "#8cff7a", "#ff9ad5", C.white];
  for (let i = 0; i < 90; i++) {
    const b = document.createElement("div");
    b.className = "bit";
    b.style.left = Math.random() * 100 + "vw";
    b.style.background = colors[i % colors.length];
    b.style.animationDuration = 2 + Math.random() * 2.5 + "s";
    b.style.animationDelay = Math.random() * 1.2 + "s";
    box.appendChild(b);
  }
  setTimeout(() => (box.innerHTML = ""), 6000);
}

el("again").addEventListener("click", () => {
  for (const k in talked) delete talked[k];
  questCount = 0;
  el("quest-count").textContent = "0/6";
  el("complete").classList.remove("show");
  completeShown = false;
  canvas.focus && canvas.focus();
  showToast("New quest: Get to know Gerald. Talk to 6 people around the barangay.");
});

let toastTimer = null;
function showToast(msg) {
  const t = el("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 4500);
}
setTimeout(() => showToast("New quest: Get to know Gerald. Talk to 6 people around the barangay."), 2000);

// HUD hint + skills card
function updateHUD() {
  const npc = nearestNPC();
  el("hint").style.display = npc && !dialog && !completeShown ? "block" : "none";
  el("skills").style.display = distTiles(SIGN.x, SIGN.y) < 2.6 && !dialog ? "block" : "none";
}

// =============================================================
//  SOUND (Web Audio API)
// =============================================================
let actx = null, master = null, musicBus = null, sfxBus = null, musicEl = null;
let muted = false, musicTimer = null, nextNoteTime = 0, step = 0;

function startAudio() {
  if (actx) { if (actx.state === "suspended") actx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  actx = new AC();
  master = actx.createGain();
  master.gain.value = muted ? 0 : 1;
  master.connect(actx.destination);
  sfxBus = actx.createGain(); sfxBus.gain.value = 0.5; sfxBus.connect(master);
  // warm lowpass so the music sounds like an old radio
  const lp = actx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2200;
  lp.connect(master);
  musicBus = actx.createGain(); musicBus.gain.value = 0.15; musicBus.connect(lp);

  if (MUSIC_FILE) {
    musicEl = new Audio(MUSIC_FILE);
    musicEl.loop = true; musicEl.volume = 0.15;
    musicEl.muted = muted;
    musicEl.play().catch(() => {});
  } else {
    nextNoteTime = actx.currentTime + 0.1;
    musicTimer = setInterval(scheduleMusic, 50);
  }
}

function tone(freq, start, dur, vol, type = "triangle", bus = musicBus) {
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g); g.connect(bus);
  o.start(start); o.stop(start + dur + 0.05);
  return o;
}
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Original doo-wop style loop: I - vi - IV - V in C, 12/8 triplet feel
const EIGHTH = 0.22;
const CHORDS = [[60, 64, 67], [57, 60, 64], [57, 60, 65], [55, 59, 62]];
const BASS = [36, 33, 41, 43];
const MELODY = [
  [[0, 72, 3], [3, 74, 3], [6, 76, 6]],
  [[0, 76, 3], [3, 74, 3], [6, 72, 6]],
  [[0, 69, 3], [3, 72, 3], [6, 77, 3], [9, 76, 3]],
  [[0, 74, 6], [6, 71, 3], [9, 67, 3]],
  [[0, 67, 3], [3, 72, 3], [6, 76, 3], [9, 79, 3]],
  [[0, 76, 6], [6, 72, 6]],
  [[0, 77, 3], [3, 76, 3], [6, 74, 3], [9, 72, 3]],
  [[0, 74, 9], [9, 71, 3]],
];
function scheduleMusic() {
  while (nextNoteTime < actx.currentTime + 0.25) {
    const bar = Math.floor(step / 12) % 8, s = step % 12;
    const ci = bar % 4, t = nextNoteTime;
    // soft piano triplets
    CHORDS[ci].forEach((m) => tone(mtof(m), t, 0.2, s % 3 === 0 ? 0.035 : 0.02));
    // walking bass
    if (s === 0) tone(mtof(BASS[ci]), t, 0.6, 0.18, "sine");
    if (s === 6) tone(mtof(BASS[ci] + 7), t, 0.5, 0.15, "sine");
    if (s === 9) tone(mtof(BASS[ci] + 12), t, 0.4, 0.12, "sine");
    // melody with a little vibrato, like a "doo" voice
    MELODY[bar].forEach(([at, m, len]) => {
      if (at === s) {
        const o = tone(mtof(m), t, len * EIGHTH * 0.95, 0.06, "sine");
        const lfo = actx.createOscillator(), lg = actx.createGain();
        lfo.frequency.value = 5.5; lg.gain.value = 4;
        lfo.connect(lg); lg.connect(o.frequency);
        lfo.start(t); lfo.stop(t + len * EIGHTH);
      }
    });
    // light brushed beat on 2 and 4 of the 12/8 bar
    if (s === 3 || s === 9) noise(t, 0.06, 0.03);
    nextNoteTime += EIGHTH;
    step++;
  }
}
let noiseBuf = null;
function noise(t, dur, vol) {
  if (!noiseBuf) {
    noiseBuf = actx.createBuffer(1, actx.sampleRate * 0.2, actx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = actx.createBufferSource(), g = actx.createGain(), f = actx.createBiquadFilter();
  f.type = "highpass"; f.frequency.value = 3000;
  src.buffer = noiseBuf;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(musicBus);
  src.start(t); src.stop(t + dur);
}

function playBlip() {
  if (!actx) return;
  tone(700 + Math.random() * 120, actx.currentTime, 0.04, 0.05, "square", sfxBus);
}
function playChime() {
  if (!actx) return;
  const t = actx.currentTime;
  [880, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.08, 0.35, 0.12, "sine", sfxBus));
}

// Music gets louder near the videoke house
function updateMusicVolume() {
  const d = distTiles(VIDEOKE.x, VIDEOKE.y);
  const vol = 0.12 + 0.88 * Math.max(0, 1 - d / 14);
  if (musicEl) musicEl.volume = Math.min(1, vol * 0.8);
  else if (musicBus) musicBus.gain.setTargetAtTime(vol * 0.7, actx.currentTime, 0.3);
}

const muteBtn = el("mute");
muteBtn.addEventListener("click", (e) => {
  startAudio();
  muted = !muted;
  if (master) master.gain.setTargetAtTime(muted ? 0 : 1, actx.currentTime, 0.05);
  if (musicEl) musicEl.muted = muted;
  muteBtn.textContent = muted ? "SOUND: OFF" : "SOUND: ON";
  muteBtn.setAttribute("aria-label", muted ? "Unmute sound" : "Mute sound");
  muteBtn.blur();
});

// =============================================================
//  DRAWING HELPERS (all positions in world pixels)
// =============================================================
function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x - cam.x), Math.round(y - cam.y), w, h); }
const px = (t) => t * TILE;
// small hash so grass details stay the same every frame
const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;

function drawGround() {
  const x0 = Math.max(0, Math.floor(cam.x / TILE)), y0 = Math.max(0, Math.floor(cam.y / TILE));
  const x1 = Math.min(MAP_W - 1, Math.floor((cam.x + viewW) / TILE)), y1 = Math.min(MAP_H - 1, Math.floor((cam.y + viewH) / TILE));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const t = ground[y][x], X = px(x), Y = px(y), h = hash(x, y);
    if (t === 0) {
      R(X, Y, 16, 16, C.grass);
      R(X + (h % 13), Y + ((h >> 4) % 13), 2, 1, C.grass2);
      R(X + ((h >> 8) % 12), Y + ((h >> 12) % 12), 1, 2, C.grass3);
      if (h % 7 === 0) R(X + 6, Y + 8, 2, 2, "#f2d06b"); // tiny flower
    } else if (t === 1) {
      R(X, Y, 16, 16, C.road);
      if (h % 3 === 0) R(X + (h % 14), Y + ((h >> 5) % 14), 2, 1, C.road2);
      if (y === 14 && (x < 19 || x > 21) && x % 2 === 0) R(X + 2, Y + 7, 10, 2, C.line);
      if (x === 20 && (y < 13 || y > 15) && y % 2 === 0) R(X + 7, Y + 2, 2, 10, C.line);
    } else if (t === 2) {
      R(X, Y, 16, 16, C.walk);
      R(X, Y + 15, 16, 1, C.walk2); R(X + 15, Y, 1, 16, C.walk2);
    } else if (t === 3) {
      R(X, Y, 16, 16, (x + y) % 2 ? C.court : C.court2);
    } else {
      R(X, Y, 16, 16, C.dirt);
      if (h % 4 === 0) R(X + (h % 12), Y + ((h >> 3) % 12), 2, 2, "#a07848");
    }
  }
  // court lines
  const cx = px(3), cy = px(2), cw = px(12), ch = px(8);
  R(cx, cy, cw, 1, C.courtLine); R(cx, cy + ch - 1, cw, 1, C.courtLine);
  R(cx, cy, 1, ch, C.courtLine); R(cx + cw - 1, cy, 1, ch, C.courtLine);
  R(cx + cw / 2, cy, 1, ch, C.courtLine);
  R(px(6), cy, 1, px(3), C.courtLine); R(px(11), cy, 1, px(3), C.courtLine); R(px(6), px(5), px(5), 1, C.courtLine);
}

function tinRoof(x, y, w, h) {
  R(x - 2, y, w + 4, h, C.tin);
  for (let i = 0; i < w + 4; i += 4) R(x - 2 + i, y, 1, h, C.tin2);
  R(x - 2, y + h - 2, w + 4, 2, C.tin2);
  R(x + 6, y + 3, 6, 3, C.rust); R(x + w - 14, y + h - 7, 5, 3, C.rust);
}
function drawHouse(o, wallColor, videoke) {
  const x = px(o.x), y = px(o.y), w = px(o.w), h = px(o.h);
  R(x, y + 14, w, h - 14, wallColor);
  R(x, y + h - 2, w, 2, C.wall2);
  tinRoof(x, y, w, 16);
  // door + windows
  R(x + w / 2 - 6, y + h - 22, 12, 22, C.wood2);
  R(x + w / 2 + 3, y + h - 12, 2, 2, C.yellow);
  R(x + 6, y + 22, 12, 10, C.glass); R(x + 6, y + 26, 12, 1, C.wood);
  if (w > 50) { R(x + w - 18, y + 22, 12, 10, C.glass); R(x + w - 18, y + 26, 12, 1, C.wood); }
  if (videoke) {
    // little sign "VIDEOKE"
    R(x + 8, y + h - 34, 36, 8, C.dark);
    text("VIDEOKE", x + 26, y + h - 27, "#ff9ad5", 5);
  }
}
function drawStore(o) {
  const x = px(o.x), y = px(o.y), w = px(o.w), h = px(o.h);
  R(x, y + 14, w, h - 14, C.wall);
  tinRoof(x, y, w, 14);
  // sign
  R(x + 8, y + 16, w - 16, 12, C.red);
  R(x + 8, y + 16, w - 16, 1, C.yellow); R(x + 8, y + 27, w - 16, 1, C.yellow);
  text("SARI-SARI STORE", x + w / 2, y + 25, C.white, 6);
  // grill window with goods
  R(x + 6, y + 31, w - 12, h - 33, C.dark);
  for (let i = 0; i < w - 12; i += 6) {
    R(x + 7 + i, y + 34, 4, 5, ["#f7c948", "#e6739a", "#7ee0ff", "#8cff7a"][(i / 6) % 4]);
    R(x + 8 + i, y + 42, 3, 6, ["#d9493a", "#fff6e0", "#3f6fb5"][(i / 6) % 3]);
  }
  for (let i = 0; i < w - 12; i += 4) R(x + 6 + i, y + 31, 1, h - 33, C.tin2);
}
function drawCounter(o) {
  const x = px(o.x), y = px(o.y);
  R(x, y + 2, px(o.w), 14, C.wood); R(x, y + 2, px(o.w), 3, C.woodLight);
  // candy jars
  for (let i = 0; i < 4; i++) {
    R(x + 6 + i * 15, y - 4, 7, 7, "#cfe9f0");
    R(x + 7 + i * 15, y - 1, 5, 3, ["#f7c948", "#e6739a", "#8cff7a", "#d9493a"][i]);
    R(x + 6 + i * 15, y - 5, 7, 2, C.red);
  }
}
function drawSpeaker(o) {
  const x = px(o.x), y = px(o.y);
  R(x + 2, y - 6, 12, 22, C.black);
  R(x + 5, y - 3, 6, 6, "#4a4048"); R(x + 4, y + 6, 8, 8, "#4a4048"); R(x + 6, y + 8, 4, 4, C.black);
  if (!REDUCED && Math.sin(time * 9) > 0) R(x + 15, y + 2, 2, 6, C.yellow); // sound pulse
  // music notes floating up
  const n = (time * 0.8) % 1;
  if (!REDUCED) text("♪", x + 18 + Math.sin(time * 3) * 2, y - 2 - n * 18, "#ff9ad5", 8);
}
function drawMic(o) {
  const x = px(o.x), y = px(o.y);
  R(x + 7, y - 2, 2, 16, "#4a4048"); R(x + 4, y + 13, 8, 2, "#4a4048");
  R(x + 6, y - 6, 4, 5, "#9aa3a8");
}
function drawKarinderya(o) {
  const x = px(o.x), y = px(o.y), w = px(o.w), h = px(o.h);
  R(x, y + 14, w, h - 14, C.wall2);
  tinRoof(x, y, w, 14);
  // striped awning
  for (let i = 0; i < w; i += 8) R(x + i, y + 14, 8, 8, (i / 8) % 2 ? C.white : C.green);
  R(x + 8, y + 26, w - 16, 10, C.dark);
  text("KARINDERYA", x + w / 2, y + 34, C.yellow, 6);
  R(x + 8, y + 40, 18, 20, C.wood2);
}
function drawFoodDisplay(o) {
  const x = px(o.x), y = px(o.y), w = px(o.w);
  R(x, y + 4, w, 12, C.wood); R(x, y, w, 6, "#cfe9f0"); R(x, y, w, 1, C.white);
  // pots of ulam (fried chicken!)
  for (let i = 0; i < 4; i++) {
    R(x + 3 + i * 15, y + 1, 11, 4, "#9aa3a8");
    R(x + 4 + i * 15, y + 1, 9, 2, ["#c9822a", "#7a3b2e", "#d9a03a", "#5e8c3a"][i]);
  }
}
function drawHoop(o) {
  const x = px(o.x), y = px(o.y);
  R(x + 7, y - 6, 3, 22, "#4a4048");
  R(x - 2, y - 12, 20, 10, C.white); R(x + 4, y - 9, 8, 5, C.red); R(x + 5, y - 8, 6, 3, C.white);
  R(x + 3, y - 2, 10, 2, "#e8622a"); R(x + 4, y, 1, 4, C.white); R(x + 8, y, 1, 4, C.white); R(x + 11, y, 1, 4, C.white);
  // a ball on the court
  R(px(6) + 4, px(7) + 6, 6, 6, "#e8622a"); R(px(6) + 6, px(7) + 6, 1, 6, C.dark);
}
function drawTricycle(o) {
  const x = px(o.x), y = px(o.y);
  // sidecar
  R(x + 2, y + 2, 20, 18, C.blue); R(x + 2, y + 2, 20, 3, C.white);
  R(x + 4, y + 7, 14, 7, C.glass); R(x, y, 24, 3, C.red);
  // motorcycle
  R(x + 22, y + 8, 8, 10, C.red); R(x + 24, y + 4, 6, 4, C.dark);
  // wheels
  R(x + 4, y + 22, 7, 7, C.black); R(x + 6, y + 24, 3, 3, C.tin);
  R(x + 23, y + 22, 7, 7, C.black); R(x + 25, y + 24, 3, 3, C.tin);
  text("TODA", x + 12, y + 18, C.yellow, 5);
}
function drawJeepney(o) {
  const x = px(o.x), y = px(o.y), w = px(o.w);
  R(x + 4, y - 6, w - 8, 6, C.tin); // roof rack
  R(x, y, w, 26, "#e8e0d0"); // chrome body
  R(x, y + 4, w, 4, C.red); R(x, y + 8, w, 2, C.yellow); R(x, y + 10, w, 2, C.blue);
  for (let i = 0; i < 6; i++) R(x + 8 + i * 11, y + 13, 8, 6, C.glass);
  R(x + w - 8, y + 2, 8, 20, "#cfd4d8"); R(x + w - 6, y + 4, 4, 4, C.yellow);
  // horse ornament
  R(x + w - 4, y - 4, 3, 4, "#d8d4cc");
  R(x + 10, y + 24, 9, 8, C.black); R(x + w - 22, y + 24, 9, 8, C.black);
  R(x + 13, y + 27, 3, 3, C.tin); R(x + w - 19, y + 27, 3, 3, C.tin);
  text("BARANGAY", x + w / 2 - 4, y + 23, C.red, 5);
}
function drawBench(o) {
  const x = px(o.x), y = px(o.y);
  R(x, y + 2, 32, 4, C.woodLight); R(x, y + 6, 32, 3, C.wood);
  R(x + 2, y + 9, 3, 7, C.wood2); R(x + 27, y + 9, 3, 7, C.wood2);
  R(x, y - 6, 32, 3, C.wood); // backrest
}
const POSTS = [[16, 12], [33, 12], [38, 24]];
function drawPost(o) {
  const x = px(o.x), y = px(o.y);
  R(x + 6, y - 34, 4, 50, "#7b6a58");
  R(x + 1, y - 32, 14, 2, "#5a4a3a");
  R(x + 3, y - 28, 4, 4, "#4a4048"); // transformer
  if (o.x === 38) { R(x + 8, y - 30, 6, 2, "#5a4a3a"); R(x + 12, y - 28, 4, 3, "#fff3a0"); }
}
function drawCables() {
  // sagging wires between posts
  ctx.fillStyle = C.black;
  for (let i = 0; i < POSTS.length - 1; i++) {
    const [ax, ay] = POSTS[i], [bx, by] = POSTS[i + 1];
    const x1 = px(ax) + 8, y1 = px(ay) - 32, x2 = px(bx) + 8, y2 = px(by) - 32;
    for (let k = 0; k <= 1; k++) {
      const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1));
      for (let s = 0; s <= steps; s += 1) {
        const t = s / steps;
        const sag = Math.sin(t * Math.PI) * (12 + k * 4);
        ctx.fillRect(Math.round(x1 + (x2 - x1) * t - cam.x), Math.round(y1 + (y2 - y1) * t + sag + k * 3 - cam.y), 1, 1);
      }
    }
  }
}
function drawSign(o) {
  const x = px(o.x), y = px(o.y);
  R(x + 3, y + 2, 2, 14, C.wood2); R(x + 11, y + 2, 2, 14, C.wood2);
  R(x - 4, y - 10, 24, 14, C.wood); R(x - 4, y - 10, 24, 2, C.woodLight); R(x - 4, y + 2, 24, 2, C.wood2);
  text("SKILLS", x + 8, y - 1, C.yellow, 5);
  // sparkle so people notice it
  const t = REDUCED ? 0.5 : (Math.sin(time * 4) + 1) / 2;
  const sx = x + 18, sy = y - 14;
  if (t > 0.3) {
    R(sx, sy - 2, 1, 5, C.white); R(sx - 2, sy, 5, 1, C.white);
    if (t > 0.7) { R(sx - 3, sy, 1, 1, C.yellow); R(sx + 3, sy, 1, 1, C.yellow); R(sx, sy - 3, 1, 1, C.yellow); R(sx, sy + 3, 1, 1, C.yellow); }
  }
}
function drawPlant(o) {
  const x = px(o.x), y = px(o.y);
  R(x + 4, y + 8, 8, 8, C.tin); R(x + 4, y + 8, 8, 2, C.tin2); R(x + 5, y + 11, 6, 2, C.rust);
  R(x + 3, y + 2, 4, 6, C.green); R(x + 8, y, 4, 8, "#2f8a45"); R(x + 6, y + 4, 4, 5, C.green);
  if (hash(o.x, o.y) % 2) R(x + 9, y + 1, 2, 2, "#ff6b9a");
}
function text(str, x, y, color, size) {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.textAlign = "center";
  ctx.fillText(str, Math.round(x - cam.x), Math.round(y - cam.y));
}

// ----- Characters -----
function drawPlayer() {
  const x = Math.round(player.x - 8 - cam.x);
  const walkPhase = player.moving ? Math.floor(player.anim * 8) % 2 : -1;
  const bob = player.moving ? (walkPhase ? -1 : 0) : (REDUCED ? 0 : Math.round(Math.sin(time * 2) * 0.5));
  const waddle = player.moving ? (walkPhase ? 1 : -1) : 0; // chubby side-to-side waddle
  const y = Math.round(player.y - 16 - cam.y) + bob;
  // shadow
  ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(x + 3, Math.round(player.y - cam.y) - 2, 10, 3);
  if (playerImg && playerImg.complete && playerImg.naturalWidth) {
    ctx.drawImage(playerImg, x + waddle, y, 16, 16);
    return;
  }
  let rows = player.dir === "up" ? P_UP : player.dir === "down" ? P_DOWN : P_SIDE;
  if (walkPhase >= 0) {
    rows = rows.slice();
    const legs = walkPhase ? LEGS_A : LEGS_B;
    rows[14] = legs[0]; rows[15] = legs[1];
  }
  ctx.drawImage(makeSprite(rows, P_PAL, player.dir === "left"), x + waddle, y);
}

function drawNPC(n) {
  const pal = NPC_LOOKS[n.look];
  let rows = NPC_T;
  const X = px(n.x), Y = px(n.y);
  const breathe = REDUCED ? 0 : Math.round((Math.sin(time * 2 + n.x) + 1) / 2);
  ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(X + 3 - cam.x, Y + 13 - cam.y, 10, 3);
  if (n.look === "junjun" || n.look === "ador") {
    // sitting: hide the legs, draw lower
    rows = NPC_T.slice(0, 13).concat(["....PPPPPPPP....", "....kk....kk...."]);
  }
  const yOff = n.look === "junjun" ? 2 : n.look === "ador" ? -6 : -2;
  ctx.drawImage(makeSprite(rows, pal), Math.round(X - cam.x), Math.round(Y + yOff - cam.y) + breathe);
  if (n.look === "junjun") R(X + 7, Y + yOff + 9 + breathe, 3, 4, "#7ee0ff"); // phone glow
  if (n.look === "cion") R(X + 4, Y - 2 + 8 + breathe, 8, 6, C.white); // apron
  if (n.look === "boy") R(X + 12, Y + 6, 5, 5, "#e8622a"); // ball
}

// "!" or check mark above NPCs
function drawMarker(n) {
  const X = px(n.x) + 8 - cam.x, Y = px(n.y) - 14 - cam.y;
  const bounce = REDUCED ? 0 : Math.round(Math.abs(Math.sin(time * 5 + n.x)) * -4);
  const near = distTiles(n.x, n.y) < TALK_RANGE;
  const y = Math.round(Y + bounce);
  if (talked[n.id]) {
    ctx.fillStyle = C.dark; ctx.fillRect(X - 5, y - 6, 11, 10);
    ctx.fillStyle = "#8cff7a";
    [[-3, 0], [-2, 1], [-1, 2], [0, 1], [1, 0], [2, -1], [3, -2]].forEach(([dx, dy]) => ctx.fillRect(X + dx, y + dy, 2, 2));
    return;
  }
  const s = near ? 2 : 1.5;
  ctx.fillStyle = C.dark; ctx.fillRect(X - 4 * s, y - 9 * s, 8 * s, 12 * s);
  ctx.fillStyle = C.yellow; ctx.fillRect(X - 3 * s, y - 8 * s, 6 * s, 10 * s);
  ctx.fillStyle = C.dark; ctx.fillRect(X - 1 * s, y - 7 * s, 2 * s, 5 * s); ctx.fillRect(X - 1 * s, y - 1 * s, 2 * s, 2 * s);
}

function render() {
  ctx.fillStyle = "#4a6b2a";
  ctx.fillRect(0, 0, viewW, viewH);
  drawGround();
  // draw objects and characters sorted by their bottom edge for simple depth
  const list = objects.map((o) => ({ y: px(o.y + o.h), draw: () => o.draw(o) }));
  DIALOGUE.forEach((n) => list.push({ y: px(n.y + 1), draw: () => drawNPC(n) }));
  list.push({ y: player.y, draw: drawPlayer });
  list.sort((a, b) => a.y - b.y);
  list.forEach((it) => it.draw());
  drawCables();
  DIALOGUE.forEach(drawMarker);
  // warm afternoon tint
  ctx.fillStyle = "rgba(255, 170, 80, 0.08)";
  ctx.fillRect(0, 0, viewW, viewH);
}

// =============================================================
//  MAIN LOOP
// =============================================================
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  time += dt;
  if (!completeShown) updatePlayer(dt);
  updateCamera();
  updateDialog(dt);
  updateHUD();
  updateMusicVolume();
  render();
  requestAnimationFrame(loop);
}
unstick();
requestAnimationFrame(loop);
