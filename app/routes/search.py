from fastapi import APIRouter
from app.db import get_connection

search_router = APIRouter()

@search_router.get("/search")
def search(word=None):
    conn = get_connection()
    cursor = conn.cursor()
    get_query = """ select id,date,raw_text from journal_entries """
    params = []
    if word is not None:
        pattern = "%"+ word +"%"
        params.append(pattern)
        get_query += " where raw_text ilike %s "

    cursor.execute(get_query,tuple(params))
    tuple_rows = cursor.fetchall()

    search_list = []
    for id_value,date_value,raw_text_value in tuple_rows:
        dict_row = {}
        dict_row["id"] = id_value
        dict_row["date"] = date_value
        dict_row["raw_text"] = raw_text_value
        search_list.append(dict_row)
    
    cursor.close()
    conn.close()
    return search_list


    
