// === UI 요소 연결 ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const introScreen = document.getElementById('intro-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const rankingScreen = document.getElementById('ranking-screen');
const gameUI = document.getElementById('game-ui');
const scoreUI = document.getElementById('score');
const lavaSpeedUI = document.getElementById('lava-speed');
const gameOverUI = document.getElementById('game-over');
const quizModal = document.getElementById('quiz-modal');
const rankingList = document.getElementById('ranking-list');

// === 오디오 시스템 ===
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx)
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

const introAudio = new Audio('intro.mp3');
const bgmFiles = ['bgm1.mp3', 'bgm2.mp3', 'bgm3.mp3', 'bgm4.mp3'];
const bgmAudio = new Audio();

function playRandomBGM() {
  const randomFile = bgmFiles[Math.floor(Math.random() * bgmFiles.length)];
  bgmAudio.src = randomFile;
  bgmAudio.volume = 0.3;
  bgmAudio.play().catch((e) => console.log('BGM 재생 대기'));
}
bgmAudio.addEventListener('ended', playRandomBGM);

const sfx = {
  jump: () => {
    try {
      const actx = getAudioCtx();
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, actx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, actx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + 0.1);
    } catch (e) {}
  },
  item: () => {
    try {
      const actx = getAudioCtx();
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, actx.currentTime);
      osc.frequency.setValueAtTime(1200, actx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.1, actx.currentTime);
      gain.gain.linearRampToValueAtTime(0, actx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + 0.2);
    } catch (e) {}
  },
  correct: () => {
    try {
      const actx = getAudioCtx();
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, actx.currentTime);
      osc.frequency.setValueAtTime(1500, actx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, actx.currentTime);
      gain.gain.linearRampToValueAtTime(0, actx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + 0.3);
    } catch (e) {}
  },
  wrong: () => {
    try {
      const actx = getAudioCtx();
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, actx.currentTime);
      gain.gain.setValueAtTime(0.1, actx.currentTime);
      gain.gain.linearRampToValueAtTime(0, actx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + 0.3);
    } catch (e) {}
  },
  die: () => {
    try {
      const actx = getAudioCtx();
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, actx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, actx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.2, actx.currentTime);
      gain.gain.linearRampToValueAtTime(0, actx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + 0.5);
    } catch (e) {}
  },
};

// === 화면 전환 로직 ===
let isIntroPassed = false;

function initApp() {
  window.addEventListener('mousedown', bypassIntro, true);
  window.addEventListener('touchstart', bypassIntro, true);
  window.addEventListener('keydown', bypassIntro, true);
}

function bypassIntro(e) {
  if (isIntroPassed) return;
  if (e && e.type === 'keydown' && e.code === 'Space') e.preventDefault();

  isIntroPassed = true;
  window.removeEventListener('mousedown', bypassIntro, true);
  window.removeEventListener('touchstart', bypassIntro, true);
  window.removeEventListener('keydown', bypassIntro, true);

  try {
    getAudioCtx();
    introAudio.play().catch((err) => {});
  } catch (error) {}

  introScreen.classList.add('hidden');
  lobbyScreen.classList.remove('hidden');
}

function goToLobby() {
  gameUI.classList.add('hidden');
  gameOverUI.classList.add('hidden');
  lobbyScreen.classList.remove('hidden');
  bgmAudio.pause();
}

function showRanking() {
  lobbyScreen.classList.add('hidden');
  rankingScreen.classList.remove('hidden');
  let ranks = JSON.parse(localStorage.getItem('jdChineseRank')) || [];
  rankingList.innerHTML = '';
  if (ranks.length === 0) rankingList.innerHTML = '<li>기록이 없습니다.</li>';
  else
    ranks.forEach(
      (r, i) =>
        (rankingList.innerHTML += `<li><span>${i + 1}위</span> <span style="color:#00ffcc">${r} m</span></li>`),
    );
}

function hideRanking() {
  rankingScreen.classList.add('hidden');
  lobbyScreen.classList.remove('hidden');
}

