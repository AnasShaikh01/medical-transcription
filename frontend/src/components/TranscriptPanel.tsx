import React from 'react';
import type { TranscriptItem } from '../types/transcript';
import { User, Activity, Info } from 'lucide-react';

interface TranscriptPanelProps {
  transcripts: TranscriptItem[];
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({ transcripts }) => {
  if (transcripts.length === 0) {
    return (
      <div className="flex-1 min-h-[340px] flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-xs">
        <p>No speech detected yet. Start mic and begin speaking.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-[340px] max-h-[480px] overflow-y-auto p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3.5">
      {transcripts.map((item) => {
        const isDoctor = item.speaker === 'Doctor';
        const isPatient = item.speaker === 'Patient';

        return (
          <div
            key={item.id}
            className={`flex flex-col p-3 rounded-xl border text-xs leading-relaxed transition-all ${
              isDoctor
                ? 'bg-indigo-50/60 border-indigo-100 text-slate-800'
                : isPatient
                ? 'bg-emerald-50/60 border-emerald-100 text-slate-800'
                : 'bg-white border-slate-200 text-slate-500 italic'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 font-bold tracking-tight">
                {isDoctor && <Activity className="w-3.5 h-3.5 text-indigo-600" />}
                {isPatient && <User className="w-3.5 h-3.5 text-emerald-600" />}
                {!isDoctor && !isPatient && <Info className="w-3.5 h-3.5 text-slate-400" />}
                <span className={isDoctor ? 'text-indigo-700' : isPatient ? 'text-emerald-700' : 'text-slate-500'}>
                  {item.speaker}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{item.timestamp}</span>
            </div>
            <p className="text-slate-700 font-normal">{item.text}</p>
          </div>
        );
      })}
    </div>
  );
};