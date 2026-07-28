import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Receiver from '@/lib/models/Receiver';
import Expense from '@/lib/models/Expense';
import Reservation from '@/lib/models/Reservation';
import { receiverSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const reservationId = searchParams.get('reservation');

    const filter: any = { isActive: true };
    if (reservationId) filter.reservation = reservationId;

    if (reservationId) {
      const receiver = await Receiver.findOne(filter).populate(['staffUser', 'reservation']);
      return NextResponse.json(receiver || null);
    }

    const receivers = await Receiver.find(filter).populate(['staffUser', 'reservation']).sort({ createdAt: -1 });
    return NextResponse.json(receivers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch receiver returns' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const validation = receiverSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { reservation, staffUser, returnInsurance } = validation.data;

    const reservationDoc = await Reservation.findById(reservation);
    if (!reservationDoc || !reservationDoc.isActive) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    let session: mongoose.ClientSession | null = null;
    let receiverDoc;

    const existingReceiver = await Receiver.findOne({ reservation, isActive: true });

    try {
      session = await mongoose.startSession();
      session.startTransaction();

      if (existingReceiver) {
        existingReceiver.staffUser = staffUser as any;
        existingReceiver.returnInsurance = returnInsurance;
        await existingReceiver.save({ session });
        receiverDoc = existingReceiver;

        await Expense.findOneAndUpdate(
          { reservation, source: 'receiver-return' },
          {
            value: returnInsurance,
            user: staffUser,
            name: `Returned Insurance — ${reservationDoc.clientName}`,
            isActive: true,
          },
          { session, upsert: true }
        );
      } else {
        const [recDoc] = await Receiver.create(
          [
            {
              reservation,
              staffUser,
              returnInsurance,
              isActive: true,
            },
          ],
          { session }
        );
        receiverDoc = recDoc;

        if (returnInsurance > 0) {
          await Expense.create(
            [
              {
                name: `Returned Insurance — ${reservationDoc.clientName}`,
                value: returnInsurance,
                user: staffUser,
                source: 'receiver-return',
                reservation,
                isActive: true,
              },
            ],
            { session }
          );
        }
      }

      await session.commitTransaction();
      session.endSession();
    } catch (txError) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }

      if (existingReceiver) {
        existingReceiver.staffUser = staffUser as any;
        existingReceiver.returnInsurance = returnInsurance;
        await existingReceiver.save();
        receiverDoc = existingReceiver;

        await Expense.findOneAndUpdate(
          { reservation, source: 'receiver-return' },
          {
            value: returnInsurance,
            user: staffUser,
            name: `Returned Insurance — ${reservationDoc.clientName}`,
            isActive: true,
          },
          { upsert: true }
        );
      } else {
        receiverDoc = await Receiver.create({
          reservation,
          staffUser,
          returnInsurance,
          isActive: true,
        });

        if (returnInsurance > 0) {
          await Expense.create({
            name: `Returned Insurance — ${reservationDoc.clientName}`,
            value: returnInsurance,
            user: staffUser,
            source: 'receiver-return',
            reservation,
            isActive: true,
          });
        }
      }
    }

    revalidatePath('/reservations');
    revalidatePath('/calendar');
    revalidatePath('/insights');
    revalidatePath('/expenses');

    const populated = await receiverDoc.populate(['staffUser', 'reservation']);
    return NextResponse.json(populated, { status: existingReceiver ? 200 : 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to record key return' },
      { status: 500 }
    );
  }
}
