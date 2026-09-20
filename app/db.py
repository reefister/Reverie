import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    conn = psycopg2.connect(                              
    host="localhost",                                      
    database="cjis",
    user="postgres",
    password=os.environ.get("DB_PASSWORD"),
    port="5432")
    return conn
