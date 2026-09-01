import React from 'react';

const statusConfig = {
  PENDING: {
    label: 'PENDING',
    bg: 'bg-slate-800 text-slate-300 border-slate-700',
    dot: 'bg-slate-400',
  },
  RUNNING: {
    label: 'RUNNING',
    bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60',
    dot: 'bg-indigo-400 animate-ping',
  },
  SETTLED: {
    label: 'SETTLED (CONSENSUS)',
    bg: 'bg-teal-950/80 text-teal-300 border-teal-700/60',
    dot: 'bg-teal-400',
  },
  DEADLOCK: {
    label: 'DEADLOCK (CFO ARBITRATED)',
    bg: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
    dot: 'bg-purple-400',
  },
  AWAITING_APPROVAL: {
    label: 'AWAITING ADMIN APPROVAL',
    bg: 'bg-amber-950/90 text-amber-300 border-amber-600/70 shadow-lg shadow-amber-950/50',
    dot: 'bg-amber-400 animate-pulse',
  },
  FINALIZED: {
    label: 'FINALIZED & BINDING',
    bg: 'bg-emerald-950/90 text-emerald-300 border-emerald-600/70 shadow-lg shadow-emerald-950/50',
    dot: 'bg-emerald-400',
  },
  CANCELLED: {
    label: 'CANCELLED',
    bg: 'bg-slate-900 text-slate-400 border-slate-800',
    dot: 'bg-slate-500',
  },
  FAILED: {
    label: 'FAILED',
    bg: 'bg-red-950/80 text-red-300 border-red-700/60',
    dot: 'bg-red-400',
  },
};

export const StatusBadge = ({ status, className = '' }) => {
  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border transition-all ${config.bg} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
