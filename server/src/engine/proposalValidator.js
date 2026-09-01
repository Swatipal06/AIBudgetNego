/**
 * DETERMINISTIC PROPOSAL & CONSTRAINT VALIDATOR
 * 
 * In accordance with Core Architectural Principle 2:
 * "LLMs propose. The backend validates and coordinates."
 * LLMs are never treated as the source of truth for financial rules or constraints.
 */

/**
 * Validates whether a negotiation is feasible before starting.
 * Rule: sum(all minimum budgets) <= total company budget.
 * 
 * @param {number} companyBudget - Total company budget
 * @param {Array<{ name: string, minAcceptableBudget: number, requestedBudget: number }>} departments
 * @returns {{ isFeasible: boolean, totalMinBudget: number, totalRequestedBudget: number, deficit: number, message: string }}
 */
export const checkFeasibility = (companyBudget, departments) => {
  if (!departments || departments.length === 0) {
    return {
      isFeasible: false,
      totalMinBudget: 0,
      totalRequestedBudget: 0,
      deficit: 0,
      message: 'At least one department is required to initiate negotiation.',
    };
  }

  const totalMinBudget = departments.reduce(
    (sum, dept) => sum + (Number(dept.minAcceptableBudget) || 0),
    0
  );
  const totalRequestedBudget = departments.reduce(
    (sum, dept) => sum + (Number(dept.requestedBudget) || 0),
    0
  );

  if (totalMinBudget > companyBudget) {
    const deficit = totalMinBudget - companyBudget;
    return {
      isFeasible: false,
      totalMinBudget,
      totalRequestedBudget,
      deficit,
      message: `Negotiation cannot proceed because the combined minimum requirements (₹${totalMinBudget.toLocaleString('en-IN')}) exceed the available company budget (₹${companyBudget.toLocaleString('en-IN')}) by ₹${deficit.toLocaleString('en-IN')}.`,
    };
  }

  return {
    isFeasible: true,
    totalMinBudget,
    totalRequestedBudget,
    deficit: 0,
    message: 'Budget parameters are feasible for multi-agent negotiation.',
  };
};

/**
 * Deterministically validates an individual department's proposal.
 * 
 * @param {Object} proposal - Agent proposal { proposedAmount, reason, ... }
 * @param {Object} department - Authoritative department configuration
 * @param {number} companyBudget - Total company budget ceiling
 * @returns {{ isValid: boolean, normalizedAmount: number, hardConstraintsSatisfied: boolean, errors: string[] }}
 */
export const validateDepartmentProposal = (proposal, department, companyBudget) => {
  const errors = [];
  let normalizedAmount = Number(proposal.proposedAmount);

  if (isNaN(normalizedAmount) || normalizedAmount < 0) {
    errors.push(`Invalid proposed amount: ${proposal.proposedAmount}`);
    normalizedAmount = department.minAcceptableBudget;
  }

  // Check 1: Hard constraint - Minimum acceptable budget
  let hardConstraintsSatisfied = true;
  if (normalizedAmount < department.minAcceptableBudget) {
    errors.push(
      `Proposed amount (₹${normalizedAmount.toLocaleString('en-IN')}) violates hard constraint minimum budget of ₹${department.minAcceptableBudget.toLocaleString('en-IN')}`
    );
    hardConstraintsSatisfied = false;
    // Backend correction: Clamp to minimum floor
    normalizedAmount = department.minAcceptableBudget;
  }

  // Check 2: Exceeding initial request
  if (normalizedAmount > department.requestedBudget) {
    errors.push(
      `Proposed amount cannot exceed initial requested budget of ₹${department.requestedBudget.toLocaleString('en-IN')}`
    );
    normalizedAmount = department.requestedBudget;
  }

  // Check 3: Exceeding company total budget
  if (normalizedAmount > companyBudget) {
    errors.push(
      `Proposed amount cannot exceed total company budget of ₹${companyBudget.toLocaleString('en-IN')}`
    );
    normalizedAmount = Math.min(normalizedAmount, companyBudget);
  }

  return {
    isValid: errors.length === 0,
    normalizedAmount,
    hardConstraintsSatisfied,
    errors,
  };
};

/**
 * Validates a collective round allocation across all departments.
 * 
 * @param {Array<{ departmentId: string, departmentName: string, proposedAmount: number, minAcceptableBudget: number, requestedBudget: number }>} roundProposals
 * @param {number} companyBudget
 * @returns {{ isAgreement: boolean, totalProposed: number, remainingBudget: number, overBudgetAmount: number, hardConstraintsMet: boolean, issues: string[] }}
 */
