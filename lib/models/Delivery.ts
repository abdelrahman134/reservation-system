import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDelivery extends Document {
  reservation: mongoose.Types.ObjectId;
  staffUser: mongoose.Types.ObjectId;
  insurance: number;
  totalValue: number;
  nationalIdPhotos: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeliverySchema: Schema<IDelivery> = new Schema(
  {
    reservation: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
      required: [true, 'Reservation is required'],
      unique: true,
    },
    staffUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Delivering Staff User is required'],
    },
    insurance: {
      type: Number,
      required: [true, 'Insurance is required'],
      min: [0, 'Insurance cannot be negative'],
    },
    totalValue: {
      type: Number,
      required: [true, 'Total cash collected value is required'],
      min: [0, 'Value cannot be negative'],
    },
    nationalIdPhotos: {
      type: [String],
      default: [],
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

const Delivery: Model<IDelivery> =
  mongoose.models.Delivery || mongoose.model<IDelivery>('Delivery', DeliverySchema);

export default Delivery;
