let canvas, ctx;
let dino, obstacles;

let gameRunning = false;
let quizActive = false;

let spawnTimer = 0;
let spawnInterval = 120;

let lives = 3;

// 🌄 Background + particles
let bgLayers = [];
let clouds = [];
let particles = [];

// ================= START GAME =================
async function startBreakGame(){
  navigate("breakGame");

  const loading = document.getElementById("loadingScreen");
  loading.style.display = "flex";
  startLoadingAnimation();


  lives = 3;

  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  canvas.removeEventListener("click", jump);
  canvas.addEventListener("click", jump);

  dino = {
    x:80,
    y:220,
    w:50,
    h:50,
    vy:0,
    gravity:1.2,
    jump:-20,
    grounded:true
  };

  obstacles = [];

  gameRunning = false;
  quizActive = false;

  spawnTimer = 0;

  // 🌄 Parallax layers
  bgLayers = [
    { y: 180, speed: 0.5, color: "#c7d2fe" },
    { y: 210, speed: 1, color: "#a5b4fc" }
  ];

  // ☁️ clouds
  clouds = [];
  for(let i = 0; i < 3; i++){
    clouds.push({
      x: Math.random()*800,
      y: 50 + Math.random()*80,
      size: 30 + Math.random()*20,
      speed: 1 + Math.random()*0.5
    });
  }

  if (window.resetQuizState) resetQuizState();
if (window.generateAllQuestions) {
  generateAllQuestions(window.currentTopic || "General");
}

  stopLoadingAnimation();
  loading.style.display = "none"

  gameRunning = true;
  requestAnimationFrame(gameLoop);
}

// ================= JUMP =================
function jump(){
  if(dino.grounded && gameRunning && !quizActive){
    dino.vy = dino.jump;
    dino.grounded = false;
  }
}

// SPACE KEY
window.addEventListener("keydown", e=>{
  if(e.code==="Space"){
    e.preventDefault();
    jump();
  }
});

// ================= DRAW DINO =================
function drawDino(x, y){

  const body = "#4f46e5";

  const bounce = Math.sin(Date.now()/120) * 2;
  y += bounce;

  // body
  ctx.fillStyle = body;
  roundRect(x, y, 40, 25, 10);

  // head
  roundRect(x+25, y-12, 20, 18, 8);

  // eye
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x+38, y-4, 3, 0, Math.PI*2);
  ctx.fill();

  // teeth
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(x+42, y+2, 4, 2);

  // tail
  ctx.beginPath();
  ctx.moveTo(x-10, y+10);
  ctx.lineTo(x, y+5);
  ctx.lineTo(x, y+20);
  ctx.fillStyle = body;
  ctx.fill();

  // legs
  const swing = Math.sin(Date.now()/80) * 5;
  roundRect(x+5, y+25, 6, 10 + swing, 3);
  roundRect(x+18, y+25, 6, 10 - swing, 3);

  // arms
  roundRect(x+20, y+8, 6, 4, 2);
}

// ================= ROUNDED RECT =================
function roundRect(x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r);
  ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h);
  ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.fill();
}

