import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IApartment extends Document {
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApartmentSchema: Schema<IApartment> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide an apartment name'],
      trim: true,
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

const Apartment: Model<IApartment> =
  mongoose.models.Apartment || mongoose.model<IApartment>('Apartment', ApartmentSchema);

export default Apartment;
