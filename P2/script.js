// --- VARIABLES DE ESTADO ---
let secretCode = [];
let revealedCount = 0;
let attemptsLeft = 7;
const MAX_ATTEMPTS = 7;
let gameActive = false;

// Variables del Cronómetro
let timerInterval = null;
let startTime = 0;
let elapsedTime = 0;
let isRunning = false;

// --- ELEMENTOS DEL DOM ---
const digitBoxes = [
    document.getElementById('box-0'),
    document.getElementById('box-1'),
    document.getElementById('box-2'),
    document.getElementById('box-3')
];
const timerDisplay = document.getElementById('timer');
const attemptsDisplay = document.getElementById('attempts-count');
const messageDisplay = document.getElementById('message');
const numButtons = document.querySelectorAll('.num-btn');
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const btnReset = document.getElementById('btn-reset');

// --- INICIALIZACIÓN ---
function initGame() {
    generateSecretCode();
    attemptsLeft = MAX_ATTEMPTS;
    revealedCount = 0;
    gameActive = true;
    
    // Restaurar interfaz
    attemptsDisplay.textContent = attemptsLeft;
    messageDisplay.textContent = "Nueva partida preparada. Pulsa Start o un número para comenzar.";
    messageDisplay.className = "message-area";
    
    digitBoxes.forEach(box => {
        box.textContent = '*';
        box.classList.remove('revealed');
    });

    numButtons.forEach(btn => {
        btn.disabled = false;
    });

    resetTimer();
}

// Genera 4 dígitos únicos entre 0 y 9
function generateSecretCode() {
    let digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    secretCode = [];
    for (let i = 0; i < 4; i++) {
        let randomIndex = Math.floor(Math.random() * digits.length);
        secretCode.push(digits[randomIndex].toString());
        digits.splice(randomIndex, 1); // Evita duplicados
    }
    console.log("Clave secreta (solo para depuración):", secretCode);
}

// --- LÓGICA DEL JUEGO ---
function handleNumberClick(e) {
    if (!gameActive) return;

    const clickedNumber = e.target.getAttribute('data-num');
    e.target.disabled = true; // Desactivar botón pulsado

    // Iniciar cronómetro si no está corriendo
    if (!isRunning) {
        startTimer();
    }

    attemptsLeft--;
    attemptsDisplay.textContent = attemptsLeft;

    let isMatch = false;

    // Comprobar si el número está en la clave
    secretCode.forEach((digit, index) => {
        if (digit === clickedNumber) {
            digitBoxes[index].textContent = digit;
            digitBoxes[index].classList.add('revealed');
            revealedCount++;
            isMatch = true;
        }
    });

    // Mensaje temporal de acierto/fallo
    if (isMatch) {
        messageDisplay.textContent = `Has acertado el número ${clickedNumber}. Sigue así.`;
        messageDisplay.className = "message-area success";
    } else {
        messageDisplay.textContent = `El ${clickedNumber} no está en la clave.`;
        messageDisplay.className = "message-area";
    }

    checkGameEnd();
}

function checkGameEnd() {
    if (revealedCount === 4) {
        // VICTORIA
        stopTimer();
        gameActive = false;
        disableAllButtons();
        let attemptsUsed = MAX_ATTEMPTS - attemptsLeft;
        messageDisplay.innerHTML = `¡Clave descubierta! Tiempo: ${formatTime(elapsedTime)}<br>Intentos consumidos: ${attemptsUsed} · Intentos restantes: ${attemptsLeft}`;
        messageDisplay.className = "message-area success";
    } else if (attemptsLeft === 0) {
        // DERROTA
        stopTimer();
        gameActive = false;
        disableAllButtons();
        // Mostrar la clave correcta
        secretCode.forEach((digit, index) => {
            digitBoxes[index].textContent = digit;
        });
        messageDisplay.innerHTML = `BOOM. Has agotado los intentos. La clave correcta era ${secretCode.join('')}.<br>Pulsa Reset para jugar otra vez.`;
        messageDisplay.className = "message-area error";
    }
}

function disableAllButtons() {
    numButtons.forEach(btn => btn.disabled = true);
}

// --- FUNCIONES DEL CRONÓMETRO ---
function startTimer() {
    if (!isRunning && gameActive) {
        startTime = Date.now() - elapsedTime;
        timerInterval = setInterval(updateTimer, 10); // Actualizar cada 10ms para centésimas
        isRunning = true;
        messageDisplay.textContent = "Cronómetro en marcha...";
        messageDisplay.className = "message-area";
    }
}

function stopTimer() {
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
        if (gameActive) {
            messageDisplay.textContent = "Cronómetro detenido.";
            messageDisplay.className = "message-area";
        }
    }
}

function resetTimer() {
    stopTimer();
    elapsedTime = 0;
    timerDisplay.textContent = "0:00:00";
}

function updateTimer() {
    elapsedTime = Date.now() - startTime;
    timerDisplay.textContent = formatTime(elapsedTime);
}

// Formato: M:SS:CC (Minutos : Segundos : Centésimas)
function formatTime(ms) {
    let date = new Date(ms);
    let minutes = date.getUTCMinutes();
    let seconds = date.getUTCSeconds().toString().padStart(2, '0');
    let centiseconds = Math.floor(date.getUTCMilliseconds() / 10).toString().padStart(2, '0');
    return `${minutes}:${seconds}:${centiseconds}`;
}

// --- LISTENERS DE EVENTOS ---
numButtons.forEach(btn => {
    btn.addEventListener('click', handleNumberClick);
});

btnStart.addEventListener('click', startTimer);
btnStop.addEventListener('click', stopTimer);
btnReset.addEventListener('click', initGame);

// Iniciar el juego al cargar la página
window.onload = initGame;