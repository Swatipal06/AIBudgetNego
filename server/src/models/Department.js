import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    negotiationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Negotiation',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
    },
    requestedBudget: {
      type: Number,
      required: [true, 'Requested budget is required'],
      min: [0, 'Requested budget must be non-negative'],
    },
    minAcceptableBudget: {
      type: Number,
      required: [true, 'Minimum acceptable budget is required'],
      min: [0, 'Minimum acceptable budget must be non-negative'],
      validate: {
        validator: function (val) {
          return val <= this.requestedBudget;
        },
        message: 'Minimum acceptable budget cannot exceed requested budget',
      },
    },
    priority: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM',
    },
    hardConstraints: [
      {
        type: String,
        trim: true,
      },
    ],
    softPreferences: [
      {
        type: String,
        trim: true,
      },
    ],
    strategy: {
      type: String,
      enum: ['COMPROMISING', 'ASSERTIVE', 'ANALYTICAL', 'CONSERVATIVE', 'COLLABORATIVE'],
      default: 'COMPROMISING',
    },
    color: {
      type: String,
      default: '#3b82f6', // Tailwind blue-500 default
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Department = mongoose.model('Department', departmentSchema);
export default Department;
