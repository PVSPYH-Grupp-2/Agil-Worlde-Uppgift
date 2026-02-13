// script.js
// Wait for the content to load, then run the check automatically
// document.addEventListener("DOMContentLoaded", function() {

//     let userGuessElement = document.getElementById("user-guess");
//     let secretWordElement = document.getElementById("secret-word");

//     // Read the values from the HTML data attributes we added
//     let savedWord = userGuessElement.getAttribute("data-guess");
//     let secretWord = secretWordElement.getAttribute("data-secret");

//     // Check if a guess exists
//     if (savedWord && savedWord !== "") {
//         if (savedWord === secretWord) {
//             userGuessElement.style.color = "green";
//             secretWordElement.style.color = "green";
//         } else {
//             userGuessElement.style.color = "red";
//         }
//     }
// });

// Restart button and functionality
const restartBtn = document.getElementById("restartBtn");

function gameOver() {
    document.getElementById("restartBtn").style.display = "block";
}
function restartGame() {
    location.reload();
}

restartBtn.addEventListener("click", restartGame);

const rows = document.querySelectorAll(".boardRow");

let currentRow = 0;
let currentCol = 0;
const WORD_LENGTH = 5;
//Typing letters into tiles
function handleInput(key) {
    if (/^[a-zA-Z]$/.test(key)) {
        addLetter(key);
    } else if (key === "Backspace") {
        removeLetter();
    } else if (key === "Enter") {
        submitGuess();
    }
}
function addLetter(letter) {
    if (currentCol >= WORD_LENGTH) return;

    const tile = rows[currentRow].children[currentCol];
    tile.textContent = letter;
    tile.dataset.state = "tbd";
    tile.dataset.animation = "pop";

    currentCol++;
}
function removeLetter() {
    if (currentCol === 0) return;

    currentCol--;
    const tile = rows[currentRow].children[currentCol];
    tile.textContent = "";
    tile.dataset.state = "empty";
}
function submitGuess() {
    if (currentCol < WORD_LENGTH) {
        shakeRow();
        const msg = document.getElementById("message");
        msg.textContent = "Not enough letters";
        setTimeout(() => msg.textContent = "", 2000);
        return;
    }

    let guess = "";
    for (let tile of rows[currentRow].children) {
        guess += tile.textContent.toLowerCase();
    }

    sendGuessToServer(guess);
}
document.addEventListener("keydown", (e) => {
    handleInput(e.key);
});
document.querySelectorAll(".key").forEach(key => {
    key.addEventListener("click", () => {
        const value =
            key.dataset.key === "enter" ? "Enter" :
                key.dataset.key === "backspace" ? "Backspace" :
                    key.textContent;

        handleInput(value);
    });
});
function shakeRow() {
    const row = rows[currentRow];
    row.classList.add("invalid");

    setTimeout(() => row.classList.remove("invalid"), 600);
}
function sendGuessToServer(word) {
    fetch("/check-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word })
    })
        .then(res => res.json())
        .then(data => {
            if (!data.valid) {
                // If word is invalid, shake the row
                shakeRow();
                const msg = document.getElementById("message");
                msg.textContent = data.reason;
                setTimeout(() => msg.textContent = "", 2000);
                console.log(data.reason); // optional: show reason in console or alertg
            } else {
                // Valid word → flip tiles with evaluation
                document.getElementById("message").textContent = "";
                applyResult(data.evaluation);

                // Flask sends a json-answer over HTTP, and JS converts it to an object that is saved in the variable (data)
                // Took me a long time to understand this
                if (data.win) {
                    gameOver()
                }
                else if (currentRow >= rows.length) {
                    gameOver()
                }
            }
        });
}
function applyResult(result) {
    result.forEach((state, i) => {
        const tile = rows[currentRow].children[i];
        const letter = tile.textContent.toUpperCase();

        // Animate tile
        tile.dataset.animation = "flip-in";
        setTimeout(() => {
            tile.dataset.state = state;
            tile.dataset.animation = "flip-out";
        }, 250);

        // Update keyboard key
        const key = document.querySelector(`.key[data-key="${letter}"]`);
        if (key) {
            // Only upgrade state if it's "worse" than current
            // correct > present > absent
            const priority = { "absent": 0, "present": 1, "correct": 2 };
            const current = key.dataset.state;
            if (!current || priority[state] > priority[current]) {
                key.dataset.state = state;
                key.classList.add("fade"); // optional smooth transition
            }
        }
    });
    // Just a win_check, we need it in order for the restartBtn to show up here
    // Since we chose to do almost everything in javascript, maybe this is where the win_validation should be
    // NVM, added the win_validation functionality from the backend
    // let win = true;

    // for (let i = 0; i < result.length; i++) {
    //     if (result[i] !== "correct") {
    //         win = false;
    //     }
    // }

    // if (win) {
    //     gameOver();
    //     return;
    // }

    // // if all the rows are already used, then game over
    // if (currentRow === rows.length - 1) {
    //     gameOver();
    // }
    currentRow++;
    currentCol = 0;
}


// function applyResult(result) {
//   const stateMap = ["absent", "present", "correct"]; // map numbers to CSS states

//   result.forEach((state, i) => {
//     const tile = rows[currentRow].children[i];
//     const letter = tile.textContent.toUpperCase();

//     // Animate tile
//     tile.dataset.animation = "flip-in";
//     setTimeout(() => {
//       tile.dataset.state = stateMap[state]; // use mapped string
//       tile.dataset.animation = "flip-out";
//     }, i * 250); // stagger animation for each tile

//     // Update keyboard key
//     const key = document.querySelector(`.key[data-key="${letter}"]`);
//     if (key) {
//       const priority = { "absent": 0, "present": 1, "correct": 2 };
//       const current = key.dataset.state;
//       if (!current || priority[stateMap[state]] > priority[current]) {
//         key.dataset.state = stateMap[state];
//         key.classList.add("fade"); // smooth transition
//       }
//     }
//   });

//   currentRow++;
//   currentCol = 0;
// }


