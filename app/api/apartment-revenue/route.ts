import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Apartment from '@/lib/models/Apartment';
import Reservation from '@/lib/models/Reservation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const apartments = await Apartment.find({ isActive: true }).lean();

    const dateQuery: any = {};
    if (fromDate || toDate) {
      dateQuery.startDate = {};
      if (fromDate) dateQuery.startDate.$gte = new Date(fromDate);
      if (toDate) dateQuery.startDate.$lte = new Date(toDate);
    }

    const report = await Promise.all(
      apartments.map(async (apt) => {
        const reservations = await Reservation.find({
          apartment: apt._id,
          isActive: true,
          status: { $ne: 'cancelled' },
          ...dateQuery,
        }).lean();

        const totalRevenue = reservations.reduce((acc, r) => acc + (r.totalValue || 0), 0);

        return {
          _id: apt._id.toString(),
          name: apt.name,
          totalRevenue,
          reservationCount: reservations.length,
          reservations: reservations.map((r: any) => ({
            _id: r._id.toString(),
            clientName: r.clientName,
            totalValue: r.totalValue,
            startDate: r.startDate,
          })),
        };
      })
    );

    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch apartment revenue report' },
      { status: 500 }
    );
  }
}
