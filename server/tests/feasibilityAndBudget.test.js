import { checkFeasibility } from '../src/engine/proposalValidator.js';

describe('Feasibility & Budget Bounds Deterministic Verification', () => {
  test('1. Should REJECT negotiation when sum(minimum budgets) > total company budget', () => {
    const companyBudget = 1000000;
    const departments = [
      { name: 'Engineering', requestedBudget: 600000, minAcceptableBudget: 500000 },
      { name: 'Marketing', requestedBudget: 400000, minAcceptableBudget: 350000 },
      { name: 'Sales', requestedBudget: 300000, minAcceptableBudget: 250000 },
    ];
    // sum(min) = 500,000 + 350,000 + 250,000 = 1,100,000 > 1,000,000 (deficit 100,000)

    const result = checkFeasibility(companyBudget, departments);
    expect(result.isFeasible).toBe(false);
    expect(result.deficit).toBe(100000);
    expect(result.totalMinBudget).toBe(1100000);
    expect(result.message).toContain('exceed the available company budget');
  });

  test('2. Should PASS feasibility check when sum(minimum budgets) <= total company budget', () => {
    const companyBudget = 1000000;
    const departments = [
      { name: 'Engineering', requestedBudget: 500000, minAcceptableBudget: 400000 },
      { name: 'Marketing', requestedBudget: 400000, minAcceptableBudget: 250000 },
      { name: 'Sales', requestedBudget: 300000, minAcceptableBudget: 200000 },
    ];
    // sum(min) = 400,000 + 250,000 + 200,000 = 850,000 <= 1,000,000 (surplus 150,000)

    const result = checkFeasibility(companyBudget, departments);
    expect(result.isFeasible).toBe(true);
    expect(result.deficit).toBe(0);
    expect(result.totalMinBudget).toBe(850000);
    expect(result.totalRequestedBudget).toBe(1200000);
  });

  test('3. Should fail gracefully if no departments are provided', () => {
    const result = checkFeasibility(1000000, []);
    expect(result.isFeasible).toBe(false);
  });
});
