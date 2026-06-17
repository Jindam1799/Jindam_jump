// === UI 요소 연결 ===
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const introScreen = document.getElementById("intro-screen");
const lobbyScreen = document.getElementById("lobby-screen");
const rankingScreen = document.getElementById("ranking-screen");
const gameUI = document.getElementById("game-ui");
const scoreUI = document.getElementById("score");
const lavaSpeedUI = document.getElementById("lava-speed");
const gameOverUI = document.getElementById("game-over");
const quizModal = document.getElementById("quiz-modal");
const rankingList = document.getElementById("ranking-list");

// === 슈퍼 점프 전용 중국 명언 (중후한 남성 목소리) ===
const superJumpQuotes = [
    { hz: "欲穷千里目，更上一层楼", kr: "천 리 밖을 내다보려고, 다시 한 층을 더 오른다." },
    { hz: "大鹏一日同风起，扶摇直上九万里", kr: "대붕이 바람을 만나니, 구만리 상공으로 곧장 솟구친다." },
    { hz: "长风破浪会有时，直挂云帆济沧海", kr: "거센 바람 타고 파도를 헤쳐, 구름 돛을 달고 바다를 건너리라." },
    { hz: "不鸣则已，一鸣惊人", kr: "한 번 날면 하늘을 뚫고, 한 번 울면 세상을 놀라게 하리라." }
];

// === 점프 응원 문구 5종 세트 ===
const jumpPhrases = [
    { hz: "跳!", kr: "뛰어!" },
    { hz: "加油!", kr: "힘내!" },
    { hz: "冲啊!", kr: "가자!" },
    { hz: "努力!", kr: "열심히 해!" },
    { hz: "走吧!", kr: "출발!" }
];

let currentSubtitle = { hz: "", kr: "" }; 
let quoteTimer = 0; 
let isQuotePlaying = false; 

// ==========================================
// 🎙️ 중국어 TTS 엔진 (음성 보호 로직 추가)
// ==========================================
let cnVoices = [];
window.speechSynthesis.onvoiceschanged = () => {
    cnVoices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('zh'));
};

function speakChinese(text, type = 'normal') {
    try {
        if (!window.speechSynthesis) return;
        
        if (isQuotePlaying && type === 'jump') return;
        
        window.speechSynthesis.cancel(); 
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        
        if (type === 'superJump') {
            isQuotePlaying = true;
            setTimeout(() => isQuotePlaying = false, 5000); 
            
            let voice = cnVoices.find(v => v.name.toLowerCase().includes('male') || v.name.includes('Kangkang') || v.name.includes('Yunxi') || v.name.includes('Yunjian'));
            if (!voice && cnVoices.length > 0) voice = cnVoices.find(v => v.lang.includes('zh')); 
            if (voice) utterance.voice = voice;
            
            utterance.pitch = 0.65; 
            utterance.rate = 0.8;   
        } else {
            let voice = cnVoices.find(v => v.name.toLowerCase().includes('female') || v.name.includes('Xiaoxiao') || v.name.includes('Tingting'));
            if (!voice && cnVoices.length > 0) voice = cnVoices[0]; 
            if (voice) utterance.voice = voice;

            utterance.pitch = (type === 'jump') ? 1.3 : 1.0; 
            utterance.rate = (type === 'jump') ? 1.5 : 1.0; 
        }
        
        window.speechSynthesis.speak(utterance);
    } catch (e) {
        console.warn("TTS 에러", e);
    }
}

// === 오디오 시스템 ===
let audioCtx = null;
function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

const introAudio = new Audio('intro.mp3');
const bgmFiles = ["bgm1.mp3", "bgm2.mp3", "bgm3.mp3", "bgm4.mp3"];
const bgmAudio = new Audio();

function playRandomBGM() {
    const randomFile = bgmFiles[Math.floor(Math.random() * bgmFiles.length)];
    bgmAudio.src = randomFile;
    bgmAudio.volume = 0.3;
    bgmAudio.play().catch(e => console.log("BGM 재생 대기"));
}
bgmAudio.addEventListener('ended', playRandomBGM);