// ================= GAME LOOP =================
function gameLoop(){
  if(!gameRunning || quizActive){
    requestAnimationFrame(gameLoop);
  return;
}

  ctx.clearRect(0,0,800,300);

  // 🌄 Parallax background
  bgLayers.forEach(layer => {
    ctx.fillStyle = layer.color;

    for(let i = 0; i < 3; i++){
      const x = (i * 400 - (Date.now()/10 * layer.speed) % 400);
      ctx.beginPath();
      ctx.moveTo(x, 260);
      ctx.quadraticCurveTo(x+100, layer.y, x+200, 260);
      ctx.fill();
    }
  });

  // ☁️ clouds
  ctx.fillStyle = "#cbd5f5";
  clouds.forEach(cloud=>{
    cloud.x -= cloud.speed;

    if(cloud.x < -50){
      cloud.x = 800;
      cloud.y = 50 + Math.random()*80;
    }

    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI*2);
    ctx.arc(cloud.x+cloud.size, cloud.y+5, cloud.size*0.8, 0, Math.PI*2);
    ctx.arc(cloud.x-cloud.size, cloud.y+5, cloud.size*0.8, 0, Math.PI*2);
    ctx.fill();
  });

  // ground
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(0,260,800,40);

  // moving ground lines
  ctx.fillStyle = "#cbd5f5";
  for(let i=0;i<20;i++){
    const x = (i*50 - Date.now()/5 % 50);
    ctx.fillRect(x, 275, 20, 2);
  }

  // physics
  dino.vy += dino.gravity;
  dino.y += dino.vy;

  if(dino.y >= 220){
    dino.y = 220;
    dino.vy = 0;
    dino.grounded = true;
  }

  drawDino(dino.x, dino.y);

  // ================= SPAWN =================
  if(Array.isArray(questions) && currentQ < questions.length){

    spawnTimer++;

    if(spawnTimer > spawnInterval){
      if(obstacles.length === 0 || obstacles[obstacles.length-1].x < 500){

        spawnTimer = 0;

        const type = Math.random() < 0.7 ? "avoid" : "quiz";

        obstacles.push({
          x:800,
          y: type === "quiz" ? 180 : 220,
          w:20,
          h: type === "quiz" ? 80 : 40,
          type,
          triggered:false
        });

        spawnInterval = 90 + Math.random() * 80;
      }
    }

  }

  // ================= OBSTACLES =================
  for(let i = 0; i < obstacles.length; i++){
    let obs = obstacles[i];

    const speed = 6 + (questionsAsked * 0.4);
    obs.x -= speed;

    if(obs.type === "quiz"){
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#ef4444";
    } else {
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#3b82f6";
    }

    ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    ctx.shadowBlur = 0;

    // collision
    if(
      dino.x < obs.x + obs.w &&
      dino.x + dino.w > obs.x &&
      dino.y < obs.y + obs.h &&
      dino.y + dino.h > obs.y
    ){

      // 🔵 BLUE
      if(obs.type === "avoid"){
        screenShake();
        flash();

        for(let j=0;j<10;j++){
          particles.push({
            x: obs.x,
            y: obs.y,
            vx: (Math.random()-0.5)*4,
            vy: Math.random()*-3,
            life: 30
          });
        }

        showNotification(`Hit blue! -1 life ❌ (${lives-1} left)`);
        obstacles.splice(i, 1);
        lives--;

        if(lives <= 0){
          gameRunning = false;
          quizActive = false;
          showGameOver();
          return;
        }

        spawnInterval = Math.max(60, spawnInterval - 5);
        continue;
      }

      // 🔴 RED
      if(obs.type === "quiz" && !quizActive){
        canvas.style.filter = "blur(4px)";

        for(let j=0;j<10;j++){
          particles.push({
            x: obs.x,
            y: obs.y,
            vx: (Math.random()-0.5)*4,
            vy: Math.random()*-3,
            life: 30
          });
        }

        quizActive = true;
        gameRunning = false;

        obstacles.splice(i,1);

        setTimeout(()=>{
          triggerQuizGame();
        }, 100);

        return;
      }
    }
  }

  obstacles = obstacles.filter(o => o.x > -20);

  // ✨ particles
  particles.forEach((p, i)=>{
    p.x += p.vx;
    p.y += p.vy;
    p.life--;

    ctx.fillStyle = `rgba(79,70,229,${p.life/30})`;
    ctx.fillRect(p.x, p.y, 4, 4);

    if(p.life <= 0) particles.splice(i,1);
  });

  updateStatsUI();

  requestAnimationFrame(gameLoop);
}

// ================= EFFECTS =================
function screenShake(){
  canvas.style.transform = "translate(4px, 0)";
  setTimeout(()=> canvas.style.transform = "translate(-4px, 0)", 50);
  setTimeout(()=> canvas.style.transform = "translate(0,0)", 100);
}

function flash(){
  canvas.style.filter = "blur(4px) brightness(1.8)";
  
  setTimeout(()=> {
    if(quizActive){
      canvas.style.filter = "blur(4px)";
    } else {
      canvas.style.filter = "none";
    }
  }, 100);
}

// ================= QUIZ =================
async function triggerQuizGame(){
  if(typeof window.triggerQuiz === "function"){
    await window.triggerQuiz();
  } else {
    console.error("triggerQuiz not found");
    quizActive = false;
    gameRunning = true;
    requestAnimationFrame(gameLoop);
  }
}

// ================= GAME OVER =================
function showGameOver(){
  const modal = document.getElementById("reportCard");
  const report = document.getElementById("reportContent");

  modal.style.display = "flex";

  report.innerHTML = `
    <h2>Game Over 💀</h2>
    <p>You ran out of lives.</p>

    <div class="game-btns">
    <button class="game-btn btn-resume" onclick="resumeGame()">▶ Resume</button>
    <button class="game-btn btn-replay" onclick="restartGame()">🔁 Replay</button>
    <button class="game-btn btn-dashboard" onclick="goToDashboard()">🏠 Dashboard</button>
  </div>
  `;
}

// ================= RESTART =================
function restartGame(){
  lives = 3;
  correct = 0;
  wrong = 0;
  questionsAsked = 0;
  currentQ = 0;
  questions = [];
  if (typeof askedQuestionsSet !== "undefined") {
  askedQuestionsSet.clear();
}

  document.getElementById("reportCard").style.display = "none";

  startBreakGame();
}

// ================= UPDATE UI =================
function updateStatsUI(){
  const score = document.getElementById("scoreText");
  const q = document.getElementById("questionText");
  const livesEl = document.getElementById("livesText");

  if (score) score.innerText = `Correct: ${correct || 0} | Wrong: ${wrong || 0}`;
if (q) q.innerText = `Q: ${questionsAsked || 0}/${MAX_QUESTIONS || 10}`;
if (livesEl) livesEl.innerText = `Lives: ${lives || 0}`;
}

function resumeGame(){
  document.getElementById("reportCard").style.display = "none";
  gameRunning = true;
  requestAnimationFrame(gameLoop);
}