"use strict";

const CONFIG_NIVELES = [
    { distribucion: [1,1,1,1,0,0,0,0], velocidad: 900 },
    { distribucion: [1,0,1,0,1,0,1,0], velocidad: 700 },
    { distribucion: [0,0,1,1,0,0,1,1], velocidad: 500 },
    { distribucion: [1,1,1,0,0,0,1,1], velocidad: 350 },
    { distribucion: [0,1,0,1,1,0,1,0], velocidad: 200 }
];

const PAREJAS = {
    "casa-cama": {
        nombres: ["CASA", "CAMA"],
        imgs: [
            "casa_buena.png", // Casa
            "cama_buena.png" // Cama
        ]
    }
};

let nivelActual = 1;
let pasoActual = 0;
let idIntervalo = null;
let idTimer = null;
let tiempoInicio = 0;
let musicaActiva = false;

// Elementos
const btnInicio = document.getElementById('btn-inicio');
const btnDetener = document.getElementById('btn-detener');
const musicaFondo = document.getElementById('musica-fondo');
const btnMusic = document.getElementById('btn-music');
const areaPalabra = document.getElementById('area-palabra');
const activePreview = document.getElementById('active-preview');

function actualizarTablero() {
    const pareja = PAREJAS[document.getElementById('selector-pareja').value];
    const config = CONFIG_NIVELES[nivelActual - 1];
    
    document.querySelectorAll('.cell').forEach((celda, i) => {
        const tipo = config.distribucion[i];
        celda.style.backgroundImage = `url(${pareja.imgs[tipo]})`;
        celda.querySelector('span').innerText = pareja.nombres[tipo];
    });
}

function comenzar() {
    nivelActual = parseInt(document.getElementById('selector-nivel-ini').value);
    bloquearUI(true);
    tiempoInicio = Date.now();
    iniciarContador();
    correrRonda();
}

async function correrRonda() {
    if (nivelActual > 5) return finalizar();

    actualizarTablero();
    document.getElementById('txt-nivel').innerText = `${nivelActual}/5`;
    document.getElementById('level-title').innerText = `${nivelActual}/5`;
    areaPalabra.innerText = "Preparando...";
    
    await new Promise(r => setTimeout(r, 1000));
    
    const config = CONFIG_NIVELES[nivelActual - 1];
    const pareja = PAREJAS[document.getElementById('selector-pareja').value];
    pasoActual = 0;

    idIntervalo = setInterval(() => {
        document.querySelectorAll('.cell').forEach(c => c.classList.remove('activa'));
        
        if (pasoActual < 8) {
            const celdaActiva = document.getElementById(`c${pasoActual}`);
            celdaActiva.classList.add('activa');
            
            const tipo = config.distribucion[pasoActual];
            areaPalabra.innerText = pareja.nombres[tipo];
            activePreview.style.backgroundImage = `url(${pareja.imgs[tipo]})`;
            
            pasoActual++;
        } else {
            clearInterval(idIntervalo);
            nivelActual++;
            correrRonda();
        }
    }, config.velocidad);
}

function iniciarContador() {
    idTimer = setInterval(() => {
        const seg = (Date.now() - tiempoInicio) / 1000;
        document.getElementById('txt-tiempo').innerText = seg.toFixed(1) + "s";
    }, 100);
}

function detener() {
    clearInterval(idIntervalo);
    clearInterval(idTimer);
    musicaFondo.pause();
    bloquearUI(false);
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('activa'));
}

function finalizar() {
    detener();
    areaPalabra.innerText = "¡Completado!";
}

function bloquearUI(bol) {
    btnInicio.disabled = bol;
    btnDetener.disabled = !bol;
    document.getElementById('selector-nivel-ini').disabled = bol;
    document.getElementById('selector-pareja').disabled = bol;
    document.getElementById('txt-estado').innerText = bol ? "Jugando" : "En espera";
}

btnInicio.addEventListener('click', comenzar);
btnDetener.addEventListener('click', detener);
btnMusic.addEventListener('click', () => {
    musicaActiva = !musicaActiva;
    document.getElementById('music-status').innerText = musicaActiva ? "ON" : "OFF";
    if (musicaActiva) musicaFondo.play(); else musicaFondo.pause();
});

// Inicializar visual
actualizarTablero();