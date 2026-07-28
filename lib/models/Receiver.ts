import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReceiver extends Document {
  reservation: mongoose.Types.ObjectId;
  staffUser: mongoose.Types.ObjectId;
  returnInsurance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReceiverSchema: Schema<IReceiver> = new Schema(
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
      required: [true, 'Receiving Staff User is required'],
    },
    returnInsurance: {
      type: Number,
      required: [true, 'Returned insurance amount is required'],
      min: [0, 'Returned insurance cannot be negative'],
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

const Receiver: Model<IReceiver> =
  mongoose.models.Receiver || mongoose.model<IReceiver>('Receiver', ReceiverSchema);

export default Receiver;
