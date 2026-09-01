import { z } from 'zod';

export const ProposalSchema = z.object({
  department: z.string().min(1, 'Department name is required'),
  proposedAmount: z.number().positive('Proposed amount must be positive'),
  reason: z.string().min(1, 'Reasoning must be provided'),
  concessions: z.array(z.string()).default([]),
  constraintsSatisfied: z.boolean().default(true),
});

export const CounterOfferSchema = z.object({
  department: z.string().min(1, 'Department name is required'),
  proposedAmount: z.number().positive('Proposed amount must be positive'),
  reason: z.string().min(1, 'Reasoning must be provided'),
  concessions: z.array(z.string()).default([]),
  targetConcessionRequestedFrom: z.string().optional().nullable(),
  constraintsSatisfied: z.boolean().default(true),
});

export const EvaluationSchema = z.object({
  department: z.string().min(1, 'Department name is required'),
  acceptable: z.boolean(),
  utilityScore: z.number().min(0).max(100).optional(),
  feedback: z.string().default(''),
  suggestedAction: z.enum(['ACCEPT', 'COUNTER', 'CONCEDE', 'HOLD']).default('COUNTER'),
});

export const CfoDecisionSchema = z.object({
  decision: z.record(z.string(), z.number().nonnegative('Allocation amount must be non-negative')),
  reason: z.string().min(1, 'Company-level justification is required'),
  constraintsSatisfied: z.boolean().default(true),
});
