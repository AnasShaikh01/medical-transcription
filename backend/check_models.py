import os
from dotenv import load_dotenv
from groq import Groq

# Load GROQ_API_KEY from backend/.env
load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    print("❌ Error: GROQ_API_KEY not found in backend/.env")
    exit(1)

client = Groq(api_key=api_key)

try:
    print("🔍 Fetching active models from Groq...\n")
    models_page = client.models.list()
    
    # Filter for chat-capable models and sort them
    chat_models = sorted([m.id for m in models_page.data if not m.id.startswith("whisper")])
    
    print("--- Available Chat/Extraction Models ---")
    for model_id in chat_models:
        print(f"  • {model_id}")
        
    print("\n--- Audio/Whisper Models ---")
    for m in models_page.data:
        if m.id.startswith("whisper"):
            print(f"  • {m.id}")

except Exception as err:
    print(f"❌ Failed to fetch models: {err}")