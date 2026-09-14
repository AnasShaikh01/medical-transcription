from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.websocket import transcription_websocket

app = FastAPI(
    title="Medical Live Transcription API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "medical-transcription-api",
    }

@app.websocket("/ws/transcribe")
async def websocket_endpoint(websocket: WebSocket):
    await transcription_websocket(websocket)