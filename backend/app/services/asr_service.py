import numpy as np
from faster_whisper import WhisperModel
import asyncio

# Comprehensive clinical domain bias prompt
DEFAULT_MEDICAL_PROMPT = (
    "Clinical doctor-patient consultation dialogue discussing symptoms, examination findings, "
    "diagnoses, vital signs, and prescription management. Common clinical terms include: "
    "paracetamol, sumatriptan, amoxicillin, cetirizine, metformin, atorvastatin, ibuprofen, "
    "mg, milligrams, blood pressure, mmHg, hypertension, acute migraine, photophobia, nausea, "
    "fever, neck stiffness, throbbing headache, sputum, persistent cough, dyspnea, shortness of breath, "
    "asthma, wheezing, inhaler, allergy, no known drug allergies, NKDA, negative for chest pain."
)

class ASRService:
    def __init__(
        self,
        model_size: str = "base.en",
        device: str = "cpu",
        compute_type: str = "int8",
        medical_prompt: str = DEFAULT_MEDICAL_PROMPT,
    ):
        """
        Loads faster-whisper on CPU with int8 quantization.
        Applies clinical vocabulary biasing via initial_prompt.
        """
        print(f"[ASR] Loading faster-whisper '{model_size}' on {device.upper()} ({compute_type})...")
        self.model = WhisperModel(
            model_size,
            device=device,
            compute_type=compute_type,
            cpu_threads=4,
        )
        self.medical_prompt = medical_prompt
        print(f"[ASR] faster-whisper model '{model_size}' loaded with medical prompt priming.")

    def transcribe(self, audio_np: np.ndarray) -> dict:
        """
        Transcribes 1D float32 audio (16kHz).
        Biased toward clinical terms using initial_prompt with temperature=0 for determinism.
        """
        if len(audio_np) == 0:
            return {"text": "", "language": "en", "segments": []}

        segments, info = self.model.transcribe(
            audio_np,
            language="en",
            beam_size=5,
            best_of=5,
            temperature=0.0,
            initial_prompt=self.medical_prompt,  # 🎯 Injects domain vocabulary into Whisper decoder
            condition_on_previous_text=False,     # Prevents repeating phrases between buffered chunks
            vad_filter=False,                     # Handled upstream by Silero VAD
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
        """Runs inference in an asyncio threadpool to avoid blocking WebSocket frames."""
        return await asyncio.to_thread(self.transcribe, audio_np)