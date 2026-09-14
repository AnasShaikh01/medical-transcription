from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables (.env) before service initialization
load_dotenv()

from app.websocket import transcription_websocket
from app.routes.medical import router as medical_router

app = FastAPI(
    title="Medical Live Transcription & Clinical Summary API",
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

# Mount REST endpoints
app.include_router(medical_router)

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "medical-transcription-api",
    }

@app.websocket("/ws/transcribe")
async def websocket_endpoint(websocket: WebSocket):
    await transcription_websocket(websocket)