const SIZE = 20;

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

function createGame() {
    document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <div class="snake-page">
      <button id="back">← Back to GameZone</button>

      <h1>🐍 Snake Game</h1>
      <div class="score">Score: <span id="score">0</span></div>

      <div id="board" class="snake-board"></div>

      <div id="gameOver" class="game-over"></div>

      <p>Use ⬆️ ⬇️ ⬅️ ➡️ keys to move</p>
    </div>
  `;

    document.querySelector("#back")?.addEventListener("click", () => {
        location.reload();
    });

    drawBoard();
}

function drawBoard() {
    const board = document.querySelector<HTMLDivElement>("#board");

    if (!board) return;

    board.innerHTML = "";

    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {

            const cell = document.createElement("div");
            cell.className = "cell";

            const snakePart = snake.some(
                part => part.x === x && part.y === y
            );

            if (snakePart) {
                cell.classList.add("snake");
            }

            if (food.x === x && food.y === y) {
                cell.classList.add("food");
            }

            board.appendChild(cell);
        }
    }

    const scoreElement = document.querySelector("#score");

    if (scoreElement) {
        scoreElement.textContent = score.toString();
    }
}

function moveSnake() {

    if (gameOver) return;

    const head = { ...snake[0] };

    if (direction === "UP") head.y--;
    if (direction === "DOWN") head.y++;
    if (direction === "LEFT") head.x--;
    if (direction === "RIGHT") head.x++;

    const hitWall =
        head.x < 0 ||
        head.x >= SIZE ||
        head.y < 0 ||
        head.y >= SIZE;

    const hitSelf = snake.some(
        part => part.x === head.x && part.y === head.y
    );

    if (hitWall || hitSelf) {
        gameOver = true;

        const message = document.querySelector("#gameOver");

        if (message) {
            message.innerHTML = `
        <h2>Game Over 😵</h2>
        <button id="restart">Play Again</button>
      `;

            document
                .querySelector("#restart")
                ?.addEventListener("click", restartGame);
        }

        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {

        score += 10;

        food = {
            x: Math.floor(Math.random() * SIZE),
            y: Math.floor(Math.random() * SIZE)
        };

    } else {
        snake.pop();
    }

    drawBoard();
}

function restartGame() {

    snake = [
        { x: 10, y: 10 }
    ];

    food = {
        x: 15,
        y: 10
    };

    direction = "RIGHT";
    score = 0;
    gameOver = false;

    createGame();
}

document.addEventListener("keydown", (event) => {

    if (event.key === "ArrowUp" && direction !== "DOWN") {
        direction = "UP";
    }

    if (event.key === "ArrowDown" && direction !== "UP") {
        direction = "DOWN";
    }

    if (event.key === "ArrowLeft" && direction !== "RIGHT") {
        direction = "LEFT";
    }

    if (event.key === "ArrowRight" && direction !== "LEFT") {
        direction = "RIGHT";
    }
});

createGame();

setInterval(moveSnake, 120);