import Negotiation from '../models/Negotiation.js';
import Department from '../models/Department.js';
import Round from '../models/Round.js';
import Allocation from '../models/Allocation.js';
import NegotiationEvent from '../models/NegotiationEvent.js';
import BaseDepartmentAgent from '../agents/BaseDepartmentAgent.js';
import CfoAgent from '../agents/cfoAgent.js';
import {
  checkFeasibility,
  validateDepartmentProposal,
  validateRoundAgreement,
} from './proposalValidator.js';
import {
  calculateDepartmentUtility,
  calculateGlobalUtility,
} from './utilityCalculator.js';
import { broadcastNegotiationEvent } from '../sockets/socketManager.js';
import logger from '../config/logger.js';

// Helper to delay between rounds for realistic live viewing experience
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class NegotiationEngine {
  /**
   * Orchestrates the complete end-to-end multi-agent negotiation process
   * 
   * @param {string} negotiationId - MongoDB ObjectId of the negotiation
   * @param {Object} options - { delayMs: number }
   */
  static async runNegotiation(negotiationId, options = {}) {
    const delayMs = options.delayMs !== undefined ? options.delayMs : 1500;

    logger.info(`Starting negotiation orchestration for ID: ${negotiationId}`);

    const negotiation = await Negotiation.findById(negotiationId);
    if (!negotiation) {
      throw new Error(`Negotiation ${negotiationId} not found`);
    }

    if (['RUNNING', 'FINALIZED', 'AWAITING_APPROVAL'].includes(negotiation.status)) {
      logger.warn(`Negotiation ${negotiationId} is already in state: ${negotiation.status}. Skipping.`);
      return negotiation;
    }

    const departments = await Department.find({ negotiationId });
    if (!departments || departments.length === 0) {
      throw new Error(`No departments configured for negotiation ${negotiationId}`);
    }

    // 1. Deterministic Feasibility Check
    const feasibility = checkFeasibility(negotiation.companyBudget, departments);
    if (!feasibility.isFeasible) {
      negotiation.status = 'FAILED';
      negotiation.failureReason = feasibility.message;
      await negotiation.save();

      await NegotiationEngine.logEvent(negotiationId, {
        eventType: 'NEGOTIATION_FAILED',
        message: feasibility.message,
        details: { feasibility },
        actor: 'SYSTEM',
      });

      broadcastNegotiationEvent(negotiationId, 'NEGOTIATION_FAILED', {
        negotiationId,
        reason: feasibility.message,
      });

      return negotiation;
    }

    // 2. Set Status to RUNNING
    negotiation.status = 'RUNNING';
    negotiation.currentRound = 0;
    await negotiation.save();

    await NegotiationEngine.logEvent(negotiationId, {
      eventType: 'NEGOTIATION_STARTED',
      message: `Multi-agent negotiation started with budget ₹${negotiation.companyBudget.toLocaleString('en-IN')} across ${departments.length} departments.`,
      details: {
        companyBudget: negotiation.companyBudget,
        maxRounds: negotiation.maxRounds,
        departments: departments.map((d) => ({
          name: d.name,
          requested: d.requestedBudget,
          min: d.minAcceptableBudget,
          priority: d.priority,
        })),
      },
      actor: 'SYSTEM',
    });

    broadcastNegotiationEvent(negotiationId, 'NEGOTIATION_STARTED', {
      negotiationId,
      status: 'RUNNING',
      companyBudget: negotiation.companyBudget,
      maxRounds: negotiation.maxRounds,
    });

    // Initialize agent instances
    const agents = departments.map((dept) => new BaseDepartmentAgent(dept));
    const previousOffers = {};
    departments.forEach((d) => {
      previousOffers[d.name] = d.requestedBudget;
    });

    let agreementReached = false;
    let finalRoundData = null;

    // 3. Multi-Round Negotiation Loop
    for (let roundNum = 1; roundNum <= negotiation.maxRounds; roundNum++) {
      negotiation.currentRound = roundNum;
      await negotiation.save();

      await NegotiationEngine.logEvent(negotiationId, {
        eventType: 'ROUND_STARTED',
        roundNumber: roundNum,
        message: `Round ${roundNum} of ${negotiation.maxRounds} initiated.`,
        actor: 'SYSTEM',
      });

      broadcastNegotiationEvent(negotiationId, 'ROUND_STARTED', {
        negotiationId,
        roundNumber: roundNum,
        maxRounds: negotiation.maxRounds,
      });

      const roundProposals = [];

      // Collect proposal/counteroffer from each department agent
      for (const agent of agents) {
        const negotiationState = {
          companyBudget: negotiation.companyBudget,
          currentRound: roundNum,
          maxRounds: negotiation.maxRounds,
          departments,
          previousOffers,
          currentRoundProposals: roundProposals,
          totalProposed: roundProposals.reduce((sum, p) => sum + p.proposedAmount, 0),
          overBudgetAmount: Math.max(
            0,
            roundProposals.reduce((sum, p) => sum + p.proposedAmount, 0) - negotiation.companyBudget
          ),
        };

        let rawProposal;
        if (roundNum === 1) {
          rawProposal = await agent.generateProposal(negotiationState);
        } else {
          rawProposal = await agent.makeCounterOffer(negotiationState);
        }

        // Deterministic validation & backend clamping
        const deptDoc = departments.find((d) => d.name === agent.name);
        const validation = validateDepartmentProposal(
          rawProposal,
          deptDoc,
          negotiation.companyBudget
        );

        // Deterministic utility calculation
        const utility = calculateDepartmentUtility(
          validation.normalizedAmount,
          deptDoc.requestedBudget,
          deptDoc.minAcceptableBudget
        );

        const prevAmount = previousOffers[agent.name];
        const concessionAmount = Math.max(0, prevAmount - validation.normalizedAmount);
        previousOffers[agent.name] = validation.normalizedAmount;

        const proposalRecord = {
          departmentId: deptDoc._id,
          departmentName: deptDoc.name,
          proposedAmount: validation.normalizedAmount,
          reason: rawProposal.reason,
          concessions: rawProposal.concessions || [],
          concessionAmount,
          constraintsSatisfied: validation.hardConstraintsSatisfied,
          utility,
          minAcceptableBudget: deptDoc.minAcceptableBudget,
          requestedBudget: deptDoc.requestedBudget,
        };

        roundProposals.push(proposalRecord);

        // Log proposal & concession events
        const isConcession = concessionAmount > 0;
        await NegotiationEngine.logEvent(negotiationId, {
          eventType: isConcession ? 'CONCESSION' : 'PROPOSAL_CREATED',
          roundNumber: roundNum,
          departmentName: deptDoc.name,
          message: isConcession
            ? `${deptDoc.name} conceded ₹${concessionAmount.toLocaleString('en-IN')} and proposed ₹${validation.normalizedAmount.toLocaleString('en-IN')}: "${rawProposal.reason}"`
            : `${deptDoc.name} proposed ₹${validation.normalizedAmount.toLocaleString('en-IN')}: "${rawProposal.reason}"`,
          details: {
            proposedAmount: validation.normalizedAmount,
            concessionAmount,
            utility,
            concessions: rawProposal.concessions,
            constraintsSatisfied: validation.hardConstraintsSatisfied,
          },
          actor: 'DEPARTMENT_AGENT',
        });

        broadcastNegotiationEvent(negotiationId, isConcession ? 'CONCESSION' : 'PROPOSAL_CREATED', {
          negotiationId,
          roundNumber: roundNum,
          proposal: proposalRecord,
        });

        // Small delay between agent moves for visual timeline progression
        if (delayMs > 0) {
          await sleep(Math.min(delayMs / 2, 600));
        }
      }

      // Validate collective round outcome
      const roundValidation = validateRoundAgreement(
        roundProposals,
        negotiation.companyBudget
      );

      // Persist Round in database
      const roundDoc = await Round.create({
        negotiationId,
        roundNumber: roundNum,
        proposals: roundProposals,
        totalProposedAmount: roundValidation.totalProposed,
        companyBudget: negotiation.companyBudget,
        remainingBudget: roundValidation.remainingBudget,
        budgetConflict: !roundValidation.isAgreement,
        agreementReached: roundValidation.isAgreement,
        deadlock: !roundValidation.isAgreement && roundNum === negotiation.maxRounds,
        systemNotes: roundValidation.issues.join(' | ') || 'Round completed within constraints.',
      });

      finalRoundData = { roundDoc, roundProposals, roundValidation };

      broadcastNegotiationEvent(negotiationId, 'ROUND_COMPLETED', {
        negotiationId,
        roundNumber: roundNum,
        totalProposed: roundValidation.totalProposed,
        remainingBudget: roundValidation.remainingBudget,
        isAgreement: roundValidation.isAgreement,
        proposals: roundProposals,
      });

      // Check if agreement is settled naturally
      if (roundValidation.isAgreement) {
        agreementReached = true;
        logger.info(`Agreement naturally reached in Round ${roundNum} for negotiation ${negotiationId}`);
        break;
      }

      // Wait between rounds for live user observation
      if (roundNum < negotiation.maxRounds && delayMs > 0) {
        await sleep(delayMs);
      }
    }

    // 4. Agreement or Deadlock Resolution Flow
    if (agreementReached && finalRoundData) {
      // Natural Settlement
      negotiation.status = 'SETTLED';
      await negotiation.save();

      await NegotiationEngine.logEvent(negotiationId, {
        eventType: 'AGREEMENT_REACHED',
        roundNumber: negotiation.currentRound,
        message: `Consensus reached in Round ${negotiation.currentRound}. Total proposed allocation: ₹${finalRoundData.roundValidation.totalProposed.toLocaleString('en-IN')} within budget of ₹${negotiation.companyBudget.toLocaleString('en-IN')}.`,
        details: { totalProposed: finalRoundData.roundValidation.totalProposed },
        actor: 'SYSTEM',
      });

      // Create Proposed Allocation
      const allocationItems = finalRoundData.roundProposals.map((p) => ({
        departmentId: p.departmentId,
        departmentName: p.departmentName,
        requestedAmount: p.requestedBudget,
        minAcceptableAmount: p.minAcceptableBudget,
        proposedAmount: p.proposedAmount,
        finalAmount: null,
        utility: p.utility,
        constraintsSatisfied: p.constraintsSatisfied,
        rationale: p.reason,
      }));

      const allocationDoc = await Allocation.create({
        negotiationId,
        allocations: allocationItems,
        totalAllocated: finalRoundData.roundValidation.totalProposed,
        companyBudget: negotiation.companyBudget,
        remainingBudget: finalRoundData.roundValidation.remainingBudget,
        isFeasible: true,
        arbitratedByCfo: false,
        status: 'AWAITING_APPROVAL',
      });

      // State Transition to AWAITING_APPROVAL (Human in the Loop Gate)
      negotiation.status = 'AWAITING_APPROVAL';
      negotiation.proposedAllocation = allocationDoc._id;
      await negotiation.save();

      await NegotiationEngine.logEvent(negotiationId, {
        eventType: 'AWAITING_APPROVAL',
        roundNumber: negotiation.currentRound,
        message: 'Proposed allocation submitted for human administrator review and confirmation.',
        details: { allocationId: allocationDoc._id, totalAllocated: allocationDoc.totalAllocated },
        actor: 'SYSTEM',
      });

      broadcastNegotiationEvent(negotiationId, 'AWAITING_APPROVAL', {
        negotiationId,
        status: 'AWAITING_APPROVAL',
        allocation: allocationDoc,
      });
    } else {
      // 5. Deadlock Reached -> CFO Arbitration
      negotiation.status = 'DEADLOCK';
      await negotiation.save();

      await NegotiationEngine.logEvent(negotiationId, {
        eventType: 'DEADLOCK',
        roundNumber: negotiation.maxRounds,
        message: `Department agents reached deadlock after ${negotiation.maxRounds} rounds. Handing off to CFO Arbiter.`,
        actor: 'SYSTEM',
      });

      broadcastNegotiationEvent(negotiationId, 'DEADLOCK', {
        negotiationId,
        status: 'DEADLOCK',
        roundNumber: negotiation.maxRounds,
      });

      if (delayMs > 0) {
        await sleep(1000);
      }

      // Execute CFO Arbitration
      const cfoResult = await CfoAgent.arbitrate({
        companyBudget: negotiation.companyBudget,
        departments,
        lastProposals: previousOffers,
        roundNumber: negotiation.maxRounds,
      });

      const cfoAllocationItems = departments.map((dept) => {
        const allocatedAmount = cfoResult.decision[dept.name] || dept.minAcceptableBudget;
        const utility = calculateDepartmentUtility(
          allocatedAmount,
          dept.requestedBudget,
          dept.minAcceptableBudget
        );
        return {
          departmentId: dept._id,
          departmentName: dept.name,
          requestedAmount: dept.requestedBudget,
          minAcceptableAmount: dept.minAcceptableBudget,
          proposedAmount: allocatedAmount,
          finalAmount: null,
          utility,
          constraintsSatisfied: true,
          rationale: `CFO Arbitrated Allocation: Guaranteed minimum + strategic priority allocation`,
        };
      });

      const cfoAllocationDoc = await Allocation.create({
        negotiationId,
        allocations: cfoAllocationItems,
        totalAllocated: cfoResult.totalAllocated,
        companyBudget: negotiation.companyBudget,
        remainingBudget: cfoResult.remainingBudget,
        isFeasible: true,
        arbitratedByCfo: true,
        cfoReasoning: cfoResult.reason,
        status: 'AWAITING_APPROVAL',
      });

      await NegotiationEngine.logEvent(negotiationId, {
        eventType: 'CFO_DECISION',
        roundNumber: negotiation.maxRounds,
        message: `CFO Arbiter resolved deadlock: "${cfoResult.reason}"`,
        details: {
          decision: cfoResult.decision,
          totalAllocated: cfoResult.totalAllocated,
          reason: cfoResult.reason,
        },
        actor: 'CFO_AGENT',
      });

      // Transition to AWAITING_APPROVAL
      negotiation.status = 'AWAITING_APPROVAL';
      negotiation.proposedAllocation = cfoAllocationDoc._id;
      await negotiation.save();

      await NegotiationEngine.logEvent(negotiationId, {
        eventType: 'AWAITING_APPROVAL',
        roundNumber: negotiation.maxRounds,
        message: 'CFO Arbitrated allocation is now awaiting human administrator approval.',
        details: { allocationId: cfoAllocationDoc._id },
        actor: 'SYSTEM',
      });

      broadcastNegotiationEvent(negotiationId, 'AWAITING_APPROVAL', {
        negotiationId,
        status: 'AWAITING_APPROVAL',
        allocation: cfoAllocationDoc,
        arbitratedByCfo: true,
      });
    }

    return negotiation;
  }

  /**
   * Helper to persist structured audit events
   */
  static async logEvent(negotiationId, eventData) {
    try {
      const event = await NegotiationEvent.create({
        negotiationId,
        eventType: eventData.eventType,
        roundNumber: eventData.roundNumber || null,
        departmentName: eventData.departmentName || null,
        message: eventData.message,
        details: eventData.details || {},
        actor: eventData.actor || 'SYSTEM',
        timestamp: new Date(),
      });
      return event;
    } catch (err) {
      logger.error(`Failed to log negotiation event: ${err.message}`);
    }
  }
}

export default NegotiationEngine;
