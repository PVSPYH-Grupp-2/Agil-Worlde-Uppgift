from flask import Flask, redirect, render_template, request, url_for
from backend.wordle_logic import win_validation

app = Flask(__name__)

wins = 0

def generate_secret_word() -> str:
    secret_word = "apple"  # The secret word
    return secret_word

@app.route("/", methods=["GET", "POST"])
def home():
    generated_word = generate_secret_word()
    guessed_word = ""
    global wins

    if request.method == "POST":
        l1 = request.form.get("l1", "").strip()
        l2 = request.form.get("l2", "").strip()
        l3 = request.form.get("l3", "").strip()
        l4 = request.form.get("l4", "").strip()
        l5 = request.form.get("l5", "").strip() 
        guessed_word = (l1 + l2 + l3 + l4 + l5).lower()

        if win_validation(guessed_word, generated_word):
            wins += 1
            generated_word = generate_secret_word()

    return render_template("index.html", guessed_word=guessed_word, generated_word=generated_word, wins=wins)

if __name__ == "__main__":
    app.run(debug=True)