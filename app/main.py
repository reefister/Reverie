from fastapi import FastAPI
from app.routes.entries import entries_router
from app.routes.search import search_router
from app.routes.semantic_search import semantic_router
from app.routes.analytics import analytics_sentiment_router, analytics_concept_frequency_router, analytics_concept_coocurrence_router
from app.routes.insights import insights_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends
from app.auth import require_api_key


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(entries_router,dependencies=[Depends(require_api_key)])
app.include_router(search_router,dependencies=[Depends(require_api_key)])
app.include_router(analytics_sentiment_router,dependencies=[Depends(require_api_key)])
app.include_router(analytics_concept_frequency_router,dependencies=[Depends(require_api_key)])
app.include_router(analytics_concept_coocurrence_router,dependencies=[Depends(require_api_key)])
app.include_router(semantic_router,dependencies=[Depends(require_api_key)])
app.include_router(insights_router,dependencies=[Depends(require_api_key)])

@app.get("/ping")
def test_check():
    return {"status":"ok"}
