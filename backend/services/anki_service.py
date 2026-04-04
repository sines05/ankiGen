"""
/**
 * @file anki_service.py
 * @description Generation of Anki packaging format (.apkg) from flashcard data.
 * @last_modified Added file header to comply with AGENT.md coding rules.
 */
"""
import genanki
import random
import io
import filecmp
import tempfile
import os

def export_apkg(deck_name: str, cards: list[dict]) -> bytes:
    # Generate unique ID for model and deck
    model_id = random.randrange(1 << 30, 1 << 31)
    deck_id = random.randrange(1 << 30, 1 << 31)

    my_model = genanki.Model(
        model_id,
        'Doc2Anki Model',
        fields=[
            {'name': 'Question'},
            {'name': 'Answer'},
        ],
        templates=[
            {
                'name': 'Card 1',
                'qfmt': '{{Question}}',
                'afmt': '{{FrontSide}}<hr id="answer">{{Answer}}',
            },
        ])

    my_deck = genanki.Deck(deck_id, deck_name)

    for c in cards:
        my_note = genanki.Note(
            model=my_model,
            fields=[c['front'], c['back']])
        my_deck.add_note(my_note)

    my_package = genanki.Package(my_deck)
    
    # Write to a temporary file, read bytes, delete file
    temp_fd, temp_path = tempfile.mkstemp(suffix=".apkg")
    os.close(temp_fd)
    
    try:
        my_package.write_to_file(temp_path)
        with open(temp_path, "rb") as f:
            data = f.read()
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
    return data
