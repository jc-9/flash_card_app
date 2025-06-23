# app.py
import os
import sqlite3
import csv
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import json
import base64
import requests # For making HTTP requests to Gemini API (though not used for TTS in this version)

# Load environment variables (not strictly necessary for the current setup but good practice)
load_dotenv()

app = Flask(__name__, template_folder='templates', static_folder='static')

# Configuration for the database path
# The database file will be stored in a 'data' directory within the app's root
# This makes it easy to configure persistence for Docker volumes.
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
os.makedirs(DATA_DIR, exist_ok=True) # Ensure the data directory exists
DATABASE_FILE = os.path.join(DATA_DIR, 'vocabulary.db')

# --- Database Helper Functions ---
def init_db():
    """Initializes the SQLite database and creates the 'words' table."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS words (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            word_text TEXT UNIQUE NOT NULL,
            correct_count INTEGER DEFAULT 0,
            incorrect_count INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()
    print(f"Database initialized at {DATABASE_FILE}")

def get_db_connection():
    """Establishes and returns a database connection."""
    conn = sqlite3.connect(DATABASE_FILE)
    conn.row_factory = sqlite3.Row # Allows accessing columns by name
    return conn

def add_word_to_db(word_text):
    """Adds a single word to the database, ensuring uniqueness."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO words (word_text) VALUES (?)", (word_text,))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        # Word already exists (due to UNIQUE constraint)
        return False
    finally:
        conn.close()

def delete_word_from_db(word_id):
    """Deletes a word by its ID from the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM words WHERE id = ?", (word_id,))
    conn.commit()
    conn.close()

def update_word_in_db(word_id, new_word_text):
    """Updates the text of an existing word in the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE words SET word_text = ? WHERE id = ?", (new_word_text, word_id))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        # New word_text already exists
        return False
    finally:
        conn.close()

def get_random_word_from_db():
    """Retrieves a random word from the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, word_text, correct_count, incorrect_count FROM words ORDER BY RANDOM() LIMIT 1")
    word = cursor.fetchone()
    conn.close()
    return dict(word) if word else None

def update_pronunciation_stats(word_id, is_correct):
    """Updates the correct_count or incorrect_count for a given word."""
    conn = get_db_connection()
    cursor = conn.cursor()
    if is_correct:
        cursor.execute("UPDATE words SET correct_count = correct_count + 1 WHERE id = ?", (word_id,))
    else:
        cursor.execute("UPDATE words SET incorrect_count = incorrect_count + 1 WHERE id = ?", (word_id,))
    conn.commit()
    conn.close()

def get_all_words_from_db():
    """Retrieves all words from the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, word_text, correct_count, incorrect_count FROM words ORDER BY word_text")
    words = cursor.fetchall()
    conn.close()
    return [dict(word) for word in words]

