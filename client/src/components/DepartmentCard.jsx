import React from 'react';
import {
  ShieldAlert,
  Sliders,
  TrendingDown,
  Activity,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const DepartmentCard = ({
  department,
  currentProposal,
  isWinner,
}) => {
  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const currentAmount = currentProposal ? currentProposal.proposedAmount : department.requestedBudget;
  const utility = currentProposal ? currentProposal.utility : 100;
  const concessionAmount = currentProposal ? currentProposal.concessionAmount || 0 : 0;

  const getPriorityColor = (p) => {
    switch (p?.toUpperCase()) {
      case 'HIGH':
        return 'bg-rose-950/80 text-rose-300 border-rose-800/60';
      case 'MEDIUM':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
      default:
        return 'bg-blue-950/80 text-blue-300 border-blue-800/60';
    }
  };

  return (
    <div
      className="glass-panel rounded-2xl p-5 border-slate-800 hover:border-slate-700 transition-all shadow-xl relative overflow-hidden flex flex-col justify-between"
      style={{ borderTop: `4px solid ${department.color || '#3b82f6'}` }}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: department.color || '#3b82f6' }}
            />
            {department.name}
          </h4>
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getPriorityColor(
                department.priority
              )}`}
            >
              {department.priority}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {department.strategy}
            </span>
          </div>
        </div>

        {department.description && (
          <p className="text-xs text-slate-400 mb-3 line-clamp-2">
            {department.description}
          </p>
        )}

        {/* Financial Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
              Requested
            </span>
            <span className="text-sm font-bold text-slate-200 font-mono">
              {formatCurrency(department.requestedBudget)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wider block flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Minimum Floor
            </span>
            <span className="text-sm font-bold text-amber-300 font-mono">
              {formatCurrency(department.minAcceptableBudget)}
            </span>
          </div>
        </div>

        {/* Current Round Proposal */}
        <div className="mt-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-slate-400">Current Offer:</span>
            <span className="text-base font-extrabold text-brand-300 font-mono">
              {formatCurrency(currentAmount)}
            </span>
          </div>

          {concessionAmount > 0 && (
            <div className="flex items-center space-x-1 text-[11px] text-amber-400 mt-0.5">
              <TrendingDown className="w-3 h-3" />
              <span>Conceded {formatCurrency(concessionAmount)}</span>
            </div>
          )}

          {currentProposal?.reason && (
            <div className="mt-2 text-xs italic text-slate-300 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
              "{currentProposal.reason}"
            </div>
          )}
        </div>
      </div>

      {/* Utility & Constraints Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        {/* Utility Score Gauge */}
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-indigo-400" /> Utility Score:
          </span>
          <span className="font-bold text-slate-200 font-mono">
            {utility} / 100
          </span>
        </div>
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              utility >= 80
                ? 'bg-emerald-400'
                : utility >= 50
                ? 'bg-indigo-400'
                : 'bg-rose-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, utility))}%` }}
          />
        </div>

        {/* Hard Constraints Pill */}
        {department.hardConstraints && department.hardConstraints.length > 0 && (
          <div className="mt-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
              Hard Constraints ({department.hardConstraints.length}):
            </span>
            <div className="space-y-1">
              {department.hardConstraints.map((c, i) => (
                <div
                  key={i}
                  className="text-[10px] text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800 flex items-start gap-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="truncate">{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentCard;
