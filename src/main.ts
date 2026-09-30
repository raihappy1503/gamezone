import "./style.css";

const games = [
  { name: "Snake", icon: "🐍", category: "Arcade" },
  { name: "Tetris", icon: "🧱", category: "Puzzle" },
  { name: "Racing", icon: "🏎️", category: "Racing" },
  { name: "Quiz", icon: "🧠", category: "Brain" },
];


// =========================
// HOME PAGE
// =========================

function showHome() {

  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `

    <header>
      <div class="logo">🎮 GameZone</div>

      <nav>
        <a>Home</a>
        <a>Games</a>
        <a>Categories</a>
        <button>Login</button>
      </nav>
    </header>

    <main>

      <section class="hero">

        <div>
          <p>WELCOME TO GAMEZONE</p>

          <h1>
            Play.<br>
            <span>Compete.</span><br>
            Have Fun.
          </h1>

          <div class="subtitle">
            Play browser games instantly. No download required.
          </div>

          <button class="explore">
            🚀 Explore Games
          </button>
        </div>

        <div class="hero-icon">
          🎮
        </div>

      </section>

      <section>

        <div class="title">
          <h2>🔥 Popular Games</h2>
          <span>View All →</span>
        </div>

        <div class="games">

          ${games.map(game => `

            <div class="card">

              <div class="game-icon">
                ${game.icon}
              </div>

              <div class="card-content">

                <h3>${game.name}</h3>

                <p>${game.category}</p>

                <button
                  class="play"
                  data-game="${game.name}">
                  Play Now ▶
                </button>

              </div>

            </div>

          `).join("")}

        </div>

      </section>

    </main>
  `;


  document
    .querySelectorAll<HTMLButtonElement>(".play")
    .forEach((button) => {

      button.addEventListener("click", () => {

        const game = button.dataset.game;

        if (game === "Snake") {
          showSnake();
        }

        if (game === "Tetris") {
          alert("Tetris coming soon 🎮");
        }

        if (game === "Racing") {
          showRacing();
        }

        if (game === "Quiz") {
          alert("Quiz coming soon 🧠");
        }

      });

    });

}


// =========================
// SNAKE GAME
// =========================

