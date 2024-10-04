import { backend } from 'declarations/backend';

let dosBox;

async function startDoom() {
    const jsdos = document.getElementById("jsdos");
    dosBox = await Dos(jsdos, { 
        wdosboxUrl: "https://js-dos.com/6.22/current/wdosbox.js" 
    });
    await dosBox.run("https://js-dos.com/6.22/current/games/DOOM.zip");
}

document.getElementById("startGame").addEventListener("click", startDoom);

document.getElementById("fullscreen").addEventListener("click", () => {
    if (dosBox) {
        dosBox.fullscreen();
    }
});

// You can add more functionality here, such as interacting with the backend
// to save high scores or game settings in the future.
