import "./style.css";

// =========================
// ROUNDRECT POLYFILL (FIX: typed `this` + correct signature)
// =========================
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    this: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r?: number | DOMPointInit | (number | DOMPointInit)[]
  ): void {
    const first = Array.isArray(r) ? r[0] : r;
    let radius = typeof first === "number" ? first : 0;
    radius = Math.max(0, Math.min(radius, w / 2, h / 2));
    this.moveTo(x + radius, y);
    this.arcTo(x + w, y, x + w, y + h, radius);
    this.arcTo(x + w, y + h, x, y + h, radius);
    this.arcTo(x, y + h, x, y, radius);
    this.arcTo(x, y, x + w, y, radius);
    this.closePath();
  };
}

// =========================
// TYPES
// =========================
interface Game {
  name: string;
  icon: string;
  category: string;
  available: boolean;
}

interface Opponent {
  x: number;
  worldDistance: number;
  speed: number;
  color: string;
  passed: boolean;
}

interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  check: () => boolean;
}

interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  category: string;
}

// =========================
// GLOBAL STATE
// =========================
let activeCleanup: (() => void) | null = null;

function registerCleanup(fn: () => void) {
  if (activeCleanup) activeCleanup();
  activeCleanup = fn;
}

// Sound
let soundEnabled = true;
function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem("gz_sound", soundEnabled ? "1" : "0");
  document.body.classList.toggle("sound-off", !soundEnabled);
  showToast(soundEnabled ? "🔊 Sound On" : "🔇 Sound Off", "", "success");
}

function initSoundState() {
  const saved = localStorage.getItem("gz_sound");
  soundEnabled = saved !== "0";
  document.body.classList.toggle("sound-off", !soundEnabled);
}

// Theme
let isDark = true;
function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle("light-theme", !isDark);
  localStorage.setItem("gz_theme", isDark ? "dark" : "light");
  showToast(isDark ? "🌙 Dark Mode" : "☀️ Light Mode", "", "success");
}

function initTheme() {
  const saved = localStorage.getItem("gz_theme");
  isDark = saved !== "light";
  document.body.classList.toggle("light-theme", !isDark);
}

// =========================
// TOAST SYSTEM
// =========================
function ensureToastContainer(): HTMLElement {
  let container = document.querySelector<HTMLElement>(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  return container;
}

function showToast(
  title: string,
  msg = "",
  type: "info" | "success" | "warning" | "danger" = "info",
  duration = 3000
) {
  const container = ensureToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("data-testid", "toast");

  const icons: Record<string, string> = {
    info: "💡",
    success: "✅",
    warning: "⚠️",
    danger: "❌",
  };

  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${msg ? `<div class="toast-msg">${msg}</div>` : ""}
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toast-out 0.35s ease forwards";
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// =========================
// CONFETTI
// =========================
function launchConfetti(count = 80) {
  const container = document.createElement("div");
  container.className = "confetti-container";
  document.body.appendChild(container);

  const colors = ["#8b5cf6", "#ec4899", "#f59e0b", "#22c55e", "#3b82f6", "#facc15"];

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "%";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = 2 + Math.random() * 2 + "s";
    piece.style.animationDelay = Math.random() * 0.5 + "s";
    piece.style.width = 6 + Math.random() * 8 + "px";
    piece.style.height = 8 + Math.random() * 12 + "px";
    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), 4500);
}

// =========================
// AUDIO BEEP (global)
// =========================
let globalAudioCtx: AudioContext | null = null;

function playUISound(freq = 600, duration = 0.08) {
  if (!soundEnabled) return;
  try {
    if (!globalAudioCtx) {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return;
      globalAudioCtx = new Ctor();
    }
    const ac: AudioContext = globalAudioCtx;
    if (ac.state === "suspended") ac.resume();

    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, ac.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration + 0.05);
  } catch { /* ignore */ }
}

// =========================
// GAMES DATA
// =========================
const games: Game[] = [
  { name: "Snake", icon: "🐍", category: "Arcade", available: true },
  { name: "Tetris", icon: "🧱", category: "Puzzle", available: true },
  { name: "Racing", icon: "🏎️", category: "Racing", available: true },
  { name: "Quiz", icon: "🧠", category: "Brain", available: true },
];

// =========================
// QUIZ DATA (100 questions) — [question, options, correctIndex]
// =========================
type RawQ = [string, string[], number];