const sfx = {
    jump: () => { try{ const actx = getAudioCtx(); const osc = actx.createOscillator(); const gain = actx.createGain(); osc.type="square"; osc.frequency.setValueAtTime(300, actx.currentTime); osc.frequency.exponentialRampToValueAtTime(600, actx.currentTime+0.1); gain.gain.setValueAtTime(0.05, actx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime+0.1); osc.connect(gain); gain.connect(actx.destination); osc.start(); osc.stop(actx.currentTime+0.1); } catch(e){} },
    land: () => { try{ const actx = getAudioCtx(); const osc = actx.createOscillator(); const gain = actx.createGain(); osc.type="triangle"; osc.frequency.setValueAtTime(150, actx.currentTime); osc.frequency.exponentialRampToValueAtTime(50, actx.currentTime+0.05); gain.gain.setValueAtTime(0.1, actx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime+0.05); osc.connect(gain); gain.connect(actx.destination); osc.start(); osc.stop(actx.currentTime+0.05); } catch(e){} },
    item: () => { try{ const actx = getAudioCtx(); const osc = actx.createOscillator(); const gain = actx.createGain(); osc.type="sine"; osc.frequency.setValueAtTime(800, actx.currentTime); osc.frequency.setValueAtTime(1200, actx.currentTime+0.05); gain.gain.setValueAtTime(0.1, actx.currentTime); gain.gain.linearRampToValueAtTime(0, actx.currentTime+0.2); osc.connect(gain); gain.connect(actx.destination); osc.start(); osc.stop(actx.currentTime+0.2); } catch(e){} },
    correct: () => { try{ const actx = getAudioCtx(); const osc = actx.createOscillator(); const gain = actx.createGain(); osc.type="sine"; osc.frequency.setValueAtTime(1000, actx.currentTime); osc.frequency.setValueAtTime(1500, actx.currentTime+0.1); gain.gain.setValueAtTime(0.1, actx.currentTime); gain.gain.linearRampToValueAtTime(0, actx.currentTime+0.3); osc.connect(gain); gain.connect(actx.destination); osc.start(); osc.stop(actx.currentTime+0.3); } catch(e){} },
    wrong: () => { try{ const actx = getAudioCtx(); const osc = actx.createOscillator(); const gain = actx.createGain(); osc.type="sawtooth"; osc.frequency.setValueAtTime(150, actx.currentTime); gain.gain.setValueAtTime(0.1, actx.currentTime); gain.gain.linearRampToValueAtTime(0, actx.currentTime+0.3); osc.connect(gain); gain.connect(actx.destination); osc.start(); osc.stop(actx.currentTime+0.3); } catch(e){} },
    die: () => { try{ const actx = getAudioCtx(); const osc = actx.createOscillator(); const gain = actx.createGain(); osc.type="sawtooth"; osc.frequency.setValueAtTime(300, actx.currentTime); osc.frequency.exponentialRampToValueAtTime(50, actx.currentTime+0.5); gain.gain.setValueAtTime(0.2, actx.currentTime); gain.gain.linearRampToValueAtTime(0, actx.currentTime+0.5); osc.connect(gain); gain.connect(actx.destination); osc.start(); osc.stop(actx.currentTime+0.5); } catch(e){} }
};

// === 화면 전환 로직 ===
let isIntroPassed = false;

function initApp() {
    window.addEventListener("mousedown", bypassIntro, true);
    window.addEventListener("touchstart", bypassIntro, true);
    window.addEventListener("keydown", bypassIntro, true);
    if(window.speechSynthesis) cnVoices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('zh'));
}

function bypassIntro(e) {
    if (isIntroPassed) return; 
    if (e && e.type === "keydown" && e.code === "Space") e.preventDefault();
    isIntroPassed = true;
    window.removeEventListener("mousedown", bypassIntro, true);
    window.removeEventListener("touchstart", bypassIntro, true);
    window.removeEventListener("keydown", bypassIntro, true);
    try { getAudioCtx(); introAudio.play().catch(err => {}); if(window.speechSynthesis) window.speechSynthesis.speak(new SpeechSynthesisUtterance('')); } catch (error) {}
    introScreen.classList.add("hidden"); lobbyScreen.classList.remove("hidden");
}

function goToLobby() {
    gameUI.classList.add("hidden"); gameOverUI.classList.add("hidden"); lobbyScreen.classList.remove("hidden"); bgmAudio.pause(); 
}

function showRanking() {
    lobbyScreen.classList.add("hidden"); rankingScreen.classList.remove("hidden");
    let ranks = JSON.parse(localStorage.getItem('jdChineseRank')) || [];
    rankingList.innerHTML = "";
    if (ranks.length === 0) rankingList.innerHTML = "<li>기록이 없습니다.</li>";
    else ranks.forEach((r, i) => rankingList.innerHTML += `<li><span>${i+1}위</span> <span style="color:#00ffcc">${r} m</span></li>`);
}

