from flask import Flask, redirect, render_template, request, url_for, jsonify, session
from backend.wordle_logic import win_validation, load_wordlist, generate_word,letter_check
import random

app = Flask(__name__)
app.secret_key = "dev_secret_key"  # Needed for session management

wins = 0

WORDLIST = load_wordlist()["words"]
SECRET_WORD = generate_word(WORDLIST)
WORD_LENGTH = 5
game_hint_used = False

@app.route("/", methods=["GET", "POST"])
def home():
    global SECRET_WORD,game_hint_used

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
    
    return jsonify({"leaderboard": []})

@app.route("/check-word", methods=["POST"])
def check_word():
    global wins

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


