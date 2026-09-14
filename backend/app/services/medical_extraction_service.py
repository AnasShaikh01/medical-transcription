import os
import json
from groq import AsyncGroq
from app.schemas.medical import MedicalSummary

class MedicalExtractionService:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY environment variable is not configured in backend/.env")
        self.client = AsyncGroq(api_key=api_key)
        # Primary model selected from active models
        self.primary_model = "openai/gpt-oss-120b"
        self.fallback_model = "qwen/qwen3.8-27b"

    async def extract(self, transcript: str) -> MedicalSummary:
        system_prompt = """
You are an expert medical transcriptionist and clinical data extraction system.
Extract structured clinical information from the doctor-patient dialogue transcript provided.

CRITICAL EXTRACTION RULES:
1. ONLY extract information explicitly articulated in the transcript.
2. ABSOLUTELY NO HALLUCINATIONS: Do not assume, invent, or extrapolate clinical details.
3. NEGATIONS & PERTINENT NEGATIVES:
   - When a patient denies a symptom (e.g., "no fever", "denies headache", "no neck stiffness"), place it strictly into symptoms.negative.
   - Confirmed active symptoms (e.g., "throbbing pain", "nausea") go into symptoms.positive.
   - Never put denied symptoms into symptoms.positive.
4. If a piece of information was not mentioned:
   - Use "Not mentioned" for string fields.
   - Use empty lists [] for list fields.
5. You MUST return a valid JSON object strictly matching this schema:
{
  "patient_details": {
    "name": "string",
    "age": "string",
    "sex": "string"
  },
  "chief_complaint": "string",
  "history_of_present_illness": "string",
  "symptoms": {
    "positive": ["string"],
    "negative": ["string"]
  },
  "past_medical_history": ["string"],
  "medication_history": ["string"],
  "clinical_observations": ["string"],
  "assessment": "string",
  "plan": ["string"]
}
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Transcript to analyze:\n\n{transcript}"}
        ]

        try:
            response = await self.client.chat.completions.create(
                model=self.primary_model,
                temperature=0.0,
                response_format={"type": "json_object"},
                messages=messages
            )
        except Exception as err:
            print(f"[EXTRACTION] Primary model '{self.primary_model}' failed ({err}). Retrying with fallback '{self.fallback_model}'...")
            response = await self.client.chat.completions.create(
                model=self.fallback_model,
                temperature=0.0,
                response_format={"type": "json_object"},
                messages=messages
            )

        raw_content = response.choices[0].message.content
        if not raw_content:
            raise ValueError("Groq returned an empty response")

        data = json.loads(raw_content)
        return MedicalSummary.model_validate(data)