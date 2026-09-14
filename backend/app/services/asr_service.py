import numpy as np
from faster_whisper import WhisperModel
import asyncio

class ASRService:
    def __init__(self, model_size: str = "base.en", device: str = "cpu", compute_type: str = "int8"):
        """
        Loads the faster-whisper model once at application startup.
        Runs locally on CPU with int8 quantization for ultra-fast, zero-cost inference.
        """
        print(f"[ASR] Loading faster-whisper model '{model_size}' on {device} ({compute_type})...")
        self.model = WhisperModel(model_size, device=device, compute_type=compute_type, cpu_threads=4)
        print("[ASR] faster-whisper model successfully loaded.")

    def transcribe(self, audio_np: np.ndarray) -> dict:
        """
        Transcribes a 1D NumPy float32 audio array (16kHz).
        Returns full text and recognized segments.
        """
        if len(audio_np) == 0:
            return {"text": "", "language": "en", "segments": []}

        # Whisper expects float32 normalized between -1.0 and 1.0
        segments, info = self.model.transcribe(
            audio_np,
            beam_size=3,
            language="en",
            condition_on_previous_text=False,
            vad_filter=False,  # We already handled VAD with Silero
        )

        segment_list = []
        full_text = []

        for segment in segments:
            text = segment.text.strip()
            if text:
                full_text.append(text)
                segment_list.append({
                    "start": segment.start,
                    "end": segment.end,
                    "text": text,
                })

        return {
            "text": " ".join(full_text).strip(),
            "language": info.language,
            "segments": segment_list,
        }

    async def transcribe_async(self, audio_np: np.ndarray) -> dict:
        """Run CPU inference in an asyncio threadpool to avoid blocking WebSocket loop."""
        return await asyncio.to_thread(self.transcribe, audio_np)