# app.py

from flask import Flask, render_template, request
#from backend.wordle_logic import generate_secret_word

app = Flask(__name__)

def generate_secret_word() -> str:
    secret_word = "apple"  # The secret word
    return secret_word

@app.route("/", methods=["GET", "POST"])
def home():
    the_secret = generate_secret_word()
    saved_word = ""

    if request.method == "POST":
        l1 = request.form.get("l1", "").strip()
        l2 = request.form.get("l2", "").strip()
        l3 = request.form.get("l3", "").strip()
        l4 = request.form.get("l4", "").strip()
        l5 = request.form.get("l5", "").strip() 

        saved_word = (l1 + l2 + l3 + l4 + l5).lower()

    return render_template("index.html", saved_word=saved_word, the_secret=the_secret)

if __name__ == "__main__":
    app.run(debug=True)