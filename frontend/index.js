import { backend } from 'declarations/backend';

let dosBox;
const JS_DOS_VERSION = '6.22';
const CDN_URLS = [
    {
        js: `https://js-dos.com/${JS_DOS_VERSION}/current/js-dos.js`,
        wdosbox: `https://js-dos.com/${JS_DOS_VERSION}/current/wdosbox.js`,
        wdosboxWasm: `https://js-dos.com/${JS_DOS_VERSION}/current/wdosbox.wasm.js`
    },
    {
        js: `https://cdn.jsdelivr.net/npm/js-dos@${JS_DOS_VERSION}/dist/js-dos.js`,
        wdosbox: `https://cdn.jsdelivr.net/npm/js-dos@${JS_DOS_VERSION}/dist/wdosbox.js`,
        wdosboxWasm: `https://cdn.jsdelivr.net/npm/js-dos@${JS_DOS_VERSION}/dist/wdosbox.wasm.js`
    }
];

function showLoadingIndicator(show, progress = 0, message = '') {
    const indicator = document.getElementById("loadingIndicator");
    const progressSpan = document.getElementById("loadingProgress");
    const messageSpan = document.getElementById("loadingMessage");
    
    if (indicator && progressSpan && messageSpan) {
        indicator.style.display = show ? "block" : "none";
        progressSpan.textContent = `${progress}%`;
        messageSpan.textContent = message;
    }
}

function showErrorMessage(message) {
    const errorElement = document.getElementById("errorMessage");
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = "block";
    }
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

function isDosAvailable() {
    return typeof window.Dos === 'function';
}

async function loadScript(src, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;

        const timeoutId = setTimeout(() => {
            reject(new Error(`Script load timed out for ${src}`));
        }, timeout);

        script.onload = () => {
            clearTimeout(timeoutId);
            resolve();
        };

        script.onerror = () => {
            clearTimeout(timeoutId);
            reject(new Error(`Failed to load script ${src}`));
        };

        document.head.appendChild(script);
    });
}

function validateJsDos() {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Validating js-dos...');
            console.log('window.Dos:', typeof window.Dos);
            
            if (typeof window.Dos !== 'function') {
                console.error('window.Dos is not a function');
                resolve(false);
                return;
            }
            
            console.log('js-dos validation successful');
            resolve(true);
        }, 1000);
    });
}

async function loadJsDosWithRetry(retries = 3, backoff = 1000) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        for (const url of CDN_URLS) {
            try {
                showLoadingIndicator(true, 0, `Attempting to load js-dos from ${url.js}...`);
                await loadScript(url.js);
                
                showLoadingIndicator(true, 33, `Loading wdosbox...`);
                await loadScript(url.wdosbox);

                showLoadingIndicator(true, 66, `Loading wdosbox.wasm...`);
                await loadScript(url.wdosboxWasm);

                const isValid = await validateJsDos();
                if (isValid) {
                    showLoadingIndicator(true, 100, 'js-dos loaded successfully');
                    return window.Dos;
                } else {
                    throw new Error('Loaded scripts are not valid js-dos files');
                }
            } catch (error) {
                console.warn(`Failed to load js-dos from ${url.js}:`, error);
                lastError = error;
            }
        }
        const delay = backoff * Math.pow(2, i);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    throw new Error(`Failed to load js-dos after multiple attempts. Last error: ${lastError?.message || 'Unknown error'}`);
}

async function loadJsDosFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const script = document.createElement('script');
                script.textContent = event.target.result;
                document.head.appendChild(script);
                const isValid = await validateJsDos();
                if (isValid) {
                    resolve(window.Dos);
                } else {
                    reject(new Error('Loaded file is not a valid js-dos script'));
                }
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

async function getDos() {
    if (!isDosAvailable()) {
        throw new Error('Dos is not available. Please ensure js-dos is loaded correctly.');
    }
    return window.Dos;
}

async function startDoom() {
    try {
        if (!isWebAssemblySupported()) {
            throw new Error('WebAssembly is not supported in this browser');
        }
        
        showLoadingIndicator(true, 0, 'Initializing Dos...');
        
        const jsdos = document.getElementById("jsdos");
        if (!jsdos) {
            throw new Error('jsdos element not found');
        }
        
        const Dos = await getDos();
        dosBox = await Dos(jsdos, { 
            wdosboxUrl: CDN_URLS[0].wdosbox,
            wasmUrl: CDN_URLS[0].wdosboxWasm
        });
        
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
        const retryButton = document.getElementById("retryLoad");
        if (retryButton) {
            retryButton.style.display = "inline-block";
        }
    } finally {
        showLoadingIndicator(false);
    }
}

async function retryLoad() {
    showErrorMessage('');
    const retryButton = document.getElementById("retryLoad");
    if (retryButton) {
        retryButton.style.display = "none";
    }
    
    try {
        await loadJsDosWithRetry();
        const startButton = document.getElementById("startGame");
        if (startButton) {
            startButton.disabled = false;
        }
    } catch (error) {
        console.error('Failed to load js-dos:', error);
        showErrorMessage(`Failed to load required resources: ${error.message}. Please try uploading js-dos files manually.`);
        const fileInput = document.getElementById("manualJsDosUpload");
        if (fileInput) {
            fileInput.style.display = "inline-block";
        }
    } finally {
        showLoadingIndicator(false);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const startButton = document.getElementById("startGame");
    const fullscreenButton = document.getElementById("fullscreen");
    const retryButton = document.getElementById("retryLoad");
    const fileInput = document.getElementById("manualJsDosUpload");

    if (startButton) {
        startButton.addEventListener("click", startDoom);
        startButton.disabled = true;
    }

    if (fullscreenButton) {
        fullscreenButton.addEventListener("click", async () => {
            try {
                if (dosBox && typeof dosBox.fullscreen === 'function') {
                    dosBox.fullscreen();
                }
            } catch (error) {
                console.error('Failed to enter fullscreen:', error);
            }
        });
    }

    if (retryButton) {
        retryButton.addEventListener("click", retryLoad);
    }

    if (fileInput) {
        fileInput.addEventListener("change", async (event) => {
            const file = event.target.files[0];
            if (file) {
                try {
                    await loadJsDosFromFile(file);
                    showErrorMessage('');
                    fileInput.style.display = "none";
                    if (startButton) {
                        startButton.disabled = false;
                    }
                } catch (error) {
                    console.error('Failed to load js-dos from file:', error);
                    showErrorMessage(`Failed to load js-dos from file: ${error.message}`);
                }
            }
        });
    }

    try {
        if (!isWebAssemblySupported()) {
            throw new Error('WebAssembly is not supported in this browser');
        }
        await loadJsDosWithRetry();
        if (startButton) {
            startButton.disabled = false;
        }
    } catch (error) {
        console.error('Failed to initialize:', error);
        showErrorMessage(`Initialization failed: ${error.message}. Please try uploading js-dos files manually.`);
        if (fileInput) {
            fileInput.style.display = "inline-block";
        }
    }
});
