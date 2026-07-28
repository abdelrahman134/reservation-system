import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Reservation from '@/lib/models/Reservation';
import Revenue from '@/lib/models/Revenue';
import User from '@/lib/models/User';
import Apartment from '@/lib/models/Apartment';
import { reservationSchema } from '@/lib/validations';

// Normalize date to UTC Midday (12:00:00.000Z) to prevent day-shifting across timezones
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

    const filter: any = { isActive: true };
    if (apartment) filter.apartment = apartment;
    if (user) filter.createdByStaff = user;
    if (status) filter.status = status;

    const reservations = await Reservation.find(filter)
      .populate('createdByStaff', 'name')
      .populate('apartment', 'name')
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

    // Attempt Mongoose Atomic Session Transaction
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

      // Auto-create Revenue entry for deposit if deposit > 0
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
      // Fallback non-transaction write if standalone Mongo (no replica set enabled)
      newReservation = await Reservation.create({
        clientName,
        clientPhone,
        apartment,
        createdByStaff,
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

    const populated = await newReservation.populate(['apartment', 'createdByStaff']);
    return NextResponse.json(populated, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create reservation' },
      { status: 500 }
    );
  }
}