function saveScore() {
  let ranks = JSON.parse(localStorage.getItem('jdChineseRank')) || [];
  ranks.push(score);
  ranks.sort((a, b) => b - a);
  ranks = ranks.slice(0, 5);
  localStorage.setItem('jdChineseRank', JSON.stringify(ranks));
}

// === 게임 코어 변수 ===
let gameState = 'LOBBY';
let gameMode = 'normal';
let player, platforms, items, lava, particles, trails;
let score = 0;
let animationId;
let hasStartedClimbing = false;

const keys = { left: false, right: false, space: false };
const GRAVITY = 0.5;
const JUMP_POWER = -9.5;
const MOVE_SPEED = 4.3;
const PLATFORM_GAP = 110;
let currentQuiz = null;
let selectedChunks = [];

// === 포인터 이벤트 ===
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnSpace = document.getElementById('btn-space');

btnLeft.onpointerdown = (e) => {
  e.preventDefault();
  keys.left = true;
};
btnLeft.onpointerup = (e) => {
  e.preventDefault();
  keys.left = false;
};
btnLeft.onpointerleave = (e) => {
  e.preventDefault();
  keys.left = false;
};

btnRight.onpointerdown = (e) => {
  e.preventDefault();
  keys.right = true;
};
btnRight.onpointerup = (e) => {
  e.preventDefault();
  keys.right = false;
};
btnRight.onpointerleave = (e) => {
  e.preventDefault();
  keys.right = false;
};

btnSpace.onpointerdown = (e) => {
  e.preventDefault();
  if (gameState === 'PLAYING' && !player.isJumping) triggerJump();
  keys.space = true;
};
btnSpace.onpointerup = (e) => {
  e.preventDefault();
  keys.space = false;
};
btnSpace.onpointerleave = (e) => {
  e.preventDefault();
  keys.space = false;
};

function startGame(mode) {
  if (animationId) cancelAnimationFrame(animationId);

  introAudio.pause();
  introScreen.classList.add('hidden');
  lobbyScreen.classList.add('hidden');
  gameUI.classList.remove('hidden');

  gameMode = mode;
  playRandomBGM();

  gameState = 'PLAYING';
  gameOverUI.classList.add('hidden');
  quizModal.classList.add('hidden');
  score = 0;
  scoreUI.innerText = score;
  hasStartedClimbing = false;

  let initialLavaSpeed = gameMode === 'hell' ? 1.0 : 0.6;
  lava = { y: canvas.height - 40, speed: initialLavaSpeed };
  lavaSpeedUI.innerText = '대기 중';

  platforms = [];
  items = [];
  particles = [];
  trails = [];

  const startPlatform = createPlatform(
    canvas.width / 2 - 50,
    520,
    'static',
    'rect',
    100,
  );
  platforms.push(startPlatform);

  player = {
    x: canvas.width / 2,
    y: startPlatform.y - 18,
    radius: 18,
    vx: 0,
    vy: 0,
    isJumping: false,
    currentPlatform: startPlatform,
    jumpFromType: 'static',
    platformOffsetY: 0,
    currentChar: '人',
    rotation: 0,
  };

  for (let i = 1; i <= 8; i++) generateLevel();

  loop();
}

function createPlatform(x, y, type, shape = 'rect', width = 70) {
  return {
    x: x,
    y: y,
    width: width,
    height: 15,
    type: type,
    shape: shape,
    startX: x,
    startY: y,
    speedX:
      type === 'moveH' || type === 'moveD'
        ? Math.random() > 0.5
          ? 1.5
          : -1.5
        : 0,
    speedY:
      type === 'moveV' || type === 'moveD' ? (Math.random() > 0.5 ? 1 : -1) : 0,
    range: 80,
  };
}

