export interface PatientDetails {
  name: string;
  age: string | number;
  sex: string;
}

export interface SymptomsGroup {
  positive: string[];
  negative: string[];
}

export interface MedicalSummaryData {
  patient_details: PatientDetails;
  chief_complaint: string;
  history_of_present_illness: string;
  symptoms: SymptomsGroup;
  past_medical_history: string[];
  medication_history: string[];
  clinical_observations: string[];
  assessment: string;
  plan: string[];
}