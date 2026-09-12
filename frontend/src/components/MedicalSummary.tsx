import React from 'react';
import type { MedicalSummaryData } from '../types/medical';
import { 
  Hourglass, 
  X, 
  FileText, 
  Activity, 
  AlertCircle, 
  ClipboardList, 
  Pill, 
  Clock, 
  Copy, 
  MessageSquare,
  Stethoscope
} from 'lucide-react';
import { SummarySection } from './SummarySection';
import { LoadingState } from './LoadingState';

interface MedicalSummaryProps {
  summary: MedicalSummaryData | null;
  isLoading: boolean;
  onClear: () => void;
  onCopySummary: () => void;
}

export const MedicalSummary: React.FC<MedicalSummaryProps> = ({
  summary,
  isLoading,
  onClear,
  onCopySummary,
}) => {
  return (
    <section className="relative flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Hourglass className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            AI Medical Summary
          </h2>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-5">
        {isLoading ? (
          <LoadingState message="Extracting clinical observations & structured diagnosis..." />
        ) : !summary ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Stethoscope className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">No medical summary generated</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              Record a consultation and click "Process Transcript with AI" to generate structured clinical data.
            </p>
          </div>
        ) : (
          <>
            {/* Patient Details Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center sm:text-left">
              <h3 className="text-sm font-bold text-slate-900">
                Patient Name: {summary.patient_details.name || 'Not mentioned'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Age: {summary.patient_details.age || 'Not mentioned'} &nbsp;|&nbsp; Sex: {summary.patient_details.sex || 'Not mentioned'}
              </p>
            </div>

            {/* Chief Complaint */}
            <SummarySection title="Chief Complaint" icon={<Activity className="w-3.5 h-3.5" />}>
              <p className="font-medium text-slate-900">{summary.chief_complaint}</p>
            </SummarySection>

            {/* History of Present Illness */}
            <SummarySection title="History of Present Illness" icon={<Clock className="w-3.5 h-3.5" />}>
              <p className="leading-relaxed text-slate-700">{summary.history_of_present_illness}</p>
            </SummarySection>

            {/* Symptoms */}
            <SummarySection title="Symptoms" icon={<ClipboardList className="w-3.5 h-3.5" />}>
              <div className="space-y-1.5">
                {summary.symptoms.positive.length > 0 && (
                  <div>
                    <span className="font-semibold text-emerald-700">Reported (Positive): </span>
                    <span className="text-slate-800">{summary.symptoms.positive.join(', ')}</span>
                  </div>
                )}
                {summary.symptoms.negative.length > 0 && (
                  <div>
                    <span className="font-semibold text-rose-700">Denies (Negative): </span>
                    <span className="text-slate-800">{summary.symptoms.negative.join(', ')}</span>
                  </div>
                )}
              </div>
            </SummarySection>

            {/* Past Medical History */}
            <SummarySection title="Past Medical History" icon={<Clock className="w-3.5 h-3.5" />}>
              {summary.past_medical_history.length > 0 ? (
                <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                  {summary.past_medical_history.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">Not mentioned</p>
              )}
            </SummarySection>

            {/* Medication History */}
            <SummarySection title="Medication History" icon={<Pill className="w-3.5 h-3.5" />}>
              {summary.medication_history.length > 0 ? (
                <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                  {summary.medication_history.map((med, idx) => (
                    <li key={idx}>{med}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">Not mentioned</p>
              )}
            </SummarySection>

            {/* Clinical Observations */}
            <SummarySection title="Clinical Observations" icon={<FileText className="w-3.5 h-3.5" />}>
              {summary.clinical_observations.length > 0 ? (
                <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                  {summary.clinical_observations.map((obs, idx) => (
                    <li key={idx}>{obs}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">Not mentioned</p>
              )}
            </SummarySection>

            {/* Assessment */}
            <SummarySection title="Assessment" icon={<AlertCircle className="w-3.5 h-3.5" />}>
              <p className="font-medium text-indigo-950 bg-indigo-50/70 p-3 rounded-lg border border-indigo-100">
                {summary.assessment}
              </p>
            </SummarySection>

            {/* Plan */}
            <SummarySection title="Plan" icon={<ClipboardList className="w-3.5 h-3.5" />}>
              {summary.plan.length > 0 ? (
                <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                  {summary.plan.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">Not mentioned</p>
              )}
            </SummarySection>
          </>
        )}
      </div>

      {/* Footer Controls */}
      <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
        <button
          onClick={onCopySummary}
          disabled={!summary}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs md:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
            !summary
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-200 active:scale-[0.99]'
          }`}
        >
          <Copy className="w-4 h-4" />
          <span>Copy Summary</span>
        </button>

        <button 
          title="Clinical Assistant"
          className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 shrink-0 cursor-pointer"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};