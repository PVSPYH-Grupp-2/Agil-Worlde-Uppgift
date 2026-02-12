import random # Just for now
import os
import json
from typing import List
from flask import Flask, redirect, url_for


LETTER_NOT_IN_WORD = 0 # Bokstaven finns inte alls i ordet // Letter is not inte the word at all
LETTER_CORRECT_WRONG_POS = 1 # Bokstaven finns i ordet, men i fel position // Letter is in the word, but in the wrong position
LETTER_PERFECT = 2 # Letter is in the word and in the exact position
BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..")
)
wins = 0
# Also i probably will not use global variables as the ones above in the future. It's just there as an illustration.

def generate_word(words: list[str]) -> str:

    if not words:
        raise ValueError("No wordlist found")
    
    return random.choice(words).lower()

# This one we will scrap.


# Checks if the guessed word is correct
def win_validation(guessed_word, generated_word) -> bool:

    if guessed_word == generated_word:
        print("Grattis, du vann!")
        return True
    else:
        print("Förlust, prova igen!")
        return False
        

def try_again(yes) -> bool:

    if yes:
        return redirect(url_for("index.html"))
    else:
        return redirect(url_for("index.html"))



def letter_check(generated_word, guessed_word):
    """
    Compares each letter in the guessed word with the generated word.

    Returns a list:
    2 = correct letter and correct position
    1 = correct letter but wrong position
    0 = letter is not in word
    """
    result = []

    for l in range(len(generated_word)):  # l for letter
        if guessed_word[l] == generated_word[l]:
            result.append(LETTER_PERFECT)
        elif guessed_word[l] in generated_word:
            result.append(LETTER_CORRECT_WRONG_POS)
        else:
            result.append(LETTER_NOT_IN_WORD)

    print(result)
    return result


def validate_word_length(guessed_word):
    if len(guessed_word) == 5:
        return True
    else:
        return False
    
"""
This is just the basics of the basic. This is for now: just a back-end-idea.
Changes will come! With these type of functions we could:
Check if the entire word is correct = Win
and:
Check the guessed letters in the word,
and also use this for our front-end. This is why I am trying to keep these functions
as simple as possible for now. So that we could try to implement it, and get it working.
Thank you. It's been your boy Jimpanpimpan.
Checking out...
"""

def load_wordlist():
    path = os.path.join(BASE_DIR, "static", "assets", "words.json")
    with open(path, encoding="utf-8") as f:
        words = json.load(f)

    return words