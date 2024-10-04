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

function checkJsDosError() {
    return window.jsDosError === true;
}

async function loadJsDos() {
    if (isDosBoxAvailable()) {
        return true;
    }

    if (checkJsDosError()) {
        throw new Error('js-dos script failed to load');
    }

    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (isDosBoxAvailable()) {
                clearInterval(checkInterval);
                resolve(true);
            } else if (checkJsDosError()) {
                clearInterval(checkInterval);
                resolve(false);
            }
        }, 100);
    });
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
        const loaded = await loadJsDos();
        if (!loaded) {
            throw new Error('Failed to load js-dos');
        }
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
        showErrorMessage('Failed to start DOOM. Please try refreshing the page or click "Retry Loading js-dos".');
        document.getElementById("retryLoad").style.display = "inline-block";
    } finally {
        showLoadingIndicator(false);
    }
}

async function retryLoadJsDos() {
    showErrorMessage('');
    document.getElementById("retryLoad").style.display = "none";
    const script = document.createElement('script');
    script.src = "https://js-dos.com/6.22/current/js-dos.js";
    script.onerror = () => {
        window.jsDosError = true;
        showErrorMessage('Failed to load js-dos. Please check your internet connection and try again.');
        document.getElementById("retryLoad").style.display = "inline-block";
    };
    document.head.appendChild(script);
    await waitForDosBox();
    document.getElementById("startGame").disabled = false;
}

document.addEventListener('DOMContentLoaded', async () => {
    const startButton = document.getElementById("startGame");
    const fullscreenButton = document.getElementById("fullscreen");
    const retryButton = document.getElementById("retryLoad");

    startButton.addEventListener("click", startDoom);
    fullscreenButton.addEventListener("click", () => {
        if (dosBox) {
            dosBox.fullscreen();
        }
    });
    retryButton.addEventListener("click", retryLoadJsDos);

    startButton.disabled = true;
    showLoadingIndicator(true, 0);

    try {
        await waitForDosBox();
        startButton.disabled = false;
    } catch (error) {
        console.error('Failed to load js-dos:', error);
        showErrorMessage('Failed to load js-dos library. Please check your internet connection and click "Retry Loading js-dos".');
        retryButton.style.display = "inline-block";
    } finally {
        showLoadingIndicator(false);
    }
});

// You can add more functionality here, such as interacting with the backend
// to save high scores or game settings in the future.
