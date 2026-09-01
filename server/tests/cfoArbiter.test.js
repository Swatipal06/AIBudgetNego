import {
  validateCfoDecision,
  fallbackCfoAllocation,
} from '../src/engine/proposalValidator.js';
import { CfoDecisionSchema } from '../src/validators/agentSchemas.js';

describe('CFO Arbiter Validation & Deadlock Resolution', () => {
  const departments = [
    { name: 'Engineering', requestedBudget: 500000, minAcceptableBudget: 400000, priority: 'HIGH' },
    { name: 'Marketing', requestedBudget: 400000, minAcceptableBudget: 250000, priority: 'MEDIUM' },
    { name: 'Sales', requestedBudget: 300000, minAcceptableBudget: 200000, priority: 'MEDIUM' },
  ];
  const companyBudget = 1000000;

  test('15. CFO output validator ensures no department is assigned less than its minimum acceptable budget', () => {
    const rawCfoOutput = {
      decision: {
        Engineering: 350000, // Below 400,000 minimum
        Marketing: 350000,
        Sales: 250000,
      },
      reason: 'Aggressive cuts to engineering',
      constraintsSatisfied: true,
    };

    const validated = validateCfoDecision(rawCfoOutput, departments, companyBudget);
    expect(validated.sanitizedAllocation.Engineering).toBe(400000); // Clamped up to minimum
    expect(validated.errors.length).toBeGreaterThan(0);
  });

  test('16. CFO fallback allocation guarantees sum(allocation) <= companyBudget and all minimums met', () => {
    const fallback = fallbackCfoAllocation(departments, companyBudget);
    expect(fallback.isValid).toBe(true);
    expect(fallback.totalAllocated).toBeLessThanOrEqual(companyBudget);
    expect(fallback.sanitizedAllocation.Engineering).toBeGreaterThanOrEqual(400000);
    expect(fallback.sanitizedAllocation.Marketing).toBeGreaterThanOrEqual(250000);
    expect(fallback.sanitizedAllocation.Sales).toBeGreaterThanOrEqual(200000);
  });

  test('17. CFO Decision schema validates valid JSON and rejects missing keys', () => {
    const valid = {
      decision: { Engineering: 450000, Marketing: 300000, Sales: 250000 },
      reason: 'Balanced allocation based on Q3 objectives.',
      constraintsSatisfied: true,
    };
    expect(() => CfoDecisionSchema.parse(valid)).not.toThrow();

    const invalid = {
      decision: 'invalid-string-not-object',
      reason: 'Wrong type',
    };
    expect(() => CfoDecisionSchema.parse(invalid)).toThrow();
  });
});