export const validateRoundAgreement = (roundProposals, companyBudget) => {
  let totalProposed = 0;
  let hardConstraintsMet = true;
  const issues = [];

  for (const p of roundProposals) {
    totalProposed += p.proposedAmount;
    if (p.proposedAmount < p.minAcceptableBudget) {
      hardConstraintsMet = false;
      issues.push(`${p.departmentName} is below minimum requirement of ₹${p.minAcceptableBudget.toLocaleString('en-IN')}`);
    }
  }

  const remainingBudget = companyBudget - totalProposed;
  const isOverBudget = totalProposed > companyBudget;

  if (isOverBudget) {
    issues.push(
      `Total proposals (₹${totalProposed.toLocaleString('en-IN')}) exceed total company budget (₹${companyBudget.toLocaleString('en-IN')}) by ₹${Math.abs(remainingBudget).toLocaleString('en-IN')}`
    );
  }

  const isAgreement = !isOverBudget && hardConstraintsMet;

  return {
    isAgreement,
    totalProposed,
    remainingBudget,
    overBudgetAmount: isOverBudget ? totalProposed - companyBudget : 0,
    hardConstraintsMet,
    issues,
  };
};

/**
 * Validates and sanitizes a CFO Arbiter decision.
 * 
 * @param {Object} cfoOutput - { decision: { [deptName]: amount }, reason: string }
 * @param {Array<Object>} departments - Authoritative department list
 * @param {number} companyBudget - Total company budget
 * @returns {{ isValid: boolean, sanitizedAllocation: Object, totalAllocated: number, remainingBudget: number, errors: string[] }}
 */
export const validateCfoDecision = (cfoOutput, departments, companyBudget) => {
  const errors = [];
  const sanitizedAllocation = {};
  let totalAllocated = 0;

  if (!cfoOutput || !cfoOutput.decision || typeof cfoOutput.decision !== 'object') {
    errors.push('Malformed CFO decision output');
    // Fallback: Proportional allocation meeting all minimums + remaining distributed by priority
    return fallbackCfoAllocation(departments, companyBudget);
  }

  for (const dept of departments) {
    const rawVal = cfoOutput.decision[dept.name];
    let amount = Number(rawVal);

    if (isNaN(amount) || amount === undefined) {
      errors.push(`Missing or invalid allocation for department '${dept.name}' in CFO output`);
      amount = dept.minAcceptableBudget;
    }

    if (amount < dept.minAcceptableBudget) {
      errors.push(`CFO allocation for ${dept.name} (₹${amount}) was below minimum constraint (₹${dept.minAcceptableBudget}). Deterministically enforced.`);
      amount = dept.minAcceptableBudget;
    }

    if (amount > dept.requestedBudget) {
      amount = dept.requestedBudget;
    }

    sanitizedAllocation[dept.name] = amount;
    totalAllocated += amount;
  }

  // If total allocated exceeds company budget, scale down while preserving min bounds
  if (totalAllocated > companyBudget) {
    errors.push(`CFO allocation total (₹${totalAllocated}) exceeded budget (₹${companyBudget}). Deterministically scaling down.`);
    return fallbackCfoAllocation(departments, companyBudget);
  }

  return {
    isValid: errors.length === 0,
    sanitizedAllocation,
    totalAllocated,
    remainingBudget: companyBudget - totalAllocated,
    errors,
  };
};

/**
 * Deterministic fallback allocation for CFO when LLM output fails or violates budget
 */
export const fallbackCfoAllocation = (departments, companyBudget) => {
  const totalMin = departments.reduce((sum, d) => sum + d.minAcceptableBudget, 0);
  let remaining = companyBudget - totalMin;

  const sanitizedAllocation = {};
  let totalAllocated = 0;

  // 1. Assign all minimum budgets first
  departments.forEach((d) => {
    sanitizedAllocation[d.name] = d.minAcceptableBudget;
    totalAllocated += d.minAcceptableBudget;
  });

  // 2. Distribute remaining budget according to priority weights and requested headroom
  if (remaining > 0) {
    const weights = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    let totalWeight = 0;

    departments.forEach((d) => {
      const headroom = d.requestedBudget - d.minAcceptableBudget;
      if (headroom > 0) {
        totalWeight += (weights[d.priority] || 1);
      }
    });

    if (totalWeight > 0) {
      departments.forEach((d) => {
        const headroom = d.requestedBudget - d.minAcceptableBudget;
        if (headroom > 0) {
          const share = Math.min(
            headroom,
            Math.floor(remaining * ((weights[d.priority] || 1) / totalWeight))
          );
          sanitizedAllocation[d.name] += share;
          totalAllocated += share;
        }
      });
    }
  }

  return {
    isValid: true,
    sanitizedAllocation,
    totalAllocated,
    remainingBudget: companyBudget - totalAllocated,
    errors: ['Generated deterministic fallback allocation satisfying all constraints.'],
  };
};
