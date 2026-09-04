import React from 'react';

/**
 * BudgetSymbol
 * Abstract enterprise geometric mark representing:
 * DEPARTMENTS → NEGOTIATION → BALANCED BUDGET
 *
 * 3 equal rounded departmental pillars converge at 120° around a central consensus core.
 * Clean, high-contrast, scalable down to 16px. Zero legal/scales or AI clichés.
 */
export function BudgetSymbol({ className = 'w-4 h-4', fill = 'currentColor' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Central balanced budget agreement core */}
      <circle cx="12" cy="12" r="2.8" fill={fill} />
      {/* Department 1: Top */}
      <rect x="9.7" y="2.5" width="4.6" height="5.6" rx="2.3" fill={fill} />
      {/* Department 2: Bottom-Left (120° rotation) */}
      <rect
        x="9.7"
        y="2.5"
        width="4.6"
        height="5.6"
        rx="2.3"
        fill={fill}
        transform="rotate(120 12 12)"
      />
      {/* Department 3: Bottom-Right (240° rotation) */}
      <rect
        x="9.7"
        y="2.5"
        width="4.6"
        height="5.6"
        rx="2.3"
        fill={fill}
        transform="rotate(240 12 12)"
      />
    </svg>
  );
}

/**
 * BudgetLogo
 * Standard horizontal enterprise lockup:
 * [Blue Rounded Square Icon Container] + [Budget Negotiations Wordmark]
 */
export function BudgetLogo({
  size = 'sm', // 'sm' (navbar), 'md' (auth cards), 'lg' (hero)
  showWordmark = true,
  wordmarkClassName = 'text-sm font-semibold text-white tracking-tight',
}) {
  const containerClasses = {
    sm: 'w-7 h-7 rounded-md bg-blue-600',
    md: 'w-10 h-10 rounded-md bg-blue-600',
    lg: 'w-12 h-12 rounded-lg bg-blue-600',
  }[size] || 'w-7 h-7 rounded-md bg-blue-600';

  const iconClasses = {
    sm: 'w-4 h-4 text-white',
    md: 'w-5 h-5 text-white',
    lg: 'w-6 h-6 text-white',
  }[size] || 'w-4 h-4 text-white';

  return (
    <div className="flex items-center space-x-2.5">
      <div className={`${containerClasses} flex items-center justify-center shrink-0 shadow-sm`}>
        <BudgetSymbol className={iconClasses} fill="currentColor" />
      </div>
      {showWordmark && (
        <span className={wordmarkClassName}>
          Budget Negotiations
        </span>
      )}
    </div>
  );
}

export default BudgetLogo;
