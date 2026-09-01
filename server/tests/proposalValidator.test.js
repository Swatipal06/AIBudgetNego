import {
  validateDepartmentProposal,
  validateRoundAgreement,
} from '../src/engine/proposalValidator.js';
import { ProposalSchema } from '../src/validators/agentSchemas.js';

describe('Proposal Validation & Constraint Enforcement', () => {
  const deptConfig = {
    name: 'Engineering',
    requestedBudget: 500000,
    minAcceptableBudget: 400000,
  };
  const companyBudget = 1000000;

  test('9. Backend must reject / clamp proposals below minimum acceptable budget', () => {
    const invalidLowProposal = {
      department: 'Engineering',
      proposedAmount: 320000, // Violates 400,000 minimum
      reason: 'Overly aggressive concession',
    };

    const validation = validateDepartmentProposal(invalidLowProposal, deptConfig, companyBudget);
    expect(validation.isValid).toBe(false);
    expect(validation.hardConstraintsSatisfied).toBe(false);
    expect(validation.normalizedAmount).toBe(400000); // Clamped to hard constraint
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  test('10. Backend must clamp proposals that exceed initial requested budget ceiling', () => {
    const excessiveProposal = {
      department: 'Engineering',
      proposedAmount: 600000, // Exceeds 500,000 request
      reason: 'Wanting extra budget',
    };

    const validation = validateDepartmentProposal(excessiveProposal, deptConfig, companyBudget);
    expect(validation.normalizedAmount).toBe(500000);
  });

  test('11. Agreement check returns true ONLY when all hard constraints met and sum <= companyBudget', () => {
    const agreeingProposals = [
      { departmentName: 'Engineering', proposedAmount: 450000, minAcceptableBudget: 400000 },
      { departmentName: 'Marketing', proposedAmount: 320000, minAcceptableBudget: 250000 },
      { departmentName: 'Sales', proposedAmount: 230000, minAcceptableBudget: 200000 },
    ];
    // sum = 450,000 + 320,000 + 230,000 = 1,000,000 == companyBudget (1,000,000)

    const result = validateRoundAgreement(agreeingProposals, companyBudget);
    expect(result.isAgreement).toBe(true);
    expect(result.totalProposed).toBe(1000000);
    expect(result.remainingBudget).toBe(0);
    expect(result.hardConstraintsMet).toBe(true);
  });

  test('12. Agreement check returns false when total proposals exceed company budget', () => {
    const overBudgetProposals = [
      { departmentName: 'Engineering', proposedAmount: 500000, minAcceptableBudget: 400000 },
      { departmentName: 'Marketing', proposedAmount: 380000, minAcceptableBudget: 250000 },
      { departmentName: 'Sales', proposedAmount: 250000, minAcceptableBudget: 200000 },
    ];
    // sum = 1,130,000 > 1,000,000 (over by 130,000)

    const result = validateRoundAgreement(overBudgetProposals, companyBudget);
    expect(result.isAgreement).toBe(false);
    expect(result.overBudgetAmount).toBe(130000);
    expect(result.remainingBudget).toBe(-130000);
  });

  test('13. Zod schema validation must validate well-formed LLM proposal JSON', () => {
    const validRaw = {
      department: 'Engineering',
      proposedAmount: 450000,
      reason: 'Strategic compromise maintaining infrastructure.',
      concessions: ['Deferred non-critical cloud sandbox'],
      constraintsSatisfied: true,
    };

    const parsed = ProposalSchema.parse(validRaw);
    expect(parsed.proposedAmount).toBe(450000);
    expect(parsed.department).toBe('Engineering');
  });

  test('14. Zod schema validation must reject malformed LLM response without proposedAmount', () => {
    const malformedRaw = {
      department: 'Engineering',
      reason: 'Missing numeric allocation',
    };

    expect(() => ProposalSchema.parse(malformedRaw)).toThrow();
  });
});
