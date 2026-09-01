import mongoose from 'mongoose';

export const NEGOTIATION_STATUS = [
  'PENDING',
  'RUNNING',
  'SETTLED',
  'DEADLOCK',
  'AWAITING_APPROVAL',
  'FINALIZED',
  'CANCELLED',
  'FAILED',
];

const negotiationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Negotiation title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    companyBudget: {
      type: Number,
      required: [true, 'Total company budget is required'],
      min: [1, 'Company budget must be greater than 0'],
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    maxRounds: {
      type: Number,
      default: 5,
      min: [1, 'Must have at least 1 round'],
      max: [20, 'Maximum rounds capped at 20'],
    },
    currentRound: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: NEGOTIATION_STATUS,
      default: 'PENDING',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    departments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
      },
    ],
    proposedAllocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Allocation',
      default: null,
    },
    finalAllocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Allocation',
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvalNote: {
      type: String,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
negotiationSchema.index({ status: 1, createdAt: -1 });
negotiationSchema.index({ createdBy: 1 });

const Negotiation = mongoose.model('Negotiation', negotiationSchema);
export default Negotiation;
