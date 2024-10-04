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
    return typeof window.DosBox !== 'undefined' && typeof window.DosBox === 'function';
}

async function loadJsDos(timeout = 30000) {
    return new Promise((resolve, reject) => {
        if (window.jsDosLoadError) {
            reject(new Error('js-dos failed to load'));
            return;
        }

        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (isDosBoxAvailable()) {
                clearInterval(checkInterval);
                resolve(true);
            } else if (window.jsDosLoadError) {
                clearInterval(checkInterval);
                reject(new Error('js-dos failed to load'));
            } else if (Date.now() - startTime > timeout) {
                clearInterval(checkInterval);
                reject(new Error('Timeout waiting for js-dos to load'));
            }
        }, 100);
    });
}

async function startDoom() {
    try {
        if (!isWebAssemblySupported()) {
            throw new Error('WebAssembly is not supported in this browser');
        }
        
        showLoadingIndicator(true, 0);
        
        const jsdos = document.getElementById("jsdos");
        dosBox = await DosBox(jsdos, {
            wdosboxUrl: "https://js-dos.com/6.22/current/wdosbox.js",
            wasmUrl: "https://js-dos.com/6.22/current/wdosbox.wasm"
        });
        
        if (typeof dosBox.mount !== 'function' || typeof dosBox.run !== 'function') {
            throw new Error('DosBox object does not have expected methods');
        }
        
        showLoadingIndicator(true, 50);
        
        await dosBox.mount("https://js-dos.com/6.22/current/games/DOOM.zip");
        
        showLoadingIndicator(true, 75);
        
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
    showLoadingIndicator(true, 0);
    
    const script = document.createElement('script');
    script.src = "https://js-dos.com/6.22/current/js-dos.js";
    script.onerror = () => {
        window.jsDosLoadError = true;
        showErrorMessage('Failed to load js-dos. Please check your internet connection and try again.');
        document.getElementById("retryLoad").style.display = "inline-block";
    };
    document.head.appendChild(script);
    
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
    showLoadingIndicator(true, 0);

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
    } finally {
        showLoadingIndicator(false);
    }
});

// You can add more functionality here, such as interacting with the backend
// to save high scores or game settings in the future.
