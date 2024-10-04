import { backend } from 'declarations/backend';

let dosBox;

function showLoadingIndicator(show, progress = 0) {
    const indicator = document.getElementById("loadingIndicator");
    const progressSpan = document.getElementById("loadingProgress");
    indicator.style.display = show ? "block" : "none";
    progressSpan.textContent = `${progress}%`;
}

function showErrorMessage(message) {
    const errorElement = document.getElementById("errorMessage");
    errorElement.textContent = message;
    errorElement.style.display = "block";
}

function isDosBoxAvailable() {
    return typeof window.DosBox !== 'undefined' && window.DosBox && typeof window.DosBox.create === 'function';
}

async function loadJsDos() {
    try {
        const JsDos = await import('https://js-dos.com/6.22/current/js-dos.js');
        window.DosBox = JsDos.DosBox;
        return true;
    } catch (error) {
        console.error('Failed to load js-dos:', error);
        return false;
    }
}

async function waitForDosBox(timeout = 30000) {
    const startTime = Date.now();
    let loadAttempts = 0;
    while (!isDosBoxAvailable()) {
        if (Date.now() - startTime > timeout) {
            throw new Error('Timeout waiting for DosBox to become available');
        }
        loadAttempts++;
        showLoadingIndicator(true, Math.min(loadAttempts * 10, 90));
        await loadJsDos();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    showLoadingIndicator(true, 100);
}

async function startDoom() {
    try {
        await waitForDosBox();
        const jsdos = document.getElementById("jsdos");
        dosBox = await window.DosBox.create(jsdos);
        await dosBox.run("https://js-dos.com/6.22/current/games/DOOM.zip");
    } catch (error) {
        console.error('Failed to start DOOM:', error);
        showErrorMessage('Failed to start DOOM. Please try refreshing the page.');
    } finally {
        showLoadingIndicator(false);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const startButton = document.getElementById("startGame");
    const fullscreenButton = document.getElementById("fullscreen");

    startButton.addEventListener("click", startDoom);
    fullscreenButton.addEventListener("click", () => {
        if (dosBox) {
            dosBox.fullscreen();
        }
    });

    startButton.disabled = true;
    showLoadingIndicator(true, 0);

    try {
        await waitForDosBox();
        startButton.disabled = false;
    } catch (error) {
        console.error('Failed to load js-dos:', error);
        showErrorMessage('Failed to load js-dos library. Please check your internet connection and try refreshing the page.');
    } finally {
        showLoadingIndicator(false);
    }
});

// You can add more functionality here, such as interacting with the backend
// to save high scores or game settings in the future.
