import {
  calculateDepartmentUtility,
  calculateGlobalUtility,
} from '../src/engine/utilityCalculator.js';

describe('Deterministic Utility Calculator Verification', () => {
  const reqBudget = 500000;
  const minBudget = 400000;

  test('4. Utility must be 0 if proposed amount violates minimum budget threshold', () => {
    const utility = calculateDepartmentUtility(390000, reqBudget, minBudget);
    expect(utility).toBe(0);
  });

  test('5. Utility must be 50 if proposed amount exactly meets minimum acceptable budget floor', () => {
    const utility = calculateDepartmentUtility(400000, reqBudget, minBudget);
    expect(utility).toBe(50);
  });

  test('6. Utility must be 100 if proposed amount meets or exceeds requested budget', () => {
    const utilityExact = calculateDepartmentUtility(500000, reqBudget, minBudget);
    const utilityOver = calculateDepartmentUtility(550000, reqBudget, minBudget);
    expect(utilityExact).toBe(100);
    expect(utilityOver).toBe(100);
  });

  test('7. Utility must scale linearly between minimum (50) and requested (100)', () => {
    // Halfway between 400,000 and 500,000 is 450,000 -> Expected Utility = 75
    const utilityMid = calculateDepartmentUtility(450000, reqBudget, minBudget);
    expect(utilityMid).toBe(75);

    // 25% above min: 425,000 -> Expected Utility = 62.5
    const utilityQuarter = calculateDepartmentUtility(425000, reqBudget, minBudget);
    expect(utilityQuarter).toBe(62.5);
  });

  test('8. Global utility must correctly apply strategic priority weights (HIGH > MEDIUM > LOW)', () => {
    const depts = [
      { proposedAmount: 500000, requestedBudget: 500000, minAcceptableBudget: 400000, priority: 'HIGH' }, // Utility: 100 * 1.3 = 130
      { proposedAmount: 250000, requestedBudget: 400000, minAcceptableBudget: 250000, priority: 'MEDIUM' }, // Utility: 50 * 1.0 = 50
      { proposedAmount: 200000, requestedBudget: 300000, minAcceptableBudget: 200000, priority: 'LOW' }, // Utility: 50 * 0.7 = 35
    ];
    // Total weighted: 130 + 50 + 35 = 215. Total weight: 1.3 + 1.0 + 0.7 = 3.0
    // Global utility = 215 / 3.0 = 71.67
    const globalUtility = calculateGlobalUtility(depts);
    expect(globalUtility).toBe(71.67);
  });
});
