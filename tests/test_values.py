import pytest

from backend.wordle_logic import (
    letter_check,
    LETTER_PERFECT,
    LETTER_CORRECT_WRONG_POS,
    LETTER_NOT_IN_WORD,
)

P = LETTER_PERFECT
Y = LETTER_CORRECT_WRONG_POS
N = LETTER_NOT_IN_WORD


@pytest.mark.parametrize(
    "generated, guessed, expected",
    [
        # 1) Bas: allt rätt
        ("apple", "apple", [P, P, P, P, P]),

        # 2) Bas: inget finns i ordet
        ("apple", "zzzzz", [N, N, N, N, N]),

        # 3) Mix: lite rätt position, lite finns men fel position, lite saknas
        # a==a (P), n saknas (N), g saknas (N), l finns men fel pos (Y), e==e (P)
        ("apple", "angle", [P, N, N, P, P]),  # OBS: "v" saknas, "e" finns, "l" finns

        # 4) Mix: tydlig 2/1/0-soppa utan dubbelbokstavsbråk
        # a==a (P), p==p (P), a finns (Y), r saknas (N), t saknas (N)
        ("apple", "apart", [P, P, Y, N, N]),

        # 5) Alla bokstäver finns men alla på fel plats
        ("apple", "pleap", [Y, Y, Y, Y, Y]),

        # 6) Dubbelbokstav
        # "apple" har två p, men gissningen har fem p, så bara två av dem kan vara rätt position (P) eller rätt bokstav
        ("apple", "ppppp", [Y, P, P, Y, Y]),
    ],
)
def test_letter_check_valid_values(generated, guessed, expected):
    assert letter_check(generated, guessed) == expected


@pytest.mark.parametrize(
    "generated, guessed, expected",
    [
        # Olika längd (guessed för kort) -> IndexError när den försöker läsa guessed_word[l]
        ("apple", "app", IndexError),

        # Tom gissning -> IndexError direkt
        ("apple", "", IndexError),

        # None -> TypeError (len(None) eller indexering på None)
        ("apple", None, TypeError),
        (None, "apple", TypeError),

        # Fel typ -> TypeError
        ("apple", 12345, TypeError),
        (12345, "apple", TypeError),
    ],
)
def test_letter_check_invalid_values(generated, guessed, expected):
    with pytest.raises(expected):
        letter_check(generated, guessed)