const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// --- PUNTO EXACTO: CARGA DE IMÁGENES ---
const imgNave = new Image();
imgNave.src = 'assets/nave.jpg'; 

const imgAlien = new Image();
imgAlien.src = 'assets/alien.jpg';

const imgExplosion = new Image();
imgExplosion.src = 'assets/explosion.jpg';
// ---------------------------------------

// Estado del Juego
let score = 0;
let lives = 3;
let energy = 100;
let gameOver = false;
let win = false;
const keys = {};

const player = { x: 375, y: 520, w: 50, h: 50, speed: 7 };
let bullets = [];
let enemyBullets = [];
let aliens = [];
let explosions = [];

const ENERGY_COST = 20; // Coste por disparo
const ENERGY_REGEN = 0.4; // Velocidad de recarga

// Inicializar flota
function initAliens() {
    aliens = [];
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 8; c++) {
            aliens.push({ 
                x: c * 75 + 100, 
                y: r * 60 + 80, 
                w: 40, h: 40, 
                alive: true, 
                direction: 1 
            });
        }
    }
}

// Controles
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function handleInput() {
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.w) player.x += player.speed;
    if (keys['Space']) {
        fireBullet();
        keys['Space'] = false; // Evita ráfaga infinita al mantener pulsado
    }
    if (gameOver && keys['KeyR']) location.reload();
}

function fireBullet() {
    if (energy >= ENERGY_COST && !gameOver) {
        bullets.push({ x: player.x + player.w / 2 - 2, y: player.y, w: 4, h: 12 });
        energy -= ENERGY_COST;
        // Aquí puedes añadir: new Audio('assets/laser.mp3').play().catch(()=>{});
    }
}

function update() {
    handleInput();

    if (!gameOver) {
        // Recarga de energía
        if (energy < 100) energy += ENERGY_REGEN;
        
        // Actualizar HUD
        document.getElementById('energy-bar').style.width = energy + "%";
        document.getElementById('score').innerText = score;
        document.getElementById('lives').innerText = lives;

        // Balas del jugador
        bullets.forEach((b, i) => {
            b.y -= 8;
            if (b.y < 0) bullets.splice(i, 1);
        });

        // Balas enemigas y DAÑO AL JUGADOR (Sistema de Vidas)
        enemyBullets.forEach((eb, i) => {
            eb.y += 5;
            if (eb.y > canvas.height) enemyBullets.splice(i, 1);
            
            // Colisión con la nave
            if (eb.x < player.x + player.w && eb.x + 6 > player.x && 
                eb.y < player.y + player.h && eb.y + 12 > player.y) {
                enemyBullets.splice(i, 1);
                lives--; // Se resta una vida
                if (lives <= 0) finishGame(false);
            }
        });

        const aliveAliens = aliens.filter(a => a.alive);
        if (aliveAliens.length === 0) finishGame(true);

        // Velocidad Dinámica: aumenta según mueren los aliens
        let currentSpeed = 1.5 + (24 - aliveAliens.length) * 0.15;

        aliens.forEach(a => {
            if (!a.alive) return;
            a.x += currentSpeed * a.direction;

            if (a.x + a.w > canvas.width || a.x < 0) {
                aliens.forEach(all => { all.direction *= -1; all.y += 10; });
            }

            // Impacto de bala del jugador en alien
            bullets.forEach((b, bi) => {
                if (b.x < a.x + a.w && b.x + b.w > a.x && b.y < a.y + a.h && b.y + b.h > a.y) {
                    a.alive = false;
                    bullets.splice(bi, 1);
                    score += 10;
                    explosions.push({ x: a.x, y: a.y, timer: 15 });
                }
            });
        });

        // Disparo enemigo aleatorio
        if (Math.random() < 0.015 && aliveAliens.length > 0) {
            const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
            enemyBullets.push({ x: shooter.x + 18, y: shooter.y + 40 });
        }

        // Limpieza de explosiones (15 frames)
        explosions.forEach((exp, i) => {
            exp.timer--;
            if (exp.timer <= 0) explosions.splice(i, 1);
        });
    }
    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // DIBUJAR NAVE (Usa imagen)
    ctx.drawImage(imgNave, player.x, player.y, player.w, player.h);

    // DIBUJAR ALIENS (Usa imagen)
    aliens.forEach(a => {
        if (a.alive) ctx.drawImage(imgAlien, a.x, a.y, a.w, a.h);
    });

    // Balas
    ctx.fillStyle = "#ffff00";
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
    ctx.fillStyle = "#ff0044";
    enemyBullets.forEach(eb => ctx.fillRect(eb.x, eb.y, 6, 12));

    // DIBUJAR EXPLOSIONES (Usa imagen)
    explosions.forEach(exp => {
        ctx.drawImage(imgExplosion, exp.x, exp.y, 40, 40);
    });

    // Pantalla Final
    if (gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = "bold 50px Courier New";
        ctx.textAlign = "center";
        ctx.fillStyle = win ? "#00ffcc" : "#ff0044";
        ctx.fillText(win ? "¡VICTORIA!" : "GAME OVER", canvas.width / 2, canvas.height / 2);
        ctx.font = "20px Courier New";
        ctx.fillStyle = "white";
        ctx.fillText("PUNTUACIÓN FINAL: " + score, canvas.width / 2, canvas.height / 2 + 50);
        ctx.fillText("Pulsa 'R' para reintentar", canvas.width / 2, canvas.height / 2 + 100);
    }
}

function finishGame(isVictory) {
    gameOver = true;
    win = isVictory;
}

initAliens();
update();