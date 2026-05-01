import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.events import router as events_router

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="OmniPark Edge API",
    description="Control and Event service for OmniPark edge node",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events_router)

@app.get("/status")
def get_status():
    return {"status": "running"}
