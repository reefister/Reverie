from fastapi import APIRouter
from app.db import get_connection
from collections import Counter
from groq import Groq
from itertools import combinations
import cohere
import os
from dotenv import load_dotenv

load_dotenv()
co = cohere.ClientV2(api_key=os.environ.get("COHERE_API_KEY"))
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
GROQ_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")

insights_router = APIRouter()

retrieval_query = """SELECT j.id, j.date, j.raw_text, e.sentiment, e.concepts,e.embeddings <=> %s::vector AS distance
FROM journal_entries j
JOIN entry_features e ON j.id = e.entry_id
ORDER BY distance
LIMIT %s;"""

concept_stats_query = """
SELECT lower(concept) AS concept,
       count(DISTINCT e.entry_id) AS entry_count,
       avg(e.sentiment) AS avg_sentiment
FROM entry_features e,
     jsonb_array_elements_text(e.concepts) AS concept
WHERE lower(concept) = ANY(%s)
GROUP BY lower(concept)
ORDER BY entry_count DESC;
"""

SYSTEM_PROMPT = """You answer questions about a person's private journal.
Use ONLY the journal entries and statistics provided. Do not invent details.
Cite entries by their label, like [Entry 12], whenever you make a claim.
If the entries don't contain enough to answer, say so plainly.
Sentiment scores run from -1 (very negative) to +1 (very positive)."""

@insights_router.get("/insights")
def insights(q:str,k: int=5):
   
    response = co.embed(
    texts=[q],
    model="embed-english-v3.0",
    input_type="search_query",
    embedding_types=["float"]
    )
    embeddings = response.embeddings.float

    query_vector = embeddings[0]

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(retrieval_query, (query_vector, k))
    tuple_rows = cursor.fetchall()
    
    search_list = []
    for id_value,date_value,raw_text_value,sentiment_value,concepts_value,distance_value in tuple_rows:
        dict_row = {}
        dict_row["id"] = id_value
        dict_row["date"] = date_value
        dict_row["raw_text"] = raw_text_value
        dict_row["concepts"] = concepts_value
        dict_row["sentiment"] = sentiment_value
        dict_row["distance"] = distance_value
        search_list.append(dict_row)

    concepts_set = set()
    for dict_row in search_list:
        concepts_value = dict_row["concepts"]
        if concepts_value is None:
            continue
        for concept in concepts_value:
            concepts_set.add(concept.lower())

 

    concepts_list = list(concepts_set)
    concept_stats = []
    if len(concepts_list)>0:
        cursor.execute(concept_stats_query, (concepts_list,))
        tuple_rows_with_meta = cursor.fetchall()

       
        for concept_val,entry_count_val,sentiment_val in tuple_rows_with_meta:
            stats_row = {}
            stats_row["concept"] = concept_val
            stats_row["entry_count"] = entry_count_val
            stats_row["avg_sentiment"] = sentiment_val
            concept_stats.append(stats_row)

    pair_counts = Counter()
    for entry in search_list:
        concepts_value = entry["concepts"]
        if concepts_value is None:
            continue
        unique_concepts = sorted({c.lower() for c in concepts_value})
        for pair in combinations(unique_concepts, 2):
            pair_counts[pair] += 1

    cooccurrence = []
    for pair, count in pair_counts.items():
        if count >= 2:
            cooccurrence.append({"pair": list(pair), "count": count})
    
    
            
    cursor.close()
    conn.close()

    entry_blocks = []
    for entry in search_list:
        concepts_text = ", ".join(entry["concepts"]) if entry["concepts"] else "none"
        header = f"[Entry {entry['id']} | {entry['date']:%Y-%m-%d} | sentiment {entry['sentiment']:.2f}]"
        text = entry["raw_text"][:1500]
        entry_blocks.append(f"{header}\nConcepts: {concepts_text}\n{text}")
    entries_text = "\n\n".join(entry_blocks)

    stats_lines = []
    for stats_row in concept_stats:
        if stats_row["entry_count"] < 2:
            continue
        stats_lines.append(
        f"- {stats_row['concept']}: appears in {stats_row['entry_count']} entries, "
        f"avg sentiment {stats_row['avg_sentiment']:.2f}"
        )
    stats_text = "\n".join(stats_lines) if stats_lines else "none"

    pair_lines = []
    for item in cooccurrence:
        pair_lines.append(
        f"- {item['pair'][0]} + {item['pair'][1]}: together in {item['count']} of these entries"
        )
    pairs_text = "\n".join(pair_lines) if pair_lines else "none"

    user_message = f"""Question: {q}

    Journal entries:
    {entries_text}

    Concept statistics (across the whole journal):
    {stats_text}

    Concept pairs appearing together in these entries:
    {pairs_text}"""



    completion = groq_client.chat.completions.create(
    model=GROQ_MODEL,
    messages=[
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ],
    temperature=0.2,
)
    answer = completion.choices[0].message.content
    
    return {
    "query": q,
    "sources": search_list,
    "analytics": {
        "concept_stats": concept_stats,
        "cooccurrence":cooccurrence
    },
    "answer": answer
    }