function showSnake() {

  let snake = [{ x: 10, y: 10 }];

  let food = { x: 15, y: 10 };

  let direction = "RIGHT";

  let score = 0;

  let gameOver = false;


  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `

    <div class="snake-page">

      <button id="backGame" class="back">
        ← Back to GameZone
      </button>

      <h1>🐍 Snake Game</h1>

      <div class="score">
        Score:
        <span id="snakeScore">0</span>
      </div>

      <div id="snakeBoard" class="snake-board"></div>

      <div id="snakeMessage"></div>

      <p class="instructions">
        PC: Arrow Keys / WASD | Mobile: Buttons
      </p>

      <div class="mobile-controls">

        <button class="direction-btn" data-dir="UP">
          ⬆️
        </button>

        <div>

          <button class="direction-btn" data-dir="LEFT">
            ⬅️
          </button>

          <button class="direction-btn" data-dir="DOWN">
            ⬇️
          </button>

          <button class="direction-btn" data-dir="RIGHT">
            ➡️
          </button>

        </div>

      </div>

    </div>

  `;


  document
    .querySelector("#backGame")
    ?.addEventListener("click", showHome);


  function drawBoard() {

    const board =
      document.querySelector<HTMLDivElement>("#snakeBoard");

    if (!board) return;

    board.innerHTML = "";

    for (let y = 0; y < 20; y++) {

      for (let x = 0; x < 20; x++) {

        const cell = document.createElement("div");

        cell.className = "snake-cell";

        const snakePart = snake.some(
          part => part.x === x && part.y === y
        );

        if (snakePart) {
          cell.classList.add("snake-body");
        }

        if (food.x === x && food.y === y) {
          cell.classList.add("snake-food");
        }

        board.appendChild(cell);
      }
    }

    const scoreElement =
      document.querySelector("#snakeScore");

    if (scoreElement) {
      scoreElement.textContent = score.toString();
    }

  }


  function changeDirection(newDirection: string) {

    if (
      newDirection === "UP" &&
      direction !== "DOWN"
    ) {
      direction = "UP";
    }

    if (
      newDirection === "DOWN" &&
      direction !== "UP"
    ) {
      direction = "DOWN";
    }

    if (
      newDirection === "LEFT" &&
      direction !== "RIGHT"
    ) {
      direction = "LEFT";
    }

    if (
      newDirection === "RIGHT" &&
      direction !== "LEFT"
    ) {
      direction = "RIGHT";
    }

  }


  document
    .querySelectorAll<HTMLButtonElement>(".direction-btn")
    .forEach(button => {

      button.addEventListener("click", event => {

        event.preventDefault();

        const newDirection = button.dataset.dir;

        if (newDirection) {
          changeDirection(newDirection);
        }

      });

    });


  function handleKey(event: KeyboardEvent) {

    if (
      event.key === "ArrowUp" ||
      event.key === "w" ||
      event.key === "W"
    ) {
      event.preventDefault();
      changeDirection("UP");
    }

    if (
      event.key === "ArrowDown" ||
      event.key === "s" ||
      event.key === "S"
    ) {
      event.preventDefault();
      changeDirection("DOWN");
    }

    if (
      event.key === "ArrowLeft" ||
      event.key === "a" ||
      event.key === "A"
    ) {
      event.preventDefault();
      changeDirection("LEFT");
    }

    if (
      event.key === "ArrowRight" ||
      event.key === "d" ||
      event.key === "D"
    ) {
      event.preventDefault();
      changeDirection("RIGHT");
    }

  }


  document.addEventListener("keydown", handleKey);


  function moveSnake() {

    if (gameOver) return;

    const head = { ...snake[0] };

    if (direction === "UP") head.y--;
    if (direction === "DOWN") head.y++;
    if (direction === "LEFT") head.x--;
    if (direction === "RIGHT") head.x++;


    const hitWall =
      head.x < 0 ||
      head.x >= 20 ||
      head.y < 0 ||
      head.y >= 20;


    const hitSelf =
      snake.some(
        part =>
          part.x === head.x &&
          part.y === head.y
      );


    if (hitWall || hitSelf) {

      gameOver = true;

      const message =
        document.querySelector("#snakeMessage");

      if (message) {

        message.innerHTML = `

          <h2>Game Over 😵</h2>

          <button id="restartSnake">
            Play Again
          </button>

        `;

        document
          .querySelector("#restartSnake")
          ?.addEventListener("click", showSnake);

      }

      document.removeEventListener(
        "keydown",
        handleKey
      );

      return;
    }


    snake.unshift(head);


    if (
      head.x === food.x &&
      head.y === food.y
    ) {

      score += 10;

      food = {
        x: Math.floor(Math.random() * 20),
        y: Math.floor(Math.random() * 20)
      };

    } else {

      snake.pop();

    }


    drawBoard();

  }


  drawBoard();

  const gameLoop = setInterval(() => {

    if (gameOver) {
      clearInterval(gameLoop);
    } else {
      moveSnake();
    }

  }, 120);

}


