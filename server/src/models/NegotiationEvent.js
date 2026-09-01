import mongoose from 'mongoose';

export const EVENT_TYPES = [
  'NEGOTIATION_CREATED',
  'NEGOTIATION_STARTED',
  'ROUND_STARTED',
  'PROPOSAL_CREATED',
  'COUNTEROFFER_CREATED',
  'CONCESSION',
  'CONSTRAINT_CHECK',
  'AGREEMENT_REACHED',
  'DEADLOCK',
  'CFO_DECISION',
  'AWAITING_APPROVAL',
  'ALLOCATION_APPROVED',
  'ALLOCATION_REJECTED',
  'NEGOTIATION_FINALIZED',
  'NEGOTIATION_CANCELLED',
  'NEGOTIATION_FAILED',
];

const negotiationEventSchema = new mongoose.Schema(
  {
    negotiationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Negotiation',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: EVENT_TYPES,
      required: true,
      index: true,
    },
    roundNumber: {
      type: Number,
      default: null,
    },
    departmentName: {
      type: String,
      default: null,
    },
    message: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    actor: {
      type: String,
      default: 'SYSTEM', // 'SYSTEM' | 'ADMIN' | 'CFO_AGENT' | 'DEPARTMENT_AGENT'
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for chronological querying
negotiationEventSchema.index({ negotiationId: 1, timestamp: 1 });

const NegotiationEvent = mongoose.model('NegotiationEvent', negotiationEventSchema);
export default NegotiationEvent;
