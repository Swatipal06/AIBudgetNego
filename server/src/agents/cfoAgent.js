import { llmClient } from './LLMClient.js';
import { CfoDecisionSchema } from '../validators/agentSchemas.js';
import { cfoArbitrationPrompt } from '../prompts/prompts.js';
import { fallbackCfoAllocation, validateCfoDecision } from '../engine/proposalValidator.js';
import logger from '../config/logger.js';

export class CfoAgent {
  /**
   * Executes CFO arbitration over deadlock
   * 
   * @param {Object} context - { companyBudget, departments, lastProposals, roundNumber }
   * @returns {Promise<{ decision: Object, reason: string, constraintsSatisfied: boolean }>}
   */
  static async arbitrate(context) {
    logger.info('Invoking CFO Arbiter for deadlock resolution', {
      budget: context.companyBudget,
      departments: context.departments.map((d) => d.name),
    });

    const fallback = fallbackCfoAllocation(context.departments, context.companyBudget);
    const fallbackData = {
      decision: fallback.sanitizedAllocation,
      reason: 'CFO executive mandate: Guaranteed all mandatory departmental minimums and distributed remaining funds in proportion to strategic priority and headroom.',
      constraintsSatisfied: true,
    };

    const prompt = cfoArbitrationPrompt(context);

    try {
      const llmResult = await llmClient.generateStructuredOutput(
        prompt,
        CfoDecisionSchema,
        fallbackData
      );

      // Validate deterministically
      const validation = validateCfoDecision(
        llmResult,
        context.departments,
        context.companyBudget
      );

      return {
        decision: validation.sanitizedAllocation,
        reason: llmResult.reason || fallbackData.reason,
        constraintsSatisfied: true,
        totalAllocated: validation.totalAllocated,
        remainingBudget: validation.remainingBudget,
      };
    } catch (error) {
      logger.error(`CFO Agent failed execution: ${error.message}. Applying deterministic fallback.`);
      return {
        decision: fallback.sanitizedAllocation,
        reason: fallbackData.reason,
        constraintsSatisfied: true,
        totalAllocated: fallback.totalAllocated,
        remainingBudget: fallback.remainingBudget,
      };
    }
  }
}

export default CfoAgent;