// =========================
// CAR RACING GAME
// =========================
function showRacing() {
  // =========================
  // RACING GAME — UNLIMITED TRAFFIC
  // =========================

  document.body.innerHTML = `
    <div class="racing-page">
      <header class="header">
        <div class="logo">🎮 GameZone</div>
        <button id="backHome" class="back-btn">← GameZone</button>
      </header>

      <main class="race-main">
        <div class="race-top">
          <div class="race-stat">
            <span>🏁 SPEED</span>
            <strong id="speedValue">0</strong>
            <small>km/h</small>
          </div>
          <div class="race-stat">
            <span>📍 DISTANCE</span>
            <strong id="distanceValue">0</strong>
            <small>m</small>
          </div>
          <div class="race-stat">
            <span>🚗 PASSED</span>
            <strong id="passedValue">0</strong>
            <small>cars</small>
          </div>
          <div class="race-stat">
            <span>♾️ RACE</span>
            <strong>∞</strong>
            <small>Endless</small>
          </div>
        </div>

        <div class="race-wrapper">
          <canvas id="raceCanvas"></canvas>
          <div id="countdown" class="race-countdown">3</div>

          <div class="race-hud">
            <div class="nitro-box">
              <span>⚡ NITRO</span>
              <div class="nitro-bar">
                <div id="nitroFill"></div>
              </div>
            </div>
          </div>

          <div id="raceMessage" class="race-message"></div>
        </div>

        <div class="race-controls">
          <button id="leftControl" class="race-control">◀</button>
          <button id="nitroControl" class="nitro-control">⚡ NITRO</button>
          <button id="rightControl" class="race-control">▶</button>
        </div>

        <div class="race-help">
          ⌨️ Arrow / A-D = Steering &nbsp;&nbsp;
          Space / N = Nitro
        </div>
      </main>
    </div>
  `;

  const raceCanvas = document.querySelector("#raceCanvas") as HTMLCanvasElement;
  const ctx = raceCanvas.getContext("2d");
  if (!ctx) return;

  // =========================
  // CANVAS SIZE
  // =========================

  function resizeCanvas() {
    const wrapper = document.querySelector(".race-wrapper") as HTMLElement;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    raceCanvas.width = Math.max(320, Math.floor(rect.width));
    raceCanvas.height = Math.max(500, Math.floor(rect.height));
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // =========================
  // GAME STATE
  // =========================

  let gameOver = false;
  let raceStarted = false;

  let playerX = 0;
  let playerVisualX = 0;
  let playerTilt = 0;

  let speed = 0;
  let distance = 0;
  let nitro = 100;
  let carsPassed = 0;

  let lastTime = performance.now();
  let crashFlash = 0;
  let shake = 0;

  const SPAWN_AHEAD = 900;
  const DESPAWN_BEHIND = -200;

  const keys = { left: false, right: false, nitro: false };

  // =========================
  // OPPONENTS — UNLIMITED
  // =========================

  interface Opponent {
    x: number;
    worldDistance: number;
    speed: number;
    color: string;
    passed: boolean;
  }

  const CAR_COLORS = [
    "#ef4444", "#3b82f6", "#facc15", "#22c55e",
    "#f97316", "#a855f7", "#06b6d4", "#ec4899",
    "#84cc16", "#f43f5e"
  ];

  const opponents: Opponent[] = [];

  function createOpponent(aheadBy: number): Opponent {
    const lanes = [-0.55, -0.18, 0.18, 0.55];
    let lane = lanes[Math.floor(Math.random() * lanes.length)];

    let tries = 0;
    while (
      tries < 6 &&
      opponents.some(
        (o) =>
          Math.abs(o.worldDistance - (distance + aheadBy)) < 70 &&
          Math.abs(o.x - lane) < 0.4
      )
    ) {
      lane = lanes[Math.floor(Math.random() * lanes.length)];
      tries++;
    }

    return {
      x: lane,
      worldDistance: distance + aheadBy,
      speed: 0.70 + Math.random() * 0.25,
      color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
      passed: false
    };
  }

  function manageOpponents() {
    for (let i = opponents.length - 1; i >= 0; i--) {
      const o = opponents[i];
      const gap = o.worldDistance - distance;

      if (gap < DESPAWN_BEHIND) {
        if (!o.passed) {
          o.passed = true;
          carsPassed++;
        }
        opponents.splice(i, 1);
      }
    }

    const carsAhead = opponents.filter(
      (o) => o.worldDistance - distance > 0
    ).length;

    const targetAhead = 6;

    if (carsAhead < targetAhead) {
      const spawnCount = targetAhead - carsAhead;
      for (let i = 0; i < spawnCount; i++) {
        opponents.push(
          createOpponent(
            SPAWN_AHEAD * 0.5 + Math.random() * SPAWN_AHEAD * 0.5
          )
        );
      }
    }
  }

  // =========================
  // TREES
  // =========================

  const trees = Array.from({ length: 120 }, (_, i) => ({
    worldDistance: i * 34 + Math.random() * 25,
    side: Math.random() > 0.5 ? -1 : 1,
    size: 0.7 + Math.random() * 0.7
  }));

  // =========================
  // AUDIO
  // =========================

  let audioCtx: AudioContext | null = null;
  let engineOsc: OscillatorNode | null = null;
  let engineGain: GainNode | null = null;
  let engineFilter: BiquadFilterNode | null = null;
  let nitroSoundPlaying = false;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function startEngineSound() {
    initAudio();
    if (!audioCtx || engineOsc) return;

    engineOsc = audioCtx.createOscillator();
    engineGain = audioCtx.createGain();
    engineFilter = audioCtx.createBiquadFilter();

    engineOsc.type = "triangle";
    engineOsc.frequency.value = 55;

    engineFilter.type = "lowpass";
    engineFilter.frequency.value = 900;

    engineGain.gain.value = 0;

    engineOsc.connect(engineFilter);
    engineFilter.connect(engineGain);
    engineGain.connect(audioCtx.destination);

    engineOsc.start();

    engineGain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.4);
  }

  function updateEngineSound() {
    if (!audioCtx || !engineOsc || !engineGain || !engineFilter) return;

    engineOsc.frequency.setTargetAtTime(50 + speed * 110, audioCtx.currentTime, 0.08);
    engineGain.gain.setTargetAtTime(0.03 + speed * 0.03, audioCtx.currentTime, 0.1);
    engineFilter.frequency.setTargetAtTime(700 + speed * 1600, audioCtx.currentTime, 0.1);
  }

  function stopEngineSound() {
    if (!audioCtx || !engineOsc || !engineGain) return;
    try {
      engineGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
      engineOsc.stop(audioCtx.currentTime + 0.2);
    } catch { }
    engineOsc = null;
    engineGain = null;
    engineFilter = null;
  }

  function playBeep(frequency = 600, duration = 0.15) {
    initAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration + 0.05);
  }

  function playCrashSound() {
    initAudio();
    if (!audioCtx) return;

    const bufferSize = audioCtx.sampleRate * 0.5;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 1200;

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    noise.start();

    const thump = audioCtx.createOscillator();
    const thumpGain = audioCtx.createGain();
    thump.type = "sine";
    thump.frequency.setValueAtTime(120, audioCtx.currentTime);
    thump.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.4);
    thumpGain.gain.setValueAtTime(0.35, audioCtx.currentTime);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
    thump.connect(thumpGain);
    thumpGain.connect(audioCtx.destination);
    thump.start();
    thump.stop(audioCtx.currentTime + 0.5);
  }

  function playNitroSound() {
    initAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.3);

    filter.type = "bandpass";
    filter.frequency.value = 800;
    filter.Q.value = 4;

    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  }

  // =========================
  // ROAD GEOMETRY
  // =========================

  const HORIZON = 0.40;
  const TOP_ROAD_W = 40;
  const BOTTOM_ROAD_W = 280;

  function roadHalfWidthAt(y: number): number {
    const h = raceCanvas.height;
    const top = h * HORIZON;
    const bottom = h;
    const t = Math.max(0, Math.min(1, (y - top) / (bottom - top)));
    return TOP_ROAD_W + t * (BOTTOM_ROAD_W - TOP_ROAD_W);
  }

  function roadCenterAt(_y: number): number {
    return raceCanvas.width / 2;
  }

  // =========================
  // WORLD → SCREEN
  // =========================

  const VIEW_DISTANCE = 700;

  function worldToScreen(worldDist: number): { y: number; scale: number; depth: number } | null {
    const rel = worldDist - distance;
    if (rel < -30) return null;
    if (rel > VIEW_DISTANCE) return null;

    const t = 1 - rel / VIEW_DISTANCE;
    const h = raceCanvas.height;
    const yTop = h * HORIZON;
    const yBottom = h * 0.86;

    const depth = t * t;

    const y = yTop + depth * (yBottom - yTop);
    const scale = 0.15 + depth * 1.05;

    return { y, scale, depth };
  }

  // =========================
  // DRAW SKY
  // =========================

  function drawSky() {
    const w = raceCanvas.width;
    const h = raceCanvas.height;

    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
    sky.addColorStop(0, "#38bdf8");
    sky.addColorStop(0.55, "#93c5fd");
    sky.addColorStop(1, "#dbeafe");

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    ctx.beginPath();
    ctx.arc(w * 0.82, h * 0.13, 38, 0, Math.PI * 2);
    ctx.fillStyle = "#fde68a";
    ctx.fill();

    ctx.fillStyle = "#64748b";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.38);
    for (let x = 0; x <= w; x += 50) {
      const mountain =
        h * 0.30 +
        Math.sin(x * 0.015) * 35 +
        Math.sin(x * 0.035) * 20;
      ctx.lineTo(x, mountain);
    }
    ctx.lineTo(w, h * 0.55);
    ctx.lineTo(0, h * 0.55);
    ctx.closePath();
    ctx.fill();
  }

  // =========================
  // DRAW ROAD
  // =========================

  function drawRoad() {
    const w = raceCanvas.width;
    const h = raceCanvas.height;

    ctx.fillStyle = "#15803d";
    ctx.fillRect(0, h * HORIZON, w, h);

    const center = roadCenterAt(0);
    const top = h * HORIZON;
    const bottom = h;

    ctx.beginPath();
    ctx.moveTo(center - TOP_ROAD_W, top);
    ctx.lineTo(center + TOP_ROAD_W, top);
    ctx.lineTo(center + BOTTOM_ROAD_W, bottom);
    ctx.lineTo(center - BOTTOM_ROAD_W, bottom);
    ctx.closePath();
    ctx.fillStyle = "#303030";
    ctx.fill();

    for (let y = top; y < bottom; y += 10) {
      const halfW = roadHalfWidthAt(y);
      const left = center - halfW;
      const right = center + halfW;
      const stripe = Math.floor(y / 25) % 2 === 0;

      ctx.fillStyle = stripe ? "#ef4444" : "#ffffff";
      ctx.fillRect(left - 8, y, 8, 12);
      ctx.fillRect(right, y, 8, 12);
    }

    for (let y = top; y < bottom; y += 35) {
      if (Math.floor(y / 35) % 2 !== 0) continue;

      const halfW = roadHalfWidthAt(y);

      for (const lane of [-0.33, 0.33]) {
        const x = center + lane * halfW;
        const stripeW = 4 + (y / bottom) * 3;
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(x - stripeW / 2, y, stripeW, 22);
      }
    }
  }

  // =========================
  // DRAW TREES
  // =========================

  function drawTrees() {
    const sortedTrees = [...trees].sort(
      (a, b) => b.worldDistance - a.worldDistance
    );

    for (const tree of sortedTrees) {
      const screen = worldToScreen(tree.worldDistance);
      if (!screen) continue;

      const { y, scale } = screen;
      const center = roadCenterAt(y);
      const halfW = roadHalfWidthAt(y);
      const x = center + tree.side * (halfW + 45 * scale);
      const size = tree.size * 55 * scale;

      ctx.fillStyle = "#78350f";
      ctx.fillRect(x - size * 0.1, y - size, size * 0.2, size);

      ctx.beginPath();
      ctx.moveTo(x, y - size * 2);
      ctx.lineTo(x - size, y);
      ctx.lineTo(x + size, y);
      ctx.closePath();
      ctx.fillStyle = "#166534";
      ctx.fill();
    }
  }

  // =========================
  // SHADE HELPER
  // =========================

  function shade(hex: string, percent: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    let r = (num >> 16) + percent;
    let g = ((num >> 8) & 0x00ff) + percent;
    let b = (num & 0x0000ff) + percent;

    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
  }

  // =========================
  // DRAW CAR
  // =========================

  function drawCar(
    x: number,
    y: number,
    scale: number,
    color: string,
    player = false
  ) {
    const width = 52 * scale;
    const height = 92 * scale;

    ctx.save();
    ctx.translate(x, y);

    if (player && playerTilt !== 0) {
      ctx.rotate(playerTilt * 0.10);
    }

    ctx.beginPath();
    ctx.ellipse(0, height * 0.48, width * 0.75, height * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fill();

    if (player) {
      ctx.beginPath();
      ctx.roundRect(-width / 2 - 3, -height / 2 - 3, width + 6, height + 6, width * 0.22);
      ctx.fillStyle = "#f0abfc";
      ctx.fill();
    }

    ctx.fillStyle = shade(color, -25);
    ctx.beginPath();
    ctx.roundRect(-width / 2, height * 0.28, width, height * 0.22, width * 0.12);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-width / 2, -height / 2, width, height * 0.85, width * 0.18);
    ctx.fill();

    ctx.fillStyle = shade(color, -35);
    ctx.beginPath();
    ctx.roundRect(-width * 0.34, -height * 0.22, width * 0.68, height * 0.38, width * 0.1);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect(-width * 0.28, -height * 0.18, width * 0.56, height * 0.16, width * 0.05);
    ctx.fill();

    ctx.fillStyle = "rgba(96,165,250,0.55)";
    ctx.beginPath();
    ctx.roundRect(-width * 0.24, -height * 0.16, width * 0.48, height * 0.06, width * 0.04);
    ctx.fill();

    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.roundRect(-width * 0.42, height * 0.22, width * 0.22, height * 0.09, width * 0.03);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(width * 0.20, height * 0.22, width * 0.22, height * 0.09, width * 0.03);
    ctx.fill();

    if (!player) {
      ctx.fillStyle = "rgba(248,113,113,0.6)";
      ctx.beginPath();
      ctx.roundRect(-width * 0.40, height * 0.24, width * 0.18, height * 0.05, width * 0.02);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(width * 0.22, height * 0.24, width * 0.18, height * 0.05, width * 0.02);
      ctx.fill();
    }

    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath();
    ctx.roundRect(-width * 0.56, -height * 0.18, width * 0.13, height * 0.32, width * 0.04);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(width * 0.43, -height * 0.18, width * 0.13, height * 0.32, width * 0.04);
    ctx.fill();

    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = Math.max(1, width * 0.02);
    ctx.beginPath();
    ctx.moveTo(-width * 0.05, -height * 0.15);
    ctx.lineTo(width * 0.15, -height * 0.06);
    ctx.stroke();

    if (player && keys.nitro && nitro > 0 && raceStarted) {
      ctx.beginPath();
      ctx.moveTo(-width * 0.18, height * 0.5);
      ctx.lineTo(0, height * 0.95 + Math.random() * 14);
      ctx.lineTo(width * 0.18, height * 0.5);
      ctx.closePath();
      ctx.fillStyle = "#f97316";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-width * 0.09, height * 0.5);
      ctx.lineTo(0, height * 0.78 + Math.random() * 8);
      ctx.lineTo(width * 0.09, height * 0.5);
      ctx.closePath();
      ctx.fillStyle = "#fde047";
      ctx.fill();
    }

    ctx.restore();
  }

  // =========================
  // DRAW OPPONENTS
  // =========================

  function drawOpponents() {
    const sorted = [...opponents].sort(
      (a, b) => b.worldDistance - a.worldDistance
    );

    for (const opp of sorted) {
      const screen = worldToScreen(opp.worldDistance);
      if (!screen) continue;

      const { y, scale } = screen;
      const center = roadCenterAt(y);
      const halfW = roadHalfWidthAt(y);
      const x = center + opp.x * halfW;

      drawCar(x, y, scale, opp.color, false);
    }
  }

  // =========================
  // DRAW PLAYER
  // =========================

  function drawPlayer() {
    const h = raceCanvas.height;

    const center = roadCenterAt(h * 0.86);
    const halfW = roadHalfWidthAt(h * 0.86);

    const clampedX = Math.max(-0.68, Math.min(0.68, playerVisualX));
    const x = center + clampedX * halfW;

    let y = h * 0.86;

    const bounce =
      raceStarted && !gameOver
        ? Math.sin(performance.now() * 0.02) * 2
        : 0;

    y += bounce;

    drawCar(x, y, 1.25, "#8b5cf6", true);
  }

  // =========================
  // CRASH EFFECT
  // =========================

  function showCrashEffect() {
    crashFlash = 1;
    shake = 22;
  }

  function drawCrashEffect() {
    if (crashFlash <= 0) return;

    const w = raceCanvas.width;
    const h = raceCanvas.height;

    ctx.fillStyle = `rgba(255,0,0,${crashFlash * 0.25})`;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 15; i++) {
      const x = w / 2 + (Math.random() - 0.5) * 180;
      const y = h * 0.7 + (Math.random() - 0.5) * 130;

      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 5 + 2, 0, Math.PI * 2);
      ctx.fillStyle = "#facc15";
      ctx.fill();
    }

    crashFlash *= 0.88;
    shake *= 0.88;
  }

  // =========================
  // DRAW
  // =========================

  function draw() {
    const w = raceCanvas.width;
    const h = raceCanvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.save();

    if (shake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * shake,
        (Math.random() - 0.5) * shake
      );
    }

    drawSky();
    drawRoad();
    drawTrees();
    drawOpponents();
    drawPlayer();

    ctx.restore();
    drawCrashEffect();
  }

  // =========================
  // HUD
  // =========================

  function updateHUD() {
    const speedElement = document.querySelector("#speedValue");
    const distanceElement = document.querySelector("#distanceValue");
    const passedElement = document.querySelector("#passedValue");
    const nitroElement = document.querySelector("#nitroFill") as HTMLElement;

    if (speedElement)
      speedElement.textContent = Math.floor(speed * 220).toString();

    if (distanceElement)
      distanceElement.textContent = Math.floor(distance).toString();

    if (passedElement)
      passedElement.textContent = carsPassed.toString();

    if (nitroElement)
      nitroElement.style.width = `${Math.max(0, Math.min(100, nitro))}%`;
  }

  // =========================
  // COLLISION
  // =========================

  function checkCollision() {
    const PLAYER_CAR_HALF_LEN = 50;
    const PLAYER_CAR_HALF_W = 0.30;

    for (const o of opponents) {
      const distGap = Math.abs(o.worldDistance - distance);
      const laneGap = Math.abs(o.x - playerX);

      if (distGap < PLAYER_CAR_HALF_LEN && laneGap < PLAYER_CAR_HALF_W) {
        triggerGameOver();
        return;
      }
    }
  }

  function triggerGameOver() {
    if (gameOver) return;

    gameOver = true;
    speed = 0;

    playCrashSound();
    showCrashEffect();
    stopEngineSound();

    const message = document.querySelector("#raceMessage");
    if (message) {
      message.innerHTML = `
        <div class="finish-box">
          <div style="font-size:55px;">💥</div>
          <h2>CRASHED!</h2>
          <p>You hit another car.</p>
          <p>Distance: ${Math.floor(distance)} m</p>
          <p>Cars Passed: ${carsPassed}</p>
          <button id="restartRace">Race Again 🏎️</button>
        </div>
      `;

      document
        .querySelector("#restartRace")
        ?.addEventListener("click", showRacing);
    }

    document.querySelector("#countdown")?.remove();
  }

  // =========================
  // UPDATE
  // =========================

  function update(delta: number) {
    if (gameOver || !raceStarted) {
      playerVisualX += (playerX - playerVisualX) * 0.2;
      playerTilt +=
        ((keys.left ? -1 : keys.right ? 1 : 0) - playerTilt) * 0.15;
      return;
    }

    const steerSpeed = 0.0017 * delta;
    if (keys.left) playerX -= steerSpeed;
    if (keys.right) playerX += steerSpeed;

    playerX = Math.max(-0.68, Math.min(0.68, playerX));

    playerVisualX += (playerX - playerVisualX) * 0.2;

    const targetTilt = keys.left ? -1 : keys.right ? 1 : 0;
    playerTilt += (targetTilt - playerTilt) * 0.15;

    if (speed < 1) speed += 0.00045 * delta;

    if (keys.nitro && nitro > 0) {
      speed += 0.0020 * delta;
      nitro -= 0.055 * delta;

      if (!nitroSoundPlaying) {
        playNitroSound();
        nitroSoundPlaying = true;
      }
    } else {
      nitroSoundPlaying = false;

      if (speed > 1) speed -= 0.00025 * delta;
      if (nitro < 100) nitro += 0.012 * delta;
    }

    speed = Math.max(0, Math.min(1.45, speed));
    nitro = Math.max(0, Math.min(100, nitro));

    distance += speed * 0.30 * delta;

    for (const o of opponents) {
      o.worldDistance += o.speed * 0.24 * delta;
    }

    manageOpponents();

    checkCollision();
    updateHUD();
    updateEngineSound();
  }

  // =========================
  // GAME LOOP
  // =========================

  function gameLoop(currentTime: number) {
    if (gameOver) {
      draw();
      return;
    }

    const delta = Math.min(40, currentTime - lastTime);
    lastTime = currentTime;

    update(delta);
    draw();

    requestAnimationFrame(gameLoop);
  }

  // =========================
  // COUNTDOWN
  // =========================

  function startCountdown() {
    const element = document.querySelector("#countdown") as HTMLElement;
    if (!element) return;

    let number = 3;

    function tick() {
      if (number > 0) {
        element.textContent = number.toString();
        playBeep(number === 1 ? 800 : 600, 0.15);
        number--;
        setTimeout(tick, 1000);
      } else {
        element.textContent = "GO!";
        playBeep(900, 0.3);
        raceStarted = true;
        startEngineSound();

        setTimeout(() => element.remove(), 500);
      }
    }

    tick();
  }

  // =========================
  // KEYBOARD
  // =========================

  window.onkeydown = (event) => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      keys.left = true;
    }
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      keys.right = true;
    }
    if (event.key === " " || event.key.toLowerCase() === "n") {
      event.preventDefault();
      keys.nitro = true;
    }
    initAudio();
  };

  window.onkeyup = (event) => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      keys.left = false;
    }
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      keys.right = false;
    }
    if (event.key === " " || event.key.toLowerCase() === "n") {
      keys.nitro = false;
    }
  };

  // =========================
  // MOBILE CONTROLS
  // =========================

  function setupHoldButton(
    selector: string,
    key: "left" | "right" | "nitro"
  ) {
    const button = document.querySelector(selector);
    if (!button) return;

    const down = (event: Event) => {
      event.preventDefault();
      initAudio();
      keys[key] = true;
    };
    const up = () => {
      keys[key] = false;
    };

    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointercancel", up);
    button.addEventListener("pointerleave", up);
  }

  setupHoldButton("#leftControl", "left");
  setupHoldButton("#rightControl", "right");
  setupHoldButton("#nitroControl", "nitro");

  // =========================
  // BACK HOME
  // =========================

  document.querySelector("#backHome")?.addEventListener("click", () => {
    window.onkeydown = null;
    window.onkeyup = null;
    stopEngineSound();
    showHome();
  });

  // =========================
  // START
  // =========================

  updateHUD();
  draw();
  startCountdown();
  requestAnimationFrame(gameLoop);
}

// =========================
// START WEBSITE
// =========================

showHome();
