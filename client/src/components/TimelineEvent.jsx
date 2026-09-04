import React from 'react';
import {
  TrendingDown,
  CheckCircle,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

export const TimelineEvent = ({ event }) => {
  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const getEventBadge = () => {
    switch (event.eventType) {
      case 'CONCESSION':
        return {
          dot: 'bg-amber-400',
          badge: 'bg-amber-950/40 text-amber-300 border-amber-800/50',
        };
      case 'AGREEMENT_REACHED':
      case 'ALLOCATION_APPROVED':
      case 'NEGOTIATION_FINALIZED':
        return {
          dot: 'bg-emerald-400',
          badge: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50',
        };
      case 'DEADLOCK':
      case 'CFO_DECISION':
        return {
          dot: 'bg-amber-400',
          badge: 'bg-amber-950/40 text-amber-300 border-amber-800/50',
        };
      case 'NEGOTIATION_FAILED':
      case 'ALLOCATION_REJECTED':
        return {
          dot: 'bg-red-400',
          badge: 'bg-red-950/40 text-red-300 border-red-800/50',
        };
      default:
        return {
          dot: 'bg-blue-400',
          badge: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
        };
    }
  };

  const style = getEventBadge();

  return (
    <div className="bg-[#0e1420] border border-[#1f293d] rounded-lg p-3 transition-colors hover:border-[#2a3752]">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center space-x-2">
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${style.badge}`}
          >
            {event.eventType.replace(/_/g, ' ')}
          </span>
          {event.departmentName && (
            <span className="text-xs font-semibold text-slate-200">
              {event.departmentName}
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          {new Date(event.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <p className="text-xs text-slate-300 font-sans leading-relaxed">
        {event.message}
      </p>

      {event.details?.proposedAmount && (
        <div className="mt-2 flex items-center gap-4 text-xs font-mono text-slate-400 bg-[#090d16] px-2.5 py-1.5 rounded border border-[#1f293d]">
          <span>
            Proposal: <strong className="text-slate-100">{formatCurrency(event.details.proposedAmount)}</strong>
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

