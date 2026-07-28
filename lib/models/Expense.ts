import mongoose, { Schema, Document, Model } from 'mongoose';
import './User';
import './Reservation';
import './Broker';

export interface IExpense extends Document {
  name: string;
  value: number;
  user: mongoose.Types.ObjectId;
  source: 'manual' | 'receiver-return' | 'broker-payout';
  reservation?: mongoose.Types.ObjectId;
  broker?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema<IExpense> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Expense name is required'],
      trim: true,
    },
    value: {
      type: Number,
      required: [true, 'Expense value is required'],
      min: [0, 'Expense value cannot be negative'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Staff user is required'],
    },
    source: {
      type: String,
      enum: ['manual', 'receiver-return', 'broker-payout'],
      default: 'manual',
    },
    reservation: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
    },
    broker: {
      type: Schema.Types.ObjectId,
      ref: 'Broker',
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

const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
