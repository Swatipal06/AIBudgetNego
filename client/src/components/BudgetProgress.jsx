import React from 'react';

export const BudgetProgress = ({ companyBudget, totalAllocated, currency = 'INR' }) => {
  const allocated = Number(totalAllocated) || 0;
  const budget = Number(companyBudget) || 1;
  const percentage = Math.min(100, Math.round((allocated / budget) * 100));
  const isOver = allocated > budget;
  const remaining = budget - allocated;

  const formatCurrency = (val) => {
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Company Budget Utilization
          </span>
          <div className="flex items-baseline space-x-2 mt-0.5">
            <span className="text-2xl font-extrabold text-white font-mono">
              {formatCurrency(allocated)}
            </span>
            <span className="text-sm text-slate-400 font-mono">
              / {formatCurrency(budget)}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span
            className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${
              isOver
                ? 'bg-red-950/80 text-red-300 border-red-700/60'
                : remaining === 0
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                : 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60'
            }`}
          >
            {isOver
              ? `Deficit: ${formatCurrency(allocated - budget)}`
              : `Remaining Surplus: ${formatCurrency(remaining)}`}
          </span>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {percentage}% of Ceiling Allocated
          </div>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isOver
              ? 'bg-gradient-to-r from-red-600 to-rose-500'
              : percentage >= 90
              ? 'bg-gradient-to-r from-teal-500 to-emerald-400'
              : 'bg-gradient-to-r from-indigo-500 to-brand-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default BudgetProgress;
