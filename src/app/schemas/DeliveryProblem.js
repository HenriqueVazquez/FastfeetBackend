import mongoose from 'mongoose';

const DeliveryProblemSchema = new mongoose.Schema(
  {
    delivery_id: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      required: true,
      default: false,
    },
    canceled_at: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('DeliveryProblem', DeliveryProblemSchema);
