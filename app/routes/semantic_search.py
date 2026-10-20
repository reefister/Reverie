from fastapi import APIRouter
from app.db import get_connection
import cohere
import os
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException

load_dotenv()
co = cohere.ClientV2(api_key=os.environ.get("COHERE_API_KEY"))

semantic_router = APIRouter()

get_query = """SELECT j.id, j.date, j.raw_text, e.sentiment, e.concepts
FROM journal_entries j
JOIN entry_features e ON j.id = e.entry_id
ORDER BY e.embeddings <=> %s::vector
LIMIT 5;"""

@semantic_router.get("/semantic_search")
def semantic_search(word):
    if not word or not word.strip():
        raise HTTPException(status_code=422, detail="Query cannot be empty")
    conn = get_connection()
    cursor = conn.cursor()
    
        
    
    response = co.embed(
    texts=[word],
    model="embed-english-v3.0",
    input_type="search_query",
    embedding_types=["float"]
    )
    embeddings = response.embeddings.float

    query_vector = embeddings[0]

    cursor.execute(get_query, (query_vector,))
    tuple_rows = cursor.fetchall()
    
    search_list = []
    for id_value,date_value,raw_text_value,sentiment_value,concepts_value in tuple_rows:
        dict_row = {}
        dict_row["id"] = id_value
        dict_row["date"] = date_value
        dict_row["raw_text"] = raw_text_value
        dict_row["concepts"] = concepts_value
        dict_row["sentiment"] = sentiment_value
        search_list.append(dict_row)
        
    cursor.close()
    conn.close()
    return search_list

    