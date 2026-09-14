from pydantic import BaseModel, Field

class PatientDetails(BaseModel):
    name: str = "Not mentioned"
    age: str = "Not mentioned"
    sex: str = "Not mentioned"

class Symptoms(BaseModel):
    positive: list[str] = Field(default_factory=list, description="Explicitly confirmed positive symptoms")
    negative: list[str] = Field(default_factory=list, description="Explicitly denied/ruled-out symptoms")

class MedicalSummary(BaseModel):
    patient_details: PatientDetails
    chief_complaint: str = "Not mentioned"
    history_of_present_illness: str = "Not mentioned"
    symptoms: Symptoms
    past_medical_history: list[str] = Field(default_factory=list)
    medication_history: list[str] = Field(default_factory=list)
    clinical_observations: list[str] = Field(default_factory=list)
    assessment: str = "Not mentioned"
    plan: list[str] = Field(default_factory=list)