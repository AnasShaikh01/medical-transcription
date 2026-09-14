import { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { RecordingPanel } from './components/RecordingPanel';
import { MedicalSummary } from './components/MedicalSummary';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useTranscription } from './hooks/useTranscription';
import { extractMedicalSummary, normalizeMedicalTranscript } from './services/api';
import type { TranscriptItem } from './types/transcript';
import type { MedicalSummaryData } from './types/medical';
import { Activity, Radio, FileQuestion } from 'lucide-react';

const DEMO_TRANSCRIPT_ITEMS: TranscriptItem[] = [
  {
    id: 'demo-1',
    speaker: 'Doctor',
    text: 'Good morning John. You are a 32-year-old male, correct?',
    timestamp: '10:00 AM',
  },
  {
    id: 'demo-2',
    speaker: 'Patient',
    text: "Yes. I've been having a severe throbbing headache on the right side of my head for the past three days.",
    timestamp: '10:01 AM',
  },
  {
    id: 'demo-3',
    speaker: 'Doctor',
    text: 'Are you having any nausea, fever, neck stiffness, or sensitivity to light?',
    timestamp: '10:01 AM',
  },
  {
    id: 'demo-4',
    speaker: 'Patient',
    text: 'Yes, I feel nauseous and bright light hurts my eyes. But definitely no fever and no neck stiffness.',
    timestamp: '10:02 AM',
  },
  {
    id: 'demo-5',
    speaker: 'Doctor',
    text: 'Your blood pressure is 122 over 80 and neurological exam is normal. Are you currently taking any medications?',
    timestamp: '10:03 AM',
  },
  {
    id: 'demo-6',
    speaker: 'Patient',
    text: 'I took Paracetamol 650mg twice yesterday, but it did not provide much relief. I have no known drug allergies.',
    timestamp: '10:03 AM',
  },
  {
    id: 'demo-7',
    speaker: 'Doctor',
    text: 'Assessment is acute migraine without aura. I will prescribe Sumatriptan 50mg for acute episodes. Rest in a dark quiet room, maintain hydration, and follow up in two weeks if symptoms persist.',
    timestamp: '10:04 AM',
  },
];

