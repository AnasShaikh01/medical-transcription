import React from 'react';
import { FileText, Layers, Edit3 } from 'lucide-react';

interface TranscriptStatusProps {
  isRecording: boolean;
  wordCount: number;
  chunkCount: number;
}

export const TranscriptStatus: React.FC<TranscriptStatusProps> = ({
  isRecording,
  wordCount,
  chunkCount,
}) => {
  return (
    <div className="space-y-3">
      {/* Counters and Recording Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold tracking-wider uppercase border border-slate-200/80">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>WORDS: {wordCount}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold tracking-wider uppercase border border-slate-200/80">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>CHUNKS: {chunkCount}</span>
          </div>
        </div>

        {/* State Indicator */}
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isRecording ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
            }`}
          />
          <span className={isRecording ? 'text-rose-600' : 'text-slate-600'}>
            {isRecording ? 'Recording Live...' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Info helper banner */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500 leading-relaxed font-normal">
        <Edit3 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>Ready — click Start Mic and speak naturally. VAD will auto-chunk your speech.</span>
      </div>
    </div>
  );
};