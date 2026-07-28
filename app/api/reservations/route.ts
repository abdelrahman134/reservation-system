import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Reservation from '@/lib/models/Reservation';
import Revenue from '@/lib/models/Revenue';
import User from '@/lib/models/User';
import Apartment from '@/lib/models/Apartment';
import Broker from '@/lib/models/Broker';
import { reservationSchema } from '@/lib/validations';

function normalizeDate(d: Date): Date {
  const normalized = new Date(d);
  normalized.setUTCHours(12, 0, 0, 0);
  return normalized;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const apartment = searchParams.get('apartment');
    const user = searchParams.get('user');
    const status = searchParams.get('status');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const filter: any = { isActive: true };
    if (apartment) filter.apartment = apartment;
    if (user) filter.createdByStaff = user;
    if (status) filter.status = status;
    if (fromDate || toDate) {
      filter.startDate = {};
      if (fromDate) filter.startDate.$gte = new Date(fromDate);
      if (toDate) filter.startDate.$lte = new Date(toDate);
    }

    const reservations = await Reservation.find(filter)
      .populate('createdByStaff', 'name')
      .populate('apartment', 'name')
      .populate('broker', 'name defaultPercentage')
      .sort({ startDate: -1 });

    return NextResponse.json(reservations);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

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
      startDate: rawStart,
      endDate: rawEnd,
      pricePerDay,
      deposit,
      status,
    } = validation.data;

    // Timezone Midday UTC Normalization
    const startDate = normalizeDate(rawStart);
    const endDate = normalizeDate(rawEnd);

    // Calculate nights & totalValue
    const diffTime = endDate.getTime() - startDate.getTime();
    const nights = Math.max(1, Math.round(diffTime / (1000 * 3600 * 24)));
    const totalValue = pricePerDay * nights;

    // Calculate Commission Amounts
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

    // Check staff & apartment validity
    const staff = await User.findById(createdByStaff);
    if (!staff || !staff.isActive) {
      return NextResponse.json({ error: 'Selected Staff member is invalid' }, { status: 400 });
    }

    const targetApartment = await Apartment.findById(apartment);
    if (!targetApartment || !targetApartment.isActive) {
      return NextResponse.json({ error: 'Selected Apartment is invalid' }, { status: 400 });
    }

    // STRICT DATE OVERLAP CHECK
    const overlappingReservation = await Reservation.findOne({
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

    let session: mongoose.ClientSession | null = null;
    let newReservation;

    try {
      session = await mongoose.startSession();
      session.startTransaction();

      const [resDoc] = await Reservation.create(
        [
          {
            clientName,
            clientPhone,
            apartment,
            createdByStaff,
            broker: hasBroker ? broker : null,
            commissionPercentage: commPerc,
            brokerCommissionAmount,
            staffCommissionAmount,
            startDate,
            endDate,
            pricePerDay,
            deposit,
            totalValue,
            status: status || 'confirmed',
            isActive: true,
          },
        ],
        { session }
      );
      newReservation = resDoc;

      if (deposit > 0) {
        await Revenue.create(
          [
            {
              name: `Deposit — ${clientName}`,
              value: deposit,
              user: createdByStaff,
              source: 'deposit',
              reservation: newReservation._id,
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

      newReservation = await Reservation.create({
        clientName,
        clientPhone,
        apartment,
        createdByStaff,
        broker: hasBroker ? broker : null,
        commissionPercentage: commPerc,
        brokerCommissionAmount,
        staffCommissionAmount,
        startDate,
        endDate,
        pricePerDay,
        deposit,
        totalValue,
        status: status || 'confirmed',
        isActive: true,
      });

      if (deposit > 0) {
        await Revenue.create({
          name: `Deposit — ${clientName}`,
          value: deposit,
          user: createdByStaff,
          source: 'deposit',
          reservation: newReservation._id,
          isActive: true,
        });
      }
    }

    const populated = await newReservation.populate(['apartment', 'createdByStaff', 'broker']);
    return NextResponse.json(populated, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create reservation' },
      { status: 500 }
    );
  }
}
