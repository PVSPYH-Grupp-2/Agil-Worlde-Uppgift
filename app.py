from flask import Flask, redirect, render_template, request, jsonify, session
from backend.wordle_logic import win_validation, load_wordlist, generate_word, letter_check
import random
import json
import os

app = Flask(__name__)
app.secret_key = "dev_secret_key"  # Needed for session management

wins = 0
points = 0
LEADERBOARD_FILE = "leaderboard.json"

WORDLIST = load_wordlist()["words"]
SECRET_WORD = generate_word(WORDLIST)
WORD_LENGTH = 5
game_hint_used = False


def get_score(player_entry):
    return player_entry["wins"]

def save_to_json(name, score):
    data = []
    #Load existing data if file exists
    if os.path.exists(LEADERBOARD_FILE):
        try:
            with open(LEADERBOARD_FILE, "r") as f:
                data = json.load(f)
        except:
            data = []
    
    # Add the new player and their score to the list
    new_entry = {"name": name, "wins": score}
    data.append(new_entry)
    
    # Sort the list (highest wins first)
    data.sort(key=get_score, reverse=True) # rewrite this one
    
    # Keep only the top 10 scores
    top_ten = data[:10] 
    
    # Save back to the file
    with open(LEADERBOARD_FILE, "w") as f:
        json.dump(top_ten, f)

@app.route("/", methods=["GET", "POST"])
def home():
    global SECRET_WORD, game_hint_used

    if "secret_word" not in session:
        session["secret_word"] = generate_word(WORDLIST)

    if "game_hint_used" not in session:
        session["game_hint_used"] = False
        
    SECRET_WORD = session["secret_word"]  # new word every refresh
    game_hint_used = session["game_hint_used"]

    print("SECRET_WORD:", SECRET_WORD)   # JUst for testing
    return render_template("index.html", secret=session["secret_word"])

@app.route("/leaderboard", methods=["GET"])
def leaderboard():
    data = []
    if os.path.exists(LEADERBOARD_FILE):
        with open(LEADERBOARD_FILE, "r") as f:
            try:
                data = json.load(f)
            except:
                data = []
    return jsonify({"leaderboard": data})

@app.route("/save-score", methods=["POST"])
def save_score():
    data = request.get_json()
    name = data.get("name", "Anonymous")
    save_to_json(name, wins)
    return jsonify({"success": True})

@app.route("/check-word", methods=["POST"])
def check_word():
    global wins, points

    # hämta ord från session eller generera nytt om det inte finns
    secret = session.get("secret_word")
    if not secret:
        secret = generate_word(WORDLIST)
        session["secret_word"] = secret
        session["game_hint_used"] = False

    data = request.get_json()
    word = data.get("word", "").lower()
    



    if word not in WORDLIST:
        return jsonify({"valid": False, "reason": "Not in wordlist"})

    evaluation = letter_check(secret, word)
    win = win_validation(word, secret)

    if win:
        wins += 1
        session["secret_word"] = generate_word(WORDLIST)   # nytt ord efter vinst
        session["game_hint_used"] = False                  # reset hint för nya ordet

    return jsonify({
        "valid": True,
        "evaluation": evaluation,
        "win": win,
        "wins": wins
    })

@app.route("/get-hint", methods=["POST"])
def get_hint():
    secret = session.get("secret_word")
    if not secret:
        secret = generate_word(WORDLIST)
        session["secret_word"] = secret
        session["game_hint_used"] = False

    if session.get("game_hint_used", False):
        return jsonify({"success": False, "message": "Hint already used"})

    data = request.get_json()
    guessed_rows = data.get("rows", [])

    # determine available columns
    available_cols = []
    for i in range(WORD_LENGTH):
         #For column i,check if any row has "correct" at that column. Meaning → that letter is already correctly guessed.
        col_correct = any(row[i] == "correct" for row in guessed_rows)
        if not col_correct:
            available_cols.append(i) #If column is NOT already solved. Add it to hint options.

    if not available_cols:
        return jsonify({"success": False, "message": "All letters guessed"})

    col = random.choice(available_cols)
    letter = secret[col].upper()

    session["game_hint_used"] = True
    return jsonify({"success": True, "col": col, "letter": letter})


if __name__ == "__main__":
    app.run(debug=True)