function hideRanking() {
    rankingScreen.classList.add("hidden"); lobbyScreen.classList.remove("hidden");
}

function saveScore() {
    let ranks = JSON.parse(localStorage.getItem('jdChineseRank')) || [];
    ranks.push(score); ranks.sort((a, b) => b - a); ranks = ranks.slice(0, 5);   
    localStorage.setItem('jdChineseRank', JSON.stringify(ranks));
}

// === 게임 코어 변수 ===
let gameState = "LOBBY"; 
let gameMode = "normal"; 
let player, platforms, items, lava, particles, trails;
let score = 0; let animationId; let hasStartedClimbing = false; 

const keys = { left: false, right: false, space: false };
const GRAVITY = 0.45; const JUMP_POWER = -10.0; const MOVE_SPEED = 4.5; 
let currentQuiz = null; 
let currentQuizSource = null; 
let superJumpCount = 0; 

// === 포인터 이벤트 ===
const btnLeft = document.getElementById("btn-left");
const btnRight = document.getElementById("btn-right");
const btnSpace = document.getElementById("btn-space");

btnLeft.onpointerdown = (e) => { e.preventDefault(); keys.left = true; };
btnLeft.onpointerup = (e) => { e.preventDefault(); keys.left = false; };
btnLeft.onpointerleave = (e) => { e.preventDefault(); keys.left = false; };

btnRight.onpointerdown = (e) => { e.preventDefault(); keys.right = true; };
btnRight.onpointerup = (e) => { e.preventDefault(); keys.right = false; };
btnRight.onpointerleave = (e) => { e.preventDefault(); keys.right = false; };

btnSpace.onpointerdown = (e) => { 
    e.preventDefault(); 
    if (gameState === "PLAYING" && !player.isJumping && !player.isSuperJumping) triggerJump(); 
    keys.space = true; 
};
btnSpace.onpointerup = (e) => { e.preventDefault(); keys.space = false; };
btnSpace.onpointerleave = (e) => { e.preventDefault(); keys.space = false; };

function startGame(mode) {
    if (animationId) cancelAnimationFrame(animationId);
    
    introAudio.pause();
    introScreen.classList.add("hidden"); lobbyScreen.classList.add("hidden"); gameUI.classList.remove("hidden");
    
    gameMode = mode;
    playRandomBGM();

    gameState = "PLAYING";
    gameOverUI.classList.add("hidden"); quizModal.classList.add("hidden");
    score = 0; scoreUI.innerText = score;
    hasStartedClimbing = false; 
    superJumpCount = 0;
    quoteTimer = 0;
    isQuotePlaying = false;

    let initialLavaSpeed = gameMode === "hell" ? 1.0 : 0.6;
    lava = { y: canvas.height - 40, speed: initialLavaSpeed };
    lavaSpeedUI.innerText = "대기 중";

    platforms = []; items = []; particles = []; trails = [];

    const startPlatform = createPlatform(canvas.width/2 - 50, 520, "static", "rect", 100);
    platforms.push(startPlatform);

    player = { 
        x: canvas.width / 2, y: startPlatform.y - 18, radius: 18, 
        vx: 0, vy: 0, isJumping: false, currentPlatform: startPlatform, jumpFromType: "static", 
        platformOffsetY: 0, currentChar: "人", rotation: 0,
        isSuperJumping: false, superJumpTarget: 0,
        jumpFx: { hz: "", kr: "", life: 0, x: 0, y: 0, color: "#ffcc00" } 
    };
    
    for (let i = 1; i <= 8; i++) generateLevel();

    loop();
}

function createPlatform(x, y, type, shape = "rect", width = 70) {
    return {
        x: x, y: y, width: width, height: 15, type: type, shape: shape, startX: x, startY: y,
        speedX: type === "moveH" || type === "moveD" ? (Math.random() > 0.5 ? 1.5 : -1.5) : 0,
        speedY: type === "moveV" || type === "moveD" ? (Math.random() > 0.5 ? 1 : -1) : 0, range: 80,
        angle: 0, 
        pillarH: (shape.includes("tall") ? 45 : 20),
        used: false,
        penaltyApplied: false 
    }
}

