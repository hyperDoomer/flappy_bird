// Flappy Bird с визуальными эффектами скорости и без проверки Telegram

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const bg = new Image();
bg.src = 'background-loop.png';
const groundImg = new Image();
groundImg.src = 'ground-loop.png';
const birdImg = new Image();
birdImg.src = 'bird.png';
const pipeTop = new Image();
pipeTop.src = 'pipe-top.png';
const pipeBottom = new Image();
pipeBottom.src = 'pipe-bottom.png';

const flapSound = new Audio('flap.mp3');
const pointSound = new Audio('score.mp3');
const hitSound = new Audio('hit.mp3');
const clickSound = new Audio('click.mp3');

canvas.width = 320;
canvas.height = 480;

const DEBUG = false;
const GRAVITY = 0.12;
const FLAP = -5.0;
const PIPE_GAP = 140;
const SPEED = 2.0;
const PIPE_INTERVAL = 180;
const PIPE_WIDTH = 50;
const PIPE_VISIBLE_WIDTH = 36;
const HITBOX_MARGIN = (PIPE_WIDTH - PIPE_VISIBLE_WIDTH) / 2;
const PIPE_SRC_WIDTH = 120;

const PARALLAX_SPEED = 1.2;
const GROUND_SPEED = 1.8;
const GROUND_HEIGHT = 20;

let bird, pipes, score, gameState, frame;
let highScore = localStorage.getItem('highScore') || 0;
let isNewRecord = false;
let parallaxX = 0;
let groundX = 0;
let birdRotation = 0;

const STATE = {
  START: 'start',
  PLAYING: 'playing',
  GAMEOVER: 'gameover',
};

function reset() {
  bird = {
    x: 60,
    y: canvas.height / 2 - 12,
    width: 34,
    height: 24,
    velocity: 0,
  };
  pipes = [];
  score = 0;
  frame = 0;
  isNewRecord = false;
  birdRotation = 0;
  gameState = STATE.START;
}

function drawBackground() {
  parallaxX = (parallaxX - PARALLAX_SPEED) % (bg.width / 2);
  ctx.drawImage(bg, parallaxX, 0, bg.width / 2, canvas.height);
  ctx.drawImage(bg, parallaxX + bg.width / 2, 0, bg.width / 2, canvas.height);
}

function drawGround() {
  groundX = (groundX - GROUND_SPEED) % (groundImg.width / 2);
  ctx.drawImage(groundImg, groundX, canvas.height - GROUND_HEIGHT, groundImg.width / 2, GROUND_HEIGHT);
  ctx.drawImage(groundImg, groundX + groundImg.width / 2, canvas.height - GROUND_HEIGHT, groundImg.width / 2, GROUND_HEIGHT);
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
  ctx.rotate(birdRotation);
  ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
  ctx.restore();

  if (DEBUG) {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    ctx.strokeRect(bird.x, bird.y, bird.width, bird.height);
  }
}

function drawPipes() {
  pipes.forEach(pipe => {
    ctx.drawImage(
      pipeTop,
      (pipeTop.width - PIPE_SRC_WIDTH) / 2, 0, PIPE_SRC_WIDTH, pipeTop.height,
      pipe.x, 0, PIPE_WIDTH, pipe.top
    );
    ctx.drawImage(
      pipeBottom,
      (pipeBottom.width - PIPE_SRC_WIDTH) / 2, 0, PIPE_SRC_WIDTH, pipeBottom.height,
      pipe.x, pipe.top + PIPE_GAP, PIPE_WIDTH, canvas.height - pipe.top - PIPE_GAP - GROUND_HEIGHT
    );

    if (DEBUG) {
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 1;
      ctx.strokeRect(pipe.x + HITBOX_MARGIN, 0, PIPE_VISIBLE_WIDTH, pipe.top);
      ctx.strokeRect(pipe.x + HITBOX_MARGIN, pipe.top + PIPE_GAP, PIPE_VISIBLE_WIDTH, canvas.height - pipe.top - PIPE_GAP - GROUND_HEIGHT);
    }
  });
}

function drawText(text, size, offsetY = 0) {
  ctx.font = `${size}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'black';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + offsetY);
}

function drawScore() {
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'black';
  ctx.fillText(`Score: ${score}`, canvas.width / 2, 30);
}

function update() {
  if (gameState !== STATE.PLAYING) return;

  bird.velocity += GRAVITY;
  bird.y += bird.velocity;
  birdRotation = Math.min(Math.max(-0.6, bird.velocity * 0.05), 1);

  if (frame % PIPE_INTERVAL === 0) {
    const top = Math.floor(Math.random() * (canvas.height - PIPE_GAP - GROUND_HEIGHT - 60)) + 40;
    pipes.push({ x: canvas.width, top, passed: false });
  }

  pipes.forEach(pipe => {
    pipe.x -= SPEED;

    const inPipe =
      bird.x + bird.width > pipe.x + HITBOX_MARGIN &&
      bird.x < pipe.x + PIPE_WIDTH - HITBOX_MARGIN &&
      (bird.y < pipe.top || bird.y + bird.height > pipe.top + PIPE_GAP);

    if (inPipe) {
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        isNewRecord = true;
      }
      gameState = STATE.GAMEOVER;
      hitSound.play();
    }

    if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
      pipe.passed = true;
      score++;
      pointSound.play();
    }
  });

  pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);

  if (bird.y + bird.height >= canvas.height - GROUND_HEIGHT || bird.y <= 0) {
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('highScore', highScore);
      isNewRecord = true;
    }
    gameState = STATE.GAMEOVER;
    hitSound.play();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawGround();
  drawPipes();
  drawBird();

  if (gameState === STATE.START) {
    drawText('Tap to Start', 28);
  } else if (gameState === STATE.GAMEOVER) {
    drawText('Game Over', 32, -30);
    drawText(`Score: ${score}`, 26, 10);
    drawText(`High Score: ${highScore}`, 20, 80);
    drawText('Tap to Restart', 20, 120);
  } else {
    drawScore();
  }
}

function loop() {
  update();
  draw();
  frame++;
  requestAnimationFrame(loop);
}

function flap() {
  if (gameState === STATE.START) {
    gameState = STATE.PLAYING;
    clickSound.play();
  } else if (gameState === STATE.PLAYING) {
    bird.velocity = FLAP;
    flapSound.play();
  } else if (gameState === STATE.GAMEOVER) {
    clickSound.play();
    reset();
  }
}

document.addEventListener('keydown', e => {
  if (e.code === 'Space') flap();
});
canvas.addEventListener('click', flap);
canvas.addEventListener('touchstart', flap);

bg.onload = () => {
  reset();
  loop();
};