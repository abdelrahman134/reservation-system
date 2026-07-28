import mongoose, { Schema, Document, Model } from 'mongoose';
import './User';
import './Apartment';
import './Broker';

export interface IReservation extends Document {
  clientName: string;
  clientPhone: string;
  apartment: mongoose.Types.ObjectId;
  createdByStaff: mongoose.Types.ObjectId;
  broker?: mongoose.Types.ObjectId;
  commissionPercentage: number;
  brokerCommissionAmount: number;
  staffCommissionAmount: number;
  startDate: Date;
  endDate: Date;
  pricePerDay: number;
  deposit: number;
  totalValue: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema: Schema<IReservation> = new Schema(
  {
    clientName: {
      type: String,
      required: [true, 'Client Name is required'],
      trim: true,
    },
    clientPhone: {
      type: String,
      required: [true, 'Client Phone is required'],
      trim: true,
    },
    apartment: {
      type: Schema.Types.ObjectId,
      ref: 'Apartment',
      required: [true, 'Apartment is required'],
    },
    createdByStaff: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Staff member is required'],
    },
    broker: {
      type: Schema.Types.ObjectId,
      ref: 'Broker',
      required: false,
    },
    commissionPercentage: {
      type: Number,
      default: 10,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100%'],
    },
    brokerCommissionAmount: {
      type: Number,
      default: 0,
      min: [0, 'Amount cannot be negative'],
    },
    staffCommissionAmount: {
      type: Number,
      default: 0,
      min: [0, 'Amount cannot be negative'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start Date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End Date is required'],
    },
    pricePerDay: {
      type: Number,
      required: [true, 'Price per day is required'],
      min: [0, 'Price cannot be negative'],
    },
    deposit: {
      type: Number,
      required: [true, 'Deposit is required'],
      min: [0, 'Deposit cannot be negative'],
    },
    totalValue: {
      type: Number,
      required: [true, 'Total value is required'],
      min: [0, 'Total value cannot be negative'],
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'completed'],
      default: 'confirmed',
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

ReservationSchema.index({ apartment: 1, startDate: 1, endDate: 1 });

const Reservation: Model<IReservation> =
  mongoose.models.Reservation || mongoose.model<IReservation>('Reservation', ReservationSchema);

export default Reservation;
