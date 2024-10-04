import { backend } from 'declarations/backend';

let dosBox;
const JS_DOS_VERSION = '6.22';
const PRIMARY_CDN = `https://js-dos.com/${JS_DOS_VERSION}/current/js-dos.js`;
const FALLBACK_CDN = `https://cdn.jsdelivr.net/npm/js-dos@${JS_DOS_VERSION}/dist/js-dos.js`;

function showLoadingIndicator(show, progress = 0, message = '') {
    const indicator = document.getElementById("loadingIndicator");
    const progressSpan = document.getElementById("loadingProgress");
    indicator.style.display = show ? "block" : "none";
    progressSpan.textContent = `${progress}%`;
    indicator.textContent = `${message} ${progressSpan.outerHTML}`;
}

function showErrorMessage(message) {
    const errorElement = document.getElementById("errorMessage");
    errorElement.textContent = message;
    errorElement.style.display = "block";
}

function isWebAssemblySupported() {
    try {
        if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
            const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
            if (module instanceof WebAssembly.Module)
                return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
        }
    } catch (e) {}
    return false;
}

function isDosBoxAvailable() {
    return typeof window.Dos !== 'undefined' && typeof window.Dos === 'function';
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function loadJsDos(timeout = 30000) {
    showLoadingIndicator(true, 0, 'Loading js-dos...');
    const startTime = Date.now();

    try {
        await loadScript(PRIMARY_CDN);
    } catch (error) {
        console.warn('Failed to load js-dos from primary CDN, trying fallback...', error);
        try {
            await loadScript(FALLBACK_CDN);
        } catch (fallbackError) {
            throw new Error('Failed to load js-dos from both primary and fallback CDNs');
        }
    }

    return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
            if (isDosBoxAvailable()) {
                clearInterval(checkInterval);
                resolve(true);
            } else if (Date.now() - startTime > timeout) {
                clearInterval(checkInterval);
                reject(new Error('Timeout waiting for js-dos to load'));
            }
            const progress = Math.min(Math.floor((Date.now() - startTime) / (timeout / 100)), 99);
            showLoadingIndicator(true, progress, 'Loading js-dos...');
        }, 100);
    });
}

async function startDoom() {
    try {
        if (!isWebAssemblySupported()) {
            throw new Error('WebAssembly is not supported in this browser');
        }
        
        showLoadingIndicator(true, 0, 'Initializing DosBox...');
        
        const jsdos = document.getElementById("jsdos");
        dosBox = await Dos(jsdos);
        
        if (typeof dosBox.mount !== 'function' || typeof dosBox.run !== 'function') {
            throw new Error('DosBox object does not have expected methods');
        }
        
        showLoadingIndicator(true, 50, 'Mounting DOOM...');
        
        await dosBox.mount("https://js-dos.com/6.22/current/games/DOOM.zip");
        
        showLoadingIndicator(true, 75, 'Starting DOOM...');
        
        await dosBox.run("DOOM.EXE");
        
        showLoadingIndicator(false);
    } catch (error) {
        console.error('Failed to start DOOM:', error);
        showErrorMessage(`Failed to start DOOM: ${error.message}. Please try refreshing the page or click "Retry Loading".`);
        document.getElementById("retryLoad").style.display = "inline-block";
    } finally {
        showLoadingIndicator(false);
    }
}

async function retryLoad() {
    showErrorMessage('');
    document.getElementById("retryLoad").style.display = "none";
    
    try {
        await loadJsDos();
        document.getElementById("startGame").disabled = false;
    } catch (error) {
        console.error('Failed to load js-dos:', error);
        showErrorMessage(`Failed to load required resources: ${error.message}. Please check your internet connection and try again.`);
        document.getElementById("retryLoad").style.display = "inline-block";
    } finally {
        showLoadingIndicator(false);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const startButton = document.getElementById("startGame");
    const fullscreenButton = document.getElementById("fullscreen");
    const retryButton = document.getElementById("retryLoad");

    startButton.addEventListener("click", startDoom);
    fullscreenButton.addEventListener("click", () => {
        if (dosBox && typeof dosBox.fullscreen === 'function') {
            dosBox.fullscreen();
        }
    });
    retryButton.addEventListener("click", retryLoad);

    startButton.disabled = true;

    try {
        if (!isWebAssemblySupported()) {
            throw new Error('WebAssembly is not supported in this browser');
        }
        await loadJsDos();
        startButton.disabled = false;
    } catch (error) {
        console.error('Failed to initialize:', error);
        showErrorMessage(`Initialization failed: ${error.message}. Please check your browser compatibility or try a different browser.`);
        retryButton.style.display = "inline-block";
    }
});

// You can add more functionality here, such as interacting with the backend
// to save high scores or game settings in the future.
