import React from 'react';

interface SummarySectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const SummarySection: React.FC<SummarySectionProps> = ({
  title,
  icon,
  children,
}) => {
  return (
    <div className="space-y-2 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
        {icon && <span className="text-slate-400">{icon}</span>}
        <span>{title}</span>
      </div>
      <div className="text-xs text-slate-700 pl-1">{children}</div>
    </div>
  );
};