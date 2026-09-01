/**
 * DETERMINISTIC UTILITY CALCULATOR
 * 
 * In accordance with Core Architectural Rule 6:
 * Utilities are strictly calculated on the backend.
 * LLMs are never permitted to determine authoritative utility.
 * 
 * Mathematical Formulation:
 * For each department i:
 * - B_req  : Requested Budget
 * - B_min  : Minimum Acceptable Budget (Hard Constraint threshold)
 * - B_alloc: Allocated/Proposed Budget
 * 
 * 1. Hard Threshold Rule:
 *    If B_alloc < B_min: Utility U_i = 0 (Violates hard constraint)
 * 
 * 2. Full Satisfaction Rule:
 *    If B_alloc >= B_req: Utility U_i = 100
 * 
 * 3. In-Range Satisfaction (B_min <= B_alloc < B_req):
 *    baseRatio = (B_alloc - B_min) / (B_req - B_min)
 *    U_i = 50 + (50 * baseRatio)
 *    (Ensures meeting the minimum acceptable floor yields 50 utility, scaling to 100)
 * 
 * 4. Priority Weightings for Global Corporate Utility:
 *    - HIGH   : w = 1.3
 *    - MEDIUM : w = 1.0
 *    - LOW    : w = 0.7
 * 
 * Global Corporate Utility = sum(w_i * U_i) / sum(w_i)
 */

export const PRIORITY_WEIGHTS = {
  HIGH: 1.3,
  MEDIUM: 1.0,
  LOW: 0.7,
};

/**
 * Calculates deterministic utility score for a single department allocation
 * @param {number} proposedAmount - Allocated or proposed amount
 * @param {number} requestedBudget - Original requested budget
 * @param {number} minAcceptableBudget - Hard constraint minimum budget
 * @returns {number} Utility score between 0 and 100 rounded to 2 decimals
 */
export const calculateDepartmentUtility = (
  proposedAmount,
  requestedBudget,
  minAcceptableBudget
) => {
  if (proposedAmount < minAcceptableBudget) {
    return 0; // Hard constraint broken
  }

  if (proposedAmount >= requestedBudget) {
    return 100;
  }

  const range = requestedBudget - minAcceptableBudget;
  if (range <= 0) {
    return 100;
  }

  const achievedAboveMin = proposedAmount - minAcceptableBudget;
  const ratio = achievedAboveMin / range;

  // Scale from 50 (at min acceptable) to 100 (at requested)
  const utility = 50 + ratio * 50;
  return Math.round(utility * 100) / 100;
};

/**
 * Calculates weighted company-wide utility across all participating departments
 * @param {Array<{ proposedAmount: number, requestedBudget: number, minAcceptableBudget: number, priority: string }>} departmentData 
 * @returns {number} Global utility score between 0 and 100 rounded to 2 decimals
 */
export const calculateGlobalUtility = (departmentData) => {
  if (!departmentData || departmentData.length === 0) return 0;

  let totalWeightedUtility = 0;
  let totalWeights = 0;

  for (const dept of departmentData) {
    const weight = PRIORITY_WEIGHTS[dept.priority?.toUpperCase()] || 1.0;
    const utility = calculateDepartmentUtility(
      dept.proposedAmount,
      dept.requestedBudget,
      dept.minAcceptableBudget
    );
    totalWeightedUtility += utility * weight;
    totalWeights += weight;
  }

  if (totalWeights === 0) return 0;
  return Math.round((totalWeightedUtility / totalWeights) * 100) / 100;
};
