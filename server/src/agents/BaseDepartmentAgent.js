import { llmClient } from './LLMClient.js';
import {
  ProposalSchema,
  CounterOfferSchema,
  EvaluationSchema,
} from '../validators/agentSchemas.js';
import {
  departmentProposalPrompt,
  departmentCounterOfferPrompt,
  departmentEvaluationPrompt,
} from '../prompts/prompts.js';
import logger from '../config/logger.js';

export class BaseDepartmentAgent {
  /**
   * @param {Object} department - Department Mongoose document or plain object
   */
  constructor(department) {
    this.department = department;
    this.name = department.name;
    this.requestedBudget = department.requestedBudget;
    this.minAcceptableBudget = department.minAcceptableBudget;
    this.priority = department.priority || 'MEDIUM';
    this.strategy = department.strategy || 'COMPROMISING';
    this.hardConstraints = department.hardConstraints || [];
    this.softPreferences = department.softPreferences || [];
  }

  /**
   * Builds the structured contextual state for the agent
   */
  getContext(negotiationState) {
    return {
      department: {
        id: this.department._id,
        name: this.name,
        requestedBudget: this.requestedBudget,
        minAcceptableBudget: this.minAcceptableBudget,
        priority: this.priority,
        strategy: this.strategy,
        hardConstraints: this.hardConstraints,
        softPreferences: this.softPreferences,
      },
      companyBudget: negotiationState.companyBudget,
      roundNumber: negotiationState.currentRound,
      maxRounds: negotiationState.maxRounds,
      otherDepartments: negotiationState.departments.filter(
        (d) => d.name !== this.name
      ),
      currentRoundProposals: negotiationState.currentRoundProposals || [],
      totalProposed: negotiationState.totalProposed || 0,
      overBudgetAmount: negotiationState.overBudgetAmount || 0,
      previousProposedAmount: negotiationState.previousOffers?.[this.name] || this.requestedBudget,
    };
  }

  /**
   * Generates initial proposal (Round 1)
   */
  async generateProposal(negotiationState) {
    const context = this.getContext(negotiationState);
    const prompt = departmentProposalPrompt(context);

    // Deterministic fallback proposal based on department strategy
    let fallbackAmount = this.requestedBudget;
    let fallbackReason = `Proposing full requested allocation of ₹${this.requestedBudget.toLocaleString('en-IN')} to satisfy all operational and strategic objectives.`;
    
    if (this.strategy === 'COMPROMISING' || this.strategy === 'COLLABORATIVE') {
      // Modest opening concession of 5% of headroom
      const headroom = this.requestedBudget - this.minAcceptableBudget;
      if (headroom > 0) {
        fallbackAmount = Math.round(this.requestedBudget - headroom * 0.05);
        fallbackReason = `Proposing ₹${fallbackAmount.toLocaleString('en-IN')}, proactively conceding minor buffer to demonstrate collaborative intent.`;
      }
    }

    const fallbackData = {
      department: this.name,
      proposedAmount: fallbackAmount,
      reason: fallbackReason,
      concessions: [],
      constraintsSatisfied: true,
    };

    const result = await llmClient.generateStructuredOutput(
      prompt,
      ProposalSchema,
      fallbackData
    );

    // Enforce safety bounds
    result.proposedAmount = Math.max(
      this.minAcceptableBudget,
      Math.min(result.proposedAmount, this.requestedBudget)
    );

    return result;
  }

  /**
   * Generates counteroffer for subsequent rounds when over-budget conflict exists
   */
  async makeCounterOffer(negotiationState) {
    const context = this.getContext(negotiationState);
    const prompt = departmentCounterOfferPrompt(context);

    const prevOffer = context.previousProposedAmount;
    const headroom = prevOffer - this.minAcceptableBudget;

    // Strategy-based concession step
    let concessionRate = 0.25; // Default COMPROMISING
    if (this.strategy === 'ASSERTIVE') {
      concessionRate = this.priority === 'HIGH' ? 0.1 : 0.15;
    } else if (this.strategy === 'CONSERVATIVE') {
      concessionRate = 0.15;
    } else if (this.strategy === 'COLLABORATIVE') {
      concessionRate = 0.35;
    }

    // Determine target amount
    let targetAmount = prevOffer;
    const concessions = [];
    if (headroom > 0) {
      const concessionStep = Math.max(1000, Math.round(headroom * concessionRate));
      targetAmount = Math.max(this.minAcceptableBudget, prevOffer - concessionStep);
      concessions.push(`Conceded ₹${concessionStep.toLocaleString('en-IN')} by deferring non-critical project milestones`);
    }

    const fallbackData = {
      department: this.name,
      proposedAmount: targetAmount,
      reason: `Adjusting request to ₹${targetAmount.toLocaleString('en-IN')} based on ${this.strategy} strategy while preserving core deliverables.`,
      concessions,
      targetConcessionRequestedFrom: null,
      constraintsSatisfied: true,
    };

    const result = await llmClient.generateStructuredOutput(
      prompt,
      CounterOfferSchema,
      fallbackData
    );

    // Deterministic bounds clamping
    result.proposedAmount = Math.max(
      this.minAcceptableBudget,
      Math.min(result.proposedAmount, prevOffer)
    );

    return result;
  }

  /**
   * Evaluates collective proposals
   */
  async evaluateProposal(proposedAmount, totalProposed, companyBudget) {
    const acceptable =
      proposedAmount >= this.minAcceptableBudget && totalProposed <= companyBudget;

    const fallbackData = {
      department: this.name,
      acceptable,
      utilityScore: proposedAmount >= this.requestedBudget ? 100 : 70,
      feedback: acceptable
        ? 'Allocation meets minimum viable operational thresholds.'
        : 'Allocation is currently insufficient or overall budget remains in conflict.',
      suggestedAction: acceptable ? 'ACCEPT' : 'COUNTER',
    };

    const context = {
      department: this.department,
      proposedAmount,
      totalProposed,
      companyBudget,
    };
    const prompt = departmentEvaluationPrompt(context);

    return await llmClient.generateStructuredOutput(
      prompt,
      EvaluationSchema,
      fallbackData
    );
  }

  /**
   * Deterministic concession decision checker
   */
  shouldConcede(currentRound, maxRounds) {
    if (this.strategy === 'ASSERTIVE' && this.priority === 'HIGH') {
      return currentRound >= maxRounds - 1; // Hold until last rounds
    }
    return true;
  }
}

export default BaseDepartmentAgent;
