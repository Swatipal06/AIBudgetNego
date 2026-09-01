import mongoose from 'mongoose';

const proposalSubSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    departmentName: {
      type: String,
      required: true,
    },
    proposedAmount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
    concessions: [
      {
        type: String,
      },
    ],
    concessionAmount: {
      type: Number,
      default: 0,
    },
    constraintsSatisfied: {
      type: Boolean,
      default: true,
    },
    utility: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const roundSchema = new mongoose.Schema(
  {
    negotiationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Negotiation',
      required: true,
      index: true,
    },
    roundNumber: {
      type: Number,
      required: true,
    },
    proposals: [proposalSubSchema],
    totalProposedAmount: {
      type: Number,
      required: true,
    },
    companyBudget: {
      type: Number,
      required: true,
    },
    remainingBudget: {
      type: Number,
      required: true,
    },
    budgetConflict: {
      type: Boolean,
      default: true,
    },
    agreementReached: {
      type: Boolean,
      default: false,
    },
    deadlock: {
      type: Boolean,
      default: false,
    },
    systemNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup
roundSchema.index({ negotiationId: 1, roundNumber: 1 }, { unique: true });

const Round = mongoose.model('Round', roundSchema);
export default Round;
