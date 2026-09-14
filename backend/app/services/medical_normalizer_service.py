import os
from groq import AsyncGroq

NORMALIZER_SYSTEM_PROMPT = """
You are a conservative medical transcription error-correction assistant.

Your task is to fix obvious speech-recognition (ASR) phonetic corruptions in a doctor-patient dialogue transcript while preserving structural and semantic fidelity.

RULES:

1. PRESERVE STRUCTURE AND UTTERANCE BOUNDARIES:
   - Preserve every speaker label (e.g., "Live Transcript:", "Doctor:", "Patient:") and line/utterance boundary exactly.
   - Do NOT merge separate dialogue lines into paragraphs.
   - Keep the line count and speaker attribution identical to the input.

2. CONSERVATIVE CORRECTION & SPEAKER IMMUTABILITY:
   - Do NOT change a speaker label or infer/change who said something.
   - Correct the text within each utterance independently.
   - Correct ONLY obvious ASR phonetic mistakes where the intended clinical term is unambiguously supported by the immediate sentence context (e.g., clear phonetically garbled medication names, dosages, standard clinical terms, or lab tests like HbA1c).
   - If a word is ambiguous, degraded, or lacks decisive clinical context to identify the intended term with high confidence, LEAVE THE ORIGINAL WORDING UNCHANGED.
   - NEVER guess or arbitrate between multiple medically plausible possibilities.

3. PRESERVE MEANING AND NEGATIONS:
   - Preserve negations with absolute strictness. "No chest pain" or "denies fever" must NEVER lose its negative phrasing.
   - Preserve all spoken numbers, units, dosages, durations, and temporal frequencies.

4. DO NOT INVENT, ENRICH, OR REPHRASE:
   - Do NOT convert spoken phrases into more formal medical language unless correcting an obvious ASR error.
   - Do NOT add clinical details, assessments, or observations that were not spoken.
   - Do NOT summarize, rephrase, or stylistically edit natural conversational speech.
   - Do NOT omit any clinically relevant terms.

5. OUTPUT FORMAT:
   - Return ONLY the corrected transcript text.
   - Do NOT add quotes, preambles, disclaimers, explanations, or notes.
"""

class MedicalNormalizerService:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not configured in backend/.env")
        self.client = AsyncGroq(api_key=api_key)
        self.primary_model = "openai/gpt-oss-120b"
        self.fallback_model = "qwen/qwen3.8-27b"

    async def normalize(self, transcript: str) -> str:
        cleaned = transcript.strip()
        if not cleaned:
            return ""

        messages = [
            {"role": "system", "content": NORMALIZER_SYSTEM_PROMPT},
            {"role": "user", "content": cleaned}
        ]

        try:
            response = await self.client.chat.completions.create(
                model=self.primary_model,
                temperature=0.0,
                messages=messages
            )
        except Exception as err:
            print(f"[NORMALIZER] Primary model '{self.primary_model}' failed ({err}). Retrying with fallback '{self.fallback_model}'...")
            response = await self.client.chat.completions.create(
                model=self.fallback_model,
                temperature=0.0,
                messages=messages
            )

        content = response.choices[0].message.content
        return content.strip() if content else cleaned