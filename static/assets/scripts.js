// script.js
// Wait for the content to load, then run the check automatically
document.addEventListener("DOMContentLoaded", function() {
    
    let userGuessElement = document.getElementById("user-guess");
    let secretWordElement = document.getElementById("secret-word");

    // Read the values from the HTML data attributes we added
    let savedWord = userGuessElement.getAttribute("data-guess");
    let secretWord = secretWordElement.getAttribute("data-secret");

    // Check if a guess exists
    if (savedWord && savedWord !== "") {
        if (savedWord === secretWord) {
            userGuessElement.style.color = "green";
            secretWordElement.style.color = "green";
        } else {
            userGuessElement.style.color = "red";
        }
    }
});