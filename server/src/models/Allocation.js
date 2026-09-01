import mongoose from 'mongoose';

const departmentAllocationSubSchema = new mongoose.Schema(
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
    requestedAmount: {
      type: Number,
      required: true,
    },
    minAcceptableAmount: {
      type: Number,
      required: true,
    },
    proposedAmount: {
      type: Number,
      required: true,
    },
    finalAmount: {
      type: Number,
      default: null,
    },
    utility: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    constraintsSatisfied: {
      type: Boolean,
      default: true,
    },
    rationale: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const allocationSchema = new mongoose.Schema(
  {
    negotiationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Negotiation',
      required: true,
      index: true,
    },
    allocations: [departmentAllocationSubSchema],
    totalAllocated: {
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
    isFeasible: {
      type: Boolean,
      required: true,
      default: true,
    },
    arbitratedByCfo: {
      type: Boolean,
      default: false,
    },
    cfoReasoning: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['PROPOSED', 'AWAITING_APPROVAL', 'APPROVED', 'REJECTED'],
      default: 'PROPOSED',
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
  },
  {
    timestamps: true,
  }
);

const Allocation = mongoose.model('Allocation', allocationSchema);
export default Allocation;
