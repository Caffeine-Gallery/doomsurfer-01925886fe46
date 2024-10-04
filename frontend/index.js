import { backend } from 'declarations/backend';

let dosBox;

function showLoadingIndicator(show) {
    const indicator = document.getElementById("loadingIndicator");
    indicator.style.display = show ? "block" : "none";
}

function showErrorMessage(message) {
    const errorElement = document.getElementById("errorMessage");
    errorElement.textContent = message;
    errorElement.style.display = "block";
}

function isDosBoxAvailable() {
    return typeof DosBox !== 'undefined' && DosBox && typeof DosBox.create === 'function';
}

async function waitForDosBox(timeout = 10000) {
    const startTime = Date.now();
    while (!isDosBoxAvailable()) {
        if (Date.now() - startTime > timeout) {
            throw new Error('Timeout waiting for DosBox to become available');
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

function loadJsDos(retries = 3) {
    return new Promise((resolve, reject) => {
        if (isDosBoxAvailable()) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://js-dos.com/6.22/current/js-dos.js';
        script.onload = resolve;
        script.onerror = () => {
            if (retries > 0) {
                console.log(`Retrying to load js-dos. Attempts left: ${retries - 1}`);
                setTimeout(() => loadJsDos(retries - 1).then(resolve).catch(reject), 1000);
            } else {
                reject(new Error('Failed to load js-dos after multiple attempts'));
            }
        };
        document.head.appendChild(script);
    });
}

async function startDoom() {
    try {
        await waitForDosBox();
        const jsdos = document.getElementById("jsdos");
        dosBox = await DosBox.create(jsdos);
        await dosBox.run("https://js-dos.com/6.22/current/games/DOOM.zip");
    } catch (error) {
        console.error('Failed to start DOOM:', error);
        showErrorMessage('Failed to start DOOM. Please try refreshing the page.');
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
    showLoadingIndicator(true);

    try {
        await loadJsDos();
        await waitForDosBox();
        startButton.disabled = false;
        showLoadingIndicator(false);
    } catch (error) {
        console.error('Failed to load js-dos:', error);
        showLoadingIndicator(false);
        showErrorMessage('Failed to load js-dos library. Please check your internet connection and try refreshing the page.');
    }
});

// You can add more functionality here, such as interacting with the backend
// to save high scores or game settings in the future.
