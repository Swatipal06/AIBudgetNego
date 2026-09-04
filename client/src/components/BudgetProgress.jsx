import React from 'react';

export const BudgetProgress = ({ companyBudget, totalAllocated, currency = 'INR' }) => {
  const allocated = Number(totalAllocated) || 0;
  const budget = Number(companyBudget) || 1;
  const percentage = Math.min(100, Math.round((allocated / budget) * 100));
  const isOver = allocated > budget;
  const remaining = budget - allocated;

  const formatCurrency = (val) => `₹${Number(val).toLocaleString('en-IN')}`;

  return (
    <div className="bg-[#111827] border border-[#1f293d] rounded-lg p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
        <div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Budget Utilization
          </span>
          <div className="flex items-baseline space-x-2 mt-0.5">
            <span className="text-xl font-semibold text-white font-mono">
              {formatCurrency(allocated)}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              of {formatCurrency(budget)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded border ${
              isOver
                ? 'bg-red-950/40 text-red-300 border-red-800/50'
                : remaining === 0
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
            }`}
          >
            {isOver
              ? `Deficit: ${formatCurrency(allocated - budget)}`
              : `Remaining: ${formatCurrency(remaining)}`}
          </span>
          <span className="text-xs font-mono text-slate-400">
            {percentage}% allocated
          </span>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full bg-[#0b0f17] h-2 rounded-full overflow-hidden border border-[#1f293d]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isOver
              ? 'bg-red-500'
              : percentage >= 90
              ? 'bg-emerald-500'
              : 'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default BudgetProgress;

