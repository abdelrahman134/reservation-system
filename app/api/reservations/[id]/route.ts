import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Reservation from '@/lib/models/Reservation';
import Revenue from '@/lib/models/Revenue';
import Expense from '@/lib/models/Expense';
import { reservationSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const body = await req.json();

    const existing = await Reservation.findById(params.id);
    if (!existing || !existing.isActive) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const validation = reservationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      clientName,
      clientPhone,
      apartment,
      createdByStaff,
      broker,
      commissionPercentage: rawCommPerc,
      startDate,
      endDate,
      pricePerDay,
      deposit,
      status,
    } = validation.data;

    if (status !== 'cancelled') {
      const overlappingReservation = await Reservation.findOne({
        _id: { $ne: params.id },
        apartment,
        isActive: true,
        status: { $ne: 'cancelled' },
        startDate: { $lt: endDate },
        endDate: { $gt: startDate },
      });

      if (overlappingReservation) {
        return NextResponse.json(
          { error: 'Apartment is already reserved for the selected date range.' },
          { status: 400 }
        );
      }
    }

    const diffTime = endDate.getTime() - startDate.getTime();
    const nights = Math.max(1, Math.round(diffTime / (1000 * 3600 * 24)));
    const totalValue = pricePerDay * nights;

    const hasBroker = !!broker && broker.trim() !== '' && broker !== 'none';
    const commPerc = rawCommPerc !== undefined ? rawCommPerc : (hasBroker ? 15 : 10);

    let brokerCommissionAmount = 0;
    let staffCommissionAmount = 0;

    if (hasBroker) {
      brokerCommissionAmount = (totalValue * commPerc) / 100;
      staffCommissionAmount = 0;
    } else {
      staffCommissionAmount = (totalValue * commPerc) / 100;
      brokerCommissionAmount = 0;
    }

    let session: mongoose.ClientSession | null = null;

    try {
      session = await mongoose.startSession();
      session.startTransaction();

      existing.clientName = clientName;
      existing.clientPhone = clientPhone;
      existing.apartment = apartment as any;
      existing.createdByStaff = createdByStaff as any;
      existing.broker = hasBroker ? (broker as any) : null;
      existing.commissionPercentage = commPerc;
      existing.brokerCommissionAmount = brokerCommissionAmount;
      existing.staffCommissionAmount = staffCommissionAmount;
      existing.startDate = startDate;
      existing.endDate = endDate;
      existing.pricePerDay = pricePerDay;
      existing.deposit = deposit;
      existing.totalValue = totalValue;
      if (status) existing.status = status;

      await existing.save({ session });

      await Revenue.findOneAndUpdate(
        { reservation: params.id, source: 'deposit' },
        { value: deposit, name: `Deposit — ${clientName}`, user: createdByStaff },
        { session }
      );

      await session.commitTransaction();
      session.endSession();
    } catch (txErr) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }

      existing.clientName = clientName;
      existing.clientPhone = clientPhone;
      existing.apartment = apartment as any;
      existing.createdByStaff = createdByStaff as any;
      existing.broker = hasBroker ? (broker as any) : null;
      existing.commissionPercentage = commPerc;
      existing.brokerCommissionAmount = brokerCommissionAmount;
      existing.staffCommissionAmount = staffCommissionAmount;
      existing.startDate = startDate;
      existing.endDate = endDate;
      existing.pricePerDay = pricePerDay;
      existing.deposit = deposit;
      existing.totalValue = totalValue;
      if (status) existing.status = status;

      await existing.save();

      await Revenue.findOneAndUpdate(
        { reservation: params.id, source: 'deposit' },
        { value: deposit, name: `Deposit — ${clientName}`, user: createdByStaff }
      );
    }

    revalidatePath('/reservations');
    revalidatePath('/calendar');
    revalidatePath('/insights');
    revalidatePath('/apartment-revenue');

    const populated = await existing.populate(['createdByStaff', 'apartment', 'broker']);
    return NextResponse.json(populated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update reservation' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  return PATCH(req, context);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    let session: mongoose.ClientSession | null = null;
    let reservation;

    try {
      session = await mongoose.startSession();
      session.startTransaction();

      reservation = await Reservation.findByIdAndUpdate(
        params.id,
        { isActive: false, status: 'cancelled' },
        { new: true, session }
      );

      if (!reservation) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
      }

      await Revenue.updateMany(
        { reservation: params.id },
        { isActive: false },
        { session }
      );

      await Expense.updateMany(
        { reservation: params.id },
        { isActive: false },
        { session }
      );

      await session.commitTransaction();
      session.endSession();
    } catch (txErr) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }

      reservation = await Reservation.findByIdAndUpdate(
        params.id,
        { isActive: false, status: 'cancelled' },
        { new: true }
      );

      await Revenue.updateMany({ reservation: params.id }, { isActive: false });
      await Expense.updateMany({ reservation: params.id }, { isActive: false });
    }

    revalidatePath('/reservations');
    revalidatePath('/calendar');
    revalidatePath('/insights');
    revalidatePath('/apartment-revenue');

    return NextResponse.json({
      message: 'Reservation and associated financial entries soft-deleted successfully',
      reservation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to cancel reservation' },
      { status: 500 }
    );
  }
}
