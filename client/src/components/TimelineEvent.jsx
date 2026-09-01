import React from 'react';
import {
  MessageSquare,
  TrendingDown,
  Sparkles,
  CheckCircle2,
  AlertOctagon,
  ShieldCheck,
  Building,
} from 'lucide-react';

export const TimelineEvent = ({ event }) => {
  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const getEventStyle = () => {
    switch (event.eventType) {
      case 'CONCESSION':
        return {
          icon: <TrendingDown className="w-4 h-4 text-amber-400" />,
          badge: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
          border: 'border-amber-500/40',
        };
      case 'AGREEMENT_REACHED':
      case 'ALLOCATION_APPROVED':
      case 'NEGOTIATION_FINALIZED':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
          border: 'border-emerald-500/40',
        };
      case 'DEADLOCK':
      case 'CFO_DECISION':
        return {
          icon: <Sparkles className="w-4 h-4 text-purple-400" />,
          badge: 'bg-purple-950/80 text-purple-300 border-purple-800/60',
          border: 'border-purple-500/40',
        };
      case 'NEGOTIATION_FAILED':
      case 'ALLOCATION_REJECTED':
        return {
          icon: <AlertOctagon className="w-4 h-4 text-red-400" />,
          badge: 'bg-red-950/80 text-red-300 border-red-800/60',
          border: 'border-red-500/40',
        };
      default:
        return {
          icon: <MessageSquare className="w-4 h-4 text-indigo-400" />,
          badge: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60',
          border: 'border-slate-800',
        };
    }
  };

  const style = getEventStyle();

  return (
    <div
      className={`bg-slate-950/70 border ${style.border} rounded-xl p-3.5 transition-all shadow-sm`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg bg-slate-900">{style.icon}</div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${style.badge}`}
          >
            {event.eventType.replace(/_/g, ' ')}
          </span>
          {event.departmentName && (
            <span className="text-xs font-semibold text-slate-200">
              {event.departmentName}
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          {new Date(event.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <p className="text-xs text-slate-300 font-sans leading-relaxed">
        {event.message}
      </p>

      {event.details?.proposedAmount && (
        <div className="mt-2 flex items-center gap-3 text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
          <span>
            Offer: <strong className="text-brand-300">{formatCurrency(event.details.proposedAmount)}</strong>
          </span>
          {event.details.utility !== undefined && (
            <span>
              Utility: <strong className="text-slate-200">{event.details.utility}%</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TimelineEvent;