function generateLevel() {
    let highest = platforms[platforms.length - 1];
    let lastType = highest ? highest.type : "static";
    let lastY = highest ? highest.startY : 520;

    let difficulty = Math.min(1.0, score / 2000); 

    const types = ["static", "static", "moveH", "moveV", "moveD", "heavy"];
    let selectedType = types[Math.floor(Math.random() * types.length)];
    if (lastType === "heavy" && selectedType === "heavy") selectedType = "static";

    let baseGap = 70 + (difficulty * 50);
    let gap = (lastType === "heavy") ? 60 : (Math.random() * 25 + baseGap);
    let yPos = lastY - gap;

    let baseWidth = gameMode === "hell" ? 30 : Math.max(30, 50 - difficulty * 20);
    let width = Math.random() * 40 + baseWidth; 
    let shape = "rect";

    let specialChance = 0.2 + (difficulty * 0.6); 
    let rand = Math.random();

    if (score > 100 && rand < specialChance) {
        let subRand = Math.random();
        if (subRand < 0.15) {
            shape = "spring"; width = 60; selectedType = "static";
        } else if (subRand < 0.35) { 
            shape = "rect"; width = Math.random() * 30 + 40; selectedType = "penalty";
        } else if (subRand < 0.60) { 
            let lTypes = ["L-left-tall", "L-right-tall", "L-left-wide", "L-right-wide"];
            shape = lTypes[Math.floor(Math.random() * lTypes.length)];
            width = shape.includes("wide") ? 110 : 70; 
        } else if (subRand < 0.8) { 
            shape = "circle"; width = 50; 
        } else {
            shape = "seesaw"; width = 100;
        }
    } else if (Math.random() < 0.15) { shape = "long"; width = 130; }
    
    const xPos = Math.random() * (canvas.width - width - 20) + 10;
    let newPlatform = createPlatform(xPos, yPos, selectedType, shape, width);
    
    if(selectedType.includes("move")) {
        newPlatform.speedX *= (1 + difficulty * 0.8);
        newPlatform.speedY *= (1 + difficulty * 0.8);
    }
    platforms.push(newPlatform);

    let itemChance = 0.15 - (difficulty * 0.05);
    if (shape !== "spring" && selectedType !== "penalty" && Math.random() < itemChance) {
        items.push({ x: xPos + width/2 - 10, y: yPos - 25, width: 20, height: 20, active: true, floatOffset: 0 });
    }
}

window.addEventListener("keydown", (e) => {
    if (gameState === "QUIZ") {
        if (e.key === "1") selectOption(0);
        if (e.key === "2") selectOption(1);
        if (e.key === "3") selectOption(2);
        return;
    }

    if (gameState !== "PLAYING") return;
    if (e.code === "ArrowLeft") keys.left = true;
    if (e.code === "ArrowRight") keys.right = true;
    if (e.code === "Space" && !player.isJumping && !player.isSuperJumping) { e.preventDefault(); keys.space = true; triggerJump(); }
});

window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft") keys.left = false;
    if (e.code === "ArrowRight") keys.right = false;
    if (e.code === "Space") keys.space = false;
});

function triggerJump() {
    if (player.isJumping || player.isSuperJumping) return;
    
    player.isJumping = true;
    player.jumpFromType = player.currentPlatform ? player.currentPlatform.type : "static";
    player.currentPlatform = null;
    
    let currentJumpPower = player.jumpFromType === "heavy" ? JUMP_POWER * 0.75 : JUMP_POWER;
    player.vy = currentJumpPower;
    player.platformOffsetY = 0;
    
    createParticles(player.x, player.y + player.radius, "#FF9800", 15);
    sfx.jump();
    
    let phrase = jumpPhrases[Math.floor(Math.random() * jumpPhrases.length)];
    player.jumpFx = { hz: phrase.hz, kr: phrase.kr, life: 1.0, x: player.x, y: player.y - 30, color: "#00ffcc" };
    speakChinese(phrase.hz, 'jump');
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x, y: y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
            life: 1.0, color: color, size: Math.random() * 4 + 2
        });
    }
}