const QUIZ_BANK: Record<string, RawQ[]> = {
  Science: [
    ["What is the chemical symbol for gold?", ["Au", "Ag", "Gd", "Go"], 0],
    ["Which planet is known as the Red Planet?", ["Venus", "Jupiter", "Mars", "Mercury"], 2],
    ["At sea level, water boils at what temperature?", ["90°C", "100°C", "110°C", "120°C"], 1],
    ["What is the hardest natural substance on Earth?", ["Iron", "Quartz", "Granite", "Diamond"], 3],
    ["Which part of the cell is called its 'powerhouse'?", ["Nucleus", "Mitochondria", "Ribosome", "Golgi body"], 1],
    ["Which gas do plants absorb for photosynthesis?", ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], 2],
    ["What is the approximate speed of light in vacuum?", ["3,00,000 km/s", "30,000 km/s", "3,000 km/s", "3,00,00,000 km/s"], 0],
    ["Which is the largest planet in our Solar System?", ["Saturn", "Jupiter", "Neptune", "Earth"], 1],
    ["How many bones does an adult human body have?", ["196", "206", "216", "226"], 1],
    ["What is the pH value of pure water at 25°C?", ["5", "6", "7", "8"], 2],
    ["Who proposed the Theory of Relativity?", ["Isaac Newton", "Niels Bohr", "Albert Einstein", "Galileo Galilei"], 2],
    ["What is the SI unit of electrical resistance?", ["Volt", "Ampere", "Watt", "Ohm"], 3],
    ["Which gas is most abundant in Earth's atmosphere?", ["Oxygen", "Nitrogen", "Argon", "Carbon dioxide"], 1],
    ["Which vitamin does human skin produce in sunlight?", ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"], 3],
    ["What is the chemical formula of common table salt?", ["NaCl", "KCl", "NaOH", "CaCO₃"], 0],
    ["Which organ in the human body produces insulin?", ["Liver", "Kidney", "Pancreas", "Heart"], 2],
    ["Which star is closest to Earth?", ["Proxima Centauri", "Sirius", "The Sun", "Polaris"], 2],
  ],
  History: [
    ["Who was the first person to walk on the Moon?", ["Buzz Aldrin", "Yuri Gagarin", "Neil Armstrong", "Michael Collins"], 2],
    ["In which year did World War II end?", ["1939", "1942", "1945", "1950"], 2],
    ["Which Mughal emperor built the Taj Mahal?", ["Akbar", "Shah Jahan", "Babur", "Aurangzeb"], 1],
    ["Who was the first President of the United States?", ["Abraham Lincoln", "Thomas Jefferson", "John Adams", "George Washington"], 3],
    ["In which year did the Berlin Wall fall?", ["1985", "1989", "1991", "1993"], 1],
    ["Who discovered penicillin?", ["Louis Pasteur", "Alexander Fleming", "Robert Koch", "Edward Jenner"], 1],
    ["The Great Pyramid of Giza was built for which pharaoh?", ["Tutankhamun", "Ramesses II", "Khufu", "Cleopatra"], 2],
    ["In which year did the Titanic sink?", ["1905", "1912", "1918", "1923"], 1],
    ["In which year did the French Revolution begin?", ["1776", "1789", "1799", "1804"], 1],
    ["Who invented the movable-type printing press in Europe?", ["Johannes Gutenberg", "Leonardo da Vinci", "Galileo", "Martin Luther"], 0],
    ["Who founded the Maurya Empire?", ["Ashoka", "Bindusara", "Chandragupta Maurya", "Samudragupta"], 2],
    ["In which year was the Battle of Plassey fought?", ["1757", "1764", "1857", "1707"], 0],
    ["Which British Prime Minister was called the 'Iron Lady'?", ["Theresa May", "Margaret Thatcher", "Queen Victoria", "Indira Gandhi"], 1],
    ["Which civilization built Machu Picchu?", ["Aztec", "Maya", "Inca", "Olmec"], 2],
    ["In which year did Columbus first reach the Americas?", ["1492", "1498", "1500", "1519"], 0],
    ["Who co-wrote 'The Communist Manifesto' with Friedrich Engels?", ["Vladimir Lenin", "Karl Marx", "Joseph Stalin", "Leon Trotsky"], 1],
    ["Who was the first woman to win a Nobel Prize?", ["Mother Teresa", "Marie Curie", "Rosalind Franklin", "Ada Lovelace"], 1],
  ],
  Geography: [
    ["Which is the largest ocean on Earth?", ["Atlantic", "Indian", "Arctic", "Pacific"], 3],
    ["Which river flows through Cairo?", ["Nile", "Tigris", "Congo", "Niger"], 0],
    ["What is the capital of Australia?", ["Sydney", "Melbourne", "Canberra", "Perth"], 2],
    ["Which is the largest hot desert in the world?", ["Thar", "Gobi", "Kalahari", "Sahara"], 3],
    ["Which is the highest mountain above sea level?", ["K2", "Kangchenjunga", "Mount Everest", "Makalu"], 2],
    ["Which country has the largest population (UN, 2023)?", ["China", "India", "USA", "Indonesia"], 1],
    ["Which is the smallest country in the world by area?", ["Monaco", "Vatican City", "San Marino", "Maldives"], 1],
    ["What is the capital of Japan?", ["Osaka", "Kyoto", "Tokyo", "Hiroshima"], 2],
    ["How many continents are there on Earth?", ["5", "6", "7", "8"], 2],
    ["Which is the largest country by area?", ["Canada", "China", "USA", "Russia"], 3],
    ["What is the capital of Canada?", ["Toronto", "Ottawa", "Vancouver", "Montreal"], 1],
    ["Mount Kilimanjaro is located in which country?", ["Kenya", "Uganda", "Tanzania", "Ethiopia"], 2],
    ["What is the currency of Japan?", ["Yuan", "Won", "Yen", "Ringgit"], 2],
    ["What is the capital of Brazil?", ["Rio de Janeiro", "São Paulo", "Brasília", "Salvador"], 2],
    ["Which strait separates Asia from North America?", ["Bering Strait", "Strait of Gibraltar", "Palk Strait", "Strait of Malacca"], 0],
    ["Which is the largest island in the world?", ["Borneo", "Madagascar", "New Guinea", "Greenland"], 3],
    ["Most of the Amazon rainforest lies in which country?", ["Peru", "Colombia", "Brazil", "Venezuela"], 2],
  ],
  Tech: [
    ["What does HTML stand for?", ["HyperText Markup Language", "High Text Machine Language", "Hyperlink Text Mode Language", "Home Tool Markup Language"], 0],
    ["Who co-founded Microsoft with Paul Allen?", ["Steve Jobs", "Bill Gates", "Larry Page", "Mark Zuckerberg"], 1],
    ["What does CPU stand for?", ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Core Power Unit"], 0],
    ["Which company makes the iPhone?", ["Samsung", "Google", "Apple", "Nokia"], 2],
    ["Which language is used to style web pages?", ["Python", "CSS", "SQL", "C++"], 1],
    ["How many bits make one byte?", ["4", "8", "16", "32"], 1],
    ["Who created the Linux kernel?", ["Linus Torvalds", "Dennis Ritchie", "Richard Stallman", "Ken Thompson"], 0],
    ["Who invented the World Wide Web?", ["Vint Cerf", "Tim Berners-Lee", "Alan Turing", "Charles Babbage"], 1],
    ["Android operating system is primarily developed by?", ["Apple", "Microsoft", "Google", "Meta"], 2],
    ["What is the binary representation of decimal 5?", ["100", "101", "110", "111"], 1],
    ["JavaScript was first created at which company?", ["Microsoft", "Sun Microsystems", "Netscape", "IBM"], 2],
    ["What does RAM stand for?", ["Read Access Memory", "Random Access Memory", "Rapid Action Memory", "Run All Memory"], 1],
    ["Who founded SpaceX?", ["Jeff Bezos", "Richard Branson", "Elon Musk", "Sundar Pichai"], 2],
    ["What is the default port for HTTPS?", ["80", "21", "8080", "443"], 3],
    ["TypeScript was developed by which company?", ["Google", "Microsoft", "Meta", "Amazon"], 1],
    ["Which company owns YouTube?", ["Meta", "Microsoft", "Google (Alphabet)", "Amazon"], 2],
    ["What does URL stand for?", ["Uniform Resource Locator", "Universal Record Link", "User Resource Link", "Unified Routing Locator"], 0],
  ],
  Sports: [
    ["How many players of one team are on the field in cricket?", ["9", "10", "11", "12"], 2],
    ["Which country won the FIFA World Cup 2022?", ["France", "Brazil", "Argentina", "Croatia"], 2],
    ["How many rings are there in the Olympic symbol?", ["4", "5", "6", "7"], 1],
    ["How many international centuries did Sachin Tendulkar score?", ["90", "100", "110", "120"], 1],
    ["Which country has won the most FIFA World Cups?", ["Germany", "Italy", "Argentina", "Brazil"], 3],
    ["What is Usain Bolt's 100m world record time?", ["9.58 s", "9.63 s", "9.69 s", "9.72 s"], 0],
    ["How many Grand Slam tournaments are there in tennis each year?", ["3", "4", "5", "6"], 1],
    ["Which city hosted the 2020 Summer Olympics (held in 2021)?", ["Beijing", "Paris", "Tokyo", "London"], 2],
    ["How many players per team are on court in basketball?", ["5", "6", "7", "11"], 0],
    ["Neeraj Chopra won Olympic gold at Tokyo 2020 in which event?", ["Shot put", "Javelin throw", "Discus throw", "Long jump"], 1],
    ["Which country won the 2011 ICC Cricket World Cup?", ["Sri Lanka", "Australia", "India", "Pakistan"], 2],
    ["Wimbledon is played on which surface?", ["Clay", "Hard court", "Grass", "Carpet"], 2],
    ["What is the official distance of a marathon?", ["40 km", "42.195 km", "45 km", "50 km"], 1],
    ["In chess, which piece moves only diagonally?", ["Rook", "Knight", "Bishop", "King"], 2],
    ["Who has won the most Olympic gold medals ever?", ["Usain Bolt", "Carl Lewis", "Michael Phelps", "Mark Spitz"], 2],
    ["Which country won the 2023 ICC Men's Cricket World Cup?", ["India", "Australia", "England", "New Zealand"], 1],
  ],
  India: [
    ["What is the national animal of India?", ["Lion", "Elephant", "Bengal Tiger", "Peacock"], 2],
    ["Who was the first Prime Minister of India?", ["Sardar Patel", "Jawaharlal Nehru", "Lal Bahadur Shastri", "Mahatma Gandhi"], 1],
    ["In which year did India gain independence?", ["1945", "1947", "1950", "1952"], 1],
    ["Who wrote 'Vande Mataram'?", ["Rabindranath Tagore", "Bankim Chandra Chatterjee", "Sarojini Naidu", "Subramania Bharati"], 1],
    ["What is the capital of India?", ["Mumbai", "Kolkata", "New Delhi", "Chennai"], 2],
    ["Who is known as the 'Father of the Indian Constitution'?", ["Mahatma Gandhi", "Jawaharlal Nehru", "Dr. B. R. Ambedkar", "Rajendra Prasad"], 2],
    ["Which is the longest river in India?", ["Yamuna", "Godavari", "Ganga", "Brahmaputra"], 2],
    ["Which ISRO mission landed near the Moon's south pole in 2023?", ["Chandrayaan-1", "Chandrayaan-2", "Chandrayaan-3", "Mangalyaan"], 2],
    ["How many states does India have (2024)?", ["28", "29", "30", "36"], 0],
    ["What is the national bird of India?", ["Sparrow", "Peacock", "Parrot", "Eagle"], 1],
    ["Who wrote India's national anthem 'Jana Gana Mana'?", ["Bankim Chandra Chatterjee", "Rabindranath Tagore", "Muhammad Iqbal", "Sri Aurobindo"], 1],
    ["On which date is Republic Day celebrated?", ["15 August", "2 October", "26 January", "26 November"], 2],
    ["Who was the first Indian to travel to space?", ["Kalpana Chawla", "Rakesh Sharma", "Sunita Williams", "Shubhanshu Shukla"], 1],
    ["Which is the largest Indian state by area?", ["Madhya Pradesh", "Maharashtra", "Uttar Pradesh", "Rajasthan"], 3],
    ["Who is known as the 'Missile Man of India'?", ["Vikram Sarabhai", "Homi Bhabha", "A. P. J. Abdul Kalam", "C. V. Raman"], 2],
    ["In which year was the Rupee symbol ₹ adopted?", ["2008", "2010", "2012", "2014"], 1],
  ],
};

const QUIZ_QUESTIONS: QuizQuestion[] = Object.entries(QUIZ_BANK).flatMap(([category, list]) =>
  list.map(([q, options, answer]) => ({ q, options, answer, category }))
);

const QUIZ_CAT_ICONS: Record<string, string> = {
  All: "🌐", Science: "🔬", History: "📜", Geography: "🌍", Tech: "💻", Sports: "🏅", India: "🇮🇳",
};

// =========================
// STORAGE HELPERS
// =========================
function getHighScore(game: string): number {
  try {
    return parseInt(localStorage.getItem(`gz_highscore_${game}`) || "0", 10);
  } catch {
    return 0;
  }
}

function setHighScore(game: string, score: number): boolean {
  try {
    const current = getHighScore(game);
    if (score > current) {
      localStorage.setItem(`gz_highscore_${game}`, score.toString());
      return true;
    }
  } catch { /* ignore */ }
  return false;
}

function getPlayCount(game: string): number {
  try {
    return parseInt(localStorage.getItem(`gz_plays_${game}`) || "0", 10);
  } catch {
    return 0;
  }
}

function incrementPlayCount(game: string) {
  try {
    const c = getPlayCount(game);
    localStorage.setItem(`gz_plays_${game}`, (c + 1).toString());
  } catch { /* ignore */ }
}

function getTotalPlays(): number {
  return games.reduce((sum, g) => sum + getPlayCount(g.name.toLowerCase()), 0);
}

function getFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem("gz_favorites") || "[]");
  } catch {
    return [];
  }
}

function toggleFavorite(gameName: string): boolean {
  const favs = getFavorites();
  const idx = favs.indexOf(gameName);
  let added = false;
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.push(gameName);
    added = true;
  }
  try {
    localStorage.setItem("gz_favorites", JSON.stringify(favs));
  } catch { /* ignore */ }
  return added;
}

function isFavorite(gameName: string): boolean {
  return getFavorites().includes(gameName);
}

// =========================
// ACHIEVEMENTS
// =========================
function getAchievements(): Achievement[] {
  return [
    { id: "first_game", icon: "🎮", title: "First Steps", desc: "Play your first game", check: () => getTotalPlays() >= 1 },
    { id: "snake_50", icon: "🐍", title: "Snake Charmer", desc: "Score 50+ in Snake", check: () => getHighScore("snake") >= 50 },
    { id: "snake_200", icon: "👑", title: "Snake King", desc: "Score 200+ in Snake", check: () => getHighScore("snake") >= 200 },
    { id: "tetris_1000", icon: "🧱", title: "Block Master", desc: "Score 1000+ in Tetris", check: () => getHighScore("tetris") >= 1000 },
    { id: "tetris_5000", icon: "🏗️", title: "Tetris Legend", desc: "Score 5000+ in Tetris", check: () => getHighScore("tetris") >= 5000 },
    { id: "race_500", icon: "🏎️", title: "Speed Demon", desc: "Travel 500m in Racing", check: () => getHighScore("racing") >= 500 },
    { id: "race_2000", icon: "🏁", title: "Road Warrior", desc: "Travel 2000m in Racing", check: () => getHighScore("racing") >= 2000 },
    { id: "quiz_1000", icon: "🧠", title: "Quiz Whiz", desc: "Score 1000+ in Quiz", check: () => getHighScore("quiz") >= 1000 },
    { id: "quiz_perfect", icon: "🎓", title: "Genius", desc: "Answer 10/10 in a Quiz round", check: () => localStorage.getItem("gz_quiz_perfect") === "1" },
    {
      id: "all_games", icon: "🌟", title: "Explorer", desc: "Play all 4 games",
      check: () => games.every((g) => getPlayCount(g.name.toLowerCase()) > 0),
    },
    { id: "dedicated", icon: "🔥", title: "Dedicated", desc: "Play 10 games total", check: () => getTotalPlays() >= 10 },
    { id: "veteran", icon: "💎", title: "Veteran", desc: "Play 50 games total", check: () => getTotalPlays() >= 50 },
  ];
}

function isAchievementUnlocked(id: string): boolean {
  try {
    const unlocked = JSON.parse(localStorage.getItem("gz_unlocked") || "[]");
    return unlocked.includes(id);
  } catch {
    return false;
  }
}

function checkAchievements() {
  try {
    const unlocked: string[] = JSON.parse(localStorage.getItem("gz_unlocked") || "[]");
    let changed = false;

    for (const a of getAchievements()) {
      if (!unlocked.includes(a.id) && a.check()) {
        unlocked.push(a.id);
        changed = true;
        setTimeout(() => {
          showToast(`🏆 Achievement Unlocked!`, a.title, "success", 4000);
          launchConfetti(40);
          playUISound(900, 0.2);
        }, 500);
      }
    }

    if (changed) {
      localStorage.setItem("gz_unlocked", JSON.stringify(unlocked));
    }
  } catch { /* ignore */ }
}