export default function App() {
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [summary, setSummary] = useState<MedicalSummaryData | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Live Whisper transcript callback
  const handleNewTranscript = useCallback((text: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newItem: TranscriptItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      speaker: 'Live Transcript',
      text,
      timestamp: timeStr,
    };

    setTranscripts((prev) => [...prev, newItem]);
  }, []);

  const {
    isConnected,
    totalChunks,
    speechChunks,
    isSpeechDetected,
    speechProbability,
    connect,
    sendAudioChunk,
    sendControlMessage,
    disconnect,
  } = useTranscription(handleNewTranscript);

  const handlePCMChunk = useCallback(
    (chunk: Float32Array) => {
      sendAudioChunk(chunk);
    },
    [sendAudioChunk]
  );

  const {
    isRecording,
    audioChunks,
    error: micError,
    startRecording,
    stopRecording,
    clearRecording,
    downloadRecording,
  } = useAudioRecorder(handlePCMChunk);

  const wordCount = transcripts.reduce(
    (acc, curr) => acc + (curr.text.trim() ? curr.text.trim().split(/\s+/).length : 0),
    0
  );
  const chunkCount = totalChunks > 0 ? totalChunks : audioChunks.length;

  const handleStart = async () => {
    try {
      await connect();
      await startRecording();
    } catch (err) {
      console.error('Failed to start recording session:', err);
    }
  };

  const handleStop = async () => {
    await stopRecording();
    sendControlMessage({ action: 'finalize' });
    setTimeout(() => {
      disconnect();
    }, 600);
  };

  const handleClear = async () => {
    await clearRecording();
    disconnect();
    setTranscripts([]);
    setSummary(null);
  };

  const handleLoadDemo = () => {
    setTranscripts(DEMO_TRANSCRIPT_ITEMS);
  };

  // Phase 6: Trigger Groq clinical extraction
  // Two-tier processing: Normalization -> Clinical Schema Extraction
  const handleProcessTranscript = async () => {
    if (transcripts.length === 0) {
      alert('Transcript is empty. Record consultation audio or click "Load Demo Consultation" first.');
      return;
    }

    setSummary(null);
    setIsProcessing(true);

    try {
      const rawTranscript = transcripts
        .map((item) => `${item.speaker}: ${item.text}`)
        .join('\n');

      // Step 1: Fix phonetic and ASR domain errors via constrained LLM normalizer
      const normalizedTranscript = await normalizeMedicalTranscript(rawTranscript);

      console.log('--- [PIPELINE AUDIT] ---');
      console.log('RAW TRANSCRIPT:\n', rawTranscript);
      console.log('NORMALIZED TRANSCRIPT:\n', normalizedTranscript);

      // Step 2: Extract medical data using structured Pydantic schema
      const extractedData = await extractMedicalSummary(normalizedTranscript);
      setSummary(extractedData);
    } catch (error) {
      console.error('Medical processing failed:', error);
      alert('Failed to process consultation. Please verify backend server status and GROQ_API_KEY.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearSummary = () => setSummary(null);

  const handleCopySummary = () => {
    if (!summary) return;
    const text = `PATIENT: ${summary.patient_details.name} (Age: ${summary.patient_details.age}, Sex: ${summary.patient_details.sex})\nCHIEF COMPLAINT: ${summary.chief_complaint}\nHPI: ${summary.history_of_present_illness}\nPOSITIVE SYMPTOMS: ${summary.symptoms.positive.join(', ')}\nPERTINENT NEGATIVES: ${summary.symptoms.negative.join(', ')}\nMEDICATIONS: ${summary.medication_history.join(', ')}\nASSESSMENT: ${summary.assessment}\nPLAN: ${summary.plan.join(', ')}`;
    navigator.clipboard.writeText(text);
    alert('Medical summary copied to clipboard!');
  };

  return (
    <div className="min-h-screen w-full bg-slate-100/80 flex flex-col text-slate-900 antialiased">
      <Header />

      {/* Mic Permission / Device Error Banner */}
      {micError && (
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 pt-4">
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between shadow-xs">
            <span>⚠️ {micError}</span>
          </div>
        </div>
      )}

      {/* Real-time Silero VAD Telemetry Banner */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-white border border-slate-200/90 px-4 py-2 rounded-xl shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Connection status */}
            <div className="flex items-center gap-1.5 font-medium">
              <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
              <span>WebSocket:</span>
              <strong className={isConnected ? 'text-emerald-600 font-semibold' : 'text-slate-500'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </strong>
            </div>

            <span className="text-slate-200">|</span>

            {/* VAD status indicator */}
            <div className="flex items-center gap-1.5 font-medium">
              <Activity className={`w-3.5 h-3.5 ${isSpeechDetected ? 'text-indigo-600 animate-bounce' : 'text-slate-400'}`} />
              <span>Silero VAD:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  isSpeechDetected
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {isSpeechDetected ? 'SPEECH DETECTED' : 'SILENCE / NOISE'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                ({Math.round(speechProbability * 100)}%)
              </span>
            </div>

            <span className="text-slate-200">|</span>

            {/* Chunks Statistics */}
            <div className="flex items-center gap-2 text-[11px] text-slate-600">
              <span>
                Total: <strong className="font-mono text-slate-900">{totalChunks}</strong>
              </span>
              <span>•</span>
              <span>
                Speech: <strong className="font-mono text-emerald-600">{speechChunks}</strong>
              </span>
            </div>
          </div>

          {/* Quick Demo Loader */}
          <button
            onClick={handleLoadDemo}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
          >
            <FileQuestion className="w-3.5 h-3.5" />
            <span>Load Demo Consultation</span>
          </button>
        </div>
      </div>

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 py-5 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Live Transcription Panel */}
          <RecordingPanel
            isRecording={isRecording}
            transcripts={transcripts}
            wordCount={wordCount}
            chunkCount={chunkCount}
            onStart={handleStart}
            onStop={handleStop}
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