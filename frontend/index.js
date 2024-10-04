import { backend } from 'declarations/backend';

let dosBox;

function showLoadingIndicator(show) {
    const indicator = document.getElementById("loadingIndicator");
    indicator.style.display = show ? "block" : "none";
}

function checkJsDosLoaded() {
    const startButton = document.getElementById("startGame");
    if (typeof DosBox !== 'undefined') {
        startButton.disabled = false;
        showLoadingIndicator(false);
    } else {
        setTimeout(checkJsDosLoaded, 100);
    }
}

async function startDoom() {
    const jsdos = document.getElementById("jsdos");
    try {
        dosBox = await DosBox.create(jsdos);
        await dosBox.run("https://js-dos.com/6.22/current/games/DOOM.zip");
    } catch (error) {
        console.error('Failed to start DOOM:', error);
        alert('Failed to start DOOM. Please try refreshing the page.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
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
    checkJsDosLoaded();

    // Set a timeout to handle cases where the library fails to load
    setTimeout(() => {
        if (typeof DosBox === 'undefined') {
            showLoadingIndicator(false);
            alert('Failed to load js-dos library. Please check your internet connection and try refreshing the page.');
        }
    }, 10000); // 10 seconds timeout
});

// You can add more functionality here, such as interacting with the backend
// to save high scores or game settings in the future.