// =========================
// BACKGROUND PARTICLES
// =========================
function createBackgroundParticles() {
  let bg = document.querySelector(".bg-particles");
  if (!bg) {
    bg = document.createElement("div");
    bg.className = "bg-particles";
    document.body.appendChild(bg);
  }

  bg.innerHTML = "";

  const count = window.innerWidth < 600 ? 12 : 25;

  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.left = Math.random() * 100 + "%";
    p.style.animationDuration = 8 + Math.random() * 12 + "s";
    p.style.animationDelay = Math.random() * 10 + "s";
    p.style.width = 2 + Math.random() * 4 + "px";
    p.style.height = p.style.width;
    p.style.setProperty("--drift", (Math.random() - 0.5) * 200 + "px");
    bg.appendChild(p);
  }
}

// =========================
// LEADERBOARD DATA
// =========================
function getLeaderboard() {
  const entries = [
    { emoji: "🐍", name: "Snake", category: "Arcade", score: getHighScore("snake") },
    { emoji: "🧱", name: "Tetris", category: "Puzzle", score: getHighScore("tetris") },
    { emoji: "🏎️", name: "Racing", category: "Racing", score: getHighScore("racing") },
    { emoji: "🧠", name: "Quiz", category: "Brain", score: getHighScore("quiz") },
  ];
  return entries.sort((a, b) => b.score - a.score);
}

// =========================
// DAILY CHALLENGE
// =========================
function getDailyChallenge() {
  const challenges = [
    { game: "Snake", icon: "🐍", target: 100, label: "Score 100 points in Snake", points: 50 },
    { game: "Tetris", icon: "🧱", target: 2000, label: "Score 2000 points in Tetris", points: 75 },
    { game: "Racing", icon: "🏎️", target: 1000, label: "Travel 1000m in Racing", points: 100 },
    { game: "Quiz", icon: "🧠", target: 1500, label: "Score 1500+ in Quiz", points: 80 },
    { game: "Snake", icon: "🐍", target: 150, label: "Score 150 in Snake", points: 60 },
    { game: "Tetris", icon: "🧱", target: 3000, label: "Score 3000 in Tetris", points: 90 },
  ];
  const dayIndex = new Date().getDate() % challenges.length;
  return challenges[dayIndex];
}

function launchGame(name: string) {
  if (name === "Snake") showSnake();
  else if (name === "Tetris") showTetris();
  else if (name === "Racing") showRacing();
  else if (name === "Quiz") showQuiz();
}

// =========================
// HOME PAGE
// =========================
function showHome() {
  registerCleanup(() => { /* nothing persistent */ });
  window.scrollTo({ top: 0 });

  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;

  const stats = {
    totalPlays: getTotalPlays(),
    gamesAvailable: games.filter((g) => g.available).length,
    totalScore: games.reduce((s, g) => s + getHighScore(g.name.toLowerCase()), 0),
    achievements: getAchievements().filter((a) => isAchievementUnlocked(a.id)).length,
  };

  const challenge = getDailyChallenge();
  const leaderboard = getLeaderboard();

  app.innerHTML = `
    <header class="site-header">
      <div class="logo">🎮 GameZone</div>

      <nav>
        <a data-nav="home" data-testid="nav-home">Home</a>
        <a data-nav="games" data-testid="nav-games">Games</a>
        <a data-nav="leaderboard" data-testid="nav-leaderboard">Leaderboard</a>
        <a data-nav="achievements" data-testid="nav-achievements">Achievements</a>
      </nav>

      <div class="header-actions">
        <button class="icon-btn" id="soundToggle" data-testid="sound-toggle" title="Toggle Sound">🔊</button>
        <button class="icon-btn" id="themeToggle" data-testid="theme-toggle" title="Toggle Theme">🌙</button>
        <button class="icon-btn" id="loginBtn" data-testid="login-btn" title="Login">👤</button>
      </div>
    </header>

    <main>
      <section class="hero">
        <div>
          <p class="eyebrow">WELCOME TO GAMEZONE</p>
          <h1>
            Play.<br>
            <span>Compete.</span><br>
            Have Fun.
          </h1>
          <div class="subtitle">
            Play browser games instantly. No download required. Press 1–4 to jump into a game.
          </div>
          <button class="explore" id="exploreBtn" data-testid="explore-btn">
            🚀 Explore Games
          </button>
        </div>
        <div class="hero-icon">🎮</div>
      </section>

      <section class="stats-dashboard">
        <div class="stat-item"><div class="stat-icon">🎮</div><div class="stat-info"><span class="stat-label">Games Played</span><span class="stat-value" data-testid="stat-plays">${stats.totalPlays}</span></div></div>
        <div class="stat-item"><div class="stat-icon">⭐</div><div class="stat-info"><span class="stat-label">Total Score</span><span class="stat-value" data-testid="stat-score">${stats.totalScore.toLocaleString()}</span></div></div>
        <div class="stat-item"><div class="stat-icon">🏆</div><div class="stat-info"><span class="stat-label">Achievements</span><span class="stat-value" data-testid="stat-achievements">${stats.achievements}/${getAchievements().length}</span></div></div>
        <div class="stat-item"><div class="stat-icon">🎯</div><div class="stat-info"><span class="stat-label">Available</span><span class="stat-value" data-testid="stat-available">${stats.gamesAvailable}</span></div></div>
      </section>

      <div class="daily-challenge">
        <div class="challenge-content">
          <span class="challenge-badge">🔥 DAILY CHALLENGE</span>
          <h3 data-testid="daily-challenge-label">${challenge.icon} ${challenge.label}</h3>
          <p>Reward: +${challenge.points} XP • Resets at midnight</p>
        </div>
        <button class="challenge-btn" id="acceptChallenge" data-testid="accept-challenge-btn">
          Accept Challenge →
        </button>
      </div>

      <section>
        <div class="section-header">
          <div class="title-left">
            <h2>🔥 Popular Games</h2>
            <p>Click to play instantly — no download</p>
          </div>
          <span id="viewAll" class="view-all" data-testid="view-all-link">View All →</span>
        </div>

        <div class="games">
          ${games
      .map(
        (game, i) => `
            <div class="card" style="animation-delay:${i * 80}ms" data-testid="game-card-${game.name.toLowerCase()}">
              <button class="fav-btn ${isFavorite(game.name) ? "active" : ""}" data-fav="${game.name}" data-testid="fav-btn-${game.name.toLowerCase()}">
                ${isFavorite(game.name) ? "❤️" : "🤍"}
              </button>
              <div class="game-icon">${game.icon}</div>
              <div class="card-content">
                <h3>${game.name}</h3>
                <p>${game.category} • Best: ${getHighScore(game.name.toLowerCase()).toLocaleString()}</p>
                <button class="play" data-game="${game.name}" data-testid="play-btn-${game.name.toLowerCase()}">
                  Play Now ▶
                </button>
              </div>
            </div>
          `
      )
      .join("")}
        </div>
      </section>

      <section class="leaderboard-section" id="leaderboard">
        <div class="section-header">
          <div class="title-left">
            <h2>🏆 Leaderboard</h2>
            <p>Your personal best scores</p>
          </div>
        </div>
        <div class="leaderboard">
          ${leaderboard
      .map(
        (entry, i) => `
              <div class="leaderboard-row rank-${i + 1}" data-testid="leaderboard-row-${entry.name.toLowerCase()}">
                <div class="rank-badge">${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "#" + (i + 1)}</div>
                <div class="leaderboard-info">
                  <span class="leaderboard-emoji">${entry.emoji}</span>
                  <div>
                    <div class="leaderboard-name">${entry.name}</div>
                    <div class="leaderboard-category">${entry.category}</div>
                  </div>
                </div>
                <div class="leaderboard-score">${entry.score.toLocaleString()}</div>
              </div>
            `
      )
      .join("")}
        </div>
      </section>

      <section class="achievements-section" id="achievements">
        <div class="section-header">
          <div class="title-left">
            <h2>🏅 Achievements</h2>
            <p>Unlock rewards as you play</p>
          </div>
        </div>
        <div class="achievements">
          ${getAchievements()
      .map((a) => {
        const unlocked = isAchievementUnlocked(a.id);
        return `
                <div class="achievement ${unlocked ? "unlocked" : "locked"}" data-testid="achievement-${a.id}">
                  <span class="achievement-icon">${a.icon}</span>
                  <div class="achievement-title">${a.title}</div>
                  <div class="achievement-desc">${a.desc}</div>
                </div>
              `;
      })
      .join("")}
        </div>
      </section>
    </main>
  `;

  const soundBtn = document.getElementById("soundToggle");
  if (soundBtn) soundBtn.textContent = soundEnabled ? "🔊" : "🔇";

  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) themeBtn.textContent = isDark ? "🌙" : "☀️";

  document.querySelectorAll<HTMLAnchorElement>("[data-nav]").forEach((link) => {
    link.addEventListener("click", () => {
      const target = link.dataset.nav;
      playUISound(500, 0.06);
      if (target === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (target === "games") {
        document.querySelector(".games")?.scrollIntoView({ behavior: "smooth" });
      } else if (target === "leaderboard") {
        document.getElementById("leaderboard")?.scrollIntoView({ behavior: "smooth" });
      } else if (target === "achievements") {
        document.getElementById("achievements")?.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  document.getElementById("exploreBtn")?.addEventListener("click", () => {
    playUISound(600, 0.08);
    document.querySelector(".games")?.scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("viewAll")?.addEventListener("click", () => {
    document.querySelector(".games")?.scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("loginBtn")?.addEventListener("click", () => {
    showToast("Login coming soon! 🎮", "We're working on accounts", "info");
  });

  document.getElementById("soundToggle")?.addEventListener("click", () => {
    toggleSound();
    const btn = document.getElementById("soundToggle");
    if (btn) btn.textContent = soundEnabled ? "🔊" : "🔇";
  });

  document.getElementById("themeToggle")?.addEventListener("click", () => {
    toggleTheme();
    const btn = document.getElementById("themeToggle");
    if (btn) btn.textContent = isDark ? "🌙" : "☀️";
  });

  document.getElementById("acceptChallenge")?.addEventListener("click", () => {
    playUISound(700, 0.1);
    showToast(`🎯 Challenge accepted!`, challenge.label, "success");
    setTimeout(() => launchGame(challenge.game), 300);
  });

  document.querySelectorAll<HTMLButtonElement>(".play").forEach((button) => {
    button.addEventListener("click", () => {
      playUISound(700, 0.1);
      launchGame(button.dataset.game || "");
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-fav]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const gameName = btn.dataset.fav;
      if (!gameName) return;
      const added = toggleFavorite(gameName);
      btn.classList.toggle("active", added);
      btn.textContent = added ? "❤️" : "🤍";
      playUISound(added ? 800 : 400, 0.08);
      showToast(added ? `❤️ ${gameName} added to favorites` : `Removed from favorites`, "", "info", 1800);
    });
  });
}

// =========================
// SNAKE GAME
// =========================
function showSnake() {
  incrementPlayCount("snake");
  playUISound(600, 0.08);

  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;

  let snake = [{ x: 10, y: 10 }];
  let food = { x: 15, y: 10 };
  let direction: "UP" | "DOWN" | "LEFT" | "RIGHT" = "RIGHT";
  let nextDirection: "UP" | "DOWN" | "LEFT" | "RIGHT" = "RIGHT";
  let score = 0;
  let highScore = getHighScore("snake");
  let gameOver = false;
  let paused = false;
  let gameLoop: number | null = null;

  app.innerHTML = `
    <div class="snake-page game-page">
      <button id="backGame" class="back" data-testid="back-btn">← Back to GameZone</button>
      <h1>🐍 Snake Game</h1>
      <div class="score">
        Score: <span id="snakeScore" data-testid="snake-score">0</span>
        &nbsp;|&nbsp;
        Best: <span id="snakeBest">${highScore}</span>
      </div>
      <div id="snakeBoard" class="snake-board"></div>
      <div id="snakeMessage" class="snake-message"></div>
      <p class="instructions">PC: Arrow Keys / WASD | Mobile: Buttons | P: Pause</p>
      <div class="mobile-controls">
        <button class="direction-btn" data-dir="UP">⬆️</button>
        <div>
          <button class="direction-btn" data-dir="LEFT">⬅️</button>
          <button class="direction-btn" data-dir="DOWN">⬇️</button>
          <button class="direction-btn" data-dir="RIGHT">➡️</button>
        </div>
      </div>
    </div>
  `;

  registerCleanup(() => {
    document.removeEventListener("keydown", handleKey);
    if (gameLoop !== null) clearInterval(gameLoop);
  });

  document.getElementById("backGame")?.addEventListener("click", showHome);

  function drawBoard() {
    const board = document.querySelector<HTMLDivElement>("#snakeBoard");
    if (!board) return;
    board.innerHTML = "";

    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        const cell = document.createElement("div");
        cell.className = "snake-cell";
        if (snake.some((part) => part.x === x && part.y === y)) cell.classList.add("snake-body");
        if (food.x === x && food.y === y) cell.classList.add("snake-food");
        board.appendChild(cell);
      }
    }

    const scoreEl = document.querySelector("#snakeScore");
    if (scoreEl) scoreEl.textContent = score.toString();
    const bestEl = document.querySelector("#snakeBest");
    if (bestEl) bestEl.textContent = highScore.toString();
  }

  function changeDirection(newDir: string) {
    if (
      (newDir === "UP" && direction !== "DOWN") ||
      (newDir === "DOWN" && direction !== "UP") ||
      (newDir === "LEFT" && direction !== "RIGHT") ||
      (newDir === "RIGHT" && direction !== "LEFT")
    ) {
      nextDirection = newDir as typeof nextDirection;
    }
  }

  document.querySelectorAll<HTMLButtonElement>(".direction-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const dir = btn.dataset.dir;
      if (dir) changeDirection(dir);
    });
  });

  function handleKey(event: KeyboardEvent) {
    const key = event.key;
    const k = key.toLowerCase();
    if (key === "ArrowUp" || k === "w") { event.preventDefault(); changeDirection("UP"); }
    else if (key === "ArrowDown" || k === "s") { event.preventDefault(); changeDirection("DOWN"); }
    else if (key === "ArrowLeft" || k === "a") { event.preventDefault(); changeDirection("LEFT"); }
    else if (key === "ArrowRight" || k === "d") { event.preventDefault(); changeDirection("RIGHT"); }
    else if (k === "p" && !gameOver) {
      paused = !paused;
      const msg = document.querySelector("#snakeMessage");
      if (msg) msg.innerHTML = paused ? "<h2>⏸ Paused</h2>" : "";
    }
  }

  document.addEventListener("keydown", handleKey);

  function moveSnake() {
    if (gameOver || paused) return;
    direction = nextDirection;
    const head = { ...snake[0] };
    if (direction === "UP") head.y--;
    if (direction === "DOWN") head.y++;
    if (direction === "LEFT") head.x--;
    if (direction === "RIGHT") head.x++;

    if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20) { endGame(); return; }
    if (snake.slice(0, -1).some((p) => p.x === head.x && p.y === head.y)) { endGame(); return; }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 10;
      playUISound(800, 0.08);
      let attempts = 0;
      do {
        food = { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) };
        attempts++;
      } while (attempts < 200 && snake.some((p) => p.x === food.x && p.y === food.y));
    } else {
      snake.pop();
    }
    drawBoard();
  }

  function endGame() {
    gameOver = true;
    const isNewHigh = setHighScore("snake", score);
    if (isNewHigh) {
      highScore = score;
      launchConfetti(60);
      showToast("🏆 New High Score!", `Snake: ${score}`, "success");
    }
    checkAchievements();

    const message = document.querySelector("#snakeMessage");
    if (message) {
      message.innerHTML = `
        <h2>Game Over 😵</h2>
        ${isNewHigh ? '<p style="color:#f59e0b;font-weight:700;">🏆 New High Score!</p>' : ""}
        <p style="color:#a1a1b5;margin-bottom:0.75rem;">Final Score: ${score}</p>
        <button id="restartSnake" data-testid="snake-restart-btn">Play Again</button>
      `;
      document.getElementById("restartSnake")?.addEventListener("click", showSnake);
    }
    if (gameLoop !== null) clearInterval(gameLoop);
    document.removeEventListener("keydown", handleKey);
  }

  drawBoard();
  gameLoop = window.setInterval(() => {
    if (gameOver) {
      if (gameLoop !== null) clearInterval(gameLoop);
    } else {
      moveSnake();
    }
  }, 120);
}

