from flask import Flask, redirect, render_template, request, url_for, jsonify
from backend.wordle_logic import win_validation, load_wordlist, generate_word,letter_check

app = Flask(__name__)

wins = 0

WORDLIST = load_wordlist()["words"]
SECRET_WORD = generate_word(WORDLIST)

@app.route("/", methods=["GET", "POST"])
def home():
    global SECRET_WORD
    SECRET_WORD = generate_word(WORDLIST)  # new word every refresh
    print("SECRET_WORD:", SECRET_WORD)   # JUst for testing
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


if __name__ == "__main__":
    app.run(debug=True)
