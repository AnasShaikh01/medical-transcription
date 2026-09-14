from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.medical_extraction_service import MedicalExtractionService
from app.services.medical_normalizer_service import MedicalNormalizerService

router = APIRouter(prefix="/api/medical", tags=["Medical"])
extraction_service = MedicalExtractionService()
normalizer_service = MedicalNormalizerService()

class TranscriptRequest(BaseModel):
    transcript: str = Field(..., min_length=1, max_length=50000)

@router.post("/normalize")
async def normalize_medical_transcript(request: TranscriptRequest):
    cleaned_transcript = request.transcript.strip()
    if not cleaned_transcript:
        raise HTTPException(
            status_code=400,
            detail="Transcript cannot be empty"
        )

    try:
        normalized = await normalizer_service.normalize(cleaned_transcript)
        return {
            "success": True,
            "transcript": normalized
        }
    except Exception as exc:
        print(f"[MEDICAL NORMALIZATION ERROR] {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to normalize medical transcript"
        )

@router.post("/extract")
async def extract_medical_summary(request: TranscriptRequest):
    cleaned_transcript = request.transcript.strip()
    if not cleaned_transcript:
        raise HTTPException(
            status_code=400,
            detail="Transcript cannot be empty"
        )

    try:
        result = await extraction_service.extract(cleaned_transcript)
        return {
            "success": True,
            "data": result.model_dump()
        }
    except Exception as exc:
        print(f"[MEDICAL EXTRACTION ERROR] {exc}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate medical summary"
        )