// =========================
// TETRIS GAME
// =========================
function showTetris() {
  incrementPlayCount("tetris");
  playUISound(600, 0.08);

  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;

  const COLS = 10, ROWS = 20, BLOCK = 30;
  type Shape = number[][];
  type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
  type Cell = 0 | PieceType;

  const SHAPES: Record<PieceType, Shape> = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
  };

  const COLORS: Record<PieceType, string> = {
    I: "#06b6d4", O: "#facc15", T: "#a855f7",
    S: "#22c55e", Z: "#ef4444", J: "#3b82f6", L: "#f97316",
  };

  let board: Cell[][] = Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(0));
  interface Piece { type: PieceType; shape: Shape; x: number; y: number; }
  let currentPiece: Piece | null = null;
  let nextPieceType: PieceType = "I";
  let bag: PieceType[] = [];
  let score = 0, lines = 0, level = 1;
  let best = getHighScore("tetris");
  let gameOver = false, paused = false;
  let dropInterval = 800, dropTimer = 0, lastTime = performance.now();
  let rafId: number | null = null;
  let softDropping = false;
  let tetrisCancelled = false;
  let tetrisAudioCtx: AudioContext | null = null;

  function pullFromBag(): PieceType {
    if (bag.length === 0) {
      bag = ["I", "O", "T", "S", "Z", "J", "L"];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }
    return bag.pop()!;
  }

  function cloneShape(shape: Shape): Shape { return shape.map((r) => [...r]); }

  function rotateCW(shape: Shape): Shape {
    const n = shape.length;
    const r: Shape = Array.from({ length: n }, () => Array(n).fill(0));
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) r[x][n - 1 - y] = shape[y][x];
    return r;
  }
  function rotateCCW(shape: Shape): Shape {
    const n = shape.length;
    const r: Shape = Array.from({ length: n }, () => Array(n).fill(0));
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) r[n - 1 - x][y] = shape[y][x];
    return r;
  }

  function initTetrisAudio(): AudioContext | null {
    if (!tetrisAudioCtx) {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      tetrisAudioCtx = new Ctor();
    }
    if (tetrisAudioCtx.state === "suspended") tetrisAudioCtx.resume();
    return tetrisAudioCtx;
  }

  function playTetrisBeep(linesCleared: number) {
    if (!soundEnabled) return;
    const ac = initTetrisAudio();
    if (!ac) return;
    const freq = linesCleared === 0 ? 380 : 400 + linesCleared * 150;
    const duration = linesCleared >= 4 ? 0.4 : 0.08;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ac.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration + 0.05);
  }

  app.innerHTML = `
    <div class="tetris-page game-page">
      <button id="backGame" class="back" data-testid="back-btn">← Back to GameZone</button>
      <h1>🧱 TETRIS</h1>
      <div class="tetris-layout">
        <div class="tetris-board-wrapper">
          <canvas id="tetrisBoard" width="${COLS * BLOCK}" height="${ROWS * BLOCK}"></canvas>
          <div id="tetrisOverlay" class="tetris-overlay"></div>
        </div>
        <div class="tetris-side">
          <div class="tetris-panel"><h3>SCORE</h3><div class="value" id="tetrisScore" data-testid="tetris-score">0</div></div>
          <div class="tetris-panel"><h3>LINES</h3><div class="value" id="tetrisLines">0</div></div>
          <div class="tetris-panel"><h3>LEVEL</h3><div class="value" id="tetrisLevel">1</div></div>
          <div class="tetris-panel"><h3>BEST</h3><div class="value" id="tetrisBest">${best}</div></div>
          <div class="tetris-panel"><h3>NEXT</h3><canvas id="nextCanvas" width="120" height="120"></canvas></div>
          <div class="tetris-panel tetris-controls-hint">
            <h3>CONTROLS</h3>
            <div>← → : Move</div>
            <div>↓ : Soft drop</div>
            <div>↑ / X : Rotate CW</div>
            <div>Z : Rotate CCW</div>
            <div><kbd>Space</kbd> : Hard drop</div>
            <div><kbd>P</kbd> : Pause</div>
          </div>
        </div>
      </div>
      <div class="tetris-mobile-controls tetris-mobile-only">
        <button data-action="left">◀</button>
        <button data-action="rotateCCW">↺</button>
        <button data-action="softDrop">▼</button>
        <button data-action="rotateCW">↻</button>
        <button data-action="right">▶</button>
        <button data-action="hardDrop">⬇⬇</button>
        <button data-action="pause">⏸</button>
      </div>
    </div>
  `;

  // FIX: narrow once into explicitly-typed consts so closures/hoisted functions see non-null types
  const canvasEl = document.querySelector<HTMLCanvasElement>("#tetrisBoard");
  const ctxEl = canvasEl?.getContext("2d");
  const nextCanvasEl = document.querySelector<HTMLCanvasElement>("#nextCanvas");
  const nextCtxEl = nextCanvasEl?.getContext("2d");
  if (!canvasEl || !ctxEl || !nextCanvasEl || !nextCtxEl) return;
  const canvas: HTMLCanvasElement = canvasEl;
  const ctx: CanvasRenderingContext2D = ctxEl;
  const nextCanvas: HTMLCanvasElement = nextCanvasEl;
  const nextCtx: CanvasRenderingContext2D = nextCtxEl;

  function drawCell(c: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
    c.fillStyle = color;
    c.fillRect(x, y, size, size);
    c.fillStyle = "rgba(255,255,255,0.28)";
    c.fillRect(x, y, size, Math.max(1, size * 0.12));
    c.fillRect(x, y, Math.max(1, size * 0.12), size);
    c.fillStyle = "rgba(0,0,0,0.32)";
    c.fillRect(x, y + size - size * 0.12, size, size * 0.12);
    c.fillRect(x + size - size * 0.12, y, size * 0.12, size);
    c.strokeStyle = "rgba(0,0,0,0.4)";
    c.lineWidth = 1;
    c.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  }

  function drawBoard() {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = "#05070d";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(139,92,246,0.10)";
    ctx.lineWidth = 1;
    for (let x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(x * BLOCK + 0.5, 0); ctx.lineTo(x * BLOCK + 0.5, h); ctx.stroke(); }
    for (let y = 1; y < ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * BLOCK + 0.5); ctx.lineTo(w, y * BLOCK + 0.5); ctx.stroke(); }

    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const cell = board[y][x];
      if (cell !== 0) drawCell(ctx, x * BLOCK, y * BLOCK, BLOCK, COLORS[cell]);
    }

    if (currentPiece && !gameOver) {
      const gy = ghostY();
      const { shape, x: px, type } = currentPiece;
      for (let y = 0; y < shape.length; y++) for (let x = 0; x < shape[y].length; x++) {
        if (!shape[y][x]) continue;
        const bx = px + x, by = gy + y;
        if (by < 0) continue;
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = COLORS[type];
        ctx.fillRect(bx * BLOCK, by * BLOCK, BLOCK, BLOCK);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = COLORS[type];
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx * BLOCK + 1, by * BLOCK + 1, BLOCK - 2, BLOCK - 2);
      }
    }

    if (currentPiece && !gameOver) {
      const { shape, x: px, y: py, type } = currentPiece;
      for (let y = 0; y < shape.length; y++) for (let x = 0; x < shape[y].length; x++) {
        if (!shape[y][x]) continue;
        const by = py + y;
        if (by < 0) continue;
        drawCell(ctx, (px + x) * BLOCK, by * BLOCK, BLOCK, COLORS[type]);
      }
    }
  }

  function drawNext() {
    const w = nextCanvas.width, h = nextCanvas.height;
    nextCtx.fillStyle = "#05070d";
    nextCtx.fillRect(0, 0, w, h);
    const shape = SHAPES[nextPieceType];
    const color = COLORS[nextPieceType];
    let minX = shape[0].length, maxX = -1, minY = shape.length, maxY = -1;
    for (let y = 0; y < shape.length; y++) for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
    const pw = maxX - minX + 1, ph = maxY - minY + 1;
    const cs = Math.min(w / (pw + 1), h / (ph + 1), 30);
    const ox = (w - pw * cs) / 2, oy = (h - ph * cs) / 2;
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      if (shape[y][x]) drawCell(nextCtx, ox + (x - minX) * cs, oy + (y - minY) * cs, cs, color);
    }
  }

  function updateHUD() {
    const s = document.querySelector("#tetrisScore");
    const l = document.querySelector("#tetrisLines");
    const lv = document.querySelector("#tetrisLevel");
    const b = document.querySelector("#tetrisBest");
    if (s) s.textContent = score.toString();
    if (l) l.textContent = lines.toString();
    if (lv) lv.textContent = level.toString();
    if (b) b.textContent = Math.max(best, score).toString();
  }

  function collides(shape: Shape, px: number, py: number): boolean {
    for (let y = 0; y < shape.length; y++) for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;
      const bx = px + x, by = py + y;
      if (bx < 0 || bx >= COLS || by >= ROWS) return true;
      if (by < 0) continue;
      if (board[by][bx] !== 0) return true;
    }
    return false;
  }

  function spawnPiece() {
    const type = nextPieceType;
    nextPieceType = pullFromBag();
    const shape = cloneShape(SHAPES[type]);
    const x = Math.floor((COLS - shape[0].length) / 2);
    const y = type === "I" ? -1 : 0;
    currentPiece = { type, shape, x, y };
    if (collides(currentPiece.shape, currentPiece.x, currentPiece.y)) endGame();
    drawNext();
  }

  function lockPiece() {
    if (!currentPiece) return;
    const { shape, x: px, y: py, type } = currentPiece;
    for (let y = 0; y < shape.length; y++) for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;
      const by = py + y, bx = px + x;
      if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) board[by][bx] = type;
    }
    clearLines();
    spawnPiece();
  }

  function clearLines() {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (board[y].every((c) => c !== 0)) {
        board.splice(y, 1);
        board.unshift(Array<Cell>(COLS).fill(0));
        cleared++;
        y++;
      }
    }
    if (cleared > 0) {
      const points = [0, 100, 300, 500, 800][cleared] || 800;
      score += points * level;
      lines += cleared;
      const nl = Math.floor(lines / 10) + 1;
      if (nl !== level) { level = nl; dropInterval = Math.max(80, 800 - (level - 1) * 70); }
      playTetrisBeep(cleared);
      if (cleared >= 4) launchConfetti(30);
    }
  }

  function movePiece(dx: number, dy: number): boolean {
    if (!currentPiece) return false;
    if (!collides(currentPiece.shape, currentPiece.x + dx, currentPiece.y + dy)) {
      currentPiece.x += dx;
      currentPiece.y += dy;
      return true;
    }
    return false;
  }

  function rotatePiece(dir: 1 | -1) {
    if (!currentPiece) return;
    const rotated = dir === 1 ? rotateCW(currentPiece.shape) : rotateCCW(currentPiece.shape);
    for (const kx of [0, -1, 1, -2, 2]) {
      if (!collides(rotated, currentPiece.x + kx, currentPiece.y)) {
        currentPiece.shape = rotated;
        currentPiece.x += kx;
        playTetrisBeep(0);
        return;
      }
    }
  }

  function hardDrop() {
    if (!currentPiece) return;
    let dropped = 0;
    while (movePiece(0, 1)) dropped++;
    score += dropped * 2;
    lockPiece();
    dropTimer = 0;
  }

  function ghostY(): number {
    if (!currentPiece) return 0;
    let y = currentPiece.y;
    while (!collides(currentPiece.shape, currentPiece.x, y + 1)) y++;
    return y;
  }

  function startGame() {
    board = Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(0));
    score = 0; lines = 0; level = 1;
    dropInterval = 800; dropTimer = 0;
    gameOver = false; paused = false; softDropping = false;
    bag = []; nextPieceType = pullFromBag();
    spawnPiece(); updateHUD(); drawNext(); drawBoard(); clearOverlay();
    lastTime = performance.now();
  }

  function endGame() {
    gameOver = true;
    const isNewHigh = setHighScore("tetris", score);
    if (isNewHigh) {
      best = score;
      launchConfetti(80);
      showToast("🏆 New High Score!", `Tetris: ${score}`, "success");
    }
    checkAchievements();
    const overlay = document.querySelector("#tetrisOverlay");
    if (overlay) {
      overlay.innerHTML = `
        <div class="finish-box">
          <div style="font-size:52px;">🧱</div>
          <h2>GAME OVER</h2>
          ${isNewHigh ? '<p style="color:#f59e0b;font-weight:700;">🏆 New High Score!</p>' : ""}
          <p>Score: <strong>${score}</strong></p>
          <p>Lines: <strong>${lines}</strong></p>
          <p>Level: <strong>${level}</strong></p>
          <button id="restartTetris" data-testid="tetris-restart-btn">Play Again</button>
        </div>
      `;
      document.getElementById("restartTetris")?.addEventListener("click", startGame);
    }
  }

  function togglePause() {
    if (gameOver) return;
    paused = !paused;
    const overlay = document.querySelector("#tetrisOverlay");
    if (!overlay) return;
    if (paused) {
      overlay.innerHTML = `
        <div class="finish-box">
          <div style="font-size:52px;">⏸</div>
          <h2>PAUSED</h2>
          <p>Press P or tap ⏸ to resume</p>
          <button id="resumeTetris">Resume</button>
        </div>
      `;
      document.getElementById("resumeTetris")?.addEventListener("click", togglePause);
    } else {
      clearOverlay();
      lastTime = performance.now();
    }
  }

  function clearOverlay() {
    const o = document.querySelector("#tetrisOverlay");
    if (o) o.innerHTML = "";
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === "p" || e.key === "P") { e.preventDefault(); togglePause(); return; }
    if (gameOver || paused) return;
    switch (e.key) {
      case "ArrowLeft": e.preventDefault(); movePiece(-1, 0); drawBoard(); break;
      case "ArrowRight": e.preventDefault(); movePiece(1, 0); drawBoard(); break;
      case "ArrowDown": e.preventDefault(); softDropping = true; if (movePiece(0, 1)) { score += 1; updateHUD(); } drawBoard(); break;
      case "ArrowUp": case "x": case "X": e.preventDefault(); rotatePiece(1); drawBoard(); break;
      case "z": case "Z": e.preventDefault(); rotatePiece(-1); drawBoard(); break;
      case " ": e.preventDefault(); hardDrop(); updateHUD(); drawBoard(); drawNext(); break;
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === "ArrowDown") softDropping = false;
  }

  window.addEventListener("keydown", handleKey);
  window.addEventListener("keyup", handleKeyUp);

  document.querySelectorAll<HTMLButtonElement>(".tetris-mobile-controls button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (gameOver) return;
      const action = btn.dataset.action;
      if (action === "pause") { togglePause(); return; }
      if (paused) return;
      switch (action) {
        case "left": movePiece(-1, 0); break;
        case "right": movePiece(1, 0); break;
        case "softDrop": if (movePiece(0, 1)) score += 1; updateHUD(); break;
        case "rotateCW": rotatePiece(1); break;
        case "rotateCCW": rotatePiece(-1); break;
        case "hardDrop": hardDrop(); updateHUD(); drawNext(); break;
      }
      drawBoard();
    });
  });

  function loop(now: number) {
    if (tetrisCancelled) return;
    const delta = now - lastTime;
    lastTime = now;
    if (!gameOver && !paused) {
      dropTimer += delta;
      const interval = softDropping ? Math.min(50, dropInterval) : dropInterval;
      if (dropTimer >= interval) {
        dropTimer = 0;
        if (!movePiece(0, 1)) { lockPiece(); updateHUD(); drawNext(); }
        drawBoard();
      }
    }
    rafId = requestAnimationFrame(loop);
  }

  function cleanup() {
    tetrisCancelled = true;
    window.removeEventListener("keydown", handleKey);
    window.removeEventListener("keyup", handleKeyUp);
    if (rafId !== null) cancelAnimationFrame(rafId);
    if (tetrisAudioCtx) { try { tetrisAudioCtx.close(); } catch { /* ignore */ } tetrisAudioCtx = null; }
  }

  registerCleanup(cleanup);

  document.getElementById("backGame")?.addEventListener("click", showHome);

  startGame();
  rafId = requestAnimationFrame(loop);
}

