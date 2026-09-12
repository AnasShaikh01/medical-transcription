import { useState } from 'react';
import { Header } from './components/Header';
import { RecordingPanel } from './components/RecordingPanel';
import { MedicalSummary } from './components/MedicalSummary';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import type { TranscriptItem } from './types/transcript';
import type { MedicalSummaryData } from './types/medical';

const DUMMY_TRANSCRIPTS: TranscriptItem[] = [
  {
    id: '1',
    speaker: 'Doctor',
    text: 'Good morning John. What brings you in today?',
    timestamp: '10:00 AM',
  },
  {
    id: '2',
    speaker: 'Patient',
    text: "I've been experiencing a severe throbbing headache for the past three days.",
    timestamp: '10:01 AM',
  },
  {
    id: '3',
    speaker: 'Doctor',
    text: 'Are you having any nausea, fever, or vision changes?',
    timestamp: '10:01 AM',
  },
  {
    id: '4',
    speaker: 'Patient',
    text: 'Yes, mild nausea and sensitivity to light. No fever or neck stiffness though.',
    timestamp: '10:02 AM',
  },
  {
    id: '5',
    speaker: 'Doctor',
    text: 'Blood pressure is 120 over 80. Pupils are equal and reactive. Are you taking any medications?',
    timestamp: '10:03 AM',
  },
  {
    id: '6',
    speaker: 'Patient',
    text: 'Just Paracetamol 650 occasionally, but it barely helps.',
    timestamp: '10:03 AM',
  },
];

const DUMMY_SUMMARY: MedicalSummaryData = {
  patient_details: {
    name: 'John Doe',
    age: 32,
    sex: 'Male',
  },
  chief_complaint: 'Severe throbbing headache for 3 days.',
  history_of_present_illness:
    'Patient reports onset of moderate to severe throbbing headache 3 days ago. Aggravated by light. Partial relief with rest.',
  symptoms: {
    positive: ['Severe headache', 'Nausea', 'Photophobia'],
    negative: ['Fever', 'Neck stiffness', 'Vision changes'],
  },
  past_medical_history: [],
  medication_history: ['Paracetamol 650mg occasionally (minimal relief)'],
  clinical_observations: [
    'BP: 120/80 mmHg',
    'Pupillary reflexes normal',
  ],
  assessment: 'Migraine without aura (provisional)',
  plan: [
    'Prescribe Sumatriptan 50mg for acute episodes',
    'Rest in dark room, maintain hydration',
    'Follow up in 2 weeks if symptoms persist',
  ],
};

export default function App() {
  const {
    isRecording,
    audioChunks,
    error: micError,
    startRecording,
    stopRecording,
    clearRecording,
    downloadRecording,
  } = useAudioRecorder();

  const [transcripts, setTranscripts] = useState<TranscriptItem[]>(DUMMY_TRANSCRIPTS);
  const [summary, setSummary] = useState<MedicalSummaryData | null>(DUMMY_SUMMARY);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Compute stats: words from transcript, chunks directly from audio chunk stream
  const wordCount = transcripts.reduce(
    (acc, curr) => acc + (curr.text.trim() ? curr.text.trim().split(/\s+/).length : 0),
    0
  );
  // Real chunk count if recording, or transcript-based if idle with dummy items
  const chunkCount = audioChunks.length;

  const handleClear = () => {
    clearRecording();
    setTranscripts([]);
  };

  const handleProcessTranscript = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setSummary(DUMMY_SUMMARY);
      setIsProcessing(false);
    }, 1000);
  };

  const handleClearSummary = () => setSummary(null);

  const handleCopySummary = () => {
    if (!summary) return;
    const text = `PATIENT: ${summary.patient_details.name} (Age: ${summary.patient_details.age}, Sex: ${summary.patient_details.sex})\nCHIEF COMPLAINT: ${summary.chief_complaint}\nASSESSMENT: ${summary.assessment}\nPLAN: ${summary.plan.join(', ')}`;
    navigator.clipboard.writeText(text);
    alert('Medical summary copied to clipboard!');
  };

  return (
    <div className="min-h-screen w-full bg-slate-100/80 flex flex-col text-slate-900 antialiased">
      <Header />

      {/* Mic Permission / Device Error Banner */}
      {micError && (
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 pt-4">
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
            <span>⚠️ {micError}</span>
          </div>
        </div>
      )}

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 py-6 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Live Transcription Panel */}
          <RecordingPanel
            isRecording={isRecording}
            transcripts={transcripts}
            wordCount={wordCount}
            chunkCount={chunkCount}
            onStart={startRecording}
            onStop={stopRecording}
            onClear={handleClear}
            onSave={() => downloadRecording()}
            onProcess={handleProcessTranscript}
            isProcessing={isProcessing}
          />

          {/* Right: AI Medical Summary */}
          <MedicalSummary
            summary={summary}
            isLoading={isProcessing}
            onClear={handleClearSummary}
            onCopySummary={handleCopySummary}
          />
        </div>
      </main>
    </div>
  );
}