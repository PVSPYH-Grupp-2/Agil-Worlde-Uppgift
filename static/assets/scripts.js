// scripts.js
const PRAISE_BY_ATTEMPTS = {1: "Genius",2: "Magnificent",3: "Impressive",4: "Splendid",5: "Great",6: "Phew"};
const quitBtn = document.getElementById("quitBtn");

quitBtn.addEventListener("click", () => {
    if (gameOverFlag) return; // Do nothing if the game is already over
    
    gameOverFlag = true;
    
    // Reset points since the player quit
    totalPoints = 0;
    localStorage.setItem("totalPoints", totalPoints);
    
    const pointCounter = document.querySelector(".point-counter");
    if (pointCounter) pointCounter.innerText = "Points: " + totalPoints; // Update point counter
    
    showMessage("You quit!");
    
    gameOver(false); // False indicates loss
});

// Settings / Dark Mode Toggle
const settingsIcon = document.getElementById("settingsIcon");

settingsIcon.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    
    // Save the preference to localStorage
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", isDark);
});

// Restart button and functionality
const restartBtn = document.getElementById("restartBtn");
restartBtn.addEventListener("click", restartGame);

const continueBtn = document.getElementById("continueBtn")
continueBtn.addEventListener("click", continueGame);

const CURRENT_SECRET = document.body.dataset.secret;
let totalPoints = parseInt(localStorage.getItem("totalPoints")) || 0;


let storedTime = localStorage.getItem("savedTimeLeft");
let timeLeft = storedTime !== null ? parseInt(storedTime) : 120;
let timerInterval = null; 
// Need to add win as a parameter to determine win/loss for buttons
function gameOver(win) {
    document.getElementById("restartBtn").style.display = win ? "none" : "block";
    document.getElementById("continueBtn").style.display = win ? "block" : "none";
    document.getElementById("leaderboard").style.display = "block";
    document.getElementById("leaderboardSave").style.display = "block";
     
    if (timerInterval) clearInterval(timerInterval); // stop timer when game ends
   
    fetchLeaderboard(); 
    
    saveState(); // Save final state when game is over
}
// restartGame now sets totalPoints to 0.
function restartGame() {
    totalPoints = 0;
    localStorage.setItem("totalPoints", totalPoints);
    // 2. Reset timer back to 120 on loss
    localStorage.setItem("savedTimeLeft", 120); 
    clearState(); 
    location.reload();
}
function continueGame() {
    // 3. Save the remaining time (plus any bonus) before reloading on win
    localStorage.setItem("savedTimeLeft", timeLeft); 
    clearState();
    location.reload();
}
// restartBtn.addEventListener("click", restartGame);

const saveBtn = document.getElementById("saveBtn");
const nameInput = document.getElementById("playerName");
const entry = document.createElement("li");

// Updated to use async so we can wait for the server to save
saveBtn.addEventListener("click", async function () {
    const playerName = nameInput.value.trim();
    if (playerName !== "") {
        try {
            const response = await fetch("/save-score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: playerName,
                  wins: parseInt(document.querySelector(".win-counter").innerText.replace("Wins: ", "")),
                  points: totalPoints
                })
            });
            const result = await response.json();

            if (result.success) {
                // Refresh the leaderboard from the JSON file
                fetchLeaderboard(); 
                nameInput.value = ""; 
                document.getElementById("leaderboardSave").style.display = "none";
            }
        } catch (err) {
            console.error("Save error:", err);
        }
    }
}); 

async function fetchLeaderboard() {
    try {
        const res = await fetch("/leaderboard");
        const data = await res.json();
        const list = document.getElementById("leaderboardList");
        
        list.innerHTML = ""; // Clear list
        data.leaderboard.forEach(item => {
            const li = document.createElement("li");
            li.textContent = `${item.name}: ${item.points || 0} Points (${item.wins} Wins)`;
            list.appendChild(li);
        });
    } catch (err) {
        console.error("Fetch error:", err);
    }
}


const rows = document.querySelectorAll(".boardRow");

