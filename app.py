from flask import Flask, redirect, render_template, request, url_for, jsonify
from backend.wordle_logic import win_validation

app = Flask(__name__)

wins = 0


def generate_secret_word() -> str:
    secret_word = "apple"  # The secret word
    return secret_word


@app.route("/", methods=["GET", "POST"])
def home():

    return render_template("index.html")


def evaluate_guess(guess, secret):
    result = ["absent"] * 5
    secret_letters = list(secret)

    # Pass 1: correct
    for i in range(5):
        if guess[i] == secret[i]:
            result[i] = "correct"
            secret_letters[i] = None

    # Pass 2: present
    for i in range(5):
        if result[i] == "absent" and guess[i] in secret_letters:
            result[i] = "present"
            secret_letters[secret_letters.index(guess[i])] = None

    return result

@app.route("/leaderboard", methods=["GET"])
def leaderboard():
    
    return jsonify({"leaderboard": []})

@app.route("/check-word", methods=["POST"])
def check_word():
    WORDS = ['apple', 'phone', 'phase', 'story', 'glass', 'mango', 'grape']
    SECRET_WORD = 'apple'
    data = request.get_json()
    word = data.get("word", "").lower()

    if word not in WORDS:
        return jsonify({"valid": False, "reason": "Not in wordlist"})

    evaluation = evaluate_guess(word, SECRET_WORD)
    win = win_validation(word, SECRET_WORD)  # added win
    global wins

    if win:
        wins += 1


    return jsonify({
        "valid": True,
        "evaluation": evaluation,
        "win": win,
        "wins": wins
        # Added win, returns true if player wins
    })


if __name__ == "__main__":
    app.run(debug=True)
