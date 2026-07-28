import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Broker from '@/lib/models/Broker';
import Reservation from '@/lib/models/Reservation';
import Expense from '@/lib/models/Expense';
import { brokerSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const brokers = await Broker.find({ isActive: true }).sort({ name: 1 }).lean();

    const dateQuery: any = {};
    if (fromDate || toDate) {
      dateQuery.createdAt = {};
      if (fromDate) dateQuery.createdAt.$gte = new Date(fromDate);
      if (toDate) dateQuery.createdAt.$lte = new Date(toDate);
    }

    const aggregatedBrokers = await Promise.all(
      brokers.map(async (b: any) => {
        const resQuery = {
          broker: b._id,
          isActive: true,
          status: { $ne: 'cancelled' },
          ...dateQuery,
        };

        const expQuery = {
          broker: b._id,
          source: 'broker-payout',
          isActive: true,
          ...dateQuery,
        };

        const [reservations, payouts] = await Promise.all([
          Reservation.find(resQuery).lean(),
          Expense.find(expQuery).lean(),
        ]);

        const totalReservations = reservations.length;
        const totalCommissionEarned = reservations.reduce(
          (acc, r) => acc + (r.brokerCommissionAmount || 0),
          0
        );
        const totalPayouts = payouts.reduce((acc, p) => acc + (p.value || 0), 0);
        const outstandingBalance = totalCommissionEarned - totalPayouts;

        return {
          _id: b._id.toString(),
          name: b.name,
          defaultPercentage: b.defaultPercentage,
          totalReservations,
          totalCommissionEarned,
          totalPayouts,
          outstandingBalance,
          reservations: reservations.map((r: any) => ({
            _id: r._id.toString(),
            clientName: r.clientName,
            startDate: r.startDate,
            totalValue: r.totalValue,
            brokerCommissionAmount: r.brokerCommissionAmount,
          })),
        };
      })
    );

    return NextResponse.json(aggregatedBrokers);
  } catch (error: any) {
    console.error('Error in GET /api/brokers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch brokers' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const validation = brokerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const newBroker = await Broker.create({
      name: validation.data.name.trim(),
      defaultPercentage: validation.data.defaultPercentage,
      isActive: true,
    });

    return NextResponse.json(newBroker, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/brokers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create broker' },
      { status: 500 }
    );
  }
}
