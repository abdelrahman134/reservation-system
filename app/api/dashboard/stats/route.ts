import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Apartment from '@/lib/models/Apartment';
import Reservation from '@/lib/models/Reservation';
import Revenue from '@/lib/models/Revenue';
import Expense from '@/lib/models/Expense';

export async function GET() {
  try {
    await dbConnect();

    const totalStaff = await User.countDocuments({ isActive: true });
    const totalApartments = await Apartment.countDocuments({ isActive: true });
    const totalReservations = await Reservation.countDocuments({
      isActive: true,
      status: { $ne: 'cancelled' },
    });

    // Total Cash Revenue
    const revenueAgg = await Revenue.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$value' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Total Cash Expenses
    const expenseAgg = await Expense.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$value' } } },
    ]);
    const totalExpenses = expenseAgg[0]?.total || 0;

    const netCash = totalRevenue - totalExpenses;

    // Recent 5 reservations
    const recentReservations = await Reservation.find({ isActive: true })
      .populate('createdByStaff', 'name')
      .populate('apartment', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    return NextResponse.json({
      totalStaff,
      totalApartments,
      totalReservations,
      totalRevenue,
      totalExpenses,
      netCash,
      recentReservations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
