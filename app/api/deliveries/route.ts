import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Delivery from '@/lib/models/Delivery';
import Revenue from '@/lib/models/Revenue';
import Reservation from '@/lib/models/Reservation';
import { deliverySchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const reservationId = searchParams.get('reservation');

    const filter: any = { isActive: true };
    if (reservationId) filter.reservation = reservationId;

    if (reservationId) {
      const delivery = await Delivery.findOne(filter).populate(['staffUser', 'reservation']);
      return NextResponse.json(delivery || null);
    }

    const deliveries = await Delivery.find(filter).populate(['staffUser', 'reservation']).sort({ createdAt: -1 });
    return NextResponse.json(deliveries);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch delivery' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const validation = deliverySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { reservation, staffUser, insurance, totalValue, nationalIdPhotos } =
      validation.data;

    const reservationDoc = await Reservation.findById(reservation);
    if (!reservationDoc || !reservationDoc.isActive) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Upfront Commission Deduction Logic:
    // If staff commission applies, deduct it upfront from logged revenue value.
    // If broker commission applies, log full totalValue (broker is paid later via broker-payout expense).
    const staffComm = reservationDoc.staffCommissionAmount || 0;
    const netRevenueValue = staffComm > 0 ? Math.max(0, totalValue - staffComm) : totalValue;

    let session: mongoose.ClientSession | null = null;
    let deliveryDoc;

    const existingDelivery = await Delivery.findOne({ reservation, isActive: true });

    try {
      session = await mongoose.startSession();
      session.startTransaction();

      if (existingDelivery) {
        existingDelivery.staffUser = staffUser as any;
        existingDelivery.insurance = insurance;
        existingDelivery.totalValue = totalValue;
        existingDelivery.nationalIdPhotos = nationalIdPhotos;
        await existingDelivery.save({ session });
        deliveryDoc = existingDelivery;

        await Revenue.findOneAndUpdate(
          { reservation, source: 'delivery' },
          {
            value: netRevenueValue,
            user: staffUser,
            name: `Delivery — ${reservationDoc.clientName}`,
            isActive: true,
          },
          { session, upsert: true }
        );
      } else {
        const [delDoc] = await Delivery.create(
          [
            {
              reservation,
              staffUser,
              insurance,
              totalValue,
              nationalIdPhotos,
              isActive: true,
            },
          ],
          { session }
        );
        deliveryDoc = delDoc;

        await Revenue.create(
          [
            {
              name: `Delivery — ${reservationDoc.clientName}`,
              value: netRevenueValue,
              user: staffUser,
              source: 'delivery',
              reservation,
              isActive: true,
            },
          ],
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();
    } catch (txError) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }

      if (existingDelivery) {
        existingDelivery.staffUser = staffUser as any;
        existingDelivery.insurance = insurance;
        existingDelivery.totalValue = totalValue;
        existingDelivery.nationalIdPhotos = nationalIdPhotos;
        await existingDelivery.save();
        deliveryDoc = existingDelivery;

        await Revenue.findOneAndUpdate(
          { reservation, source: 'delivery' },
          {
            value: netRevenueValue,
            user: staffUser,
            name: `Delivery — ${reservationDoc.clientName}`,
            isActive: true,
          },
          { upsert: true }
        );
      } else {
        deliveryDoc = await Delivery.create({
          reservation,
          staffUser,
          insurance,
          totalValue,
          nationalIdPhotos,
          isActive: true,
        });

        await Revenue.create({
          name: `Delivery — ${reservationDoc.clientName}`,
          value: netRevenueValue,
          user: staffUser,
          source: 'delivery',
          reservation,
          isActive: true,
        });
      }
    }

    const populated = await deliveryDoc.populate(['staffUser', 'reservation']);
    return NextResponse.json(populated, { status: existingDelivery ? 200 : 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to record delivery' },
      { status: 500 }
    );
  }
}