function update() {
    if (gameState !== "PLAYING") return;

    if (quoteTimer > 0) quoteTimer--;
    
    if (player.jumpFx.life > 0) {
        player.jumpFx.life -= 0.02;
        player.jumpFx.y -= 1;
    }

    platforms.forEach(p => {
        p.x += p.speedX; p.y += p.speedY;
        if (Math.abs(p.x - p.startX) > p.range || p.x < 0 || p.x + p.width > canvas.width) p.speedX *= -1;
        if (Math.abs(p.y - p.startY) > p.range/2) p.speedY *= -1;

        if (p.shape === "seesaw") {
            let center = p.x + p.width / 2;
            let targetAngle = 0;
            if (player.currentPlatform === p && !player.isJumping) {
                let dist = player.x - center;
                targetAngle = (dist / (p.width / 2)) * (Math.PI / 4); 
            }
            p.angle += (targetAngle - p.angle) * 0.1; 
        }
    });

    let targetVx = 0;
    if (keys.left) targetVx = -MOVE_SPEED;
    else if (keys.right) targetVx = MOVE_SPEED;

    if (!player.isJumping && player.currentPlatform) {
        if (player.currentPlatform.shape === "circle") {
            let circleCenter = player.currentPlatform.x + player.currentPlatform.width / 2;
            targetVx += (player.x - circleCenter) * 0.16; 
        } else if (player.currentPlatform.shape === "seesaw") {
            targetVx += Math.tan(player.currentPlatform.angle) * 2.0;
        }
    }

    if (player.isSuperJumping) {
        player.currentChar = "飛"; 
        player.rotation = 0; 
        player.vy = -35; 
        
        player.vx = targetVx;
        player.x += player.vx;
        player.y += player.vy;
        
        createParticles(player.x, player.y + player.radius, "#ff00ff", 3);

        if (score >= player.superJumpTarget) {
            player.isSuperJumping = false;
            player.isJumping = true; 
            player.vy = -5; 
            player.currentChar = "大";
        }
    } else {
        player.vx = targetVx;
        player.x += player.vx;

        platforms.forEach(p => {
            if (p.shape.includes("L-")) {
                let isLeft = p.shape.includes("L-left");
                let pLeft = isLeft ? p.x : p.x + p.width - 20;
                let pRight = isLeft ? p.x + 20 : p.x + p.width;
                let pTop = p.y - p.pillarH;
                let pBottom = p.y; 

                if (player.y + player.radius > pTop + 2 && player.y - player.radius < pBottom) {
                    if (player.x + player.radius > pLeft && player.x - player.radius < pRight) {
                        if (player.vx > 0) player.x = pLeft - player.radius;
                        else if (player.vx < 0) player.x = pRight + player.radius;
                        player.vx = 0; 
                    }
                }
            }
        });

        if (player.isJumping) {
            player.currentChar = "大"; 
            player.rotation += player.vx * 0.05; 
            let currentGravity = GRAVITY;
            if (keys.space && player.vy < 0) currentGravity = player.jumpFromType === "heavy" ? GRAVITY * 0.85 : GRAVITY * 0.55;
            player.vy += currentGravity;
            player.y += player.vy;
            checkLanding();
        } else if (player.currentPlatform) {
            player.currentChar = "人"; player.rotation = 0;       
            let p = player.currentPlatform;
            
            let newOffset = 0;
            if (p.shape.includes("L-left")) {
                newOffset = (player.x <= p.x + 20) ? p.pillarH : 0; 
            } else if (p.shape.includes("L-right")) {
                newOffset = (player.x >= p.x + p.width - 20) ? p.pillarH : 0; 
            } else if (p.shape === "seesaw") {
                let dist = player.x - (p.x + p.width / 2);
                newOffset = -Math.tan(p.angle) * dist; 
            }
            
            if (player.platformOffsetY > 0 && newOffset === 0 && !p.shape.includes("seesaw")) {
                player.isJumping = true; player.jumpFromType = p.type; player.currentPlatform = null;
                player.platformOffsetY = 0; player.vy = 0; 
            } else {
                player.platformOffsetY = newOffset;
                player.x += p.speedX;
                player.y = p.y - player.platformOffsetY - player.radius;
                
                if (player.x < p.x - player.radius * 0.8 || player.x > p.x + p.width + player.radius * 0.8) {
                    player.isJumping = true; player.jumpFromType = p.type; player.currentPlatform = null;
                    player.platformOffsetY = 0; player.vy = 0; 
                }
            }
        }
    }

    if (player.x < player.radius) player.x = player.radius;
    if (player.x > canvas.width - player.radius) player.x = canvas.width - player.radius;

    // [버그 수정] 모바일 충돌 판정 여유값(30) 확대로 쾌속 스크롤 중에도 놓치지 않음
    if (!player.isSuperJumping) {
        items.forEach(item => {
            item.floatOffset += 0.1; 
            if (item.active && Math.abs(player.x - (item.x + 10)) < 30 && Math.abs(player.y - (item.y + 10)) < 30) {
                item.active = false; createParticles(item.x + 10, item.y + 10, "#00ffcc", 20); sfx.item(); 
                triggerQuiz('item');       
            }
        });
    }

    if (player.y < 300) {
        let diff = 300 - player.y;
        player.y += diff; 
        platforms.forEach(p => { p.y += diff; p.startY += diff; });
        items.forEach(i => i.y += diff);
        particles.forEach(pt => pt.y += diff);
        
        score += Math.floor(diff / 5); scoreUI.innerText = score;
        
        if (!hasStartedClimbing) hasStartedClimbing = true;
        else {
            lava.y += diff;
            if (player.isSuperJumping) lava.y += diff * 0.85; 
        }

        while (platforms.length > 0 && platforms[0].y > canvas.height + 100) { 
            platforms.shift(); generateLevel(); 
        }
    }

    if (hasStartedClimbing) {
        if (!player.isSuperJumping) {
            let accel = gameMode === "hell" ? 0.0008 : 0.0004;
            lava.speed += accel;
        }
        lavaSpeedUI.innerText = lava.speed.toFixed(1) + (gameMode === "hell" ? " (HELL)" : "");
        lava.y -= lava.speed;
    }

    if (lava.y > canvas.height - 40) lava.y = canvas.height - 40;

    if (player.y > lava.y || player.y > canvas.height) {
        gameState = "GAMEOVER"; 
        document.getElementById("final-score").innerText = score;
        gameOverUI.classList.remove("hidden");
        saveScore(); sfx.die(); bgmAudio.pause(); 
    }
}

