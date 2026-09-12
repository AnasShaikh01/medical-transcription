import React from 'react';
import { Mic, Square, Trash2, Save } from 'lucide-react';

interface RecordingControlsProps {
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onSave: () => void;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  onStart,
  onStop,
  onClear,
  onSave,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onStart}
        disabled={isRecording}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer ${
          isRecording
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
        }`}
      >
        <Mic className="w-3.5 h-3.5" />
        <span>Start Mic</span>
      </button>

      <button
        onClick={onStop}
        disabled={!isRecording}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all ${
          !isRecording
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            : 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse cursor-pointer'
        }`}
      >
        <Square className="w-3.5 h-3.5 fill-current" />
        <span>Stop</span>
      </button>

      <button
        onClick={onClear}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-xs cursor-pointer active:scale-95"
      >
        <Trash2 className="w-3.5 h-3.5 text-slate-500" />
        <span>Clear</span>
      </button>

      <button
        onClick={onSave}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-all shadow-xs cursor-pointer active:scale-95"
      >
        <Save className="w-3.5 h-3.5 text-emerald-600" />
        <span>Save Recording</span>
      </button>
    </div>
  );
};