// =========================
// RACING GAME
// =========================
function showRacing() {
  incrementPlayCount("racing");
  playUISound(600, 0.08);

  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;

  app.innerHTML = `
    <div class="racing-page game-page">
      <header class="header race-header">
        <div class="logo">🎮 GameZone</div>
        <button id="backHome" class="back-btn" data-testid="back-btn">← GameZone</button>
      </header>
      <main class="race-main">
        <div class="race-top">
          <div class="race-stat"><span>🏁 SPEED</span><strong id="speedValue">0</strong><small>km/h</small></div>
          <div class="race-stat"><span>📍 DISTANCE</span><strong id="distanceValue" data-testid="race-distance">0</strong><small>m</small></div>
          <div class="race-stat"><span>🚗 PASSED</span><strong id="passedValue">0</strong><small>cars</small></div>
          <div class="race-stat"><span>🏆 BEST</span><strong id="bestValue">0</strong><small>m</small></div>
        </div>
        <div class="race-wrapper">
          <canvas id="raceCanvas"></canvas>
          <div id="countdown" class="race-countdown">3</div>
          <div class="race-hud">
            <div class="nitro-box">
              <span>⚡ NITRO</span>
              <div class="nitro-bar"><div id="nitroFill"></div></div>
            </div>
          </div>
          <div id="raceMessage" class="race-message"></div>
        </div>
        <div class="race-controls">
          <button id="leftControl" class="race-control">◀</button>
          <button id="nitroControl" class="nitro-control">⚡ NITRO</button>
          <button id="rightControl" class="race-control">▶</button>
        </div>
        <div class="race-help">⌨️ Arrow / A-D = Steering &nbsp;&nbsp; Space / N = Nitro</div>
      </main>
    </div>
  `;

  // FIX: typed non-null consts (closures lose `if (!x) return` narrowing)
  const raceCanvasEl = document.querySelector<HTMLCanvasElement>("#raceCanvas");
  const ctxEl = raceCanvasEl?.getContext("2d");
  if (!raceCanvasEl || !ctxEl) return;
  const raceCanvas: HTMLCanvasElement = raceCanvasEl;
  const ctx: CanvasRenderingContext2D = ctxEl;

  function resizeCanvas() {
    const wrapper = document.querySelector<HTMLElement>(".race-wrapper");
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    raceCanvas.width = Math.max(320, Math.floor(rect.width));
    raceCanvas.height = Math.max(500, Math.floor(rect.height));
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  let gameOver = false, raceStarted = false, raceCancelled = false;
  let playerX = 0, playerVisualX = 0, playerTilt = 0;
  let speed = 0, distance = 0, nitro = 100, carsPassed = 0;
  let lastTime = performance.now();
  let crashFlash = 0, shake = 0;
  const SPAWN_AHEAD = 900, DESPAWN_BEHIND = -200;
  const bestDistance = getHighScore("racing");
  const keys = { left: false, right: false, nitro: false };

  const CAR_COLORS = ["#ef4444", "#3b82f6", "#facc15", "#22c55e", "#f97316", "#a855f7", "#06b6d4", "#ec4899", "#84cc16", "#f43f5e"];
  const opponents: Opponent[] = [];

  function createOpponent(aheadBy: number): Opponent {
    const lanes = [-0.55, -0.18, 0.18, 0.55];
    let lane = lanes[Math.floor(Math.random() * lanes.length)];
    let tries = 0;
    while (tries < 6 && opponents.some((o) => Math.abs(o.worldDistance - (distance + aheadBy)) < 70 && Math.abs(o.x - lane) < 0.4)) {
      lane = lanes[Math.floor(Math.random() * lanes.length)];
      tries++;
    }
    return {
      x: lane,
      worldDistance: distance + aheadBy,
      speed: 0.70 + Math.random() * 0.25,
      color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
      passed: false,
    };
  }

  function manageOpponents() {
    for (let i = opponents.length - 1; i >= 0; i--) {
      const o = opponents[i];
      if (o.worldDistance - distance < DESPAWN_BEHIND) {
        if (!o.passed) { o.passed = true; carsPassed++; }
        opponents.splice(i, 1);
      }
    }
    const carsAhead = opponents.filter((o) => o.worldDistance - distance > 0).length;
    const targetAhead = 6;
    if (carsAhead < targetAhead) {
      for (let i = 0; i < targetAhead - carsAhead; i++) {
        opponents.push(createOpponent(SPAWN_AHEAD * 0.5 + Math.random() * SPAWN_AHEAD * 0.5));
      }
    }
  }

  const trees = Array.from({ length: 120 }, (_, i) => ({
    worldDistance: i * 34 + Math.random() * 25,
    side: Math.random() > 0.5 ? -1 : 1,
    size: 0.7 + Math.random() * 0.7,
  }));

  let audioCtx: AudioContext | null = null;
  let engineOsc: OscillatorNode | null = null;
  let engineGain: GainNode | null = null;
  let engineFilter: BiquadFilterNode | null = null;
  let nitroSoundPlaying = false;

  function initAudio(): AudioContext | null {
    if (!audioCtx) {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function startEngineSound() {
    if (!soundEnabled) return;
    const ac = initAudio();
    if (!ac || engineOsc) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();
    osc.type = "triangle";
    osc.frequency.value = 55;
    filter.type = "lowpass";
    filter.frequency.value = 900;
    gain.gain.value = 0;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    gain.gain.linearRampToValueAtTime(0.05, ac.currentTime + 0.4);
    engineOsc = osc; engineGain = gain; engineFilter = filter;
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
    } catch { /* ignore */ }
    engineOsc = null; engineGain = null; engineFilter = null;
  }

  function playBeep(frequency = 600, duration = 0.15) {
    if (!soundEnabled) return;
    const ac = initAudio();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ac.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration + 0.05);
  }

  function playCrashSound() {
    if (!soundEnabled) return;
    const ac = initAudio();
    if (!ac) return;
    const bufferSize = ac.sampleRate * 0.5;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const noise = ac.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ac.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 1200;
    const noiseGain = ac.createGain();
    noiseGain.gain.setValueAtTime(0.4, ac.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ac.destination);
    noise.start();
    const thump = ac.createOscillator();
    const thumpGain = ac.createGain();
    thump.type = "sine";
    thump.frequency.setValueAtTime(120, ac.currentTime);
    thump.frequency.exponentialRampToValueAtTime(30, ac.currentTime + 0.4);
    thumpGain.gain.setValueAtTime(0.35, ac.currentTime);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.45);
    thump.connect(thumpGain);
    thumpGain.connect(ac.destination);
    thump.start();
    thump.stop(ac.currentTime + 0.5);
  }

  function playNitroSound() {
    if (!soundEnabled) return;
    const ac = initAudio();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ac.currentTime + 0.3);
    filter.type = "bandpass";
    filter.frequency.value = 800;
    filter.Q.value = 4;
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ac.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + 0.4);
  }

  const HORIZON = 0.40, TOP_ROAD_W = 40, BOTTOM_ROAD_W = 280;

  function roadHalfWidthAt(y: number): number {
    const h = raceCanvas.height;
    const top = h * HORIZON;
    const t = Math.max(0, Math.min(1, (y - top) / (h - top)));
    return TOP_ROAD_W + t * (BOTTOM_ROAD_W - TOP_ROAD_W);
  }
  function roadCenterAt(_y: number): number { return raceCanvas.width / 2; }

  const VIEW_DISTANCE = 700;
  function worldToScreen(worldDist: number) {
    const rel = worldDist - distance;
    if (rel < -30 || rel > VIEW_DISTANCE) return null;
    const t = 1 - rel / VIEW_DISTANCE;
    const h = raceCanvas.height;
    const yTop = h * HORIZON, yBottom = h * 0.86;
    const depth = t * t;
    return { y: yTop + depth * (yBottom - yTop), scale: 0.15 + depth * 1.05, depth };
  }

  function drawSky() {
    const w = raceCanvas.width, h = raceCanvas.height;
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
      const m = h * 0.30 + Math.sin(x * 0.015) * 35 + Math.sin(x * 0.035) * 20;
      ctx.lineTo(x, m);
    }
    ctx.lineTo(w, h * 0.55);
    ctx.lineTo(0, h * 0.55);
    ctx.closePath();
    ctx.fill();
  }

  function drawRoad() {
    const w = raceCanvas.width, h = raceCanvas.height;
    ctx.fillStyle = "#15803d";
    ctx.fillRect(0, h * HORIZON, w, h);
    const center = roadCenterAt(0);
    const top = h * HORIZON, bottom = h;
    ctx.beginPath();
    ctx.moveTo(center - TOP_ROAD_W, top);
    ctx.lineTo(center + TOP_ROAD_W, top);
    ctx.lineTo(center + BOTTOM_ROAD_W, bottom);
    ctx.lineTo(center - BOTTOM_ROAD_W, bottom);
    ctx.closePath();
    ctx.fillStyle = "#303030";
    ctx.fill();
    for (let y = top; y < bottom; y += 10) {
      const hw = roadHalfWidthAt(y);
      const stripe = Math.floor(y / 25) % 2 === 0;
      ctx.fillStyle = stripe ? "#ef4444" : "#ffffff";
      ctx.fillRect(center - hw - 8, y, 8, 12);
      ctx.fillRect(center + hw, y, 8, 12);
    }
    for (let y = top; y < bottom; y += 35) {
      if (Math.floor(y / 35) % 2 !== 0) continue;
      const hw = roadHalfWidthAt(y);
      for (const lane of [-0.33, 0.33]) {
        const x = center + lane * hw;
        const sw = 4 + (y / bottom) * 3;
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(x - sw / 2, y, sw, 22);
      }
    }
  }

  function drawTrees() {
    const sorted = [...trees].sort((a, b) => b.worldDistance - a.worldDistance);
    for (const tree of sorted) {
      const screen = worldToScreen(tree.worldDistance);
      if (!screen) continue;
      const { y, scale } = screen;
      const center = roadCenterAt(y);
      const hw = roadHalfWidthAt(y);
      const x = center + tree.side * (hw + 45 * scale);
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

  function shade(hex: string, percent: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + percent));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + percent));
    const b = Math.max(0, Math.min(255, (num & 0xff) + percent));
    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
  }

  function rr(x: number, y: number, w: number, h: number, r: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }

  function drawCar(x: number, y: number, scale: number, color: string, player = false) {
    const width = 52 * scale, height = 92 * scale;
    ctx.save();
    ctx.translate(x, y);
    if (player && playerTilt !== 0) ctx.rotate(playerTilt * 0.10);
    ctx.beginPath();
    ctx.ellipse(0, height * 0.48, width * 0.75, height * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fill();
    if (player) rr(-width / 2 - 3, -height / 2 - 3, width + 6, height + 6, width * 0.22, "#f0abfc");
    rr(-width / 2, height * 0.28, width, height * 0.22, width * 0.12, shade(color, -25));
    rr(-width / 2, -height / 2, width, height * 0.85, width * 0.18, color);
    rr(-width * 0.34, -height * 0.22, width * 0.68, height * 0.38, width * 0.1, shade(color, -35));
    rr(-width * 0.28, -height * 0.18, width * 0.56, height * 0.16, width * 0.05, "#0f172a");
    rr(-width * 0.24, -height * 0.16, width * 0.48, height * 0.06, width * 0.04, "rgba(96,165,250,0.55)");
    rr(-width * 0.42, height * 0.22, width * 0.22, height * 0.09, width * 0.03, "#dc2626");
    rr(width * 0.20, height * 0.22, width * 0.22, height * 0.09, width * 0.03, "#dc2626");
    if (!player) {
      rr(-width * 0.40, height * 0.24, width * 0.18, height * 0.05, width * 0.02, "rgba(248,113,113,0.6)");
      rr(width * 0.22, height * 0.24, width * 0.18, height * 0.05, width * 0.02, "rgba(248,113,113,0.6)");
    }
    rr(-width * 0.56, -height * 0.18, width * 0.13, height * 0.32, width * 0.04, "#0a0a0a");
    rr(width * 0.43, -height * 0.18, width * 0.13, height * 0.32, width * 0.04, "#0a0a0a");
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

  function drawOpponents() {
    const sorted = [...opponents].sort((a, b) => b.worldDistance - a.worldDistance);
    for (const opp of sorted) {
      const screen = worldToScreen(opp.worldDistance);
      if (!screen) continue;
      const { y, scale } = screen;
      const center = roadCenterAt(y);
      const hw = roadHalfWidthAt(y);
      drawCar(center + opp.x * hw, y, scale, opp.color, false);
    }
  }

  function drawPlayer() {
    const h = raceCanvas.height;
    const center = roadCenterAt(h * 0.86);
    const hw = roadHalfWidthAt(h * 0.86);
    const clampedX = Math.max(-0.68, Math.min(0.68, playerVisualX));
    let y = h * 0.86;
    if (raceStarted && !gameOver) y += Math.sin(performance.now() * 0.02) * 2;
    drawCar(center + clampedX * hw, y, 1.25, "#8b5cf6", true);
  }

  function showCrashEffect() { crashFlash = 1; shake = 22; }

  function drawCrashEffect() {
    if (crashFlash <= 0.01) return;
    const w = raceCanvas.width, h = raceCanvas.height;
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

  function draw() {
    const w = raceCanvas.width, h = raceCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    if (shake > 0.5) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    drawSky();
    drawRoad();
    drawTrees();
    drawOpponents();
    drawPlayer();
    ctx.restore();
    drawCrashEffect();
  }

  function updateHUD() {
    const s = document.querySelector("#speedValue");
    const d = document.querySelector("#distanceValue");
    const p = document.querySelector("#passedValue");
    const b = document.querySelector("#bestValue");
    const n = document.querySelector<HTMLElement>("#nitroFill");
    if (s) s.textContent = Math.floor(speed * 220).toString();
    if (d) d.textContent = Math.floor(distance).toString();
    if (p) p.textContent = carsPassed.toString();
    if (b) b.textContent = Math.floor(bestDistance).toString();
    if (n) n.style.width = `${Math.max(0, Math.min(100, nitro))}%`;
  }

  function checkCollision() {
    for (const o of opponents) {
      if (Math.abs(o.worldDistance - distance) < 50 && Math.abs(o.x - playerX) < 0.30) {
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
    const isNewHigh = setHighScore("racing", Math.floor(distance));
    if (isNewHigh) {
      launchConfetti(70);
      showToast("🏆 New High Score!", `Racing: ${Math.floor(distance)}m`, "success");
    }
    checkAchievements();
    const msg = document.querySelector("#raceMessage");
    if (msg) {
      msg.innerHTML = `
        <div class="finish-box">
          <div style="font-size:55px;">💥</div>
          <h2>CRASHED!</h2>
          ${isNewHigh ? '<p style="color:#f59e0b;font-weight:700;">🏆 New High Score!</p>' : ""}
          <p>Distance: <strong>${Math.floor(distance)} m</strong></p>
          <p>Cars Passed: <strong>${carsPassed}</strong></p>
          <button id="restartRace" data-testid="race-restart-btn">Race Again 🏎️</button>
        </div>
      `;
      document.getElementById("restartRace")?.addEventListener("click", showRacing);
    }
    document.querySelector("#countdown")?.remove();
  }

  function update(delta: number) {
    if (gameOver || !raceStarted) {
      playerVisualX += (playerX - playerVisualX) * 0.2;
      playerTilt += ((keys.left ? -1 : keys.right ? 1 : 0) - playerTilt) * 0.15;
      return;
    }
    const ss = 0.0017 * delta;
    if (keys.left) playerX -= ss;
    if (keys.right) playerX += ss;
    playerX = Math.max(-0.68, Math.min(0.68, playerX));
    playerVisualX += (playerX - playerVisualX) * 0.2;
    const tt = keys.left ? -1 : keys.right ? 1 : 0;
    playerTilt += (tt - playerTilt) * 0.15;
    if (speed < 1) speed += 0.00045 * delta;
    if (keys.nitro && nitro > 0) {
      speed += 0.0020 * delta;
      nitro -= 0.055 * delta;
      if (!nitroSoundPlaying) { playNitroSound(); nitroSoundPlaying = true; }
    } else {
      nitroSoundPlaying = false;
      if (speed > 1) speed -= 0.00025 * delta;
      if (nitro < 100) nitro += 0.012 * delta;
    }
    speed = Math.max(0, Math.min(1.45, speed));
    nitro = Math.max(0, Math.min(100, nitro));
    distance += speed * 0.30 * delta;
    for (const o of opponents) o.worldDistance += o.speed * 0.24 * delta;
    manageOpponents();
    checkCollision();
    updateHUD();
    updateEngineSound();
  }

  let rafId: number | null = null;
  function gameLoop(currentTime: number) {
    if (raceCancelled) return;
    const delta = Math.min(40, currentTime - lastTime);
    lastTime = currentTime;
    update(delta);
    draw();
    // keep drawing after crash until the flash fades
    if (gameOver && crashFlash <= 0.01) return;
    rafId = requestAnimationFrame(gameLoop);
  }

  let countdownTimer: number | null = null;
  function startCountdown() {
    const countdownEl = document.querySelector<HTMLElement>("#countdown");
    if (!countdownEl) return;
    const el: HTMLElement = countdownEl; // FIX: non-null for nested tick()
    let n = 3;
    function tick() {
      if (raceCancelled) return;
      if (n > 0) {
        el.textContent = n.toString();
        playBeep(n === 1 ? 800 : 600, 0.15);
        n--;
        countdownTimer = window.setTimeout(tick, 1000);
      } else {
        el.textContent = "GO!";
        playBeep(900, 0.3);
        raceStarted = true;
        startEngineSound();
        countdownTimer = window.setTimeout(() => el.remove(), 500);
      }
    }
    tick();
  }

  function onKeyDown(e: KeyboardEvent) {
    const k = e.key.toLowerCase();
    if (e.key === "ArrowLeft" || k === "a") { e.preventDefault(); keys.left = true; }
    if (e.key === "ArrowRight" || k === "d") { e.preventDefault(); keys.right = true; }
    if (e.key === " " || k === "n") { e.preventDefault(); keys.nitro = true; }
    initAudio();
  }
  function onKeyUp(e: KeyboardEvent) {
    const k = e.key.toLowerCase();
    if (e.key === "ArrowLeft" || k === "a") keys.left = false;
    if (e.key === "ArrowRight" || k === "d") keys.right = false;
    if (e.key === " " || k === "n") keys.nitro = false;
  }
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  function setupHoldButton(selector: string, key: "left" | "right" | "nitro") {
    const btn = document.querySelector(selector);
    if (!btn) return;
    const down = (e: Event) => { e.preventDefault(); initAudio(); keys[key] = true; };
    const up = () => { keys[key] = false; };
    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointercancel", up);
    btn.addEventListener("pointerleave", up);
  }
  setupHoldButton("#leftControl", "left");
  setupHoldButton("#rightControl", "right");
  setupHoldButton("#nitroControl", "nitro");

  function cleanup() {
    raceCancelled = true;
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("resize", resizeCanvas);
    if (rafId !== null) cancelAnimationFrame(rafId);
    if (countdownTimer !== null) clearTimeout(countdownTimer);
    stopEngineSound();
    if (audioCtx) { try { audioCtx.close(); } catch { /* ignore */ } audioCtx = null; }
  }
  registerCleanup(cleanup);
  document.getElementById("backHome")?.addEventListener("click", showHome);

  manageOpponents();
  updateHUD();
  draw();
  startCountdown();
  rafId = requestAnimationFrame(gameLoop);
}

// =========================
// QUIZ GAME (100 questions, 10 per round, 15s timer)
// =========================
function showQuiz() {
  const appEl = document.querySelector<HTMLDivElement>("#app");
  if (!appEl) return;
  const app: HTMLDivElement = appEl;

  const ROUND_SIZE = 10;
  const TIME_LIMIT = 15;
  const categories = ["All", ...Object.keys(QUIZ_BANK)];

  let selectedCat = "All";
  let round: QuizQuestion[] = [];
  let idx = 0, score = 0, correctCount = 0, streak = 0, bestStreak = 0;
  let locked = false;
  let timeLeft = TIME_LIMIT;
  let timerId: number | null = null;
  let advanceId: number | null = null;
  const answers: { q: QuizQuestion; picked: number }[] = [];

  function clearTimers() {
    if (timerId !== null) { clearInterval(timerId); timerId = null; }
    if (advanceId !== null) { clearTimeout(advanceId); advanceId = null; }
  }

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function shell(inner: string) {
    app.innerHTML = `
      <div class="quiz-page game-page">
        <button id="backGame" class="back" data-testid="back-btn">← Back to GameZone</button>
        <h1>🧠 Brain Quiz</h1>
        ${inner}
      </div>`;
    document.getElementById("backGame")?.addEventListener("click", showHome);
  }

  function renderStart() {
    clearTimers();
    const best = getHighScore("quiz");
    const countFor = (c: string) => (c === "All" ? QUIZ_QUESTIONS.length : QUIZ_BANK[c].length);
    shell(`
      <div class="quiz-card quiz-start" data-testid="quiz-start-screen">
        <p class="quiz-sub">${QUIZ_QUESTIONS.length} real questions • ${ROUND_SIZE} random per round • ${TIME_LIMIT}s each</p>
        <div class="quiz-best">🏆 Best: <strong data-testid="quiz-best-score">${best.toLocaleString()}</strong></div>
        <h3 class="quiz-label">Choose a category</h3>
        <div class="quiz-cats">
          ${categories.map((c) => `
            <button class="quiz-cat ${c === selectedCat ? "active" : ""}" data-cat="${c}" data-testid="quiz-cat-${c.toLowerCase()}">
              <span>${QUIZ_CAT_ICONS[c]}</span> ${c} <small>${countFor(c)}</small>
            </button>`).join("")}
        </div>
        <ul class="quiz-rules">
          <li>✅ Correct = 100 pts + 10 pts per second left</li>
          <li>🔥 3+ streak = +50 bonus per answer</li>
          <li>⌨️ Keys 1–4 / A–D to answer, Enter to start</li>
        </ul>
        <button class="quiz-start-btn" id="quizStart" data-testid="quiz-start-btn">Start Quiz ▶</button>
      </div>
    `);
    document.querySelectorAll<HTMLButtonElement>("[data-cat]").forEach((b) => {
      b.addEventListener("click", () => {
        selectedCat = b.dataset.cat || "All";
        playUISound(520, 0.05);
        document.querySelectorAll(".quiz-cat").forEach((x) => x.classList.toggle("active", x === b));
      });
    });
    document.getElementById("quizStart")?.addEventListener("click", startRound);
  }

  function startRound() {
    clearTimers();
    incrementPlayCount("quiz");
    playUISound(700, 0.1);
    const pool = selectedCat === "All" ? QUIZ_QUESTIONS : QUIZ_QUESTIONS.filter((q) => q.category === selectedCat);
    round = shuffle(pool).slice(0, ROUND_SIZE).map((q) => {
      const order = shuffle(q.options.map((_, i) => i));
      return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
    });
    idx = 0; score = 0; correctCount = 0; streak = 0; bestStreak = 0;
    answers.length = 0;
    renderQuestion();
  }

  function renderQuestion() {
    clearTimers();
    locked = false;
    timeLeft = TIME_LIMIT;
    const q = round[idx];
    shell(`
      <div class="quiz-card" data-testid="quiz-question-screen">
        <div class="quiz-top">
          <span class="quiz-progress" data-testid="quiz-progress">Q ${idx + 1}/${round.length}</span>
          <span class="quiz-badge">${QUIZ_CAT_ICONS[q.category]} ${q.category}</span>
          <span class="quiz-score">⭐ <strong data-testid="quiz-score">${score}</strong></span>
          <span class="quiz-streak ${streak >= 3 ? "hot" : ""}">🔥 ${streak}</span>
        </div>
        <div class="quiz-steps">${round.map((_, i) => `<i class="${i < idx ? (answers[i]?.picked === round[i].answer ? "ok" : "bad") : i === idx ? "now" : ""}"></i>`).join("")}</div>
        <div class="quiz-timer"><div id="quizTimerFill" class="quiz-timer-fill"></div><span id="quizTimerText" data-testid="quiz-timer">${TIME_LIMIT}s</span></div>
        <h2 class="quiz-question" data-testid="quiz-question-text">${q.q}</h2>
        <div class="quiz-options">
          ${q.options.map((o, i) => `
            <button class="quiz-option" data-opt="${i}" data-testid="quiz-option-${i}">
              <span class="quiz-key">${"ABCD"[i]}</span><span class="quiz-opt-text">${o}</span>
            </button>`).join("")}
        </div>
        <div id="quizFeedback" class="quiz-feedback" data-testid="quiz-feedback"></div>
      </div>
    `);
    document.querySelectorAll<HTMLButtonElement>("[data-opt]").forEach((b) => {
      b.addEventListener("click", () => pick(parseInt(b.dataset.opt || "0", 10)));
    });

    const start = performance.now();
    timerId = window.setInterval(() => {
      const elapsed = (performance.now() - start) / 1000;
      timeLeft = Math.max(0, TIME_LIMIT - elapsed);
      const fill = document.getElementById("quizTimerFill");
      const txt = document.getElementById("quizTimerText");
      if (fill) {
        fill.style.width = `${(timeLeft / TIME_LIMIT) * 100}%`;
        fill.classList.toggle("danger", timeLeft <= 5);
      }
      if (txt) txt.textContent = `${Math.ceil(timeLeft)}s`;
      if (timeLeft <= 0) pick(-1);
    }, 100);
  }

  function pick(choice: number) {
    if (locked) return;
    locked = true;
    clearTimers();
    const q = round[idx];
    const isCorrect = choice === q.answer;
    answers.push({ q, picked: choice });

    let gained = 0;
    if (isCorrect) {
      streak++;
      bestStreak = Math.max(bestStreak, streak);
      correctCount++;
      gained = 100 + Math.ceil(timeLeft) * 10 + (streak >= 3 ? 50 : 0);
      score += gained;
      playUISound(880, 0.12);
    } else {
      streak = 0;
      playUISound(220, 0.25);
    }

    document.querySelectorAll<HTMLButtonElement>("[data-opt]").forEach((b) => {
      const i = parseInt(b.dataset.opt || "0", 10);
      b.disabled = true;
      if (i === q.answer) b.classList.add("correct");
      else if (i === choice) b.classList.add("wrong");
    });

    const scoreEl = document.querySelector('[data-testid="quiz-score"]');
    if (scoreEl) scoreEl.textContent = score.toString();

    const fb = document.getElementById("quizFeedback");
    if (fb) {
      fb.className = `quiz-feedback ${isCorrect ? "ok" : "bad"}`;
      fb.textContent = isCorrect
        ? `Correct! +${gained}${streak >= 3 ? " (🔥 streak bonus)" : ""}`
        : choice === -1
          ? `⏰ Time's up! Answer: ${q.options[q.answer]}`
          : `Wrong! Correct answer: ${q.options[q.answer]}`;
    }

    advanceId = window.setTimeout(() => {
      idx++;
      if (idx < round.length) renderQuestion();
      else renderResult();
    }, 1500);
  }

  function renderResult() {
    clearTimers();
    const isNewHigh = setHighScore("quiz", score);
    if (correctCount === round.length) localStorage.setItem("gz_quiz_perfect", "1");
    if (isNewHigh) showToast("🏆 New High Score!", `Quiz: ${score}`, "success");
    if (isNewHigh || correctCount >= 8) launchConfetti(70);
    checkAchievements();

    const pct = Math.round((correctCount / round.length) * 100);
    const verdict =
      pct === 100 ? "🎓 Genius! Perfect round!" :
        pct >= 80 ? "🌟 Brilliant work!" :
          pct >= 50 ? "👍 Good effort!" : "📚 Keep learning, try again!";

    shell(`
      <div class="quiz-card quiz-result" data-testid="quiz-result-screen">
        <div class="quiz-verdict">${verdict}</div>
        ${isNewHigh ? '<p class="quiz-newhigh" data-testid="quiz-new-high">🏆 New High Score!</p>' : ""}
        <div class="quiz-result-grid">
          <div><span>SCORE</span><strong data-testid="quiz-final-score">${score}</strong></div>
          <div><span>CORRECT</span><strong data-testid="quiz-correct-count">${correctCount}/${round.length}</strong></div>
          <div><span>ACCURACY</span><strong>${pct}%</strong></div>
          <div><span>BEST STREAK</span><strong>${bestStreak}</strong></div>
        </div>
        <div class="quiz-actions">
          <button id="quizAgain" class="quiz-start-btn" data-testid="quiz-play-again-btn">Play Again ▶</button>
          <button id="quizChange" class="quiz-ghost-btn" data-testid="quiz-change-category-btn">Change Category</button>
        </div>
        <h3 class="quiz-label">Review</h3>
        <ol class="quiz-review" data-testid="quiz-review-list">
          ${answers.map(({ q, picked }) => `
            <li class="${picked === q.answer ? "ok" : "bad"}">
              <div class="rq">${q.q}</div>
              <div class="ra">${picked === q.answer ? "✅" : "❌"} ${picked === -1 ? "No answer" : q.options[picked]}${picked !== q.answer ? ` → <b>${q.options[q.answer]}</b>` : ""}</div>
            </li>`).join("")}
        </ol>
      </div>
    `);
    document.getElementById("quizAgain")?.addEventListener("click", startRound);
    document.getElementById("quizChange")?.addEventListener("click", renderStart);
  }

  function onKey(e: KeyboardEvent) {
    const k = e.key.toLowerCase();
    if (document.querySelector('[data-testid="quiz-question-screen"]') && !locked) {
      const map: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3, a: 0, b: 1, c: 2, d: 3 };
      if (k in map) { e.preventDefault(); pick(map[k]); }
    } else if (k === "enter" && document.querySelector('[data-testid="quiz-start-screen"]')) {
      e.preventDefault();
      startRound();
    }
  }
  document.addEventListener("keydown", onKey);

  registerCleanup(() => {
    clearTimers();
    document.removeEventListener("keydown", onKey);
  });

  playUISound(600, 0.08);
  renderStart();
}

// =========================
// KEYBOARD SHORTCUTS
// =========================
function setupGlobalShortcuts() {
  document.addEventListener("keydown", (e) => {
    if (!document.querySelector(".hero")) return;
    if ((e.target as HTMLElement)?.tagName === "INPUT") return;

    const k = e.key.toLowerCase();
    if (k === "1") showSnake();
    else if (k === "2") showTetris();
    else if (k === "3") showRacing();
    else if (k === "4") showQuiz();
    else if (k === "t") {
      toggleTheme();
      const btn = document.getElementById("themeToggle");
      if (btn) btn.textContent = isDark ? "🌙" : "☀️";
    } else if (k === "s") {
      toggleSound();
      const btn = document.getElementById("soundToggle");
      if (btn) btn.textContent = soundEnabled ? "🔊" : "🔇";
    }
  });
}

// =========================
// INIT
// =========================
initTheme();
initSoundState();
createBackgroundParticles();
setupGlobalShortcuts();

let resizeTimeout: number | null = null;
window.addEventListener("resize", () => {
  if (resizeTimeout !== null) clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(() => {
    createBackgroundParticles();
  }, 500);
});

// =========================
// START WEBSITE
// =========================
showHome();