function generateLevel() {
  let highest = platforms[platforms.length - 1];
  let lastType = highest ? highest.type : 'static';
  let lastY = highest ? highest.startY : 520;

  const types = ['static', 'static', 'moveH', 'moveV', 'moveD', 'heavy'];
  let selectedType = types[Math.floor(Math.random() * types.length)];
  if (lastType === 'heavy' && selectedType === 'heavy') selectedType = 'static';

  let gap = lastType === 'heavy' ? 55 : PLATFORM_GAP;
  let yPos = lastY - gap;

  let baseWidth = gameMode === 'hell' ? 30 : 50;
  let width = Math.random() * 50 + baseWidth;
  let shape = 'rect';

  let difficultyChance = Math.min(0.7, score / 1500);
  let rand = Math.random();

  if (score > 100 && rand < difficultyChance) {
    if (rand < difficultyChance * 0.4) {
      shape = Math.random() > 0.5 ? 'L-left' : 'L-right';
      width = 85;
    } else {
      shape = 'circle';
      width = 55;
    }
  } else if (Math.random() < 0.15) {
    shape = 'long';
    width = 130;
  }

  const xPos = Math.random() * (canvas.width - width - 20) + 10;
  platforms.push(createPlatform(xPos, yPos, selectedType, shape, width));

  if (Math.random() < 0.15)
    items.push({
      x: xPos + width / 2 - 10,
      y: yPos - 25,
      width: 20,
      height: 20,
      active: true,
      floatOffset: 0,
    });
}

window.addEventListener('keydown', (e) => {
  if (gameState !== 'PLAYING') return;
  if (e.code === 'ArrowLeft') keys.left = true;
  if (e.code === 'ArrowRight') keys.right = true;
  if (e.code === 'Space' && !player.isJumping) {
    e.preventDefault();
    keys.space = true;
    triggerJump();
  }
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'ArrowRight') keys.right = false;
  if (e.code === 'Space') keys.space = false;
});

function triggerJump() {
  player.isJumping = true;
  player.jumpFromType = player.currentPlatform
    ? player.currentPlatform.type
    : 'static';
  player.currentPlatform = null;

  let currentJumpPower =
    player.jumpFromType === 'heavy' ? JUMP_POWER * 0.75 : JUMP_POWER;
  player.vy = currentJumpPower;
  player.platformOffsetY = 0;

  createParticles(player.x, player.y + player.radius, '#FF9800', 15);
  sfx.jump();
}

function createParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 1.0,
      color: color,
      size: Math.random() * 4 + 2,
    });
  }
}

function update() {
  if (gameState !== 'PLAYING') return;

  platforms.forEach((p) => {
    p.x += p.speedX;
    p.y += p.speedY;
    if (
      Math.abs(p.x - p.startX) > p.range ||
      p.x < 0 ||
      p.x + p.width > canvas.width
    )
      p.speedX *= -1;
    if (Math.abs(p.y - p.startY) > p.range / 2) p.speedY *= -1;
  });

  let targetVx = 0;
  if (keys.left) targetVx = -MOVE_SPEED;
  else if (keys.right) targetVx = MOVE_SPEED;

  if (
    !player.isJumping &&
    player.currentPlatform &&
    player.currentPlatform.shape === 'circle'
  ) {
    let circleCenter =
      player.currentPlatform.x + player.currentPlatform.width / 2;
    targetVx += (player.x - circleCenter) * 0.16;
  }

  player.vx = targetVx;
  player.x += player.vx;

  if (player.isJumping) {
    player.currentChar = '大';
    player.rotation += player.vx * 0.05;
    let currentGravity = GRAVITY;
    if (keys.space && player.vy < 0)
      currentGravity =
        player.jumpFromType === 'heavy' ? GRAVITY * 0.85 : GRAVITY * 0.65;
    player.vy += currentGravity;
    player.y += player.vy;
    checkLanding();
  } else if (player.currentPlatform) {
    player.currentChar = '人';
    player.rotation = 0;
    let p = player.currentPlatform;
    if (p.shape === 'L-left')
      player.platformOffsetY =
        player.x >= p.x - 4 && player.x < p.x + 22 ? 25 : 0;
    else if (p.shape === 'L-right')
      player.platformOffsetY =
        player.x >= p.x + p.width - 22 && player.x <= p.x + p.width + 4
          ? 25
          : 0;
    else player.platformOffsetY = 0;

    player.x += p.speedX;
    player.y = p.y - player.platformOffsetY - player.radius;

    if (player.x < p.x || player.x > p.x + p.width) {
      player.isJumping = true;
      player.jumpFromType = p.type;
      player.currentPlatform = null;
      player.platformOffsetY = 0;
      player.vy = 0;
    }
  }

  if (player.x < player.radius) player.x = player.radius;
  if (player.x > canvas.width - player.radius)
    player.x = canvas.width - player.radius;

  items.forEach((item) => {
    item.floatOffset += 0.1;
    if (
      item.active &&
      Math.abs(player.x - (item.x + 10)) < 26 &&
      Math.abs(player.y - (item.y + 10)) < 26
    ) {
      item.active = false;
      createParticles(item.x + 10, item.y + 10, '#00ffcc', 20);
      sfx.item();
      triggerQuiz();
    }
  });

  if (player.y < 300) {
    let diff = 300 - player.y;
    player.y += diff;
    platforms.forEach((p) => {
      p.y += diff;
      p.startY += diff;
    });
    items.forEach((i) => (i.y += diff));
    particles.forEach((pt) => (pt.y += diff));

    score += Math.floor(diff / 5);
    scoreUI.innerText = score;

    if (!hasStartedClimbing) hasStartedClimbing = true;
    else lava.y += diff;

    if (platforms[0].y > canvas.height + 100) {
      platforms.shift();
      generateLevel();
    }
  }

  if (hasStartedClimbing) {
    let accel = gameMode === 'hell' ? 0.0008 : 0.0004;
    lava.speed += accel;
    lavaSpeedUI.innerText =
      lava.speed.toFixed(1) + (gameMode === 'hell' ? ' (HELL)' : '');
    lava.y -= lava.speed;
  }

  if (lava.y > canvas.height - 40) lava.y = canvas.height - 40;

  if (player.y > lava.y || player.y > canvas.height) {
    gameState = 'GAMEOVER';
    document.getElementById('final-score').innerText = score;
    gameOverUI.classList.remove('hidden');
    saveScore();
    sfx.die();
    bgmAudio.pause();
  }
}

