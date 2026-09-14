export type SpeakerType = 'Doctor' | 'Patient' | 'System' | 'Live Transcript';

export interface TranscriptItem {
  id: string;
  speaker: SpeakerType;
  text: string;
  timestamp: string;
}