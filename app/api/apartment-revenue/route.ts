import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Apartment from '@/lib/models/Apartment';
import Reservation from '@/lib/models/Reservation';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const fromDateParam = searchParams.get('fromDate');
    const toDateParam = searchParams.get('toDate');

    const apartments = await Apartment.find({ isActive: true }).sort({ name: 1 });

    const apartmentRevenueData = await Promise.all(
      apartments.map(async (apt) => {
        const filter: any = {
          apartment: apt._id,
          isActive: true,
          status: { $ne: 'cancelled' },
        };

        if (fromDateParam || toDateParam) {
          filter.startDate = {};
          if (fromDateParam) filter.startDate.$gte = new Date(fromDateParam);
          if (toDateParam) filter.startDate.$lte = new Date(toDateParam);
        }

        const reservations = await Reservation.find(filter).populate('createdByStaff', 'name');

        const totalRevenue = reservations.reduce((acc, r) => acc + r.totalValue, 0);
        const reservationCount = reservations.length;

        return {
          _id: apt._id,
          name: apt.name,
          totalRevenue,
          reservationCount,
          reservations,
        };
      })
    );

    return NextResponse.json(apartmentRevenueData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch apartment revenue analytics' },
      { status: 500 }
    );
  }
}
