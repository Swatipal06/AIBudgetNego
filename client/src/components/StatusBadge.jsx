import React from 'react';

const statusConfig = {
  PENDING: {
    label: 'Pending',
    dot: 'bg-slate-400',
    text: 'text-slate-300',
    bg: 'bg-slate-800/60 border-slate-700/60',
  },
  RUNNING: {
    label: 'Running',
    dot: 'bg-blue-400 animate-pulse',
    text: 'text-blue-300',
    bg: 'bg-blue-950/40 border-blue-800/50',
  },
  SETTLED: {
    label: 'Settled (Consensus)',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
    bg: 'bg-emerald-950/40 border-emerald-800/50',
  },
  DEADLOCK: {
    label: 'Arbitrated',
    dot: 'bg-amber-400',
    text: 'text-amber-300',
    bg: 'bg-amber-950/40 border-amber-800/50',
  },
  AWAITING_APPROVAL: {
    label: 'Awaiting approval',
    dot: 'bg-amber-400',
    text: 'text-amber-300',
    bg: 'bg-amber-950/40 border-amber-800/50',
  },
  FINALIZED: {
    label: 'Approved',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
    bg: 'bg-emerald-950/40 border-emerald-800/50',
  },
  CANCELLED: {
    label: 'Cancelled',
    dot: 'bg-slate-500',
    text: 'text-slate-400',
    bg: 'bg-slate-900 border-slate-800',
  },
  FAILED: {
    label: 'Failed',
    dot: 'bg-red-400',
    text: 'text-red-300',
    bg: 'bg-red-950/40 border-red-800/50',
  },
};

export const StatusBadge = ({ status, className = '' }) => {
  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${config.bg} ${config.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;

