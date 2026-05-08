// ==========================================
// BOT LEAGUE - LÓGICA PRINCIPAL DEL JUEGO
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const screens = {
        menu: document.getElementById('menu-screen'),
        hud: document.getElementById('hud'),
        message: document.getElementById('message-screen'),
        gameOver: document.getElementById('game-over-screen')
    };
    
    const elements = {
        scorePlayer: document.getElementById('score-player'),
        scoreEnemy: document.getElementById('score-enemy'),
        mainMsg: document.getElementById('main-message'),
        endTitle: document.getElementById('end-title')
    };

    const btn3Goals = document.getElementById('btn-3goals');
    const btnGolden = document.getElementById('btn-golden');
    const btnRestart = document.getElementById('btn-restart');

    if (!canvas || !btn3Goals) {
        console.error("Error: Faltan elementos en el HTML. Revisa los IDs.");
        return;
    }

    const STATE = { MENU: 0, COUNTDOWN: 1, PLAYING: 2, GOAL: 3, END: 4 };
    let currentState = STATE.MENU;
    let gameMode = '3_GOALS';
    let score = { player: 0, bot: 0 };
    
    const keys = { w: false, a: false, s: false, d: false, space: false };

    const goalWidth = 150;
    const goalDepth = 20;

    let player = { x: 200, y: 300, vx: 0, vy: 0, speed: 4, radius: 15, color: '#3498db' };
    let bot = { x: 600, y: 300, vx: 0, vy: 0, speed: 2.2, radius: 15, color: '#e74c3c' }; 
    let ball = { x: 400, y: 300, vx: 0, vy: 0, radius: 10, color: '#ffffff', friction: 0.96 };

    window.addEventListener('keydown', (e) => {
        if (e.key === 'w' || e.key === 'ArrowUp') keys.w = true;
        if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = true;
        if (e.key === 's' || e.key === 'ArrowDown') keys.s = true;
        if (e.key === 'd' || e.key === 'ArrowRight') keys.d = true;
        if (e.key === ' ') keys.space = true;
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'w' || e.key === 'ArrowUp') keys.w = false;
        if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = false;
        if (e.key === 's' || e.key === 'ArrowDown') keys.s = false;
        if (e.key === 'd' || e.key === 'ArrowRight') keys.d = false;
        if (e.key === ' ') keys.space = false;
    });

    btn3Goals.addEventListener('click', () => startGame('3_GOALS'));
    btnGolden.addEventListener('click', () => startGame('GOLDEN'));
    btnRestart.addEventListener('click', backToMenu);

    function resetPositions() {
        player.x = 200; player.y = 300; player.vx = 0; player.vy = 0;
        bot.x = 600; bot.y = 300; bot.vx = 0; bot.vy = 0;
        ball.x = 400; ball.y = 300; ball.vx = 0; ball.vy = 0;
    }

    function startGame(mode) {
        gameMode = mode;
        score = { player: 0, bot: 0 };
        updateHUD();
        screens.menu.classList.add('hidden');
        screens.gameOver.classList.add('hidden');
        screens.hud.classList.remove('hidden');
        resetPositions();
        startCountdown();
    }

    function startCountdown() {
        currentState = STATE.COUNTDOWN;
        screens.message.classList.remove('hidden');
        let count = 3;
        elements.mainMsg.innerText = count;

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                elements.mainMsg.innerText = count;
            } else if (count === 0) {
                elements.mainMsg.innerText = "¡YA!";
            } else {
                clearInterval(interval);
                screens.message.classList.add('hidden');
                currentState = STATE.PLAYING;
            }
        }, 1000);
    }

    function handleGoal(scorer) {
        if (currentState === STATE.GOAL) return; // Previene contar el mismo gol varias veces
        currentState = STATE.GOAL;
        
        // Frenar la pelota al entrar
        ball.vx = 0; ball.vy = 0; 

        if (scorer === 'player') score.player++;
        if (scorer === 'bot') score.bot++;
        updateHUD();

        screens.message.classList.remove('hidden');
        elements.mainMsg.innerText = scorer === 'player' ? '¡GOOOL!' : '¡Gol Rival!';

        setTimeout(() => {
            if (checkWinCondition()) {
                endGame(scorer === 'player');
            } else {
                screens.message.classList.add('hidden');
                resetPositions();
                startCountdown();
            }
        }, 2000);
    }

    function checkWinCondition() {
        if (gameMode === 'GOLDEN' && (score.player > 0 || score.bot > 0)) return true;
        if (gameMode === '3_GOALS' && (score.player >= 3 || score.bot >= 3)) return true;
        return false;
    }

    function endGame(playerWon) {
        currentState = STATE.END;
        screens.message.classList.add('hidden');
        screens.hud.classList.add('hidden');
        screens.gameOver.classList.remove('hidden');
        elements.endTitle.innerText = playerWon ? '¡Victoria!' : 'Derrota';
        elements.endTitle.style.color = playerWon ? '#2ecc71' : '#e74c3c';
    }

    function backToMenu() {
        screens.gameOver.classList.add('hidden');
        screens.menu.classList.remove('hidden');
        currentState = STATE.MENU;
    }

    function updateHUD() {
        elements.scorePlayer.innerText = score.player;
        elements.scoreEnemy.innerText = score.bot;
    }

    // ================= FÍSICA CORREGIDA ================= //

    function resolveCollision(ent1, ent2, isBall = false) {
        let dx = ent2.x - ent1.x;
        let dy = ent2.y - ent1.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) { dx = 1; distance = 1; } // Evita bugs si aparecen exactamente en el mismo pixel

        const minDistance = ent1.radius + ent2.radius;

        if (distance < minDistance) {
            const nx = dx / distance;
            const ny = dy / distance;
            const overlap = minDistance - distance;
            
            if (isBall) {
                // Separación: Empuja la pelota fuera del jugador para que no se atasque
                ent2.x += nx * overlap;
                ent2.y += ny * overlap;
                
                // Transferencia de velocidad controlada (Evita que salga a la velocidad de la luz)
                const speedTransfer = 0.6;
                ent2.vx += ent1.vx * speedTransfer + nx * 1.5;
                ent2.vy += ent1.vy * speedTransfer + ny * 1.5;

                // Límite máximo de velocidad de la pelota
                const maxSpeed = 12;
                const currentSpeed = Math.sqrt(ent2.vx**2 + ent2.vy**2);
                if (currentSpeed > maxSpeed) {
                    ent2.vx = (ent2.vx / currentSpeed) * maxSpeed;
                    ent2.vy = (ent2.vy / currentSpeed) * maxSpeed;
                }
            } else {
                // Choque entre jugadores: Se empujan a partes iguales
                ent1.x -= nx * (overlap / 2);
                ent1.y -= ny * (overlap / 2);
                ent2.x += nx * (overlap / 2);
                ent2.y += ny * (overlap / 2);
            }
        }
    }

    function updatePhysics() {
        if (currentState !== STATE.PLAYING) return;

        // Movimiento Jugador
        player.vx = 0; player.vy = 0;
        if (keys.w) player.vy = -player.speed;
        if (keys.s) player.vy = player.speed;
        if (keys.a) player.vx = -player.speed;
        if (keys.d) player.vx = player.speed;

        if (player.vx !== 0 && player.vy !== 0) {
            player.vx *= Math.SQRT1_2;
            player.vy *= Math.SQRT1_2;
        }

        player.x += player.vx;
        player.y += player.vy;

        // Movimiento Bot
        const dxBotBall = ball.x - bot.x;
        const dyBotBall = ball.y - bot.y;
        const distBotBall = Math.sqrt(dxBotBall**2 + dyBotBall**2);
        
        if (distBotBall > 0) {
            bot.vx = (dxBotBall / distBotBall) * bot.speed;
            bot.vy = (dyBotBall / distBotBall) * bot.speed;
        }
        bot.x += bot.vx;
        bot.y += bot.vy;

        // Chutar la pelota
        if (keys.space) {
            const dx = ball.x - player.x;
            const dy = ball.y - player.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < player.radius + ball.radius + 20) { 
                ball.vx += (dx / dist) * 10;
                ball.vy += (dy / dist) * 10;
                keys.space = false; 
            }
        }

        // Fricción pelota
        ball.vx *= ball.friction;
        ball.vy *= ball.friction;
        ball.x += ball.vx;
        ball.y += ball.vy;

        resolveCollision(player, bot);
        resolveCollision(player, ball, true);
        resolveCollision(bot, ball, true);

        // Control de Límites Corregido
        const constrainEntity = (ent, isBall = false) => {
            // Techo y suelo para todos
            if (ent.y < ent.radius) { ent.y = ent.radius; ent.vy *= -0.8; }
            if (ent.y > canvas.height - ent.radius) { ent.y = canvas.height - ent.radius; ent.vy *= -0.8; }
            
            // Detectar si está en la zona de gol (Y)
            const inGoalY = ent.y > (canvas.height/2 - goalWidth/2 + ent.radius) && ent.y < (canvas.height/2 + goalWidth/2 - ent.radius);
            
            if (!isBall) {
                // Jugador y Bot NUNCA pueden salir por los lados
                if (ent.x < ent.radius) { ent.x = ent.radius; ent.vx = 0; }
                if (ent.x > canvas.width - ent.radius) { ent.x = canvas.width - ent.radius; ent.vx = 0; }
            } else {
                // La pelota sí puede salir si está en la zona de gol
                if (!inGoalY) {
                    if (ent.x < ent.radius) { ent.x = ent.radius; ent.vx *= -0.8; }
                    if (ent.x > canvas.width - ent.radius) { ent.x = canvas.width - ent.radius; ent.vx *= -0.8; }
                }
            }
        };

        constrainEntity(player, false);
        constrainEntity(bot, false);
        constrainEntity(ball, true);

        // Detección de Goles (Solo si cruza completamente la línea)
        if (ball.x < -ball.radius) handleGoal('bot');
        else if (ball.x > canvas.width + ball.radius) handleGoal('player');
    }

    // ================= RENDERIZADO ================= //

    function drawField() {
        ctx.fillStyle = '#2e7d32'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#cccccc'; 
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        ctx.stroke();

        ctx.beginPath(); 
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();

        ctx.beginPath(); 
        ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(0, canvas.height / 2 - goalWidth / 2, goalDepth, goalWidth);
        ctx.strokeRect(0, canvas.height / 2 - goalWidth / 2, goalDepth, goalWidth);

        ctx.fillRect(canvas.width - goalDepth, canvas.height / 2 - goalWidth / 2, goalDepth, goalWidth);
        ctx.strokeRect(canvas.width - goalDepth, canvas.height / 2 - goalWidth / 2, goalDepth, goalWidth);
    }

    function drawEntity(entity) {
        ctx.beginPath();
        ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
        ctx.fillStyle = entity.color;
        ctx.fill();
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawField();
        
        if (currentState !== STATE.MENU) {
            drawEntity(player);
            drawEntity(bot);
            drawEntity(ball);

            if (player.vx !== 0 || player.vy !== 0) {
                ctx.beginPath();
                ctx.moveTo(player.x, player.y);
                const angle = Math.atan2(player.vy, player.vx);
                ctx.lineTo(player.x + Math.cos(angle) * (player.radius + 10), player.y + Math.sin(angle) * (player.radius + 10));
                ctx.strokeStyle = '#f1c40f';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        }
    }

    function gameLoop() {
        updatePhysics();
        render();
        requestAnimationFrame(gameLoop); 
    }

    gameLoop();
});