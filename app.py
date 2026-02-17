from flask import Flask, redirect, render_template, request, url_for, jsonify
from backend.wordle_logic import win_validation, load_wordlist, generate_word,letter_check
import random

app = Flask(__name__)

wins = 0

WORDLIST = load_wordlist()["words"]
SECRET_WORD = generate_word(WORDLIST)
WORD_LENGTH = 5
game_hint_used = False

@app.route("/", methods=["GET", "POST"])
def home():
    global SECRET_WORD,game_hint_used
    SECRET_WORD = generate_word(WORDLIST)  # new word every refresh
    print("SECRET_WORD:", SECRET_WORD)   # JUst for testing
    game_hint_used = False
    return render_template("index.html")

@app.route("/leaderboard", methods=["GET"])
def leaderboard():
    
    return jsonify({"leaderboard": []})

@app.route("/check-word", methods=["POST"])
def check_word():
    global wins, SECRET_WORD

    data = request.get_json()
    word = data.get("word", "").lower()

    if word not in WORDLIST:
        return jsonify({"valid": False, "reason": "Not in wordlist"})

    evaluation = letter_check(SECRET_WORD,word)
    win = win_validation(word, SECRET_WORD)  # added win


    if win:
        wins += 1
        SECRET_WORD = generate_word(WORDLIST)


    return jsonify({
        "valid": True,
        "evaluation": evaluation,
        "win": win,
        "wins": wins
        # Added win, returns true if player wins
    })

@app.route("/get-hint", methods=["POST"])
def get_hint():
    global game_hint_used, SECRET_WORD
    if game_hint_used: return jsonify({"success":False,"message":"Hint already used"})
    data = request.get_json()
    guessed_rows = data.get("rows",[])

    # determine available columns
    available_cols = []
    for i in range(WORD_LENGTH):
        #For column i,check if any row has "correct" at that column.Meaning → that letter is already correctly guessed.
        col_correct = any(row[i]=="correct" for row in guessed_rows)
        if not col_correct: available_cols.append(i)    #If column is NOT already solved.Add it to hint options.

    if not available_cols: return jsonify({"success":False,"message":"All letters guessed"})

    col = random.choice(available_cols)
    letter = SECRET_WORD[col].upper()
    game_hint_used = True
    return jsonify({"success":True,"col":col,"letter":letter})

if __name__ == "__main__":
    app.run(debug=True)
