from flask import Flask, render_template, request
from backend.wordle_logic import (
    generate_word, letter_check, validate_word_length
)

# Bokstaven finns inte alls i ordet // Letter is not in the word at all
LETTER_NOT_IN_WORD = 0

# Bokstaven finns i ordet, men i fel position // Letter is in the word, but in the wrong position
LETTER_CORRECT_WRONG_POS = 1

# Bokstaven finns i ordet och i exakt position
LETTER_PERFECT = 2


app = Flask(__name__)

# Testkörning av logiken
# letter_check(generated_word="APPLE", guessed_word="APEEL")
generated_word = generate_word(["APPLE", "CIDER", "MOVIE"])

@app.route("/", methods=["GET", "POST"])
def home():

    guessed_word = ""
    result = None # Start with nothing

    if request.method == "POST":
        l1 = request.form.get("l1", "").strip()
        l2 = request.form.get("l2", "").strip()
        l3 = request.form.get("l3", "").strip()
        l4 = request.form.get("l4", "").strip()
        l5 = request.form.get("l5", "").strip()

        guessed_word = (l1 + l2 + l3 + l4 + l5).lower()

        # This is where we connect the backend with the frontend!
        if validate_word_length(guessed_word): # Just checking if the length of the word is 5.
            result = letter_check(generated_word.lower(), guessed_word) # Checks the letters in respective positions [0,1,2]
            print("GUESSED WORD:", guessed_word, "GENERATED WORD:", generated_word, "RESULT:", result)
        else:
            print("WRONG LENGTH OF WORD", guessed_word)

    return render_template(
        "index.html",
        guessed_word=guessed_word,
        generated_word=generated_word,
        result=result
    )


if __name__ == "__main__":
    app.run(debug=True)