def calculate_overall_results():
    """Calculates the overall correct pronunciation percentage."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT SUM(correct_count) AS total_correct, SUM(incorrect_count) AS total_incorrect FROM words")
    results = cursor.fetchone()
    conn.close()

    total_correct = results['total_correct'] if results and results['total_correct'] is not None else 0
    total_incorrect = results['total_incorrect'] if results and results['total_incorrect'] is not None else 0
    total_attempts = total_correct + total_incorrect

    if total_attempts == 0:
        return {"percentage": 0, "total_correct": 0, "total_incorrect": 0, "total_attempts": 0}
    
    percentage = (total_correct / total_attempts) * 100
    return {
        "percentage": round(percentage, 2),
        "total_correct": total_correct,
        "total_incorrect": total_incorrect,
        "total_attempts": total_attempts
    }

# --- Flask Routes ---

@app.route('/')
def index():
    """Renders the main index HTML page."""
    return render_template('index.html')

@app.route('/api/upload_csv', methods=['POST'])
def upload_csv():
    """Handles CSV file upload and populates the database."""
    if 'csv_file' not in request.files:
        return jsonify({"success": False, "message": "No file part"}), 400
    
    file = request.files['csv_file']
    if file.filename == '':
        return jsonify({"success": False, "message": "No selected file"}), 400
    
    if file and file.filename.endswith('.csv'):
        # Read the CSV content
        try:
            stream = file.stream.read().decode("utf-8")
            reader = csv.reader(stream.splitlines())
            added_count = 0
            skipped_count = 0
            for row in reader:
                if row: # Ensure row is not empty
                    word = row[0].strip() # Assuming word is in the first column
                    if word:
                        if add_word_to_db(word):
                            added_count += 1
                        else:
                            skipped_count += 1
            return jsonify({
                "success": True, 
                "message": f"CSV processed: {added_count} new words added, {skipped_count} duplicates skipped."
            })
        except Exception as e:
            return jsonify({"success": False, "message": f"Error processing CSV: {str(e)}"}), 500
    
    return jsonify({"success": False, "message": "Invalid file type. Please upload a CSV file."}), 400

@app.route('/api/get_word', methods=['GET'])
def get_word():
    """Retrieves a random word for the flashcard session."""
    word = get_random_word_from_db()
    if word:
        return jsonify({"success": True, "word": word})
    else:
        return jsonify({"success": False, "message": "No words in the database. Please upload a CSV."}), 404

@app.route('/api/update_pronunciation', methods=['POST'])
def update_pronunciation():
    """Updates pronunciation statistics for a word based on user's self-assessment."""
    data = request.json
    word_id = data.get('word_id')
    is_correct = data.get('is_correct') # Boolean True/False

    if word_id is None or is_correct is None:
        return jsonify({"success": False, "message": "Missing word_id or is_correct"}), 400
    
    try:
        update_pronunciation_stats(word_id, is_correct)
        return jsonify({"success": True, "message": "Stats updated successfully."})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error updating stats: {str(e)}"}), 500

@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    """
    Placeholder for Text-to-Speech functionality.
    This endpoint is not implemented as automated pronunciation judging or word
    audio playback is not part of the current simplified design using a human judge.
    A dedicated TTS API would be required for actual audio output.
    """
    data = request.json
    text = data.get('text') # Word text is passed, but not used for actual TTS

    # Always return a 501 Not Implemented response to signify this feature is not active.
    return jsonify({"success": False, "message": "Text-to-speech functionality is not implemented in this version (human judge). A dedicated TTS API would be required for audio playback."}), 501

@app.route('/api/words', methods=['GET'])
def get_words():
    """Retrieves all words for management display."""
    words = get_all_words_from_db()
    return jsonify({"success": True, "words": words})

@app.route('/api/delete_word/<int:word_id>', methods=['DELETE'])
def delete_word(word_id):
    """Deletes a word by ID."""
    try:
        delete_word_from_db(word_id)
        return jsonify({"success": True, "message": f"Word with ID {word_id} deleted."})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error deleting word: {str(e)}"}), 500

@app.route('/api/update_word', methods=['POST'])
def update_word():
    """Updates an existing word's text."""
    data = request.json
    word_id = data.get('word_id')
    new_word_text = data.get('new_word_text', '').strip()

    if word_id is None or not new_word_text:
        return jsonify({"success": False, "message": "Missing word_id or new_word_text"}), 400
    
    try:
        if update_word_in_db(word_id, new_word_text):
            return jsonify({"success": True, "message": "Word updated successfully."})
        else:
            return jsonify({"success": False, "message": "Update failed: Word with this text already exists."}), 409
    except Exception as e:
        return jsonify({"success": False, "message": f"Error updating word: {str(e)}"}), 500

@app.route('/api/results', methods=['GET'])
def get_results():
    """Returns the overall pronunciation results."""
    results = calculate_overall_results()
    return jsonify({"success": True, "results": results})

# --- Application Startup ---
if __name__ == '__main__':
    # Initialize the database when the application starts
    init_db()
    # Run Flask app
    # In a Docker container, you might bind to 0.0.0.0
    app.run(host='0.0.0.0', port=5010, debug=True)
