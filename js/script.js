let dom_reply = document.querySelector("#replay");
let d0m_score = document.querySelector("#score");
let dom_canvas = document.createElement("canvas");
document.querySelector("#canvas").appendChild(dom_canvas);
let CTX = dom_canvas.getContext("2d");

const W = (dom_canvas.width = 500);
const H = (dom_canvas.height = 500);
const cellSize = W / 20;

let snake, food, currentHue;
let Cells = 10;
let isGameOver = false;
let tails = [];
let score = 0;
let maxScore = window.localStorage.getItem("maxScore") || 0;
let particless = [];
let requestId;

let snakeSpeed = 18; // Controls how many frames to skip
let frameCount = 0;
let isPaused = false; // Track pause state

let scoreMultiplierActive = false;
let multiplierEndTime = 0;
let multiplierDuration = 10000; // 10 seconds for multiplier

let helpers = {
    vec: class {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        add(v) {
            this.x += v.x;
            this.y += v.y;
            return this;
        }
        mult(v) {
            if (v instanceof helpers.vec) {
                this.x *= v.x;
                this.y *= v.y;
                return this;
            } else {
                this.x *= v;
                this.y *= v;
                return this;
            }
        }
    },
    isCollision(v1, v2) {
        return v1.x === v2.x && v1.y === v2.y;
    },
    drawGrid() {
        CTX.lineWidth = 1.1;
        CTX.strokeStyle = "#181825";
        CTX.shadowBlur = 0;
        for (let i = 1; i < Cells; i++) {
            let f = (W / Cells) * i;
            CTX.beginPath();
            CTX.moveTo(f, 0);
            CTX.lineTo(f, H);
            CTX.stroke();
            CTX.moveTo(0, f);
            CTX.lineTo(W, f);
            CTX.stroke();
            CTX.closePath();
        }
    },
    randHue() {
        return ~~(Math.random() * 360);
    }
};

let KEY = {
    ArrowUp: false,
    ArrowRight: false,
    ArrowDown: false,
    ArrowLeft: false,
    resetState() {
        this.ArrowUp = false;
        this.ArrowRight = false;
        this.ArrowDown = false;
        this.ArrowLeft = false;
    },
    listen() {
        addEventListener(
            "keydown",
            (e) => {
                if (e.key === "ArrowUp" && this.ArrowDown) return;
                if (e.key === "ArrowDown" && this.ArrowUp) return;
                if (e.key === "ArrowLeft" && this.ArrowRight) return;
                if (e.key === "ArrowRight" && this.ArrowLeft) return;
                this[e.key] = true;
                Object.keys(this)
                    .filter(
                        (f) =>
                            f !== e.key &&
                            f !== "listen" &&
                            f !== "resetState"
                    )
                    .forEach((k) => {
                        this[k] = false;
                    });
            },
            false
        );
    }
};

class Snake {
    constructor() {
        this.pos = new helpers.vec(W / 2, H / 2);
        this.dir = new helpers.vec(0, 0);
        this.size = cellSize;
        this.color = "lightgreen";
        this.history = [];
        this.total = 1;
    }
    draw() {
        let { x, y } = this.pos;
        CTX.fillStyle = this.color;
        CTX.fillRect(x, y, this.size, this.size);
        if (this.total >= 2) {
            for (let i = 0; i < this.history.length; i++) {
                let { x, y } = this.history[i];
                CTX.fillRect(x, y, this.size, this.size);
            }
        }
    }
    walls() {
        if (this.pos.x >= W) this.pos.x = 0;
        if (this.pos.y >= H) this.pos.y = 0;
        if (this.pos.x < 0) this.pos.x = W - cellSize;
        if (this.pos.y < 0) this.pos.y = H - cellSize;
    }
    update() {
        this.history.push(new helpers.vec(this.pos.x, this.pos.y));
        if (this.history.length > this.total) this.history.shift();
        this.pos.add(this.dir.mult(cellSize));
    }
    controls() {
        if (KEY.ArrowUp) this.dir = new helpers.vec(0, -1);
        if (KEY.ArrowDown) this.dir = new helpers.vec(0, 1);
        if (KEY.ArrowLeft) this.dir = new helpers.vec(-1, 0);
        if (KEY.ArrowRight) this.dir = new helpers.vec(1, 0);
    }
}

function spawnFood() {
    food = new helpers.vec(
        Math.floor(Math.random() * Cells) * cellSize,
        Math.floor(Math.random() * Cells) * cellSize
    );
}

function gameLoop() {
    if (!isGameOver && !isPaused) {  // Ensure the game doesn't run while paused
        frameCount++;
        if (frameCount % snakeSpeed === 0) {
            CTX.clearRect(0, 0, W, H);
            helpers.drawGrid();
            snake.controls();
            snake.update();
            snake.walls();
            snake.draw();

            CTX.fillStyle = "red";
            CTX.fillRect(food.x, food.y, cellSize, cellSize);

            if (helpers.isCollision(snake.pos, food)) {
                score++;
                if (scoreMultiplierActive && Date.now() < multiplierEndTime) {
                    score += 1;  // Double points while multiplier is active
                }
                snake.total++;
                spawnFood();
                d0m_score.textContent = score;
            }

            for (let i = 0; i < snake.history.length - 1; i++) {
                if (helpers.isCollision(snake.pos, snake.history[i])) {
                    isGameOver = true;
                    cancelAnimationFrame(requestId);
                    document.getElementById('gameOverMessage').style.display = 'block';  // Show game over message
                    document.getElementById('finalScore').textContent = score;  // Display final score
                    d0m_score.textContent = `Game Over! Final Score: ${score}`;
                }
            }

            // Deactivate the multiplier if the time has expired
            if (scoreMultiplierActive && Date.now() > multiplierEndTime) {
                scoreMultiplierActive = false;
            }
        }
        requestId = requestAnimationFrame(gameLoop);
    }
}

// Event listener for the replay button
dom_reply.addEventListener("click", () => {
    score = 0;
    isGameOver = false;
    isPaused = false;  // Ensure game is not paused when restarting
    snake = new Snake();
    spawnFood();
    d0m_score.textContent = score;
    document.getElementById('gameOverMessage').style.display = 'none';  // Hide game over message
    gameLoop();
});

// Function to pause the game
function pauseGame() {
    isPaused = true;
}

// Function to resume the game
function resumeGame() {
    isPaused = false;
}

// Event listener for the pause/resume button
document.getElementById('pauseResume').addEventListener('click', function () {
    if (isPaused) {
        resumeGame();
        this.innerHTML = '<i class="fas fa-pause"></i> PAUSE';
    } else {
        pauseGame();
        this.innerHTML = '<i class="fas fa-play"></i> RESUME';
    }
});

// Event listener for the theme toggle button
document.getElementById('toggleTheme').addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
});

// Event listener for power-up buttons
document.getElementById('speedBoost').addEventListener('click', () => {
    snakeSpeed = Math.max(snakeSpeed - 5, 5);  // Speed up the snake, with a minimum speed
});
;

// Listen for key events (movement keys)
KEY.listen();
snake = new Snake();
spawnFood();
gameLoop();
