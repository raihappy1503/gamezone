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

          <span>
            View All →
          </span>

        </div>

        <div class="games">

          ${games.map(game => `

            <div class="card">

              <div class="game-icon">
                ${game.icon}
              </div>

              <div class="card-content">

                <h3>
                  ${game.name}
                </h3>

                <p>
                  ${game.category}
                </p>

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


  // PLAY BUTTONS

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
          alert("Racing coming soon 🏎️");
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

  let snake = [
    { x: 10, y: 10 }
  ];

  let food = {
    x: 15,
    y: 10
  };

  let direction = "RIGHT";

  let score = 0;

  let gameOver = false;


  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `

    <div class="snake-page">

      <button id="backGame" class="back">
        ← Back to GameZone
      </button>

      <h1>
        🐍 Snake Game
      </h1>

      <div class="score">
        Score:
        <span id="snakeScore">
          0
        </span>
      </div>

      <div
        id="snakeBoard"
        class="snake-board">
      </div>

      <div id="snakeMessage"></div>

      <p class="instructions">
        PC: Use Arrow Keys | Mobile: Use buttons
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


  // BACK BUTTON

  document
    .querySelector("#backGame")
    ?.addEventListener("click", () => {

      showHome();

    });


  // DRAW BOARD

  function drawBoard() {

    const board =
      document.querySelector<HTMLDivElement>(
        "#snakeBoard"
      );

    if (!board) return;

    board.innerHTML = "";

    for (let y = 0; y < 20; y++) {

      for (let x = 0; x < 20; x++) {

        const cell =
          document.createElement("div");

        cell.className =
          "snake-cell";

        const snakePart =
          snake.some(
            part =>
              part.x === x &&
              part.y === y
          );

        if (snakePart) {

          cell.classList.add(
            "snake-body"
          );

        }

        if (
          food.x === x &&
          food.y === y
        ) {

          cell.classList.add(
            "snake-food"
          );

        }

        board.appendChild(cell);

      }

    }

    const scoreElement =
      document.querySelector(
        "#snakeScore"
      );

    if (scoreElement) {

      scoreElement.textContent =
        score.toString();

    }

  }


  // CHANGE DIRECTION

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


  // MOBILE BUTTONS

  document
    .querySelectorAll<HTMLButtonElement>(".direction-btn")
    .forEach((button) => {

      button.addEventListener("click", (event) => {

        event.preventDefault();

        const newDirection =
          button.dataset.dir;

        if (newDirection) {
          changeDirection(newDirection);
        }

      });

      button.addEventListener("touchstart", (event) => {

        event.preventDefault();

        const newDirection =
          button.dataset.dir;

        if (newDirection) {
          changeDirection(newDirection);
        }

      }, { passive: false });

    });


  // KEYBOARD

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


  document.addEventListener(
    "keydown",
    handleKey
  );


  // MOVE SNAKE

  function moveSnake() {

    if (gameOver) return;

    const head = {
      ...snake[0]
    };

    if (direction === "UP") {
      head.y--;
    }

    if (direction === "DOWN") {
      head.y++;
    }

    if (direction === "LEFT") {
      head.x--;
    }

    if (direction === "RIGHT") {
      head.x++;
    }


    // WALL COLLISION

    const hitWall =
      head.x < 0 ||
      head.x >= 20 ||
      head.y < 0 ||
      head.y >= 20;


    // SELF COLLISION

    const hitSelf =
      snake.some(
        part =>
          part.x === head.x &&
          part.y === head.y
      );


    if (hitWall || hitSelf) {

      gameOver = true;

      const message =
        document.querySelector(
          "#snakeMessage"
        );

      if (message) {

        message.innerHTML = `

          <h2>
            Game Over 😵
          </h2>

          <button id="restartSnake">
            Play Again
          </button>

        `;

        document
          .querySelector(
            "#restartSnake"
          )
          ?.addEventListener(
            "click",
            showSnake
          );

      }

      document.removeEventListener(
        "keydown",
        handleKey
      );

      return;

    }


    snake.unshift(head);


    // FOOD

    if (
      head.x === food.x &&
      head.y === food.y
    ) {

      score += 10;

      food = {
        x: Math.floor(
          Math.random() * 20
        ),

        y: Math.floor(
          Math.random() * 20
        )
      };

    }

    else {

      snake.pop();

    }


    drawBoard();

  }


  // START GAME

  drawBoard();

  const gameLoop =
    setInterval(() => {

      if (gameOver) {

        clearInterval(gameLoop);

      }
      else {

        moveSnake();

      }

    }, 120);

}


// START WEBSITE

showHome();