let currentRow = 0;
let currentCol = 0;
const WORD_LENGTH = 5;
let gameOverFlag = false; // Flag to stop input after win
let maxPoints = 30;


// LocalStorage (persistent state)
const STORAGE_KEY = "wordle_state_v1";

function saveState() {
  const board = Array.from(rows).map(row =>
    Array.from(row.children).map(tile => ({
      letter: tile.textContent || "",
      state: tile.dataset.state || "empty",
      isHint: tile.classList.contains("hint-placeholder"),
      hintLetter: tile.dataset.hintLetter || ""
    }))
  );

  const keyboard = Array.from(document.querySelectorAll(".key")).map(k => ({
    key: (k.dataset.key || k.textContent || "").toUpperCase(),
    state: k.dataset.state || ""
  }));

  const state = {
    secret: CURRENT_SECRET,
    currentRow,
    currentCol,
    gameOverFlag,
    hintUsed,
    board,
    keyboard,
    message: document.getElementById("message")?.textContent || "",
    hintIconUsed: hintIcon?.classList.contains("used") || false,
    timeLeft
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

function restoreState(state) {
  // Restore board

    if (state.secret !== CURRENT_SECRET) {
  clearState();
  return;
}

  state.board?.forEach((rowData, r) => {
    if (!rows[r]) return;
    rowData.forEach((t, c) => {
      const tile = rows[r].children[c];
      if (!tile) return;

      tile.textContent = t.letter || "";
      tile.dataset.state = t.state || "empty";

      // Restore hint styling
      tile.classList.toggle("hint-placeholder", !!t.isHint);
      if (t.isHint && t.hintLetter) {
        tile.dataset.hintLetter = t.hintLetter;
      } else {
        delete tile.dataset.hintLetter;
      }
    });
  });

  // Restore keyboard
  state.keyboard?.forEach(k => {
    const el = document.querySelector(`.key[data-key="${k.key}"]`);
    if (el && k.state) {
      el.dataset.state = k.state;
      el.classList.add("fade");
    }
  });

  currentRow = state.currentRow ?? 0;
  currentCol = state.currentCol ?? 0;
  gameOverFlag = state.gameOverFlag ?? false;
  hintUsed = state.hintUsed ?? false;
  //Set the timer to whatever is saved in state.timeLeft. But, if state.timeLeft is completely missing or empty, default to 120
  timeLeft = state.timeLeft ?? 120; 

  // Restore hint icon
  if (hintIcon) {
    if (state.hintIconUsed) hintIcon.classList.add("used");
    else hintIcon.classList.remove("used");
  }

  // Restore message
  const msg = document.getElementById("message");
  if (msg) msg.textContent = state.message || "";

  // If game is over, show buttons
  if (gameOverFlag) {
    gameOver();
  }
}



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

    saveState(); // Save after each letter input
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

    saveState(); // Save after deletion
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
                    

                    const winRow = currentRow -1;
                    const attempts = winRow + 1;
                    // Praise mapping
                    const praise = PRAISE_BY_ATTEMPTS[attempts] || "Nice";
                    showResultBanner(praise);
                    const earnedPoints = maxPoints -(winRow * 5);

                    let timeBonus = 30 - (winRow * 5);
                    if (timeBonus < 5) timeBonus = 5; // Minimum 5s reward
                    
                    timeLeft += timeBonus;
                    showMessage(`+${timeBonus}s Time Reward!`); // notification message popup
                    updateTimerDisplay();

                    totalPoints += earnedPoints;
                    
                    localStorage.setItem("totalPoints", totalPoints);


                    document.querySelector(".win-counter").innerText = 
                        "Wins: " + data.wins;
                      

                    document.querySelector(".point-counter").innerText = 
                        "Points: " + totalPoints;

                      
                    gameOver(true);
                }
                else if (currentRow >= rows.length) {
                  totalPoints = 0;
                  localStorage.setItem("totalPoints", totalPoints);

                  document.querySelector(".point-counter").innerText = 
                    "Points: " + totalPoints;
                  // Lose: reveal the word
                    revealSecretWord();
                  gameOver(false)
                }
            }
        });
}
function applyResult(result) {
    const stateMap = ["absent", "present", "correct"]; 
    const delay = 200; // The time to wait before starting the next tile's flip
    //index 0 = "absent 
    //index 1 = "present"
    //index 2 = "correct"
    result.forEach((state, i) => {
        const tile = rows[currentRow].children[i];
        
        // Use setTimeout to delay each tile based on its position (index i)
        setTimeout(() => {
            // Remove hint styling if it was there
            tile.classList.remove("hint-placeholder");
            delete tile.dataset.hintLetter;
            const letter = tile.textContent.toUpperCase();

            // Start the "flip-in" part of the animation
            tile.dataset.animation = "flip-in";

            // Halfway through the flip (250ms), change color and "flip-out"
            setTimeout(() => {
                tile.dataset.state = stateMap[state]; 
                tile.dataset.animation = "flip-out";

                if (i === result.length - 1) {
                // vänta lite extra så animationen hinner färdigt
                  setTimeout(() => {
                      saveState();
                  }, 50);
              }

            }, 250);

            // Update the keyboard key color
            const key = document.querySelector(`.key[data-key="${letter}"]`);
            if (key) {
                const priority = { "absent": 0, "present": 1, "correct": 2 };
                const current = key.dataset.state;
                if (!current || priority[stateMap[state]] > priority[current]) {
                    key.dataset.state = stateMap[state];
                    key.classList.add("fade"); 
                }
            }
        }, i * delay); // Tile 0 starts at 0ms, Tile 1 at 200ms...
    });

    // Move to next row
    if (!gameOverFlag) {
        currentRow++;
        currentCol = 0;
    }
    saveState(); 
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

function updateTimerDisplay() {
    const timerDisplay = document.getElementById("timerDisplay");
    if (!timerDisplay) return;
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    // Format timer to always show MM:SS 
    const paddedMinutes = String(minutes).padStart(2, '0');  
    const paddedSeconds = String(seconds).padStart(2, '0');

    timerDisplay.textContent = `TIMER: ${paddedMinutes}:${paddedSeconds}`;
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    updateTimerDisplay(); // Initial display setup
    
    timerInterval = setInterval(() => {
        if (gameOverFlag) {
            clearInterval(timerInterval);
            return;
        }
        
        timeLeft--;
        updateTimerDisplay();
        
        // Check if time ran out
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            gameOverFlag = true;
            
            // Show notification when time is up
            showMessage("Time's up!");
            
            // Player loses, reset points
            totalPoints = 0;
            localStorage.setItem("totalPoints", totalPoints);
            const pointCounter = document.querySelector(".point-counter");
            if (pointCounter) pointCounter.innerText = "Points: " + totalPoints;
            
            gameOver();
        }
    }, 1000); // Trigger every 1 second
}
// -----------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const saved = loadState();
  if (saved) restoreState(saved);
  
  // Apply saved Dark Mode preference
  if (localStorage.getItem("darkMode") === "true") {
      document.body.classList.add("dark-mode");
  }

  // Fetch leaderboard on startup
  fetchLeaderboard();

  if (!gameOverFlag) {
      startTimer(); // start timer when page is ready.
  } else {
      updateTimerDisplay(); // If the game was already over, just show the final stopped time
  }
});
function showResultBanner(text, duration = 1800) {
  const banner = document.getElementById("resultBanner");
  if (!banner) return;

  banner.textContent = text;       // ex: "GENIUS"
  banner.classList.add("show");

  clearTimeout(banner._timer);
  banner._timer = setTimeout(() => {
    banner.classList.remove("show");
    // optional clear text after fade:
    setTimeout(() => (banner.textContent = ""), 200);
  }, duration);
}
function revealSecretWord() {
  const word = (CURRENT_SECRET || "").toUpperCase();
  if (!word) return;
  showResultBanner(`${word}`, 2600);
}