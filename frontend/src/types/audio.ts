export interface AudioRecorderState {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioChunks: Blob[];
  error: string | null;
}

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioChunks: Blob[];
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearRecording: () => Promise<void>;
  downloadRecording: (filename?: string) => void;
}