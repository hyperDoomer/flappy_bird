const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Telegram WebApp check
const isTelegram = typeof Telegram !== 'undefined' && Telegram.WebApp;
const platform = isTelegram ? Telegram.WebApp.platform : null;
const isEdgeWebView = isTelegram && platform === 'tdesktop' && /Edg\//.test(navigator.userAgent);

// Простые цвета
const BG_COLOR = '#cceeff';
const PIPE_COLOR = '#4CAF50';
const BIRD_COLOR = '#FF5722';
const TEXT_COLOR = '#111';

// Настройки
canvas.width = 320;
canvas.height = 480;

const GRAVITY = 0.10;
const FLAP = -3.8;
const PIPE_GAP = 150;
const SPEED = 1.5;
const PIPE_INTERVAL = 200;
const PIPE_WIDTH = 50;
const GROUND_HEIGHT = 20;

let bird, pipes, score, gameState, frame;

const STATE = {
  START: 'start',
  PLAYING: 'playing',
  GAMEOVER: 'gameover',
};

function reset() {
  bird = {
    x: 60,
    y: canvas.height / 2 - 12,
    width: 24,
    height: 24,
    velocity: 0,
  };
  pipes = [];
  score = 0;
  frame = 0;
  gameState = STATE.START;
}

function drawBackground() {
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBird() {
  ctx.fillStyle = BIRD_COLOR;
  ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
}

function drawPipes() {
  ctx.fillStyle = PIPE_COLOR;
  pipes.forEach(pipe => {
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
    ctx.fillRect(pipe.x, pipe.top + PIPE_GAP, PIPE_WIDTH, canvas.height - pipe.top - PIPE_GAP - GROUND_HEIGHT);
  });
}

function drawText(text, size, offsetY = 0) {
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = `${size}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + offsetY);
}

function drawScore() {
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = '16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 10, 20);
}

function update() {
  if (gameState !== STATE.PLAYING) return;

  bird.velocity += GRAVITY;
  bird.y += bird.velocity;

  if (frame % PIPE_INTERVAL === 0) {
    const top = Math.floor(Math.random() * (canvas.height - PIPE_GAP - GROUND_HEIGHT - 60)) + 40;
    pipes.push({ x: canvas.width, top, passed: false });
  }

  pipes.forEach(pipe => {
    pipe.x -= SPEED;

    const hit =
      bird.x < pipe.x + PIPE_WIDTH &&
      bird.x + bird.width > pipe.x &&
      (bird.y < pipe.top || bird.y + bird.height > pipe.top + PIPE_GAP);

    if (hit || bird.y + bird.height >= canvas.height - GROUND_HEIGHT || bird.y <= 0) {
      gameState = STATE.GAMEOVER;
    }

    if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
      pipe.passed = true;
      score++;
    }
  });

  pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);
}

function draw() {
  drawBackground();
  drawPipes();
  drawBird();

  if (gameState === STATE.START) {
    drawText('Tap to Start', 24);
  } else if (gameState === STATE.GAMEOVER) {
    drawText('Game Over', 24, -10);
    drawText(`Score: ${score}`, 20, 20);
    drawText('Tap to Restart', 16, 50);
  } else {
    drawScore();
  }
}

function loop() {
  update();
  draw();
  frame++;

  if (isEdgeWebView) {
    setTimeout(() => requestAnimationFrame(loop), 1000 / 30);
  } else {
    requestAnimationFrame(loop);
  }
}

function flap() {
  if (gameState === STATE.START) {
    gameState = STATE.PLAYING;
  } else if (gameState === STATE.PLAYING) {
    bird.velocity = FLAP;
  } else if (gameState === STATE.GAMEOVER) {
    reset();
  }
}

document.addEventListener('keydown', e => {
  if (e.code === 'Space') flap();
});
canvas.addEventListener('click', flap);
canvas.addEventListener('touchstart', flap);

reset();
loop();
