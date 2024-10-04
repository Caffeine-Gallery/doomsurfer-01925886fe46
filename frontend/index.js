import { backend } from 'declarations/backend';

let dosBox;

async function startDoom() {
    if (typeof DosBox === 'undefined') {
        console.error('js-dos library not loaded');
        return;
    }

    const jsdos = document.getElementById("jsdos");
    try {
        dosBox = await DosBox.create(jsdos);
        await dosBox.run("https://js-dos.com/6.22/current/games/DOOM.zip");
    } catch (error) {
        console.error('Failed to start DOOM:', error);
    }
}

document.getElementById("startGame").addEventListener("click", startDoom);

document.getElementById("fullscreen").addEventListener("click", () => {
    if (dosBox) {
        dosBox.fullscreen();
    }
});

// You can add more functionality here, such as interacting with the backend
// to save high scores or game settings in the future.
