import os
import json
from groq import Groq
from dotenv import load_dotenv
from app.db import get_connection
load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
GROQ_CONCEPTS_MODEL = os.environ.get("GROQ_CONCEPTS_MODEL", "openai/gpt-oss-20b")

def extract_concepts(text):
    """Sends the journal text to Groq and returns a comma-separated string of concepts."""
    if not text:
        return ""
    try:
        completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "you're reviewing a journal to detect concepts per entry in the journal, this data will be used for deeper analysis, so your task is to accurately detect concepts for each entry, return only a JSON array of strings, nothing else."
                       
                    )
                },
                {"role": "user", "content": str(text)}
            ],
            model=GROQ_CONCEPTS_MODEL,
            temperature=0.3,
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq API Error: {e}")
        return None


conn = get_connection()
cursor = conn.cursor()

get_query = """select * from journal_entries"""

cursor.execute(get_query)

tuple_rows = cursor.fetchall()

update_query = """UPDATE entry_features SET concepts = %s WHERE entry_id = %s AND concepts IS NULL"""

for id_value,dayone_id,date,raw_text_value,raw_json,created_at in tuple_rows:

    entry_id = id_value
    concepts_json_array = extract_concepts(raw_text_value)
    if concepts_json_array is None:
        continue
    if not concepts_json_array:
        continue
    try:
        concepts = json.loads(concepts_json_array)
    except json.JSONDecodeError:
        print(f"Skipping entry {entry_id}: malformed JSON response")
        continue
    cursor.execute(update_query,(json.dumps(concepts),entry_id))
    print(f"processing {entry_id}")
    conn.commit()

    
cursor.close()
conn.close()

