import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Revenue from '@/lib/models/Revenue';
import Expense from '@/lib/models/Expense';
import Reservation from '@/lib/models/Reservation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staff');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const staffFilter: any = { isActive: true };
    if (staffId && staffId !== 'all') {
      staffFilter._id = staffId;
    }

    const staffList = await User.find(staffFilter).sort({ name: 1 }).lean();

    const dateQuery: any = {};
    if (fromDate || toDate) {
      dateQuery.createdAt = {};
      if (fromDate) dateQuery.createdAt.$gte = new Date(fromDate);
      if (toDate) dateQuery.createdAt.$lte = new Date(toDate);
    }

    const resDateQuery: any = {};
    if (fromDate || toDate) {
      resDateQuery.startDate = {};
      if (fromDate) resDateQuery.startDate.$gte = new Date(fromDate);
      if (toDate) resDateQuery.startDate.$lte = new Date(toDate);
    }

    const insights = await Promise.all(
      staffList.map(async (staff: any) => {
        const revQuery = { user: staff._id, isActive: true, ...dateQuery };
        const expQuery = { user: staff._id, isActive: true, ...dateQuery };
        const reservationQuery = {
          createdByStaff: staff._id,
          isActive: true,
          status: { $ne: 'cancelled' },
          ...resDateQuery,
        };

        const [revenues, expenses, reservations] = await Promise.all([
          Revenue.find(revQuery).populate('reservation').sort({ createdAt: -1 }).lean(),
          Expense.find(expQuery).populate('reservation').populate('broker').sort({ createdAt: -1 }).lean(),
          Reservation.find(reservationQuery).lean(),
        ]);

        const totalCashCollected = revenues.reduce((acc, r) => acc + (r.value || 0), 0);
        const totalCashPaidOut = expenses.reduce((acc, e) => acc + (e.value || 0), 0);
        
        // Since staff commission is deducted upfront when revenue is logged,
        // Net Owed to Company is simply Total Cash Collected minus Total Cash Paid Out.
        const netOwedToCompany = totalCashCollected - totalCashPaidOut;

        const staffCommissionEarned = reservations.reduce(
          (acc, r) => acc + (r.staffCommissionAmount || 0),
          0
        );
        const brokerCommissionsHandled = reservations.reduce(
          (acc, r) => acc + (r.brokerCommissionAmount || 0),
          0
        );

        return {
          staff: {
            _id: staff._id.toString(),
            name: staff.name,
          },
          totalCashCollected,
          totalCashPaidOut,
          currentCashInHand: netOwedToCompany,
          staffCommissionEarned,
          brokerCommissionsHandled,
          netOwedToCompany,
          revenues: revenues.map((r: any) => ({
            ...r,
            _id: r._id.toString(),
            user: r.user ? r.user.toString() : null,
          })),
          expenses: expenses.map((e: any) => ({
            ...e,
            _id: e._id.toString(),
            user: e.user ? e.user.toString() : null,
          })),
        };
      })
    );

    return NextResponse.json(insights);
  } catch (error: any) {
    console.error('Error in /api/insights:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch staff insights' },
      { status: 500 }
    );
  }
}
