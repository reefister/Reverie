import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    conn = psycopg2.connect(                              
    host="localhost",                                      
    database=os.environ["DB_NAME"],
    user=os.environ["DB_USER"],
    password=os.environ["DB_PASSWORD"],
    port="5432")
    return conn
