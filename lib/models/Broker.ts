import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBroker extends Document {
  name: string;
  defaultPercentage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BrokerSchema: Schema<IBroker> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Broker name is required'],
      trim: true,
    },
    defaultPercentage: {
      type: Number,
      required: [true, 'Default commission percentage is required'],
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100%'],
      default: 15,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Broker: Model<IBroker> =
  mongoose.models.Broker || mongoose.model<IBroker>('Broker', BrokerSchema);

export default Broker;
