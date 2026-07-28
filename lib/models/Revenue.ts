import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRevenue extends Document {
  name: string;
  value: number;
  user: mongoose.Types.ObjectId;
  source: 'manual' | 'deposit' | 'delivery';
  reservation?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RevenueSchema: Schema<IRevenue> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Revenue description is required'],
      trim: true,
    },
    value: {
      type: Number,
      required: [true, 'Revenue value is required'],
      min: [0, 'Revenue value cannot be negative'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Staff user is required'],
    },
    source: {
      type: String,
      enum: ['manual', 'deposit', 'delivery'],
      default: 'manual',
    },
    reservation: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
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

const Revenue: Model<IRevenue> =
  mongoose.models.Revenue || mongoose.model<IRevenue>('Revenue', RevenueSchema);

export default Revenue;