function checkLanding() {
    if (player.isSuperJumping) return; 

    if (player.vy > 0) {
        for (let p of platforms) {
            let surfaces = [];
            
            if (p.shape.includes("L-left")) {
                surfaces.push({ x1: p.x, x2: p.x + 20, y: p.y - p.pillarH, offset: p.pillarH }); 
                surfaces.push({ x1: p.x + 20, x2: p.x + p.width, y: p.y, offset: 0 }); 
            } else if (p.shape.includes("L-right")) {
                surfaces.push({ x1: p.x, x2: p.x + p.width - 20, y: p.y, offset: 0 }); 
                surfaces.push({ x1: p.x + p.width - 20, x2: p.x + p.width, y: p.y - p.pillarH, offset: p.pillarH }); 
            } else if (p.shape === "seesaw") {
                surfaces.push({ x1: p.x, x2: p.x + p.width, y: p.y, offset: 0, isSeesaw: true });
            } else { 
                surfaces.push({ x1: p.x, x2: p.x + p.width, y: p.y, offset: 0 }); 
            }

            for (let s of surfaces) {
                let surfaceY = s.y;
                if (s.isSeesaw) {
                    let dist = player.x - (p.x + p.width / 2);
                    surfaceY = p.y + Math.tan(p.angle) * dist;
                }

                if (player.x > s.x1 - player.radius && player.x < s.x2 + player.radius &&
                    player.y + player.radius >= surfaceY && player.y + player.radius <= surfaceY + player.vy + 4) {
                    
                    if (p.type === "penalty" && !p.penaltyApplied) {
                        p.penaltyApplied = true;
                        lava.speed *= 1.01;
                        player.jumpFx = { hz: "警告!", kr: "용암 가속 (+1%)", life: 1.5, x: p.x + p.width/2, y: p.y - 20, color: "#ff3333" };
                    }

                    player.y = surfaceY - player.radius; player.vy = 0; player.vx = 0; player.isJumping = false;
                    player.currentPlatform = p; 
                    player.platformOffsetY = s.isSeesaw ? -Math.tan(p.angle) * (player.x - (p.x + p.width / 2)) : s.offset; 
                    
                    createParticles(player.x, player.y + player.radius, "#fff", 5);
                    sfx.land();

                    if (p.shape === "spring" && !p.used) {
                        p.used = true;
                        triggerQuiz('spring');
                    }
                    return;
                }
            }
        }
    }
}