function checkLanding() {
  if (player.vy > 0) {
    for (let p of platforms) {
      let surfaces = [];
      if (p.shape === 'L-left') {
        surfaces.push({ x1: p.x, x2: p.x + 20, y: p.y - 25, offset: 25 });
        surfaces.push({ x1: p.x + 20, x2: p.x + p.width, y: p.y, offset: 0 });
      } else if (p.shape === 'L-right') {
        surfaces.push({ x1: p.x, x2: p.x + p.width - 20, y: p.y, offset: 0 });
        surfaces.push({
          x1: p.x + p.width - 20,
          x2: p.x + p.width,
          y: p.y - 25,
          offset: 25,
        });
      } else {
        surfaces.push({ x1: p.x, x2: p.x + p.width, y: p.y, offset: 0 });
      }

      for (let s of surfaces) {
        if (
          player.x > s.x1 - player.radius &&
          player.x < s.x2 + player.radius &&
          player.y + player.radius >= s.y &&
          player.y + player.radius <= s.y + player.vy + 4
        ) {
          player.y = s.y - player.radius;
          player.vy = 0;
          player.vx = 0;
          player.isJumping = false;
          player.currentPlatform = p;
          player.platformOffsetY = s.offset;
          createParticles(player.x, player.y + player.radius, '#fff', 5);
          return;
        }
      }
    }
  }
}

function triggerQuiz() {
  gameState = 'QUIZ';
  selectedChunks = [];
  document.getElementById('quiz-answer-slot').innerText = '';
  document.getElementById('quiz-buttons').innerHTML = '';

  // data.js 에 선언된 sentenceBank 배열을 사용
  currentQuiz = sentenceBank[Math.floor(Math.random() * sentenceBank.length)];
  document.getElementById('quiz-meaning').innerText = currentQuiz.meaning;

  let shuffled = [...currentQuiz.chunks].sort(() => Math.random() - 0.5);
  shuffled.forEach((chunk) => {
    let btn = document.createElement('button');
    btn.innerText = chunk;
    btn.onclick = () => selectChunk(chunk, btn);
    document.getElementById('quiz-buttons').appendChild(btn);
  });
  quizModal.classList.remove('hidden');
}

