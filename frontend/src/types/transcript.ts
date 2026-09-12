export interface TranscriptItem {
  id: string;
  speaker: 'Doctor' | 'Patient' | 'System';
  text: string;
  timestamp: string;
}