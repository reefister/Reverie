import os
import secrets
from fastapi import Header, HTTPException
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ["API_KEY"]

def require_api_key(x_api_key: str = Header(default="")):
    if not secrets.compare_digest(x_api_key.encode(), API_KEY.encode()):
        raise HTTPException(status_code=401, detail="Invalid Key - Unauthorized")