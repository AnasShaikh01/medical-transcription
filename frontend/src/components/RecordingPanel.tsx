import React from 'react';
import { Mic, Sparkles } from 'lucide-react';
import { RecordingControls } from './RecordingControls';
import { TranscriptStatus } from './TranscriptStatus';
import { TranscriptPanel } from './TranscriptPanel';
import type { TranscriptItem } from '../types/transcript';

interface RecordingPanelProps {
  isRecording: boolean;
  transcripts: TranscriptItem[];
  wordCount: number;
  chunkCount: number;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onSave: () => void;
  onProcess: () => void;
  isProcessing: boolean;
}

export const RecordingPanel: React.FC<RecordingPanelProps> = ({
  isRecording,
  transcripts,
  wordCount,
  chunkCount,
  onStart,
  onStop,
  onClear,
  onSave,
  onProcess,
  isProcessing,
}) => {
  return (
    <section className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xs p-5 md:p-6 space-y-4">
      {/* Panel Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
          <Mic className="w-5 h-5" />
        </div>
        <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
          Live Medical Transcription
        </h2>
      </div>

      {/* Action Controls */}
      <RecordingControls
        isRecording={isRecording}
        onStart={onStart}
        onStop={onStop}
        onClear={onClear}
        onSave={onSave}
      />

      {/* Word/Chunk Counts & Status */}
      <TranscriptStatus
        isRecording={isRecording}
        wordCount={wordCount}
        chunkCount={chunkCount}
      />

      {/* Live Transcript Stream Panel */}
      <TranscriptPanel transcripts={transcripts} />

      {/* AI Extraction Trigger */}
      <button
        onClick={onProcess}
        disabled={isProcessing || transcripts.length === 0}
        className={`w-full py-3 px-4 rounded-xl font-semibold text-xs md:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
          isProcessing || transcripts.length === 0
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-200 active:scale-[0.99]'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span>{isProcessing ? 'Extracting Medical Information...' : 'Process Transcript with AI'}</span>
      </button>
    </section>
  );
};