function triggerQuiz(source) {
    gameState = "QUIZ";
    currentQuizSource = source; 
    document.getElementById("quiz-answer-slot").innerText = ""; 
    document.getElementById("quiz-buttons").innerHTML = "";
    
    currentQuiz = quizBank[Math.floor(Math.random() * quizBank.length)];
    document.getElementById("quiz-question").innerText = currentQuiz.question;
    
    currentQuiz.options.forEach((opt, index) => {
        let btn = document.createElement("button"); 
        btn.className = "quiz-opt-btn";
        btn.innerText = `${index + 1}. ${opt}`;
        
        // PC & 모바일 즉각 반응
        btn.onpointerdown = (e) => { e.preventDefault(); selectOption(index); };
        btn.onclick = () => selectOption(index);
        
        document.getElementById("quiz-buttons").appendChild(btn);
    });

    // [핵심 해결] UI를 먼저 띄운 뒤 약간의 시차를 두고 TTS를 호출해 모바일 브라우저 프리즈 차단
    quizModal.classList.remove("hidden");
    setTimeout(() => {
        speakChinese(currentQuiz.question, 'normal');
    }, 50);
}

function selectOption(selectedIndex) {
    if (gameState !== "QUIZ") return;

    if (selectedIndex === currentQuiz.answer) {
        document.getElementById("quiz-answer-slot").innerText = "정답! 용암이 물러납니다.";
        document.getElementById("quiz-answer-slot").style.color = "#00ffcc";
        sfx.correct(); 

        setTimeout(() => { 
            quizModal.classList.add("hidden"); 
            lava.y = canvas.height - 40; 
            lava.speed = (gameMode === "hell" ? 1.0 : 0.6); 
            gameState = "PLAYING"; 
            
            if (currentQuizSource === 'spring') {
                superJumpCount++; 
                let bonusDist = superJumpCount * 200;
                
                player.isSuperJumping = true;
                player.superJumpTarget = score + bonusDist;
                player.vy = -35;
                player.isJumping = true;
                player.currentPlatform = null;
                sfx.superJump();
                
                currentSubtitle = superJumpQuotes[Math.floor(Math.random() * superJumpQuotes.length)];
                speakChinese(currentSubtitle.hz, 'superJump'); 
                
                quoteTimer = 300; 
                createParticles(player.x, player.y + player.radius, "#ff00ff", 40);
            }
        }, 1000);
    } else {
        let penaltyText = currentQuizSource === 'spring' ? "50%" : "10%";
        let speedMultiplier = currentQuizSource === 'spring' ? 1.5 : 1.1;

        document.getElementById("quiz-answer-slot").innerText = `오답! 용암 가속 ${penaltyText}`;
        document.getElementById("quiz-answer-slot").style.color = "#ff3366";
        sfx.wrong(); 

        setTimeout(() => { 
            quizModal.classList.add("hidden"); 
            lava.speed *= speedMultiplier; 
            gameState = "PLAYING"; 
        }, 1000);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (player.isSuperJumping) {
        ctx.fillStyle = "rgba(255, 0, 255, 0.12)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        for(let i=0; i<15; i++) {
            ctx.fillRect(Math.random()*canvas.width, Math.random()*canvas.height, 2, Math.random()*100+50);
        }
    }

    trails.push({ x: player.x, y: player.y, life: 0.5, char: player.currentChar, rot: player.rotation });
    for (let i = trails.length - 1; i >= 0; i--) {
        let t = trails[i]; t.life -= 0.08; 
        if (t.life <= 0) { trails.splice(i, 1); continue; }
        ctx.globalAlpha = t.life; ctx.fillStyle = "#FF9800"; ctx.font = "bold 38px 'Malgun Gothic', sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.rot); ctx.fillText(t.char, 0, 0); ctx.restore();
    }
    ctx.globalAlpha = 1.0;

    platforms.forEach(p => {
        ctx.shadowBlur = 15;
        if (p.type === "penalty") { ctx.fillStyle = "#ff3333"; ctx.shadowColor = "#ff3333"; }
        else if (p.type === "heavy") { ctx.fillStyle = "#3F51B5"; ctx.shadowColor = "#3F51B5"; }
        else if (p.shape === "spring") { ctx.fillStyle = "#ff00ff"; ctx.shadowColor = "#ff00ff"; }
        else if (p.type === "static") { ctx.fillStyle = "#9E9E9E"; ctx.shadowBlur = 0; }
        else { ctx.fillStyle = "#00ffcc"; ctx.shadowColor = "#00ffcc"; }
        
        if (p.shape === "rect" || p.shape === "long") { 
            ctx.fillRect(p.x, p.y, p.width, p.height); 
        } else if (p.shape.includes("L-left")) { 
            ctx.fillRect(p.x + 20, p.y, p.width - 20, p.height); 
            ctx.fillRect(p.x, p.y - p.pillarH, 20, p.height + p.pillarH); 
        } else if (p.shape.includes("L-right")) { 
            ctx.fillRect(p.x, p.y, p.width - 20, p.height);
            ctx.fillRect(p.x + p.width - 20, p.y - p.pillarH, 20, p.height + p.pillarH);
        } else if (p.shape === "circle") {
            ctx.beginPath(); let r = p.width / 2; ctx.arc(p.x + r, p.y + r, r, 0, Math.PI * 2); ctx.fill(); ctx.closePath();
            ctx.shadowBlur = 0; ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
            ctx.beginPath(); ctx.arc(p.x + r - 6, p.y + r - 6, r * 0.4, 0, Math.PI * 2); ctx.fill(); ctx.closePath();
        } else if (p.shape === "seesaw") {
            ctx.save();
            ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
            ctx.rotate(p.angle);
            ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
            ctx.fillStyle = "#ffcc00";
            ctx.beginPath(); ctx.arc(0, p.height / 2, 5, 0, Math.PI * 2); ctx.fill(); ctx.closePath();
            ctx.restore();
        } else if (p.shape === "spring") {
            ctx.fillRect(p.x, p.y, p.width, p.height);
            ctx.fillStyle = "#fff"; ctx.font = "bold 14px Arial"; ctx.textAlign = "center";
            ctx.fillText("▲", p.x + p.width/2, p.y + 8);
        }
        ctx.shadowBlur = 0; 
    });

    ctx.shadowBlur = 20; ctx.shadowColor = "#ffcc00"; ctx.fillStyle = "#ffcc00";
    items.forEach(i => { if (i.active) { let floatY = Math.sin(i.floatOffset) * 5; ctx.fillRect(i.x, i.y + floatY, i.width, i.height); } });
    ctx.shadowBlur = 0;

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.04;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    ctx.save();
    ctx.translate(player.x, player.y); ctx.rotate(player.rotation); 
    ctx.shadowBlur = 10; ctx.shadowColor = "#FF9800"; ctx.fillStyle = "#FF9800";
    if (player.isSuperJumping) ctx.font = "bold 50px 'Malgun Gothic', sans-serif"; 
    else ctx.font = "bold 38px 'Malgun Gothic', sans-serif"; 
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; 
    ctx.fillText(player.currentChar, 0, 0); 
    ctx.restore(); 

    if (player.jumpFx.life > 0) {
        ctx.save();
        ctx.globalAlpha = player.jumpFx.life;
        ctx.textAlign = "center";
        ctx.shadowBlur = 5; ctx.shadowColor = "#000";
        
        ctx.font = "bold 22px 'Malgun Gothic'";
        ctx.fillStyle = player.jumpFx.color;
        ctx.fillText(player.jumpFx.hz, player.jumpFx.x, player.jumpFx.y);
        
        ctx.font = "14px 'Malgun Gothic'";
        ctx.fillStyle = "#fff";
        ctx.fillText(player.jumpFx.kr, player.jumpFx.x, player.jumpFx.y + 18);
        ctx.restore();
    }

    if (quoteTimer > 0) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(10, 180, canvas.width - 20, 100);

        ctx.font = "bold 22px 'Gungsuh', '궁서', 'GungsuhChe', serif";
        ctx.fillStyle = "#ffcc00"; 
        ctx.shadowBlur = 4; ctx.shadowColor = "#000";
        ctx.fillText(currentSubtitle.hz, canvas.width / 2, 220);

        ctx.font = "14px 'Gungsuh', '궁서', serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(currentSubtitle.kr, canvas.width / 2, 255);
        ctx.restore();
    }

    let lavaGradient = ctx.createLinearGradient(0, lava.y, 0, canvas.height);
    lavaGradient.addColorStop(0, "rgba(255, 51, 102, 0.85)"); lavaGradient.addColorStop(1, "rgba(200, 0, 0, 1)");
    ctx.fillStyle = lavaGradient; ctx.fillRect(0, lava.y, canvas.width, canvas.height - lava.y);
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)"; ctx.fillRect(0, lava.y, canvas.width, 3);
}

function loop() {
    update(); draw();
    animationId = requestAnimationFrame(loop);
}

window.onload = initApp;
