import React from 'react';
import {
  TrendingDown,
  Activity,
  Check,
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

  return (
    <div
      className="bg-[#111827] border border-[#1f293d] rounded-lg p-4 flex flex-col justify-between"
      style={{ borderTop: `3px solid ${department.color || '#3b82f6'}` }}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: department.color || '#3b82f6' }}
            />
            <h4 className="text-sm font-semibold text-white">
              {department.name}
            </h4>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-300 bg-[#162032] border border-[#243048]">
              {department.priority}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-400 bg-[#0d131f] border border-[#1f293d]">
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
        <div className="grid grid-cols-2 gap-2 my-2.5 p-2.5 bg-[#0b0f17] rounded-md border border-[#1f293d]">
          <div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
              Requested
            </span>
            <span className="text-xs font-semibold text-slate-200 font-mono">
              {formatCurrency(department.requestedBudget)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
              Min Floor
            </span>
            <span className="text-xs font-semibold text-amber-300/90 font-mono">
              {formatCurrency(department.minAcceptableBudget)}
            </span>
          </div>
        </div>

        {/* Current Round Proposal */}
        <div className="mt-2.5 pt-2.5 border-t border-[#1f293d]">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-slate-400">Current Offer:</span>
            <span className="text-sm font-bold text-white font-mono">
              {formatCurrency(currentAmount)}
            </span>
          </div>

          {concessionAmount > 0 && (
            <div className="flex items-center space-x-1 text-[11px] text-amber-400/90 mt-0.5">
              <TrendingDown className="w-3 h-3" />
              <span>Conceded {formatCurrency(concessionAmount)}</span>
            </div>
          )}

          {currentProposal?.reason && (
            <div className="mt-2 text-[11px] text-slate-400 bg-[#0b0f17] p-2 rounded border border-[#1f293d] italic leading-relaxed">
              "{currentProposal.reason}"
            </div>
          )}
        </div>
      </div>

      {/* Utility & Constraints Footer */}
      <div className="mt-3 pt-2.5 border-t border-[#1f293d]">
        {/* Utility Score Gauge */}
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400 text-[11px]">Utility:</span>
          <span className="font-semibold text-slate-300 font-mono text-xs">
            {utility}%
          </span>
        </div>
        <div className="w-full bg-[#0b0f17] h-1.5 rounded-full overflow-hidden border border-[#1f293d]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              utility >= 80
                ? 'bg-emerald-500'
                : utility >= 50
                ? 'bg-blue-500'
                : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, utility))}%` }}
          />
        </div>

        {/* Hard Constraints */}
        {department.hardConstraints && department.hardConstraints.length > 0 && (
          <div className="mt-2.5">
            <span className="text-[10px] uppercase font-medium text-slate-400 tracking-wider block mb-1">
              Constraints ({department.hardConstraints.length}):
            </span>
            <div className="space-y-1">
              {department.hardConstraints.map((c, i) => (
                <div
                  key={i}
                  className="text-[10px] text-slate-400 bg-[#0b0f17] px-2 py-0.5 rounded border border-[#1f293d] flex items-center gap-1.5"
                >
                  <span className="w-1 h-1 rounded-full bg-slate-500 shrink-0" />
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

