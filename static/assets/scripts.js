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
    document.getElementById("leaderboard").style.display = "block";
    document.getElementById("leaderboardSave").style.display = "block";
}
function restartGame() {
    location.reload();
}

restartBtn.addEventListener("click", restartGame);

const saveBtn = document.getElementById("saveBtn");
const nameInput = document.getElementById("playerName");
const entry = document.createElement("li");

saveBtn.addEventListener("click", function () {
    const playerName = nameInput.value.trim();
    if (playerName !== "") {
        entry.textContent = playerName;
        document.getElementById("leaderboardList").appendChild(entry);
        nameInput.value = ""; 
    }
}); 


const rows = document.querySelectorAll(".boardRow");

let currentRow = 0;
let currentCol = 0;
const WORD_LENGTH = 5;
let gameOverFlag = false; // Flag to stop input after win
//Typing letters into tiles
function handleInput(key) { 
    if (gameOverFlag) return; // stop input typing after win
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
    // Remove hint styling if present
    if (tile.classList.contains("hint-placeholder")) {
        tile.classList.remove("hint-placeholder");
        tile.dataset.hintLetter = tile.dataset.hintLetter || tile.textContent; // preserve hint just in case
    }
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
    // Restore hint if it exists
    if (tile.dataset.hintLetter) {
        tile.textContent = tile.dataset.hintLetter;
        tile.classList.add("hint-placeholder");
    }
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
                    gameOverFlag = true;
                    clearAllHintPlaceholders(); // Remove all remaining hint placeholders
                    // Add a slight delay to ensure DOM updates finish before confetti
                    setTimeout(() => {
                        launchConfetti();
                    }, 10);

                    document.querySelector(".win-counter").innerText = 
                        "Wins: " + data.wins;
                    gameOver();
                }
                else if (currentRow >= rows.length) {
                    gameOver()
                }
            }
        });
}
function applyResult(result) {
    const stateMap = ["absent", "present", "correct"]; // map numbers to CSS states
    // index 0 → absent
    // index 1 → present
    // index 2 → correct
    result.forEach((state, i) => {
        const tile = rows[currentRow].children[i];
        // Remove hint once flipped
        tile.classList.remove("hint-placeholder");
        delete tile.dataset.hintLetter;
        const letter = tile.textContent.toUpperCase();

        // Animate tile
        tile.dataset.animation = "flip-in";
        setTimeout(() => {
            tile.dataset.state =  stateMap[state]; // use mapped string
            tile.dataset.animation = "flip-out";
        },250);

        // Update keyboard key
        const key = document.querySelector(`.key[data-key="${letter}"]`);
        if (key) {
            // Only upgrade state if it's "worse" than current
            // correct > present > absent
            const priority = { "absent": 0, "present": 1, "correct": 2 };
            const current = key.dataset.state;
            if (!current || priority[stateMap[state]] > priority[current]) {
                key.dataset.state =stateMap[state];
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

    // Move to next row only if game not over
    if (!gameOverFlag) {
        currentRow++;
        currentCol = 0;
    }
}

function launchConfetti() {
  const duration = 1 * 1000; // total time the confetti should run: 1 second.
  const end = Date.now() + duration;//Date.now() gives the current timestamp in milliseconds.
  const colors = ['#bb0000', '#087f3c', '#ffcc00', '#00ffcc', '#0066ff', '#ff66ff'];//Each burst will randomly pick colors from this array.

  //Inside frame, we shoot confetti and then schedule the next frame using requestAnimationFrame.
  (function frame() {
    // Fire random bursts each frame(two bursts: one angled roughly 60°, another 120° to make it go in both directions)
    confetti({
      particleCount: 5 + Math.floor(Math.random() * 5), //number of confetti pieces in this burst (random between 5–9).
      angle: 60 + Math.random() * 20,                   //direction in degrees the confetti flies (around 60°).
      spread: 55 + Math.random() * 10,                  //how wide the confetti spreads (55–65°).
      origin: { x: Math.random(), y: Math.random() * 0.5 },//origin: where the confetti starts on the screen:
                                                          //x = horizontal (0 = left, 1 = right)
                                                          //y = vertical (0 = top, 1 = bottom)
      colors: colors,
      scalar: 0.8 + Math.random() * 0.5                   //size of particles (random between 0.8–1.3).
    });
    confetti({
      particleCount: 5 + Math.floor(Math.random() * 5),
      angle: 120 - Math.random() * 20,
      spread: 55 + Math.random() * 10,
      origin: { x: Math.random(), y: Math.random() * 0.5 },
      colors: colors,
      scalar: 0.8 + Math.random() * 0.5
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

// --- Hint Feature ---
let hintUsed = false;
const hintIcon = document.getElementById("hintIcon");
hintIcon.addEventListener("click", async () => {
   if (hintUsed || gameOverFlag) return;

   /*rows = all 6 board rows.Convert NodeList → Array.
    For each row:
      Look at each tile
      Read tile.dataset.state
      If no state → use "empty" 
    Example:You create a 2D array like:
      [
        ["correct", "present", "absent", "empty", "empty"],
        ["empty", "empty", "empty", "empty", "empty"],
        ...
      ]
    */
   const rowsState = Array.from(rows).map(row =>
     Array.from(row.children).map(tile => tile.dataset.state || "empty")
   );

  try {
    const res = await fetch("/get-hint", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({rows: rowsState})
    });
    const data = await res.json();//Wait for backend response.Convert response into JavaScript object
    /*Example response:
    {
      "success": true,
      "col": 2,
      "letter": "A"
    } */
    if (!data.success) return showMessage(data.message);

    const col = data.col, letter = data.letter;
    for (let r=0;r<rows.length;r++){
      const tile = rows[r].children[col];//For each row:Pick tile at hint column.Ex:If col = 2 → 3rd column of every row.
      if (!tile.textContent) {  //Only apply hint if tile is empty.This prevents overriding user-typed letters.
        tile.textContent=letter; 
        tile.classList.add("hint-placeholder");
        tile.dataset.hintLetter = letter; // Store hint letter in dataset.So if user deletes typed letter → we can restore hint.
      }
    }

    hintUsed = true;
    hintIcon.classList.add("used");
    showMessage("Hint Used!");
  } catch(err){console.error("Hint error:",err);}
});

// Helper to show temporary message 
function showMessage(msg) { 
  const messageEl = document.getElementById("message"); 
  messageEl.textContent = msg;
  setTimeout(() => { messageEl.textContent = ""; }, 2000); 
}
function clearAllHintPlaceholders() {
  rows.forEach(row => {
    Array.from(row.children).forEach(tile => {
      if (tile.classList.contains("hint-placeholder")) {
        tile.classList.remove("hint-placeholder");
        tile.textContent = ""; // clear only placeholder tiles
        delete tile.dataset.hintLetter;
      }
    });
  });
}