function selectChunk(chunk, btn) {
  selectedChunks.push(chunk);
  btn.style.display = 'none';
  document.getElementById('quiz-answer-slot').innerText =
    selectedChunks.join(' ');
  if (selectedChunks.length === currentQuiz.chunks.length) {
    if (selectedChunks.join('') === currentQuiz.chunks.join('')) {
      document.getElementById('quiz-answer-slot').innerText =
        '정답! 용암이 물러납니다.';
      document.getElementById('quiz-answer-slot').style.color = '#00ffcc';
      sfx.correct();
      setTimeout(() => {
        quizModal.classList.add('hidden');
        lava.y = canvas.height - 40;
        lava.speed = gameMode === 'hell' ? 1.0 : 0.6;
        gameState = 'PLAYING';
      }, 1000);
    } else {
      document.getElementById('quiz-answer-slot').innerText = '오답입니다!';
      document.getElementById('quiz-answer-slot').style.color = '#ff3366';
      sfx.wrong();
      setTimeout(() => {
        quizModal.classList.add('hidden');
        gameState = 'PLAYING';
      }, 1000);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  trails.push({
    x: player.x,
    y: player.y,
    life: 0.5,
    char: player.currentChar,
    rot: player.rotation,
  });
  for (let i = trails.length - 1; i >= 0; i--) {
    let t = trails[i];
    t.life -= 0.08;
    if (t.life <= 0) {
      trails.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = t.life;
    ctx.fillStyle = '#FF9800';
    ctx.font = "bold 38px 'Malgun Gothic', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.rot);
    ctx.fillText(t.char, 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1.0;

  platforms.forEach((p) => {
    ctx.shadowBlur = 15;
    if (p.type === 'heavy') {
      ctx.fillStyle = '#3F51B5';
      ctx.shadowColor = '#3F51B5';
    } else if (p.type === 'static') {
      ctx.fillStyle = '#9E9E9E';
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#00ffcc';
      ctx.shadowColor = '#00ffcc';
    }

    if (p.shape === 'rect' || p.shape === 'long') {
      ctx.fillRect(p.x, p.y, p.width, p.height);
    } else if (p.shape === 'L-left') {
      ctx.fillRect(p.x + 20, p.y, p.width - 20, p.height);
      ctx.fillRect(p.x, p.y - 25, 20, p.height + 25);
    } else if (p.shape === 'L-right') {
      ctx.fillRect(p.x, p.y, p.width - 20, p.height);
      ctx.fillRect(p.x + p.width - 20, p.y - 25, 20, p.height + 25);
    } else if (p.shape === 'circle') {
      ctx.beginPath();
      let r = p.width / 2;
      ctx.arc(p.x + r, p.y + r, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(p.x + r - 6, p.y + r - 6, r * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
    }
    ctx.shadowBlur = 0;
  });

  ctx.shadowBlur = 20;
  ctx.shadowColor = '#ffcc00';
  ctx.fillStyle = '#ffcc00';
  items.forEach((i) => {
    if (i.active) {
      let floatY = Math.sin(i.floatOffset) * 5;
      ctx.fillRect(i.x, i.y + floatY, i.width, i.height);
    }
  });
  ctx.shadowBlur = 0;

  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.04;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.rotation);
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#FF9800';
  ctx.fillStyle = '#FF9800';
  ctx.font = "bold 38px 'Malgun Gothic', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(player.currentChar, 0, 0);
  ctx.restore();

  let lavaGradient = ctx.createLinearGradient(0, lava.y, 0, canvas.height);
  lavaGradient.addColorStop(0, 'rgba(255, 51, 102, 0.85)');
  lavaGradient.addColorStop(1, 'rgba(200, 0, 0, 1)');
  ctx.fillStyle = lavaGradient;
  ctx.fillRect(0, lava.y, canvas.width, canvas.height - lava.y);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(0, lava.y, canvas.width, 3);
}

function loop() {
  update();
  draw();
  animationId = requestAnimationFrame(loop);
}

window.onload = initApp;
